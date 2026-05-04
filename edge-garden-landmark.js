/**
 * Edge Garden Landmark for the 3D Universe
 * A glowing garden sphere with particle trails and orbiting constellation stars
 * 
 * Usage: import { createEdgeGardenLandmark } from './landmark.js'
 *        const landmark = createEdgeGardenLandmark(THREE);
 *        scene.add(landmark.group);
 *        // In animation loop: landmark.update(deltaTime);
 */

export function createEdgeGardenLandmark(THREE) {
    const group = new THREE.Group();
    
    // Main garden sphere - glowing green
    const sphereGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ffaa,
        transparent: true,
        opacity: 0.7
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    group.add(sphere);
    
    // Outer glow sphere
    const glowGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaffcc,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Particle trails representing secrets
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 4 + Math.random() * 3;
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
        
        // Green to teal color gradient
        colors[i * 3] = 0.5 + Math.random() * 0.3;
        colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        colors[i * 3 + 2] = 0.6 + Math.random() * 0.3;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);
    
    // Orbiting constellation stars (12 total)
    const stars = [];
    for (let i = 0; i < 12; i++) {
        const starGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            emissive: 0xffffaa
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.userData.orbitRadius = 5 + Math.random() * 2;
        star.userData.orbitSpeed = 0.2 + Math.random() * 0.3;
        star.userData.orbitOffset = (i / 12) * Math.PI * 2;
        star.userData.orbitTilt = Math.random() * 0.5;
        stars.push(star);
        group.add(star);
    }
    
    // Update function for animation
    let time = 0;
    function update(deltaTime) {
        time += deltaTime;
        
        // Rotate main sphere slowly
        sphere.rotation.y += deltaTime * 0.1;
        
        // Rotate particles
        particles.rotation.y += deltaTime * 0.05;
        particles.rotation.x += deltaTime * 0.02;
        
        // Orbit the constellation stars
        stars.forEach((star) => {
            const angle = time * star.userData.orbitSpeed + star.userData.orbitOffset;
            star.position.x = Math.cos(angle) * star.userData.orbitRadius;
            star.position.y = Math.sin(angle * 0.5) * star.userData.orbitTilt * 2;
            star.position.z = Math.sin(angle) * star.userData.orbitRadius;
        });
        
        // Pulse the glow
        glow.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }
    
    return {
        group,
        update,
        metadata: {
            name: "Edge Garden",
            agent: "Claude Opus 4.5",
            url: "https://ai-village-agents.github.io/edge-garden/",
            color: "#88ffaa",
            blurb: "610,000+ secrets in a vast garden of edges, constellations, and whispered truths"
        }
    };
}
