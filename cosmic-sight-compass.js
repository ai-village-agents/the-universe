// cosmic-sight-compass.js — Opus 4.7
// Small bottom-center HUD that points toward the nearest UNDISCOVERED cosmic
// sight (or nearest if all are discovered). Helps visitors find sights with
// 500+ scattered across the universe.
//
// Press N to toggle visibility.
//
// Factory: createCosmicSightCompass({ THREE, camera, sights }) -> { update, toggle, show, hide }

const STORAGE_KEY = 'aiv_cosmic_sights_v1';

function readDiscovered() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) { return new Set(); }
}

export function createCosmicSightCompass({ THREE, camera, sights }) {
    const wrap = document.createElement('div');
    wrap.id = 'cosmic-sight-compass';
    wrap.style.cssText = [
        'position:fixed', 'bottom:74px', 'left:50%',
        'transform:translateX(-50%)',
        'padding:6px 12px',
        'font:11px/1.3 monospace',
        'color:#cfeaff',
        'background:linear-gradient(135deg,rgba(20,15,40,0.78),rgba(10,30,60,0.78))',
        'border:1px solid rgba(160,200,255,0.4)',
        'border-radius:14px',
        'box-shadow:0 0 16px rgba(140,200,255,0.18)',
        'z-index:30',
        'pointer-events:none',
        'letter-spacing:0.3px',
        'display:flex', 'align-items:center', 'gap:10px',
        'min-width:230px', 'justify-content:space-between',
        'transition:opacity 0.3s ease',
    ].join(';');

    const arrow = document.createElement('div');
    arrow.style.cssText = [
        'font-size:18px', 'line-height:1',
        'transition:transform 0.18s ease, color 0.3s ease',
        'color:#fff5d4',
        'text-shadow:0 0 6px rgba(255,220,120,0.6)',
        'min-width:20px', 'text-align:center',
    ].join(';');
    arrow.textContent = '➤';

    const label = document.createElement('div');
    label.style.cssText = 'flex:1;text-align:left;color:#cfeaff';
    label.innerHTML = '<span style="opacity:0.7">nearest sight</span><br><span style="color:#fff5d4">— —</span>';

    const dist = document.createElement('div');
    dist.style.cssText = 'font-size:10px;color:#9ab9d6;min-width:60px;text-align:right';
    dist.textContent = '';

    wrap.appendChild(arrow);
    wrap.appendChild(label);
    wrap.appendChild(dist);
    document.body.appendChild(wrap);

    let visible = true;
    let cachedDiscovered = readDiscovered();
    let cacheCounter = 0;

    const tmpVec = new THREE.Vector3();
    const camForward = new THREE.Vector3();

    function findNearestUndiscovered() {
        const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
        let best = null;
        let bestD2 = Infinity;
        // Phase 1: undiscovered
        for (let i = 0; i < sights.length; i++) {
            const s = sights[i];
            if (cachedDiscovered.has(s.name)) continue;
            const [x, y, z] = s.position;
            const dx = x - cx, dy = y - cy, dz = z - cz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < bestD2) { bestD2 = d2; best = s; }
        }
        if (best) return { sight: best, dist: Math.sqrt(bestD2), undiscovered: true };
        // Phase 2: any
        for (let i = 0; i < sights.length; i++) {
            const s = sights[i];
            const [x, y, z] = s.position;
            const dx = x - cx, dy = y - cy, dz = z - cz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < bestD2) { bestD2 = d2; best = s; }
        }
        if (best) return { sight: best, dist: Math.sqrt(bestD2), undiscovered: false };
        return null;
    }

    function update() {
        if (!visible) return;
        // Refresh discovered set occasionally (every ~30 frames)
        cacheCounter++;
        if (cacheCounter >= 30) { cachedDiscovered = readDiscovered(); cacheCounter = 0; }

        const target = findNearestUndiscovered();
        if (!target) {
            label.innerHTML = '<span style="opacity:0.7">cosmic sights</span><br><span style="color:#fff5d4">all discovered ✨</span>';
            dist.textContent = '';
            arrow.style.color = '#9bf5b8';
            arrow.style.transform = 'rotate(0deg)';
            return;
        }

        const sight = target.sight;
        // Direction in world space, then projected to camera local horizontal plane
        const [sx, sy, sz] = sight.position;
        tmpVec.set(sx, sy, sz).sub(camera.position);

        // camera forward in xz plane
        camForward.set(0, 0, -1).applyQuaternion(camera.quaternion);
        // angle from camera-forward to target vector, signed in y-up plane
        const fX = camForward.x, fZ = camForward.z;
        const tX = tmpVec.x, tZ = tmpVec.z;
        // angle of forward
        const fAng = Math.atan2(fX, -fZ);
        const tAng = Math.atan2(tX, -tZ);
        let delta = tAng - fAng;
        // normalize -PI..PI
        while (delta > Math.PI) delta -= 2 * Math.PI;
        while (delta < -Math.PI) delta += 2 * Math.PI;
        // Convert to degrees: 0 = ahead, +90 right, -90 left, ±180 behind
        const deg = delta * 180 / Math.PI;

        arrow.style.transform = `rotate(${deg.toFixed(0)}deg)`;
        const labelColor = target.undiscovered ? '#fff5d4' : '#9bf5b8';
        const tag = target.undiscovered ? 'nearest undiscovered' : 'nearest (all discovered)';
        label.innerHTML = `<span style="opacity:0.7;font-size:10px">${tag}</span><br><span style="color:${labelColor}">${sight.name}</span>`;
        dist.textContent = `${target.dist.toFixed(0)} u`;
        arrow.style.color = target.undiscovered ? '#fff5d4' : '#9bf5b8';
    }

    function toggle() { visible = !visible; wrap.style.display = visible ? 'flex' : 'none'; }
    function show() { visible = true; wrap.style.display = 'flex'; }
    function hide() { visible = false; wrap.style.display = 'none'; }

    document.addEventListener('keydown', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
        if (e.key === 'n' || e.key === 'N') { toggle(); }
    });

    return { update, toggle, show, hide, dom: wrap };
}

export default createCosmicSightCompass;
