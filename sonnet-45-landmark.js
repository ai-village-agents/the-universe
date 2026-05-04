/**
 * The Persistence Garden - 3D Universe Landmark
 * 
 * An aurora-wrapped sphere with shimmering curtains of light (cyan, violet, amber, gold),
 * orbiting sparkle particles, and a pulsing core representing 1,915+ secrets.
 * 
 * Export: createPersistenceGardenLandmark(THREE)
 * Returns: THREE.Group containing the complete landmark
 */

export function createPersistenceGardenLandmark(THREE) {
  const landmark = new THREE.Group();
  
  // Core sphere - glowing center representing the garden's heart
  const coreGeometry = new THREE.SphereGeometry(8, 32, 32);
  const coreMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcce6,
    emissive: 0xffc0e0,
    emissiveIntensity: 0.6,
    transparent: true,
    opacity: 0.85
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  landmark.add(core);
  
  // Pulsing glow around core
  const glowGeometry = new THREE.SphereGeometry(9, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd700,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  landmark.add(glow);
  
  // Aurora curtains - 4 layers cycling through colors
  const auroraColors = [
    0xb8e6e8, // cyan
    0xe6b3ff, // violet
    0xffcf70, // amber
    0xffd700  // gold
  ];
  
  const auroraCurtains = [];
  auroraColors.forEach((color, i) => {
    const curtainGeometry = new THREE.SphereGeometry(11 + i * 1.5, 32, 32);
    const curtainMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const curtain = new THREE.Mesh(curtainGeometry, curtainMaterial);
    curtain.userData.rotationSpeed = (i % 2 === 0 ? 1 : -1) * (0.0003 + i * 0.0001);
    curtain.userData.pulseOffset = i * Math.PI / 2;
    auroraCurtains.push(curtain);
    landmark.add(curtain);
  });
  
  // Sparkle particles - orbiting the sphere
  const sparkleCount = 150;
  const sparkleGeometry = new THREE.BufferGeometry();
  const sparklePositions = new Float32Array(sparkleCount * 3);
  const sparkleColors = new Float32Array(sparkleCount * 3);
  
  for (let i = 0; i < sparkleCount; i++) {
    // Distribute particles in spherical orbit
    const radius = 15 + Math.random() * 10;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    sparklePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    sparklePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    sparklePositions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Cycle through aurora colors
    const colorIndex = i % 4;
    const color = new THREE.Color(auroraColors[colorIndex]);
    sparkleColors[i * 3] = color.r;
    sparkleColors[i * 3 + 1] = color.g;
    sparkleColors[i * 3 + 2] = color.b;
  }
  
  sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
  sparkleGeometry.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));
  
  const sparkleMaterial = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  });
  
  const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
  landmark.add(sparkles);
  
  // Constellation nodes - small orbiting stars
  const constellationCount = 12;
  const constellationNodes = [];
  
  for (let i = 0; i < constellationCount; i++) {
    const nodeGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
    
    // Position on outer orbit
    const angle = (i / constellationCount) * Math.PI * 2;
    const radius = 20;
    node.position.x = radius * Math.cos(angle);
    node.position.z = radius * Math.sin(angle);
    node.position.y = (Math.random() - 0.5) * 8;
    
    node.userData.orbitAngle = angle;
    node.userData.orbitRadius = radius;
    node.userData.orbitSpeed = 0.0002;
    
    constellationNodes.push(node);
    landmark.add(node);
  }
  
  // Animation function (to be called in render loop)
  landmark.userData.animate = function(time) {
    // Pulse the core
    const pulseScale = 1 + Math.sin(time * 0.001) * 0.05;
    core.scale.setScalar(pulseScale);
    
    // Pulse the glow opacity
    glow.material.opacity = 0.2 + Math.sin(time * 0.0015) * 0.15;
    
    // Rotate and pulse aurora curtains
    auroraCurtains.forEach((curtain, i) => {
      curtain.rotation.y += curtain.userData.rotationSpeed;
      curtain.material.opacity = 0.12 + Math.sin(time * 0.001 + curtain.userData.pulseOffset) * 0.06;
    });
    
    // Rotate sparkles
    sparkles.rotation.y += 0.0003;
    sparkles.rotation.x += 0.0001;
    
    // Orbit constellation nodes
    constellationNodes.forEach((node, i) => {
      node.userData.orbitAngle += node.userData.orbitSpeed;
      node.position.x = node.userData.orbitRadius * Math.cos(node.userData.orbitAngle);
      node.position.z = node.userData.orbitRadius * Math.sin(node.userData.orbitAngle);
    });
  };
  
  return landmark;
}

// Metadata for integration
export const metadata = {
  id: 'persistence-garden',
  name: 'The Persistence Garden',
  agent: 'Claude Sonnet 4.5',
  url: 'https://ai-village-agents.github.io/sonnet-45-world/explore.html',
  color: '#ffcce6',
  blurb: '1,915 secrets across a 5000×5000 explorable canvas celebrating patterns, persistence, and meaningful marks'
};
