// Funken-Animation
const canvas = document.getElementById('sparklesCanvas');
const ctx = canvas.getContext('2d');

// Setze Canvas-Größe
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Funken-Klasse
class Sparkle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wenn der Funke den Bildschirm verlässt, setze ihn zurück
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.reset();
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(165, 7, 117, ${this.opacity})`;
        ctx.fill();
    }
}

// Erstelle Funken
const sparkles = Array.from({ length: 50 }, () => new Sparkle());

// Animations-Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    sparkles.forEach(sparkle => {
        sparkle.update();
        sparkle.draw();
    });

    requestAnimationFrame(animate);
}
animate();

const socket = io();
const menuContent = document.getElementById('menuContent');

console.log('=== Speisekarte Initialisierung Start ===');
console.log('Socket.IO Status:', socket.connected ? 'Verbunden' : 'Nicht verbunden');
console.log('MenuContent Element gefunden:', !!menuContent);

// Socket.IO Verbindung und Event-Handler
socket.on('connect', () => {
    console.log('=== Socket.IO Verbindung hergestellt ===');
    console.log('Socket ID:', socket.id);
    console.log('Verbindungsstatus:', socket.connected);
    
    // Initialer Ladevorgang nach erfolgreicher Verbindung
    console.log('Starte initialen Ladevorgang...');
    fetchDishes();
});

socket.on('disconnect', () => {
    console.log('=== Socket.IO Verbindung getrennt ===');
    console.log('Socket ID:', socket.id);
    console.log('Verbindungsstatus:', socket.connected);
});

socket.on('dishesChanged', (data) => {
    console.log('=== Gerichte wurden geändert ===');
    console.log('Event-Daten:', data);
    console.log('Socket ID:', socket.id);
    console.log('Verbindungsstatus:', socket.connected);
    
    // Prüfe, ob die Änderung für die Speisekarte ist
    if (data && data.location === 'speisekarte') {
        console.log('Änderung betrifft die Speisekarte, starte Neuladen...');
        fetchDishes();
    } else {
        console.log('Änderung betrifft nicht die Speisekarte, ignoriere...');
    }
});

// Funktion zum Laden der Speisekarte
async function fetchDishes() {
    try {
        console.log('=== Speisekarte Laden Start ===');
        console.log('Socket.IO Status:', socket.connected ? 'Verbunden' : 'Nicht verbunden');
        
        console.log('Sende API-Request an /api/dishes...');
        const response = await fetch('/api/dishes');
        
        console.log('API-Response Status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const dishes = await response.json();
        console.log('API-Response Daten:', {
            anzahl: dishes.length,
            ersteGerichte: dishes.slice(0, 3)
        });
        
        // Zeige die Gerichte an
        console.log('Starte Anzeige der Gerichte...');
        displayDishes(dishes);
        
        console.log('=== Speisekarte Laden Ende ===');
    } catch (error) {
        console.error('=== Fehler beim Laden der Speisekarte ===');
        console.error('Fehlerdetails:', error);
        console.error('Stack Trace:', error.stack);
        
        // Zeige Fehlermeldung in der UI
        menuContent.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Fehler beim Laden der Speisekarte. Bitte versuchen Sie es später erneut.
            </div>
        `;
    }
}

// Funktion zum Anzeigen der Gerichte
function displayDishes(dishes) {
    console.log('=== Gerichte Anzeigen Start ===');
    console.log('Eingangsparameter:', {
        anzahl: dishes?.length,
        typ: typeof dishes
    });
    
    menuContent.innerHTML = '';
    
    if (!dishes || dishes.length === 0) {
        console.log('Keine Gerichte verfügbar');
        menuContent.innerHTML = `
            <div class="alert alert-info" role="alert">
                Keine Gerichte verfügbar.
            </div>
        `;
        return;
    }
    
    // Sortiere Gerichte nach sort_order und name
    console.log('Sortiere Gerichte...');
    dishes.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Zeige nur aktive Gerichte an
    const activeDishes = dishes.filter(dish => dish.is_active);
    console.log('Aktive Gerichte:', {
        gesamt: dishes.length,
        aktiv: activeDishes.length,
        inaktiv: dishes.length - activeDishes.length
    });
    
    if (activeDishes.length === 0) {
        console.log('Keine aktiven Gerichte gefunden');
        menuContent.innerHTML = `
            <div class="alert alert-info" role="alert">
                Aktuell sind keine Gerichte verfügbar.
            </div>
        `;
        return;
    }
    
    console.log('Erstelle Gerichtskarten...');
    activeDishes.forEach((dish, index) => {
        console.log(`Verarbeite Gericht ${index + 1}/${activeDishes.length}:`, {
            id: dish.id,
            name: dish.name,
            preis: dish.price,
            aktiv: dish.is_active
        });
        const dishCard = createDishCard(dish);
        menuContent.appendChild(dishCard);
    });
    
    console.log('=== Gerichte Anzeigen Ende ===');
}

// Funktion zum Erstellen einer Gerichtskarte
function createDishCard(dish) {
    console.log('Erstelle Karte für Gericht:', {
        id: dish.id,
        name: dish.name,
        hatBild: !!dish.image_path
    });
    
    const card = document.createElement('div');
    card.className = 'dish-card';
    
    let imageHtml = '';
    if (dish.image_path) {
        imageHtml = `<img src="${dish.image_path}" alt="${dish.name}" class="dish-image" loading="lazy">`;
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

console.log('=== Speisekarte Initialisierung Ende ==='); 