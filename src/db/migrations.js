const { safeQuery } = require('./pool');

// Erstelle die dishes-Tabelle, falls sie nicht existiert
function ensureDishesTable() {
    return safeQuery(`
        CREATE TABLE IF NOT EXISTS dishes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            description TEXT,
            image_path VARCHAR(255),
            sort_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE
        )
    `).catch(error => {
        console.error('Fehler beim Erstellen der dishes-Tabelle:', error);
    });
}

// Füge logo_size Spalte zur logo_settings Tabelle hinzu, falls sie nicht existiert
async function ensureLogoSizeColumn() {
    try {
        // Prüfe ob die Spalte bereits existiert
        const [columns] = await safeQuery(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'logo_settings' 
            AND COLUMN_NAME = 'logo_size'
        `);
        
        if (columns.length === 0) {
            // Spalte existiert nicht, füge sie hinzu
            await safeQuery(`
                ALTER TABLE logo_settings 
                ADD COLUMN logo_size VARCHAR(10) DEFAULT 'normal' 
                AFTER force_column_break
            `);
            console.log('✅ Spalte logo_size zur logo_settings Tabelle hinzugefügt');
        } else {
            console.log('✅ Spalte logo_size existiert bereits');
        }
    } catch (error) {
        console.error('Fehler beim Hinzufügen der logo_size Spalte:', error);
        // Nicht kritisch, weiterlaufen lassen
    }
}

// display_settings.location war ein ENUM('haupttheke','theke-hinten'). Die Jugendkarte funktionierte nur,
// weil MySQL den unbekannten Wert beim Schreiben und Lesen in '' umwandelte. Stellt die Spalte auf
// VARCHAR um (wie logo_settings.location) und gibt den Zeilen der Jugendkarte ihren echten Namen.
async function ensureDisplaySettingsLocation() {
    try {
        const [columns] = await safeQuery(`
            SELECT DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'display_settings'
            AND COLUMN_NAME = 'location'
        `);

        if (columns.length === 0 || columns[0].DATA_TYPE !== 'enum') {
            return;
        }

        await safeQuery('ALTER TABLE display_settings MODIFY location VARCHAR(50) NOT NULL');
        const [renamed] = await safeQuery("UPDATE display_settings SET location = 'jugendliche' WHERE location = ''");

        // Einmaliges Aufräumen: Einstellungen zu Getränken, Kategorien oder Werbungen, die es nicht mehr gibt
        const [orphans] = await safeQuery(`
            DELETE ds FROM display_settings ds
            LEFT JOIN drinks2 d ON ds.element_type = 'drink' AND d.id = ds.element_id
            LEFT JOIN categories c ON ds.element_type = 'category' AND c.id = ds.element_id
            LEFT JOIN ads a ON ds.element_type = 'ad' AND a.id = ds.element_id
            WHERE d.id IS NULL AND c.id IS NULL AND a.id IS NULL
        `);

        console.log(
            `✅ display_settings.location auf VARCHAR umgestellt (${renamed.affectedRows} Zeilen der Jugendkarte umbenannt, ` +
            `${orphans.affectedRows} verwaiste Zeilen entfernt)`
        );
    } catch (error) {
        console.error('Fehler bei der Umstellung von display_settings.location:', error);
        // Nicht kritisch, weiterlaufen lassen
    }
}

/** Schema-Anpassungen beim Serverstart (idempotent, Fehler sind nicht kritisch). */
function runStartupMigrations() {
    ensureDishesTable();
    ensureLogoSizeColumn();
    ensureDisplaySettingsLocation();
}

module.exports = {
    runStartupMigrations,
};
