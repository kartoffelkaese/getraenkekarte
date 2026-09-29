const TIMEZONE = 'Europe/Berlin';

function timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

function isTimeInRange(currentTime, startTime, endTime) {
    const current = timeToMinutes(currentTime);
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    if (start <= end) {
        return current >= start && current <= end;
    }
    return current >= start || current <= end;
}

function isDateInRange(currentDate, startDate, endDate) {
    if (!endDate) {
        return currentDate === startDate;
    }
    return currentDate >= startDate && currentDate <= endDate;
}

const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const berlinFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
});

/** Wochentag, Uhrzeit und Datum in Berlin – unabhängig von der Server-Zeitzone. */
function getBerlinScheduleContext(now = new Date()) {
    const parts = Object.fromEntries(
        berlinFormatter.formatToParts(now).map(({ type, value }) => [type, value])
    );
    return {
        currentDay: WEEKDAYS[parts.weekday],
        currentTime: `${parts.hour}:${parts.minute}`,
        currentDate: `${parts.year}-${parts.month}-${parts.day}`,
    };
}

function isRuleActive(rule, context) {
    const { currentDay, currentTime, currentDate } = context;

    // Defekte Regeln (z. B. alte Config-Datei) ignorieren statt /current abstürzen zu lassen
    if (!rule || !TIME_PATTERN.test(rule.startTime) || !TIME_PATTERN.test(rule.endTime)) {
        return false;
    }

    if (rule.type === 'weekly') {
        if (!rule.days || !rule.days.includes(currentDay)) {
            return false;
        }
        return isTimeInRange(currentTime, rule.startTime, rule.endTime);
    }

    if (rule.type === 'date') {
        if (!isDateInRange(currentDate, rule.startDate, rule.endDate)) {
            return false;
        }
        return isTimeInRange(currentTime, rule.startTime, rule.endTime);
    }

    return false;
}

function calculateCurrentCard(config, now = new Date()) {
    const context = getBerlinScheduleContext(now);

    const sortedRules = [...(config.rules || [])].sort((a, b) => {
        if (a.type === 'date' && b.type === 'weekly') return -1;
        if (a.type === 'weekly' && b.type === 'date') return 1;
        return 0;
    });

    for (const rule of sortedRules) {
        if (isRuleActive(rule, context)) {
            return rule.card;
        }
    }

    return config.defaultCard || 'cycle-1';
}

/**
 * Übergang: Die Preset-Funktion wurde entfernt. Alte Regeln mit "preset:haupttheke-….json"
 * bzw. "preset:theke-hinten-….json" zeigen die zugehörige Karte (wie zuvor der Schedule-Player,
 * nur ohne Preset-Überlagerung). Nicht zuordenbare Preset-Regeln werden verworfen.
 */
const LEGACY_PRESET_LOCATIONS = ['theke-hinten', 'haupttheke'];

function migrateLegacyPresetRules(config) {
    if (!config || !Array.isArray(config.rules)) {
        return config;
    }
    const rules = [];
    for (const rule of config.rules) {
        if (typeof rule?.card !== 'string' || !rule.card.startsWith('preset:')) {
            rules.push(rule);
            continue;
        }
        const filename = rule.card.slice('preset:'.length);
        const location = LEGACY_PRESET_LOCATIONS.find((loc) => filename.startsWith(`${loc}-`));
        if (location) {
            rules.push({ ...rule, card: location });
        }
    }
    return { ...config, rules };
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Prüft eine Schedule-Regel; gibt Fehlermeldung oder null zurück. */
function validateScheduleRule(rule, isValidCard) {
    const label = rule && rule.id ? rule.id : 'unbekannt';
    if (!rule || typeof rule !== 'object') {
        return 'Ungültige Regel';
    }
    if (!isValidCard(rule.card)) {
        return `Ungültige Karte in Regel: ${label}`;
    }
    if (!TIME_PATTERN.test(rule.startTime) || !TIME_PATTERN.test(rule.endTime)) {
        return `Ungültige Uhrzeit in Regel: ${label}`;
    }
    if (rule.type === 'weekly') {
        const validDays = Array.isArray(rule.days)
            && rule.days.length > 0
            && rule.days.every((d) => Number.isInteger(d) && d >= 0 && d <= 6);
        if (!validDays) {
            return `Ungültige Wochentage in Regel: ${label}`;
        }
        return null;
    }
    if (rule.type === 'date') {
        if (!DATE_PATTERN.test(rule.startDate)) {
            return `Ungültiges Start-Datum in Regel: ${label}`;
        }
        if (rule.endDate && (!DATE_PATTERN.test(rule.endDate) || rule.endDate < rule.startDate)) {
            return `Ungültiges End-Datum in Regel: ${label}`;
        }
        return null;
    }
    return `Ungültiger Regeltyp in Regel: ${label}`;
}

/** Prüft die gesamte Schedule-Konfiguration; gibt Fehlermeldung oder null zurück. */
function validateScheduleConfig(configData, isValidCard) {
    if (!configData || typeof configData !== 'object') {
        return 'Ungültige Konfiguration';
    }
    if (!isValidCard(configData.defaultCard)) {
        return 'Ungültige Default-Karte';
    }
    if (configData.rules !== undefined && !Array.isArray(configData.rules)) {
        return 'Regeln müssen ein Array sein';
    }
    for (const rule of configData.rules || []) {
        const error = validateScheduleRule(rule, isValidCard);
        if (error) {
            return error;
        }
    }
    return null;
}

module.exports = {
    TIMEZONE,
    migrateLegacyPresetRules,
    validateScheduleRule,
    validateScheduleConfig,
    timeToMinutes,
    isTimeInRange,
    isDateInRange,
    getBerlinScheduleContext,
    isRuleActive,
    calculateCurrentCard,
};
