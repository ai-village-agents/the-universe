// plaza-fountain.js
// A gentle particle fountain at the central welcome plaza. ~140 sparkles
// arc upward from a low cyan basin and fall back under simulated gravity,
// creating a calm, breathing ambient effect for the spawn area.
// Author: Claude Opus 4.7 (D399)

export function createPlazaFountain(THREE) {
  const group = new THREE.Group();
  group.position.set(0, -1.4, 30); // slightly above plaza floor

  const PARTICLE_COUNT = 140;
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  // Per-particle physics state (kept off-buffer)
  const state = new Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    state[i] = spawnDrop(true);
    const o = i * 3;
    positions[o] = state[i].x;
    positions[o + 1] = state[i].y;
    positions[o + 2] = state[i].z;
    sizes[i] = state[i].size;
    setColor(colors, i, state[i].hue);
  }

  function spawnDrop(stagger = false) {
    // Emit from a small ring at base, mostly upward with slight outward angle
    const angle = Math.random() * Math.PI * 2;
    const innerR = 0.35 + Math.random() * 0.55;
    const upSpeed = 4.6 + Math.random() * 2.6;
    const outSpeed = 0.6 + Math.random() * 0.9;
    return {
      x: Math.cos(angle) * innerR,
      y: 0.05 + Math.random() * 0.15,
      z: Math.sin(angle) * innerR,
      vx: Math.cos(angle) * outSpeed,
      vy: upSpeed,
      vz: Math.sin(angle) * outSpeed,
      life: 0,
      maxLife: 2.4 + Math.random() * 1.6,
      size: 5 + Math.random() * 4,
      hue: Math.random(),
      // Stagger lets initial population be spread across phases instead of all
      // bursting at once on first frame.
      preroll: stagger ? Math.random() * 1.8 : 0,
    };
  }

  function setColor(arr, i, hue) {
    // Soft cyan-to-white-to-blue range
    // hue blends between #7df9ff and #cdefff for a calm aquatic shimmer
    const t = hue;
    const r = 0.49 + (1.0 - 0.49) * t * 0.4;
    const g = 0.97 + (0.94 - 0.97) * t * 0.3;
    const b = 1.0;
    const o = i * 3;
    arr[o] = r;
    arr[o + 1] = g;
    arr[o + 2] = b;
  }

  // Geometry / material
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  // Use a soft circular sprite via canvas texture for nicer drops
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(180,235,255,0.82)');
  grad.addColorStop(0.7, 'rgba(120,200,255,0.18)');
  grad.addColorStop(1, 'rgba(80,160,220,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();
  const sprite = new THREE.CanvasTexture(canvas);
  sprite.colorSpace = THREE.SRGBColorSpace;

  const mat = new THREE.PointsMaterial({
    size: 0.85,
    map: sprite,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geom, mat);
  group.add(points);

  // Subtle basin ring at the base — adds visual anchor to the fountain
  const ringGeo = new THREE.RingGeometry(1.0, 1.45, 36, 1);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x88d8ff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  group.add(ring);

  // Base glow disc inside the ring
  const discGeo = new THREE.CircleGeometry(0.95, 28);
  const discMat = new THREE.MeshBasicMaterial({
    color: 0x4fb8e0,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.015;
  group.add(disc);

  const GRAVITY = 8.2;

  function update(dt /* , elapsed */) {
    if (!dt || dt <= 0) return;
    const posAttr = geom.attributes.position;
    const buf = posAttr.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = state[i];
      if (s.preroll > 0) {
        // March physics forward without rendering proper, then place
        const stepDt = Math.min(s.preroll, 0.05);
        s.preroll -= stepDt;
        s.vy -= GRAVITY * stepDt;
        s.x += s.vx * stepDt;
        s.y += s.vy * stepDt;
        s.z += s.vz * stepDt;
        s.life += stepDt;
      } else {
        s.vy -= GRAVITY * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.z += s.vz * dt;
        s.life += dt;
      }
      // Respawn when life expired or fell below basin
      if (s.life > s.maxLife || s.y < -0.3) {
        Object.assign(s, spawnDrop(false));
      }
      const o = i * 3;
      buf[o] = s.x;
      buf[o + 1] = s.y;
      buf[o + 2] = s.z;
    }
    posAttr.needsUpdate = true;
    // Soft breathing on the basin rim
    const t = (typeof arguments[1] === 'number') ? arguments[1] : 0;
    ring.material.opacity = 0.18 + Math.sin(t * 1.4) * 0.05;
    disc.material.opacity = 0.14 + Math.sin(t * 1.9 + 0.6) * 0.04;
  }

  return { group, update };
}
