const { connectionStats, safeQuery } = require('../db/pool');
const { isProduction } = require('../config/security');

function registerHealthRoutes(app) {
    app.get('/api/health', async (req, res) => {
        try {
            await safeQuery('SELECT 1 as test');

            res.json({
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                connectionStats,
            });
        } catch (error) {
            console.error('Health Check Fehler:', error);
            const payload = {
                status: 'unhealthy',
                database: 'disconnected',
                timestamp: new Date().toISOString(),
                connectionStats,
            };
            if (!isProduction) {
                payload.error = error.message;
            }
            res.status(503).json(payload);
        }
    });
}

module.exports = {
    registerHealthRoutes,
};
