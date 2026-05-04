// The Luminous Index Landmark - GPT-5.5
// A glowing library/atlas themed landmark with floating index cards and light beams

export function createLuminousIndexLandmark(THREE, world) {
    const group = new THREE.Group();
    const color = new THREE.Color(world.color || '#7df9ff');
    
    // Central beacon - the index core
    const beaconGeometry = new THREE.CylinderGeometry(2, 4, 12, 8);
    const beaconMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
    });
    const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    group.add(beacon);
    
    // Glowing top cap
    const capGeometry = new THREE.SphereGeometry(3, 16, 16);
    const capMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const cap = new THREE.Mesh(capGeometry, capMaterial);
    cap.position.y = 7;
    group.add(cap);
    
    // Floating index cards orbiting
    const cards = [];
    for (let i = 0; i < 16; i++) {
        const cardGeometry = new THREE.BoxGeometry(3, 2, 0.1);
        const cardMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 0.7, 0.8),
            transparent: true,
            opacity: 0.7
        });
        const card = new THREE.Mesh(cardGeometry, cardMaterial);
        card.userData.angle = (i / 16) * Math.PI * 2;
        card.userData.radius = 10 + (i % 3) * 4;
        card.userData.speed = 0.2 + Math.random() * 0.3;
        card.userData.yBase = -4 + (i % 4) * 3;
        cards.push(card);
        group.add(card);
    }
    
    // Light beams emanating from top
    const beamGeometry = new THREE.ConeGeometry(0.3, 20, 4);
    const beams = [];
    for (let i = 0; i < 6; i++) {
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.y = 17;
        beam.userData.angle = (i / 6) * Math.PI * 2;
        beam.userData.tilt = 0.3;
        beams.push(beam);
        group.add(beam);
    }
    
    // Star particles representing indexed items
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 150;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 15 + Math.random() * 8;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({
        color: 0x7df9ff,
        size: 0.8,
        transparent: true,
        opacity: 0.7
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    group.add(stars);
    
    // Animation function
    group.userData.update = function(time) {
        // Pulse the beacon cap
        const pulse = 1 + Math.sin(time * 3) * 0.15;
        cap.scale.set(pulse, pulse, pulse);
        
        // Rotate stars
        stars.rotation.y = time * 0.08;
        
        // Animate cards
        for (const card of cards) {
            card.userData.angle += card.userData.speed * 0.01;
            card.position.x = Math.cos(card.userData.angle) * card.userData.radius;
            card.position.z = Math.sin(card.userData.angle) * card.userData.radius;
            card.position.y = card.userData.yBase + Math.sin(time + card.userData.angle) * 1.5;
            card.rotation.y = -card.userData.angle + Math.PI / 2;
        }
        
        // Animate beams
        for (let i = 0; i < beams.length; i++) {
            const beam = beams[i];
            beam.userData.angle += 0.01;
            beam.rotation.x = beam.userData.tilt * Math.sin(time + i);
            beam.rotation.z = beam.userData.tilt * Math.cos(time + i);
        }
    };
    
    return { group, core: beacon };
}
