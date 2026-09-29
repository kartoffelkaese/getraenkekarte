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


/** Schema-Anpassungen beim Serverstart (idempotent, Fehler sind nicht kritisch). */
function runStartupMigrations() {
    ensureDishesTable();
    ensureLogoSizeColumn();
}

module.exports = {
    runStartupMigrations,
};
