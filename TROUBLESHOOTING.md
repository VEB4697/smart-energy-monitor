# Comprehensive Troubleshooting Guide

## Table of Contents
1. [ESP8266 Issues](#esp8266-issues)
2. [PZEM-004T Issues](#pzem-004t-issues)
3. [OLED Display Issues](#oled-display-issues)
4. [Django Backend Issues](#django-backend-issues)
5. [Network & Communication](#network--communication)
6. [Database Issues](#database-issues)
7. [Frontend Issues](#frontend-issues)
8. [Common Error Messages](#common-error-messages)

---

## ESP8266 Issues

### Issue 1: ESP8266 Not Connecting to WiFi

**Symptoms:**
- Serial monitor shows "Connecting..." indefinitely
- No IP address assigned
- WiFi connection timeout

**Possible Causes & Solutions:**

**A. Wrong WiFi Credentials**
```cpp
// Check your WiFi credentials carefully
const char* ssid = "YOUR_EXACT_WIFI_NAME";  // Case sensitive!
const char* password = "YOUR_EXACT_PASSWORD";
```

**B. 5GHz Network**
- ESP8266 only supports 2.4GHz WiFi
- Solution: Ensure router is broadcasting 2.4GHz
- Check router settings or use separate 2.4GHz network

**C. Special Characters in Password**
```cpp
// Escape special characters properly
const char* password = "Pass\\word123";  // For backslash
const char* password = "Pass\"word123";  // For quotes
```

**D. WiFi Signal Strength**
- Move ESP8266 closer to router
- Check antenna connection (if external)
- Use WiFi repeater if needed

**E. MAC Address Filtering**
- Check if router has MAC filtering enabled
- Add ESP8266 MAC address to allowed list
- Find MAC in serial monitor or router admin panel

**F. DHCP Issues**
```cpp
// Try static IP instead of DHCP
WiFi.config(IPAddress(192,168,1,150), 
            IPAddress(192,168,1,1), 
            IPAddress(255,255,255,0));
WiFi.begin(ssid, password);
```

### Issue 2: ESP8266 Keeps Restarting

**Symptoms:**
- Continuous boot loop
- Random resets
- "Soft WDT reset" messages

**Solutions:**

**A. Power Supply Issues**
```
Problem: Insufficient current (< 500mA)
Solution: Use quality USB power supply (5V/1A minimum)
         Avoid powering from computer USB
```

**B. Code Issues**
```cpp
// Add watchdog timer feed
ESP.wdtFeed();  // In long loops

// Add delays
delay(100);  // After heavy operations
```

**C. Memory Issues**
```cpp
// Check free heap
Serial.println(ESP.getFreeHeap());

// If low (< 10KB), optimize:
// - Reduce String usage
// - Use F() macro for strings in Serial.print
Serial.println(F("Static string"));
```

### Issue 3: Upload Failed

**Symptoms:**
- "Failed to connect to ESP8266"
- "Timeout waiting for packet header"
- Port not found

**Solutions:**

**A. Driver Issues**
```
For CH340: Install CH340 driver
For CP2102: Install CP2102 driver
Download from manufacturer website
```

**B. Port Selection**
```
Windows: Check Device Manager > Ports (COM & LPT)
Mac: /dev/cu.usbserial* or /dev/cu.SLAB_USBtoUART
Linux: /dev/ttyUSB0 or /dev/ttyACM0
```

**C. Upload Mode**
```
1. Hold FLASH button
2. Press RESET button
3. Release RESET
4. Release FLASH after 2 seconds
5. Try upload again
```

**D. Baud Rate**
```
Try different upload speeds:
- 115200 (recommended)
- 921600 (faster but may fail)
- 9600 (slower but more reliable)
```

---

## PZEM-004T Issues

### Issue 1: PZEM Not Responding

**Symptoms:**
- All readings show 0.0 or NaN
- Serial monitor: "PZEM-004T not responding"
- No data from sensor

**Solutions:**

**A. Check Wiring**
```
Correct connections:
PZEM TX  ─→  ESP8266 RX (GPIO 13 / D7)
PZEM RX  ─→  ESP8266 TX (GPIO 15 / D8)
PZEM VCC ─→  ESP8266 5V
PZEM GND ─→  ESP8266 GND

Common mistake: TX-TX, RX-RX (should be TX-RX, RX-TX)
```

**B. Power Supply**
```
PZEM needs 5V with sufficient current
Check: Is power LED on PZEM lit?
If not: Check 5V pin voltage with multimeter
```

**C. Try Swapping TX/RX**
```cpp
// If still not working, try
PZEM004Tv30 pzem(15, 13);  // Swap TX/RX pins
```

**D. Baud Rate**
```cpp
// Default is 9600, some modules use different rates
// Try in PZEM library initialization
```

**E. Test PZEM Separately**
```cpp
void setup() {
    Serial.begin(115200);
    // Test code
    float v = pzem.voltage();
    if (!isnan(v)) {
        Serial.print("Voltage: ");
        Serial.println(v);
    } else {
        Serial.println("PZEM Error!");
    }
}
```

### Issue 2: Incorrect Readings

**Symptoms:**
- Voltage always 0 or 220V
- Current shows value with no load
- Power readings don't match actual

**Solutions:**

**A. No Load Connected**
```
PZEM needs actual AC load to measure
Connect a light bulb or appliance
Check CT clamp orientation (arrow direction)
```

**B. CT Clamp Issues**
```
- Ensure clamp is fully closed
- Only one wire through clamp (phase wire, not both)
- Arrow direction should point away from load
- Try different wire (phase vs neutral)
```

**C. Calibration**
```cpp
// Reset energy counter if needed
pzem.resetEnergy();

// Check with known load
// Example: 100W bulb should show ~100W
```

**D. Voltage Range**
```
PZEM-004T: 80-260V AC
If outside range, readings will be 0
Check your local voltage standard
```

### Issue 3: Energy Counter Not Increasing

**Symptoms:**
- Energy value stays at 0 or doesn't change
- Other readings are correct

**Solutions:**

**A. Reset Energy Counter**
```cpp
void setup() {
    // Reset on first boot
    pzem.resetEnergy();
}
```

**B. Time Issue**
```
Energy accumulates over time
With low power (< 10W), may take hours to see change
Test with higher power appliance (> 100W)
```

**C. Check Power Reading**
```
If power is 0, energy won't increase
Fix power reading first
```

---

## OLED Display Issues

### Issue 1: Display Not Working

**Symptoms:**
- Blank screen
- No initialization message
- All white or all black screen

**Solutions:**

**A. Check I2C Address**
```cpp
// Try both common addresses
#define SCREEN_ADDRESS 0x3C  // Try this first
// or
#define SCREEN_ADDRESS 0x3D  // If 0x3C doesn't work

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET, SCREEN_ADDRESS);
```

**B. I2C Scanner**
```cpp
// Upload this code to find I2C address
#include <Wire.h>
void setup() {
    Serial.begin(115200);
    Wire.begin();
    Serial.println("Scanning...");
    for(byte i = 0; i < 127; i++) {
        Wire.beginTransmission(i);
        if (Wire.endTransmission() == 0) {
            Serial.print("Found device at 0x");
            Serial.println(i, HEX);
        }
    }
}
void loop() {}
```

**C. Check Wiring**
```
Correct connections:
OLED VCC ─→  ESP8266 3.3V (NOT 5V!)
OLED GND ─→  ESP8266 GND
OLED SDA ─→  ESP8266 D2 (GPIO 4)
OLED SCL ─→  ESP8266 D1 (GPIO 5)
```

**D. Power Issues**
```
OLED requires 3.3V
Check voltage at VCC pin
Insufficient current = dim/no display
```

### Issue 2: Display Shows Garbage

**Symptoms:**
- Random pixels
- Unreadable text
- Flickering

**Solutions:**

**A. Incorrect Library**
```cpp
// Use correct OLED type
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// Not Adafruit_SH1106 or other
```

**B. I2C Speed**
```cpp
// Try slower I2C speed
Wire.setClock(100000);  // 100 KHz instead of 400 KHz
```

**C. Reset Display**
```cpp
display.clearDisplay();
display.display();
delay(1000);
```

---

## Django Backend Issues

### Issue 1: Can't Start Django Server

**Symptoms:**
- "No module named django"
- "Address already in use"
- Import errors

**Solutions:**

**A. Django Not Installed**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Verify Django installed
python -c "import django; print(django.get_version())"
```

**B. Port Already in Use**
```bash
# Find process using port 8000
# Linux/Mac
lsof -i :8000
kill -9 <PID>

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or use different port
python manage.py runserver 8001
```

**C. Migration Issues**
```bash
# Delete database and remigrate
rm db.sqlite3
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Issue 2: Database Errors

**Symptoms:**
- "no such table"
- "column does not exist"
- Migration errors

**Solutions:**

**A. Run Migrations**
```bash
python manage.py makemigrations monitoring
python manage.py migrate
```

**B. Reset Migrations**
```bash
# Backup data first!
rm -rf monitoring/migrations/
python manage.py makemigrations monitoring
python manage.py migrate
```

**C. Database Corruption**
```bash
# Backup then reset
mv db.sqlite3 db.sqlite3.backup
python manage.py migrate
# Manually restore data if needed
```

### Issue 3: Static Files Not Loading

**Symptoms:**
- No CSS/JavaScript
- 404 errors for static files
- Plain HTML with no styling

**Solutions:**

**A. Collect Static Files**
```bash
python manage.py collectstatic --clear
```

**B. Check Settings**
```python
# In settings.py
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
```

**C. Debug Mode**
```python
# In settings.py for development
DEBUG = True  # Django serves static files in DEBUG mode
```

---

## Network & Communication

### Issue 1: ESP8266 Can't Reach Server

**Symptoms:**
- HTTP error codes (404, 500, etc.)
- Connection timeout
- "Failed to connect" messages

**Solutions:**

**A. Check Server URL**
```cpp
// Ensure correct format
const char* serverUrl = "http://192.168.1.100:8000/api/energy-data/";

// Common mistakes:
// ❌ https:// (use http://)
// ❌ Missing trailing slash
// ❌ Wrong IP address
// ❌ Wrong port
```

**B. Verify Server Running**
```bash
# Ensure Django is running on 0.0.0.0
python manage.py runserver 0.0.0.0:8000

# Check from another device
curl http://192.168.1.100:8000/
```

**C. Firewall**
```bash
# Linux: Allow port 8000
sudo ufw allow 8000

# Windows: Check Windows Defender Firewall
# Add inbound rule for port 8000
```

**D. Same Network**
```
Ensure ESP8266 and computer are on same network
Check IP addresses are in same subnet
Example: 192.168.1.x
```

### Issue 2: API Authentication Failing

**Symptoms:**
- HTTP 401 Unauthorized
- "Invalid API key" messages
- Data not being saved

**Solutions:**

**A. Verify API Key**
```bash
# In Django shell
python manage.py shell

from monitoring.models import Device
device = Device.objects.first()
print(f"API Key: {device.api_key}")
```

**B. Update ESP8266 Code**
```cpp
// Copy exact API key (case-sensitive!)
const char* apiKey = "paste-exact-api-key-here";
```

**C. Check Header**
```cpp
// Ensure header is set correctly
http.addHeader("X-API-Key", apiKey);
// Not "API-Key" or "ApiKey"
```

### Issue 3: Data Not Appearing in Dashboard

**Symptoms:**
- Dashboard shows "--" or empty
- No charts
- Real-time data not updating

**Solutions:**

**A. Check Django Admin**
```
1. Go to http://localhost:8000/admin/
2. Check "Energy readings"
3. Verify data is being saved
4. Check timestamps
```

**B. Check Device ID**
```javascript
// In browser console (F12)
console.log("Device ID:", currentDeviceId);

// Verify it matches your device
```

**C. Check API Response**
```bash
# Test API endpoint
curl -H "X-API-Key: your-api-key" \
     -H "Content-Type: application/json" \
     -d '{"voltage":230,"current":1.5,"power":345,"energy":1.2,"frequency":50,"power_factor":0.9}' \
     http://localhost:8000/api/energy-data/
```

**D. Browser Console Errors**
```
Press F12 → Console tab
Look for:
- Network errors (red)
- JavaScript errors
- Failed API calls
```

---

## Database Issues

### Issue 1: Database Locked

**Symptoms:**
- "database is locked"
- Slow queries
- Timeout errors

**Solutions:**

**A. Close All Connections**
```bash
# Stop server
# Delete database lock file
rm db.sqlite3-journal

# Restart server
```

**B. Switch to PostgreSQL** (Production)
```bash
# Install PostgreSQL
pip install psycopg2-binary

# Update settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'energy_monitor',
        ...
    }
}
```

### Issue 2: Too Much Data / Slow Queries

**Symptoms:**
- Slow page loads
- High CPU usage
- Timeout errors

**Solutions:**

**A. Limit Query Results**
```python
# In models.py
class Meta:
    ordering = ['-timestamp']
    
# In queries
latest_readings = EnergyReading.objects.all()[:100]
```

**B. Add Database Indexes**
```python
class Meta:
    indexes = [
        models.Index(fields=['device', '-timestamp']),
    ]
```

**C. Implement Data Cleanup**
```python
# Delete old readings (> 30 days)
from datetime import timedelta
from django.utils import timezone

threshold = timezone.now() - timedelta(days=30)
EnergyReading.objects.filter(timestamp__lt=threshold).delete()
```

**D. Use Pagination**
```python
# In views.py
from django.core.paginator import Paginator

readings = EnergyReading.objects.all()
paginator = Paginator(readings, 50)  # 50 per page
```

---

## Frontend Issues

### Issue 1: Charts Not Displaying

**Symptoms:**
- Empty chart areas
- JavaScript errors
- "Chart is not defined"

**Solutions:**

**A. Check Chart.js Loading**
```html
<!-- Verify in templates/base.html -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
```

**B. Check Console**
```
F12 → Console tab
Look for JavaScript errors
Common: "Cannot read property 'getContext' of null"
```

**C. Verify Data Format**
```javascript
// Data should be arrays of same length
labels: ['Mon', 'Tue', 'Wed'],
data: [10, 20, 15]  // Must match labels length
```

### Issue 2: Page Not Updating

**Symptoms:**
- Data doesn't refresh
- Stuck on old values
- Auto-update not working

**Solutions:**

**A. Check JavaScript Console**
```javascript
// Verify interval is running
console.log("Fetching data...");  // Add in fetch function
```

**B. Clear Browser Cache**
```
Chrome: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Delete
Or use Incognito/Private mode
```

**C. Check Network Tab**
```
F12 → Network tab
Watch for API calls every 5 seconds
Check response status and data
```

---

## Common Error Messages

### ESP8266 Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `WiFi connection timeout` | Wrong credentials | Check SSID/password |
| `Soft WDT reset` | Code hung | Add ESP.wdtFeed() |
| `Exception (28)` | Memory issue | Reduce memory usage |
| `HTTP error -1` | Can't connect | Check server URL |
| `HTTP error 404` | Wrong endpoint | Verify URL path |
| `HTTP error 401` | Auth failed | Check API key |

### Django Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `No such table` | No migrations | Run migrate |
| `CSRF verification failed` | CSRF token missing | Exempt API endpoint |
| `Permission denied` | Not authenticated | Check login |
| `Port already in use` | Server running | Kill process or use different port |
| `Module not found` | Package not installed | pip install package |

### Database Errors

| Error Message | Cause | Solution |
|--------------|-------|----------|
| `database is locked` | Concurrent access | Close connections |
| `column doesn't exist` | Migration issue | Remigrate |
| `UNIQUE constraint failed` | Duplicate entry | Check unique fields |

---

## Diagnostic Checklist

### Quick Diagnostic Steps

1. **Hardware Check**
   - [ ] All LEDs lit
   - [ ] OLED displaying
   - [ ] Serial monitor working
   - [ ] Voltage readings correct

2. **Network Check**
   - [ ] ESP8266 has IP
   - [ ] Can ping server
   - [ ] Server running
   - [ ] Firewall allows connection

3. **Software Check**
   - [ ] Migrations run
   - [ ] Superuser created
   - [ ] API key matches
   - [ ] Browser console clear

4. **Data Check**
   - [ ] Data in admin panel
   - [ ] Timestamps recent
   - [ ] Device online status
   - [ ] No errors in logs

---

## Getting Help

If you're still stuck:

1. **Check Serial Monitor**
   - Look for error messages
   - Note exact error text
   - Check timestamps

2. **Check Django Logs**
   ```bash
   # Run server with verbosity
   python manage.py runserver --verbosity 3
   ```

3. **Enable Debug Mode**
   ```python
   # In settings.py
   DEBUG = True
   ```

4. **Test Individually**
   - Test ESP8266 alone
   - Test server alone
   - Test components separately

5. **Document Your Issue**
   - What you tried
   - Error messages
   - System details
   - Steps to reproduce

---

## Preventive Maintenance

### Regular Checks

**Weekly:**
- Check device online status
- Review alerts
- Check disk space

**Monthly:**
- Backup database
- Clean old readings
- Update dependencies
- Review logs

**Quarterly:**
- Hardware inspection
- Wiring check
- Performance review
- Security audit

---

Remember: Most issues are simple configuration problems. Work through the checklist systematically!