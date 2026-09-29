/* Admin – Schedule 1/2: Regeln und Status.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

let scheduleConfig = { defaultCard: 'cycle-1', rules: [] };

let schedule2Config = { defaultCard: 'cycle-1', rules: [] };

let scheduleStatusInterval = null;

let schedule2StatusInterval = null;

let currentScheduleTab = 1; // 1 oder 2

// Wechsle zwischen Schedule 1 und 2 Tabs
function switchScheduleTab(scheduleNumber) {
    if (window.AdminNav) {
        AdminNav.switchScheduleTab(scheduleNumber);
        return;
    }
    currentScheduleTab = scheduleNumber;
    if (scheduleNumber === 1) {
        loadScheduleConfig();
        stopSchedule2StatusUpdates();
    } else {
        loadSchedule2Config();
        stopScheduleStatusUpdates();
    }
}

// Lade Schedule-Konfiguration
async function loadScheduleConfig() {
    if (currentLocation === 'schedule-1') {
        try {
            if (window.AdminCards) {
                const cards = await window.AdminCards.fetchCards();
                window.AdminCards.populateCardSelects(cards);
            }

            const response = await fetch('/api/schedule-config');
            scheduleConfig = await response.json();
            
            // Aktualisiere Default-Karte Dropdown
            const defaultCardSelect = document.getElementById('defaultCardSelect');
            if (defaultCardSelect) {
                defaultCardSelect.value = scheduleConfig.defaultCard;
            }
            
            // Lade Regeln-Liste
            displayRulesList();
            
            // Lade aktuelle Karte
            await updateScheduleStatus();
            
            // Starte periodische Status-Aktualisierung
            startScheduleStatusUpdates();
            
        } catch (error) {
            console.error('Fehler beim Laden der Schedule-Konfiguration:', error);
            showNotification('Fehler beim Laden der Schedule-Konfiguration', 'error');
        }
    } else {
        // Stoppe Status-Updates wenn nicht im Schedule-Tab
        stopScheduleStatusUpdates();
    }
}

// Lade Schedule-2-Konfiguration
async function loadSchedule2Config() {
    if (currentLocation === 'schedule-1') {
        try {
            if (window.AdminCards) {
                const cards = await window.AdminCards.fetchCards();
                window.AdminCards.populateCardSelects(cards);
            }

            const response = await fetch('/api/schedule-2-config');
            schedule2Config = await response.json();
            
            // Aktualisiere Default-Karte Dropdown
            const defaultCardSelect2 = document.getElementById('defaultCardSelect2');
            if (defaultCardSelect2) {
                defaultCardSelect2.value = schedule2Config.defaultCard;
            }
            
            // Lade Regeln-Liste
            displayRulesList2();
            
            // Lade aktuelle Karte
            await updateSchedule2Status();
            
            // Starte periodische Status-Aktualisierung
            startSchedule2StatusUpdates();
            
        } catch (error) {
            console.error('Fehler beim Laden der Schedule-2-Konfiguration:', error);
            showNotification('Fehler beim Laden der Schedule-2-Konfiguration', 'error');
        }
    } else {
        // Stoppe Status-Updates wenn nicht im Schedule-Tab
        stopSchedule2StatusUpdates();
    }
}

// Aktualisiere Schedule-Status im Admin-Panel
async function updateScheduleStatus() {
    if (currentLocation !== 'schedule-1') return;
    
    try {
        const response = await fetch('/api/schedule-config/current');
        const data = await response.json();
        
        // Aktualisiere aktuelle Karte
        const currentCardElement = document.getElementById('currentScheduleCard');
        if (currentCardElement) {
            currentCardElement.textContent = data.currentCard || 'Unbekannt';
        }
        
        // Aktualisiere letzte Aktualisierung
        const lastUpdateElement = document.getElementById('scheduleLastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Aktualisiere nächste Prüfung
        const nextCheckElement = document.getElementById('nextScheduleCheck');
        if (nextCheckElement) {
            const now = new Date();
            const nextCheck = new Date(now.getTime() + 60000); // +1 Minute
            nextCheckElement.textContent = nextCheck.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Schedule-Status:', error);
    }
}

// Starte periodische Status-Updates
function startScheduleStatusUpdates() {
    if (scheduleStatusInterval) {
        clearInterval(scheduleStatusInterval);
    }
    
    // Sofortige erste Aktualisierung
    updateScheduleStatus();
    
    // Dann alle 30 Sekunden
    scheduleStatusInterval = setInterval(updateScheduleStatus, 30000);
    console.log('Schedule-Status-Updates gestartet (30s Intervall)');
}

// Stoppe periodische Status-Updates
function stopScheduleStatusUpdates() {
    if (scheduleStatusInterval) {
        clearInterval(scheduleStatusInterval);
        scheduleStatusInterval = null;
        console.log('Schedule-Status-Updates gestoppt');
    }
}

// Zeige Regeln-Liste an
function displayRulesList() {
    const rulesList = document.getElementById('rulesList');
    if (!rulesList) return;

    if (scheduleConfig.rules.length === 0) {
        rulesList.innerHTML = `
            <div class="admin-empty-state">
                <i class="bi bi-calendar-x" style="font-size: 2rem;"></i>
                <p class="mt-2 mb-3">Keine Regeln definiert</p>
                <button class="btn btn-primary" onclick="showAddRuleModal()">
                    <i class="bi bi-plus-circle"></i> Erste Regel hinzufügen
                </button>
            </div>
        `;
        return;
    }

    let html = '<div class="row">';
    
    scheduleConfig.rules.forEach((rule, index) => {
        const ruleType = rule.type === 'weekly' ? 'Wöchentlich' : 'Datum';
        const ruleDescription = getRuleDescription(rule);
        const ruleColor = rule.type === 'weekly' ? 'primary' : 'success';
        const ruleCardClass = rule.type === 'weekly' ? 'admin-rule-card--weekly' : 'admin-rule-card--date';
        
        const cardDisplay = rule.card;
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card admin-rule-card ${ruleCardClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="card-title">
                                    <span class="badge bg-${ruleColor}">${ruleType}</span>
                                    ${cardDisplay}
                                </h6>
                                <p class="card-text small">${ruleDescription}</p>
                                <small class="text-muted">Zeit: ${rule.startTime} - ${rule.endTime}</small>
                            </div>
                            <div class="btn-group-vertical btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="editRule('${rule.id}')" title="Bearbeiten">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteRule('${rule.id}')" title="Löschen">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    rulesList.innerHTML = html;
}

// Generiere Regel-Beschreibung
function getRuleDescription(rule) {
    if (rule.type === 'weekly') {
        const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
        const selectedDays = rule.days.map(day => dayNames[day]).join(', ');
        return `Tage: ${selectedDays}`;
    } else if (rule.type === 'date') {
        if (rule.endDate && rule.endDate !== rule.startDate) {
            return `Datum: ${rule.startDate} - ${rule.endDate}`;
        } else {
            return `Datum: ${rule.startDate}`;
        }
    }
    return 'Unbekannter Typ';
}

// Zeige Add Rule Modal
async function showAddRuleModal() {
    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Neue Schedule-Regel';
    document.getElementById('ruleId').value = '';
    document.getElementById('ruleScheduleNumber').value = '1'; // Markiere als Schedule-1
    clearRuleForm();
    
    modal.show();
}

// Bearbeite Regel
async function editRule(ruleId) {
    const rule = scheduleConfig.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Schedule-Regel bearbeiten';
    document.getElementById('ruleId').value = ruleId;
    document.getElementById('ruleScheduleNumber').value = '1'; // Markiere als Schedule-1
    
    // Fülle Formular
    document.getElementById('ruleType').value = rule.type;
    toggleRuleFields();
    
    if (rule.type === 'weekly') {
        rule.days.forEach(day => {
            const checkbox = document.getElementById(`day${day}`);
            if (checkbox) checkbox.checked = true;
        });
    } else if (rule.type === 'date') {
        document.getElementById('startDate').value = rule.startDate;
        document.getElementById('endDate').value = rule.endDate || '';
    }
    
    document.getElementById('startTime').value = rule.startTime;
    document.getElementById('endTime').value = rule.endTime;
    document.getElementById('ruleCard').value = rule.card;
    
    modal.show();
}

// Lösche Regel
async function deleteRule(ruleId) {
    if (!confirm('Möchten Sie diese Regel wirklich löschen?')) return;

    try {
        const updatedRules = scheduleConfig.rules.filter(r => r.id !== ruleId);
        await saveScheduleConfig({ ...scheduleConfig, rules: updatedRules });
        showNotification('Regel gelöscht', 'success');
        displayRulesList();
    } catch (error) {
        console.error('Fehler beim Löschen der Regel:', error);
        showNotification('Fehler beim Löschen der Regel', 'error');
    }
}

// Speichere Regel
async function saveRule() {
    const ruleId = document.getElementById('ruleId').value;
    const ruleType = document.getElementById('ruleType').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const card = document.getElementById('ruleCard').value;

    // Validierung
    if (!card) {
        showNotification('Bitte wählen Sie eine Karte aus', 'error');
        return;
    }

    if (startTime >= endTime) {
        showNotification('End-Zeit muss nach Start-Zeit liegen', 'error');
        return;
    }

    let rule = {
        id: ruleId || `rule-${Date.now()}`,
        type: ruleType,
        startTime,
        endTime,
        card
    };

    if (ruleType === 'weekly') {
        const selectedDays = [];
        for (let i = 0; i < 7; i++) {
            const checkbox = document.getElementById(`day${i}`);
            if (checkbox && checkbox.checked) {
                selectedDays.push(i);
            }
        }
        if (selectedDays.length === 0) {
            showNotification('Bitte wählen Sie mindestens einen Wochentag aus', 'error');
            return;
        }
        rule.days = selectedDays;
    } else if (ruleType === 'date') {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        if (!startDate) {
            showNotification('Bitte wählen Sie ein Start-Datum aus', 'error');
            return;
        }
        
        if (endDate && endDate < startDate) {
            showNotification('End-Datum muss nach Start-Datum liegen', 'error');
            return;
        }
        
        rule.startDate = startDate;
        if (endDate) rule.endDate = endDate;
    }

    try {
        const scheduleNumber = document.getElementById('ruleScheduleNumber')?.value || '1';
        const config = scheduleNumber === '2' ? schedule2Config : scheduleConfig;
        let updatedRules;
        
        if (ruleId) {
            // Bearbeite bestehende Regel
            updatedRules = config.rules.map(r => r.id === ruleId ? rule : r);
        } else {
            // Füge neue Regel hinzu
            updatedRules = [...config.rules, rule];
        }

        if (scheduleNumber === '2') {
            await saveSchedule2Config({ ...schedule2Config, rules: updatedRules });
        } else {
            await saveScheduleConfig({ ...scheduleConfig, rules: updatedRules });
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('ruleModal'));
        modal.hide();
        
        showNotification(ruleId ? 'Regel aktualisiert' : 'Regel hinzugefügt', 'success');
        
        if (scheduleNumber === '2') {
            displayRulesList2();
        } else {
            displayRulesList();
        }
        
    } catch (error) {
        console.error('Fehler beim Speichern der Regel:', error);
        showNotification('Fehler beim Speichern der Regel', 'error');
    }
}

// Speichere Schedule-Konfiguration
async function saveScheduleConfig(config) {
    try {
        const response = await fetch('/api/schedule-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }

        scheduleConfig = config;
        return await response.json();
        
    } catch (error) {
        console.error('Fehler beim Speichern der Schedule-Konfiguration:', error);
        throw error;
    }
}

// Speichere Default-Karte
async function saveDefaultCard() {
    const defaultCard = document.getElementById('defaultCardSelect').value;
    
    try {
        await saveScheduleConfig({ ...scheduleConfig, defaultCard });
        showNotification('Standard-Karte gespeichert', 'success');
    } catch (error) {
        console.error('Fehler beim Speichern der Standard-Karte:', error);
        showNotification('Fehler beim Speichern der Standard-Karte', 'error');
    }
}

// Force Schedule Reload
async function forceScheduleReload() {
    try {
        socket.emit('forceScheduleReload');
        showNotification('Schedule wird neu gestartet', 'info');
    } catch (error) {
        console.error('Fehler beim Schedule Reload:', error);
        showNotification('Fehler beim Schedule Reload', 'error');
    }
}

// Toggle Regel-Felder basierend auf Typ
function toggleRuleFields() {
    const ruleType = document.getElementById('ruleType').value;
    const weeklyFields = document.getElementById('weeklyFields');
    const dateFields = document.getElementById('dateFields');
    
    if (ruleType === 'weekly') {
        weeklyFields.style.display = 'block';
        dateFields.style.display = 'none';
    } else if (ruleType === 'date') {
        weeklyFields.style.display = 'none';
        dateFields.style.display = 'block';
    }
}

// Leere Regel-Formular
function clearRuleForm() {
    document.getElementById('ruleType').value = 'weekly';
    toggleRuleFields();
    
    // Leere alle Checkboxen
    for (let i = 0; i < 7; i++) {
        const checkbox = document.getElementById(`day${i}`);
        if (checkbox) checkbox.checked = false;
    }
    
    // Leere Datums-Felder
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    
    // Setze Standard-Zeiten
    document.getElementById('startTime').value = '00:00';
    document.getElementById('endTime').value = '23:59';
    
    // Setze Standard-Karte
    document.getElementById('ruleCard').value = 'cycle-1';
}

// Socket.IO Event-Listener für Schedule
socket.on('scheduleConfigChanged', (data) => {
    console.log('Schedule-Konfiguration geändert:', data);
    scheduleConfig = data;
    if (currentLocation === 'schedule-1' && currentScheduleTab === 1) {
        displayRulesList();
        updateScheduleStatus(); // Aktualisiere Status bei Konfigurationsänderungen
    }
});

socket.on('schedule2ConfigChanged', (data) => {
    console.log('Schedule-2-Konfiguration geändert:', data);
    schedule2Config = data;
    if (currentLocation === 'schedule-1' && currentScheduleTab === 2) {
        displayRulesList2();
        updateSchedule2Status(); // Aktualisiere Status bei Konfigurationsänderungen
    }
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    stopScheduleStatusUpdates();
    stopSchedule2StatusUpdates();
});

// === Schedule-2 Management ===

// Aktualisiere Schedule-2-Status im Admin-Panel
async function updateSchedule2Status() {
    if (currentLocation !== 'schedule-1' || currentScheduleTab !== 2) return;
    
    try {
        const response = await fetch('/api/schedule-2-config/current');
        const data = await response.json();
        
        // Aktualisiere aktuelle Karte
        const currentCardElement = document.getElementById('currentSchedule2Card');
        if (currentCardElement) {
            currentCardElement.textContent = data.currentCard || 'Unbekannt';
        }
        
        // Aktualisiere letzte Aktualisierung
        const lastUpdateElement = document.getElementById('schedule2LastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        }
        
        // Aktualisiere nächste Prüfung
        const nextCheckElement = document.getElementById('nextSchedule2Check');
        if (nextCheckElement) {
            const now = new Date();
            const nextCheck = new Date(now.getTime() + 60000); // +1 Minute
            nextCheckElement.textContent = nextCheck.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Schedule-2-Status:', error);
    }
}

// Starte periodische Status-Updates für Schedule-2
function startSchedule2StatusUpdates() {
    if (schedule2StatusInterval) {
        clearInterval(schedule2StatusInterval);
    }
    
    // Sofortige erste Aktualisierung
    updateSchedule2Status();
    
    // Dann alle 30 Sekunden
    schedule2StatusInterval = setInterval(updateSchedule2Status, 30000);
    console.log('Schedule-2-Status-Updates gestartet (30s Intervall)');
}

// Stoppe periodische Status-Updates für Schedule-2
function stopSchedule2StatusUpdates() {
    if (schedule2StatusInterval) {
        clearInterval(schedule2StatusInterval);
        schedule2StatusInterval = null;
        console.log('Schedule-2-Status-Updates gestoppt');
    }
}

// Zeige Regeln-Liste für Schedule-2 an
function displayRulesList2() {
    const rulesList = document.getElementById('rulesList2');
    if (!rulesList) return;

    if (schedule2Config.rules.length === 0) {
        rulesList.innerHTML = `
            <div class="admin-empty-state">
                <i class="bi bi-calendar-x" style="font-size: 2rem;"></i>
                <p class="mt-2 mb-3">Keine Regeln definiert</p>
                <button class="btn btn-primary" onclick="showAddRuleModal2()">
                    <i class="bi bi-plus-circle"></i> Erste Regel hinzufügen
                </button>
            </div>
        `;
        return;
    }

    let html = '<div class="row">';
    
    schedule2Config.rules.forEach((rule, index) => {
        const ruleType = rule.type === 'weekly' ? 'Wöchentlich' : 'Datum';
        const ruleDescription = getRuleDescription(rule);
        const ruleColor = rule.type === 'weekly' ? 'primary' : 'success';
        const ruleCardClass = rule.type === 'weekly' ? 'admin-rule-card--weekly' : 'admin-rule-card--date';
        
        const cardDisplay = rule.card;
        
        html += `
            <div class="col-md-6 mb-3">
                <div class="card admin-rule-card ${ruleCardClass}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h6 class="card-title">
                                    <span class="badge bg-${ruleColor}">${ruleType}</span>
                                    ${cardDisplay}
                                </h6>
                                <p class="card-text small">${ruleDescription}</p>
                                <small class="text-muted">Zeit: ${rule.startTime} - ${rule.endTime}</small>
                            </div>
                            <div class="btn-group-vertical btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="editRule2('${rule.id}')" title="Bearbeiten">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteRule2('${rule.id}')" title="Löschen">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    rulesList.innerHTML = html;
}

// Zeige Add Rule Modal für Schedule-2
async function showAddRuleModal2() {
    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Neue Schedule-2-Regel';
    document.getElementById('ruleId').value = '';
    document.getElementById('ruleScheduleNumber').value = '2'; // Markiere als Schedule-2
    clearRuleForm();
    
    modal.show();
}

// Bearbeite Regel für Schedule-2
async function editRule2(ruleId) {
    const rule = schedule2Config.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = 'Schedule-2-Regel bearbeiten';
    document.getElementById('ruleId').value = ruleId;
    document.getElementById('ruleScheduleNumber').value = '2'; // Markiere als Schedule-2
    
    // Fülle Formular
    document.getElementById('ruleType').value = rule.type;
    toggleRuleFields();
    
    if (rule.type === 'weekly') {
        rule.days.forEach(day => {
            const checkbox = document.getElementById(`day${day}`);
            if (checkbox) checkbox.checked = true;
        });
    } else if (rule.type === 'date') {
        document.getElementById('startDate').value = rule.startDate;
        document.getElementById('endDate').value = rule.endDate || '';
    }
    
    document.getElementById('startTime').value = rule.startTime;
    document.getElementById('endTime').value = rule.endTime;
    document.getElementById('ruleCard').value = rule.card;
    
    modal.show();
}

// Lösche Regel für Schedule-2
async function deleteRule2(ruleId) {
    if (!confirm('Möchten Sie diese Regel wirklich löschen?')) return;

    try {
        const updatedRules = schedule2Config.rules.filter(r => r.id !== ruleId);
        await saveSchedule2Config({ ...schedule2Config, rules: updatedRules });
        showNotification('Regel gelöscht', 'success');
        displayRulesList2();
    } catch (error) {
        console.error('Fehler beim Löschen der Regel:', error);
        showNotification('Fehler beim Löschen der Regel', 'error');
    }
}

// Speichere Schedule-2-Konfiguration
async function saveSchedule2Config(config) {
    try {
        const response = await fetch('/api/schedule-2-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }

        schedule2Config = config;
        return await response.json();
        
    } catch (error) {
        console.error('Fehler beim Speichern der Schedule-2-Konfiguration:', error);
        throw error;
    }
}

// Speichere Default-Karte für Schedule-2
async function saveDefaultCard2() {
    const defaultCard = document.getElementById('defaultCardSelect2').value;
    
    try {
        await saveSchedule2Config({ ...schedule2Config, defaultCard });
        showNotification('Standard-Karte gespeichert', 'success');
    } catch (error) {
        console.error('Fehler beim Speichern der Standard-Karte:', error);
        showNotification('Fehler beim Speichern der Standard-Karte', 'error');
    }
}

// Force Schedule-2 Reload
async function forceSchedule2Reload() {
    try {
        socket.emit('forceSchedule2Reload');
        showNotification('Schedule-2 wird neu gestartet', 'info');
    } catch (error) {
        console.error('Fehler beim Schedule-2 Reload:', error);
        showNotification('Fehler beim Schedule-2 Reload', 'error');
    }
}
