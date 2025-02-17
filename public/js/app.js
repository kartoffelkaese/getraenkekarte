const socket = io();
const drinksList = document.getElementById('drinksList');

// Lade die Getränke beim Start
fetchDrinks();

// Lade die Werbungen beim Start
fetchAds();

// Socket.io Events
socket.on('drinkStatusChanged', () => {
    fetchDrinks();
});

socket.on('categoryPricesChanged', () => {
    fetchDrinks();
});

socket.on('drinkPriceChanged', () => {
    fetchDrinks();
});

socket.on('categoryVisibilityChanged', () => {
    fetchDrinks();
});

socket.on('categorySortChanged', () => {
    fetchDrinks();
});

socket.on('categoryColumnBreakChanged', () => {
    fetchDrinks();
});

// Socket.io Events für Werbungen
socket.on('adsChanged', () => {
    fetchAds();
});

// Funktion zum Laden der Getränke
async function fetchDrinks() {
    try {
        const response = await fetch('/api/drinks');
        const drinks = await response.json();
        displayDrinks(drinks);
    } catch (error) {
        console.error('Fehler beim Laden der Getränke:', error);
    }
}

// Funktion zum Anzeigen der Getränke
function displayDrinks(drinks) {
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
    
    // Berechne die optimale Verteilung der Kategorien
    const totalCategories = sortedCategories.length;
    const categoriesPerColumn = Math.ceil(totalCategories / 3);
    
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
        categoryHeader.innerHTML = `<h2 class="border-bottom pb-2">${categoryName}</h2>`;
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
                priceHtml = `<span class="float-end">${preis.toFixed(2)} €</span>`;
            }

            drinkElement.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title d-flex justify-content-between mb-0">
                            ${drink.name}
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
}

// Funktion zum Laden der Werbungen
async function fetchAds() {
    try {
        const response = await fetch('/api/ads');
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
    setInterval(showNextAd, 6000);
} 