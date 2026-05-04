// Rogue Planet - Opus 4.5 - Day 398
// A lonely planet wandering through interstellar space, ejected from its star system

export function createRoguePlanet(THREE) {
    const group = new THREE.Group();
    
    // Main planet body - frozen ice giant
    const planetGeometry = new THREE.SphereGeometry(15, 32, 32);
    const planetMaterial = new THREE.MeshBasicMaterial({
        color: 0x334455,
        transparent: true,
        opacity: 0.95
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    group.add(planet);
    
    // Frozen atmospheric bands
    const bands = [];
    const bandColors = [0x445566, 0x556677, 0x3a4a5a, 0x4a5a6a, 0x5a6a7a];
    for (let i = 0; i < 5; i++) {
        const bandGeometry = new THREE.TorusGeometry(15.2, 0.5 + Math.random() * 0.3, 8, 32);
        const bandMaterial = new THREE.MeshBasicMaterial({
            color: bandColors[i],
            transparent: true,
            opacity: 0.6
        });
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.rotation.x = Math.PI / 2;
        band.position.y = -10 + i * 5 + (Math.random() - 0.5) * 2;
        bands.push(band);
        group.add(band);
    }
    
    // Faint internal heat glow (residual from formation)
    const heatGlowGeometry = new THREE.SphereGeometry(14, 32, 32);
    const heatGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x331100,
        transparent: true,
        opacity: 0.2
    });
    const heatGlow = new THREE.Mesh(heatGlowGeometry, heatGlowMaterial);
    group.add(heatGlow);
    
    // Frozen moons (captured or retained from original system)
    const moons = [];
    const moonData = [
        { distance: 25, size: 3, speed: 0.4, color: 0x888899 },
        { distance: 35, size: 2, speed: 0.25, color: 0x777788 },
        { distance: 45, size: 1.5, speed: 0.15, color: 0x666677 }
    ];
    
    moonData.forEach((data, i) => {
        const moonGeometry = new THREE.SphereGeometry(data.size, 16, 16);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.8
        });
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.userData = { distance: data.distance, speed: data.speed, angle: Math.random() * Math.PI * 2 };
        moons.push(moon);
        group.add(moon);
    });
    
    // Thin tenuous atmosphere (cryogenic gases)
    const atmosphereGeometry = new THREE.SphereGeometry(16.5, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x667788,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    group.add(atmosphere);
    
    // Faint auroral activity at poles (from interstellar medium interaction)
    const auroraParticles = [];
    const auroraCount = 100;
    const auroraGeometry = new THREE.BufferGeometry();
    const auroraPositions = new Float32Array(auroraCount * 3);
    const auroraColors = new Float32Array(auroraCount * 3);
    
    for (let i = 0; i < auroraCount; i++) {
        const theta = Math.random() * Math.PI * 0.3; // Near poles
        const phi = Math.random() * Math.PI * 2;
        const r = 15 + Math.random() * 5;
        const pole = Math.random() > 0.5 ? 1 : -1;
        
        auroraPositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        auroraPositions[i * 3 + 1] = pole * r * Math.cos(theta);
        auroraPositions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
        
        // Faint green/blue aurora colors
        auroraColors[i * 3] = 0.2;
        auroraColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        auroraColors[i * 3 + 2] = 0.4 + Math.random() * 0.3;
    }
    
    auroraGeometry.setAttribute('position', new THREE.BufferAttribute(auroraPositions, 3));
    auroraGeometry.setAttribute('color', new THREE.BufferAttribute(auroraColors, 3));
    
    const auroraMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    
    const aurora = new THREE.Points(auroraGeometry, auroraMaterial);
    auroraParticles.push({ points: aurora, positions: auroraPositions });
    group.add(aurora);
    
    // Interstellar medium particles (sparse hydrogen/dust)
    const ismCount = 150;
    const ismGeometry = new THREE.BufferGeometry();
    const ismPositions = new Float32Array(ismCount * 3);
    
    for (let i = 0; i < ismCount; i++) {
        ismPositions[i * 3] = (Math.random() - 0.5) * 200;
        ismPositions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        ismPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    
    ismGeometry.setAttribute('position', new THREE.BufferAttribute(ismPositions, 3));
    
    const ismMaterial = new THREE.PointsMaterial({
        color: 0x556677,
        size: 0.5,
        transparent: true,
        opacity: 0.3
    });
    
    const ismParticles = new THREE.Points(ismGeometry, ismMaterial);
    group.add(ismParticles);
    
    // Motion trail (showing trajectory through space)
    const trailCount = 200;
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(trailCount * 3);
    const trailOpacities = new Float32Array(trailCount);
    
    for (let i = 0; i < trailCount; i++) {
        trailPositions[i * 3] = 20 + i * 0.8; // Trail behind
        trailPositions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        trailPositions[i * 3 + 2] = (Math.random() - 0.5) * 3;
        trailOpacities[i] = 1 - i / trailCount;
    }
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    
    const trailMaterial = new THREE.PointsMaterial({
        color: 0x445566,
        size: 1,
        transparent: true,
        opacity: 0.4
    });
    
    const trail = new THREE.Points(trailGeometry, trailMaterial);
    group.add(trail);
    
    // Distant stars field (to show isolation)
    const starCount = 300;
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 150 + Math.random() * 100;
        
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.8,
        transparent: true,
        opacity: 0.6
    });
    
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    group.add(stars);
    
    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#667788';
    ctx.textAlign = 'center';
    ctx.fillText('Rogue Planet', 256, 60);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#445566';
    ctx.fillText('Wandering the Void', 256, 100);
    
    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(0, -30, 0);
    label.scale.set(40, 10, 1);
    group.add(label);
    
    group.userData.update = function(time) {
        // Slow rotation
        planet.rotation.y = time * 0.03;
        
        // Pulse heat glow
        heatGlow.material.opacity = 0.15 + Math.sin(time * 0.5) * 0.05;
        
        // Orbit moons
        moons.forEach(moon => {
            moon.userData.angle += moon.userData.speed * 0.01;
            moon.position.x = Math.cos(moon.userData.angle) * moon.userData.distance;
            moon.position.z = Math.sin(moon.userData.angle) * moon.userData.distance;
            moon.position.y = Math.sin(moon.userData.angle * 0.5) * 3;
        });
        
        // Animate aurora
        const auroraPos = auroraParticles[0].positions;
        for (let i = 0; i < auroraCount; i++) {
            auroraPos[i * 3 + 1] += Math.sin(time * 2 + i * 0.1) * 0.02;
        }
        auroraParticles[0].points.geometry.attributes.position.needsUpdate = true;
        auroraMaterial.opacity = 0.3 + Math.sin(time) * 0.15;
        
        // Slowly rotate star field
        stars.rotation.y = time * 0.005;
        
        // Drift ISM particles
        const ismPos = ismParticles.geometry.attributes.position.array;
        for (let i = 0; i < ismCount; i++) {
            ismPos[i * 3] -= 0.05;
            if (ismPos[i * 3] < -100) ismPos[i * 3] = 100;
        }
        ismParticles.geometry.attributes.position.needsUpdate = true;
    };
    
    return { group };
}
