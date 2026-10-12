const multer = require('multer');
const fs = require('fs');
const { IMAGES_DIR, UPLOADS_DIR } = require('../config/paths');
const { randomImageFilename, imageFileFilter } = require('./uploadValidation');

function createImageUpload(dir, maxBytes) {
    const storage = multer.diskStorage({
        destination: function(req, file, cb) {
            // Stelle sicher, dass das Verzeichnis existiert
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: function(req, file, cb) {
            cb(null, randomImageFilename(file.originalname));
        }
    });

    return multer({
        storage,
        limits: { fileSize: maxBytes },
        fileFilter: imageFileFilter,
    });
}

/** Upload für Werbung und Gerichte → public/images (max. 5 MB) */
const upload = createImageUpload(IMAGES_DIR, 5 * 1024 * 1024);

/** Upload für Bilder-Karten → public/uploads (max. 10 MB) */
const imageUpload = createImageUpload(UPLOADS_DIR, 10 * 1024 * 1024);

module.exports = {
    upload,
    imageUpload,
};
