const path = require('path');
const { calculateCurrentCard, validateScheduleConfig, migrateLegacyPresetRules } = require('../services/schedule');
const { isValidScheduleCard } = require('../utils/safePath');
const { readJson, writeJsonAtomic } = require('../utils/jsonConfig');
const logger = require('../utils/logger');

function loadScheduleConfig(configPath, defaultCard = 'cycle-1') {
    return migrateLegacyPresetRules(readJson(configPath, { defaultCard, rules: [] }));
}

function registerScheduleRoutes(app, { io }) {
    const schedules = [
        {
            apiPrefix: '/api/schedule-config',
            configFile: 'schedule-1-config.json',
            changedEvent: 'scheduleConfigChanged',
        },
        {
            apiPrefix: '/api/schedule-2-config',
            configFile: 'schedule-2-config.json',
            changedEvent: 'schedule2ConfigChanged',
        },
    ];

    for (const schedule of schedules) {
        const configPath = path.join(__dirname, '../..', schedule.configFile);

        app.get(schedule.apiPrefix, (req, res) => {
            try {
                res.json(loadScheduleConfig(configPath));
            } catch (error) {
                logger.error(`Fehler beim Laden der ${schedule.configFile}:`, error);
                res.status(500).json({ error: 'Fehler beim Laden der Konfiguration' });
            }
        });

        app.post(schedule.apiPrefix, (req, res) => {
            try {
                const { defaultCard, rules } = req.body;

                if (!defaultCard) {
                    return res.status(400).json({ error: 'Default-Karte ist erforderlich' });
                }

                const configData = {
                    defaultCard,
                    rules: rules || [],
                };

                const validationError = validateScheduleConfig(configData, isValidScheduleCard);
                if (validationError) {
                    return res.status(400).json({ error: validationError });
                }

                writeJsonAtomic(configPath, configData);
                io.emit(schedule.changedEvent, configData);

                res.json({ message: 'Schedule-Konfiguration gespeichert', config: configData });
            } catch (error) {
                logger.error(`Fehler beim Speichern der ${schedule.configFile}:`, error);
                res.status(500).json({ error: 'Fehler beim Speichern der Konfiguration' });
            }
        });

        app.get(`${schedule.apiPrefix}/current`, (req, res) => {
            try {
                const configData = loadScheduleConfig(configPath);
                const currentCard = calculateCurrentCard(configData);
                res.json({ currentCard, config: configData });
            } catch (error) {
                logger.error(`Fehler beim Berechnen der aktuellen Karte (${schedule.configFile}):`, error);
                res.status(500).json({ error: 'Fehler beim Berechnen der aktuellen Karte' });
            }
        });
    }
}

module.exports = {
    registerScheduleRoutes,
    loadScheduleConfig,
};
