const socket = io();
const drinksTableBody = document.getElementById('drinksTableBody');
const categoriesTableBody = document.getElementById('categoriesTableBody');
const locationInputs = document.querySelectorAll('input[name="location"]');
const speisekarteSection = document.getElementById('speisekarteSection');
let currentLocation = 'haupttheke';
let dishModal;

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
        
        // Sichtbarkeit der Sektionen steuern
        updateSectionVisibility();
        
        // Daten laden basierend auf der Location
        if (currentLocation === 'speisekarte') {
            fetchDishes();
        } else {
            fetchCategories();
            fetchDrinks();
            fetchLogo();
        }
        fetchAds();
    });
});

// Funktion zum Aktualisieren der Sichtbarkeit der Sektionen
function updateSectionVisibility() {
    // Finde die Sektionen anhand ihrer IDs oder spezifischen Strukturen
    const sections = {
        'logo': findSectionByHeading('Logo'),
        'categories': findSectionByHeading('Kategorien'),
        'ads': findSectionByHeading('Werbung'),
        'drinks': findSectionByHeading('Getränke'),
        'speisekarte': document.getElementById('speisekarteSection'),
        'additives': findSectionByHeading('Zusatzstoffe verwalten'),
        'bilder': document.getElementById('bilderSection'),
        'temp-prices': document.getElementById('tempPricesSection'),
        'settings': document.getElementById('settingsSection'),
        'schedule': document.getElementById('scheduleSection'),
        'export': document.getElementById('exportSection')
    };

    // Alle Sektionen verstecken
    Object.values(sections).forEach(section => {
        if (section) section.style.display = 'none';
    });

    // Sektionen basierend auf der Location anzeigen
    if (currentLocation === 'export') {
        // Nur Export-Sektion anzeigen
        if (sections.export) sections.export.style.display = 'block';
    } else if (currentLocation === 'temp-prices') {
        // Nur Temporäre Preise Sektion anzeigen
        if (sections['temp-prices']) sections['temp-prices'].style.display = 'block';
        fetchTempPrices(); // Lade temporäre Preise
    } else if (currentLocation === 'settings') {
        // Nur Einstellungen-Sektion anzeigen
        if (sections.settings) sections.settings.style.display = 'block';
        fetchCycleConfig(); // Lade Cycle-Konfiguration
        fetchOverviewConfig(); // Lade Overview-Konfiguration
        loadPresetsIfSettings(); // Lade Presets
    } else if (currentLocation === 'schedule-1') {
        // Nur Schedule-Sektion anzeigen
        if (sections.schedule) sections.schedule.style.display = 'block';
        // Lade die Konfiguration basierend auf aktivem Tab
        if (currentScheduleTab === 1) {
            loadScheduleConfig();
        } else {
            loadSchedule2Config();
        }
    } else if (currentLocation === 'speisekarte') {
        if (sections.speisekarte) sections.speisekarte.style.display = 'block';
    } else if (currentLocation === 'jugendliche') {
        // Für die Jugendkarte: Logo, Kategorien, Getränke und Zusatzstoffe anzeigen
        if (sections.logo) sections.logo.style.display = 'block';
        if (sections.categories) sections.categories.style.display = 'block';
        if (sections.drinks) sections.drinks.style.display = 'block';
        if (sections.additives) sections.additives.style.display = 'block';
    } else if (currentLocation === 'bilder') {
        const bilderSection = document.getElementById('bilderSection');
        if (bilderSection) bilderSection.style.display = 'block';
        fetchImages(); // Bilder anzeigen, wenn die Sektion sichtbar ist
    } else {
        // Für alle anderen Locations: Alle Sektionen anzeigen
        if (sections.logo) sections.logo.style.display = 'block';
        if (sections.categories) sections.categories.style.display = 'block';
        if (sections.ads) sections.ads.style.display = 'block';
        if (sections.drinks) sections.drinks.style.display = 'block';
        if (sections.additives) sections.additives.style.display = 'block';
    }
}

// Hilfsfunktion zum Finden einer Sektion anhand ihrer Überschrift
function findSectionByHeading(headingText) {
    const headings = document.querySelectorAll('h2');
    for (const heading of headings) {
        if (heading.textContent === headingText) {
            return heading.closest('div');
        }
    }
    return null;
}

// Initialer Load
document.addEventListener('DOMContentLoaded', function() {
    currentLocation = document.querySelector('#locationTabs .nav-link.active').dataset.location;
    
    // Sichtbarkeit der Sektionen initial setzen
    updateSectionVisibility();
    
    // Daten laden basierend auf der Location
    if (currentLocation === 'speisekarte') {
        fetchDishes();
    } else {
        fetchCategories();
        fetchDrinks();
        fetchLogo();
    }
    fetchAds();
    fetchAdditives();
    
    // Initialisiere das Dish-Modal
    dishModal = new bootstrap.Modal(document.getElementById('dishModal'));
    
    // Event-Listener für die Speisekarten-Sektion
    const dishSearchInput = document.getElementById('dishSearchInput');
    const clearDishSearch = document.getElementById('clearDishSearch');
    
    if (dishSearchInput && clearDishSearch) {
        dishSearchInput.addEventListener('input', filterDishes);
        clearDishSearch.addEventListener('click', () => {
            dishSearchInput.value = '';
            filterDishes();
        });
    }
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
        const switchElement = document.querySelector(`#category-price-switch-${id}`);
        if (switchElement) {
            switchElement.checked = show_prices;
        }
    }
});

socket.on('categoryVisibilityChanged', ({ id, is_visible, location }) => {
    console.log('=== Socket.IO Kategorie-Sichtbarkeit Event empfangen ===');
    console.log('Event Daten:', { id, is_visible, location, currentLocation });
    
    if (location === currentLocation) {
        const switchElement = document.querySelector(`#category-visibility-switch-${id}`);
        console.log('Switch Element gefunden:', !!switchElement);
        
        if (switchElement) {
            console.log('Alter Switch-Status:', switchElement.checked);
            switchElement.checked = is_visible;
            console.log('Neuer Switch-Status:', switchElement.checked);
        } else {
            console.warn('Switch Element nicht gefunden für ID:', id);
        }
    } else {
        console.log('Event ignoriert - falsche Location');
    }
    
    console.log('=== Socket.IO Event Handler Ende ===');
});

socket.on('categorySortChanged', ({ location }) => {
    if (location === currentLocation) {
        fetchCategories();
    }
});

socket.on('categoryColumnBreakChanged', ({ id, force_column_break, location }) => {
    if (location === currentLocation) {
        const switchElement = document.querySelector(`#category-column-break-switch-${id}`);
        if (switchElement) {
            switchElement.checked = force_column_break;
        }
    }
});

socket.on('adsChanged', () => {
    fetchAds();
});

socket.on('logoChanged', ({ location }) => {
    if (location === currentLocation) {
        fetchLogo();
    }
});

socket.on('drinkAdditivesChanged', ({ drinkId }) => {
    fetchDrinks();
});

socket.on('dishesChanged', () => {
    if (currentLocation === 'speisekarte') {
        fetchDishes();
    }
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
        
        // Logo-Größe nur für haupttheke anzeigen
        if (currentLocation === 'haupttheke') {
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
    console.log('=== Kategorien Anzeigen Start ===');
    console.log('Eingangskategorien:', categories);
    
    const tbody = document.getElementById('categoriesTableBody');
    console.log('TBody Element gefunden:', !!tbody);
    
    if (!tbody) {
        console.error('Kategorien-TBody nicht gefunden!');
        return;
    }
    
    tbody.innerHTML = '';
    
    categories.forEach(category => {
        console.log('Verarbeite Kategorie:', category);
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
        console.log('Kategorie hinzugefügt:', category.id);
    });
    
    console.log('=== Kategorien Anzeigen Ende ===');
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
            <td>${ad.name || 'Kein Name'}</td>
            <td>${ad.price ? preis.toFixed(2) + ' €' : ''}</td>
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
            <td><img src="${ad.image_path}" alt="${ad.name || 'Werbung'}" style="height: 50px;"></td>
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

// Funktion zum Aktualisieren des Status einer Kategorie
async function toggleCategoryVisibility(id, isVisible) {
    try {
        console.log('=== Kategorie-Sichtbarkeit Toggle Start ===');
        console.log('Parameter:', { id, isVisible, currentLocation });
        
        const response = await fetch(`/api/categories/toggle-visibility/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, is_visible: isVisible })
        });
        
        console.log('Server-Antwort Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server-Antwort Daten:', result);
        
        // Sende das Event mit der Location
        console.log('Sende Socket.IO Event:', { id, isVisible, location: currentLocation });
        socket.emit('categoryVisibilityChanged', { id, is_visible: isVisible, location: currentLocation });
        
        // Überprüfe den Switch-Status
        const switchElement = document.querySelector(`#category-visibility-switch-${id}`);
        console.log('Switch Element gefunden:', !!switchElement);
        if (switchElement) {
            console.log('Aktueller Switch-Status:', switchElement.checked);
        }
        
        console.log('=== Kategorie-Sichtbarkeit Toggle Ende ===');
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Kategorie-Sichtbarkeit:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#category-visibility-switch-${id}`);
        if (switchElement) {
            console.log('Setze Switch zurück auf:', !isVisible);
            switchElement.checked = !isVisible;
        }
    }
}

// Funktion zum Aktualisieren der Preisanzeige einer Kategorie
async function toggleCategoryPrices(id, showPrices) {
    try {
        console.log('=== Kategorie-Preisanzeige Toggle Start ===');
        console.log('Parameter:', { id, showPrices, currentLocation });
        
        const response = await fetch(`/api/categories/toggle-prices/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, show_prices: showPrices })
        });
        
        console.log('Server-Antwort Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server-Antwort Daten:', result);
        
        // Sende das Event mit der Location
        console.log('Sende Socket.IO Event:', { id, showPrices, location: currentLocation });
        socket.emit('categoryPricesChanged', { id, show_prices: showPrices, location: currentLocation });
        
        // Überprüfe den Switch-Status
        const switchElement = document.querySelector(`#category-price-switch-${id}`);
        console.log('Switch Element gefunden:', !!switchElement);
        if (switchElement) {
            console.log('Aktueller Switch-Status:', switchElement.checked);
        }
        
        console.log('=== Kategorie-Preisanzeige Toggle Ende ===');
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Kategorie-Preisanzeige:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#category-price-switch-${id}`);
        if (switchElement) {
            console.log('Setze Switch zurück auf:', !showPrices);
            switchElement.checked = !showPrices;
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
    try {
        console.log('=== Kategorie-Spaltenumbruch Toggle Start ===');
        console.log('Parameter:', { id, force_column_break, currentLocation });
        
        const response = await fetch(`/api/categories/toggle-column-break/${currentLocation}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id, force_column_break })
        });
        
        console.log('Server-Antwort Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`Netzwerk-Antwort war nicht ok: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Server-Antwort Daten:', result);
        
        // Sende das Event mit der Location
        console.log('Sende Socket.IO Event:', { id, force_column_break, location: currentLocation });
        socket.emit('categoryColumnBreakChanged', { id, force_column_break, location: currentLocation });
        
        // Überprüfe den Switch-Status
        const switchElement = document.querySelector(`#category-column-break-switch-${id}`);
        console.log('Switch Element gefunden:', !!switchElement);
        if (switchElement) {
            console.log('Aktueller Switch-Status:', switchElement.checked);
        }
        
        console.log('=== Kategorie-Spaltenumbruch Toggle Ende ===');
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Kategorie-Spaltenumbruchs:', error);
        // Bei Fehler Switch zurücksetzen
        const switchElement = document.querySelector(`#category-column-break-switch-${id}`);
        if (switchElement) {
            console.log('Setze Switch zurück auf:', !force_column_break);
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
        
        // Sende das Event mit der Location
        socket.emit('adsChanged', { location: currentLocation });
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
        
        // Sende das Event mit der Location
        socket.emit('adsChanged', { location: currentLocation });
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
        
        // Sende das Event
        socket.emit('logoChanged', { location: currentLocation });
        console.log('Logo-Change Event gesendet');
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
    // Nur für haupttheke erlauben
    if (currentLocation !== 'haupttheke') {
        console.warn('Logo-Größe ist nur für haupttheke verfügbar');
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
        
        socket.emit('logoChanged', { location: currentLocation });
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

// Funktion zum Laden der Gerichte
async function fetchDishes() {
    try {
        const response = await fetch('/api/dishes');
        const dishes = await response.json();
        displayDishes(dishes);
    } catch (error) {
        console.error('Fehler beim Laden der Gerichte:', error);
    }
}

// Funktion zum Anzeigen der Gerichte
function displayDishes(dishes) {
    const tbody = document.getElementById('dishesTableBody');
    tbody.innerHTML = '';
    
    dishes.sort((a, b) => a.sort_order - b.sort_order).forEach(dish => {
        const row = document.createElement('tr');
        // Konvertiere den Preis in eine Zahl und formatiere ihn
        const price = parseFloat(dish.price) || 0;
        
        row.innerHTML = `
            <td>${dish.name}</td>
            <td>${price.toFixed(2)} €</td>
            <td>${dish.description || ''}</td>
            <td>${dish.image_path ? `<img src="${dish.image_path}" alt="${dish.name}" style="max-width: 100px;">` : ''}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="dish-active-${dish.id}" 
                           ${dish.is_active ? 'checked' : ''}
                           onchange="toggleDishStatus(${dish.id}, this.checked)">
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       style="width: 80px"
                       value="${dish.sort_order || 0}"
                       onchange="updateDishOrder(${dish.id}, this.value)">
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editDish(${dish.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteDish(${dish.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Funktion zum Filtern der Gerichte
function filterDishes() {
    const searchTerm = document.getElementById('dishSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#dishesTableBody tr');
    
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const description = row.cells[2].textContent.toLowerCase();
        row.style.display = name.includes(searchTerm) || description.includes(searchTerm) ? '' : 'none';
    });
}

// Funktion zum Anzeigen des Gericht-Modals
function showAddDishModal() {
    document.getElementById('dishForm').reset();
    document.getElementById('dishModal').dataset.dishId = '';
    dishModal.show();
}

// Funktion zum Bearbeiten eines Gerichts
async function editDish(id) {
    try {
        const response = await fetch(`/api/dishes/${id}`);
        const dish = await response.json();
        
        // Setze die Werte im Modal
        document.getElementById('dishName').value = dish.name;
        document.getElementById('dishPrice').value = dish.price;
        document.getElementById('dishDescription').value = dish.description || '';
        document.getElementById('dishOrder').value = dish.sort_order || 0;
        document.getElementById('dishActive').checked = dish.is_active;
        
        // Speichere die ID für das Update
        document.getElementById('dishForm').dataset.editId = id;
        
        // Zeige das Modal
        const modal = new bootstrap.Modal(document.getElementById('dishModal'));
        modal.show();
    } catch (error) {
        console.error('Fehler beim Laden des Gerichts:', error);
        showNotification('Fehler beim Laden des Gerichts', 'error');
    }
}

// Funktion zum Speichern eines Gerichts
async function saveDish() {
    const form = document.getElementById('dishForm');
    const formData = new FormData();
    
    // Füge die Basis-Daten hinzu
    formData.append('name', document.getElementById('dishName').value);
    formData.append('price', document.getElementById('dishPrice').value);
    formData.append('description', document.getElementById('dishDescription').value);
    formData.append('sort_order', document.getElementById('dishOrder').value);
    formData.append('is_active', document.getElementById('dishActive').checked);
    
    // Füge das Bild hinzu, falls eines ausgewählt wurde
    const imageInput = document.getElementById('dishImage');
    if (imageInput.files.length > 0) {
        formData.append('dishImage', imageInput.files[0]);
    }
    
    try {
        const editId = form.dataset.editId;
        const url = editId ? `/api/dishes/${editId}` : '/api/dishes';
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Speichern des Gerichts');
        }
        
        // Schließe das Modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('dishModal'));
        modal.hide();
        
        // Aktualisiere die Tabelle
        fetchDishes();
        
        // Zeige Erfolgsmeldung
        showNotification('Gericht erfolgreich gespeichert', 'success');
        
        // Setze das Formular zurück
        form.reset();
        delete form.dataset.editId;
    } catch (error) {
        console.error('Fehler beim Speichern des Gerichts:', error);
        showNotification('Fehler beim Speichern des Gerichts', 'error');
    }
}

// Funktion zum Löschen eines Gerichts
async function deleteDish(id) {
    if (confirm('Möchten Sie dieses Gericht wirklich löschen?')) {
        try {
            const response = await fetch(`/api/dishes/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchDishes();
                socket.emit('dishesChanged');
            }
        } catch (error) {
            console.error('Fehler beim Löschen des Gerichts:', error);
        }
    }
}

// Funktion zum Aktualisieren des Status eines Gerichts
async function toggleDishStatus(id, isActive) {
    try {
        const response = await fetch(`/api/dishes/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: isActive })
        });
        
        if (response.ok) {
            socket.emit('dishesChanged');
            showNotification('Status erfolgreich aktualisiert', 'success');
        } else {
            throw new Error('Fehler beim Aktualisieren des Status');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
        showNotification('Fehler beim Aktualisieren des Status', 'error');
    }
}

// Funktion zum Aktualisieren der Reihenfolge eines Gerichts
async function updateDishOrder(id, sortOrder) {
    try {
        const response = await fetch(`/api/dishes/${id}/order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sort_order: parseInt(sortOrder) })
        });
        
        if (response.ok) {
            socket.emit('dishesChanged');
            showNotification('Reihenfolge erfolgreich aktualisiert', 'success');
        } else {
            throw new Error('Fehler beim Aktualisieren der Reihenfolge');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Reihenfolge:', error);
        showNotification('Fehler beim Aktualisieren der Reihenfolge', 'error');
    }
}

// === Bilder-Tab Logik ===

// Event-Listener für das Bilder-Upload-Formular
const imageUploadForm = document.getElementById('imageUploadForm');
if (imageUploadForm) {
    imageUploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const fileInput = document.getElementById('imageFile');
        if (!fileInput.files.length) return;
        const files = Array.from(fileInput.files);
        let uploadSuccess = true;
        const progressDiv = document.getElementById('imageUploadProgress');
        const progressBar = progressDiv ? progressDiv.querySelector('.progress-bar') : null;
        if (progressDiv && progressBar) {
            progressDiv.style.display = '';
            progressBar.style.width = '0%';
            progressBar.textContent = '';
        }
        let uploaded = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('image', file);
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/images');
                xhr.upload.onprogress = function(event) {
                    if (event.lengthComputable && progressBar) {
                        const percent = Math.round(((uploaded + event.loaded) / (files.reduce((a, f) => a + f.size, 0))) * 100);
                        progressBar.style.width = percent + '%';
                        progressBar.textContent = percent + '%';
                    }
                };
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        uploaded += file.size;
                        resolve();
                    } else {
                        uploadSuccess = false;
                        resolve();
                    }
                };
                xhr.onerror = function() {
                    uploadSuccess = false;
                    resolve();
                };
                xhr.send(formData);
            });
        }
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
        }
        setTimeout(() => {
            if (progressDiv) progressDiv.style.display = 'none';
            if (progressBar) progressBar.style.width = '0%';
        }, 800);
        imageUploadForm.reset();
        fetchImages();
        if (uploadSuccess) {
            showNotification('Bilder erfolgreich hochgeladen', 'success');
        } else {
            showNotification('Einige Bilder konnten nicht hochgeladen werden', 'error');
        }
    });
}

// Alle Bilder löschen
const deleteAllImagesBtn = document.getElementById('deleteAllImagesBtn');

// Export-Funktionalität
async function exportCard(location) {
    try {
        showNotification(`Exportiere ${location}...`, 'info');
        
        const response = await fetch(`/api/export/${location}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Exportieren');
        }
        
        // Blob aus Response erstellen
        const blob = await response.blob();
        
        // Download-Link erstellen
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${location}-export-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification(`${location} erfolgreich exportiert!`, 'success');
        
    } catch (error) {
        console.error('Fehler beim Exportieren:', error);
        showNotification(`Fehler beim Exportieren von ${location}: ${error.message}`, 'error');
    }
}

async function exportAllCards() {
    const locations = ['haupttheke', 'theke-hinten', 'theke-hinten-bilder', 'theke-hinten-2', 'jugendliche', 'speisekarte', 'bilder'];
    
    try {
        showNotification('Starte Export aller Karten...', 'info');
        
        for (let i = 0; i < locations.length; i++) {
            const location = locations[i];
            showNotification(`Exportiere ${location} (${i + 1}/${locations.length})...`, 'info');
            
            const response = await fetch(`/api/export/${location}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Fehler bei ${location}: ${errorData.error || 'Unbekannter Fehler'}`);
            }
            
            // Blob aus Response erstellen
            const blob = await response.blob();
            
            // Download-Link erstellen
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${location}-export-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Kurze Pause zwischen Downloads
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        showNotification('Alle Karten erfolgreich exportiert!', 'success');
        
    } catch (error) {
        console.error('Fehler beim Exportieren aller Karten:', error);
        showNotification(`Fehler beim Exportieren: ${error.message}`, 'error');
    }
}
if (deleteAllImagesBtn) {
    deleteAllImagesBtn.addEventListener('click', async function() {
        if (!confirm('Möchten Sie wirklich alle Bilder unwiderruflich löschen?')) return;
        try {
            const response = await fetch('/api/images/all', { method: 'DELETE' });
            if (!response.ok) throw new Error('Fehler beim Löschen aller Bilder');
            fetchImages();
            showNotification('Alle Bilder wurden gelöscht', 'success');
        } catch (err) {
            showNotification('Fehler beim Löschen aller Bilder', 'error');
        }
    });
}

// Bilder abrufen und anzeigen
async function fetchImages() {
    try {
        const response = await fetch('/api/images');
        const images = await response.json();
        displayImages(images);
    } catch (err) {
        showNotification('Fehler beim Laden der Bilder', 'error');
    }
}

function displayImages(images) {
    const tbody = document.getElementById('imagesTableBody');
    tbody.innerHTML = '';
    const countInfo = document.getElementById('imagesCountInfo');
    if (countInfo) {
        countInfo.textContent = `Insgesamt ${images.length} Bild${images.length === 1 ? '' : 'er'} hochgeladen.`;
    }
    if (!Array.isArray(images) || images.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Keine Bilder vorhanden</td></tr>';
        return;
    }
    images.forEach(img => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${img.url}" alt="Bild" style="max-width: 100px;"></td>
            <td>${img.filename}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteImage('${img.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Bild manuell löschen
async function deleteImage(id) {
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) return;
    try {
        const response = await fetch(`/api/images/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Fehler beim Löschen');
        fetchImages();
        showNotification('Bild gelöscht', 'success');
    } catch (err) {
        showNotification('Fehler beim Löschen des Bildes', 'error');
    }
}

// Debug-Ausgaben für Socket.IO
socket.on('connect', () => {
    console.log('Socket.IO verbunden');
});

socket.on('disconnect', () => {
    console.log('Socket.IO getrennt');
});

socket.on('error', (error) => {
    console.error('Socket.IO Fehler:', error);
});

// === Cycle-Verwaltung ===

// Funktion zum Laden der Cycle-Konfiguration
async function fetchCycleConfig() {
    try {
        const response = await fetch('/api/cycle-config');
        const config = await response.json();
        
        // Fülle die Formulare mit den aktuellen Werten
        document.getElementById('standardFirstTime').value = config.standard.firstTime;
        document.getElementById('standardSecondTime').value = config.standard.secondTime;
        document.getElementById('jugendFirstTime').value = config.jugend.firstTime;
        document.getElementById('jugendSecondTime').value = config.jugend.secondTime;
    } catch (error) {
        console.error('Fehler beim Laden der Cycle-Konfiguration:', error);
        showNotification('Fehler beim Laden der Cycle-Konfiguration', 'error');
    }
}

// Funktion zum Speichern der Cycle-Konfiguration
async function saveCycleConfig(type) {
    try {
        let firstTime, secondTime;
        
        if (type === 'standard') {
            firstTime = document.getElementById('standardFirstTime').value;
            secondTime = document.getElementById('standardSecondTime').value;
        } else if (type === 'jugend') {
            firstTime = document.getElementById('jugendFirstTime').value;
            secondTime = document.getElementById('jugendSecondTime').value;
        } else {
            throw new Error('Ungültiger Cycle-Typ');
        }
        
        const response = await fetch('/api/cycle-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                firstTime: parseInt(firstTime),
                secondTime: parseInt(secondTime)
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }
        
        const result = await response.json();
        showNotification(result.message || 'Cycle-Konfiguration gespeichert', 'success');
        
    } catch (error) {
        console.error('Fehler beim Speichern der Cycle-Konfiguration:', error);
        showNotification('Fehler beim Speichern: ' + error.message, 'error');
    }
}



// === Temporäre Preise ===

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
    const drink = allDrinks.find(d => d.id == drinkId);
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
        
        // Sende Socket.IO Event für Preis-Update
        socket.emit('priceOverridesChanged', { 
            location: 'theke-hinten', 
            active: tempPricesData.active, 
            drinks: tempPricesData.drinks 
        });
        
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

// Funktion zum Laden der Overview-Konfiguration
async function fetchOverviewConfig() {
    try {
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

let autoRefreshInterval = null;
let isAutoRefreshActive = false;

// Lade Health Status beim Wechsel zum Settings Tab
function loadHealthStatus() {
    if (currentLocation === 'settings') {
        refreshHealthStatus();
    }
}

// Health Status aktualisieren
async function refreshHealthStatus() {
    const container = document.getElementById('healthStatusContainer');
    if (!container) return;

    try {
        // Zeige Loading-Spinner
        container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Lade...</span>
                </div>
                <p class="mt-2" style="color: #e0e0e0;">Lade System Status...</p>
            </div>
        `;

        const response = await fetch('/api/health');
        const healthData = await response.json();

        if (response.ok) {
            displayHealthStatus(healthData);
        } else {
            displayHealthError(healthData);
        }
    } catch (error) {
        console.error('Health Status Fehler:', error);
        displayHealthError({ error: 'Verbindung zum Server fehlgeschlagen' });
    }
}

// Health Status anzeigen
function displayHealthStatus(data) {
    const container = document.getElementById('healthStatusContainer');
    if (!container) return;

    const isHealthy = data.status === 'healthy';
    const statusColor = isHealthy ? 'success' : 'danger';
    const statusIcon = isHealthy ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
    const dbStatus = data.database === 'connected' ? 'Verbunden' : 'Getrennt';
    const dbColor = data.database === 'connected' ? 'success' : 'danger';

    // Formatiere Uptime
    const uptime = formatUptime(data.uptime);
    
    // Formatiere Memory
    const memory = data.memory ? formatMemory(data.memory) : 'N/A';

    container.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="card border-${statusColor}">
                    <div class="card-body">
                        <h6 class="card-title text-white">
                            <i class="bi ${statusIcon} text-${statusColor}"></i>
                            System Status
                        </h6>
                        <p class="card-text">
                            <span class="badge bg-${statusColor}">${data.status.toUpperCase()}</span>
                        </p>
                        <small class="text-light">
                            Letzte Aktualisierung: ${new Date(data.timestamp).toLocaleString('de-DE')}
                        </small>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card border-${dbColor}">
                    <div class="card-body">
                        <h6 class="card-title text-white">
                            <i class="bi bi-database text-${dbColor}"></i>
                            Datenbank
                        </h6>
                        <p class="card-text">
                            <span class="badge bg-${dbColor}">${dbStatus}</span>
                        </p>
                        <small class="text-light">
                            ${data.connectionStats ? `Verbindungen: ${data.connectionStats.activeConnections}/${data.connectionStats.totalConnections}` : 'Stats nicht verfügbar'}
                        </small>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-3">
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                            <h6 class="card-title text-white">
                                <i class="bi bi-clock"></i>
                                Laufzeit
                            </h6>
                        <p class="card-text h5 text-white">${uptime}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                            <h6 class="card-title text-white">
                                <i class="bi bi-memory"></i>
                                Speicher
                            </h6>
                        <p class="card-text h5 text-white">${memory}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-4">
                <div class="card">
                    <div class="card-body text-center">
                        <h6 class="card-title text-white">
                            <i class="bi bi-activity"></i>
                            Verbindungen
                        </h6>
                        <p class="card-text h5 text-white">
                            ${data.connectionStats ? 
                                `${data.connectionStats.activeConnections}/${data.connectionStats.totalConnections}` : 
                                'N/A'
                            }
                        </p>
                        ${data.connectionStats && data.connectionStats.failedConnections > 0 ? 
                            `<small class="text-danger">Fehler: ${data.connectionStats.failedConnections}</small>` : 
                            ''
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Health Error anzeigen
function displayHealthError(data) {
    const container = document.getElementById('healthStatusContainer');
    if (!container) return;

    container.innerHTML = `
        <div class="alert alert-danger">
            <h6><i class="bi bi-exclamation-triangle-fill"></i> System Status Fehler</h6>
            <p class="mb-0">${data.error || 'Unbekannter Fehler'}</p>
            <small class="text-light">
                Zeit: ${new Date().toLocaleString('de-DE')}
            </small>
        </div>
    `;
}

// Uptime formatieren
function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
}

// Memory formatieren
function formatMemory(memory) {
    const usedMB = Math.round(memory.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memory.heapTotal / 1024 / 1024);
    return `${usedMB}MB / ${totalMB}MB`;
}

// Auto-Refresh umschalten
function toggleAutoRefresh() {
    const icon = document.getElementById('autoRefreshIcon');
    const text = document.getElementById('autoRefreshText');
    
    if (isAutoRefreshActive) {
        // Stoppe Auto-Refresh
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        isAutoRefreshActive = false;
        icon.className = 'bi bi-play-circle';
        text.textContent = 'Auto-Refresh';
        showNotification('Auto-Refresh gestoppt', 'info');
    } else {
        // Starte Auto-Refresh
        autoRefreshInterval = setInterval(refreshHealthStatus, 10000); // Alle 10 Sekunden
        isAutoRefreshActive = true;
        icon.className = 'bi bi-pause-circle';
        text.textContent = 'Stoppen';
        showNotification('Auto-Refresh gestartet (10s)', 'success');
    }
}

// Erweitere updateSectionVisibility um Health Status zu laden
const originalUpdateSectionVisibility = updateSectionVisibility;
updateSectionVisibility = function() {
    originalUpdateSectionVisibility();
    loadHealthStatus();
};

// === Schedule Management ===

let scheduleConfig = { defaultCard: 'cycle', rules: [] };
let schedule2Config = { defaultCard: 'cycle', rules: [] };
let scheduleStatusInterval = null;
let schedule2StatusInterval = null;
let currentScheduleTab = 1; // 1 oder 2

// Wechsle zwischen Schedule 1 und 2 Tabs
function switchScheduleTab(scheduleNumber) {
    currentScheduleTab = scheduleNumber;
    
    if (scheduleNumber === 1) {
        loadScheduleConfig();
        stopSchedule2StatusUpdates();
    } else {
        loadSchedule2Config();
        stopScheduleStatusUpdates();
    }
}

// Lade Schedule-Konfiguration
async function loadScheduleConfig() {
    if (currentLocation === 'schedule-1') {
        try {
            const response = await fetch('/api/schedule-config');
            scheduleConfig = await response.json();
            
            // Aktualisiere Default-Karte Dropdown
            const defaultCardSelect = document.getElementById('defaultCardSelect');
            if (defaultCardSelect) {
                defaultCardSelect.value = scheduleConfig.defaultCard;
            }
            
            // Lade Regeln-Liste
            displayRulesList();
            
            // Lade aktuelle Karte
            await updateScheduleStatus();
            
            // Starte periodische Status-Aktualisierung
            startScheduleStatusUpdates();
            
        } catch (error) {
            console.error('Fehler beim Laden der Schedule-Konfiguration:', error);
            showNotification('Fehler beim Laden der Schedule-Konfiguration', 'error');
        }
    } else {
        // Stoppe Status-Updates wenn nicht im Schedule-Tab
        stopScheduleStatusUpdates();
    }
}

// Lade Schedule-2-Konfiguration
async function loadSchedule2Config() {
    if (currentLocation === 'schedule-1') {
        try {
            const response = await fetch('/api/schedule-2-config');
            schedule2Config = await response.json();
            
            // Aktualisiere Default-Karte Dropdown
            const defaultCardSelect2 = document.getElementById('defaultCardSelect2');
            if (defaultCardSelect2) {
                defaultCardSelect2.value = schedule2Config.defaultCard;
            }
            
            // Lade Regeln-Liste
            displayRulesList2();
            
            // Lade aktuelle Karte
            await updateSchedule2Status();
            
            // Starte periodische Status-Aktualisierung
            startSchedule2StatusUpdates();
            
        } catch (error) {
            console.error('Fehler beim Laden der Schedule-2-Konfiguration:', error);
            showNotification('Fehler beim Laden der Schedule-2-Konfiguration', 'error');
        }
    } else {
        // Stoppe Status-Updates wenn nicht im Schedule-Tab
        stopSchedule2StatusUpdates();
    }
}

// Aktualisiere Schedule-Status im Admin-Panel
async function updateScheduleStatus() {
    if (currentLocation !== 'schedule-1') return;
    
    try {
        const response = await fetch('/api/schedule-config/current');
        const data = await response.json();
        
        // Aktualisiere aktuelle Karte
        const currentCardElement = document.getElementById('currentScheduleCard');
        if (currentCardElement) {
            currentCardElement.textContent = data.currentCard || 'Unbekannt';
        }
        
        // Aktualisiere letzte Aktualisierung
        const lastUpdateElement = document.getElementById('scheduleLastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Aktualisiere nächste Prüfung
        const nextCheckElement = document.getElementById('nextScheduleCheck');
        if (nextCheckElement) {
            const now = new Date();
            const nextCheck = new Date(now.getTime() + 60000); // +1 Minute
            nextCheckElement.textContent = nextCheck.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Schedule-Status:', error);
    }
}

// Starte periodische Status-Updates
function startScheduleStatusUpdates() {
    if (scheduleStatusInterval) {
        clearInterval(scheduleStatusInterval);
    }
    
    // Sofortige erste Aktualisierung
    updateScheduleStatus();
    
    // Dann alle 30 Sekunden
    scheduleStatusInterval = setInterval(updateScheduleStatus, 30000);
    console.log('Schedule-Status-Updates gestartet (30s Intervall)');
}

// Stoppe periodische Status-Updates
function stopScheduleStatusUpdates() {
    if (scheduleStatusInterval) {
        clearInterval(scheduleStatusInterval);
        scheduleStatusInterval = null;
        console.log('Schedule-Status-Updates gestoppt');
    }
}

// Zeige Regeln-Liste an
function displayRulesList() {
    const rulesList = document.getElementById('rulesList');
    if (!rulesList) return;

    if (scheduleConfig.rules.length === 0) {
        rulesList.innerHTML = `
            <div class="text-center text-light">
                <i class="bi bi-calendar-x" style="font-size: 2rem; color: #6c757d;"></i>
                <p class="mt-2 text-white">Keine Regeln definiert</p>
                <button class="btn btn-success" onclick="showAddRuleModal()">
                    <i class="bi bi-plus-circle"></i> Erste Regel hinzufügen
                </button>
            </div>
        `;
        return;
    }

    let html = '<div class="row">';
    
    scheduleConfig.rules.forEach((rule, index) => {
        const ruleType = rule.type === 'weekly' ? 'Wöchentlich' : 'Datum';
        const ruleDescription = getRuleDescription(rule);
        const ruleColor = rule.type === 'weekly' ? 'primary' : 'success';
        
        // Prüfe ob es ein Preset ist
        const isPreset = rule.card.startsWith('preset:');
        const cardDisplay = isPreset 
            ? `<i class="bi bi-bookmark text-info"></i> Preset: ${rule.card.replace('preset:', '')}`
            : rule.card;
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card border-${ruleColor}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="card-title text-white">
                                    <span class="badge bg-${ruleColor}">${ruleType}</span>
                                    ${cardDisplay}
                                </h6>
                                <p class="card-text small text-light">${ruleDescription}</p>
                                <small class="text-light">Zeit: ${rule.startTime} - ${rule.endTime}</small>
                            </div>
                            <div class="btn-group-vertical btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="editRule('${rule.id}')" title="Bearbeiten">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteRule('${rule.id}')" title="Löschen">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    rulesList.innerHTML = html;
}

// Generiere Regel-Beschreibung
function getRuleDescription(rule) {
    if (rule.type === 'weekly') {
        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        const selectedDays = rule.days.map(day => dayNames[day]).join(', ');
        return `Tage: ${selectedDays}`;
    } else if (rule.type === 'date') {
        if (rule.endDate && rule.endDate !== rule.startDate) {
            return `Datum: ${rule.startDate} - ${rule.endDate}`;
        } else {
            return `Datum: ${rule.startDate}`;
        }
    }
    return 'Unbekannter Typ';
}

// Zeige Add Rule Modal
async function showAddRuleModal() {
    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Neue Schedule-Regel';
    document.getElementById('ruleId').value = '';
    document.getElementById('ruleScheduleNumber').value = '1'; // Markiere als Schedule-1
    clearRuleForm();
    
    // Lade Presets und füge sie zum Select hinzu
    await populateRuleCardSelect();
    
    modal.show();
}

// Bearbeite Regel
async function editRule(ruleId) {
    const rule = scheduleConfig.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Schedule-Regel bearbeiten';
    document.getElementById('ruleId').value = ruleId;
    document.getElementById('ruleScheduleNumber').value = '1'; // Markiere als Schedule-1
    
    // Lade Presets und füge sie zum Select hinzu
    await populateRuleCardSelect();
    
    // Fülle Formular
    document.getElementById('ruleType').value = rule.type;
    toggleRuleFields();
    
    if (rule.type === 'weekly') {
        rule.days.forEach(day => {
            const checkbox = document.getElementById(`day${day}`);
            if (checkbox) checkbox.checked = true;
        });
    } else if (rule.type === 'date') {
        document.getElementById('startDate').value = rule.startDate;
        document.getElementById('endDate').value = rule.endDate || '';
    }
    
    document.getElementById('startTime').value = rule.startTime;
    document.getElementById('endTime').value = rule.endTime;
    document.getElementById('ruleCard').value = rule.card;
    
    modal.show();
}

// Lösche Regel
async function deleteRule(ruleId) {
    if (!confirm('Möchten Sie diese Regel wirklich löschen?')) return;

    try {
        const updatedRules = scheduleConfig.rules.filter(r => r.id !== ruleId);
        await saveScheduleConfig({ ...scheduleConfig, rules: updatedRules });
        showNotification('Regel gelöscht', 'success');
        displayRulesList();
    } catch (error) {
        console.error('Fehler beim Löschen der Regel:', error);
        showNotification('Fehler beim Löschen der Regel', 'error');
    }
}

// Speichere Regel
async function saveRule() {
    const ruleId = document.getElementById('ruleId').value;
    const ruleType = document.getElementById('ruleType').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const card = document.getElementById('ruleCard').value;

    // Validierung
    if (!card) {
        showNotification('Bitte wählen Sie eine Karte aus', 'error');
        return;
    }

    if (startTime >= endTime) {
        showNotification('End-Zeit muss nach Start-Zeit liegen', 'error');
        return;
    }

    let rule = {
        id: ruleId || `rule-${Date.now()}`,
        type: ruleType,
        startTime,
        endTime,
        card
    };

    if (ruleType === 'weekly') {
        const selectedDays = [];
        for (let i = 0; i < 7; i++) {
            const checkbox = document.getElementById(`day${i}`);
            if (checkbox && checkbox.checked) {
                selectedDays.push(i);
            }
        }
        if (selectedDays.length === 0) {
            showNotification('Bitte wählen Sie mindestens einen Wochentag aus', 'error');
            return;
        }
        rule.days = selectedDays;
    } else if (ruleType === 'date') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate) {
            showNotification('Bitte wählen Sie ein Start-Datum aus', 'error');
            return;
        }
        
        if (endDate && endDate < startDate) {
            showNotification('End-Datum muss nach Start-Datum liegen', 'error');
            return;
        }
        
        rule.startDate = startDate;
        if (endDate) rule.endDate = endDate;
    }

    try {
        const scheduleNumber = document.getElementById('ruleScheduleNumber')?.value || '1';
        const config = scheduleNumber === '2' ? schedule2Config : scheduleConfig;
        let updatedRules;
        
        if (ruleId) {
            // Bearbeite bestehende Regel
            updatedRules = config.rules.map(r => r.id === ruleId ? rule : r);
        } else {
            // Füge neue Regel hinzu
            updatedRules = [...config.rules, rule];
        }

        if (scheduleNumber === '2') {
            await saveSchedule2Config({ ...schedule2Config, rules: updatedRules });
        } else {
            await saveScheduleConfig({ ...scheduleConfig, rules: updatedRules });
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('ruleModal'));
        modal.hide();
        
        showNotification(ruleId ? 'Regel aktualisiert' : 'Regel hinzugefügt', 'success');
        
        if (scheduleNumber === '2') {
            displayRulesList2();
        } else {
            displayRulesList();
        }
        
    } catch (error) {
        console.error('Fehler beim Speichern der Regel:', error);
        showNotification('Fehler beim Speichern der Regel', 'error');
    }
}

// Speichere Schedule-Konfiguration
async function saveScheduleConfig(config) {
    try {
        const response = await fetch('/api/schedule-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }

        scheduleConfig = config;
        return await response.json();
        
    } catch (error) {
        console.error('Fehler beim Speichern der Schedule-Konfiguration:', error);
        throw error;
    }
}

// Speichere Default-Karte
async function saveDefaultCard() {
    const defaultCard = document.getElementById('defaultCardSelect').value;
    
    try {
        await saveScheduleConfig({ ...scheduleConfig, defaultCard });
        showNotification('Standard-Karte gespeichert', 'success');
    } catch (error) {
        console.error('Fehler beim Speichern der Standard-Karte:', error);
        showNotification('Fehler beim Speichern der Standard-Karte', 'error');
    }
}

// Force Schedule Reload
async function forceScheduleReload() {
    try {
        socket.emit('forceScheduleReload');
        showNotification('Schedule wird neu gestartet', 'info');
    } catch (error) {
        console.error('Fehler beim Schedule Reload:', error);
        showNotification('Fehler beim Schedule Reload', 'error');
    }
}

// Toggle Regel-Felder basierend auf Typ
function toggleRuleFields() {
    const ruleType = document.getElementById('ruleType').value;
    const weeklyFields = document.getElementById('weeklyFields');
    const dateFields = document.getElementById('dateFields');
    
    if (ruleType === 'weekly') {
        weeklyFields.style.display = 'block';
        dateFields.style.display = 'none';
    } else if (ruleType === 'date') {
        weeklyFields.style.display = 'none';
        dateFields.style.display = 'block';
    }
}

// Leere Regel-Formular
function clearRuleForm() {
    document.getElementById('ruleType').value = 'weekly';
    toggleRuleFields();
    
    // Leere alle Checkboxen
    for (let i = 0; i < 7; i++) {
        const checkbox = document.getElementById(`day${i}`);
        if (checkbox) checkbox.checked = false;
    }
    
    // Leere Datums-Felder
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    // Setze Standard-Zeiten
    document.getElementById('startTime').value = '00:00';
    document.getElementById('endTime').value = '23:59';
    
    // Setze Standard-Karte
    document.getElementById('ruleCard').value = 'cycle';
}

// Socket.IO Event-Listener für Schedule
socket.on('scheduleConfigChanged', (data) => {
    console.log('Schedule-Konfiguration geändert:', data);
    scheduleConfig = data;
    if (currentLocation === 'schedule-1' && currentScheduleTab === 1) {
        displayRulesList();
        updateScheduleStatus(); // Aktualisiere Status bei Konfigurationsänderungen
    }
});

socket.on('schedule2ConfigChanged', (data) => {
    console.log('Schedule-2-Konfiguration geändert:', data);
    schedule2Config = data;
    if (currentLocation === 'schedule-1' && currentScheduleTab === 2) {
        displayRulesList2();
        updateSchedule2Status(); // Aktualisiere Status bei Konfigurationsänderungen
    }
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    stopScheduleStatusUpdates();
    stopSchedule2StatusUpdates();
});

// === Schedule-2 Management ===

// Aktualisiere Schedule-2-Status im Admin-Panel
async function updateSchedule2Status() {
    if (currentLocation !== 'schedule-1' || currentScheduleTab !== 2) return;
    
    try {
        const response = await fetch('/api/schedule-2-config/current');
        const data = await response.json();
        
        // Aktualisiere aktuelle Karte
        const currentCardElement = document.getElementById('currentSchedule2Card');
        if (currentCardElement) {
            currentCardElement.textContent = data.currentCard || 'Unbekannt';
        }
        
        // Aktualisiere letzte Aktualisierung
        const lastUpdateElement = document.getElementById('schedule2LastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Aktualisiere nächste Prüfung
        const nextCheckElement = document.getElementById('nextSchedule2Check');
        if (nextCheckElement) {
            const now = new Date();
            const nextCheck = new Date(now.getTime() + 60000); // +1 Minute
            nextCheckElement.textContent = nextCheck.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Schedule-2-Status:', error);
    }
}

// Starte periodische Status-Updates für Schedule-2
function startSchedule2StatusUpdates() {
    if (schedule2StatusInterval) {
        clearInterval(schedule2StatusInterval);
    }
    
    // Sofortige erste Aktualisierung
    updateSchedule2Status();
    
    // Dann alle 30 Sekunden
    schedule2StatusInterval = setInterval(updateSchedule2Status, 30000);
    console.log('Schedule-2-Status-Updates gestartet (30s Intervall)');
}

// Stoppe periodische Status-Updates für Schedule-2
function stopSchedule2StatusUpdates() {
    if (schedule2StatusInterval) {
        clearInterval(schedule2StatusInterval);
        schedule2StatusInterval = null;
        console.log('Schedule-2-Status-Updates gestoppt');
    }
}

// Zeige Regeln-Liste für Schedule-2 an
function displayRulesList2() {
    const rulesList = document.getElementById('rulesList2');
    if (!rulesList) return;

    if (schedule2Config.rules.length === 0) {
        rulesList.innerHTML = `
            <div class="text-center text-light">
                <i class="bi bi-calendar-x" style="font-size: 2rem; color: #6c757d;"></i>
                <p class="mt-2 text-white">Keine Regeln definiert</p>
                <button class="btn btn-success" onclick="showAddRuleModal2()">
                    <i class="bi bi-plus-circle"></i> Erste Regel hinzufügen
                </button>
            </div>
        `;
        return;
    }

    let html = '<div class="row">';
    
    schedule2Config.rules.forEach((rule, index) => {
        const ruleType = rule.type === 'weekly' ? 'Wöchentlich' : 'Datum';
        const ruleDescription = getRuleDescription(rule);
        const ruleColor = rule.type === 'weekly' ? 'primary' : 'success';
        
        // Prüfe ob es ein Preset ist
        const isPreset = rule.card.startsWith('preset:');
        const cardDisplay = isPreset 
            ? `<i class="bi bi-bookmark text-info"></i> Preset: ${rule.card.replace('preset:', '')}`
            : rule.card;
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card border-${ruleColor}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="card-title text-white">
                                    <span class="badge bg-${ruleColor}">${ruleType}</span>
                                    ${cardDisplay}
                                </h6>
                                <p class="card-text small text-light">${ruleDescription}</p>
                                <small class="text-light">Zeit: ${rule.startTime} - ${rule.endTime}</small>
                            </div>
                            <div class="btn-group-vertical btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="editRule2('${rule.id}')" title="Bearbeiten">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteRule2('${rule.id}')" title="Löschen">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    rulesList.innerHTML = html;
}

// Zeige Add Rule Modal für Schedule-2
async function showAddRuleModal2() {
    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Neue Schedule-2-Regel';
    document.getElementById('ruleId').value = '';
    document.getElementById('ruleScheduleNumber').value = '2'; // Markiere als Schedule-2
    clearRuleForm();
    
    // Lade Presets und füge sie zum Select hinzu
    await populateRuleCardSelect();
    
    modal.show();
}

// Bearbeite Regel für Schedule-2
async function editRule2(ruleId) {
    const rule = schedule2Config.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Schedule-2-Regel bearbeiten';
    document.getElementById('ruleId').value = ruleId;
    document.getElementById('ruleScheduleNumber').value = '2'; // Markiere als Schedule-2
    
    // Lade Presets und füge sie zum Select hinzu
    await populateRuleCardSelect();
    
    // Fülle Formular
    document.getElementById('ruleType').value = rule.type;
    toggleRuleFields();
    
    if (rule.type === 'weekly') {
        rule.days.forEach(day => {
            const checkbox = document.getElementById(`day${day}`);
            if (checkbox) checkbox.checked = true;
        });
    } else if (rule.type === 'date') {
        document.getElementById('startDate').value = rule.startDate;
        document.getElementById('endDate').value = rule.endDate || '';
    }
    
    document.getElementById('startTime').value = rule.startTime;
    document.getElementById('endTime').value = rule.endTime;
    document.getElementById('ruleCard').value = rule.card;
    
    modal.show();
}

// Lösche Regel für Schedule-2
async function deleteRule2(ruleId) {
    if (!confirm('Möchten Sie diese Regel wirklich löschen?')) return;

    try {
        const updatedRules = schedule2Config.rules.filter(r => r.id !== ruleId);
        await saveSchedule2Config({ ...schedule2Config, rules: updatedRules });
        showNotification('Regel gelöscht', 'success');
        displayRulesList2();
    } catch (error) {
        console.error('Fehler beim Löschen der Regel:', error);
        showNotification('Fehler beim Löschen der Regel', 'error');
    }
}

// Speichere Schedule-2-Konfiguration
async function saveSchedule2Config(config) {
    try {
        const response = await fetch('/api/schedule-2-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }

        schedule2Config = config;
        return await response.json();
        
    } catch (error) {
        console.error('Fehler beim Speichern der Schedule-2-Konfiguration:', error);
        throw error;
    }
}

// Speichere Default-Karte für Schedule-2
async function saveDefaultCard2() {
    const defaultCard = document.getElementById('defaultCardSelect2').value;
    
    try {
        await saveSchedule2Config({ ...schedule2Config, defaultCard });
        showNotification('Standard-Karte gespeichert', 'success');
    } catch (error) {
        console.error('Fehler beim Speichern der Standard-Karte:', error);
        showNotification('Fehler beim Speichern der Standard-Karte', 'error');
    }
}

// Force Schedule-2 Reload
async function forceSchedule2Reload() {
    try {
        socket.emit('forceSchedule2Reload');
        showNotification('Schedule-2 wird neu gestartet', 'info');
    } catch (error) {
        console.error('Fehler beim Schedule-2 Reload:', error);
        showNotification('Fehler beim Schedule-2 Reload', 'error');
    }
}

// === Preset-Verwaltung ===

// Lade Presets beim Wechsel zum Settings Tab
function loadPresetsIfSettings() {
    if (currentLocation === 'settings') {
        const presetLocation = document.getElementById('presetLocation');
        if (presetLocation) {
            loadPresets(presetLocation.value);
        }
    }
}

// Event-Listener für Preset-Location-Wechsel
document.addEventListener('DOMContentLoaded', function() {
    const presetLocation = document.getElementById('presetLocation');
    if (presetLocation) {
        presetLocation.addEventListener('change', function() {
            loadPresets(this.value);
        });
        
        // Initial lade Presets für die erste Location
        loadPresets(presetLocation.value);
    }
});

// Preset speichern
async function savePreset() {
    const location = document.getElementById('presetLocation').value;
    const name = document.getElementById('presetName').value.trim();
    
    // Validierung
    if (!name || name.length === 0) {
        showNotification('Bitte gib einen Preset-Namen ein', 'error');
        return;
    }
    
    // Validierung im Frontend (keine ungültigen Zeichen)
    const sanitizedName = sanitizePresetName(name);
    if (sanitizedName.length === 0) {
        showNotification('Der Preset-Name enthält keine gültigen Zeichen', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/presets/${location}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Preset erfolgreich gespeichert', 'success');
            
            // Leere Preset-Name Feld
            document.getElementById('presetName').value = '';
            
            // Aktualisiere Preset-Liste
            loadPresets(location);
        } else {
            showNotification(data.error || 'Fehler beim Speichern des Presets', 'error');
        }
    } catch (error) {
        console.error('Fehler beim Speichern des Presets:', error);
        showNotification('Fehler beim Speichern des Presets: ' + error.message, 'error');
    }
}

// Lade Preset-Liste
async function loadPresets(location) {
    const presetsList = document.getElementById('presetsList');
    if (!presetsList) return;
    
    // Zeige Loading-Spinner
    presetsList.innerHTML = `
        <div class="text-center">
            <div class="spinner-border spinner-border-sm text-primary" role="status">
                <span class="visually-hidden">Lade...</span>
            </div>
            <p class="mt-2" style="color: #e0e0e0;">Lade Presets...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/presets/${location}`);
        
        if (!response.ok) {
            throw new Error('Fehler beim Laden der Presets');
        }
        
        const presets = await response.json();
        displayPresetsList(presets, location);
    } catch (error) {
        console.error('Fehler beim Laden der Presets:', error);
        presetsList.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Fehler beim Laden der Presets: ${error.message}
            </div>
        `;
    }
}

// Zeige Preset-Liste an
function displayPresetsList(presets, location) {
    const presetsList = document.getElementById('presetsList');
    if (!presetsList) return;
    
    if (!presets || presets.length === 0) {
        presetsList.innerHTML = `
            <div class="text-center">
                <p class="mt-2" style="color: #e0e0e0;">Keine Presets gespeichert</p>
                <small style="color: #999;">Speichere ein Preset, um es hier zu sehen</small>
            </div>
        `;
        return;
    }
    
    let html = '<div class="list-group">';
    
    presets.forEach(preset => {
        const createdDate = new Date(preset.created);
        const formattedDate = createdDate.toLocaleString('de-DE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        html += `
            <div class="list-group-item bg-dark border-secondary mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="flex-grow-1">
                        <h6 class="mb-1" style="color: #fff;">${preset.name}</h6>
                        <small class="text-muted">Erstellt: ${formattedDate}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-danger" onclick="removePreset('${location}', '${preset.filename}')">
                            <i class="bi bi-trash"></i> Löschen
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    presetsList.innerHTML = html;
}

// Preset löschen
async function removePreset(location, filename) {
    // Bestätigungs-Dialog
    if (!confirm(`Möchtest du das Preset "${filename}" wirklich löschen?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/presets/${location}/${filename}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification(data.message || 'Preset erfolgreich gelöscht', 'success');
            
            // Aktualisiere Preset-Liste
            loadPresets(location);
        } else {
            showNotification(data.error || 'Fehler beim Löschen des Presets', 'error');
        }
    } catch (error) {
        console.error('Fehler beim Löschen des Presets:', error);
        showNotification('Fehler beim Löschen des Presets: ' + error.message, 'error');
    }
}

// Validierung des Preset-Namens im Frontend
function sanitizePresetName(name) {
    // Ersetze ungültige Zeichen durch Bindestrich
    return name
        .trim()
        .replace(/[^a-zA-Z0-9äöüÄÖÜß\-_ ]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

// Lade Presets und füge sie zum ruleCard Select hinzu
async function populateRuleCardSelect() {
    const ruleCardSelect = document.getElementById('ruleCard');
    if (!ruleCardSelect) return;
    
    // Speichere aktuelle Auswahl
    const currentValue = ruleCardSelect.value;
    
    // Entferne alle Preset-Optionen (dynamisch hinzugefügte)
    const existingOptions = Array.from(ruleCardSelect.options);
    existingOptions.forEach(option => {
        if (option.value.startsWith('preset:')) {
            option.remove();
        }
    });
    
    // Lade Presets für beide Locations
    try {
        const [hauptthekePresets, thekeHintenPresets] = await Promise.all([
            fetch('/api/presets/haupttheke').then(r => r.ok ? r.json() : []).catch(() => []),
            fetch('/api/presets/theke-hinten').then(r => r.ok ? r.json() : []).catch(() => [])
        ]);
        
        // Füge Optgroup für Presets hinzu
        if (hauptthekePresets.length > 0 || thekeHintenPresets.length > 0) {
            // Füge Separator hinzu
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '─────────── Presets ───────────';
            ruleCardSelect.appendChild(separator);
            
            // Füge Haupttheke Presets hinzu
            if (hauptthekePresets.length > 0) {
                hauptthekePresets.forEach(preset => {
                    const option = document.createElement('option');
                    option.value = `preset:${preset.filename}`;
                    option.textContent = `📌 Haupttheke: ${preset.name}`;
                    ruleCardSelect.appendChild(option);
                });
            }
            
            // Füge Theke-Hinten Presets hinzu
            if (thekeHintenPresets.length > 0) {
                thekeHintenPresets.forEach(preset => {
                    const option = document.createElement('option');
                    option.value = `preset:${preset.filename}`;
                    option.textContent = `📌 Theke Hinten: ${preset.name}`;
                    ruleCardSelect.appendChild(option);
                });
            }
        }
        
        // Stelle vorherige Auswahl wieder her
        if (currentValue) {
            ruleCardSelect.value = currentValue;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Presets für Regel-Editor:', error);
    }
}

