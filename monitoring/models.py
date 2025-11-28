"""
Energy Monitoring Models
Stores all sensor readings and user data
"""

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Sum, Avg
from datetime import datetime, timedelta


class Device(models.Model):
    """
    Represents an ESP8266 device
    Each user can have multiple devices
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=100, default="My Device")
    api_key = models.CharField(max_length=100, unique=True)
    location = models.CharField(max_length=200, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.user.username}"

    def update_last_seen(self):
        """Update the last seen timestamp"""
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])

    class Meta:
        ordering = ['-created_at']


class EnergyReading(models.Model):
    """
    Stores individual energy readings from the PZEM-004T sensor
    Each reading contains voltage, current, power, energy, frequency, and power factor
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='readings')
    
    # Electrical parameters
    voltage = models.FloatField(help_text="Voltage in Volts (V)")
    current = models.FloatField(help_text="Current in Amperes (A)")
    power = models.FloatField(help_text="Power in Watts (W)")
    energy = models.FloatField(help_text="Cumulative energy in kWh")
    frequency = models.FloatField(help_text="Frequency in Hertz (Hz)")
    power_factor = models.FloatField(help_text="Power Factor (0-1)")
    
    # Timestamp
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device', '-timestamp']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.device.name} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

    @staticmethod
    def get_daily_consumption(device, date=None):
        """
        Calculate daily energy consumption in kWh
        Returns the difference between max and min energy readings for the day
        """
        if date is None:
            date = timezone.now().date()
        
        start_of_day = timezone.make_aware(datetime.combine(date, datetime.min.time()))
        end_of_day = timezone.make_aware(datetime.combine(date, datetime.max.time()))
        
        readings = EnergyReading.objects.filter(
            device=device,
            timestamp__range=(start_of_day, end_of_day)
        ).order_by('timestamp')
        
        if readings.exists():
            first_reading = readings.first().energy
            last_reading = readings.last().energy
            return max(0, last_reading - first_reading)
        return 0

    @staticmethod
    def get_hourly_consumption(device, date=None):
        """
        Get hourly consumption breakdown for a specific day
        Returns list of dicts with hour and consumption
        """
        if date is None:
            date = timezone.now().date()
        
        hourly_data = []
        for hour in range(24):
            start_time = timezone.make_aware(datetime.combine(date, datetime.min.time()) + timedelta(hours=hour))
            end_time = start_time + timedelta(hours=1)
            
            readings = EnergyReading.objects.filter(
                device=device,
                timestamp__range=(start_time, end_time)
            ).order_by('timestamp')
            
            if readings.exists():
                consumption = readings.last().energy - readings.first().energy
                hourly_data.append({
                    'hour': hour,
                    'consumption': max(0, consumption)
                })
            else:
                hourly_data.append({
                    'hour': hour,
                    'consumption': 0
                })
        
        return hourly_data

    @staticmethod
    def get_monthly_consumption(device, year=None, month=None):
        """
        Get daily consumption for each day in a month
        """
        if year is None or month is None:
            now = timezone.now()
            year = now.year
            month = now.month
        
        from calendar import monthrange
        num_days = monthrange(year, month)[1]
        
        monthly_data = []
        for day in range(1, num_days + 1):
            date = datetime(year, month, day).date()
            consumption = EnergyReading.get_daily_consumption(device, date)
            monthly_data.append({
                'day': day,
                'date': date.strftime('%Y-%m-%d'),
                'consumption': consumption
            })
        
        return monthly_data

    @staticmethod
    def get_latest_reading(device):
        """Get the most recent reading for a device"""
        return EnergyReading.objects.filter(device=device).first()

    @staticmethod
    def get_statistics(device, start_date=None, end_date=None):
        """
        Calculate statistics for a date range
        """
        queryset = EnergyReading.objects.filter(device=device)
        
        if start_date:
            start_datetime = timezone.make_aware(datetime.combine(start_date, datetime.min.time()))
            queryset = queryset.filter(timestamp__gte=start_datetime)
        
        if end_date:
            end_datetime = timezone.make_aware(datetime.combine(end_date, datetime.max.time()))
            queryset = queryset.filter(timestamp__lte=end_datetime)
        
        if not queryset.exists():
            return None
        
        stats = queryset.aggregate(
            avg_voltage=Avg('voltage'),
            avg_current=Avg('current'),
            avg_power=Avg('power'),
            avg_frequency=Avg('frequency'),
            avg_pf=Avg('power_factor'),
            max_power=models.Max('power'),
            min_power=models.Min('power')
        )
        
        # Calculate total consumption
        first_reading = queryset.order_by('timestamp').first()
        last_reading = queryset.order_by('timestamp').last()
        total_consumption = last_reading.energy - first_reading.energy if first_reading and last_reading else 0
        
        stats['total_consumption'] = max(0, total_consumption)
        
        return stats


class Alert(models.Model):
    """
    Store alerts for abnormal conditions
    """
    ALERT_TYPES = [
        ('HIGH_POWER', 'High Power Consumption'),
        ('LOW_VOLTAGE', 'Low Voltage'),
        ('HIGH_VOLTAGE', 'High Voltage'),
        ('LOW_PF', 'Low Power Factor'),
        ('DEVICE_OFFLINE', 'Device Offline'),
    ]
    
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES)
    message = models.TextField()
    value = models.FloatField(null=True, blank=True)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.device.name} - {self.get_alert_type_display()}"

    def resolve(self):
        """Mark alert as resolved"""
        self.is_resolved = True
        self.resolved_at = timezone.now()
        self.save()