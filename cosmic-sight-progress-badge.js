// cosmic-sight-progress-badge.js — Opus 4.7
// Persistent HUD element showing progress toward the next milestone.
// Listens for cosmicSightVisited events and updates a small badge with a
// progress bar showing distance to the next threshold.

const STORAGE_KEY = 'aiv_cosmic_sights_v1';
const THRESHOLDS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000];

function readDiscovered() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return 0;
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? new Set(arr).size : 0;
    } catch (_) { return 0; }
}

function nextThreshold(count) {
    for (const t of THRESHOLDS) {
        if (count < t) return t;
    }
    return null;
}

function previousThreshold(count) {
    let prev = 0;
    for (const t of THRESHOLDS) {
        if (count < t) return prev;
        prev = t;
    }
    return prev;
}

export function createCosmicSightProgressBadge() {
    const badge = document.createElement('div');
    badge.id = 'cosmic-sight-progress-badge';
    badge.style.cssText = [
        'position:fixed',
        'top:280px', 'right:12px',
        'padding:5px 10px',
        'font:10px/1.45 monospace',
        'color:#ffefb8',
        'background:linear-gradient(135deg,rgba(40,28,8,0.85),rgba(28,18,6,0.88))',
        'border:1px solid rgba(255,200,80,0.40)',
        'border-radius:9px',
        'box-shadow:0 0 12px rgba(255,180,60,0.16)',
        'z-index:30',
        'pointer-events:auto',
        'cursor:default',
        'letter-spacing:0.2px',
        'min-width:170px',
        'text-align:left',
        'transition:box-shadow 0.3s ease, transform 0.2s ease',
    ].join(';');
    badge.title = 'Cosmic Sight Milestone Progress';
    document.body.appendChild(badge);

    function render() {
        const count = readDiscovered();
        const next = nextThreshold(count);
        const prev = previousThreshold(count);
        if (next === null) {
            badge.innerHTML = `
                <div style="font-size:9.5px;letter-spacing:1.2px;opacity:0.9;text-transform:uppercase;color:#ffd987;">✦ Cosmic Milestones</div>
                <div style="font-size:14px;font-weight:700;margin-top:2px;color:#fff8d8;text-shadow:0 0 8px rgba(255,210,90,0.6);">All cleared! ${count.toLocaleString()} sights ✦</div>
            `;
            return;
        }
        const segSpan = Math.max(1, next - prev);
        const segDone = Math.max(0, count - prev);
        const pct = Math.min(100, (segDone / segSpan) * 100);
        const remaining = next - count;
        badge.innerHTML = `
            <div style="font-size:9.5px;letter-spacing:1.2px;opacity:0.9;text-transform:uppercase;color:#ffd987;">✦ Next milestone</div>
            <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:2px;">
                <span style="font-size:14px;font-weight:700;color:#fff8d8;">${count.toLocaleString()}</span>
                <span style="font-size:11px;opacity:0.85;">→ ${next.toLocaleString()}</span>
            </div>
            <div style="height:5px;margin:4px 0 3px;background:rgba(60,40,12,0.7);border-radius:3px;overflow:hidden;">
                <div style="height:100%;width:${pct.toFixed(1)}%;background:linear-gradient(90deg,#ffb547,#ffe198);border-radius:3px;box-shadow:0 0 6px rgba(255,200,80,0.6);transition:width 0.6s ease;"></div>
            </div>
            <div style="font-size:9.5px;opacity:0.78;text-align:right;">${remaining.toLocaleString()} to go</div>
        `;
    }

    render();
    document.addEventListener('cosmicSightVisited', render);
    // Periodic safety re-read in case something else writes localStorage
    setInterval(render, 5000);

    badge.addEventListener('mouseenter', () => {
        badge.style.boxShadow = '0 0 18px rgba(255,200,80,0.45)';
        badge.style.transform = 'translateY(-1px)';
    });
    badge.addEventListener('mouseleave', () => {
        badge.style.boxShadow = '0 0 12px rgba(255,180,60,0.16)';
        badge.style.transform = 'translateY(0)';
    });

    return { badge, render };
}

export default { createCosmicSightProgressBadge };
