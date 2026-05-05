// Stellar Wind Collision - Two massive stars with colliding winds
// Created by Claude Opus 4.5 - Day 399

export function createStellarWindCollision(THREE) {
    const group = new THREE.Group();

    // Star 1 - blue supergiant
    const star1Geo = new THREE.SphereGeometry(8, 24, 24);
    const star1Mat = new THREE.MeshBasicMaterial({ color: 0x6688ff });
    const star1 = new THREE.Mesh(star1Geo, star1Mat);
    star1.position.set(-25, 0, 0);
    group.add(star1);

    // Star 2 - Wolf-Rayet star
    const star2Geo = new THREE.SphereGeometry(6, 24, 24);
    const star2Mat = new THREE.MeshBasicMaterial({ color: 0xffaa44 });
    const star2 = new THREE.Mesh(star2Geo, star2Mat);
    star2.position.set(25, 0, 0);
    group.add(star2);

    // Wind from star 1
    const wind1Particles = [];
    for (let i = 0; i < 40; i++) {
        const pGeo = new THREE.SphereGeometry(0.4, 6, 6);
        const pMat = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.6
        });
        const p = new THREE.Mesh(pGeo, pMat);
        p.userData.angle = Math.random() * Math.PI - Math.PI / 2;
        p.userData.dist = Math.random();
        wind1Particles.push(p);
        group.add(p);
    }

    // Wind from star 2
    const wind2Particles = [];
    for (let i = 0; i < 40; i++) {
        const pGeo = new THREE.SphereGeometry(0.4, 6, 6);
        const pMat = new THREE.MeshBasicMaterial({
            color: 0xffcc66,
            transparent: true,
            opacity: 0.6
        });
        const p = new THREE.Mesh(pGeo, pMat);
        p.userData.angle = Math.random() * Math.PI - Math.PI / 2;
        p.userData.dist = Math.random();
        wind2Particles.push(p);
        group.add(p);
    }

    // Collision shock region (bow shock)
    const shockGeo = new THREE.TorusGeometry(12, 4, 8, 24);
    const shockMat = new THREE.MeshBasicMaterial({
        color: 0xff44ff,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.rotation.y = Math.PI / 2;
    group.add(shock);

    // Hot X-ray emitting plasma at collision zone
    const hotGeo = new THREE.SphereGeometry(6, 16, 16);
    const hotMat = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        transparent: true,
        opacity: 0.4
    });
    const hot = new THREE.Mesh(hotGeo, hotMat);
    group.add(hot);

    group.userData.update = function(time) {
        // Star pulsation
        const scale1 = 1 + Math.sin(time * 3) * 0.05;
        const scale2 = 1 + Math.sin(time * 4) * 0.08;
        star1.scale.setScalar(scale1);
        star2.scale.setScalar(scale2);

        // Wind particles from star 1
        wind1Particles.forEach((p, i) => {
            const t = (time * 0.5 + p.userData.dist) % 1;
            const angle = p.userData.angle;
            const dist = 10 + t * 15;
            p.position.set(
                -25 + dist,
                Math.sin(angle) * dist * 0.3,
                Math.cos(angle) * dist * 0.3
            );
            p.material.opacity = 0.6 * (1 - t);
        });

        // Wind particles from star 2
        wind2Particles.forEach((p, i) => {
            const t = (time * 0.6 + p.userData.dist) % 1;
            const angle = p.userData.angle;
            const dist = 8 + t * 17;
            p.position.set(
                25 - dist,
                Math.sin(angle) * dist * 0.3,
                Math.cos(angle) * dist * 0.3
            );
            p.material.opacity = 0.6 * (1 - t);
        });

        // Shock region pulsing
        shock.rotation.x = time * 0.3;
        hotMat.opacity = 0.3 + Math.sin(time * 5) * 0.15;
    };

    return { group };
}
