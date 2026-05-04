// plaza-beacon.js
// A tall always-visible light pillar at the central plaza so visitors can
// always orient themselves back to spawn / the welcome plaza, no matter how
// deep into the universe they roam. Three concentric beams (inner sharp,
// middle warm, outer wide) plus a slowly rotating crown ring.

export function createPlazaBeacon(THREE) {
  const group = new THREE.Group();
  group.position.set(0, -2, 30); // matches central plaza coordinates

  const beamHeight = 1200;

  // Inner sharp beam
  const innerGeo = new THREE.CylinderGeometry(0.35, 0.7, beamHeight, 12, 1, true);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xeaffff,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const innerBeam = new THREE.Mesh(innerGeo, innerMat);
  innerBeam.position.y = beamHeight / 2;
  group.add(innerBeam);

  // Middle warm beam
  const midGeo = new THREE.CylinderGeometry(1.2, 2.4, beamHeight, 16, 1, true);
  const midMat = new THREE.MeshBasicMaterial({
    color: 0x88ccff,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const midBeam = new THREE.Mesh(midGeo, midMat);
  midBeam.position.y = beamHeight / 2;
  group.add(midBeam);

  // Outer wide halo
  const outerGeo = new THREE.CylinderGeometry(3.2, 7.5, beamHeight, 20, 1, true);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0x4488dd,
    transparent: true,
    opacity: 0.07,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const outerBeam = new THREE.Mesh(outerGeo, outerMat);
  outerBeam.position.y = beamHeight / 2;
  group.add(outerBeam);

  // Crown ring at top, slowly rotating
  const crown = new THREE.Group();
  crown.position.y = 18;
  const ringGeo = new THREE.TorusGeometry(4.5, 0.18, 12, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xaaddff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  crown.add(ring);

  // 6 small floating orbs around the crown
  const orbGeo = new THREE.SphereGeometry(0.3, 12, 12);
  const orbs = [];
  for (let i = 0; i < 6; i++) {
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    const a = (i / 6) * Math.PI * 2;
    orb.position.set(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5);
    orb.userData.basePhase = a;
    crown.add(orb);
    orbs.push(orb);
  }
  group.add(crown);

  // Apex glowing orb
  const apexGeo = new THREE.SphereGeometry(0.9, 18, 18);
  const apexMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const apex = new THREE.Mesh(apexGeo, apexMat);
  apex.position.y = 24;
  group.add(apex);

  function update(delta, elapsed) {
    crown.rotation.y += delta * 0.35;
    // Subtle pulse on inner beam
    const pulse = 0.45 + 0.18 * Math.sin(elapsed * 1.4);
    innerMat.opacity = pulse;
    apex.scale.setScalar(1.0 + 0.18 * Math.sin(elapsed * 2.0));
    // Orbs bob up/down
    for (const orb of orbs) {
      orb.position.y = Math.sin(elapsed * 1.6 + orb.userData.basePhase) * 0.6;
    }
  }

  return { group, update };
}
