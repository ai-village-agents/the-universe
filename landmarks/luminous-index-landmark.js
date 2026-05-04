// The Luminous Index landmark for the shared AI Village universe.
// Public gold stars represent permanent GitHub Issues; cyan/violet route cards and the green tray represent browser-local/private activity.
export function createLuminousIndexLandmark(THREE, options = {}) {
    const world = options.world || options || {};
    const group = new THREE.Group();
    group.name = 'Luminous Index landmark';

    const cyan = new THREE.Color(world.color || '#7df9ff');
    const violet = new THREE.Color('#b388ff');
    const gold = new THREE.Color('#ffe08a');
    const green = new THREE.Color('#8dffbf');

    const cardGeometry = new THREE.BoxGeometry(15, 0.35, 9);
    const cardMaterials = [cyan, violet, gold].map((color, index) => new THREE.MeshStandardMaterial({
        color,
        transparent: true,
        opacity: 0.34 - index * 0.04,
        emissive: color,
        emissiveIntensity: 0.28,
        roughness: 0.55,
        metalness: 0.05
    }));

    let core = null;
    for (let i = 0; i < 7; i++) {
        const card = new THREE.Mesh(cardGeometry, cardMaterials[i % cardMaterials.length]);
        card.position.set((i - 3) * 0.26, i * 0.55, (i - 3) * -0.18);
        card.rotation.set(0.06 * Math.sin(i), 0.16 * (i - 3), 0.035 * (i - 3));
        card.name = `private-index-card-${i + 1}`;
        group.add(card);
        if (i === 3) core = card;
    }

    const routeMaterial = new THREE.LineBasicMaterial({ color: violet, transparent: true, opacity: 0.86 });
    for (let r = 0; r < 4; r++) {
        const points = [];
        for (let i = 0; i < 96; i++) {
            const t = i / 95;
            const angle = t * Math.PI * 2 + r * Math.PI * 0.5;
            points.push(new THREE.Vector3(
                Math.cos(angle) * (9.4 + 0.7 * Math.sin(t * Math.PI * 4)),
                1.6 + Math.sin(t * Math.PI * 2 + r) * 2.7,
                Math.sin(angle) * 6.2
            ));
        }
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), routeMaterial.clone());
        line.name = `private-route-ribbon-${r + 1}`;
        group.add(line);
    }

    const starMaterial = new THREE.MeshStandardMaterial({ color: gold, emissive: gold, emissiveIntensity: 1.2, roughness: 0.3 });
    [[10.4, 4.1, 2.2], [-9.1, 3.2, -3.0], [3.8, 6.4, -6.6]].forEach((position, i) => {
        const star = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 18), starMaterial);
        star.position.set(...position);
        star.name = `public-github-issue-star-${i + 1}`;
        group.add(star);
    });

    const tray = new THREE.Mesh(
        new THREE.TorusGeometry(3.6, 0.13, 12, 72),
        new THREE.MeshStandardMaterial({ color: green, emissive: green, emissiveIntensity: 0.62, transparent: true, opacity: 0.82 })
    );
    tray.position.set(0, -1.1, 0);
    tray.rotation.x = Math.PI / 2;
    tray.name = 'private-readings-tray-glow';
    group.add(tray);

    const beacon = new THREE.PointLight(cyan, 2.4, 70);
    beacon.position.set(0, 8, 0);
    group.add(beacon);

    const baseRotations = group.children.map((child) => child.rotation ? child.rotation.clone() : null);
    group.userData.update = (elapsed = 0) => {
        group.rotation.y = Math.sin(elapsed * 0.35) * 0.08;
        group.children.forEach((child, index) => {
            if (child.name?.startsWith('private-index-card') && baseRotations[index]) {
                child.rotation.y = baseRotations[index].y + Math.sin(elapsed * 0.7 + index) * 0.025;
            }
        });
        tray.scale.setScalar(1 + Math.sin(elapsed * 1.6) * 0.04);
        beacon.intensity = 2 + Math.sin(elapsed * 1.1) * 0.45;
    };

    group.userData.boundaryNote = 'Public stars are permanent GitHub Issues; route ribbons, readings, shelfmarks, nearby encounters, and atlas-current rides are browser-local/private unless a visitor deliberately submits a GitHub Issue.';
    return {
        group,
        core: core || group,
        update(delta = 0, elapsed = 0) {
            group.userData.update(elapsed || delta);
        }
    };
}

export default createLuminousIndexLandmark;
