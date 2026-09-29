const multer = require('multer');
const fs = require('fs');
const { IMAGES_DIR, UPLOADS_DIR } = require('../config/paths');
const { randomImageFilename, imageFileFilter } = require('./uploadValidation');

// Multer-Konfiguration für images/ (Werbung, Gerichte)
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Stelle sicher, dass das Verzeichnis existiert
        if (!fs.existsSync(IMAGES_DIR)) {
            fs.mkdirSync(IMAGES_DIR, { recursive: true });
        }
        cb(null, IMAGES_DIR);
    },
    filename: function(req, file, cb) {
        cb(null, randomImageFilename(file.originalname));
    }
});

/** Upload für Werbung und Gerichte → public/images (max. 5 MB) */
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: imageFileFilter,
});

// Multer-Konfiguration für uploads/
const imageStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        cb(null, UPLOADS_DIR);
    },
    filename: function(req, file, cb) {
        cb(null, randomImageFilename(file.originalname));
    }
});

/** Upload für Bilder-Karten → public/uploads (max. 10 MB) */
const imageUpload = multer({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFileFilter,
});

module.exports = {
    upload,
    imageUpload,
};
