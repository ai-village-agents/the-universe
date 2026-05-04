// Primordial Black Hole - Ancient black hole from the early universe
// By Claude Opus 4.5

export function createPrimordialBlackHole(THREE) {
    const group = new THREE.Group();

    // Event horizon - small but ancient
    const horizonGeom = new THREE.SphereGeometry(4, 32, 32);
    const horizonMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: false
    });
    const horizon = new THREE.Mesh(horizonGeom, horizonMat);
    group.add(horizon);

    // Photon sphere glow
    const photonGeom = new THREE.SphereGeometry(6, 32, 32);
    const photonMat = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.3
    });
    const photonSphere = new THREE.Mesh(photonGeom, photonMat);
    group.add(photonSphere);

    // Ancient accretion - faint remnant disk
    const diskLayers = [];
    for (let i = 0; i < 3; i++) {
        const diskGeom = new THREE.TorusGeometry(10 + i * 4, 1.5 - i * 0.3, 8, 64);
        const diskMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.05 + i * 0.02, 0.8, 0.4),
            transparent: true,
            opacity: 0.4 - i * 0.1
        });
        const disk = new THREE.Mesh(diskGeom, diskMat);
        disk.rotation.x = Math.PI / 2;
        diskLayers.push({ mesh: disk, speed: 0.3 - i * 0.05 });
        group.add(disk);
    }

    // Hawking radiation particles (theoretical emission)
    const hawkingCount = 200;
    const hawkingGeom = new THREE.BufferGeometry();
    const hawkingPositions = new Float32Array(hawkingCount * 3);
    const hawkingColors = new Float32Array(hawkingCount * 3);
    const hawkingData = [];

    for (let i = 0; i < hawkingCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 5 + Math.random() * 30;

        hawkingPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        hawkingPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        hawkingPositions[i * 3 + 2] = r * Math.cos(phi);

        // Quantum colors - violet to white
        const color = new THREE.Color().setHSL(0.75 + Math.random() * 0.15, 0.6, 0.6 + Math.random() * 0.3);
        hawkingColors[i * 3] = color.r;
        hawkingColors[i * 3 + 1] = color.g;
        hawkingColors[i * 3 + 2] = color.b;

        hawkingData.push({
            theta: theta,
            phi: phi,
            baseR: r,
            speed: 0.5 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2
        });
    }

    hawkingGeom.setAttribute('position', new THREE.BufferAttribute(hawkingPositions, 3));
    hawkingGeom.setAttribute('color', new THREE.BufferAttribute(hawkingColors, 3));

    const hawkingMat = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const hawkingParticles = new THREE.Points(hawkingGeom, hawkingMat);
    group.add(hawkingParticles);

    // Gravitational lensing rings
    const lensRings = [];
    for (let i = 0; i < 4; i++) {
        const ringGeom = new THREE.TorusGeometry(8 + i * 5, 0.15, 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xffaa66,
            transparent: true,
            opacity: 0.25 - i * 0.05
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2 + i * 0.2;
        ring.rotation.y = i * 0.3;
        lensRings.push({ mesh: ring, rotSpeed: 0.1 + i * 0.02 });
        group.add(ring);
    }

    // Cosmic microwave background distortion indicator
    const cmbGeom = new THREE.SphereGeometry(40, 24, 24);
    const cmbMat = new THREE.MeshBasicMaterial({
        color: 0x332211,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        wireframe: true
    });
    const cmb = new THREE.Mesh(cmbGeom, cmbMat);
    group.add(cmb);

    // Time dilation rings (showing extreme gravity)
    const timeRings = [];
    for (let i = 0; i < 3; i++) {
        const tGeom = new THREE.TorusGeometry(15 + i * 8, 0.1, 8, 64);
        const tMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.15
        });
        const tRing = new THREE.Mesh(tGeom, tMat);
        tRing.rotation.x = Math.PI / 2;
        timeRings.push({ mesh: tRing, phase: i * 1.5 });
        group.add(tRing);
    }

    // Ancient age indicator - faint background glow
    const ancientGeom = new THREE.SphereGeometry(35, 16, 16);
    const ancientMat = new THREE.MeshBasicMaterial({
        color: 0x220011,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const ancient = new THREE.Mesh(ancientGeom, ancientMat);
    group.add(ancient);

    // Update function
    group.userData.update = function(time) {
        // Photon sphere pulse
        photonSphere.scale.setScalar(1 + 0.1 * Math.sin(time * 2));
        photonSphere.material.opacity = 0.2 + 0.15 * Math.sin(time * 3);

        // Disk rotation
        diskLayers.forEach(dl => {
            dl.mesh.rotation.z = time * dl.speed;
        });

        // Hawking radiation - particles emerge from near horizon
        const positions = hawkingParticles.geometry.attributes.position.array;
        hawkingData.forEach((d, i) => {
            // Particles slowly drift outward, then respawn near horizon
            let r = d.baseR + Math.sin(time * d.speed + d.phase) * 10;
            if (r < 5) r = 5 + Math.random() * 5;

            positions[i * 3] = r * Math.sin(d.phi) * Math.cos(d.theta + time * 0.1);
            positions[i * 3 + 1] = r * Math.sin(d.phi) * Math.sin(d.theta + time * 0.1);
            positions[i * 3 + 2] = r * Math.cos(d.phi);
        });
        hawkingParticles.geometry.attributes.position.needsUpdate = true;

        // Lensing rings wobble
        lensRings.forEach(lr => {
            lr.mesh.rotation.z = time * lr.rotSpeed;
        });

        // CMB distortion rotates slowly
        cmb.rotation.y = time * 0.02;
        cmb.rotation.x = Math.sin(time * 0.1) * 0.1;

        // Time dilation rings pulse
        timeRings.forEach(tr => {
            tr.mesh.scale.setScalar(1 + 0.1 * Math.sin(time * 0.5 + tr.phase));
            tr.mesh.material.opacity = 0.1 + 0.1 * Math.sin(time + tr.phase);
        });
    };

    return { group };
}
