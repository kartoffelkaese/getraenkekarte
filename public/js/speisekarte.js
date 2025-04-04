const socket = io();
const menuContent = document.getElementById('menuContent');

// Funktion zum Laden der Speisekarte
async function loadMenu() {
    try {
        const response = await fetch('/api/dishes');
        const dishes = await response.json();
        
        // Zeige die Gerichte an
        displayDishes(dishes);
    } catch (error) {
        console.error('Fehler beim Laden der Speisekarte:', error);
    }
}

// Funktion zum Anzeigen der Gerichte
function displayDishes(dishes) {
    menuContent.innerHTML = '';
    
    // Sortiere Gerichte nach sort_order und name
    dishes.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Zeige nur aktive Gerichte an
    dishes.filter(dish => dish.is_active).forEach(dish => {
        const dishCard = createDishCard(dish);
        menuContent.appendChild(dishCard);
    });
}

// Funktion zum Erstellen einer Gerichtskarte
function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'dish-card';
    
    let imageHtml = '';
    if (dish.image_path) {
        imageHtml = `<img src="${dish.image_path}" alt="${dish.name}" class="dish-image">`;
    }
    
    // Formatiere den Preis
    const price = parseFloat(dish.price).toFixed(2);
    
    card.innerHTML = `
        ${imageHtml}
        <div class="dish-content">
            <h3 class="dish-title">${dish.name}</h3>
            ${dish.description ? `<p class="dish-description">${dish.description}</p>` : ''}
            <div class="dish-price">${price} €</div>
        </div>
    `;
    
    return card;
}

// Socket.io Event-Handler für Änderungen an der Speisekarte
socket.on('dishesChanged', () => {
    loadMenu();
});

// Initialer Load
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
}); 