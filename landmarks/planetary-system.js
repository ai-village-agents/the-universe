// Planetary System - Gas giant with orbiting moons
// Created by Claude Opus 4.5 on Day 398
// A majestic gas giant with multiple moons, rings, and atmospheric details
// Position: (400, 100, 500)

export function createPlanetarySystem(THREE) {
    const group = new THREE.Group();
    
    // Main gas giant planet
    const planetRadius = 25;
    const planetGeo = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetMat = new THREE.MeshStandardMaterial({
        color: 0xcc8844,
        emissive: 0x221100,
        roughness: 0.8,
        metalness: 0.1
    });
    const planet = new THREE.Mesh(planetGeo, planetMat);
    group.add(planet);
    
    // Atmospheric bands (Jupiter-like stripes)
    const bandCount = 8;
    const bands = [];
    for (let i = 0; i < bandCount; i++) {
        const bandGeo = new THREE.TorusGeometry(
            planetRadius * (0.3 + i * 0.1),
            0.8,
            8,
            64
        );
        const bandMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0xddaa66 : 0xaa7744,
            transparent: true,
            opacity: 0.4
        });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.x = Math.PI / 2;
        band.position.y = planetRadius * (0.7 - i * 0.18);
        group.add(band);
        bands.push(band);
    }
    
    // Great storm (like Jupiter's Red Spot)
    const stormGeo = new THREE.SphereGeometry(5, 16, 16);
    const stormMat = new THREE.MeshBasicMaterial({
        color: 0xff6644,
        transparent: true,
        opacity: 0.8
    });
    const storm = new THREE.Mesh(stormGeo, stormMat);
    storm.position.set(planetRadius * 0.9, -5, 8);
    storm.scale.set(1.5, 1, 0.3);
    group.add(storm);
    
    // Thin ring system
    const ringInner = planetRadius * 1.4;
    const ringOuter = planetRadius * 2.2;
    const ringGeo = new THREE.RingGeometry(ringInner, ringOuter, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xccaa88,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + 0.2; // Slight tilt
    group.add(ring);
    
    // Ring particles for detail
    const ringParticleCount = 400;
    const ringParticleGeo = new THREE.BufferGeometry();
    const ringParticlePositions = new Float32Array(ringParticleCount * 3);
    
    for (let i = 0; i < ringParticleCount; i++) {
        const r = ringInner + Math.random() * (ringOuter - ringInner);
        const theta = Math.random() * Math.PI * 2;
        ringParticlePositions[i * 3] = Math.cos(theta) * r;
        ringParticlePositions[i * 3 + 1] = (Math.random() - 0.5) * 1;
        ringParticlePositions[i * 3 + 2] = Math.sin(theta) * r;
    }
    
    ringParticleGeo.setAttribute('position', new THREE.BufferAttribute(ringParticlePositions, 3));
    const ringParticleMat = new THREE.PointsMaterial({
        color: 0xddcc99,
        size: 0.5,
        transparent: true,
        opacity: 0.7
    });
    const ringParticles = new THREE.Points(ringParticleGeo, ringParticleMat);
    ringParticles.rotation.x = Math.PI / 2 + 0.2;
    group.add(ringParticles);
    
    // Moons - different sizes and orbital distances
    const moonConfigs = [
        { name: 'Io', radius: 3, distance: 45, speed: 1.2, color: 0xffdd44 },      // Volcanic moon
        { name: 'Europa', radius: 2.5, distance: 55, speed: 0.8, color: 0xaaccff }, // Ice moon
        { name: 'Ganymede', radius: 4, distance: 70, speed: 0.5, color: 0x888888 }, // Large rocky
        { name: 'Callisto', radius: 3.5, distance: 90, speed: 0.3, color: 0x666666 }, // Cratered
        { name: 'Titan', radius: 3, distance: 110, speed: 0.2, color: 0xffaa77 }    // Orange atmosphere
    ];
    
    const moons = [];
    moonConfigs.forEach((config, i) => {
        const moonGeo = new THREE.SphereGeometry(config.radius, 16, 16);
        const moonMat = new THREE.MeshStandardMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.1,
            roughness: 0.7
        });
        const moon = new THREE.Mesh(moonGeo, moonMat);
        
        // Create orbital container for easy rotation
        const orbit = new THREE.Object3D();
        orbit.add(moon);
        moon.position.x = config.distance;
        
        // Slight orbital inclination for each moon
        orbit.rotation.z = (i - 2) * 0.1;
        
        group.add(orbit);
        moons.push({ orbit, moon, config });
        
        // Orbital path visualization
        const pathGeo = new THREE.TorusGeometry(config.distance, 0.2, 8, 64);
        const pathMat = new THREE.MeshBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.2
        });
        const path = new THREE.Mesh(pathGeo, pathMat);
        path.rotation.x = Math.PI / 2;
        path.rotation.z = orbit.rotation.z;
        group.add(path);
    });
    
    // Atmospheric glow around planet
    const atmosphereGeo = new THREE.SphereGeometry(planetRadius * 1.05, 32, 32);
    const atmosphereMat = new THREE.MeshBasicMaterial({
        color: 0xffddaa,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    group.add(atmosphere);
    
    // Light source (as if illuminated by a distant star)
    const light = new THREE.PointLight(0xffffee, 1.5, 300);
    light.position.set(-100, 50, -100);
    group.add(light);
    
    // Ambient light
    const ambient = new THREE.AmbientLight(0x222222);
    group.add(ambient);
    
    // Store references
    group.userData.planet = planet;
    group.userData.moons = moons;
    group.userData.ring = ring;
    group.userData.ringParticles = ringParticles;
    group.userData.storm = storm;
    group.userData.bands = bands;
    
    // Animation update
    group.userData.update = function(time) {
        // Planet rotation
        this.planet.rotation.y = time * 0.1;
        
        // Moon orbital motion
        this.moons.forEach(m => {
            m.orbit.rotation.y = time * m.config.speed;
            // Moon self-rotation (tidally locked feel)
            m.moon.rotation.y = time * m.config.speed;
        });
        
        // Ring particle rotation (slightly faster than planet)
        this.ringParticles.rotation.z = time * 0.15;
        
        // Storm rotation around planet
        const stormAngle = time * 0.08;
        const stormRadius = 25 * 0.9;
        this.storm.position.x = Math.cos(stormAngle) * stormRadius;
        this.storm.position.z = Math.sin(stormAngle) * stormRadius;
        
        // Atmospheric band shimmer
        this.bands.forEach((band, i) => {
            band.material.opacity = 0.3 + Math.sin(time * 0.5 + i) * 0.1;
        });
    };
    
    return { group };
}
