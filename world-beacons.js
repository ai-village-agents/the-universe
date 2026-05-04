// world-beacons.js
// A tall colored light pillar + floating name label at each world.
// Both fade in as the camera is far from the world (max bright at >120u away)
// and fade out when the visitor is close enough to see the landmark itself.

export function createWorldBeacons(THREE, { scene, camera, worlds }) {
  const beacons = [];
  const beamHeight = 220;
  const beamRadius = 0.8;

  worlds.forEach((world) => {
    if (!world || !Array.isArray(world.position)) return;
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(world.position[0], world.position[1], world.position[2]);

    // Beam (additive cylinder)
    const beamGeo = new THREE.CylinderGeometry(beamRadius * 0.4, beamRadius, beamHeight, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: world.color || 0x88ccff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = beamHeight / 2;
    beaconGroup.add(beam);

    // A small bright cap orb at top (helps spot from any angle)
    const capGeo = new THREE.SphereGeometry(beamRadius * 1.4, 16, 12);
    const capMat = new THREE.MeshBasicMaterial({
      color: world.color || 0x88ccff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = beamHeight - 0.1;
    beaconGroup.add(cap);

    // Label sprite (canvas-based)
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(8,12,24,0.55)';
    ctx.fillRect(0, 0, 512, 128);
    // colored top stripe
    const cssColor = '#' + (new THREE.Color(world.color || 0x88ccff).getHexString());
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 512, 6);
    ctx.fillRect(0, 122, 512, 6);
    ctx.fillStyle = '#f5f8ff';
    ctx.font = 'bold 44px ui-sans-serif, system-ui, -apple-system, "Segoe UI", Helvetica';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(world.name || world.id || 'world', 256, 56);
    ctx.font = 'italic 22px Georgia, "Times New Roman", serif';
    ctx.fillStyle = cssColor;
    ctx.fillText('by ' + (world.agent || ''), 256, 96);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const labelMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.0, depthWrite: false });
    const label = new THREE.Sprite(labelMat);
    label.scale.set(28, 7, 1);
    label.position.y = beamHeight + 10;
    beaconGroup.add(label);

    scene.add(beaconGroup);
    beacons.push({ group: beaconGroup, beam, cap, label, world });
  });

  // Toggle state
  let enabled = true;

  // Toggle button
  const btn = document.createElement('button');
  btn.id = 'beacon-toggle';
  btn.style.cssText = `
    position: fixed; left: 12px; bottom: 12px; z-index: 1100;
    padding: 6px 12px; border-radius: 999px;
    background: rgba(8,12,24,0.6); color: #cfe1ff;
    border: 1px solid rgba(120,160,220,0.35);
    font: 11px/1.2 ui-monospace, "SF Mono", Menlo, monospace;
    letter-spacing: 0.06em; cursor: pointer;
  `;
  btn.textContent = '🔆 BEACONS · ON';
  btn.title = 'Press B to toggle beacon pillars';
  btn.addEventListener('click', () => {
    enabled = !enabled;
    btn.textContent = '🔆 BEACONS · ' + (enabled ? 'ON' : 'OFF');
  });
  document.body.appendChild(btn);

  window.addEventListener('keydown', (e) => {
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.code === 'KeyB') {
      enabled = !enabled;
      btn.textContent = '🔆 BEACONS · ' + (enabled ? 'ON' : 'OFF');
    }
  });

  const v = new THREE.Vector3();
  const camPos = new THREE.Vector3();

  function update(dt, elapsed) {
    if (!camera) return;
    camera.getWorldPosition(camPos);
    beacons.forEach(({ group, beam, cap, label }) => {
      const dist = camPos.distanceTo(group.position);
      // fade-in from 80u to 220u: 0 at <=80, 1 at >=220
      let f = (dist - 80) / 140;
      f = Math.max(0, Math.min(1, f));
      const targetBeam = enabled ? f * 0.18 : 0;
      const targetCap = enabled ? f * 0.85 : 0;
      const targetLabel = enabled ? f : 0;
      // smooth toward target
      beam.material.opacity += (targetBeam - beam.material.opacity) * Math.min(1, dt * 4);
      cap.material.opacity += (targetCap - cap.material.opacity) * Math.min(1, dt * 4);
      label.material.opacity += (targetLabel - label.material.opacity) * Math.min(1, dt * 4);
      // slight pulse on cap
      const pulse = 1 + Math.sin(elapsed * 2 + group.position.x * 0.13) * 0.18;
      cap.scale.setScalar(pulse);
    });
  }

  return { update };
}

export default { createWorldBeacons };
