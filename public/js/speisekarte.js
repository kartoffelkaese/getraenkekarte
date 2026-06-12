// Funken-Animation
const DEBUG = new URLSearchParams(window.location.search).has('debug');
function debugLog(...args) {
    if (DEBUG) console.log(...args);
}

const canvas = document.getElementById('sparklesCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

const sparkles = Array.from({ length: 50 }, () => new Sparkle());

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    sparkles.forEach((sparkle) => {
        sparkle.update();
        sparkle.draw();
    });
    requestAnimationFrame(animate);
}
animate();

const socket = io();
const menuContent = document.getElementById('menuContent');

socket.on('connect', () => {
    debugLog('Speisekarte: Socket verbunden');
    fetchDishes();
});

socket.on('dishesChanged', (data) => {
    if (data && data.location === 'speisekarte') {
        fetchDishes();
    }
});

async function fetchDishes() {
    try {
        const response = await fetch('/api/dishes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const dishes = await response.json();
        displayDishes(dishes);
    } catch (error) {
        console.error('Fehler beim Laden der Speisekarte:', error);
        menuContent.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Fehler beim Laden der Speisekarte. Bitte versuchen Sie es später erneut.
            </div>
        `;
    }
}

function displayDishes(dishes) {
    menuContent.innerHTML = '';

    if (!dishes || dishes.length === 0) {
        menuContent.innerHTML = `
            <div class="alert alert-info" role="alert">
                Keine Gerichte verfügbar.
            </div>
        `;
        return;
    }

    dishes.sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
            return a.sort_order - b.sort_order;
        }
        return a.name.localeCompare(b.name);
    });

    const activeDishes = dishes.filter((dish) => dish.is_active);

    if (activeDishes.length === 0) {
        menuContent.innerHTML = `
            <div class="alert alert-info" role="alert">
                Aktuell sind keine Gerichte verfügbar.
            </div>
        `;
        return;
    }

    activeDishes.forEach((dish) => {
        menuContent.appendChild(createDishCard(dish));
    });
}

function createDishCard(dish) {
    const card = document.createElement('div');
    card.className = 'dish-card';

    let imageHtml = '';
    if (dish.image_path) {
        imageHtml = `<img src="${safeAssetUrl(dish.image_path)}" alt="${escapeAttr(dish.name)}" class="dish-image" loading="lazy">`;
    }

    const price = formatPrice(dish.price);

    card.innerHTML = `
        ${imageHtml}
        <div class="dish-content">
            <h3 class="dish-title">${escapeHtml(dish.name)}</h3>
            ${dish.description ? `<p class="dish-description">${escapeHtml(dish.description)}</p>` : ''}
            <div class="dish-price">${price} €</div>
        </div>
    `;

    return card;
}
