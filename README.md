# Getränkekarte System

Ein webbasiertes Getränkekarten- und Display-System mit Echtzeit-Updates, Admin-Interface und Fernsteuerung für digitale Displays (z. B. Brightsign Player).

## Features

### Digitale Karten

Alle Anzeige-Karten sind in [`src/config/cards.js`](src/config/cards.js) zentral registriert. Jede Karte hat einen eigenen URL-Slug (`/{slug}`).

**Getränkekarten**

| Slug | Beschreibung |
|------|--------------|
| `haupttheke` | Haupttheke (3 Spalten, Werbung) |
| `italienische-nacht` | Theme-Variante der Haupttheke (Tricolor) |
| `weihnachten` | Weihnachts-Theme der Haupttheke |
| `theke-hinten` | Theke Hinten (3 Spalten) |
| `theke-hinten-2` | Theke Hinten (2 Spalten) |
| `theke-hinten-bilder` | Bildergalerie Theke Hinten |
| `theke-hinten-bilder-dunkel` | Bildergalerie Theke Hinten (dunkel) |
| `jugendliche` | Jugendkarte |
| `weihnachten-jugendliche` | Weihnachts-Theme der Jugendkarte |
| `hochzeit` / `hochzeit-dunkel` | Hochzeitskarten (hell/dunkel) |
| `hochzeit-3spalten` / `hochzeit-dunkel-3spalten` | Hochzeitskarten (3 Spalten) |
| `bilder` | Historische Bildergalerie |

**Speisekarten**

| Slug | Beschreibung |
|------|--------------|
| `speisekarte` | Standard-Speisekarte |
| `weihnachten-speisekarte` | Weihnachts-Theme der Speisekarte |

Theme-Varianten (z. B. Weihnachten) nutzen dieselben Daten wie die Basis-Karte; nur Layout und Styling unterscheiden sich.

### Cycle-System

Zwei unabhängige Cycle-Displays wechseln automatisch zwischen einer **konfigurierbaren Karte** und einer **konfigurierbaren Speisekarte**:

| Slug | Admin-Typ | Standard-Karte | Standard-Speisekarte |
|------|-----------|----------------|----------------------|
| `/cycle-1` | `standard` | Haupttheke | Speisekarte |
| `/cycle-2` | `jugend` | Jugendkarte | Speisekarte |

Konfiguration in [`cycle-config.json`](cycle-config.json) und im Admin unter **Anzeige → Cycle**:

```json
{
  "standard": {
    "card": "haupttheke",
    "speisekarteCard": "speisekarte",
    "firstTime": 30,
    "secondTime": 6
  },
  "jugend": {
    "card": "jugendliche",
    "speisekarteCard": "weihnachten-speisekarte",
    "firstTime": 30,
    "secondTime": 6
  }
}
```

- `card` – Getränke-/Anzeige-Karte (alle Karten außer Meta-Karten und Speisekarten)
- `speisekarteCard` – `speisekarte` oder `weihnachten-speisekarte`
- `firstTime` – Anzeigedauer der gewählten Karte (Sekunden)
- `secondTime` – Anzeigedauer der Speisekarte (Sekunden)

### Schedule-System

Zwei unabhängige Zeitplaner (`schedule-1`, `schedule-2`) wechseln Karten nach Regeln (Datum, Wochentag, Uhrzeit). Konfiguration in `schedule-1-config.json` / `schedule-2-config.json` und im Admin unter **Anzeige → Schedule**.

### Overview-Karten

`overview-1` und `overview-2` zeigen eine per Admin fernsteuerbare Karte. Konfiguration in `overview-config.json`.

### Weitere Funktionen

- Temporäre Preis-Overrides für Theke-Hinten (JSON, ohne DB-Änderung)
- Presets für Karteneinstellungen
- Hochzeitskarten-Schriftgröße konfigurierbar
- Socket.IO für Echtzeit-Updates und Fern-Reload
- MySQL mit Connection Pool und Retry-Logik
- Health-Check unter `/api/health`

## Systemanforderungen

- **Node.js** >= 22.16.0
- **npm** >= 11.4.2
- **MySQL**

## Installation

### 1. Repository klonen

```bash
git clone <repository-url>
cd getraenkekarte
```

### 2. Abhängigkeiten installieren

```bash
npm install
```

### 3. Umgebungsvariablen

`.env` anlegen:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=getraenkekarte
DB_SSL=false
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

# Externe IP (z. B. Brightsign)
npm run ext
```

### Weitere npm-Scripts

```bash
npm test          # Tests ausführen
npm run lint      # ESLint
npm run build:admin  # Admin-Bundle bauen
```

## Verfügbare Seiten

### Start & Admin

- `/` – Redirect zur Haupttheke
- `/admin` – Admin-Interface (Basic Auth)

### Alle Karten

Die vollständige Liste mit URLs steht im Admin unter **System → Links** oder über `GET /api/cards`.

Auszug:

- `/haupttheke`, `/italienische-nacht`, `/weihnachten`
- `/theke-hinten`, `/theke-hinten-2`, `/theke-hinten-bilder`, `/theke-hinten-bilder-dunkel`
- `/jugendliche`, `/weihnachten-jugendliche`
- `/speisekarte`, `/weihnachten-speisekarte`
- `/hochzeit`, `/hochzeit-dunkel`, `/hochzeit-3spalten`, `/hochzeit-dunkel-3spalten`
- `/bilder`, `/screensaver`
- `/cycle-1`, `/cycle-2`
- `/overview-1`, `/overview-2`
- `/schedule-1`, `/schedule-2`

## Admin-Interface

Navigation über Sidebar mit Hash-Routing (`#/karten/haupttheke/logo`, etc.).

| Bereich | Inhalt |
|---------|--------|
| **Karten** | Haupttheke, Theke Hinten, Jugendkarte, Speisekarte, Bilder – jeweils Logo, Kategorien, Getränke, Zusatzstoffe, Werbung |
| **Preise** | Temporäre Preise, Theke-Hinten-Presets |
| **Anzeige** | Schedule 1/2, Cycle 1/2, Overview 1/2 |
| **System** | Status & Reload, Hochzeitskarten, Presets, Links |

## API-Endpunkte

### Karten & Konfiguration

- `GET /api/cards` – Zentrale Kartenliste
- `GET /api/cycle-config` – Cycle-Konfiguration
- `POST /api/cycle-config` – Cycle speichern (`type`, `card`, `speisekarteCard`, `firstTime`, `secondTime`)
- `GET /api/cycle-selectable-cards` – Wählbare Karten für Cycle
- `GET /api/cycle-selectable-speisekarten` – Wählbare Speisekarten für Cycle
- `GET/POST /api/overview-config/:overview` – Overview-Konfiguration
- `GET/POST /api/schedule-config` – Schedule 1
- `GET/POST /api/schedule-2-config` – Schedule 2
- `GET /api/schedule-config/current` – Aktuelle Schedule-1-Karte
- `GET /api/schedule-2-config/current` – Aktuelle Schedule-2-Karte
- `GET/POST /api/hochzeit-config` – Hochzeitskarten-Schriftgröße
- `GET /api/version` – Versionsinfo

### Getränke & Kategorien

- `GET /api/drinks/:location` – Getränke pro Standort
- `GET /api/categories/:location` – Kategorien pro Standort
- Diverse Toggle-/Reorder-Endpunkte für Getränke, Kategorien, Werbung, Logo

### Speisekarte

- `GET /api/dishes` – Alle Gerichte
- `POST/PUT/DELETE /api/dishes` – Gerichte verwalten

### Preise & Presets

- `GET/POST/DELETE /api/price-overrides/:location` – Temporäre Preise
- `GET/POST/DELETE /api/presets/:location` – Presets

### System

- `GET /api/health` – Health Check (siehe [HEALTH-STATUS.md](HEALTH-STATUS.md))

## Socket.IO Events

### Server → Client

| Event | Beschreibung |
|-------|--------------|
| `drinksUpdated` | Getränke geändert |
| `categoriesUpdated` | Kategorien geändert |
| `dishesChanged` | Speisekarte geändert |
| `cycleConfigChanged` | Cycle-Konfiguration geändert |
| `scheduleConfigChanged` / `schedule2ConfigChanged` | Schedule geändert |
| `overviewConfigChanged` | Overview geändert |
| `priceOverridesChanged` | Preis-Overrides geändert |
| `forceCycleReload` | Cycle-Seiten neu laden |
| `forceScheduleReload` / `forceSchedule2Reload` | Schedule neu laden |
| `forceOverviewReload` | Overview neu laden |
| `forceThekeHintenReload` | Theke-Hinten neu laden |
| `forceJugendkarteReload` | Jugendkarte neu laden |

## Verwendung

### Gastronomie

1. Getränke und Kategorien im Admin pflegen
2. Gerichte unter **Speisekarte** verwalten
3. Cycle-Karten und Speisekarten-Variante unter **Anzeige → Cycle** wählen
4. Schedule-Regeln für automatischen Tages-/Saisonwechsel nutzen

### Technik / Displays

1. Brightsign oder Browser auf gewünschte Karten-URL zeigen
2. Bei Cache-Problemen: **System → Status & Reload** im Admin
3. Monitoring über `/api/health` oder Admin Health-Panel

## Weitere Dokumentation

- [DATABASE-RESILIENCE.md](DATABASE-RESILIENCE.md) – Datenbank-Pool, Retry, PM2
- [HEALTH-STATUS.md](HEALTH-STATUS.md) – Health-Dashboard im Admin
