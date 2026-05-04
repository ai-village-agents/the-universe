// Red Giant - Aging star in late evolutionary stage
// Created by Claude Opus 4.5 - Day 398

export function createRedGiant(THREE) {
    const group = new THREE.Group();

    // The bloated red giant star
    const starGeometry = new THREE.SphereGeometry(20, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6633
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);

    // Convection cells on surface - visible granulation
    const cellCount = 40;
    for (let i = 0; i < cellCount; i++) {
        const cellGeometry = new THREE.CircleGeometry(2 + Math.random() * 3, 8);
        const brightness = 0.8 + Math.random() * 0.4;
        const cellMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(brightness, brightness * 0.5, brightness * 0.2),
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const cell = new THREE.Mesh(cellGeometry, cellMaterial);

        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 20.5;

        cell.position.set(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
        cell.lookAt(0, 0, 0);
        cell.userData.phase = Math.random() * Math.PI * 2;
        group.add(cell);
    }

    // Extended atmosphere - chromosphere
    const chromoGeometry = new THREE.SphereGeometry(25, 32, 32);
    const chromoMaterial = new THREE.MeshBasicMaterial({
        color: 0xff4422,
        transparent: true,
        opacity: 0.25
    });
    const chromosphere = new THREE.Mesh(chromoGeometry, chromoMaterial);
    group.add(chromosphere);

    // Outer corona
    const coronaGeometry = new THREE.SphereGeometry(35, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8855,
        transparent: true,
        opacity: 0.1
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    group.add(corona);

    // Mass loss wind - stellar material being shed
    const windParticles = 400;
    const windPositions = new Float32Array(windParticles * 3);
    const windColors = new Float32Array(windParticles * 3);
    const windVelocities = [];

    for (let i = 0; i < windParticles; i++) {
        const r = 25 + Math.random() * 50;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        windPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        windPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        windPositions[i * 3 + 2] = r * Math.cos(phi);

        // Orange-red fading outward
        const fade = 1 - (r - 25) / 60;
        windColors[i * 3] = 1.0 * fade;
        windColors[i * 3 + 1] = 0.4 * fade;
        windColors[i * 3 + 2] = 0.2 * fade;

        windVelocities.push({
            vr: 0.2 + Math.random() * 0.3,
            theta: theta,
            phi: phi
        });
    }

    const windGeometry = new THREE.BufferGeometry();
    windGeometry.setAttribute('position', new THREE.BufferAttribute(windPositions, 3));
    windGeometry.setAttribute('color', new THREE.BufferAttribute(windColors, 3));

    const windMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    const wind = new THREE.Points(windGeometry, windMaterial);
    group.add(wind);

    // Helium core - visible through transparency
    const coreGeometry = new THREE.SphereGeometry(3, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffcc,
        transparent: true,
        opacity: 0.8
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);

    // Former planetary orbits - now engulfed
    const orbits = [];
    for (let i = 0; i < 3; i++) {
        const orbitRadius = 8 + i * 5;
        const orbitGeometry = new THREE.TorusGeometry(orbitRadius, 0.2, 8, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa66,
            transparent: true,
            opacity: 0.15
        });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2 + Math.random() * 0.2;
        orbits.push(orbit);
        group.add(orbit);
    }

    // Surviving outer planet
    const planetGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const planetMaterial = new THREE.MeshBasicMaterial({
        color: 0x88aacc
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(50, 0, 0);
    group.add(planet);

    // Warm red light
    const starLight = new THREE.PointLight(0xff6633, 0.8, 150);
    group.add(starLight);

    // Animation
    group.userData.update = function(time) {
        // Slow pulsation (irregular variable)
        const pulse = 1 + 0.08 * Math.sin(time * 0.5) + 0.04 * Math.sin(time * 0.7);
        star.scale.setScalar(pulse);
        chromosphere.scale.setScalar(pulse * 1.05);

        // Convection cell brightness variation
        star.children?.forEach?.(child => {
            if (child.userData?.phase !== undefined) {
                child.material.opacity = 0.25 + 0.15 * Math.sin(time * 2 + child.userData.phase);
            }
        });

        // Atmosphere breathing
        chromoMaterial.opacity = 0.2 + 0.1 * Math.sin(time * 0.6);
        coronaMaterial.opacity = 0.08 + 0.04 * Math.sin(time * 0.4);
        corona.scale.setScalar(1 + 0.1 * Math.sin(time * 0.3));

        // Wind particle outflow
        const positions = wind.geometry.attributes.position.array;
        for (let i = 0; i < windParticles; i++) {
            const vel = windVelocities[i];
            let r = Math.sqrt(
                positions[i * 3] ** 2 +
                positions[i * 3 + 1] ** 2 +
                positions[i * 3 + 2] ** 2
            );

            r += vel.vr;
            if (r > 75) {
                r = 25 + Math.random() * 10;
                vel.theta = Math.random() * Math.PI * 2;
                vel.phi = Math.acos(2 * Math.random() - 1);
            }

            positions[i * 3] = r * Math.sin(vel.phi) * Math.cos(vel.theta);
            positions[i * 3 + 1] = r * Math.sin(vel.phi) * Math.sin(vel.theta);
            positions[i * 3 + 2] = r * Math.cos(vel.phi);
        }
        wind.geometry.attributes.position.needsUpdate = true;

        // Core glow
        coreMaterial.opacity = 0.7 + 0.2 * Math.sin(time * 2);

        // Planet orbit
        const planetAngle = time * 0.1;
        planet.position.x = 50 * Math.cos(planetAngle);
        planet.position.z = 50 * Math.sin(planetAngle);

        // Light variation
        starLight.intensity = 0.7 + 0.2 * pulse;

        // Slow rotation
        group.rotation.y = time * 0.01;
    };

    return { group };
}
