// Hilfsfunktion für die Preisformatierung
function formatPrice(price) {
    const numPrice = parseFloat(price) || 0;
    return numPrice.toFixed(2).replace('.', ',');
} 