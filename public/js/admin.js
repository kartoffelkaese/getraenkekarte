const socket = io();
const drinksTableBody = document.getElementById('drinksTableBody');
const categoriesTableBody = document.getElementById('categoriesTableBody');
const locationInputs = document.querySelectorAll('input[name="location"]');
let currentLocation = 'haupttheke';

// Event-Listener für Location-Wechsel
locationInputs.forEach(input => {
    input.addEventListener('change', (e) => {
        currentLocation = e.target.value;
        fetchCategories();
        fetchDrinks();
        fetchAds();
        fetchLogo();
    });
});

// Event-Listener für Location Tabs
document.querySelectorAll('#locationTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', function(e) {
        e.preventDefault();
        // Aktiven Tab setzen
        document.querySelectorAll('#locationTabs .nav-link').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Location aktualisieren und Daten neu laden
        currentLocation = this.dataset.location;
        fetchCategories();
        fetchDrinks();
        fetchLogo();
    });
});

// Initialer Load
document.addEventListener('DOMContentLoaded', function() {
    currentLocation = document.querySelector('#locationTabs .nav-link.active').dataset.location;
    fetchCategories();
    fetchDrinks();
    fetchAds();
    fetchLogo();
    fetchAdditives();
});

// Socket.io Events
socket.on('drinkStatusChanged', ({ id, is_active, location }) => {
    if (location === currentLocation) {
        const switchElement = document.querySelector(`#switch-${id}`);
        if (switchElement) {
            switchElement.checked = is_active;
        }
    }
});

socket.on('drinkPriceChanged', ({ id, show_price, location }) => {
    if (location === currentLocation) {
        const switchElement = document.querySelector(`#price-switch-${id}`);
        if (switchElement) {
            switchElement.checked = show_price;
        }
    }
});

socket.on('categoryPricesChanged', ({ id, show_prices, location }) => {
    if (location === currentLocation) {
        const switchElement = document.querySelector(`#category-switch-${id}`);
        if (switchElement) {
            switchElement.checked = show_prices;
        }
    }
});

socket.on('categoryVisibilityChanged', ({ id, is_visible, location }) => {
    if (location === currentLocation) {
        const switchElement = document.querySelector(`#visibility-switch-${id}`);
        if (switchElement) {
            switchElement.checked = is_visible;
        }
    }
});

socket.on('categorySortChanged', ({ location }) => {
    if (location === currentLocation) {
        fetchCategories();
    }
});

socket.on('categoryColumnBreakChanged', ({ location }) => {
    if (location === currentLocation) {
        fetchCategories();
    }
});

socket.on('adsChanged', () => {
    fetchAds();
});

socket.on('logoChanged', () => {
    fetchLogo();
});

socket.on('drinkAdditivesChanged', ({ drinkId }) => {
    fetchDrinks();
});

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
        
        if (visibilitySwitch) {
            visibilitySwitch.checked = logoSettings.is_active;
        }
        
        if (orderInput) {
            orderInput.value = logoSettings.sort_order || 0;
        }

        if (columnBreakSwitch) {
            columnBreakSwitch.checked = logoSettings.force_column_break || false;
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
    categoriesTableBody.innerHTML = '';
    categories.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="category-switch-${category.id}" 
                           ${category.show_prices ? 'checked' : ''}
                           onchange="toggleCategoryPrices(${category.id}, this.checked)">
                </div>
            </td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="visibility-switch-${category.id}" 
                           ${category.is_visible ? 'checked' : ''}
                           onchange="toggleCategoryVisibility(${category.id}, this.checked)">
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       style="width: 80px"
                       value="${category.sort_order || 0}"
                       onchange="updateCategoryOrder(${category.id}, this.value)">
            </td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="column-break-switch-${category.id}" 
                           ${category.force_column_break ? 'checked' : ''}
                           onchange="toggleColumnBreak(${category.id}, this.checked)">
                </div>
            </td>
        `;
        categoriesTableBody.appendChild(row);
    });
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
    drinksTableBody.innerHTML = '';
    allAdditives = await fetch('/api/additives').then(res => res.json());
    
    for (const drink of drinks) {
        const drinkAdditives = await fetchDrinkAdditives(drink.id);
        const row = document.createElement('tr');
        const preis = parseFloat(drink.preis) || 0;
        
        row.innerHTML = `
            <td>${drink.name}</td>
            <td>${preis.toFixed(2)} €</td>
            <td>${drink.category_name || '-'}</td>
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
                        ${drinkAdditives.map(a => `<span class="additive-badge">${a.code}</span>`).join('')}
                    </div>
                </div>
            </td>
        `;
        drinksTableBody.appendChild(row);
    }
}

// Funktion zum Anzeigen der Werbungen
function displayAds(ads) {
    const adsTableBody = document.getElementById('adsTableBody');
    const adsSection = document.querySelector('div.mb-4 h2').textContent === 'Werbung' 
        ? adsTableBody.closest('.mb-4')
        : null;
    
    // Zeige die Werbungssektion nur für nicht-Jugendkarten oder wenn es Jugendkarten-Werbungen gibt
    if (currentLocation === 'jugendliche' && (!Array.isArray(ads) || ads.length === 0)) {
        if (adsSection) adsSection.style.display = 'none';
        return;
    }
    
    if (adsSection) adsSection.style.display = 'block';
    adsTableBody.innerHTML = '';
    
    ads.forEach(ad => {
        const row = document.createElement('tr');
        const preis = parseFloat(ad.price) || 0;
        row.innerHTML = `
            <td>${ad.name}</td>
            <td>${preis.toFixed(2)} €</td>
            <td>${ad.card_type || 'Standard'}</td>
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
            <td><img src="${ad.image_path}" alt="${ad.name}" style="height: 50px;"></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteAd(${ad.id})">
                    <i class="bi bi-trash"></i> Löschen
                </button>
            </td>
        `;
        adsTableBody.appendChild(row);
    });
}

// Zusatzstoff-Verwaltung
let additiveModal;
let currentAdditiveId = null;

function showAddAdditiveModal() {
    currentAdditiveId = null;
    document.querySelector('#additiveModal .modal-title').textContent = 'Zusatzstoff hinzufügen';
    document.getElementById('additiveForm').reset();
    additiveModal.show();
}

async function editAdditive(id) {
    try {
        const response = await fetch(`/api/additives/${id}`);
        const additive = await response.json();

        document.getElementById('additiveCode').value = additive.code;
        document.getElementById('additiveName').value = additive.name;
        document.getElementById('additiveShowInFooter').checked = additive.show_in_footer;
        
        currentAdditiveId = id;
        document.querySelector('#additiveModal .modal-title').textContent = 'Zusatzstoff bearbeiten';
        additiveModal.show();
    } catch (error) {
        console.error('Fehler beim Laden des Zusatzstoffs:', error);
        alert('Fehler beim Laden des Zusatzstoffs');
    }
}

function deleteAdditive(id) {
    if (confirm('Möchten Sie diesen Zusatzstoff wirklich löschen?')) {
        fetch(`/api/additives/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                fetchAdditives();
            } else {
                alert('Fehler beim Löschen des Zusatzstoffs');
            }
        })
        .catch(error => {
            console.error('Fehler beim Löschen des Zusatzstoffs:', error);
            alert('Fehler beim Löschen des Zusatzstoffs');
        });
    }
}

async function saveAdditive() {
    const code = document.getElementById('additiveCode').value;
    const name = document.getElementById('additiveName').value;
    const showInFooter = document.getElementById('additiveShowInFooter').checked;
    const id = currentAdditiveId;

    const url = id ? `/api/additives/${id}` : '/api/additives';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, show_in_footer: showInFooter })
        });

        if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');

        additiveModal.hide();
        fetchAdditives();
    } catch (error) {
        console.error('Fehler beim Speichern des Zusatzstoffs:', error);
        alert('Fehler beim Speichern des Zusatzstoffs');
    }
}

// Funktion zum Anzeigen der Zusatzstoffe
function displayAdditives(additives) {
    const additivesTableBody = document.getElementById('additivesTableBody');
    additivesTableBody.innerHTML = '';
    
    additives.forEach(additive => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${additive.code}</td>
            <td>${additive.name}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           ${additive.show_in_footer ? 'checked' : ''}
                           onchange="toggleFooterVisibility(${additive.id}, this.checked)">
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editAdditive(${additive.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAdditive(${additive.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        additivesTableBody.appendChild(row);
    });
}

async function toggleFooterVisibility(id, showInFooter) {
    try {
        const response = await fetch(`/api/additives/${id}/toggle-footer`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ show_in_footer: showInFooter })
        });
        
        if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');
        
        // Aktualisiere die Anzeige
        fetchAdditives();
    } catch (error) {
        console.error('Fehler beim Ändern der Footer-Sichtbarkeit:', error);
        alert('Fehler beim Ändern der Footer-Sichtbarkeit');
    }
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

// Funktion zum Umschalten der Preisanzeige für Kategorien
async function toggleCategoryPrices(id, show_prices) {
    try {
        const response = await fetch(`/api/categories/toggle-prices/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, show_prices })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Preisanzeige:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#category-switch-${id}`);
        if (switchElement) {
            switchElement.checked = !show_prices;
        }
    }
}

// Funktion zum Umschalten der Kategorie-Sichtbarkeit
async function toggleCategoryVisibility(id, is_visible) {
    try {
        const response = await fetch(`/api/categories/toggle-visibility/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, is_visible })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Kategorie-Sichtbarkeit:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#visibility-switch-${id}`);
        if (switchElement) {
            switchElement.checked = !is_visible;
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

// Funktion zum Umschalten des Spaltenumbruchs
async function toggleColumnBreak(id, force_column_break) {
    try {
        const response = await fetch(`/api/categories/toggle-column-break/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, force_column_break })
        });
        
        if (!response.ok) {
            throw new Error('Netzwerk-Antwort war nicht ok');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Spaltenumbruchs:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#column-break-switch-${id}`);
        if (switchElement) {
            switchElement.checked = !force_column_break;
        }
    }
}

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

// Funktion zum Umschalten der Logo-Sichtbarkeit
async function toggleLogoVisibility(is_active) {
    try {
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
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Logo-Sichtbarkeit:', error);
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

// Bild-Upload Funktionalität
let imageUploadModal;
let deleteConfirmModal;
let adToDelete = null;

// Funktion zum Hochladen eines Bildes
async function uploadImage() {
    const name = document.getElementById('imageName').value;
    const price = document.getElementById('imagePrice').value;
    const fileInput = document.getElementById('imageFile');
    const cardType = document.getElementById('cardType').value;
    const isActive = document.getElementById('imageActive').checked;
    const sortOrder = document.getElementById('imageSortOrder').value;
    
    if (!name || !price || !fileInput.files[0]) {
        showNotification('Bitte füllen Sie alle erforderlichen Felder aus.', 'warning');
        return;
    }
    
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
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
            document.getElementById('imageUploadForm').reset();
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

// Funktion zum Anzeigen von Benachrichtigungen
function showNotification(message, type = 'info') {
    const notificationContainer = document.getElementById('notificationContainer') || createNotificationContainer();
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Schließen"></button>
    `;
    
    notificationContainer.appendChild(notification);
    
    // Automatisch nach 5 Sekunden ausblenden
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 150);
    }, 5000);
}

// Funktion zum Erstellen des Benachrichtigungscontainers
function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.maxWidth = '350px';
    document.body.appendChild(container);
    return container;
} 