// Hilfsfunktion für die Preisformatierung
function formatPrice(price) {
    const numPrice = parseFloat(price) || 0;
    return numPrice.toFixed(2).replace('.', ',');
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;');
}

function safeAssetUrl(url) {
    if (!url || typeof url !== 'string') {
        return '';
    }
    if (url.startsWith('/') && !url.includes('..')) {
        return escapeAttr(url);
    }
    try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:') {
            return escapeAttr(url);
        }
    } catch {
        // ignore invalid URLs
    }
    return '';
} 