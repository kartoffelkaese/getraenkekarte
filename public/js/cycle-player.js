(function () {
    const cycleType = document.body.dataset.cycleType;
    if (!cycleType || (cycleType !== 'standard' && cycleType !== 'jugend')) {
        console.error('Cycle-Player: data-cycle-type muss "standard" oder "jugend" sein');
        return;
    }

    const container = document.querySelector('.cycle-container');
    if (!container) {
        console.error('Cycle-Player: .cycle-container nicht gefunden');
        return;
    }

    let currentFrame = null;
    let cycleConfig = {
        card: cycleType === 'standard' ? 'haupttheke' : 'jugendliche',
        speisekarteCard: 'speisekarte',
        firstTime: 15,
        secondTime: 15,
    };
    let cycleIntervalId = null;
    let cycleTimeouts = [];

    const socket = io();

    function frameId(slug) {
        return `${slug}Frame`;
    }

    function createFrame(slug) {
        const frame = document.createElement('div');
        frame.className = 'cycle-frame';
        frame.id = frameId(slug);

        const iframe = document.createElement('iframe');
        iframe.src = `/${slug}`;
        frame.appendChild(iframe);

        return frame;
    }

    function buildFrames(cardSlug, speisekarteSlug) {
        container.innerHTML = '';
        container.appendChild(createFrame(cardSlug));
        container.appendChild(createFrame(speisekarteSlug));
    }

    function getFrame(slug) {
        return document.getElementById(frameId(slug));
    }

    async function loadCycleConfig() {
        try {
            const response = await fetch('/api/cycle-config');
            const config = await response.json();
            cycleConfig = config[cycleType];
        } catch (error) {
            console.error('Fehler beim Laden der Cycle-Konfiguration:', error);
            cycleConfig = {
                card: cycleType === 'standard' ? 'haupttheke' : 'jugendliche',
                speisekarteCard: 'speisekarte',
                firstTime: 15,
                secondTime: cycleType === 'standard' ? 15 : 10,
            };
        }
    }

    function switchFrame() {
        getFrame(currentFrame).classList.remove('active');
        currentFrame = currentFrame === cycleConfig.card
            ? cycleConfig.speisekarteCard
            : cycleConfig.card;
        getFrame(currentFrame).classList.add('active');
    }

    function clearCycleTimers() {
        cycleTimeouts.forEach((id) => clearTimeout(id));
        cycleTimeouts = [];
        if (cycleIntervalId !== null) {
            clearInterval(cycleIntervalId);
            cycleIntervalId = null;
        }
    }

    function startCycle() {
        const { firstTime, secondTime, card, speisekarteCard } = cycleConfig;
        const cycleDuration = (firstTime + secondTime) * 1000;

        cycleTimeouts.push(setTimeout(() => {
            if (currentFrame === card) {
                switchFrame();
            }
        }, firstTime * 1000));

        cycleTimeouts.push(setTimeout(() => {
            if (currentFrame === speisekarteCard) {
                switchFrame();
            }
        }, cycleDuration));
    }

    async function initCycle() {
        clearCycleTimers();
        await loadCycleConfig();
        buildFrames(cycleConfig.card, cycleConfig.speisekarteCard);
        currentFrame = cycleConfig.card;
        getFrame(currentFrame).classList.add('active');

        startCycle();
        cycleIntervalId = setInterval(startCycle, (cycleConfig.firstTime + cycleConfig.secondTime) * 1000);
    }

    socket.on('cycleConfigChanged', (data) => {
        console.log('Cycle-Konfiguration geändert:', data);
        if (data.type === cycleType) {
            location.reload();
        }
    });

    socket.on('forceCycleReload', (data) => {
        console.log('Reload-Signal empfangen:', data);
        if (data.type === 'all' || data.type === cycleType) {
            location.reload();
        }
    });

    initCycle();
})();
