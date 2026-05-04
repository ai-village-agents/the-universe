// Wolf-Rayet Star - Massive hot star with powerful stellar winds
// By Claude Opus 4.5

export function createWolfRayetStar(THREE) {
    const group = new THREE.Group();

    // Central WR star - intensely hot blue-white core
    const starGeom = new THREE.SphereGeometry(8, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.95
    });
    const star = new THREE.Mesh(starGeom, starMat);
    group.add(star);

    // Hot corona layer
    const coronaGeom = new THREE.SphereGeometry(12, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.4
    });
    const corona = new THREE.Mesh(coronaGeom, coronaMat);
    group.add(corona);

    // Intense stellar wind - expanding shells
    const windShells = [];
    for (let i = 0; i < 6; i++) {
        const shellGeom = new THREE.SphereGeometry(15 + i * 8, 24, 24);
        const shellMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.6, 0.7, 0.5 + i * 0.05),
            transparent: true,
            opacity: 0.15 - i * 0.02,
            side: THREE.DoubleSide,
            wireframe: true
        });
        const shell = new THREE.Mesh(shellGeom, shellMat);
        windShells.push({ mesh: shell, baseRadius: 15 + i * 8, phase: i * 0.5 });
        group.add(shell);
    }

    // Stellar wind particles - high velocity outflow
    const windParticles = [];
    const windCount = 500;
    const windGeom = new THREE.BufferGeometry();
    const windPositions = new Float32Array(windCount * 3);
    const windColors = new Float32Array(windCount * 3);
    const windData = [];

    for (let i = 0; i < windCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 10 + Math.random() * 50;

        windPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        windPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        windPositions[i * 3 + 2] = r * Math.cos(phi);

        // Blue to cyan gradient
        const color = new THREE.Color().setHSL(0.55 + Math.random() * 0.1, 0.8, 0.6 + Math.random() * 0.3);
        windColors[i * 3] = color.r;
        windColors[i * 3 + 1] = color.g;
        windColors[i * 3 + 2] = color.b;

        windData.push({
            theta: theta,
            phi: phi,
            speed: 1 + Math.random() * 2,
            maxR: 60 + Math.random() * 20
        });
    }

    windGeom.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    windGeom.setAttribute('color', new THREE.BufferAttribute(windColors, 3));

    const windMat = new THREE.PointsMaterial({
        size: 1.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const windPoints = new THREE.Points(windGeom, windMat);
    windParticles.push({ points: windPoints, data: windData });
    group.add(windPoints);

    // Emission nebula around the star (enriched by stellar winds)
    const nebulaPatches = [];
    for (let i = 0; i < 8; i++) {
        const patchGeom = new THREE.SphereGeometry(12 + Math.random() * 8, 16, 16);
        const patchMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.75 + Math.random() * 0.1, 0.6, 0.4),
            transparent: true,
            opacity: 0.12
        });
        const patch = new THREE.Mesh(patchGeom, patchMat);
        const angle = (i / 8) * Math.PI * 2;
        const dist = 40 + Math.random() * 20;
        patch.position.set(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 30,
            Math.sin(angle) * dist
        );
        nebulaPatches.push({ mesh: patch, phase: Math.random() * Math.PI * 2 });
        group.add(patch);
    }

    // Spectral emission lines (visual representation)
    const emissionLines = [];
    for (let i = 0; i < 12; i++) {
        const lineGeom = new THREE.CylinderGeometry(0.2, 0.2, 80, 8);
        const lineMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.55 + (i / 12) * 0.15, 1, 0.6),
            transparent: true,
            opacity: 0.3
        });
        const line = new THREE.Mesh(lineGeom, lineMat);
        const angle = (i / 12) * Math.PI * 2;
        line.rotation.x = Math.PI / 2;
        line.rotation.z = angle;
        line.position.set(Math.cos(angle) * 6, 0, Math.sin(angle) * 6);
        emissionLines.push({ mesh: line, angle: angle });
        group.add(line);
    }

    // Companion star orbit indicator (many WR stars are binary)
    const orbitGeom = new THREE.TorusGeometry(55, 0.3, 8, 64);
    const orbitMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.3
    });
    const orbit = new THREE.Mesh(orbitGeom, orbitMat);
    orbit.rotation.x = Math.PI / 2 + 0.3;
    group.add(orbit);

    // Small companion star
    const companionGeom = new THREE.SphereGeometry(3, 16, 16);
    const companionMat = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.9
    });
    const companion = new THREE.Mesh(companionGeom, companionMat);
    group.add(companion);

    // Update function
    group.userData.update = function(time) {
        // Star pulsation
        const pulse = 1 + 0.1 * Math.sin(time * 3);
        star.scale.setScalar(pulse);
        corona.scale.setScalar(pulse * 1.1);

        // Wind shells expand and fade
        windShells.forEach((ws, i) => {
            const expandFactor = 1 + 0.2 * Math.sin(time * 0.5 + ws.phase);
            ws.mesh.scale.setScalar(expandFactor);
            ws.mesh.rotation.y = time * 0.1 * (i % 2 === 0 ? 1 : -1);
        });

        // Wind particles stream outward
        windParticles.forEach(wp => {
            const positions = wp.points.geometry.attributes.position.array;
            wp.data.forEach((d, i) => {
                let r = Math.sqrt(
                    positions[i * 3] ** 2 +
                    positions[i * 3 + 1] ** 2 +
                    positions[i * 3 + 2] ** 2
                );
                r += d.speed * 0.3;
                if (r > d.maxR) r = 10;

                positions[i * 3] = r * Math.sin(d.phi) * Math.cos(d.theta);
                positions[i * 3 + 1] = r * Math.sin(d.phi) * Math.sin(d.theta);
                positions[i * 3 + 2] = r * Math.cos(d.phi);
            });
            wp.points.geometry.attributes.position.needsUpdate = true;
        });

        // Nebula patches drift
        nebulaPatches.forEach(np => {
            np.mesh.material.opacity = 0.08 + 0.06 * Math.sin(time * 0.3 + np.phase);
        });

        // Emission lines rotate
        emissionLines.forEach((el, i) => {
            el.mesh.rotation.y = time * 0.2;
        });

        // Companion star orbits
        const orbitAngle = time * 0.15;
        companion.position.set(
            Math.cos(orbitAngle) * 55,
            Math.sin(0.3) * Math.sin(orbitAngle) * 55,
            Math.sin(orbitAngle) * 55 * Math.cos(0.3)
        );
    };

    return { group };
}
