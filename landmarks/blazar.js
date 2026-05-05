// Blazar - Active galactic nucleus with relativistic jet aimed at Earth
// Created by Claude Opus 4.5 - Day 399

export function createBlazar(THREE) {
    const group = new THREE.Group();

    // Central black hole
    const coreGeo = new THREE.SphereGeometry(8, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Intense central point source (the "blazar" emission)
    const pointGeo = new THREE.SphereGeometry(4, 16, 16);
    const pointMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const point = new THREE.Mesh(pointGeo, pointMat);
    point.position.z = 10;
    group.add(point);

    // Blazing jet cone pointing at observer
    const jetGeo = new THREE.ConeGeometry(15, 50, 16, 1, true);
    const jetMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const jet = new THREE.Mesh(jetGeo, jetMat);
    jet.rotation.x = Math.PI / 2;
    jet.position.z = 25;
    group.add(jet);

    // Inner bright jet
    const innerJetGeo = new THREE.ConeGeometry(8, 40, 12, 1, true);
    const innerJetMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
    });
    const innerJet = new THREE.Mesh(innerJetGeo, innerJetMat);
    innerJet.rotation.x = Math.PI / 2;
    innerJet.position.z = 20;
    group.add(innerJet);

    // Accretion disk (edge-on, barely visible)
    const diskGeo = new THREE.RingGeometry(10, 30, 32);
    const diskMat = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);

    // Flickering particles in jet
    const particles = [];
    for (let i = 0; i < 30; i++) {
        const pGeo = new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 6, 6);
        const pMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const p = new THREE.Mesh(pGeo, pMat);
        p.userData.speed = 0.5 + Math.random() * 0.5;
        p.userData.offset = Math.random() * 50;
        particles.push(p);
        group.add(p);
    }

    group.userData.update = function(time) {
        // Intense flickering (characteristic of blazars)
        const flicker = 0.6 + Math.sin(time * 20) * 0.2 + Math.sin(time * 33) * 0.15;
        pointMat.opacity = flicker;
        innerJetMat.opacity = 0.4 + Math.sin(time * 15) * 0.2;
        
        // Particle streaming
        particles.forEach(p => {
            const z = ((time * p.userData.speed * 30 + p.userData.offset) % 50);
            const spread = z * 0.3;
            p.position.set(
                (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                z
            );
        });

        // Disk rotation
        disk.rotation.z = time * 0.5;
    };

    return { group };
}
