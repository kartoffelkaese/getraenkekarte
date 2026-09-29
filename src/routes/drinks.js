const { safeQuery } = require('../db/pool');
const { apiError } = require('../utils/apiError');
const { readJson } = require('../utils/jsonConfig');
const { readToggleBody, toSortOrder } = require('../utils/validation');
const { PRICE_OVERRIDES } = require('../config/paths');
const { PRICE_OVERRIDE_LOCATIONS } = require('../config/cards');
const logger = require('../utils/logger');

/** Getränke und Kategorien je Location (inkl. temporärer Preise). */

function registerDrinksRoutes(app, { io }) {
    // API-Endpunkte mit Location-Parameter
    app.get('/api/drinks/:location', async (req, res) => {
        const location = req.params.location;
        const query = `
            SELECT d.id, d.name, d.preis, d.category_id,
                   d.has_small_size, d.small_price, d.volume_normal, d.volume_small,
                   c.name as category_name,
                   COALESCE(ds_drink.is_active, d.is_active) as is_active,
                   COALESCE(ds_drink.show_price, d.show_price) as show_price,
                   COALESCE(ds_cat.show_price, c.show_prices) as category_show_prices,
                   COALESCE(ds_cat.is_active, c.is_visible) as category_is_visible,
                   COALESCE(ds_cat.sort_order, c.sort_order) as category_sort_order,
                   COALESCE(ds_cat.force_column_break, c.force_column_break) as category_force_column_break,
                   GROUP_CONCAT(CONCAT(a.code, ') ', a.name) SEPARATOR ', ') as additives
            FROM drinks2 d 
            LEFT JOIN categories c ON d.category_id = c.id
            LEFT JOIN display_settings ds_drink ON ds_drink.element_type = 'drink' 
                AND ds_drink.element_id = d.id 
                AND ds_drink.location = ?
            LEFT JOIN display_settings ds_cat ON ds_cat.element_type = 'category' 
                AND ds_cat.element_id = c.id 
                AND ds_cat.location = ?
            LEFT JOIN drink_additives da ON da.drink_id = d.id
            LEFT JOIN additives a ON a.id = da.additive_id
            GROUP BY d.id
            ORDER BY category_sort_order ASC, c.name ASC, d.name ASC
        `;

        try {
            const [rows] = await safeQuery(query, [location, location]);

            // Lade Preis-Overrides für theke-hinten und theke-hinten-bilder
            let priceOverrides = {};

            if (PRICE_OVERRIDE_LOCATIONS.includes(location)) {
                // Lade Preis-Overrides
                try {
                    const priceConfigData = readJson(PRICE_OVERRIDES, {});
                    if (priceConfigData.active && priceConfigData.drinks) {
                        priceOverrides = priceConfigData.drinks;
                    }
                } catch (error) {
                    console.error('Fehler beim Laden der Preis-Overrides:', error);
                }
            }

            // Wende Preis-Overrides an
            const drinksWithOverrides = (rows || []).map(drink => {
                const updatedDrink = { ...drink };

                if (priceOverrides[drink.id]) {
                    updatedDrink.preis = priceOverrides[drink.id].preis;
                    updatedDrink.small_price = priceOverrides[drink.id].small_price;
                    updatedDrink.show_price = priceOverrides[drink.id].show_price;
                }

                return updatedDrink;
            });

            logger.debug('Drinks API Response:', Array.isArray(drinksWithOverrides), drinksWithOverrides?.length);
            res.json(drinksWithOverrides);
        } catch (err) {
            console.error('Drinks API Error:', err);
            apiError(res, 500, err);
        }
    });

    // Hole alle Kategorien mit kartenspezifischen Einstellungen
    app.get('/api/categories/:location', async (req, res) => {
        const location = req.params.location;
        const query = `
            SELECT c.id, c.name, 
                   COALESCE(ds.show_price, c.show_prices) as show_prices,
                   COALESCE(ds.is_active, c.is_visible) as is_visible,
                   COALESCE(ds.sort_order, c.sort_order) as sort_order,
                   COALESCE(ds.force_column_break, c.force_column_break) as force_column_break
            FROM categories c
            LEFT JOIN display_settings ds ON ds.element_type = 'category' 
                AND ds.element_id = c.id 
                AND ds.location = ?
            ORDER BY sort_order ASC, name ASC
        `;

        try {
            const [rows] = await safeQuery(query, [location]);

            logger.debug('Categories API Response:', Array.isArray(rows), rows?.length);
            res.json(rows || []);
        } catch (err) {
            console.error('Categories API Error:', err);
            apiError(res, 500, err);
        }
    });

    // Update drink status für spezifische Karte
    app.post('/api/drinks/toggle/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'is_active');
        if (!parsed) return;
        const { id, value: is_active } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, is_active)
            VALUES (?, 'drink', ?, ?)
            ON DUPLICATE KEY UPDATE is_active = ?
        `;

        try {
            await safeQuery(query, [location, id, is_active, is_active]);
            io.emit('drinkStatusChanged', { id, is_active, location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Toggle Preisanzeige für ein Getränk auf spezifischer Karte
    app.post('/api/drinks/toggle-price/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'show_price');
        if (!parsed) return;
        const { id, value: show_price } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, show_price)
            VALUES (?, 'drink', ?, ?)
            ON DUPLICATE KEY UPDATE show_price = ?
        `;

        try {
            await safeQuery(query, [location, id, show_price, show_price]);
            io.emit('drinkPriceChanged', { id, show_price, location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Toggle Preisanzeige für eine Kategorie auf spezifischer Karte
    app.post('/api/categories/toggle-prices/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'show_prices');
        if (!parsed) return;
        const { id, value: show_prices } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, show_price)
            VALUES (?, 'category', ?, ?)
            ON DUPLICATE KEY UPDATE show_price = ?
        `;

        try {
            await safeQuery(query, [location, id, show_prices, show_prices]);
            io.emit('categoryPricesChanged', { id, show_prices, location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Toggle Sichtbarkeit für eine Kategorie auf spezifischer Karte
    app.post('/api/categories/toggle-visibility/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'is_visible');
        if (!parsed) return;
        const { id, value: is_visible } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, is_active)
            VALUES (?, 'category', ?, ?)
            ON DUPLICATE KEY UPDATE is_active = ?
        `;

        try {
            await safeQuery(query, [location, id, is_visible, is_visible]);
            io.emit('categoryVisibilityChanged', { id, is_visible, location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Toggle Spaltenumbruch für eine Kategorie auf spezifischer Karte
    app.post('/api/categories/toggle-column-break/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'force_column_break');
        if (!parsed) return;
        const { id, value: force_column_break } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, force_column_break)
            VALUES (?, 'category', ?, ?)
            ON DUPLICATE KEY UPDATE force_column_break = ?
        `;

        try {
            await safeQuery(query, [location, id, force_column_break, force_column_break]);
            io.emit('categoryColumnBreakChanged', { id, force_column_break, location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Update Sortierreihenfolge einer Kategorie auf spezifischer Karte
    app.post('/api/categories/update-order/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'sort_order', { parse: toSortOrder });
        if (!parsed) return;
        const { id, value: sort_order } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, sort_order)
            VALUES (?, 'category', ?, ?)
            ON DUPLICATE KEY UPDATE sort_order = ?
        `;

        try {
            await safeQuery(query, [location, id, sort_order, sort_order]);
            io.emit('categorySortChanged', { location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });
}

module.exports = {
    registerDrinksRoutes,
};
