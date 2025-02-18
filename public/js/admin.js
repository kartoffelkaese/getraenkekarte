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

socket.on('adsChanged', ({ location }) => {
    if (location === currentLocation) {
        fetchAds();
    }
});

socket.on('logoChanged', ({ location }) => {
    if (location === currentLocation) {
        fetchLogo();
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
        
        if (visibilitySwitch) {
            visibilitySwitch.checked = logoSettings.is_active;
        }
        
        if (orderInput) {
            orderInput.value = logoSettings.sort_order || 0;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Logo-Einstellungen:', error);
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

// Funktion zum Anzeigen der Getränke
function displayDrinks(drinks) {
    drinksTableBody.innerHTML = '';
    drinks.forEach(drink => {
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
        `;
        drinksTableBody.appendChild(row);
    });
}

// Funktion zum Anzeigen der Werbungen
function displayAds(ads) {
    const adsTableBody = document.getElementById('adsTableBody');
    adsTableBody.innerHTML = '';
    
    ads.forEach(ad => {
        const row = document.createElement('tr');
        const preis = parseFloat(ad.price) || 0;
        row.innerHTML = `
            <td>${ad.name}</td>
            <td><img src="${ad.image_path}" alt="${ad.name}" style="height: 50px;"></td>
            <td>${preis.toFixed(2)} €</td>
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
        `;
        adsTableBody.appendChild(row);
    });
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