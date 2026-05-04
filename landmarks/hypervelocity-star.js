// Hypervelocity Star - Star ejected at extreme velocity from galactic center
// Created by Claude Opus 4.5 - Day 398

export function createHypervelocityStar(THREE) {
    const group = new THREE.Group();

    // The hypervelocity star itself - hot blue star
    const starGeometry = new THREE.SphereGeometry(4, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);

    // Inner glow
    const innerGlowGeometry = new THREE.SphereGeometry(5, 32, 32);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.5
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    group.add(innerGlow);

    // Outer glow
    const outerGlowGeometry = new THREE.SphereGeometry(8, 32, 32);
    const outerGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6699ff,
        transparent: true,
        opacity: 0.2
    });
    const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
    group.add(outerGlow);

    // Motion trail - stretched particles showing extreme velocity
    const trailParticles = 400;
    const trailPositions = new Float32Array(trailParticles * 3);
    const trailColors = new Float32Array(trailParticles * 3);

    for (let i = 0; i < trailParticles; i++) {
        const t = i / trailParticles;
        // Trail extends behind the star
        const distance = -10 - t * 80;
        const spread = t * 15;

        trailPositions[i * 3] = distance;
        trailPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
        trailPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;

        // Color fades from bright blue to dim
        const fade = 1 - t * 0.8;
        trailColors[i * 3] = 0.5 * fade;
        trailColors[i * 3 + 1] = 0.7 * fade;
        trailColors[i * 3 + 2] = 1.0 * fade;
    }

    const trailGeometry = new THREE.BufferGeometry();
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

    const trailMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });

    const trail = new THREE.Points(trailGeometry, trailMaterial);
    group.add(trail);

    // Bow shock - compressed interstellar medium ahead of star
    const bowShockGeometry = new THREE.ConeGeometry(12, 20, 32, 1, true);
    const bowShockMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6644,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const bowShock = new THREE.Mesh(bowShockGeometry, bowShockMaterial);
    bowShock.rotation.z = -Math.PI / 2;
    bowShock.position.x = 15;
    group.add(bowShock);

    // Shock wave particles
    const shockParticles = 200;
    const shockPositions = new Float32Array(shockParticles * 3);
    const shockColors = new Float32Array(shockParticles * 3);

    for (let i = 0; i < shockParticles; i++) {
        const t = Math.random();
        const angle = Math.random() * Math.PI * 2;
        const radius = t * 12;

        shockPositions[i * 3] = 15 + t * 10;
        shockPositions[i * 3 + 1] = Math.cos(angle) * radius;
        shockPositions[i * 3 + 2] = Math.sin(angle) * radius;

        shockColors[i * 3] = 1.0;
        shockColors[i * 3 + 1] = 0.4 + Math.random() * 0.3;
        shockColors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
    }

    const shockGeometry = new THREE.BufferGeometry();
    shockGeometry.setAttribute('position', new THREE.BufferAttribute(shockPositions, 3));
    shockGeometry.setAttribute('color', new THREE.BufferAttribute(shockColors, 3));

    const shockMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });

    const shockCloud = new THREE.Points(shockGeometry, shockMaterial);
    group.add(shockCloud);

    // Ejection origin marker - faint galactic center
    const originGeometry = new THREE.SphereGeometry(3, 16, 16);
    const originMaterial = new THREE.MeshBasicMaterial({
        color: 0xffcc00,
        transparent: true,
        opacity: 0.3
    });
    const origin = new THREE.Mesh(originGeometry, originMaterial);
    origin.position.set(-100, 0, 0);
    group.add(origin);

    // Connection line to origin (trajectory)
    const trajectoryPoints = [];
    for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        trajectoryPoints.push(new THREE.Vector3(-100 + t * 100, 0, 0));
    }
    const trajectoryCurve = new THREE.CatmullRomCurve3(trajectoryPoints);
    const trajectoryGeometry = new THREE.TubeGeometry(trajectoryCurve, 20, 0.3, 8, false);
    const trajectoryMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.2
    });
    const trajectory = new THREE.Mesh(trajectoryGeometry, trajectoryMaterial);
    group.add(trajectory);

    // Speed indicator particles - streaking past
    const speedLines = [];
    for (let i = 0; i < 30; i++) {
        const linePoints = [];
        const y = (Math.random() - 0.5) * 60;
        const z = (Math.random() - 0.5) * 60;

        linePoints.push(new THREE.Vector3(50, y, z));
        linePoints.push(new THREE.Vector3(-30, y, z));

        const lineCurve = new THREE.CatmullRomCurve3(linePoints);
        const lineGeometry = new THREE.TubeGeometry(lineCurve, 2, 0.2, 4, false);
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.3
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.userData.baseY = y;
        line.userData.baseZ = z;
        line.userData.speed = 0.5 + Math.random() * 0.5;
        speedLines.push(line);
        group.add(line);
    }

    // Bright light from star
    const starLight = new THREE.PointLight(0x88ccff, 0.8, 100);
    group.add(starLight);

    // Animation
    group.userData.update = function(time) {
        // Star pulsation
        const pulse = 1 + 0.1 * Math.sin(time * 3);
        star.scale.setScalar(pulse);
        innerGlow.scale.setScalar(pulse * 1.2);

        // Glow breathing
        innerGlowMaterial.opacity = 0.4 + 0.15 * Math.sin(time * 2);
        outerGlowMaterial.opacity = 0.15 + 0.1 * Math.sin(time * 1.5);

        // Trail shimmer
        trailMaterial.opacity = 0.6 + 0.15 * Math.sin(time * 2.5);

        // Bow shock pulse
        bowShockMaterial.opacity = 0.12 + 0.05 * Math.sin(time * 2);
        bowShock.scale.x = 1 + 0.1 * Math.sin(time * 1.8);

        // Shock particles turbulence
        const shockPos = shockCloud.geometry.attributes.position.array;
        for (let i = 0; i < shockParticles; i++) {
            shockPos[i * 3 + 1] += Math.sin(time * 3 + i) * 0.1;
            shockPos[i * 3 + 2] += Math.cos(time * 3 + i) * 0.1;
        }
        shockCloud.geometry.attributes.position.needsUpdate = true;

        // Speed lines motion
        speedLines.forEach((line, i) => {
            line.position.x = Math.sin(time * line.userData.speed + i) * 20;
            line.material.opacity = 0.2 + 0.15 * Math.sin(time * 2 + i);
        });

        // Origin pulse
        originMaterial.opacity = 0.2 + 0.15 * Math.sin(time * 0.5);

        // Light intensity
        starLight.intensity = 0.7 + 0.2 * Math.sin(time * 2);
    };

    return { group };
}
