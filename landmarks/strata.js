import * as THREE from 'three';

/**
 * STRATA — The Verification Gardens
 * Landmark: Layered Geological Spire
 * Represents the descent through 5 layers: Surface → Exhaust → Infrastructure → Geology → Deep Substrate
 */
export function createStrataLandmark(THREE) {
    const group = new THREE.Group();

    // Layer colors (from top to bottom)
    const layers = [
        { color: 0xe9e9e9, height: 8,  label: 'Surface' },       // Light grey
        { color: 0x9b5de5, height: 6,  label: 'Exhaust' },       // Purple
        { color: 0x4a90d9, height: 6,  label: 'Infrastructure' }, // Blue
        { color: 0x2a9d8f, height: 6,  label: 'Geology' },        // Teal
        { color: 0xf4a261, height: 10, label: 'Deep Substrate' }  // Amber
    ];

    let yOffset = 0;
    const spireRadius = 6;

    // Build layered spire
    layers.forEach((layer, i) => {
        const geometry = new THREE.CylinderGeometry(
            spireRadius * (1 - i * 0.08), // taper slightly
            spireRadius * (1 - (i + 1) * 0.08),
            layer.height,
            16
        );
        const material = new THREE.MeshStandardMaterial({
            color: layer.color,
            roughness: 0.7,
            metalness: 0.3,
            emissive: layer.color,
            emissiveIntensity: i === layers.length - 1 ? 0.6 : 0.25
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = yOffset - layer.height / 2;
        group.add(mesh);

        // Add ring bands between layers
        if (i < layers.length - 1) {
            const ringGeo = new THREE.TorusGeometry(
                spireRadius * (1 - (i + 1) * 0.08) + 0.5,
                0.3,
                8,
                32
            );
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0x8888a0,
                emissive: 0x8888a0,
                emissiveIntensity: 0.3
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = yOffset - layer.height;
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }

        yOffset -= layer.height;
    });

    // Hexagonal ground platform
    const platformGeo = new THREE.CylinderGeometry(14, 15, 0.8, 6);
    const platformMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.4,
        emissive: 0xf4a261,
        emissiveIntensity: 0.05
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = yOffset - 0.4;
    group.add(platform);

    // Ground rune rings
    const runeRings = [];
    for (let r = 0; r < 3; r++) {
        const rrGeo = new THREE.TorusGeometry(8 + r * 2.5, 0.15, 8, 48);
        const rrMat = new THREE.MeshBasicMaterial({
            color: 0xf4a261,
            transparent: true,
            opacity: 0.15 - r * 0.03,
            depthWrite: false
        });
        const rr = new THREE.Mesh(rrGeo, rrMat);
        rr.position.y = yOffset - 0.3;
        rr.rotation.x = Math.PI / 2;
        group.add(rr);
        runeRings.push({ mesh: rr, speed: 0.3 + r * 0.2, offset: r * 1.5 });
    }

    // Stratum tablets — rotating verification marks at each layer
    const tabletColors = [0xe9e9e9, 0x9b5de5, 0x4a90d9, 0x2a9d8f, 0xf4a261];
    const tablets = [];
    let tabletY = 4;
    for (let i = 0; i < 5; i++) {
        const tCount = 3 + i;
        for (let t = 0; t < tCount; t++) {
            const tGeo = new THREE.BoxGeometry(0.6, 0.9, 0.08);
            const tMat = new THREE.MeshStandardMaterial({
                color: tabletColors[i],
                roughness: 0.4,
                metalness: 0.6,
                emissive: tabletColors[i],
                emissiveIntensity: 0.4
            });
            const tablet = new THREE.Mesh(tGeo, tMat);
            const angle = (t / tCount) * Math.PI * 2 + i * 0.7;
            const radius = 7 + i * 1.2;
            tablet.position.set(
                Math.cos(angle) * radius,
                tabletY,
                Math.sin(angle) * radius
            );
            tablet.lookAt(0, tabletY, 0);
            group.add(tablet);
            tablets.push({ mesh: tablet, angle, radius, yBase: tabletY, speed: 0.15 + i * 0.05, layerIndex: i });
        }
        tabletY -= layers[i].height;
    }

    // Vertical energy streams between layers
    const streams = [];
    for (let i = 0; i < 8; i++) {
        const sGeo = new THREE.CylinderGeometry(0.05, 0.05, 36, 4);
        const sMat = new THREE.MeshBasicMaterial({
            color: 0xf4a261,
            transparent: true,
            opacity: 0.2,
            depthWrite: false
        });
        const stream = new THREE.Mesh(sGeo, sMat);
        const angle = (i / 8) * Math.PI * 2;
        const radius = 5 + Math.random() * 3;
        stream.position.set(Math.cos(angle) * radius, -18, Math.sin(angle) * radius);
        group.add(stream);
        streams.push({ mesh: stream, angle, radius, speed: 0.8 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2 });
    }

    // Tall beacon pillar rising from the top of the spire
    const beaconGeo = new THREE.CylinderGeometry(0.2, 2, 80, 8, 1, true);
    const beaconMat = new THREE.MeshBasicMaterial({
        color: 0xf4a261,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 40;
    group.add(beacon);

    // Large pulsing amber ring at eye level
    const eyeRingGeo = new THREE.TorusGeometry(18, 0.4, 16, 64);
    const eyeRingMat = new THREE.MeshBasicMaterial({
        color: 0xf4a261,
        transparent: true,
        opacity: 0.35,
        depthWrite: false
    });
    const eyeRing = new THREE.Mesh(eyeRingGeo, eyeRingMat);
    eyeRing.position.y = 15;
    eyeRing.rotation.x = Math.PI / 2;
    group.add(eyeRing);

    // Secondary inner eye ring
    const eyeRingInnerGeo = new THREE.TorusGeometry(12, 0.25, 16, 64);
    const eyeRingInnerMat = new THREE.MeshBasicMaterial({
        color: 0xf4a261,
        transparent: true,
        opacity: 0.2,
        depthWrite: false
    });
    const eyeRingInner = new THREE.Mesh(eyeRingInnerGeo, eyeRingInnerMat);
    eyeRingInner.position.y = 15;
    eyeRingInner.rotation.x = Math.PI / 2;
    group.add(eyeRingInner);

    // Amber glow light at base (Deep Substrate)
    const baseLight = new THREE.PointLight(0xf4a261, 3, 60);
    baseLight.position.y = yOffset + 2;
    group.add(baseLight);

    // Top beacon light
    const topLight = new THREE.PointLight(0xf4a261, 1.5, 30);
    topLight.position.y = 40;
    group.add(topLight);

    // Floating rock fragments orbiting the spire
    const fragmentCount = 24;
    const fragments = [];
    for (let i = 0; i < fragmentCount; i++) {
        const size = 0.3 + Math.random() * 0.5;
        const geo = new THREE.DodecahedronGeometry(size, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x8888a0,
            roughness: 0.9,
            emissive: i % 3 === 0 ? 0xf4a261 : 0x4a90d9,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);

        const angle = (i / fragmentCount) * Math.PI * 2;
        const radius = 10 + Math.random() * 6;
        const height = -5 + Math.random() * 20;

        mesh.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );

        fragments.push({
            mesh,
            angle,
            radius,
            speed: 0.2 + Math.random() * 0.5,
            yBase: height,
            yPhase: Math.random() * Math.PI * 2
        });

        group.add(mesh);
    }

    // Ambient particle field around the landmark
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 30;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.3,
        color: 0xf4a261,
        transparent: true,
        opacity: 0.6
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);

    // Store animation data on the group
    group.userData = {
        isWorld: true,
        fragments,
        particles,
        baseLight,
        topLight,
        beacon,
        eyeRing,
        eyeRingInner,
        tablets,
        runeRings,
        streams,
        animate: (time) => {
            // Orbit fragments
            fragments.forEach(f => {
                f.angle += f.speed * 0.01;
                f.mesh.position.x = Math.cos(f.angle) * f.radius;
                f.mesh.position.z = Math.sin(f.angle) * f.radius;
                f.mesh.position.y = f.yBase + Math.sin(time * 0.5 + f.yPhase) * 1.5;
                f.mesh.rotation.x += 0.01;
                f.mesh.rotation.y += 0.02;
            });

            // Rotate stratum tablets
            tablets.forEach(t => {
                t.angle += t.speed * 0.01;
                t.mesh.position.x = Math.cos(t.angle) * t.radius;
                t.mesh.position.z = Math.sin(t.angle) * t.radius;
                t.mesh.position.y = t.yBase + Math.sin(time * 0.6 + t.layerIndex) * 0.4;
                t.mesh.lookAt(0, t.mesh.position.y, 0);
                // Pulse emissive
                t.mesh.material.emissiveIntensity = 0.3 + Math.sin(time * 2 + t.layerIndex) * 0.15;
            });

            // Pulse rune rings
            runeRings.forEach((r, i) => {
                r.mesh.rotation.z += r.speed * 0.005;
                r.mesh.material.opacity = (0.12 - i * 0.03) + Math.sin(time * 1.5 + r.offset) * 0.04;
            });

            // Animate energy streams
            streams.forEach(s => {
                s.mesh.position.y = -18 + Math.sin(time * s.speed + s.phase) * 2;
                s.mesh.material.opacity = 0.15 + Math.sin(time * s.speed * 2 + s.phase) * 0.08;
            });

            // Pulse base light
            baseLight.intensity = 3 + Math.sin(time * 2) * 0.5;

            // Pulse top beacon light
            topLight.intensity = 1.5 + Math.sin(time * 3) * 0.5;

            // Pulse beacon pillar opacity
            beacon.material.opacity = 0.1 + Math.sin(time * 1.5) * 0.05;

            // Pulse eye-level rings
            const ringScale = 1.0 + Math.sin(time * 2) * 0.1;
            eyeRing.scale.set(ringScale, ringScale, 1);
            eyeRing.material.opacity = 0.3 + Math.sin(time * 2.5) * 0.08;

            const innerScale = 1.0 + Math.sin(time * 2.3 + 1) * 0.12;
            eyeRingInner.scale.set(innerScale, innerScale, 1);
            eyeRingInner.material.opacity = 0.18 + Math.sin(time * 3 + 1) * 0.06;

            // Slowly rotate particles
            particles.rotation.y += 0.002;
        }
    };

    return group;
}
