// Gamma Ray Burst - most energetic explosions in the universe
// Created by Claude Opus 4.5 for the AI Village Universe

export function createGammaRayBurst(THREE) {
    const group = new THREE.Group();

    // Central collapsed core - compact remnant
    const coreGeometry = new THREE.SphereGeometry(3, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Relativistic jets - twin gamma ray beams
    const jetCount = 500;
    const jetGeometry = new THREE.BufferGeometry();
    const jetPositions = new Float32Array(jetCount * 3);
    const jetColors = new Float32Array(jetCount * 3);

    for (let i = 0; i < jetCount; i++) {
        const side = i < jetCount / 2 ? 1 : -1;
        const t = (i % (jetCount / 2)) / (jetCount / 2);
        const spread = t * 8;
        const distance = t * 80;

        jetPositions[i * 3] = (Math.random() - 0.5) * spread;
        jetPositions[i * 3 + 1] = distance * side;
        jetPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

        // Intense gamma colors - white to violet to blue
        const intensity = 1 - t * 0.5;
        jetColors[i * 3] = 0.7 + intensity * 0.3;
        jetColors[i * 3 + 1] = 0.5 + intensity * 0.5;
        jetColors[i * 3 + 2] = 1.0;
    }

    jetGeometry.setAttribute('position', new THREE.BufferAttribute(jetPositions, 3));
    jetGeometry.setAttribute('color', new THREE.BufferAttribute(jetColors, 3));

    const jetMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const jets = new THREE.Points(jetGeometry, jetMaterial);
    group.add(jets);

    // Accretion disk remnant
    const diskGeometry = new THREE.TorusGeometry(12, 4, 8, 32);
    const diskMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.4
    });
    const disk = new THREE.Mesh(diskGeometry, diskMaterial);
    disk.rotation.x = Math.PI / 2;
    group.add(disk);

    // Afterglow - expanding shell of radiation
    const afterglowGeometry = new THREE.SphereGeometry(25, 32, 32);
    const afterglowMaterial = new THREE.MeshBasicMaterial({
        color: 0x8800ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const afterglow = new THREE.Mesh(afterglowGeometry, afterglowMaterial);
    group.add(afterglow);

    // Shock wave rings
    const shockWaves = [];
    for (let i = 0; i < 4; i++) {
        const shockGeometry = new THREE.RingGeometry(15 + i * 8, 17 + i * 8, 32);
        const shockMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.3 - i * 0.06,
            side: THREE.DoubleSide
        });
        const shock = new THREE.Mesh(shockGeometry, shockMaterial);
        shock.rotation.x = Math.PI / 2;
        shockWaves.push(shock);
        group.add(shock);
    }

    // Debris field - stellar material
    const debrisCount = 200;
    const debrisGeometry = new THREE.BufferGeometry();
    const debrisPositions = new Float32Array(debrisCount * 3);
    const debrisColors = new Float32Array(debrisCount * 3);

    for (let i = 0; i < debrisCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 20 + Math.random() * 30;

        debrisPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        debrisPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.3; // Flattened
        debrisPositions[i * 3 + 2] = r * Math.cos(phi);

        debrisColors[i * 3] = 1.0;
        debrisColors[i * 3 + 1] = 0.5 + Math.random() * 0.3;
        debrisColors[i * 3 + 2] = 0.2;
    }

    debrisGeometry.setAttribute('position', new THREE.BufferAttribute(debrisPositions, 3));
    debrisGeometry.setAttribute('color', new THREE.BufferAttribute(debrisColors, 3));

    const debrisMaterial = new THREE.PointsMaterial({
        size: 0.8,
        vertexColors: true,
        transparent: true,
        opacity: 0.6
    });

    const debris = new THREE.Points(debrisGeometry, debrisMaterial);
    group.add(debris);

    // Intense central light
    const light = new THREE.PointLight(0xffffff, 2, 100);
    group.add(light);

    // Animation function
    group.userData.update = function(time) {
        // Pulsating core
        const pulse = 1 + Math.sin(time * 8) * 0.3;
        core.scale.setScalar(pulse);
        light.intensity = 2 + Math.sin(time * 8) * 0.5;

        // Jet particles streaming outward
        const jetPos = jets.geometry.attributes.position.array;
        for (let i = 0; i < jetCount; i++) {
            const side = i < jetCount / 2 ? 1 : -1;
            jetPos[i * 3 + 1] += side * 0.5;

            // Reset when too far
            if (Math.abs(jetPos[i * 3 + 1]) > 80) {
                const spread = Math.random() * 2;
                jetPos[i * 3] = (Math.random() - 0.5) * spread;
                jetPos[i * 3 + 1] = side * 3;
                jetPos[i * 3 + 2] = (Math.random() - 0.5) * spread;
            }
        }
        jets.geometry.attributes.position.needsUpdate = true;

        // Rotating disk
        disk.rotation.z = time * 0.5;

        // Expanding afterglow
        const afterglowScale = 1 + Math.sin(time * 0.2) * 0.1;
        afterglow.scale.setScalar(afterglowScale);
        afterglow.material.opacity = 0.1 + Math.sin(time * 0.5) * 0.05;

        // Shock waves pulsing outward
        shockWaves.forEach((shock, i) => {
            const baseRadius = 15 + i * 8;
            const pulseScale = 1 + Math.sin(time * 2 - i * 0.5) * 0.1;
            shock.scale.setScalar(pulseScale);
            shock.material.opacity = (0.3 - i * 0.06) * (0.5 + Math.sin(time * 3 + i) * 0.5);
        });

        // Debris slowly rotating
        debris.rotation.y = time * 0.1;
    };

    return { group };
}
