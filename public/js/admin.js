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
    const locations = ['haupttheke', 'theke-hinten', 'theke-hinten-bilder', 'jugendliche', 'speisekarte', 'bilder'];
    
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