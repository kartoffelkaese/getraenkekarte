const path = require('path');
const fs = require('fs');
const { calculateCurrentCard } = require('../services/schedule');
const { syncActivePresetsForConfig } = require('../services/presetSync');
const logger = require('../utils/logger');

function loadScheduleConfig(configPath, defaultCard = 'cycle-1') {
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { defaultCard, rules: [] };
}

function registerScheduleRoutes(app, { io, validateScheduleConfig, activatePresetFromCard, activePresets }) {
    const schedules = [
        {
            apiPrefix: '/api/schedule-config',
            configFile: 'schedule-1-config.json',
            changedEvent: 'scheduleConfigChanged',
            reloadEvent: 'forceScheduleReload',
        },
        {
            apiPrefix: '/api/schedule-2-config',
            configFile: 'schedule-2-config.json',
            changedEvent: 'schedule2ConfigChanged',
            reloadEvent: 'forceSchedule2Reload',
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

                const validationError = validateScheduleConfig(configData);
                if (validationError) {
                    return res.status(400).json({ error: validationError });
                }

                fs.writeFileSync(configPath, JSON.stringify(configData, null, 2));
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

                if (currentCard.startsWith('preset:')) {
                    activatePresetFromCard(currentCard, activePresets);
                } else {
                    syncActivePresetsForConfig(configData, activePresets, {
                        activatePresetFromCard,
                        logger,
                    });
                }

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
