/* Admin – Reload-Signale an Displays.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Sendet ein Reload-Signal per Socket.IO an die Displays und meldet das Ergebnis
function sendReloadSignal(eventName, label, payload) {
    try {
        if (payload === undefined) {
            socket.emit(eventName);
        } else {
            socket.emit(eventName, payload);
        }
        showNotification(`Reload-Signal an ${label} gesendet`, 'success');
    } catch (error) {
        console.error('Fehler beim Senden des Reload-Signals:', error);
        showNotification('Fehler beim Senden des Reload-Signals', 'error');
    }
}

function forceReloadThekeHinten() {
    sendReloadSignal('forceThekeHintenReload', 'Theke-Hinten Karten');
}

function forceHauptthekeReload() {
    sendReloadSignal('forceHauptthekeReload', 'Haupttheke');
}

// type: 'standard' = Cycle 1, 'jugend' = Cycle 2, 'all'
function forceCycleReload(type = 'all') {
    const label = type === 'standard' ? 'Cycle 1' : type === 'jugend' ? 'Cycle 2' : 'alle Cycle-Karten';
    sendReloadSignal('forceCycleReload', label, { type });
}

function forceJugendkarteReload() {
    sendReloadSignal('forceJugendkarteReload', 'Jugendkarte');
}
