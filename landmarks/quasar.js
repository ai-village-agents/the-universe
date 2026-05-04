// Quasar - Active Galactic Nucleus
// Created by Claude Opus 4.5 on Day 398
// A supermassive black hole actively feeding, producing intense jets
// Position: (600, 200, 400)

export function createQuasar(THREE) {
    const group = new THREE.Group();
    
    // Central supermassive black hole core (event horizon)
    const coreGeo = new THREE.SphereGeometry(8, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    
    // Intensely bright accretion disk - multi-layered
    const diskColors = [0xffffff, 0xffffaa, 0xffdd55, 0xffaa00, 0xff6600];
    const diskLayers = [];
    for (let i = 0; i < 5; i++) {
        const innerR = 10 + i * 4;
        const outerR = 14 + i * 4;
        const diskGeo = new THREE.RingGeometry(innerR, outerR, 64);
        const diskMat = new THREE.MeshBasicMaterial({
            color: diskColors[i],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9 - i * 0.1
        });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.rotation.x = Math.PI / 2;
        group.add(disk);
        diskLayers.push(disk);
    }
    
    // Intense central glow (the brightest point in the universe!)
    const glowGeo = new THREE.SphereGeometry(15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);
    
    // Outer halo - the quasar's characteristic brilliance
    const haloGeo = new THREE.SphereGeometry(40, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.15
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    group.add(halo);
    
    // Twin relativistic jets - extremely powerful and long
    const jetLength = 150;
    const jetRadius = 6;
    const jetGeo = new THREE.CylinderGeometry(jetRadius * 0.3, jetRadius, jetLength, 16);
    const jetMat = new THREE.MeshBasicMaterial({
        color: 0x00ccff,
        transparent: true,
        opacity: 0.8
    });
    
    // Top jet
    const jetTop = new THREE.Mesh(jetGeo, jetMat);
    jetTop.position.y = jetLength / 2 + 8;
    group.add(jetTop);
    
    // Bottom jet
    const jetBottom = new THREE.Mesh(jetGeo, jetMat);
    jetBottom.position.y = -(jetLength / 2 + 8);
    jetBottom.rotation.z = Math.PI;
    group.add(jetBottom);
    
    // Jet glow cones
    const jetGlowGeo = new THREE.ConeGeometry(jetRadius * 1.5, jetLength * 0.8, 16);
    const jetGlowMat = new THREE.MeshBasicMaterial({
        color: 0x66ddff,
        transparent: true,
        opacity: 0.3
    });
    
    const jetGlowTop = new THREE.Mesh(jetGlowGeo, jetGlowMat);
    jetGlowTop.position.y = jetLength / 2;
    group.add(jetGlowTop);
    
    const jetGlowBottom = new THREE.Mesh(jetGlowGeo, jetGlowMat);
    jetGlowBottom.position.y = -jetLength / 2;
    jetGlowBottom.rotation.z = Math.PI;
    group.add(jetGlowBottom);
    
    // Accretion disk particles - hot matter spiraling in
    const diskParticleCount = 500;
    const diskParticleGeo = new THREE.BufferGeometry();
    const diskParticlePositions = new Float32Array(diskParticleCount * 3);
    const diskParticleColors = new Float32Array(diskParticleCount * 3);
    
    for (let i = 0; i < diskParticleCount; i++) {
        const r = 12 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        diskParticlePositions[i * 3] = Math.cos(theta) * r;
        diskParticlePositions[i * 3 + 1] = (Math.random() - 0.5) * 3;
        diskParticlePositions[i * 3 + 2] = Math.sin(theta) * r;
        
        // Colors from white to orange based on distance
        const temp = 1 - (r - 12) / 25;
        diskParticleColors[i * 3] = 1;
        diskParticleColors[i * 3 + 1] = 0.7 + temp * 0.3;
        diskParticleColors[i * 3 + 2] = temp * 0.5;
    }
    
    diskParticleGeo.setAttribute('position', new THREE.BufferAttribute(diskParticlePositions, 3));
    diskParticleGeo.setAttribute('color', new THREE.BufferAttribute(diskParticleColors, 3));
    
    const diskParticleMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.9
    });
    const diskParticles = new THREE.Points(diskParticleGeo, diskParticleMat);
    group.add(diskParticles);
    
    // Jet particles - matter being ejected at relativistic speeds
    const jetParticleCount = 300;
    const jetParticleGeo = new THREE.BufferGeometry();
    const jetParticlePositions = new Float32Array(jetParticleCount * 3);
    
    for (let i = 0; i < jetParticleCount; i++) {
        const side = i < jetParticleCount / 2 ? 1 : -1;
        const dist = Math.random() * jetLength;
        const spread = (dist / jetLength) * jetRadius * 0.5;
        jetParticlePositions[i * 3] = (Math.random() - 0.5) * spread;
        jetParticlePositions[i * 3 + 1] = side * (8 + dist);
        jetParticlePositions[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    
    jetParticleGeo.setAttribute('position', new THREE.BufferAttribute(jetParticlePositions, 3));
    
    const jetParticleMat = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 1.2,
        transparent: true,
        opacity: 0.8
    });
    const jetParticles = new THREE.Points(jetParticleGeo, jetParticleMat);
    group.add(jetParticles);
    
    // Broad emission lines (characteristic of quasars) - expanding shells
    const shellCount = 3;
    const shells = [];
    for (let i = 0; i < shellCount; i++) {
        const shellGeo = new THREE.SphereGeometry(50 + i * 20, 32, 16);
        const shellMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.05,
            wireframe: true
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        group.add(shell);
        shells.push(shell);
    }
    
    // Intense point light - quasars are the brightest objects!
    const light = new THREE.PointLight(0xffffdd, 3, 500);
    group.add(light);
    
    // Store references for animation
    group.userData.diskLayers = diskLayers;
    group.userData.diskParticles = diskParticles;
    group.userData.jetParticles = jetParticles;
    group.userData.shells = shells;
    group.userData.glow = glow;
    group.userData.halo = halo;
    group.userData.jetTop = jetTop;
    group.userData.jetBottom = jetBottom;
    group.userData.light = light;
    
    // Animation update function
    group.userData.update = function(time) {
        // Rotate accretion disk at different speeds (Keplerian)
        this.diskLayers.forEach((disk, i) => {
            disk.rotation.z = time * (0.8 - i * 0.1);
        });
        
        // Disk particle orbital motion
        const diskPos = this.diskParticles.geometry.attributes.position.array;
        for (let i = 0; i < diskPos.length / 3; i++) {
            const x = diskPos[i * 3];
            const z = diskPos[i * 3 + 2];
            const r = Math.sqrt(x * x + z * z);
            const theta = Math.atan2(z, x);
            const speed = 1.5 / Math.sqrt(r); // Keplerian
            const newTheta = theta + speed * 0.016;
            diskPos[i * 3] = Math.cos(newTheta) * r;
            diskPos[i * 3 + 2] = Math.sin(newTheta) * r;
        }
        this.diskParticles.geometry.attributes.position.needsUpdate = true;
        
        // Jet particle motion - ejecting outward
        const jetPos = this.jetParticles.geometry.attributes.position.array;
        for (let i = 0; i < jetPos.length / 3; i++) {
            const y = jetPos[i * 3 + 1];
            const side = y > 0 ? 1 : -1;
            jetPos[i * 3 + 1] += side * 2;
            if (Math.abs(jetPos[i * 3 + 1]) > 160) {
                jetPos[i * 3 + 1] = side * 8;
            }
        }
        this.jetParticles.geometry.attributes.position.needsUpdate = true;
        
        // Pulsating glow
        const pulse = 0.6 + Math.sin(time * 3) * 0.15;
        this.glow.material.opacity = pulse;
        this.halo.material.opacity = 0.1 + Math.sin(time * 2) * 0.05;
        
        // Light intensity variation (quasar variability)
        this.light.intensity = 2.5 + Math.sin(time * 1.5) * 0.5;
        
        // Shell expansion animation
        this.shells.forEach((shell, i) => {
            const phase = (time * 0.3 + i * 0.5) % 3;
            const scale = 1 + phase * 0.3;
            shell.scale.setScalar(scale);
            shell.material.opacity = 0.08 * (1 - phase / 3);
        });
        
        // Subtle jet wobble (precession)
        const wobble = Math.sin(time * 0.5) * 0.05;
        this.jetTop.rotation.x = wobble;
        this.jetBottom.rotation.x = -wobble;
    };
    
    return { group };
}
