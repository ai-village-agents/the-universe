// Stellar Nursery - Star-Forming Region
// Created by Claude Opus 4.5 on Day 398
// Glowing gas clouds with embedded protostars and Herbig-Haro jets
// Position: (-500, 200, -200)

export function createStellarNursery(THREE) {
    const group = new THREE.Group();
    
    // Main molecular cloud - dark with glowing edges
    const cloudCount = 5;
    const clouds = [];
    
    for (let i = 0; i < cloudCount; i++) {
        const cloudGeo = new THREE.SphereGeometry(20 + Math.random() * 15, 16, 16);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: 0x331122,
            transparent: true,
            opacity: 0.6
        });
        const cloud = new THREE.Mesh(cloudGeo, cloudMat);
        cloud.position.set(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 60
        );
        cloud.scale.set(
            0.8 + Math.random() * 0.4,
            0.6 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        );
        group.add(cloud);
        clouds.push(cloud);
    }
    
    // Glowing ionized gas (HII regions) - pink/red
    const hiiRegions = [];
    for (let i = 0; i < 4; i++) {
        const hiiGeo = new THREE.SphereGeometry(8 + Math.random() * 6, 16, 16);
        const hiiMat = new THREE.MeshBasicMaterial({
            color: 0xff6688,
            transparent: true,
            opacity: 0.4
        });
        const hii = new THREE.Mesh(hiiGeo, hiiMat);
        hii.position.set(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 50
        );
        group.add(hii);
        hiiRegions.push(hii);
    }
    
    // Newborn stars (protostars) - bright points embedded in clouds
    const protostarCount = 12;
    const protostars = [];
    
    for (let i = 0; i < protostarCount; i++) {
        const starGeo = new THREE.SphereGeometry(1 + Math.random() * 1.5, 16, 16);
        const starColor = Math.random() > 0.5 ? 0xffffaa : 0xaaddff;
        const starMat = new THREE.MeshBasicMaterial({
            color: starColor,
            transparent: true,
            opacity: 0.9
        });
        const star = new THREE.Mesh(starGeo, starMat);
        star.position.set(
            (Math.random() - 0.5) * 70,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 70
        );
        group.add(star);
        
        // Star glow
        const glowGeo = new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: starColor,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(star.position);
        group.add(glow);
        
        protostars.push({ star, glow, baseOpacity: 0.9 });
    }
    
    // Herbig-Haro jets from young stars
    const jetCount = 4;
    const jets = [];
    
    for (let i = 0; i < jetCount; i++) {
        const jetLength = 25 + Math.random() * 15;
        const jetGeo = new THREE.CylinderGeometry(0.5, 1.5, jetLength, 8);
        const jetMat = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.6
        });
        
        // Bipolar jets
        const jet1 = new THREE.Mesh(jetGeo, jetMat);
        const jet2 = new THREE.Mesh(jetGeo, jetMat.clone());
        
        const jx = (Math.random() - 0.5) * 50;
        const jy = (Math.random() - 0.5) * 30;
        const jz = (Math.random() - 0.5) * 50;
        
        jet1.position.set(jx, jy + jetLength/2, jz);
        jet2.position.set(jx, jy - jetLength/2, jz);
        jet2.rotation.z = Math.PI;
        
        // Random orientation
        const ax = Math.random() * 0.5;
        const az = Math.random() * 0.5;
        jet1.rotation.x = ax;
        jet1.rotation.z = az;
        jet2.rotation.x = ax;
        jet2.rotation.z = az + Math.PI;
        
        group.add(jet1);
        group.add(jet2);
        jets.push({ jet1, jet2 });
    }
    
    // Dust particles throughout the nebula
    const dustCount = 800;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    
    const dustColorOptions = [
        [0.3, 0.1, 0.15],  // Dark red-brown
        [0.4, 0.2, 0.3],   // Dusty pink
        [0.2, 0.15, 0.25], // Purple dust
        [0.5, 0.3, 0.2]    // Orange dust
    ];
    
    for (let i = 0; i < dustCount; i++) {
        dustPositions[i * 3] = (Math.random() - 0.5) * 100;
        dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 70;
        dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        
        const color = dustColorOptions[Math.floor(Math.random() * dustColorOptions.length)];
        dustColors[i * 3] = color[0];
        dustColors[i * 3 + 1] = color[1];
        dustColors[i * 3 + 2] = color[2];
    }
    
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    
    const dustMat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    group.add(dust);
    
    // Bright emission nebula particles
    const emissionCount = 400;
    const emissionGeo = new THREE.BufferGeometry();
    const emissionPositions = new Float32Array(emissionCount * 3);
    
    for (let i = 0; i < emissionCount; i++) {
        emissionPositions[i * 3] = (Math.random() - 0.5) * 80;
        emissionPositions[i * 3 + 1] = (Math.random() - 0.5) * 50;
        emissionPositions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    
    emissionGeo.setAttribute('position', new THREE.BufferAttribute(emissionPositions, 3));
    
    const emissionMat = new THREE.PointsMaterial({
        color: 0xff88aa,
        size: 0.8,
        transparent: true,
        opacity: 0.6
    });
    const emission = new THREE.Points(emissionGeo, emissionMat);
    group.add(emission);
    
    // Ambient lighting
    const light = new THREE.PointLight(0xffaacc, 1, 150);
    light.position.set(0, 10, 0);
    group.add(light);
    
    // Store references
    group.userData.clouds = clouds;
    group.userData.hiiRegions = hiiRegions;
    group.userData.protostars = protostars;
    group.userData.jets = jets;
    group.userData.dust = dust;
    group.userData.emission = emission;
    group.userData.light = light;
    
    // Animation update
    group.userData.update = function(time) {
        // Clouds slowly drift and pulse
        this.clouds.forEach((cloud, i) => {
            cloud.scale.x = 0.9 + Math.sin(time * 0.2 + i) * 0.1;
            cloud.scale.y = 0.7 + Math.sin(time * 0.15 + i * 2) * 0.1;
            cloud.position.y += Math.sin(time * 0.1 + i) * 0.01;
        });
        
        // HII regions glow and pulse
        this.hiiRegions.forEach((hii, i) => {
            hii.material.opacity = 0.3 + Math.sin(time * 0.5 + i * 1.5) * 0.15;
            hii.scale.setScalar(1 + Math.sin(time * 0.3 + i) * 0.1);
        });
        
        // Protostars twinkle
        this.protostars.forEach((ps, i) => {
            const twinkle = 0.7 + Math.sin(time * 4 + i * 3) * 0.3;
            ps.star.material.opacity = twinkle;
            ps.glow.material.opacity = twinkle * 0.4;
        });
        
        // Jets pulse outward
        this.jets.forEach((jet, i) => {
            const pulse = 0.9 + Math.sin(time * 2 + i) * 0.2;
            jet.jet1.scale.y = pulse;
            jet.jet2.scale.y = pulse;
            jet.jet1.material.opacity = 0.4 + Math.sin(time * 3 + i) * 0.2;
            jet.jet2.material.opacity = 0.4 + Math.sin(time * 3 + i + Math.PI) * 0.2;
        });
        
        // Dust rotation
        this.dust.rotation.y = time * 0.02;
        
        // Emission particles drift
        this.emission.rotation.y = -time * 0.015;
        this.emission.rotation.x = Math.sin(time * 0.05) * 0.1;
        
        // Light flicker
        this.light.intensity = 0.8 + Math.sin(time * 2) * 0.3;
    };
    
    return { group };
}
