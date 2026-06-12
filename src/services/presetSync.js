const { isRuleActive, getBerlinScheduleContext } = require('./schedule');

function syncActivePresetsForConfig(configData, activePresets, { activatePresetFromCard, logger }) {
    const currentContext = getBerlinScheduleContext();

    const activePresetRules = (configData.rules || []).filter((rule) => {
        if (!rule.card || !rule.card.startsWith('preset:')) {
            return false;
        }
        return isRuleActive(rule, currentContext);
    });

    if (activePresetRules.length > 0) {
        activatePresetFromCard(activePresetRules[0].card, activePresets);
        return;
    }

    Object.keys(activePresets).forEach((loc) => {
        const hasActivePresetRule = (configData.rules || []).some((rule) => {
            if (!rule.card || !rule.card.startsWith('preset:')) {
                return false;
            }
            const ruleFilename = rule.card.replace('preset:', '');
            if (!ruleFilename.startsWith(`${loc}-`)) {
                return false;
            }
            return isRuleActive(rule, currentContext);
        });

        if (!hasActivePresetRule) {
            delete activePresets[loc];
            if (logger) {
                logger.info(`Preset deaktiviert für ${loc} (keine aktive Regel)`);
            }
        }
    });
}

module.exports = {
    syncActivePresetsForConfig,
};
