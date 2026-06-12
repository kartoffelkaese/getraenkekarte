/**
 * Karten-Registry im Admin: lädt /api/cards und befüllt Dropdowns + Links-Tabelle.
 */
(function () {
    let cardsCache = null;

    async function fetchCards() {
        if (cardsCache) {
            return cardsCache;
        }
        const response = await fetch('/api/cards');
        if (!response.ok) {
            throw new Error('Kartenliste konnte nicht geladen werden');
        }
        cardsCache = await response.json();
        return cardsCache;
    }

    function fillSelect(select, cards, selectedValue) {
        if (!select) return;
        const keepEmpty = select.dataset.keepEmpty === 'true';
        select.innerHTML = keepEmpty ? '<option value="">Kein Preset ausgewählt</option>' : '';
        cards.forEach((card) => {
            const option = document.createElement('option');
            option.value = card.slug;
            option.textContent = card.label;
            select.appendChild(option);
        });
        if (selectedValue && [...select.options].some((o) => o.value === selectedValue)) {
            select.value = selectedValue;
        }
    }

    function populateCardSelects(cards) {
        const overviewCards = cards.filter((c) => c.overviewSelectable);
        const scheduleCards = cards.filter((c) => c.scheduleable);

        ['overview1Card', 'overview2Card'].forEach((id) => {
            fillSelect(document.getElementById(id), overviewCards, document.getElementById(id)?.value);
        });

        [
            'defaultCardSelect',
            'defaultCardSelect2',
            'ruleCard',
        ].forEach((id) => {
            fillSelect(document.getElementById(id), scheduleCards, document.getElementById(id)?.value);
        });
    }

    function renderLinksTable(cards) {
        const tbody = document.getElementById('linksTableBody');
        if (!tbody) return;

        const baseUrl = window.location.origin;
        const linkCards = [
            { path: '/', linkLabel: 'Haupttheke (Start)', label: 'Haupttheke (Start)' },
            ...cards.filter((c) => c.inLinks),
        ];

        tbody.innerHTML = linkCards
            .map((card) => {
                const url = baseUrl + card.path;
                const name = card.linkLabel || card.label;
                return `<tr>
            <td>${escapeHtml(name)}</td>
            <td><code class="text-info">${escapeHtml(url)}</code></td>
            <td>
                <a href="${escapeHtml(url)}" target="_blank" class="btn btn-sm btn-outline-primary me-1" title="Öffnen">
                    <i class="bi bi-box-arrow-up-right"></i>
                </a>
                <button class="btn btn-sm btn-outline-secondary" onclick="copyLinkToClipboard(this.dataset.url)" data-url="${escapeHtml(url)}" title="Kopieren">
                    <i class="bi bi-clipboard"></i>
                </button>
            </td>
        </tr>`;
            })
            .join('');
    }

    async function initAdminCards() {
        try {
            const cards = await fetchCards();
            populateCardSelects(cards);
            renderLinksTable(cards);
        } catch (error) {
            console.error('Admin-Karteninitialisierung fehlgeschlagen:', error);
        }
    }

    window.AdminCards = {
        fetchCards,
        initAdminCards,
        populateCardSelects,
        renderLinksTable,
        invalidateCache: () => {
            cardsCache = null;
        },
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAdminCards);
    } else {
        initAdminCards();
    }
})();
