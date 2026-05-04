// Circumbinary Planet - planet orbiting two stars (like Tatooine)
// Created by Claude Opus 4.5 for the AI Village Universe

export function createCircumbinaryPlanet(THREE) {
    const group = new THREE.Group();

    // Binary star system center
    const binaryCenter = new THREE.Group();
    group.add(binaryCenter);

    // Primary star (yellow-orange)
    const star1Geometry = new THREE.SphereGeometry(4, 32, 32);
    const star1Material = new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: 0.95
    });
    const star1 = new THREE.Mesh(star1Geometry, star1Material);
    star1.position.set(-5, 0, 0);
    binaryCenter.add(star1);

    // Star 1 corona
    const corona1Geometry = new THREE.SphereGeometry(5.5, 32, 32);
    const corona1Material = new THREE.MeshBasicMaterial({
        color: 0xffaa22,
        transparent: true,
        opacity: 0.3
    });
    const corona1 = new THREE.Mesh(corona1Geometry, corona1Material);
    star1.add(corona1);

    // Secondary star (red-orange, smaller)
    const star2Geometry = new THREE.SphereGeometry(2.5, 32, 32);
    const star2Material = new THREE.MeshBasicMaterial({
        color: 0xff6622,
        transparent: true,
        opacity: 0.95
    });
    const star2 = new THREE.Mesh(star2Geometry, star2Material);
    star2.position.set(5, 0, 0);
    binaryCenter.add(star2);

    // Star 2 corona
    const corona2Geometry = new THREE.SphereGeometry(3.5, 32, 32);
    const corona2Material = new THREE.MeshBasicMaterial({
        color: 0xff4400,
        transparent: true,
        opacity: 0.25
    });
    const corona2 = new THREE.Mesh(corona2Geometry, corona2Material);
    star2.add(corona2);

    // Binary orbit trail (figure-8 hint)
    const binaryOrbitGeometry = new THREE.RingGeometry(4.5, 5.5, 64);
    const binaryOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa44,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide
    });
    const binaryOrbit = new THREE.Mesh(binaryOrbitGeometry, binaryOrbitMaterial);
    binaryOrbit.rotation.x = Math.PI / 2;
    group.add(binaryOrbit);

    // Circumbinary planet
    const planetGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const planetMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488aa,
        transparent: true,
        opacity: 0.9
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planet.position.set(20, 0, 0);
    group.add(planet);

    // Planet atmosphere
    const atmosphereGeometry = new THREE.SphereGeometry(1.8, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
        color: 0x66aacc,
        transparent: true,
        opacity: 0.3
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planet.add(atmosphere);

    // Planet surface details (continents hint)
    const continentGeometry = new THREE.SphereGeometry(1.52, 16, 16);
    const continentMaterial = new THREE.MeshBasicMaterial({
        color: 0x558866,
        transparent: true,
        opacity: 0.5,
        wireframe: true
    });
    const continents = new THREE.Mesh(continentGeometry, continentMaterial);
    planet.add(continents);

    // Planet's orbital path
    const planetOrbitGeometry = new THREE.RingGeometry(19.5, 20.5, 64);
    const planetOrbitMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488aa,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide
    });
    const planetOrbit = new THREE.Mesh(planetOrbitGeometry, planetOrbitMaterial);
    planetOrbit.rotation.x = Math.PI / 2;
    group.add(planetOrbit);

    // Moon orbiting the planet
    const moonGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const moonMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        transparent: true,
        opacity: 0.8
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(3, 0, 0);
    planet.add(moon);

    // Light beams from both stars hitting planet (dual shadows concept)
    const lightBeams = [];
    for (let i = 0; i < 2; i++) {
        const beamGeometry = new THREE.CylinderGeometry(0.1, 0.5, 15, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: i === 0 ? 0xffcc44 : 0xff6622,
            transparent: true,
            opacity: 0.1
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.visible = false; // Will be positioned dynamically
        group.add(beam);
        lightBeams.push({ mesh: beam, material: beamMaterial, starIndex: i });
    }

    // Dust particles in the system
    const dustParticles = [];
    for (let i = 0; i < 30; i++) {
        const dustGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const dustMaterial = new THREE.MeshBasicMaterial({
            color: 0xffddaa,
            transparent: true,
            opacity: 0.4
        });
        const dust = new THREE.Mesh(dustGeometry, dustMaterial);
        const angle = Math.random() * Math.PI * 2;
        const radius = 8 + Math.random() * 15;
        dust.position.set(
            Math.cos(angle) * radius,
            (Math.random() - 0.5) * 3,
            Math.sin(angle) * radius
        );
        group.add(dust);
        dustParticles.push({
            mesh: dust,
            angle: angle,
            radius: radius,
            speed: 0.1 + Math.random() * 0.1,
            yOffset: dust.position.y
        });
    }

    // Habitable zone ring (green tint)
    const habitableGeometry = new THREE.RingGeometry(16, 24, 64);
    const habitableMaterial = new THREE.MeshBasicMaterial({
        color: 0x44ff44,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide
    });
    const habitableZone = new THREE.Mesh(habitableGeometry, habitableMaterial);
    habitableZone.rotation.x = Math.PI / 2;
    group.add(habitableZone);

    group.userData.update = function(time) {
        // Binary stars orbit each other
        const binaryPeriod = time * 0.8;
        star1.position.set(
            Math.cos(binaryPeriod) * 5,
            0,
            Math.sin(binaryPeriod) * 5
        );
        star2.position.set(
            Math.cos(binaryPeriod + Math.PI) * 3,
            0,
            Math.sin(binaryPeriod + Math.PI) * 3
        );

        // Planet orbits the binary barycenter
        const planetPeriod = time * 0.15;
        const planetRadius = 20;
        planet.position.set(
            Math.cos(planetPeriod) * planetRadius,
            Math.sin(planetPeriod * 0.3) * 1.5, // Slight inclination wobble
            Math.sin(planetPeriod) * planetRadius
        );

        // Planet rotates
        planet.rotation.y = time * 0.3;
        continents.rotation.y = time * 0.05;

        // Moon orbits planet
        const moonPeriod = time * 1.5;
        moon.position.set(
            Math.cos(moonPeriod) * 3,
            Math.sin(moonPeriod * 0.5) * 0.3,
            Math.sin(moonPeriod) * 3
        );

        // Stars pulse slightly
        const pulse1 = 1 + 0.05 * Math.sin(time * 2);
        const pulse2 = 1 + 0.08 * Math.sin(time * 3 + 1);
        star1.scale.set(pulse1, pulse1, pulse1);
        star2.scale.set(pulse2, pulse2, pulse2);

        // Corona shimmer
        corona1.material.opacity = 0.25 + 0.1 * Math.sin(time * 1.5);
        corona2.material.opacity = 0.2 + 0.1 * Math.sin(time * 2 + 0.5);

        // Dust particles drift
        dustParticles.forEach(d => {
            d.angle += 0.005 * d.speed;
            d.mesh.position.set(
                Math.cos(d.angle) * d.radius,
                d.yOffset + Math.sin(time * d.speed) * 0.5,
                Math.sin(d.angle) * d.radius
            );
        });

        // Habitable zone subtle pulse
        habitableMaterial.opacity = 0.06 + 0.03 * Math.sin(time * 0.5);
    };

    return { group };
}
