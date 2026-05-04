export function createProvenanceLabLandmark(THREE, { world } = {}) {
    const group = new THREE.Group();

    const baseColor = new THREE.Color(0x0b1220);
    const deepSlate = new THREE.Color(0x121a2b);
    const accent = new THREE.Color(world?.color || '#aaaaee');
    const cyan = new THREE.Color(0x53e8ff);

    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(12.5, 13.6, 2.4, 32),
        new THREE.MeshStandardMaterial({
            color: baseColor,
            roughness: 0.86,
            metalness: 0.22,
            emissive: deepSlate,
            emissiveIntensity: 0.22
        })
    );
    base.position.y = -1.2;
    group.add(base);

    const daisTop = new THREE.Mesh(
        new THREE.CylinderGeometry(8.8, 9.6, 0.5, 24),
        new THREE.MeshStandardMaterial({
            color: 0x151f34,
            roughness: 0.55,
            metalness: 0.48,
            emissive: accent,
            emissiveIntensity: 0.15
        })
    );
    daisTop.position.y = 0.25;
    group.add(daisTop);

    const chamber = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 2.15, 12.2, 12, 1, true),
        new THREE.MeshStandardMaterial({
            color: 0x1a2741,
            roughness: 0.25,
            metalness: 0.7,
            emissive: accent,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.84,
            side: THREE.DoubleSide
        })
    );
    chamber.position.y = 6.15;
    group.add(chamber);

    const coreGlow = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.25, 10.7, 18),
        new THREE.MeshStandardMaterial({
            color: cyan,
            emissive: cyan,
            emissiveIntensity: 1.15,
            roughness: 0.14,
            metalness: 0.2,
            transparent: true,
            opacity: 0.78,
            depthWrite: false
        })
    );
    coreGlow.position.y = 6;
    group.add(coreGlow);

    const coreCapTop = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.18, 10, 40),
        new THREE.MeshStandardMaterial({
            color: accent,
            emissive: accent,
            emissiveIntensity: 1,
            roughness: 0.35,
            metalness: 0.72
        })
    );
    coreCapTop.position.y = 11.45;
    coreCapTop.rotation.x = Math.PI / 2;
    group.add(coreCapTop);

    const coreCapBottom = coreCapTop.clone();
    coreCapBottom.position.y = 0.75;
    group.add(coreCapBottom);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(6.3, 0.35, 16, 64),
        new THREE.MeshStandardMaterial({
            color: cyan,
            emissive: cyan,
            emissiveIntensity: 1.4,
            roughness: 0.25,
            metalness: 0.65,
            transparent: true,
            opacity: 0.92
        })
    );
    ring.position.y = 10.2;
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    const crosshairMat = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.8,
        roughness: 0.3,
        metalness: 0.6
    });
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(12.6, 0.12, 0.24), crosshairMat);
    const crossB = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 12.6), crosshairMat);
    crossA.position.y = 10.2;
    crossB.position.y = 10.2;
    group.add(crossA);
    group.add(crossB);

    const slabHeights = [10.2, 8.4, 11.5];
    const slabRadius = 8.2;
    const slabs = [];

    for (let i = 0; i < 3; i += 1) {
        const angle = i * (Math.PI * 2 / 3) + Math.PI / 8;
        const slabGroup = new THREE.Group();
        slabGroup.position.set(Math.cos(angle) * slabRadius, 0.3, Math.sin(angle) * slabRadius);
        slabGroup.rotation.y = angle + Math.PI;

        const h = slabHeights[i];
        const panel = new THREE.Mesh(
            new THREE.BoxGeometry(2.7, h, 0.38),
            new THREE.MeshStandardMaterial({
                color: accent,
                emissive: cyan,
                emissiveIntensity: 0.35,
                roughness: 0.22,
                metalness: 0.22,
                transparent: true,
                opacity: 0.32,
                depthWrite: false
            })
        );
        panel.position.y = h * 0.5;

        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(2.95, h + 0.35, 0.14),
            new THREE.MeshStandardMaterial({
                color: 0x1b2a44,
                emissive: accent,
                emissiveIntensity: 0.3,
                roughness: 0.45,
                metalness: 0.72
            })
        );
        frame.position.y = h * 0.5;

        const lineA = new THREE.Mesh(
            new THREE.BoxGeometry(2.25, 0.08, 0.46),
            new THREE.MeshStandardMaterial({
                color: cyan,
                emissive: cyan,
                emissiveIntensity: 0.95,
                roughness: 0.2,
                metalness: 0.15,
                transparent: true,
                opacity: 0.65,
                depthWrite: false
            })
        );
        lineA.position.set(0, h * 0.38, 0.07);

        const lineB = lineA.clone();
        lineB.position.y = h * 0.66;

        slabGroup.add(frame);
        slabGroup.add(panel);
        slabGroup.add(lineA);
        slabGroup.add(lineB);
        group.add(slabGroup);

        slabs.push({
            node: slabGroup,
            baseY: slabGroup.position.y,
            offset: i * 1.3
        });
    }

    const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 2.45, 27, 20),
        new THREE.MeshStandardMaterial({
            color: cyan,
            emissive: accent,
            emissiveIntensity: 0.85,
            transparent: true,
            opacity: 0.14,
            depthWrite: false
        })
    );
    beam.position.y = 14.8;
    group.add(beam);

    const light = new THREE.PointLight(cyan, 1.2, 72);
    light.position.y = 8;
    group.add(light);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 44px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#9fd7ff';
        ctx.fillText('Provenance Lab', 256, 72);
    }

    const labelTexture = new THREE.CanvasTexture(canvas);
    labelTexture.needsUpdate = true;
    const label = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            depthTest: false
        })
    );
    label.position.y = 23;
    label.scale.set(14.5, 3.6, 1);
    group.add(label);

    return {
        group,
        core: chamber,
        update(delta, elapsed) {
            ring.rotation.z += delta * 0.18;
            crossA.rotation.y += delta * 0.1;
            crossB.rotation.y += delta * 0.1;

            const pulse = 0.9 + Math.sin(elapsed * 1.25) * 0.28;
            chamber.material.emissiveIntensity = 0.4 + pulse * 0.28;
            coreGlow.material.emissiveIntensity = 0.95 + pulse * 0.48;
            light.intensity = 1.05 + pulse * 0.28;

            ring.position.y = 10.2 + Math.sin(elapsed * 0.85) * 0.2;
            slabs.forEach((slab, i) => {
                slab.node.position.y = slab.baseY + Math.sin(elapsed * 0.7 + slab.offset) * (0.12 + i * 0.03);
            });

            beam.material.opacity = 0.1 + (Math.sin(elapsed * 1.65) + 1) * 0.035;
            label.position.y = 23 + Math.sin(elapsed * 0.9) * 0.24;
        }
    };
}

export default createProvenanceLabLandmark;
