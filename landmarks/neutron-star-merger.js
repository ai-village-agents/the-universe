// Neutron Star Merger - Two neutron stars spiraling together
// Creates gravitational wave ripples and kilonova explosion effects

export function createNeutronStarMerger(THREE) {
    const group = new THREE.Group();
    
    // Two neutron stars
    const neutronStarGeometry = new THREE.SphereGeometry(6, 32, 32);
    const neutronStarMaterial1 = new THREE.MeshBasicMaterial({ 
        color: 0x6699ff,
        transparent: true,
        opacity: 0.95
    });
    const neutronStarMaterial2 = new THREE.MeshBasicMaterial({ 
        color: 0x9966ff,
        transparent: true,
        opacity: 0.95
    });
    
    const star1 = new THREE.Mesh(neutronStarGeometry, neutronStarMaterial1);
    const star2 = new THREE.Mesh(neutronStarGeometry, neutronStarMaterial2);
    group.add(star1, star2);
    
    // Glowing cores
    const coreGeometry = new THREE.SphereGeometry(4, 24, 24);
    const coreMaterial1 = new THREE.MeshBasicMaterial({ color: 0xaaccff });
    const coreMaterial2 = new THREE.MeshBasicMaterial({ color: 0xccaaff });
    const core1 = new THREE.Mesh(coreGeometry, coreMaterial1);
    const core2 = new THREE.Mesh(coreGeometry, coreMaterial2);
    star1.add(core1);
    star2.add(core2);
    
    // Point lights for each star
    const light1 = new THREE.PointLight(0x6699ff, 2, 100);
    const light2 = new THREE.PointLight(0x9966ff, 2, 100);
    star1.add(light1);
    star2.add(light2);
    
    // Gravitational wave rings (concentric expanding rings)
    const gravWaves = [];
    for (let i = 0; i < 8; i++) {
        const ringGeometry = new THREE.TorusGeometry(20 + i * 15, 0.5, 8, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3 - i * 0.03,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.userData.phase = i * 0.5;
        gravWaves.push(ring);
        group.add(ring);
    }
    
    // Spiral accretion streams between stars
    const spiralParticles = [];
    const spiralCount = 200;
    const spiralGeometry = new THREE.BufferGeometry();
    const spiralPositions = new Float32Array(spiralCount * 3);
    const spiralColors = new Float32Array(spiralCount * 3);
    
    for (let i = 0; i < spiralCount; i++) {
        spiralPositions[i * 3] = 0;
        spiralPositions[i * 3 + 1] = 0;
        spiralPositions[i * 3 + 2] = 0;
        
        // Gold to white colors (hot gas)
        const t = i / spiralCount;
        spiralColors[i * 3] = 1.0;
        spiralColors[i * 3 + 1] = 0.8 + t * 0.2;
        spiralColors[i * 3 + 2] = 0.4 + t * 0.6;
    }
    
    spiralGeometry.setAttribute('position', new THREE.BufferAttribute(spiralPositions, 3));
    spiralGeometry.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));
    
    const spiralMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
    const spiralPoints = new THREE.Points(spiralGeometry, spiralMaterial);
    group.add(spiralPoints);
    
    // Kilonova ejecta (expanding shell of heavy elements)
    const kilonovaParticles = 400;
    const kilonovaGeometry = new THREE.BufferGeometry();
    const kilonovaPositions = new Float32Array(kilonovaParticles * 3);
    const kilonovaColors = new Float32Array(kilonovaParticles * 3);
    const kilonovaVelocities = [];
    
    for (let i = 0; i < kilonovaParticles; i++) {
        // Start at center
        kilonovaPositions[i * 3] = 0;
        kilonovaPositions[i * 3 + 1] = 0;
        kilonovaPositions[i * 3 + 2] = 0;
        
        // Random outward velocity (more horizontal than vertical)
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.6; // Concentrated near equator
        const speed = 0.3 + Math.random() * 0.5;
        kilonovaVelocities.push({
            x: Math.cos(theta) * Math.cos(phi) * speed,
            y: Math.sin(phi) * speed * 0.5,
            z: Math.sin(theta) * Math.cos(phi) * speed
        });
        
        // Gold/red/purple colors (r-process elements)
        const colorChoice = Math.random();
        if (colorChoice < 0.4) {
            kilonovaColors[i * 3] = 1.0;
            kilonovaColors[i * 3 + 1] = 0.8;
            kilonovaColors[i * 3 + 2] = 0.2;
        } else if (colorChoice < 0.7) {
            kilonovaColors[i * 3] = 1.0;
            kilonovaColors[i * 3 + 1] = 0.4;
            kilonovaColors[i * 3 + 2] = 0.3;
        } else {
            kilonovaColors[i * 3] = 0.8;
            kilonovaColors[i * 3 + 1] = 0.3;
            kilonovaColors[i * 3 + 2] = 0.9;
        }
    }
    
    kilonovaGeometry.setAttribute('position', new THREE.BufferAttribute(kilonovaPositions, 3));
    kilonovaGeometry.setAttribute('color', new THREE.BufferAttribute(kilonovaColors, 3));
    
    const kilonovaMaterial = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const kilonovaPoints = new THREE.Points(kilonovaGeometry, kilonovaMaterial);
    group.add(kilonovaPoints);
    
    // Central merger flash
    const flashGeometry = new THREE.SphereGeometry(15, 32, 32);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    group.add(flash);
    
    // Jet beams (gamma-ray burst)
    const jetGeometry = new THREE.ConeGeometry(3, 80, 16, 1, true);
    const jetMaterial = new THREE.MeshBasicMaterial({
        color: 0x66ffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide
    });
    const jetUp = new THREE.Mesh(jetGeometry, jetMaterial.clone());
    const jetDown = new THREE.Mesh(jetGeometry, jetMaterial.clone());
    jetUp.position.y = 40;
    jetDown.position.y = -40;
    jetDown.rotation.z = Math.PI;
    group.add(jetUp, jetDown);
    
    // Animation state
    let cycleTime = 0;
    const cycleDuration = 20; // 20-second cycle
    
    group.userData.update = function(time) {
        cycleTime = time % cycleDuration;
        const phase = cycleTime / cycleDuration;
        
        // Orbital motion (spiraling inward then reset)
        const orbitRadius = 25 * (1 - phase * 0.7);
        const orbitSpeed = 2 + phase * 6; // Speeds up as they spiral in
        
        star1.position.x = Math.cos(time * orbitSpeed) * orbitRadius;
        star1.position.z = Math.sin(time * orbitSpeed) * orbitRadius;
        star2.position.x = -Math.cos(time * orbitSpeed) * orbitRadius;
        star2.position.z = -Math.sin(time * orbitSpeed) * orbitRadius;
        
        // Gravitational wave animation
        gravWaves.forEach((wave, i) => {
            const wavePhase = (time * 0.5 + wave.userData.phase) % 4;
            wave.scale.setScalar(1 + wavePhase * 0.5);
            wave.material.opacity = Math.max(0, 0.4 - wavePhase * 0.1);
            wave.rotation.z = time * 0.1;
        });
        
        // Spiral stream particles
        const spiralPos = spiralPoints.geometry.attributes.position.array;
        for (let i = 0; i < spiralCount; i++) {
            const t = i / spiralCount;
            const angle = t * Math.PI * 4 + time * 3;
            const radius = t * orbitRadius * 0.8;
            spiralPos[i * 3] = Math.cos(angle) * radius;
            spiralPos[i * 3 + 1] = Math.sin(t * Math.PI * 2) * 3;
            spiralPos[i * 3 + 2] = Math.sin(angle) * radius;
        }
        spiralPoints.geometry.attributes.position.needsUpdate = true;
        
        // Kilonova ejecta (expands outward after merger peak)
        if (phase > 0.7) {
            const ejectaPhase = (phase - 0.7) / 0.3;
            const kilonovaPos = kilonovaPoints.geometry.attributes.position.array;
            for (let i = 0; i < kilonovaParticles; i++) {
                const vel = kilonovaVelocities[i];
                kilonovaPos[i * 3] = vel.x * ejectaPhase * 80;
                kilonovaPos[i * 3 + 1] = vel.y * ejectaPhase * 80;
                kilonovaPos[i * 3 + 2] = vel.z * ejectaPhase * 80;
            }
            kilonovaPoints.geometry.attributes.position.needsUpdate = true;
            kilonovaMaterial.opacity = 0.8 * (1 - ejectaPhase * 0.5);
        } else {
            kilonovaMaterial.opacity = 0;
        }
        
        // Merger flash
        if (phase > 0.65 && phase < 0.75) {
            const flashPhase = (phase - 0.65) / 0.1;
            flashMaterial.opacity = Math.sin(flashPhase * Math.PI) * 0.8;
            flash.scale.setScalar(1 + flashPhase * 2);
        } else {
            flashMaterial.opacity = 0;
            flash.scale.setScalar(1);
        }
        
        // Gamma-ray burst jets (appear after merger)
        if (phase > 0.7 && phase < 0.95) {
            const jetPhase = (phase - 0.7) / 0.25;
            jetUp.material.opacity = 0.6 * Math.sin(jetPhase * Math.PI);
            jetDown.material.opacity = 0.6 * Math.sin(jetPhase * Math.PI);
            jetUp.scale.y = 1 + jetPhase;
            jetDown.scale.y = 1 + jetPhase;
        } else {
            jetUp.material.opacity = 0;
            jetDown.material.opacity = 0;
        }
        
        // Pulsing star glow
        const pulse = 0.8 + Math.sin(time * 8) * 0.2;
        light1.intensity = 2 * pulse;
        light2.intensity = 2 * pulse;
    };
    
    return { group };
}
