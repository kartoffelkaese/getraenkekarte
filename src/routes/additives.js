const { safeQuery } = require('../db/pool');
const { apiError } = require('../utils/apiError');

/** Zusatzstoffe und ihre Zuordnung zu Getränken. */

function registerAdditivesRoutes(app, { io }) {
    // API-Endpunkte für Zusatzstoffe
    app.get('/api/additives', async (req, res) => {
        const query = `
            SELECT * FROM additives
            ORDER BY code ASC
        `;

        try {
            const [rows] = await safeQuery(query);
            res.json(rows || []);
        } catch (err) {
            console.error('Additives API Error:', err);
            apiError(res, 500, err);
        }
    });

    app.get('/api/drink-additives/:drinkId', async (req, res) => {
        const drinkId = req.params.drinkId;
        const query = `
            SELECT a.* FROM additives a
            JOIN drink_additives da ON da.additive_id = a.id
            WHERE da.drink_id = ?
            ORDER BY a.code ASC
        `;

        try {
            const [rows] = await safeQuery(query, [drinkId]);
            res.json(rows || []);
        } catch (err) {
            console.error('Drink Additives API Error:', err);
            apiError(res, 500, err);
        }
    });

    app.post('/api/drink-additives/:drinkId', async (req, res) => {
        const drinkId = req.params.drinkId;
        const { additiveIds } = req.body;

        try {
            // Lösche bestehende Zuordnungen
            await safeQuery('DELETE FROM drink_additives WHERE drink_id = ?', [drinkId]);

            // Füge neue Zuordnungen hinzu
            if (additiveIds && additiveIds.length > 0) {
                const values = additiveIds.map(id => [drinkId, id]);
                await safeQuery('INSERT INTO drink_additives (drink_id, additive_id) VALUES ?', [values]);
            }

            io.emit('drinkAdditivesChanged', { drinkId });
            res.json({ success: true });
        } catch (err) {
            console.error('Update Drink Additives Error:', err);
            apiError(res, 500, err);
        }
    });

    // API-Endpunkte für Zusatzstoffe
    app.get('/api/additives/:id', async (req, res) => {
        const id = req.params.id;
        const query = 'SELECT * FROM additives WHERE id = ?';

        try {
            const [rows] = await safeQuery(query, [id]);
            if (rows.length > 0) {
                res.json(rows[0]);
            } else {
                res.status(404).json({ error: 'Zusatzstoff nicht gefunden' });
            }
        } catch (err) {
            console.error('Fehler beim Laden des Zusatzstoffs:', err);
            apiError(res, 500, err);
        }
    });

    app.post('/api/additives', async (req, res) => {
        const { code, name, show_in_footer = true } = req.body;
        try {
            const query = 'INSERT INTO additives (code, name, show_in_footer) VALUES (?, ?, ?)';
            const [result] = await safeQuery(query, [code, name, show_in_footer]);
            io.emit('additivesChanged');
            res.json({ id: result.insertId });
        } catch (err) {
            apiError(res, 500, err);
        }
    });

    app.put('/api/additives/:id', async (req, res) => {
        const id = req.params.id;
        const { code, name } = req.body;
        const query = 'UPDATE additives SET code = ?, name = ? WHERE id = ?';

        try {
            await safeQuery(query, [code, name, id]);
            io.emit('additivesChanged');
            res.json({ success: true });
        } catch (err) {
            console.error('Fehler beim Aktualisieren des Zusatzstoffs:', err);
            apiError(res, 500, err);
        }
    });

    app.delete('/api/additives/:id', async (req, res) => {
        const id = req.params.id;
        const query = 'DELETE FROM additives WHERE id = ?';

        try {
            await safeQuery(query, [id]);
            io.emit('additivesChanged');
            res.json({ success: true });
        } catch (err) {
            console.error('Fehler beim Löschen des Zusatzstoffs:', err);
            apiError(res, 500, err);
        }
    });

    // API-Endpunkt für die Zusatzstoff-Liste
    app.get('/api/additives-list', async (req, res) => {
        try {
            const [rows] = await safeQuery(`
                SELECT * 
                FROM additives
                WHERE show_in_footer = TRUE
                ORDER BY code ASC
            `);
            res.json(rows);
        } catch (err) {
            console.error('Additives List API Error:', err);
            apiError(res, 500, err);
        }
    });

    // Neue Route für das Aktualisieren der Footer-Sichtbarkeit
    app.put('/api/additives/:id/toggle-footer', async (req, res) => {
        const id = req.params.id;
        const { show_in_footer } = req.body;

        try {
            await safeQuery('UPDATE additives SET show_in_footer = ? WHERE id = ?', [show_in_footer, id]);
            io.emit('additivesChanged');
            res.json({ success: true });
        } catch (err) {
            console.error('Toggle Footer Visibility Error:', err);
            apiError(res, 500, err);
        }
    });
}

module.exports = {
    registerAdditivesRoutes,
};
