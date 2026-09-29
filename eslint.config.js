const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: ['node_modules/**', 'package-lock.json'],
    },
    {
        files: ['src/**/*.js', 'scripts/**/*.js', 'tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'commonjs',
            globals: {
                ...globals.node,
            },
        },
        rules: {
            'no-undef': 'error',
            'no-var': 'error',
            eqeqeq: ['error', 'always', { null: 'ignore' }],
            'no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
        },
    },
    {
        files: ['public/js/**/*.js'],
        ignores: ['public/js/events.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'script',
            globals: {
                ...globals.browser,
                io: 'readonly',
                bootstrap: 'readonly',
                // Gemeinsame Helfer aus public/js/utils.js (per <script> eingebunden)
                formatPrice: 'readonly',
                escapeHtml: 'readonly',
                escapeAttr: 'readonly',
                safeAssetUrl: 'readonly',
                // aus public/js/images-player.js
                initImagesPlayer: 'readonly',
            },
        },
        rules: {
            'no-undef': 'error',
            'no-var': 'warn',
            eqeqeq: ['warn', 'always', { null: 'ignore' }],
            'no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
            ],
        },
    },
    {
        files: ['public/js/events.js'],
        languageOptions: {
            ecmaVersion: 2024,
            sourceType: 'module',
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        },
    },
    {
        files: [
            'public/js/admin/**/*.js',
            'public/js/utils.js',
        ],
        rules: {
            // Von HTML onclick / anderen Skript-Tags referenziert
            'no-unused-vars': 'off',
            // Admin-Skripte teilen sich Funktionen und Zustand über den globalen Scope
            'no-undef': 'off',
        },
    },
    eslintConfigPrettier,
];
