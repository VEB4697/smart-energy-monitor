# 🔌 Smart Energy Monitoring System

A comprehensive real-time energy monitoring solution using ESP8266, PZEM-004T sensor, and Django web framework with an interactive dashboard.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Django](https://img.shields.io/badge/django-4.2-green.svg)
![Arduino](https://img.shields.io/badge/arduino-ESP8266-teal.svg)

## ✨ Features

### Hardware Features
- ⚡ Real-time monitoring of voltage, current, and power
- 📊 Energy consumption tracking (kWh)
- 📡 Frequency and power factor measurement
- 🖥️ OLED display for local readings
- 📶 WiFi connectivity for data transmission

### Software Features
- 🌐 Interactive web dashboard
- 📈 Real-time data visualization with charts
- 📅 Historical data analytics (hourly, daily, weekly)
- 🔐 User authentication and authorization
- 🚨 Alert system for abnormal conditions
- 📱 Responsive design for mobile devices
- 🔄 Auto-refresh real-time data
- 💾 SQLite database for data storage

## 🛠️ Hardware Requirements

| Component | Description | Quantity |
|-----------|-------------|----------|
| ESP8266 NodeMCU | WiFi microcontroller | 1 |
| PZEM-004T | AC energy sensor | 1 |
| OLED Display | 0.96" I2C display | 1 |
| Jumper Wires | For connections | Several |
| USB Cable | For programming | 1 |
| Enclosure | For safety | 1 |

## 💻 Software Stack

### Backend
- **Framework**: Django 4.2
- **API**: Django REST Framework
- **Database**: SQLite (default) / PostgreSQL (production)
- **Authentication**: Django Auth System

### Frontend
- **UI Framework**: TailwindCSS
- **Charts**: Chart.js
- **Icons**: Font Awesome
- **AJAX**: Vanilla JavaScript (Fetch API)

### Hardware
- **Platform**: Arduino (ESP8266)
- **Libraries**: PZEM-004T-v30, Adafruit SSD1306, Adafruit GFX

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Arduino IDE
- Git
- USB driver for ESP8266 (CH340/CP2102)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/smart-energy-monitor.git
cd smart-energy-monitor
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver 0.0.0.0:8000
```

### 3. Hardware Setup
1. Wire components according to [wiring diagram](#wiring-diagram)
2. Install Arduino libraries
3. Upload code to ESP8266
4. Update WiFi credentials and server URL
5. Monitor serial output

### 4. Access Dashboard
Open browser and navigate to:
```
http://localhost:8000
```

## 🔌 Wiring Diagram

```
PZEM-004T to ESP8266:
┌──────────────┐         ┌──────────────┐
│ PZEM-004T    │         │  ESP8266     │
├──────────────┤         ├──────────────┤
│ TX           ├─────────┤ D7 (GPIO13)  │
│ RX           ├─────────┤ D8 (GPIO15)  │
│ VCC          ├─────────┤ 5V           │
│ GND          ├─────────┤ GND          │
└──────────────┘         └──────────────┘

OLED Display to ESP8266:
┌──────────────┐         ┌──────────────┐
│ OLED (I2C)   │         │  ESP8266     │
├──────────────┤         ├──────────────┤
│ VCC          ├─────────┤ 3.3V         │
│ GND          ├─────────┤ GND          │
│ SDA          ├─────────┤ D2 (GPIO4)   │
│ SCL          ├─────────┤ D1 (GPIO5)   │
└──────────────┘         └──────────────┘
```

## 📁 Project Structure

```
smart-energy-monitor/
├── manage.py                       # Django management script
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variables template
├── README.md                       # This file
├── COMPLETE_SETUP_GUIDE.md        # Detailed setup instructions
├── GIT_SETUP.md                   # Git configuration guide
│
├── energy_monitor/                 # Django project settings
│   ├── settings.py                # Main configuration
│   ├── urls.py                    # URL routing
│   ├── wsgi.py                    # WSGI configuration
│   └── asgi.py                    # ASGI configuration
│
├── monitoring/                     # Django app
│   ├── models.py                  # Database models
│   ├── views.py                   # View functions
│   ├── serializers.py             # API serializers
│   ├── urls.py                    # App URL routing
│   ├── admin.py                   # Admin configuration
│   └── migrations/                # Database migrations
│
├── templates/                      # HTML templates
│   ├── base.html                  # Base template
│   ├── login.html                 # Login page
│   ├── register.html              # Registration page
│   └── dashboard.html             # Main dashboard
│
├── static/                         # Static files
│   ├── css/                       # Stylesheets
│   └── js/                        # JavaScript files
│
└── hardware/                       # Arduino code
    └── ESP8266_Energy_Monitor.ino # ESP8266 firmware
```

## 🔧 Configuration

### Environment Variables (.env)
```env
SECRET_KEY=your-django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,your-ip
API_KEY=your-esp8266-api-key
```

### ESP8266 Configuration
Update in `ESP8266_Energy_Monitor.ino`:
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:8000/api/energy-data/";
const char* apiKey = "YOUR_API_KEY";
```

## 📊 API Endpoints

### ESP8266 Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/energy-data/` | Submit sensor readings | API Key |

### Dashboard Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/devices/` | List user devices | Session |
| POST | `/api/devices/create/` | Create new device | Session |
| GET | `/api/dashboard/{id}/` | Get dashboard data | Session |
| GET | `/api/realtime/{id}/` | Get real-time data | Session |
| GET | `/api/historical/{id}/` | Get historical data | Session |

## 📸 Screenshots

### Dashboard
![Dashboard](docs/images/dashboard.png)

### Login Page
![Login](docs/images/login.png)

### OLED Display
![OLED](docs/images/oled.jpg)

## ⚙️ Advanced Configuration

### Using PostgreSQL (Production)
```python
# In settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'energy_monitor',
        'USER': 'your_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Custom Alert Thresholds
Edit in `monitoring/views.py`:
```python
def check_and_create_alerts(device, reading):
    if reading.power > 5000:  # High power threshold
        # Create alert
    if reading.voltage < 200:  # Low voltage threshold
        # Create alert
```

## 🚀 Deployment

### PythonAnywhere (Free)
1. Sign up at pythonanywhere.com
2. Upload project files
3. Configure virtual environment
4. Set up WSGI file
5. Update ESP8266 URL

See [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) for detailed deployment instructions.

### Local Network
```bash
python manage.py runserver 0.0.0.0:8000
```
Access from any device: `http://YOUR_LOCAL_IP:8000`

## 🐛 Troubleshooting

### ESP8266 Not Connecting
- Verify WiFi credentials
- Check 2.4GHz network (ESP8266 doesn't support 5GHz)
- Ensure DHCP is enabled
- Check serial monitor for error messages

### PZEM Not Reading
- Verify wiring connections
- Check AC power to PZEM
- Try swapping TX/RX pins
- Ensure proper voltage (5V)

### Dashboard Not Updating
- Check ESP8266 is sending data (serial monitor)
- Verify API key matches Django
- Check Django logs for errors
- Inspect browser console (F12)

See [COMPLETE_SETUP_GUIDE.md](COMPLETE_SETUP_GUIDE.md) for more troubleshooting tips.

## 🔐 Security Considerations

### Production Checklist
- [ ] Change `SECRET_KEY` to random string
- [ ] Set `DEBUG=False`
- [ ] Use HTTPS (SSL certificate)
- [ ] Implement rate limiting
- [ ] Use strong passwords
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Use environment variables for secrets

## 📝 To-Do / Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Email/SMS alerts
- [ ] Cost calculation based on tariff
- [ ] Multiple device comparison
- [ ] Data export (CSV/PDF)
- [ ] Machine learning predictions
- [ ] Integration with home automation
- [ ] Multi-language support
- [ ] Dark mode theme

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Django framework developers
- ESP8266 community
- PZEM-004T library maintainers
- TailwindCSS team
- Chart.js developers

## ⚠️ Safety Warning

**WARNING**: This project involves working with mains AC electricity. Always:
- Follow electrical safety guidelines
- Use proper insulation
- Consult qualified electrician
- Never work on live circuits
- Use proper enclosure for deployment

---

## 📚 Documentation

- [Complete Setup Guide](COMPLETE_SETUP_GUIDE.md)
- [Git Setup Guide](GIT_SETUP.md)
- [API Documentation](docs/API.md)
- [Hardware Guide](docs/HARDWARE.md)

## 🐞 Bug Reports

Found a bug? Please open an issue on GitHub with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Python version, etc.)

## 💬 Support

Need help? 
- Open an issue on GitHub
- Check existing issues and discussions
- Read the troubleshooting section
- Review the complete setup guide

---

**Made with ❤️ and ☕**

⭐ Star this repo if you find it helpful!