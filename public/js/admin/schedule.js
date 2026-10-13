/* Admin – Schedule 1/2: Regeln und Status.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Beide Schedules nutzen dieselbe Logik; sie unterscheiden sich nur in API, Events und Element-IDs.
// fnSuffix: Endung der onclick-Funktionen in admin-v2.html (editRule / editRule2 usw.)
const SCHEDULES = {
    1: {
        label: 'Schedule',
        api: '/api/schedule-config',
        changedEvent: 'scheduleConfigChanged',
        reloadEvent: 'forceScheduleReload',
        fnSuffix: '',
        // Status von Schedule 1 wird auch aktualisiert, wenn Tab 2 offen ist (bisheriges Verhalten)
        statusOnlyOnOwnTab: false,
        ids: {
            defaultCard: 'defaultCardSelect',
            rulesList: 'rulesList',
            currentCard: 'currentScheduleCard',
            lastUpdate: 'scheduleLastUpdate',
            nextCheck: 'nextScheduleCheck',
        },
        config: { defaultCard: 'cycle-1', rules: [] },
        statusInterval: null,
    },
    2: {
        label: 'Schedule-2',
        api: '/api/schedule-2-config',
        changedEvent: 'schedule2ConfigChanged',
        reloadEvent: 'forceSchedule2Reload',
        fnSuffix: '2',
        statusOnlyOnOwnTab: true,
        ids: {
            defaultCard: 'defaultCardSelect2',
            rulesList: 'rulesList2',
            currentCard: 'currentSchedule2Card',
            lastUpdate: 'schedule2LastUpdate',
            nextCheck: 'nextSchedule2Check',
        },
        config: { defaultCard: 'cycle-1', rules: [] },
        statusInterval: null,
    },
};

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
        stopScheduleStatusUpdatesFor(2);
    } else {
        loadSchedule2Config();
        stopScheduleStatusUpdatesFor(1);
    }
}

// Lade Schedule-Konfiguration
async function loadScheduleConfigFor(number) {
    const schedule = SCHEDULES[number];
    if (currentLocation === 'schedule-1') {
        try {
            if (window.AdminCards) {
                const cards = await window.AdminCards.fetchCards();
                window.AdminCards.populateCardSelects(cards);
            }

            const response = await fetch(schedule.api);
            schedule.config = await response.json();

            // Aktualisiere Default-Karte Dropdown
            const defaultCardSelect = document.getElementById(schedule.ids.defaultCard);
            if (defaultCardSelect) {
                defaultCardSelect.value = schedule.config.defaultCard;
            }

            // Lade Regeln-Liste
            displayRulesListFor(number);

            // Lade aktuelle Karte
            await updateScheduleStatusFor(number);

            // Starte periodische Status-Aktualisierung
            startScheduleStatusUpdatesFor(number);

        } catch (error) {
            console.error(`Fehler beim Laden der ${schedule.label}-Konfiguration:`, error);
            showNotification(`Fehler beim Laden der ${schedule.label}-Konfiguration`, 'error');
        }
    } else {
        // Stoppe Status-Updates wenn nicht im Schedule-Tab
        stopScheduleStatusUpdatesFor(number);
    }
}

// Aktualisiere Schedule-Status im Admin-Panel
async function updateScheduleStatusFor(number) {
    const schedule = SCHEDULES[number];
    if (currentLocation !== 'schedule-1') return;
    if (schedule.statusOnlyOnOwnTab && currentScheduleTab !== number) return;

    try {
        const response = await fetch(`${schedule.api}/current`);
        const data = await response.json();

        // Aktualisiere aktuelle Karte
        const currentCardElement = document.getElementById(schedule.ids.currentCard);
        if (currentCardElement) {
            currentCardElement.textContent = data.currentCard || 'Unbekannt';
        }

        // Aktualisiere letzte Aktualisierung
        const lastUpdateElement = document.getElementById(schedule.ids.lastUpdate);
        if (lastUpdateElement) {
            lastUpdateElement.textContent = `Letzte Aktualisierung: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
        }

        // Aktualisiere nächste Prüfung
        const nextCheckElement = document.getElementById(schedule.ids.nextCheck);
        if (nextCheckElement) {
            const now = new Date();
            const nextCheck = new Date(now.getTime() + 60000); // +1 Minute
            nextCheckElement.textContent = nextCheck.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        }

    } catch (error) {
        console.error(`Fehler beim Aktualisieren des ${schedule.label}-Status:`, error);
    }
}

// Starte periodische Status-Updates
function startScheduleStatusUpdatesFor(number) {
    const schedule = SCHEDULES[number];
    if (schedule.statusInterval) {
        clearInterval(schedule.statusInterval);
    }

    // Sofortige erste Aktualisierung
    updateScheduleStatusFor(number);

    // Dann alle 30 Sekunden
    schedule.statusInterval = setInterval(() => updateScheduleStatusFor(number), 30000);
    console.log(`${schedule.label}-Status-Updates gestartet (30s Intervall)`);
}

// Stoppe periodische Status-Updates
function stopScheduleStatusUpdatesFor(number) {
    const schedule = SCHEDULES[number];
    if (schedule.statusInterval) {
        clearInterval(schedule.statusInterval);
        schedule.statusInterval = null;
        console.log(`${schedule.label}-Status-Updates gestoppt`);
    }
}

// Zeige Regeln-Liste an
function displayRulesListFor(number) {
    const schedule = SCHEDULES[number];
    const rulesList = document.getElementById(schedule.ids.rulesList);
    if (!rulesList) return;

    if (schedule.config.rules.length === 0) {
        rulesList.innerHTML = `
            <div class="admin-empty-state">
                <i class="bi bi-calendar-x" style="font-size: 2rem;"></i>
                <p class="mt-2 mb-3">Keine Regeln definiert</p>
                <button class="btn btn-primary" onclick="showAddRuleModal${schedule.fnSuffix}()">
                    <i class="bi bi-plus-circle"></i> Erste Regel hinzufügen
                </button>
            </div>
        `;
        return;
    }

    let html = '<div class="row">';

    schedule.config.rules.forEach((rule) => {
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
                                <button class="btn btn-outline-primary" onclick="editRule${schedule.fnSuffix}('${rule.id}')" title="Bearbeiten">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="deleteRule${schedule.fnSuffix}('${rule.id}')" title="Löschen">
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
function showAddRuleModalFor(number) {
    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = `Neue ${SCHEDULES[number].label}-Regel`;
    document.getElementById('ruleId').value = '';
    document.getElementById('ruleScheduleNumber').value = String(number); // Merkt, zu welchem Schedule die Regel gehört
    clearRuleForm();

    modal.show();
}

// Bearbeite Regel
function editRuleFor(number, ruleId) {
    const schedule = SCHEDULES[number];
    const rule = schedule.config.rules.find(r => r.id === ruleId);
    if (!rule) return;

    const modal = new bootstrap.Modal(document.getElementById('ruleModal'));
    document.getElementById('ruleModalLabel').textContent = `${schedule.label}-Regel bearbeiten`;
    document.getElementById('ruleId').value = ruleId;
    document.getElementById('ruleScheduleNumber').value = String(number);

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
async function deleteRuleFor(number, ruleId) {
    if (!confirm('Möchten Sie diese Regel wirklich löschen?')) return;

    try {
        const { config } = SCHEDULES[number];
        const updatedRules = config.rules.filter(r => r.id !== ruleId);
        await saveScheduleConfigFor(number, { ...config, rules: updatedRules });
        showNotification('Regel gelöscht', 'success');
        displayRulesListFor(number);
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
        const number = document.getElementById('ruleScheduleNumber')?.value === '2' ? 2 : 1;
        const { config } = SCHEDULES[number];
        let updatedRules;

        if (ruleId) {
            // Bearbeite bestehende Regel
            updatedRules = config.rules.map(r => r.id === ruleId ? rule : r);
        } else {
            // Füge neue Regel hinzu
            updatedRules = [...config.rules, rule];
        }

        await saveScheduleConfigFor(number, { ...config, rules: updatedRules });

        const modal = bootstrap.Modal.getInstance(document.getElementById('ruleModal'));
        modal.hide();

        showNotification(ruleId ? 'Regel aktualisiert' : 'Regel hinzugefügt', 'success');

        displayRulesListFor(number);

    } catch (error) {
        console.error('Fehler beim Speichern der Regel:', error);
        showNotification('Fehler beim Speichern der Regel', 'error');
    }
}

// Speichere Schedule-Konfiguration
async function saveScheduleConfigFor(number, config) {
    const schedule = SCHEDULES[number];
    try {
        const response = await sendJson(schedule.api, config);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }

        schedule.config = config;
        return await response.json();

    } catch (error) {
        console.error(`Fehler beim Speichern der ${schedule.label}-Konfiguration:`, error);
        throw error;
    }
}

// Speichere Default-Karte
async function saveDefaultCardFor(number) {
    const schedule = SCHEDULES[number];
    const defaultCard = document.getElementById(schedule.ids.defaultCard).value;

    try {
        await saveScheduleConfigFor(number, { ...schedule.config, defaultCard });
        showNotification('Standard-Karte gespeichert', 'success');
    } catch (error) {
        console.error('Fehler beim Speichern der Standard-Karte:', error);
        showNotification('Fehler beim Speichern der Standard-Karte', 'error');
    }
}

// Force Schedule Reload
function forceScheduleReloadFor(number) {
    const schedule = SCHEDULES[number];
    try {
        socket.emit(schedule.reloadEvent);
        showNotification(`${schedule.label} wird neu gestartet`, 'info');
    } catch (error) {
        console.error(`Fehler beim ${schedule.label} Reload:`, error);
        showNotification(`Fehler beim ${schedule.label} Reload`, 'error');
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

// Von admin-v2.html (onclick), der Regelliste und core.js aufgerufene Namen
function loadScheduleConfig() { return loadScheduleConfigFor(1); }
function loadSchedule2Config() { return loadScheduleConfigFor(2); }
function showAddRuleModal() { showAddRuleModalFor(1); }
function showAddRuleModal2() { showAddRuleModalFor(2); }
function editRule(ruleId) { editRuleFor(1, ruleId); }
function editRule2(ruleId) { editRuleFor(2, ruleId); }
function deleteRule(ruleId) { return deleteRuleFor(1, ruleId); }
function deleteRule2(ruleId) { return deleteRuleFor(2, ruleId); }
function saveDefaultCard() { return saveDefaultCardFor(1); }
function saveDefaultCard2() { return saveDefaultCardFor(2); }
function forceScheduleReload() { forceScheduleReloadFor(1); }
function forceSchedule2Reload() { forceScheduleReloadFor(2); }

// Socket.IO Event-Listener für Schedule
[1, 2].forEach((number) => {
    const schedule = SCHEDULES[number];
    socket.on(schedule.changedEvent, (data) => {
        console.log(`${schedule.label}-Konfiguration geändert:`, data);
        schedule.config = data;
        if (currentLocation === 'schedule-1' && currentScheduleTab === number) {
            displayRulesListFor(number);
            updateScheduleStatusFor(number); // Aktualisiere Status bei Konfigurationsänderungen
        }
    });
});

// Cleanup beim Verlassen der Seite
window.addEventListener('beforeunload', () => {
    stopScheduleStatusUpdatesFor(1);
    stopScheduleStatusUpdatesFor(2);
});
