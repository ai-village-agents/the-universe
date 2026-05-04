// Magnetar Burst - Ultra-magnetized neutron star with intense X-ray flares
// By Claude Opus 4.5

export function createMagnetarBurst(THREE) {
    const group = new THREE.Group();

    // Central magnetar - small ultra-dense neutron star
    const magnetarGeom = new THREE.SphereGeometry(3, 32, 32);
    const magnetarMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.95
    });
    const magnetar = new THREE.Mesh(magnetarGeom, magnetarMat);
    group.add(magnetar);

    // Magnetar hot spot glow
    const hotspotGeom = new THREE.SphereGeometry(4, 32, 32);
    const hotspotMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4
    });
    const hotspot = new THREE.Mesh(hotspotGeom, hotspotMat);
    group.add(hotspot);

    // Ultra-strong magnetic field lines (dipole pattern)
    const fieldLines = [];
    for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, -30, 0),
            new THREE.Vector3(Math.cos(angle) * 25, -15, Math.sin(angle) * 25),
            new THREE.Vector3(Math.cos(angle) * 35, 0, Math.sin(angle) * 35),
            new THREE.Vector3(Math.cos(angle) * 25, 15, Math.sin(angle) * 25),
            new THREE.Vector3(0, 30, 0)
        ]);
        const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.3, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.5 + (i / 24) * 0.1, 1, 0.6),
            transparent: true,
            opacity: 0.5
        });
        const tube = new THREE.Mesh(tubeGeom, tubeMat);
        fieldLines.push({ mesh: tube, phase: i * 0.2 });
        group.add(tube);
    }

    // X-ray burst particles - ejected during starquakes
    const burstParticles = [];
    const burstCount = 400;
    const burstGeom = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(burstCount * 3);
    const burstColors = new Float32Array(burstCount * 3);
    const burstData = [];

    for (let i = 0; i < burstCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.6; // Concentrated near equator
        const r = 5 + Math.random() * 50;

        burstPositions[i * 3] = r * Math.cos(phi) * Math.cos(theta);
        burstPositions[i * 3 + 1] = r * Math.sin(phi);
        burstPositions[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);

        // X-ray colors: blue to white
        const color = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6 + Math.random() * 0.3);
        burstColors[i * 3] = color.r;
        burstColors[i * 3 + 1] = color.g;
        burstColors[i * 3 + 2] = color.b;

        burstData.push({
            baseR: r,
            theta: theta,
            phi: phi,
            speed: 0.5 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2
        });
    }

    burstGeom.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    burstGeom.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));

    const burstMat = new THREE.PointsMaterial({
        size: 1.2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const burstPoints = new THREE.Points(burstGeom, burstMat);
    burstParticles.push({ points: burstPoints, data: burstData });
    group.add(burstPoints);

    // Magnetar crust cracking energy rings (starquake aftershocks)
    const shockRings = [];
    for (let i = 0; i < 5; i++) {
        const ringGeom = new THREE.TorusGeometry(8 + i * 6, 0.4, 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.6, 1, 0.7),
            transparent: true,
            opacity: 0.4
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        shockRings.push({ mesh: ring, phase: i * 1.2, baseScale: 1 + i * 0.3 });
        group.add(ring);
    }

    // Gamma ray flare jets (brief intense bursts)
    const jets = [];
    for (let dir = -1; dir <= 1; dir += 2) {
        const jetGeom = new THREE.ConeGeometry(3, 40, 16, 1, true);
        const jetMat = new THREE.MeshBasicMaterial({
            color: 0xff00ff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const jet = new THREE.Mesh(jetGeom, jetMat);
        jet.position.y = dir * 22;
        jet.rotation.x = dir > 0 ? 0 : Math.PI;
        jets.push({ mesh: jet, dir: dir });
        group.add(jet);
    }

    // Magnetosphere plasma shell
    const shellGeom = new THREE.SphereGeometry(45, 32, 32);
    const shellMat = new THREE.MeshBasicMaterial({
        color: 0x4444ff,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide
    });
    const shell = new THREE.Mesh(shellGeom, shellMat);
    group.add(shell);

    // Crustal hotspot indicators
    const hotspots = [];
    for (let i = 0; i < 6; i++) {
        const spotGeom = new THREE.SphereGeometry(1.5, 16, 16);
        const spotMat = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.7
        });
        const spot = new THREE.Mesh(spotGeom, spotMat);
        const lat = (Math.random() - 0.5) * Math.PI * 0.8;
        const lon = Math.random() * Math.PI * 2;
        spot.position.set(
            4 * Math.cos(lat) * Math.cos(lon),
            4 * Math.sin(lat),
            4 * Math.cos(lat) * Math.sin(lon)
        );
        hotspots.push({ mesh: spot, phase: Math.random() * Math.PI * 2 });
        group.add(spot);
    }

    // Update function for animations
    group.userData.update = function(time) {
        // Magnetar core pulsation
        const corePulse = 1 + 0.15 * Math.sin(time * 8);
        magnetar.scale.setScalar(corePulse);
        hotspot.scale.setScalar(corePulse * 1.2);

        // Field line shimmer
        fieldLines.forEach((fl, i) => {
            fl.mesh.material.opacity = 0.3 + 0.3 * Math.sin(time * 2 + fl.phase);
        });

        // X-ray burst particles - outward expansion with periodic bursts
        const burstCycle = (time % 8) / 8; // 8-second burst cycle
        const burstIntensity = burstCycle < 0.2 ? Math.sin(burstCycle * Math.PI / 0.2) : 0.2;

        burstParticles.forEach(bp => {
            const positions = bp.points.geometry.attributes.position.array;
            bp.data.forEach((d, i) => {
                const expandR = d.baseR + (burstIntensity * 30) * Math.sin(time * d.speed + d.phase);
                positions[i * 3] = expandR * Math.cos(d.phi) * Math.cos(d.theta + time * 0.3);
                positions[i * 3 + 1] = expandR * Math.sin(d.phi);
                positions[i * 3 + 2] = expandR * Math.cos(d.phi) * Math.sin(d.theta + time * 0.3);
            });
            bp.points.geometry.attributes.position.needsUpdate = true;
            bp.points.material.opacity = 0.4 + burstIntensity * 0.5;
        });

        // Shock rings expand outward during bursts
        shockRings.forEach((sr, i) => {
            const ringExpand = 1 + burstIntensity * 0.5 * Math.sin(time * 3 + sr.phase);
            sr.mesh.scale.setScalar(sr.baseScale * ringExpand);
            sr.mesh.material.opacity = 0.2 + burstIntensity * 0.5;
        });

        // Gamma ray jets flicker during bursts
        jets.forEach(j => {
            j.mesh.material.opacity = 0.2 + burstIntensity * 0.6;
            j.mesh.scale.y = 1 + burstIntensity * 0.5;
        });

        // Hotspot flicker
        hotspots.forEach(hs => {
            hs.mesh.material.opacity = 0.4 + 0.5 * Math.sin(time * 10 + hs.phase);
        });

        // Shell breathes
        shell.scale.setScalar(1 + 0.05 * Math.sin(time * 0.5));
    };

    return { group };
}
