const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { readJson, writeJsonAtomic } = require('../src/utils/jsonConfig');

let tmpDir;
beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'getraenkekarte-test-'));
});
afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readJson', () => {
    it('liefert Fallback, wenn die Datei fehlt', () => {
        assert.deepEqual(readJson(path.join(tmpDir, 'fehlt.json'), { a: 1 }), { a: 1 });
    });

    it('liefert Fallback bei kaputtem JSON statt zu werfen', () => {
        const file = path.join(tmpDir, 'kaputt.json');
        fs.writeFileSync(file, '{"card": "haupt');
        const original = console.error;
        console.error = () => {};
        try {
            assert.deepEqual(readJson(file, { card: 'haupttheke' }), { card: 'haupttheke' });
        } finally {
            console.error = original;
        }
    });

    it('gibt eine Kopie des Fallbacks zurück', () => {
        const fallback = { list: [] };
        readJson(path.join(tmpDir, 'fehlt.json'), fallback).list.push(1);
        assert.deepEqual(fallback, { list: [] });
    });
});

describe('writeJsonAtomic', () => {
    it('schreibt lesbares JSON und hinterlässt keine tmp-Dateien', () => {
        const file = path.join(tmpDir, 'config.json');
        writeJsonAtomic(file, { fontSize: 'large' });
        writeJsonAtomic(file, { fontSize: 'small' });
        assert.deepEqual(readJson(file), { fontSize: 'small' });
        assert.deepEqual(fs.readdirSync(tmpDir), ['config.json']);
    });
});
