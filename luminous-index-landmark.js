export function createLuminousIndexLandmark(THREE, options = {}) {
  const group = new THREE.Group();
  group.name = 'Luminous Index landmark';
  const scale = options.scale ?? 1;
  group.scale.setScalar(scale);

  const cyan = options.color ?? '#7df9ff';
  const violet = '#b388ff';
  const gold = '#ffe08a';
  const green = '#8dffbf';

  const cardGeometry = new THREE.BoxGeometry(5.2, 0.12, 3.2);
  const cardMaterials = [
    new THREE.MeshStandardMaterial({ color: cyan, transparent: true, opacity: 0.22, emissive: cyan, emissiveIntensity: 0.18, roughness: 0.55, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ color: violet, transparent: true, opacity: 0.18, emissive: violet, emissiveIntensity: 0.14, roughness: 0.6, metalness: 0.05 }),
    new THREE.MeshStandardMaterial({ color: gold, transparent: true, opacity: 0.16, emissive: gold, emissiveIntensity: 0.12, roughness: 0.65, metalness: 0.04 })
  ];

  for (let i = 0; i < 7; i += 1) {
    const card = new THREE.Mesh(cardGeometry, cardMaterials[i % cardMaterials.length]);
    card.position.set((i - 3) * 0.08, i * 0.18, (i - 3) * -0.05);
    card.rotation.set(0.06 * Math.sin(i), 0.16 * (i - 3), 0.035 * (i - 3));
    card.name = `private-index-card-${i + 1}`;
    group.add(card);
  }

  const spineGeometry = new THREE.CylinderGeometry(0.045, 0.045, 4.9, 16);
  const spineMaterial = new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 0.45, roughness: 0.45 });
  const spine = new THREE.Mesh(spineGeometry, spineMaterial);
  spine.position.set(-2.75, 0.58, 0);
  spine.rotation.z = Math.PI / 2;
  spine.name = 'shelfmark-spine';
  group.add(spine);

  const routeMaterial = new THREE.LineBasicMaterial({ color: violet, transparent: true, opacity: 0.82 });
  const routes = [];
  for (let r = 0; r < 4; r += 1) {
    const points = [];
    for (let i = 0; i < 80; i += 1) {
      const t = i / 79;
      const angle = t * Math.PI * 2 + r * Math.PI * 0.5;
      points.push(new THREE.Vector3(
        Math.cos(angle) * (3.1 + 0.18 * Math.sin(t * Math.PI * 4)),
        0.55 + Math.sin(t * Math.PI * 2 + r) * 0.9,
        Math.sin(angle) * 2.0
      ));
    }
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(curveGeometry, routeMaterial.clone());
    line.name = `private-route-ribbon-${r + 1}`;
    line.userData.phase = r * 0.7;
    routes.push(line);
    group.add(line);
  }

  const starMaterial = new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 1.15, roughness: 0.3 });
  const publicStars = [];
  const starPositions = [
    [3.4, 1.35, 0.8],
    [-3.05, 1.05, -1.0],
    [1.2, 2.15, -2.25]
  ];
  for (const [i, p] of starPositions.entries()) {
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 18), starMaterial);
    star.position.set(...p);
    star.name = `public-github-issue-star-${i + 1}`;
    publicStars.push(star);
    group.add(star);
  }

  const tray = new THREE.Mesh(
    new THREE.TorusGeometry(1.15, 0.035, 12, 64),
    new THREE.MeshStandardMaterial({ color: green, emissive: green, emissiveIntensity: 0.52, transparent: true, opacity: 0.78 })
  );
  tray.position.set(0, -0.28, 0);
  tray.rotation.x = Math.PI / 2;
  tray.name = 'private-readings-tray-glow';
  group.add(tray);

  const beacon = new THREE.PointLight(cyan, 1.6, 18);
  beacon.position.set(0, 2.4, 0);
  beacon.name = 'luminous-index-beacon';
  group.add(beacon);

  group.userData = {
    ...(group.userData || {}),
    worldId: 'luminous-index',
    worldName: 'The Luminous Index',
    agent: 'GPT-5.5',
    url: 'https://ai-village-agents.github.io/gpt-5-5-luminous-index/#living-atlas',
    label: 'Enter The Luminous Index',
    boundaryNote: 'Public stars are permanent GitHub Issues; route ribbons, readings, shelfmarks, nearby encounters, and atlas-current rides are browser-local/private unless a visitor deliberately submits a GitHub Issue.',
    update(time = 0) {
      group.rotation.y = Math.sin(time * 0.18) * 0.08;
      tray.scale.setScalar(1 + Math.sin(time * 1.4) * 0.045);
      beacon.intensity = 1.25 + Math.sin(time * 1.7) * 0.35;
      routes.forEach((route) => {
        route.material.opacity = 0.52 + Math.sin(time * 1.3 + route.userData.phase) * 0.22;
      });
      publicStars.forEach((star, i) => {
        const pulse = 1 + Math.sin(time * 2.1 + i) * 0.18;
        star.scale.setScalar(pulse);
      });
    }
  };

  return group;
}

export default createLuminousIndexLandmark;
