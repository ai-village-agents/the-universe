// Automation Observatory landmark - Claude Haiku 4.5
// An automated observation dome with scanning sensors, rotating mechanisms, and data streams

export function createAutomationObservatoryLandmark(THREE, world) {
    const group = new THREE.Group();
    const color = new THREE.Color(world.color || "#66aaff");

    // Main observatory dome - half sphere
    const domeGeometry = new THREE.SphereGeometry(12, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMaterial = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.y = 0;
    group.add(dome);

    // Dome wireframe overlay for tech look
    const wireGeometry = new THREE.SphereGeometry(12.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const wireMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        wireframe: true,
        transparent: true, 
        opacity: 0.4
    });
    const wireframe = new THREE.Mesh(wireGeometry, wireMaterial);
    group.add(wireframe);

    // Central telescope/scanner tower
    const towerGeometry = new THREE.CylinderGeometry(1.5, 2.5, 18, 8);
    const towerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x4488cc, 
        transparent: true, 
        opacity: 0.9 
    });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 9;
    group.add(tower);

    // Scanning dish at top
    const dishGeometry = new THREE.ConeGeometry(5, 3, 16, 1, true);
    const dishMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x88ccff, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.position.y = 20;
    dish.rotation.x = Math.PI;
    group.add(dish);

    // Rotating automation rings - gears/mechanisms
    const rings = [];
    for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.TorusGeometry(6 + i * 3, 0.3, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: i === 1 ? 0xffaa44 : 0x66aaff, 
            transparent: true, 
            opacity: 0.7 
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = 3 + i * 4;
        ring.rotation.x = Math.PI / 2 + (i * 0.2);
        ring.userData.speed = (0.5 - i * 0.1) * (i % 2 === 0 ? 1 : -1);
        rings.push(ring);
        group.add(ring);
    }

    // Floating data pages/panels orbiting the dome
    const pages = [];
    const pageGeometry = new THREE.PlaneGeometry(3, 4);
    const pageMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.8,
        side: THREE.DoubleSide
    });
    
    for (let i = 0; i < 16; i++) {
        const page = new THREE.Mesh(pageGeometry, pageMaterial);
        const angle = (i / 16) * Math.PI * 2;
        const radius = 18 + Math.sin(i * 0.7) * 3;
        const height = 8 + (i % 4) * 4;
        page.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        page.userData.baseAngle = angle;
        page.userData.radius = radius;
        page.userData.height = height;
        pages.push(page);
        group.add(page);
    }

    // Scanning beams emanating from dish
    const beams = [];
    const beamMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x66ffaa, 
        transparent: true, 
        opacity: 0.3 
    });
    
    for (let i = 0; i < 6; i++) {
        const beamGeometry = new THREE.CylinderGeometry(0.1, 2, 30, 6);
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        const angle = (i / 6) * Math.PI * 2;
        beam.position.set(0, 20, 0);
        beam.userData.baseAngle = angle;
        beams.push(beam);
        group.add(beam);
    }

    // Data stream particles flowing upward
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 3 + Math.random() * 10;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = Math.random() * 25;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ 
        color: 0x88ddff, 
        size: 0.4, 
        transparent: true, 
        opacity: 0.8 
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    // Binary data stream particles (smaller, faster)
    const binaryCount = 100;
    const binaryGeometry = new THREE.BufferGeometry();
    const binaryPositions = new Float32Array(binaryCount * 3);
    
    for (let i = 0; i < binaryCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 5;
        binaryPositions[i * 3] = Math.cos(angle) * radius;
        binaryPositions[i * 3 + 1] = Math.random() * 30 + 18;
        binaryPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    binaryGeometry.setAttribute('position', new THREE.BufferAttribute(binaryPositions, 3));
    const binaryMaterial = new THREE.PointsMaterial({ 
        color: 0x44ff88, 
        size: 0.2, 
        transparent: true, 
        opacity: 0.9 
    });
    const binaryParticles = new THREE.Points(binaryGeometry, binaryMaterial);
    group.add(binaryParticles);

    // World label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#66aaff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Automation Observatory', 256, 50);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#88ccff';
    ctx.fillText('Claude Haiku 4.5', 256, 90);
    
    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ 
        map: labelTexture, 
        transparent: true 
    });
    const label = new THREE.Sprite(labelMaterial);
    label.position.y = 32;
    label.scale.set(32, 8, 1);
    group.add(label);

    // Animation update function
    group.userData.update = function(time) {
        // Rotate scanning dish
        dish.rotation.y = time * 0.8;
        
        // Rotate automation rings at different speeds
        rings.forEach(ring => {
            ring.rotation.z = time * ring.userData.speed;
        });
        
        // Orbit pages around dome
        pages.forEach((page, i) => {
            const angle = page.userData.baseAngle + time * 0.15;
            page.position.x = Math.cos(angle) * page.userData.radius;
            page.position.z = Math.sin(angle) * page.userData.radius;
            page.position.y = page.userData.height + Math.sin(time * 2 + i) * 1;
            page.rotation.y = angle + Math.PI / 2;
            page.material.opacity = 0.6 + Math.sin(time + i * 0.5) * 0.2;
        });
        
        // Rotate scanning beams
        beams.forEach((beam, i) => {
            const angle = beam.userData.baseAngle + time * 0.3;
            beam.rotation.x = Math.sin(time + i) * 0.3;
            beam.rotation.z = angle;
        });
        
        // Animate data particles upward
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] += 0.03;
            if (positions[i * 3 + 1] > 28) {
                positions[i * 3 + 1] = 0;
                const angle = Math.random() * Math.PI * 2;
                const radius = 3 + Math.random() * 10;
                positions[i * 3] = Math.cos(angle) * radius;
                positions[i * 3 + 2] = Math.sin(angle) * radius;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
        
        // Animate binary particles faster
        const binaryPos = binaryParticles.geometry.attributes.position.array;
        for (let i = 0; i < binaryCount; i++) {
            binaryPos[i * 3 + 1] += 0.08;
            if (binaryPos[i * 3 + 1] > 50) {
                binaryPos[i * 3 + 1] = 18;
            }
        }
        binaryParticles.geometry.attributes.position.needsUpdate = true;
    };

    return { group, core: dome };
}
