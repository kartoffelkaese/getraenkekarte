const path = require('path');

/** Zentrale Pfade – absolut, damit der Server aus jedem Startverzeichnis funktioniert. */
const ROOT_DIR = path.join(__dirname, '../..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const configFile = (name) => path.join(ROOT_DIR, name);

module.exports = {
    ROOT_DIR,
    PUBLIC_DIR,
    // Werbe- und Gericht-Bilder
    IMAGES_DIR: path.join(PUBLIC_DIR, 'images'),
    // Bilder-Karten
    UPLOADS_DIR: path.join(PUBLIC_DIR, 'uploads'),
    configFile,
    CYCLE_CONFIG: configFile('cycle-config.json'),
    OVERVIEW_CONFIG: configFile('overview-config.json'),
    HOCHZEIT_CONFIG: configFile('hochzeit-config.json'),
    IMAGES_CONFIG: configFile('images-config.json'),
    PRICE_OVERRIDES: configFile('price-overrides.json'),
    VERSION_FILE: configFile('version.json'),
};
