/* Admin – Hochzeitskarten-Schriftgröße und Bilder-Karten-Einstellungen.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

async function loadHochzeitConfig() {
    try {
        const response = await fetch('/api/hochzeit-config');
        if (response.ok) {
            const config = await response.json();
            const fontSizeSelect = document.getElementById('hochzeitFontSize');
            if (fontSizeSelect && config.fontSize) {
                fontSizeSelect.value = config.fontSize;
            }
        }
    } catch (error) {
        console.error('Fehler beim Laden der Hochzeitskarten-Konfiguration:', error);
    }
}

async function saveHochzeitFontSize() {
    const fontSizeSelect = document.getElementById('hochzeitFontSize');
    if (!fontSizeSelect) return;
    
    const fontSize = fontSizeSelect.value;
    
    try {
        const response = await fetch('/api/hochzeit-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fontSize })
        });
        
        if (response.ok) {
            await response.json();
            showNotification('Hochzeitskarten-Schriftgröße gespeichert', 'success');
        } else {
            const data = await response.json();
            showNotification(data.error || 'Fehler beim Speichern', 'error');
        }
    } catch (error) {
        console.error('Fehler beim Speichern der Hochzeitskarten-Konfiguration:', error);
        showNotification('Fehler beim Speichern: ' + error.message, 'error');
    }
}

// Socket.IO: Aktualisiere Schriftgröße bei Änderungen
socket.on('hochzeitConfigChanged', (config) => {
    const fontSizeSelect = document.getElementById('hochzeitFontSize');
    if (fontSizeSelect && config.fontSize) {
        fontSizeSelect.value = config.fontSize;
    }
});

// === Bilder-Karten (PNG-Transparenz, Logo-Modus) ===

function applyImagesConfigToUI(config) {
    const transparentToggle = document.getElementById('imagesTransparentBackground');
    const logoToggle = document.getElementById('imagesLogoMode');
    if (transparentToggle) {
        transparentToggle.checked = !!config.transparentBackground;
    }
    if (logoToggle) {
        logoToggle.checked = !!config.logoMode;
    }
}

async function loadImagesConfig() {
    try {
        const response = await fetch('/api/images-config');
        if (response.ok) {
            applyImagesConfigToUI(await response.json());
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bilder-Konfiguration:', error);
    }
}

async function saveImagesConfigFromUI() {
    const transparentToggle = document.getElementById('imagesTransparentBackground');
    const logoToggle = document.getElementById('imagesLogoMode');
    if (!transparentToggle || !logoToggle) return;

    try {
        const response = await fetch('/api/images-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transparentBackground: transparentToggle.checked,
                logoMode: logoToggle.checked
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Fehler beim Speichern');
        }

        showNotification('Bilder-Einstellung gespeichert', 'success');
    } catch (error) {
        console.error('Fehler beim Speichern der Bilder-Konfiguration:', error);
        showNotification('Fehler beim Speichern: ' + error.message, 'error');
        loadImagesConfig();
    }
}

socket.on('imagesConfigChanged', (config) => {
    applyImagesConfigToUI(config);
});
