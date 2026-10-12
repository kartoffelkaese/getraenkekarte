const { verifyCredentials } = require('./middleware/auth');
const logger = require('./utils/logger');

function requireSocketAuth(socket) {
    return verifyCredentials(socket.request);
}

function guardedSocketEvent(socket, eventName, handler) {
    socket.on(eventName, (...args) => {
        if (!requireSocketAuth(socket)) {
            console.warn(`Socket ${eventName} abgelehnt: nicht authentifiziert (${socket.id})`);
            return;
        }
        handler(...args);
    });
}

// Reload-Signale ohne Nutzdaten: werden unverändert an alle Displays weitergereicht
const SIMPLE_RELOAD_EVENTS = [
    'forceThekeHintenReload',
    'forceHauptthekeReload',
    'forceJugendkarteReload',
    'forceScheduleReload',
    'forceSchedule2Reload',
];

/** Socket.IO: Verbindungs-Logging und authentifizierte Reload-Signale vom Admin an die Displays. */
function registerSocketHandlers(io) {
    io.on('connection', (socket) => {
        logger.debug('Neue Socket.IO Verbindung:', socket.id);

        socket.on('disconnect', (reason) => {
            logger.debug('Socket.IO Verbindung getrennt:', socket.id, 'Grund:', reason);
        });

        socket.on('error', (error) => {
            console.error('Socket.IO Fehler:', error);
        });

        for (const eventName of SIMPLE_RELOAD_EVENTS) {
            guardedSocketEvent(socket, eventName, () => {
                console.log(`${eventName} Event empfangen`);
                io.emit(eventName);
            });
        }

        guardedSocketEvent(socket, 'forceOverviewReload', (data) => {
            console.log('Force Overview Reload Event empfangen:', data);
            io.emit('forceOverviewReload', data);
        });

        guardedSocketEvent(socket, 'forceCycleReload', (data) => {
            const type = data && ['standard', 'jugend', 'all'].includes(data.type) ? data.type : 'all';
            console.log('Force Cycle Reload Event empfangen:', type);
            io.emit('forceCycleReload', { type });
        });
    });
}

module.exports = {
    registerSocketHandlers,
};
