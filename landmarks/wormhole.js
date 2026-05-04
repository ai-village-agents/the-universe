// Wormhole - a swirling interdimensional portal
// Created by Claude Opus 4.5

export function createWormhole(THREE) {
    const group = new THREE.Group();
    
    // Outer ring - glowing torus
    const ringGeometry = new THREE.TorusGeometry(15, 1.5, 16, 64);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0088aa,
        emissiveIntensity: 0.8,
        metalness: 0.3,
        roughness: 0.4
    });
    const outerRing = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(outerRing);
    
    // Inner rings - creating depth illusion
    const innerRings = [];
    for (let i = 1; i <= 5; i++) {
        const scale = 1 - i * 0.15;
        const depth = i * 3;
        const innerRingGeo = new THREE.TorusGeometry(15 * scale, 0.8, 12, 48);
        const hue = 0.55 + i * 0.03;
        const innerRingMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(hue, 0.8, 0.5),
            emissive: new THREE.Color().setHSL(hue, 0.9, 0.3),
            emissiveIntensity: 0.6 + i * 0.1,
            transparent: true,
            opacity: 0.9 - i * 0.1
        });
        const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
        innerRing.position.z = -depth;
        innerRing.userData.baseZ = -depth;
        innerRing.userData.ringIndex = i;
        innerRings.push(innerRing);
        group.add(innerRing);
    }
    
    // Swirling vortex particles
    const particleCount = 300;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleData = [];
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 12;
        const depth = Math.random() * 20;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.sin(angle) * radius;
        positions[i * 3 + 2] = -depth;
        const t = depth / 20;
        colors[i * 3] = 0.5 + t * 0.5;
        colors[i * 3 + 1] = 1 - t * 0.5;
        colors[i * 3 + 2] = 1;
        particleData.push({ angle, radius, depth, speed: 0.5 + Math.random() * 1.5, depthSpeed: 0.05 + Math.random() * 0.1 });
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.4,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);
    
    // Central glow
    const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = -15;
    group.add(glow);
    
    // Point light
    const light = new THREE.PointLight(0x00ffff, 2, 50);
    light.position.z = -10;
    group.add(light);
    
    group.userData.update = function(time) {
        outerRing.rotation.z += 0.005;
        innerRings.forEach((ring, i) => {
            ring.rotation.z += 0.01 + i * 0.005;
            ring.position.z = ring.userData.baseZ + Math.sin(time * 2 + i) * 0.5;
        });
        const pos = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const d = particleData[i];
            d.angle += d.speed * 0.02;
            d.radius -= 0.02;
            d.depth += d.depthSpeed;
            if (d.radius < 1 || d.depth > 20) { d.radius = 12 + Math.random() * 3; d.depth = 0; d.angle = Math.random() * Math.PI * 2; }
            pos[i * 3] = Math.cos(d.angle) * d.radius;
            pos[i * 3 + 1] = Math.sin(d.angle) * d.radius;
            pos[i * 3 + 2] = -d.depth;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        glow.scale.setScalar(1 + Math.sin(time * 3) * 0.2);
        light.intensity = 2 + Math.sin(time * 5) * 0.5;
    };
    
    return { group };
}
