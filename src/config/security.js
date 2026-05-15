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

    // PUBLIC_ORIGIN: eine kanonische Basis-URL, Alternative/Ergänzung zu ALLOWED_ORIGINS
    const publicOrigin = (process.env.PUBLIC_ORIGIN || '').trim();
    const merged = [...fromEnv];
    if (publicOrigin && !merged.includes(publicOrigin)) {
        merged.push(publicOrigin);
    }

    if (merged.length > 0) {
        return merged;
    }

    if (!isProduction) {
        return DEFAULT_DEV_ORIGINS;
    }

    return [];
}

function effectivePort(protocol, portStr) {
    const p = String(portStr || '');
    if (p) return p;
    return protocol === 'https:' ? '443' : '80';
}

function forwardedHost(req) {
    const raw = req.headers['x-forwarded-host'] || req.headers.host || '';
    return raw.split(',')[0].trim().toLowerCase();
}

function forwardedProto(req) {
    const raw = (req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
    if (raw === 'http' || raw === 'https') {
        return raw;
    }
    return '';
}

/**
 * Gleicher Ursprung wie die aufgerufene Site (Produktion ohne ALLOWED_ORIGINS).
 * Nutzt Host / X-Forwarded-Host und X-Forwarded-Proto vom Reverse-Proxy.
 */
function isSameSiteBehindProxy(req, origin) {
    if (!origin) {
        return true;
    }
    const hostRaw = forwardedHost(req);
    if (!hostRaw) {
        return false;
    }

    let originUrl;
    try {
        originUrl = new URL(origin);
    } catch {
        return false;
    }

    let proto = forwardedProto(req);
    if (!proto) {
        proto = isProduction ? 'https' : originUrl.protocol.replace(':', '');
    }

    let expectedUrl;
    try {
        expectedUrl = new URL(`${proto}://${hostRaw}`);
    } catch {
        return false;
    }

    if (originUrl.protocol !== expectedUrl.protocol) {
        return false;
    }

    if (originUrl.hostname.toLowerCase() !== expectedUrl.hostname.toLowerCase()) {
        return false;
    }

    return effectivePort(originUrl.protocol, originUrl.port)
        === effectivePort(expectedUrl.protocol, expectedUrl.port);
}

function isDevLanOrigin(origin) {
    try {
        const url = new URL(origin);
        const host = url.hostname;
        return (
            host === 'localhost' ||
            host === '127.0.0.1' ||
            /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
            /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host)
        );
    } catch {
        return false;
    }
}

/** Darf diese Origin für diese Request kommunizieren? (Express + Socket.IO nutzen dieselbe Logik.) */
function isOriginAllowedForRequest(req, originHeader) {
    const allowed = parseAllowedOrigins();

    if (!originHeader) {
        return true;
    }

    if (allowed.includes(originHeader)) {
        return true;
    }

    if (isSameSiteBehindProxy(req, originHeader)) {
        return true;
    }

    if (!isProduction && isDevLanOrigin(originHeader)) {
        return true;
    }

    return false;
}

/** Dynamic cors(options) — Express und Socket.IO (req-basiert). */
function corsDelegate(req, callback) {
    const origin = req.headers.origin;
    if (isOriginAllowedForRequest(req, origin)) {
        return callback(null, {
            origin: true,
            credentials: true,
            methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        });
    }
    return callback(new Error('CORS not allowed'));
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

/** Erlaubte Karten für Schedule (Default + Regeln): gleiche Slugs wie Öffentliche Karten-Routen */
const VALID_SCHEDULE_CARDS = new Set(VALID_LOCATIONS);

/** Reverse-Proxy: Standard in Produktion TRUST_PROXY=true (express-rate-limit / Client-IP). */
function resolveTrustProxy() {
    if (process.env.TRUST_PROXY === 'true') return true;
    if (process.env.TRUST_PROXY === 'false') return false;
    return isProduction;
}

const trustProxy = resolveTrustProxy();

/** CSP für statische Seiten: Bootstrap/jsDelivr, Firebase-Module (gstatic), Firestore-APIs. */
function getProductionContentSecurityPolicy() {
    return {
        directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com', 'data:'],
            formAction: ["'self'"],
            frameAncestors: ["'self'"],
            imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
            objectSrc: ["'none'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                'https://cdn.jsdelivr.net',
                'https://www.gstatic.com',
            ],
            // admin.html u. a. nutzt onclick="..."
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
            connectSrc: [
                "'self'",
                'https://cdn.jsdelivr.net',
                'https://www.gstatic.com',
                'https://firestore.googleapis.com',
                'https://firebase.googleapis.com',
                'https://www.googleapis.com',
                'https://identitytoolkit.googleapis.com',
                'https://securetoken.googleapis.com',
            ],
        },
    };
}

module.exports = {
    isProduction,
    trustProxy,
    parseAllowedOrigins,
    corsDelegate,
    isOriginAllowedForRequest,
    VALID_LOCATIONS,
    VALID_SCHEDULE_CARDS,
    getProductionContentSecurityPolicy,
};
