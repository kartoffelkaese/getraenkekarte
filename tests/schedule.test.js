const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    isTimeInRange,
    isDateInRange,
    calculateCurrentCard,
    isRuleActive,
    getBerlinScheduleContext,
    validateScheduleConfig,
    migrateLegacyPresetRules,
} = require('../src/services/schedule');

describe('isTimeInRange', () => {
    it('prüft normale Tageszeiten', () => {
        assert.equal(isTimeInRange('12:00', '09:00', '17:00'), true);
        assert.equal(isTimeInRange('08:00', '09:00', '17:00'), false);
    });

    it('prüft Zeiträume über Mitternacht', () => {
        assert.equal(isTimeInRange('23:00', '22:00', '06:00'), true);
        assert.equal(isTimeInRange('12:00', '22:00', '06:00'), false);
    });
});

describe('isDateInRange', () => {
    it('prüft Einzeltag ohne Enddatum', () => {
        assert.equal(isDateInRange('2026-06-12', '2026-06-12', null), true);
        assert.equal(isDateInRange('2026-06-13', '2026-06-12', null), false);
    });

    it('prüft Datumsbereich', () => {
        assert.equal(isDateInRange('2026-06-12', '2026-06-10', '2026-06-15'), true);
    });
});

describe('calculateCurrentCard', () => {
    const monday10am = new Date('2026-06-08T10:00:00+02:00');

    it('bevorzugt Datumsregeln vor Wochenregeln', () => {
        const config = {
            defaultCard: 'cycle-1',
            rules: [
                {
                    id: 'weekly',
                    type: 'weekly',
                    days: [1],
                    startTime: '00:00',
                    endTime: '23:59',
                    card: 'jugendliche',
                },
                {
                    id: 'date',
                    type: 'date',
                    startDate: '2026-06-08',
                    startTime: '00:00',
                    endTime: '23:59',
                    card: 'hochzeit',
                },
            ],
        };
        assert.equal(calculateCurrentCard(config, monday10am), 'hochzeit');
    });

    it('nutzt defaultCard wenn keine Regel passt', () => {
        const config = {
            defaultCard: 'screensaver',
            rules: [],
        };
        assert.equal(calculateCurrentCard(config, monday10am), 'screensaver');
    });
});

describe('isRuleActive', () => {
    it('erkennt aktive Wochenregel', () => {
        const rule = {
            type: 'weekly',
            days: [1],
            startTime: '09:00',
            endTime: '17:00',
            card: 'haupttheke',
        };
        const context = { currentDay: 1, currentTime: '10:00', currentDate: '2026-06-08' };
        assert.equal(isRuleActive(rule, context), true);
    });
});

describe('getBerlinScheduleContext', () => {
    it('liefert kurz nach Mitternacht das Berliner Datum (nicht UTC)', () => {
        // 00:30 Berlin (Sommerzeit) = 22:30 UTC am Vortag
        const context = getBerlinScheduleContext(new Date('2026-06-09T00:30:00+02:00'));
        assert.deepEqual(context, { currentDay: 2, currentTime: '00:30', currentDate: '2026-06-09' });
    });

    it('funktioniert in der Winterzeit', () => {
        const context = getBerlinScheduleContext(new Date('2026-12-24T23:59:00+01:00'));
        assert.deepEqual(context, { currentDay: 4, currentTime: '23:59', currentDate: '2026-12-24' });
    });
});

describe('validateScheduleConfig', () => {
    const isValidCard = (card) => ['cycle-1', 'haupttheke'].includes(card);
    const weekly = { id: 'r1', type: 'weekly', days: [1, 2], startTime: '08:00', endTime: '12:00', card: 'haupttheke' };
    const date = { id: 'r2', type: 'date', startDate: '2026-06-01', startTime: '00:00', endTime: '23:59', card: 'haupttheke' };

    it('akzeptiert gültige Regeln', () => {
        assert.equal(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [weekly, date] }, isValidCard), null);
        assert.equal(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...date, endDate: '2026-06-03' }] }, isValidCard), null);
    });

    it('lehnt fehlende oder falsche Uhrzeiten ab', () => {
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...weekly, startTime: undefined }] }, isValidCard), /Uhrzeit/);
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...weekly, endTime: '24:00' }] }, isValidCard), /Uhrzeit/);
    });

    it('lehnt ungültige Wochentage, Daten und Typen ab', () => {
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...weekly, days: [] }] }, isValidCard), /Wochentage/);
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...weekly, days: [7] }] }, isValidCard), /Wochentage/);
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...date, startDate: '1.6.2026' }] }, isValidCard), /Start-Datum/);
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...date, endDate: '2026-05-01' }] }, isValidCard), /End-Datum/);
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...weekly, type: 'monthly' }] }, isValidCard), /Regeltyp/);
    });

    it('lehnt ungültige Karten ab', () => {
        assert.match(validateScheduleConfig({ defaultCard: 'gibtsnicht', rules: [] }, isValidCard), /Default-Karte/);
        assert.match(validateScheduleConfig({ defaultCard: 'cycle-1', rules: [{ ...weekly, card: 'x' }] }, isValidCard), /Karte/);
    });
});

describe('calculateCurrentCard mit defekter Regel', () => {
    it('ignoriert Regeln ohne Uhrzeit statt zu werfen', () => {
        const config = {
            defaultCard: 'cycle-1',
            rules: [{ type: 'weekly', days: [1], card: 'haupttheke' }],
        };
        assert.equal(calculateCurrentCard(config, new Date('2026-06-08T10:00:00+02:00')), 'cycle-1');
    });
});

describe('migrateLegacyPresetRules', () => {
    it('ersetzt alte Preset-Regeln durch die zugehörige Karte', () => {
        const config = {
            defaultCard: 'cycle-1',
            rules: [
                { id: 'a', card: 'preset:haupttheke-abend.json' },
                { id: 'b', card: 'preset:theke-hinten-fest.json' },
                { id: 'c', card: 'preset:unbekannt.json' },
                { id: 'd', card: 'jugendliche' },
            ],
        };
        assert.deepEqual(migrateLegacyPresetRules(config).rules, [
            { id: 'a', card: 'haupttheke' },
            { id: 'b', card: 'theke-hinten' },
            { id: 'd', card: 'jugendliche' },
        ]);
    });

    it('lässt Konfigurationen ohne Presets unverändert', () => {
        const config = { defaultCard: 'cycle-1', rules: [{ id: 'd', card: 'jugendliche' }] };
        assert.deepEqual(migrateLegacyPresetRules(config), config);
    });
});
