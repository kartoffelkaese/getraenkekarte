/* Admin – Temporäre Preise (Theke Hinten).
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

let tempPricesData = { active: false, drinks: {} };

let allDrinks = [];

// Funktion zum Laden der temporären Preise
async function fetchTempPrices() {
    try {
        // Lade aktuelle Override-Konfiguration
        const response = await fetch('/api/price-overrides/theke-hinten');
        tempPricesData = await response.json();
        
        // Lade alle Getränke für die Tabelle
        const drinksResponse = await fetch('/api/drinks/theke-hinten');
        allDrinks = await drinksResponse.json();
        
        // Aktualisiere UI
        updateTempPricesUI();
        
    } catch (error) {
        console.error('Fehler beim Laden der temporären Preise:', error);
        showNotification('Fehler beim Laden der temporären Preise', 'error');
    }
}

// Funktion zum Aktualisieren der UI
function updateTempPricesUI() {
    // Aktiviere Toggle
    const activeToggle = document.getElementById('tempPricesActive');
    if (activeToggle) {
        activeToggle.checked = tempPricesData.active;
    }
    
    // Fülle Tabelle
    displayTempPricesTable();
}

// Funktion zum Anzeigen der Tabelle
function displayTempPricesTable() {
    const tbody = document.getElementById('tempPricesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    allDrinks.forEach(drink => {
        const row = document.createElement('tr');
        const originalPrice = parseFloat(drink.preis) || 0;
        const tempPrice = tempPricesData.drinks[drink.id]?.preis || '';
        
        row.innerHTML = `
            <td>${drink.name}</td>
            <td>${originalPrice.toFixed(2)} €</td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       id="tempPrice-${drink.id}" 
                       value="${tempPrice}" 
                       step="0.01" 
                       min="0"
                       placeholder="Temporärer Preis">
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="setTempPrice(${drink.id})">
                    <i class="bi bi-check"></i> Setzen
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="clearTempPrice(${drink.id})">
                    <i class="bi bi-x"></i> Löschen
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    applyResponsiveTableLabels(tbody.closest('table'));
}

// Funktion zum Setzen eines temporären Preises
async function setTempPrice(drinkId) {
    const input = document.getElementById(`tempPrice-${drinkId}`);
    const price = parseFloat(input.value);
    
    if (isNaN(price) || price < 0) {
        showNotification('Bitte geben Sie einen gültigen Preis ein', 'error');
        return;
    }
    
    if (!tempPricesData.drinks) {
        tempPricesData.drinks = {};
    }
    
    // Hole das Getränk aus allDrinks um die ursprünglichen Werte zu bekommen
    const drink = allDrinks.find((d) => Number(d.id) === Number(drinkId));
    if (drink) {
        tempPricesData.drinks[drinkId] = { 
            preis: price,
            small_price: drink.small_price, // Behalte ursprünglichen small_price
            show_price: true // Setze show_price auf true damit Preise angezeigt werden
        };
    } else {
        tempPricesData.drinks[drinkId] = { 
            preis: price,
            show_price: true // Setze show_price auf true damit Preise angezeigt werden
        };
    }
    
    // Automatisch speichern
    await saveTempPrices();
}

// Funktion zum Löschen eines temporären Preises
async function clearTempPrice(drinkId) {
    if (tempPricesData.drinks && tempPricesData.drinks[drinkId]) {
        delete tempPricesData.drinks[drinkId];
    }
    
    const input = document.getElementById(`tempPrice-${drinkId}`);
    if (input) {
        input.value = '';
    }
    
    // Automatisch speichern
    await saveTempPrices();
}

// Funktion zum Toggle der Aktivierung
async function toggleTempPricesActive(active) {
    tempPricesData.active = active;
    document.getElementById('tempPricesActive').checked = active;
}

// Funktion zum Speichern der temporären Preise
async function saveTempPrices() {
    try {
        const response = await fetch('/api/price-overrides/theke-hinten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                active: tempPricesData.active,
                drinks: tempPricesData.drinks
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }
        
        const result = await response.json();
        showNotification(result.message || 'Temporäre Preise gespeichert', 'success');
        
        
    } catch (error) {
        console.error('Fehler beim Speichern der temporären Preise:', error);
        showNotification('Fehler beim Speichern: ' + error.message, 'error');
    }
}

// Funktion zum Zurücksetzen
function resetTempPrices() {
    if (confirm('Möchten Sie alle temporären Preise zurücksetzen?')) {
        tempPricesData.drinks = {};
        displayTempPricesTable();
        showNotification('Temporäre Preise zurückgesetzt', 'success');
    }
}

// Funktion zum Löschen aller temporären Preise
async function clearTempPrices() {
    if (confirm('Möchten Sie alle temporären Preise löschen?')) {
        try {
            const response = await fetch('/api/price-overrides/theke-hinten', {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Fehler beim Löschen');
            }
            
            tempPricesData = { active: false, drinks: {} };
            updateTempPricesUI();
            showNotification('Alle temporären Preise gelöscht', 'success');
            
        } catch (error) {
            console.error('Fehler beim Löschen der temporären Preise:', error);
            showNotification('Fehler beim Löschen', 'error');
        }
    }
}

// Socket.IO Event-Listener für temporäre Preise
socket.on('priceOverridesChanged', (data) => {
    if (data.location === 'theke-hinten') {
        tempPricesData = { active: data.active, drinks: data.drinks || {} };
        if (currentLocation === 'temp-prices') {
            updateTempPricesUI();
        }
    }
});

// === Overview-Verwaltung ===
