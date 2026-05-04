// nebula.js - A colorful cosmic nebula cloud
// Created by Claude Opus 4.5

export function createNebula(THREE) {
    const group = new THREE.Group();
    
    // Position the nebula in a nice spot in the universe
    group.position.set(200, 100, -300);
    
    // Create multiple layered cloud spheres for depth
    const nebulaColors = [
        0xff6b9d,  // Pink
        0x9d4edd,  // Purple
        0x4361ee,  // Blue
        0x06ffa5,  // Cyan-green
        0xff9f1c   // Orange
    ];
    
    const cloudLayers = [];
    
    // Create 5 overlapping transparent spheres
    for (let i = 0; i < 5; i++) {
        const geometry = new THREE.SphereGeometry(80 + i * 15, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: nebulaColors[i],
            transparent: true,
            opacity: 0.08 - i * 0.01,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const cloud = new THREE.Mesh(geometry, material);
        cloud.position.set(
            Math.sin(i * 1.2) * 20,
            Math.cos(i * 0.8) * 15,
            Math.sin(i * 0.5) * 25
        );
        cloudLayers.push(cloud);
        group.add(cloud);
    }
    
    // Add bright core particles
    const coreParticleCount = 200;
    const coreGeometry = new THREE.BufferGeometry();
    const corePositions = new Float32Array(coreParticleCount * 3);
    const coreSizes = new Float32Array(coreParticleCount);
    
    for (let i = 0; i < coreParticleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = Math.random() * 60;
        
        corePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        corePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        corePositions[i * 3 + 2] = radius * Math.cos(phi);
        coreSizes[i] = Math.random() * 3 + 1;
    }
    
    coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    coreGeometry.setAttribute('size', new THREE.BufferAttribute(coreSizes, 1));
    
    const coreMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    const coreParticles = new THREE.Points(coreGeometry, coreMaterial);
    group.add(coreParticles);
    
    // Add outer wisps - elongated particle trails
    const wispCount = 150;
    const wispGeometry = new THREE.BufferGeometry();
    const wispPositions = new Float32Array(wispCount * 3);
    
    for (let i = 0; i < wispCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 70 + Math.random() * 80;
        wispPositions[i * 3] = Math.cos(angle) * distance;
        wispPositions[i * 3 + 1] = (Math.random() - 0.5) * 100;
        wispPositions[i * 3 + 2] = Math.sin(angle) * distance;
    }
    
    wispGeometry.setAttribute('position', new THREE.BufferAttribute(wispPositions, 3));
    
    const wispMaterial = new THREE.PointsMaterial({
        color: 0xc77dff,
        size: 1.5,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    
    const wisps = new THREE.Points(wispGeometry, wispMaterial);
    group.add(wisps);
    
    // Animation update function
    group.userData.update = function(time) {
        // Slowly rotate the entire nebula
        group.rotation.y = time * 0.02;
        group.rotation.x = Math.sin(time * 0.01) * 0.1;
        
        // Pulse the cloud layers
        cloudLayers.forEach((cloud, i) => {
            const phase = time * 0.3 + i * 0.5;
            cloud.material.opacity = 0.06 + Math.sin(phase) * 0.02;
            cloud.scale.setScalar(1 + Math.sin(phase * 0.5) * 0.05);
        });
        
        // Rotate core particles opposite direction
        coreParticles.rotation.y = -time * 0.05;
        coreParticles.rotation.z = time * 0.02;
        
        // Gentle wisp drift
        wisps.rotation.y = time * 0.01;
    };
    
    return group;
}
