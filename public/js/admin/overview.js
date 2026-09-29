/* Admin – Overview 1/2.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Funktion zum Laden der Overview-Konfiguration
async function fetchOverviewConfig() {
    try {
        if (window.AdminCards) {
            const cards = await window.AdminCards.fetchCards();
            window.AdminCards.populateCardSelects(cards);
        }

        // Lade Overview-1 Konfiguration
        const response1 = await fetch('/api/overview-config/overview-1');
        const config1 = await response1.json();
        document.getElementById('overview1Card').value = config1.card;
        
        // Lade Overview-2 Konfiguration
        const response2 = await fetch('/api/overview-config/overview-2');
        const config2 = await response2.json();
        document.getElementById('overview2Card').value = config2.card;
        
    } catch (error) {
        console.error('Fehler beim Laden der Overview-Konfiguration:', error);
        showNotification('Fehler beim Laden der Overview-Konfiguration', 'error');
    }
}

// Funktion zum Speichern der Overview-Konfiguration
async function saveOverviewConfig(overview) {
    try {
        const cardSelect = document.getElementById(`${overview.replace('-', '')}Card`);
        const card = cardSelect.value;
        
        const response = await fetch(`/api/overview-config/${overview}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ card })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }
        
        const result = await response.json();
        showNotification(result.message || 'Overview-Konfiguration gespeichert', 'success');
        
    } catch (error) {
        console.error('Fehler beim Speichern der Overview-Konfiguration:', error);
        showNotification('Fehler beim Speichern: ' + error.message, 'error');
    }
}

// Funktion für Forced-Reload der Overview-Karten
async function forceOverviewReload(overview) {
    try {
        // Sende Socket.IO Event für Reload
        socket.emit('forceOverviewReload', { overview });
        showNotification(`Reload-Signal an ${overview} gesendet`, 'success');
    } catch (error) {
        console.error('Fehler beim Senden des Reload-Signals:', error);
        showNotification('Fehler beim Senden des Reload-Signals', 'error');
    }
}

// Socket.IO Event-Listener für Overview-Konfiguration
socket.on('overviewConfigChanged', (data) => {
    console.log('Overview-Konfiguration geändert:', data);
    if (currentLocation === 'overview') {
        // Aktualisiere die Dropdowns wenn im Overview-Tab
        if (data.overview === 'overview-1') {
            document.getElementById('overview1Card').value = data.card;
        } else if (data.overview === 'overview-2') {
            document.getElementById('overview2Card').value = data.card;
        }
    }
});

// === Health Status Management ===

// === Schedule Management ===
