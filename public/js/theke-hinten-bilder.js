// Bilder-Slideshow für theke-hinten-bilder.html

const additionalContent = document.querySelector('.additional-content');

if (additionalContent) {
    initImagesPlayer({
        container: additionalContent,
        layout: 'theke',
        getSocket: () => (typeof socket !== 'undefined' ? socket : null),
        emptyMessage: 'Keine Bilder vorhanden',
        emptyMessageClass: 'text-muted',
        errorMessage: 'Fehler beim Laden der Bilder'
    });
}
