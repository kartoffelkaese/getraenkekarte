# Getränkekarte (Version 1.1.0)

Eine moderne, digitale Getränkekarte mit Echtzeit-Updates und Admin-Panel.

## Features

- Responsive Design für verschiedene Bildschirmgrößen
- Echtzeit-Updates durch Socket.IO
- Kategorisierung von Getränken
- Flexibles Spalten-Layout
- Admin-Panel für:
  - Getränke aktivieren/deaktivieren
  - Preise ein-/ausblenden
  - Kategorien verwalten
  - Reihenfolge anpassen
  - Spaltenumbrüche steuern

## Technologien

- Node.js
- Express.js
- Socket.IO
- MySQL
- Bootstrap 5
- Docker

## Voraussetzungen

- Node.js 20 oder höher
- MySQL Datenbank
- npm oder yarn

## Installation

1. Repository klonen:
```bash
git clone [repository-url]
cd gkarte
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Umgebungsvariablen konfigurieren:
Erstellen Sie eine `.env`-Datei im Hauptverzeichnis mit folgenden Variablen:
```
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
PORT=3000
```

4. Datenbank einrichten:
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
```

5. Anwendung starten:
```bash
npm start
```

## Entwicklung

Für die Entwicklung mit automatischem Neuladen:
```bash
npm run dev
```

## Docker

Build und Start mit Docker:
```bash
docker build -t gkarte .
docker run -p 3000:8080 --env-file .env gkarte
```

## Google Cloud Run Deployment

1. Google Cloud SDK installieren und konfigurieren

2. Docker Image bauen und pushen:
```bash
gcloud builds submit --tag gcr.io/[PROJECT-ID]/gkarte
```

3. Datenbank-Passwort als Secret speichern:
```bash
echo -n "your-db-password" | gcloud secrets create gkarte-db-password --data-file=-
```

4. Service deployen:
```bash
gcloud run deploy gkarte \
  --image gcr.io/[PROJECT-ID]/gkarte \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars="DB_HOST=your-db-host,DB_USER=your-db-user,DB_NAME=your-db-name" \
  --set-secrets="DB_PASSWORD=gkarte-db-password:latest"
```

## Zugriff

- Getränkekarte: `http://localhost:3000`
- Admin-Panel: `http://localhost:3000/admin.html`

## Lizenz

Dieses Projekt ist privat und nicht zur öffentlichen Nutzung bestimmt. 