# Datenbank-Resilience für Getränkekarte

## Problem

Die Anwendung verlor gelegentlich die Verbindung zur MySQL-Datenbank mit Fehlern wie:

- `Connection lost: The server closed the connection`
- `ECONNREFUSED`
- `Can't add new command when connection is in closed state`

## Lösung

Implementiert in [`src/db/pool.js`](src/db/pool.js).

### 1. Connection Pool statt einzelner Verbindung

```javascript
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    connectTimeout: 10000,
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
};

const db = mysql.createPool(dbConfig).promise();
```

### 2. Sichere Abfragen mit Retry

Die Funktion `safeQuery()` wiederholt fehlgeschlagene Abfragen bis zu **3 Mal** bei Verbindungsfehlern (`ECONNREFUSED`, `PROTOCOL_CONNECTION_LOST`, geschlossene Verbindung), mit steigender Wartezeit (1s, 2s, 3s).

Alle kritischen Datenbankzugriffe in der Anwendung nutzen `safeQuery()` statt direkter Pool-Aufrufe.

### 3. Connection Statistics

Der Pool protokolliert Verbindungsereignisse in `connectionStats`:

```javascript
{
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    lastError: null,
    lastErrorTime: null
}
```

Diese Statistiken werden im Health-Endpoint (`GET /api/health`) ausgeliefert.

### 4. Heartbeat

Alle **5 Minuten** sendet der Server `SELECT 1 as heartbeat`, um die Verbindung aktiv zu halten und Probleme früh zu erkennen.

### 5. Health Check Endpoint

```bash
GET /api/health
```

**Response (healthy):**

```json
{
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-07-07T10:30:00.000Z",
    "uptime": 3600,
    "memory": { "heapUsed": 50000000, "heapTotal": 100000000 },
    "connectionStats": {
        "totalConnections": 5,
        "activeConnections": 3,
        "failedConnections": 0,
        "lastError": null,
        "lastErrorTime": null
    }
}
```

**Response (unhealthy):** HTTP 503 mit `"status": "unhealthy"` und `"database": "disconnected"`.

## Konfiguration

### Umgebungsvariablen

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=getraenkekarte
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=true
```

### PM2

[`ecosystem.config.js`](ecosystem.config.js) startet die App und optional den Health-Monitor:

```bash
# Mit Monitor-Script
chmod +x scripts/start-with-monitor.sh
./scripts/start-with-monitor.sh

# Oder direkt mit PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

PM2-Apps:

| Name | Script |
|------|--------|
| `getraenkekarte` | `src/index.js` |
| `health-monitor` | `scripts/health-monitor.js` |

## Monitoring

### URLs

- Anwendung: `http://localhost:3000`
- Health Check: `http://localhost:3000/api/health`
- Version: `http://localhost:3000/api/version`

### PM2 Befehle

```bash
pm2 status
pm2 logs getraenkekarte
pm2 logs health-monitor
pm2 restart getraenkekarte
```

### Log-Dateien (PM2)

- `./logs/combined.log`
- `./logs/out.log`
- `./logs/error.log`

## Troubleshooting

### Datenbankverbindung fehlgeschlagen

```bash
curl http://localhost:3000/api/health
pm2 logs getraenkekarte
```

Prüfen: `.env`-Werte, MySQL erreichbar, Firewall, SSL-Einstellungen.

### Health Monitor startet nicht

```bash
node --version
chmod +x scripts/health-monitor.js
node scripts/health-monitor.js
```

## Übersicht

| Aspekt | Vorher | Nachher |
|--------|--------|---------|
| Verbindung | Einzelne Connection | Connection Pool (10) |
| Retry | Kein Retry | 3× mit Backoff |
| Monitoring | Keins | Health Check + Stats |
| Heartbeat | Keiner | Alle 5 Minuten |
| Logging | Basic | Strukturierte Pool-Events |

---

**Stand:** 2026-07-07  
**Version:** 4.3.1  
**Implementierung:** [`src/db/pool.js`](src/db/pool.js), [`src/routes/health.js`](src/routes/health.js)
