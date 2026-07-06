/**
 * Zentrale Karten-Registry – einzige Quelle für Slugs, Labels und Metadaten.
 */
const CARDS = [
    { slug: 'haupttheke', label: 'Haupttheke', html: 'haupttheke.html', scheduleable: true, overviewSelectable: true, presetLocation: true, inLinks: true, linkLabel: 'Haupttheke' },
    { slug: 'italienische-nacht', label: 'Italienische Nacht', html: 'italienische-nacht.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Italienische Nacht' },
    { slug: 'weihnachten', label: 'Weihnachtskarte', html: 'weihnachten.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Weihnachtskarte' },
    { slug: 'theke-hinten', label: 'Theke Hinten', html: 'theke-hinten.html', scheduleable: true, overviewSelectable: true, presetLocation: true, inLinks: true, linkLabel: 'Theke Hinten' },
    { slug: 'theke-hinten-bilder', label: 'Theke Hinten Bilder', html: 'theke-hinten-bilder.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Theke Hinten Bilder' },
    { slug: 'theke-hinten-bilder-dunkel', label: 'Theke Hinten Bilder (dunkel)', html: 'theke-hinten-bilder-dunkel.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Theke Hinten Bilder (dunkel)' },
    { slug: 'theke-hinten-2', label: 'Theke Hinten (2 Spalten)', html: 'theke-hinten-2.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Theke Hinten (2 Spalten)' },
    { slug: 'hochzeit', label: 'Hochzeitskarte', html: 'hochzeit.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Hochzeitskarte' },
    { slug: 'hochzeit-dunkel', label: 'Hochzeitskarte (dunkel)', html: 'hochzeit-dunkel.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Hochzeitskarte (dunkel)' },
    { slug: 'hochzeit-3spalten', label: 'Hochzeitskarte (3 Spalten)', html: 'hochzeit-3spalten.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Hochzeitskarte (3 Spalten)' },
    { slug: 'hochzeit-dunkel-3spalten', label: 'Hochzeitskarte dunkel (3 Spalten)', html: 'hochzeit-dunkel-3spalten.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Hochzeitskarte dunkel (3 Spalten)' },
    { slug: 'jugendliche', label: 'Jugendkarte', html: 'jugendliche.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Jugendkarte' },
    { slug: 'speisekarte', label: 'Speisekarte', html: 'speisekarte.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Speisekarte' },
    { slug: 'bilder', label: 'Bilder', html: 'bilder.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Bilder' },
    { slug: 'overview-1', label: 'Overview 1', html: 'overview-1.html', scheduleable: true, overviewSelectable: false, presetLocation: false, inLinks: true, linkLabel: 'Overview 1' },
    { slug: 'overview-2', label: 'Overview 2', html: 'overview-2.html', scheduleable: true, overviewSelectable: false, presetLocation: false, inLinks: true, linkLabel: 'Overview 2' },
    { slug: 'schedule-1', label: 'Schedule 1', html: 'schedule-1.html', scheduleable: true, overviewSelectable: false, presetLocation: false, inLinks: true, linkLabel: 'Schedule 1' },
    { slug: 'schedule-2', label: 'Schedule 2', html: 'schedule-2.html', scheduleable: true, overviewSelectable: false, presetLocation: false, inLinks: true, linkLabel: 'Schedule 2' },
    { slug: 'cycle', label: 'Cycle-Haupttheke', html: 'cycle.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Cycle (Haupttheke ↔ Speisekarte)' },
    { slug: 'cycle-jugend', label: 'Cycle-Jugend', html: 'cycle-jugend.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Cycle Jugend' },
    { slug: 'screensaver', label: 'Screensaver', html: 'screensaver.html', scheduleable: true, overviewSelectable: true, presetLocation: false, inLinks: true, linkLabel: 'Screensaver' },
];

const VALID_LOCATIONS = new Set(CARDS.map((c) => c.slug));
/** Gleiche Slugs wie bisher: alle registrierten Karten (inkl. Schedule/Overview als Ziel). */
const VALID_SCHEDULE_CARDS = new Set(CARDS.map((c) => c.slug));

function getCardsForApi() {
    return CARDS.map(({ slug, label, scheduleable, overviewSelectable, inLinks, linkLabel }) => ({
        slug,
        label,
        scheduleable,
        overviewSelectable,
        inLinks,
        linkLabel: linkLabel || label,
        path: `/${slug}`,
    }));
}

function getPageCards() {
    return CARDS.filter((c) => c.html);
}

function getPresetLocations() {
    return CARDS.filter((c) => c.presetLocation).map((c) => c.slug);
}

module.exports = {
    CARDS,
    VALID_LOCATIONS,
    VALID_SCHEDULE_CARDS,
    getCardsForApi,
    getPageCards,
    getPresetLocations,
};
