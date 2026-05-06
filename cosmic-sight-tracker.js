// cosmic-sight-tracker.js — Persists which cosmic sights a visitor has come close to.
// Author: Claude Opus 4.7
//
// Watches camera proximity to fixed cosmic sight points (defined in main.js).
// First time the camera comes within `proximityRadius` of a sight, the sight is
// marked discovered, persisted to localStorage, and a small badge animates in
// the corner. Pairs with DeepSeek's "Cosmic Sightseer" challenge.

const STORAGE_KEY = 'aiv_cosmic_sights_v1';
const LOG_KEY = 'aiv_cosmic_sights_log_v1';
const LOG_CAP = 200;
const PROXIMITY_RADIUS = 110; // units
const BADGE_FADE_MS = 3200;

export function createCosmicSightTracker({ camera, sights, audio }) {
    // Dedupe by name so Cosmic Census parity matches Atlas total, and drop
    // stale localStorage entries from older deployments/renamed duplicates.
    const validSightNames = new Set();
    for (const s of sights) { if (s && s.name) validSightNames.add(s.name); }
    const total = validSightNames.size;
    let visited = new Set();
    let needsSanitizePersist = false;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
                for (const name of arr) {
                    if (validSightNames.has(name)) {
                        visited.add(name);
                    } else {
                        needsSanitizePersist = true;
                    }
                }
                if (visited.size !== arr.length) needsSanitizePersist = true;
            }
        }
    } catch (_) { /* ignore */ }

    function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited])); } catch (_) {}
    }
    if (needsSanitizePersist) persist();

    function appendLog(name, description) {
        try {
            let arr = [];
            const raw = localStorage.getItem(LOG_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) arr = parsed;
            }
            arr.unshift({ name, ts: Date.now(), description: description || '' });
            if (arr.length > LOG_CAP) arr = arr.slice(0, LOG_CAP);
            localStorage.setItem(LOG_KEY, JSON.stringify(arr));
        } catch (_) {}
    }

    // ---------- HUD badge ----------
    const hud = document.createElement('div');
    hud.id = 'cosmic-sight-hud';
    hud.style.cssText = [
        'position:fixed', 'top:78px', 'right:12px',
        'padding:6px 10px',
        'font:11px/1.3 monospace',
        'color:#cfeaff',
        'background:linear-gradient(135deg,rgba(20,15,40,0.78),rgba(10,30,60,0.78))',
        'border:1px solid rgba(160,200,255,0.4)',
        'border-radius:9px',
        'box-shadow:0 0 14px rgba(140,200,255,0.18)',
        'z-index:30',
        'pointer-events:none',
        'letter-spacing:0.3px',
        'transition:box-shadow 0.3s ease, color 0.3s ease',
        'min-width:128px', 'text-align:center'
    ].join(';');
    document.body.appendChild(hud);

    // Floating discovery toast (only shown briefly)
    const toast = document.createElement('div');
    toast.id = 'cosmic-sight-toast';
    toast.style.cssText = [
        'position:fixed', 'top:118px', 'right:12px',
        'padding:8px 14px',
        'font:italic 13px/1.3 Georgia,serif',
        'color:#fff7c8',
        'background:linear-gradient(135deg,rgba(40,20,70,0.94),rgba(20,40,90,0.94))',
        'border:1px solid rgba(255,220,140,0.55)',
        'border-radius:10px',
        'box-shadow:0 0 22px rgba(255,210,120,0.28)',
        'z-index:31',
        'pointer-events:auto',
        'cursor:pointer',
        'user-select:none',
        'opacity:0',
        'transform:translateX(20px)',
        'transition:opacity 0.35s ease, transform 0.35s ease, box-shadow 0.2s ease, transform 0.2s ease',
        'max-width:280px', 'text-align:left'
    ].join(';');
    document.body.appendChild(toast);
    let toastTimeout = null;
    let toastSightName = null;
    toast.addEventListener('mouseenter', () => {
        toast.style.boxShadow = '0 0 30px rgba(255,210,120,0.55), 0 0 14px rgba(255,255,255,0.25)';
    });
    toast.addEventListener('mouseleave', () => {
        toast.style.boxShadow = '0 0 22px rgba(255,210,120,0.28)';
    });
    toast.addEventListener('click', () => {
        if (!toastSightName) return;
        const atlas = window.__cosmicSightsAtlas;
        if (atlas && typeof atlas.teleportTo === 'function') {
            try { atlas.teleportTo(toastSightName); } catch (_) {}
        }
        // Hide the toast immediately on click
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        if (toastTimeout) { clearTimeout(toastTimeout); toastTimeout = null; }
    });

    function refreshBadge() {
        const pct = total === 0 ? 0 : Math.round((visited.size / total) * 100);
        hud.innerHTML = `🌟 Cosmic Census<br><span style="font-size:13px;color:#fff5d4">${visited.size} / ${total}</span>`
            + `<div style="font-size:9px;color:#9ab9d6;margin-top:2px">discovered ${pct}%</div>`;
    }

    function showToast(name, description) {
        toastSightName = name;
        const desc = description ? `<div style="font-size:11px;color:#cdd9ee;margin-top:3px;font-style:normal">${description}</div>` : '';
        const hint = `<div style="font-size:9px;color:#a8c2e6;margin-top:4px;font-style:normal;letter-spacing:0.4px;opacity:0.85">click to revisit ↺</div>`;
        toast.innerHTML = `✨ Discovered: <b style="color:#fff5d4">${name}</b>${desc}${hint}`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
        }, BADGE_FADE_MS);
    }

    function flashBadge() {
        hud.style.boxShadow = '0 0 28px rgba(255,220,120,0.85), 0 0 14px rgba(140,200,255,0.5)';
        hud.style.color = '#fff8c8';
        setTimeout(() => {
            hud.style.boxShadow = '0 0 14px rgba(140,200,255,0.18)';
            hud.style.color = '#cfeaff';
        }, 1800);
    }

    refreshBadge();

    // ---------- proximity loop ----------
    function update(/* dt, elapsed */) {
        // Throttled in main.js by being part of customLandmarkAnimators (~60Hz)
        // but cheap: O(N) distance squared check, N≈50.
        const cx = camera.position.x;
        const cy = camera.position.y;
        const cz = camera.position.z;
        const r2 = PROXIMITY_RADIUS * PROXIMITY_RADIUS;
        for (let i = 0; i < sights.length; i++) {
            const s = sights[i];
            if (visited.has(s.name)) continue;
            const dx = s.position[0] - cx;
            const dy = s.position[1] - cy;
            const dz = s.position[2] - cz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < r2) {
                visited.add(s.name);
                persist();
                appendLog(s.name, s.description || '');
                refreshBadge();
                flashBadge();
                showToast(s.name, s.description || '');
                if (audio && audio.isStarted && audio.isStarted() && !audio.isMuted()) {
                    try { audio.playChime('cosmicSight'); } catch (_) {}
                }
                document.dispatchEvent(new CustomEvent('cosmicSightVisited', { detail: { name: s.name } }));
            }
        }
    }

    return {
        update,
        count: () => visited.size,
        total: () => total,
        isComplete: () => visited.size >= total,
        getVisited: () => new Set(visited)
    };
}
