const { safeQuery } = require('../db/pool');
const { apiError } = require('../utils/apiError');
const { readToggleBody, toSortOrder } = require('../utils/validation');
const { LOGO_SIZE_LOCATIONS } = require('../config/cards');

/** Logo-Einstellungen je Location. */

function registerLogoRoutes(app, { io }) {
    // Hole Logo-Einstellungen für spezifische Karte
    app.get('/api/logo/:location', async (req, res) => {
        const location = req.params.location;
        const query = `
            SELECT * FROM logo_settings
            WHERE location = ?
        `;

        try {
            const [rows] = await safeQuery(query, [location]);
            const logoData = rows[0] || { is_active: true, sort_order: 0, force_column_break: false, logo_size: 'normal' };

            // Stelle sicher, dass logo_size gesetzt ist
            if (!logoData.logo_size) {
                logoData.logo_size = 'normal';
            }

            res.json(logoData);
        } catch (err) {
            console.error('Logo API Error:', err);
            apiError(res, 500, err);
        }
    });

    // Update Logo-Position
    app.post('/api/logo/update-order/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'sort_order', { withId: false, parse: toSortOrder });
        if (!parsed) return;
        const { value: sort_order } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO logo_settings (location, sort_order)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE sort_order = ?
        `;

        try {
            await safeQuery(query, [location, sort_order, sort_order]);
            io.emit('logoChanged', { location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Toggle Logo-Sichtbarkeit
    app.post('/api/logo/toggle/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'is_active', { withId: false });
        if (!parsed) return;
        const { value: is_active } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO logo_settings (location, is_active)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE is_active = ?
        `;

        try {
            await safeQuery(query, [location, is_active, is_active]);
            io.emit('logoChanged', { location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Toggle Logo-Spaltenumbruch
    app.post('/api/logo/toggle-column-break/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'force_column_break', { withId: false });
        if (!parsed) return;
        const { value: force_column_break } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO logo_settings (location, force_column_break)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE force_column_break = ?
        `;

        try {
            await safeQuery(query, [location, force_column_break, force_column_break]);
            io.emit('logoChanged', { location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Update Logo-Größe
    app.post('/api/logo/update-size/:location', async (req, res) => {
        const { logo_size } = req.body;
        const location = req.params.location;

        // Nur für haupttheke und theke-hinten erlauben
        if (!LOGO_SIZE_LOCATIONS.includes(location)) {
            return res.status(400).json({ error: 'Logo-Größe ist nur für haupttheke und theke-hinten verfügbar' });
        }

        // Validiere logo_size
        if (logo_size !== 'normal' && logo_size !== 'small') {
            return res.status(400).json({ error: 'Ungültige Logo-Größe. Erlaubt: normal, small' });
        }

        const query = `
            INSERT INTO logo_settings (location, logo_size)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE logo_size = ?
        `;

        try {
            await safeQuery(query, [location, logo_size, logo_size]);
            io.emit('logoChanged', { location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });
}

module.exports = {
    registerLogoRoutes,
};
