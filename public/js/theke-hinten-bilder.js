// Bilder-Slideshow für theke-hinten-bilder.html

const additionalContent = document.querySelector('.additional-content');

async function fetchAndDisplayImages() {
    try {
        const response = await fetch('/api/images');
        const images = await response.json();
        if (!Array.isArray(images) || images.length === 0) {
            additionalContent.innerHTML = '<div class="text-center text-muted">Keine Bilder vorhanden</div>';
            return;
        }
        startImageStack(images);
    } catch (err) {
        additionalContent.innerHTML = '<div class="text-center text-danger">Fehler beim Laden der Bilder</div>';
    }
}

let imageStackInterval;
function startImageStack(images) {
    if (imageStackInterval) clearInterval(imageStackInterval);
    let stack = [];
    const maxStack = 3;
    let currentIndex = 0;
    const possibleRotations = [-8, 4, 0, -5, 7, 2, -3, 5];

    function getRandomRotation() {
        // Zufälligen Wert aus der Liste nehmen
        return possibleRotations[Math.floor(Math.random() * possibleRotations.length)];
    }

    function showStack() {
        additionalContent.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'bilder-stack-container position-relative d-flex justify-content-center align-items-center';
        stack.forEach((stackItem, i) => {
            const img = document.createElement('img');
            img.src = stackItem.url;
            img.alt = stackItem.filename;
            img.className = 'bilder-stack-img';
            img.style.position = 'absolute';
            img.style.left = '50%';
            img.style.top = '50%';
            img.style.transform = `translate(-50%, -50%) rotate(${stackItem.rotation}deg)`;
            img.style.objectFit = 'cover';
            img.style.boxShadow = '0 4px 16px rgba(0,0,0,0.13)';
            img.style.borderRadius = '16px';
            img.style.opacity = '1';
            img.style.zIndex = i + 1;
            img.style.transition = 'all 0.7s cubic-bezier(.4,0,.2,1)';
            // Standard: Landscape-Größe setzen
            img.style.width = '520px';
            img.style.maxWidth = '100vw';
            img.style.maxHeight = '85vh';
            // Dynamische Größe je nach Format nach dem Laden
            const tempImage = new window.Image();
            tempImage.onload = function() {
                if (tempImage.width > tempImage.height) {
                    // Landscape: bleibt wie gesetzt
                } else {
                    // Portrait oder quadratisch: kleiner anzeigen
                    img.style.width = '340px';
                    img.style.maxWidth = '90vw';
                    img.style.maxHeight = '60vh';
                }
            };
            tempImage.src = stackItem.url;
            container.appendChild(img);
        });
        additionalContent.appendChild(container);
    }

    // Start: Stapel ist leer, dann wächst er bis maxStack
    stack = [];
    showStack();

    imageStackInterval = setInterval(() => {
        // Neues Bild oben auf den Stapel
        const nextImage = images[currentIndex];
        stack.push({ ...nextImage, rotation: getRandomRotation() });
        if (stack.length > maxStack) stack.shift();
        showStack();
        currentIndex = (currentIndex + 1) % images.length;
    }, 6000); // 6 Sekunden

    // Initiales Befüllen: Stapel wächst von 0 auf maxStack
    let initialFill = 0;
    function initialStackGrow() {
        if (initialFill < Math.min(images.length, maxStack)) {
            const nextImage = images[initialFill];
            stack.push({ ...nextImage, rotation: getRandomRotation() });
            showStack();
            initialFill++;
            setTimeout(initialStackGrow, 1200); // 1,2 Sekunden
        } else if (images.length > maxStack) {
            imageStackInterval = setInterval(() => {
                const nextImage = images[currentIndex];
                stack.push({ ...nextImage, rotation: getRandomRotation() });
                if (stack.length > maxStack) stack.shift();
                showStack();
                currentIndex = (currentIndex + 1) % images.length;
            }, 6000); // 6 Sekunden
        }
    }
    if (images.length > 0) {
        initialStackGrow();
    }
}

// CSS für Stapel-Effekt dynamisch einfügen
(function addBilderStackStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .bilder-stack-container {
            width: 370px;
            height: 260px;
            max-width: 95vw;
            max-height: 65vh;
        }
        .bilder-stack-img {
            box-shadow: 0 4px 16px rgba(0,0,0,0.13);
            border-radius: 16px;
            background: #fff;
            transition: all 0.7s cubic-bezier(.4,0,.2,1);
        }
    `;
    document.head.appendChild(style);
})();

// Initial laden
if (additionalContent) {
    // Entferne eventuell initial eingefügte Werbung
    additionalContent.innerHTML = '';
    fetchAndDisplayImages();
    setInterval(fetchAndDisplayImages, 60000);
} 