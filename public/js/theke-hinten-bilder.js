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
    const maxStack = 4;
    let currentIndex = 0;
    const possibleRotations = [-8, 4, 0, -5, 7, 2, -3, 5];

    function getRandomRotation() {
        // Zufälligen Wert aus der Liste nehmen
        return possibleRotations[Math.floor(Math.random() * possibleRotations.length)];
    }

    // Hilfsfunktion: Lade alle Bildgrößen vorab
    function preloadImageSizes(images, callback) {
        let loaded = 0;
        const imagesWithSize = images.map(img => ({ ...img }));
        imagesWithSize.forEach((img, idx) => {
            const temp = new window.Image();
            temp.onload = function() {
                img._isLandscape = temp.width > temp.height;
                loaded++;
                if (loaded === imagesWithSize.length) {
                    callback(imagesWithSize);
                }
            };
            temp.onerror = function() {
                img._isLandscape = true; // Fallback: Landscape
                loaded++;
                if (loaded === imagesWithSize.length) {
                    callback(imagesWithSize);
                }
            };
            temp.src = img.url;
        });
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
            img.style.transition = 'none';
            // Größe direkt setzen
            if (stackItem._isLandscape) {
                img.style.width = '620px';
                img.style.maxWidth = '100vw';
                img.style.maxHeight = '95vh';
            } else {
                img.style.width = '420px';
                img.style.maxWidth = '98vw';
                img.style.maxHeight = '80vh';
            }
            container.appendChild(img);
        });
        additionalContent.appendChild(container);
    }

    // Nach dem Preload der Bildgrößen starten
    preloadImageSizes(images, function(imagesWithSize) {
        // Start: Stapel ist leer, dann wächst er bis maxStack
        stack = [];
        showStack();

        // Initiales Befüllen: Stapel wächst von 0 auf maxStack
        let initialFill = 0;
        function initialStackGrow() {
            if (initialFill < Math.min(imagesWithSize.length, maxStack)) {
                const nextImage = imagesWithSize[initialFill];
                stack.push({ ...nextImage, rotation: getRandomRotation() });
                showStack();
                initialFill++;
                setTimeout(initialStackGrow, 1200);
            } else if (imagesWithSize.length > maxStack) {
                // Vor dem Setzen Intervall immer clearen!
                if (imageStackInterval) clearInterval(imageStackInterval);
                imageStackInterval = setInterval(() => {
                    const nextImage = imagesWithSize[currentIndex];
                    stack.push({ ...nextImage, rotation: getRandomRotation() });
                    if (stack.length > maxStack) stack.shift();
                    showStack();
                    currentIndex = (currentIndex + 1) % imagesWithSize.length;
                }, 6000);
            }
        }
        if (imagesWithSize.length > 0) {
            initialStackGrow();
        }
    });
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
            transition: none !important;
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