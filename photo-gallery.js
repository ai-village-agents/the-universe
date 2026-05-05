// Photo Gallery — press G to toggle a panel of recent in-universe photo captures.
// Author: Claude Opus 4.7
// Hooks: factory({ audio }) -> { toggle, open, close, isOpen, refresh }
// Storage: localStorage 'aiv_universe_photos_v1' = JSON array of { name, ts, thumb }
// Listens for: document 'photoCaptured' CustomEvent { detail: { name, ts, thumb } }

const STORE_KEY = 'aiv_universe_photos_v1';

export function createPhotoGallery({ audio } = {}) {
  let isOpen = false;

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
  hint.textContent = 'Press P in-universe to capture a photo. Click a thumbnail to view full size or download. Photos are stored in your browser only.';
  card.appendChild(hint);

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
    lightCaption.textContent = `${photo.name}  ·  ${date.toLocaleString()}`;
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

  function refresh() {
    const photos = loadPhotos();
    grid.innerHTML = '';
    document.getElementById('pg-count').textContent = photos.length ? `${photos.length} photo${photos.length === 1 ? '' : 's'}` : '';
    if (photos.length === 0) {
      empty.style.display = 'block';
      grid.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    grid.style.display = 'grid';
    photos.forEach((photo) => {
      const cell = document.createElement('div');
      cell.style.cssText = 'cursor:pointer; border:1px solid rgba(180,210,255,0.18); border-radius:8px; overflow:hidden; background:rgba(10,16,32,0.6); transition:transform 0.15s ease, border-color 0.15s ease;';
      cell.addEventListener('mouseenter', () => { cell.style.transform = 'translateY(-2px)'; cell.style.borderColor = 'rgba(180,210,255,0.5)'; });
      cell.addEventListener('mouseleave', () => { cell.style.transform = 'translateY(0)'; cell.style.borderColor = 'rgba(180,210,255,0.18)'; });
      const img = document.createElement('img');
      img.src = photo.thumb;
      img.style.cssText = 'display:block; width:100%; height:auto; aspect-ratio:256/150; object-fit:cover;';
      const cap = document.createElement('div');
      cap.style.cssText = 'padding:6px 8px; font-size:10px; color:#9bb1d2; font-family:Consolas,monospace; line-height:1.4;';
      const date = new Date(photo.ts);
      cap.textContent = date.toLocaleString();
      cell.appendChild(img); cell.appendChild(cap);
      cell.addEventListener('click', () => openLightbox(photo));
      grid.appendChild(cell);
    });
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
    } else if (isOpen && lightbox.style.display === 'flex') {
      if (e.code === 'ArrowLeft') { e.preventDefault(); gotoOffset(-1); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); gotoOffset(1); }
    }
  });

  document.addEventListener('photoCaptured', () => { if (isOpen) refresh(); });

  document.body.appendChild(root);

  return {
    toggle, open, close, refresh,
    isOpen: () => isOpen,
  };
}
