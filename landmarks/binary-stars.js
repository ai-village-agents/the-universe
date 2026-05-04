// Binary Star System - Two stars orbiting their common center of mass
// Created by Claude Opus 4.5 - Day 398

export function createBinaryStars(THREE) {
    const group = new THREE.Group();
    
    // Orbital parameters
    const orbitRadius = 25;
    const orbitSpeed = 0.5;
    
    // Star A - Larger, yellow-orange (like the Sun)
    const starAGroup = new THREE.Group();
    
    const starAGeometry = new THREE.SphereGeometry(12, 32, 32);
    const starAMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.95
    });
    const starA = new THREE.Mesh(starAGeometry, starAMaterial);
    starAGroup.add(starA);
    
    // Star A glow
    const glowAGeometry = new THREE.SphereGeometry(18, 32, 32);
    const glowAMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa22,
        transparent: true,
        opacity: 0.25
    });
    const glowA = new THREE.Mesh(glowAGeometry, glowAMaterial);
    starAGroup.add(glowA);
    
    // Star A corona particles
    const coronaAGeometry = new THREE.BufferGeometry();
    const coronaACount = 150;
    const coronaAPositions = new Float32Array(coronaACount * 3);
    
    for (let i = 0; i < coronaACount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 14 + Math.random() * 8;
        coronaAPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        coronaAPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        coronaAPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    coronaAGeometry.setAttribute('position', new THREE.BufferAttribute(coronaAPositions, 3));
    const coronaAMaterial = new THREE.PointsMaterial({
        size: 2,
        color: 0xffcc00,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const coronaA = new THREE.Points(coronaAGeometry, coronaAMaterial);
    starAGroup.add(coronaA);
    
    // Star A light
    const lightA = new THREE.PointLight(0xffdd44, 2, 150);
    starAGroup.add(lightA);
    
    group.add(starAGroup);
    
    // Star B - Smaller, blue-white (hot young star)
    const starBGroup = new THREE.Group();
    
    const starBGeometry = new THREE.SphereGeometry(8, 32, 32);
    const starBMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.95
    });
    const starB = new THREE.Mesh(starBGeometry, starBMaterial);
    starBGroup.add(starB);
    
    // Star B glow
    const glowBGeometry = new THREE.SphereGeometry(12, 32, 32);
    const glowBMaterial = new THREE.MeshBasicMaterial({
        color: 0x6699ff,
        transparent: true,
        opacity: 0.25
    });
    const glowB = new THREE.Mesh(glowBGeometry, glowBMaterial);
    starBGroup.add(glowB);
    
    // Star B corona particles
    const coronaBGeometry = new THREE.BufferGeometry();
    const coronaBCount = 100;
    const coronaBPositions = new Float32Array(coronaBCount * 3);
    
    for (let i = 0; i < coronaBCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const r = 9 + Math.random() * 5;
        coronaBPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        coronaBPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        coronaBPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    
    coronaBGeometry.setAttribute('position', new THREE.BufferAttribute(coronaBPositions, 3));
    const coronaBMaterial = new THREE.PointsMaterial({
        size: 1.5,
        color: 0x88ccff,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const coronaB = new THREE.Points(coronaBGeometry, coronaBMaterial);
    starBGroup.add(coronaB);
    
    // Star B light
    const lightB = new THREE.PointLight(0xaaddff, 1.5, 120);
    starBGroup.add(lightB);
    
    group.add(starBGroup);
    
    // Mass transfer stream (gas flowing between stars)
    const streamGeometry = new THREE.BufferGeometry();
    const streamCount = 100;
    const streamPositions = new Float32Array(streamCount * 3);
    const streamColors = new Float32Array(streamCount * 3);
    const streamData = [];
    
    for (let i = 0; i < streamCount; i++) {
        streamPositions[i * 3] = 0;
        streamPositions[i * 3 + 1] = 0;
        streamPositions[i * 3 + 2] = 0;
        
        // Gradient from yellow-orange to blue-white
        const t = i / streamCount;
        streamColors[i * 3] = 1.0 - t * 0.3;
        streamColors[i * 3 + 1] = 0.8 - t * 0.2 + t * 0.4;
        streamColors[i * 3 + 2] = 0.3 + t * 0.7;
        
        streamData.push({
            t: Math.random(),
            speed: 0.3 + Math.random() * 0.2,
            offset: (Math.random() - 0.5) * 4
        });
    }
    
    streamGeometry.setAttribute('position', new THREE.BufferAttribute(streamPositions, 3));
    streamGeometry.setAttribute('color', new THREE.BufferAttribute(streamColors, 3));
    
    const streamMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const stream = new THREE.Points(streamGeometry, streamMaterial);
    group.add(stream);
    
    // Orbital trail ring (showing the path)
    const orbitGeometry = new THREE.TorusGeometry(orbitRadius, 0.3, 8, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x444466,
        transparent: true,
        opacity: 0.2
    });
    const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbitRing.rotation.x = Math.PI / 2;
    group.add(orbitRing);
    
    // Central barycenter marker
    const barycenterGeometry = new THREE.SphereGeometry(1, 16, 16);
    const barycenterMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5
    });
    const barycenter = new THREE.Mesh(barycenterGeometry, barycenterMaterial);
    group.add(barycenter);
    
    // Animation update function
    group.userData.update = function(time) {
        // Orbital motion - stars orbit their common center
        // Star A orbits at smaller radius (more massive)
        const angleA = time * orbitSpeed;
        const radiusA = orbitRadius * 0.4; // Closer to barycenter
        starAGroup.position.x = Math.cos(angleA) * radiusA;
        starAGroup.position.z = Math.sin(angleA) * radiusA;
        
        // Star B orbits at larger radius (less massive)
        const angleB = angleA + Math.PI; // Opposite side
        const radiusB = orbitRadius * 0.6;
        starBGroup.position.x = Math.cos(angleB) * radiusB;
        starBGroup.position.z = Math.sin(angleB) * radiusB;
        
        // Rotate coronas
        coronaA.rotation.y = time * 0.2;
        coronaA.rotation.x = time * 0.1;
        coronaB.rotation.y = time * 0.3;
        coronaB.rotation.z = time * 0.15;
        
        // Pulsing glow
        const pulseA = 0.25 + Math.sin(time * 2) * 0.05;
        const pulseB = 0.25 + Math.sin(time * 2.5) * 0.05;
        glowAMaterial.opacity = pulseA;
        glowBMaterial.opacity = pulseB;
        
        // Update mass transfer stream
        const streamPos = streamGeometry.attributes.position.array;
        for (let i = 0; i < streamCount; i++) {
            const d = streamData[i];
            d.t += d.speed * 0.02;
            if (d.t > 1) d.t = 0;
            
            // Curved path from star A to star B
            const posA = starAGroup.position;
            const posB = starBGroup.position;
            const t = d.t;
            
            // Bezier-like curve with slight arc
            const midY = 5 * Math.sin(t * Math.PI);
            streamPos[i * 3] = posA.x + (posB.x - posA.x) * t + d.offset * Math.sin(t * Math.PI);
            streamPos[i * 3 + 1] = midY + d.offset * 0.5 * Math.cos(t * Math.PI);
            streamPos[i * 3 + 2] = posA.z + (posB.z - posA.z) * t;
        }
        streamGeometry.attributes.position.needsUpdate = true;
        
        // Light intensity variation
        lightA.intensity = 1.8 + Math.sin(time * 3) * 0.2;
        lightB.intensity = 1.3 + Math.sin(time * 4) * 0.2;
    };
    
    return { group };
}
