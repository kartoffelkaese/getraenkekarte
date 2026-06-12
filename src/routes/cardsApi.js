const { getCardsForApi } = require('../config/cards');

function registerCardsApiRoutes(app) {
    app.get('/api/cards', (req, res) => {
        res.json(getCardsForApi());
    });
}

module.exports = {
    registerCardsApiRoutes,
};
