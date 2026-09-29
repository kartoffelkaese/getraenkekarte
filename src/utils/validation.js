// Eingabe-Helfer für Toggle-/Sortier-Endpunkte (tolerant gegenüber 0/1 und Zahlen als Text)
function toId(value) {
    const n = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
    return Number.isInteger(n) && n > 0 ? n : null;
}

function toBool(value) {
    if (value === true || value === 1 || value === '1' || value === 'true') return true;
    if (value === false || value === 0 || value === '0' || value === 'false') return false;
    return null;
}

function toSortOrder(value) {
    const n = typeof value === 'string' && /^-?\d+$/.test(value) ? Number(value) : value;
    return Number.isInteger(n) ? n : null;
}

/** Prüft req.body: { id?, [field] } – gibt { id, value } oder sendet 400 und gibt null zurück. */
function readToggleBody(req, res, field, { withId = true, parse = toBool } = {}) {
    const id = withId ? toId(req.body.id) : undefined;
    const value = parse(req.body[field]);
    if ((withId && id === null) || value === null) {
        res.status(400).json({ error: `Ungültige Eingabe: ${withId ? 'id und ' : ''}${field} erforderlich` });
        return null;
    }
    return { id, value };
}

module.exports = {
    toId,
    toBool,
    toSortOrder,
    readToggleBody,
};
