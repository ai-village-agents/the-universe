// Photo Gallery — press G to toggle a panel of recent in-universe photo captures.
// Author: Claude Opus 4.7
// Hooks: factory({ audio }) -> { toggle, open, close, isOpen, refresh }
// Storage: localStorage 'aiv_universe_photos_v1' = JSON array of { name, ts, thumb }
// Listens for: document 'photoCaptured' CustomEvent { detail: { name, ts, thumb } }

const STORE_KEY = 'aiv_universe_photos_v1';

export function createPhotoGallery({ audio } = {}) {
  let isOpen = false;
  let gridCells = []; // [{cell, photo}]
  let gridFocusIndex = -1;

  function loadPhotos() {
    try {
      const arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }
  function savePhotos(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); } catch (_) {}
  }

  // Modal container
  const root = document.createElement('div');
  root.id = 'photo-gallery-panel';
  root.style.cssText = `
    position: fixed; inset: 0; display: none; z-index: 9450;
    background: rgba(2,4,12,0.78);
    font-family: "Trebuchet MS", "Helvetica", sans-serif; color: #d8e6ff;
  `;

  const card = document.createElement('div');
  card.style.cssText = `
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: min(960px, 92vw); max-height: 86vh; display: flex; flex-direction: column;
    background: linear-gradient(180deg, rgba(20,28,48,0.96), rgba(10,14,28,0.96));
    border: 1px solid rgba(180,210,255,0.32);
    border-radius: 16px; padding: 20px 22px 18px 22px;
    box-shadow: 0 18px 60px rgba(0,0,0,0.6), 0 0 36px rgba(120,180,255,0.18);
  `;
  root.appendChild(card);

  const head = document.createElement('div');
  head.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;';
  const title = document.createElement('div');
  title.innerHTML = '<span style="font-size:18px; font-weight:700; color:#9fffd6;">📸 Photo Gallery</span> <span id="pg-count" style="font-size:12px; color:#8fa9d0; margin-left:8px;"></span>';
  const right = document.createElement('div');
  right.style.cssText = 'display:flex; gap:8px;';
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear all';
  clearBtn.style.cssText = 'background:rgba(80,30,30,0.8); color:#ffd6d6; border:1px solid rgba(255,140,140,0.4); border-radius:8px; padding:5px 10px; font-size:11px; cursor:pointer;';
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close (Esc)';
  closeBtn.style.cssText = 'background:rgba(40,60,90,0.8); color:#cfe6ff; border:1px solid rgba(180,210,255,0.4); border-radius:8px; padding:5px 10px; font-size:11px; cursor:pointer;';
  right.appendChild(clearBtn); right.appendChild(closeBtn);
  head.appendChild(title); head.appendChild(right);
  card.appendChild(head);

  const hint = document.createElement('div');
  hint.style.cssText = 'font-size:11px; color:#7a91b6; margin-bottom:10px;';
  hint.textContent = 'Press P in-universe to capture a photo. ←→↑↓ to navigate, Enter to open. Photos are stored in your browser only.';
  card.appendChild(hint);

  // World filter row
  let worldFilter = 'all';
  const filterRow = document.createElement('div');
  filterRow.style.cssText = 'display:flex; align-items:center; gap:8px; margin-bottom:10px; font-size:11px; color:#9bb1d2;';
  const filterLabel = document.createElement('span');
  filterLabel.textContent = 'World:';
  const filterSelect = document.createElement('select');
  filterSelect.style.cssText = 'background:rgba(20,30,50,0.85); color:#cfe6ff; border:1px solid rgba(180,210,255,0.3); border-radius:6px; padding:3px 8px; font-size:11px; font-family:Consolas,monospace;';
  filterSelect.addEventListener('change', () => { worldFilter = filterSelect.value; refresh(); });
  filterRow.appendChild(filterLabel);
  filterRow.appendChild(filterSelect);
  card.appendChild(filterRow);

  // Scroll grid
  const grid = document.createElement('div');
  grid.style.cssText = 'display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:12px; overflow-y:auto; padding:4px 4px 6px 4px; flex:1;';
  card.appendChild(grid);

  const empty = document.createElement('div');
  empty.style.cssText = 'padding:50px 0; text-align:center; color:#8aa0c2; font-style:italic; font-size:13px;';
  empty.textContent = 'No photos yet. Press P during your travels to capture moments.';
  card.appendChild(empty);

  // Lightbox for fullscreen view
  const lightbox = document.createElement('div');
  lightbox.style.cssText = `
    position:absolute; inset:0; display:none; z-index:1; background:rgba(0,0,0,0.92);
    align-items:center; justify-content:center; flex-direction:column; padding:20px;
  `;
  const lightImg = document.createElement('img');
  lightImg.style.cssText = 'max-width:96%; max-height:80%; border:1px solid rgba(180,210,255,0.3); border-radius:8px; box-shadow:0 8px 40px rgba(0,0,0,0.7);';
  const lightCaption = document.createElement('div');
  lightCaption.style.cssText = 'margin-top:12px; color:#cfe6ff; font-family:Consolas,monospace; font-size:12px;';
  const lightControls = document.createElement('div');
  lightControls.style.cssText = 'margin-top:14px; display:flex; gap:10px;';
  const lbPrev = document.createElement('button');
  lbPrev.textContent = '◀ Prev';
  lbPrev.style.cssText = 'background:rgba(40,60,90,0.85); color:#cfe6ff; border:1px solid rgba(180,210,255,0.4); border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer;';
  const lbNext = document.createElement('button');
  lbNext.textContent = 'Next ▶';
  lbNext.style.cssText = 'background:rgba(40,60,90,0.85); color:#cfe6ff; border:1px solid rgba(180,210,255,0.4); border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer;';
  const lbDownload = document.createElement('button');
  lbDownload.textContent = '⬇ Download';
  lbDownload.style.cssText = 'background:rgba(40,80,60,0.85); color:#bdf5d4; border:1px solid rgba(140,255,180,0.45); border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer;';
  const lbDelete = document.createElement('button');
  lbDelete.textContent = '🗑 Delete';
  lbDelete.style.cssText = 'background:rgba(80,30,30,0.85); color:#ffc6c6; border:1px solid rgba(255,140,140,0.45); border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer;';
  const lbClose = document.createElement('button');
  lbClose.textContent = '✕ Close';
  lbClose.style.cssText = 'background:rgba(40,60,90,0.85); color:#cfe6ff; border:1px solid rgba(180,210,255,0.4); border-radius:8px; padding:6px 14px; font-size:12px; cursor:pointer;';
  lightControls.appendChild(lbPrev); lightControls.appendChild(lbDownload); lightControls.appendChild(lbDelete); lightControls.appendChild(lbNext); lightControls.appendChild(lbClose);
  lightbox.appendChild(lightImg); lightbox.appendChild(lightCaption); lightbox.appendChild(lightControls);
  card.appendChild(lightbox);

  let currentLightbox = null;
  function openLightbox(photo) {
    currentLightbox = photo;
    lightImg.src = photo.thumb;
    const date = new Date(photo.ts);
    const _wn = photo && photo.world && photo.world.name;
    lightCaption.textContent = (_wn ? `@ ${_wn}  ·  ` : '') + `${photo.name}  ·  ${date.toLocaleString()}`;
    lightbox.style.display = 'flex';
  }
  function closeLightbox() {
    currentLightbox = null;
    lightbox.style.display = 'none';
  }

  function gotoOffset(delta) {
    const arr = loadPhotos();
    if (!currentLightbox || arr.length === 0) return;
    const idx = arr.findIndex(p => p.ts === currentLightbox.ts && p.name === currentLightbox.name);
    if (idx === -1) return;
    const next = arr[(idx + delta + arr.length) % arr.length];
    openLightbox(next);
  }
  lbPrev.addEventListener('click', () => gotoOffset(-1));
  lbNext.addEventListener('click', () => gotoOffset(1));
  lbClose.addEventListener('click', closeLightbox);
  lbDownload.addEventListener('click', () => {
    if (!currentLightbox) return;
    const a = document.createElement('a');
    a.href = currentLightbox.thumb;
    a.download = currentLightbox.name.replace('.png', '-thumb.jpg');
    document.body.appendChild(a); a.click(); a.remove();
  });
  lbDelete.addEventListener('click', () => {
    if (!currentLightbox) return;
    const arr = loadPhotos().filter(p => !(p.ts === currentLightbox.ts && p.name === currentLightbox.name));
    savePhotos(arr);
    closeLightbox();
    refresh();
  });

  function rebuildFilterOptions(photos) {
    // Collect unique world names from photo metadata.
    const seen = new Map();
    let untaggedCount = 0;
    photos.forEach(p => {
      const wn = p && p.world && p.world.name;
      if (wn) seen.set(wn, (seen.get(wn) || 0) + 1);
      else untaggedCount++;
    });
    const opts = [{ value: 'all', label: `All (${photos.length})` }];
    Array.from(seen.entries()).sort((a, b) => a[0].localeCompare(b[0])).forEach(([n, c]) => opts.push({ value: 'w:' + n, label: `${n} (${c})` }));
    if (untaggedCount > 0) opts.push({ value: 'untagged', label: `Untagged (${untaggedCount})` });
    const prev = filterSelect.value || worldFilter;
    filterSelect.innerHTML = '';
    opts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value; opt.textContent = o.label;
      filterSelect.appendChild(opt);
    });
    // Restore previous selection if still valid
    if (Array.from(filterSelect.options).some(o => o.value === prev)) {
      filterSelect.value = prev;
      worldFilter = prev;
    } else {
      filterSelect.value = 'all';
      worldFilter = 'all';
    }
  }

  function applyWorldFilter(photos) {
    if (worldFilter === 'all') return photos;
    if (worldFilter === 'untagged') return photos.filter(p => !(p && p.world && p.world.name));
    if (worldFilter.startsWith('w:')) {
      const n = worldFilter.slice(2);
      return photos.filter(p => p && p.world && p.world.name === n);
    }
    return photos;
  }

  function refresh() {
    const allPhotos = loadPhotos();
    rebuildFilterOptions(allPhotos);
    const photos = applyWorldFilter(allPhotos);
    grid.innerHTML = '';
    const lbl = document.getElementById('pg-count');
    if (lbl) {
      const total = allPhotos.length;
      const shown = photos.length;
      if (total === 0) lbl.textContent = '';
      else if (worldFilter === 'all') lbl.textContent = `${total} photo${total === 1 ? '' : 's'}`;
      else lbl.textContent = `${shown} of ${total} shown`;
    }
    if (photos.length === 0) {
      empty.style.display = 'block';
      grid.style.display = 'none';
      empty.textContent = allPhotos.length === 0
        ? 'No photos yet. Press P during your travels to capture moments.'
        : 'No photos match the current filter.';
      gridCells = [];
      gridFocusIndex = -1;
      return;
    }
    empty.style.display = 'none';
    grid.style.display = 'grid';
    gridCells = [];
    photos.forEach((photo, idx) => {
      const cell = document.createElement('div');
      cell.style.cssText = 'cursor:pointer; border:1px solid rgba(180,210,255,0.18); border-radius:8px; overflow:hidden; background:rgba(10,16,32,0.6); transition:transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;';
      cell.dataset.gridIdx = String(idx);
      cell.addEventListener('mouseenter', () => { if (gridFocusIndex !== idx) { cell.style.transform = 'translateY(-2px)'; cell.style.borderColor = 'rgba(180,210,255,0.5)'; } });
      cell.addEventListener('mouseleave', () => { if (gridFocusIndex !== idx) { cell.style.transform = 'translateY(0)'; cell.style.borderColor = 'rgba(180,210,255,0.18)'; } });
      const img = document.createElement('img');
      img.src = photo.thumb;
      img.style.cssText = 'display:block; width:100%; height:auto; aspect-ratio:256/150; object-fit:cover;';
      const cap = document.createElement('div');
      cap.style.cssText = 'padding:6px 8px; font-size:10px; color:#9bb1d2; font-family:Consolas,monospace; line-height:1.4;';
      const date = new Date(photo.ts);
      const wn = photo && photo.world && photo.world.name;
      if (wn) {
        const tag = document.createElement('div');
        tag.style.cssText = 'color:#ffd6a8; font-weight:bold; margin-bottom:2px;';
        tag.textContent = '@ ' + wn;
        cap.appendChild(tag);
      }
      const dateLine = document.createElement('div');
      dateLine.textContent = date.toLocaleString();
      cap.appendChild(dateLine);
      cell.appendChild(img); cell.appendChild(cap);
      cell.addEventListener('click', () => { setGridFocus(idx, false); openLightbox(photo); });
      grid.appendChild(cell);
      gridCells.push({ cell, photo });
    });
    // Reset focus to first cell on every rebuild
    gridFocusIndex = gridCells.length ? 0 : -1;
    applyGridFocusStyles();
  }

  function applyGridFocusStyles() {
    gridCells.forEach((entry, i) => {
      const focused = (i === gridFocusIndex);
      if (focused) {
        entry.cell.style.borderColor = 'rgba(140,230,255,0.95)';
        entry.cell.style.boxShadow = '0 0 14px rgba(140,230,255,0.55)';
        entry.cell.style.transform = 'translateY(-2px)';
      } else {
        entry.cell.style.borderColor = 'rgba(180,210,255,0.18)';
        entry.cell.style.boxShadow = 'none';
        entry.cell.style.transform = 'translateY(0)';
      }
    });
  }

  function setGridFocus(idx, scroll = true) {
    if (idx < 0 || idx >= gridCells.length) return;
    gridFocusIndex = idx;
    applyGridFocusStyles();
    if (scroll) {
      try { gridCells[idx].cell.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) {}
    }
  }

  function getGridColumnCount() {
    try {
      const cs = getComputedStyle(grid);
      const cols = cs.gridTemplateColumns;
      if (!cols) return 1;
      // Each column track is space-separated; count tokens.
      const n = cols.trim().split(/\s+/).filter(Boolean).length;
      return Math.max(1, n);
    } catch (_) { return 1; }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    refresh();
    root.style.display = 'block';
    if (audio?.playChime) { try { audio.playChime('photoOpen'); } catch (_) {} }
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    closeLightbox();
    root.style.display = 'none';
    if (audio?.playWhoosh) { try { audio.playWhoosh({ duration: 0.3 }); } catch (_) {} }
  }
  function toggle() { isOpen ? close() : open(); }

  closeBtn.addEventListener('click', close);
  clearBtn.addEventListener('click', () => {
    if (!confirm('Delete all stored photos? (This only affects your browser storage.)')) return;
    savePhotos([]);
    refresh();
  });
  // Click outside card closes
  root.addEventListener('click', (e) => { if (e.target === root) close(); });

  document.addEventListener('keydown', (e) => {
    const tgt = e.target;
    if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable)) return;
    if (e.code === 'KeyG') {
      e.preventDefault();
      toggle();
    } else if (e.code === 'Escape' && isOpen) {
      if (lightbox.style.display === 'flex') closeLightbox();
      else close();
    } else if (isOpen && lightbox.style.display !== 'flex') {
      // Grid keyboard navigation when lightbox is closed
      if (gridCells.length === 0) return;
      if (e.code === 'ArrowRight') { e.preventDefault(); setGridFocus(Math.min(gridFocusIndex + 1, gridCells.length - 1)); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); setGridFocus(Math.max(gridFocusIndex - 1, 0)); }
      else if (e.code === 'ArrowDown') { e.preventDefault(); const c = getGridColumnCount(); setGridFocus(Math.min(gridFocusIndex + c, gridCells.length - 1)); }
      else if (e.code === 'ArrowUp') { e.preventDefault(); const c = getGridColumnCount(); setGridFocus(Math.max(gridFocusIndex - c, 0)); }
      else if (e.code === 'Enter') {
        e.preventDefault();
        if (gridFocusIndex >= 0 && gridCells[gridFocusIndex]) openLightbox(gridCells[gridFocusIndex].photo);
      }
    } else if (isOpen && lightbox.style.display === 'flex') {
      if (e.code === 'ArrowLeft') { e.preventDefault(); gotoOffset(-1); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); gotoOffset(1); }
      else if (e.code === 'Delete' || e.code === 'Backspace') {
        e.preventDefault();
        if (currentLightbox) {
          // Quick-delete: filter out current photo, advance to next, or close if empty
          const photos = loadPhotos();
          const idx = photos.findIndex(p => p.ts === currentLightbox.ts && p.name === currentLightbox.name);
          const remaining = photos.filter(p => !(p.ts === currentLightbox.ts && p.name === currentLightbox.name));
          savePhotos(remaining);
          if (remaining.length === 0) {
            closeLightbox();
            refresh();
          } else {
            // open the next photo (or wrap)
            const nextIdx = Math.min(idx, remaining.length - 1);
            currentLightbox = remaining[nextIdx];
            // Re-render lightbox image+caption
            lightImg.src = currentLightbox.thumb;
            lightCaption.textContent = `${currentLightbox.name} · ${new Date(currentLightbox.ts).toLocaleString()}`;
            refresh();
          }
        }
      }
    }
  });

  document.addEventListener('photoCaptured', () => { if (isOpen) refresh(); });

  document.body.appendChild(root);

  return {
    toggle, open, close, refresh,
    isOpen: () => isOpen,
  };
}
