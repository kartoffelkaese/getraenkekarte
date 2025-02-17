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

// Admin-Bereich mit Authentifizierung
app.use('/admin.html', auth);
app.use('/js/admin.js', auth);

// Statische Dateien
app.use(express.static('public'));

// Datenbank-Verbindung
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// API-Endpunkte
app.get('/api/drinks', (req, res) => {
    const query = `
        SELECT d.id, d.name, d.preis, d.is_active, d.category_id, d.show_price,
               c.name as category_name, c.show_prices as category_show_prices,
               c.is_visible as category_is_visible, c.sort_order as category_sort_order,
               c.force_column_break as category_force_column_break
        FROM drinks2 d 
        LEFT JOIN categories c ON d.category_id = c.id
        ORDER BY c.sort_order ASC, c.name ASC, d.name ASC
    `;
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Hole alle Kategorien
app.get('/api/categories', (req, res) => {
    const query = 'SELECT id, name, show_prices, is_visible, sort_order, force_column_break FROM categories ORDER BY sort_order ASC, name ASC';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Update drink status
app.post('/api/drinks/toggle', (req, res) => {
    const { id, is_active } = req.body;
    const query = 'UPDATE drinks2 SET is_active = ? WHERE id = ?';
    
    db.query(query, [is_active, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('drinkStatusChanged', { id, is_active });
        res.json({ success: true });
    });
});

// Toggle Preisanzeige für ein Getränk
app.post('/api/drinks/toggle-price', (req, res) => {
    const { id, show_price } = req.body;
    const query = 'UPDATE drinks2 SET show_price = ? WHERE id = ?';
    
    db.query(query, [show_price, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('drinkPriceChanged', { id, show_price });
        res.json({ success: true });
    });
});

// Toggle Preisanzeige für eine Kategorie
app.post('/api/categories/toggle-prices', (req, res) => {
    const { id, show_prices } = req.body;
    const query = 'UPDATE categories SET show_prices = ? WHERE id = ?';
    
    db.query(query, [show_prices, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('categoryPricesChanged', { id, show_prices });
        res.json({ success: true });
    });
});

// Toggle Sichtbarkeit für eine Kategorie
app.post('/api/categories/toggle-visibility', (req, res) => {
    const { id, is_visible } = req.body;
    const query = 'UPDATE categories SET is_visible = ? WHERE id = ?';
    
    db.query(query, [is_visible, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('categoryVisibilityChanged', { id, is_visible });
        res.json({ success: true });
    });
});

// Neue API für das Aktualisieren der Sortierreihenfolge
app.post('/api/categories/update-order', (req, res) => {
    const { id, sort_order } = req.body;
    const query = 'UPDATE categories SET sort_order = ? WHERE id = ?';
    
    db.query(query, [sort_order, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('categorySortChanged');
        res.json({ success: true });
    });
});

// Toggle Spaltenumbruch für eine Kategorie
app.post('/api/categories/toggle-column-break', (req, res) => {
    const { id, force_column_break } = req.body;
    const query = 'UPDATE categories SET force_column_break = ? WHERE id = ?';
    
    db.query(query, [force_column_break, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('categoryColumnBreakChanged');
        res.json({ success: true });
    });
});

// Hole alle Werbungen
app.get('/api/ads', (req, res) => {
    const query = 'SELECT id, name, image_path, price, is_active, sort_order FROM ads ORDER BY sort_order ASC';
    db.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Toggle Aktivierung einer Werbung
app.post('/api/ads/toggle', (req, res) => {
    const { id, is_active } = req.body;
    const query = 'UPDATE ads SET is_active = ? WHERE id = ?';
    
    db.query(query, [is_active, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('adsChanged');
        res.json({ success: true });
    });
});

// Update Sortierreihenfolge einer Werbung
app.post('/api/ads/update-order', (req, res) => {
    const { id, sort_order } = req.body;
    const query = 'UPDATE ads SET sort_order = ? WHERE id = ?';
    
    db.query(query, [sort_order, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        io.emit('adsChanged');
        res.json({ success: true });
    });
});

// Socket.io Verbindung
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
}); 