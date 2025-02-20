# Digitale Getränkekarte (Version 2.1.0)

Eine moderne, digitale Getränkekarte mit Echtzeit-Updates für Bars und Restaurants. Das System ermöglicht die dynamische Verwaltung von Getränken, Kategorien, Events und Werbeanzeigen in Echtzeit.

## 🚀 Hauptfunktionen

### 📱 Kartentypen
- **Haupttheke**
  - Dynamisches 3-Spalten-Layout
  - Zentrale Werbeanzeigen
  - Zusatzstoff-Informationen
  
- **Theke Hinten**
  - Kompaktes 3-Spalten-Layout
  - Integriertes Logo
  - Optimiert für kleinere Displays

- **Jugendkarte**
  - Spezielles Layout für alkoholfreie Getränke
  - Event-Integration
  - Social Media Features
  - App Store & Play Store Integration

### 💫 Allgemeine Features
- Echtzeit-Updates via Socket.IO
- Responsives Design
- Animierte Werbeanzeigen
- Dynamische Spaltenumbrüche
- Flexible Preisanzeige
- Dunkles Design für optimale Lesbarkeit

### ⚙️ Admin-Panel
- Benutzerfreundliches Interface
- Separate Tabs pro Karte
- Umfassende Verwaltungsmöglichkeiten:
  - Getränke & Kategorien
  - Events & Werbung
  - Logo & Layout
  - Preisanzeigen

## 🛠 Technologie-Stack

### Backend
- Node.js & Express.js
- Socket.IO
- MySQL Datenbank
- Firebase (Events)

### Frontend
- HTML5 & CSS3
- Bootstrap 5
- Vanilla JavaScript
- Socket.IO Client

### Deployment
- Docker-Support
- Cloud-Ready

## 📦 Installation

1. Repository klonen:
```bash
git clone https://github.com/kartoffelkaese/getraenkekarte.git
cd getraenkekarte
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Umgebungsvariablen in `.env` konfigurieren:
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
    sort_order INT DEFAULT 0,
    card_type ENUM('default', 'jugendliche') DEFAULT 'default'
);

CREATE TABLE logo_settings (
    location VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    force_column_break BOOLEAN DEFAULT FALSE,
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

## 🚀 Entwicklung

Entwicklungsserver starten:
```bash
npm run dev
```

Produktionsserver starten:
```bash
npm start
```

## 🐳 Docker Deployment

1. Image bauen:
```bash
docker build -t getraenkekarte .
```

2. Container starten:
```bash
docker run -p 3000:8080 --env-file .env getraenkekarte
```

## 🔗 Zugriff

- Haupttheke: `http://[domain]/haupttheke`
- Hintere Theke: `http://[domain]/theke-hinten`
- Jugendkarte: `http://[domain]/jugendliche`
- Admin-Panel: `http://[domain]/admin.html`

## 📝 Changelog

### Version 2.1.0 (Aktuell)
- Event-System Integration
- Optimierte Event-Anzeige
- Verbesserte Social Media Integration
- Angepasstes responsives Layout
- Feinjustierte Animationen

### Version 2.0.0
- Integration der Jugendkarte
- Social Media Features
- App Store Integration
- Verbessertes responsives Design
- Optimierte Bildanzeige

### Version 1.2.1
- Verbesserte Werbungsanimation
- Optimiertes dunkles Design
- Verbesserte Lesbarkeit

### Version 1.2.0
- Einführung des dunklen Designs
- Verbesserte Logo-Verwaltung
- Optimierte Werbungsanzeige

### Version 1.1.0
- Initiale Version
- Grundlegende Funktionen
- Admin-Panel

## 🔒 Sicherheit

- Sensible Daten in `.env` (gitignored)
- Basic Authentication für Admin-Panel
- Regelmäßige Backups empfohlen

## 📫 Support

Bei Fragen oder Problemen wenden Sie sich bitte an den Support.

## ⚖️ Lizenz

Dieses Projekt ist privat lizenziert. Alle Rechte vorbehalten. 