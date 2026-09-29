const express = require('express');
const http = require('http');
const path = require('path');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });

const auth = require('./middleware/auth');
const { requireMutatingApiAuth } = require('./middleware/auth');
const { isProduction, trustProxy, corsDelegate, VALID_LOCATIONS, getProductionContentSecurityPolicy } = require('./config/security');
const { PUBLIC_DIR } = require('./config/paths');
const { closePool } = require('./db/pool');
const { runStartupMigrations } = require('./db/migrations');
const { apiError } = require('./utils/apiError');
const { registerPageRoutes } = require('./routes/pages');
const { registerCardsApiRoutes } = require('./routes/cardsApi');
const { registerScheduleRoutes } = require('./routes/schedule');
const { registerHealthRoutes } = require('./routes/health');
const { registerConfigRoutes } = require('./routes/configs');
const { registerImagesRoutes } = require('./routes/images');
const { registerDrinksRoutes } = require('./routes/drinks');
const { registerAdsRoutes } = require('./routes/ads');
const { registerLogoRoutes } = require('./routes/logo');
const { registerAdditivesRoutes } = require('./routes/additives');
const { registerDishesRoutes } = require('./routes/dishes');
const { registerSocketHandlers } = require('./socket');

runStartupMigrations();

const app = express();
const server = http.createServer(app);

if (trustProxy) {
    app.set('trust proxy', 1);
}

const io = socketIo(server, {
    cors: corsDelegate,
});

app.use(helmet({
    contentSecurityPolicy: isProduction ? getProductionContentSecurityPolicy() : false,
    crossOriginEmbedderPolicy: false,
    strictTransportSecurity: false,
}));
app.use(cors(corsDelegate));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 50 : 500,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);
app.use('/api', requireMutatingApiAuth);
app.use('/api', (req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        return authLimiter(req, res, next);
    }
    next();
});

app.param('location', (req, res, next, location) => {
    if (!VALID_LOCATIONS.has(location)) {
        return res.status(400).json({ error: 'Ungültige Location' });
    }
    next();
});

registerScheduleRoutes(app, { io });

// Alte Admin-Adressen (Lesezeichen) auf die aktuelle Admin-Seite umleiten
app.get(['/admin', '/admin.html'], (req, res) => res.redirect(301, '/admin-v2.html'));

// Admin-Bereich mit Authentifizierung
app.use('/admin-v2.html', auth);
app.use('/js/admin', auth);

registerPageRoutes(app);
registerCardsApiRoutes(app);

// Ehemalige Preset-Ablage (Funktion entfernt) nie statisch ausliefern, falls dort noch Dateien liegen
app.use('/presets', (req, res) => res.status(404).end());

// Statische Dateien (absoluter Pfad – unabhängig vom Startverzeichnis)
app.use(express.static(PUBLIC_DIR));

registerHealthRoutes(app);
registerConfigRoutes(app, { io });
registerImagesRoutes(app, { io });
registerDrinksRoutes(app, { io });
registerAdsRoutes(app, { io });
registerLogoRoutes(app, { io });
registerAdditivesRoutes(app, { io });
registerDishesRoutes(app, { io });
registerSocketHandlers(io);

// Unbekannte API-Pfade: JSON statt HTML-404
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API-Endpunkt nicht gefunden' });
});

// Zentrale Fehlerbehandlung (Multer, kaputtes JSON im Body, unerwartete Fehler)
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    if (err instanceof multer.MulterError) {
        const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'Datei ist zu groß.' : `Upload-Fehler: ${err.message}`;
        return res.status(status).json({ error: message });
    }
    if (err.message === 'Nur JPG, PNG, GIF und WebP sind erlaubt.') {
        return res.status(400).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Ungültiges JSON im Request' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request zu groß' });
    }
    if (err.message === 'CORS not allowed') {
        return res.status(403).json({ error: 'Origin nicht erlaubt' });
    }
    return apiError(res, err.status || err.statusCode || 500, err);
});

const PORT = Number(process.env.PORT) || 3000;
// Standard nur lokal (Produktion hinter Reverse-Proxy); für LAN-Displays HOST=0.0.0.0 setzen
const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => {
    console.log(`Server läuft auf http://${HOST}:${PORT}`);
});

// Graceful Shutdown: laufende Requests abschließen, Sockets und DB-Pool schließen
let shuttingDown = false;
function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} empfangen – fahre Server herunter …`);
    const forceExit = setTimeout(() => process.exit(1), 10000);
    forceExit.unref();
    // io.close() trennt alle Sockets und schließt auch den HTTP-Server
    io.close(async () => {
        try {
            await closePool();
        } catch (error) {
            console.error('Fehler beim Schließen des DB-Pools:', error.message);
        }
        process.exit(0);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
