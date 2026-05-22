// Import modular Firebase SDKs via ES Modules CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, limitToLast, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Global Application State
let firebaseApp = null;
let database = null;
let latestReading = null;
let historicalData = [];
let databaseUnsubscribe = null;
let historyUnsubscribe = null;
let chartsInstance = null;
let selectedTab = 'liveStream';

// Interactive Safety Alert Settings
let alertThresholds = {
  maxPower: 5000,
  minPf: 0.70,
  minVoltage: 200,
  maxVoltage: 250
};

// Default Fallback Database Configuration
const defaultDbUrl = "https://smart-energy-monitor-default-rtdb.firebaseio.com/";

// DOM Element References
const elements = {
  themeToggleButton: document.getElementById('themeToggleButton'),
  themeIcon: document.getElementById('themeIcon'),
  configButton: document.getElementById('configButton'),
  configModal: document.getElementById('configModal'),
  closeConfigModalBtn: document.getElementById('closeConfigModalBtn'),
  firebaseConfigForm: document.getElementById('firebaseConfigForm'),
  resetConfigBtn: document.getElementById('resetConfigBtn'),
  
  // Connection Status Labels
  networkStatusDot: document.getElementById('networkStatusDot'),
  networkStatusText: document.getElementById('networkStatusText'),
  dbNameLabel: document.getElementById('dbNameLabel'),
  lastSeenTimestamp: document.getElementById('lastSeenTimestamp'),
  
  // Telemetry Metrics Grid Displays
  voltageVal: document.getElementById('voltageVal'),
  voltageGauge: document.getElementById('voltageGauge'),
  voltageCard: document.getElementById('voltageCard'),
  
  currentVal: document.getElementById('currentVal'),
  currentGauge: document.getElementById('currentGauge'),
  currentCard: document.getElementById('currentCard'),
  
  powerVal: document.getElementById('powerVal'),
  powerGauge: document.getElementById('powerGauge'),
  powerCard: document.getElementById('powerCard'),
  topPowerValue: document.getElementById('topPowerValue'),
  
  energyVal: document.getElementById('energyVal'),
  
  frequencyVal: document.getElementById('frequencyVal'),
  frequencyGauge: document.getElementById('frequencyGauge'),
  frequencyCard: document.getElementById('frequencyCard'),
  
  pfVal: document.getElementById('pfVal'),
  pfGauge: document.getElementById('pfGauge'),
  pfCard: document.getElementById('pfCard'),
  topPfValue: document.getElementById('topPfValue'),
  
  // Alert logs panel
  alertsLogContainer: document.getElementById('alertsLogContainer'),
  alertSound: document.getElementById('alertSound'),
  
  // Claude AI Chat Interface
  chatConversation: document.getElementById('chatConversation'),
  chatInput: document.getElementById('chatInput'),
  sendChatBtn: document.getElementById('sendChatBtn'),
  suggestionButtons: document.querySelectorAll('.suggestion-btn'),
  
  // Charts Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  loadChartCanvas: document.getElementById('loadChart')
};

// --- Initialization Block ---
document.addEventListener('DOMContentLoaded', () => {
  // Initialize lucide icons rendering
  lucide.createIcons();
  
  // Load settings and configuration from localStorage
  loadSettings();
  
  // Initialize UI Event Listeners
  initializeUIListeners();
  
  // Initialize Database Connection
  connectToFirebase();
  
  // Ask for notification permissions proactively
  if (Notification.permission === 'default') {
    Notification.requestPermission();
  }
});

// --- Theme Manager ---
function toggleTheme() {
  const body = document.body;
  if (body.classList.contains('light-mode')) {
    body.classList.replace('light-mode', 'dark-mode');
    elements.themeIcon.setAttribute('data-lucide', 'sun');
    elements.themeToggleButton.querySelector('span').textContent = "Light Mode";
    localStorage.setItem('themePreference', 'dark');
  } else {
    body.classList.replace('dark-mode', 'light-mode');
    elements.themeIcon.setAttribute('data-lucide', 'moon');
    elements.themeToggleButton.querySelector('span').textContent = "Dark Mode";
    localStorage.setItem('themePreference', 'light');
  }
  lucide.createIcons();
  
  // Refresh chart theme styling
  if (chartsInstance) {
    updateChartStyling();
  }
}

// --- Load Saved Settings ---
function loadSettings() {
  // Theme Preference
  const savedTheme = localStorage.getItem('themePreference') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.replace('light-mode', 'dark-mode');
    elements.themeIcon.setAttribute('data-lucide', 'sun');
    elements.themeToggleButton.querySelector('span').textContent = "Light Mode";
  }
  
  // Threshold Settings
  const savedThresholds = localStorage.getItem('alertThresholds');
  if (savedThresholds) {
    alertThresholds = JSON.parse(savedThresholds);
  }
  
  // Populate form input boxes
  document.getElementById('cfgMaxPower').value = alertThresholds.maxPower;
  document.getElementById('cfgMinPf').value = alertThresholds.minPf.toFixed(2);
  document.getElementById('cfgMinVoltage').value = alertThresholds.minVoltage;
  document.getElementById('cfgMaxVoltage').value = alertThresholds.maxVoltage;
  
  // Populate Database URL form field
  const savedUrl = localStorage.getItem('firebaseDatabaseURL') || defaultDbUrl;
  document.getElementById('cfgDatabaseURL').value = savedUrl;
  
  const savedApiKey = localStorage.getItem('firebaseApiKey') || "";
  document.getElementById('cfgApiKey').value = savedApiKey;
  
  const savedProjId = localStorage.getItem('firebaseProjectId') || "";
  document.getElementById('cfgProjectId').value = savedProjId;
}

// --- Initialize Event Bindings ---
function initializeUIListeners() {
  // Theme Toggle Button
  elements.themeToggleButton.addEventListener('click', toggleTheme);
  
  // Config Modal Open/Close Buttons
  elements.configButton.addEventListener('click', () => elements.configModal.classList.add('open'));
  elements.closeConfigModalBtn.addEventListener('click', () => elements.configModal.classList.remove('open'));
  
  // Settings Form Submit Handler
  elements.firebaseConfigForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Read and save values
    const dbUrl = document.getElementById('cfgDatabaseURL').value.trim();
    const apiKey = document.getElementById('cfgApiKey').value.trim();
    const projId = document.getElementById('cfgProjectId').value.trim();
    
    alertThresholds.maxPower = parseFloat(document.getElementById('cfgMaxPower').value);
    alertThresholds.minPf = parseFloat(document.getElementById('cfgMinPf').value);
    alertThresholds.minVoltage = parseFloat(document.getElementById('cfgMinVoltage').value);
    alertThresholds.maxVoltage = parseFloat(document.getElementById('cfgMaxVoltage').value);
    
    localStorage.setItem('firebaseDatabaseURL', dbUrl);
    localStorage.setItem('firebaseApiKey', apiKey);
    localStorage.setItem('firebaseProjectId', projId);
    localStorage.setItem('alertThresholds', JSON.stringify(alertThresholds));
    
    // Close Modal and Reconnect
    elements.configModal.classList.remove('open');
    connectToFirebase();
  });
  
  // Settings Form Reset Defaults
  elements.resetConfigBtn.addEventListener('click', () => {
    document.getElementById('cfgDatabaseURL').value = defaultDbUrl;
    document.getElementById('cfgApiKey').value = "";
    document.getElementById('cfgProjectId').value = "";
    document.getElementById('cfgMaxPower').value = 5000;
    document.getElementById('cfgMinPf').value = 0.70;
    document.getElementById('cfgMinVoltage').value = 200;
    document.getElementById('cfgMaxVoltage').value = 250;
  });

  // Chat Panel Input Box Send Key Handler
  elements.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmission();
    }
  });
  
  elements.sendChatBtn.addEventListener('click', handleChatSubmission);
  
  // Chat Suggestion Buttons Click Handler
  elements.suggestionButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const prompt = btn.getAttribute('data-prompt');
      addChatMessage(prompt, 'user');
      simulateAssistantResponse(prompt);
    });
  });
  
  // Chart tab selections
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedTab = btn.getAttribute('data-tab');
      renderChart();
    });
  });
}

// --- Firebase Live Telemetry Core Sync ---
function connectToFirebase() {
  // Clear any existing database listeners to prevent duplicates
  if (databaseUnsubscribe) databaseUnsubscribe();
  if (historyUnsubscribe) historyUnsubscribe();
  
  updateNetworkStatus('connecting', 'Connecting...');
  
  // Fetch Saved Database credentials
  const dbUrl = localStorage.getItem('firebaseDatabaseURL') || defaultDbUrl;
  const apiKey = localStorage.getItem('firebaseApiKey') || "demo-key";
  const projId = localStorage.getItem('firebaseProjectId') || "demo-project";
  
  // Set simple display label
  try {
    const parsed = new URL(dbUrl);
    elements.dbNameLabel.textContent = parsed.host.split('.')[0];
  } catch(e) {
    elements.dbNameLabel.textContent = "Firebase RTDB";
  }

  // Construct Firebase Config
  // Firebase Web RTDB only needs databaseURL to operate successfully!
  const firebaseConfig = {
    apiKey: apiKey,
    projectId: projId,
    databaseURL: dbUrl
  };
  
  try {
    // Initialize or Reuse Firebase App
    firebaseApp = initializeApp(firebaseConfig, "energy-monitor-app-" + Date.now());
    database = getDatabase(firebaseApp);
    
    // Subscribes to the "/latest" node
    const latestRef = ref(database, 'latest');
    databaseUnsubscribe = onValue(latestRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        updateRealtimeDashboard(val);
        updateNetworkStatus('online', 'Connected');
      } else {
        updateNetworkStatus('connecting', 'Waiting for telemetry...');
      }
    }, (error) => {
      console.error(error);
      updateNetworkStatus('offline', 'DB Error: Unauthenticated');
      addAlertLog("SECURITY", "Authentication failed. Please verify Database Rules allow read access.");
    });

    // Subscribes to the "/history" node (last 30 entries)
    const historyRef = query(ref(database, 'history'), limitToLast(30));
    historyUnsubscribe = onValue(historyRef, (snapshot) => {
      historicalData = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          historicalData.push(child.val());
        });
        renderChart();
      }
    }, (err) => {
      console.error("History Stream Failed:", err);
    });
    
  } catch (error) {
    console.error("Firebase Init Failed:", error);
    updateNetworkStatus('offline', 'Connection Config Error');
  }
}

// Update connectivity banner labels
function updateNetworkStatus(status, text) {
  elements.networkStatusDot.className = "pulse-dot";
  elements.networkStatusDot.classList.add(status === 'online' ? 'green' : status === 'connecting' ? 'orange' : 'red');
  elements.networkStatusText.textContent = text;
}

// --- Live Dashboard Metrics Grid Updates ---
function updateRealtimeDashboard(data) {
  latestReading = data;
  
  // 1. Update Numeric displays
  elements.voltageVal.textContent = data.voltage.toFixed(1);
  elements.currentVal.textContent = data.current.toFixed(3);
  elements.powerVal.textContent = data.power.toFixed(1);
  elements.topPowerValue.textContent = `${data.power.toFixed(1)} W`;
  elements.energyVal.textContent = data.energy.toFixed(3);
  elements.frequencyVal.textContent = data.frequency.toFixed(1);
  elements.pfVal.textContent = data.power_factor.toFixed(2);
  elements.topPfValue.textContent = data.power_factor.toFixed(2);
  
  // Adjust Power Factor Text Label colors based on quality
  if (data.power_factor < 0.85) {
    elements.topPfValue.className = "value text-warning";
    elements.pfVal.className = "value text-warning";
  } else {
    elements.topPfValue.className = "value";
    elements.pfVal.className = "value";
  }

  // 2. Adjust progress visual fills
  // Voltage Gauge (assuming 180V - 260V scale)
  const voltPct = Math.max(0, Math.min(100, ((data.voltage - 80) / 180) * 100));
  elements.voltageGauge.style.width = `${voltPct}%`;
  
  // Current Gauge (Assuming 0A - 30A for visual clarity instead of 100A, since household loads are smaller)
  const currentPct = Math.max(0, Math.min(100, (data.current / 30) * 100));
  elements.currentGauge.style.width = `${currentPct}%`;
  
  // Active Power Gauge (0W - 6000W scale)
  const powerPct = Math.max(0, Math.min(100, (data.power / 6000) * 100));
  elements.powerGauge.style.width = `${powerPct}%`;
  
  // Frequency Gauge (45Hz - 65Hz scale)
  const freqPct = Math.max(0, Math.min(100, ((data.frequency - 45) / 20) * 100));
  elements.frequencyGauge.style.width = `${freqPct}%`;
  
  // Power Factor Gauge (0.0 - 1.0)
  const pfPct = data.power_factor * 100;
  elements.pfGauge.style.width = `${pfPct}%`;
  
  // Update timestamp last seen
  const time = data.timestamp ? new Date(data.timestamp) : new Date();
  elements.lastSeenTimestamp.textContent = time.toLocaleTimeString();
  
  // 3. Telemetry Alert Threshold Warnings Evaluation
  evaluateDashboardAlerts(data);
}

// --- Active Safety Alerts Logic ---
function evaluateDashboardAlerts(data) {
  let isAlertActive = false;
  
  // Active Power Overload Draw Warning (> MaxPower threshold)
  if (data.power > alertThresholds.maxPower) {
    triggerCardAlert('powerCard', true);
    addAlertLog("OVERLOAD", `Active Power draw is ${data.power.toFixed(0)}W, exceeding safety threshold limit of ${alertThresholds.maxPower}W.`);
    isAlertActive = true;
  } else {
    triggerCardAlert('powerCard', false);
  }
  
  // Voltage Over-voltage / Under-voltage checking
  if (data.voltage < alertThresholds.minVoltage) {
    triggerCardAlert('voltageCard', true);
    addAlertLog("UNDER-VOLTAGE", `Line voltage fell to ${data.voltage.toFixed(1)}V (threshold: < ${alertThresholds.minVoltage}V). Potential sag hazard.`);
    isAlertActive = true;
  } else if (data.voltage > alertThresholds.maxVoltage) {
    triggerCardAlert('voltageCard', true);
    addAlertLog("OVER-VOLTAGE", `Line voltage rose to ${data.voltage.toFixed(1)}V (threshold: > ${alertThresholds.maxVoltage}V). Potential surge hazard.`);
    isAlertActive = true;
  } else {
    triggerCardAlert('voltageCard', false);
  }
  
  // Poor Power Factor Check (< minPf threshold)
  if (data.power_factor < alertThresholds.minPf) {
    triggerCardAlert('pfCard', true);
    addAlertLog("LOW POWER FACTOR", `PF fell to ${data.power_factor.toFixed(2)}, below efficiency lower-limit of ${alertThresholds.minPf}. Power flow contains high inductive losses.`);
    isAlertActive = true;
  } else {
    triggerCardAlert('pfCard', false);
  }
}

// UI trigger for alert card visuals
function triggerCardAlert(cardId, activate) {
  const card = elements[cardId];
  if (activate) {
    if (!card.classList.contains('alert-pulse')) {
      card.classList.add('alert-pulse');
      card.style.borderColor = 'var(--accent-danger)';
    }
  } else {
    card.classList.remove('alert-pulse');
    card.style.borderColor = 'var(--border-color)';
  }
}

// Add an entry into the sidebar Alert Logs panel
let activeAlerts = {};
function addAlertLog(type, message) {
  // Prevent flooding: only add if alert has not been triggered in the last 15 seconds
  const now = Date.now();
  if (activeAlerts[type] && (now - activeAlerts[type] < 15000)) {
    return;
  }
  activeAlerts[type] = now;
  
  // Play System alert audio notification
  elements.alertSound.play().catch(() => {});
  
  // Native System Web Notification
  if (Notification.permission === 'granted') {
    new Notification(`Aether Energy Alert: ${type}`, {
      body: message,
      icon: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-200.wav'
    });
  }

  // Clear "System Operational" placeholder if present
  const empty = elements.alertsLogContainer.querySelector('.empty-alerts');
  if (empty) {
    elements.alertsLogContainer.innerHTML = '';
  }
  
  // Construct Log Node
  const time = new Date().toLocaleTimeString();
  const alertNode = document.createElement('div');
  alertNode.className = `alert-item ${type === 'SECURITY' ? 'warning' : ''}`;
  alertNode.innerHTML = `
    <div class="alert-item-header">
      <h4 style="color: ${type === 'SECURITY' ? 'var(--accent-primary)' : 'var(--accent-danger)'}">${type}</h4>
      <span class="alert-time">${time}</span>
    </div>
    <p>${message}</p>
  `;
  
  elements.alertsLogContainer.insertBefore(alertNode, elements.alertsLogContainer.firstChild);
}

// --- loadChart visualizations rendering ---
function renderChart() {
  if (historicalData.length === 0) return;
  
  const ctx = elements.loadChartCanvas.getContext('2d');
  
  // Prep Labels
  const labels = historicalData.map((d, index) => {
    if (d.timestamp) {
      const time = new Date(d.timestamp);
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return `pt-${index}`;
  });

  const isDarkMode = document.body.classList.contains('dark-mode');
  const fontColor = isDarkMode ? '#a7a295' : '#5e5e5e';
  const gridColor = isDarkMode ? '#383834' : '#e5dec9';

  // Destroy previous instance
  if (chartsInstance) {
    chartsInstance.destroy();
  }

  let datasets = [];
  
  if (selectedTab === 'liveStream') {
    // Real-time Power waves
    datasets = [{
      label: 'Active Power (Watts)',
      data: historicalData.map(d => d.power),
      borderColor: '#d97706',
      backgroundColor: 'rgba(217, 119, 6, 0.05)',
      fill: true,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 2,
      pointBackgroundColor: '#d97706'
    }];
  } else {
    // 24-Hour Load Analysis (combining Voltage and Current on dual axis)
    datasets = [
      {
        label: 'Voltage (V)',
        data: historicalData.map(d => d.voltage),
        borderColor: '#2563eb',
        borderWidth: 2,
        tension: 0.2,
        yAxisID: 'yVoltage',
        pointRadius: 0
      },
      {
        label: 'Current (A)',
        data: historicalData.map(d => d.current),
        borderColor: '#7c3aed',
        borderWidth: 2,
        tension: 0.2,
        yAxisID: 'yCurrent',
        pointRadius: 0
      }
    ];
  }

  chartsInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            font: { family: 'Outfit', size: 12 },
            color: fontColor
          }
        }
      },
      scales: selectedTab === 'liveStream' ? {
        x: {
          grid: { color: gridColor },
          ticks: { color: fontColor, font: { size: 10 } }
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: fontColor, font: { size: 10 } },
          title: { display: true, text: 'Watts', color: fontColor }
        }
      } : {
        x: {
          grid: { color: gridColor },
          ticks: { color: fontColor, font: { size: 10 } }
        },
        yVoltage: {
          type: 'linear',
          position: 'left',
          grid: { color: gridColor },
          ticks: { color: '#2563eb', font: { size: 10 } },
          title: { display: true, text: 'Voltage (V)', color: '#2563eb' },
          min: 150,
          max: 270
        },
        yCurrent: {
          type: 'linear',
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: { color: '#7c3aed', font: { size: 10 } },
          title: { display: true, text: 'Current (Amps)', color: '#7c3aed' },
          min: 0,
          max: 20
        }
      }
    }
  });
}

function updateChartStyling() {
  if (!chartsInstance) return;
  const isDarkMode = document.body.classList.contains('dark-mode');
  const fontColor = isDarkMode ? '#a7a295' : '#5e5e5e';
  const gridColor = isDarkMode ? '#383834' : '#e5dec9';
  
  chartsInstance.options.plugins.legend.labels.color = fontColor;
  
  if (selectedTab === 'liveStream') {
    chartsInstance.options.scales.x.grid.color = gridColor;
    chartsInstance.options.scales.x.ticks.color = fontColor;
    chartsInstance.options.scales.y.grid.color = gridColor;
    chartsInstance.options.scales.y.ticks.color = fontColor;
    chartsInstance.options.scales.y.title.color = fontColor;
  } else {
    chartsInstance.options.scales.x.grid.color = gridColor;
    chartsInstance.options.scales.x.ticks.color = fontColor;
    chartsInstance.options.scales.yVoltage.grid.color = gridColor;
  }
  chartsInstance.update();
}

// --- Claude AI Chat Interface Logic ---
function handleChatSubmission() {
  const text = elements.chatInput.value.trim();
  if (!text) return;
  
  // Append User message to bubble container
  addChatMessage(text, 'user');
  elements.chatInput.value = '';
  
  // Resize chat input
  elements.chatInput.rows = 1;
  
  // Simulate assistant thinking & response
  simulateAssistantResponse(text);
}

// Append chat message to the panel
function addChatMessage(text, sender) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  
  const icon = sender === 'user' ? 'user' : 'sparkles';
  bubble.innerHTML = `
    <div class="avatar-sm"><i data-lucide="${icon}"></i></div>
    <div class="message-content">
      <p>${text}</p>
    </div>
  `;
  elements.chatConversation.appendChild(bubble);
  lucide.createIcons();
  
  // Scroll Conversation to bottom
  elements.chatConversation.scrollTop = elements.chatConversation.scrollHeight;
}

// Simulate Claude AI intelligent Energy Assistant response
function simulateAssistantResponse(prompt) {
  // Append "Claude is thinking..." typewriter block
  const thinkingBubble = document.createElement('div');
  thinkingBubble.className = "chat-bubble assistant";
  thinkingBubble.id = "thinkingIndicator";
  thinkingBubble.innerHTML = `
    <div class="avatar-sm"><i data-lucide="sparkles"></i></div>
    <div class="message-content">
      <p><em>Thinking...</em></p>
    </div>
  `;
  elements.chatConversation.appendChild(thinkingBubble);
  lucide.createIcons();
  elements.chatConversation.scrollTop = elements.chatConversation.scrollHeight;

  // Simulate thinking duration
  setTimeout(() => {
    elements.chatConversation.removeChild(thinkingBubble);
    
    // Parse response
    const answer = generateAssistantBrainAnswer(prompt);
    
    // Append actual response
    const responseBubble = document.createElement('div');
    responseBubble.className = "chat-bubble assistant";
    responseBubble.innerHTML = `
      <div class="avatar-sm"><i data-lucide="sparkles"></i></div>
      <div class="message-content">
        ${answer}
      </div>
    `;
    elements.chatConversation.appendChild(responseBubble);
    lucide.createIcons();
    elements.chatConversation.scrollTop = elements.chatConversation.scrollHeight;
  }, 1000);
}

// Core expert systems chatbot router: resolves queries using live values
function generateAssistantBrainAnswer(prompt) {
  const p = prompt.toLowerCase();
  
  // Fail-safe readings checking
  const voltVal = latestReading ? latestReading.voltage : 230.2;
  const currentVal = latestReading ? latestReading.current : 2.45;
  const powerVal = latestReading ? latestReading.power : 564.0;
  const energyVal = latestReading ? latestReading.energy : 12.35;
  const pfVal = latestReading ? latestReading.power_factor : 0.82;
  const freqVal = latestReading ? latestReading.frequency : 50.0;

  // 1. Optimize Power Factor Query
  if (p.includes('pf') || p.includes('power factor') || p.includes('optimize') || p.includes('factor')) {
    let pfQuality = "Good";
    let recommendation = "Your power factor is excellent. Keep doing what you are doing! Your resistive loads dominate your power flow, meaning minimal line wastage.";
    
    if (pfVal < 0.70) {
      pfQuality = "Highly Inefficient (Severe lag)";
      recommendation = `With a PF of only <strong>${pfVal.toFixed(2)}</strong>, your line suffers heavy reactive losses (typically caused by heavy inductors running empty, like ceiling fans, old compressors, or motors). You should install run capacitors or turn off idle inductive machines to bring this closer to the 0.95 ideal.`;
    } else if (pfVal < 0.90) {
      pfQuality = "Moderate (Average lag)";
      recommendation = `With a PF of <strong>${pfVal.toFixed(2)}</strong>, there is some inductive lag. This is common in residential homes running multiple HVAC systems or water pumps. You can optimize this by using modern energy-star inverter-grade appliances.`;
    }

    return `
      <p><strong>Power Factor Efficiency Audit:</strong></p>
      <p>Your current Power Factor is <strong>${pfVal.toFixed(2)}</strong>, which is classified as <strong>${pfQuality}</strong>.</p>
      <p>${recommendation}</p>
      <p><em>Fact: A low power factor doesn't always cost residential users directly because standard meters only bill active power (kWh), but it strains local wiring, causes heat losses, and is heavily penalized by utility companies on commercial properties!</em></p>
    `;
  }
  
  // 2. Voltage Safety & Stability Query
  if (p.includes('voltage') || p.includes('safe') || p.includes('stable') || p.includes('line')) {
    let status = "Stable";
    let desc = "Your voltage is perfectly within the safe nominal range of 220V - 240V AC. Your appliances are operating under standard electrical parameters.";
    
    if (voltVal < 200) {
      status = "Under-Voltage Warning";
      desc = `Your voltage is running low at <strong>${voltVal.toFixed(1)}V</strong>. Sags can occur during peak neighborhood grid loads. Prolonged under-voltage can cause compressor motors (like refrigerators/ACs) to stall and overheat. Monitor this closely.`;
    } else if (voltVal > 250) {
      status = "Over-Voltage Warning";
      desc = `Your voltage is running high at <strong>${voltVal.toFixed(1)}V</strong>. High line voltages can stress power supplies, shorten incandescent bulb life, and cause electronic regulators to overheat. A stabilizer is recommended if this persists.`;
    }

    return `
      <p><strong>Line Voltage Safety Audit:</strong></p>
      <p>Active Reading: <strong>${voltVal.toFixed(1)} Volts</strong><br>
      Status: <strong style="color: ${status === 'Stable' ? 'var(--accent-success)' : 'var(--accent-danger)'}">${status}</strong></p>
      <p>${desc}</p>
    `;
  }
  
  // 3. Summarize Power Draw / Estimations
  if (p.includes('summarize') || p.includes('usage') || p.includes('power') || p.includes('cost') || p.includes('estimate')) {
    const dailyEstKwh = (powerVal * 24) / 1000;
    const estRate = 8.5; // Average cost unit in local currency
    const dailyCost = dailyEstKwh * estRate;
    const monthlyCost = dailyCost * 30;

    return `
      <p><strong>Load Usage & Cost Estimation Audit:</strong></p>
      <p>Here is your telemetry breakdown:</p>
      <ul>
        <li><strong>Current Real-time Load:</strong> ${powerVal.toFixed(1)} Watts</li>
        <li><strong>Active Current Draw:</strong> ${currentVal.toFixed(3)} Amps</li>
        <li><strong>Total Cumulative Billing:</strong> ${energyVal.toFixed(3)} kWh</li>
      </ul>
      <p><strong>Projected Cost Estimates:</strong><br>
      Assuming this constant load draw at an average rate of <strong>$${estRate.toFixed(2)}/kWh</strong>:</p>
      <ul>
        <li><strong>24-Hour consumption:</strong> ${dailyEstKwh.toFixed(2)} kWh (~$${dailyCost.toFixed(2)})</li>
        <li><strong>30-Day monthly bill projection:</strong> ${(dailyEstKwh * 30).toFixed(0)} kWh (~$${monthlyCost.toFixed(2)})</li>
      </ul>
      <p><em>Recommendation: To lower your bill, target appliances drawing high current (Amps). Heating elements, water boilers, and HVAC units are prime targets for energy conservation scheduling.</em></p>
    `;
  }
  
  // 4. Technology Stack Explanation
  if (p.includes('tech') || p.includes('work') || p.includes('esp8266') || p.includes('pzem') || p.includes('setup') || p.includes('how')) {
    return `
      <p><strong>System Technology Architecture:</strong></p>
      <p>Your Smart Energy Monitor works through a synchronized three-part telemetry stream:</p>
      <ol>
        <li><strong>Hardware layer:</strong> The <strong>PZEM-004T</strong> physical sensor clamps around your AC line to sample Voltage and Current. It computes active calculations and sends them via SoftwareSerial to the <strong>ESP8266</strong>.</li>
        <li><strong>Streaming layer:</strong> The <strong>ESP8266 NodeMCU</strong> runs our custom firmware. Every 10 seconds, it launches a secure HTTPS PUT request directly to your <strong>Firebase Realtime Database</strong> endpoint, updating the <code>latest</code> node in 0ms, and posts to <code>history</code>.</li>
        <li><strong>Presentation layer:</strong> This <strong>Claude AI Dashboard</strong> is deployed serverless. It uses lightweight Realtime event listeners to receive data packets, plotting live lines via Chart.js and driving our local virtual auditor brain!</li>
      </ol>
    `;
  }
  
  // 5. Default Fallback response
  return `
    <p>I hear you! I am analyzing your live parameters:<br>
    <strong>Voltage:</strong> ${voltVal.toFixed(1)}V | <strong>Load:</strong> ${powerVal.toFixed(1)}W | <strong>Power Factor:</strong> ${pfVal.toFixed(2)}</p>
    <p>I can help you audit your Power Factor, analyze AC Line Voltage Safety, calculate estimated bills, or explain how your physical PZEM-004T and ESP8266 microchips are structured. Ask me anything about these areas!</p>
  `;
}
