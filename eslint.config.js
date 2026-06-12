const globals = require('globals');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
    {
        ignores: ['node_modules/**', 'package-lock.json', 'public/presets/**'],
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
            },
        },
        rules: {
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
            'public/js/admin.js',
            'public/js/admin/**/*.js',
            'public/js/utils.js',
        ],
        rules: {
            // Von HTML onclick / anderen Skript-Tags referenziert
            'no-unused-vars': 'off',
        },
    },
    eslintConfigPrettier,
];
