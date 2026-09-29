const fs = require('fs');
const { readJson, writeJsonAtomic } = require('../utils/jsonConfig');
const {
    CYCLE_CONFIG,
    OVERVIEW_CONFIG,
    HOCHZEIT_CONFIG,
    IMAGES_CONFIG,
    PRICE_OVERRIDES,
    VERSION_FILE,
} = require('../config/paths');
const {
    CARDS,
    isCycleSelectableCard,
    isCycleSelectableSpeisekarte,
    normalizeCycleConfig,
} = require('../config/cards');

const OVERVIEWS = new Set(['overview-1', 'overview-2']);
const OVERVIEW_CARDS = new Set(CARDS.filter((c) => c.overviewSelectable).map((c) => c.slug));

function fallbackVersion() {
    const { version, description } = require('../../package.json');
    return { version, description };
}

// Bilder-Karten (PNG-Transparenz, Logo-Modus)
function readImagesConfig() {
    return readJson(IMAGES_CONFIG, {
        transparentBackground: false,
        logoMode: false
    });
}

function normalizeImagesConfig(rawConfig) {
    return {
        transparentBackground: !!rawConfig.transparentBackground,
        logoMode: !!rawConfig.logoMode
    };
}

// Preis: Zahl, Zahl als Text ("4.50" / "4,50"), leer oder null
function isPriceValue(value) {
    if (value === null || value === undefined || value === '') {
        return true;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) && value >= 0;
    }
    return typeof value === 'string' && /^\d+([.,]\d{1,2})?$/.test(value.trim());
}

function validatePriceOverrides(active, drinks) {
    if (active !== undefined && typeof active !== 'boolean') {
        return 'Ungültiger Wert für active. Erlaubt: true, false';
    }
    if (drinks === undefined || drinks === null) {
        return null;
    }
    if (typeof drinks !== 'object' || Array.isArray(drinks)) {
        return 'drinks muss ein Objekt sein';
    }
    for (const [drinkId, entry] of Object.entries(drinks)) {
        if (!/^\d+$/.test(drinkId) || !entry || typeof entry !== 'object') {
            return `Ungültiger Eintrag für Getränk ${drinkId}`;
        }
        if (!isPriceValue(entry.preis) || !isPriceValue(entry.small_price)) {
            return `Ungültiger Preis für Getränk ${drinkId}`;
        }
        if (entry.show_price !== undefined && typeof entry.show_price !== 'boolean') {
            return `Ungültiger Wert für show_price bei Getränk ${drinkId}`;
        }
    }
    return null;
}

/** JSON-Konfigurationen: Version, Cycle, Overview, Hochzeit, Bilder-Karten, Preis-Overrides. */

function registerConfigRoutes(app, { io }) {
    // API-Endpunkt für Version
    app.get('/api/version', (req, res) => {
        try {
            res.json(readJson(VERSION_FILE, null) || fallbackVersion());
        } catch (error) {
            console.error('Fehler beim Laden der Version:', error);
            res.json(fallbackVersion());
        }
    });

    // API-Endpunkte für Cycle-Konfiguration
    app.get('/api/cycle-config', (req, res) => {
        try {
            res.json(normalizeCycleConfig(readJson(CYCLE_CONFIG, {})));
        } catch (error) {
            console.error('Fehler beim Laden der Cycle-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
        }
    });

    // Overview-Konfiguration API
    app.get('/api/overview-config/:overview', (req, res) => {
        try {
            const overview = req.params.overview;
            if (!OVERVIEWS.has(overview)) {
                return res.status(404).json({ error: 'Overview nicht gefunden' });
            }
            const configData = readJson(OVERVIEW_CONFIG, {});
            // Fehlender Eintrag: Standard-Karte statt 404, damit das Display etwas zeigt
            res.json(configData[overview] || { card: 'haupttheke' });
        } catch (error) {
            console.error('Fehler beim Laden der Overview-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
        }
    });

    app.post('/api/overview-config/:overview', (req, res) => {
        try {
            const overview = req.params.overview;
            const { card } = req.body;

            if (!OVERVIEWS.has(overview)) {
                return res.status(404).json({ error: 'Overview nicht gefunden' });
            }
            if (!card) {
                return res.status(400).json({ error: 'Karte ist erforderlich' });
            }
            if (!OVERVIEW_CARDS.has(card)) {
                return res.status(400).json({ error: 'Ungültige Karte für Overview' });
            }

            const configData = readJson(OVERVIEW_CONFIG, {});
            configData[overview] = { card };
            writeJsonAtomic(OVERVIEW_CONFIG, configData);

            // Sende Socket.IO Event
            io.emit('overviewConfigChanged', { overview, card });

            res.json({ message: 'Overview-Konfiguration gespeichert', card });

        } catch (error) {
            console.error('Fehler beim Speichern der Overview-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
        }
    });

    // API-Endpunkte für Hochzeitskarten-Schriftgröße
    app.get('/api/hochzeit-config', (req, res) => {
        try {
            res.json(readJson(HOCHZEIT_CONFIG, { fontSize: 'large' }));
        } catch (error) {
            console.error('Fehler beim Laden der Hochzeitskarten-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
        }
    });

    app.post('/api/hochzeit-config', (req, res) => {
        try {
            const { fontSize } = req.body;

            if (!fontSize || (fontSize !== 'large' && fontSize !== 'small')) {
                return res.status(400).json({ error: 'Ungültige Schriftgröße. Erlaubt: large, small' });
            }

            const configData = {
                fontSize
            };

            writeJsonAtomic(HOCHZEIT_CONFIG, configData);

            // Sende Socket.IO Event
            io.emit('hochzeitConfigChanged', configData);

            res.json({ message: 'Hochzeitskarten-Konfiguration gespeichert', config: configData });
        } catch (error) {
            console.error('Fehler beim Speichern der Hochzeitskarten-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
        }
    });


    app.get('/api/images-config', (req, res) => {
        try {
            res.json(normalizeImagesConfig(readImagesConfig()));
        } catch (error) {
            console.error('Fehler beim Laden der Bilder-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
        }
    });

    app.post('/api/images-config', (req, res) => {
        try {
            const { transparentBackground, logoMode } = req.body;
            const configData = normalizeImagesConfig(readImagesConfig());

            if (typeof transparentBackground === 'boolean') {
                configData.transparentBackground = transparentBackground;
            } else if (transparentBackground !== undefined) {
                return res.status(400).json({ error: 'Ungültiger Wert für transparentBackground. Erlaubt: true, false' });
            }

            if (typeof logoMode === 'boolean') {
                configData.logoMode = logoMode;
            } else if (logoMode !== undefined) {
                return res.status(400).json({ error: 'Ungültiger Wert für logoMode. Erlaubt: true, false' });
            }

            writeJsonAtomic(IMAGES_CONFIG, configData);

            io.emit('imagesConfigChanged', configData);

            res.json({ message: 'Bilder-Konfiguration gespeichert', config: configData });
        } catch (error) {
            console.error('Fehler beim Speichern der Bilder-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
        }
    });

    app.post('/api/cycle-config', (req, res) => {
        try {
            const { type, firstTime, secondTime, card, speisekarteCard } = req.body;

            if (!type || !firstTime || !secondTime || !card || !speisekarteCard) {
                return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
            }

            if (type !== 'standard' && type !== 'jugend') {
                return res.status(400).json({ error: 'Ungültiger Cycle-Typ' });
            }

            if (!isCycleSelectableCard(card)) {
                return res.status(400).json({ error: 'Ungültige Karte für Cycle' });
            }

            if (!isCycleSelectableSpeisekarte(speisekarteCard)) {
                return res.status(400).json({ error: 'Ungültige Speisekarte für Cycle' });
            }

            const first = Number(firstTime);
            const second = Number(secondTime);
            const isValidDuration = (value) => Number.isInteger(value) && value >= 5 && value <= 300;
            if (!isValidDuration(first) || !isValidDuration(second)) {
                return res.status(400).json({ error: 'Zeiten müssen ganze Zahlen zwischen 5 und 300 Sekunden sein' });
            }

            const config = readJson(CYCLE_CONFIG, {});

            config[type] = {
                card,
                speisekarteCard,
                firstTime: first,
                secondTime: second,
            };

            writeJsonAtomic(CYCLE_CONFIG, normalizeCycleConfig(config));

            res.json({ success: true, message: 'Cycle-Konfiguration gespeichert' });

            io.emit('cycleConfigChanged', {
                type,
                card,
                speisekarteCard,
                firstTime: first,
                secondTime: second,
            });
        } catch (error) {
            console.error('Fehler beim Speichern der Cycle-Konfiguration:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
        }
    });


    // API-Endpunkte für Preis-Overrides
    app.get('/api/price-overrides/:location', (req, res) => {
        try {
            // Standard: inaktiv
            res.json(readJson(PRICE_OVERRIDES, { active: false, drinks: {} }));
        } catch (error) {
            console.error('Fehler beim Laden der Preis-Overrides:', error);
            res.status(500).json({ error: 'Fehler beim Laden der Preis-Overrides' });
        }
    });

    app.post('/api/price-overrides/:location', (req, res) => {
        try {
            const location = req.params.location;
            const { active, drinks } = req.body;

            const validationError = validatePriceOverrides(active, drinks);
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            const config = readJson(PRICE_OVERRIDES, {});
            config.active = !!active;
            config.drinks = drinks || {};
            writeJsonAtomic(PRICE_OVERRIDES, config);

            res.json({ success: true, message: 'Preis-Overrides gespeichert' });

            // Sende Socket.IO Event für Preis-Overrides
            io.emit('priceOverridesChanged', { location, active, drinks });
        } catch (error) {
            console.error('Fehler beim Speichern der Preis-Overrides:', error);
            res.status(500).json({ error: 'Fehler beim Speichern der Preis-Overrides' });
        }
    });

    app.delete('/api/price-overrides/:location', (req, res) => {
        try {
            const location = req.params.location;

            if (fs.existsSync(PRICE_OVERRIDES)) {
                fs.unlinkSync(PRICE_OVERRIDES);
            }

            res.json({ success: true, message: 'Preis-Overrides gelöscht' });

            // Sende Socket.IO Event
            io.emit('priceOverridesChanged', { location, active: false, drinks: {} });
        } catch (error) {
            console.error('Fehler beim Löschen der Preis-Overrides:', error);
            res.status(500).json({ error: 'Fehler beim Löschen der Preis-Overrides' });
        }
    });
}

module.exports = {
    registerConfigRoutes,
    validatePriceOverrides,
};
