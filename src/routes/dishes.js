const fs = require('fs');
const { safeQuery } = require('../db/pool');
const { apiError } = require('../utils/apiError');
const { safePathJoin } = require('../utils/safePath');
const { validateUploadedFile } = require('../utils/uploadValidation');
const { upload } = require('../utils/uploads');
const { IMAGES_DIR } = require('../config/paths');

// Löscht ein Gericht-Bild aus public/images (nur eigene Uploads, keine Pfad-Tricks)
function removeDishImage(imagePath) {
    if (typeof imagePath !== 'string' || !imagePath.startsWith('/images/')) {
        return;
    }
    const filePath = safePathJoin(IMAGES_DIR, imagePath);
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('Fehler beim Löschen des Gericht-Bildes:', error);
        }
    }
}

/** Speisekarte: Gerichte verwalten. */

function registerDishesRoutes(app, { io }) {
    // API-Endpunkt für alle Gerichte
    app.get('/api/dishes', async (req, res) => {
        const query = `
            SELECT * FROM dishes
            ORDER BY sort_order ASC, name ASC
        `;

        try {
            const [rows] = await safeQuery(query);
            res.json(rows || []);
        } catch (err) {
            console.error('Dishes API Error:', err);
            apiError(res, 500, err);
        }
    });

    // Speisekarten-API Endpunkte
    app.get('/api/dishes/:id', async (req, res) => {
        try {
            const [dishes] = await safeQuery('SELECT * FROM dishes WHERE id = ?', [req.params.id]);
            if (dishes.length === 0) {
                return res.status(404).json({ error: 'Gericht nicht gefunden' });
            }
            res.json(dishes[0]);
        } catch (error) {
            console.error('Fehler beim Laden des Gerichts:', error);
            res.status(500).json({ error: 'Fehler beim Laden des Gerichts' });
        }
    });

    app.post('/api/dishes', upload.single('dishImage'), async (req, res) => {
        try {
            const { name, price, description, sort_order, is_active } = req.body;
            let image_path = null;

            if (req.file) {
                if (!validateUploadedFile(req.file)) {
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({ error: 'Ungültiges Bildformat' });
                }
                image_path = `/images/${req.file.filename}`;
            }

            const [result] = await safeQuery(
                'INSERT INTO dishes (name, price, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
                [name, price, description, image_path, sort_order || 0, is_active === 'true']
            );

            io.emit('dishesChanged', { location: 'speisekarte' });

            res.json({ id: result.insertId, success: true });
        } catch (error) {
            console.error('Fehler beim Erstellen des Gerichts:', error);
            res.status(500).json({ error: 'Fehler beim Erstellen des Gerichts' });
        }
    });

    app.put('/api/dishes/:id', upload.single('dishImage'), async (req, res) => {
        try {
            const { name, price, description, sort_order, is_active } = req.body;
            let image_path = null;

            if (req.file) {
                if (!validateUploadedFile(req.file)) {
                    fs.unlinkSync(req.file.path);
                    return res.status(400).json({ error: 'Ungültiges Bildformat' });
                }
                image_path = `/images/${req.file.filename}`;
            }

            let previousImagePath = null;
            if (image_path) {
                const [existing] = await safeQuery('SELECT image_path FROM dishes WHERE id = ?', [req.params.id]);
                previousImagePath = existing[0]?.image_path || null;
            }

            const query = image_path 
                ? 'UPDATE dishes SET name = ?, price = ?, description = ?, image_path = ?, sort_order = ?, is_active = ? WHERE id = ?'
                : 'UPDATE dishes SET name = ?, price = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?';

            const params = image_path 
                ? [name, price, description, image_path, sort_order || 0, is_active === 'true', req.params.id]
                : [name, price, description, sort_order || 0, is_active === 'true', req.params.id];

            await safeQuery(query, params);

            if (previousImagePath && previousImagePath !== image_path) {
                removeDishImage(previousImagePath);
            }

            io.emit('dishesChanged', { location: 'speisekarte' });

            res.json({ success: true });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Gerichts:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Gerichts' });
        }
    });

    app.delete('/api/dishes/:id', async (req, res) => {
        try {
            const [existing] = await safeQuery('SELECT image_path FROM dishes WHERE id = ?', [req.params.id]);
            await safeQuery('DELETE FROM dishes WHERE id = ?', [req.params.id]);
            if (existing[0]?.image_path) {
                removeDishImage(existing[0].image_path);
            }
            io.emit('dishesChanged', { location: 'speisekarte' });
            res.json({ success: true });
        } catch (error) {
            console.error('Fehler beim Löschen des Gerichts:', error);
            res.status(500).json({ error: 'Fehler beim Löschen des Gerichts' });
        }
    });

    app.put('/api/dishes/:id/status', async (req, res) => {
        try {
            const { is_active } = req.body;
            await safeQuery('UPDATE dishes SET is_active = ? WHERE id = ?', [is_active, req.params.id]);

            // Emittiere das Event mit der Location
            io.emit('dishesChanged', { location: 'speisekarte' });

            res.json({ success: true });
        } catch (error) {
            console.error('Fehler beim Aktualisieren des Gericht-Status:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren des Gericht-Status' });
        }
    });

    app.put('/api/dishes/:id/order', async (req, res) => {
        try {
            const { sort_order } = req.body;
            await safeQuery('UPDATE dishes SET sort_order = ? WHERE id = ?', [sort_order, req.params.id]);

            // Emittiere das Event mit der Location
            io.emit('dishesChanged', { location: 'speisekarte' });

            res.json({ success: true });
        } catch (error) {
            console.error('Fehler beim Aktualisieren der Reihenfolge:', error);
            res.status(500).json({ error: 'Fehler beim Aktualisieren der Reihenfolge' });
        }
    });
}

module.exports = {
    registerDishesRoutes,
};
