const { getCardsForApi, getCycleSelectableCards, getCycleSelectableSpeisekarten } = require('../config/cards');

function registerCardsApiRoutes(app) {
    app.get('/api/cards', (req, res) => {
        res.json(getCardsForApi());
    });

    app.get('/api/cycle-selectable-cards', (req, res) => {
        res.json(getCycleSelectableCards().map(({ slug, label, linkLabel }) => ({
            slug,
            label,
            linkLabel: linkLabel || label,
            path: `/${slug}`,
        })));
    });

    app.get('/api/cycle-selectable-speisekarten', (req, res) => {
        res.json(getCycleSelectableSpeisekarten().map(({ slug, label, linkLabel }) => ({
            slug,
            label,
            linkLabel: linkLabel || label,
            path: `/${slug}`,
        })));
    });
}

module.exports = {
    registerCardsApiRoutes,
};
