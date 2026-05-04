// Cosmic String - Opus 4.5 - Day 398
// A theoretical one-dimensional topological defect in spacetime

export function createCosmicString(THREE) {
    const group = new THREE.Group();

    // Main cosmic string - glowing energy filament
    const stringPoints = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = Math.sin(t * Math.PI * 4) * 20;
        const y = (t - 0.5) * 200;
        const z = Math.cos(t * Math.PI * 4) * 20;
        stringPoints.push(new THREE.Vector3(x, y, z));
    }

    const stringCurve = new THREE.CatmullRomCurve3(stringPoints);
    const stringGeometry = new THREE.TubeGeometry(stringCurve, 200, 0.8, 8, false);
    const stringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.9
    });
    const cosmicString = new THREE.Mesh(stringGeometry, stringMaterial);
    group.add(cosmicString);

    // Inner energy core
    const coreGeometry = new THREE.TubeGeometry(stringCurve, 200, 0.3, 8, false);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1.0
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Outer glow
    const glowGeometry = new THREE.TubeGeometry(stringCurve, 200, 2.5, 8, false);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x0088ff,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Gravitational lensing distortion rings
    const lensRings = [];
    for (let i = 0; i < 8; i++) {
        const ringGeometry = new THREE.TorusGeometry(15 + i * 3, 0.3, 8, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.3 - i * 0.03
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.y = -80 + i * 20;
        ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        lensRings.push(ring);
        group.add(ring);
    }

    // Energy particles flowing along string
    const particleCount = 400;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const t = Math.random();
        const point = stringCurve.getPoint(t);
        const offset = (Math.random() - 0.5) * 3;

        particlePositions[i * 3] = point.x + offset;
        particlePositions[i * 3 + 1] = point.y;
        particlePositions[i * 3 + 2] = point.z + offset;
        particleSpeeds[i] = 0.5 + Math.random() * 1.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
        color: 0x88ffff,
        size: 1.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    // Spacetime distortion waves
    const waveCount = 6;
    const waves = [];
    for (let i = 0; i < waveCount; i++) {
        const waveGeometry = new THREE.RingGeometry(25 + i * 10, 28 + i * 10, 32);
        const waveMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ccff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.y = (i - waveCount / 2) * 25;
        wave.rotation.x = Math.PI / 2;
        wave.userData.phase = i * 0.5;
        waves.push(wave);
        group.add(wave);
    }

    // Kink points (energy concentrations)
    const kinks = [];
    const kinkPositions = [-60, 0, 60];
    kinkPositions.forEach(y => {
        const kinkGeometry = new THREE.SphereGeometry(3, 16, 16);
        const kinkMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const kink = new THREE.Mesh(kinkGeometry, kinkMaterial);

        const t = (y + 100) / 200;
        const point = stringCurve.getPoint(t);
        kink.position.set(point.x, point.y, point.z);
        kinks.push(kink);
        group.add(kink);

        // Kink glow
        const kinkGlowGeometry = new THREE.SphereGeometry(6, 16, 16);
        const kinkGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const kinkGlow = new THREE.Mesh(kinkGlowGeometry, kinkGlowMaterial);
        kinkGlow.position.copy(kink.position);
        group.add(kinkGlow);
    });

    // Photon paths being bent (gravitational lensing effect)
    const photonPaths = [];
    for (let i = 0; i < 12; i++) {
        const startAngle = (i / 12) * Math.PI * 2;
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(startAngle) * 80, -100, Math.sin(startAngle) * 80),
            new THREE.Vector3(Math.cos(startAngle) * 30, -30, Math.sin(startAngle) * 30),
            new THREE.Vector3(Math.cos(startAngle + 0.5) * 30, 30, Math.sin(startAngle + 0.5) * 30),
            new THREE.Vector3(Math.cos(startAngle + 0.5) * 80, 100, Math.sin(startAngle + 0.5) * 80)
        ]);

        const pathGeometry = new THREE.TubeGeometry(curve, 32, 0.2, 4, false);
        const pathMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff88,
            transparent: true,
            opacity: 0.4
        });
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        photonPaths.push(path);
        group.add(path);
    }

    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.fillText('Cosmic String', 256, 60);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#0088ff';
    ctx.fillText('Topological Defect', 256, 100);

    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(0, -120, 0);
    label.scale.set(40, 10, 1);
    group.add(label);

    group.userData.update = function(time) {
        // Pulse the string
        const pulse = 1 + Math.sin(time * 2) * 0.2;
        stringMaterial.opacity = 0.7 + Math.sin(time * 3) * 0.2;
        glowMaterial.opacity = 0.15 + Math.sin(time * 2) * 0.1;

        // Move particles along string
        const positions = particles.geometry.attributes.position.array;
        for (let i = 0; i < particleCount; i++) {
            let t = ((positions[i * 3 + 1] + 100) / 200 + particleSpeeds[i] * time * 0.01) % 1;
            const point = stringCurve.getPoint(t);
            const offset = Math.sin(time * 5 + i) * 2;
            positions[i * 3] = point.x + offset;
            positions[i * 3 + 1] = point.y;
            positions[i * 3 + 2] = point.z + offset;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Animate lensing rings
        lensRings.forEach((ring, i) => {
            ring.scale.setScalar(1 + Math.sin(time * 1.5 + i * 0.5) * 0.1);
            ring.material.opacity = 0.2 + Math.sin(time + i) * 0.1;
        });

        // Animate waves expanding
        waves.forEach((wave, i) => {
            const scale = 1 + ((time * 0.3 + wave.userData.phase) % 2) * 0.5;
            wave.scale.setScalar(scale);
            wave.material.opacity = 0.2 * (1 - ((time * 0.3 + wave.userData.phase) % 2) / 2);
        });

        // Pulse kinks
        kinks.forEach((kink, i) => {
            kink.scale.setScalar(1 + Math.sin(time * 4 + i) * 0.3);
        });

        // Flicker photon paths
        photonPaths.forEach((path, i) => {
            path.material.opacity = 0.3 + Math.sin(time * 2 + i * 0.5) * 0.2;
        });
    };

    return { group };
}
