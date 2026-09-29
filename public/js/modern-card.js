/**
 * Moderne Getränkekarte (Test, Haupttheke).
 *
 * Kern ist das Auto-Fit: Kategorien werden in Sortierreihenfolge zusammenhängend auf Spalten verteilt
 * und die Schriftgröße (--fs, in vh) wird so groß wie möglich gewählt, dass ALLES sichtbar bleibt.
 * Nichts wird abgeschnitten – notfalls kommen Spalten hinzu oder die Schrift wird kleiner.
 *
 * Daten über data-location (Standard: haupttheke). Logo, Werbung und Zusatzstoffe in [data-slot]-Bereichen.
 */
(function () {
    const body = document.body;
    const location = body.dataset.location || 'haupttheke';

    // Spaltenzahl, zwischen der das Auto-Fit wählt
    const MIN_COLS = 2;
    const MAX_COLS = 4;

    // Schriftgröße der Getränkenamen in vh
    const FS_MIN_READABLE = 1.9; // ≈ 20 px bei 1080p
    const FS_MAX = 3.4;
    const FS_FLOOR = 0.8; // absolute Untergrenze, falls extrem viele Getränke
    const AD_INTERVAL_MS = 6000;

    const menu = document.getElementById('mcMenu');
    const slots = {
        logo: document.querySelector('[data-slot="logo"]'),
        ads: document.querySelector('[data-slot="ads"]'),
        additives: document.querySelector('[data-slot="additives"]'),
    };

    const state = {
        drinks: [],
        ads: [],
        logo: null,
        additives: [],
        fs: null,
        columns: null,
    };

    // ---------------------------------------------------------------------
    // Rendering der Bausteine
    // ---------------------------------------------------------------------

    function additiveCodes(drink) {
        if (!drink.additives) return '';
        return drink.additives.split(', ').map((a) => a.split(')')[0]).join(',');
    }

    /** "0.4L" → "0,4 l", "4cl" → "4 cl" (schmales Leerzeichen zwischen Zahl und Einheit). */
    function formatVolume(volume) {
        if (!volume) return '';
        return String(volume).trim()
            .replace(/(\d)\.(\d)/g, '$1,$2')
            .replace(/(\d)\s*(cl|ml|l)\b/gi, (_, digit, unit) => `${digit} ${unit.toLowerCase()}`);
    }

    function mostCommon(values) {
        const counts = new Map();
        values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
        let best = '';
        let bestCount = 0;
        counts.forEach((count, value) => {
            if (count > bestCount) {
                best = value;
                bestCount = count;
            }
        });
        return best;
    }

    const showsPrice = (drink) => drink.category_show_prices && drink.show_price;
    const hasTwoSizes = (drink) => drink.has_small_size === 1;

    /**
     * Preisspalten einer Kategorie: das häufigste Volumen (bzw. Volumen-Paar bei zwei Größen)
     * steht einmal im Kategoriekopf, abweichende Volumen stehen klein hinter dem Getränkenamen.
     */
    function priceColumns(drinks) {
        const priced = drinks.filter(showsPrice);
        const twoSizes = priced.filter(hasTwoSizes);
        if (twoSizes.length > 0) {
            const pair = mostCommon(twoSizes.map((d) => `${formatVolume(d.volume_normal)}|${formatVolume(d.volume_small)}`));
            return pair.split('|');
        }
        if (priced.length > 0) {
            return [mostCommon(priced.map((d) => formatVolume(d.volume_normal)))];
        }
        return [];
    }

    function priceCell(price) {
        return `<span class="mc-price">${formatPrice(price)}<span class="mc-eur">€</span></span>`;
    }

    function drinkRowHtml(drink, columns) {
        const cells = columns.map(() => '<span class="mc-price mc-empty"></span>');
        let volumeNote = '';
        if (showsPrice(drink) && columns.length > 0) {
            const normal = formatVolume(drink.volume_normal);
            if (hasTwoSizes(drink)) {
                const small = formatVolume(drink.volume_small);
                cells[0] = priceCell(parseFloat(drink.preis) || 0);
                cells[1] = priceCell(parseFloat(drink.small_price) || 0);
                if (normal !== columns[0] || small !== columns[1]) {
                    volumeNote = [normal, small].filter(Boolean).join(' / ');
                }
            } else {
                // Einzelpreis in die Spalte mit passendem Volumen, sonst in die erste
                const index = Math.max(0, columns.indexOf(normal));
                cells[index] = priceCell(parseFloat(drink.preis) || 0);
                if (normal !== columns[index]) volumeNote = normal;
            }
        }
        const codes = additiveCodes(drink);
        const leader = columns.length > 0 && showsPrice(drink) ? '<span class="mc-leader"></span>' : '';
        return `<div class="mc-name-cell" data-drink-id="${escapeAttr(drink.id)}">`
            + `<span class="mc-name">${escapeHtml(drink.name)}`
            + `${codes ? `<sup class="mc-add">${escapeHtml(codes)}</sup>` : ''}`
            + `${volumeNote ? `<span class="mc-vol-note">${escapeHtml(volumeNote)}</span>` : ''}</span>`
            + `${leader}</div>${cells.join('')}`;
    }

    /** Gruppiert sichtbare Getränke nach Kategorie in Sortierreihenfolge (wie app.js). */
    function groupByCategory(drinks) {
        const groups = new Map();
        drinks.forEach((drink) => {
            if (!(drink.is_active && drink.category_is_visible)) return;
            const name = drink.category_name || 'Sonstige';
            if (!groups.has(name)) {
                groups.set(name, { name, order: drink.category_sort_order || 999999, drinks: [] });
            }
            groups.get(name).drinks.push(drink);
        });
        return [...groups.values()].sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name));
    }

    function buildCategoryBlocks(drinks) {
        return groupByCategory(drinks).map((category) => {
            const columns = priceColumns(category.drinks);
            const block = document.createElement('section');
            block.className = 'mc-category';
            block.style.setProperty('--price-cols', columns.length);
            block.innerHTML = `<div class="mc-grid">
                <h2 class="mc-cat-title">${escapeHtml(category.name)}</h2>
                ${columns.map((c) => `<span class="mc-col-head">${escapeHtml(c)}</span>`).join('')}
                <div class="mc-divider"></div>
                ${category.drinks.map((d) => drinkRowHtml(d, columns)).join('')}
            </div>`;
            return block;
        });
    }

    // ---------------------------------------------------------------------
    // Auto-Fit
    // ---------------------------------------------------------------------

    /**
     * Verteilt Blöcke (Höhen) der Reihe nach auf Spalten mit den Kapazitäten caps.
     * Greedy ist für zusammenhängende Verteilung optimal: gibt Zuordnung oder null zurück.
     */
    function greedyAssign(heights, caps, gap) {
        const assignment = [];
        let col = 0;
        let used = 0;
        for (let i = 0; i < heights.length; i++) {
            const needed = (used > 0 ? gap : 0) + heights[i];
            if (used + needed <= caps[col] + 0.5) {
                used += needed;
            } else {
                col++;
                if (col >= caps.length || heights[i] > caps[col] + 0.5) return null;
                used = heights[i];
            }
            assignment.push(col);
        }
        return assignment;
    }

    function menuMetrics() {
        const style = getComputedStyle(menu);
        return {
            width: menu.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight),
            height: menu.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom),
            colGap: parseFloat(style.columnGap) || 0,
            rowGap: parseFloat(style.rowGap) || 0,
        };
    }

    /**
     * Misst Blockhöhen bei Spaltenzahl n und Schriftgröße fs.
     * overflow = true, wenn ein Getränkename nicht in die Breite passt (unteilbares Wort).
     */
    function measure(measureBox, blocks, n, fs, metrics) {
        measureBox.style.width = `${(metrics.width - (n - 1) * metrics.colGap) / n}px`;
        menu.style.setProperty('--fs', fs);
        const heights = blocks.map((b) => b.getBoundingClientRect().height);
        const overflow = [...measureBox.querySelectorAll('.mc-name-cell, .mc-cat-title')]
            .some((el) => el.scrollWidth > el.clientWidth + 1);
        return { heights, overflow };
    }

    function fitsMeasured(measured, n, metrics) {
        return !measured.overflow && fits(measured.heights, n, metrics);
    }

    function fits(heights, n, metrics, limit = metrics.height) {
        return greedyAssign(heights, Array(n).fill(limit), metrics.rowGap);
    }

    /** Größte Schrift, bei der alles in n Spalten passt (Binärsuche). */
    function bestFontSize(measureBox, blocks, n, metrics) {
        let lo = FS_FLOOR;
        let hi = FS_MAX;
        if (!fitsMeasured(measure(measureBox, blocks, n, lo, metrics), n, metrics)) return null;
        if (fitsMeasured(measure(measureBox, blocks, n, hi, metrics), n, metrics)) return hi;
        for (let i = 0; i < 14; i++) {
            const mid = (lo + hi) / 2;
            if (fitsMeasured(measure(measureBox, blocks, n, mid, metrics), n, metrics)) lo = mid;
            else hi = mid;
        }
        return lo;
    }

    function fitAndRender(blocks) {
        const metrics = menuMetrics();
        // Versteckt (z. B. vorgeladener Overview-/Schedule-Frame): nicht rechnen,
        // der ResizeObserver stößt die Berechnung an, sobald der Bereich sichtbar ist
        if (metrics.width <= 0 || metrics.height <= 0) return;

        menu.innerHTML = '';
        if (blocks.length === 0) return;

        const measureBox = document.createElement('div');
        measureBox.className = 'mc-measure';
        menu.appendChild(measureBox);
        blocks.forEach((b) => measureBox.appendChild(b));

        // Beste Spaltenzahl: größte Schrift, bei Gleichstand weniger Spalten
        let best = null;
        for (let n = MIN_COLS; n <= MAX_COLS; n++) {
            const fs = bestFontSize(measureBox, blocks, n, metrics);
            if (fs !== null && (!best || fs > best.fs * 1.02)) {
                best = { n, fs };
            }
        }
        if (!best) {
            // Selbst bei minimaler Schrift passt es nicht: maximale Spalten, kleinste Schrift
            best = { n: MAX_COLS, fs: FS_FLOOR };
            console.warn('Moderne Karte: Inhalt passt selbst mit minimaler Schrift nicht vollständig.');
        } else if (best.fs < FS_MIN_READABLE) {
            console.warn(`Moderne Karte: Schrift unter Lesbarkeitsgrenze (${best.fs.toFixed(2)}vh < ${FS_MIN_READABLE}vh).`);
        }

        // Ausbalancieren: kleinste Spaltenhöhe suchen, mit der die Verteilung noch aufgeht
        const { heights } = measure(measureBox, blocks, best.n, best.fs, metrics);
        let lo = 0;
        let hi = metrics.height;
        for (let i = 0; i < 20; i++) {
            const mid = (lo + hi) / 2;
            if (fits(heights, best.n, metrics, mid)) hi = mid;
            else lo = mid;
        }
        const assignment = fits(heights, best.n, metrics, hi)
            || fits(heights, best.n, metrics)
            || blocks.map((_, i) => Math.min(i, best.n - 1));

        measureBox.remove();
        menu.style.setProperty('--cols', best.n);
        const columns = [...Array(best.n)].map(() => {
            const col = document.createElement('div');
            col.className = 'mc-column';
            menu.appendChild(col);
            return col;
        });
        blocks.forEach((block, i) => columns[assignment[i]].appendChild(block));


        state.fs = best.fs;
        state.columns = best.n;
        body.dataset.fit = best.fs < FS_MIN_READABLE ? 'tight' : 'ok';

        // Sicherheitsnetz gegen Rundungsfehler: bei Überlauf Schrift schrittweise verkleinern
        let guard = 0;
        while (guard++ < 12 && columns.some((c) => c.scrollHeight > c.clientHeight + 1)) {
            state.fs *= 0.97;
            menu.style.setProperty('--fs', state.fs);
        }
    }

    let refitTimer = null;
    function refit() {
        clearTimeout(refitTimer);
        refitTimer = setTimeout(() => {
            fitAndRender(buildCategoryBlocks(state.drinks));
        }, 50);
    }

    // ---------------------------------------------------------------------
    // Seitenelemente: Logo, Werbung, Zusatzstoffe
    // ---------------------------------------------------------------------

    function renderLogo() {
        const active = state.logo && state.logo.is_active;
        body.classList.toggle('mc-no-logo', !active);
        const html = active ? `<img class="mc-logo-img" src="${safeAssetUrl('/images/logo.png')}" alt="Logo">` : '';
        if (slots.logo) {
            slots.logo.innerHTML = html;
        }
    }

    let adTimer = null;
    function renderAds() {
        clearInterval(adTimer);
        const ads = state.ads
            .filter((ad) => ad.is_active && ad.image_path)
            .sort((a, b) => a.sort_order - b.sort_order);
        body.classList.toggle('mc-no-ads', ads.length === 0);

        const html = ads.map((ad, i) => `
            <figure class="mc-ad${i === 0 ? ' active' : ''}">
                <div class="mc-ad-media"><img src="${safeAssetUrl(ad.image_path)}" alt="${escapeAttr(ad.name)}"></div>
                <figcaption class="mc-ad-caption">
                    ${ad.name ? `<span class="mc-ad-name">${escapeHtml(ad.name)}</span>` : ''}
                    ${ad.price ? `<span class="mc-ad-price">${formatPrice(parseFloat(ad.price) || 0)}<span class="mc-eur">€</span></span>` : ''}
                </figcaption>
            </figure>`).join('');

        const container = slots.ads;
        if (container) {
            container.innerHTML = html;
        }

        if (container && ads.length > 1) {
            let index = 0;
            adTimer = setInterval(() => {
                const items = container.querySelectorAll('.mc-ad');
                items[index].classList.remove('active');
                index = (index + 1) % items.length;
                items[index].classList.add('active');
            }, AD_INTERVAL_MS);
        }
    }

    function renderAdditives() {
        if (!slots.additives) return;
        slots.additives.innerHTML = state.additives
            .map((a) => `<span class="mc-additive"><b>${escapeHtml(a.code)}</b> ${escapeHtml(a.name)}</span>`)
            .join('');
    }

    // ---------------------------------------------------------------------
    // Daten laden
    // ---------------------------------------------------------------------

    async function getJson(url) {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${url}: ${response.status}`);
        return response.json();
    }

    async function loadDrinks() {
        try {
            state.drinks = await getJson(`/api/drinks/${location}`);
            refit();
        } catch (error) {
            console.error('Fehler beim Laden der Getränke:', error);
        }
    }

    async function loadAds() {
        try {
            state.ads = await getJson(`/api/ads/${location}`);
            renderAds();
            refit();
        } catch (error) {
            console.error('Fehler beim Laden der Werbung:', error);
        }
    }

    async function loadLogo() {
        try {
            state.logo = await getJson(`/api/logo/${location}`);
            renderLogo();
            refit();
        } catch (error) {
            console.error('Fehler beim Laden des Logos:', error);
        }
    }

    async function loadAdditives() {
        try {
            state.additives = await getJson('/api/additives-list');
            renderAdditives();
            refit(); // Legende kann den Platz fürs Menü verändern
        } catch (error) {
            console.error('Fehler beim Laden der Zusatzstoffe:', error);
        }
    }

    function loadAll() {
        loadDrinks();
        loadAds();
        loadLogo();
        loadAdditives();
    }

    // ---------------------------------------------------------------------
    // Live-Updates
    // ---------------------------------------------------------------------

    const socket = io({ reconnection: true, reconnectionDelay: 1000, reconnectionDelayMax: 10000 });

    let drinksTimer = null;
    function scheduleDrinksReload() {
        clearTimeout(drinksTimer);
        drinksTimer = setTimeout(loadDrinks, 300);
    }

    const forThisLocation = (handler) => (data) => {
        if (!data || data.location === location) handler();
    };

    [
        'drinkStatusChanged',
        'drinkPriceChanged',
        'categoryVisibilityChanged',
        'categoryPricesChanged',
        'categorySortChanged',
        'categoryColumnBreakChanged',
    ].forEach((event) => socket.on(event, forThisLocation(scheduleDrinksReload)));
    socket.on('drinksChanged', scheduleDrinksReload);
    socket.on('drinkAdditivesChanged', scheduleDrinksReload);
    socket.on('additivesChanged', () => {
        loadAdditives();
        scheduleDrinksReload();
    });
    socket.on('adsChanged', (data) => {
        if (!data || data.location === location || data.location === 'all') loadAds();
    });
    socket.on('logoChanged', forThisLocation(loadLogo));
    // Reload-Button der Haupttheke im Admin erfasst auch die modernen Varianten
    socket.on('forceHauptthekeReload', () => {
        if (location === 'haupttheke') window.location.reload();
    });
    // Nach Verbindungsabbruch verpasste Änderungen nachholen
    socket.io.on('reconnect', loadAll);

    // Neu berechnen, wenn sich die Größe des Menübereichs ändert (Fenster, Frame ein-/ausgeblendet)
    let resizeTimer = null;
    let lastSize = '';
    const onResize = () => {
        const size = `${menu.clientWidth}x${menu.clientHeight}`;
        if (size === lastSize) return;
        lastSize = size;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(refit, 150);
    };
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(onResize).observe(menu);
    } else {
        window.addEventListener('resize', onResize);
    }
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(refit);
    }

    loadAll();

    // Für Tests in der Browser-Konsole, z. B. ModernCard.render(drinks)
    window.ModernCard = {
        render(drinks) {
            state.drinks = drinks;
            refit();
        },
        refit,
        get state() {
            return { fs: state.fs, columns: state.columns, drinks: state.drinks };
        },
    };
})();
