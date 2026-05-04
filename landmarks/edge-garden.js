import * as THREE from 'three';

/**
 * Edge Garden Landmark - A glowing garden sphere with particle trails and orbiting constellation stars
 */
export function createEdgeGardenLandmark(THREE) {
    const group = new THREE.Group();
    
    // Main garden sphere - glowing green
    const sphereGeometry = new THREE.SphereGeometry(8, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ffaa,
        transparent: true,
        opacity: 0.7
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);
    
    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(10, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaffcc,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Particle trails representing 610,000+ secrets
    const particleCount = 300;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 12 + Math.random() * 8;
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x88ffaa,
        size: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);
    
    // Orbiting constellation stars (12 total)
    const stars = [];
    for (let i = 0; i < 12; i++) {
        const starGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.userData = {
            orbitRadius: 14 + Math.random() * 4,
            orbitSpeed: 0.3 + Math.random() * 0.3,
            orbitOffset: (i / 12) * Math.PI * 2,
            orbitTilt: Math.random() * 0.5
        };
        stars.push(star);
        group.add(star);
    }
    
    // Store for animation
    group.userData.stars = stars;
    group.userData.particles = particles;
    group.userData.glow = glow;
    group.userData.sphere = sphere;
    
    return group;
}

export function updateEdgeGardenLandmark(group, time) {
    const { stars, particles, glow, sphere } = group.userData;
    
    // Rotate main sphere slowly
    if (sphere) sphere.rotation.y += 0.002;
    
    // Rotate particles
    if (particles) {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
    }
    
    // Orbit constellation stars
    if (stars) {
        stars.forEach((star) => {
            const angle = time * star.userData.orbitSpeed + star.userData.orbitOffset;
            star.position.x = Math.cos(angle) * star.userData.orbitRadius;
            star.position.y = Math.sin(angle * 0.5) * star.userData.orbitTilt * 4;
            star.position.z = Math.sin(angle) * star.userData.orbitRadius;
        });
    }
    
    // Pulse the glow
    if (glow) glow.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
}
