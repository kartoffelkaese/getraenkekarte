# Health Status Dashboard

## Übersicht

Der Health-Status im Admin zeigt den aktuellen Zustand der Datenbankverbindung und grundlegende Systemmetriken an.

**Ort im Admin:** **System → Status & Reload** (`#/system/status`)

Implementierung: [`public/js/admin/health.js`](public/js/admin/health.js)  
Backend: [`src/routes/health.js`](src/routes/health.js)

## Features

### System Status

- **Healthy / Unhealthy** mit visuellen Indikatoren
- Zeitstempel der letzten Aktualisierung
- Optionaler **Auto-Refresh** alle 10 Sekunden

### Datenbank Status

- Verbindungsstatus (Verbunden / Getrennt)
- Connection Statistics aus dem DB-Pool
- Fehlerzähler bei Verbindungsproblemen

### System Metriken

- Laufzeit (Uptime)
- Speicherverbrauch (`heapUsed` / `heapTotal`)
- Aktive Verbindungen im Pool

## Bedienung

### Manuelle Aktualisierung

```javascript
refreshHealthStatus()
```

### Auto-Refresh

```javascript
toggleAutoRefresh()  // Intervall: 10 Sekunden
```

Der Status wird automatisch geladen, wenn die Seite **Status & Reload** geöffnet wird.

## API

### Endpoint

```bash
GET /api/health
```

### Response (healthy)

```json
{
    "status": "healthy",
    "database": "connected",
    "timestamp": "2026-07-07T10:30:00.000Z",
    "uptime": 3600,
    "memory": {
        "heapUsed": 50000000,
        "heapTotal": 100000000
    },
    "connectionStats": {
        "totalConnections": 5,
        "activeConnections": 3,
        "failedConnections": 0,
        "lastError": null,
        "lastErrorTime": null
    }
}
```

### Response (unhealthy)

HTTP **503** mit `"status": "unhealthy"` und `"database": "disconnected"`.  
In Nicht-Produktionsumgebungen enthält die Antwort zusätzlich `error` mit der Fehlermeldung.

## Verwendung

1. Admin öffnen: `http://localhost:3000/admin`
2. **System → Status & Reload** wählen
3. Optional **Auto-Refresh** aktivieren
4. Bei Bedarf **Aktualisieren** klicken

## Troubleshooting

### „Verbindung zum Server fehlgeschlagen“

- Server läuft? `pm2 status` oder `npm run dev`
- Port erreichbar? `curl http://localhost:3000/api/health`

### „Datenbank Getrennt“

- `.env`-Datenbankzugang prüfen
- MySQL-Dienst und Netzwerk prüfen
- Logs: `pm2 logs getraenkekarte`
- Details: [DATABASE-RESILIENCE.md](DATABASE-RESILIENCE.md)

### Auto-Refresh pausiert

Browser drosseln Timer in inaktiven Tabs – Tab aktiv lassen oder manuell aktualisieren.

## Wichtige Metriken

| Metrik | Erwartung |
|--------|-----------|
| Database Status | „Verbunden“ |
| Active Connections | > 0 bei laufendem Betrieb |
| Failed Connections | Sollte 0 bleiben |
| Memory Usage | Stabil über Zeit |
| Uptime | Steigend ohne unerwartete Resets |

## Hinweise

- Der Health-Check führt `SELECT 1` aus – er testet die echte DB-Verbindung, nicht nur den Prozessstatus.
- `connectionStats` kommt aus dem MySQL-Pool in [`src/db/pool.js`](src/db/pool.js).
- Für produktives Monitoring kann `/api/health` extern abgefragt werden (z. B. Uptime-Robot, PM2, Health-Monitor-Script).

---

**Stand:** 2026-07-07  
**Version:** 4.3.1
