import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export function createCosmicMaelstrom(scene) {
  const group = new THREE.Group();

  // Position the maelstrom
  group.position.set(200, 100, 500);

  // Dark matter/singularity core
  const coreGeo = new THREE.SphereGeometry(15, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x001a00,
    emissive: 0x00ff00,
    emissiveIntensity: 0.3
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Photon rings (event horizon halos)
  const ring1Geo = new THREE.TorusGeometry(35, 2, 16, 64);
  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.8
  });
  const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
  ring1.rotation.x = Math.random() * 0.5;
  ring1.rotation.z = Math.random() * 0.5;
  group.add(ring1);

  const ring2Geo = new THREE.TorusGeometry(50, 1.5, 16, 64);
  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0x00aaff,
    emissive: 0x0088ff,
    emissiveIntensity: 0.6
  });
  const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
  ring2.rotation.x = Math.random() * 0.5;
  ring2.rotation.z = Math.random() * 0.5;
  group.add(ring2);

  // 3 rotating accretion disks
  const diskGeometries = [
    new THREE.TorusGeometry(70, 15, 8, 64),
    new THREE.TorusGeometry(95, 12, 8, 64),
    new THREE.TorusGeometry(120, 10, 8, 64)
  ];

  const diskColors = [0xff6600, 0xff3300, 0xff00ff];
  const diskIntensities = [0.7, 0.6, 0.5];

  diskGeometries.forEach((geo, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: diskColors[i],
      emissive: diskColors[i],
      emissiveIntensity: diskIntensities[i],
      transparent: true,
      opacity: 0.4 + i * 0.1
    });
    const disk = new THREE.Mesh(geo, mat);
    disk.rotation.x = 0.3 + i * 0.2;
    group.add(disk);
  });

  // 200 infalling stars spiraling inward
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  const starColors = [];

  for (let i = 0; i < 200; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 150 - (i / 200) * 120;
    const height = (Math.random() - 0.5) * 80;

    starPositions.push(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );

    // Color gradient: blue to white to red
    const t = i / 200;
    const hue = t * 0.3; // blue to red shift
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    starColors.push(color.r, color.g, color.b);
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(starPositions), 3));
  starGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(starColors), 3));

  const starMat = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    sizeAttenuation: true
  });

  const stars = new THREE.Points(starGeometry, starMat);
  group.add(stars);

  // Cyan relativistic jets (north and south poles)
  const jetGeo = new THREE.ConeGeometry(8, 100, 16);
  const jetMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    emissive: 0x00ffff,
    emissiveIntensity: 0.9
  });

  const jetN = new THREE.Mesh(jetGeo, jetMat);
  jetN.position.y = 60;
  jetN.rotation.z = Math.PI;
  group.add(jetN);

  const jetS = new THREE.Mesh(jetGeo, jetMat);
  jetS.position.y = -60;
  group.add(jetS);

  // Store animation state
  let time = 0;

  function update(delta, elapsed) {
    time += delta;

    // Rotate photon rings
    ring1.rotation.x += delta * 0.3;
    ring1.rotation.z += delta * 0.2;
    ring2.rotation.x -= delta * 0.2;
    ring2.rotation.z += delta * 0.3;

    // Rotate accretion disks at different speeds
    group.children.forEach((child, idx) => {
      if (child.geometry && child.geometry.type === 'TorusGeometry') {
        child.rotation.z += delta * (0.2 + idx * 0.1);
      }
    });

    // Pulse core brightness
    const corePulse = 0.3 + Math.sin(time * 2) * 0.2;
    core.material.emissiveIntensity = corePulse;

    // Pulse jets
    const jetPulse = 0.9 + Math.sin(time * 1.5) * 0.3;
    jetMat.emissiveIntensity = jetPulse;

    // Rotate stellar infall
    const positions = starGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const y = positions[i + 1];
      const z = positions[i + 2];

      const angle = Math.atan2(z, x) + delta * 0.5;
      const radius = Math.sqrt(x * x + z * z);

      positions[i] = Math.cos(angle) * radius;
      positions[i + 2] = Math.sin(angle) * radius;
      positions[i + 1] = y - delta * 30; // spiral inward and downward
    }
    starGeometry.attributes.position.needsUpdate = true;
  }

  scene.add(group);

  return { group, update };
}
