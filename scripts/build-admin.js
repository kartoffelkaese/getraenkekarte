/**
 * Optional: bündelt Admin-Module zu admin.bundle.js (reines JavaScript, kein TypeScript).
 * Standard-Deploy nutzt weiterhin einzelne Skript-Tags; Bundle nur bei Bedarf.
 */
const esbuild = require('esbuild');
const path = require('path');

const outfile = path.join(__dirname, '../public/js/admin.bundle.js');

esbuild
    .build({
        entryPoints: [path.join(__dirname, '../public/js/admin/cards.js')],
        bundle: true,
        outfile,
        format: 'iife',
        platform: 'browser',
        target: ['es2020'],
    })
    .then(() => {
        console.log('Admin-Bundle erstellt:', outfile);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
