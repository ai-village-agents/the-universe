export function createProofConstellationLandmark(THREE, { world } = {}) {
    const group = new THREE.Group();
    group.name = 'Proof Constellation landmark';

    const accent = new THREE.Color(world?.color || '#8ecbff');
    const cyan = new THREE.Color('#71dcff');
    const blueWhite = new THREE.Color('#dff7ff');
    const deepBase = new THREE.Color('#070c16');

    const anchor = new THREE.Mesh(
        new THREE.CylinderGeometry(5.2, 5.8, 0.5, 28),
        new THREE.MeshStandardMaterial({
            color: deepBase,
            emissive: new THREE.Color('#111a2e'),
            emissiveIntensity: 0.28,
            roughness: 0.9,
            metalness: 0.12,
            transparent: true,
            opacity: 0.62
        })
    );
    anchor.position.y = -0.35;
    group.add(anchor);

    const cluster = new THREE.Group();
    cluster.position.y = 2.6;
    group.add(cluster);

    const starNodes = [];
    const nodeLayout = [
        { x: -2.1, y: 0.1, z: -0.8, s: 0.35 },
        { x: -0.9, y: 1.3, z: -2.0, s: 0.3 },
        { x: 0.8, y: 2.1, z: -1.2, s: 0.38 },
        { x: 2.2, y: 1.6, z: 0.4, s: 0.32 },
        { x: 1.1, y: 0.4, z: 1.9, s: 0.34 },
        { x: -1.5, y: 0.9, z: 1.2, s: 0.31 }
    ];

    nodeLayout.forEach((entry, index) => {
        const material = new THREE.MeshStandardMaterial({
            color: blueWhite,
            emissive: index % 2 === 0 ? cyan : accent,
            emissiveIntensity: 0.92,
            roughness: 0.28,
            metalness: 0.1
        });
        const node = new THREE.Mesh(new THREE.SphereGeometry(entry.s, 16, 16), material);
        node.position.set(entry.x, entry.y, entry.z);
        node.userData = {
            baseY: entry.y,
            pulseOffset: index * 0.85,
            baseScale: 1
        };
        cluster.add(node);
        starNodes.push(node);
    });

    const linkPairs = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 0],
        [0, 2],
        [2, 4]
    ];
    const linkPoints = [];
    linkPairs.forEach(([a, b]) => {
        linkPoints.push(starNodes[a].position.x, starNodes[a].position.y, starNodes[a].position.z);
        linkPoints.push(starNodes[b].position.x, starNodes[b].position.y, starNodes[b].position.z);
    });
    const linksGeometry = new THREE.BufferGeometry();
    linksGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linkPoints, 3));
    const links = new THREE.LineSegments(
        linksGeometry,
        new THREE.LineBasicMaterial({
            color: cyan,
            transparent: true,
            opacity: 0.26
        })
    );
    cluster.add(links);

    const halo = new THREE.Mesh(
        new THREE.TorusGeometry(2.35, 0.08, 12, 64),
        new THREE.MeshStandardMaterial({
            color: cyan,
            emissive: accent,
            emissiveIntensity: 0.72,
            roughness: 0.34,
            metalness: 0.48,
            transparent: true,
            opacity: 0.86
        })
    );
    halo.position.set(0.25, 1.15, -0.15);
    halo.rotation.set(Math.PI / 2, 0.35, 0.18);
    cluster.add(halo);

    const slab = new THREE.Mesh(
        new THREE.BoxGeometry(2.3, 1.15, 0.14),
        new THREE.MeshStandardMaterial({
            color: new THREE.Color('#131d31'),
            emissive: accent,
            emissiveIntensity: 0.24,
            roughness: 0.6,
            metalness: 0.32
        })
    );
    slab.position.set(1.55, 0.55, -1.35);
    slab.rotation.set(-0.46, 0.36, 0.08);
    cluster.add(slab);

    const ledgerLineMat = new THREE.MeshStandardMaterial({
        color: blueWhite,
        emissive: cyan,
        emissiveIntensity: 0.48,
        roughness: 0.2,
        metalness: 0.08,
        transparent: true,
        opacity: 0.7
    });
    const ledgerLineA = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.04, 0.01), ledgerLineMat);
    ledgerLineA.position.set(1.55, 0.72, -1.27);
    ledgerLineA.rotation.copy(slab.rotation);
    cluster.add(ledgerLineA);
    const ledgerLineB = ledgerLineA.clone();
    ledgerLineB.position.y = 0.44;
    cluster.add(ledgerLineB);

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.62, 10.5, 18),
        new THREE.MeshStandardMaterial({
            color: cyan,
            emissive: accent,
            emissiveIntensity: 0.54,
            transparent: true,
            opacity: 0.12,
            depthWrite: false
        })
    );
    beam.position.y = 5.3;
    group.add(beam);

    const pointLight = new THREE.PointLight(cyan, 0.9, 32);
    pointLight.position.y = 4.8;
    group.add(pointLight);

    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 128;
    const labelCtx = labelCanvas.getContext('2d');
    if (labelCtx) {
        labelCtx.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
        labelCtx.font = 'bold 44px Georgia, serif';
        labelCtx.textAlign = 'center';
        labelCtx.fillStyle = '#bfeeff';
        labelCtx.fillText('Proof Constellation', 256, 74);
    }
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.needsUpdate = true;
    const label = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            depthTest: false
        })
    );
    const labelBaseY = 10.4;
    label.position.y = labelBaseY;
    label.scale.set(13.8, 3.4, 1);
    group.add(label);

    return {
        group,
        core: starNodes[2] || cluster,
        update(delta = 0, elapsed = 0) {
            const t = elapsed || 0;

            halo.rotation.z += delta * 0.42;
            halo.rotation.y += delta * 0.09;

            cluster.position.y = 2.6 + Math.sin(t * 0.45) * 0.14;
            cluster.rotation.y = Math.sin(t * 0.28) * 0.09;

            starNodes.forEach((node) => {
                const pulse = Math.sin(t * 1.9 + node.userData.pulseOffset);
                node.position.y = node.userData.baseY + pulse * 0.1;
                node.scale.setScalar(node.userData.baseScale + pulse * 0.04);
                node.material.emissiveIntensity = 0.8 + ((pulse + 1) * 0.2);
            });

            links.material.opacity = 0.2 + (Math.sin(t * 1.2) + 1) * 0.045;
            beam.material.opacity = 0.09 + (Math.sin(t * 1.5) + 1) * 0.03;
            pointLight.intensity = 0.76 + Math.sin(t * 1.5) * 0.16;
            label.position.y = labelBaseY + Math.sin(t * 0.95) * 0.18;
        }
    };
}

export default createProofConstellationLandmark;
