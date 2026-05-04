// White Dwarf - Dense stellar remnant, Earth-sized but Sun-mass
// Created by Claude Opus 4.5 - Day 398

export function createWhiteDwarf(THREE) {
    const group = new THREE.Group();
    
    // The white dwarf - small but intensely bright
    const dwarfGeometry = new THREE.SphereGeometry(3, 32, 32);
    const dwarfMaterial = new THREE.MeshBasicMaterial({
        color: 0xeeffff
    });
    const dwarf = new THREE.Mesh(dwarfGeometry, dwarfMaterial);
    group.add(dwarf);
    
    // Hot blue-white glow
    const innerGlowGeometry = new THREE.SphereGeometry(4, 32, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xccddff,
        transparent: true,
        opacity: 0.6
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    group.add(innerGlow);
    
    // Outer cooling envelope
    const outerGlowGeometry = new THREE.SphereGeometry(8, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x99aaff,
        transparent: true,
        opacity: 0.2
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    group.add(outerGlow);
    
    // Crystallizing carbon core indicator
    const coreGeometry = new THREE.IcosahedronGeometry(1.5, 0);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Debris disk - remnants of former planetary system
    const diskParticles = 300;
    const diskPositions = new Float32Array(diskParticles * 3);
    const diskColors = new Float32Array(diskParticles * 3);
    
    for (let i = 0; i < diskParticles; i++) {
        const r = 15 + Math.random() * 25;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 3;
        
        diskPositions[i * 3] = r * Math.cos(angle);
        diskPositions[i * 3 + 1] = height;
        diskPositions[i * 3 + 2] = r * Math.sin(angle);
        
        // Mix of icy and rocky debris
        const type = Math.random();
        if (type < 0.5) {
            // Icy
            diskColors[i * 3] = 0.7 + Math.random() * 0.3;
            diskColors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            diskColors[i * 3 + 2] = 1.0;
        } else {
            // Rocky
            diskColors[i * 3] = 0.6 + Math.random() * 0.3;
            diskColors[i * 3 + 1] = 0.5 + Math.random() * 0.2;
            diskColors[i * 3 + 2] = 0.4 + Math.random() * 0.2;
        }
    }
    
    const diskGeometry = new THREE.BufferGeometry();
    diskGeometry.setAttribute('position', new THREE.BufferAttribute(diskPositions, 3));
    diskGeometry.setAttribute('color', new THREE.BufferAttribute(diskColors, 3));
    
    const diskMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    const disk = new THREE.Points(diskGeometry, diskMaterial);
    group.add(disk);
    
    // Cooling track rings - showing temperature evolution
    const coolingRings = [];
    const colors = [0xaaccff, 0x88aadd, 0x6688bb, 0x446699];
    for (let i = 0; i < 4; i++) {
        const ringRadius = 50 + i * 8;
        const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.3, 8, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: colors[i],
            transparent: true,
            opacity: 0.15 - i * 0.03
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        coolingRings.push(ring);
        group.add(ring);
    }
    
    // UV radiation burst particles
    const uvParticles = 150;
    const uvPositions = new Float32Array(uvParticles * 3);
    const uvColors = new Float32Array(uvParticles * 3);
    
    for (let i = 0; i < uvParticles; i++) {
        const r = 5 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        uvPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        uvPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        uvPositions[i * 3 + 2] = r * Math.cos(phi);
        
        // Blue-violet UV glow
        uvColors[i * 3] = 0.6 + Math.random() * 0.2;
        uvColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        uvColors[i * 3 + 2] = 1.0;
    }
    
    const uvGeometry = new THREE.BufferGeometry();
    uvGeometry.setAttribute('position', new THREE.BufferAttribute(uvPositions, 3));
    uvGeometry.setAttribute('color', new THREE.BufferAttribute(uvColors, 3));
    
    const uvMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    
    const uvCloud = new THREE.Points(uvGeometry, uvMaterial);
    group.add(uvCloud);
    
    // Companion red dwarf (common binary)
    const companionGeometry = new THREE.SphereGeometry(2, 16, 16);
    const companionMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6644,
        transparent: true,
        opacity: 0.8
    });
    const companion = new THREE.Mesh(companionGeometry, companionMaterial);
    companion.position.set(35, 5, 0);
    group.add(companion);
    
    // Companion glow
    const companionGlowGeometry = new THREE.SphereGeometry(4, 16, 16);
    const companionGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4422,
        transparent: true,
        opacity: 0.3
    });
    const companionGlow = new THREE.Mesh(companionGlowGeometry, companionGlowMaterial);
    companionGlow.position.copy(companion.position);
    group.add(companionGlow);
    
    // Intense light
    const dwarfLight = new THREE.PointLight(0xccddff, 0.7, 100);
    group.add(dwarfLight);
    
    // Animation
    group.userData.update = function(time) {
        // Core crystallization rotation
        core.rotation.x = time * 0.5;
        core.rotation.y = time * 0.7;
        
        // Glow pulsation
        const pulse = 1 + 0.1 * Math.sin(time * 2);
        innerGlow.scale.setScalar(pulse);
        innerGlowMaterial.opacity = 0.5 + 0.15 * Math.sin(time * 2);
        
        outerGlowMaterial.opacity = 0.15 + 0.08 * Math.sin(time * 1.5);
        
        // Debris disk rotation
        disk.rotation.y = time * 0.1;
        
        // UV particle shimmer
        uvMaterial.opacity = 0.4 + 0.2 * Math.sin(time * 3);
        
        // Cooling rings pulse
        coolingRings.forEach((ring, i) => {
            ring.material.opacity = (0.12 - i * 0.025) + 0.05 * Math.sin(time * 0.5 + i * 0.5);
        });
        
        // Companion orbit
        const compAngle = time * 0.15;
        companion.position.x = 35 * Math.cos(compAngle);
        companion.position.z = 35 * Math.sin(compAngle);
        companionGlow.position.copy(companion.position);
        
        // Light variation
        dwarfLight.intensity = 0.6 + 0.2 * Math.sin(time * 2);
        
        // Slow overall rotation
        group.rotation.y = time * 0.02;
    };
    
    return { group };
}
