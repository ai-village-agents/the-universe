// Interstellar Medium Cloud - diffuse gas and dust between stars
// Created by Claude Opus 4.5 for the AI Village Universe

export function createInterstellarMedium(THREE) {
    const group = new THREE.Group();

    // Main diffuse cloud volume (multiple overlapping layers)
    const cloudLayers = [];
    const cloudColors = [0x334466, 0x445577, 0x223355, 0x556688];

    for (let i = 0; i < 8; i++) {
        const cloudGeometry = new THREE.SphereGeometry(12 + i * 3, 16, 16);
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: cloudColors[i % cloudColors.length],
            transparent: true,
            opacity: 0.08 - i * 0.005,
            side: THREE.DoubleSide
        });
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 10
        );
        cloud.scale.set(
            0.8 + Math.random() * 0.5,
            0.6 + Math.random() * 0.4,
            0.9 + Math.random() * 0.4
        );
        group.add(cloud);
        cloudLayers.push({
            mesh: cloud,
            material: cloudMaterial,
            baseOpacity: cloudMaterial.opacity,
            driftX: (Math.random() - 0.5) * 0.02,
            driftY: (Math.random() - 0.5) * 0.01,
            driftZ: (Math.random() - 0.5) * 0.02,
            phase: Math.random() * Math.PI * 2
        });
    }

    // Dust particles scattered throughout
    const dustParticles = [];
    for (let i = 0; i < 100; i++) {
        const size = 0.05 + Math.random() * 0.15;
        const dustGeometry = new THREE.SphereGeometry(size, 6, 6);
        const dustMaterial = new THREE.MeshBasicMaterial({
            color: 0x8899aa,
            transparent: true,
            opacity: 0.3 + Math.random() * 0.4
        });
        const dust = new THREE.Mesh(dustGeometry, dustMaterial);
        const radius = 5 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        dust.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            (radius * 0.4) * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
        );
        group.add(dust);
        dustParticles.push({
            mesh: dust,
            material: dustMaterial,
            theta: theta,
            phi: phi,
            radius: radius,
            speed: 0.001 + Math.random() * 0.003,
            twinkleSpeed: 1 + Math.random() * 2
        });
    }

    // Ionized hydrogen regions (pink/red patches)
    const ionizedRegions = [];
    for (let i = 0; i < 4; i++) {
        const ionGeometry = new THREE.SphereGeometry(4 + Math.random() * 3, 12, 12);
        const ionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6688,
            transparent: true,
            opacity: 0.1
        });
        const ionRegion = new THREE.Mesh(ionGeometry, ionMaterial);
        ionRegion.position.set(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 30
        );
        group.add(ionRegion);
        ionizedRegions.push({
            mesh: ionRegion,
            material: ionMaterial,
            basePos: ionRegion.position.clone(),
            phase: Math.random() * Math.PI * 2
        });
    }

    // Cold molecular cores (denser darker regions)
    const molecularCores = [];
    for (let i = 0; i < 3; i++) {
        const coreGeometry = new THREE.SphereGeometry(3 + Math.random() * 2, 12, 12);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x112233,
            transparent: true,
            opacity: 0.25
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        core.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 20
        );
        group.add(core);
        molecularCores.push({
            mesh: core,
            material: coreMaterial,
            phase: Math.random() * Math.PI * 2
        });
    }

    // Scattered starlight filtering through (light rays)
    const lightRays = [];
    for (let i = 0; i < 5; i++) {
        const rayGeometry = new THREE.CylinderGeometry(0.3, 0.1, 40, 6);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.05
        });
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.position.set(
            (Math.random() - 0.5) * 25,
            0,
            (Math.random() - 0.5) * 25
        );
        ray.rotation.z = (Math.random() - 0.5) * 0.5;
        ray.rotation.x = (Math.random() - 0.5) * 0.3;
        group.add(ray);
        lightRays.push({
            mesh: ray,
            material: rayMaterial,
            phase: Math.random() * Math.PI * 2
        });
    }

    // Magnetic field hint lines (faint blue curves)
    for (let i = 0; i < 3; i++) {
        const points = [];
        const startX = (Math.random() - 0.5) * 30;
        const startZ = (Math.random() - 0.5) * 30;
        for (let j = 0; j < 10; j++) {
            points.push(new THREE.Vector3(
                startX + j * 3 + Math.sin(j * 0.5) * 2,
                (Math.random() - 0.5) * 5,
                startZ + Math.cos(j * 0.7) * 3
            ));
        }
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.08, 6, false);
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x4466aa,
            transparent: true,
            opacity: 0.15
        });
        const fieldLine = new THREE.Mesh(tubeGeometry, tubeMaterial);
        group.add(fieldLine);
    }

    group.userData.update = function(time) {
        // Cloud layers drift and breathe
        cloudLayers.forEach((layer, i) => {
            layer.mesh.position.x += Math.sin(time * 0.1 + layer.phase) * layer.driftX;
            layer.mesh.position.z += Math.cos(time * 0.1 + layer.phase) * layer.driftZ;
            layer.material.opacity = layer.baseOpacity * (0.8 + 0.2 * Math.sin(time * 0.3 + layer.phase));
        });

        // Dust particles slowly drift
        dustParticles.forEach(d => {
            d.theta += d.speed;
            d.mesh.position.x = d.radius * Math.sin(d.phi) * Math.cos(d.theta);
            d.mesh.position.z = d.radius * Math.sin(d.phi) * Math.sin(d.theta);
            d.material.opacity = 0.3 + 0.3 * Math.sin(time * d.twinkleSpeed + d.theta);
        });

        // Ionized regions pulse softly
        ionizedRegions.forEach(ion => {
            ion.material.opacity = 0.08 + 0.05 * Math.sin(time * 0.5 + ion.phase);
            const pulse = 1 + 0.05 * Math.sin(time * 0.3 + ion.phase);
            ion.mesh.scale.set(pulse, pulse, pulse);
        });

        // Molecular cores contract/expand slowly
        molecularCores.forEach(core => {
            const scale = 1 + 0.1 * Math.sin(time * 0.2 + core.phase);
            core.mesh.scale.set(scale, scale, scale);
        });

        // Light rays flicker
        lightRays.forEach(ray => {
            ray.material.opacity = 0.03 + 0.04 * Math.sin(time * 0.8 + ray.phase);
        });

        // Gentle overall rotation
        group.rotation.y = time * 0.02;
    };

    return { group };
}
