"""
Django Views
Handles API endpoints and web pages
"""

from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.db.models import Avg, Sum
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from datetime import datetime, timedelta
import json

from .models import Device, EnergyReading, Alert
from .serializers import (
    DeviceSerializer, EnergyReadingSerializer, EnergyReadingCreateSerializer,
    AlertSerializer, UserSerializer, UserRegistrationSerializer,
    DailyConsumptionSerializer, HourlyConsumptionSerializer, StatisticsSerializer
)
from .middleware import APIKeyAuthentication


# ===== Web Views =====

def index(request):
    """Home page - redirects to dashboard if logged in"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    return redirect('login')


def login_view(request):
    """Login page"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, f'Welcome back, {user.username}!')
            return redirect('dashboard')
        else:
            messages.error(request, 'Invalid username or password')
    
    return render(request, 'login.html')


def register_view(request):
    """Registration page"""
    if request.user.is_authenticated:
        return redirect('dashboard')
    
    if request.method == 'POST':
        serializer = UserRegistrationSerializer(data=request.POST)
        if serializer.is_valid():
            user = serializer.save()
            # Create default device for new user
            import secrets
            Device.objects.create(
                user=user,
                name="My Device",
                api_key=secrets.token_urlsafe(32)
            )
            messages.success(request, 'Registration successful! Please log in.')
            return redirect('login')
        else:
            for field, errors in serializer.errors.items():
                for error in errors:
                    messages.error(request, f'{field}: {error}')
    
    return render(request, 'register.html')


def logout_view(request):
    """Logout user"""
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('login')


@login_required
def dashboard(request):
    """Main dashboard page"""
    devices = Device.objects.filter(user=request.user)
    
    context = {
        'devices': devices,
        'total_devices': devices.count(),
    }
    
    # Get latest reading for first device
    if devices.exists():
        device = devices.first()
        latest_reading = EnergyReading.get_latest_reading(device)
        today_consumption = EnergyReading.get_daily_consumption(device)
        
        context.update({
            'selected_device': device,
            'latest_reading': latest_reading,
            'today_consumption': today_consumption,
        })
    
    return render(request, 'dashboard.html', context)


# ===== API Views =====

@csrf_exempt
@api_view(['POST'])
def energy_data_receive(request):
    """
    Endpoint for ESP8266 to send energy data
    Requires API key authentication via X-API-Key header
    """
    api_key = request.headers.get('X-API-Key')
    
    if not api_key:
        return Response(
            {'error': 'API key is required'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        device = Device.objects.get(api_key=api_key, is_active=True)
    except Device.DoesNotExist:
        return Response(
            {'error': 'Invalid API key'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Validate and save data
    serializer = EnergyReadingCreateSerializer(
        data=request.data,
        context={'device': device}
    )
    
    if serializer.is_valid():
        reading = serializer.save()
        device.update_last_seen()
        
        # Check for alerts
        check_and_create_alerts(device, reading)
        
        return Response(
            {
                'status': 'success',
                'message': 'Data received successfully',
                'reading_id': reading.id
            },
            status=status.HTTP_201_CREATED
        )
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def check_and_create_alerts(device, reading):
    """Check for abnormal conditions and create alerts"""
    # High power consumption (> 5000W)
    if reading.power > 5000:
        Alert.objects.create(
            device=device,
            alert_type='HIGH_POWER',
            message=f'High power consumption detected: {reading.power:.2f}W',
            value=reading.power
        )
    
    # Low voltage (< 200V)
    if reading.voltage < 200:
        Alert.objects.create(
            device=device,
            alert_type='LOW_VOLTAGE',
            message=f'Low voltage detected: {reading.voltage:.2f}V',
            value=reading.voltage
        )
    
    # High voltage (> 250V)
    if reading.voltage > 250:
        Alert.objects.create(
            device=device,
            alert_type='HIGH_VOLTAGE',
            message=f'High voltage detected: {reading.voltage:.2f}V',
            value=reading.voltage
        )
    
    # Low power factor (< 0.5)
    if reading.power_factor < 0.5:
        Alert.objects.create(
            device=device,
            alert_type='LOW_PF',
            message=f'Low power factor detected: {reading.power_factor:.2f}',
            value=reading.power_factor
        )


@api_view(['GET'])
@login_required
def api_dashboard_data(request, device_id):
    """Get dashboard data for a specific device"""
    try:
        device = Device.objects.get(id=device_id, user=request.user)
    except Device.DoesNotExist:
        return Response(
            {'error': 'Device not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get latest reading
    latest_reading = EnergyReading.get_latest_reading(device)
    
    # Get today's consumption
    today_consumption = EnergyReading.get_daily_consumption(device)
    
    # Get hourly consumption for today
    hourly_consumption = EnergyReading.get_hourly_consumption(device)
    
    # Get weekly consumption
    weekly_data = []
    for i in range(7):
        date = timezone.now().date() - timedelta(days=i)
        consumption = EnergyReading.get_daily_consumption(device, date)
        weekly_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'day': date.strftime('%a'),
            'consumption': consumption
        })
    weekly_data.reverse()
    
    # Get recent alerts
    alerts = Alert.objects.filter(device=device, is_resolved=False)[:5]
    
    return Response({
        'device': DeviceSerializer(device).data,
        'latest_reading': EnergyReadingSerializer(latest_reading).data if latest_reading else None,
        'today_consumption': today_consumption,
        'hourly_consumption': hourly_consumption,
        'weekly_consumption': weekly_data,
        'alerts': AlertSerializer(alerts, many=True).data
    })


@api_view(['GET'])
@login_required
def api_realtime_data(request, device_id):
    """Get real-time data for a device"""
    try:
        device = Device.objects.get(id=device_id, user=request.user)
    except Device.DoesNotExist:
        return Response(
            {'error': 'Device not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    latest_reading = EnergyReading.get_latest_reading(device)
    
    if not latest_reading:
        return Response(
            {'error': 'No data available'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    return Response(EnergyReadingSerializer(latest_reading).data)


@api_view(['GET'])
@login_required
def api_historical_data(request, device_id):
    """Get historical data with optional date filtering"""
    try:
        device = Device.objects.get(id=device_id, user=request.user)
    except Device.DoesNotExist:
        return Response(
            {'error': 'Device not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Get query parameters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    period = request.GET.get('period', 'day')  # day, week, month
    
    # Parse dates
    try:
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get statistics
    stats = EnergyReading.get_statistics(device, start_date, end_date)
    
    # Get consumption data based on period
    if period == 'day':
        consumption_data = EnergyReading.get_hourly_consumption(device, start_date or timezone.now().date())
    elif period == 'month':
        year = start_date.year if start_date else timezone.now().year
        month = start_date.month if start_date else timezone.now().month
        consumption_data = EnergyReading.get_monthly_consumption(device, year, month)
    else:  # week
        consumption_data = []
        base_date = start_date or timezone.now().date()
        for i in range(7):
            date = base_date - timedelta(days=6-i)
            consumption = EnergyReading.get_daily_consumption(device, date)
            consumption_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'consumption': consumption
            })
    
    return Response({
        'statistics': stats,
        'consumption_data': consumption_data
    })


@api_view(['GET'])
@login_required
def api_devices(request):
    """Get all devices for the current user"""
    devices = Device.objects.filter(user=request.user)
    serializer = DeviceSerializer(devices, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@login_required
def api_create_device(request):
    """Create a new device"""
    import secrets
    
    data = request.data.copy()
    data['api_key'] = secrets.token_urlsafe(32)
    
    serializer = DeviceSerializer(data=data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)