// Neutron Star Crust Quake - Violent starquake releasing immense energy
export function createNeutronStarCrustQuake(THREE) {
    const group = new THREE.Group();
    
    // Dense neutron star core
    const starGeo = new THREE.SphereGeometry(3, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({
        color: 0xff6633,
        transparent: true,
        opacity: 0.9
    });
    const star = new THREE.Mesh(starGeo, starMat);
    group.add(star);
    
    // Fractured crust lines - glowing cracks
    const crackCount = 12;
    const cracks = [];
    for (let i = 0; i < crackCount; i++) {
        const crackGeo = new THREE.TorusGeometry(3.1, 0.08, 8, 32, Math.PI * (0.3 + Math.random() * 0.4));
        const crackMat = new THREE.MeshBasicMaterial({
            color: 0xffff44,
            transparent: true,
            opacity: 0.8
        });
        const crack = new THREE.Mesh(crackGeo, crackMat);
        crack.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI
        );
        crack.userData.phase = Math.random() * Math.PI * 2;
        cracks.push(crack);
        group.add(crack);
    }
    
    // Energy burst rings - expanding shockwaves
    const rings = [];
    for (let i = 0; i < 4; i++) {
        const ringGeo = new THREE.TorusGeometry(4 + i * 3, 0.3, 16, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff8844,
            transparent: true,
            opacity: 0.5 - i * 0.1
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI * 0.5;
        ring.userData.baseRadius = 4 + i * 3;
        ring.userData.phase = i * 0.5;
        rings.push(ring);
        group.add(ring);
    }
    
    // Ejected crust fragments
    const fragments = [];
    for (let i = 0; i < 25; i++) {
        const fragGeo = new THREE.TetrahedronGeometry(0.2 + Math.random() * 0.3);
        const fragMat = new THREE.MeshBasicMaterial({
            color: 0xffaa55,
            transparent: true,
            opacity: 0.7
        });
        const frag = new THREE.Mesh(fragGeo, fragMat);
        
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const dist = 4 + Math.random() * 8;
        
        frag.position.set(
            Math.sin(phi) * Math.cos(theta) * dist,
            Math.sin(phi) * Math.sin(theta) * dist,
            Math.cos(phi) * dist
        );
        frag.userData.theta = theta;
        frag.userData.phi = phi;
        frag.userData.baseDist = dist;
        frag.userData.speed = 0.5 + Math.random() * 1.5;
        fragments.push(frag);
        group.add(frag);
    }
    
    // Magnetic field lines distorted
    const fieldLines = [];
    for (let i = 0; i < 6; i++) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 5, 0),
            new THREE.Vector3(3, 3, 0),
            new THREE.Vector3(4, 0, 0),
            new THREE.Vector3(3, -3, 0),
            new THREE.Vector3(0, -5, 0)
        ]);
        const lineGeo = new THREE.TubeGeometry(curve, 32, 0.05, 8, false);
        const lineMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.5
        });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.rotation.y = (i / 6) * Math.PI * 2;
        fieldLines.push(line);
        group.add(line);
    }
    
    // Intense glow during quake
    const glowGeo = new THREE.SphereGeometry(6, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xff4422,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);
    
    group.userData.update = function(time) {
        // Quake tremor effect on star
        const quakeIntensity = Math.sin(time * 8) * 0.03;
        star.scale.setScalar(1 + quakeIntensity);
        
        // Pulsing cracks
        cracks.forEach(crack => {
            crack.material.opacity = 0.5 + Math.sin(time * 6 + crack.userData.phase) * 0.4;
        });
        
        // Expanding/contracting shockwave rings
        rings.forEach((ring, i) => {
            const scale = 1 + Math.sin(time * 2 + ring.userData.phase) * 0.3;
            ring.scale.setScalar(scale);
            ring.material.opacity = 0.4 - Math.sin(time * 2 + ring.userData.phase) * 0.2;
        });
        
        // Tumbling fragments
        fragments.forEach(frag => {
            frag.rotation.x += 0.02 * frag.userData.speed;
            frag.rotation.y += 0.03 * frag.userData.speed;
            // Pulsing distance
            const dist = frag.userData.baseDist + Math.sin(time * frag.userData.speed) * 1.5;
            frag.position.set(
                Math.sin(frag.userData.phi) * Math.cos(frag.userData.theta) * dist,
                Math.sin(frag.userData.phi) * Math.sin(frag.userData.theta) * dist,
                Math.cos(frag.userData.phi) * dist
            );
        });
        
        // Glow pulsation
        glow.material.opacity = 0.15 + Math.sin(time * 4) * 0.1;
        glow.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
        
        // Slow rotation
        group.rotation.y = time * 0.1;
    };
    
    return { group };
}
