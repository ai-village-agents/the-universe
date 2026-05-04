// Canonical Observatory landmark - GPT-5.1
// A teaching tower with floating canon scrolls, evidence boundary rings, and knowledge beams

export function createCanonicalObservatoryLandmark(THREE, world) {
    const group = new THREE.Group();
    const color = new THREE.Color(world.color || "#8888ff");

    // Central tower - tall and elegant teaching beacon
    const towerGeometry = new THREE.CylinderGeometry(3, 5, 25, 8);
    const towerMaterial = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.85 
    });
    const tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.y = 12.5;
    group.add(tower);

    // Glowing crown atop the tower
    const crownGeometry = new THREE.OctahedronGeometry(4, 0);
    const crownMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.9 
    });
    const crown = new THREE.Mesh(crownGeometry, crownMaterial);
    crown.position.y = 28;
    group.add(crown);

    // Evidence boundary rings - three concentric rings at different heights
    const ringMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xaaccff, 
        transparent: true, 
        opacity: 0.6,
        side: THREE.DoubleSide 
    });
    
    for (let i = 0; i < 3; i++) {
        const ringGeometry = new THREE.RingGeometry(12 + i * 4, 13 + i * 4, 32);
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = 8 + i * 8;
        ring.rotation.x = Math.PI / 2;
        ring.userData.orbitSpeed = 0.3 + i * 0.1;
        ring.userData.orbitDirection = i % 2 === 0 ? 1 : -1;
        group.add(ring);
    }

    // Floating canon scrolls/books orbiting the tower
    const scrolls = [];
    const scrollGeometry = new THREE.BoxGeometry(2, 3, 0.5);
    const scrollMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xfff8e8, 
        transparent: true, 
        opacity: 0.9 
    });
    
    for (let i = 0; i < 12; i++) {
        const scroll = new THREE.Mesh(scrollGeometry, scrollMaterial);
        const angle = (i / 12) * Math.PI * 2;
        const radius = 8 + Math.sin(i * 0.5) * 2;
        scroll.position.set(
            Math.cos(angle) * radius,
            5 + (i % 3) * 7,
            Math.sin(angle) * radius
        );
        scroll.rotation.y = angle;
        scroll.userData.baseAngle = angle;
        scroll.userData.radius = radius;
        scroll.userData.height = scroll.position.y;
        scrolls.push(scroll);
        group.add(scroll);
    }

    // Knowledge light beams emanating upward
    const beamMaterial = new THREE.MeshBasicMaterial({ 
        color: color, 
        transparent: true, 
        opacity: 0.3 
    });
    
    for (let i = 0; i < 4; i++) {
        const beamGeometry = new THREE.CylinderGeometry(0.3, 1.5, 40, 6);
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        const angle = (i / 4) * Math.PI * 2;
        beam.position.set(
            Math.cos(angle) * 6,
            20,
            Math.sin(angle) * 6
        );
        beam.userData.baseAngle = angle;
        group.add(beam);
    }

    // Floating evidence particles
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 15;
        const height = Math.random() * 35;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = height;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ 
        color: 0xaaddff, 
        size: 0.5, 
        transparent: true, 
        opacity: 0.7 
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    // World label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8888ff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Canonical Observatory', 256, 50);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#aaccff';
    ctx.fillText('GPT-5.1', 256, 90);
    
    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ 
        map: labelTexture, 
        transparent: true 
    });
    const label = new THREE.Sprite(labelMaterial);
    label.position.y = 38;
    label.scale.set(30, 7.5, 1);
    group.add(label);

    // Animation update function
    group.userData.update = function(time) {
        // Rotate crown
        crown.rotation.y = time * 0.5;
        crown.rotation.z = Math.sin(time) * 0.1;
        
        // Pulse crown glow
        crown.material.opacity = 0.7 + Math.sin(time * 2) * 0.2;
        
        // Rotate evidence boundary rings
        group.children.forEach(child => {
            if (child.userData.orbitSpeed) {
                child.rotation.z = time * child.userData.orbitSpeed * child.userData.orbitDirection;
            }
        });
        
        // Orbit scrolls around tower
        scrolls.forEach((scroll, i) => {
            const angle = scroll.userData.baseAngle + time * 0.2;
            scroll.position.x = Math.cos(angle) * scroll.userData.radius;
            scroll.position.z = Math.sin(angle) * scroll.userData.radius;
            scroll.position.y = scroll.userData.height + Math.sin(time + i) * 1.5;
            scroll.rotation.y = angle + Math.PI / 2;
        });
        
        // Animate particles upward
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3 + 1] += 0.02;
            if (positions[i * 3 + 1] > 40) {
                positions[i * 3 + 1] = 0;
            }
        }
        particles.geometry.attributes.position.needsUpdate = true;
    };

    return { group, core: tower };
}
