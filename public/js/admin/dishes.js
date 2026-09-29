/* Admin – Speisekarte: Gerichte.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Funktion zum Laden der Gerichte
async function fetchDishes() {
    try {
        const response = await fetch('/api/dishes');
        const dishes = await response.json();
        displayDishes(dishes);
    } catch (error) {
        console.error('Fehler beim Laden der Gerichte:', error);
    }
}

// Funktion zum Anzeigen der Gerichte
function displayDishes(dishes) {
    const tbody = document.getElementById('dishesTableBody');
    tbody.innerHTML = '';
    
    dishes.sort((a, b) => a.sort_order - b.sort_order).forEach(dish => {
        const row = document.createElement('tr');
        // Konvertiere den Preis in eine Zahl und formatiere ihn
        const price = parseFloat(dish.price) || 0;
        
        row.innerHTML = `
            <td>${dish.name}</td>
            <td>${price.toFixed(2)} €</td>
            <td>${dish.description || ''}</td>
            <td>${dish.image_path ? `<img src="${dish.image_path}" alt="${dish.name}" style="max-width: 100px;">` : ''}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           id="dish-active-${dish.id}" 
                           ${dish.is_active ? 'checked' : ''}
                           onchange="toggleDishStatus(${dish.id}, this.checked)">
                </div>
            </td>
            <td>
                <input type="number" class="form-control form-control-sm" 
                       style="width: 80px"
                       value="${dish.sort_order || 0}"
                       onchange="updateDishOrder(${dish.id}, this.value)">
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editDish(${dish.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteDish(${dish.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    applyResponsiveTableLabels(tbody.closest('table'));
}

// Funktion zum Filtern der Gerichte
function filterDishes() {
    const searchTerm = document.getElementById('dishSearchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#dishesTableBody tr');
    
    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const description = row.cells[2].textContent.toLowerCase();
        row.style.display = name.includes(searchTerm) || description.includes(searchTerm) ? '' : 'none';
    });
}

// Funktion zum Anzeigen des Gericht-Modals
function showAddDishModal() {
    document.getElementById('dishForm').reset();
    document.getElementById('dishModal').dataset.dishId = '';
    dishModal.show();
}

// Funktion zum Bearbeiten eines Gerichts
async function editDish(id) {
    try {
        const response = await fetch(`/api/dishes/${id}`);
        const dish = await response.json();
        
        // Setze die Werte im Modal
        document.getElementById('dishName').value = dish.name;
        document.getElementById('dishPrice').value = dish.price;
        document.getElementById('dishDescription').value = dish.description || '';
        document.getElementById('dishOrder').value = dish.sort_order || 0;
        document.getElementById('dishActive').checked = dish.is_active;
        
        // Speichere die ID für das Update
        document.getElementById('dishForm').dataset.editId = id;
        
        // Zeige das Modal
        const modal = new bootstrap.Modal(document.getElementById('dishModal'));
        modal.show();
    } catch (error) {
        console.error('Fehler beim Laden des Gerichts:', error);
        showNotification('Fehler beim Laden des Gerichts', 'error');
    }
}

// Funktion zum Speichern eines Gerichts
async function saveDish() {
    const form = document.getElementById('dishForm');
    const formData = new FormData();
    
    // Füge die Basis-Daten hinzu
    formData.append('name', document.getElementById('dishName').value);
    formData.append('price', document.getElementById('dishPrice').value);
    formData.append('description', document.getElementById('dishDescription').value);
    formData.append('sort_order', document.getElementById('dishOrder').value);
    formData.append('is_active', document.getElementById('dishActive').checked);
    
    // Füge das Bild hinzu, falls eines ausgewählt wurde
    const imageInput = document.getElementById('dishImage');
    if (imageInput.files.length > 0) {
        formData.append('dishImage', imageInput.files[0]);
    }
    
    try {
        const editId = form.dataset.editId;
        const url = editId ? `/api/dishes/${editId}` : '/api/dishes';
        const method = editId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Fehler beim Speichern des Gerichts');
        }
        
        // Schließe das Modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('dishModal'));
        modal.hide();
        
        // Aktualisiere die Tabelle
        fetchDishes();
        
        // Zeige Erfolgsmeldung
        showNotification('Gericht erfolgreich gespeichert', 'success');
        
        // Setze das Formular zurück
        form.reset();
        delete form.dataset.editId;
    } catch (error) {
        console.error('Fehler beim Speichern des Gerichts:', error);
        showNotification('Fehler beim Speichern des Gerichts', 'error');
    }
}

// Funktion zum Löschen eines Gerichts
async function deleteDish(id) {
    if (confirm('Möchten Sie dieses Gericht wirklich löschen?')) {
        try {
            const response = await fetch(`/api/dishes/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                fetchDishes();
            }
        } catch (error) {
            console.error('Fehler beim Löschen des Gerichts:', error);
        }
    }
}

// Funktion zum Aktualisieren des Status eines Gerichts
async function toggleDishStatus(id, isActive) {
    try {
        const response = await fetch(`/api/dishes/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: isActive })
        });
        
        if (response.ok) {
            showNotification('Status erfolgreich aktualisiert', 'success');
        } else {
            throw new Error('Fehler beim Aktualisieren des Status');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Status:', error);
        showNotification('Fehler beim Aktualisieren des Status', 'error');
    }
}

// Funktion zum Aktualisieren der Reihenfolge eines Gerichts
async function updateDishOrder(id, sortOrder) {
    try {
        const response = await fetch(`/api/dishes/${id}/order`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ sort_order: parseInt(sortOrder) })
        });
        
        if (response.ok) {
            showNotification('Reihenfolge erfolgreich aktualisiert', 'success');
        } else {
            throw new Error('Fehler beim Aktualisieren der Reihenfolge');
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Reihenfolge:', error);
        showNotification('Fehler beim Aktualisieren der Reihenfolge', 'error');
    }
}

// === Bilder-Tab Logik ===
