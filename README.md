# Digitale Getränkekarte (Version 1.2.1)

Eine moderne, digitale Getränkekarte mit Echtzeit-Updates, entwickelt für Bars und Restaurants. Das System ermöglicht die dynamische Verwaltung von Getränken, Kategorien und Werbeanzeigen in Echtzeit.

## Features

### Getränkekarte
- Responsive Design für verschiedene Bildschirmgrößen
- Dynamisches 3-Spalten-Layout mit automatischer Verteilung
- Echtzeit-Updates durch Socket.IO
- Animierte Werbeanzeigen mit sanften Übergängen
- Automatische Spaltenumbrüche für optimale Darstellung
- Anpassbare Preisanzeige pro Getränk und Kategorie
- Separate Ansichten für Haupttheke und hintere Theke
- Dynamische Logo-Positionierung
- Dunkles Design für optimale Lesbarkeit

### Admin-Panel
- Benutzerfreundliches Interface zur Verwaltung
- Getränke aktivieren/deaktivieren
- Preisanzeige pro Getränk und Kategorie steuerbar
- Kategorien ein-/ausblenden
- Reihenfolge der Kategorien anpassbar
- Manuelle Spaltenumbrüche möglich
- Werbeanzeigen-Verwaltung mit Bildupload
- Logo-Verwaltung mit Positions- und Sichtbarkeitssteuerung
- Einfaches Tab-System für verschiedene Theken

## Technologie-Stack

- **Backend:**
  - Node.js mit Express.js
  - Socket.IO für Echtzeit-Updates
  - MySQL Datenbank
  
- **Frontend:**
  - HTML5 & CSS3
  - Bootstrap 5
  - Vanilla JavaScript
  - Socket.IO Client
  - Responsive Design
  - Animationen & Transitions

- **Deployment:**
  - Docker-Support
  - Google Cloud Run kompatibel

## Installation

1. Repository klonen:
```bash
git clone https://github.com/kartoffelkaese/getraenkekarte.git
cd getraenkekarte
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
Erstellen Sie eine `.env`-Datei im Hauptverzeichnis:
```env
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
PORT=3000
ADMIN_USER=admin
ADMIN_PASSWORD=secure_password_here
```

4. Datenbank-Tabellen erstellen:
```sql
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    show_prices BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    force_column_break BOOLEAN DEFAULT FALSE
);

CREATE TABLE drinks2 (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    preis DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    category_id INT,
    show_price BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

CREATE TABLE logo_settings (
    location VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    PRIMARY KEY (location)
);

CREATE TABLE display_settings (
    location VARCHAR(50) NOT NULL,
    element_type ENUM('drink', 'category', 'ad') NOT NULL,
    element_id INT NOT NULL,
    is_active BOOLEAN DEFAULT NULL,
    show_price BOOLEAN DEFAULT NULL,
    sort_order INT DEFAULT NULL,
    force_column_break BOOLEAN DEFAULT NULL,
    PRIMARY KEY (location, element_type, element_id)
);
```

## Entwicklung

Entwicklungsserver mit automatischem Neuladen starten:
```bash
npm run dev
```

Produktionsserver starten:
```bash
npm start
```

## Docker Deployment

1. Image bauen:
```bash
docker build -t getraenkekarte .
```

2. Container starten:
```bash
docker run -p 3000:8080 --env-file .env getraenkekarte
```

## Google Cloud Run Deployment

1. Image für Cloud Run bauen und pushen:
```bash
gcloud builds submit --tag gcr.io/[PROJECT-ID]/getraenkekarte
```

2. Service deployen:
```bash
gcloud run deploy getraenkekarte \
  --image gcr.io/[PROJECT-ID]/getraenkekarte \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="DB_HOST=your-db-host,DB_USER=your-db-user,DB_NAME=your-db-name" \
  --set-secrets="DB_PASSWORD=gkarte-db-password:latest"
```

## Zugriff

- **Haupttheke:** `http://[ihre-domain]/haupttheke`
- **Hintere Theke:** `http://[ihre-domain]/theke-hinten`
- **Admin-Panel:** `http://[ihre-domain]/admin.html`

## Changelog

### Version 1.2.1
- Verbesserte Werbungsanimation mit sanfteren Übergängen
- Optimiertes dunkles Design
- Synchronisierte Animations- und Übergangszeiten
- Verbesserte Lesbarkeit durch angepasste Kontraste

### Version 1.2.0
- Einführung des dunklen Designs
- Verbesserte Logo-Verwaltung
- Optimierte Werbungsanzeige

### Version 1.1.0
- Initiale Version mit grundlegenden Funktionen
- Getränke- und Kategorienverwaltung
- Werbungsintegration
- Admin-Panel

## Sicherheitshinweise

- Die `.env` Datei enthält sensible Daten und ist in `.gitignore` aufgenommen
- Alle Passwörter und Zugangsdaten sollten sicher verwahrt werden
- Das Admin-Panel ist durch Basic Authentication geschützt
- Regelmäßige Backups der Datenbank werden empfohlen

## Support

Bei Fragen oder Problemen öffnen Sie bitte ein Issue auf GitHub.

## Lizenz

Dieses Projekt ist privat und nicht zur öffentlichen Nutzung bestimmt. Alle Rechte vorbehalten. 