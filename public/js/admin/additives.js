/* Admin – Zusatzstoffe verwalten.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Zusatzstoff-Verwaltung
let additiveModal;

let currentAdditiveId = null;

function showAddAdditiveModal() {
    currentAdditiveId = null;
    document.querySelector('#additiveModal .modal-title').textContent = 'Zusatzstoff hinzufügen';
    document.getElementById('additiveForm').reset();
    additiveModal.show();
}

async function editAdditive(id) {
    try {
        const response = await fetch(`/api/additives/${id}`);
        const additive = await response.json();

        document.getElementById('additiveCode').value = additive.code;
        document.getElementById('additiveName').value = additive.name;
        document.getElementById('additiveShowInFooter').checked = additive.show_in_footer;
        
        currentAdditiveId = id;
        document.querySelector('#additiveModal .modal-title').textContent = 'Zusatzstoff bearbeiten';
        additiveModal.show();
    } catch (error) {
        console.error('Fehler beim Laden des Zusatzstoffs:', error);
        alert('Fehler beim Laden des Zusatzstoffs');
    }
}

function deleteAdditive(id) {
    if (confirm('Möchten Sie diesen Zusatzstoff wirklich löschen?')) {
        fetch(`/api/additives/${id}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                fetchAdditives();
            } else {
                alert('Fehler beim Löschen des Zusatzstoffs');
            }
        })
        .catch(error => {
            console.error('Fehler beim Löschen des Zusatzstoffs:', error);
            alert('Fehler beim Löschen des Zusatzstoffs');
        });
    }
}

async function saveAdditive() {
    const code = document.getElementById('additiveCode').value;
    const name = document.getElementById('additiveName').value;
    const showInFooter = document.getElementById('additiveShowInFooter').checked;
    const id = currentAdditiveId;

    const url = id ? `/api/additives/${id}` : '/api/additives';
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, show_in_footer: showInFooter })
        });

        if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');

        additiveModal.hide();
        fetchAdditives();
    } catch (error) {
        console.error('Fehler beim Speichern des Zusatzstoffs:', error);
        alert('Fehler beim Speichern des Zusatzstoffs');
    }
}

// Funktion zum Anzeigen der Zusatzstoffe
function displayAdditives(additives) {
    const additivesTableBody = document.getElementById('additivesTableBody');
    additivesTableBody.innerHTML = '';
    
    additives.forEach(additive => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(additive.code)}</td>
            <td>${escapeHtml(additive.name)}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           ${additive.show_in_footer ? 'checked' : ''}
                           onchange="toggleFooterVisibility(${additive.id}, this.checked)">
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editAdditive(${additive.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteAdditive(${additive.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        additivesTableBody.appendChild(row);
    });
}

async function toggleFooterVisibility(id, showInFooter) {
    try {
        const response = await fetch(`/api/additives/${id}/toggle-footer`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ show_in_footer: showInFooter })
        });
        
        if (!response.ok) throw new Error('Netzwerk-Antwort war nicht ok');
        
        // Aktualisiere die Anzeige
        fetchAdditives();
    } catch (error) {
        console.error('Fehler beim Ändern der Footer-Sichtbarkeit:', error);
        alert('Fehler beim Ändern der Footer-Sichtbarkeit');
    }
}
