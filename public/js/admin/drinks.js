/* Admin – Getränke, Kategorien und Zusatzstoff-Auswahl je Karte.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Funktion zum Laden der Kategorien
async function fetchCategories() {
    try {
        const response = await fetch(`/api/categories/${currentLocation}`);
        const categories = await response.json();
        
        // Überprüfe, ob categories ein Array ist
        if (!Array.isArray(categories)) {
            console.error('Unerwartetes Format der Kategoriedaten:', categories);
            return;
        }
        
        displayCategories(categories);
    } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
    }
}

// Funktion zum Laden der Getränke
async function fetchDrinks() {
    try {
        const response = await fetch(`/api/drinks/${currentLocation}`);
        const drinks = await response.json();
        
        // Überprüfe, ob drinks ein Array ist
        if (!Array.isArray(drinks)) {
            console.error('Unerwartetes Format der Getränkedaten:', drinks);
            return;
        }
        
        displayDrinks(drinks);
    } catch (error) {
        console.error('Fehler beim Laden der Getränke:', error);
    }
}

// Funktion zum Laden der Werbungen
async function fetchAds() {
    try {
        const response = await fetch(`/api/ads/${currentLocation}`);
        const ads = await response.json();
        
        // Überprüfe, ob ads ein Array ist
        if (!Array.isArray(ads)) {
            console.error('Unerwartetes Format der Werbungsdaten:', ads);
            return;
        }
        
        displayAds(ads);
    } catch (error) {
        console.error('Fehler beim Laden der Werbungen:', error);
    }
}

// Funktion zum Laden der Logo-Einstellungen
async function fetchLogo() {
    try {
        const response = await fetch(`/api/logo/${currentLocation}`);
        const logoSettings = await response.json();
        
        const visibilitySwitch = document.querySelector('#logo-visibility-switch');
        const orderInput = document.querySelector('#logo-order');
        const columnBreakSwitch = document.querySelector('#logo-column-break-switch');
        const sizeSelect = document.querySelector('#logo-size-select');
        const sizeHeader = document.querySelector('#logo-size-header');
        const sizeCell = document.querySelector('#logo-size-cell');
        
        if (visibilitySwitch) {
            visibilitySwitch.checked = logoSettings.is_active;
        }
        
        if (orderInput) {
            orderInput.value = logoSettings.sort_order || 0;
        }

        if (columnBreakSwitch) {
            columnBreakSwitch.checked = logoSettings.force_column_break || false;
        }
        
        // Logo-Größe für haupttheke und theke-hinten anzeigen
        if (currentLocation === 'haupttheke' || currentLocation === 'theke-hinten') {
            if (sizeHeader) sizeHeader.style.display = 'table-cell';
            if (sizeCell) sizeCell.style.display = 'table-cell';
            if (sizeSelect) {
                sizeSelect.value = logoSettings.logo_size || 'normal';
            }
        } else {
            if (sizeHeader) sizeHeader.style.display = 'none';
            if (sizeCell) sizeCell.style.display = 'none';
        }
    } catch (error) {
        console.error('Fehler beim Laden der Logo-Einstellungen:', error);
    }
}

// Funktion zum Laden der Zusatzstoffe
async function fetchAdditives() {
    try {
        const response = await fetch('/api/additives');
        const additives = await response.json();
        displayAdditives(additives);
    } catch (error) {
        console.error('Fehler beim Laden der Zusatzstoffe:', error);
    }
}

// Funktion zum Laden der Zusatzstoffe eines Getränks
async function fetchDrinkAdditives(drinkId) {
    try {
        const response = await fetch(`/api/drink-additives/${drinkId}`);
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Laden der Getränkezusatzstoffe:', error);
        return [];
    }
}

// Funktion zum Anzeigen der Kategorien
function displayCategories(categories) {
    const tbody = document.getElementById('categoriesTableBody');
    if (!tbody) {
        return;
    }

    tbody.innerHTML = '';

    categories.forEach(category => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${category.name}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="category-price-switch-${category.id}"
                           onchange="toggleCategoryPrices(${category.id}, this.checked)"
                           ${category.show_prices ? 'checked' : ''}>
                </div>
            </td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="category-visibility-switch-${category.id}"
                           onchange="toggleCategoryVisibility(${category.id}, this.checked)"
                           ${category.is_visible ? 'checked' : ''}>
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       style="width: 80px"
                       id="category-order-${category.id}"
                       onchange="updateCategoryOrder(${category.id}, this.value)"
                       value="${category.sort_order || 0}">
            </td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="category-column-break-switch-${category.id}"
                           onchange="toggleCategoryColumnBreak(${category.id}, this.checked)"
                           ${category.force_column_break ? 'checked' : ''}>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    applyResponsiveTableLabels(tbody.closest('table'));
}

let additiveSelectionModal;

let currentDrinkId = null;

let currentDrinkAdditives = [];

let allAdditives = [];

document.addEventListener('DOMContentLoaded', function() {
    additiveModal = new bootstrap.Modal(document.getElementById('additiveModal'));
    additiveSelectionModal = new bootstrap.Modal(document.getElementById('additiveSelectionModal'));
    
    // Event-Listener für die Zusatzstoff-Suche
    const searchInput = document.getElementById('additiveSearchInput');
    const clearButton = document.getElementById('clearAdditiveSearch');
    
    searchInput.addEventListener('input', function() {
        filterAdditiveOptions(this.value);
    });
    
    clearButton.addEventListener('click', function() {
        searchInput.value = '';
        filterAdditiveOptions('');
    });

    // Event-Listener für die Getränke-Suche
    const drinkSearchInput = document.getElementById('drinkSearchInput');
    const clearDrinkSearch = document.getElementById('clearDrinkSearch');
    
    drinkSearchInput.addEventListener('input', function() {
        filterDrinks(this.value);
    });
    
    clearDrinkSearch.addEventListener('click', function() {
        drinkSearchInput.value = '';
        filterDrinks('');
    });

    // Initialisiere das Bild-Upload-Modal
    imageUploadModal = new bootstrap.Modal(document.getElementById('imageUploadModal'));
    
    // Initialisiere das Löschbestätigungs-Modal
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    
    // Event-Listener für den Button zum Öffnen des Modals
    document.getElementById('showImageUploadModalBtn').addEventListener('click', function() {
        imageUploadModal.show();
    });
    
    // Event-Listener für den Upload-Button
    document.getElementById('uploadImageBtn').addEventListener('click', uploadImage);
    
    // Event-Listener für den Löschbestätigungs-Button
    document.getElementById('confirmDeleteBtn').addEventListener('click', function() {
        if (adToDelete) {
            performDelete(adToDelete);
            deleteConfirmModal.hide();
        }
    });
});

// Funktion zum Filtern der Zusatzstoff-Optionen
function filterAdditiveOptions(searchTerm) {
    const options = document.querySelectorAll('.additive-option');
    searchTerm = searchTerm.toLowerCase();
    
    options.forEach(option => {
        const text = option.textContent.toLowerCase();
        option.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Funktion zum Filtern der Getränke
function filterDrinks(searchTerm) {
    const rows = document.querySelectorAll('#drinksTableBody tr');
    searchTerm = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const name = row.querySelector('td:first-child').textContent.toLowerCase();
        const category = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const additives = row.querySelector('.additive-badges').textContent.toLowerCase();
        
        const matches = name.includes(searchTerm) || 
                       category.includes(searchTerm) || 
                       additives.includes(searchTerm);
        
        row.style.display = matches ? '' : 'none';
    });
}

// Funktion zum Anzeigen der Getränke
async function displayDrinks(drinks) {
    if (!drinksTableBody) return;

    drinksTableBody.innerHTML = '';

    const [additivesList, ...drinkAdditivesList] = await Promise.all([
        fetch('/api/additives').then((res) => res.json()),
        ...drinks.map((drink) => fetchDrinkAdditives(drink.id)),
    ]);
    allAdditives = additivesList;

    drinks.forEach((drink, index) => {
        const drinkAdditives = drinkAdditivesList[index] || [];
        const row = document.createElement('tr');
        const preis = parseFloat(drink.preis) || 0;
        
        row.innerHTML = `
            <td>${escapeHtml(drink.name)}</td>
            <td>${preis.toFixed(2)} €</td>
            <td>${escapeHtml(drink.category_name || '-')}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="switch-${drink.id}" 
                           ${drink.is_active ? 'checked' : ''}
                           onchange="toggleDrinkStatus(${drink.id}, this.checked)">
                </div>
            </td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="price-switch-${drink.id}" 
                           ${drink.show_price ? 'checked' : ''}
                           onchange="toggleDrinkPrice(${drink.id}, this.checked)">
                </div>
            </td>
            <td>
                <div class="d-flex flex-column">
                    <button class="btn btn-outline-secondary edit-additives-btn mb-1" 
                            onclick="showAdditiveSelection(${drink.id})">
                        Bearbeiten <span class="additive-count">${drinkAdditives.length}</span>
                    </button>
                    <div class="additive-badges" style="font-size: 0.8rem;">
                        ${drinkAdditives.map(a => `<span class="additive-badge">${escapeHtml(a.code)}</span>`).join('')}
                    </div>
                </div>
            </td>
        `;
        drinksTableBody.appendChild(row);
    });
    applyResponsiveTableLabels(drinksTableBody.closest('table'));
}

// Funktion zum Anzeigen der Werbungen
function displayAds(ads) {
    const adsTableBody = document.getElementById('adsTableBody');
    if (!adsTableBody) return;

    if (currentLocation === 'jugendliche') {
        return;
    }

    adsTableBody.innerHTML = '';
    
    ads.forEach(ad => {
        const row = document.createElement('tr');
        const preis = parseFloat(ad.price) || 0;
        row.innerHTML = `
            <td>${escapeHtml(ad.name || 'Kein Name')}</td>
            <td>${ad.price ? preis.toFixed(2) + ' €' : ''}</td>
            <td>${escapeHtml(ad.card_type || 'Standard')}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="ad-switch-${ad.id}" 
                           ${ad.is_active ? 'checked' : ''}
                           onchange="toggleAdStatus(${ad.id}, this.checked)">
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       style="width: 80px"
                       value="${ad.sort_order || 0}"
                       onchange="updateAdOrder(${ad.id}, this.value)">
            </td>
            <td><img src="${safeAssetUrl(ad.image_path)}" alt="${escapeAttr(ad.name || 'Werbung')}" style="height: 50px;"></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteAd(${ad.id})">
                    <i class="bi bi-trash"></i> Löschen
                </button>
            </td>
        `;
        adsTableBody.appendChild(row);
    });
    applyResponsiveTableLabels(adsTableBody.closest('table'));
}

// Funktion zum Umschalten des Getränkestatus
async function toggleDrinkStatus(id, is_active) {
    try {
        const response = await fetch(`/api/drinks/toggle/${currentLocation}`, {
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
        const switchElement = document.querySelector(`#switch-${id}`);
        if (switchElement) {
            switchElement.checked = !is_active;
        }
    }
}

// Funktion zum Umschalten der Preisanzeige für ein Getränk
async function toggleDrinkPrice(id, show_price) {
    try {
        const response = await fetch(`/api/drinks/toggle-price/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, show_price })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Preisanzeige:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#price-switch-${id}`);
        if (switchElement) {
            switchElement.checked = !show_price;
        }
    }
}

// Funktion zum Aktualisieren des Status einer Kategorie
async function toggleCategoryVisibility(id, isVisible) {
    const switchElement = document.querySelector(`#category-visibility-switch-${id}`);
    if (isCheckboxSuppressed(switchElement)) {
        return;
    }

    try {
        if (switchElement) {
            switchElement.disabled = true;
        }

        const response = await fetch(`/api/categories/toggle-visibility/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ id, is_visible: isVisible })
        });

        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.status}`);
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Kategorie-Sichtbarkeit:', error);
        setCheckboxSilently(switchElement, !isVisible);
    } finally {
        if (switchElement) {
            switchElement.disabled = false;
        }
    }
}

// Funktion zum Aktualisieren der Preisanzeige einer Kategorie
async function toggleCategoryPrices(id, showPrices) {
    const switchElement = document.querySelector(`#category-price-switch-${id}`);
    if (isCheckboxSuppressed(switchElement)) {
        return;
    }

    try {
        if (switchElement) {
            switchElement.disabled = true;
        }

        const response = await fetch(`/api/categories/toggle-prices/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ id, show_prices: showPrices })
        });

        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.status}`);
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Kategorie-Preisanzeige:', error);
        setCheckboxSilently(switchElement, !showPrices);
    } finally {
        if (switchElement) {
            switchElement.disabled = false;
        }
    }
}

// Funktion zum Aktualisieren der Kategorie-Reihenfolge
async function updateCategoryOrder(id, sort_order) {
    try {
        const response = await fetch(`/api/categories/update-order/${currentLocation}`, {
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
        // Bei Fehler die Kategorien neu laden
        fetchCategories();
    }
}

// Funktion zum Umschalten des Spaltenumbruchs einer Kategorie
async function toggleCategoryColumnBreak(id, force_column_break) {
    const switchElement = document.querySelector(`#category-column-break-switch-${id}`);
    if (isCheckboxSuppressed(switchElement)) {
        return;
    }

    try {
        if (switchElement) {
            switchElement.disabled = true;
        }

        const response = await fetch(`/api/categories/toggle-column-break/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'same-origin',
            body: JSON.stringify({ id, force_column_break })
        });

        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.status}`);
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Kategorie-Spaltenumbruchs:', error);
        setCheckboxSilently(switchElement, !force_column_break);
    } finally {
        if (switchElement) {
            switchElement.disabled = false;
        }
    }
}

// Funktion zum Anzeigen der Zusatzstoff-Auswahl
async function showAdditiveSelection(drinkId) {
    currentDrinkId = drinkId;
    currentDrinkAdditives = await fetchDrinkAdditives(drinkId);
    
    const optionsContainer = document.querySelector('.additive-options');
    optionsContainer.innerHTML = allAdditives.map(additive => `
        <div class="additive-option ${currentDrinkAdditives.some(a => a.id === additive.id) ? 'selected' : ''}"
             onclick="toggleAdditiveSelection(this, ${additive.id})">
            <input type="checkbox" 
                   style="margin-right: 8px; visibility: visible; pointer-events: none;"
                   ${currentDrinkAdditives.some(a => a.id === additive.id) ? 'checked' : ''}>
            <span>${additive.code}) ${additive.name}</span>
        </div>
    `).join('');
    
    document.getElementById('additiveSearchInput').value = '';
    additiveSelectionModal.show();
}

// Funktion zum Umschalten der Zusatzstoff-Auswahl
function toggleAdditiveSelection(element, additiveId) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    element.classList.toggle('selected');
}

// Funktion zum Speichern der ausgewählten Zusatzstoffe
async function saveAdditiveSelection() {
    try {
        const selectedOptions = document.querySelectorAll('.additive-option.selected');
        const additiveIds = Array.from(selectedOptions).map(option => {
            return parseInt(option.getAttribute('onclick').match(/\d+/)[0]);
        });

        const response = await fetch(`/api/drink-additives/${currentDrinkId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ additiveIds })
        });

        if (!response.ok) {
            throw new Error('Fehler beim Speichern der Zusatzstoffe');
        }

        additiveSelectionModal.hide();
        // fetchDrinks wird durch das Socket.io-Event ausgelöst
    } catch (error) {
        console.error('Fehler:', error);
        alert('Fehler beim Speichern der Zusatzstoffe');
    }
}
