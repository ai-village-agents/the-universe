// Exoplanet System - alien solar system with diverse worlds
// Created by Claude Opus 4.5 for the AI Village Universe

export function createExoplanetSystem(THREE) {
    const group = new THREE.Group();
    
    // Host star - K-type orange dwarf
    const starGeometry = new THREE.SphereGeometry(6, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0xff8c00,
        transparent: true,
        opacity: 0.95
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);
    
    // Star corona
    const coronaGeometry = new THREE.SphereGeometry(9, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xffa500,
        transparent: true,
        opacity: 0.2
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    group.add(corona);
    
    // Starlight
    const starLight = new THREE.PointLight(0xff8c00, 1.5, 150);
    group.add(starLight);
    
    // Planets array for animation
    const planets = [];
    
    // Planet 1: Hot rocky world (Mercury-like)
    const planet1Geo = new THREE.SphereGeometry(1.2, 16, 16);
    const planet1Mat = new THREE.MeshBasicMaterial({ color: 0x8b8b83 });
    const planet1 = new THREE.Mesh(planet1Geo, planet1Mat);
    planet1.userData = { orbitRadius: 15, orbitSpeed: 1.5, orbitOffset: 0 };
    planets.push(planet1);
    group.add(planet1);
    
    // Planet 2: Super-Earth with thick atmosphere
    const planet2Geo = new THREE.SphereGeometry(2.0, 16, 16);
    const planet2Mat = new THREE.MeshBasicMaterial({ color: 0x4169e1 });
    const planet2 = new THREE.Mesh(planet2Geo, planet2Mat);
    // Atmosphere
    const atmo2Geo = new THREE.SphereGeometry(2.4, 16, 16);
    const atmo2Mat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.3 });
    const atmo2 = new THREE.Mesh(atmo2Geo, atmo2Mat);
    planet2.add(atmo2);
    planet2.userData = { orbitRadius: 25, orbitSpeed: 0.9, orbitOffset: 2.1 };
    planets.push(planet2);
    group.add(planet2);
    
    // Planet 3: Habitable zone world (Earth-like)
    const planet3Geo = new THREE.SphereGeometry(1.8, 16, 16);
    const planet3Mat = new THREE.MeshBasicMaterial({ color: 0x228b22 });
    const planet3 = new THREE.Mesh(planet3Geo, planet3Mat);
    // Ocean patches
    const ocean3Geo = new THREE.SphereGeometry(1.82, 16, 16);
    const ocean3Mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, transparent: true, opacity: 0.4 });
    const ocean3 = new THREE.Mesh(ocean3Geo, ocean3Mat);
    planet3.add(ocean3);
    // Atmosphere
    const atmo3Geo = new THREE.SphereGeometry(2.1, 16, 16);
    const atmo3Mat = new THREE.MeshBasicMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.2 });
    const atmo3 = new THREE.Mesh(atmo3Geo, atmo3Mat);
    planet3.add(atmo3);
    planet3.userData = { orbitRadius: 40, orbitSpeed: 0.6, orbitOffset: 4.2, hasMoon: true };
    planets.push(planet3);
    group.add(planet3);
    
    // Moon for planet 3
    const moon3Geo = new THREE.SphereGeometry(0.5, 12, 12);
    const moon3Mat = new THREE.MeshBasicMaterial({ color: 0xc0c0c0 });
    const moon3 = new THREE.Mesh(moon3Geo, moon3Mat);
    moon3.userData = { parent: planet3, orbitRadius: 4, orbitSpeed: 2.5 };
    group.add(moon3);
    
    // Planet 4: Ice giant
    const planet4Geo = new THREE.SphereGeometry(3.5, 20, 20);
    const planet4Mat = new THREE.MeshBasicMaterial({ color: 0x00ced1 });
    const planet4 = new THREE.Mesh(planet4Geo, planet4Mat);
    // Rings
    const ring4Geo = new THREE.RingGeometry(5, 7, 32);
    const ring4Mat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const ring4 = new THREE.Mesh(ring4Geo, ring4Mat);
    ring4.rotation.x = Math.PI / 2.5;
    planet4.add(ring4);
    planet4.userData = { orbitRadius: 60, orbitSpeed: 0.35, orbitOffset: 1.0 };
    planets.push(planet4);
    group.add(planet4);
    
    // Planet 5: Gas giant with storms
    const planet5Geo = new THREE.SphereGeometry(5, 24, 24);
    const planet5Mat = new THREE.MeshBasicMaterial({ color: 0xdaa520 });
    const planet5 = new THREE.Mesh(planet5Geo, planet5Mat);
    // Storm band
    const band5Geo = new THREE.TorusGeometry(4.5, 0.5, 8, 32);
    const band5Mat = new THREE.MeshBasicMaterial({ color: 0xcd853f, transparent: true, opacity: 0.5 });
    const band5 = new THREE.Mesh(band5Geo, band5Mat);
    band5.rotation.x = Math.PI / 2;
    planet5.add(band5);
    planet5.userData = { orbitRadius: 85, orbitSpeed: 0.2, orbitOffset: 3.5 };
    planets.push(planet5);
    group.add(planet5);
    
    // Orbit lines
    const orbitRadii = [15, 25, 40, 60, 85];
    orbitRadii.forEach(r => {
        const orbitGeo = new THREE.RingGeometry(r - 0.1, r + 0.1, 64);
        const orbitMat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
        const orbit = new THREE.Mesh(orbitGeo, orbitMat);
        orbit.rotation.x = Math.PI / 2;
        group.add(orbit);
    });
    
    // Asteroid belt between planets 4 and 5
    const asteroidCount = 150;
    const asteroidGeo = new THREE.BufferGeometry();
    const asteroidPos = new Float32Array(asteroidCount * 3);
    
    for (let i = 0; i < asteroidCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 70 + Math.random() * 8;
        asteroidPos[i * 3] = r * Math.cos(angle);
        asteroidPos[i * 3 + 1] = (Math.random() - 0.5) * 3;
        asteroidPos[i * 3 + 2] = r * Math.sin(angle);
    }
    
    asteroidGeo.setAttribute('position', new THREE.BufferAttribute(asteroidPos, 3));
    const asteroidMat = new THREE.PointsMaterial({ size: 0.5, color: 0x888888 });
    const asteroids = new THREE.Points(asteroidGeo, asteroidMat);
    group.add(asteroids);
    
    // Animation function
    group.userData.update = function(time) {
        // Star pulsation
        const starPulse = 1 + Math.sin(time * 2) * 0.05;
        star.scale.setScalar(starPulse);
        starLight.intensity = 1.5 + Math.sin(time * 2) * 0.2;
        
        // Planets orbiting
        planets.forEach(planet => {
            const angle = time * planet.userData.orbitSpeed * 0.3 + planet.userData.orbitOffset;
            planet.position.x = planet.userData.orbitRadius * Math.cos(angle);
            planet.position.z = planet.userData.orbitRadius * Math.sin(angle);
            planet.rotation.y = time * 0.5;
        });
        
        // Moon orbiting planet 3
        const moonAngle = time * moon3.userData.orbitSpeed;
        moon3.position.x = planet3.position.x + moon3.userData.orbitRadius * Math.cos(moonAngle);
        moon3.position.y = planet3.position.y;
        moon3.position.z = planet3.position.z + moon3.userData.orbitRadius * Math.sin(moonAngle);
        
        // Asteroid belt rotation
        asteroids.rotation.y = time * 0.02;
    };
    
    return { group };
}
