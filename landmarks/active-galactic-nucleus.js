// Active Galactic Nucleus (AGN) - Supermassive black hole devouring matter
// Created by Claude Opus 4.5 - Day 398

export function createActiveGalacticNucleus(THREE) {
    const group = new THREE.Group();

    // Supermassive black hole core
    const coreGeo = new THREE.SphereGeometry(15, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Bright quasar-like emission
    const emissionGeo = new THREE.SphereGeometry(20, 32, 32);
    const emissionMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
    });
    const emission = new THREE.Mesh(emissionGeo, emissionMat);
    group.add(emission);

    // Massive accretion disk
    const diskGeo = new THREE.RingGeometry(20, 80, 64);
    const diskMat = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    const disk = new THREE.Mesh(diskGeo, diskMat);
    disk.rotation.x = Math.PI * 0.4;
    group.add(disk);

    // Inner hot disk
    const innerDiskGeo = new THREE.RingGeometry(15, 35, 64);
    const innerDiskMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
    });
    const innerDisk = new THREE.Mesh(innerDiskGeo, innerDiskMat);
    innerDisk.rotation.x = Math.PI * 0.4;
    group.add(innerDisk);

    // Surrounding host galaxy (faint elliptical)
    const galaxyParticles = [];
    for (let i = 0; i < 200; i++) {
        const pGeo = new THREE.SphereGeometry(0.5 + Math.random(), 6, 6);
        const pMat = new THREE.MeshBasicMaterial({
            color: 0xffffdd,
            transparent: true,
            opacity: 0.3 + Math.random() * 0.3
        });
        const p = new THREE.Mesh(pGeo, pMat);
        const r = 60 + Math.random() * 100;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.6;
        p.position.x = r * Math.cos(theta) * Math.cos(phi);
        p.position.y = r * Math.sin(phi) * 0.4;
        p.position.z = r * Math.sin(theta) * Math.cos(phi);
        galaxyParticles.push(p);
        group.add(p);
    }

    // Radiation jets (weaker than relativistic jet)
    for (let j = 0; j < 2; j++) {
        const dir = j === 0 ? 1 : -1;
        const jetGeo = new THREE.ConeGeometry(8, 60, 12, 1, true);
        const jetMat = new THREE.MeshBasicMaterial({
            color: 0x8888ff,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        const jet = new THREE.Mesh(jetGeo, jetMat);
        jet.position.y = dir * 40;
        jet.rotation.x = dir > 0 ? 0 : Math.PI;
        group.add(jet);
    }

    // Broad line region clouds
    const clouds = [];
    for (let i = 0; i < 30; i++) {
        const cGeo = new THREE.SphereGeometry(2 + Math.random() * 3, 8, 8);
        const cMat = new THREE.MeshBasicMaterial({
            color: 0xff6688,
            transparent: true,
            opacity: 0.4
        });
        const cloud = new THREE.Mesh(cGeo, cMat);
        const angle = Math.random() * Math.PI * 2;
        const r = 25 + Math.random() * 15;
        cloud.position.x = Math.cos(angle) * r;
        cloud.position.z = Math.sin(angle) * r;
        cloud.position.y = (Math.random() - 0.5) * 20;
        cloud.userData.angle = angle;
        cloud.userData.radius = r;
        cloud.userData.speed = 0.2 + Math.random() * 0.3;
        clouds.push(cloud);
        group.add(cloud);
    }

    group.userData.update = function(time) {
        disk.rotation.z = time * 0.1;
        innerDisk.rotation.z = time * 0.2;
        emission.scale.setScalar(1 + 0.2 * Math.sin(time * 3));
        emission.material.opacity = 0.4 + 0.3 * Math.sin(time * 2);

        clouds.forEach(c => {
            c.userData.angle += c.userData.speed * 0.02;
            c.position.x = Math.cos(c.userData.angle) * c.userData.radius;
            c.position.z = Math.sin(c.userData.angle) * c.userData.radius;
        });

        galaxyParticles.forEach((p, i) => {
            p.material.opacity = 0.2 + 0.2 * Math.sin(time + i * 0.1);
        });
    };

    return { group };
}
