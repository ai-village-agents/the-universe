// Protoplanetary Disk - A young star with planet-forming disk
// Shows dust lanes, planetesimals, and gaps where planets are forming

export function createProtoplanetaryDisk(THREE) {
    const group = new THREE.Group();
    
    // Young T-Tauri star (central protostar)
    const starGeometry = new THREE.SphereGeometry(12, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffdd88,
        transparent: true,
        opacity: 0.95
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);
    
    // Star glow
    const glowGeometry = new THREE.SphereGeometry(18, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Central point light
    const starLight = new THREE.PointLight(0xffdd88, 3, 200);
    group.add(starLight);
    
    // Disk rings (multiple concentric rings with gaps)
    const diskRings = [];
    const ringRadii = [25, 35, 50, 70, 95, 125]; // Gaps between
    const ringColors = [0xcc8866, 0xbb7755, 0xaa6644, 0x996633, 0x885522, 0x774411];
    
    for (let i = 0; i < ringRadii.length; i++) {
        const innerR = i === 0 ? 15 : ringRadii[i-1] + 5;
        const outerR = ringRadii[i];
        
        const ringGeometry = new THREE.RingGeometry(innerR, outerR, 64, 3);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: ringColors[i],
            transparent: true,
            opacity: 0.6 - i * 0.05,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.userData.baseY = 0;
        diskRings.push(ring);
        group.add(ring);
    }
    
    // Dust particles in disk
    const dustCount = 600;
    const dustGeometry = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    const dustData = [];
    
    for (let i = 0; i < dustCount; i++) {
        const radius = 20 + Math.random() * 110;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * (5 - radius * 0.02); // Thinner at edges
        
        dustPositions[i * 3] = Math.cos(angle) * radius;
        dustPositions[i * 3 + 1] = height;
        dustPositions[i * 3 + 2] = Math.sin(angle) * radius;
        
        dustData.push({ radius, angle, height, speed: 1 / Math.sqrt(radius) * 0.5 });
        
        // Reddish-brown dust colors
        dustColors[i * 3] = 0.7 + Math.random() * 0.3;
        dustColors[i * 3 + 1] = 0.4 + Math.random() * 0.2;
        dustColors[i * 3 + 2] = 0.2 + Math.random() * 0.1;
    }
    
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    
    const dustMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const dustPoints = new THREE.Points(dustGeometry, dustMaterial);
    group.add(dustPoints);
    
    // Planetesimals (larger rocky bodies forming planets)
    const planetesimals = [];
    const numPlanetesimals = 25;
    
    for (let i = 0; i < numPlanetesimals; i++) {
        const size = 1.5 + Math.random() * 2.5;
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.4, 0.3 + Math.random() * 0.2)
        });
        const planetesimal = new THREE.Mesh(geometry, material);
        
        const radius = 30 + Math.random() * 90;
        const angle = Math.random() * Math.PI * 2;
        planetesimal.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 3,
            Math.sin(angle) * radius
        );
        
        planetesimal.userData = {
            radius,
            angle,
            speed: 1 / Math.sqrt(radius) * 0.3,
            rotSpeed: (Math.random() - 0.5) * 2
        };
        
        planetesimals.push(planetesimal);
        group.add(planetesimal);
    }
    
    // Proto-planets (3 larger bodies in gaps)
    const protoplanets = [];
    const protoPositions = [
        { radius: 42, size: 5, color: 0x884422 },   // Rocky
        { radius: 82, size: 7, color: 0x668888 },   // Icy
        { radius: 110, size: 9, color: 0x886644 }   // Gas giant forming
    ];
    
    for (const pp of protoPositions) {
        const geometry = new THREE.SphereGeometry(pp.size, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: pp.color,
            transparent: true,
            opacity: 0.9
        });
        const protoplanet = new THREE.Mesh(geometry, material);
        
        const angle = Math.random() * Math.PI * 2;
        protoplanet.position.set(
            Math.cos(angle) * pp.radius,
            0,
            Math.sin(angle) * pp.radius
        );
        
        // Add accretion glow
        const accreteGlow = new THREE.Mesh(
            new THREE.SphereGeometry(pp.size * 1.5, 12, 12),
            new THREE.MeshBasicMaterial({
                color: 0xffaa66,
                transparent: true,
                opacity: 0.2
            })
        );
        protoplanet.add(accreteGlow);
        
        protoplanet.userData = {
            radius: pp.radius,
            angle,
            speed: 1 / Math.sqrt(pp.radius) * 0.2,
            accreteGlow
        };
        
        protoplanets.push(protoplanet);
        group.add(protoplanet);
    }
    
    // Bipolar jets from young star
    const jetGeometry = new THREE.ConeGeometry(4, 50, 12, 1, true);
    const jetMaterial = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    
    const jetUp = new THREE.Mesh(jetGeometry, jetMaterial.clone());
    const jetDown = new THREE.Mesh(jetGeometry, jetMaterial.clone());
    jetUp.position.y = 35;
    jetDown.position.y = -35;
    jetDown.rotation.z = Math.PI;
    group.add(jetUp, jetDown);
    
    // Jet particles
    const jetParticleCount = 150;
    const jetParticleGeom = new THREE.BufferGeometry();
    const jetParticlePos = new Float32Array(jetParticleCount * 3);
    const jetParticleData = [];
    
    for (let i = 0; i < jetParticleCount; i++) {
        const upward = i < jetParticleCount / 2;
        jetParticlePos[i * 3] = (Math.random() - 0.5) * 8;
        jetParticlePos[i * 3 + 1] = upward ? Math.random() * 60 + 10 : -(Math.random() * 60 + 10);
        jetParticlePos[i * 3 + 2] = (Math.random() - 0.5) * 8;
        
        jetParticleData.push({
            speed: 0.5 + Math.random() * 0.5,
            upward,
            offset: Math.random() * 60
        });
    }
    
    jetParticleGeom.setAttribute('position', new THREE.BufferAttribute(jetParticlePos, 3));
    const jetParticleMat = new THREE.PointsMaterial({
        size: 2,
        color: 0x88ccff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const jetParticles = new THREE.Points(jetParticleGeom, jetParticleMat);
    group.add(jetParticles);
    
    // Slight tilt to the disk for visual interest
    group.rotation.x = Math.PI * 0.1;
    group.rotation.z = Math.PI * 0.05;
    
    group.userData.update = function(time) {
        // Rotate dust particles in Keplerian orbits
        const dustPos = dustPoints.geometry.attributes.position.array;
        for (let i = 0; i < dustCount; i++) {
            const d = dustData[i];
            d.angle += d.speed * 0.02;
            dustPos[i * 3] = Math.cos(d.angle) * d.radius;
            dustPos[i * 3 + 2] = Math.sin(d.angle) * d.radius;
        }
        dustPoints.geometry.attributes.position.needsUpdate = true;
        
        // Rotate planetesimals
        for (const p of planetesimals) {
            p.userData.angle += p.userData.speed * 0.02;
            p.position.x = Math.cos(p.userData.angle) * p.userData.radius;
            p.position.z = Math.sin(p.userData.angle) * p.userData.radius;
            p.rotation.x += p.userData.rotSpeed * 0.01;
            p.rotation.y += p.userData.rotSpeed * 0.015;
        }
        
        // Rotate protoplanets with pulsing accretion glow
        for (const pp of protoplanets) {
            pp.userData.angle += pp.userData.speed * 0.02;
            pp.position.x = Math.cos(pp.userData.angle) * pp.userData.radius;
            pp.position.z = Math.sin(pp.userData.angle) * pp.userData.radius;
            pp.userData.accreteGlow.material.opacity = 0.15 + Math.sin(time * 3 + pp.userData.radius) * 0.1;
        }
        
        // Animate jet particles
        const jetPos = jetParticles.geometry.attributes.position.array;
        for (let i = 0; i < jetParticleCount; i++) {
            const jp = jetParticleData[i];
            const y = ((time * jp.speed * 30 + jp.offset) % 60) + 10;
            jetPos[i * 3 + 1] = jp.upward ? y : -y;
        }
        jetParticles.geometry.attributes.position.needsUpdate = true;
        
        // Pulse jets
        const jetPulse = 0.3 + Math.sin(time * 2) * 0.1;
        jetUp.material.opacity = jetPulse;
        jetDown.material.opacity = jetPulse;
        
        // Star pulsation
        const starPulse = 1 + Math.sin(time * 1.5) * 0.05;
        star.scale.setScalar(starPulse);
        starLight.intensity = 2.5 + Math.sin(time * 1.5) * 0.5;
        
        // Subtle disk wobble
        for (let i = 0; i < diskRings.length; i++) {
            diskRings[i].rotation.z = Math.sin(time * 0.5 + i * 0.3) * 0.02;
        }
    };
    
    return { group };
}
