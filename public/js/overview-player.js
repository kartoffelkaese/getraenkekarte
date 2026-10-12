// Overview-Seiten (overview-1.html, overview-2.html): zeigt die im Admin gewählte Karte im iFrame.
// Die Seite nennt ihre Kennung über <body data-overview="overview-1">.
(function () {
    const overviewId = document.body.dataset.overview;
    let currentCard = '';
    let overviewConfig = { card: 'haupttheke' };
    let loadedFrames = new Set();
    let frameUnloadTimeout = null;
    const socket = io({
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000
    });

    // Lade Overview-Konfiguration
    async function loadOverviewConfig() {
        try {
            const response = await fetch(`/api/overview-config/${overviewId}`);
            overviewConfig = await response.json();
            updateDisplay();
        } catch (error) {
            console.error('Fehler beim Laden der Overview-Konfiguration:', error);
            // Fallback auf Haupttheke
            overviewConfig = { card: 'haupttheke' };
            updateDisplay();
        }
    }

    // Lazy Loading: Lade iFrame nur wenn es benötigt wird
    function loadFrame(cardName) {
        const frameId = `${cardName}Frame`;
        const frame = document.getElementById(frameId);

        if (!frame) {
            console.warn(`Frame für Karte '${cardName}' nicht gefunden`);
            return null;
        }

        // Prüfe ob Frame bereits geladen ist
        if (loadedFrames.has(cardName)) {
            return frame;
        }

        // Lade iFrame nur wenn es noch nicht geladen wurde
        const iframe = frame.querySelector('iframe');
        if (iframe && !iframe.src) {
            iframe.src = `/${cardName}`;
            console.log(`Lazy Loading: ${cardName} iFrame geladen`);
        }

        loadedFrames.add(cardName);
        return frame;
    }

    // Memory Management: Entferne inaktive iFrames nach einer Weile
    function scheduleFrameUnload() {
        // Stoppe vorherigen Timeout
        if (frameUnloadTimeout) {
            clearTimeout(frameUnloadTimeout);
        }

        // Plane Entfernung inaktiver Frames nach 5 Minuten
        frameUnloadTimeout = setTimeout(() => {
            unloadInactiveFrames();
        }, 5 * 60 * 1000); // 5 Minuten
    }

    function unloadInactiveFrames() {
        const allFrames = document.querySelectorAll('.overview-frame');
        const currentFrame = document.getElementById(`${currentCard}Frame`);

        allFrames.forEach(frame => {
            if (frame !== currentFrame && !frame.classList.contains('active')) {
                const iframe = frame.querySelector('iframe');
                if (iframe && iframe.src) {
                    // Entferne src um iFrame zu entladen
                    iframe.src = '';
                    const cardName = frame.id.replace('Frame', '');
                    loadedFrames.delete(cardName);
                    console.log(`Memory Management: ${cardName} iFrame entladen`);
                }
            }
        });
    }

    // Aktualisiere die Anzeige mit verbesserter Fehlerbehandlung
    function updateDisplay() {
        if (overviewConfig.card === currentCard) return;

        console.log(`${overviewId} Wechsel: ${currentCard} -> ${overviewConfig.card}`);

        // Deaktiviere aktuellen Frame
        if (currentCard) {
            const currentFrame = document.getElementById(`${currentCard}Frame`);
            if (currentFrame) {
                currentFrame.classList.remove('active');
            }
        }

        currentCard = overviewConfig.card;

        // Lade und aktiviere neuen Frame (Lazy Loading)
        if (currentCard) {
            const newFrame = loadFrame(currentCard);
            if (newFrame) {
                newFrame.classList.add('active');
                // Beim Wechsel iframe neu laden, damit die Getränkeliste sichtbar geladen wird
                // (im Hintergrund geladene Frames zeigen sonst oft keine Daten)
                const iframe = newFrame.querySelector('iframe');
                if (iframe && iframe.src) {
                    iframe.src = iframe.src;
                }
                // Plane Entfernung inaktiver Frames
                scheduleFrameUnload();
            } else {
                console.warn(`Frame für Karte '${currentCard}' konnte nicht geladen werden`);
                // Fallback auf Haupttheke
                currentCard = 'haupttheke';
                const fallbackFrame = loadFrame('haupttheke');
                if (fallbackFrame) {
                    fallbackFrame.classList.add('active');
                }
            }
        }
    }

    // Socket.IO Event-Listener
    socket.on('connect', () => {
        console.log('Socket.IO verbunden:', socket.id);
    });

    // Nach Verbindungsabbruch Konfiguration neu holen (verpasste Änderungen)
    socket.io.on('reconnect', () => {
        loadOverviewConfig();
    });

    socket.on('disconnect', (reason) => {
        console.log('Socket.IO Verbindung getrennt:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO Verbindungsfehler:', error);
    });

    socket.on('overviewConfigChanged', (data) => {
        if (data.overview === overviewId) {
            console.log(`${overviewId} Konfiguration geändert:`, data);
            overviewConfig = { card: data.card };
            updateDisplay();
        }
    });

    socket.on('forceOverviewReload', (data) => {
        if (data.overview === overviewId || data.overview === 'all') {
            console.log(`Forced Reload für ${overviewId}`);
            // Entlade alle Frames vor Reload
            unloadInactiveFrames();
            location.reload();
        }
    });

    // Cleanup beim Verlassen der Seite
    window.addEventListener('beforeunload', () => {
        // Stoppe Frame-Unload Timeout
        if (frameUnloadTimeout) {
            clearTimeout(frameUnloadTimeout);
            frameUnloadTimeout = null;
        }
        // Entlade alle Frames beim Verlassen
        unloadInactiveFrames();
    });

    // Initialisiere
    loadOverviewConfig();
})();
