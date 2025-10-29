# 🏥 Health Status Dashboard

## Übersicht
Der neue Health Status Abschnitt in den Einstellungen zeigt den aktuellen Zustand der Datenbankverbindung und des Systems an.

## 🎯 Features

### **System Status**
- ✅ **Healthy/Unhealthy** Status mit visuellen Indikatoren
- 🕒 **Letzte Aktualisierung** Zeitstempel
- 🔄 **Auto-Refresh** alle 10 Sekunden (optional)

### **Datenbank Status**
- 🗄️ **Verbindungsstatus** (Verbunden/Getrennt)
- 📊 **Connection Statistics** (Aktive/Gesamte Verbindungen)
- ❌ **Fehlerzähler** bei Verbindungsproblemen

### **System Metriken**
- ⏱️ **Laufzeit** (Tage, Stunden, Minuten)
- 💾 **Speicherverbrauch** (Heap Used/Total)
- 🔗 **Aktive Verbindungen** im Pool

## 🎨 UI/UX

### **Farbkodierung**
- 🟢 **Grün**: Alles OK (Healthy, Verbunden)
- 🔴 **Rot**: Probleme (Unhealthy, Getrennt)
- 🔵 **Blau**: Info/Neutral

### **Icons**
- ✅ `bi-check-circle-fill`: System OK
- ⚠️ `bi-exclamation-triangle-fill`: System Probleme
- 🗄️ `bi-database`: Datenbank Status
- ⏱️ `bi-clock`: Laufzeit
- 💾 `bi-memory`: Speicher
- 🔗 `bi-activity`: Verbindungen

## 🔧 Bedienung

### **Manuelle Aktualisierung**
```javascript
refreshHealthStatus() // Lädt aktuellen Status
```

### **Auto-Refresh**
```javascript
toggleAutoRefresh() // Startet/Stoppt Auto-Refresh (10s)
```

### **Automatisches Laden**
- Wird automatisch geladen beim Wechsel zum "Einstellungen" Tab
- Lädt sich selbst bei Tab-Wechsel neu

## 📊 API Integration

### **Health Endpoint**
```bash
GET /api/health
```

### **Response Format**
```json
{
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z",
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

## 🚀 Verwendung

### **1. Admin-Interface öffnen**
```
http://localhost:3000/admin
```

### **2. Einstellungen Tab wählen**
- Klicke auf "Einstellungen" Tab
- Health Status wird automatisch geladen

### **3. Auto-Refresh aktivieren**
- Klicke auf "Auto-Refresh" Button
- Status wird alle 10 Sekunden aktualisiert

### **4. Manuelle Aktualisierung**
- Klicke auf "Aktualisieren" Button
- Sofortige Status-Aktualisierung

## 🔍 Troubleshooting

### **"Verbindung zum Server fehlgeschlagen"**
- Prüfe ob Server läuft: `pm2 status`
- Prüfe Port: `netstat -tlnp | grep 3000`

### **"Datenbank Getrennt"**
- Prüfe Datenbankverbindung
- Prüfe `.env` Datei
- Prüfe Server Logs: `pm2 logs getraenkekarte`

### **Auto-Refresh funktioniert nicht**
- Prüfe Browser-Konsole auf JavaScript-Fehler
- Prüfe ob Tab aktiv ist (Browser pausiert Timer bei inaktiven Tabs)

## 📈 Monitoring

### **Wichtige Metriken**
1. **Database Status**: Sollte immer "Verbunden" sein
2. **Connection Stats**: Aktive Verbindungen sollten > 0 sein
3. **Failed Connections**: Sollte 0 bleiben
4. **Memory Usage**: Sollte stabil bleiben
5. **Uptime**: Zeigt Stabilität der Anwendung

### **Alerts**
- 🔴 **Database Getrennt**: Sofortige Aufmerksamkeit erforderlich
- 🟡 **Failed Connections > 0**: Überwachen, könnte auf Probleme hinweisen
- 🟡 **Memory Usage hoch**: Möglicherweise Memory Leak

## 🎯 Nächste Schritte

1. **Email Alerts**: Bei kritischen Problemen
2. **Historical Data**: Verlauf der Metriken
3. **Performance Metrics**: Response Times, etc.
4. **Mobile View**: Optimierung für mobile Geräte

---

**Implementiert**: 2024-01-15  
**Version**: 3.8.5+  
**Status**: ✅ Produktionsreif
