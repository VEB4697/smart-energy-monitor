# Complete Setup Guide - Smart Energy Monitoring System

## Table of Contents
1. [Hardware Setup](#hardware-setup)
2. [Django Backend Setup](#django-backend-setup)
3. [ESP8266 Configuration](#esp8266-configuration)
4. [Testing](#testing)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)

---

## Hardware Setup

### Required Components
- ESP8266 NodeMCU
- PZEM-004T Energy Sensor
- 0.96" OLED Display (I2C)
- Jumper wires
- USB cable for programming
- Power supply

### Wiring Diagram

```
PZEM-004T to ESP8266:
- PZEM TX  → GPIO 13 (D7)
- PZEM RX  → GPIO 15 (D8)
- PZEM VCC → 5V
- PZEM GND → GND

OLED Display to ESP8266:
- OLED VCC → 3.3V
- OLED GND → GND
- OLED SDA → GPIO 4 (D2)
- OLED SCL → GPIO 5 (D1)
```

### Safety Notes
⚠️ **WARNING**: The PZEM-004T connects directly to AC mains power. Ensure:
- All connections are secure and insulated
- Never touch the PZEM terminals when powered
- Use proper enclosure for the device
- Consult a qualified electrician if unsure

---

## Django Backend Setup

### Step 1: Install Python
Ensure Python 3.8+ is installed:
```bash
python --version
```

### Step 2: Create Project Directory
```bash
mkdir smart-energy-monitor
cd smart-energy-monitor
```

### Step 3: Create Virtual Environment
```bash
# On Linux/Mac
python -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

### Step 4: Install Django and Dependencies
```bash
pip install django==4.2
pip install djangorestframework==3.14.0
pip install django-cors-headers==4.3.1
pip install python-decouple==3.8
pip install pytz
```

### Step 5: Create Django Project
```bash
django-admin startproject energy_monitor .
python manage.py startapp monitoring
```

### Step 6: Configure Settings

Create `.env` file in project root:
```env
SECRET_KEY=your-secret-key-change-this
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,YOUR_LOCAL_IP
API_KEY=esp8266-api-key-12345
```

Update `energy_monitor/settings.py`:
- Copy the settings.py code from artifacts
- Add 'monitoring' to INSTALLED_APPS
- Add 'rest_framework' and 'corsheaders' to INSTALLED_APPS

### Step 7: Create Database Models

Copy all Python files from artifacts:
- `monitoring/models.py`
- `monitoring/serializers.py`
- `monitoring/views.py`
- `monitoring/urls.py`
- `monitoring/admin.py`

### Step 8: Create Templates

Create `templates` directory and copy:
- `base.html`
- `login.html`
- `register.html`
- `dashboard.html`

### Step 9: Configure URLs

Update `energy_monitor/urls.py` to include monitoring URLs.

### Step 10: Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 11: Create Superuser
```bash
python manage.py createsuperuser
```
Follow prompts to create admin account.

### Step 12: Create Regular User & Device

Option 1 - Via Web Interface:
1. Run server: `python manage.py runserver 0.0.0.0:8000`
2. Visit: `http://localhost:8000/register/`
3. Register a new account
4. Login to dashboard

Option 2 - Via Admin Panel:
1. Visit: `http://localhost:8000/admin/`
2. Login with superuser credentials
3. Create a User
4. Create a Device with that user
5. Copy the API Key for ESP8266

### Step 13: Get Your API Key
```bash
python manage.py shell
```
```python
from monitoring.models import Device
device = Device.objects.first()
print(f"API Key: {device.api_key}")
exit()
```

### Step 14: Find Your Local IP Address
```bash
# Linux/Mac
ifconfig | grep "inet "
# or
ip addr show

# Windows
ipconfig
```
Look for your local IP (e.g., 192.168.1.100)

---

## ESP8266 Configuration

### Step 1: Install Arduino IDE
Download from: https://www.arduino.cc/en/software

### Step 2: Add ESP8266 Board Support
1. File → Preferences
2. Additional Board Manager URLs: 
   `http://arduino.esp8266.com/stable/package_esp8266com_index.json`
3. Tools → Board → Boards Manager
4. Search "ESP8266" → Install

### Step 3: Install Required Libraries
Tools → Manage Libraries → Install:
- `PZEM-004T-v30` by Jakub Mandula
- `Adafruit SSD1306`
- `Adafruit GFX Library`

### Step 4: Configure ESP8266 Code

Open `ESP8266_Energy_Monitor.ino` and update:

```cpp
// WiFi Credentials
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration  
const char* serverUrl = "http://192.168.1.100:8000/api/energy-data/";
const char* apiKey = "YOUR_API_KEY_FROM_DJANGO";
```

Replace:
- `YOUR_WIFI_NAME` - Your WiFi network name
- `YOUR_WIFI_PASSWORD` - Your WiFi password
- `192.168.1.100` - Your computer's local IP
- `YOUR_API_KEY_FROM_DJANGO` - API key from Step 13

### Step 5: Select Board Settings
- Tools → Board → ESP8266 Boards → NodeMCU 1.0 (ESP-12E Module)
- Tools → Upload Speed → 115200
- Tools → Port → Select your COM port

### Step 6: Upload Code
1. Connect ESP8266 via USB
2. Click Upload button
3. Wait for "Done uploading" message

### Step 7: Monitor Serial Output
- Tools → Serial Monitor
- Set baud rate to 115200
- Watch for connection messages

---

## Testing

### Test 1: ESP8266 Startup
Serial Monitor should show:
```
Smart Energy Monitoring System
Connecting to WiFi...
WiFi Connected!
IP Address: 192.168.1.XXX
PZEM-004T initialized successfully!
System Ready!
```

### Test 2: OLED Display
Display should cycle through:
- VOLTAGE
- CURRENT
- POWER
- ENERGY
- FREQUENCY
- POWER FACTOR

### Test 3: Data Transmission
Serial Monitor shows:
```
--- Sending Data to Server ---
Response Code: 201
Response: {"status":"success","message":"Data received successfully"}
```

### Test 4: Web Dashboard
1. Open browser: `http://localhost:8000/`
2. Login with your credentials
3. Dashboard should show real-time data updating every 5 seconds

### Test 4: Admin Panel
Visit `http://localhost:8000/admin/`:
- Check Devices
- View Energy Readings
- Monitor Alerts

---

## Deployment

### Option 1: Local Network Access (Free)

**Setup:**
1. Find your computer's local IP (e.g., 192.168.1.100)
2. Run Django: `python manage.py runserver 0.0.0.0:8000`
3. Access from any device on same network: `http://192.168.1.100:8000`

**Pros:**
- Completely free
- No internet required
- Full control

**Cons:**
- Only accessible on local network
- Computer must stay on

### Option 2: PythonAnywhere (Free Tier)

**Setup:**
1. Sign up at https://www.pythonanywhere.com (Free account)
2. Upload your project files
3. Set up virtual environment
4. Configure WSGI file
5. Update ESP8266 with public URL

**Pros:**
- Free tier available
- Accessible from anywhere
- No need to keep computer on

**Cons:**
- Limited daily requests (100,000/day on free tier)
- Slower than local
- Some configuration needed

**Detailed Steps:**

1. **Create PythonAnywhere Account**
   - Go to https://www.pythonanywhere.com
   - Sign up for free account

2. **Upload Files**
   ```bash
   # From local computer
   zip -r energy_monitor.zip . -x "venv/*" -x "*.pyc" -x "__pycache__/*"
   ```
   Upload zip via PythonAnywhere Files tab

3. **Setup on PythonAnywhere**
   Open Bash console:
   ```bash
   unzip energy_monitor.zip
   mkvirtualenv --python=/usr/bin/python3.10 myenv
   pip install django djangorestframework django-cors-headers python-decouple pytz
   python manage.py migrate
   python manage.py createsuperuser
   ```

4. **Configure Web App**
   - Web tab → Add new web app
   - Manual configuration → Python 3.10
   - Set Source code: `/home/yourusername/energy_monitor`
   - Set working directory: `/home/yourusername/energy_monitor`
   - Edit WSGI file:
   ```python
   import sys
   import os
   
   path = '/home/yourusername/energy_monitor'
   if path not in sys.path:
       sys.path.append(path)
   
   os.environ['DJANGO_SETTINGS_MODULE'] = 'energy_monitor.settings'
   
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

5. **Update ESP8266**
   ```cpp
   const char* serverUrl = "http://yourusername.pythonanywhere.com/api/energy-data/";
   ```

### Option 3: Heroku (Was free, now paid)

See Heroku documentation for deployment steps.

### Option 4: Railway (Free Tier)

Similar to Heroku with free tier available.

---

## Troubleshooting

### ESP8266 Issues

**Problem: WiFi not connecting**
- Solution: Check SSID and password
- Verify 2.4GHz WiFi (ESP8266 doesn't support 5GHz)
- Check router MAC filtering

**Problem: PZEM not responding**
- Solution: Check wiring connections
- Verify PZEM has power
- Try swapping TX/RX connections
- Check baud rate (default 9600)

**Problem: OLED not displaying**
- Solution: Check I2C address (try 0x3C or 0x3D)
- Verify SDA/SCL connections
- Check power supply

**Problem: HTTP error 401**
- Solution: Verify API key matches Django
- Check server URL is correct

**Problem: HTTP error 404**
- Solution: Verify server URL endpoints
- Ensure Django server is running

### Django Issues

**Problem: Database errors**
```bash
python manage.py flush
python manage.py migrate
```

**Problem: Static files not loading**
```bash
python manage.py collectstatic
```

**Problem: Can't access from other devices**
- Run with: `python manage.py runserver 0.0.0.0:8000`
- Check firewall settings
- Verify ALLOWED_HOSTS in settings.py

**Problem: CORS errors**
- Update CORS_ALLOWED_ORIGINS in settings.py
- Set CORS_ALLOW_ALL_ORIGINS = True for testing

### Data Issues

**Problem: No data appearing in dashboard**
1. Check ESP8266 serial output for errors
2. Verify device is sending data
3. Check Django admin for received readings
4. Verify device_id in API calls

**Problem: Incorrect readings**
- Calibrate PZEM-004T
- Check AC line voltage
- Verify load connections

---

## API Endpoints Reference

### For ESP8266
- `POST /api/energy-data/` - Send energy readings (requires API key)

### For Web Dashboard
- `GET /api/devices/` - List all user devices
- `GET /api/dashboard/{device_id}/` - Get dashboard data
- `GET /api/realtime/{device_id}/` - Get real-time readings
- `GET /api/historical/{device_id}/` - Get historical data

---

## Next Steps

1. **Add More Devices**: Create multiple devices in admin panel
2. **Set Alert Thresholds**: Customize in `views.py`
3. **Add Notifications**: Implement email/SMS alerts
4. **Mobile App**: Create React Native app using same API
5. **Data Export**: Add CSV export functionality
6. **Cost Calculator**: Implement electricity cost tracking

---

## Support

If you encounter issues:
1. Check serial monitor output
2. Review Django logs
3. Inspect browser console (F12)
4. Verify all configurations match

---

## Security Notes

**Production Checklist:**
- [ ] Change SECRET_KEY in .env
- [ ] Set DEBUG=False
- [ ] Use strong passwords
- [ ] Enable HTTPS
- [ ] Implement rate limiting
- [ ] Regular backups
- [ ] Update dependencies

---

## License

This project is open source. Feel free to modify and distribute.