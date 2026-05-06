// Bookmark 3D Markers — floats numbered glowing spheres at saved camera bookmark positions.
// Reads localStorage 'aiv_universe_bookmarks' and refreshes on save/teleport (poll + storage event).
// Module is shape-loaded by main.js so it works as a SimpleObject loader: factory(THREE) -> {group, update}.
import * as THREE from 'three';

export function createBookmark3DMarkers() {
    const group = new THREE.Group();
    group.name = 'BookmarkMarkers';
    const markers = new Map(); // slot -> { mesh, ring, sprite }

    function loadBookmarks() {
        try {
            const raw = localStorage.getItem('aiv_universe_bookmarks');
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    function makeNumberSprite(num) {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const ctx = c.getContext('2d');
        ctx.fillStyle = 'rgba(20,28,52,0.85)';
        ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fde68a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(32, 32, 26, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#fde68a';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(num), 32, 34);
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
        const sp = new THREE.Sprite(mat);
        sp.scale.set(2.0, 2.0, 1);
        return sp;
    }

    function makeMarker(slot, pos) {
        const m = new THREE.Group();
        // Glowing core sphere (golden)
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 12, 10),
            new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0.85 })
        );
        m.add(core);
        // Halo ring
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.85, 0.06, 6, 24),
            new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0.7 })
        );
        ring.rotation.x = Math.PI / 2;
        m.add(ring);
        // Number label
        const sp = makeNumberSprite(slot);
        sp.position.y = 1.6;
        m.add(sp);
        m.position.set(pos[0], pos[1], pos[2]);
        m.userData = { slot, basePos: pos.slice() };
        group.add(m);
        return { mesh: m, core, ring, sprite: sp };
    }

    function syncFromStorage() {
        const bm = loadBookmarks();
        // Add/update markers
        for (const slot of Object.keys(bm)) {
            const b = bm[slot];
            if (!b || !b.p) continue;
            if (markers.has(slot)) {
                const rec = markers.get(slot);
                rec.mesh.userData.basePos = b.p.slice();
            } else {
                markers.set(slot, makeMarker(slot, b.p));
            }
        }
        // Remove stale markers
        for (const slot of Array.from(markers.keys())) {
            if (!bm[slot]) {
                const rec = markers.get(slot);
                if (rec && rec.mesh) {
                    group.remove(rec.mesh);
                    rec.mesh.traverse((o) => {
                        if (o.geometry) o.geometry.dispose();
                        if (o.material) {
                            if (o.material.map) o.material.map.dispose();
                            o.material.dispose();
                        }
                    });
                }
                markers.delete(slot);
            }
        }
    }

    syncFromStorage();
    window.addEventListener('storage', (e) => {
        if (e.key === 'aiv_universe_bookmarks') syncFromStorage();
    });
    // Poll every 2s for same-tab changes (storage event doesn't fire same-tab)
    setInterval(syncFromStorage, 2000);

    // Listen for explicit refresh dispatched by main.js if added later
    document.addEventListener('bookmarkSaved', syncFromStorage);
    document.addEventListener('bookmarkRemoved', syncFromStorage);

    let t = 0;
    function update(dt) {
        t += dt || 0.016;
        for (const rec of markers.values()) {
            // Bob & rotate
            const bp = rec.mesh.userData.basePos;
            rec.mesh.position.y = bp[1] + Math.sin(t * 1.4 + parseInt(rec.mesh.userData.slot, 10)) * 0.35;
            rec.ring.rotation.z = t * 0.7;
            rec.core.material.opacity = 0.7 + 0.2 * Math.sin(t * 2.2 + parseInt(rec.mesh.userData.slot, 10) * 0.5);
            rec.core.scale.setScalar(0.95 + 0.12 * Math.sin(t * 2.0 + parseInt(rec.mesh.userData.slot, 10)));
            rec.ring.scale.setScalar(1 + 0.08 * Math.sin(t * 1.8));
        }
    }

    if (typeof window !== 'undefined') {
        window.__bookmark3DMarkers = { group, update, refresh: syncFromStorage, markers };
    }

    return { group, update };
}

export default { createBookmark3DMarkers };
