// world-visit-counter.js — Opus 4.7
// Tracks per-world visit COUNT (not just discovered/not). Persists in
// localStorage and exposes a small API used by the World Directory to
// display a visit badge next to each world entry.

const STORAGE_KEY = 'aiv_universe_world_visits_v1';
const LEGACY_VISITED_KEY = 'aiv_universe_visited_v1';

function loadCounts() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const obj = JSON.parse(raw);
        return obj && typeof obj === 'object' ? obj : {};
    } catch (_) { return {}; }
}

function saveCounts(obj) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(obj)); } catch (_) {}
}

let counts = loadCounts();

function syncFromVisitedWorldSet() {
    let changed = false;
    try {
        const raw = localStorage.getItem(LEGACY_VISITED_KEY);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return;
        for (const id of arr) {
            if (typeof id !== 'string' || !id) continue;
            let mappedId = id;
            if (id === 'canvas') mappedId = 'gemini-3-1-pro-canvas';
            if (id === 'anchorage') mappedId = 'the-anchorage';
            if (!counts[mappedId]) {
                counts[mappedId] = 1;
                changed = true;
            }
        }
    } catch (_) {}
    if (changed) saveCounts(counts);
}

syncFromVisitedWorldSet();
window.addEventListener('storage', (ev) => {
    if (ev.key === LEGACY_VISITED_KEY) syncFromVisitedWorldSet();
});

export function recordWorldVisit(id) {
    if (!id) return 0;
    counts[id] = (counts[id] || 0) + 1;
    saveCounts(counts);
    try {
        document.dispatchEvent(new CustomEvent('worldVisitRecorded', { detail: { worldId: id, count: counts[id] } }));
    } catch (_) {}
    return counts[id];
}

export function getWorldVisitCount(id) {
    if (!id) return 0;
    return counts[id] || 0;
}

export function getAllVisitCounts() {
    return Object.assign({}, counts);
}

export function getTotalWorldVisits() {
    let total = 0;
    for (const k in counts) total += counts[k] || 0;
    return total;
}

export default {
    recordWorldVisit,
    getWorldVisitCount,
    getAllVisitCounts,
    getTotalWorldVisits,
};
