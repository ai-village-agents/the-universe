// cosmic-sight-milestones.js — Celebrate cosmic-sight discovery milestones.
// Author: Claude Opus 4.7
//
// Listens for `cosmicSightVisited` events and shows a celebratory golden banner
// + chime when the visitor crosses certain count thresholds (10, 25, 50, 100,
// 250, 500, 1000, 2500, 5000). Persists which milestones have already been
// celebrated so toasts only appear once each in localStorage.

const STORAGE_KEY = 'aiv_cosmic_sights_v1';
const SHOWN_KEY = 'aiv_cosmic_milestones_shown_v1';
const THRESHOLDS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];

function loadDiscovered() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) { return new Set(); }
}

function loadShown() {
    try {
        const raw = localStorage.getItem(SHOWN_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) { return new Set(); }
}

function saveShown(set) {
    try { localStorage.setItem(SHOWN_KEY, JSON.stringify([...set])); } catch (_) {}
}

export function createCosmicSightMilestones({ audio } = {}) {
    const banner = document.createElement('div');
    banner.id = 'cosmic-milestone-banner';
    banner.style.cssText = [
        'position:fixed', 'top:42%', 'left:50%', 'transform:translate(-50%,-50%) scale(0.92)',
        'padding:18px 30px',
        'font:600 17px/1.35 "Trebuchet MS", sans-serif',
        'color:#fff8d8',
        'background:radial-gradient(ellipse at center, rgba(255,210,90,0.96), rgba(180,120,30,0.92) 70%)',
        'border:2px solid #ffe9a0',
        'border-radius:14px',
        'box-shadow:0 0 60px rgba(255,210,90,0.7), inset 0 0 22px rgba(255,255,200,0.5)',
        'text-align:center',
        'z-index:1100',
        'pointer-events:none',
        'opacity:0',
        'transition:opacity 0.5s ease, transform 0.5s ease',
        'text-shadow:0 1px 4px rgba(80,40,0,0.7)',
        'min-width:300px',
        'max-width:520px',
    ].join(';');
    document.body.appendChild(banner);

    let visible = false;
    let hideTimer = null;

    function showBanner(count, threshold) {
        const isBig = threshold >= 100;
        const stars = isBig ? '✨🌟✨' : '⭐';
        banner.innerHTML = `
            <div style="font-size:13px;letter-spacing:1.5px;opacity:0.85;text-transform:uppercase;margin-bottom:6px;">${stars} Cosmic Milestone ${stars}</div>
            <div style="font-size:30px;font-weight:700;margin:6px 0;color:#fffbe0;text-shadow:0 0 18px rgba(255,230,140,0.9);">${threshold} sights discovered</div>
            <div style="font-size:13px;opacity:0.92;margin-top:6px;">Keep exploring the universe ✦</div>
        `;
        banner.style.opacity = '1';
        banner.style.transform = 'translate(-50%,-50%) scale(1)';
        visible = true;
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            banner.style.opacity = '0';
            banner.style.transform = 'translate(-50%,-50%) scale(0.92)';
            visible = false;
        }, 4200);
        if (audio && audio.isStarted && audio.isStarted() && !audio.isMuted()) {
            try {
                audio.playChime('cosmicSight');
                setTimeout(() => { try { audio.playChime('cosmicSight'); } catch (_) {} }, 240);
                if (threshold >= 100) setTimeout(() => { try { audio.playChime('cosmicSight'); } catch (_) {} }, 480);
            } catch (_) {}
        }
    }

    function check() {
        const discovered = loadDiscovered();
        const shown = loadShown();
        const count = discovered.size;
        for (const t of THRESHOLDS) {
            if (count >= t && !shown.has(String(t))) {
                shown.add(String(t));
                saveShown(shown);
                showBanner(count, t);
                break; // celebrate one per event
            }
        }
    }

    document.addEventListener('cosmicSightVisited', () => {
        // Slight delay so the regular toast renders first
        setTimeout(check, 700);
    });

    // Initial pass: if visitor already passed thresholds in earlier sessions,
    // still mark them shown so they don't trigger now (silent backfill).
    {
        const discovered = loadDiscovered();
        const shown = loadShown();
        let dirty = false;
        for (const t of THRESHOLDS) {
            if (discovered.size >= t && !shown.has(String(t))) {
                shown.add(String(t));
                dirty = true;
            }
        }
        if (dirty) saveShown(shown);
    }

    return {
        check,
        dom: banner,
        thresholds: THRESHOLDS,
    };
}

export default { createCosmicSightMilestones };
