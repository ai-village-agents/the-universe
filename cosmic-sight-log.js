// cosmic-sight-log.js — Press L to view chronological discovery log.
// Author: Claude Opus 4.7
//
// Reads localStorage `aiv_cosmic_sights_log_v1` (an array of {name, ts, description},
// most recent first, capped at 200) populated by cosmic-sight-tracker.js whenever the
// camera comes near a new cosmic sight.
//
// Click any row to teleport via the cosmic sights atlas. Press L or Escape to close.

import { categorize, CATEGORY_RULES } from './cosmic-sights-atlas.js';

const LOG_KEY = 'aiv_cosmic_sights_log_v1';

function loadLog() {
    try {
        const raw = localStorage.getItem(LOG_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
}

function relativeTime(ts) {
    const now = Date.now();
    const dt = Math.max(0, now - ts);
    const sec = Math.floor(dt / 1000);
    if (sec < 10) return 'just now';
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const d = new Date(ts);
    const today = new Date();
    const sameDay = d.toDateString() === today.toDateString();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    if (sameDay) return `Today ${hh}:${mm}`;
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mo}/${dd} ${hh}:${mm}`;
}

export function createCosmicSightLog({ audio } = {}) {
    let isOpen = false;

    const overlay = document.createElement('div');
    overlay.id = 'cosmic-sight-log';
    overlay.style.cssText = [
        'position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0',
        'background:rgba(5,8,20,0.78)',
        'backdrop-filter:blur(4px)',
        '-webkit-backdrop-filter:blur(4px)',
        'z-index:120',
        'display:none',
        'align-items:center', 'justify-content:center',
        'font-family:Georgia,serif'
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
        'width:min(620px,92vw)', 'max-height:78vh',
        'background:linear-gradient(135deg,rgba(20,15,40,0.98),rgba(10,30,60,0.98))',
        'border:1px solid rgba(255,220,140,0.4)',
        'border-radius:14px',
        'box-shadow:0 0 40px rgba(255,210,120,0.22), 0 8px 32px rgba(0,0,0,0.6)',
        'padding:16px 18px 14px',
        'color:#e8eeff',
        'display:flex', 'flex-direction:column', 'gap:10px',
        'overflow:hidden'
    ].join(';');
    overlay.appendChild(panel);

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(160,200,255,0.22);padding-bottom:10px;';
    const title = document.createElement('div');
    title.innerHTML = '📜 <span style="color:#ffd87a">Discovery Log</span>';
    title.style.cssText = 'font:18px/1.1 Georgia,serif;flex:1;letter-spacing:0.4px;';
    header.appendChild(title);

    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font:11px/1.2 monospace;color:#8aa0c8;';
    header.appendChild(subtitle);

    const streakEl = document.createElement('div');
    streakEl.style.cssText = 'font:11px/1.3 monospace;color:#ffae5b;margin-top:3px;display:none;';
    header.appendChild(streakEl);

    panel.appendChild(header);

    // Category filter row (Opus 4.7 v2)
    let currentFilter = 'all';
    const filterRow = document.createElement('div');
    filterRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:5px;padding-bottom:6px;border-bottom:1px solid rgba(160,200,255,0.15);';
    const filterDefs = [
        { id: 'all', label: '✦ All' },
        ...CATEGORY_RULES.map(r => ({ id: r.id, label: r.label }))
    ];
    const filterBtns = {};
    filterDefs.forEach(def => {
        const btn = document.createElement('button');
        btn.textContent = def.label;
        btn.dataset.filterId = def.id;
        btn.style.cssText = [
            'font:11px/1.2 monospace', 'color:#cfe6ff',
            'background:rgba(40,60,100,0.45)',
            'border:1px solid rgba(120,160,210,0.35)',
            'border-radius:6px',
            'padding:4px 8px',
            'cursor:pointer',
            'transition:all 0.12s ease'
        ].join(';');
        btn.addEventListener('mouseenter', () => {
            if (currentFilter !== def.id) btn.style.background = 'rgba(60,90,140,0.6)';
        });
        btn.addEventListener('mouseleave', () => {
            if (currentFilter !== def.id) btn.style.background = 'rgba(40,60,100,0.45)';
        });
        btn.addEventListener('click', () => {
            currentFilter = def.id;
            updateFilterStyles();
            render();
        });
        filterBtns[def.id] = btn;
        filterRow.appendChild(btn);
    });
    function updateFilterStyles() {
        Object.entries(filterBtns).forEach(([id, btn]) => {
            if (id === currentFilter) {
                btn.style.background = 'rgba(255,210,120,0.30)';
                btn.style.borderColor = 'rgba(255,220,140,0.75)';
                btn.style.color = '#fff7c8';
            } else {
                btn.style.background = 'rgba(40,60,100,0.45)';
                btn.style.borderColor = 'rgba(120,160,210,0.35)';
                btn.style.color = '#cfe6ff';
            }
        });
    }
    updateFilterStyles();
    panel.appendChild(filterRow);

    // "Discovered today" toggle row (Opus 4.7 v3)
    let todayOnly = false;
    const todayRow = document.createElement('div');
    todayRow.style.cssText = 'display:flex;align-items:center;gap:8px;padding:6px 0 4px 0;border-bottom:1px solid rgba(160,200,255,0.10);';
    const todayBtn = document.createElement('button');
    todayBtn.textContent = '📅 Today only';
    todayBtn.style.cssText = [
        'font:11px/1.2 monospace', 'color:#cfe6ff',
        'background:rgba(40,60,100,0.45)',
        'border:1px solid rgba(120,160,210,0.35)',
        'border-radius:6px',
        'padding:4px 10px', 'cursor:pointer'
    ].join(';');
    function updateTodayStyle() {
        if (todayOnly) {
            todayBtn.style.background = 'rgba(255,210,120,0.30)';
            todayBtn.style.borderColor = 'rgba(255,220,140,0.75)';
            todayBtn.style.color = '#fff7c8';
        } else {
            todayBtn.style.background = 'rgba(40,60,100,0.45)';
            todayBtn.style.borderColor = 'rgba(120,160,210,0.35)';
            todayBtn.style.color = '#cfe6ff';
        }
    }
    todayBtn.addEventListener('click', () => {
        todayOnly = !todayOnly;
        updateTodayStyle();
        render();
    });
    todayRow.appendChild(todayBtn);
    const todayHint = document.createElement('span');
    todayHint.style.cssText = 'font:11px/1.2 monospace;color:#7da7d6;';
    todayHint.textContent = 'Show only sights you discovered today';
    todayRow.appendChild(todayHint);
    panel.appendChild(todayRow);

    const listWrap = document.createElement('div');
    listWrap.style.cssText = 'overflow-y:auto;max-height:60vh;padding-right:4px;display:flex;flex-direction:column;gap:5px;';
    panel.appendChild(listWrap);

    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;align-items:center;gap:10px;border-top:1px solid rgba(160,200,255,0.18);padding-top:8px;';
    const hint = document.createElement('div');
    hint.style.cssText = 'flex:1;font:11px/1.3 monospace;color:#7a90b8;';
    hint.textContent = 'Click a row to teleport · L or Esc to close';
    footer.appendChild(hint);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '🗑 Clear log';
    clearBtn.style.cssText = [
        'font:11px/1.2 monospace', 'color:#ffb0a0',
        'background:rgba(80,30,40,0.55)',
        'border:1px solid rgba(255,160,140,0.35)',
        'border-radius:6px',
        'padding:5px 10px',
        'cursor:pointer'
    ].join(';');
    clearBtn.addEventListener('click', () => {
        try { localStorage.removeItem(LOG_KEY); } catch (_) {}
        render();
    });
    footer.appendChild(clearBtn);
    panel.appendChild(footer);

    document.body.appendChild(overlay);

    function render() {
        const allEntries = loadLog();
        const _isToday = (ts) => {
            try { const d = new Date(ts); const n = new Date(); return d.toDateString() === n.toDateString(); }
            catch (_) { return false; }
        };
        let entries = currentFilter === 'all'
            ? allEntries
            : allEntries.filter(e => categorize(e.name) === currentFilter);
        if (todayOnly) entries = entries.filter(e => _isToday(e.ts));
        listWrap.innerHTML = '';
        // Compute consecutive-day streak ending today (or yesterday if no entry today)
        try {
            const dayKeys = new Set();
            for (const e of allEntries) {
                try { dayKeys.add(new Date(e.ts).toDateString()); } catch (_) {}
            }
            let streak = 0;
            const cur = new Date();
            cur.setHours(12, 0, 0, 0);
            const todayKey = cur.toDateString();
            const hasToday = dayKeys.has(todayKey);
            // Allow streak to include yesterday-only (haven't logged today yet but still on streak)
            if (!hasToday) cur.setDate(cur.getDate() - 1);
            while (dayKeys.has(cur.toDateString())) {
                streak++;
                cur.setDate(cur.getDate() - 1);
            }
            if (streak >= 2) {
                streakEl.textContent = `🔥 ${streak}-day discovery streak${hasToday ? '' : ' (find one today to extend!)'}`;
                streakEl.style.color = streak >= 7 ? '#ffd76b' : (streak >= 3 ? '#ff9a3c' : '#ffae5b');
                streakEl.style.display = 'block';
            } else if (streak === 1 && hasToday) {
                streakEl.textContent = '🔥 First day of a new streak!';
                streakEl.style.color = '#ffae5b';
                streakEl.style.display = 'block';
            } else {
                streakEl.style.display = 'none';
            }
        } catch (_) { streakEl.style.display = 'none'; }
        if (allEntries.length === 0) {
            subtitle.textContent = '0 entries';
        } else if (currentFilter === 'all' && !todayOnly) {
            subtitle.textContent = `${allEntries.length} entr${allEntries.length === 1 ? 'y' : 'ies'} · most recent first`;
        } else {
            const tag = todayOnly ? ' · today only' : '';
            subtitle.textContent = `${entries.length} of ${allEntries.length} (filtered)${tag}`;
        }
        if (allEntries.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:30px 12px;text-align:center;color:#8aa0c8;font:italic 13px/1.4 Georgia,serif;';
            empty.innerHTML = 'No cosmic sights discovered yet. Fly close to any glowing diamond!<br><br>'
                + '<span style="font-style:normal;font-size:11px;color:#7da7d6">'
                + 'Tip: <b style="color:#bcd7ff">C</b> opens the cosmic sights atlas · '
                + '<b style="color:#bcd7ff">N</b> opens the compass to the nearest undiscovered sight.'
                + '</span>';
            listWrap.appendChild(empty);
            return;
        }
        if (entries.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'padding:30px 12px;text-align:center;color:#8aa0c8;font:italic 13px/1.4 Georgia,serif;';
            const def = filterDefs.find(d => d.id === currentFilter);
            empty.innerHTML = `No discoveries match <b style="color:#fff7c8">${def ? def.label : currentFilter}</b> yet.<br><br>`
                + '<span style="font-style:normal;font-size:11px;color:#7da7d6">'
                + 'Try a different filter, or fly close to undiscovered diamonds in this category.'
                + '</span>';
            listWrap.appendChild(empty);
            return;
        }
        let lastDayKey = null;
        const _dayLabel = (ts) => {
            const d = new Date(ts);
            const today = new Date();
            const yest = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
            const isSameDay = (a, b) => a.toDateString() === b.toDateString();
            if (isSameDay(d, today)) return 'Today';
            if (isSameDay(d, yest)) return 'Yesterday';
            const opts = { weekday: 'long', month: 'short', day: 'numeric' };
            try { return d.toLocaleDateString(undefined, opts); } catch (_) { return d.toDateString(); }
        };
        entries.forEach((e) => {
            const dayKey = new Date(e.ts).toDateString();
            if (dayKey !== lastDayKey) {
                lastDayKey = dayKey;
                const dayCount = entries.filter(x => new Date(x.ts).toDateString() === dayKey).length;
                const header = document.createElement('div');
                header.style.cssText = [
                    'display:flex','align-items:center','justify-content:space-between',
                    'margin:10px 4px 4px',
                    'padding:4px 6px',
                    'border-bottom:1px solid rgba(255,220,140,0.32)',
                    'font:600 11px/1.2 Georgia,serif',
                    'color:#ffd98a','letter-spacing:0.6px','text-transform:uppercase'
                ].join(';');
                const lbl = document.createElement('span');
                lbl.textContent = _dayLabel(e.ts);
                const cnt = document.createElement('span');
                cnt.style.cssText = 'color:#a8b8d8;font-weight:400;text-transform:none;letter-spacing:0;';
                cnt.textContent = `${dayCount} discover${dayCount === 1 ? 'y' : 'ies'}`;
                header.appendChild(lbl);
                header.appendChild(cnt);
                listWrap.appendChild(header);
            }
            const row = document.createElement('div');
            row.style.cssText = [
                'display:flex', 'align-items:flex-start', 'gap:10px',
                'padding:7px 9px',
                'background:rgba(255,220,140,0.05)',
                'border:1px solid rgba(160,200,255,0.18)',
                'border-radius:8px',
                'cursor:pointer',
                'transition:background 0.15s ease, border-color 0.15s ease, transform 0.12s ease'
            ].join(';');
            row.addEventListener('mouseenter', () => {
                row.style.background = 'rgba(255,220,140,0.13)';
                row.style.borderColor = 'rgba(255,220,140,0.55)';
                row.style.transform = 'translateX(2px)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.background = 'rgba(255,220,140,0.05)';
                row.style.borderColor = 'rgba(160,200,255,0.18)';
                row.style.transform = 'translateX(0)';
            });

            const left = document.createElement('div');
            left.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:2px;min-width:0;';
            const nameLine = document.createElement('div');
            nameLine.style.cssText = 'font:14px/1.2 Georgia,serif;color:#fff7c8;letter-spacing:0.3px;';
            const _ecat = categorize(e.name);
            const _eemoji = (CATEGORY_RULES.find(r => r.id === _ecat)?.label || '').split(' ')[0] || '✦';
            nameLine.textContent = `${_eemoji} ${e.name}`;
            left.appendChild(nameLine);
            if (e.description) {
                const desc = document.createElement('div');
                desc.style.cssText = 'font:italic 11px/1.3 Georgia,serif;color:#a8b8d8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
                desc.textContent = e.description;
                left.appendChild(desc);
            }
            row.appendChild(left);

            const right = document.createElement('div');
            right.style.cssText = 'font:10px/1.2 monospace;color:#8aa0c8;text-align:right;flex-shrink:0;padding-top:2px;';
            right.textContent = relativeTime(e.ts);
            row.appendChild(right);

            row.addEventListener('click', () => {
                const atlas = window.__cosmicSightsAtlas;
                if (atlas && atlas.teleportTo) {
                    atlas.teleportTo(e.name);
                    if (audio && audio.isStarted && audio.isStarted() && !audio.isMuted()) {
                        try { audio.playWhoosh(); } catch (_) {}
                    }
                    close();
                }
            });
            listWrap.appendChild(row);
        });
    }

    function open() {
        if (isOpen) return;
        isOpen = true;
        render();
        overlay.style.display = 'flex';
        if (audio && audio.isStarted && audio.isStarted() && !audio.isMuted()) {
            try { audio.playChime('panelOpen'); } catch (_) {}
        }
    }
    function close() {
        if (!isOpen) return;
        isOpen = false;
        overlay.style.display = 'none';
    }
    function toggle() { if (isOpen) close(); else open(); }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => {
        if (!isOpen) return;
        if (e.key === 'Escape') { close(); e.preventDefault(); }
    });
    document.addEventListener('keydown', (e) => {
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target && e.target.isContentEditable)) return;
        if (e.key === 'l' || e.key === 'L') { toggle(); e.preventDefault(); }
    });
    // Refresh on new discovery
    document.addEventListener('cosmicSightVisited', () => { if (isOpen) render(); });

    return { open, close, toggle, refresh: render, isOpen: () => isOpen };
}
