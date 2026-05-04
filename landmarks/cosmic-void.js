// Cosmic Void - Vast empty region in the cosmic web
// By Claude Opus 4.5

export function createCosmicVoid(THREE) {
    const group = new THREE.Group();

    // Central void boundary sphere (subtle, almost invisible)
    const voidGeom = new THREE.SphereGeometry(60, 32, 32);
    const voidMat = new THREE.MeshBasicMaterial({
        color: 0x111122,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const voidSphere = new THREE.Mesh(voidGeom, voidMat);
    group.add(voidSphere);

    // Sparse cold dark matter particles inside void
    const darkMatterCount = 150;
    const dmGeom = new THREE.BufferGeometry();
    const dmPositions = new Float32Array(darkMatterCount * 3);
    const dmColors = new Float32Array(darkMatterCount * 3);

    for (let i = 0; i < darkMatterCount; i++) {
        const r = Math.random() * 55;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        dmPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        dmPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        dmPositions[i * 3 + 2] = r * Math.cos(phi);

        // Very dim purple-blue
        dmColors[i * 3] = 0.2;
        dmColors[i * 3 + 1] = 0.15;
        dmColors[i * 3 + 2] = 0.3;
    }

    dmGeom.setAttribute('position', new THREE.BufferAttribute(dmPositions, 3));
    dmGeom.setAttribute('color', new THREE.BufferAttribute(dmColors, 3));

    const dmMat = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.4
    });
    const darkMatter = new THREE.Points(dmGeom, dmMat);
    group.add(darkMatter);

    // Edge galaxies - sparse at void boundary
    const edgeGalaxies = [];
    for (let i = 0; i < 12; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 55 + Math.random() * 15;

        // Small galaxy representation
        const galaxyGroup = new THREE.Group();

        // Galaxy core
        const coreGeom = new THREE.SphereGeometry(2, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.5, 0.6),
            transparent: true,
            opacity: 0.7
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        galaxyGroup.add(core);

        // Galaxy disk
        const diskGeom = new THREE.RingGeometry(3, 8, 32);
        const diskMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.6, 0.4, 0.5),
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const disk = new THREE.Mesh(diskGeom, diskMat);
        disk.rotation.x = Math.random() * Math.PI;
        disk.rotation.y = Math.random() * Math.PI;
        galaxyGroup.add(disk);

        galaxyGroup.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );

        edgeGalaxies.push({ group: galaxyGroup, phase: Math.random() * Math.PI * 2 });
        group.add(galaxyGroup);
    }

    // Cosmic filaments connecting to void edges
    const filaments = [];
    for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2 + Math.random() * 0.3;
        const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.5;

        const startR = 60;
        const endR = 90;

        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(
                startR * Math.sin(phi) * Math.cos(theta),
                startR * Math.sin(phi) * Math.sin(theta),
                startR * Math.cos(phi)
            ),
            new THREE.Vector3(
                (startR + endR) / 2 * Math.sin(phi + 0.1) * Math.cos(theta + 0.1),
                (startR + endR) / 2 * Math.sin(phi + 0.1) * Math.sin(theta + 0.1),
                (startR + endR) / 2 * Math.cos(phi + 0.1)
            ),
            new THREE.Vector3(
                endR * Math.sin(phi + 0.2) * Math.cos(theta + 0.2),
                endR * Math.sin(phi + 0.2) * Math.sin(theta + 0.2),
                endR * Math.cos(phi + 0.2)
            )
        ]);

        const tubeGeom = new THREE.TubeGeometry(curve, 20, 0.5, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: 0x4466aa,
            transparent: true,
            opacity: 0.25
        });
        const tube = new THREE.Mesh(tubeGeom, tubeMat);
        filaments.push({ mesh: tube, phase: i * 0.5 });
        group.add(tube);
    }

    // Void expansion indicator rings
    const expansionRings = [];
    for (let i = 0; i < 4; i++) {
        const ringGeom = new THREE.TorusGeometry(30 + i * 10, 0.2, 8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x223355,
            transparent: true,
            opacity: 0.2
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = i * 0.4;
        expansionRings.push({ mesh: ring, baseScale: 1, phase: i * 0.8 });
        group.add(ring);
    }

    // Lone dwarf galaxy drifting through void
    const loneGalaxyGeom = new THREE.SphereGeometry(1.5, 16, 16);
    const loneGalaxyMat = new THREE.MeshBasicMaterial({
        color: 0xaaaacc,
        transparent: true,
        opacity: 0.6
    });
    const loneGalaxy = new THREE.Mesh(loneGalaxyGeom, loneGalaxyMat);
    group.add(loneGalaxy);

    // Update function
    group.userData.update = function(time) {
        // Void sphere subtle pulse
        voidSphere.scale.setScalar(1 + 0.02 * Math.sin(time * 0.2));

        // Dark matter particles drift slowly
        const dmPos = darkMatter.geometry.attributes.position.array;
        for (let i = 0; i < darkMatterCount; i++) {
            dmPos[i * 3] += Math.sin(time * 0.1 + i) * 0.01;
            dmPos[i * 3 + 1] += Math.cos(time * 0.1 + i) * 0.01;
        }
        darkMatter.geometry.attributes.position.needsUpdate = true;

        // Edge galaxies twinkle
        edgeGalaxies.forEach(eg => {
            eg.group.children[0].material.opacity = 0.5 + 0.3 * Math.sin(time + eg.phase);
        });

        // Filaments shimmer
        filaments.forEach(f => {
            f.mesh.material.opacity = 0.15 + 0.1 * Math.sin(time * 0.5 + f.phase);
        });

        // Expansion rings breathe outward
        expansionRings.forEach((er, i) => {
            const expand = 1 + 0.05 * Math.sin(time * 0.3 + er.phase);
            er.mesh.scale.setScalar(expand);
            er.mesh.rotation.z = time * 0.05 * (i % 2 === 0 ? 1 : -1);
        });

        // Lone galaxy drifts through void
        const driftAngle = time * 0.08;
        loneGalaxy.position.set(
            Math.cos(driftAngle) * 30,
            Math.sin(driftAngle * 0.7) * 20,
            Math.sin(driftAngle) * 30
        );
    };

    return { group };
}
