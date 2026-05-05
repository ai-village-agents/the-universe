// Seyfert Galaxy - Active spiral galaxy with extremely luminous nucleus
export function createSeyfertGalaxy(THREE) {
    const group = new THREE.Group();
    
    // Bright AGN nucleus - golden core
    const nucleusGeo = new THREE.SphereGeometry(3.5, 32, 32);
    const nucleusMat = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.95
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    group.add(nucleus);
    
    // Intense inner glow
    const innerGlowGeo = new THREE.SphereGeometry(5, 32, 32);
    const innerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffee88,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide
    });
    const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
    group.add(innerGlow);
    
    // Outer halo glow
    const outerGlowGeo = new THREE.SphereGeometry(8, 32, 32);
    const outerGlowMat = new THREE.MeshBasicMaterial({
        color: 0xffcc33,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    group.add(outerGlow);
    
    // Spiral arms with stars
    const armStars = [];
    const armCount = 2;
    const starsPerArm = 80;
    
    for (let arm = 0; arm < armCount; arm++) {
        const armOffset = (arm / armCount) * Math.PI * 2;
        for (let i = 0; i < starsPerArm; i++) {
            const t = i / starsPerArm;
            const radius = 6 + t * 25;
            const angle = armOffset + t * Math.PI * 2.5;
            const spread = (Math.random() - 0.5) * 4 * t;
            
            const starGeo = new THREE.SphereGeometry(0.15 + Math.random() * 0.2, 8, 8);
            const brightness = 0.4 + Math.random() * 0.6;
            const starMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color(brightness, brightness * 0.9, brightness * 0.7),
                transparent: true,
                opacity: 0.8
            });
            const star = new THREE.Mesh(starGeo, starMat);
            star.position.set(
                Math.cos(angle) * radius + spread,
                (Math.random() - 0.5) * 2,
                Math.sin(angle) * radius + spread
            );
            star.userData.baseAngle = angle;
            star.userData.radius = radius;
            star.userData.spread = spread;
            armStars.push(star);
            group.add(star);
        }
    }
    
    // Accretion disk around nucleus
    const diskGeo = new THREE.TorusGeometry(4, 1.5, 16, 64);
    const diskMat = new THREE.MeshBasicMaterial({
        color: 0xff8844,
        transparent: true,
        opacity: 0.4
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI * 0.5;
    group.add(disk);
    
    group.userData.update = function(time) {
        // Pulsating nucleus
        const pulse = 1.0 + Math.sin(time * 3) * 0.15;
        nucleus.scale.setScalar(pulse);
        innerGlow.scale.setScalar(pulse * 1.1);
        
        // Rotate spiral slowly
        group.rotation.y = time * 0.05;
        
        // Accretion disk rotation
        disk.rotation.z = time * 0.8;
    };
    
    return { group };
}
