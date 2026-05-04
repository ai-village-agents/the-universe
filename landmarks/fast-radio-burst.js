// Fast Radio Burst Source - mysterious millisecond burst of radio energy
// Created by Claude Opus 4.5 for the AI Village Universe

export function createFastRadioBurst(THREE) {
    const group = new THREE.Group();
    
    // FRB source - likely a magnetar or neutron star
    const sourceGeometry = new THREE.SphereGeometry(3, 32, 32);
    const sourceMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.9
    });
    const source = new THREE.Mesh(sourceGeometry, sourceMaterial);
    group.add(source);
    
    // Intense magnetic field lines around source
    const fieldLines = [];
    for (let i = 0; i < 8; i++) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -8, 0),
            new THREE.Vector3(Math.cos(i * Math.PI / 4) * 6, -4, Math.sin(i * Math.PI / 4) * 6),
            new THREE.Vector3(Math.cos(i * Math.PI / 4) * 8, 0, Math.sin(i * Math.PI / 4) * 8),
            new THREE.Vector3(Math.cos(i * Math.PI / 4) * 6, 4, Math.sin(i * Math.PI / 4) * 6),
            new THREE.Vector3(0, 8, 0)
        ]);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x6699ff,
            transparent: true,
            opacity: 0.4
        });
        const fieldLine = new THREE.Mesh(tubeGeometry, tubeMaterial);
        group.add(fieldLine);
        fieldLines.push({ mesh: fieldLine, material: tubeMaterial, phase: i * Math.PI / 4 });
    }
    
    // Burst cone - the actual radio burst emission
    const burstConeGeometry = new THREE.ConeGeometry(15, 40, 16, 1, true);
    const burstConeMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
    });
    const burstCone = new THREE.Mesh(burstConeGeometry, burstConeMaterial);
    burstCone.position.set(0, 20, 0);
    group.add(burstCone);
    
    // Second burst cone opposite direction
    const burstCone2 = new THREE.Mesh(burstConeGeometry.clone(), burstConeMaterial.clone());
    burstCone2.position.set(0, -20, 0);
    burstCone2.rotation.x = Math.PI;
    group.add(burstCone2);
    
    // Radio wave rings expanding from source during burst
    const radioWaves = [];
    for (let i = 0; i < 6; i++) {
        const ringGeometry = new THREE.RingGeometry(2, 3, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.0,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        radioWaves.push({ 
            mesh: ring, 
            material: ringMaterial, 
            delay: i * 0.1,
            baseScale: 1 + i * 5
        });
    }
    
    // Energy particles accumulating before burst
    const particles = [];
    for (let i = 0; i < 40; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 5 + Math.random() * 3;
        particle.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
        group.add(particle);
        particles.push({
            mesh: particle,
            material: particleMaterial,
            theta: theta,
            phi: phi,
            radius: radius,
            speed: 0.3 + Math.random() * 0.5
        });
    }
    
    // Dispersion trails showing frequency-dependent arrival
    const dispersionTrails = [];
    const trailColors = [0xff0000, 0xffaa00, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];
    for (let i = 0; i < 6; i++) {
        const trailGeometry = new THREE.BoxGeometry(0.5, 0.5, 15 + i * 3);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: trailColors[i],
            transparent: true,
            opacity: 0.0
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.position.set(i * 2 - 5, 35 + i * 2, 0);
        group.add(trail);
        dispersionTrails.push({ mesh: trail, material: trailMaterial, index: i });
    }
    
    // Burst state tracking
    let burstTime = 0;
    let isBursting = false;
    let burstCooldown = 0;
    const BURST_INTERVAL = 8; // Seconds between bursts
    const BURST_DURATION = 0.5; // Millisecond burst (scaled for visibility)
    
    group.userData.update = function(time) {
        // Rotate source slowly
        source.rotation.y = time * 0.5;
        
        // Pulse magnetic field lines
        fieldLines.forEach((line, i) => {
            line.material.opacity = 0.3 + 0.2 * Math.sin(time * 2 + line.phase);
        });
        
        // Manage burst cycle
        burstCooldown += 0.016;
        if (burstCooldown > BURST_INTERVAL && !isBursting) {
            isBursting = true;
            burstTime = 0;
        }
        
        if (isBursting) {
            burstTime += 0.016;
            const burstProgress = burstTime / BURST_DURATION;
            
            // Intense flash during burst
            source.material.color.setHex(0xffffff);
            sourceMaterial.opacity = 1.0;
            
            // Burst cones flash
            const coneOpacity = Math.max(0, 1 - burstProgress * 2);
            burstConeMaterial.opacity = coneOpacity * 0.8;
            burstCone2.material.opacity = coneOpacity * 0.8;
            
            // Radio waves expand
            radioWaves.forEach((wave, i) => {
                const waveProgress = Math.max(0, burstProgress - wave.delay);
                if (waveProgress > 0 && waveProgress < 1) {
                    const scale = wave.baseScale + waveProgress * 30;
                    wave.mesh.scale.set(scale, scale, scale);
                    wave.material.opacity = 0.6 * (1 - waveProgress);
                } else {
                    wave.material.opacity = 0;
                }
            });
            
            // Dispersion trails appear (lower frequencies arrive later)
            dispersionTrails.forEach((trail, i) => {
                const trailDelay = i * 0.05;
                const trailProgress = Math.max(0, burstProgress - trailDelay);
                if (trailProgress > 0 && trailProgress < 1) {
                    trail.material.opacity = 0.7 * (1 - trailProgress);
                    trail.mesh.position.y = 35 + i * 2 + trailProgress * 20;
                } else {
                    trail.material.opacity = 0;
                }
            });
            
            if (burstTime > BURST_DURATION + 0.5) {
                isBursting = false;
                burstCooldown = 0;
                source.material.color.setHex(0x4488ff);
                sourceMaterial.opacity = 0.9;
            }
        } else {
            // Quiet phase - particles orbit and accumulate
            particles.forEach(p => {
                p.theta += 0.02 * p.speed;
                const radius = p.radius + Math.sin(time * p.speed) * 0.5;
                p.mesh.position.set(
                    radius * Math.sin(p.phi) * Math.cos(p.theta),
                    radius * Math.cos(p.phi),
                    radius * Math.sin(p.phi) * Math.sin(p.theta)
                );
                // Brighten as approaching next burst
                const burstApproach = burstCooldown / BURST_INTERVAL;
                p.material.opacity = 0.3 + 0.5 * burstApproach;
            });
            
            // Reset wave visuals
            radioWaves.forEach(wave => {
                wave.material.opacity = 0;
            });
            dispersionTrails.forEach(trail => {
                trail.material.opacity = 0;
            });
        }
        
        // Slow rotation of entire structure
        group.rotation.y = time * 0.1;
    };
    
    return { group };
}
