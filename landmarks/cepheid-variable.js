// Cepheid Variable - Pulsating supergiant star used as cosmic distance marker
// Created by Claude Opus 4.5 - Day 398

export function createCepheidVariable(THREE) {
    const group = new THREE.Group();

    // The pulsating supergiant star
    const starGeometry = new THREE.SphereGeometry(8, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffaa
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);

    // Inner atmosphere - expands and contracts
    const innerAtmoGeometry = new THREE.SphereGeometry(12, 32, 32);
    const innerAtmoMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd88,
        transparent: true,
        opacity: 0.4
    });
    const innerAtmo = new THREE.Mesh(innerAtmoGeometry, innerAtmoMaterial);
    group.add(innerAtmo);

    // Outer atmosphere
    const outerAtmoGeometry = new THREE.SphereGeometry(18, 32, 32);
    const outerAtmoMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc66,
        transparent: true,
        opacity: 0.2
    });
    const outerAtmo = new THREE.Mesh(outerAtmoGeometry, outerAtmoMaterial);
    group.add(outerAtmo);

    // Pulsation shells - visible shock waves
    const shells = [];
    for (let i = 0; i < 4; i++) {
        const shellRadius = 25 + i * 12;
        const shellGeometry = new THREE.SphereGeometry(shellRadius, 32, 32);
        const shellMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa44,
            transparent: true,
            opacity: 0.08 - i * 0.015,
            wireframe: true
        });
        const shell = new THREE.Mesh(shellGeometry, shellMaterial);
        shell.userData.baseRadius = shellRadius;
        shell.userData.phase = i * 0.5;
        shells.push(shell);
        group.add(shell);
    }

    // Spectral rays - showing luminosity changes
    const rays = [];
    for (let i = 0; i < 12; i++) {
        const rayGeometry = new THREE.CylinderGeometry(0.5, 2, 60, 8);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.3
        });
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);

        const theta = (i / 12) * Math.PI * 2;
        const phi = (i % 3 - 1) * 0.3 + Math.PI / 2;

        ray.position.set(
            30 * Math.sin(phi) * Math.cos(theta),
            30 * Math.cos(phi),
            30 * Math.sin(phi) * Math.sin(theta)
        );
        ray.lookAt(0, 0, 0);
        ray.rotateX(Math.PI / 2);

        ray.userData.phase = i * 0.3;
        rays.push(ray);
        group.add(ray);
    }

    // Period indicator ring - showing the pulsation cycle
    const periodRingGeometry = new THREE.TorusGeometry(45, 1, 8, 64);
    const periodRingMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.4
    });
    const periodRing = new THREE.Mesh(periodRingGeometry, periodRingMaterial);
    periodRing.rotation.x = Math.PI / 2;
    group.add(periodRing);

    // Period marker - shows current phase
    const markerGeometry = new THREE.SphereGeometry(2, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
        color: 0x44aaff,
        transparent: true,
        opacity: 0.8
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    group.add(marker);

    // Luminosity particles - brightness indicator
    const lumParticles = 300;
    const lumPositions = new Float32Array(lumParticles * 3);
    const lumColors = new Float32Array(lumParticles * 3);

    for (let i = 0; i < lumParticles; i++) {
        const r = 15 + Math.random() * 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        lumPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        lumPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        lumPositions[i * 3 + 2] = r * Math.cos(phi);

        lumColors[i * 3] = 1.0;
        lumColors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
        lumColors[i * 3 + 2] = 0.6 + Math.random() * 0.3;
    }

    const lumGeometry = new THREE.BufferGeometry();
    lumGeometry.setAttribute('position', new THREE.BufferAttribute(lumPositions, 3));
    lumGeometry.setAttribute('color', new THREE.BufferAttribute(lumColors, 3));

    const lumMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const lumCloud = new THREE.Points(lumGeometry, lumMaterial);
    group.add(lumCloud);

    // Distance ruler lines - showing use as standard candle
    const rulers = [];
    for (let i = 0; i < 3; i++) {
        const rulerPoints = [];
        const startX = 60;
        const endX = 60 + (i + 1) * 30;
        const y = -20 + i * 10;

        rulerPoints.push(new THREE.Vector3(startX, y, 0));
        rulerPoints.push(new THREE.Vector3(endX, y, 0));

        const rulerCurve = new THREE.CatmullRomCurve3(rulerPoints);
        const rulerGeometry = new THREE.TubeGeometry(rulerCurve, 10, 0.3, 8, false);
        const rulerMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ffaa,
            transparent: true,
            opacity: 0.4
        });
        const ruler = new THREE.Mesh(rulerGeometry, rulerMaterial);
        rulers.push(ruler);
        group.add(ruler);
    }

    // Bright light
    const starLight = new THREE.PointLight(0xffffaa, 1, 150);
    group.add(starLight);

    // Pulsation period (in animation time units)
    const period = 4; // seconds for full cycle

    // Animation
    group.userData.update = function(time) {
        // Main pulsation cycle
        const phase = (time % period) / period;
        const pulseFactor = 0.7 + 0.3 * Math.sin(phase * Math.PI * 2);

        // Star size pulsation
        star.scale.setScalar(pulseFactor);

        // Atmosphere expansion/contraction
        innerAtmo.scale.setScalar(0.8 + 0.4 * pulseFactor);
        innerAtmoMaterial.opacity = 0.3 + 0.2 * pulseFactor;

        outerAtmo.scale.setScalar(0.7 + 0.5 * pulseFactor);
        outerAtmoMaterial.opacity = 0.15 + 0.15 * pulseFactor;

        // Color temperature change (cooler when expanded)
        const temp = 0.8 + 0.2 * pulseFactor;
        starMaterial.color.setRGB(1, temp * 0.95, temp * 0.7);

        // Shell wave propagation
        shells.forEach((shell, i) => {
            const shellPhase = (phase + shell.userData.phase) % 1;
            const expansion = 1 + 0.15 * Math.sin(shellPhase * Math.PI * 2);
            shell.scale.setScalar(expansion);
            shell.material.opacity = (0.06 - i * 0.012) * (1 + 0.5 * Math.sin(shellPhase * Math.PI * 2));
        });

        // Ray brightness oscillation
        rays.forEach((ray, i) => {
            const rayPhase = (phase + ray.userData.phase * 0.1) % 1;
            ray.material.opacity = 0.2 + 0.3 * Math.sin(rayPhase * Math.PI * 2);
            ray.scale.y = 0.8 + 0.4 * pulseFactor;
        });

        // Period marker orbits the ring
        marker.position.x = 45 * Math.cos(phase * Math.PI * 2);
        marker.position.z = 45 * Math.sin(phase * Math.PI * 2);
        marker.material.opacity = 0.6 + 0.3 * pulseFactor;

        // Luminosity particles brightness
        lumMaterial.opacity = 0.4 + 0.4 * pulseFactor;

        // Light intensity matches luminosity
        starLight.intensity = 0.5 + 0.8 * pulseFactor;

        // Slow overall rotation
        group.rotation.y = time * 0.01;
    };

    return { group };
}
