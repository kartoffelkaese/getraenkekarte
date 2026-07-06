const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
    isTimeInRange,
    isDateInRange,
    calculateCurrentCard,
    isRuleActive,
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
