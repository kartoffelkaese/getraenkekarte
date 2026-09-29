const fs = require('fs');
const { safePathJoin } = require('../utils/safePath');
const { validateUploadedFile } = require('../utils/uploadValidation');
const { imageUpload } = require('../utils/uploads');
const { UPLOADS_DIR } = require('../config/paths');

/** Bilder-Karten: Upload, Liste, Löschen (public/uploads). */

function registerImagesRoutes(app, { io }) {
    // POST /api/images – Einzelnes Bild hochladen
    app.post('/api/images', imageUpload.single('image'), (req, res) => {
        if (!req.file) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen.' });
        }
        if (!validateUploadedFile(req.file)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Ungültiges Bildformat.' });
        }
        io.emit('imagesChanged');
        res.json({ success: true, filename: req.file.filename });
    });

    // GET /api/images – Liste aller Bilder
    app.get('/api/images', (req, res) => {
        fs.readdir(UPLOADS_DIR, (err, files) => {
            if (err) return res.status(500).json({ error: 'Fehler beim Lesen des Upload-Ordners.' });
            const images = files.filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i)).map(filename => ({
                id: filename,
                filename,
                url: `/uploads/${filename}`
            }));
            res.json(images);
        });
    });

    // DELETE /api/images/all – Alle Bilder löschen
    app.delete('/api/images/all', (req, res) => {
        fs.readdir(UPLOADS_DIR, (err, files) => {
            if (err) return res.status(500).json({ error: 'Fehler beim Lesen des Upload-Ordners.' });
            let errorCount = 0;
            files.forEach(file => {
                if (file.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                    try {
                        const safeFile = safePathJoin(UPLOADS_DIR, file);
                        if (safeFile) {
                            fs.unlinkSync(safeFile);
                        }
                    } catch {
                        errorCount++;
                    }
                }
            });
            io.emit('imagesChanged');
            if (errorCount > 0) {
                return res.status(500).json({ error: `${errorCount} Dateien konnten nicht gelöscht werden.` });
            }
            res.json({ success: true });
        });
    });

    // DELETE /api/images/:id – Einzelnes Bild löschen
    app.delete('/api/images/:id', (req, res) => {
        const filePath = safePathJoin(UPLOADS_DIR, req.params.id);
        if (!filePath) {
            return res.status(400).json({ error: 'Ungültiger Dateiname.' });
        }
        fs.unlink(filePath, err => {
            if (err) return res.status(404).json({ error: 'Datei nicht gefunden.' });
            io.emit('imagesChanged');
            res.json({ success: true });
        });
    });
}

module.exports = {
    registerImagesRoutes,
};
