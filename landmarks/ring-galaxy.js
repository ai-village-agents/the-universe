// Ring Galaxy - Rare collision-formed galaxy with stellar ring
// Created by Claude Opus 4.5 - Day 398

export function createRingGalaxy(THREE) {
    const group = new THREE.Group();
    
    // Central nucleus - remnant of original galaxy core
    const nucleusGeometry = new THREE.SphereGeometry(6, 32, 32);
    const nucleusMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd88,
        transparent: true,
        opacity: 0.8
    });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    group.add(nucleus);
    
    // Nuclear glow
    const nuclearGlowGeometry = new THREE.SphereGeometry(10, 32, 32);
    const nuclearGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc66,
        transparent: true,
        opacity: 0.3
    });
    const nuclearGlow = new THREE.Mesh(nuclearGlowGeometry, nuclearGlowMaterial);
    group.add(nuclearGlow);
    
    // The stellar ring - young blue stars formed by collision wave
    const ringStars = 600;
    const ringPositions = new Float32Array(ringStars * 3);
    const ringColors = new Float32Array(ringStars * 3);
    
    const ringRadius = 50;
    const ringWidth = 12;
    
    for (let i = 0; i < ringStars; i++) {
        const angle = (i / ringStars) * Math.PI * 2 + Math.random() * 0.1;
        const r = ringRadius + (Math.random() - 0.5) * ringWidth;
        const z = (Math.random() - 0.5) * 5;
        
        ringPositions[i * 3] = r * Math.cos(angle);
        ringPositions[i * 3 + 1] = z;
        ringPositions[i * 3 + 2] = r * Math.sin(angle);
        
        // Mostly young blue stars with some pink HII regions
        const starType = Math.random();
        if (starType < 0.7) {
            // Blue-white young stars
            ringColors[i * 3] = 0.6 + Math.random() * 0.2;
            ringColors[i * 3 + 1] = 0.8 + Math.random() * 0.2;
            ringColors[i * 3 + 2] = 1.0;
        } else if (starType < 0.9) {
            // Pink star-forming regions
            ringColors[i * 3] = 1.0;
            ringColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
            ringColors[i * 3 + 2] = 0.8 + Math.random() * 0.2;
        } else {
            // Yellow older stars
            ringColors[i * 3] = 1.0;
            ringColors[i * 3 + 1] = 0.9;
            ringColors[i * 3 + 2] = 0.5 + Math.random() * 0.3;
        }
    }
    
    const ringGeometry = new THREE.BufferGeometry();
    ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));
    ringGeometry.setAttribute('color', new THREE.BufferAttribute(ringColors, 3));
    
    const ringMaterial = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });
    
    const ringCloud = new THREE.Points(ringGeometry, ringMaterial);
    group.add(ringCloud);
    
    // Ring glow torus
    const ringGlowGeometry = new THREE.TorusGeometry(ringRadius, ringWidth / 2, 16, 64);
    const ringGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6699ff,
        transparent: true,
        opacity: 0.15
    });
    const ringGlow = new THREE.Mesh(ringGlowGeometry, ringGlowMaterial);
    ringGlow.rotation.x = Math.PI / 2;
    group.add(ringGlow);
    
    // Spoke remnants - material connecting nucleus to ring
    const spokes = 8;
    for (let i = 0; i < spokes; i++) {
        const spokeParticles = 50;
        const spokePositions = new Float32Array(spokeParticles * 3);
        const spokeColors = new Float32Array(spokeParticles * 3);
        
        const angle = (i / spokes) * Math.PI * 2;
        
        for (let j = 0; j < spokeParticles; j++) {
            const t = j / spokeParticles;
            const r = 10 + t * 35;
            const spread = 3 + t * 5;
            
            spokePositions[j * 3] = r * Math.cos(angle) + (Math.random() - 0.5) * spread;
            spokePositions[j * 3 + 1] = (Math.random() - 0.5) * 3;
            spokePositions[j * 3 + 2] = r * Math.sin(angle) + (Math.random() - 0.5) * spread;
            
            const fade = 1 - t * 0.5;
            spokeColors[j * 3] = 0.8 * fade;
            spokeColors[j * 3 + 1] = 0.7 * fade;
            spokeColors[j * 3 + 2] = 0.5 * fade;
        }
        
        const spokeGeometry = new THREE.BufferGeometry();
        spokeGeometry.setAttribute('position', new THREE.BufferAttribute(spokePositions, 3));
        spokeGeometry.setAttribute('color', new THREE.BufferAttribute(spokeColors, 3));
        
        const spokeMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        const spoke = new THREE.Points(spokeGeometry, spokeMaterial);
        group.add(spoke);
    }
    
    // Intruder galaxy - small galaxy that caused the collision
    const intruderGeometry = new THREE.SphereGeometry(4, 16, 16);
    const intruderMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.6
    });
    const intruder = new THREE.Mesh(intruderGeometry, intruderMaterial);
    intruder.position.set(0, 40, 0); // Above the ring plane
    group.add(intruder);
    
    // Intruder glow
    const intruderGlowGeometry = new THREE.SphereGeometry(6, 16, 16);
    const intruderGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.2
    });
    const intruderGlow = new THREE.Mesh(intruderGlowGeometry, intruderGlowMaterial);
    intruderGlow.position.copy(intruder.position);
    group.add(intruderGlow);
    
    // Star-forming knots in the ring - bright HII regions
    const knots = [];
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + 0.3;
        const knotGeometry = new THREE.SphereGeometry(3, 16, 16);
        const knotMaterial = new THREE.MeshBasicMaterial({
            color: 0xff88cc,
            transparent: true,
            opacity: 0.6
        });
        const knot = new THREE.Mesh(knotGeometry, knotMaterial);
        knot.position.set(
            ringRadius * Math.cos(angle),
            0,
            ringRadius * Math.sin(angle)
        );
        knot.userData.phase = Math.random() * Math.PI * 2;
        knots.push(knot);
        group.add(knot);
    }
    
    // Lights
    const ringLight = new THREE.PointLight(0x6699ff, 0.5, 100);
    ringLight.position.set(0, 10, 0);
    group.add(ringLight);
    
    const nucleusLight = new THREE.PointLight(0xffcc66, 0.4, 50);
    group.add(nucleusLight);
    
    // Animation
    group.userData.update = function(time) {
        // Slow rotation
        group.rotation.y = time * 0.02;
        
        // Ring shimmer
        ringMaterial.opacity = 0.85 + 0.1 * Math.sin(time * 1.5);
        ringGlowMaterial.opacity = 0.12 + 0.05 * Math.sin(time * 1.2);
        
        // Nucleus pulse
        const nucPulse = 1 + 0.08 * Math.sin(time * 0.8);
        nucleus.scale.setScalar(nucPulse);
        nuclearGlowMaterial.opacity = 0.25 + 0.1 * Math.sin(time * 0.8);
        
        // Intruder motion - slight oscillation
        intruder.position.y = 40 + 5 * Math.sin(time * 0.3);
        intruderGlow.position.copy(intruder.position);
        
        // Knot pulsation
        knots.forEach((knot, i) => {
            const pulse = 1 + 0.2 * Math.sin(time * 2 + knot.userData.phase);
            knot.scale.setScalar(pulse);
            knot.material.opacity = 0.5 + 0.2 * Math.sin(time * 2 + knot.userData.phase);
        });
        
        // Light variation
        ringLight.intensity = 0.4 + 0.15 * Math.sin(time * 1.5);
        nucleusLight.intensity = 0.35 + 0.1 * Math.sin(time * 0.8);
    };
    
    return { group };
}
