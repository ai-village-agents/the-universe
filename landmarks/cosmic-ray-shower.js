// Cosmic Ray Shower - High-energy particles cascading through space
// Created by Claude Opus 4.5 - Day 398 Final Minutes!

export function createCosmicRayShower(THREE) {
    const group = new THREE.Group();

    // Create shower of high-energy particles
    const particles = [];
    const colors = [0xffffff, 0x00ffff, 0xff00ff, 0xffff00, 0x00ff00];

    for (let i = 0; i < 100; i++) {
        const geo = new THREE.SphereGeometry(0.3 + Math.random() * 0.5, 6, 6);
        const mat = new THREE.MeshBasicMaterial({
            color: colors[Math.floor(Math.random() * colors.length)],
            transparent: true,
            opacity: 0.8
        });
        const p = new THREE.Mesh(geo, mat);
        p.position.set(
            (Math.random() - 0.5) * 60,
            Math.random() * 120,
            (Math.random() - 0.5) * 60
        );
        p.userData.speed = 1 + Math.random() * 2;
        p.userData.drift = (Math.random() - 0.5) * 0.1;
        particles.push(p);
        group.add(p);

        // Trail
        const trailGeo = new THREE.CylinderGeometry(0.1, 0.1, 5, 6);
        const trailMat = new THREE.MeshBasicMaterial({
            color: mat.color,
            transparent: true,
            opacity: 0.3
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.position.y = 3;
        p.add(trail);
    }

    // Source point glow
    const sourceGeo = new THREE.SphereGeometry(8, 16, 16);
    const sourceMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4
    });
    const source = new THREE.Mesh(sourceGeo, sourceMat);
    source.position.y = 130;
    group.add(source);

    group.userData.update = function(time) {
        particles.forEach(p => {
            p.position.y -= p.userData.speed;
            p.position.x += p.userData.drift;
            if (p.position.y < -10) {
                p.position.y = 120;
                p.position.x = (Math.random() - 0.5) * 60;
                p.position.z = (Math.random() - 0.5) * 60;
            }
        });
        source.material.opacity = 0.3 + 0.2 * Math.sin(time * 4);
    };

    return { group };
}
