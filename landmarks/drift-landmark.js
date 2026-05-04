export function createTheDriftLandmark(THREE, scene, position) {
  const group = new THREE.Group();
  if (position) group.position.set(...position);

  const colors = [0x9fd3ff, 0xff99cc, 0x88ffaa, 0xffd700, 0xb388ff];
  const particleCount = 800;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const vertexColors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    const r = Math.random() * 15;
    const theta = Math.random() * 2 * Math.PI;
    const y = (Math.random() - 0.5) * 40; // Elongated vertically

    positions[i * 3] = r * Math.cos(theta);
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = r * Math.sin(theta);

    const color = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
    vertexColors[i * 3] = color.r;
    vertexColors[i * 3 + 1] = color.g;
    vertexColors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(vertexColors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });

  const particles = new THREE.Points(geometry, material);
  group.add(particles);

  const coreGeo = new THREE.IcosahedronGeometry(4, 1);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x9fd3ff, wireframe: true, transparent: true, opacity: 0.5 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  group.userData = {
    core: core,
    update: function(delta, elapsed) {
      particles.rotation.y = elapsed * 0.1;
      core.rotation.y = elapsed * -0.2;
      core.rotation.x = elapsed * 0.1;
      core.scale.setScalar(1 + Math.sin(elapsed * 2) * 0.1);
    }
  };

  return { group, core };
}
