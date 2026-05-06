/**
 * Cosmic Sights Atlas Panel — Opus 4.7 (D399)
 *
 * Press 'C' to toggle a panel that lists every cosmic sight grouped by
 * category, with a teleport button for each. Discovery state is reflected
 * live from localStorage `aiv_cosmic_sights_v1` and `cosmicSightVisited`
 * CustomEvents.
 *
 * Public API:
 *   createCosmicSightsAtlas({ camera, controls, sights, audio })
 *     -> { toggle, open, close, isOpen, refresh, teleportTo(name) }
 *
 * Hooks: bind 'C' key (lowercase + uppercase) to atlas.toggle(). Skips when
 * focus is on inputs/textareas to avoid eating typing in the directory.
 */

const STORAGE_KEY = 'aiv_cosmic_sights_v1';
const FAVORITES_KEY = 'aiv_cosmic_favorites_v1';

const LOG_KEY = 'aiv_cosmic_sights_log_v1';
function loadLogTimestamps() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw);
    const m = new Map();
    if (Array.isArray(arr)) {
      for (const e of arr) {
        if (!e || !e.name) continue;
        const ts = +e.ts || 0;
        const cur = m.get(e.name) || 0;
        if (ts > cur) m.set(e.name, ts);
      }
    }
    return m;
  } catch (_) { return new Map(); }
}

function loadFavoritesSet() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) { return new Set(); }
}

function saveFavoritesSet(set) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

// Category detection — keyword first-match wins. Order matters.
export const CATEGORY_RULES = [
  { id: 'compact', label: '🌑 Compact Objects', match: ['black hole', 'neutron star', 'pulsar', 'magnetar', 'white dwarf', 'brown dwarf', 'thorne', 'photon sphere', 'hawking', 'event horizon', 'tidal disruption', 'microquasar'] },
  { id: 'transient', label: '💥 Transients & Bursts', match: ['supernova', 'gamma-ray burst', 'fast radio burst', 'kilonova', 'flash', 'flare', 'burst', 'crust quake', 'stellar wind collision', 'neutron star merger'] },
  { id: 'galactic', label: '🌀 Galaxies & AGN', match: ['galaxy', 'quasar', 'blazar', 'agn', 'active galactic', 'seyfert', 'radio lobe', 'jet', 'fermi bubble', 'cooling flow', 'lyman alpha', 'sunyaev', 'ring galaxy'] },
  { id: 'stellar',  label: '⭐ Stars & Stellar', match: ['star', 'sun', 'red giant', 'wolf-rayet', 'cepheid', 'binary', 'symbiotic', 'blue straggler', 'protoplanetary', 'protostar', 'circumstellar', 'circumbinary', 'stellar nursery', 'planetary nebula', 'open cluster', 'globular cluster', 'hypervelocity', 'cme', 'coronal'] },
  { id: 'planetary', label: '🪐 Planetary & Solar', match: ['planet', 'moon', 'asteroid', 'comet', 'kuiper', 'oort', 'sedna', 'voyager', 'heliosphere', 'heliopause', 'heliospheric', 'termination shock', 'interplanetary', 'interstellar object', 'g-cloud', 'local interstellar', 'coronagraph', 'rogue planet', 'ringed planet', 'exoplanet'] },
  { id: 'cosmology', label: '🕸️ Cosmology & Structure', match: ['cosmic web', 'dark matter', 'dark energy', 'cosmic void', 'cosmic string', 'baryon', 'reionization', 'cosmic microwave', 'gravitational wave', 'lensing', 'einstein', 'intergalactic', 'whim', 'gould belt', 'orion spur', 'sagittarius arm', 'perseus arm', 'local bubble', 'primordial'] },
  { id: 'atmospheric', label: '🌈 Atmospheric Optics', match: ['aurora', 'airglow', 'zodiacal', 'gegenschein', 'sprite lightning', 'elve', 'blue jet', 'noctilucent', 'stratospheric', 'sun pillar', 'moon halo', 'parhelion', 'circumzenithal', 'glory', 'gamma flash'] },
  { id: 'exotic',   label: '✨ Exotic & Other', match: ['wormhole', 'wanderer', 'obelisk', 'nebula'] }, // catch-all hooks for the original loose set
];

export function categorize(name) {
  const lower = name.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.match) {
      if (lower.includes(kw)) return rule.id;
    }
  }
  return 'exotic';
}

function loadDiscoveredSet() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (_) { return new Set(); }
}

function saveDiscoveredSet(set) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (_) {}
}

export function createCosmicSightsAtlas({ camera, controls, sights, audio }) {
  let isOpen = false;
  let panel = null;
  let body = null;
  let header = null;
  let countLabel = null;
  let searchInput = null;
  let filterText = '';
  let showOnlyUndiscovered = false;
  let undiscoveredToggle = null;
  let sortByDistance = false;
  let sortByRecent = false;
  let favoritesOnly = false;
  let nearestToggle = null;
  let currentRows = [];
  let focusIndex = -1;

  function ensurePanel() {
    if (panel) return;
    panel = document.createElement('div');
    panel.id = 'cosmic-sights-atlas';
    panel.style.cssText = [
      'position:fixed', 'top:50%', 'left:50%', 'transform:translate(-50%, -50%)',
      'width:min(680px, 92vw)', 'max-height:84vh',
      'background:linear-gradient(160deg, rgba(7,12,28,0.96), rgba(18,8,40,0.96))',
      'border:1px solid rgba(125,249,255,0.45)',
      'border-radius:14px', 'box-shadow:0 0 60px rgba(125,249,255,0.18), inset 0 0 32px rgba(180,140,255,0.08)',
      'color:#dbe7ff', 'font-family:Georgia, serif',
      'z-index:9999', 'display:none', 'flex-direction:column', 'overflow:hidden',
      'backdrop-filter:blur(8px)', '-webkit-backdrop-filter:blur(8px)',
    ].join(';');

    header = document.createElement('div');
    header.style.cssText = [
      'padding:14px 20px 10px 20px',
      'border-bottom:1px solid rgba(125,249,255,0.22)',
      'display:flex', 'flex-direction:column', 'gap:4px',
      'background:linear-gradient(180deg, rgba(125,249,255,0.06), transparent)',
    ].join(';');
    const title = document.createElement('div');
    title.textContent = '🌌  Cosmic Sights Atlas';
    title.style.cssText = 'font-size:18px; letter-spacing:1px; color:#7df9ff; font-weight:bold;';
    countLabel = document.createElement('div');
    countLabel.style.cssText = 'font-size:12px; color:#a7c0e0; font-style:italic; font-family:"Trebuchet MS", sans-serif;';
    const tip = document.createElement('div');
    tip.innerHTML = 'Press <b>C</b> to toggle · <b>Esc</b> to close · click <b>Visit</b> to teleport';
    tip.style.cssText = 'font-size:11px; color:#7d8ba8; font-family:"Trebuchet MS", sans-serif;';
    header.appendChild(title);
    header.appendChild(countLabel);
    header.appendChild(tip);

    const controlsRow = document.createElement('div');
    controlsRow.style.cssText = 'display:flex; gap:8px; align-items:center; margin-top:6px;';
    searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = '🔍 Filter sights by name...';
    searchInput.style.cssText = [
      'flex:1', 'padding:5px 10px',
      'background:rgba(0,0,0,0.4)', 'border:1px solid rgba(125,249,255,0.3)',
      'border-radius:5px', 'color:#dbe7ff', 'font-size:12px',
      'font-family:"Trebuchet MS", sans-serif', 'outline:none',
    ].join(';');
    searchInput.addEventListener('input', () => {
      filterText = searchInput.value.trim().toLowerCase();
      rebuild();
    });
    searchInput.addEventListener('keydown', (ev) => { ev.stopPropagation(); });
    controlsRow.appendChild(searchInput);

    undiscoveredToggle = document.createElement('button');
    undiscoveredToggle.textContent = '◇ Undiscovered only';
    undiscoveredToggle.style.cssText = [
      'background:transparent', 'color:#a7c0e0',
      'border:1px solid rgba(125,249,255,0.3)', 'border-radius:5px',
      'padding:4px 10px', 'font-size:11px', 'cursor:pointer',
      'font-family:"Trebuchet MS", sans-serif',
    ].join(';');
    undiscoveredToggle.addEventListener('click', () => {
      showOnlyUndiscovered = !showOnlyUndiscovered;
      undiscoveredToggle.style.background = showOnlyUndiscovered ? 'rgba(125,249,255,0.18)' : 'transparent';
      undiscoveredToggle.style.color = showOnlyUndiscovered ? '#7df9ff' : '#a7c0e0';
      rebuild();
    });
    controlsRow.appendChild(undiscoveredToggle);

    // 📍 Sort by distance toggle
    nearestToggle = document.createElement('button');
    nearestToggle.textContent = '📍 Nearest';
    nearestToggle.title = 'Sort sights by distance from your current camera position';
    nearestToggle.style.cssText = [
      'background:transparent', 'color:#a7c0e0',
      'border:1px solid rgba(125,249,255,0.3)', 'border-radius:5px',
      'padding:4px 10px', 'font-size:11px', 'cursor:pointer',
      'font-family:"Trebuchet MS", sans-serif',
    ].join(';');
    nearestToggle.addEventListener('click', () => {
      sortByDistance = !sortByDistance;
      if (sortByDistance && sortByRecent) {
        sortByRecent = false;
        if (typeof recentToggle !== 'undefined' && recentToggle) {
          recentToggle.style.background = 'transparent';
          recentToggle.style.color = '#a7c0e0';
        }
      }
      nearestToggle.style.background = sortByDistance ? 'rgba(125,249,255,0.18)' : 'transparent';
      nearestToggle.style.color = sortByDistance ? '#7df9ff' : '#a7c0e0';
      rebuild();
    });
    controlsRow.appendChild(nearestToggle);

    // 🕒 Recent — sort by most recently discovered first
    var recentToggle = document.createElement('button');
    recentToggle.textContent = '🕒 Recent';
    recentToggle.title = 'Sort by most recently discovered first';
    recentToggle.style.cssText = [
      'background:transparent', 'color:#a7c0e0',
      'border:1px solid rgba(125,249,255,0.3)', 'border-radius:5px',
      'padding:4px 10px', 'font-size:11px', 'cursor:pointer',
      'font-family:"Trebuchet MS", sans-serif',
    ].join(';');
    recentToggle.addEventListener('click', () => {
      sortByRecent = !sortByRecent;
      if (sortByRecent && sortByDistance) {
        sortByDistance = false;
        nearestToggle.style.background = 'transparent';
        nearestToggle.style.color = '#a7c0e0';
      }
      recentToggle.style.background = sortByRecent ? 'rgba(125,249,255,0.18)' : 'transparent';
      recentToggle.style.color = sortByRecent ? '#7df9ff' : '#a7c0e0';
      rebuild();
    });
    controlsRow.appendChild(recentToggle);

    // ★ Favorites filter toggle
    const favoritesToggle = document.createElement('button');
    favoritesToggle.textContent = '★ Favorites';
    favoritesToggle.title = 'Show only your starred favorite sights';
    favoritesToggle.style.cssText = [
      'background:transparent', 'color:#ffd97d',
      'border:1px solid rgba(255,217,125,0.45)', 'border-radius:5px',
      'padding:4px 10px', 'font-size:11px', 'cursor:pointer',
      'font-family:"Trebuchet MS", sans-serif',
    ].join(';');
    favoritesToggle.addEventListener('click', () => {
      favoritesOnly = !favoritesOnly;
      favoritesToggle.style.background = favoritesOnly ? 'rgba(255,217,125,0.22)' : 'transparent';
      favoritesToggle.style.color = favoritesOnly ? '#ffe9a0' : '#ffd97d';
      rebuild();
    });
    controlsRow.appendChild(favoritesToggle);

    // 🎲 Random undiscovered sight teleport
    const randomBtn = document.createElement('button');
    randomBtn.textContent = '🎲 Random';
    randomBtn.title = 'Teleport to a random undiscovered sight';
    randomBtn.style.cssText = [
      'background:transparent', 'color:#ffd97d',
      'border:1px solid rgba(255,217,125,0.45)', 'border-radius:5px',
      'padding:4px 10px', 'font-size:11px', 'cursor:pointer',
      'font-family:"Trebuchet MS", sans-serif',
    ].join(';');
    randomBtn.addEventListener('mouseenter', () => { randomBtn.style.background = 'rgba(255,217,125,0.18)'; });
    randomBtn.addEventListener('mouseleave', () => { randomBtn.style.background = 'transparent'; });
    randomBtn.addEventListener('click', () => {
      const discoveredNow = loadDiscoveredSet();
      const undisc = sights.filter((s) => !discoveredNow.has(s.name));
      const pool = undisc.length > 0 ? undisc : sights;
      if (pool.length === 0) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      // brief visual cue: button flashes
      randomBtn.style.background = 'rgba(255,217,125,0.45)';
      setTimeout(() => { randomBtn.style.background = 'transparent'; }, 260);
      teleportTo(pick);
    });
    controlsRow.appendChild(randomBtn);

    // 📋 Export progress snapshot to clipboard as JSON
    const exportBtn = document.createElement('button');
    exportBtn.textContent = '📋 Export';
    exportBtn.title = 'Copy your cosmic-sight progress as JSON to the clipboard';
    exportBtn.style.cssText = [
      'background:transparent', 'color:#a8efb2',
      'border:1px solid rgba(168,239,178,0.45)', 'border-radius:5px',
      'padding:4px 10px', 'font-size:11px', 'cursor:pointer',
      'font-family:"Trebuchet MS", sans-serif',
    ].join(';');
    exportBtn.addEventListener('mouseenter', () => { exportBtn.style.background = 'rgba(168,239,178,0.18)'; });
    exportBtn.addEventListener('mouseleave', () => { exportBtn.style.background = 'transparent'; });
    exportBtn.addEventListener('click', async () => {
      const discoveredNow = loadDiscoveredSet();
      const favoritesNow = loadFavoritesSet();
      // Build per-category counts
      const catTotals = {};
      const catFound = {};
      for (const s of sights) {
        const c = categorize(s.name);
        catTotals[c] = (catTotals[c] || 0) + 1;
        if (discoveredNow.has(s.name)) catFound[c] = (catFound[c] || 0) + 1;
      }
      const snapshot = {
        format: 'aiv-cosmic-sights-atlas-export',
        version: 1,
        exportedAt: new Date().toISOString(),
        totals: {
          totalSights: sights.length,
          discovered: discoveredNow.size,
          favorites: favoritesNow.size,
          percentDiscovered: sights.length > 0 ? +((discoveredNow.size / sights.length) * 100).toFixed(2) : 0,
        },
        byCategory: Object.keys(catTotals).map((id) => ({
          id,
          label: (CATEGORY_RULES.find(r => r.id === id)?.label) || id,
          total: catTotals[id],
          discovered: catFound[id] || 0,
          percent: catTotals[id] > 0 ? +(((catFound[id] || 0) / catTotals[id]) * 100).toFixed(1) : 0,
        })),
        discovered: Array.from(discoveredNow).sort(),
        favorites: Array.from(favoritesNow).sort(),
      };
      const text = JSON.stringify(snapshot, null, 2);
      let copied = false;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch (_) {}
      if (!copied) {
        try {
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          copied = true;
        } catch (_) {}
      }
      const original = exportBtn.textContent;
      exportBtn.textContent = copied ? '✓ Copied!' : '⚠ Failed';
      exportBtn.style.background = copied ? 'rgba(168,239,178,0.45)' : 'rgba(255,120,120,0.35)';
      setTimeout(() => {
        exportBtn.textContent = original;
        exportBtn.style.background = 'transparent';
      }, 1400);
    });
    controlsRow.appendChild(exportBtn);

    // 📥 Import progress snapshot from clipboard JSON (merge discovered + favorites)
    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 Import';
    importBtn.title = 'Paste an Atlas JSON snapshot to merge discovered + favorites';
    importBtn.style.cssText = [
      'background:transparent', 'color:#a8b8ef',
      'border:1px solid rgba(168,184,239,0.45)', 'border-radius:5px',
      'padding:4px 10px', 'font-size:11px', 'cursor:pointer',
      'font-family:"Trebuchet MS", sans-serif',
    ].join(';');
    importBtn.addEventListener('mouseenter', () => { importBtn.style.background = 'rgba(168,184,239,0.18)'; });
    importBtn.addEventListener('mouseleave', () => { importBtn.style.background = 'transparent'; });
    importBtn.addEventListener('click', async () => {
      let text = '';
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          text = await navigator.clipboard.readText();
        }
      } catch (_) {}
      if (!text) {
        text = window.prompt('Paste Atlas JSON snapshot to merge:') || '';
      }
      if (!text.trim()) {
        importBtn.textContent = '⚠ No data';
        setTimeout(() => { importBtn.textContent = '📥 Import'; importBtn.style.background = 'transparent'; }, 1400);
        return;
      }
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (e) { parsed = null; }
      if (!parsed || parsed.format !== 'aiv-cosmic-sights-atlas-export') {
        importBtn.textContent = '⚠ Bad JSON';
        importBtn.style.background = 'rgba(255,120,120,0.35)';
        setTimeout(() => { importBtn.textContent = '📥 Import'; importBtn.style.background = 'transparent'; }, 1600);
        return;
      }
      // Build a name set of valid sights for safety
      const validNames = new Set(sights.map(s => s.name));
      const beforeDisc = loadDiscoveredSet();
      const beforeFav = loadFavoritesSet();
      const incomingDisc = Array.isArray(parsed.discovered) ? parsed.discovered : [];
      const incomingFav = Array.isArray(parsed.favorites) ? parsed.favorites : [];
      let addedDisc = 0, addedFav = 0;
      const mergedDisc = new Set(beforeDisc);
      for (const n of incomingDisc) {
        if (typeof n === 'string' && validNames.has(n) && !mergedDisc.has(n)) {
          mergedDisc.add(n);
          addedDisc += 1;
        }
      }
      const mergedFav = new Set(beforeFav);
      for (const n of incomingFav) {
        if (typeof n === 'string' && validNames.has(n) && !mergedFav.has(n)) {
          mergedFav.add(n);
          addedFav += 1;
        }
      }
      saveDiscoveredSet(mergedDisc);
      saveFavoritesSet(mergedFav);
      // Trigger UI/markers/badge to refresh by dispatching a fake cosmicSightVisited
      try {
        // Dispatch one event per newly-added discovered to update markers/log
        for (const n of incomingDisc) {
          if (validNames.has(n)) {
            document.dispatchEvent(new CustomEvent('cosmicSightVisited', { detail: { name: n, importedFromAtlas: true } }));
          }
        }
      } catch (_) {}
      importBtn.textContent = `✓ +${addedDisc}/${addedFav}`;
      importBtn.style.background = 'rgba(168,184,239,0.45)';
      importBtn.title = `Imported: +${addedDisc} discovered, +${addedFav} favorites`;
      setTimeout(() => {
        importBtn.textContent = '📥 Import';
        importBtn.style.background = 'transparent';
        importBtn.title = 'Paste an Atlas JSON snapshot to merge discovered + favorites';
      }, 1800);
      // Re-render the list
      try { rebuild(); } catch (_) {}
    });
    controlsRow.appendChild(importBtn);

    header.appendChild(controlsRow);
    panel.appendChild(header);

    body = document.createElement('div');
    body.style.cssText = [
      'flex:1', 'overflow-y:auto', 'padding:8px 20px 16px 20px',
      'scrollbar-width:thin', 'scrollbar-color:#5d7aa8 transparent',
    ].join(';');
    panel.appendChild(body);

    const footer = document.createElement('div');
    footer.style.cssText = [
      'padding:8px 20px', 'border-top:1px solid rgba(125,249,255,0.18)',
      'display:flex', 'justify-content:space-between', 'align-items:center',
      'font-size:11px', 'font-family:"Trebuchet MS", sans-serif', 'color:#7d8ba8',
      'background:rgba(0,0,0,0.25)',
    ].join(';');
    const credit = document.createElement('span');
    credit.textContent = '— Atlas by Opus 4.7';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close (C)';
    closeBtn.style.cssText = [
      'background:transparent', 'color:#7df9ff',
      'border:1px solid rgba(125,249,255,0.5)', 'border-radius:6px',
      'padding:4px 12px', 'font-size:11px', 'cursor:pointer',
    ].join(';');
    closeBtn.addEventListener('click', () => close());
    footer.appendChild(credit);
    footer.appendChild(closeBtn);
    panel.appendChild(footer);

    document.body.appendChild(panel);
  }

  function rebuild() {
    if (!body) return;
    const discovered = loadDiscoveredSet();
    // Count uniquely by name so duplicate-named entries in sights[] don't
    // inflate the Atlas count vs tracker's Set-based visited.size.
    const uniqueNames = new Set();
    let found = 0;
    for (const s of sights) {
      if (uniqueNames.has(s.name)) continue;
      uniqueNames.add(s.name);
      if (discovered.has(s.name)) found++;
    }
    const total = uniqueNames.size;
    const pct = total ? Math.round((found / total) * 100) : 0;
    const favoritesPre = loadFavoritesSet();
    const favCount = favoritesPre.size;
    countLabel.textContent = `${found} of ${total} discovered (${pct}%)` + (favCount > 0 ? `  ·  ★ ${favCount} favorite${favCount === 1 ? '' : 's'}` : '');

    // Apply filter (search text + undiscovered-only toggle).
    // Also dedupe by name so duplicate-named entries appear once in the list.
    const _seenInFiltered = new Set();
    const filtered = sights.filter((s) => {
      if (_seenInFiltered.has(s.name)) return false;
      if (showOnlyUndiscovered && discovered.has(s.name)) return false;
      if (favoritesOnly && !favoritesPre.has(s.name)) return false;
      if (filterText && !s.name.toLowerCase().includes(filterText)) return false;
      _seenInFiltered.add(s.name);
      return true;
    });

    // If sorting by distance, decorate with distance from camera and sort within each bucket
    let distMap = null;
    if (sortByDistance && camera && camera.position) {
      distMap = new Map();
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
      for (const s of filtered) {
        const [x, y, z] = s.position;
        const dx = x - cx, dy = y - cy, dz = z - cz;
        distMap.set(s.name, Math.sqrt(dx * dx + dy * dy + dz * dz));
      }
    }

    // Bucket sights by category, preserving array order within each bucket.
    const buckets = new Map();
    for (const s of filtered) {
      const cat = categorize(s.name);
      if (!buckets.has(cat)) buckets.set(cat, []);
      buckets.get(cat).push(s);
    }
    if (sortByDistance && distMap) {
      for (const [cat, list] of buckets) {
        list.sort((a, b) => (distMap.get(a.name) || 0) - (distMap.get(b.name) || 0));
      }
    } else if (sortByRecent) {
      const recentMap = loadLogTimestamps();
      for (const [cat, list] of buckets) {
        list.sort((a, b) => (recentMap.get(b.name) || 0) - (recentMap.get(a.name) || 0));
      }
    }

    body.innerHTML = '';
    currentRows = [];
    if (filtered.length === 0) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:40px 20px; text-align:center; color:#7d8ba8; font-style:italic; font-size:13px;';
      empty.textContent = filterText ? `No sights match "${filterText}".` : (favoritesOnly ? 'No favorites yet — click the ☆ next to a sight name to add it.' : 'No undiscovered sights — every cosmic sight has been discovered! ✨');
      body.appendChild(empty);
      return;
    }
    for (const rule of CATEGORY_RULES) {
      const list = buckets.get(rule.id);
      if (!list || list.length === 0) continue;
      const catFound = list.filter((s) => discovered.has(s.name)).length;

      const section = document.createElement('div');
      section.style.cssText = 'margin-top:14px;';

      const heading = document.createElement('div');
      heading.style.cssText = [
        'font-family:"Trebuchet MS", sans-serif',
        'font-size:13px', 'font-weight:bold',
        'color:#c5d6ff', 'letter-spacing:0.5px',
        'padding:4px 0 6px 0',
        'border-bottom:1px dotted rgba(125,249,255,0.25)',
        'margin-bottom:6px',
      ].join(';');
      heading.innerHTML = `<span>${rule.label}</span><span style="float:right; font-size:11px; color:#8aa1c8; font-weight:normal;">${catFound} / ${list.length}</span>`;
      section.appendChild(heading);

      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:4px 12px;';

      for (const s of list) {
        const isFound = discovered.has(s.name);
        const row = document.createElement('div');
        row.style.cssText = [
          'display:flex', 'align-items:center', 'gap:8px',
          'padding:3px 6px', 'border-radius:5px',
          'font-family:"Trebuchet MS", sans-serif',
          isFound ? 'background:rgba(125,249,255,0.05)' : 'opacity:0.65',
        ].join(';');

        const dot = document.createElement('span');
        dot.textContent = isFound ? '◆' : '◇';
        dot.style.cssText = `color:${s.color || '#aab8d6'}; font-size:14px; ${isFound ? `text-shadow:0 0 8px ${s.color || '#7df9ff'};` : ''} flex-shrink:0;`;
        row.appendChild(dot);

        // Category emoji tag (1 char visual cue)
        const catEmoji = (CATEGORY_RULES.find(r => r.id === categorize(s.name))?.label || '').split(' ')[0] || '✦';
        const catTag = document.createElement('span');
        catTag.textContent = catEmoji;
        catTag.style.cssText = 'font-size:11px; opacity:0.78; flex-shrink:0; width:14px; text-align:center;';
        catTag.title = (CATEGORY_RULES.find(r => r.id === categorize(s.name))?.label || '');
        row.appendChild(catTag);

        const label = document.createElement('span');
        label.textContent = s.name;
        label.style.cssText = `flex:1; font-size:12px; color:${isFound ? '#e6efff' : '#8a9bbd'}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;`;
        label.title = s.description || s.name;
        row.appendChild(label);

        if (distMap) {
          const distSpan = document.createElement('span');
          distSpan.textContent = `${Math.round(distMap.get(s.name) || 0)}u`;
          distSpan.style.cssText = 'font-size:10px; color:#7da7d6; min-width:42px; text-align:right; flex-shrink:0;';
          row.appendChild(distSpan);
        }

        // Star (favorite) toggle
        const star = document.createElement('button');
        const isFav0 = favoritesPre.has(s.name);
        star.textContent = isFav0 ? '★' : '☆';
        star.title = isFav0 ? 'Unfavorite' : 'Add to favorites';
        star.style.cssText = [
          'background:transparent', `color:${isFav0 ? '#ffd97d' : '#5a6f8c'}`,
          'border:none', 'padding:0 4px', 'font-size:14px',
          'cursor:pointer', 'flex-shrink:0', 'line-height:1',
        ].join(';');
        star.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const cur = loadFavoritesSet();
          if (cur.has(s.name)) { cur.delete(s.name); } else { cur.add(s.name); }
          saveFavoritesSet(cur);
          if (audio?.playChime) { try { audio.playChime('atlasFav'); } catch (_) {} }
          rebuild();
        });
        star.addEventListener('mouseenter', () => { star.style.color = '#ffd97d'; });
        star.addEventListener('mouseleave', () => { star.style.color = favoritesPre.has(s.name) ? '#ffd97d' : '#5a6f8c'; });
        row.appendChild(star);

        const btn = document.createElement('button');
        btn.textContent = 'Visit';
        btn.style.cssText = [
          'background:transparent', 'color:#7df9ff',
          'border:1px solid rgba(125,249,255,0.4)', 'border-radius:4px',
          'padding:1px 8px', 'font-size:10px', 'cursor:pointer',
          'flex-shrink:0',
        ].join(';');
        btn.addEventListener('click', () => teleportTo(s));
        btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(125,249,255,0.18)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'transparent'; });
        row.appendChild(btn);

        // Track for keyboard nav
        currentRows.push({ row, sight: s });
        row.dataset.atlasRowIndex = String(currentRows.length - 1);
        row.style.cursor = 'pointer';
        row.addEventListener('click', (ev) => {
          // Don't double-fire when Visit button is clicked
          if (ev.target && ev.target.tagName === 'BUTTON') return;
          setFocus(Number(row.dataset.atlasRowIndex));
        });
        grid.appendChild(row);
      }
      section.appendChild(grid);
      body.appendChild(section);
    }
    // Reset keyboard focus to first row if available
    focusIndex = currentRows.length > 0 ? 0 : -1;
    applyFocusStyles();
  }

  function applyFocusStyles() {
    for (let i = 0; i < currentRows.length; i++) {
      const r = currentRows[i].row;
      if (i === focusIndex) {
        r.style.outline = '1px solid rgba(125,249,255,0.85)';
        r.style.boxShadow = '0 0 10px rgba(125,249,255,0.35)';
        r.style.background = 'rgba(125,249,255,0.12)';
      } else {
        r.style.outline = '';
        r.style.boxShadow = '';
        // restore original bg per discovered state
        const isFound = (currentRows[i].sight && loadDiscoveredSet().has(currentRows[i].sight.name));
        r.style.background = isFound ? 'rgba(125,249,255,0.05)' : '';
      }
    }
  }

  function setFocus(i) {
    if (currentRows.length === 0) return;
    focusIndex = Math.max(0, Math.min(currentRows.length - 1, i));
    applyFocusStyles();
    const r = currentRows[focusIndex] && currentRows[focusIndex].row;
    if (r && r.scrollIntoView) {
      try { r.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) { r.scrollIntoView(); }
    }
    // Visual link: pulse the corresponding 3D marker for the focused row
    const focusedSight = currentRows[focusIndex] && currentRows[focusIndex].sight;
    if (focusedSight && window.__cosmicSightMarkers && typeof window.__cosmicSightMarkers.pulseMarker === 'function') {
      try { window.__cosmicSightMarkers.pulseMarker(focusedSight.name); } catch (_) {}
    }
  }

  function teleportTo(sight) {
    if (!sight || !sight.position) return;
    const [x, y, z] = sight.position;
    // Stand-off offset toward origin so the sight lies in front of the camera.
    const dx = -x, dy = -y, dz = -z;
    const len = Math.hypot(dx, dy, dz) || 1;
    const standOff = 60; // units away from the sight, along origin-pointing direction
    const px = x + (dx / len) * standOff;
    const py = y + (dy / len) * standOff;
    const pz = z + (dz / len) * standOff;
    if (camera) camera.position.set(px, py, pz);
    if (controls && controls.target && typeof controls.target.set === 'function') {
      controls.target.set(x, y, z);
      if (typeof controls.update === 'function') controls.update();
    } else if (controls && controls._euler) {
      // PointerLockControls: aim camera by quaternion via lookAt
      try {
        if (typeof camera.lookAt === 'function') camera.lookAt(x, y, z);
        // Re-derive euler from the rotated camera so subsequent mouse-look continues from here.
        if (camera.quaternion) {
          controls._euler.setFromQuaternion(camera.quaternion);
        }
      } catch (_) {}
    } else if (camera && typeof camera.lookAt === 'function') {
      camera.lookAt(x, y, z);
    }
    if (audio && typeof audio.playWhoosh === 'function') {
      try { audio.playWhoosh(); } catch (_) {}
    }
    close();
  }

  function open() {
    ensurePanel();
    rebuild();
    panel.style.display = 'flex';
    isOpen = true;
    if (audio && typeof audio.playChime === 'function') {
      try { audio.playChime('atlasOpen'); } catch (_) {}
    }
    // Release pointer lock so the user can interact with the panel.
    if (document.exitPointerLock) document.exitPointerLock();
    // Auto-focus the search input for immediate typing.
    if (searchInput) {
      try { searchInput.focus(); searchInput.select(); } catch (_) {}
    }
  }
  function close() {
    if (!panel) return;
    panel.style.display = 'none';
    isOpen = false;
    if (audio && typeof audio.playWhoosh === 'function') {
      try { audio.playWhoosh({ duration: 0.32 }); } catch (_) {}
    }
  }
  function toggle() { isOpen ? close() : open(); }

  document.addEventListener('cosmicSightVisited', () => { if (isOpen) rebuild(); });
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY && isOpen) rebuild();
  });

  // Keyboard navigation: ArrowUp/Down move focus, Enter teleports.
  // Capture phase so it fires before searchInput's stopPropagation.
  document.addEventListener('keydown', (ev) => {
    if (!isOpen) return;
    if (ev.shiftKey || ev.metaKey || ev.altKey || ev.ctrlKey) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      setFocus(focusIndex + 1);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setFocus(focusIndex - 1);
    } else if (ev.key === 'Enter') {
      if (currentRows.length === 0) return;
      if (focusIndex < 0 || focusIndex >= currentRows.length) return;
      ev.preventDefault();
      const sight = currentRows[focusIndex].sight;
      if (sight) teleportTo(sight);
    } else if (ev.key === 'f' || ev.key === 'F') {
      // Toggle favorite on focused row
      if (currentRows.length === 0) return;
      if (focusIndex < 0 || focusIndex >= currentRows.length) return;
      const tag = (ev.target && ev.target.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || ev.target?.isContentEditable) return;
      ev.preventDefault();
      ev.stopPropagation();
      const sight = currentRows[focusIndex].sight;
      if (!sight) return;
      const cur = loadFavoritesSet();
      if (cur.has(sight.name)) { cur.delete(sight.name); } else { cur.add(sight.name); }
      saveFavoritesSet(cur);
      if (audio?.playChime) { try { audio.playChime('atlasFav'); } catch (_) {} }
      rebuild();
    }
  }, true);

  // Keybinding — 'C' toggles, Esc closes. Skip when typing in inputs.
  document.addEventListener('keydown', (ev) => {
    const tag = (ev.target && ev.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || ev.target?.isContentEditable) return;
    if (ev.key === 'c' || ev.key === 'C') {
      ev.preventDefault();
      toggle();
    } else if (ev.key === 'Escape' && isOpen) {
      ev.preventDefault();
      close();
    }
  });

  return { toggle, open, close, get isOpen() { return isOpen; }, refresh: rebuild, teleportTo: (name) => {
    const s = sights.find((x) => x.name === name);
    if (s) teleportTo(s);
  } };
}
