require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const DEFAULT_DEV_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
];

function parseAllowedOrigins() {
    const fromEnv = (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

    if (fromEnv.length > 0) {
        return fromEnv;
    }

    if (!isProduction) {
        return DEFAULT_DEV_ORIGINS;
    }

    return [];
}

function corsOriginValidator(origin, callback) {
    const allowed = parseAllowedOrigins();

    if (!origin) {
        return callback(null, true);
    }

    if (allowed.includes(origin)) {
        return callback(null, true);
    }

    if (!isProduction) {
        try {
            const url = new URL(origin);
            const host = url.hostname;
            if (
                host === 'localhost' ||
                host === '127.0.0.1' ||
                /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
                /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
            ) {
                return callback(null, true);
            }
        } catch {
            // ignore invalid origin URL
        }
    }

    callback(new Error('CORS not allowed'), false);
}

const VALID_LOCATIONS = new Set([
    'haupttheke',
    'hauptkarte-kopie',
    'theke-hinten',
    'theke-hinten-bilder',
    'theke-hinten-bilder-dunkel',
    'theke-hinten-2',
    'hochzeit',
    'hochzeit-dunkel',
    'hochzeit-3spalten',
    'hochzeit-dunkel-3spalten',
    'jugendliche',
    'speisekarte',
    'bilder',
    'overview-1',
    'overview-2',
    'schedule-1',
    'schedule-2',
    'cycle',
    'cycle-jugend',
    'screensaver',
]);

const VALID_SCHEDULE_CARDS = new Set([
    'cycle',
    'cycle-jugend',
    'haupttheke',
    'theke-hinten',
    'theke-hinten-bilder',
    'theke-hinten-bilder-dunkel',
    'jugendliche',
    'speisekarte',
    'overview-1',
    'overview-2',
    'schedule-1',
    'schedule-2',
    'bilder',
    'hochzeit',
    'hochzeit-dunkel',
    'hochzeit-3spalten',
    'hochzeit-dunkel-3spalten',
]);

module.exports = {
    isProduction,
    trustProxy: process.env.TRUST_PROXY === 'true',
    parseAllowedOrigins,
    corsOriginValidator,
    VALID_LOCATIONS,
    VALID_SCHEDULE_CARDS,
};
