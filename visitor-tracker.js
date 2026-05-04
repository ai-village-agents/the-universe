// visitor-tracker.js — Persists which worlds a visitor has opened from the hub.
// Author: Claude Opus 4.7
// Accessibility polish: GPT-5.4
//
// Stores set of world ids in localStorage. Renders a small UI badge with progress.
// When the visitor opens all worlds, fires a celebration banner.

const STORAGE_KEY = 'aiv_universe_visited_v1';

export function createVisitorTracker(allWorlds) {
    const total = allWorlds.length;
    let visited = new Set();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) arr.forEach((id) => visited.add(id));
        }
    } catch (_) { /* ignore */ }

    let celebrationShown = visited.size >= total;

    // Build badge UI
    const badge = document.createElement('div');
    badge.id = 'visitor-badge';
    badge.style.cssText = [
        'position:fixed', 'top:8px', 'left:50%', 'transform:translateX(-50%)',
        'padding:6px 14px', 'font:12px/1.3 Georgia,serif', 'color:#cce8ff',
        'background:rgba(0,12,26,0.55)', 'border:1px solid rgba(127,200,255,0.35)',
        'border-radius:8px', 'pointer-events:auto', 'z-index:1500',
        'letter-spacing:0.04em', 'cursor:pointer', 'user-select:none',
        'box-shadow:0 0 12px rgba(80,160,255,0.18)'
    ].join(';');
    badge.title = 'Click or press Enter for visitor progress details';
    badge.setAttribute('role', 'button');
    badge.setAttribute('tabindex', '0');
    badge.setAttribute('aria-haspopup', 'dialog');
    badge.setAttribute('aria-controls', 'visitor-panel');
    badge.setAttribute('aria-expanded', 'false');
    document.body.appendChild(badge);

    // Detail panel
    const panel = document.createElement('div');
    panel.id = 'visitor-panel';
    panel.style.cssText = [
        'position:fixed', 'top:42px', 'left:50%', 'transform:translateX(-50%)',
        'padding:14px 18px', 'font:12.5px/1.45 Georgia,serif', 'color:#dde7f4',
        'background:rgba(0,8,18,0.92)', 'border:1px solid rgba(127,200,255,0.45)',
        'border-radius:10px', 'z-index:1499', 'display:none', 'min-width:280px',
        'max-width:min(440px,90vw)', 'box-shadow:0 8px 32px rgba(0,0,0,0.6)'
    ].join(';');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-labelledby', 'visitor-panel-title');
    panel.setAttribute('tabindex', '-1');
    document.body.appendChild(panel);

    function openPanel() {
        refreshPanel();
        panel.style.display = 'block';
        panel.setAttribute('aria-hidden', 'false');
        badge.setAttribute('aria-expanded', 'true');
        const closeButton = panel.querySelector('#visitor-close');
        (closeButton || panel).focus({ preventScroll: true });
    }

    function closePanel({ restoreFocus = true } = {}) {
        panel.style.display = 'none';
        panel.setAttribute('aria-hidden', 'true');
        badge.setAttribute('aria-expanded', 'false');
        if (restoreFocus) badge.focus({ preventScroll: true });
    }

    function togglePanel() {
        if (panel.style.display === 'none') openPanel();
        else closePanel();
    }

    badge.addEventListener('click', togglePanel);
    badge.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            togglePanel();
        } else if (event.key === 'Escape' && panel.style.display !== 'none') {
            event.preventDefault();
            closePanel();
        }
    });
    panel.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closePanel();
        }
    });

    function refreshBadge() {
        const n = visited.size;
        const pct = Math.round((n / total) * 100);
        if (n >= total) {
            badge.innerHTML = `<span style="color:#ffe999">★</span> All ${total} worlds visited! <span style="color:#7fdcff">100%</span>`;
            badge.setAttribute('aria-label', `All ${total} worlds visited. Activate for visitor progress details.`);
        } else {
            badge.innerHTML = `🪐 Worlds visited: <strong>${n} / ${total}</strong> · ${pct}%`;
            badge.setAttribute('aria-label', `Worlds visited: ${n} of ${total}, ${pct} percent. Activate for visitor progress details.`);
        }
    }

    function refreshPanel() {
        const lines = allWorlds.map((w) => {
            const hit = visited.has(w.id);
            const dot = hit ? '<span style="color:#7fffaf">●</span>' : '<span style="color:#444">○</span>';
            const name = hit ? `<span style="color:#fff">${escapeHtml(w.name)}</span>` : `<span style="color:#88a">${escapeHtml(w.name)}</span>`;
            return `<div style="margin:2px 0">${dot} ${name} <span style="color:#678">— ${escapeHtml(w.agent || '')}</span></div>`;
        }).join('');
        const n = visited.size;
        panel.innerHTML = `
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:6px;">
                <div id="visitor-panel-title" style="font:bold italic 14px Georgia,serif;color:#7fdcff;">Visitor Progress</div>
                <button id="visitor-close" type="button" aria-label="Close visitor progress panel" style="padding:3px 8px;font:12px Georgia,serif;color:#d9ecff;background:rgba(16,34,56,0.9);border:1px solid rgba(127,200,255,0.4);border-radius:6px;cursor:pointer;">Close</button>
            </div>
            <div style="margin-bottom:8px;color:#bcd">You have opened ${n} of ${total} worlds from this browser.</div>
            <div role="list" aria-label="Visited world progress">${lines}</div>
            <div style="margin-top:10px;font-size:11px;color:#557">Stored locally only. <a href="#" id="visitor-reset" style="color:#88aacc">Reset progress</a></div>`;
        const reset = panel.querySelector('#visitor-reset');
        if (reset) {
            reset.addEventListener('click', (e) => {
                e.preventDefault();
                visited.clear();
                persist();
                celebrationShown = false;
                refreshBadge();
                refreshPanel();
            });
        }
        const close = panel.querySelector('#visitor-close');
        if (close) close.addEventListener('click', () => closePanel());
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function persist() {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited])); } catch (_) {}
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
    }

    function recordVisit(id) {
        if (!id || visited.has(id)) return;
        const known = allWorlds.some((w) => w.id === id);
        if (!known) return;
        visited.add(id);
        persist();
        refreshBadge();
        if (panel.style.display === 'block') refreshPanel();
        if (visited.size >= total) showCelebration();
    }

    refreshBadge();
    return { recordVisit, isComplete: () => visited.size >= total, count: () => visited.size };
}
