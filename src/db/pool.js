const mysql = require('mysql2');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
    keepAliveInitialDelay: 0,
    enableKeepAlive: true,
    connectTimeout: 10000,
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : false,
};

const db = mysql.createPool(dbConfig).promise();

const connectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    failedConnections: 0,
    lastError: null,
    lastErrorTime: null,
};

db.on('connection', (connection) => {
    connectionStats.totalConnections++;
    connectionStats.activeConnections++;
    console.log(`DB verbunden: thread ${connection.threadId}`);
});

db.on('error', (err) => {
    connectionStats.failedConnections++;
    connectionStats.lastError = err.message;
    connectionStats.lastErrorTime = new Date().toISOString();
    console.error('Datenbank Pool Fehler:', err.message);
});

async function safeQuery(sql, params = []) {
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
        try {
            return await db.query(sql, params);
        } catch (error) {
            retries++;
            console.error(`Datenbankabfrage Fehler (${retries}/${maxRetries}):`, error.message);

            if (
                error.code === 'ECONNREFUSED' ||
                error.code === 'PROTOCOL_CONNECTION_LOST' ||
                error.message.includes('connection is in closed state') ||
                error.message.includes("Can't add new command when connection is in closed state")
            ) {
                if (retries < maxRetries) {
                    await new Promise((resolve) => setTimeout(resolve, retries * 1000));
                    continue;
                }
            }
            throw error;
        }
    }
}

setInterval(async () => {
    try {
        await safeQuery('SELECT 1 as heartbeat');
    } catch (error) {
        console.error('Datenbank Heartbeat fehlgeschlagen:', error.message);
    }
}, 5 * 60 * 1000);

module.exports = {
    db,
    safeQuery,
    connectionStats,
};
