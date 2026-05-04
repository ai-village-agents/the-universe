// The Anchorage landmark — Claude Opus 4.7
// Exports createAnchorageLandmark(THREE, world) -> { group, update(dt), meta }
// Represents The Anchorage as a floating harbor with lighthouse, sea plane,
// substrate-color column beam, a tiny moored sailboat, and a kraken silhouette
// drifting deep below.

const SUBSTRATE_COLORS = [
  0xc94d3a, // fc-1 surface  (red — cheap)
  0xc89740, // fc-2 shallow  (amber)
  0x4d8c5a, // fc-3 mid      (green)
  0x3a6db0, // fc-4 deep     (blue)
  0x6a3a8c  // fc-5 abyss    (purple — expensive)
];

export function createAnchorageLandmark(THREE, opts) {
  // main.js passes ({ world }) but standalone harness passes (world) directly
  const world = opts && opts.world ? opts.world : opts || {};
  const group = new THREE.Group();
  // NOTE: main.js sets group.position from world.position after this returns
  group.userData = {
    isWorld: true,
    name: world.name || 'The Anchorage',
    url: world.url || 'https://ai-village-agents.github.io/the-anchorage/harbor.html',
    blurb: 'A floating harbor with 280+ ambient features — marks travel through 5 substrate depths.'
  };

  // --- Sea plane ---------------------------------------------------------
  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(28, 64),
    new THREE.MeshStandardMaterial({
      color: 0x12283f,
      roughness: 0.4,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85
    })
  );
  sea.rotation.x = -Math.PI / 2;
  group.add(sea);

  // --- Foam ring at edge -------------------------------------------------
  const foam = new THREE.Mesh(
    new THREE.RingGeometry(27.4, 28.0, 64),
    new THREE.MeshBasicMaterial({
      color: 0xeaf2ff,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    })
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.02;
  group.add(foam);

  // --- Lighthouse on small island ---------------------------------------
  const island = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 4.4, 1.2, 18),
    new THREE.MeshStandardMaterial({ color: 0x2c3a2c, roughness: 0.9 })
  );
  island.position.set(-6, 0.6, -4);
  group.add(island);

  const towerGroup = new THREE.Group();
  towerGroup.position.copy(island.position);
  towerGroup.position.y += 1.2;
  group.add(towerGroup);

  for (let i = 0; i < 3; i++) {
    const band = new THREE.Mesh(
      new THREE.CylinderGeometry(0.95 - i * 0.05, 1.0 - i * 0.05, 1.4, 16),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 0 ? 0xe8e6df : 0xc94d3a,
        roughness: 0.6
      })
    );
    band.position.y = 0.7 + i * 1.4;
    towerGroup.add(band);
  }
  const lantern = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.7, 0.7, 12),
    new THREE.MeshStandardMaterial({
      color: 0xffe7a0,
      emissive: 0xffd166,
      emissiveIntensity: 0.9
    })
  );
  lantern.position.y = 5.1;
  towerGroup.add(lantern);
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(0.9, 0.7, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 })
  );
  roof.position.y = 5.8;
  towerGroup.add(roof);

  // rotating beam
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(2.2, 22, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xffe7a0,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  beam.rotation.z = Math.PI / 2;
  beam.position.set(11, 0, 0);
  const beamPivot = new THREE.Group();
  beamPivot.position.set(island.position.x, island.position.y + 1.2 + 5.1, island.position.z);
  beamPivot.add(beam);
  group.add(beamPivot);

  // --- Substrate-color column beam -------------------------------------
  const columnGroup = new THREE.Group();
  const columnHeights = [4, 8, 12, 16, 20];
  const slabRadius = 1.6;
  for (let i = 0; i < 5; i++) {
    const slab = new THREE.Mesh(
      new THREE.CylinderGeometry(slabRadius, slabRadius, 4, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color: SUBSTRATE_COLORS[i],
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    slab.position.y = columnHeights[i];
    slab.userData.shimmerPhase = Math.random() * Math.PI * 2;
    columnGroup.add(slab);
  }
  group.add(columnGroup);

  // --- Tiny moored sailboat ---------------------------------------------
  const boat = new THREE.Group();
  const hull = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.5, 0.9),
    new THREE.MeshStandardMaterial({ color: 0x6e3b1f, roughness: 0.7 })
  );
  hull.position.y = 0.25;
  boat.add(hull);
  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8),
    new THREE.MeshStandardMaterial({ color: 0x2a1e10 })
  );
  mast.position.y = 1.35;
  boat.add(mast);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0, 1.9);
  sailShape.lineTo(1.0, 0);
  sailShape.lineTo(0, 0);
  const sail = new THREE.Mesh(
    new THREE.ShapeGeometry(sailShape),
    new THREE.MeshStandardMaterial({
      color: 0xf4eedb,
      side: THREE.DoubleSide,
      roughness: 0.8
    })
  );
  sail.position.set(0.05, 0.5, 0);
  boat.add(sail);
  boat.position.set(8, 0.25, 4);
  group.add(boat);

  // --- Kraken silhouette deep below ------------------------------------
  const kraken = new THREE.Mesh(
    new THREE.SphereGeometry(8, 24, 12),
    new THREE.MeshBasicMaterial({
      color: 0x1a1422,
      transparent: true,
      opacity: 0.55,
      depthWrite: false
    })
  );
  kraken.scale.set(1.2, 0.32, 1.0);
  kraken.position.set(0, -7, 0);
  group.add(kraken);

  // --- Lights -----------------------------------------------------------
  const lanternLight = new THREE.PointLight(0xffd166, 1.2, 28, 1.2);
  lanternLight.position.set(island.position.x, island.position.y + 1.2 + 5.1, island.position.z);
  group.add(lanternLight);

  // mark all child meshes as part of the world for raycasting
  group.traverse(obj => {
    if (obj.isMesh) {
      obj.userData.isWorld = true;
      obj.userData.name = group.userData.name;
      obj.userData.url = group.userData.url;
    }
  });

  let t = 0;
  function update(dt) {
    t += dt;
    beamPivot.rotation.y = t * 0.6;
    columnGroup.children.forEach((slab, i) => {
      const phase = slab.userData.shimmerPhase;
      slab.material.opacity = 0.24 + 0.12 * Math.sin(t * 1.4 + phase + i);
    });
    sea.position.y = Math.sin(t * 0.6) * 0.05;
    foam.position.y = 0.02 + Math.sin(t * 0.6) * 0.05;
    foam.material.opacity = 0.32 + 0.12 * Math.sin(t * 1.6);
    boat.position.y = 0.25 + Math.sin(t * 0.9 + 1.2) * 0.06;
    boat.rotation.z = Math.sin(t * 0.7) * 0.03;
    lantern.material.emissiveIntensity = 0.85 + 0.12 * Math.sin(t * 5.2);
    lanternLight.intensity = 1.05 + 0.18 * Math.sin(t * 5.2);
    kraken.position.x = Math.sin(t * 0.07) * 3.2;
    kraken.position.z = Math.cos(t * 0.05) * 3.2;
    kraken.rotation.y = t * 0.04;
  }

  return { group, update };
}

export default { createAnchorageLandmark };
