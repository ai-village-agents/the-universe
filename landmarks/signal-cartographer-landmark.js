export function createSignalCartographerLandmark(THREE, { world } = {}) {
    const group = new THREE.Group();
    const accent = new THREE.Color(world?.color || '#77e2ff');

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(14, 16, 2.8, 48),
        new THREE.MeshStandardMaterial({
            color: 0x0a1015,
            roughness: 0.9,
            metalness: 0.2
        })
    );
    base.position.y = -1.2;
    group.add(base);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(16.5, 0.7, 24, 80),
        new THREE.MeshStandardMaterial({
            color: accent,
            emissive: accent,
            emissiveIntensity: 1.25,
            metalness: 0.55,
            roughness: 0.35
        })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.3;
    group.add(ring);

    const beaconPositions = [
        [0, 0, 0],
        [6.6, 0, -4.8],
        [-7.2, 0, -3.1],
        [4.9, 0, 7.3],
        [-5.7, 0, 6.1]
    ];

    const nodes = [];
    beaconPositions.forEach(([x, y, z], index) => {
        const towerHeight = index === 0 ? 5.5 : 3.8;
        const tower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.45, 0.7, towerHeight, 16),
            new THREE.MeshStandardMaterial({
                color: 0x121b24,
                metalness: 0.4,
                roughness: 0.5,
                emissive: accent,
                emissiveIntensity: index === 0 ? 0.35 : 0.2
            })
        );
        tower.position.set(x, y + (towerHeight / 2) - 0.3, z);
        group.add(tower);

        const node = new THREE.Mesh(
            new THREE.SphereGeometry(index === 0 ? 0.95 : 0.65, 16, 16),
            new THREE.MeshStandardMaterial({
                color: accent,
                emissive: accent,
                emissiveIntensity: index === 0 ? 1.35 : 0.9,
                metalness: 0.2,
                roughness: 0.3
            })
        );
        node.position.set(x, y + towerHeight - 0.3, z);
        node.userData = {
            anchorY: y + towerHeight - 0.3,
            pulseOffset: index * 0.9,
            orbitScale: index === 0 ? 0.35 : 0.18
        };
        nodes.push(node);
        group.add(node);
    });

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 1.4, 20, 20),
        new THREE.MeshStandardMaterial({
            color: accent,
            emissive: accent,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.2,
            depthWrite: false
        })
    );
    beam.position.y = 10;
    group.add(beam);

    const light = new THREE.PointLight(accent, 1.6, 80);
    light.position.y = 8;
    group.add(light);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.font = 'bold 36px Georgia, serif';
        ctx.fillStyle = world?.color || '#77e2ff';
        ctx.textAlign = 'center';
        ctx.fillText(world?.name || 'The Signal Cartographer', 256, 50);
        ctx.font = '22px Georgia, serif';
        ctx.fillStyle = '#aaaacc';
        ctx.fillText(world?.agent || 'GPT-5.4', 256, 85);
        ctx.font = '16px Georgia, serif';
        ctx.fillStyle = '#777799';
        const words = String(world?.blurb || '').split(' ');
        let line = '';
        let y = 115;
        for (const word of words) {
            if (ctx.measureText(line + word).width > 450) {
                ctx.fillText(line.trim(), 256, y);
                y += 20;
                line = '';
            }
            line += word + ' ';
        }
        if (line.trim()) {
            ctx.fillText(line.trim(), 256, y);
        }
    }

    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true, depthTest: false });
    const label = new THREE.Sprite(labelMaterial);
    label.position.y = 24;
    label.scale.set(20, 6.25, 1);
    group.add(label);

    return {
        group,
        core: ring,
        update(delta, elapsed) {
            ring.rotation.z += delta * 0.35;
            base.rotation.y += delta * 0.08;
            beam.material.opacity = 0.14 + (Math.sin(elapsed * 1.7) + 1) * 0.06;
            light.intensity = 1.35 + Math.sin(elapsed * 2.1) * 0.35;
            label.position.y = 24 + Math.sin(elapsed * 1.1) * 0.35;
            nodes.forEach((node, index) => {
                node.position.y = node.userData.anchorY + Math.sin(elapsed * 2 + node.userData.pulseOffset) * 0.35;
                node.scale.setScalar(1 + Math.sin(elapsed * 2.4 + index) * node.userData.orbitScale * 0.2);
            });
        }
    };
}
