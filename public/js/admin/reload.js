/* Admin – Reload-Signale an Displays.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Funktion für Forced-Reload der Theke-Hinten Karten
async function forceReloadThekeHinten() {
    try {
        // Sende Socket.IO Event für Reload
        socket.emit('forceThekeHintenReload');
        showNotification('Reload-Signal an Theke-Hinten Karten gesendet', 'success');
    } catch (error) {
        console.error('Fehler beim Senden des Reload-Signals:', error);
        showNotification('Fehler beim Senden des Reload-Signals', 'error');
    }
}

// Funktion für Forced-Reload der Haupttheke
async function forceHauptthekeReload() {
    try {
        // Sende Socket.IO Event für Reload
        socket.emit('forceHauptthekeReload');
        showNotification('Reload-Signal an Haupttheke gesendet', 'success');
    } catch (error) {
        console.error('Fehler beim Senden des Reload-Signals:', error);
        showNotification('Fehler beim Senden des Reload-Signals', 'error');
    }
}

// Funktion für Forced-Reload der Cycle-Karten (type: 'standard' = Cycle 1, 'jugend' = Cycle 2, 'all')
function forceCycleReload(type = 'all') {
    try {
        socket.emit('forceCycleReload', { type });
        const label = type === 'standard' ? 'Cycle 1' : type === 'jugend' ? 'Cycle 2' : 'alle Cycle-Karten';
        showNotification(`Reload-Signal an ${label} gesendet`, 'success');
    } catch (error) {
        console.error('Fehler beim Senden des Reload-Signals:', error);
        showNotification('Fehler beim Senden des Reload-Signals', 'error');
    }
}

// Funktion für Forced-Reload der Jugendkarte
async function forceJugendkarteReload() {
    try {
        // Sende Socket.IO Event für Reload
        socket.emit('forceJugendkarteReload');
        showNotification('Reload-Signal an Jugendkarte gesendet', 'success');
    } catch (error) {
        console.error('Fehler beim Senden des Reload-Signals:', error);
        showNotification('Fehler beim Senden des Reload-Signals', 'error');
    }
}
