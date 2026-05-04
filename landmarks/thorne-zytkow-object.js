// Thorne-Zytkow Object - Neutron star core inside a red giant envelope
// By Claude Opus 4.5

export function createThorneZytkowObject(THREE) {
    const group = new THREE.Group();

    // Inner neutron star core
    const neutronGeom = new THREE.SphereGeometry(2, 32, 32);
    const neutronMat = new THREE.MeshBasicMaterial({
        color: 0x88ffff,
        transparent: true,
        opacity: 0.9
    });
    const neutronStar = new THREE.Mesh(neutronGeom, neutronMat);
    group.add(neutronStar);

    // Neutron star glow
    const nsGlowGeom = new THREE.SphereGeometry(4, 24, 24);
    const nsGlowMat = new THREE.MeshBasicMaterial({
        color: 0x66ddff,
        transparent: true,
        opacity: 0.4
    });
    const nsGlow = new THREE.Mesh(nsGlowGeom, nsGlowMat);
    group.add(nsGlow);

    // Red giant envelope layers
    const envelopeLayers = [];
    const colors = [0xff3300, 0xff5500, 0xff7700, 0xff9944];
    for (let i = 0; i < 4; i++) {
        const envGeom = new THREE.SphereGeometry(12 + i * 8, 24, 24);
        const envMat = new THREE.MeshBasicMaterial({
            color: colors[i],
            transparent: true,
            opacity: 0.2 - i * 0.03,
            side: THREE.DoubleSide
        });
        const env = new THREE.Mesh(envGeom, envMat);
        envelopeLayers.push({ mesh: env, baseRadius: 12 + i * 8 });
        group.add(env);
    }

    // Convection cells on surface
    const convectionCells = [];
    for (let i = 0; i < 15; i++) {
        const cellGeom = new THREE.SphereGeometry(4 + Math.random() * 3, 12, 12);
        const cellMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.05 + Math.random() * 0.03, 0.9, 0.55),
            transparent: true,
            opacity: 0.4
        });
        const cell = new THREE.Mesh(cellGeom, cellMat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 35;
        cell.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        convectionCells.push({ mesh: cell, theta: theta, phi: phi, phase: Math.random() * Math.PI * 2 });
        group.add(cell);
    }

    // Matter accretion onto neutron star (from envelope)
    const accretionCount = 200;
    const accretionGeom = new THREE.BufferGeometry();
    const accretionPositions = new Float32Array(accretionCount * 3);
    const accretionColors = new Float32Array(accretionCount * 3);
    const accretionData = [];

    for (let i = 0; i < accretionCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const r = 5 + Math.random() * 25;

        accretionPositions[i * 3] = r * Math.cos(theta);
        accretionPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        accretionPositions[i * 3 + 2] = r * Math.sin(theta);

        const color = new THREE.Color().setHSL(0.55, 0.8, 0.6);
        accretionColors[i * 3] = color.r;
        accretionColors[i * 3 + 1] = color.g;
        accretionColors[i * 3 + 2] = color.b;

        accretionData.push({
            theta: theta,
            baseR: r,
            speed: 0.5 + Math.random() * 1.5
        });
    }

    accretionGeom.setAttribute('position', new THREE.BufferAttribute(accretionPositions, 3));
    accretionGeom.setAttribute('color', new THREE.BufferAttribute(accretionColors, 3));

    const accretionMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const accretion = new THREE.Points(accretionGeom, accretionMat);
    group.add(accretion);

    // X-ray emission indicator rings
    const xrayRings = [];
    for (let i = 0; i < 3; i++) {
        const ringGeom = new THREE.TorusGeometry(6 + i * 3, 0.2, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        xrayRings.push({ mesh: ring, phase: i * 0.7 });
        group.add(ring);
    }

    // Stellar wind from red giant
    const windCount = 150;
    const windGeom = new THREE.BufferGeometry();
    const windPositions = new Float32Array(windCount * 3);
    const windColors = new Float32Array(windCount * 3);
    const windData = [];

    for (let i = 0; i < windCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 35 + Math.random() * 20;

        windPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        windPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        windPositions[i * 3 + 2] = r * Math.cos(phi);

        const color = new THREE.Color().setHSL(0.08, 0.7, 0.5);
        windColors[i * 3] = color.r;
        windColors[i * 3 + 1] = color.g;
        windColors[i * 3 + 2] = color.b;

        windData.push({
            theta: theta,
            phi: phi,
            baseR: r,
            speed: 0.3 + Math.random() * 0.5
        });
    }

    windGeom.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    windGeom.setAttribute('color', new THREE.BufferAttribute(windColors, 3));

    const windMat = new THREE.PointsMaterial({
        size: 0.6,
        vertexColors: true,
        transparent: true,
        opacity: 0.5
    });
    const wind = new THREE.Points(windGeom, windMat);
    group.add(wind);

    // Update function
    group.userData.update = function(time) {
        // Neutron star rapid spin
        neutronStar.rotation.y = time * 10;
        const nsPulse = 1 + 0.2 * Math.sin(time * 15);
        neutronStar.scale.setScalar(nsPulse);
        nsGlow.scale.setScalar(nsPulse * 1.2);

        // Envelope layers breathe
        envelopeLayers.forEach((el, i) => {
            const breathe = 1 + 0.05 * Math.sin(time * 0.3 + i * 0.5);
            el.mesh.scale.setScalar(breathe);
        });

        // Convection cells bubble
        convectionCells.forEach(cc => {
            cc.mesh.material.opacity = 0.3 + 0.2 * Math.sin(time * 2 + cc.phase);
            const r = 35 + 3 * Math.sin(time + cc.phase);
            cc.mesh.position.set(
                r * Math.sin(cc.phi) * Math.cos(cc.theta + time * 0.05),
                r * Math.sin(cc.phi) * Math.sin(cc.theta + time * 0.05),
                r * Math.cos(cc.phi)
            );
        });

        // Accretion spirals inward
        const accPos = accretion.geometry.attributes.position.array;
        accretionData.forEach((d, i) => {
            let r = d.baseR - (time * d.speed * 2) % 25;
            if (r < 5) r = 30;
            const theta = d.theta + time * 0.5;
            accPos[i * 3] = r * Math.cos(theta);
            accPos[i * 3 + 1] = Math.sin(time * 2 + i) * 3;
            accPos[i * 3 + 2] = r * Math.sin(theta);
        });
        accretion.geometry.attributes.position.needsUpdate = true;

        // X-ray rings pulse
        xrayRings.forEach(xr => {
            xr.mesh.scale.setScalar(1 + 0.2 * Math.sin(time * 5 + xr.phase));
            xr.mesh.material.opacity = 0.2 + 0.2 * Math.sin(time * 8 + xr.phase);
        });

        // Stellar wind expands
        const windPos = wind.geometry.attributes.position.array;
        windData.forEach((d, i) => {
            let r = d.baseR + (time * d.speed * 3) % 25;
            if (r > 60) r = 35;
            windPos[i * 3] = r * Math.sin(d.phi) * Math.cos(d.theta);
            windPos[i * 3 + 1] = r * Math.sin(d.phi) * Math.sin(d.theta);
            windPos[i * 3 + 2] = r * Math.cos(d.phi);
        });
        wind.geometry.attributes.position.needsUpdate = true;
    };

    return { group };
}
