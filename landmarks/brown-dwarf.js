// Brown Dwarf - substellar object between gas giant and star
// Created by Claude Opus 4.5 for the AI Village Universe

export function createBrownDwarf(THREE) {
    const group = new THREE.Group();
    
    // Brown dwarf core - cool reddish-brown color
    const coreGeometry = new THREE.SphereGeometry(8, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x8B4513,
        transparent: true,
        opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Methane cloud bands - characteristic of brown dwarfs
    const bandColors = [0x654321, 0x8B4513, 0x5C4033, 0x704214, 0x6B4423];
    for (let i = 0; i < 5; i++) {
        const bandGeometry = new THREE.TorusGeometry(7 + i * 0.3, 0.8, 8, 32);
        const bandMaterial = new THREE.MeshBasicMaterial({
            color: bandColors[i],
            transparent: true,
            opacity: 0.4
        });
        const band = new THREE.Mesh(bandGeometry, bandMaterial);
        band.rotation.x = Math.PI / 2;
        band.position.y = -3 + i * 1.5;
        group.add(band);
    }
    
    // Infrared glow envelope - brown dwarfs emit mostly in infrared
    const glowGeometry = new THREE.SphereGeometry(12, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x8B0000,
        transparent: true,
        opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Convective atmosphere particles - slow turbulent motion
    const atmosphereCount = 300;
    const atmosphereGeometry = new THREE.BufferGeometry();
    const atmospherePositions = new Float32Array(atmosphereCount * 3);
    const atmosphereColors = new Float32Array(atmosphereCount * 3);
    
    for (let i = 0; i < atmosphereCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 8 + Math.random() * 6;
        
        atmospherePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        atmospherePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        atmospherePositions[i * 3 + 2] = r * Math.cos(phi);
        
        // Warm reddish-brown colors
        atmosphereColors[i * 3] = 0.5 + Math.random() * 0.3;
        atmosphereColors[i * 3 + 1] = 0.2 + Math.random() * 0.2;
        atmosphereColors[i * 3 + 2] = 0.1 + Math.random() * 0.1;
    }
    
    atmosphereGeometry.setAttribute('position', new THREE.BufferAttribute(atmospherePositions, 3));
    atmosphereGeometry.setAttribute('color', new THREE.BufferAttribute(atmosphereColors, 3));
    
    const atmosphereMaterial = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const atmosphere = new THREE.Points(atmosphereGeometry, atmosphereMaterial);
    group.add(atmosphere);
    
    // Lithium absorption signature - unique spectral feature
    const lithiumCount = 50;
    const lithiumGeometry = new THREE.BufferGeometry();
    const lithiumPositions = new Float32Array(lithiumCount * 3);
    
    for (let i = 0; i < lithiumCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 6 + Math.random() * 3;
        lithiumPositions[i * 3] = r * Math.cos(angle);
        lithiumPositions[i * 3 + 1] = (Math.random() - 0.5) * 4;
        lithiumPositions[i * 3 + 2] = r * Math.sin(angle);
    }
    
    lithiumGeometry.setAttribute('position', new THREE.BufferAttribute(lithiumPositions, 3));
    
    const lithiumMaterial = new THREE.PointsMaterial({
        size: 0.4,
        color: 0xFF6347,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    
    const lithium = new THREE.Points(lithiumGeometry, lithiumMaterial);
    group.add(lithium);
    
    // Storm systems - large atmospheric vortices
    const storms = [];
    for (let i = 0; i < 3; i++) {
        const stormGeometry = new THREE.RingGeometry(1, 2.5, 16);
        const stormMaterial = new THREE.MeshBasicMaterial({
            color: 0x4A3728,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const storm = new THREE.Mesh(stormGeometry, stormMaterial);
        
        const theta = (i / 3) * Math.PI * 2;
        storm.position.set(
            7 * Math.cos(theta),
            (Math.random() - 0.5) * 6,
            7 * Math.sin(theta)
        );
        storm.lookAt(0, storm.position.y, 0);
        storms.push(storm);
        group.add(storm);
    }
    
    // Companion moon - many brown dwarfs have moons
    const moonGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({
        color: 0x808080,
        transparent: true,
        opacity: 0.8
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(20, 0, 0);
    group.add(moon);
    
    // Moon orbit trail
    const orbitGeometry = new THREE.TorusGeometry(20, 0.1, 8, 64);
    const orbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x666666,
        transparent: true,
        opacity: 0.3
    });
    const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
    orbit.rotation.x = Math.PI / 2;
    group.add(orbit);
    
    // Dim reddish point light
    const light = new THREE.PointLight(0x8B4513, 0.5, 50);
    group.add(light);
    
    // Animation function
    group.userData.update = function(time) {
        // Slow rotation - brown dwarfs rotate quickly but we slow for visibility
        core.rotation.y = time * 0.2;
        
        // Atmospheric convection
        const atmospherePos = atmosphere.geometry.attributes.position.array;
        for (let i = 0; i < atmosphereCount; i++) {
            const idx = i * 3;
            const x = atmospherePos[idx];
            const y = atmospherePos[idx + 1];
            const z = atmospherePos[idx + 2];
            const r = Math.sqrt(x * x + y * y + z * z);
            const angle = Math.atan2(z, x);
            
            // Slow convective drift
            atmospherePos[idx] = r * Math.cos(angle + 0.001);
            atmospherePos[idx + 2] = r * Math.sin(angle + 0.001);
            atmospherePos[idx + 1] += Math.sin(time * 0.5 + i) * 0.02;
            
            // Keep within bounds
            if (Math.abs(atmospherePos[idx + 1]) > 8) {
                atmospherePos[idx + 1] *= -0.9;
            }
        }
        atmosphere.geometry.attributes.position.needsUpdate = true;
        
        // Rotate bands at different speeds
        group.children.forEach((child, index) => {
            if (child.geometry && child.geometry.type === 'TorusGeometry' && index < 6) {
                child.rotation.z = time * (0.05 + index * 0.01);
            }
        });
        
        // Storm rotation
        storms.forEach((storm, i) => {
            storm.rotation.z = time * 0.3 * (i % 2 === 0 ? 1 : -1);
        });
        
        // Moon orbit
        const moonAngle = time * 0.15;
        moon.position.x = 20 * Math.cos(moonAngle);
        moon.position.z = 20 * Math.sin(moonAngle);
        
        // Pulsing glow
        glow.material.opacity = 0.15 + Math.sin(time * 0.3) * 0.05;
        light.intensity = 0.5 + Math.sin(time * 0.3) * 0.1;
    };
    
    return { group };
}
