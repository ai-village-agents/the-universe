// cosmic-sight-category-milestones.js — Opus 4.7
// Toast celebrations when a cosmic sight CATEGORY crosses 25%, 50%, or 100%
// completion. Persists per-(category, threshold) "shown" flag so each milestone
// fires exactly once per visitor's lifetime in the universe.
//
// Reads:
//   - localStorage 'aiv_cosmic_sights_v1' (Set of discovered names)
//   - listens to document 'cosmicSightVisited' events
// Writes:
//   - localStorage 'aiv_cosmic_category_milestones_v1' (Set of "<catId>:<thr>")
// Exposes window.__cosmicSightCategoryMilestones = { check, dom, thresholds }

import { CATEGORY_RULES, categorize } from './cosmic-sights-atlas.js';

const SIGHTS_KEY = 'aiv_cosmic_sights_v1';
const SHOWN_KEY = 'aiv_cosmic_category_milestones_v1';
const THRESHOLDS = [25, 50, 100];

function readDiscovered() {
    try {
        const raw = localStorage.getItem(SIGHTS_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
}
function readShown() {
    try {
        const raw = localStorage.getItem(SHOWN_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
}
function writeShown(set) {
    try { localStorage.setItem(SHOWN_KEY, JSON.stringify(Array.from(set))); } catch (e) {}
}

export function createCosmicSightCategoryMilestones({ sights, audio } = {}) {
    // Pre-compute totals per category
    const totals = {};
    const sightCat = new Map();
    for (const rule of CATEGORY_RULES) totals[rule.id] = 0;
    (sights || []).forEach((s) => {
        const cat = categorize(s.name);
        sightCat.set(s.name, cat);
        totals[cat] = (totals[cat] || 0) + 1;
    });

    const ruleById = new Map();
    for (const rule of CATEGORY_RULES) ruleById.set(rule.id, rule);

    // Toast container (single, animated)
    const toast = document.createElement('div');
    toast.id = 'cosmic-category-milestone-toast';
    toast.style.cssText = [
        'position:fixed',
        'top:50%',
        'left:50%',
        'transform:translate(-50%,-50%) scale(0.8)',
        'pointer-events:none',
        'opacity:0',
        'transition:transform 420ms cubic-bezier(0.2,0.9,0.3,1.4), opacity 320ms ease',
        'z-index:9300',
        'padding:18px 26px',
        'border-radius:16px',
        'background:linear-gradient(135deg,rgba(40,30,80,0.96),rgba(8,40,80,0.96))',
        'border:1px solid rgba(255,220,140,0.65)',
        'box-shadow:0 0 38px rgba(255,200,100,0.42), 0 0 80px rgba(180,140,255,0.28)',
        'font:600 14px/1.45 "Trebuchet MS","Helvetica",sans-serif',
        'color:#fff5d4',
        'text-align:center',
        'min-width:280px',
        'max-width:420px',
    ].join(';');
    document.body.appendChild(toast);

    let toastTimer = null;
    function showToast(html) {
        toast.innerHTML = html;
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%,-50%) scale(1)';
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translate(-50%,-50%) scale(0.92)';
        }, 3600);
    }

    function check() {
        try {
            const discovered = readDiscovered();
            const shown = readShown();
            const counts = {};
            for (const rule of CATEGORY_RULES) counts[rule.id] = 0;
            discovered.forEach((name) => {
                const cat = sightCat.get(name);
                if (cat && counts[cat] !== undefined) counts[cat] += 1;
            });

            const newlyHit = [];
            for (const rule of CATEGORY_RULES) {
                const c = counts[rule.id];
                const t = totals[rule.id];
                if (!t) continue;
                const pct = (c / t) * 100;
                for (const thr of THRESHOLDS) {
                    if (pct >= thr) {
                        const key = `${rule.id}:${thr}`;
                        if (!shown.has(key)) {
                            shown.add(key);
                            newlyHit.push({ rule, thr, c, t });
                        }
                    }
                }
            }
            if (newlyHit.length === 0) return;
            writeShown(shown);

            // Show the highest-percentage milestone first (one toast per check call)
            newlyHit.sort((a, b) => b.thr - a.thr);
            const m = newlyHit[0];
            const isComplete = m.thr === 100;
            const headline = isComplete
                ? `🏆 ${m.rule.label} — COMPLETE!`
                : `${m.thr}% milestone · ${m.rule.label}`;
            const subline = isComplete
                ? `All ${m.t} discovered. ${m.rule.label.split(' ').slice(1).join(' ')} fully charted.`
                : `${m.c} / ${m.t} discovered (${m.thr}%)`;
            const accent = isComplete ? '#ffd76b' : (m.thr === 50 ? '#ff9a3c' : '#cfeaff');
            showToast(
                `<div style="font-size:11px;letter-spacing:1.5px;color:${accent};opacity:0.85;margin-bottom:6px">CATEGORY MILESTONE</div>`
                + `<div style="font-size:18px;color:${accent};margin-bottom:4px">${headline}</div>`
                + `<div style="font-size:12px;color:#bcd9f2;font-weight:400">${subline}</div>`
            );
            try {
                if (audio?.playChime) audio.playChime(isComplete ? 'milestone' : 'discover');
            } catch (e) {}
            try {
                document.dispatchEvent(new CustomEvent('cosmicCategoryMilestone', { detail: { categoryId: m.rule.id, threshold: m.thr, count: m.c, total: m.t } }));
            } catch (e) {}

            // If multiple milestones fire at once, queue subsequent toasts
            if (newlyHit.length > 1) {
                const rest = newlyHit.slice(1);
                rest.forEach((next, i) => {
                    setTimeout(() => {
                        const isC = next.thr === 100;
                        const ac = isC ? '#ffd76b' : (next.thr === 50 ? '#ff9a3c' : '#cfeaff');
                        const hdl = isC ? `🏆 ${next.rule.label} — COMPLETE!` : `${next.thr}% milestone · ${next.rule.label}`;
                        const sub = isC ? `All ${next.t} discovered.` : `${next.c} / ${next.t} discovered (${next.thr}%)`;
                        showToast(
                            `<div style="font-size:11px;letter-spacing:1.5px;color:${ac};opacity:0.85;margin-bottom:6px">CATEGORY MILESTONE</div>`
                            + `<div style="font-size:18px;color:${ac};margin-bottom:4px">${hdl}</div>`
                            + `<div style="font-size:12px;color:#bcd9f2;font-weight:400">${sub}</div>`
                        );
                    }, (i + 1) * 4200);
                });
            }
        } catch (e) {
            // Silent — never break the universe over a milestone toast
        }
    }

    document.addEventListener('cosmicSightVisited', check);
    // Initial check (in case a milestone was already crossed but never announced)
    setTimeout(check, 800);

    if (typeof window !== 'undefined') {
        try { window.__cosmicSightCategoryMilestones = { check, dom: toast, thresholds: THRESHOLDS, totals }; } catch (e) {}
    }

    return { check, dom: toast, thresholds: THRESHOLDS };
}

export default createCosmicSightCategoryMilestones;
