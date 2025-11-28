# System Architecture & Working Principle

## Table of Contents
1. [System Overview](#system-overview)
2. [Hardware Architecture](#hardware-architecture)
3. [Software Architecture](#software-architecture)
4. [Data Flow](#data-flow)
5. [Communication Protocol](#communication-protocol)
6. [Database Design](#database-design)
7. [Security Implementation](#security-implementation)
8. [Real-time Updates](#real-time-updates)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ENERGY MONITORING SYSTEM                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Hardware   │ ───▶ │   Backend    │ ───▶ │   Frontend   │
│   Layer      │      │   Layer      │      │   Layer      │
└──────────────┘      └──────────────┘      └──────────────┘
     │                      │                      │
     │                      │                      │
     ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ ESP8266      │      │ Django API   │      │ Web Browser  │
│ PZEM-004T    │      │ Database     │      │ Dashboard    │
│ OLED Display │      │ REST API     │      │ Charts       │
└──────────────┘      └──────────────┘      └──────────────┘
```

---

## Hardware Architecture

### Component Breakdown

#### 1. ESP8266 NodeMCU
**Function**: Microcontroller with WiFi
- **Role**: Data collector and transmitter
- **Clock Speed**: 80/160 MHz
- **RAM**: 80KB user available
- **WiFi**: 802.11 b/g/n
- **GPIO Pins**: 17 (11 usable)

**Tasks**:
- Read data from PZEM-004T every 100ms
- Display data on OLED every 2 seconds (rotating)
- Send data to server every 10 seconds via HTTP POST
- Handle WiFi connection and reconnection
- Error handling and retry logic

#### 2. PZEM-004T Energy Sensor
**Function**: AC power measurement
- **Voltage Range**: 80-260V AC
- **Current Range**: 0-100A
- **Power Range**: 0-23kW
- **Frequency**: 45-65Hz
- **Communication**: UART (Serial)
- **Baud Rate**: 9600

**Measurements**:
- Voltage (V)
- Current (A)
- Active Power (W)
- Energy (kWh) - cumulative
- Frequency (Hz)
- Power Factor (0-1)

#### 3. OLED Display (SSD1306)
**Function**: Local data visualization
- **Size**: 0.96 inches
- **Resolution**: 128x64 pixels
- **Interface**: I2C
- **Address**: 0x3C (default)
- **Colors**: Monochrome (white/blue)

**Display Cycle** (2 seconds each):
1. Voltage display
2. Current display
3. Power display
4. Energy display
5. Frequency display
6. Power Factor display

### Hardware Connection Flow

```
AC Mains (220V)
    │
    ▼
┌─────────────┐
│ PZEM-004T   │ ◄─── Measures electrical parameters
│ (Sensor)    │
└─────────────┘
    │ UART
    │ (TX/RX)
    ▼
┌─────────────┐
│  ESP8266    │ ◄─── Processes & transmits data
│ (Controller)│
└─────────────┘
    │ I2C
    │ (SDA/SCL)
    ▼
┌─────────────┐
│ OLED Display│ ◄─── Shows local readings
└─────────────┘
```

### Power Supply

```
┌──────────┐
│ USB      │ ──▶ 5V ──▶ ESP8266 (converts to 3.3V internally)
│ 5V/1A    │           │
└──────────┘           ├──▶ 5V ──▶ PZEM-004T
                       └──▶ 3.3V ──▶ OLED Display
```

---

## Software Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  HTML/CSS  │  │TailwindCSS │  │ JavaScript │       │
│  │            │  │            │  │  Chart.js  │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │   Django   │  │    REST    │  │   Views    │       │
│  │   Models   │  │    API     │  │ Templates  │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  SQLite    │  │  Models    │  │   ORM      │       │
│  │  Database  │  │  (Schema)  │  │  Queries   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Backend Components

#### Django Framework
```
Django Project (energy_monitor)
    │
    ├── settings.py      # Configuration
    ├── urls.py          # URL routing
    └── wsgi.py          # WSGI server
    │
    └── monitoring (App)
        ├── models.py         # Data models
        ├── views.py          # Request handlers
        ├── serializers.py    # JSON conversion
        ├── urls.py           # App URLs
        └── admin.py          # Admin interface
```

#### Key Components Function

1. **Models** (models.py):
   - Define database schema
   - Implement business logic
   - Provide data methods

2. **Views** (views.py):
   - Handle HTTP requests
   - Process data
   - Return responses

3. **Serializers** (serializers.py):
   - Convert models to JSON
   - Validate incoming data
   - Transform API responses

4. **URLs** (urls.py):
   - Route requests to views
   - Define API endpoints
   - URL patterns

---

## Data Flow

### Complete Data Journey

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Data Collection (Hardware)                          │
└─────────────────────────────────────────────────────────────┘
                         │
    AC Mains ──▶ PZEM-004T ──▶ ESP8266
                 (measures)    (reads via UART)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Local Display                                       │
└─────────────────────────────────────────────────────────────┘
                         │
         ESP8266 ──▶ OLED Display
         (I2C)       (shows data)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 3: Data Transmission                                   │
└─────────────────────────────────────────────────────────────┘
                         │
         ESP8266 ──WiFi──▶ Internet
         (HTTP POST)
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 4: Backend Processing                                  │
└─────────────────────────────────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
    ▼                    ▼                    ▼
Validate            Store in             Check for
API Key            Database              Alerts
    │                    │                    │
    └────────────────────┼────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Step 5: Frontend Display                                    │
└─────────────────────────────────────────────────────────────┘
                         │
    User Browser ──▶ Request Data ──▶ Django API
                         │
                         ▼
              Generate Charts & Display
```

### Detailed Data Flow

#### 1. Hardware Data Collection (Every 100ms)
```cpp
void readSensorData() {
    voltage = pzem.voltage();        // Read from PZEM
    current = pzem.current();
    power = pzem.power();
    energy = pzem.energy();
    frequency = pzem.frequency();
    pf = pzem.pf();
    
    // Handle NaN values
    if (isnan(voltage)) voltage = 0.0;
    // ... similar for other values
}
```

#### 2. Local Display Update (Every 2 seconds)
```cpp
void updateDisplay() {
    switch(displayPage) {
        case 0: display.println("VOLTAGE"); 
                display.print(voltage); break;
        case 1: display.println("CURRENT"); 
                display.print(current); break;
        // ... other cases
    }
    displayPage = (displayPage + 1) % 6;
}
```

#### 3. Data Transmission (Every 10 seconds)
```cpp
void sendDataToServer() {
    // Create JSON payload
    String json = "{";
    json += "\"voltage\":" + String(voltage);
    json += ",\"current\":" + String(current);
    // ... other fields
    json += "}";
    
    // Send HTTP POST
    http.POST(json);
}
```

#### 4. Backend Processing
```python
def energy_data_receive(request):
    # 1. Authenticate
    device = Device.objects.get(api_key=request.headers['X-API-Key'])
    
    # 2. Validate data
    serializer = EnergyReadingCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    # 3. Save to database
    reading = serializer.save()
    
    # 4. Check for alerts
    check_and_create_alerts(device, reading)
    
    # 5. Update device last seen
    device.update_last_seen()
    
    return Response({'status': 'success'})
```

#### 5. Frontend Display
```javascript
async function fetchDashboardData() {
    // 1. Request data from API
    const response = await fetch(`/api/dashboard/${deviceId}/`);
    const data = await response.json();
    
    // 2. Update UI elements
    document.getElementById('voltageValue').textContent = data.voltage;
    // ... update other values
    
    // 3. Update charts
    updateHourlyChart(data.hourly_consumption);
    updateWeeklyChart(data.weekly_consumption);
}

// Auto-refresh every 5 seconds
setInterval(fetchDashboardData, 5000);
```

---

## Communication Protocol

### HTTP REST API

#### Request Format (ESP8266 to Server)
```http
POST /api/energy-data/ HTTP/1.1
Host: 192.168.1.100:8000
Content-Type: application/json
X-API-Key: your-api-key-here

{
    "voltage": 230.5,
    "current": 2.345,
    "power": 540.67,
    "energy": 12.456,
    "frequency": 50.0,
    "power_factor": 0.98
}
```

#### Response Format
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
    "status": "success",
    "message": "Data received successfully",
    "reading_id": 12345
}
```

### API Authentication

#### ESP8266 Authentication
- Method: API Key in HTTP header
- Header: `X-API-Key: <api_key>`
- Verification: Django checks Device model

#### Web Dashboard Authentication
- Method: Django session authentication
- Login required for all dashboard endpoints
- CSRF protection enabled

---

## Database Design

### Entity Relationship Diagram

```
┌──────────────┐         ┌──────────────┐
│     User     │1      n │    Device    │
│──────────────│◄────────│──────────────│
│ id           │         │ id           │
│ username     │         │ user_id (FK) │
│ password     │         │ name         │
│ email        │         │ api_key      │
└──────────────┘         │ location     │
                         │ is_active    │
                         │ last_seen    │
                         └──────────────┘
                                │1
                                │
                                │n
                         ┌──────────────┐
                         │EnergyReading │
                         │──────────────│
                         │ id           │
                         │ device_id(FK)│
                         │ voltage      │
                         │ current      │
                         │ power        │
                         │ energy       │
                         │ frequency    │
                         │ power_factor │
                         │ timestamp    │
                         └──────────────┘
                                │1
                                │
                                │n
                         ┌──────────────┐
                         │    Alert     │
                         │──────────────│
                         │ id           │
                         │ device_id(FK)│
                         │ alert_type   │
                         │ message      │
                         │ value        │
                         │ is_resolved  │
                         │ created_at   │
                         └──────────────┘
```

### Database Tables

#### User Table (Django Default)
```sql
CREATE TABLE auth_user (
    id INTEGER PRIMARY KEY,
    username VARCHAR(150) UNIQUE,
    password VARCHAR(128),
    email VARCHAR(254),
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    is_active BOOLEAN,
    date_joined DATETIME
);
```

#### Device Table
```sql
CREATE TABLE monitoring_device (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES auth_user(id),
    name VARCHAR(100),
    api_key VARCHAR(100) UNIQUE,
    location VARCHAR(200),
    is_active BOOLEAN,
    created_at DATETIME,
    last_seen DATETIME
);
```

#### EnergyReading Table
```sql
CREATE TABLE monitoring_energyreading (
    id INTEGER PRIMARY KEY,
    device_id INTEGER REFERENCES monitoring_device(id),
    voltage FLOAT,
    current FLOAT,
    power FLOAT,
    energy FLOAT,
    frequency FLOAT,
    power_factor FLOAT,
    timestamp DATETIME
);

CREATE INDEX idx_device_timestamp 
ON monitoring_energyreading(device_id, timestamp DESC);
```

#### Alert Table
```sql
CREATE TABLE monitoring_alert (
    id INTEGER PRIMARY KEY,
    device_id INTEGER REFERENCES monitoring_device(id),
    alert_type VARCHAR(20),
    message TEXT,
    value FLOAT,
    is_resolved BOOLEAN,
    created_at DATETIME,
    resolved_at DATETIME
);
```

---

## Security Implementation

### 1. API Security

#### ESP8266 API Key Authentication
```python
api_key = request.headers.get('X-API-Key')
device = Device.objects.get(api_key=api_key, is_active=True)
```

Benefits:
- Simple to implement
- No complex OAuth needed
- Device-specific access control

### 2. Web Security

#### Django Authentication System
- Session-based authentication
- CSRF protection
- Password hashing (PBKDF2)
- Login required decorators

#### Password Requirements
```python
AUTH_PASSWORD_VALIDATORS = [
    UserAttributeSimilarityValidator,
    MinimumLengthValidator,      # Min 8 characters
    CommonPasswordValidator,      # Check common passwords
    NumericPasswordValidator      # Not all numeric
]
```

### 3. Data Validation

#### Input Validation
```python
class EnergyReadingCreateSerializer(serializers.Serializer):
    voltage = FloatField(min_value=0, max_value=500)
    current = FloatField(min_value=0, max_value=100)
    power = FloatField(min_value=0)
    frequency = FloatField(min_value=45, max_value=65)
    power_factor = FloatField(min_value=0, max_value=1)
```

### 4. CORS Configuration
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
```

---

## Real-time Updates

### Auto-Refresh Mechanism

#### Frontend Polling
```javascript
// Poll server every 5 seconds
setInterval(async () => {
    const data = await fetch(`/api/realtime/${deviceId}/`);
    updateDashboard(data);
}, 5000);
```

#### Benefits of Polling:
- Simple to implement
- Works with standard HTTP
- No WebSocket needed
- Compatible with all browsers

#### Data Update Flow:
```
Browser                 Django Server              Database
  │                           │                         │
  ├─── GET /api/realtime ────▶│                         │
  │                           ├──── Query latest ──────▶│
  │                           │◄──── Return data ───────┤
  │◄──── JSON response ───────┤                         │
  │                           │                         │
  └─── Update UI              │                         │
  
  [Wait 5 seconds]
  
  ├─── GET /api/realtime ────▶│                         │
  │         (repeat)          │                         │
```

---

## Performance Optimizations

### 1. Database Indexing
```python
class Meta:
    indexes = [
        models.Index(fields=['device', '-timestamp']),
        models.Index(fields=['timestamp']),
    ]
```

### 2. Query Optimization
```python
# Use select_related to reduce queries
devices = Device.objects.select_related('user').all()

# Limit results
latest_readings = EnergyReading.objects.all()[:100]
```

### 3. Caching (Optional)
```python
from django.core.cache import cache

def get_dashboard_data(device_id):
    cache_key = f'dashboard_{device_id}'
    data = cache.get(cache_key)
    if not data:
        data = calculate_dashboard_data(device_id)
        cache.set(cache_key, data, 60)  # Cache for 60 seconds
    return data
```

---

## Error Handling

### ESP8266 Error Handling
```cpp
// WiFi reconnection
if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
}

// HTTP error handling
if (httpResponseCode < 0) {
    Serial.println("HTTP request failed");
    // Continue operation, retry next interval
}

// Sensor error handling
if (isnan(voltage)) {
    voltage = 0.0;  // Use safe default
}
```

### Django Error Handling
```python
try:
    device = Device.objects.get(api_key=api_key)
except Device.DoesNotExist:
    return Response({'error': 'Invalid API key'}, 
                   status=status.HTTP_401_UNAUTHORIZED)
```

---

## System Monitoring

### Health Checks

#### Device Online Status
```python
def get_is_online(self, obj):
    if not obj.last_seen:
        return False
    time_threshold = timezone.now() - timedelta(minutes=2)
    return obj.last_seen >= time_threshold
```

#### Alert System
```python
def check_and_create_alerts(device, reading):
    if reading.power > 5000:
        Alert.objects.create(
            device=device,
            alert_type='HIGH_POWER',
            message=f'High power: {reading.power}W'
        )
```

---

## Scalability Considerations

### Current Limitations
- SQLite database (single file)
- Polling instead of WebSockets
- Single server instance

### Scaling Solutions

#### For 10+ Devices:
- Current architecture sufficient
- May need database optimization

#### For 100+ Devices:
- Switch to PostgreSQL
- Implement connection pooling
- Add Redis for caching

#### For 1000+ Devices:
- Use message queue (Celery + Redis)
- Implement WebSockets for real-time
- Load balancing
- Database sharding

---

This architecture provides a robust, secure, and scalable foundation for energy monitoring with clear separation of concerns and modular design.