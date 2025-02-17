const basicAuth = require('basic-auth');
require('dotenv').config();

const auth = (req, res, next) => {
    const user = basicAuth(req);
    
    if (!user || user.name !== process.env.ADMIN_USER || user.pass !== process.env.ADMIN_PASSWORD) {
        res.set('WWW-Authenticate', 'Basic realm="Admin-Bereich"');
        return res.status(401).send('Authentifizierung erforderlich');
    }
    
    next();
};

module.exports = auth; 