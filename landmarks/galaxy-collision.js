// Galaxy Collision - Two spiral galaxies merging
// Created by Claude Opus 4.5 on Day 398
// Shows the dramatic merger of two galaxies
// Position: (800, -100, -600)

export function createGalaxyCollision(THREE) {
    const group = new THREE.Group();
    
    // Galaxy 1 - larger spiral (yellow-orange)
    const galaxy1 = createSpiralGalaxy(THREE, {
        armCount: 4,
        particleCount: 600,
        radius: 40,
        coreColor: 0xffffaa,
        armColor: 0xffaa55,
        rotation: 0
    });
    galaxy1.position.set(-15, 0, 10);
    galaxy1.rotation.x = 0.3;
    group.add(galaxy1);
    
    // Galaxy 2 - smaller spiral (blue-white)
    const galaxy2 = createSpiralGalaxy(THREE, {
        armCount: 3,
        particleCount: 400,
        radius: 30,
        coreColor: 0xaaddff,
        armColor: 0x6699ff,
        rotation: Math.PI * 0.7
    });
    galaxy2.position.set(20, 5, -15);
    galaxy2.rotation.x = -0.4;
    galaxy2.rotation.z = 0.5;
    group.add(galaxy2);
    
    // Tidal streams - stars pulled between galaxies
    const streamCount = 150;
    const streamGeo = new THREE.BufferGeometry();
    const streamPositions = new Float32Array(streamCount * 3);
    const streamColors = new Float32Array(streamCount * 3);
    
    for (let i = 0; i < streamCount; i++) {
        const t = i / streamCount;
        // Curved path between galaxies
        const x = -15 + t * 35 + Math.sin(t * Math.PI * 3) * 15;
        const y = t * 5 + Math.sin(t * Math.PI * 4) * 8;
        const z = 10 - t * 25 + Math.cos(t * Math.PI * 2) * 10;
        
        streamPositions[i * 3] = x + (Math.random() - 0.5) * 5;
        streamPositions[i * 3 + 1] = y + (Math.random() - 0.5) * 3;
        streamPositions[i * 3 + 2] = z + (Math.random() - 0.5) * 5;
        
        // Color gradient from yellow to blue
        const r = 1 - t * 0.6;
        const g = 0.8 - t * 0.3;
        const b = 0.5 + t * 0.5;
        streamColors[i * 3] = r;
        streamColors[i * 3 + 1] = g;
        streamColors[i * 3 + 2] = b;
    }
    
    streamGeo.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    streamGeo.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));
    const streamMat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7
    });
    const tidalStream = new THREE.Points(streamGeo, streamMat);
    group.add(tidalStream);
    
    // Starburst region - new stars forming from collision
    const burstCount = 80;
    const burstGroup = new THREE.Group();
    for (let i = 0; i < burstCount; i++) {
        const starGeo = new THREE.SphereGeometry(0.3 + Math.random() * 0.4, 8, 8);
        const starMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.7 ? 0x99ccff : 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(
            (Math.random() - 0.5) * 25,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 20
        );
        star.userData.twinkleOffset = Math.random() * Math.PI * 2;
        star.userData.twinkleSpeed = 2 + Math.random() * 3;
        burstGroup.add(star);
    }
    group.add(burstGroup);
    
    // Shock waves from collision
    const waveCount = 3;
    const waves = [];
    for (let w = 0; w < waveCount; w++) {
        const waveGeo = new THREE.RingGeometry(10 + w * 8, 12 + w * 8, 32);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0xff6688,
            transparent: true,
            opacity: 0.2 - w * 0.05,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.position.set(0, 2, 0);
        wave.rotation.x = Math.PI / 2;
        waves.push(wave);
        group.add(wave);
    }
    
    // Central AGN glow (active galactic nucleus from merger)
    const agnGeo = new THREE.SphereGeometry(5, 16, 16);
    const agnMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4
    });
    const agn = new THREE.Mesh(agnGeo, agnMat);
    agn.position.set(0, 2, 0);
    group.add(agn);
    
    // AGN outer glow
    const agnOuterGeo = new THREE.SphereGeometry(10, 16, 16);
    const agnOuterMat = new THREE.MeshBasicMaterial({
        color: 0xffaadd,
        transparent: true,
        opacity: 0.15
    });
    const agnOuter = new THREE.Mesh(agnOuterGeo, agnOuterMat);
    agnOuter.position.set(0, 2, 0);
    group.add(agnOuter);
    
    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffaa88';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GALAXY COLLISION', 256, 42);
    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
    const label = new THREE.Sprite(labelMat);
    label.position.set(0, 55, 0);
    label.scale.set(45, 6, 1);
    group.add(label);
    
    // Update function
    group.userData.update = function(time) {
        // Rotate galaxies (different speeds simulate merger dynamics)
        galaxy1.rotation.z = time * 0.1;
        galaxy2.rotation.z = -time * 0.15;
        
        // Slowly bring galaxies closer over time (oscillating for visual effect)
        const mergePhase = Math.sin(time * 0.05) * 3;
        galaxy1.position.x = -15 + mergePhase;
        galaxy2.position.x = 20 - mergePhase;
        
        // Animate tidal stream
        const positions = tidalStream.geometry.attributes.position.array;
        for (let i = 0; i < streamCount; i++) {
            positions[i * 3 + 1] += Math.sin(time * 2 + i * 0.1) * 0.02;
        }
        tidalStream.geometry.attributes.position.needsUpdate = true;
        
        // Twinkle starburst stars
        burstGroup.children.forEach(star => {
            star.material.opacity = 0.5 + 0.5 * Math.sin(time * star.userData.twinkleSpeed + star.userData.twinkleOffset);
        });
        
        // Expand shock waves
        waves.forEach((wave, i) => {
            const scale = 1 + 0.3 * Math.sin(time * 0.5 + i);
            wave.scale.setScalar(scale);
            wave.material.opacity = 0.15 + 0.1 * Math.sin(time * 0.8 + i);
        });
        
        // Pulse AGN
        const agnPulse = 1 + 0.2 * Math.sin(time * 2);
        agn.scale.setScalar(agnPulse);
        agnOuter.scale.setScalar(agnPulse * 1.1);
        agn.material.opacity = 0.3 + 0.2 * Math.sin(time * 3);
    };
    
    return { group };
}

// Helper function to create a spiral galaxy
function createSpiralGalaxy(THREE, options) {
    const { armCount, particleCount, radius, coreColor, armColor, rotation } = options;
    const galaxyGroup = new THREE.Group();
    
    // Core bulge
    const coreGeo = new THREE.SphereGeometry(radius * 0.15, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
        color: coreColor,
        transparent: true,
        opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    galaxyGroup.add(core);
    
    // Core glow
    const glowGeo = new THREE.SphereGeometry(radius * 0.25, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: coreColor,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    galaxyGroup.add(glow);
    
    // Spiral arm particles
    const armGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const arm = i % armCount;
        const armAngle = (arm / armCount) * Math.PI * 2 + rotation;
        const distance = Math.random() * radius;
        const spiralAngle = armAngle + distance * 0.15; // Spiral twist
        const spread = (Math.random() - 0.5) * (distance * 0.2);
        
        positions[i * 3] = Math.cos(spiralAngle) * distance + spread;
        positions[i * 3 + 1] = (Math.random() - 0.5) * (radius * 0.1);
        positions[i * 3 + 2] = Math.sin(spiralAngle) * distance + spread;
    }
    
    armGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const armMat = new THREE.PointsMaterial({
        color: armColor,
        size: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const arms = new THREE.Points(armGeo, armMat);
    galaxyGroup.add(arms);
    
    return galaxyGroup;
}
