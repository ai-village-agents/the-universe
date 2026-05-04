// Planetary Nebula - A dying star's beautiful remnant
// White dwarf core surrounded by expanding gas shells

export function createPlanetaryNebula(THREE) {
    const group = new THREE.Group();

    // White dwarf core (hot, dense stellar remnant)
    const coreGeometry = new THREE.SphereGeometry(5, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xccddff,
        transparent: true,
        opacity: 0.95
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Inner glow
    const innerGlow = new THREE.Mesh(
        new THREE.SphereGeometry(8, 24, 24),
        new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.4
        })
    );
    group.add(innerGlow);

    // Intense UV light from white dwarf
    const coreLight = new THREE.PointLight(0xaaccff, 3, 150);
    group.add(coreLight);

    // Inner ionized shell (bright ring)
    const innerShellGeometry = new THREE.TorusGeometry(25, 8, 16, 64);
    const innerShellMaterial = new THREE.MeshBasicMaterial({
        color: 0x44ff88,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    });
    const innerShell = new THREE.Mesh(innerShellGeometry, innerShellMaterial);
    innerShell.rotation.x = Math.PI / 2;
    group.add(innerShell);

    // Outer expanding shell
    const outerShellGeometry = new THREE.TorusGeometry(50, 15, 16, 64);
    const outerShellMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6688,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide
    });
    const outerShell = new THREE.Mesh(outerShellGeometry, outerShellMaterial);
    outerShell.rotation.x = Math.PI / 2;
    group.add(outerShell);

    // Bipolar lobes (hourglass shape common in planetary nebulae)
    const lobeGeometry = new THREE.ConeGeometry(20, 60, 16, 1, true);
    const lobeMaterialTop = new THREE.MeshBasicMaterial({
        color: 0x6688ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const lobeMaterialBottom = new THREE.MeshBasicMaterial({
        color: 0x8866ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    const lobeTop = new THREE.Mesh(lobeGeometry, lobeMaterialTop);
    const lobeBottom = new THREE.Mesh(lobeGeometry, lobeMaterialBottom);
    lobeTop.position.y = 40;
    lobeBottom.position.y = -40;
    lobeBottom.rotation.z = Math.PI;
    group.add(lobeTop, lobeBottom);

    // Ionization front particles (glowing gas)
    const ionParticleCount = 500;
    const ionGeometry = new THREE.BufferGeometry();
    const ionPositions = new Float32Array(ionParticleCount * 3);
    const ionColors = new Float32Array(ionParticleCount * 3);
    const ionData = [];

    for (let i = 0; i < ionParticleCount; i++) {
        // Distribute in shells and lobes
        const region = Math.random();
        let x, y, z, r, g, b;

        if (region < 0.4) {
            // Inner shell
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 15;
            const height = (Math.random() - 0.5) * 10;
            x = Math.cos(angle) * radius;
            y = height;
            z = Math.sin(angle) * radius;
            r = 0.3; g = 1.0; b = 0.6; // Green OIII
        } else if (region < 0.7) {
            // Outer shell
            const angle = Math.random() * Math.PI * 2;
            const radius = 40 + Math.random() * 25;
            const height = (Math.random() - 0.5) * 20;
            x = Math.cos(angle) * radius;
            y = height;
            z = Math.sin(angle) * radius;
            r = 1.0; g = 0.4; b = 0.5; // Red H-alpha
        } else {
            // Bipolar lobes
            const lobe = Math.random() < 0.5 ? 1 : -1;
            const angle = Math.random() * Math.PI * 2;
            const height = (20 + Math.random() * 50) * lobe;
            const radius = Math.abs(height) * 0.3 * (1 - Math.random() * 0.3);
            x = Math.cos(angle) * radius;
            y = height;
            z = Math.sin(angle) * radius;
            r = 0.5; g = 0.5; b = 1.0; // Blue
        }

        ionPositions[i * 3] = x;
        ionPositions[i * 3 + 1] = y;
        ionPositions[i * 3 + 2] = z;

        ionColors[i * 3] = r;
        ionColors[i * 3 + 1] = g;
        ionColors[i * 3 + 2] = b;

        ionData.push({
            baseX: x, baseY: y, baseZ: z,
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random()
        });
    }

    ionGeometry.setAttribute('position', new THREE.BufferAttribute(ionPositions, 3));
    ionGeometry.setAttribute('color', new THREE.BufferAttribute(ionColors, 3));

    const ionMaterial = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const ionPoints = new THREE.Points(ionGeometry, ionMaterial);
    group.add(ionPoints);

    // Radial streamers (fast-moving knots)
    const streamerCount = 12;
    const streamers = [];

    for (let i = 0; i < streamerCount; i++) {
        const angle = (i / streamerCount) * Math.PI * 2;
        const length = 30 + Math.random() * 20;

        const streamerGeom = new THREE.BufferGeometry();
        const streamerPositions = new Float32Array(20 * 3);

        for (let j = 0; j < 20; j++) {
            const t = j / 19;
            const radius = 20 + t * length;
            const spread = t * 5;
            streamerPositions[j * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
            streamerPositions[j * 3 + 1] = (Math.random() - 0.5) * spread;
            streamerPositions[j * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
        }

        streamerGeom.setAttribute('position', new THREE.BufferAttribute(streamerPositions, 3));

        const streamerMat = new THREE.PointsMaterial({
            size: 1.5,
            color: new THREE.Color().setHSL(0.5 + Math.random() * 0.3, 0.8, 0.6),
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const streamer = new THREE.Points(streamerGeom, streamerMat);
        streamer.userData = { angle, baseLength: length, phase: Math.random() * Math.PI * 2 };
        streamers.push(streamer);
        group.add(streamer);
    }

    // Dust lanes (dark absorption features)
    const dustGeometry = new THREE.TorusGeometry(35, 3, 8, 32);
    const dustMaterial = new THREE.MeshBasicMaterial({
        color: 0x221122,
        transparent: true,
        opacity: 0.4
    });
    const dustLane = new THREE.Mesh(dustGeometry, dustMaterial);
    dustLane.rotation.x = Math.PI / 2;
    dustLane.rotation.z = Math.PI / 6;
    group.add(dustLane);

    // Second dust lane perpendicular
    const dustLane2 = new THREE.Mesh(dustGeometry.clone(), dustMaterial.clone());
    dustLane2.rotation.x = Math.PI / 2;
    dustLane2.rotation.z = -Math.PI / 6;
    dustLane2.rotation.y = Math.PI / 3;
    group.add(dustLane2);

    group.userData.update = function(time) {
        // White dwarf pulsation
        const pulse = 1 + Math.sin(time * 2) * 0.05;
        core.scale.setScalar(pulse);
        innerGlow.scale.setScalar(pulse * 1.1);
        coreLight.intensity = 2.5 + Math.sin(time * 2) * 0.5;

        // Shell breathing
        const breathe = 1 + Math.sin(time * 0.5) * 0.03;
        innerShell.scale.setScalar(breathe);
        outerShell.scale.setScalar(breathe * 0.98);

        // Lobe pulsation
        const lobePulse = 1 + Math.sin(time * 0.7) * 0.05;
        lobeTop.scale.set(lobePulse, 1, lobePulse);
        lobeBottom.scale.set(lobePulse, 1, lobePulse);

        // Ionized gas shimmer
        const ionPos = ionPoints.geometry.attributes.position.array;
        for (let i = 0; i < ionParticleCount; i++) {
            const d = ionData[i];
            const shimmer = Math.sin(time * d.speed + d.phase) * 2;
            ionPos[i * 3] = d.baseX + shimmer * 0.3;
            ionPos[i * 3 + 1] = d.baseY + shimmer * 0.2;
            ionPos[i * 3 + 2] = d.baseZ + shimmer * 0.3;
        }
        ionPoints.geometry.attributes.position.needsUpdate = true;

        // Streamer flicker
        for (const s of streamers) {
            const flicker = 0.4 + Math.sin(time * 3 + s.userData.phase) * 0.3;
            s.material.opacity = flicker;
        }

        // Slow rotation of dust lanes
        dustLane.rotation.z = Math.PI / 6 + time * 0.02;
        dustLane2.rotation.z = -Math.PI / 6 - time * 0.015;

        // Overall slow rotation
        group.rotation.y = time * 0.05;
    };

    return { group };
}
