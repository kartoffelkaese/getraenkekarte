const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateNewDrink } = require('../src/routes/drinks');

const valid = { name: ' Spezi ', preis: '3,80', category_id: '1' };

describe('validateNewDrink', () => {
    it('bereinigt eine gültige Eingabe und setzt Standardwerte', () => {
        assert.deepEqual(validateNewDrink(valid).drink, {
            name: 'Spezi',
            preis: 3.8,
            category_id: 1,
            volume_normal: null,
            has_small_size: false,
            small_price: null,
            volume_small: null,
            is_active: false,
        });
    });

    it('übernimmt kleine Größe mit Preis und Volumen', () => {
        const { drink } = validateNewDrink({
            ...valid,
            volume_normal: '0.4L',
            has_small_size: true,
            small_price: 2.5,
            volume_small: ' 0.2L ',
            is_active: true,
        });
        assert.equal(drink.has_small_size, true);
        assert.equal(drink.small_price, 2.5);
        assert.equal(drink.volume_small, '0.2L');
        assert.equal(drink.volume_normal, '0.4L');
        assert.equal(drink.is_active, true);
    });

    it('verwirft Preis und Volumen der kleinen Größe, wenn sie nicht aktiv ist', () => {
        const { drink } = validateNewDrink({ ...valid, small_price: 2, volume_small: '0.2L' });
        assert.equal(drink.small_price, null);
        assert.equal(drink.volume_small, null);
    });

    it('lehnt fehlende oder ungültige Pflichtfelder ab', () => {
        assert.ok(validateNewDrink(null).error);
        assert.ok(validateNewDrink({ ...valid, name: '   ' }).error);
        assert.ok(validateNewDrink({ ...valid, name: 'x'.repeat(256) }).error);
        assert.ok(validateNewDrink({ ...valid, preis: '' }).error);
        assert.ok(validateNewDrink({ ...valid, preis: -1 }).error);
        assert.ok(validateNewDrink({ ...valid, preis: 1000 }).error);
        assert.ok(validateNewDrink({ ...valid, preis: 'abc' }).error);
        assert.ok(validateNewDrink({ ...valid, category_id: 0 }).error);
        assert.ok(validateNewDrink({ ...valid, category_id: 'x' }).error);
    });

    it('lehnt zu lange Größenangaben und fehlenden kleinen Preis ab', () => {
        assert.ok(validateNewDrink({ ...valid, volume_normal: 'x'.repeat(21) }).error);
        assert.ok(validateNewDrink({ ...valid, has_small_size: true }).error);
        assert.ok(
            validateNewDrink({ ...valid, has_small_size: true, small_price: 2, volume_small: 'x'.repeat(11) }).error
        );
    });
});
