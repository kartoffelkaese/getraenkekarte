const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const {
    safePathJoin,
    isValidPresetFilename,
    parsePresetCard,
    isValidScheduleCard,
} = require('../src/utils/safePath');

describe('safePathJoin', () => {
    const base = path.join(__dirname, '../public/presets');

    it('neutralisiert Path-Traversal (bleibt im Basisverzeichnis)', () => {
        const resolved = safePathJoin(base, '../../../etc/passwd');
        assert.equal(resolved, path.join(base, 'passwd'));
        assert.ok(resolved.startsWith(base + path.sep));
    });

    it('lehnt leeren Pfad ab', () => {
        assert.equal(safePathJoin(base, ''), null);
        assert.equal(safePathJoin(base, null), null);
    });

    it('löst gültigen Dateinamen auf', () => {
        const resolved = safePathJoin(base, 'haupttheke-test.json');
        assert.equal(resolved, path.join(base, 'haupttheke-test.json'));
    });
});

describe('isValidPresetFilename', () => {
    it('akzeptiert gültige Preset-Dateinamen', () => {
        assert.equal(isValidPresetFilename('haupttheke-feier.json', 'haupttheke'), true);
    });

    it('lehnt falsches Präfix ab', () => {
        assert.equal(isValidPresetFilename('theke-hinten-x.json', 'haupttheke'), false);
    });
});

describe('parsePresetCard', () => {
    it('parst preset:-Referenz', () => {
        assert.deepEqual(parsePresetCard('preset:haupttheke-feier.json'), {
            filename: 'haupttheke-feier.json',
            location: 'haupttheke',
        });
    });

    it('lehnt unbekanntes Präfix ab', () => {
        assert.equal(parsePresetCard('preset:jugendliche-x.json'), null);
    });
});

describe('isValidScheduleCard', () => {
    it('akzeptiert registrierte Karten', () => {
        assert.equal(isValidScheduleCard('haupttheke'), true);
    });

    it('akzeptiert gültige Preset-Karten', () => {
        assert.equal(isValidScheduleCard('preset:theke-hinten-abend.json'), true);
    });

    it('lehnt unbekannte Slugs ab', () => {
        assert.equal(isValidScheduleCard('nicht-existiert'), false);
    });
});
