// Vollbild-Bilderdarstellung für bilder.html

const additionalContent = document.querySelector('.additional-content');

if (additionalContent) {
    initImagesPlayer({
        container: additionalContent,
        layout: 'fullscreen',
        getSocket: () => (typeof io !== 'undefined' ? io() : null),
        emptyMessage: 'Keine Bilder vorhanden',
        emptyMessageClass: 'text-white',
        errorMessage: 'Fehler beim Laden der Bilder'
    });
}
