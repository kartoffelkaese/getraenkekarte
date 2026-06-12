/**
 * Admin-Navigation: Sidebar, Hash-Routing, Sichtbarkeit.
 */
(function () {
    const DEFAULT_ROUTE = { group: 'karten', page: 'haupttheke', sub: 'logo' };

    const PAGE_META = {
        haupttheke: { title: 'Haupttheke', desc: 'Logo, Kategorien, Werbung und Getränke der Haupttheke pflegen.', groupLabel: 'Karten' },
        'theke-hinten': { title: 'Theke Hinten', desc: 'Einstellungen für die Theke-Hinten-Karten.', groupLabel: 'Karten' },
        jugendliche: { title: 'Jugendkarte', desc: 'Jugendkarten-Inhalte verwalten.', groupLabel: 'Karten' },
        speisekarte: { title: 'Speisekarte', desc: 'Gerichte und Preise der Speisekarte.', groupLabel: 'Karten' },
        bilder: { title: 'Bilder', desc: 'Bilder für die Bilder-Karte hochladen und verwalten.', groupLabel: 'Karten' },
        temp: { title: 'Temporäre Preise', desc: 'Preis-Überschreibungen für Theke Hinten.', groupLabel: 'Preise' },
        'theke-presets': { title: 'Theke-Hinten Presets', desc: 'Presets für Theke-Hinten-Karten aktivieren und verwalten.', groupLabel: 'Preise' },
        schedule: { title: 'Schedule', desc: 'Automatischer Kartenwechsel nach Zeitplan.', groupLabel: 'Anzeige' },
        cycle: { title: 'Cycle', desc: 'Wechsel zwischen Karten im Cycle-Modus.', groupLabel: 'Anzeige' },
        overview: { title: 'Overview', desc: 'Konfiguration der Overview-Displays.', groupLabel: 'Anzeige' },
        status: { title: 'Status & Reload', desc: 'System-Health und Karten-Neustart.', groupLabel: 'System' },
        hochzeit: { title: 'Hochzeitskarten', desc: 'Einstellungen für alle Hochzeitskarten.', groupLabel: 'System' },
        presets: { title: 'Presets', desc: 'Karteneinstellungen als Preset speichern und laden.', groupLabel: 'System' },
        links: { title: 'Links', desc: 'Alle Karten-URLs auf einen Blick.', groupLabel: 'System' },
    };

    const SUB_LABELS = {
        logo: 'Logo',
        kategorien: 'Kategorien',
        werbung: 'Werbung',
        getraenke: 'Getränke',
        zusatzstoffe: 'Zusatzstoffe',
        gerichte: 'Gerichte',
    };

    const CARD_SUBS = {
        haupttheke: ['logo', 'kategorien', 'werbung', 'getraenke', 'zusatzstoffe'],
        'theke-hinten': ['logo', 'kategorien', 'werbung', 'getraenke', 'zusatzstoffe'],
        jugendliche: ['logo', 'kategorien', 'getraenke', 'zusatzstoffe'],
        speisekarte: ['gerichte'],
    };

    let state = { ...DEFAULT_ROUTE, scheduleTab: 1 };
    let onNavigateCallback = null;

    function getLegacyLocation() {
        const { group, page } = state;
        if (group === 'karten') {
            return page;
        }
        if (group === 'preise') {
            return page === 'temp' ? 'temp-prices' : 'theke-presets';
        }
        if (group === 'anzeige') {
            if (page === 'schedule') return 'schedule-1';
            return page;
        }
        return page;
    }

    function routeToHash(route) {
        const parts = [route.group, route.page];
        if (route.group === 'karten' && route.page !== 'bilder' && route.sub) {
            parts.push(route.sub);
        }
        if (route.group === 'anzeige' && route.page === 'schedule' && route.scheduleTab === 2) {
            parts.push('2');
        }
        return '#/' + parts.join('/');
    }

    function parseHash() {
        const raw = (window.location.hash || '').replace(/^#\/?/, '');
        if (!raw) return { ...DEFAULT_ROUTE, scheduleTab: 1 };

        const parts = raw.split('/').filter(Boolean);
        const [group, page, third] = parts;

        if (group === 'karten' && page) {
            if (page === 'bilder') {
                return { group: 'karten', page: 'bilder', sub: null, scheduleTab: 1 };
            }
            const subs = CARD_SUBS[page] || ['logo'];
            const sub = third && subs.includes(third) ? third : subs[0];
            return { group: 'karten', page, sub, scheduleTab: 1 };
        }

        if (group === 'preise' && (page === 'temp' || page === 'theke-presets')) {
            return { group: 'preise', page, sub: null, scheduleTab: 1 };
        }

        if (group === 'anzeige' && page) {
            if (page === 'schedule') {
                return { group: 'anzeige', page: 'schedule', sub: null, scheduleTab: third === '2' ? 2 : 1 };
            }
            if (page === 'cycle' || page === 'overview') {
                return { group: 'anzeige', page, sub: null, scheduleTab: 1 };
            }
        }

        if (group === 'system' && page) {
            return { group: 'system', page, sub: null, scheduleTab: 1 };
        }

        return { ...DEFAULT_ROUTE, scheduleTab: 1 };
    }

    function hideAll() {
        document.querySelectorAll('.admin-page').forEach((el) => el.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach((el) => el.classList.remove('active'));
    }

    function showPage(pageId) {
        const el = document.getElementById(pageId);
        if (el) {
            el.classList.add('active');
        }
    }

    function showCardSection(sub) {
        const card = state.page;
        document.querySelectorAll(`[data-admin-card~="${card}"]`).forEach((el) => {
            const section = el.dataset.adminSection;
            el.classList.toggle('active', section === sub);
        });
    }

    function updateSidebarActive() {
        document.querySelectorAll('.admin-nav-link[data-nav]').forEach((btn) => {
            const navGroup = btn.dataset.navGroup;
            const navPage = btn.dataset.navPage;
            const isActive = navGroup === state.group && navPage === state.page;
            btn.classList.toggle('active', isActive);
        });
    }

    function updateCardSubnav() {
        const subnav = document.getElementById('cardSubnav');
        const pills = document.getElementById('cardSubnavPills');
        if (!subnav || !pills) return;

        if (state.group !== 'karten' || state.page === 'bilder') {
            subnav.style.display = 'none';
            return;
        }

        const subs = CARD_SUBS[state.page] || [];
        subnav.style.display = 'block';
        pills.innerHTML = subs
            .map(
                (sub) =>
                    `<li class="nav-item" role="presentation">
                <button class="nav-link${state.sub === sub ? ' active' : ''}" type="button"
                    data-card-sub="${sub}" role="tab">${SUB_LABELS[sub] || sub}</button>
            </li>`
            )
            .join('');

        pills.querySelectorAll('[data-card-sub]').forEach((btn) => {
            btn.addEventListener('click', () => {
                navigate({ ...state, sub: btn.dataset.cardSub });
            });
        });
    }

    function updateScheduleSubnav() {
        const subnav = document.getElementById('scheduleSubnav');
        if (!subnav) return;

        if (state.group === 'anzeige' && state.page === 'schedule') {
            subnav.style.display = 'block';
            subnav.querySelectorAll('[data-schedule-tab]').forEach((btn) => {
                const tab = Number(btn.dataset.scheduleTab);
                btn.classList.toggle('active', state.scheduleTab === tab);
            });
        } else {
            subnav.style.display = 'none';
        }
    }

    function updatePageHeader() {
        const meta = PAGE_META[state.page] || { title: state.page, desc: '', groupLabel: '' };
        const titleEl = document.getElementById('adminPageTitle');
        const descEl = document.getElementById('adminPageDesc');
        const breadcrumbEl = document.getElementById('adminBreadcrumb');

        if (titleEl) {
            let title = meta.title;
            if (state.group === 'karten' && state.sub && SUB_LABELS[state.sub]) {
                title += ' – ' + SUB_LABELS[state.sub];
            }
            if (state.group === 'anzeige' && state.page === 'schedule') {
                title += ' ' + state.scheduleTab;
            }
            titleEl.textContent = title;
        }
        if (descEl) descEl.textContent = meta.desc;

        if (breadcrumbEl) {
            const crumbs = [meta.groupLabel, meta.title];
            if (state.group === 'karten' && state.sub && SUB_LABELS[state.sub]) {
                crumbs.push(SUB_LABELS[state.sub]);
            }
            breadcrumbEl.innerHTML = crumbs.map((c) => `<span>${c}</span>`).join('');
        }

        const mobileTitle = document.getElementById('adminMobileTitle');
        if (mobileTitle && titleEl) {
            mobileTitle.textContent = titleEl.textContent;
        }
    }

    function applyVisibility() {
        hideAll();

        const { group, page } = state;

        if (group === 'karten') {
            if (page === 'bilder') {
                showPage('bilderPage');
            } else {
                showPage('cardContentPage');
                if (page === 'speisekarte') {
                    document.getElementById('speisekarteSection')?.classList.add('active');
                } else {
                    showCardSection(state.sub || 'logo');
                }
            }
        } else if (group === 'preise') {
            if (page === 'temp') {
                showPage('tempPricesPage');
            } else {
                showPage('thekePresetsPage');
            }
        } else if (group === 'anzeige') {
            if (page === 'schedule') {
                showPage('schedulePage');
                const pane1 = document.getElementById('schedule1-pane');
                const pane2 = document.getElementById('schedule2-pane');
                const tab1 = document.getElementById('schedule1-tab');
                const tab2 = document.getElementById('schedule2-tab');
                if (state.scheduleTab === 2) {
                    pane1?.classList.remove('show', 'active');
                    pane2?.classList.add('show', 'active');
                    tab1?.classList.remove('active');
                    tab2?.classList.add('active');
                } else {
                    pane2?.classList.remove('show', 'active');
                    pane1?.classList.add('show', 'active');
                    tab2?.classList.remove('active');
                    tab1?.classList.add('active');
                }
            } else if (page === 'cycle') {
                showPage('cyclePage');
            } else if (page === 'overview') {
                showPage('overviewPage');
            }
        } else if (group === 'system') {
            const pageMap = {
                status: 'statusPage',
                hochzeit: 'hochzeitPage',
                presets: 'presetsPage',
                links: 'linksPage',
            };
            showPage(pageMap[page]);
        }

        updateSidebarActive();
        updateCardSubnav();
        updateScheduleSubnav();
        updatePageHeader();
    }

    function navigate(newState, options = {}) {
        const prev = { ...state };
        state = { ...newState };
        if (!options.skipHash) {
            const hash = routeToHash(state);
            if (window.location.hash !== hash) {
                window.location.hash = hash;
            }
        }
        applyVisibility();
        if (typeof onNavigateCallback === 'function') {
            onNavigateCallback(state, prev);
        }
    }

    function switchScheduleTab(tab) {
        navigate({ ...state, group: 'anzeige', page: 'schedule', scheduleTab: tab });
    }

    function bindSidebar() {
        document.querySelectorAll('.admin-nav-link[data-nav]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const group = btn.dataset.navGroup;
                const page = btn.dataset.navPage;
                let sub = null;
                if (group === 'karten' && page !== 'bilder') {
                    sub = (CARD_SUBS[page] || ['logo'])[0];
                }
                navigate({
                    group,
                    page,
                    sub,
                    scheduleTab: page === 'schedule' ? state.scheduleTab : 1,
                });

                const offcanvas = document.getElementById('adminSidebarOffcanvas');
                if (offcanvas) {
                    bootstrap.Offcanvas.getInstance(offcanvas)?.hide();
                }
            });
        });

        document.querySelectorAll('[data-schedule-tab]').forEach((btn) => {
            btn.addEventListener('click', () => {
                switchScheduleTab(Number(btn.dataset.scheduleTab));
            });
        });
    }

    function init() {
        state = parseHash();
        bindSidebar();
        applyVisibility();
        if (typeof onNavigateCallback === 'function') {
            onNavigateCallback(state, null);
        }

        window.addEventListener('hashchange', () => {
            const next = parseHash();
            navigate(next, { skipHash: true });
        });
    }

    window.AdminNav = {
        init,
        navigate,
        switchScheduleTab,
        getState: () => ({ ...state }),
        getLegacyLocation: getLegacyLocation,
        onNavigate: (fn) => {
            onNavigateCallback = fn;
        },
    };
})();
