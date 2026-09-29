const fs = require('fs');
const path = require('path');

/**
 * Liest eine JSON-Datei. Fehlt sie, wird `fallback` zurückgegeben.
 * Ist sie kaputt (z. B. abgebrochener Schreibvorgang), wird geloggt und ebenfalls `fallback` genutzt,
 * damit Displays weiterlaufen statt dauerhaft 500 zu bekommen.
 */
function readJson(filePath, fallback) {
    let raw;
    try {
        raw = fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        if (error.code === 'ENOENT') {
            return cloneFallback(fallback);
        }
        throw error;
    }
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error(`Ungültiges JSON in ${path.basename(filePath)} – verwende Standardwerte:`, error.message);
        return cloneFallback(fallback);
    }
}

function cloneFallback(fallback) {
    return fallback === undefined ? undefined : JSON.parse(JSON.stringify(fallback));
}

/**
 * Schreibt JSON atomar: erst in eine temporäre Datei im selben Verzeichnis, dann rename.
 * Ein Absturz mitten im Schreiben hinterlässt so nie eine halbe Datei.
 */
function writeJsonAtomic(filePath, data) {
    const dir = path.dirname(filePath);
    const tmpPath = path.join(dir, `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`);
    const content = JSON.stringify(data, null, 2);
    try {
        fs.writeFileSync(tmpPath, content);
        fs.renameSync(tmpPath, filePath);
    } catch (error) {
        try {
            fs.unlinkSync(tmpPath);
        } catch {
            // tmp-Datei existiert evtl. nicht
        }
        throw error;
    }
}

module.exports = {
    readJson,
    writeJsonAtomic,
};
