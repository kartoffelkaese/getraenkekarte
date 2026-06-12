/**
 * Schedule-Player: Server (/current) ist Single Source of Truth für die aktive Karte.
 */
(function () {
    const body = document.body;
    const configApi = body.dataset.scheduleConfigApi;
    const currentApi = body.dataset.scheduleCurrentApi;
    const changedEvent = body.dataset.scheduleChangedEvent;
    const reloadEvent = body.dataset.scheduleReloadEvent;

    if (!configApi || !currentApi) {
        console.error('schedule-player: data-schedule-config-api und data-schedule-current-api erforderlich');
        return;
    }

    let currentCard = '';
    let checkInterval = null;
    let lastConfigUpdate = 0;
    const loadedFrames = new Set();
    let frameUnloadTimeout = null;
    const socket = typeof io !== 'undefined' ? io() : null;

    function extractLocationFromPreset(presetName) {
        if (!presetName.startsWith('preset:')) {
            return null;
        }
        const filename = presetName.replace('preset:', '');
        if (filename.startsWith('haupttheke-')) {
            return 'haupttheke';
        }
        if (filename.startsWith('theke-hinten-')) {
            return 'theke-hinten';
        }
        return null;
    }

    function resolveFrameSlug(cardSlug) {
        if (cardSlug.startsWith('preset:')) {
            return extractLocationFromPreset(cardSlug) || 'cycle';
        }
        return cardSlug;
    }

    function loadFrame(cardName) {
        const frameId = `${cardName}Frame`;
        const frame = document.getElementById(frameId);
        if (!frame) {
            console.warn(`Frame für Karte '${cardName}' nicht gefunden`);
            return null;
        }
        if (loadedFrames.has(cardName)) {
            return frame;
        }
        const iframe = frame.querySelector('iframe');
        if (iframe && !iframe.src) {
            iframe.src = `/${cardName}`;
        }
        loadedFrames.add(cardName);
        return frame;
    }

    function scheduleFrameUnload() {
        if (frameUnloadTimeout) {
            clearTimeout(frameUnloadTimeout);
        }
        frameUnloadTimeout = setTimeout(unloadInactiveFrames, 5 * 60 * 1000);
    }

    function unloadInactiveFrames() {
        const allFrames = document.querySelectorAll('.schedule-frame');
        const currentFrameName = resolveFrameSlug(currentCard);
        const activeFrame = document.getElementById(`${currentFrameName}Frame`);

        allFrames.forEach((frame) => {
            if (frame !== activeFrame && !frame.classList.contains('active')) {
                const iframe = frame.querySelector('iframe');
                if (iframe && iframe.src) {
                    iframe.src = '';
                    const cardName = frame.id.replace('Frame', '');
                    loadedFrames.delete(cardName);
                }
            }
        });
    }

    function switchToCard(newCard) {
        if (newCard === currentCard) {
            return;
        }

        if (currentCard) {
            const currentFrameName = resolveFrameSlug(currentCard);
            const currentFrame = document.getElementById(`${currentFrameName}Frame`);
            if (currentFrame) {
                currentFrame.classList.remove('active');
            }
        }

        currentCard = newCard;
        const cardToLoad = resolveFrameSlug(currentCard);
        const newFrame = loadFrame(cardToLoad);

        if (newFrame) {
            newFrame.classList.add('active');
            scheduleFrameUnload();
        } else {
            currentCard = 'cycle';
            const fallbackFrame = loadFrame('cycle');
            if (fallbackFrame) {
                fallbackFrame.classList.add('active');
            }
        }
    }

    async function loadScheduleConfig() {
        await fetch(configApi);
        lastConfigUpdate = Date.now();
    }

    async function updateDisplayFromServer() {
        try {
            const response = await fetch(currentApi);
            const data = await response.json();
            switchToCard(data.currentCard);
        } catch (error) {
            console.warn('Schedule /current fehlgeschlagen:', error);
        }
    }

    function startScheduleCheck() {
        updateDisplayFromServer();
        checkInterval = setInterval(() => {
            updateDisplayFromServer();
            if (Date.now() - lastConfigUpdate > 5 * 60 * 1000) {
                loadScheduleConfig().catch(() => {});
            }
        }, 30000);
    }

    function stopScheduleCheck() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
        if (frameUnloadTimeout) {
            clearTimeout(frameUnloadTimeout);
            frameUnloadTimeout = null;
        }
    }

    if (socket && changedEvent) {
        socket.on(changedEvent, () => {
            lastConfigUpdate = Date.now();
            updateDisplayFromServer();
        });
    }

    if (socket && reloadEvent) {
        socket.on(reloadEvent, () => {
            unloadInactiveFrames();
            location.reload();
        });
    }

    window.addEventListener('beforeunload', () => {
        stopScheduleCheck();
        unloadInactiveFrames();
    });

    async function initializeSchedule() {
        try {
            await loadScheduleConfig();
            startScheduleCheck();
        } catch (error) {
            console.error('Fehler bei der Schedule-Initialisierung:', error);
            startScheduleCheck();
        }
    }

    initializeSchedule();
})();
