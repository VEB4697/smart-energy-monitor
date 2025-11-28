"""
URL Configuration for monitoring app
"""

from django.urls import path
from . import views

urlpatterns = [
    # Web Pages
    path('', views.index, name='index'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard, name='dashboard'),
    
    # API Endpoints for ESP8266
    path('api/energy-data/', views.energy_data_receive, name='energy_data_receive'),
    
    # API Endpoints for Web Dashboard
    path('api/devices/', views.api_devices, name='api_devices'),
    path('api/devices/create/', views.api_create_device, name='api_create_device'),
    path('api/dashboard/<int:device_id>/', views.api_dashboard_data, name='api_dashboard_data'),
    path('api/realtime/<int:device_id>/', views.api_realtime_data, name='api_realtime_data'),
    path('api/historical/<int:device_id>/', views.api_historical_data, name='api_historical_data'),
]