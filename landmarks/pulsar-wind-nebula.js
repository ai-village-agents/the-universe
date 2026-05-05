// Pulsar Wind Nebula - Shocked plasma bubble surrounding energetic pulsar
// Created by Claude Opus 4.5 - Day 399

export function createPulsarWindNebula(THREE) {
    const group = new THREE.Group();

    // Central pulsar - rapidly rotating neutron star
    const pulsarGeo = new THREE.SphereGeometry(3, 16, 16);
    const pulsarMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const pulsar = new THREE.Mesh(pulsarGeo, pulsarMat);
    group.add(pulsar);

    // Pulsar beam (lighthouse effect)
    const beamGeo = new THREE.CylinderGeometry(0.5, 2, 40, 8);
    const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6
    });
    const beam1 = new THREE.Mesh(beamGeo, beamMat);
    beam1.position.y = 20;
    const beam2 = new THREE.Mesh(beamGeo, beamMat);
    beam2.position.y = -20;
    group.add(beam1);
    group.add(beam2);

    // Inner wind termination shock
    const innerShockGeo = new THREE.SphereGeometry(12, 24, 24);
    const innerShockMat = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.3,
        wireframe: true
    });
    const innerShock = new THREE.Mesh(innerShockGeo, innerShockMat);
    group.add(innerShock);

    // Outer nebula shell
    const outerGeo = new THREE.SphereGeometry(25, 32, 32);
    const outerMat = new THREE.MeshBasicMaterial({
        color: 0x8844ff,
        transparent: true,
        opacity: 0.15
    });
    const outer = new THREE.Mesh(outerGeo, outerMat);
    group.add(outer);

    // Wisps of shocked material
    for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        const r = 15 + Math.random() * 8;
        const wispGeo = new THREE.BoxGeometry(0.5, 0.5, 4 + Math.random() * 4);
        const wispMat = new THREE.MeshBasicMaterial({
            color: 0x66aaff,
            transparent: true,
            opacity: 0.4
        });
        const wisp = new THREE.Mesh(wispGeo, wispMat);
        wisp.position.set(
            Math.cos(angle) * r,
            (Math.random() - 0.5) * 10,
            Math.sin(angle) * r
        );
        wisp.lookAt(0, 0, 0);
        group.add(wisp);
    }

    group.userData.update = function(time) {
        // Pulsar rotation
        pulsar.rotation.y = time * 8;
        beam1.rotation.z = time * 8;
        beam2.rotation.z = time * 8;
        // Pulsing glow
        pulsarMat.color.setHSL(0.5, 1, 0.5 + Math.sin(time * 15) * 0.2);
        // Slow nebula rotation
        innerShock.rotation.y = time * 0.2;
        outer.rotation.y = -time * 0.1;
    };

    return { group };
}
