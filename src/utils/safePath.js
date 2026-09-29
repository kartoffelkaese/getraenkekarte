const path = require('path');
const { VALID_SCHEDULE_CARDS } = require('../config/cards');

function safePathJoin(baseDir, userPath) {
    if (!userPath || typeof userPath !== 'string') {
        return null;
    }

    const base = path.resolve(baseDir);
    const resolved = path.resolve(base, path.basename(userPath));

    if (!resolved.startsWith(base + path.sep) && resolved !== base) {
        return null;
    }

    return resolved;
}

function isValidScheduleCard(card) {
    return typeof card === 'string' && VALID_SCHEDULE_CARDS.has(card);
}

module.exports = {
    safePathJoin,
    isValidScheduleCard,
};
