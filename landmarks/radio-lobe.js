// Radio Lobe - Colossal bubble of synchrotron-emitting plasma
export function createRadioLobe(THREE) {
    const group = new THREE.Group();
    
    // Central AGN source (small bright core)
    const coreGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    
    // Twin radio lobes - giant plasma bubbles
    const lobeGeo = new THREE.SphereGeometry(12, 32, 32);
    const lobeMat = new THREE.MeshBasicMaterial({
        color: 0xaa55ff,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });
    
    const lobe1 = new THREE.Mesh(lobeGeo, lobeMat.clone());
    lobe1.position.set(0, 18, 0);
    lobe1.scale.set(1, 1.5, 1);
    group.add(lobe1);
    
    const lobe2 = new THREE.Mesh(lobeGeo, lobeMat.clone());
    lobe2.position.set(0, -18, 0);
    lobe2.scale.set(1, 1.5, 1);
    group.add(lobe2);
    
    // Inner lobe glow
    const innerLobeGeo = new THREE.SphereGeometry(8, 24, 24);
    const innerLobeMat = new THREE.MeshBasicMaterial({
        color: 0xcc77ff,
        transparent: true,
        opacity: 0.35
    });
    
    const innerLobe1 = new THREE.Mesh(innerLobeGeo, innerLobeMat.clone());
    innerLobe1.position.set(0, 18, 0);
    group.add(innerLobe1);
    
    const innerLobe2 = new THREE.Mesh(innerLobeGeo, innerLobeMat.clone());
    innerLobe2.position.set(0, -18, 0);
    group.add(innerLobe2);
    
    // Jets connecting core to lobes
    const jetGeo = new THREE.CylinderGeometry(0.8, 2, 14, 16);
    const jetMat = new THREE.MeshBasicMaterial({
        color: 0x8844ff,
        transparent: true,
        opacity: 0.6
    });
    
    const jet1 = new THREE.Mesh(jetGeo, jetMat.clone());
    jet1.position.set(0, 8, 0);
    group.add(jet1);
    
    const jet2 = new THREE.Mesh(jetGeo, jetMat.clone());
    jet2.position.set(0, -8, 0);
    jet2.rotation.x = Math.PI;
    group.add(jet2);
    
    // Synchrotron radiation particles
    const particles = [];
    for (let i = 0; i < 60; i++) {
        const particleGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0xdd99ff,
            transparent: true,
            opacity: 0.6
        });
        const particle = new THREE.Mesh(particleGeo, particleMat);
        
        // Distribute in both lobes
        const inUpperLobe = Math.random() > 0.5;
        const yOffset = inUpperLobe ? 18 : -18;
        const radius = Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        particle.position.set(
            Math.sin(phi) * Math.cos(theta) * radius,
            yOffset + Math.cos(phi) * radius * 1.3,
            Math.sin(phi) * Math.sin(theta) * radius
        );
        particle.userData.baseY = particle.position.y;
        particle.userData.speed = 0.5 + Math.random() * 1.5;
        particle.userData.phase = Math.random() * Math.PI * 2;
        particles.push(particle);
        group.add(particle);
    }
    
    group.userData.update = function(time) {
        // Pulsating lobes
        const pulse = 1.0 + Math.sin(time * 1.5) * 0.08;
        lobe1.scale.set(pulse, 1.5 * pulse, pulse);
        lobe2.scale.set(pulse, 1.5 * pulse, pulse);
        
        // Jet pulsation
        const jetPulse = 1.0 + Math.sin(time * 4) * 0.15;
        jet1.scale.x = jetPulse;
        jet1.scale.z = jetPulse;
        jet2.scale.x = jetPulse;
        jet2.scale.z = jetPulse;
        
        // Animate particles
        particles.forEach(p => {
            p.position.y = p.userData.baseY + Math.sin(time * p.userData.speed + p.userData.phase) * 2;
            p.material.opacity = 0.4 + Math.sin(time * 2 + p.userData.phase) * 0.3;
        });
        
        // Slow rotation
        group.rotation.y = time * 0.03;
    };
    
    return { group };
}
