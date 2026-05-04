// Cosmic Wanderer — a large translucent space-jellyfish that drifts slowly
// across the universe along a wide oval path. Pulsing bell + trailing
// tentacles of glowing particles. Pure decoration, additive blending.

export function createCosmicWanderer(THREE) {
  const group = new THREE.Group();

  // Bell (dome) — large translucent half-sphere
  const bellGeo = new THREE.SphereGeometry(28, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const bellMat = new THREE.MeshBasicMaterial({
    color: 0xaa88ff,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const bell = new THREE.Mesh(bellGeo, bellMat);
  group.add(bell);

  // Inner glow nucleus
  const nucleusGeo = new THREE.SphereGeometry(10, 24, 18);
  const nucleusMat = new THREE.MeshBasicMaterial({
    color: 0xffd6ff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
  nucleus.position.y = -3;
  group.add(nucleus);

  // Outer corona
  const coronaGeo = new THREE.SphereGeometry(34, 24, 18);
  const coronaMat = new THREE.MeshBasicMaterial({
    color: 0x6644aa,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  group.add(corona);

  // Bell rim particles (ring of glowing dots)
  const rimCount = 60;
  const rimPos = new Float32Array(rimCount * 3);
  const rimColors = new Float32Array(rimCount * 3);
  for (let i = 0; i < rimCount; i++) {
    const a = (i / rimCount) * Math.PI * 2;
    rimPos[i * 3] = Math.cos(a) * 26;
    rimPos[i * 3 + 1] = -2;
    rimPos[i * 3 + 2] = Math.sin(a) * 26;
    rimColors[i * 3] = 0.9 + Math.random() * 0.1;
    rimColors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
    rimColors[i * 3 + 2] = 1.0;
  }
  const rimGeo = new THREE.BufferGeometry();
  rimGeo.setAttribute('position', new THREE.BufferAttribute(rimPos, 3));
  rimGeo.setAttribute('color', new THREE.BufferAttribute(rimColors, 3));
  const rimMat = new THREE.PointsMaterial({
    size: 1.6,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const rim = new THREE.Points(rimGeo, rimMat);
  group.add(rim);

  // Tentacle particles — ~1200 dots scattered in the trailing column
  const tCount = 1200;
  const tPos = new Float32Array(tCount * 3);
  const tColors = new Float32Array(tCount * 3);
  // store (strand, t) for animation
  const tParams = new Array(tCount);
  const strandCount = 14;
  for (let i = 0; i < tCount; i++) {
    const strand = i % strandCount;
    const angle = (strand / strandCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
    const t = Math.random();
    tParams[i] = { strand, angle, t, jitter: Math.random() };
    const radius = 24 + Math.sin(t * Math.PI) * 6;
    tPos[i * 3] = Math.cos(angle) * radius * (1 - t * 0.6);
    tPos[i * 3 + 1] = -t * 90 + (Math.random() - 0.5) * 3;
    tPos[i * 3 + 2] = Math.sin(angle) * radius * (1 - t * 0.6);
    const fade = 1 - t;
    tColors[i * 3] = 0.8 * fade;
    tColors[i * 3 + 1] = 0.6 * fade + 0.1;
    tColors[i * 3 + 2] = 1.0 * fade;
  }
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  tGeo.setAttribute('color', new THREE.BufferAttribute(tColors, 3));
  const tMat = new THREE.PointsMaterial({
    size: 1.0,
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const tentacles = new THREE.Points(tGeo, tMat);
  group.add(tentacles);

  // Wide oval drift path: r=850, slight tilt, period ~480s
  const period = 480;
  function update(dt, elapsed) {
    const phase = (elapsed % period) / period; // 0..1
    const a = phase * Math.PI * 2;
    const x = Math.cos(a) * 850;
    const z = Math.sin(a) * 600;
    const y = 60 + Math.sin(a * 2) * 40;
    group.position.set(x, y, z);
    // face direction of motion
    const dx = -Math.sin(a) * 850;
    const dz = Math.cos(a) * 600;
    group.rotation.y = Math.atan2(dx, dz) + Math.PI / 2;
    // bell pulse
    const pulse = 1 + Math.sin(elapsed * 0.9) * 0.06;
    bell.scale.set(pulse, 1 + Math.sin(elapsed * 0.9) * 0.18, pulse);
    nucleus.material.opacity = 0.45 + Math.sin(elapsed * 0.9) * 0.18;
    corona.material.opacity = 0.06 + Math.sin(elapsed * 0.9) * 0.04;
    // tentacle wave (offset positions slightly along the strand)
    const positions = tentacles.geometry.attributes.position.array;
    for (let i = 0; i < tCount; i++) {
      const p = tParams[i];
      const t = (p.t + elapsed * 0.04 * (0.5 + p.jitter * 0.6)) % 1;
      const radius = 24 + Math.sin(t * Math.PI) * 6;
      const sway = Math.sin(elapsed * 1.2 + p.strand * 0.7 + t * 4) * 6 * t;
      const angle = p.angle + Math.sin(elapsed * 0.4 + p.strand) * 0.05;
      positions[i * 3] = Math.cos(angle) * radius * (1 - t * 0.6) + sway;
      positions[i * 3 + 1] = -t * 90;
      positions[i * 3 + 2] = Math.sin(angle) * radius * (1 - t * 0.6) + Math.cos(elapsed * 1.0 + p.strand * 0.7 + t * 4) * 6 * t;
    }
    tentacles.geometry.attributes.position.needsUpdate = true;
  }

  return { group, update };
}

export default { createCosmicWanderer };
