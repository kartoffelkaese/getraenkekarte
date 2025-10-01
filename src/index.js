const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const cors = require('cors');
const auth = require('./middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
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

// Admin-Bereich mit Authentifizierung
app.use('/admin.html', auth);
app.use('/js/admin.js', auth);

// Routen für die verschiedenen Karten
app.get('/haupttheke', (req, res) => {
    res.sendFile('haupttheke.html', { root: './public' });
});

app.get('/theke-hinten', (req, res) => {
    res.sendFile('theke-hinten.html', { root: './public' });
});

app.get('/theke-hinten-bilder', (req, res) => {
    res.sendFile('theke-hinten-bilder.html', { root: './public' });
});

app.get('/bilder', (req, res) => {
    res.sendFile('bilder.html', { root: './public' });
});

app.get('/jugendliche', (req, res) => {
    res.sendFile('jugendliche.html', { root: './public' });
});

// Umleitung von / auf /haupttheke
app.get('/', (req, res) => {
    res.redirect('/haupttheke');
});

// Route für die Speisekarte
app.get('/speisekarte', (req, res) => {
    res.sendFile('speisekarte.html', { root: './public' });
});

// Route für den automatischen Wechsel
app.get('/cycle', (req, res) => {
    res.sendFile('cycle.html', { root: './public' });
});

// Route für den automatischen Wechsel (Jugend)
app.get('/cycle-jugend', (req, res) => {
    res.sendFile('cycle-jugend.html', { root: './public' });
});

// Statische Dateien
app.use(express.static('public'));

// API-Endpunkt für Version
app.get('/api/version', (req, res) => {
    try {
        const versionData = require('../version.json');
        res.json(versionData);
    } catch (error) {
        console.error('Fehler beim Laden der Version:', error);
        res.json({ version: '3.1.0', buildDate: '2024-12-19', description: 'Getränkekarte Admin Interface' });
    }
});

// API-Endpunkte für Cycle-Konfiguration
app.get('/api/cycle-config', (req, res) => {
    try {
        const configPath = path.join(__dirname, '../cycle-config.json');
        if (fs.existsSync(configPath)) {
            const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            res.json(configData);
        } else {
            // Standard-Konfiguration
            const defaultConfig = {
                standard: { firstTime: 15, secondTime: 15 },
                jugend: { firstTime: 15, secondTime: 10 }
            };
            res.json(defaultConfig);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Cycle-Konfiguration:', error);
        res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
    }
});

app.post('/api/cycle-config', (req, res) => {
    try {
        const { type, firstTime, secondTime } = req.body;
        
        if (!type || !firstTime || !secondTime) {
            return res.status(400).json({ error: 'Alle Felder sind erforderlich' });
        }
        
        if (firstTime < 5 || firstTime > 300 || secondTime < 5 || secondTime > 300) {
            return res.status(400).json({ error: 'Zeiten müssen zwischen 5 und 300 Sekunden liegen' });
        }
        
        const configPath = path.join(__dirname, '../cycle-config.json');
        let config = {};
        
        // Lade bestehende Konfiguration
        if (fs.existsSync(configPath)) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        
        // Aktualisiere Konfiguration
        config[type] = { firstTime: parseInt(firstTime), secondTime: parseInt(secondTime) };
        
        // Speichere Konfiguration
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        res.json({ success: true, message: 'Cycle-Konfiguration gespeichert' });
    } catch (error) {
        console.error('Fehler beim Speichern der Cycle-Konfiguration:', error);
        res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
    }
});

// Datenbank-Verbindung
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}).promise();

// Erstelle die dishes-Tabelle, falls sie nicht existiert
db.query(`
    CREATE TABLE IF NOT EXISTS dishes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        image_path VARCHAR(255),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE
    )
`).catch(error => {
    console.error('Fehler beim Erstellen der dishes-Tabelle:', error);
});

// Konfiguration für Multer (Datei-Upload)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = './public/images';
        
        // Stelle sicher, dass das Verzeichnis existiert
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Behalte den originalen Dateinamen bei und füge nur einen Zeitstempel als Suffix hinzu
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname);
        cb(null, `${originalName}-${timestamp}${extension}`);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
    fileFilter: function(req, file, cb) {
        // Erlaube nur Bilder
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
            return cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
        cb(null, true);
    }
});

// === Bilder-API ===
const uploadDir = path.join(__dirname, '../public/uploads');

// Multer-Konfiguration für uploads/
const imageStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname);
        cb(null, `${originalName}-${timestamp}${extension}`);
    }
});
const imageUpload = multer({ 
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: function(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
            return cb(new Error('Nur Bilddateien sind erlaubt!'), false);
        }
        cb(null, true);
    }
});

// POST /api/images – Einzelnes Bild hochladen
app.post('/api/images', imageUpload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Keine Datei hochgeladen.' });
    }
    res.json({ success: true, filename: req.file.filename });
});

// GET /api/images – Liste aller Bilder
app.get('/api/images', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Lesen des Upload-Ordners.' });
        const images = files.filter(f => f.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)).map(filename => ({
            id: filename,
            filename,
            url: `/uploads/${filename}`
        }));
        res.json(images);
    });
});

// DELETE /api/images/all – Alle Bilder löschen
app.delete('/api/images/all', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        if (err) return res.status(500).json({ error: 'Fehler beim Lesen des Upload-Ordners.' });
        let errorCount = 0;
        files.forEach(file => {
            if (file.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
                try {
                    fs.unlinkSync(path.join(uploadDir, file));
                } catch (e) {
                    errorCount++;
                }
            }
        });
        if (errorCount > 0) {
            return res.status(500).json({ error: `${errorCount} Dateien konnten nicht gelöscht werden.` });
        }
        res.json({ success: true });
    });
});

// DELETE /api/images/:id – Einzelnes Bild löschen
app.delete('/api/images/:id', (req, res) => {
    const file = req.params.id;
    const filePath = path.join(uploadDir, file);
    fs.unlink(filePath, err => {
        if (err) return res.status(404).json({ error: 'Datei nicht gefunden.' });
        res.json({ success: true });
    });
});

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
    const { code, name, show_in_footer = true } = req.body;
    try {
        const query = 'INSERT INTO additives (code, name, show_in_footer) VALUES (?, ?, ?)';
        const [result] = await db.query(query, [code, name, show_in_footer]);
        io.emit('additivesChanged');
        res.json({ id: result.insertId });
    } catch (err) {
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
    try {
        const [rows] = await db.query(`
            SELECT * 
            FROM additives
            WHERE show_in_footer = TRUE
            ORDER BY code ASC
        `);
        res.json(rows);
    } catch (err) {
        console.error('Additives List API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Neue Route für das Aktualisieren der Footer-Sichtbarkeit
app.put('/api/additives/:id/toggle-footer', async (req, res) => {
    const id = req.params.id;
    const { show_in_footer } = req.body;
    
    try {
        await db.query('UPDATE additives SET show_in_footer = ? WHERE id = ?', [show_in_footer, id]);
        io.emit('additivesChanged');
        res.json({ success: true });
    } catch (err) {
        console.error('Toggle Footer Visibility Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// API-Endpunkt zum Hochladen von Bildern
app.post('/api/upload-image', auth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'Keine Datei hochgeladen' });
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
        
        await db.query(query, [name || '', imagePath, price || null, isActive, sortOrder, cardType]);
        
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
        res.status(500).json({ success: false, error: err.message });
    }
});

// API-Endpunkt zum Löschen einer Werbung
app.delete('/api/ads/:id', auth, async (req, res) => {
    const adId = req.params.id;
    
    try {
        // Hole zuerst den Bildpfad aus der Datenbank
        const [rows] = await db.query('SELECT image_path FROM ads WHERE id = ?', [adId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Werbung nicht gefunden' });
        }
        
        const imagePath = rows[0].image_path;
        const fullImagePath = path.join(__dirname, '..', 'public', imagePath);
        
        // Lösche den Datenbankeintrag
        await db.query('DELETE FROM ads WHERE id = ?', [adId]);
        
        // Lösche das Bild, falls es existiert
        if (fs.existsSync(fullImagePath)) {
            fs.unlinkSync(fullImagePath);
        }
        
        // Benachrichtige alle Clients über die Änderung
        io.emit('adsChanged', { location: 'all' });
        
        res.json({ success: true, message: 'Werbung erfolgreich gelöscht' });
    } catch (err) {
        console.error('Fehler beim Löschen der Werbung:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// API-Endpunkt zum Exportieren einer Karte als PNG
app.get('/api/export/:location', auth, async (req, res) => {
    const location = req.params.location;
    const validLocations = ['haupttheke', 'theke-hinten', 'theke-hinten-bilder', 'jugendliche', 'speisekarte', 'bilder'];
    
    if (!validLocations.includes(location)) {
        return res.status(400).json({ success: false, error: 'Ungültige Karten-Location' });
    }
    
    let browser;
    try {
        // Puppeteer Browser starten
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Viewport auf 1920x1080 setzen
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 1
        });
        
        // URL der Karte laden
        const url = `http://localhost:${process.env.PORT || 3000}/${location}`;
        // Für Jugendkarte: Andere Warte-Strategie wegen Firebase
        const waitUntil = location === 'jugendliche' ? 'domcontentloaded' : 'networkidle0';
        const timeout = location === 'jugendliche' ? 60000 : 30000;
        
        await page.goto(url, { 
            waitUntil: waitUntil,
            timeout: timeout 
        });
        
        // Für Jugendkarte: Warten bis Events geladen sind
        if (location === 'jugendliche') {
            try {
                // Warten bis Events-Container existiert
                await page.waitForSelector('#events-container', { timeout: 10000 });
                
                // Warten bis Firebase Events geladen sind (oder Timeout)
                await page.waitForFunction(() => {
                    const container = document.getElementById('events-container');
                    return container && (container.children.length > 0 || container.textContent.includes('Keine anstehenden Events'));
                }, { timeout: 15000 });
                
                console.log('Events erfolgreich geladen für Jugendkarte');
            } catch (error) {
                console.log('Events-Loading Timeout, fahre trotzdem fort...');
            }
        }
        
        // Warten bis alle Inhalte geladen sind (länger für Jugendkarte wegen Events)
        const waitTime = location === 'jugendliche' ? 5000 : 3000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Screenshot erstellen
        const screenshot = await page.screenshot({
            type: 'png',
            fullPage: false,
            clip: {
                x: 0,
                y: 0,
                width: 1920,
                height: 1080
            }
        });
        
        // Browser schließen
        await browser.close();
        
        // PNG als Response senden
        res.set({
            'Content-Type': 'image/png',
            'Content-Disposition': `attachment; filename="${location}-export-${Date.now()}.png"`,
            'Content-Length': screenshot.length
        });
        
        res.send(screenshot);
        
    } catch (error) {
        console.error('Fehler beim Exportieren der Karte:', error);
        
        if (browser) {
            await browser.close();
        }
        
        res.status(500).json({ 
            success: false, 
            error: 'Fehler beim Exportieren der Karte: ' + error.message 
        });
    }
});

// API-Endpunkt für alle Gerichte
app.get('/api/dishes', async (req, res) => {
    const query = `
        SELECT * FROM dishes
        ORDER BY sort_order ASC, name ASC
    `;
    
    try {
        const [rows] = await db.query(query);
        res.json(rows || []);
    } catch (err) {
        console.error('Dishes API Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Speisekarten-API Endpunkte
app.get('/api/dishes/:id', async (req, res) => {
    try {
        const [dishes] = await db.query('SELECT * FROM dishes WHERE id = ?', [req.params.id]);
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
            image_path = `/images/${req.file.filename}`;
        }

        const [result] = await db.query(
            'INSERT INTO dishes (name, price, description, image_path, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)',
            [name, price, description, image_path, sort_order || 0, is_active === 'true']
        );

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
            image_path = `/images/${req.file.filename}`;
        }

        const query = image_path 
            ? 'UPDATE dishes SET name = ?, price = ?, description = ?, image_path = ?, sort_order = ?, is_active = ? WHERE id = ?'
            : 'UPDATE dishes SET name = ?, price = ?, description = ?, sort_order = ?, is_active = ? WHERE id = ?';

        const params = image_path 
            ? [name, price, description, image_path, sort_order || 0, is_active === 'true', req.params.id]
            : [name, price, description, sort_order || 0, is_active === 'true', req.params.id];

        await db.query(query, params);

        // Emittiere das Event mit der Location
        io.emit('dishesChanged', { location: 'speisekarte' });

        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Gerichts:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren des Gerichts' });
    }
});

app.delete('/api/dishes/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM dishes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Löschen des Gerichts:', error);
        res.status(500).json({ error: 'Fehler beim Löschen des Gerichts' });
    }
});

app.put('/api/dishes/:id/status', async (req, res) => {
    try {
        const { is_active } = req.body;
        await db.query('UPDATE dishes SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
        
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
        await db.query('UPDATE dishes SET sort_order = ? WHERE id = ?', [sort_order, req.params.id]);
        
        // Emittiere das Event mit der Location
        io.emit('dishesChanged', { location: 'speisekarte' });
        
        res.json({ success: true });
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Reihenfolge:', error);
        res.status(500).json({ error: 'Fehler beim Aktualisieren der Reihenfolge' });
    }
});

// Socket.io Verbindung
io.on('connection', (socket) => {
    console.log('Neue Socket.IO Verbindung:', socket.id);
    
    socket.on('disconnect', (reason) => {
        console.log('Socket.IO Verbindung getrennt:', socket.id, 'Grund:', reason);
    });

    socket.on('error', (error) => {
        console.error('Socket.IO Fehler:', error);
    });

    socket.on('updateDrink', async (data) => {
        console.log('Update Drink Event empfangen:', {
            socketId: socket.id,
            location: data.location,
            drinkId: data.id,
            isActive: data.is_active
        });
        // ... existing code ...
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '127.0.0.1'); 