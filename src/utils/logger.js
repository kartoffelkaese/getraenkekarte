const isProduction = process.env.NODE_ENV === 'production';

function log(level, ...args) {
    if (level === 'debug' && isProduction) {
        return;
    }
    const fn = level === 'error' ? console.error : console.log;
    fn(...args);
}

module.exports = {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
};
