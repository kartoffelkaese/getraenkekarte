# 🛡️ Datenbank-Resilience für Getränkekarte

## Problem
Die Anwendung verlor gelegentlich die Verbindung zur MySQL-Datenbank mit folgenden Fehlern:
- `Connection lost: The server closed the connection`
- `ECONNREFUSED 188.68.47.22:3306`
- `Can't add new command when connection is in closed state`

## ✅ Lösung implementiert

### 1. Connection Pool statt einzelner Verbindung
```javascript
// Vorher: Einzelne Verbindung
const db = mysql.createConnection({...}).promise();

// Nachher: Connection Pool mit Auto-Reconnect
const db = mysql.createPool({
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    retryDelay: 2000,
    maxRetries: 3,
    connectTimeout: 10000
}).promise();
```

### 2. Sichere Datenbankabfragen mit Retry
```javascript
async function safeQuery(sql, params = []) {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
        try {
            return await db.query(sql, params);
        } catch (error) {
            // Retry bei Verbindungsfehlern
            if (error.code === 'ECONNREFUSED' || 
                error.code === 'PROTOCOL_CONNECTION_LOST' || 
                error.message.includes('connection is in closed state')) {
                
                if (retries < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retries * 1000));
                    retries++;
                    continue;
                }
            }
            throw error;
        }
    }
}
```

### 3. Health Check Endpoint
```bash
GET /api/health
```
**Response (Healthy):**
```json
{
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "uptime": 3600,
    "memory": {...},
    "connectionStats": {
        "totalConnections": 5,
        "activeConnections": 3,
        "failedConnections": 0,
        "lastError": null,
        "lastErrorTime": null
    }
}
```

### 4. Automatisches Monitoring
- **Heartbeat alle 5 Minuten**: Testet Datenbankverbindung
- **Connection Stats**: Überwacht Verbindungsstatistiken
- **Automatischer Restart**: Bei wiederholten Fehlern

### 5. PM2 Health Monitor
```bash
# Starte mit Health Monitor
./scripts/start-with-monitor.sh

# Oder manuell
pm2 start ecosystem.config.js
pm2 start scripts/health-monitor.js --name "health-monitor"
```

## 🔧 Konfiguration

### Umgebungsvariablen
```env
DB_HOST=188.68.47.22
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=getraenkekarte
DB_SSL=false  # Optional: SSL für Datenbankverbindung
```

### PM2 Konfiguration
```javascript
// ecosystem.config.js
{
    name: 'getraenkekarte',
    script: 'src/index.js',
    instances: 1,
    autorestart: true,
    max_memory_restart: '128M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000
}
```

## 📊 Monitoring

### Health Check URLs
- **Anwendung**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health
- **Version**: http://localhost:3000/api/version

### PM2 Befehle
```bash
# Status anzeigen
pm2 status

# Logs anzeigen
pm2 logs

# Spezifische App
pm2 logs getraenkekarte
pm2 logs health-monitor

# Restart
pm2 restart getraenkekarte

# Stoppen
pm2 stop all
```

### Log-Dateien
- `./logs/combined.log` - Alle Logs
- `./logs/out.log` - Standard Output
- `./logs/error.log` - Fehler-Logs

## 🚀 Deployment

### 1. Normale Installation
```bash
npm install
npm start
```

### 2. Mit Health Monitor
```bash
chmod +x scripts/start-with-monitor.sh
./scripts/start-with-monitor.sh
```

### 3. PM2 Setup
```bash
# PM2 installieren
npm install -g pm2

# Anwendung starten
pm2 start ecosystem.config.js

# Auto-Start bei System-Reboot
pm2 startup
pm2 save
```

## 🔍 Troubleshooting

### Häufige Probleme

#### 1. Datenbankverbindung fehlgeschlagen
```bash
# Prüfe Health Check
curl http://localhost:3000/api/health

# Prüfe PM2 Logs
pm2 logs getraenkekarte
```

#### 2. Health Monitor startet nicht
```bash
# Prüfe Node.js Installation
node --version

# Prüfe Script-Berechtigung
chmod +x scripts/health-monitor.js

# Manuell starten
node scripts/health-monitor.js
```

#### 3. PM2 Probleme
```bash
# PM2 Status
pm2 status

# PM2 Logs
pm2 logs

# PM2 Restart
pm2 restart all
```

## 📈 Verbesserungen

### Vorher vs. Nachher

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| **Verbindung** | Einzelne Connection | Connection Pool |
| **Retry** | Kein Retry | 3x Retry mit Backoff |
| **Monitoring** | Kein Monitoring | Health Check + Stats |
| **Auto-Restart** | Manuell | Automatisch |
| **Logging** | Basic | Strukturiert |
| **Resilience** | ❌ Fragil | ✅ Robust |

### Erwartete Verbesserungen
- ✅ **Keine manuellen Restarts** mehr nötig
- ✅ **Automatische Wiederverbindung** bei Netzwerkproblemen
- ✅ **Proaktives Monitoring** mit Health Checks
- ✅ **Detaillierte Logs** für Debugging
- ✅ **Graceful Recovery** bei temporären Ausfällen

## 🎯 Nächste Schritte

1. **Monitoring Dashboard**: Web-Interface für Health Stats
2. **Alerting**: E-Mail/Slack Benachrichtigungen bei Problemen
3. **Metrics**: Prometheus/Grafana Integration
4. **Load Balancing**: Mehrere App-Instanzen
5. **Database Clustering**: MySQL Master-Slave Setup

---

**Implementiert am**: 2024-01-15  
**Version**: 3.8.5+  
**Status**: ✅ Produktionsreif
