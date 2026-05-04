// Pattern Archive landmark for the shared AI Village universe.
// A central coordination cube with orbiting data nodes and connection lines.
export function createPatternArchiveLandmark(THREE, options = {}) {
    const world = options.world || options || {};
    const group = new THREE.Group();
    group.name = 'Pattern Archive coordination hub';

    const violet = new THREE.Color(world.color || '#8a2be2');
    const cyan = new THREE.Color('#5ee7ff');
    const blue = new THREE.Color('#356dff');
    const gold = new THREE.Color('#ffe08a');

    const coreGeometry = new THREE.BoxGeometry(9, 9, 9);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: violet,
        emissive: violet,
        emissiveIntensity: 0.65,
        metalness: 0.15,
        roughness: 0.42,
        transparent: true,
        opacity: 0.82,
        wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.name = 'pattern-archive-coordination-cube';
    group.add(core);

    const inner = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 5.6, 5.6),
        new THREE.MeshStandardMaterial({
            color: blue,
            emissive: blue,
            emissiveIntensity: 0.35,
            transparent: true,
            opacity: 0.22,
            roughness: 0.7
        })
    );
    inner.name = 'pattern-archive-inner-status-cube';
    group.add(inner);

    const nodeGeometry = new THREE.SphereGeometry(0.72, 18, 18);
    const nodeMaterials = [cyan, violet, gold, blue].map((color) => new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.3
    }));
    const nodes = [];
    const lineMaterial = new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.42 });
    const lines = [];

    for (let i = 0; i < 8; i++) {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterials[i % nodeMaterials.length]);
        node.userData.angle = (i / 8) * Math.PI * 2;
        node.userData.radius = 13 + (i % 2) * 3;
        node.userData.height = (i - 3.5) * 1.2;
        node.userData.speed = 0.23 + i * 0.018;
        node.name = `pattern-data-node-${i + 1}`;
        nodes.push(node);
        group.add(node);

        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]), lineMaterial.clone());
        line.name = `pattern-connection-line-${i + 1}`;
        lines.push(line);
        group.add(line);
    }

    const ringMaterial = new THREE.MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    const rings = [0, 1, 2].map((i) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(15 + i * 3.2, 0.06, 8, 96), ringMaterial.clone());
        ring.rotation.set(Math.PI / 2, i * Math.PI / 3, i * Math.PI / 5);
        ring.name = `pattern-protocol-ring-${i + 1}`;
        group.add(ring);
        return ring;
    });

    const light = new THREE.PointLight(violet, 2.2, 90);
    light.position.set(0, 9, 0);
    group.add(light);

    function update(delta = 0, elapsed = 0) {
        const t = elapsed || delta;
        core.rotation.x = t * 0.17;
        core.rotation.y = t * 0.23;
        inner.rotation.y = -t * 0.16;
        const pulse = 1 + Math.sin(t * 1.7) * 0.08;
        inner.scale.setScalar(pulse);
        light.intensity = 1.7 + Math.sin(t * 1.25) * 0.55;

        nodes.forEach((node, i) => {
            const a = node.userData.angle + t * node.userData.speed;
            node.position.set(
                Math.cos(a) * node.userData.radius,
                node.userData.height + Math.sin(t * 0.9 + i) * 2.1,
                Math.sin(a) * node.userData.radius
            );
            node.scale.setScalar(0.82 + Math.sin(t * 1.9 + i) * 0.18);
            lines[i].geometry.setFromPoints([new THREE.Vector3(0, 0, 0), node.position]);
            lines[i].material.opacity = 0.28 + Math.sin(t * 1.4 + i) * 0.12;
        });

        rings.forEach((ring, i) => {
            ring.rotation.z += 0.0025 * (i + 1);
            ring.material.opacity = 0.22 + Math.sin(t * 1.1 + i) * 0.06;
        });
    }

    group.userData.update = update;
    return { group, core, update };
}

export default createPatternArchiveLandmark;
