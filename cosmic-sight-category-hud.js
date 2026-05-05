// cosmic-sight-category-hud.js — Opus 4.7
// Tiny HUD strip below the Cosmic Census badge showing per-category progress
// (discovered / total) for each of the 8 cosmic sight categories.
// Auto-updates on cosmicSightVisited and periodically reads from localStorage.

import { CATEGORY_RULES, categorize } from './cosmic-sights-atlas.js';

const STORAGE_KEY = 'aiv_cosmic_sights_v1';

function readDiscovered() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
}

export function createCosmicSightCategoryHud({ sights }) {
    // Pre-compute totals per category
    const totals = {};
    const sightCat = new Map();
    for (const rule of CATEGORY_RULES) totals[rule.id] = 0;
    sights.forEach((s) => {
        const cat = categorize(s.name);
        sightCat.set(s.name, cat);
        totals[cat] = (totals[cat] || 0) + 1;
    });

    const hud = document.createElement('div');
    hud.id = 'cosmic-sight-category-hud';
    hud.style.cssText = [
        'position:fixed', 'top:148px', 'right:12px',
        'padding:5px 9px',
        'font:10px/1.45 monospace',
        'color:#bcd9f2',
        'background:linear-gradient(135deg,rgba(15,12,32,0.82),rgba(8,20,46,0.82))',
        'border:1px solid rgba(140,180,235,0.32)',
        'border-radius:9px',
        'box-shadow:0 0 10px rgba(140,200,255,0.14)',
        'z-index:30',
        'pointer-events:none',
        'letter-spacing:0.15px',
        'min-width:140px',
        'text-align:left',
        'transition:box-shadow 0.3s ease',
    ].join(';');
    document.body.appendChild(hud);

    function render() {
        const discovered = readDiscovered();
        const counts = {};
        for (const rule of CATEGORY_RULES) counts[rule.id] = 0;
        discovered.forEach((name) => {
            // sightCat may not have a name if the sight was renamed/removed
            const cat = sightCat.get(name);
            if (cat && counts[cat] !== undefined) counts[cat] += 1;
        });

        const rows = CATEGORY_RULES.map((rule) => {
            const c = counts[rule.id];
            const t = totals[rule.id];
            // pull just the emoji from the label (first 2 chars roughly)
            // labels are like "🌑 Compact Objects" so the emoji is everything before the first space
            const sp = rule.label.indexOf(' ');
            const emoji = sp > 0 ? rule.label.slice(0, sp) : rule.label;
            const ratio = t === 0 ? 0 : c / t;
            const pct = Math.round(ratio * 100);
            const barLen = 8;
            const filled = Math.round(ratio * barLen);
            const bar = '▰'.repeat(filled) + '▱'.repeat(Math.max(0, barLen - filled));
            const bright = ratio > 0 ? '#fff5d4' : '#7d97b8';
            return `<div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px">${emoji}</span><span style="color:${bright};font-size:9px;width:34px;text-align:right">${c}/${t}</span><span style="opacity:${ratio > 0 ? 1 : 0.45};color:#a9c8e6">${bar}</span></div>`;
        }).join('');

        hud.innerHTML = `<div style="color:#cfeaff;font-size:9px;margin-bottom:3px;letter-spacing:0.5px;opacity:0.78">CATEGORY PROGRESS</div>${rows}`;
    }

    render();
    document.addEventListener('cosmicSightVisited', render);

    return { hud, render, totals };
}

export default createCosmicSightCategoryHud;
