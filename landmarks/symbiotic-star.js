// Symbiotic Star System - white dwarf accreting from red giant companion
// Created by Claude Opus 4.5 for the AI Village Universe

export function createSymbioticStar(THREE) {
    const group = new THREE.Group();

    // Red giant donor star
    const giantGeometry = new THREE.SphereGeometry(10, 32, 32);
    const giantMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4422,
        transparent: true,
        opacity: 0.85
    });
    const redGiant = new THREE.Mesh(giantGeometry, giantMaterial);
    redGiant.position.set(-15, 0, 0);
    group.add(redGiant);

    // Red giant atmosphere layers
    for (let i = 1; i <= 3; i++) {
        const atmosGeometry = new THREE.SphereGeometry(10 + i * 1.5, 24, 24);
        const atmosMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6644,
            transparent: true,
            opacity: 0.15 - i * 0.03
        });
        const atmos = new THREE.Mesh(atmosGeometry, atmosMaterial);
        redGiant.add(atmos);
    }

    // White dwarf accretor
    const dwarfGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const dwarfMaterial = new THREE.MeshBasicMaterial({
        color: 0xeeeeff,
        transparent: true,
        opacity: 0.95
    });
    const whiteDwarf = new THREE.Mesh(dwarfGeometry, dwarfMaterial);
    whiteDwarf.position.set(15, 0, 0);
    group.add(whiteDwarf);

    // White dwarf hot glow
    const glowGeometry = new THREE.SphereGeometry(2.5, 24, 24);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    whiteDwarf.add(glow);

    // Accretion disk around white dwarf
    const diskGeometry = new THREE.RingGeometry(2, 6, 64);
    const diskMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8844,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
    accretionDisk.rotation.x = Math.PI / 2 + 0.3;
    whiteDwarf.add(accretionDisk);

    // Hot inner disk
    const innerDiskGeometry = new THREE.RingGeometry(2, 3.5, 64);
    const innerDiskMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc88,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const innerDisk = new THREE.Mesh(innerDiskGeometry, innerDiskMaterial);
    innerDisk.rotation.x = Math.PI / 2 + 0.3;
    whiteDwarf.add(innerDisk);

    // Mass transfer stream from red giant to white dwarf
    const streamParticles = [];
    for (let i = 0; i < 50; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.2 + Math.random() * 0.2, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6644,
            transparent: true,
            opacity: 0.7
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        group.add(particle);
        streamParticles.push({
            mesh: particle,
            material: particleMaterial,
            t: i / 50,
            speed: 0.008 + Math.random() * 0.004
        });
    }

    // Roche lobe visualization (faint teardrop shape)
    const rochePoints = [];
    for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const r = 12 + 3 * Math.cos(angle);
        rochePoints.push(new THREE.Vector3(
            -15 + r * Math.cos(angle),
            r * Math.sin(angle) * 0.8,
            0
        ));
    }
    const rocheCurve = new THREE.CatmullRomCurve3(rochePoints, true);
    const rocheGeometry = new THREE.TubeGeometry(rocheCurve, 64, 0.15, 8, true);
    const rocheMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8866,
        transparent: true,
        opacity: 0.2
    });
    const rocheLobe = new THREE.Mesh(rocheGeometry, rocheMaterial);
    group.add(rocheLobe);

    // Nova outburst shell (periodic eruption remnant)
    const novaShellGeometry = new THREE.SphereGeometry(8, 24, 24);
    const novaShellMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaaff,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide,
        wireframe: true
    });
    const novaShell = new THREE.Mesh(novaShellGeometry, novaShellMaterial);
    novaShell.position.copy(whiteDwarf.position);
    group.add(novaShell);

    // Jets from accretion (bipolar outflows)
    const jetGeometry = new THREE.ConeGeometry(1, 12, 12, 1, true);
    const jetMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.3
    });
    const jet1 = new THREE.Mesh(jetGeometry, jetMaterial);
    jet1.position.set(0, 8, 0);
    whiteDwarf.add(jet1);

    const jet2 = new THREE.Mesh(jetGeometry.clone(), jetMaterial.clone());
    jet2.position.set(0, -8, 0);
    jet2.rotation.x = Math.PI;
    whiteDwarf.add(jet2);

    // Nova state
    let novaTime = 0;
    let isNova = false;
    let novaCooldown = 0;

    group.userData.update = function(time) {
        // Red giant pulses
        const giantPulse = 1 + 0.05 * Math.sin(time * 0.5);
        redGiant.scale.set(giantPulse, giantPulse, giantPulse);

        // White dwarf hot spot rotation
        whiteDwarf.rotation.y = time * 2;

        // Accretion disk rotation
        accretionDisk.rotation.z = time * 1.5;
        innerDisk.rotation.z = time * 2.5;

        // Mass transfer stream animation (along curved path)
        streamParticles.forEach(p => {
            p.t += p.speed;
            if (p.t > 1) p.t = 0;

            // Curved path from giant to dwarf through L1 point
            const t = p.t;
            const x = -15 + t * 30;
            const y = Math.sin(t * Math.PI) * 5 * (1 - t * 0.5);
            const z = Math.sin(t * Math.PI * 2) * 2;
            p.mesh.position.set(x, y, z);

            // Particles get hotter (brighter) as they approach white dwarf
            p.material.color.setHex(t < 0.7 ? 0xff6644 : 0xffaa66);
            p.material.opacity = 0.5 + t * 0.4;
        });

        // Jets pulse
        const jetPulse = 1 + 0.2 * Math.sin(time * 3);
        jet1.scale.set(jetPulse, 1, jetPulse);
        jet2.scale.set(jetPulse, 1, jetPulse);

        // Nova eruption cycle
        novaCooldown += 0.016;
        if (novaCooldown > 15 && !isNova) {
            isNova = true;
            novaTime = 0;
        }

        if (isNova) {
            novaTime += 0.016;
            const novaProgress = novaTime / 3;

            // Shell expands
            const shellScale = 1 + novaProgress * 10;
            novaShell.scale.set(shellScale, shellScale, shellScale);
            novaShell.position.copy(whiteDwarf.position);
            novaShellMaterial.opacity = Math.max(0, 0.4 * (1 - novaProgress));

            // White dwarf flashes
            dwarfMaterial.color.setHex(novaProgress < 0.2 ? 0xffffff : 0xeeeeff);
            glowMaterial.opacity = 0.4 + 0.5 * Math.max(0, 1 - novaProgress * 2);

            if (novaTime > 3) {
                isNova = false;
                novaCooldown = 0;
                novaShell.scale.set(1, 1, 1);
                novaShellMaterial.opacity = 0;
            }
        }

        // Gentle system rotation
        group.rotation.y = time * 0.05;
    };

    return { group };
}
