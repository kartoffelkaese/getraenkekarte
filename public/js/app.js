const socket = io();
const drinksList = document.getElementById('drinksList');
const currentLocation = document.body.dataset.location;

// Lade die Daten beim Start
fetchDrinks();
fetchAds();
fetchLogo();
loadAdditives();

// Lade die Werbungen beim Start
fetchAds();

// Socket.io Events
socket.on('drinkStatusChanged', (data) => {
    if (data.location === currentLocation) {
        fetchDrinks();
    }
});

socket.on('categoryPricesChanged', (data) => {
    if (data.location === currentLocation) {
        fetchDrinks();
    }
});

socket.on('drinkPriceChanged', (data) => {
    if (data.location === currentLocation) {
        fetchDrinks();
    }
});

socket.on('categoryVisibilityChanged', (data) => {
    if (data.location === currentLocation) {
        fetchDrinks();
    }
});

socket.on('categorySortChanged', (data) => {
    if (data.location === currentLocation) {
        fetchDrinks();
    }
});

socket.on('categoryColumnBreakChanged', (data) => {
    if (data.location === currentLocation) {
        fetchDrinks();
    }
});

// Socket.io Events für Werbungen
socket.on('adsChanged', (data) => {
    if (data.location === currentLocation) {
        fetchAds();
    }
});

socket.on('logoChanged', (data) => {
    if (data.location === currentLocation) {
        fetchLogo();
    }
});

// Funktion zum Laden der Zusatzstoffe
async function loadAdditives() {
    try {
        const response = await fetch('/api/additives-list');
        const additives = await response.json();
        
        const additivesContent = document.querySelector('.additives-content');
        if (additivesContent) {
            additivesContent.innerHTML = `
                <small>
                    ${additives.map(a => `${a.code}) ${a.name}`).join(' • ')}
                </small>
            `;
        }
    } catch (error) {
        console.error('Fehler beim Laden der Zusatzstoffe:', error);
    }
}

// Socket.io Events für Zusatzstoffe
socket.on('additivesChanged', () => {
    loadAdditives();
});

// Funktion zum Laden der Getränke
async function fetchDrinks() {
    try {
        const response = await fetch(`/api/drinks/${currentLocation}`);
        const drinks = await response.json();
        displayDrinks(drinks);
    } catch (error) {
        console.error('Fehler beim Laden der Getränke:', error);
    }
}

// Funktion zum Anzeigen der Getränke
function displayDrinks(drinks) {
    const isHaupttheke = currentLocation === 'haupttheke';
    
    if (isHaupttheke) {
        // Für Haupttheke: Verwende existierende Spalten
        const columns = [
            document.querySelector('.left-column'),
            document.querySelector('.middle-column'),
            document.querySelector('.right-column')
        ];
        
        // Leere die Spalten (außer additional-content)
        columns.forEach(column => {
            const additionalContent = column.querySelector('.additional-content');
            column.innerHTML = '';
            if (additionalContent) {
                column.appendChild(additionalContent);
            }
        });
    } else {
        // Für Theke-Hinten: Erstelle neue Spalten
        const drinksList = document.getElementById('drinksList');
        drinksList.innerHTML = '';
        
        // Container für die Getränke
        const drinksContainer = document.createElement('div');
        drinksContainer.className = 'drinks-container';
        drinksList.appendChild(drinksContainer);

        // Container für die Spalten
        const rowContainer = document.createElement('div');
        rowContainer.className = 'drinks-row';
        drinksContainer.appendChild(rowContainer);

        // Erstelle die drei Spalten
        const columns = [
            document.createElement('div'),
            document.createElement('div'),
            document.createElement('div')
        ];
        columns.forEach((col, index) => {
            col.className = 'category-column';
            if (index === 1) {
                col.classList.add('middle-column');
            }
            rowContainer.appendChild(col);
        });
    }
    
    // Gemeinsame Logik für beide Layouts
    const columns = isHaupttheke ? [
        document.querySelector('.left-column'),
        document.querySelector('.middle-column'),
        document.querySelector('.right-column')
    ] : document.querySelectorAll('.category-column');
    
    // Gruppiere Getränke nach Kategorien
    const drinksByCategory = {};
    const categoryOrder = new Map();
    
    drinks.forEach(drink => {
        if (drink.is_active && drink.category_is_visible) {
            const categoryName = drink.category_name || 'Sonstige';
            if (!drinksByCategory[categoryName]) {
                drinksByCategory[categoryName] = [];
                categoryOrder.set(categoryName, drink.category_sort_order || 999999);
            }
            drinksByCategory[categoryName].push(drink);
        }
    });

    // Sortiere Kategorien nach sort_order
    const sortedCategories = Object.keys(drinksByCategory).sort((a, b) => {
        const orderA = categoryOrder.get(a) || 999999;
        const orderB = categoryOrder.get(b) || 999999;
        if (orderA === orderB) {
            return a.localeCompare(b);
        }
        return orderA - orderB;
    });
    
    let currentColumn = 0;
    
    // Verteile Kategorien auf die Spalten
    sortedCategories.forEach((categoryName, index) => {
        const categoryData = drinks.find(d => d.category_name === categoryName);
        
        // Prüfe, ob die vorherige Kategorie einen Spaltenumbruch erzwingt
        if (index > 0) {
            const prevCategoryData = drinks.find(d => d.category_name === sortedCategories[index - 1]);
            if (prevCategoryData && prevCategoryData.category_force_column_break) {
                currentColumn++;
            }
        }
        
        // Wenn wir die maximale Anzahl an Spalten erreicht haben, bleiben wir in der letzten Spalte
        if (currentColumn >= 3) {
            currentColumn = 2;
        }
        
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-container';

        // Kategorie-Überschrift
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        const categoryH2 = document.createElement('h2');
        categoryH2.className = 'border-bottom pb-2';
        categoryH2.textContent = categoryName;
        categoryH2.dataset.sortOrder = categoryData.category_sort_order || '999999';
        categoryHeader.appendChild(categoryH2);
        categoryContainer.appendChild(categoryHeader);

        // Container für die Getränke dieser Kategorie
        const drinksList = document.createElement('div');
        drinksList.className = 'drinks-list';
        categoryContainer.appendChild(drinksList);

        // Getränke der Kategorie
        drinksByCategory[categoryName].forEach(drink => {
            const drinkElement = document.createElement('div');
            drinkElement.setAttribute('data-drink-id', drink.id);
            const preis = parseFloat(drink.preis) || 0;
            
            let priceHtml = '';
            if (drink.category_show_prices && drink.show_price) {
                if (drink.has_small_size === 1) {
                    const smallPrice = parseFloat(drink.small_price) || 0;
                    priceHtml = `<span class="float-end">
                        ${preis.toFixed(2)} €
                        <small class="additives-info">(${drink.volume_normal})</small>
                        &nbsp;/&nbsp;
                        ${smallPrice.toFixed(2)} €
                        <small class="additives-info">(${drink.volume_small})</small>
                    </span>`;
                } else {
                    priceHtml = `<span class="float-end">
                        ${preis.toFixed(2)} €
                        ${drink.volume_normal ? `<small class="additives-info">(${drink.volume_normal})</small>` : ''}
                    </span>`;
                }
            }

            drinkElement.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title d-flex justify-content-between mb-0">
                            <span class="drink-name">
                                ${drink.name}
                                ${drink.additives ? `<small class="additives-info">(${drink.additives.split(', ').map(a => a.split(')')[0]).join(',')})</small>` : ''}
                            </span>
                            ${priceHtml}
                        </h5>
                    </div>
                </div>
            `;
            drinksList.appendChild(drinkElement);
        });

        // Füge die Kategorie zur entsprechenden Spalte hinzu
        columns[currentColumn].appendChild(categoryContainer);
    });

    // Lade das Logo neu, nachdem die Getränke aktualisiert wurden
    fetchLogo();
}

// Funktion zum Laden der Werbungen
async function fetchAds() {
    try {
        const response = await fetch(`/api/ads/${currentLocation}`);
        const ads = await response.json();
        displayAds(ads);
    } catch (error) {
        console.error('Fehler beim Laden der Werbungen:', error);
    }
}

// Funktion zum Anzeigen der Werbungen
function displayAds(ads) {
    const additionalContent = document.querySelector('.additional-content');
    additionalContent.innerHTML = '';
    
    // Filtere aktive Werbungen und sortiere sie nach sort_order
    const activeAds = ads
        .filter(ad => ad.is_active)
        .sort((a, b) => a.sort_order - b.sort_order);
    
    activeAds.forEach(ad => {
        const adElement = document.createElement('div');
        adElement.className = 'drink-ad';
        adElement.id = `ad-${ad.id}`;
        const preis = parseFloat(ad.price) || 0;
        adElement.innerHTML = `
            <img src="${ad.image_path}" alt="${ad.name}">
            <div class="drink-name">${ad.name}</div>
            <div class="drink-price">${preis.toFixed(2)} €</div>
        `;
        additionalContent.appendChild(adElement);
    });

    // Starte die Animation nur wenn es aktive Werbungen gibt
    if (activeAds.length > 0) {
        initAdRotation(activeAds);
    }
}

// Funktion für die Werberotation
function initAdRotation(ads) {
    let currentAdIndex = 0;

    function showNextAd() {
        // Alle Ads ausblenden
        document.querySelectorAll('.drink-ad').forEach(ad => {
            ad.classList.remove('active');
        });

        // Aktuelle Ad einblenden
        const currentAd = document.querySelector(`#ad-${ads[currentAdIndex].id}`);
        if (currentAd) {
            currentAd.classList.add('active');
        }

        // Index für nächste Ad vorbereiten
        currentAdIndex = (currentAdIndex + 1) % ads.length;
    }

    // Erste Ad sofort anzeigen
    showNextAd();

    // Ads alle 6 Sekunden wechseln
    setInterval(showNextAd, 6000); // Synchronisiert mit der 6s Float-Animation
}

// Funktion zum Laden der Logo-Einstellungen
async function fetchLogo() {
    try {
        const response = await fetch(`/api/logo/${currentLocation}`);
        const logoSettings = await response.json();
        displayLogo(logoSettings);
    } catch (error) {
        console.error('Fehler beim Laden der Logo-Einstellungen:', error);
    }
}

// Funktion zum Anzeigen des Logos
function displayLogo(settings) {
    const logoPath = '/images/logo.png';
    const columns = document.querySelectorAll('.category-column');
    
    // Entferne alte Logo-Container
    document.querySelectorAll('.logo-container').forEach(container => container.remove());
    
    if (!settings.is_active) return;
    
    const logoContainer = document.createElement('div');
    logoContainer.className = 'logo-container';
    logoContainer.innerHTML = `
        <img src="${logoPath}" alt="Logo" class="logo-image">
    `;
    
    // Füge das Logo an der richtigen Position ein
    let inserted = false;
    let currentColumn = 0;
    
    columns.forEach(column => {
        const categories = column.querySelectorAll('.category-container');
        categories.forEach(category => {
            // Finde die erste Kategorie, deren sort_order größer ist als die des Logos
            const categoryData = category.querySelector('h2');
            if (categoryData && !inserted && settings.sort_order <= parseInt(categoryData.dataset.sortOrder || '999999')) {
                column.insertBefore(logoContainer, category);
                inserted = true;
                
                // Wenn Spaltenumbruch aktiviert ist, erhöhe den Spaltenindex
                if (settings.force_column_break) {
                    currentColumn++;
                    // Verschiebe verbleibende Kategorien in die nächste Spalte
                    if (currentColumn < columns.length) {
                        const remainingCategories = Array.from(categories).slice(Array.from(categories).indexOf(category));
                        remainingCategories.forEach(cat => columns[currentColumn].appendChild(cat));
                    }
                }
            }
        });
        
        // Wenn das Logo noch nicht eingefügt wurde und dies die letzte Kategorie ist
        if (!inserted) {
            column.appendChild(logoContainer);
            // Wenn Spaltenumbruch aktiviert ist, beginne die nächste Spalte
            if (settings.force_column_break) {
                currentColumn++;
            }
        }
    });
} 