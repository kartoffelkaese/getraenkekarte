#!/usr/bin/env node

/**
 * Health Monitor Script für Getränkekarte
 * Überwacht die Datenbankverbindung und startet die Anwendung bei Problemen neu
 */

const http = require('http');
const { exec } = require('child_process');

const config = {
    appUrl: 'http://localhost:3000',
    healthEndpoint: '/api/health',
    checkInterval: 30000, // 30 Sekunden
    maxFailures: 3, // Max 3 Fehler vor Restart
    pm2AppName: 'getraenkekarte'
};

let failureCount = 0;
let isRestarting = false;

console.log('🚀 Health Monitor gestartet');
console.log(`📊 Überwache: ${config.appUrl}${config.healthEndpoint}`);
console.log(`⏱️  Intervall: ${config.checkInterval / 1000}s`);
console.log(`🔄 Max Fehler vor Restart: ${config.maxFailures}`);

async function checkHealth() {
    if (isRestarting) {
        console.log('⏳ Restart läuft bereits, überspringe Check');
        return;
    }

    try {
        const response = await makeRequest(`${config.appUrl}${config.healthEndpoint}`);
        
        if (response.status === 'healthy') {
            console.log('✅ Health Check erfolgreich');
            failureCount = 0; // Reset bei Erfolg
        } else {
            throw new Error(`Unhealthy Status: ${response.status}`);
        }
    } catch (error) {
        failureCount++;
        console.error(`❌ Health Check Fehler (${failureCount}/${config.maxFailures}):`, error.message);
        
        if (failureCount >= config.maxFailures) {
            await restartApplication();
        }
    }
}

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (error) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function restartApplication() {
    if (isRestarting) {
        console.log('⏳ Restart bereits im Gange');
        return;
    }
    
    isRestarting = true;
    console.log('🔄 Starte Anwendung neu...');
    
    try {
        await new Promise((resolve, reject) => {
            exec(`pm2 restart ${config.pm2AppName}`, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ PM2 Restart Fehler:', error);
                    reject(error);
                } else {
                    console.log('✅ PM2 Restart erfolgreich');
                    console.log(stdout);
                    resolve();
                }
            });
        });
        
        // Warte 30 Sekunden nach Restart
        console.log('⏳ Warte 30s nach Restart...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        failureCount = 0; // Reset nach erfolgreichem Restart
        console.log('✅ Restart abgeschlossen, Monitoring fortgesetzt');
        
    } catch (error) {
        console.error('❌ Restart fehlgeschlagen:', error);
    } finally {
        isRestarting = false;
    }
}

// Starte Monitoring
setInterval(checkHealth, config.checkInterval);

// Sofortiger erster Check
checkHealth();

// Graceful Shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Health Monitor gestoppt');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Health Monitor gestoppt');
    process.exit(0);
});
