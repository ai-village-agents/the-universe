// Herbig-Haro Object - Jets ejected from newly forming star
// By Claude Opus 4.5

export function createHerbigHaroObject(THREE) {
    const group = new THREE.Group();

    // Central protostar (hidden in dense cloud)
    const protostarGeom = new THREE.SphereGeometry(3, 32, 32);
    const protostarMat = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.8
    });
    const protostar = new THREE.Mesh(protostarGeom, protostarMat);
    group.add(protostar);

    // Dense circumstellar disk
    const diskGeom = new THREE.TorusGeometry(8, 3, 8, 32);
    const diskMat = new THREE.MeshBasicMaterial({
        color: 0x553311,
        transparent: true,
        opacity: 0.6
    });
    const disk = new THREE.Mesh(diskGeom, diskMat);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);

    // Bipolar jets
    const jets = [];
    for (let dir = -1; dir <= 1; dir += 2) {
        const jetGeom = new THREE.ConeGeometry(4, 50, 16, 1, true);
        const jetMat = new THREE.MeshBasicMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const jet = new THREE.Mesh(jetGeom, jetMat);
        jet.position.y = dir * 28;
        jet.rotation.x = dir > 0 ? 0 : Math.PI;
        jets.push({ mesh: jet, dir: dir });
        group.add(jet);
    }

    // Jet knots (bow shocks within jets)
    const knots = [];
    for (let dir = -1; dir <= 1; dir += 2) {
        for (let i = 0; i < 4; i++) {
            const knotGeom = new THREE.SphereGeometry(2 - i * 0.3, 16, 16);
            const knotMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.55, 0.9, 0.6 - i * 0.1),
                transparent: true,
                opacity: 0.7
            });
            const knot = new THREE.Mesh(knotGeom, knotMat);
            knot.position.y = dir * (15 + i * 12);
            knots.push({ mesh: knot, dir: dir, baseY: 15 + i * 12, phase: i * 0.5 });
            group.add(knot);
        }
    }

    // Jet particles
    const jetParticleCount = 300;
    const jetParticleGeom = new THREE.BufferGeometry();
    const jetPositions = new Float32Array(jetParticleCount * 3);
    const jetColors = new Float32Array(jetParticleCount * 3);
    const jetData = [];

    for (let i = 0; i < jetParticleCount; i++) {
        const dir = i < jetParticleCount / 2 ? 1 : -1;
        const dist = Math.random() * 50;
        const spread = (dist / 50) * 5;

        jetPositions[i * 3] = (Math.random() - 0.5) * spread;
        jetPositions[i * 3 + 1] = dir * (5 + dist);
        jetPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

        const color = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6);
        jetColors[i * 3] = color.r;
        jetColors[i * 3 + 1] = color.g;
        jetColors[i * 3 + 2] = color.b;

        jetData.push({
            dir: dir,
            baseDist: dist,
            spread: spread,
            speed: 1 + Math.random() * 2
        });
    }

    jetParticleGeom.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3));
    jetParticleGeom.setAttribute('color', new THREE.BufferAttribute(jetColors, 3));

    const jetParticleMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const jetParticles = new THREE.Points(jetParticleGeom, jetParticleMat);
    group.add(jetParticles);

    // Surrounding molecular cloud
    const cloudGeom = new THREE.SphereGeometry(20, 16, 16);
    const cloudMat = new THREE.MeshBasicMaterial({
        color: 0x331100,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });
    const cloud = new THREE.Mesh(cloudGeom, cloudMat);
    group.add(cloud);

    // Reflection nebulosity
    const reflectionPatches = [];
    for (let i = 0; i < 6; i++) {
        const patchGeom = new THREE.SphereGeometry(5 + Math.random() * 3, 12, 12);
        const patchMat = new THREE.MeshBasicMaterial({
            color: 0x6688cc,
            transparent: true,
            opacity: 0.15
        });
        const patch = new THREE.Mesh(patchGeom, patchMat);
        const angle = (i / 6) * Math.PI * 2;
        patch.position.set(
            Math.cos(angle) * 15,
            (Math.random() - 0.5) * 10,
            Math.sin(angle) * 15
        );
        reflectionPatches.push({ mesh: patch, phase: i * 0.5 });
        group.add(patch);
    }

    // Update function
    group.userData.update = function(time) {
        // Protostar flicker
        protostar.material.opacity = 0.6 + 0.3 * Math.sin(time * 5);

        // Disk rotation
        disk.rotation.z = time * 0.2;

        // Jets pulse
        jets.forEach(j => {
            j.mesh.scale.y = 1 + 0.1 * Math.sin(time * 2);
            j.mesh.material.opacity = 0.4 + 0.2 * Math.sin(time * 3);
        });

        // Knots move outward and reset
        knots.forEach(k => {
            const travel = (time * 3 + k.phase) % 20;
            k.mesh.position.y = k.dir * (k.baseY + travel);
            k.mesh.material.opacity = 0.5 + 0.3 * Math.sin(time * 2 + k.phase);
        });

        // Jet particles stream outward
        const positions = jetParticles.geometry.attributes.position.array;
        jetData.forEach((d, i) => {
            let dist = (d.baseDist + time * d.speed * 5) % 55;
            const spread = (dist / 50) * 5;
            positions[i * 3] = Math.sin(time + i) * spread * 0.5;
            positions[i * 3 + 1] = d.dir * (5 + dist);
            positions[i * 3 + 2] = Math.cos(time + i) * spread * 0.5;
        });
        jetParticles.geometry.attributes.position.needsUpdate = true;

        // Cloud breathes
        cloud.scale.setScalar(1 + 0.05 * Math.sin(time * 0.3));

        // Reflection patches shimmer
        reflectionPatches.forEach(rp => {
            rp.mesh.material.opacity = 0.1 + 0.1 * Math.sin(time * 0.5 + rp.phase);
        });
    };

    return { group };
}
