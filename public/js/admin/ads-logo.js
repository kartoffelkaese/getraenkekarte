/* Admin – Werbung und Logo je Karte.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Funktion zum Umschalten des Werbungsstatus
async function toggleAdStatus(id, is_active) {
    try {
        const response = await fetch(`/api/ads/toggle/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, is_active })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }

    } catch (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#ad-switch-${id}`);
        if (switchElement) {
            switchElement.checked = !is_active;
        }
    }
}

// Funktion zum Aktualisieren der Werbung-Reihenfolge
async function updateAdOrder(id, sort_order) {
    try {
        const response = await fetch(`/api/ads/update-order/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, sort_order: parseInt(sort_order, 10) })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }

    } catch (error) {
        console.error('Fehler beim Aktualisieren der Reihenfolge:', error);
        // Bei Fehler die Werbungen neu laden
        fetchAds();
    }
}

// Funktion zum Umschalten des Logo-Status
async function toggleLogoVisibility(is_active) {
    try {
        console.log('Sende Logo-Status-Update:', { is_active, currentLocation });
        const response = await fetch(`/api/logo/toggle/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_active })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
        
        const result = await response.json();
        console.log('Server-Antwort:', result);

    } catch (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector('#logo-visibility-switch');
        if (switchElement) {
            switchElement.checked = !is_active;
        }
    }
}

// Funktion zum Aktualisieren der Logo-Position
async function updateLogoOrder(sort_order) {
    try {
        const response = await fetch(`/api/logo/update-order/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sort_order: parseInt(sort_order, 10) })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Logo-Position:', error);
        // Bei Fehler die Logo-Einstellungen neu laden
        fetchLogo();
    }
}

// Funktion zum Umschalten des Logo-Spaltenumbruchs
async function toggleLogoColumnBreak(force_column_break) {
    try {
        const response = await fetch(`/api/logo/toggle-column-break/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ force_column_break })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Logo-Spaltenumbruchs:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector('#logo-column-break-switch');
        if (switchElement) {
            switchElement.checked = !force_column_break;
        }
    }
}

// Funktion zum Aktualisieren der Logo-Größe
async function updateLogoSize(logo_size) {
    // Nur für haupttheke und theke-hinten erlauben
    if (currentLocation !== 'haupttheke' && currentLocation !== 'theke-hinten') {
        console.warn('Logo-Größe ist nur für haupttheke und theke-hinten verfügbar');
        return;
    }
    
    try {
        const response = await fetch(`/api/logo/update-size/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ logo_size })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
        
        console.log('Logo-Größe aktualisiert:', logo_size);
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Logo-Größe:', error);
        // Bei Fehler Select zurücksetzen
        const selectElement = document.querySelector('#logo-size-select');
        if (selectElement) {
            // Lade aktuelle Einstellungen neu
            fetchLogo();
        }
    }
}

// Bild-Upload Funktionalität
let imageUploadModal;

let deleteConfirmModal;

let adToDelete = null;

// Funktion zum Hochladen eines Bildes
async function uploadImage() {
    const name = document.getElementById('adName').value;
    const price = document.getElementById('adPrice').value;
    const fileInput = document.getElementById('adFile');
    const cardType = document.getElementById('adCardType').value;
    const isActive = document.getElementById('adActive').checked;
    const sortOrder = document.getElementById('adSortOrder').value;
    
    if (!fileInput.files[0]) {
        showNotification('Bitte wählen Sie ein Bild aus.', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('name', name || '');
    formData.append('price', price || '');
    formData.append('image', file);
    formData.append('cardType', cardType);
    formData.append('isActive', isActive);
    formData.append('sortOrder', sortOrder);
    
    try {
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Hochladen des Bildes');
        }
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Bild erfolgreich hochgeladen!', 'success');
            imageUploadModal.hide();
            document.getElementById('adUploadForm').reset();
            fetchAds(); // Aktualisiere die Werbeanzeigen-Tabelle
        } else {
            showNotification('Fehler beim Hochladen: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Fehler beim Hochladen des Bildes:', error);
        showNotification('Fehler beim Hochladen des Bildes: ' + error.message, 'error');
    }
}

// Funktion zum Löschen einer Werbung
function deleteAd(adId) {
    adToDelete = adId;
    deleteConfirmModal.show();
}

// Funktion zum Ausführen des Löschvorgangs
async function performDelete(adId) {
    try {
        const response = await fetch(`/api/ads/${adId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Aktualisiere die Tabelle
            fetchAds();
            showNotification('Werbung erfolgreich gelöscht', 'success');
        } else {
            showNotification(`Fehler beim Löschen der Werbung: ${data.error}`, 'error');
        }
    } catch (error) {
        console.error('Fehler beim Löschen der Werbung:', error);
        showNotification('Fehler beim Löschen der Werbung', 'error');
    }
}
