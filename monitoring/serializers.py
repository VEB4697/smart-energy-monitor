"""
Django REST Framework Serializers
Converts Django models to JSON and validates incoming data
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Device, EnergyReading, Alert


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']

    def validate(self, data):
        """Validate that passwords match"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        """Create new user with hashed password"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for Device model"""
    user_username = serializers.CharField(source='user.username', read_only=True)
    is_online = serializers.SerializerMethodField()
    latest_reading = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = [
            'id', 'name', 'api_key', 'location', 'is_active',
            'created_at', 'last_seen', 'user_username', 'is_online',
            'latest_reading'
        ]
        read_only_fields = ['id', 'api_key', 'created_at', 'last_seen']

    def get_is_online(self, obj):
        """Check if device has sent data in the last 2 minutes"""
        if not obj.last_seen:
            return False
        from django.utils import timezone
        from datetime import timedelta
        time_threshold = timezone.now() - timedelta(minutes=2)
        return obj.last_seen >= time_threshold

    def get_latest_reading(self, obj):
        """Get the most recent energy reading"""
        latest = EnergyReading.get_latest_reading(obj)
        if latest:
            return {
                'voltage': latest.voltage,
                'current': latest.current,
                'power': latest.power,
                'energy': latest.energy,
                'frequency': latest.frequency,
                'power_factor': latest.power_factor,
                'timestamp': latest.timestamp
            }
        return None


class EnergyReadingSerializer(serializers.ModelSerializer):
    """Serializer for EnergyReading model"""
    device_name = serializers.CharField(source='device.name', read_only=True)

    class Meta:
        model = EnergyReading
        fields = [
            'id', 'device', 'device_name', 'voltage', 'current',
            'power', 'energy', 'frequency', 'power_factor', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']

    def validate_voltage(self, value):
        """Validate voltage is within reasonable range"""
        if value < 0 or value > 500:
            raise serializers.ValidationError("Voltage must be between 0 and 500V")
        return value

    def validate_current(self, value):
        """Validate current is within reasonable range"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Current must be between 0 and 100A")
        return value

    def validate_power(self, value):
        """Validate power is positive"""
        if value < 0:
            raise serializers.ValidationError("Power cannot be negative")
        return value

    def validate_frequency(self, value):
        """Validate frequency is within reasonable range"""
        if value < 45 or value > 65:
            raise serializers.ValidationError("Frequency must be between 45 and 65Hz")
        return value

    def validate_power_factor(self, value):
        """Validate power factor is between 0 and 1"""
        if value < 0 or value > 1:
            raise serializers.ValidationError("Power factor must be between 0 and 1")
        return value


class EnergyReadingCreateSerializer(serializers.Serializer):
    """Serializer for creating energy readings from ESP8266"""
    voltage = serializers.FloatField(min_value=0, max_value=500)
    current = serializers.FloatField(min_value=0, max_value=100)
    power = serializers.FloatField(min_value=0)
    energy = serializers.FloatField(min_value=0)
    frequency = serializers.FloatField(min_value=45, max_value=65)
    power_factor = serializers.FloatField(min_value=0, max_value=1)

    def create(self, validated_data):
        """Create energy reading with device from context"""
        device = self.context['device']
        return EnergyReading.objects.create(device=device, **validated_data)


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for Alert model"""
    device_name = serializers.CharField(source='device.name', read_only=True)
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)

    class Meta:
        model = Alert
        fields = [
            'id', 'device', 'device_name', 'alert_type', 'alert_type_display',
            'message', 'value', 'is_resolved', 'created_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'created_at']


class DailyConsumptionSerializer(serializers.Serializer):
    """Serializer for daily consumption data"""
    date = serializers.DateField()
    consumption = serializers.FloatField()


class HourlyConsumptionSerializer(serializers.Serializer):
    """Serializer for hourly consumption data"""
    hour = serializers.IntegerField()
    consumption = serializers.FloatField()


class StatisticsSerializer(serializers.Serializer):
    """Serializer for energy statistics"""
    avg_voltage = serializers.FloatField()
    avg_current = serializers.FloatField()
    avg_power = serializers.FloatField()
    avg_frequency = serializers.FloatField()
    avg_pf = serializers.FloatField()
    max_power = serializers.FloatField()
    min_power = serializers.FloatField()
    total_consumption = serializers.FloatField()