// Vollbild-Bilderdarstellung für bilder.html

const additionalContent = document.querySelector('.additional-content');

async function fetchAndDisplayImages() {
    try {
        const response = await fetch('/api/images');
        const images = await response.json();
        if (!Array.isArray(images) || images.length === 0) {
            additionalContent.innerHTML = '<div class="text-center text-white fs-1">Keine Bilder vorhanden</div>';
            return;
        }
        startImageStack(images);
    } catch (err) {
        additionalContent.innerHTML = '<div class="text-center text-danger fs-1">Fehler beim Laden der Bilder</div>';
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
        container.className = 'bilder-stack-container';
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
            img.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
            img.style.borderRadius = '20px';
            img.style.opacity = '1';
            img.style.zIndex = i + 1;
            img.style.transition = 'none';
            
            // Feste Breiten wie in theke-hinten-bilder.js
            if (stackItem._isLandscape) {
                img.style.width = '1200px';
                img.style.maxWidth = '95vw';
                img.style.maxHeight = '85vh';
            } else {
                img.style.width = '800px';
                img.style.maxWidth = '95vw';
                img.style.maxHeight = '85vh';
            }
            
            container.appendChild(img);
        });
        additionalContent.appendChild(container);
    }

    // Nach dem Preload der Bildgrößen starten
    preloadImageSizes(images, function(imagesWithSize) {
        console.log('Alle geladenen Bilder:', imagesWithSize.length, imagesWithSize.map(x => x.filename));
        
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
                    console.log('Bildwechsel:', currentIndex, nextImage.filename);
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

// Initial laden
if (additionalContent) {
    additionalContent.innerHTML = '';
    fetchAndDisplayImages();
}
