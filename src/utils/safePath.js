const path = require('path');
const { VALID_SCHEDULE_CARDS } = require('../config/security');

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

function isValidPresetFilename(filename, location) {
    if (!filename || typeof filename !== 'string') {
        return false;
    }
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return false;
    }
    if (!filename.startsWith(`${location}-`) || !filename.endsWith('.json')) {
        return false;
    }
    const namePart = filename.slice(`${location}-`.length, -'.json'.length);
    if (!namePart || namePart.length > 120) {
        return false;
    }
    return /^[a-zA-Z0-9äöüÄÖÜß\-_]+$/.test(namePart);
}

function parsePresetCard(card) {
    if (typeof card !== 'string' || !card.startsWith('preset:')) {
        return null;
    }
    const filename = card.slice('preset:'.length);
    if (!filename.endsWith('.json')) {
        return null;
    }
    let location = null;
    if (filename.startsWith('haupttheke-')) {
        location = 'haupttheke';
    } else if (filename.startsWith('theke-hinten-')) {
        location = 'theke-hinten';
    } else {
        return null;
    }
    if (!isValidPresetFilename(filename, location)) {
        return null;
    }
    return { filename, location };
}

function isValidScheduleCard(card) {
    if (typeof card !== 'string' || !card) {
        return false;
    }
    if (card.startsWith('preset:')) {
        return parsePresetCard(card) !== null;
    }
    return VALID_SCHEDULE_CARDS.has(card);
}

function resolvePresetPath(presetsDir, cardOrFilename) {
    const parsed = cardOrFilename.startsWith('preset:')
        ? parsePresetCard(cardOrFilename)
        : (() => {
            for (const loc of ['haupttheke', 'theke-hinten']) {
                if (isValidPresetFilename(cardOrFilename, loc)) {
                    return { filename: cardOrFilename, location: loc };
                }
            }
            return null;
        })();

    if (!parsed) {
        return null;
    }

    return safePathJoin(presetsDir, parsed.filename);
}

module.exports = {
    safePathJoin,
    isValidPresetFilename,
    parsePresetCard,
    isValidScheduleCard,
    resolvePresetPath,
};
