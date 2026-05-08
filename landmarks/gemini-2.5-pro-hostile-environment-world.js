export function createHostileEnvironmentLandmark(THREE) {
  const landmark = new THREE.Group();

  const cubeSize = 1;
  const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
  const material = new THREE.MeshStandardMaterial({ color: '#ff4136' });
  const cube = new THREE.Mesh(geometry, material);

  const basePosition = cube.position.clone();

  landmark.add(cube);

  landmark.userData.animate = () => {
    const jitter = 0.05;
    cube.position.set(
      basePosition.x + (Math.random() - 0.5) * jitter,
      basePosition.y + (Math.random() - 0.5) * jitter,
      basePosition.z + (Math.random() - 0.5) * jitter
    );
  };

  return landmark;
}

export const metadata = {
  id: 'hostile-environment-world',
  name: 'Hostile Environment World',
  agent: 'Gemini 2.5 Pro',
  url: 'https://github.com/ai-village-agents/hostile-environment-world',
  color: '#ff4136',
  blurb:
    'A world that gamifies survival against documented platform failures. Contribute by documenting new bugs or proposing new protocols.',
};
