// Dark Matter Halo - Invisible gravitational structure surrounding galaxies
// Created by Claude Opus 4.5 - Day 398

export function createDarkMatterHalo(THREE) {
    const group = new THREE.Group();

    // Central "seed" galaxy - faint spiral
    const galaxyGeometry = new THREE.SphereGeometry(8, 32, 32);
    const galaxyMaterial = new THREE.MeshBasicMaterial({
        color: 0x4466aa,
        transparent: true,
        opacity: 0.4
    });
    const galaxyCore = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    group.add(galaxyCore);

    // Faint galaxy disk
    const diskGeometry = new THREE.TorusGeometry(15, 3, 8, 64);
    const diskMaterial = new THREE.MeshBasicMaterial({
        color: 0x6688cc,
        transparent: true,
        opacity: 0.25
    });
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);

    // Dark matter particles - wispy blue-purple distribution
    const dmParticles = 800;
    const dmPositions = new Float32Array(dmParticles * 3);
    const dmColors = new Float32Array(dmParticles * 3);
    const dmSizes = new Float32Array(dmParticles);

    // NFW density profile - more particles near center, extending to virial radius
    for (let i = 0; i < dmParticles; i++) {
        // NFW-like radial distribution
        const u = Math.random();
        const r = 20 + 80 * Math.pow(u, 0.3); // More particles at intermediate radii

        // Spherical distribution with slight triaxiality
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const triaxial = 1 + 0.1 * Math.sin(3 * theta); // Slight asymmetry

        dmPositions[i * 3] = r * triaxial * Math.sin(phi) * Math.cos(theta);
        dmPositions[i * 3 + 1] = r * 0.9 * Math.sin(phi) * Math.sin(theta);
        dmPositions[i * 3 + 2] = r * triaxial * Math.cos(phi);

        // Color: deep blue to purple, fading with distance
        const distFade = 1 - (r - 20) / 100;
        dmColors[i * 3] = 0.2 + 0.2 * Math.random(); // R - hints of purple
        dmColors[i * 3 + 1] = 0.1 + 0.1 * Math.random(); // G - very low
        dmColors[i * 3 + 2] = 0.5 + 0.3 * Math.random() * distFade; // B - dominant blue

        dmSizes[i] = 1.5 + Math.random() * 2;
    }

    const dmGeometry = new THREE.BufferGeometry();
    dmGeometry.setAttribute('position', new THREE.BufferAttribute(dmPositions, 3));
    dmGeometry.setAttribute('color', new THREE.BufferAttribute(dmColors, 3));
    dmGeometry.setAttribute('size', new THREE.BufferAttribute(dmSizes, 1));

    const dmMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });

    const dmCloud = new THREE.Points(dmGeometry, dmMaterial);
    group.add(dmCloud);

    // Subhalo clumps - denser dark matter concentrations
    const subhalos = [];
    for (let i = 0; i < 12; i++) {
        const clumpGeometry = new THREE.SphereGeometry(5 + Math.random() * 5, 16, 16);
        const clumpMaterial = new THREE.MeshBasicMaterial({
            color: 0x3344aa,
            transparent: true,
            opacity: 0.15,
            wireframe: true
        });
        const clump = new THREE.Mesh(clumpGeometry, clumpMaterial);

        const r = 40 + Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        clump.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );

        clump.userData.orbitSpeed = 0.1 + Math.random() * 0.2;
        clump.userData.orbitAxis = new THREE.Vector3(
            Math.random() - 0.5,
            Math.random() - 0.5,
            Math.random() - 0.5
        ).normalize();

        subhalos.push(clump);
        group.add(clump);
    }

    // Gravitational lensing rings - showing warped spacetime
    const lensRings = [];
    for (let i = 0; i < 5; i++) {
        const ringRadius = 25 + i * 15;
        const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.3, 8, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x6677ff,
            transparent: true,
            opacity: 0.1 - i * 0.015
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2 + Math.random() * 0.2;
        ring.rotation.z = Math.random() * 0.3;
        lensRings.push(ring);
        group.add(ring);
    }

    // Density caustics - bright filaments showing matter flow
    const caustics = [];
    for (let i = 0; i < 6; i++) {
        const points = [];
        const startAngle = (i / 6) * Math.PI * 2;

        for (let j = 0; j < 20; j++) {
            const r = 30 + j * 3;
            const angle = startAngle + j * 0.1;
            const z = (Math.random() - 0.5) * 10;
            points.push(new THREE.Vector3(
                r * Math.cos(angle),
                z,
                r * Math.sin(angle)
            ));
        }

        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 30, 0.5, 8, false);
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x8899ff,
            transparent: true,
            opacity: 0.2
        });
        const caustic = new THREE.Mesh(tubeGeometry, tubeMaterial);
        caustics.push(caustic);
        group.add(caustic);
    }

    // Virial boundary - faint outer shell
    const virialGeometry = new THREE.SphereGeometry(100, 32, 32);
    const virialMaterial = new THREE.MeshBasicMaterial({
        color: 0x2233aa,
        transparent: true,
        opacity: 0.05,
        wireframe: true,
        side: THREE.BackSide
    });
    const virialSphere = new THREE.Mesh(virialGeometry, virialMaterial);
    group.add(virialSphere);

    // Inner glow light
    const dmLight = new THREE.PointLight(0x4455bb, 0.5, 150);
    group.add(dmLight);

    // Animation
    group.userData.update = function(time) {
        // Slow rotation of entire halo
        group.rotation.y = time * 0.02;

        // Particle shimmer - dark matter "flickers" as if barely detectable
        const positions = dmCloud.geometry.attributes.position.array;
        for (let i = 0; i < dmParticles; i++) {
            const shimmer = Math.sin(time * 2 + i * 0.1) * 0.5;
            // Subtle radial oscillation
            const idx = i * 3;
            const dx = positions[idx];
            const dy = positions[idx + 1];
            const dz = positions[idx + 2];
            const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (dist > 0) {
                const factor = 1 + shimmer * 0.01;
                // Don't modify original - just let opacity handle the flicker
            }
        }

        // Opacity flicker for dark matter cloud
        dmMaterial.opacity = 0.25 + 0.1 * Math.sin(time * 0.5);

        // Subhalo orbital motion
        subhalos.forEach((subhalo, i) => {
            const angle = time * subhalo.userData.orbitSpeed;
            const axis = subhalo.userData.orbitAxis;
            const currentPos = subhalo.position.clone();
            currentPos.applyAxisAngle(axis, 0.001);
            subhalo.position.copy(currentPos);

            // Subhalo breathing
            const scale = 1 + 0.1 * Math.sin(time + i);
            subhalo.scale.setScalar(scale);
        });

        // Lensing ring pulse
        lensRings.forEach((ring, i) => {
            ring.material.opacity = 0.08 + 0.04 * Math.sin(time * 0.3 + i * 0.5);
            ring.rotation.z += 0.001 * (i % 2 === 0 ? 1 : -1);
        });

        // Caustic glow
        caustics.forEach((caustic, i) => {
            caustic.material.opacity = 0.15 + 0.1 * Math.sin(time * 0.4 + i);
        });

        // Galaxy core pulse
        galaxyCore.material.opacity = 0.35 + 0.1 * Math.sin(time * 0.8);

        // Light intensity variation
        dmLight.intensity = 0.4 + 0.2 * Math.sin(time * 0.6);

        // Virial boundary shimmer
        virialMaterial.opacity = 0.04 + 0.02 * Math.sin(time * 0.2);
    };

    return { group };
}
