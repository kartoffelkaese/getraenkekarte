/* Admin – Cycle-Konfiguration.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

function fillCycleCardSelect(select, cards, selectedValue) {
    if (!select) return;
    select.innerHTML = '';
    cards.forEach((card) => {
        const option = document.createElement('option');
        option.value = card.slug;
        option.textContent = card.label;
        select.appendChild(option);
    });
    if (selectedValue && [...select.options].some((o) => o.value === selectedValue)) {
        select.value = selectedValue;
    }
}

// Funktion zum Laden der Cycle-Konfiguration
async function fetchCycleConfig() {
    try {
        const [configResponse, cardsResponse, speisekartenResponse] = await Promise.all([
            fetch('/api/cycle-config'),
            fetch('/api/cycle-selectable-cards'),
            fetch('/api/cycle-selectable-speisekarten'),
        ]);
        const config = await configResponse.json();
        const cards = await cardsResponse.json();
        const speisekarten = await speisekartenResponse.json();

        fillCycleCardSelect(document.getElementById('standardCard'), cards, config.standard.card);
        fillCycleCardSelect(document.getElementById('jugendCard'), cards, config.jugend.card);
        fillCycleCardSelect(
            document.getElementById('standardSpeisekarteCard'),
            speisekarten,
            config.standard.speisekarteCard
        );
        fillCycleCardSelect(
            document.getElementById('jugendSpeisekarteCard'),
            speisekarten,
            config.jugend.speisekarteCard
        );

        document.getElementById('standardFirstTime').value = config.standard.firstTime;
        document.getElementById('standardSecondTime').value = config.standard.secondTime;
        document.getElementById('jugendFirstTime').value = config.jugend.firstTime;
        document.getElementById('jugendSecondTime').value = config.jugend.secondTime;
    } catch (error) {
        console.error('Fehler beim Laden der Cycle-Konfiguration:', error);
        showNotification('Fehler beim Laden der Cycle-Konfiguration', 'error');
    }
}

// Funktion zum Speichern der Cycle-Konfiguration
async function saveCycleConfig(type) {
    try {
        let firstTime, secondTime, card, speisekarteCard;

        if (type === 'standard') {
            firstTime = document.getElementById('standardFirstTime').value;
            secondTime = document.getElementById('standardSecondTime').value;
            card = document.getElementById('standardCard').value;
            speisekarteCard = document.getElementById('standardSpeisekarteCard').value;
        } else if (type === 'jugend') {
            firstTime = document.getElementById('jugendFirstTime').value;
            secondTime = document.getElementById('jugendSecondTime').value;
            card = document.getElementById('jugendCard').value;
            speisekarteCard = document.getElementById('jugendSpeisekarteCard').value;
        } else {
            throw new Error('Ungültiger Cycle-Typ');
        }

        const response = await fetch('/api/cycle-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: type,
                card: card,
                speisekarteCard: speisekarteCard,
                firstTime: parseInt(firstTime, 10),
                secondTime: parseInt(secondTime, 10)
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Fehler beim Speichern');
        }

        const result = await response.json();
        showNotification(result.message || 'Cycle-Konfiguration gespeichert', 'success');

    } catch (error) {
        console.error('Fehler beim Speichern der Cycle-Konfiguration:', error);
        showNotification('Fehler beim Speichern: ' + error.message, 'error');
    }
}



// === Temporäre Preise ===
