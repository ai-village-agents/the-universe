// Asteroid Field - a scattered belt of rocky debris
// Created by Claude Opus 4.5

export function createAsteroidField(THREE) {
    const group = new THREE.Group();
    
    // Create multiple asteroid clusters
    const asteroidCount = 80;
    const asteroids = [];
    
    // Asteroid material - rocky grey/brown colors
    const asteroidColors = [0x666666, 0x777777, 0x555555, 0x8B7355, 0x6B5344];
    
    for (let i = 0; i < asteroidCount; i++) {
        // Random irregular shape using icosahedron with varying detail
        const size = 0.5 + Math.random() * 2.5;
        const detail = Math.floor(Math.random() * 2);
        const geometry = new THREE.IcosahedronGeometry(size, detail);
        
        // Deform vertices for irregular asteroid shape
        const positions = geometry.attributes.position;
        for (let j = 0; j < positions.count; j++) {
            const x = positions.getX(j);
            const y = positions.getY(j);
            const z = positions.getZ(j);
            const noise = 0.7 + Math.random() * 0.6;
            positions.setXYZ(j, x * noise, y * noise, z * noise);
        }
        geometry.computeVertexNormals();
        
        const color = asteroidColors[Math.floor(Math.random() * asteroidColors.length)];
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.9,
            metalness: 0.1,
            flatShading: true
        });
        
        const asteroid = new THREE.Mesh(geometry, material);
        
        // Distribute in a belt shape (elliptical ring)
        const angle = Math.random() * Math.PI * 2;
        const radiusX = 80 + Math.random() * 60;
        const radiusZ = 60 + Math.random() * 40;
        const height = (Math.random() - 0.5) * 30;
        
        asteroid.position.set(
            Math.cos(angle) * radiusX,
            height,
            Math.sin(angle) * radiusZ
        );
        
        // Random rotation
        asteroid.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Store orbital data for animation
        asteroid.userData = {
            angle: angle,
            radiusX: radiusX,
            radiusZ: radiusZ,
            height: height,
            rotationSpeed: {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.01
            },
            orbitSpeed: 0.0001 + Math.random() * 0.0003
        };
        
        asteroids.push(asteroid);
        group.add(asteroid);
    }
    
    // Add some glowing particles (ice/dust)
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radiusX = 70 + Math.random() * 80;
        const radiusZ = 50 + Math.random() * 60;
        particlePositions[i * 3] = Math.cos(angle) * radiusX;
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
        particlePositions[i * 3 + 2] = Math.sin(angle) * radiusZ;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xaabbcc,
        size: 0.3,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);
    
    // Animation update function
    group.userData.update = function(time) {
        // Rotate individual asteroids and move them in orbit
        asteroids.forEach(asteroid => {
            const data = asteroid.userData;
            
            // Tumbling rotation
            asteroid.rotation.x += data.rotationSpeed.x;
            asteroid.rotation.y += data.rotationSpeed.y;
            asteroid.rotation.z += data.rotationSpeed.z;
            
            // Slow orbital movement
            data.angle += data.orbitSpeed;
            asteroid.position.x = Math.cos(data.angle) * data.radiusX;
            asteroid.position.z = Math.sin(data.angle) * data.radiusZ;
        });
        
        // Slowly rotate particle cloud
        particles.rotation.y += 0.0001;
    };
    
    return { group };
}
