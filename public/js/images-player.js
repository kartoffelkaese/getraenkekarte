function initImagesPlayer({ container, layout, getSocket, emptyMessage, emptyMessageClass, errorMessage }) {
    if (!container) return;

    const LAYOUTS = {
        fullscreen: {
            containerClass: 'bilder-stack-container',
            borderRadius: '20px',
            landscape: { width: '1200px', maxWidth: '95vw', maxHeight: '85vh' },
            portrait: { width: '800px', maxWidth: '95vw', maxHeight: '85vh' }
        },
        theke: {
            containerClass: 'bilder-stack-container position-relative d-flex justify-content-center align-items-center',
            borderRadius: '16px',
            landscape: { width: '720px', maxWidth: '100vw', maxHeight: '95vh' },
            portrait: { width: '520px', maxWidth: '98vw', maxHeight: '80vh' }
        }
    };

    const preset = LAYOUTS[layout] || LAYOUTS.fullscreen;
    const possibleRotations = [-8, 4, 0, -5, 7, 2, -3, 5];

    let imagesConfig = { transparentBackground: false, logoMode: false };
    let currentImages = [];
    let imageStackInterval = null;
    let logoAnimationToken = 0;
    let logoFloatTimeout = null;
    let stackRefresh = null;

    const LOGO_FLY_DURATION_MS = 1200;
    const LOGO_FLOAT_DURATION_MS = 6000;

    function stopCurrentPlayer() {
        if (imageStackInterval) {
            clearInterval(imageStackInterval);
            imageStackInterval = null;
        }
        if (logoFloatTimeout) {
            clearTimeout(logoFloatTimeout);
            logoFloatTimeout = null;
        }
        logoAnimationToken++;
        stackRefresh = null;
    }

    function getRandomRotation() {
        return possibleRotations[Math.floor(Math.random() * possibleRotations.length)];
    }

    function preloadImageSizes(images, callback) {
        let loaded = 0;
        const imagesWithSize = images.map(img => ({ ...img }));
        if (imagesWithSize.length === 0) {
            callback(imagesWithSize);
            return;
        }

        imagesWithSize.forEach((img) => {
            const temp = new window.Image();
            temp.onload = function() {
                img._isLandscape = temp.width > temp.height;
                loaded++;
                if (loaded === imagesWithSize.length) {
                    callback(imagesWithSize);
                }
            };
            temp.onerror = function() {
                img._isLandscape = true;
                loaded++;
                if (loaded === imagesWithSize.length) {
                    callback(imagesWithSize);
                }
            };
            temp.src = img.url;
        });
    }

    function applyImageSize(img, stackItem) {
        if (imagesConfig.logoMode) {
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '60vh';
            return;
        }

        const size = stackItem._isLandscape ? preset.landscape : preset.portrait;
        img.style.width = size.width;
        img.style.maxWidth = size.maxWidth;
        img.style.maxHeight = size.maxHeight;
    }

    function createBaseImage(stackItem, className) {
        const img = document.createElement('img');
        img.src = stackItem.url;
        img.alt = stackItem.filename;
        img.className = className;
        img.style.position = 'absolute';
        img.style.left = '50%';
        img.style.top = '50%';
        img.style.opacity = '1';
        img.style.zIndex = '1';
        applyImageSize(img, stackItem);
        return img;
    }

    function startStackMode(images) {
        let stack = [];
        const maxStack = 4;
        let currentIndex = 0;

        function showStack() {
            container.innerHTML = '';
            const stackContainer = document.createElement('div');
            stackContainer.className = preset.containerClass;
            stack.forEach((stackItem, i) => {
                const img = createBaseImage(stackItem, 'bilder-stack-img');
                img.style.transform = `translate(-50%, -50%) rotate(${stackItem.rotation}deg)`;
                img.style.objectFit = 'cover';
                img.style.borderRadius = preset.borderRadius;
                img.style.zIndex = String(i + 1);
                img.style.transition = 'none';
                stackContainer.appendChild(img);
            });
            container.appendChild(stackContainer);
        }

        stackRefresh = showStack;

        preloadImageSizes(images, function(imagesWithSize) {
            stack = [];
            showStack();

            let initialFill = 0;
            function initialStackGrow() {
                if (initialFill < Math.min(imagesWithSize.length, maxStack)) {
                    const nextImage = imagesWithSize[initialFill];
                    stack.push({ ...nextImage, rotation: getRandomRotation() });
                    showStack();
                    initialFill++;
                    setTimeout(initialStackGrow, 1200);
                } else if (imagesWithSize.length > maxStack) {
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

    function startLogoMode(images) {
        const token = ++logoAnimationToken;
        let currentIndex = 0;

        preloadImageSizes(images, function(imagesWithSize) {
            if (token !== logoAnimationToken) return;

            function showLogoImage() {
                if (token !== logoAnimationToken) return;

                const image = imagesWithSize[currentIndex];
                container.innerHTML = '';
                const stackContainer = document.createElement('div');
                stackContainer.className = preset.containerClass;

                const img = createBaseImage(image, 'bilder-stack-img bilder-logo-img bilder-logo-enter');
                img.style.objectFit = 'contain';
                img.style.borderRadius = '0';

                img.addEventListener('animationend', function onEnterEnd(event) {
                    if (event.animationName !== 'logoFlyIn') return;
                    if (token !== logoAnimationToken) return;

                    img.classList.remove('bilder-logo-enter');
                    img.classList.add('bilder-logo-floating');

                    logoFloatTimeout = setTimeout(() => {
                        logoFloatTimeout = null;
                        if (token !== logoAnimationToken) return;

                        img.classList.remove('bilder-logo-floating');
                        img.classList.add('bilder-logo-exit');

                        img.addEventListener('animationend', function onExitEnd(exitEvent) {
                            if (exitEvent.animationName !== 'logoFlyOut') return;
                            if (token !== logoAnimationToken) return;
                            currentIndex = (currentIndex + 1) % imagesWithSize.length;
                            showLogoImage();
                        }, { once: true });
                    }, LOGO_FLOAT_DURATION_MS);
                }, { once: true });

                stackContainer.appendChild(img);
                container.appendChild(stackContainer);
            }

            showLogoImage();
        });
    }

    function startPlayer() {
        stopCurrentPlayer();
        if (!Array.isArray(currentImages) || currentImages.length === 0) {
            container.innerHTML = `<div class="text-center ${emptyMessageClass || 'text-muted'} fs-1">${emptyMessage}</div>`;
            return;
        }

        if (imagesConfig.logoMode) {
            startLogoMode(currentImages);
        } else {
            startStackMode(currentImages);
        }
    }

    function restartPlayer() {
        startPlayer();
    }

    function applyImagesConfig(config) {
        imagesConfig = {
            transparentBackground: !!config.transparentBackground,
            logoMode: !!config.logoMode
        };
        document.body.classList.toggle('images-transparent-bg', imagesConfig.transparentBackground);
        document.body.classList.toggle('images-logo-mode', imagesConfig.logoMode);
        if (currentImages.length > 0) {
            restartPlayer();
        }
    }

    async function loadImagesConfig() {
        try {
            const response = await fetch('/api/images-config');
            if (response.ok) {
                applyImagesConfig(await response.json());
            }
        } catch (error) {
            console.error('Fehler beim Laden der Bilder-Konfiguration:', error);
        }
    }

    async function fetchAndDisplayImages() {
        try {
            const response = await fetch('/api/images');
            const images = await response.json();
            if (!Array.isArray(images) || images.length === 0) {
                currentImages = [];
                container.innerHTML = `<div class="text-center ${emptyMessageClass || 'text-muted'} fs-1">${emptyMessage}</div>`;
                return;
            }
            currentImages = images;
            startPlayer();
        } catch {
            container.innerHTML = `<div class="text-center text-danger fs-1">${errorMessage}</div>`;
        }
    }

    container.innerHTML = '';
    loadImagesConfig().then(() => fetchAndDisplayImages());

    const socket = typeof getSocket === 'function' ? getSocket() : null;
    if (socket) {
        socket.on('imagesConfigChanged', (config) => {
            applyImagesConfig(config);
        });
    }
}
