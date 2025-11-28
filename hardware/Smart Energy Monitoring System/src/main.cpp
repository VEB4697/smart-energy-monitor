/*
 * Smart Energy Monitoring System
 * ESP8266 + PZEM-004T + OLED Display
 * Sends data to Django backend via HTTP POST
 * 
 * Required Libraries:
 * - PZEM004Tv30 (by Jakub Mandula)
 * - Adafruit SSD1306
 * - Adafruit GFX Library
 * - ESP8266WiFi
 * - ESP8266HTTPClient
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <PZEM004Tv30.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ===== WiFi Configuration =====
const char* ssid = "vaibhav";           // Replace with your WiFi SSID
const char* password = "VEB@4697";   // Replace with your WiFi password

// ===== Server Configuration =====
const char* serverUrl = "http://192.168.0.195:8000/api/energy-data/"; // Replace with your Django server URL
const char* apiKey = "fifLzEGJKga63vOLcuBkTMGtIDBQzFJ5FQLiU59zRTI";  // API key for authentication (set in Django)

// ===== PZEM Configuration =====
// Using Software Serial: RX=D7(GPIO13), TX=D8(GPIO15)
PZEM004Tv30 pzem(13, 15);

// ===== OLED Configuration =====
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1  // Reset pin not used
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ===== Timing Variables =====
unsigned long lastDisplayUpdate = 0;
unsigned long lastDataSend = 0;
const unsigned long displayInterval = 2000;  // 2 seconds per screen
const unsigned long sendInterval = 10000;    // Send data every 10 seconds
int displayPage = 0;

// ===== Data Variables =====
float voltage = 0.0;
float current = 0.0;
float power = 0.0;
float energy = 0.0;
float frequency = 0.0;
float pf = 0.0;

// ===== Function Prototypes =====
void connectWiFi();
void readSensorData();
void updateDisplay();
void sendDataToServer();
void displayBootScreen();
void displayError(String message);

// ===== Setup Function =====
void setup() {
  Serial.begin(115200);
  delay(100);
  
  Serial.println("\n\n=================================");
  Serial.println("Smart Energy Monitoring System");
  Serial.println("=================================\n");

  // Initialize OLED Display
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("ERROR: OLED initialization failed!");
    for(;;); // Halt
  }
  
  displayBootScreen();
  delay(2000);

  // Connect to WiFi
  connectWiFi();

  // Initialize PZEM
  Serial.println("Initializing PZEM-004T...");
  delay(1000);
  
  // Test PZEM connection
  voltage = pzem.voltage();
  if (isnan(voltage)) {
    Serial.println("WARNING: PZEM-004T not responding!");
    displayError("PZEM Error");
    delay(3000);
  } else {
    Serial.println("PZEM-004T initialized successfully!");
  }

  Serial.println("\nSystem Ready!\n");
}

// ===== Main Loop =====
void loop() {
  // Read sensor data
  readSensorData();
  
  // Update OLED display every 2 seconds
  if (millis() - lastDisplayUpdate >= displayInterval) {
    updateDisplay();
    lastDisplayUpdate = millis();
    displayPage = (displayPage + 1) % 6; // Cycle through 6 pages
  }

  // Send data to server every 10 seconds
  if (millis() - lastDataSend >= sendInterval) {
    sendDataToServer();
    lastDataSend = millis();
  }

  delay(100); // Small delay for stability
}

// ===== WiFi Connection Function =====
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Connecting WiFi...");
  display.println(ssid);
  display.display();

  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    display.print(".");
    display.display();
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("WiFi Connected!");
    display.print("IP: ");
    display.println(WiFi.localIP());
    display.display();
    delay(2000);
  } else {
    Serial.println("\nWiFi Connection Failed!");
    displayError("WiFi Failed");
    delay(3000);
  }
}

// ===== Read Sensor Data =====
void readSensorData() {
  voltage = pzem.voltage();
  current = pzem.current();
  power = pzem.power();
  energy = pzem.energy();
  frequency = pzem.frequency();
  pf = pzem.pf();

  // Handle NaN values
  if (isnan(voltage)) voltage = 0.0;
  if (isnan(current)) current = 0.0;
  if (isnan(power)) power = 0.0;
  if (isnan(energy)) energy = 0.0;
  if (isnan(frequency)) frequency = 0.0;
  if (isnan(pf)) pf = 0.0;
}

// ===== Update OLED Display =====
void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  switch(displayPage) {
    case 0:
      // Voltage
      display.setTextSize(2);
      display.println("VOLTAGE");
      display.setTextSize(3);
      display.print(voltage, 1);
      display.setTextSize(2);
      display.println(" V");
      break;
      
    case 1:
      // Current
      display.setTextSize(2);
      display.println("CURRENT");
      display.setTextSize(3);
      display.print(current, 2);
      display.setTextSize(2);
      display.println(" A");
      break;
      
    case 2:
      // Power
      display.setTextSize(2);
      display.println("POWER");
      display.setTextSize(3);
      display.print(power, 1);
      display.setTextSize(2);
      display.println(" W");
      break;
      
    case 3:
      // Energy
      display.setTextSize(2);
      display.println("ENERGY");
      display.setTextSize(3);
      display.print(energy, 2);
      display.setTextSize(1);
      display.println(" kWh");
      break;
      
    case 4:
      // Frequency
      display.setTextSize(2);
      display.println("FREQUENCY");
      display.setTextSize(3);
      display.print(frequency, 1);
      display.setTextSize(2);
      display.println(" Hz");
      break;
      
    case 5:
      // Power Factor
      display.setTextSize(2);
      display.println("POWER");
      display.println("FACTOR");
      display.setTextSize(3);
      display.print(pf, 2);
      break;
  }

  display.display();
}

// ===== Send Data to Server =====
void sendDataToServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Reconnecting...");
    connectWiFi();
    return;
  }

  WiFiClient client;
  HTTPClient http;

  Serial.println("\n--- Sending Data to Server ---");
  Serial.print("URL: ");
  Serial.println(serverUrl);

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);

  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"voltage\":" + String(voltage, 2) + ",";
  jsonPayload += "\"current\":" + String(current, 3) + ",";
  jsonPayload += "\"power\":" + String(power, 2) + ",";
  jsonPayload += "\"energy\":" + String(energy, 3) + ",";
  jsonPayload += "\"frequency\":" + String(frequency, 2) + ",";
  jsonPayload += "\"power_factor\":" + String(pf, 3);
  jsonPayload += "}";

  Serial.print("Payload: ");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("Response Code: ");
    Serial.println(httpResponseCode);
    Serial.print("Response: ");
    Serial.println(response);
  } else {
    Serial.print("Error Code: ");
    Serial.println(httpResponseCode);
    Serial.println("Failed to send data!");
  }

  http.end();
  Serial.println("-----------------------------\n");
}

// ===== Display Boot Screen =====
void displayBootScreen() {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(10, 10);
  display.println("ENERGY");
  display.setCursor(5, 35);
  display.println("MONITOR");
  display.setTextSize(1);
  display.setCursor(25, 55);
  display.println("Booting...");
  display.display();
}

// ===== Display Error Message =====
void displayError(String message) {
  display.clearDisplay();
  display.setTextSize(2);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 20);
  display.println("ERROR:");
  display.setTextSize(1);
  display.setCursor(0, 45);
  display.println(message);
  display.display();
}