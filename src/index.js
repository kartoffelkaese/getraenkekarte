const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');
const auth = require('./middleware/auth');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// Admin-Bereich ohne Authentifizierung
// app.use('/admin.html', auth);
// app.use('/js/admin.js', auth);

// Routen für die verschiedenen Karten
app.get('/haupttheke', (req, res) => {
    res.sendFile('haupttheke.html', { root: './public' });
});

app.get('/theke-hinten', (req, res) => {
    res.sendFile('theke-hinten.html', { root: './public' });
});

app.get('/jugendliche', (req, res) => {
    res.sendFile('jugendliche.html', { root: './public' });
});

// Umleitung von / auf /haupttheke
app.get('/', (req, res) => {
    res.redirect('/haupttheke');
});

// Statische Dateien
app.use(express.static('public'));

// Datenbank-Verbindung
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    debug: true
}).promise();

// Verbindung testen
db.query('SELECT 1')
  .then(() => {
    console.log('Datenbankverbindung erfolgreich hergestellt');
  })
  .catch((err) => {
    console.error('Fehler bei der Datenbankverbindung:', err);
    process.exit(1);
  });

// API-Endpunkte mit Location-Parameter
app.get('/api/drinks/:location', async (req, res) => {
    const location = req.params.location;
    const query = `
        SELECT d.id, d.name, d.preis, d.category_id,
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
        const [rows] = await db.query(query, [location, location]);
        console.log('Drinks API Response:', Array.isArray(rows), rows?.length);
        res.json(rows || []);
    } catch (err) {
        console.error('Drinks API Error:', err);
        res.status(500).json({ error: err.message });
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
        const [rows] = await db.query(query, [location]);
        console.log('Categories API Response:', Array.isArray(rows), rows?.length);
        res.json(rows || []);
    } catch (err) {
        console.error('Categories API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update drink status für spezifische Karte
app.post('/api/drinks/toggle/:location', async (req, res) => {
    const { id, is_active } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, is_active)
        VALUES (?, 'drink', ?, ?)
        ON DUPLICATE KEY UPDATE is_active = ?
    `;
    
    try {
        await db.query(query, [location, id, is_active, is_active]);
        io.emit('drinkStatusChanged', { id, is_active, location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Preisanzeige für ein Getränk auf spezifischer Karte
app.post('/api/drinks/toggle-price/:location', async (req, res) => {
    const { id, show_price } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, show_price)
        VALUES (?, 'drink', ?, ?)
        ON DUPLICATE KEY UPDATE show_price = ?
    `;
    
    try {
        await db.query(query, [location, id, show_price, show_price]);
        io.emit('drinkPriceChanged', { id, show_price, location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Preisanzeige für eine Kategorie auf spezifischer Karte
app.post('/api/categories/toggle-prices/:location', async (req, res) => {
    const { id, show_prices } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, show_price)
        VALUES (?, 'category', ?, ?)
        ON DUPLICATE KEY UPDATE show_price = ?
    `;
    
    try {
        await db.query(query, [location, id, show_prices, show_prices]);
        io.emit('categoryPricesChanged', { id, show_prices, location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Sichtbarkeit für eine Kategorie auf spezifischer Karte
app.post('/api/categories/toggle-visibility/:location', async (req, res) => {
    const { id, is_visible } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, is_active)
        VALUES (?, 'category', ?, ?)
        ON DUPLICATE KEY UPDATE is_active = ?
    `;
    
    try {
        await db.query(query, [location, id, is_visible, is_visible]);
        io.emit('categoryVisibilityChanged', { id, is_visible, location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Spaltenumbruch für eine Kategorie auf spezifischer Karte
app.post('/api/categories/toggle-column-break/:location', async (req, res) => {
    const { id, force_column_break } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, force_column_break)
        VALUES (?, 'category', ?, ?)
        ON DUPLICATE KEY UPDATE force_column_break = ?
    `;
    
    try {
        await db.query(query, [location, id, force_column_break, force_column_break]);
        io.emit('categoryColumnBreakChanged', { id, force_column_break, location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Sortierreihenfolge einer Kategorie auf spezifischer Karte
app.post('/api/categories/update-order/:location', async (req, res) => {
    const { id, sort_order } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, sort_order)
        VALUES (?, 'category', ?, ?)
        ON DUPLICATE KEY UPDATE sort_order = ?
    `;
    
    try {
        await db.query(query, [location, id, sort_order, sort_order]);
        io.emit('categorySortChanged', { location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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
        const [rows] = await db.query(query, [location, location, location]);
        console.log('Ads API Response:', Array.isArray(rows), rows?.length);
        res.json(rows || []);
    } catch (err) {
        console.error('Ads API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Toggle Aktivierung einer Werbung auf spezifischer Karte
app.post('/api/ads/toggle/:location', async (req, res) => {
    const { id, is_active } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, is_active)
        VALUES (?, 'ad', ?, ?)
        ON DUPLICATE KEY UPDATE is_active = ?
    `;
    
    try {
        await db.query(query, [location, id, is_active, is_active]);
        io.emit('adsChanged', { location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Sortierreihenfolge einer Werbung auf spezifischer Karte
app.post('/api/ads/update-order/:location', async (req, res) => {
    const { id, sort_order } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO display_settings (location, element_type, element_id, sort_order)
        VALUES (?, 'ad', ?, ?)
        ON DUPLICATE KEY UPDATE sort_order = ?
    `;
    
    try {
        await db.query(query, [location, id, sort_order, sort_order]);
        io.emit('adsChanged', { location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Hole Logo-Einstellungen für spezifische Karte
app.get('/api/logo/:location', async (req, res) => {
    const location = req.params.location;
    const query = `
        SELECT * FROM logo_settings
        WHERE location = ?
    `;
    
    try {
        const [rows] = await db.query(query, [location]);
        res.json(rows[0] || { is_active: true, sort_order: 0, force_column_break: false });
    } catch (err) {
        console.error('Logo API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Update Logo-Position
app.post('/api/logo/update-order/:location', async (req, res) => {
    const { sort_order } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO logo_settings (location, sort_order)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE sort_order = ?
    `;
    
    try {
        await db.query(query, [location, sort_order, sort_order]);
        io.emit('logoChanged', { location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Logo-Sichtbarkeit
app.post('/api/logo/toggle/:location', async (req, res) => {
    const { is_active } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO logo_settings (location, is_active)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE is_active = ?
    `;
    
    try {
        await db.query(query, [location, is_active, is_active]);
        io.emit('logoChanged', { location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Toggle Logo-Spaltenumbruch
app.post('/api/logo/toggle-column-break/:location', async (req, res) => {
    const { force_column_break } = req.body;
    const location = req.params.location;
    
    const query = `
        INSERT INTO logo_settings (location, force_column_break)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE force_column_break = ?
    `;
    
    try {
        await db.query(query, [location, force_column_break, force_column_break]);
        io.emit('logoChanged', { location });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API-Endpunkte für Zusatzstoffe
app.get('/api/additives', async (req, res) => {
    const query = `
        SELECT * FROM additives
        ORDER BY code ASC
    `;
    
    try {
        const [rows] = await db.query(query);
        res.json(rows || []);
    } catch (err) {
        console.error('Additives API Error:', err);
        res.status(500).json({ error: err.message });
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
        const [rows] = await db.query(query, [drinkId]);
        res.json(rows || []);
    } catch (err) {
        console.error('Drink Additives API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/drink-additives/:drinkId', async (req, res) => {
    const drinkId = req.params.drinkId;
    const { additiveIds } = req.body;
    
    try {
        // Lösche bestehende Zuordnungen
        await db.query('DELETE FROM drink_additives WHERE drink_id = ?', [drinkId]);
        
        // Füge neue Zuordnungen hinzu
        if (additiveIds && additiveIds.length > 0) {
            const values = additiveIds.map(id => [drinkId, id]);
            await db.query('INSERT INTO drink_additives (drink_id, additive_id) VALUES ?', [values]);
        }
        
        io.emit('drinkAdditivesChanged', { drinkId });
        res.json({ success: true });
    } catch (err) {
        console.error('Update Drink Additives Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// API-Endpunkte für Zusatzstoffe
app.get('/api/additives/:id', async (req, res) => {
    const id = req.params.id;
    const query = 'SELECT * FROM additives WHERE id = ?';
    
    try {
        const [rows] = await db.query(query, [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Zusatzstoff nicht gefunden' });
        }
    } catch (err) {
        console.error('Fehler beim Laden des Zusatzstoffs:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/additives', async (req, res) => {
    const { code, name } = req.body;
    const query = 'INSERT INTO additives (code, name) VALUES (?, ?)';
    
    try {
        await db.query(query, [code, name]);
        io.emit('additivesChanged');
        res.json({ success: true });
    } catch (err) {
        console.error('Fehler beim Erstellen des Zusatzstoffs:', err);
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/additives/:id', async (req, res) => {
    const id = req.params.id;
    const { code, name } = req.body;
    const query = 'UPDATE additives SET code = ?, name = ? WHERE id = ?';
    
    try {
        await db.query(query, [code, name, id]);
        io.emit('additivesChanged');
        res.json({ success: true });
    } catch (err) {
        console.error('Fehler beim Aktualisieren des Zusatzstoffs:', err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/additives/:id', async (req, res) => {
    const id = req.params.id;
    const query = 'DELETE FROM additives WHERE id = ?';
    
    try {
        await db.query(query, [id]);
        io.emit('additivesChanged');
        res.json({ success: true });
    } catch (err) {
        console.error('Fehler beim Löschen des Zusatzstoffs:', err);
        res.status(500).json({ error: err.message });
    }
});

// API-Endpunkt für die Zusatzstoff-Liste
app.get('/api/additives-list', async (req, res) => {
    const query = `
        SELECT code, name 
        FROM additives 
        ORDER BY CAST(code AS SIGNED)
    `;
    
    try {
        const [rows] = await db.query(query);
        res.json(rows || []);
    } catch (err) {
        console.error('Additives List API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Socket.io Verbindung
io.on('connection', (socket) => {
    socket.on('disconnect', () => {});
    socket.on('additivesChanged', () => {
        socket.broadcast.emit('additivesChanged');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT); 