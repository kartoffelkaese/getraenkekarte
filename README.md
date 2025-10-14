# Getränkekarte System

Ein modernes, webbasiertes Getränkekarten-System mit Echtzeit-Updates, Admin-Interface und Fernsteuerung für digitale Displays.

## 🚀 Features

### 📱 Digitale Getränkekarten
- **Haupttheke** - Vollständige Getränkekarte mit Kategorien
- **Theke Hinten** - Spezielle Karte für hintere Theke
- **Theke Hinten Bilder** - Bildergalerie für hintere Theke
- **Jugendkarte** - Altersgerechte Getränkeauswahl
- **Speisekarte** - Speisen und Menüs
- **Bilder** - Historische Bildergalerie

### 🔄 Cycle-System
- **Automatische Rotation** zwischen Haupttheke und Jugendkarte
- **Konfigurierbare Zeiten** für Standard- und Jugend-Cycle
- **Fernsteuerung** über Admin-Interface
- **Brightsign Player** kompatibel mit Cache-Bypass

### 🎛️ Overview-Karten
- **2 unabhängige Overview-Karten** (overview-1, overview-2)
- **Fernsteuerung** der angezeigten Karte
- **Dropdown-Auswahl** im Admin-Interface
- **Echtzeit-Updates** ohne Seitenreload

### 💰 Temporäre Preis-Overrides
- **Dynamische Preisänderungen** ohne Datenbankzugriff
- **Aktivierung/Deaktivierung** per Toggle
- **Sofortige Anzeige** auf Theke-Hinten Karten
- **JSON-basierte Konfiguration**

### 🛠️ Admin-Interface
- **Vollständige Getränkeverwaltung** (CRUD-Operationen)
- **Kategorie-Management** mit Drag & Drop
- **Bild-Upload** und -Verwaltung
- **Karten-Export** als PNG (1920x1080px)
- **Echtzeit-Monitoring** aller Displays
- **Fernsteuerung** aller Funktionen

### 🔧 Technische Features
- **Socket.IO** für Echtzeit-Kommunikation
- **MySQL-Datenbank** für Getränkedaten
- **Puppeteer** für Karten-Export
- **Responsive Design** für alle Bildschirmgrößen
- **Basic Auth** für Admin-Zugang

## 📋 Systemanforderungen

- **Node.js** >= 22.16.0
- **npm** >= 11.4.2
- **MySQL** Datenbank
- **Chrome/Chromium** (für Puppeteer)

## 🚀 Installation

### 1. Repository klonen
```bash
git clone <repository-url>
cd getraenkekarte
```

### 2. Abhängigkeiten installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
Erstellen Sie eine `.env` Datei:
```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=getraenkekarte
ADMIN_USER=admin
ADMIN_PASSWORD=your_admin_password
PORT=3000
```

### 4. Server starten
```bash
# Entwicklung
npm run dev

# Produktion
npm start

# Externe IP (für Brightsign Player)
npm run ext
```

## 📱 Verfügbare Seiten

### Öffentliche Karten
- `/` - Haupttheke
- `/theke-hinten` - Theke Hinten
- `/theke-hinten-bilder` - Theke Hinten Bilder
- `/jugendliche` - Jugendkarte
- `/speisekarte` - Speisekarte
- `/bilder` - Bildergalerie

### Cycle-Seiten
- `/cycle` - Standard Cycle (Haupttheke ↔ Jugendkarte)
- `/cycle-jugend` - Jugend Cycle (Jugendkarte ↔ Haupttheke)

### Overview-Karten
- `/overview-1` - Fernsteuerbare Overview-Karte 1
- `/overview-2` - Fernsteuerbare Overview-Karte 2

### Admin-Interface
- `/admin` - Vollständiges Admin-Interface

## 🎛️ Admin-Interface Tabs

### 🍺 Getränke
- Getränke hinzufügen, bearbeiten, löschen
- Kategorien verwalten
- Preise und Beschreibungen anpassen
- Bild-Upload für Getränke

### 🏷️ Kategorien
- Kategorien verwalten und bearbeiten
- Neue Kategorien erstellen
- Kategorien löschen

### 🖼️ Bilder
- Bild-Upload und -Verwaltung
- Bildergalerie verwalten

### 🔄 Cycle
- **Standard Cycle**: Haupttheke ↔ Jugendkarte
- **Jugend Cycle**: Jugendkarte ↔ Haupttheke
- **Anzeigedauer** konfigurierbar (Sekunden)
- **Fernsteuerung** für sofortige Updates

### 💰 Temporäre Preise
- **Preis-Overrides** für Theke-Hinten Karten
- **Aktivierung/Deaktivierung** per Toggle
- **Einzelne Getränke** überschreiben
- **Sofortige Anzeige** ohne Datenbankänderung

### 🎯 Overview
- **Overview-1** und **Overview-2** konfigurieren
- **Kartenauswahl** per Dropdown
- **Fernsteuerung** der angezeigten Karte
- **Remote Reload** bei Änderungen

### 📤 Export
- **Alle Karten** als PNG exportieren
- **Einzelne Karten** exportieren
- **1920x1080px** Auflösung
- **Automatischer Download**

## 🔧 API-Endpunkte

### Getränke
- `GET /api/drinks/:location` - Getränke für Standort abrufen
- `POST /api/drinks` - Neues Getränk erstellen
- `PUT /api/drinks/:id` - Getränk aktualisieren
- `DELETE /api/drinks/:id` - Getränk löschen

### Kategorien
- `GET /api/categories` - Alle Kategorien abrufen
- `POST /api/categories` - Neue Kategorie erstellen
- `PUT /api/categories/:id` - Kategorie aktualisieren
- `DELETE /api/categories/:id` - Kategorie löschen
- `PUT /api/categories/reorder` - Kategorie-Reihenfolge ändern

### Cycle-Konfiguration
- `GET /api/cycle-config` - Cycle-Zeiten abrufen
- `POST /api/cycle-config` - Cycle-Zeiten speichern

### Preis-Overrides
- `GET /api/price-overrides/:location` - Preis-Overrides abrufen
- `POST /api/price-overrides/:location` - Preis-Overrides speichern
- `DELETE /api/price-overrides/:location` - Preis-Overrides löschen

### Overview-Konfiguration
- `GET /api/overview-config/:overview` - Overview-Konfiguration abrufen
- `POST /api/overview-config/:overview` - Overview-Konfiguration speichern

### Export
- `POST /api/export/all` - Alle Karten exportieren
- `POST /api/export/:card` - Einzelne Karte exportieren

### Version
- `GET /api/version` - Aktuelle Version abrufen

## 🔄 Socket.IO Events

### Server → Client
- `drinksUpdated` - Getränke wurden aktualisiert
- `categoriesUpdated` - Kategorien wurden aktualisiert
- `cycleConfigChanged` - Cycle-Konfiguration geändert
- `priceOverridesChanged` - Preis-Overrides geändert
- `overviewConfigChanged` - Overview-Konfiguration geändert
- `forceCycleReload` - Cycle-Seiten neu laden
- `forceOverviewReload` - Overview-Seiten neu laden
- `forceThekeHintenReload` - Theke-Hinten Seiten neu laden

### Client → Server
- `forceCycleReload` - Cycle-Reload anfordern
- `forceOverviewReload` - Overview-Reload anfordern
- `forceThekeHintenReload` - Theke-Hinten Reload anfordern


## 🎯 Verwendung

### Für Gastronomie
1. **Getränke verwalten** über Admin-Interface
2. **Kategorien organisieren** per Drag & Drop
3. **Preise anpassen** in Echtzeit
4. **Cycle-Zeiten** für automatische Rotation
5. **Overview-Karten** für flexible Anzeige

### Für Techniker
1. **Brightsign Player** konfigurieren
2. **Netzwerk-Einstellungen** anpassen
3. **Cache-Probleme** mit Reload-Funktionen lösen
4. **Monitoring** über Admin-Interface