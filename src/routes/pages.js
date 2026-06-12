const path = require('path');
const { getPageCards } = require('../config/cards');

function registerPageRoutes(app) {
    const publicRoot = path.join(__dirname, '../../public');

    for (const card of getPageCards()) {
        app.get(`/${card.slug}`, (req, res) => {
            res.sendFile(card.html, { root: publicRoot });
        });
    }

    app.get('/', (req, res) => {
        res.redirect('/haupttheke');
    });
}

module.exports = {
    registerPageRoutes,
};
