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
| `bilder` | Vollbild-Bildergalerie |

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

### Bilder-Karten

Die Karten `bilder`, `theke-hinten-bilder` und `theke-hinten-bilder-dunkel` zeigen hochgeladene Bilder aus `/uploads`. Konfiguration in [`images-config.json`](images-config.json) und im Admin unter **Karten → Bilder**:

```json
{
  "transparentBackground": false,
  "logoMode": false
}
```

- **Stapel-Modus** (Standard): bis zu 4 Bilder gestapelt, zufällige Rotation, automatischer Wechsel ab 5 Bildern
- **PNG-Transparenz**: transparenter Hintergrund und kein Schatten für PNGs (unabhängig vom Logo-Modus)
- **Logo-Modus**: ein Bild zur Zeit, vollständig sichtbar (`object-fit: contain`, max. 60vh), Fly-in von rechts → Schweben (wie Jugendkarte) → Exit nach links; sequenzieller Wechsel bei mehreren Bildern

Implementierung: [`public/js/images-player.js`](public/js/images-player.js), [`public/css/images-player.css`](public/css/images-player.css)

### Weitere Funktionen

- Temporäre Preis-Overrides für Theke-Hinten (JSON, ohne DB-Änderung)
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
# HOST=127.0.0.1   # Standard; 0.0.0.0 = im LAN erreichbar
```

### 4. Server starten

```bash
# Entwicklung
npm run dev

# Produktion
npm start

# Im LAN erreichbar (HOST=0.0.0.0, z. B. für Brightsign)
npm run ext
```

Die JSON-Konfigurationen (`cycle-config.json`, `schedule-*-config.json` usw.) werden atomar geschrieben – ein Absturz beim Speichern hinterlässt keine halbe Datei. Ist eine Datei trotzdem beschädigt, nutzt der Server Standardwerte und loggt einen Fehler. Der Server beendet sich bei `SIGTERM`/`SIGINT` sauber (z. B. PM2-Neustart).

### Weitere npm-Scripts

```bash
npm test          # Tests ausführen
npm run lint      # ESLint
npm run build:admin  # Admin-Bundle bauen
```

## Moderne Karten (Test)

`/haupttheke-modern` – Haupttheke im dunklen, modernen Design: Getränke links in automatisch verteilten Spalten, rechts eine Seitenleiste mit Logo, Werbung und Zusatzstoffen. Akzentfarbe ist das Magenta der bestehenden Karten (`#a50775`, für Schrift aufgehellt). Die Karte nutzt die Daten und Admin-Einstellungen der **Haupttheke** und reagiert auf „Haupttheke neu starten“.

- **Auto-Fit** (`public/js/modern-card.js`): Kategorien werden in Sortierreihenfolge auf Spalten verteilt; Spaltenzahl und Schriftgröße werden so gewählt, dass **alle Getränke sichtbar** sind und nichts abgeschnitten wird. Unter ca. 20 px (bei 1080p) erscheint eine Warnung in der Browser-Konsole.
- Manuelle Spaltenumbrüche und die Logo-Position aus dem Admin werden in diesen Karten ignoriert.
- Design: `public/css/modern.css`, Schrift Inter lokal unter `public/fonts/inter/` (OFL-Lizenz liegt bei).

## Projektstruktur

```
src/
├── index.js            # Einstieg: Express, Socket.IO, Middleware, Reihenfolge der Routen, Start/Shutdown
├── socket.js           # Socket.IO: authentifizierte Reload-Signale an Displays
├── config/             # cards.js (Karten-Registry), paths.js (alle Pfade), security.js (CORS/CSP)
├── routes/             # je Bereich ein Modul: configs, drinks, ads, logo, additives, dishes, images, schedule, …
├── services/           # Logik ohne HTTP: schedule (Regeln, Validierung)
├── db/                 # pool.js (Pool, Retry, Heartbeat), migrations.js (Schema beim Start)
├── middleware/auth.js  # Basic Auth
└── utils/              # jsonConfig (atomares Speichern), validation, uploads, safePath, logger, …
```

Neue API-Endpunkte kommen in das passende Modul unter `src/routes/` (Muster: `registerXyzRoutes(app, { io })`).

Das Admin-Frontend (`public/admin-v2.html`) lädt seine Skripte aus `public/js/admin/` – je Bereich eine Datei (`core.js` zuerst, dann `drinks.js`, `dishes.js`, `schedule.js` usw.). Es sind klassische Skripte, die Funktionen und Zustand global teilen; die Reihenfolge der `<script>`-Tags ist daher wichtig.

## Verfügbare Seiten

### Start & Admin

- `/` – Redirect zur Haupttheke
- `/admin-v2.html` – Admin-Interface (helles UI, mobile-first, Basic Auth)
- `/admin`, `/admin.html` – leiten auf `/admin-v2.html` um

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
| **Preise** | Temporäre Preise |
| **Anzeige** | Schedule 1/2, Cycle 1/2, Overview 1/2 |
| **System** | Status & Reload, Hochzeitskarten, Links |

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
- `GET/POST /api/images-config` – Bilder-Karten (`transparentBackground`, `logoMode`)
- `GET /api/images` – Liste hochgeladener Bilder
- `POST /api/images` – Bild hochladen
- `DELETE /api/images/:id` – Einzelnes Bild löschen
- `DELETE /api/images/all` – Alle Bilder löschen
- `GET /api/version` – Versionsinfo

### Getränke & Kategorien

- `GET /api/drinks/:location` – Getränke pro Standort
- `GET /api/categories/:location` – Kategorien pro Standort
- Diverse Toggle-/Reorder-Endpunkte für Getränke, Kategorien, Werbung, Logo

### Speisekarte

- `GET /api/dishes` – Alle Gerichte
- `POST/PUT/DELETE /api/dishes` – Gerichte verwalten

### Preise

- `GET/POST/DELETE /api/price-overrides/:location` – Temporäre Preise

### System

- `GET /api/health` – Health Check (siehe [HEALTH-STATUS.md](HEALTH-STATUS.md))

## Socket.IO Events

### Server → Client

| Event | Beschreibung |
|-------|--------------|
| `drinkStatusChanged` / `drinkPriceChanged` | Getränk ein-/ausgeblendet bzw. Preisanzeige geändert |
| `categoryVisibilityChanged` / `categoryPricesChanged` / `categorySortChanged` / `categoryColumnBreakChanged` | Kategorie-Einstellungen geändert |
| `adsChanged` / `logoChanged` | Werbung bzw. Logo geändert |
| `additivesChanged` / `drinkAdditivesChanged` | Zusatzstoffe geändert |
| `dishesChanged` | Speisekarte geändert (Gericht angelegt, bearbeitet, gelöscht) |
| `imagesChanged` | Bild hochgeladen oder gelöscht (Bilder-Karten laden die Liste neu) |
| `cycleConfigChanged` | Cycle-Konfiguration geändert (Cycle-Seiten laden neu) |
| `imagesConfigChanged` | Bilder-Konfiguration geändert (Transparenz / Logo-Modus) |
| `hochzeitConfigChanged` | Hochzeitskarten-Schriftgröße geändert |
| `scheduleConfigChanged` / `schedule2ConfigChanged` | Schedule geändert |
| `overviewConfigChanged` | Overview geändert |
| `priceOverridesChanged` | Preis-Overrides geändert |
| `forceScheduleReload` / `forceSchedule2Reload` | Schedule neu laden |
| `forceOverviewReload` | Overview neu laden |
| `forceCycleReload` | Cycle 1 (`standard`) / Cycle 2 (`jugend`) neu laden |
| `forceHauptthekeReload` | Haupttheke neu laden |
| `forceThekeHintenReload` | Theke-Hinten neu laden |
| `forceJugendkarteReload` | Jugendkarte neu laden |

Die `force…Reload`-Events sendet nur ein angemeldeter Admin (Basic Auth); der Server verteilt sie an alle Displays. Displays verbinden sich nach einem Serverausfall unbegrenzt neu und laden verpasste Daten nach.

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
