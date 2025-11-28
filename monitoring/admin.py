"""
Django Admin Configuration
Customize admin interface for better management
"""

from django.contrib import admin
from .models import Device, EnergyReading, Alert


@admin.register(Device)
class DeviceAdmin(admin.ModelAdmin):
    """Admin interface for Device model"""
    list_display = ['name', 'user', 'location', 'is_active', 'last_seen', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'user__username', 'api_key', 'location']
    readonly_fields = ['api_key', 'created_at', 'last_seen']
    ordering = ['-created_at']
    
    fieldsets = (
        ('Device Information', {
            'fields': ('user', 'name', 'location', 'is_active')
        }),
        ('API Configuration', {
            'fields': ('api_key',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'last_seen'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EnergyReading)
class EnergyReadingAdmin(admin.ModelAdmin):
    """Admin interface for EnergyReading model"""
    list_display = ['device', 'voltage', 'current', 'power', 'energy', 'frequency', 'power_factor', 'timestamp']
    list_filter = ['device', 'timestamp']
    search_fields = ['device__name']
    readonly_fields = ['timestamp']
    ordering = ['-timestamp']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('Device', {
            'fields': ('device',)
        }),
        ('Electrical Parameters', {
            'fields': ('voltage', 'current', 'power', 'energy', 'frequency', 'power_factor')
        }),
        ('Timestamp', {
            'fields': ('timestamp',)
        }),
    )
    
    def has_add_permission(self, request):
        """Disable manual addition of readings"""
        return False


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    """Admin interface for Alert model"""
    list_display = ['device', 'alert_type', 'message', 'value', 'is_resolved', 'created_at']
    list_filter = ['alert_type', 'is_resolved', 'created_at']
    search_fields = ['device__name', 'message']
    readonly_fields = ['created_at', 'resolved_at']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    actions = ['mark_as_resolved']
    
    def mark_as_resolved(self, request, queryset):
        """Mark selected alerts as resolved"""
        from django.utils import timezone
        queryset.update(is_resolved=True, resolved_at=timezone.now())
        self.message_user(request, f'{queryset.count()} alerts marked as resolved.')
    mark_as_resolved.short_description = 'Mark selected alerts as resolved'


# Customize admin site header
admin.site.site_header = "Energy Monitor Administration"
admin.site.site_title = "Energy Monitor Admin"
admin.site.index_title = "Welcome to Energy Monitor Admin Portal"