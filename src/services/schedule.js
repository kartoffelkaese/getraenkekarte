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

function getBerlinScheduleContext(now = new Date()) {
    const berlinTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }));
    return {
        currentDay: berlinTime.getDay(),
        currentTime: berlinTime.toTimeString().slice(0, 5),
        currentDate: berlinTime.toISOString().split('T')[0],
    };
}

function isRuleActive(rule, context) {
    const { currentDay, currentTime, currentDate } = context;

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

    return config.defaultCard || 'cycle';
}

module.exports = {
    TIMEZONE,
    timeToMinutes,
    isTimeInRange,
    isDateInRange,
    getBerlinScheduleContext,
    isRuleActive,
    calculateCurrentCard,
};
