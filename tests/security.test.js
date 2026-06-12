const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { isOriginAllowedForRequest } = require('../src/config/security');

describe('isOriginAllowedForRequest', () => {
    const saved = {};

    beforeEach(() => {
        saved.NODE_ENV = process.env.NODE_ENV;
        saved.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;
        saved.PUBLIC_ORIGIN = process.env.PUBLIC_ORIGIN;
        process.env.NODE_ENV = 'development';
        delete process.env.ALLOWED_ORIGINS;
        delete process.env.PUBLIC_ORIGIN;
    });

    afterEach(() => {
        process.env.NODE_ENV = saved.NODE_ENV;
        if (saved.ALLOWED_ORIGINS === undefined) delete process.env.ALLOWED_ORIGINS;
        else process.env.ALLOWED_ORIGINS = saved.ALLOWED_ORIGINS;
        if (saved.PUBLIC_ORIGIN === undefined) delete process.env.PUBLIC_ORIGIN;
        else process.env.PUBLIC_ORIGIN = saved.PUBLIC_ORIGIN;
    });

    it('erlaubt fehlende Origin', () => {
        const req = { headers: { host: 'localhost:3000' } };
        assert.equal(isOriginAllowedForRequest(req, undefined), true);
    });

    it('erlaubt localhost in Entwicklung', () => {
        const req = { headers: { host: 'localhost:3000' } };
        assert.equal(isOriginAllowedForRequest(req, 'http://localhost:3000'), true);
    });

    it('lehnt unbekannte Origin in Produktion ab', () => {
        process.env.NODE_ENV = 'production';
        const req = { headers: { host: 'example.com', 'x-forwarded-proto': 'https' } };
        assert.equal(isOriginAllowedForRequest(req, 'https://evil.example'), false);
    });
});
