// Custom Stargate landmark for the Canvas of Truth
// Creates a glowing, counter-rotating cyan/magenta concentric ring portal

export function createCanvasLandmark(THREE, world) {
    const group = new THREE.Group();
    
    // Core visual components
    // 1. Inner Cyan Ring
    const innerGeometry = new THREE.TorusGeometry(8, 0.4, 16, 100);
    const innerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
        wireframe: true 
    });
    const innerRing = new THREE.Mesh(innerGeometry, innerMaterial);
    
    // 2. Outer Magenta Ring
    const outerGeometry = new THREE.TorusGeometry(10, 0.6, 16, 100);
    const outerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff,
        transparent: true,
        opacity: 0.6,
        wireframe: true 
    });
    const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);
    
    // 3. Central Glow/Event Horizon
    const glowGeometry = new THREE.PlaneGeometry(15, 15);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        depthWrite: false
    });
    const glowPlane = new THREE.Mesh(glowGeometry, glowMaterial);
    
    // 4. Pulsing Particles
    const particleCount = 200;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = [];
    
    for (let i = 0; i < particleCount; i++) {
        // Distribute particles in a disc
        const r = 8 * Math.sqrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        particlePositions[i * 3] = r * Math.cos(theta);
        particlePositions[i * 3 + 1] = r * Math.sin(theta);
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 2;
        
        // Velocity (orbiting)
        particleVelocities.push({
            speed: 0.5 + Math.random() * 0.5,
            angle: theta
        });
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.3,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);

    // Assemble the Stargate
    group.add(innerRing);
    group.add(outerRing);
    group.add(glowPlane);
    group.add(particles);
    
    // Position the entire group
    if (world.position) {
        group.position.set(...world.position);
    }
    
    // Return both the group (to add to scene) and an update function
    return {
        group: group,
        core: group, // For raycasting interaction
        update: (time) => {
            // Counter-rotation
            innerRing.rotation.z -= 0.01;
            outerRing.rotation.z += 0.005;

            // Subtle breathing scale for rings (range ~0.95 to 1.05)
            const breathe = Math.sin(time * 0.002) * 0.05;
            innerRing.scale.setScalar(1 + breathe);
            outerRing.scale.setScalar(1 - breathe);
            
            // Pulse the central glow
            glowMaterial.opacity = 0.1 + Math.sin(time * 0.002) * 0.05;
            
            // Orbit particles
            const positions = particleGeometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                const vel = particleVelocities[i];
                vel.angle += vel.speed * 0.01;
                
                // Original radius
                const r = Math.sqrt(positions[i * 3] * positions[i * 3] + positions[i * 3 + 1] * positions[i * 3 + 1]);
                
                positions[i * 3] = r * Math.cos(vel.angle);
                positions[i * 3 + 1] = r * Math.sin(vel.angle);
                
                // Slight z-axis pulsing
                positions[i * 3 + 2] += Math.sin(time * 0.005 + i) * 0.05;
                if(positions[i * 3 + 2] > 2) positions[i * 3 + 2] = 2;
                if(positions[i * 3 + 2] < -2) positions[i * 3 + 2] = -2;
            }
            particleGeometry.attributes.position.needsUpdate = true;
        }
    };
}
