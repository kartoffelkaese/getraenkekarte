/* Admin – Bilder-Karten: Upload, Liste, Löschen.
 * Klassisches Skript: teilt Funktionen und Zustand global mit den übrigen admin/*.js (Reihenfolge siehe admin-v2.html). */

// Event-Listener für das Bilder-Upload-Formular
const imageUploadForm = document.getElementById('imageUploadForm');

if (imageUploadForm) {
    imageUploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const fileInput = document.getElementById('imageFile');
        if (!fileInput.files.length) return;
        const files = Array.from(fileInput.files);
        let uploadSuccess = true;
        const progressDiv = document.getElementById('imageUploadProgress');
        const progressBar = progressDiv ? progressDiv.querySelector('.progress-bar') : null;
        if (progressDiv && progressBar) {
            progressDiv.style.display = '';
            progressBar.style.width = '0%';
            progressBar.textContent = '';
        }
        let uploaded = 0;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('image', file);
            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/images');
                xhr.upload.onprogress = function(event) {
                    if (event.lengthComputable && progressBar) {
                        const percent = Math.round(((uploaded + event.loaded) / (files.reduce((a, f) => a + f.size, 0))) * 100);
                        progressBar.style.width = percent + '%';
                        progressBar.textContent = percent + '%';
                    }
                };
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        uploaded += file.size;
                        resolve();
                    } else {
                        uploadSuccess = false;
                        resolve();
                    }
                };
                xhr.onerror = function() {
                    uploadSuccess = false;
                    resolve();
                };
                xhr.send(formData);
            });
        }
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.textContent = '100%';
        }
        setTimeout(() => {
            if (progressDiv) progressDiv.style.display = 'none';
            if (progressBar) progressBar.style.width = '0%';
        }, 800);
        imageUploadForm.reset();
        fetchImages();
        if (uploadSuccess) {
            showNotification('Bilder erfolgreich hochgeladen', 'success');
        } else {
            showNotification('Einige Bilder konnten nicht hochgeladen werden', 'error');
        }
    });
}

// Alle Bilder löschen
const deleteAllImagesBtn = document.getElementById('deleteAllImagesBtn');

if (deleteAllImagesBtn) {
    deleteAllImagesBtn.addEventListener('click', async function() {
        if (!confirm('Möchten Sie wirklich alle Bilder unwiderruflich löschen?')) return;
        try {
            const response = await fetch('/api/images/all', { method: 'DELETE' });
            if (!response.ok) throw new Error('Fehler beim Löschen aller Bilder');
            fetchImages();
            showNotification('Alle Bilder wurden gelöscht', 'success');
        } catch (err) {
            showNotification('Fehler beim Löschen aller Bilder', 'error');
        }
    });
}

// Bilder abrufen und anzeigen
async function fetchImages() {
    try {
        const response = await fetch('/api/images');
        const images = await response.json();
        displayImages(images);
    } catch (err) {
        showNotification('Fehler beim Laden der Bilder', 'error');
    }
}

function displayImages(images) {
    const tbody = document.getElementById('imagesTableBody');
    tbody.innerHTML = '';
    const countInfo = document.getElementById('imagesCountInfo');
    if (countInfo) {
        countInfo.textContent = `Insgesamt ${images.length} Bild${images.length === 1 ? '' : 'er'} hochgeladen.`;
    }
    if (!Array.isArray(images) || images.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Keine Bilder vorhanden</td></tr>';
        return;
    }
    images.forEach(img => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${img.url}" alt="Bild" style="max-width: 100px;"></td>
            <td>${img.filename}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteImage('${img.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Bild manuell löschen
async function deleteImage(id) {
    if (!confirm('Möchten Sie dieses Bild wirklich löschen?')) return;
    try {
        const response = await fetch(`/api/images/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Fehler beim Löschen');
        fetchImages();
        showNotification('Bild gelöscht', 'success');
    } catch (err) {
        showNotification('Fehler beim Löschen des Bildes', 'error');
    }
}
