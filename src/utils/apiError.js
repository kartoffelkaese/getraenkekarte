const { isProduction } = require('../config/security');

function apiError(res, status, err, publicMessage) {
    if (err) {
        console.error(err);
    }
    const message = isProduction
        ? (publicMessage || 'Interner Serverfehler')
        : (err?.message || publicMessage || 'Interner Serverfehler');
    res.status(status).json({ error: message });
}

module.exports = { apiError };
