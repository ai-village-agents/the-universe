// Blue Straggler - Mysteriously young star formed from stellar merger
// By Claude Opus 4.5

export function createBlueStraggler(THREE) {
    const group = new THREE.Group();

    // Central blue straggler - hot blue star
    const starGeom = new THREE.SphereGeometry(6, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({
        color: 0x6688ff,
        transparent: true,
        opacity: 0.95
    });
    const star = new THREE.Mesh(starGeom, starMat);
    group.add(star);

    // Hot corona
    const coronaGeom = new THREE.SphereGeometry(9, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.35
    });
    const corona = new THREE.Mesh(coronaGeom, coronaMat);
    group.add(corona);

    // Outer glow
    const glowGeom = new THREE.SphereGeometry(14, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x4466cc,
        transparent: true,
        opacity: 0.15
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    group.add(glow);

    // Surrounding old red giant stars (the cluster context)
    const oldStars = [];
    for (let i = 0; i < 20; i++) {
        const oldGeom = new THREE.SphereGeometry(2 + Math.random() * 2, 16, 16);
        const oldMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.05 + Math.random() * 0.05, 0.7, 0.5),
            transparent: true,
            opacity: 0.7
        });
        const oldStar = new THREE.Mesh(oldGeom, oldMat);
        const dist = 30 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        oldStar.position.set(
            dist * Math.sin(phi) * Math.cos(theta),
            dist * Math.sin(phi) * Math.sin(theta),
            dist * Math.cos(phi)
        );
        oldStars.push({ mesh: oldStar, phase: Math.random() * Math.PI * 2 });
        group.add(oldStar);
    }

    // Merger remnant debris ring
    const debrisGeom = new THREE.TorusGeometry(18, 2, 8, 64);
    const debrisMat = new THREE.MeshBasicMaterial({
        color: 0x8888ff,
        transparent: true,
        opacity: 0.2,
        wireframe: true
    });
    const debris = new THREE.Mesh(debrisGeom, debrisMat);
    debris.rotation.x = Math.PI / 3;
    group.add(debris);

    // Ejected mass particles from merger
    const ejectaCount = 250;
    const ejectaGeom = new THREE.BufferGeometry();
    const ejectaPositions = new Float32Array(ejectaCount * 3);
    const ejectaColors = new Float32Array(ejectaCount * 3);
    const ejectaData = [];

    for (let i = 0; i < ejectaCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = 8 + Math.random() * 25;
        const y = (Math.random() - 0.5) * 15;

        ejectaPositions[i * 3] = r * Math.cos(theta);
        ejectaPositions[i * 3 + 1] = y;
        ejectaPositions[i * 3 + 2] = r * Math.sin(theta);

        const color = new THREE.Color().setHSL(0.6 + Math.random() * 0.1, 0.7, 0.6);
        ejectaColors[i * 3] = color.r;
        ejectaColors[i * 3 + 1] = color.g;
        ejectaColors[i * 3 + 2] = color.b;

        ejectaData.push({
            baseR: r,
            theta: theta,
            baseY: y,
            speed: 0.3 + Math.random() * 0.5
        });
    }

    ejectaGeom.setAttribute('position', new THREE.BufferAttribute(ejectaPositions, 3));
    ejectaGeom.setAttribute('color', new THREE.BufferAttribute(ejectaColors, 3));

    const ejectaMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const ejecta = new THREE.Points(ejectaGeom, ejectaMat);
    group.add(ejecta);

    // Age contrast indicator - faint rings showing stellar evolution difference
    const ageRings = [];
    for (let i = 0; i < 3; i++) {
        const ageGeom = new THREE.TorusGeometry(25 + i * 12, 0.15, 8, 64);
        const ageMat = new THREE.MeshBasicMaterial({
            color: i === 0 ? 0x6688ff : 0xff6644,
            transparent: true,
            opacity: 0.2
        });
        const ageRing = new THREE.Mesh(ageGeom, ageMat);
        ageRing.rotation.x = Math.PI / 2;
        ageRings.push({ mesh: ageRing, speed: 0.1 - i * 0.02 });
        group.add(ageRing);
    }

    // Binary companion ghost (many blue stragglers have companions)
    const ghostGeom = new THREE.SphereGeometry(2, 16, 16);
    const ghostMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3
    });
    const ghost = new THREE.Mesh(ghostGeom, ghostMat);
    group.add(ghost);

    // Update function
    group.userData.update = function(time) {
        // Star pulsation
        const pulse = 1 + 0.08 * Math.sin(time * 4);
        star.scale.setScalar(pulse);
        corona.scale.setScalar(pulse * 1.1);
        glow.scale.setScalar(pulse * 1.05);

        // Old stars twinkle
        oldStars.forEach(os => {
            os.mesh.material.opacity = 0.5 + 0.3 * Math.sin(time * 0.5 + os.phase);
        });

        // Debris ring rotates
        debris.rotation.z = time * 0.1;

        // Ejecta particles spiral outward
        const positions = ejecta.geometry.attributes.position.array;
        ejectaData.forEach((d, i) => {
            const r = d.baseR + Math.sin(time * d.speed) * 3;
            const theta = d.theta + time * 0.05;
            positions[i * 3] = r * Math.cos(theta);
            positions[i * 3 + 1] = d.baseY + Math.sin(time + i) * 2;
            positions[i * 3 + 2] = r * Math.sin(theta);
        });
        ejecta.geometry.attributes.position.needsUpdate = true;

        // Age rings rotate
        ageRings.forEach(ar => {
            ar.mesh.rotation.z = time * ar.speed;
        });

        // Ghost companion orbits
        const orbitAngle = time * 0.2;
        ghost.position.set(
            Math.cos(orbitAngle) * 15,
            Math.sin(orbitAngle * 0.5) * 5,
            Math.sin(orbitAngle) * 15
        );
        ghost.material.opacity = 0.2 + 0.15 * Math.sin(time * 2);
    };

    return { group };
}
