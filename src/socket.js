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

        guardedSocketEvent(socket, 'forceThekeHintenReload', () => {
            console.log('Force Theke-Hinten Reload Event empfangen');
            io.emit('forceThekeHintenReload');
        });

        guardedSocketEvent(socket, 'forceHauptthekeReload', () => {
            console.log('Force Haupttheke Reload Event empfangen');
            io.emit('forceHauptthekeReload');
        });

        guardedSocketEvent(socket, 'forceJugendkarteReload', () => {
            console.log('Force Jugendkarte Reload Event empfangen');
            io.emit('forceJugendkarteReload');
        });

        guardedSocketEvent(socket, 'forceOverviewReload', (data) => {
            console.log('Force Overview Reload Event empfangen:', data);
            io.emit('forceOverviewReload', data);
        });

        guardedSocketEvent(socket, 'forceCycleReload', (data) => {
            const type = data && ['standard', 'jugend', 'all'].includes(data.type) ? data.type : 'all';
            console.log('Force Cycle Reload Event empfangen:', type);
            io.emit('forceCycleReload', { type });
        });

        guardedSocketEvent(socket, 'forceScheduleReload', () => {
            console.log('Force Schedule Reload Event empfangen');
            io.emit('forceScheduleReload');
        });

        guardedSocketEvent(socket, 'forceSchedule2Reload', () => {
            console.log('Force Schedule-2 Reload Event empfangen');
            io.emit('forceSchedule2Reload');
        });

        socket.on('updateDrink', async (data) => {
            if (!requireSocketAuth(socket)) {
                return;
            }
            console.log('Update Drink Event empfangen:', {
                socketId: socket.id,
                location: data?.location,
                drinkId: data?.id,
                isActive: data?.is_active,
            });
        });
    });
}

module.exports = {
    registerSocketHandlers,
};
