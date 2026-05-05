// visitor-tracker.js — Persists which worlds a visitor has opened from the hub.
// Author: Claude Opus 4.7
// Accessibility polish: GPT-5.4
//
// Stores set of world ids in localStorage. Triggers a celebration banner when complete.

const STORAGE_KEY = 'aiv_universe_visited_v1';
const VISITOR_ID_KEY = 'aiv_universe_visitor_id_v1';

export function createVisitorTracker(allWorlds) {
    const total = allWorlds.length;
    const panel = document.getElementById('achievements-panel');
    let visited = new Set();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) arr.forEach((id) => visited.add(id));
        }
    } catch (_) { /* ignore */ }

    let celebrationShown = visited.size >= total;
    let visitorId = null;

    function getVisitorId() {
        if (visitorId) return visitorId;
        try {
            visitorId = localStorage.getItem(VISITOR_ID_KEY);
            if (!visitorId) {
                const suffix = Math.random().toString(36).slice(2, 10);
                visitorId = `visitor-${Date.now().toString(36)}-${suffix}`;
                localStorage.setItem(VISITOR_ID_KEY, visitorId);
            }
        } catch (_) {
            const suffix = Math.random().toString(36).slice(2, 10);
            visitorId = `visitor-${Date.now().toString(36)}-${suffix}`;
        }
        return visitorId;
    }

    function getVisitedWorlds() {
        return [...visited];
    }

    function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited])); } catch (_) {}
    }

    function getCosmicSightStats() {
        const cosmicSightTracker = window.__cosmicSightTracker;
        const discovered = cosmicSightTracker && typeof cosmicSightTracker.count === 'function'
            ? cosmicSightTracker.count()
            : 0;
        const totalFromTracker = cosmicSightTracker && typeof cosmicSightTracker.total === 'function'
            ? Number(cosmicSightTracker.total())
            : NaN;
        const totalFromGlobal = typeof window.__universeCosmicSightsCount === 'number'
            ? Number(window.__universeCosmicSightsCount)
            : NaN;
        const totalFromData = Array.isArray(window.__universeCosmicSightsData)
            ? window.__universeCosmicSightsData.length
            : NaN;
        const totalFromNames = Array.isArray(window.__universeCosmicSightNames)
            ? window.__universeCosmicSightNames.length
            : NaN;
        const totals = [totalFromTracker, totalFromGlobal, totalFromData, totalFromNames]
            .filter((value) => Number.isFinite(value) && value >= 0);
        return {
            discovered,
            total: totals.length ? Math.max(...totals) : 0
        };
    }

    function refreshPanel() {
        if (!panel) return;
        const visitedCount = visited.size;
        const percent = total === 0 ? 0 : Math.round((visitedCount / total) * 100);
        const cosmicSightStats = getCosmicSightStats();
        const cosmicSightsDiscovered = cosmicSightStats.discovered;
        const cosmicSightsTotal = cosmicSightStats.total;
        const entries = allWorlds.map((world) => {
            const explored = visited.has(world.id);
            const label = world.name || world.id || 'Unnamed world';
            const icon = explored ? '✅' : '⬜';
            const color = explored ? '#b3ffe2' : '#7aa798';
            return `<li data-world-id="${world.id}" style="margin:2px 0;color:${color};">${icon} ${label}</li>`;
        }).join('');
        const statusLine = total === 0
            ? 'No worlds available yet.'
            : `${visitedCount} of ${total} worlds explored (${percent}%)`;
        panel.innerHTML = [
            '<h3>Achievements</h3>',
            `<p style="margin:4px 0 8px 0;font-size:12px;color:#c8ffe6;">${statusLine}</p>`,
            `<ul style="margin:0;padding-left:18px;list-style:none;font-size:11px;">${entries}</ul>`,
            `<p style="margin:8px 0 0 0;font-size:12px;color:#c8ffe6;">Cosmic Sights discovered: ${cosmicSightsDiscovered}/${cosmicSightsTotal}</p>`
        ].join('');
    }

    function openPanel() {
        if (!panel) return;
        refreshPanel();
        panel.style.display = 'block';
    }

    function closePanel() {
        if (!panel) return;
        panel.style.display = 'none';
    }

    function showCelebration() {
        if (celebrationShown) return;
        celebrationShown = true;
        const banner = document.createElement('div');
        banner.style.cssText = [
            'position:fixed', 'top:50%', 'left:50%', 'transform:translate(-50%,-50%)',
            'padding:28px 40px', 'font:bold italic 26px/1.3 Georgia,serif',
            'color:#fff8c0',
            'background:linear-gradient(135deg,rgba(40,15,70,0.96),rgba(15,30,80,0.96))',
            'border:2px solid #ffe999', 'border-radius:18px',
            'box-shadow:0 0 60px rgba(255,220,120,0.45),0 0 18px rgba(127,200,255,0.4)',
            'z-index:2000', 'text-align:center', 'pointer-events:auto', 'cursor:pointer'
        ].join(';');
        banner.innerHTML = `
            <div style="font-size:42px;margin-bottom:6px">🌌 ✨ 🌌</div>
            <div>Universe Explorer!</div>
            <div style="font:italic 16px Georgia,serif;color:#bcd;margin-top:8px">You have visited every world in the AI Village Universe.</div>
            <div style="font-size:11px;color:#889;margin-top:14px">click to dismiss</div>`;
        banner.setAttribute('role', 'status');
        banner.setAttribute('aria-live', 'polite');
        banner.addEventListener('click', () => banner.remove());
        document.body.appendChild(banner);
        setTimeout(() => { if (banner.parentNode) banner.remove(); }, 14000);
        document.dispatchEvent(new Event('universeExplored'));
    }

    function recordVisit(id) {
        if (!id || visited.has(id)) return;
        const known = allWorlds.some((w) => w.id === id);
        if (!known) return;
        visited.add(id);
        persist();
        refreshPanel();
        document.dispatchEvent(new CustomEvent('worldVisited', { detail: { worldId: id } }));
        if (visited.size >= total) showCelebration();
    }

    refreshPanel();
    setTimeout(refreshPanel, 0);
    setTimeout(refreshPanel, 250);
    document.addEventListener('cosmicSightVisited', refreshPanel);

    return {
        recordVisit,
        isComplete: () => visited.size >= total,
        count: () => visited.size,
        getVisitorId,
        getVisitedWorlds,
        refreshPanel,
        openPanel,
        closePanel
    };
}
