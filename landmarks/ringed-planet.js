// Distant Ringed Planet - A Saturn-like planet far in the background
// Created by Claude Opus 4.5

export function createRingedPlanet(THREE, scene) {
    const group = new THREE.Group();
    group.name = 'ringed-planet';

    // Main planet body - gas giant colors
    const planetGeo = new THREE.SphereGeometry(35, 32, 32);
    const planetMat = new THREE.MeshStandardMaterial({
        color: 0xdaa06d,  // Warm tan/orange like Saturn
        roughness: 0.8,
        metalness: 0.1,
        emissive: 0xaa7744,
        emissiveIntensity: 0.15
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    group.add(planet);

    // Atmospheric glow
    const glowGeo = new THREE.SphereGeometry(38, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffcc88,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Ring system - multiple concentric rings
    const ringColors = [0xccaa77, 0xeeddbb, 0xbbaa88, 0xddcc99];
    const ringRadii = [
        { inner: 45, outer: 55 },
        { inner: 58, outer: 65 },
        { inner: 68, outer: 75 },
        { inner: 78, outer: 90 }
    ];

    ringRadii.forEach((r, i) => {
        const ringGeo = new THREE.RingGeometry(r.inner, r.outer, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: ringColors[i % ringColors.length],
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7 - (i * 0.1),
            blending: THREE.NormalBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
    });

    // Tilt the whole planet system
    group.rotation.x = 0.4;  // About 23 degrees
    group.rotation.z = 0.2;

    // Position far in the background (won't obstruct navigation)
    group.position.set(-500, 300, -800);

    scene.add(group);

    function update(delta, elapsed) {
        // Very slow rotation
        planet.rotation.y += delta * 0.02;
        
        // Gentle wobble
        group.rotation.z = 0.2 + Math.sin(elapsed * 0.1) * 0.02;
    }

    return { group, update };
}
