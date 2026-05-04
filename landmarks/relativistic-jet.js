// Relativistic Jet - Spectacular particle beams from a central black hole
// Created by Claude Opus 4.5 - Day 398

export function createRelativisticJet(THREE) {
    const group = new THREE.Group();
    
    // Central compact object (black hole)
    const coreGeo = new THREE.SphereGeometry(8, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    
    // Event horizon glow
    const horizonGeo = new THREE.RingGeometry(8, 12, 64);
    const horizonMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    const horizon = new THREE.Mesh(horizonGeo, horizonMat);
    horizon.rotation.x = Math.PI / 2;
    group.add(horizon);
    
    // Accretion disk
    const diskGeo = new THREE.RingGeometry(12, 35, 64);
    const diskMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);
    
    // Create jet beams (top and bottom)
    const jetParticles = [];
    const jetColors = [0x00ccff, 0x0088ff, 0x00ffff, 0xffffff];
    
    for (let j = 0; j < 2; j++) {
        const direction = j === 0 ? 1 : -1;
        
        // Jet cone
        const coneGeo = new THREE.ConeGeometry(5, 80, 16, 1, true);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const cone = new THREE.Mesh(coneGeo, coneMat);
        cone.position.y = direction * 50;
        cone.rotation.x = direction > 0 ? 0 : Math.PI;
        group.add(cone);
        
        // Jet particles
        for (let i = 0; i < 60; i++) {
            const pGeo = new THREE.SphereGeometry(0.5 + Math.random() * 1, 8, 8);
            const pMat = new THREE.MeshBasicMaterial({
                color: jetColors[Math.floor(Math.random() * jetColors.length)],
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(pGeo, pMat);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 4;
            const height = Math.random() * 100;
            
            particle.position.x = Math.cos(angle) * radius * (height / 100);
            particle.position.z = Math.sin(angle) * radius * (height / 100);
            particle.position.y = direction * (10 + height);
            
            particle.userData = {
                direction: direction,
                speed: 0.5 + Math.random() * 1.5,
                angle: angle,
                baseRadius: radius
            };
            
            jetParticles.push(particle);
            group.add(particle);
        }
    }
    
    // Shockwaves at jet termination
    const shockwaves = [];
    for (let j = 0; j < 2; j++) {
        const direction = j === 0 ? 1 : -1;
        const shockGeo = new THREE.RingGeometry(8, 15, 32);
        const shockMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        const shock = new THREE.Mesh(shockGeo, shockMat);
        shock.position.y = direction * 110;
        shock.rotation.x = Math.PI / 2;
        shockwaves.push(shock);
        group.add(shock);
    }
    
    // Central glow
    const glowGeo = new THREE.SphereGeometry(15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);
    
    group.userData.update = function(time) {
        // Rotate accretion disk
        disk.rotation.z = time * 0.3;
        horizon.rotation.z = -time * 0.5;
        
        // Animate jet particles
        jetParticles.forEach(p => {
            p.position.y += p.userData.direction * p.userData.speed;
            
            // Reset when too far
            if (Math.abs(p.position.y) > 120) {
                p.position.y = p.userData.direction * 10;
            }
            
            // Spiral motion
            const t = time + p.userData.angle;
            const heightRatio = Math.abs(p.position.y) / 120;
            p.position.x = Math.cos(t * 2) * p.userData.baseRadius * (1 + heightRatio);
            p.position.z = Math.sin(t * 2) * p.userData.baseRadius * (1 + heightRatio);
        });
        
        // Pulse shockwaves
        shockwaves.forEach((s, i) => {
            const pulse = 1 + 0.3 * Math.sin(time * 2 + i * Math.PI);
            s.scale.set(pulse, pulse, 1);
            s.material.opacity = 0.3 + 0.2 * Math.sin(time * 3 + i * Math.PI);
        });
        
        // Pulse glow
        glow.scale.setScalar(1 + 0.1 * Math.sin(time * 2));
        glow.material.opacity = 0.15 + 0.1 * Math.sin(time * 1.5);
    };
    
    return { group };
}
