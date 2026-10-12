/* global socket -- aus app.js */
// Hochzeitskarten: Schriftgröße aus der Konfiguration übernehmen (data-font-size am <body>)
async function loadHochzeitConfig() {
    try {
        const response = await fetch('/api/hochzeit-config');
        const config = await response.json();
        if (config.fontSize) {
            document.body.setAttribute('data-font-size', config.fontSize);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Hochzeitskarten-Konfiguration:', error);
    }
}
loadHochzeitConfig();

// Socket.IO: Aktualisiere Schriftgröße bei Änderungen
if (typeof socket !== 'undefined') {
    socket.on('hochzeitConfigChanged', (config) => {
        if (config.fontSize) {
            document.body.setAttribute('data-font-size', config.fontSize);
        }
    });
}
