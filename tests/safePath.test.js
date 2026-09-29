const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const {
    safePathJoin,
    isValidScheduleCard,
} = require('../src/utils/safePath');

describe('safePathJoin', () => {
    const base = path.join(__dirname, '../public/uploads');

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
        const resolved = safePathJoin(base, 'bild.png');
        assert.equal(resolved, path.join(base, 'bild.png'));
    });
});

describe('isValidScheduleCard', () => {
    it('akzeptiert registrierte Karten', () => {
        assert.equal(isValidScheduleCard('haupttheke'), true);
    });

    it('lehnt Preset-Karten ab (Funktion entfernt)', () => {
        assert.equal(isValidScheduleCard('preset:theke-hinten-abend.json'), false);
    });

    it('lehnt unbekannte Slugs ab', () => {
        assert.equal(isValidScheduleCard('nicht-existiert'), false);
    });
});
