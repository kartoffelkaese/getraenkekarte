const fs = require('fs');
const { safeQuery } = require('../db/pool');
const { apiError } = require('../utils/apiError');
const { safePathJoin } = require('../utils/safePath');
const { validateUploadedFile } = require('../utils/uploadValidation');
const { upload } = require('../utils/uploads');
const { readToggleBody, toSortOrder } = require('../utils/validation');
const { IMAGES_DIR } = require('../config/paths');
const logger = require('../utils/logger');

/** Werbungen: Anzeige je Location, Upload und Löschen. */

function registerAdsRoutes(app, { io }) {
    // Hole alle Werbungen mit kartenspezifischen Einstellungen
    app.get('/api/ads/:location', async (req, res) => {
        const location = req.params.location;
        const query = `
            SELECT a.id, a.name, a.image_path, a.price,
                   COALESCE(ds.is_active, a.is_active) as is_active,
                   COALESCE(ds.sort_order, a.sort_order) as sort_order
            FROM ads a
            LEFT JOIN display_settings ds ON ds.element_type = 'ad' 
                AND ds.element_id = a.id 
                AND ds.location = ?
            WHERE (a.card_type = ? OR (a.card_type = 'default' AND ? != 'jugendliche'))
            ORDER BY sort_order ASC
        `;

        try {
            const [rows] = await safeQuery(query, [location, location, location]);

            logger.debug('Ads API Response:', Array.isArray(rows), rows?.length);
            res.json(rows || []);
        } catch (err) {
            console.error('Ads API Error:', err);
            apiError(res, 500, err);
        }
    });

    // Toggle Aktivierung einer Werbung auf spezifischer Karte
    app.post('/api/ads/toggle/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'is_active');
        if (!parsed) return;
        const { id, value: is_active } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, is_active)
            VALUES (?, 'ad', ?, ?)
            ON DUPLICATE KEY UPDATE is_active = ?
        `;

        try {
            await safeQuery(query, [location, id, is_active, is_active]);
            io.emit('adsChanged', { location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // Update Sortierreihenfolge einer Werbung auf spezifischer Karte
    app.post('/api/ads/update-order/:location', async (req, res) => {
        const parsed = readToggleBody(req, res, 'sort_order', { parse: toSortOrder });
        if (!parsed) return;
        const { id, value: sort_order } = parsed;
        const location = req.params.location;

        const query = `
            INSERT INTO display_settings (location, element_type, element_id, sort_order)
            VALUES (?, 'ad', ?, ?)
            ON DUPLICATE KEY UPDATE sort_order = ?
        `;

        try {
            await safeQuery(query, [location, id, sort_order, sort_order]);
            io.emit('adsChanged', { location });
            res.json({ success: true });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    // API-Endpunkt zum Hochladen von Bildern
    app.post('/api/upload-image', upload.single('image'), async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen' });
        }
        if (!validateUploadedFile(req.file)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ success: false, error: 'Ungültiges Bildformat' });
        }

        const { name, price, cardType, isActive, sortOrder } = req.body;

        // Relativer Pfad zur Datei (für die Datenbank)
        const imagePath = `/images/${req.file.filename}`;

        try {
            // Speichere die Informationen in der Datenbank
            const query = `
                INSERT INTO ads (name, image_path, price, is_active, sort_order, card_type)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            await safeQuery(query, [name || '', imagePath, price || null, isActive, sortOrder, cardType]);

            // Sende Erfolgsantwort
            res.json({ 
                success: true, 
                message: 'Bild erfolgreich hochgeladen',
                imagePath: imagePath
            });

            // Benachrichtige alle Clients über die Änderung
            io.emit('adsChanged', { location: 'all' });
        } catch (err) {
            // Lösche die hochgeladene Datei, wenn die Datenbankoperation fehlschlägt
            fs.unlinkSync(req.file.path);
            console.error('Fehler beim Speichern der Bildinformationen:', err);
            apiError(res, 500, err);
        }
    });

    // API-Endpunkt zum Löschen einer Werbung
    app.delete('/api/ads/:id', async (req, res) => {
        const adId = req.params.id;

        try {
            // Hole zuerst den Bildpfad aus der Datenbank
            const [rows] = await safeQuery('SELECT image_path FROM ads WHERE id = ?', [adId]);

            if (rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Werbung nicht gefunden' });
            }

            const imagePath = rows[0].image_path;
            const fullImagePath = safePathJoin(IMAGES_DIR, imagePath || '');

            // Lösche den Datenbankeintrag
            await safeQuery('DELETE FROM ads WHERE id = ?', [adId]);

            // Lösche das Bild, falls es existiert
            if (fullImagePath && fs.existsSync(fullImagePath)) {
                fs.unlinkSync(fullImagePath);
            }

            // Benachrichtige alle Clients über die Änderung
            io.emit('adsChanged', { location: 'all' });

            res.json({ success: true, message: 'Werbung erfolgreich gelöscht' });
        } catch (err) {
            console.error('Fehler beim Löschen der Werbung:', err);
            apiError(res, 500, err);
        }
    });
}

module.exports = {
    registerAdsRoutes,
};
