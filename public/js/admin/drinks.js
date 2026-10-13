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
                    <div class="drink-actions d-flex gap-2 mb-1">
                        <button class="btn btn-outline-secondary edit-additives-btn flex-grow-1" 
                                title="Zusatzstoffe bearbeiten"
                                onclick="showAdditiveSelection(${drink.id})">
                            Zusatzstoffe <span class="additive-count">${drinkAdditives.length}</span>
                        </button>
                        <button class="btn btn-outline-primary edit-drink-btn" title="Getränk bearbeiten"
                                aria-label="Getränk bearbeiten"
                                onclick="showEditDrinkModal(${drink.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger delete-drink-btn" title="Getränk löschen"
                                aria-label="Getränk löschen" data-drink-name="${escapeAttr(drink.name)}"
                                onclick="deleteDrink(${drink.id}, this.dataset.drinkName)">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
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
        const response = await sendJson(`/api/drinks/toggle/${currentLocation}`, { id, is_active });
        
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
        const response = await sendJson(`/api/drinks/toggle-price/${currentLocation}`, { id, show_price });
        
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

        const response = await sendJson(`/api/categories/toggle-visibility/${currentLocation}`, { id, is_visible: isVisible });

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

        const response = await sendJson(`/api/categories/toggle-prices/${currentLocation}`, { id, show_prices: showPrices });

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
        const response = await sendJson(`/api/categories/update-order/${currentLocation}`, { id, sort_order: parseInt(sort_order, 10) });
        
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

        const response = await sendJson(`/api/categories/toggle-column-break/${currentLocation}`, { id, force_column_break });

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

        const response = await sendJson(`/api/drink-additives/${currentDrinkId}`, { additiveIds });

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

// === Getränke anlegen, bearbeiten und löschen ===

let drinkModal;

// null = neues Getränk, sonst die ID des bearbeiteten Getränks
let editingDrinkId = null;

let drinkDeleteModal;

let drinkToDelete = null;

function toggleDrinkSmallSizeFields() {
    const hasSmallSize = document.getElementById('drinkHasSmallSize').checked;
    document.getElementById('drinkSmallSizeFields').style.display = hasSmallSize ? '' : 'none';
}

// Bereitet den Dialog vor: Kategorien laden, Formular leeren, Texte für Anlegen/Bearbeiten setzen
async function prepareDrinkModal(isEdit) {
    if (!drinkModal) {
        drinkModal = new bootstrap.Modal(document.getElementById('drinkModal'));
    }

    const response = await fetch(`/api/categories/${currentLocation}`);
    if (!response.ok) throw new Error('Kategorien konnten nicht geladen werden');
    const categories = await response.json();
    const select = document.getElementById('drinkCategory');
    select.innerHTML = '<option value="">Bitte wählen …</option>';
    categories.forEach((category) => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });

    document.getElementById('drinkForm').reset();
    document.getElementById('drinkModalLabel').textContent = isEdit ? 'Getränk bearbeiten' : 'Neues Getränk';
    document.getElementById('drinkActiveGroup').style.display = isEdit ? 'none' : '';
    document.getElementById('drinkEditHint').style.display = isEdit ? '' : 'none';
}

// Öffnet den Dialog für ein neues Getränk
async function showAddDrinkModal() {
    try {
        await prepareDrinkModal(false);
    } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
        showNotification('Fehler beim Laden der Kategorien', 'error');
        return;
    }

    editingDrinkId = null;
    toggleDrinkSmallSizeFields();
    drinkModal.show();
}

// Öffnet den Dialog mit den Stammdaten eines bestehenden Getränks
async function showEditDrinkModal(id) {
    let drink;
    try {
        await prepareDrinkModal(true);
        // Stammdaten direkt laden: die Liste kann temporäre Preise enthalten
        const response = await fetch(`/api/drink/${id}`);
        if (!response.ok) throw new Error('Getränk konnte nicht geladen werden');
        drink = await response.json();
    } catch (error) {
        console.error('Fehler beim Laden des Getränks:', error);
        showNotification('Fehler beim Laden des Getränks', 'error');
        return;
    }

    editingDrinkId = id;
    document.getElementById('drinkName').value = drink.name || '';
    document.getElementById('drinkCategory').value = drink.category_id ?? '';
    document.getElementById('drinkPrice').value = drink.preis ?? '';
    document.getElementById('drinkVolume').value = drink.volume_normal || '';
    document.getElementById('drinkHasSmallSize').checked = Boolean(drink.has_small_size);
    document.getElementById('drinkSmallPrice').value = drink.small_price ?? '';
    document.getElementById('drinkSmallVolume').value = drink.volume_small || '';
    toggleDrinkSmallSizeFields();
    drinkModal.show();
}

// Speichert ein neues oder das bearbeitete Getränk
async function saveDrink() {
    const isEdit = editingDrinkId !== null;
    const name = document.getElementById('drinkName').value.trim();
    const categoryId = document.getElementById('drinkCategory').value;
    const price = document.getElementById('drinkPrice').value;
    const hasSmallSize = document.getElementById('drinkHasSmallSize').checked;
    const smallPrice = document.getElementById('drinkSmallPrice').value;

    if (!name) {
        showNotification('Bitte geben Sie einen Namen ein', 'error');
        return;
    }
    if (!categoryId) {
        showNotification('Bitte wählen Sie eine Kategorie aus', 'error');
        return;
    }
    if (price === '' || Number(price) < 0) {
        showNotification('Bitte geben Sie einen gültigen Preis ein', 'error');
        return;
    }
    if (hasSmallSize && (smallPrice === '' || Number(smallPrice) < 0)) {
        showNotification('Bitte geben Sie den Preis für die kleine Größe ein', 'error');
        return;
    }

    const saveButton = document.getElementById('saveDrinkBtn');
    saveButton.disabled = true;

    try {
        const data = {
            name,
            preis: price,
            category_id: categoryId,
            volume_normal: document.getElementById('drinkVolume').value,
            has_small_size: hasSmallSize,
            small_price: hasSmallSize ? smallPrice : null,
            volume_small: hasSmallSize ? document.getElementById('drinkSmallVolume').value : null,
        };
        if (!isEdit) {
            data.is_active = document.getElementById('drinkActive').checked;
        }

        const response = isEdit
            ? await sendJson(`/api/drinks/${editingDrinkId}`, data, 'PUT')
            : await sendJson('/api/drinks', data);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }

        drinkModal.hide();
        showNotification(`„${escapeHtml(name)}“ wurde ${isEdit ? 'gespeichert' : 'angelegt'}`, 'success');
        fetchDrinks();
    } catch (error) {
        console.error('Fehler beim Speichern des Getränks:', error);
        showNotification('Fehler beim Speichern: ' + error.message, 'error');
    } finally {
        saveButton.disabled = false;
    }
}

// Fragt vor dem Löschen nach (das Getränk verschwindet von allen Karten)
function deleteDrink(id, name) {
    if (!drinkDeleteModal) {
        drinkDeleteModal = new bootstrap.Modal(document.getElementById('drinkDeleteModal'));
    }
    drinkToDelete = { id, name };
    document.getElementById('drinkDeleteName').textContent = name || 'dieses Getränk';
    drinkDeleteModal.show();
}

async function confirmDeleteDrink() {
    if (!drinkToDelete) return;
    const { id, name } = drinkToDelete;

    const confirmButton = document.getElementById('confirmDrinkDeleteBtn');
    confirmButton.disabled = true;

    try {
        const response = await fetch(`/api/drinks/${id}`, { method: 'DELETE' });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Fehler beim Löschen');
        }

        drinkDeleteModal.hide();
        drinkToDelete = null;
        showNotification(`„${escapeHtml(name)}“ wurde gelöscht`, 'success');
        fetchDrinks();
    } catch (error) {
        console.error('Fehler beim Löschen des Getränks:', error);
        showNotification('Fehler beim Löschen: ' + error.message, 'error');
    } finally {
        confirmButton.disabled = false;
    }
}
