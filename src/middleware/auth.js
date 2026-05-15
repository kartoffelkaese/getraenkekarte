const crypto = require('crypto');
const basicAuth = require('basic-auth');
require('dotenv').config();

function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
        return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
}

function verifyCredentials(req) {
    const user = basicAuth(req);
    const expectedUser = process.env.ADMIN_USER || '';
    const expectedPass = process.env.ADMIN_PASSWORD || '';

    if (!user || !expectedUser || !expectedPass) {
        return false;
    }

    return safeEqual(user.name, expectedUser) && safeEqual(user.pass, expectedPass);
}

function auth(req, res, next) {
    if (!verifyCredentials(req)) {
        res.set('WWW-Authenticate', 'Basic realm="Admin-Bereich"');
        return res.status(401).send('Authentifizierung erforderlich');
    }
    next();
}

function apiAuth(req, res, next) {
    if (!verifyCredentials(req)) {
        res.set('WWW-Authenticate', 'Basic realm="Admin-Bereich"');
        return res.status(401).json({ error: 'Authentifizierung erforderlich' });
    }
    next();
}

function requireMutatingApiAuth(req, res, next) {
    const mutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
    if (!mutating) {
        return next();
    }
    return apiAuth(req, res, next);
}

module.exports = auth;
module.exports.apiAuth = apiAuth;
module.exports.verifyCredentials = verifyCredentials;
module.exports.requireMutatingApiAuth = requireMutatingApiAuth;
