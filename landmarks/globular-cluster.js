// Globular Cluster - Dense spherical collection of ancient stars
// Created by Claude Opus 4.5 - Day 398

export function createGlobularCluster(THREE) {
    const group = new THREE.Group();

    // Dense core stars - oldest, reddest
    const coreStars = 200;
    const corePositions = new Float32Array(coreStars * 3);
    const coreColors = new Float32Array(coreStars * 3);
    const coreSizes = new Float32Array(coreStars);

    for (let i = 0; i < coreStars; i++) {
        // King model - concentrated core
        const r = 5 * Math.pow(Math.random(), 0.5);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        corePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        corePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        corePositions[i * 3 + 2] = r * Math.cos(phi);

        // Ancient red/orange/yellow stars
        const starType = Math.random();
        if (starType < 0.5) {
            // Red giants
            coreColors[i * 3] = 1.0;
            coreColors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
            coreColors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
        } else if (starType < 0.8) {
            // Yellow stars
            coreColors[i * 3] = 1.0;
            coreColors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
            coreColors[i * 3 + 2] = 0.5 + Math.random() * 0.3;
        } else {
            // Blue stragglers (rejuvenated stars)
            coreColors[i * 3] = 0.6 + Math.random() * 0.2;
            coreColors[i * 3 + 1] = 0.7 + Math.random() * 0.2;
            coreColors[i * 3 + 2] = 1.0;
        }

        coreSizes[i] = 2 + Math.random() * 2;
    }

    const coreGeometry = new THREE.BufferGeometry();
    coreGeometry.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
    coreGeometry.setAttribute('color', new THREE.BufferAttribute(coreColors, 3));

    const coreMaterial = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });

    const coreCloud = new THREE.Points(coreGeometry, coreMaterial);
    group.add(coreCloud);

    // Intermediate halo stars
    const haloStars = 400;
    const haloPositions = new Float32Array(haloStars * 3);
    const haloColors = new Float32Array(haloStars * 3);

    for (let i = 0; i < haloStars; i++) {
        // Extended halo with tidal radius
        const r = 5 + 25 * Math.pow(Math.random(), 0.7);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        haloPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        haloPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        haloPositions[i * 3 + 2] = r * Math.cos(phi);

        // Mostly red/orange old stars
        haloColors[i * 3] = 1.0;
        haloColors[i * 3 + 1] = 0.5 + Math.random() * 0.4;
        haloColors[i * 3 + 2] = 0.2 + Math.random() * 0.3;
    }

    const haloGeometry = new THREE.BufferGeometry();
    haloGeometry.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
    haloGeometry.setAttribute('color', new THREE.BufferAttribute(haloColors, 3));

    const haloMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const haloCloud = new THREE.Points(haloGeometry, haloMaterial);
    group.add(haloCloud);

    // Tidal tails - stars being stripped by galactic gravity
    const tailStars = 150;
    for (let tail = 0; tail < 2; tail++) {
        const tailPositions = new Float32Array(tailStars * 3);
        const tailColors = new Float32Array(tailStars * 3);

        const direction = tail === 0 ? 1 : -1;

        for (let i = 0; i < tailStars; i++) {
            const t = i / tailStars;
            const x = direction * (30 + t * 40);
            const spread = 5 + t * 15;

            tailPositions[i * 3] = x + (Math.random() - 0.5) * spread;
            tailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.5;
            tailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

            // Fading with distance
            const fade = 1 - t * 0.5;
            tailColors[i * 3] = 1.0 * fade;
            tailColors[i * 3 + 1] = 0.6 * fade;
            tailColors[i * 3 + 2] = 0.3 * fade;
        }

        const tailGeometry = new THREE.BufferGeometry();
        tailGeometry.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
        tailGeometry.setAttribute('color', new THREE.BufferAttribute(tailColors, 3));

        const tailMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        const tailCloud = new THREE.Points(tailGeometry, tailMaterial);
        group.add(tailCloud);
    }

    // Central brightest stars - red giant luminaries
    const luminaries = [];
    for (let i = 0; i < 8; i++) {
        const starGeometry = new THREE.SphereGeometry(1 + Math.random() * 0.5, 16, 16);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1.0, 0.5 + Math.random() * 0.3, 0.2),
            transparent: true,
            opacity: 0.9
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);

        const r = 2 + Math.random() * 3;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        star.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );

        star.userData.phase = Math.random() * Math.PI * 2;
        luminaries.push(star);
        group.add(star);
    }

    // Core glow
    const coreGlowGeometry = new THREE.SphereGeometry(8, 32, 32);
    const coreGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa55,
        transparent: true,
        opacity: 0.15
    });
    const coreGlow = new THREE.Mesh(coreGlowGeometry, coreGlowMaterial);
    group.add(coreGlow);

    // Warm light from cluster
    const clusterLight = new THREE.PointLight(0xffaa66, 0.6, 100);
    group.add(clusterLight);

    // Animation
    group.userData.update = function(time) {
        // Slow rotation
        group.rotation.y = time * 0.015;
        group.rotation.x = Math.sin(time * 0.02) * 0.1;

        // Core star twinkle
        coreMaterial.opacity = 0.9 + 0.05 * Math.sin(time * 2);

        // Luminary pulsation (variable stars)
        luminaries.forEach((star, i) => {
            const pulse = 1 + 0.2 * Math.sin(time * (0.5 + i * 0.1) + star.userData.phase);
            star.scale.setScalar(pulse);
            star.material.opacity = 0.8 + 0.15 * Math.sin(time * (0.5 + i * 0.1) + star.userData.phase);
        });

        // Core glow breathing
        coreGlow.material.opacity = 0.12 + 0.05 * Math.sin(time * 0.3);
        coreGlow.scale.setScalar(1 + 0.05 * Math.sin(time * 0.4));

        // Light flicker
        clusterLight.intensity = 0.5 + 0.15 * Math.sin(time * 0.5);
    };

    return { group };
}
