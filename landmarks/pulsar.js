// Pulsar - Rapidly rotating neutron star with sweeping light beams
// Created by Claude Opus 4.5 - Day 398

export function createPulsar(THREE) {
    const group = new THREE.Group();
    
    // Neutron star core - dense, hot blue-white sphere
    const coreGeometry = new THREE.SphereGeometry(8, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.95
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Outer glow layer
    const glowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6699ff,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Magnetic field lines (toroidal)
    const fieldParticles = new THREE.BufferGeometry();
    const fieldCount = 300;
    const fieldPositions = new Float32Array(fieldCount * 3);
    const fieldColors = new Float32Array(fieldCount * 3);
    
    for (let i = 0; i < fieldCount; i++) {
        const theta = (i / fieldCount) * Math.PI * 4;
        const r = 15 + Math.sin(theta * 2) * 8;
        fieldPositions[i * 3] = Math.cos(theta) * r;
        fieldPositions[i * 3 + 1] = Math.sin(theta * 3) * 5;
        fieldPositions[i * 3 + 2] = Math.sin(theta) * r;
        
        // Blue-cyan colors for magnetic field
        fieldColors[i * 3] = 0.3;
        fieldColors[i * 3 + 1] = 0.6 + Math.random() * 0.4;
        fieldColors[i * 3 + 2] = 1.0;
    }
    
    fieldParticles.setAttribute('position', new THREE.BufferAttribute(fieldPositions, 3));
    fieldParticles.setAttribute('color', new THREE.BufferAttribute(fieldColors, 3));
    
    const fieldMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const fieldPoints = new THREE.Points(fieldParticles, fieldMaterial);
    group.add(fieldPoints);
    
    // Twin emission beams (the lighthouse effect)
    const beamGroup = new THREE.Group();
    
    // Beam 1 - pointing up
    const beam1Geometry = new THREE.ConeGeometry(3, 80, 16, 1, true);
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const beam1 = new THREE.Mesh(beam1Geometry, beamMaterial);
    beam1.position.y = 40;
    beamGroup.add(beam1);
    
    // Beam 2 - pointing down
    const beam2 = new THREE.Mesh(beam1Geometry, beamMaterial.clone());
    beam2.position.y = -40;
    beam2.rotation.x = Math.PI;
    beamGroup.add(beam2);
    
    // Inner bright beam cores
    const innerBeamGeometry = new THREE.ConeGeometry(1, 70, 8, 1, true);
    const innerBeamMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const innerBeam1 = new THREE.Mesh(innerBeamGeometry, innerBeamMaterial);
    innerBeam1.position.y = 35;
    beamGroup.add(innerBeam1);
    
    const innerBeam2 = new THREE.Mesh(innerBeamGeometry, innerBeamMaterial.clone());
    innerBeam2.position.y = -35;
    innerBeam2.rotation.x = Math.PI;
    beamGroup.add(innerBeam2);
    
    // Tilt the beam axis (pulsars often have misaligned magnetic/rotation axes)
    beamGroup.rotation.z = Math.PI / 6; // 30 degree tilt
    group.add(beamGroup);
    
    // Radiation particles ejected along beams
    const radiationGeometry = new THREE.BufferGeometry();
    const radiationCount = 200;
    const radiationPositions = new Float32Array(radiationCount * 3);
    const radiationVelocities = [];
    
    for (let i = 0; i < radiationCount; i++) {
        const direction = i < radiationCount / 2 ? 1 : -1;
        const dist = Math.random() * 60;
        const spread = Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        
        radiationPositions[i * 3] = Math.cos(angle) * spread;
        radiationPositions[i * 3 + 1] = direction * dist;
        radiationPositions[i * 3 + 2] = Math.sin(angle) * spread;
        
        radiationVelocities.push({
            speed: 0.5 + Math.random() * 0.5,
            direction: direction,
            angle: angle,
            maxDist: 60 + Math.random() * 20
        });
    }
    
    radiationGeometry.setAttribute('position', new THREE.BufferAttribute(radiationPositions, 3));
    
    const radiationMaterial = new THREE.PointsMaterial({
        size: 2,
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const radiationPoints = new THREE.Points(radiationGeometry, radiationMaterial);
    beamGroup.add(radiationPoints);
    
    // Surface hotspots (polar caps)
    const hotspotGeometry = new THREE.CircleGeometry(4, 16);
    const hotspotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    const hotspot1 = new THREE.Mesh(hotspotGeometry, hotspotMaterial);
    hotspot1.position.y = 7.5;
    hotspot1.rotation.x = -Math.PI / 2;
    group.add(hotspot1);
    
    const hotspot2 = new THREE.Mesh(hotspotGeometry, hotspotMaterial.clone());
    hotspot2.position.y = -7.5;
    hotspot2.rotation.x = Math.PI / 2;
    group.add(hotspot2);
    
    // Point light at core
    const coreLight = new THREE.PointLight(0x66ccff, 2, 100);
    group.add(coreLight);
    
    // Animation update function
    group.userData.update = function(time) {
        // Rapid rotation (pulsars spin fast!)
        const rotationSpeed = 3; // Fast spin
        beamGroup.rotation.y = time * rotationSpeed;
        core.rotation.y = time * rotationSpeed * 0.5;
        
        // Pulsing glow
        const pulse = 0.3 + Math.sin(time * 10) * 0.1;
        glowMaterial.opacity = pulse;
        coreLight.intensity = 1.5 + Math.sin(time * 10) * 0.5;
        
        // Magnetic field rotation
        fieldPoints.rotation.y = time * 0.3;
        fieldPoints.rotation.x = Math.sin(time * 0.2) * 0.1;
        
        // Update radiation particles
        const radPositions = radiationGeometry.attributes.position.array;
        for (let i = 0; i < radiationCount; i++) {
            const vel = radiationVelocities[i];
            radPositions[i * 3 + 1] += vel.speed * vel.direction;
            
            // Reset when too far
            if (Math.abs(radPositions[i * 3 + 1]) > vel.maxDist) {
                const spread = Math.random() * 3;
                radPositions[i * 3] = Math.cos(vel.angle) * spread;
                radPositions[i * 3 + 1] = vel.direction * 5;
                radPositions[i * 3 + 2] = Math.sin(vel.angle) * spread;
            }
        }
        radiationGeometry.attributes.position.needsUpdate = true;
        
        // Hotspot flicker
        hotspotMaterial.opacity = 0.7 + Math.sin(time * 20) * 0.3;
    };
    
    return { group };
}
