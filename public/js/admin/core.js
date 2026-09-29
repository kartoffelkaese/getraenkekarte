/* Admin – Grundgerüst: Socket, gemeinsamer Zustand, Navigation, Hilfsfunktionen, Benachrichtigungen, Live-Updates.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

const socket = io();

const drinksTableBody = document.getElementById('drinksTableBody');

const categoriesTableBody = document.getElementById('categoriesTableBody');

const locationInputs = document.querySelectorAll('input[name="location"]');

const speisekarteSection = document.getElementById('speisekarteSection');

let currentLocation = 'haupttheke';

let dishModal;

function setCheckboxSilently(element, checked) {
    if (!element) return;
    element.dataset.suppressChange = '1';
    element.checked = Boolean(checked);
    requestAnimationFrame(() => {
        delete element.dataset.suppressChange;
    });
}

function isCheckboxSuppressed(element) {
    return element?.dataset.suppressChange === '1';
}

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

function handleAdminNavigate(state) {
    if (!state || !window.AdminNav) return;

    currentLocation = AdminNav.getLegacyLocation();
    const { group, page, scheduleTab } = state;

    if (group === 'karten') {
        if (page === 'speisekarte') {
            fetchDishes();
        } else if (page === 'bilder') {
            fetchImages();
            loadImagesConfig();
        } else {
            const sub = state.sub || 'logo';
            switch (sub) {
                case 'kategorien':
                    fetchCategories();
                    break;
                case 'logo':
                    fetchLogo();
                    break;
                case 'werbung':
                    if (page !== 'jugendliche') {
                        fetchAds();
                    }
                    break;
                case 'getraenke':
                    fetchDrinks();
                    break;
                case 'zusatzstoffe':
                    fetchAdditives();
                    break;
            }
        }
    } else if (group === 'preise' && page === 'temp') {
        fetchTempPrices();
    } else if (group === 'anzeige' && page === 'schedule') {
        currentScheduleTab = scheduleTab;
        if (scheduleTab === 2) {
            loadSchedule2Config();
        } else {
            loadScheduleConfig();
        }
    } else if (group === 'anzeige' && page === 'cycle') {
        fetchCycleConfig();
    } else if (group === 'anzeige' && page === 'overview') {
        fetchOverviewConfig();
        if (window.AdminCards) {
            window.AdminCards.fetchCards().then((cards) => window.AdminCards.populateCardSelects(cards));
        }
    } else if (group === 'system' && page === 'status') {
        if (typeof loadHealthStatus === 'function') {
            loadHealthStatus();
        }
    } else if (group === 'system' && page === 'hochzeit') {
        loadHochzeitConfig();
    } else if (group === 'system' && page === 'links') {
        renderLinksTable();
    }
}

function applyResponsiveTableLabels(table) {
    if (!table) return;
    const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
    table.querySelectorAll('tbody tr').forEach((row) => {
        row.querySelectorAll('td').forEach((cell, index) => {
            if (headers[index]) {
                cell.setAttribute('data-label', headers[index]);
            }
        });
    });
}

function safeAssetUrl(url) {
    if (!url || typeof url !== 'string' || !url.startsWith('/') || url.includes('..')) {
        return '';
    }
    return escapeAttr(url);
}

function renderLinksTable() {
    if (window.AdminCards) {
        window.AdminCards.fetchCards().then((cards) => window.AdminCards.renderLinksTable(cards));
    }
}

function copyLinkToClipboard(url) {
    navigator.clipboard.writeText(url).then(() => {
        showNotification('Link in Zwischenablage kopiert', 'success');
    }).catch(() => {
        showNotification('Kopieren fehlgeschlagen', 'error');
    });
}

// Initialer Load
document.addEventListener('DOMContentLoaded', function() {
    if (window.AdminNav) {
        AdminNav.onNavigate(handleAdminNavigate);
        AdminNav.init();
    }

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
        setCheckboxSilently(document.querySelector(`#switch-${id}`), is_active);
    }
});

socket.on('drinkPriceChanged', ({ id, show_price, location }) => {
    if (location === currentLocation) {
        setCheckboxSilently(document.querySelector(`#price-switch-${id}`), show_price);
    }
});

socket.on('categoryPricesChanged', ({ id, show_prices, location }) => {
    if (location === currentLocation) {
        setCheckboxSilently(document.querySelector(`#category-price-switch-${id}`), show_prices);
    }
});

socket.on('categoryVisibilityChanged', ({ id, is_visible, location }) => {
    if (location === currentLocation) {
        setCheckboxSilently(document.querySelector(`#category-visibility-switch-${id}`), is_visible);
    }
});

socket.on('categorySortChanged', ({ location }) => {
    if (location === currentLocation) {
        fetchCategories();
    }
});

socket.on('categoryColumnBreakChanged', ({ id, force_column_break, location }) => {
    if (location === currentLocation) {
        setCheckboxSilently(document.querySelector(`#category-column-break-switch-${id}`), force_column_break);
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
