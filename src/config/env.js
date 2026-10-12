const path = require('path');
const { ROOT_DIR } = require('./paths');

// .env immer aus dem Projektordner laden – unabhängig vom Startverzeichnis
require('dotenv').config({ path: path.join(ROOT_DIR, '.env'), quiet: true });
