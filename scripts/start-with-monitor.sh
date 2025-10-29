#!/bin/bash

# Start Script für Getränkekarte mit Health Monitor
# Verwendung: ./scripts/start-with-monitor.sh

echo "🚀 Starte Getränkekarte mit Health Monitor..."

# Prüfe ob PM2 installiert ist
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 ist nicht installiert. Bitte installiere PM2:"
    echo "npm install -g pm2"
    exit 1
fi

# Prüfe ob Node.js installiert ist
if ! command -v node &> /dev/null; then
    echo "❌ Node.js ist nicht installiert"
    exit 1
fi

# Erstelle scripts Verzeichnis falls nicht vorhanden
mkdir -p scripts

# Mache health-monitor.js ausführbar
chmod +x scripts/health-monitor.js

# Starte die Hauptanwendung
echo "📱 Starte Hauptanwendung..."
pm2 start ecosystem.config.js

# Warte 10 Sekunden
echo "⏳ Warte 10s bis Anwendung gestartet ist..."
sleep 10

# Starte Health Monitor
echo "🔍 Starte Health Monitor..."
pm2 start scripts/health-monitor.js --name "health-monitor"

# Zeige Status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Getränkekarte mit Health Monitor gestartet!"
echo "🌐 Anwendung: http://localhost:3000"
echo "💚 Health Check: http://localhost:3000/api/health"
echo "📋 Logs anzeigen: pm2 logs"
echo "🛑 Stoppen: pm2 stop all"
