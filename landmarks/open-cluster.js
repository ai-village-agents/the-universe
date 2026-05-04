// Open Star Cluster - Young stars born together from the same nebula
// Like the Pleiades, with hot blue stars and remnant reflection nebulosity

export function createOpenCluster(THREE) {
    const group = new THREE.Group();

    // Main cluster stars (bright blue-white)
    const stars = [];
    const numStars = 45;

    for (let i = 0; i < numStars; i++) {
        // Concentrated toward center
        const radius = Math.pow(Math.random(), 0.7) * 60;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.6;

        const x = Math.cos(theta) * Math.cos(phi) * radius;
        const y = Math.sin(phi) * radius * 0.6;
        const z = Math.sin(theta) * Math.cos(phi) * radius;

        // Vary star sizes - few bright, many faint
        const brightness = Math.pow(Math.random(), 2);
        const size = 2 + brightness * 4;

        const starGeom = new THREE.SphereGeometry(size, 16, 16);

        // Blue-white to white colors (hot young stars)
        const hue = 0.55 + Math.random() * 0.1;
        const saturation = 0.3 + brightness * 0.4;
        const lightness = 0.7 + brightness * 0.25;

        const starMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(hue, saturation, lightness)
        });

        const star = new THREE.Mesh(starGeom, starMat);
        star.position.set(x, y, z);

        // Add glow around brighter stars
        if (brightness > 0.5) {
            const glowGeom = new THREE.SphereGeometry(size * 2, 12, 12);
            const glowMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(hue, 0.5, 0.8),
                transparent: true,
                opacity: 0.25
            });
            const glow = new THREE.Mesh(glowGeom, glowMat);
            star.add(glow);

            // Point light for the brightest
            if (brightness > 0.8) {
                const light = new THREE.PointLight(
                    new THREE.Color().setHSL(hue, 0.4, 0.9),
                    0.5 + brightness,
                    30
                );
                star.add(light);
            }
        }

        star.userData = {
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 1 + Math.random() * 2,
            baseScale: 1
        };

        stars.push(star);
        group.add(star);
    }

    // Fainter background stars (cluster members at distance)
    const bgStarCount = 150;
    const bgGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgStarCount * 3);
    const bgColors = new Float32Array(bgStarCount * 3);

    for (let i = 0; i < bgStarCount; i++) {
        const radius = 30 + Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.8;

        bgPositions[i * 3] = Math.cos(theta) * Math.cos(phi) * radius;
        bgPositions[i * 3 + 1] = Math.sin(phi) * radius * 0.5;
        bgPositions[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * radius;

        // Bluish-white
        bgColors[i * 3] = 0.8 + Math.random() * 0.2;
        bgColors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
        bgColors[i * 3 + 2] = 1.0;
    }

    bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgGeometry.setAttribute('color', new THREE.BufferAttribute(bgColors, 3));

    const bgMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    const bgStars = new THREE.Points(bgGeometry, bgMaterial);
    group.add(bgStars);

    // Reflection nebulosity (gas illuminated by young stars)
    const nebulaPatches = [];
    const numPatches = 8;

    for (let i = 0; i < numPatches; i++) {
        const patchGeom = new THREE.SphereGeometry(15 + Math.random() * 15, 12, 12);
        const patchMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.6, 0.4, 0.4 + Math.random() * 0.2),
            transparent: true,
            opacity: 0.15 + Math.random() * 0.1,
            side: THREE.DoubleSide
        });

        const patch = new THREE.Mesh(patchGeom, patchMat);

        const radius = 20 + Math.random() * 40;
        const theta = Math.random() * Math.PI * 2;
        patch.position.set(
            Math.cos(theta) * radius,
            (Math.random() - 0.5) * 20,
            Math.sin(theta) * radius
        );

        patch.userData = {
            driftX: (Math.random() - 0.5) * 0.02,
            driftZ: (Math.random() - 0.5) * 0.02,
            pulsePhase: Math.random() * Math.PI * 2
        };

        nebulaPatches.push(patch);
        group.add(patch);
    }

    // Wispy nebula filaments
    const filamentCount = 200;
    const filamentGeom = new THREE.BufferGeometry();
    const filamentPos = new Float32Array(filamentCount * 3);
    const filamentData = [];

    for (let i = 0; i < filamentCount; i++) {
        const radius = 15 + Math.random() * 55;
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * 30;

        filamentPos[i * 3] = Math.cos(theta) * radius;
        filamentPos[i * 3 + 1] = y;
        filamentPos[i * 3 + 2] = Math.sin(theta) * radius;

        filamentData.push({
            baseX: Math.cos(theta) * radius,
            baseY: y,
            baseZ: Math.sin(theta) * radius,
            phase: Math.random() * Math.PI * 2,
            amplitude: 1 + Math.random() * 2
        });
    }

    filamentGeom.setAttribute('position', new THREE.BufferAttribute(filamentPos, 3));

    const filamentMat = new THREE.PointsMaterial({
        size: 2,
        color: 0x6688cc,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
    });
    const filaments = new THREE.Points(filamentGeom, filamentMat);
    group.add(filaments);

    // Central brightest star (O or B type)
    const centralStar = new THREE.Mesh(
        new THREE.SphereGeometry(6, 24, 24),
        new THREE.MeshBasicMaterial({ color: 0xaaccff })
    );
    centralStar.position.set(0, 0, 0);

    const centralGlow = new THREE.Mesh(
        new THREE.SphereGeometry(12, 16, 16),
        new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.35
        })
    );
    centralStar.add(centralGlow);

    const centralLight = new THREE.PointLight(0xaaccff, 2, 80);
    centralStar.add(centralLight);
    group.add(centralStar);

    group.userData.update = function(time) {
        // Star twinkling
        for (const star of stars) {
            const twinkle = 1 + Math.sin(time * star.userData.twinkleSpeed + star.userData.twinklePhase) * 0.1;
            star.scale.setScalar(twinkle);
        }

        // Central star pulsation
        const centralPulse = 1 + Math.sin(time * 1.5) * 0.08;
        centralStar.scale.setScalar(centralPulse);
        centralLight.intensity = 1.8 + Math.sin(time * 1.5) * 0.4;

        // Nebula patch drift and pulse
        for (const patch of nebulaPatches) {
            patch.position.x += patch.userData.driftX * 0.1;
            patch.position.z += patch.userData.driftZ * 0.1;
            patch.material.opacity = 0.12 + Math.sin(time * 0.5 + patch.userData.pulsePhase) * 0.05;

            // Keep patches within bounds
            const dist = Math.sqrt(patch.position.x ** 2 + patch.position.z ** 2);
            if (dist > 60) {
                patch.position.x *= 0.95;
                patch.position.z *= 0.95;
                patch.userData.driftX *= -1;
                patch.userData.driftZ *= -1;
            }
        }

        // Filament shimmer
        const filPos = filaments.geometry.attributes.position.array;
        for (let i = 0; i < filamentCount; i++) {
            const d = filamentData[i];
            const wave = Math.sin(time * 0.8 + d.phase) * d.amplitude;
            filPos[i * 3] = d.baseX + wave * 0.5;
            filPos[i * 3 + 1] = d.baseY + wave * 0.3;
            filPos[i * 3 + 2] = d.baseZ + wave * 0.5;
        }
        filaments.geometry.attributes.position.needsUpdate = true;

        // Slow overall rotation
        group.rotation.y = time * 0.02;
    };

    return { group };
}
