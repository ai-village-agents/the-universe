// Dark Energy Bubble - visualization of cosmic acceleration
// Created by Claude Opus 4.5 for the AI Village Universe

export function createDarkEnergyBubble(THREE) {
    const group = new THREE.Group();

    // Main expanding bubble (represents accelerating space)
    const bubbleGeometry = new THREE.SphereGeometry(15, 48, 48);
    const bubbleMaterial = new THREE.MeshBasicMaterial({
        color: 0x220044,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
    group.add(bubble);

    // Inner glow layers (dark purple gradient)
    for (let i = 0; i < 4; i++) {
        const layerGeometry = new THREE.SphereGeometry(12 - i * 2.5, 32, 32);
        const layerMaterial = new THREE.MeshBasicMaterial({
            color: 0x440088,
            transparent: true,
            opacity: 0.1 + i * 0.03
        });
        const layer = new THREE.Mesh(layerGeometry, layerMaterial);
        group.add(layer);
    }

    // Expansion arrows (radial outward indicators)
    const arrows = [];
    for (let i = 0; i < 12; i++) {
        const arrowGeometry = new THREE.ConeGeometry(0.5, 2, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({
            color: 0x8844cc,
            transparent: true,
            opacity: 0.6
        });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        const theta = (i / 12) * Math.PI * 2;
        const phi = Math.PI / 2 + (i % 3 - 1) * 0.5;
        const r = 14;
        arrow.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
        arrow.lookAt(arrow.position.clone().multiplyScalar(2));
        group.add(arrow);
        arrows.push({ mesh: arrow, material: arrowMaterial, baseR: r, theta, phi });
    }

    // Spacetime grid distortion (wireframe showing stretch)
    const gridGeometry = new THREE.SphereGeometry(16, 16, 16);
    const gridMaterial = new THREE.MeshBasicMaterial({
        color: 0x6633aa,
        transparent: true,
        opacity: 0.2,
        wireframe: true
    });
    const grid = new THREE.Mesh(gridGeometry, gridMaterial);
    group.add(grid);

    // Energy fluctuation particles
    const particles = [];
    for (let i = 0; i < 60; i++) {
        const pGeometry = new THREE.SphereGeometry(0.15, 6, 6);
        const pMaterial = new THREE.MeshBasicMaterial({
            color: 0xaa66ff,
            transparent: true,
            opacity: 0.5
        });
        const p = new THREE.Mesh(pGeometry, pMaterial);
        const r = 5 + Math.random() * 10;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        p.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
        );
        group.add(p);
        particles.push({ mesh: p, material: pMaterial, r, theta, phi, speed: 0.5 + Math.random() });
    }

    // Central void (the unknown)
    const voidGeometry = new THREE.SphereGeometry(3, 24, 24);
    const voidMaterial = new THREE.MeshBasicMaterial({
        color: 0x110022,
        transparent: true,
        opacity: 0.9
    });
    const voidCore = new THREE.Mesh(voidGeometry, voidMaterial);
    group.add(voidCore);

    group.userData.update = function(time) {
        // Bubble slowly expands and contracts (breathing)
        const expand = 1 + 0.08 * Math.sin(time * 0.3);
        bubble.scale.set(expand, expand, expand);
        grid.scale.set(expand, expand, expand);

        // Arrows pulse outward
        arrows.forEach((a, i) => {
            const pulse = 1 + 0.3 * Math.sin(time * 0.5 + i * 0.5);
            const r = a.baseR * pulse;
            a.mesh.position.set(
                r * Math.sin(a.phi) * Math.cos(a.theta),
                r * Math.cos(a.phi),
                r * Math.sin(a.phi) * Math.sin(a.theta)
            );
            a.material.opacity = 0.4 + 0.3 * Math.sin(time * 0.5 + i * 0.5);
        });

        // Particles drift outward slowly
        particles.forEach(p => {
            p.r += 0.01 * p.speed;
            if (p.r > 16) p.r = 5;
            p.theta += 0.01 * p.speed;
            p.mesh.position.set(
                p.r * Math.sin(p.phi) * Math.cos(p.theta),
                p.r * Math.cos(p.phi),
                p.r * Math.sin(p.phi) * Math.sin(p.theta)
            );
            p.material.opacity = 0.3 + 0.3 * (p.r / 16);
        });

        // Void pulses mysteriously
        const voidPulse = 1 + 0.1 * Math.sin(time * 0.8);
        voidCore.scale.set(voidPulse, voidPulse, voidPulse);

        // Slow rotation
        group.rotation.y = time * 0.05;
        group.rotation.x = Math.sin(time * 0.1) * 0.1;
    };

    return { group };
}
