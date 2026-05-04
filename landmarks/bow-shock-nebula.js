// Bow Shock Nebula - Arc-shaped structure from fast-moving star
// By Claude Opus 4.5

export function createBowShockNebula(THREE) {
    const group = new THREE.Group();

    // Central runaway star
    const starGeom = new THREE.SphereGeometry(4, 32, 32);
    const starMat = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.95
    });
    const star = new THREE.Mesh(starGeom, starMat);
    group.add(star);

    // Star glow
    const glowGeom = new THREE.SphereGeometry(7, 24, 24);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa66,
        transparent: true,
        opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeom, glowMat);
    group.add(glow);

    // Bow shock arc layers
    const shockArcs = [];
    for (let i = 0; i < 5; i++) {
        const arcGeom = new THREE.TorusGeometry(15 + i * 6, 2 - i * 0.3, 8, 32, Math.PI);
        const arcMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.55 + i * 0.03, 0.8, 0.5),
            transparent: true,
            opacity: 0.4 - i * 0.06,
            side: THREE.DoubleSide
        });
        const arc = new THREE.Mesh(arcGeom, arcMat);
        arc.rotation.y = Math.PI / 2;
        arc.position.x = -10 - i * 4;
        shockArcs.push({ mesh: arc, baseX: -10 - i * 4, phase: i * 0.3 });
        group.add(arc);
    }

    // Compressed gas particles in bow shock
    const gasCount = 400;
    const gasGeom = new THREE.BufferGeometry();
    const gasPositions = new Float32Array(gasCount * 3);
    const gasColors = new Float32Array(gasCount * 3);
    const gasData = [];

    for (let i = 0; i < gasCount; i++) {
        // Distribute in arc shape ahead of star
        const arcAngle = (Math.random() - 0.5) * Math.PI;
        const dist = 12 + Math.random() * 30;
        const spread = Math.random() * 8;

        gasPositions[i * 3] = -dist * Math.cos(arcAngle * 0.5) - 8;
        gasPositions[i * 3 + 1] = dist * Math.sin(arcAngle) + (Math.random() - 0.5) * spread;
        gasPositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 2;

        const color = new THREE.Color().setHSL(0.5 + Math.random() * 0.15, 0.7, 0.5 + Math.random() * 0.2);
        gasColors[i * 3] = color.r;
        gasColors[i * 3 + 1] = color.g;
        gasColors[i * 3 + 2] = color.b;

        gasData.push({
            arcAngle: arcAngle,
            baseDist: dist,
            spread: spread,
            speed: 0.5 + Math.random() * 1
        });
    }

    gasGeom.setAttribute('position', new THREE.BufferAttribute(gasPositions, 3));
    gasGeom.setAttribute('color', new THREE.BufferAttribute(gasColors, 3));

    const gasMat = new THREE.PointsMaterial({
        size: 1.0,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    const gas = new THREE.Points(gasGeom, gasMat);
    group.add(gas);

    // Stellar wind streaming behind
    const windCount = 200;
    const windGeom = new THREE.BufferGeometry();
    const windPositions = new Float32Array(windCount * 3);
    const windColors = new Float32Array(windCount * 3);
    const windData = [];

    for (let i = 0; i < windCount; i++) {
        const tailDist = Math.random() * 50;
        const spread = Math.random() * 10 * (tailDist / 50);

        windPositions[i * 3] = tailDist + 5;
        windPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
        windPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

        const color = new THREE.Color().setHSL(0.1, 0.6, 0.6);
        windColors[i * 3] = color.r;
        windColors[i * 3 + 1] = color.g;
        windColors[i * 3 + 2] = color.b;

        windData.push({
            baseTailDist: tailDist,
            spread: spread,
            speed: 1 + Math.random() * 2
        });
    }

    windGeom.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    windGeom.setAttribute('color', new THREE.BufferAttribute(windColors, 3));

    const windMat = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const wind = new THREE.Points(windGeom, windMat);
    group.add(wind);

    // Motion direction indicator
    const arrowGeom = new THREE.ConeGeometry(2, 8, 8);
    const arrowMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.4
    });
    const arrow = new THREE.Mesh(arrowGeom, arrowMat);
    arrow.rotation.z = -Math.PI / 2;
    arrow.position.x = -50;
    group.add(arrow);

    // Interstellar medium background
    const ismGeom = new THREE.SphereGeometry(55, 16, 16);
    const ismMat = new THREE.MeshBasicMaterial({
        color: 0x223344,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const ism = new THREE.Mesh(ismGeom, ismMat);
    group.add(ism);

    // Update function
    group.userData.update = function(time) {
        // Star pulsation
        const pulse = 1 + 0.1 * Math.sin(time * 3);
        star.scale.setScalar(pulse);
        glow.scale.setScalar(pulse * 1.1);

        // Shock arcs ripple
        shockArcs.forEach((sa, i) => {
            sa.mesh.position.x = sa.baseX + Math.sin(time * 2 + sa.phase) * 2;
            sa.mesh.material.opacity = 0.25 + 0.15 * Math.sin(time + sa.phase);
        });

        // Gas particles flow around shock
        const gasPos = gas.geometry.attributes.position.array;
        gasData.forEach((d, i) => {
            const flowAngle = d.arcAngle + time * 0.1;
            const dist = d.baseDist + Math.sin(time * d.speed) * 3;
            gasPos[i * 3] = -dist * Math.cos(flowAngle * 0.5) - 8;
            gasPos[i * 3 + 1] = dist * Math.sin(flowAngle) + Math.sin(time + i) * 2;
        });
        gas.geometry.attributes.position.needsUpdate = true;

        // Wind particles stream backward
        const windPos = wind.geometry.attributes.position.array;
        windData.forEach((d, i) => {
            let tailDist = d.baseTailDist + time * d.speed * 2;
            tailDist = tailDist % 55;
            const spread = d.spread * (tailDist / 50);
            windPos[i * 3] = tailDist + 5;
            windPos[i * 3 + 1] = Math.sin(time + i * 0.1) * spread * 0.5;
            windPos[i * 3 + 2] = Math.cos(time + i * 0.1) * spread * 0.5;
        });
        wind.geometry.attributes.position.needsUpdate = true;

        // Arrow pulses
        arrow.material.opacity = 0.3 + 0.2 * Math.sin(time * 2);
    };

    return { group };
}
