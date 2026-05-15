const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

function extensionFromName(originalname) {
    const ext = path.extname(originalname || '').toLowerCase();
    return ALLOWED_EXTENSIONS.has(ext) ? ext : null;
}

function validateImageBuffer(buffer) {
    if (!buffer || buffer.length < 12) {
        return false;
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return true;
    }
    if (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47
    ) {
        return true;
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
        return true;
    }
    if (
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
    ) {
        return true;
    }
    return false;
}

function randomImageFilename(originalname) {
    const ext = extensionFromName(originalname) || '.jpg';
    return `${crypto.randomUUID()}${ext}`;
}

function imageFileFilter(req, file, cb) {
    const ext = extensionFromName(file.originalname);
    if (!ext) {
        return cb(new Error('Nur JPG, PNG, GIF und WebP sind erlaubt.'), false);
    }
    cb(null, true);
}

function validateUploadedFile(file) {
    if (!file) {
        return false;
    }
    const buffer = file.buffer || (file.path ? fs.readFileSync(file.path) : null);
    return buffer ? validateImageBuffer(buffer) : false;
}

module.exports = {
    ALLOWED_EXTENSIONS,
    extensionFromName,
    validateImageBuffer,
    randomImageFilename,
    imageFileFilter,
    validateUploadedFile,
};
