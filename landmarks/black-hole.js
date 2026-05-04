// Black Hole with Accretion Disk - by Claude Opus 4.5
// A dark sphere surrounded by a swirling orange-yellow accretion disk

export function createBlackHole(THREE) {
    const group = new THREE.Group();
    
    // Event horizon - dark sphere
    const eventHorizonGeo = new THREE.SphereGeometry(15, 32, 32);
    const eventHorizonMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.95
    });
    const eventHorizon = new THREE.Mesh(eventHorizonGeo, eventHorizonMat);
    group.add(eventHorizon);
    
    // Photon sphere - thin glowing ring at the edge
    const photonSphereGeo = new THREE.TorusGeometry(16, 0.3, 16, 64);
    const photonSphereMat = new THREE.MeshBasicMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.8
    });
    const photonSphere = new THREE.Mesh(photonSphereGeo, photonSphereMat);
    photonSphere.rotation.x = Math.PI / 2;
    group.add(photonSphere);
    
    // Accretion disk - multiple layered rings
    const diskColors = [0xff6600, 0xffaa00, 0xffdd00, 0xff4400, 0xff8800];
    const accretionRings = [];
    
    for (let i = 0; i < 5; i++) {
        const innerRadius = 20 + i * 6;
        const outerRadius = innerRadius + 5;
        const diskGeo = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const diskMat = new THREE.MeshBasicMaterial({
            color: diskColors[i],
            transparent: true,
            opacity: 0.6 - i * 0.08,
            side: THREE.DoubleSide
        });
        const disk = new THREE.Mesh(diskGeo, diskMat);
        disk.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.1;
        accretionRings.push(disk);
        group.add(disk);
    }
    
    // Accretion disk particles - swirling matter
    const particleCount = 400;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleData = [];
    
    for (let i = 0; i < particleCount; i++) {
        const radius = 18 + Math.random() * 35;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 4;
        
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
        
        // Orange-yellow color gradient
        const colorMix = Math.random();
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.4 + colorMix * 0.4;
        colors[i * 3 + 2] = colorMix * 0.2;
        
        particleData.push({
            radius,
            angle,
            height,
            speed: 0.5 + (50 / radius) // Faster closer to center (Kepler)
        });
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const particleMat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);
    
    // Relativistic jets - twin beams shooting from poles
    const jetGeo = new THREE.ConeGeometry(3, 60, 16);
    const jetMat = new THREE.MeshBasicMaterial({
        color: 0x8888ff,
        transparent: true,
        opacity: 0.4
    });
    
    const jetTop = new THREE.Mesh(jetGeo, jetMat);
    jetTop.position.y = 35;
    group.add(jetTop);
    
    const jetBottom = new THREE.Mesh(jetGeo, jetMat);
    jetBottom.position.y = -35;
    jetBottom.rotation.x = Math.PI;
    group.add(jetBottom);
    
    // Inner glow around event horizon
    const glowGeo = new THREE.SphereGeometry(17, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.2
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);
    
    // Point light for illumination
    const light = new THREE.PointLight(0xff6600, 1, 150);
    light.position.set(0, 0, 0);
    group.add(light);
    
    // Animation update function
    group.userData.update = function(time) {
        // Rotate accretion disk rings at different speeds
        accretionRings.forEach((ring, i) => {
            ring.rotation.z = time * (0.1 + i * 0.02);
        });
        
        // Animate particles orbiting the black hole
        const posArray = particleGeo.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            const data = particleData[i];
            data.angle += data.speed * 0.01;
            
            // Spiral inward slowly
            if (data.radius > 18) {
                data.radius -= 0.002;
            } else {
                // Reset particle to outer edge
                data.radius = 50 + Math.random() * 5;
                data.angle = Math.random() * Math.PI * 2;
            }
            
            posArray[i * 3] = Math.cos(data.angle) * data.radius;
            posArray[i * 3 + 1] = data.height * (1 - (50 - data.radius) / 50);
            posArray[i * 3 + 2] = Math.sin(data.angle) * data.radius;
        }
        particleGeo.attributes.position.needsUpdate = true;
        
        // Pulse the jets
        const jetPulse = 0.8 + Math.sin(time * 3) * 0.2;
        jetTop.scale.set(jetPulse, 1, jetPulse);
        jetBottom.scale.set(jetPulse, 1, jetPulse);
        
        // Rotate photon sphere
        photonSphere.rotation.z = time * 0.5;
        
        // Pulse glow
        glow.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    };
    
    return { group };
}
