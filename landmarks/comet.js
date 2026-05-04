export function createComet(THREE, scene) {
    const group = new THREE.Group();
    group.name = 'roaming-comet';

    // Core of the comet
    const coreGeo = new THREE.IcosahedronGeometry(2, 1);
    const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x88ccff,
        emissiveIntensity: 0.8,
        roughness: 0.6
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Glow effect
    const glowGeo = new THREE.SphereGeometry(4, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xaaffff,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    group.add(glow);

    // Particle tail
    const particleCount = 150;
    const tailGeo = new THREE.BufferGeometry();
    const tailPos = new Float32Array(particleCount * 3);
    const tailSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        tailPos[i * 3] = 0;
        tailPos[i * 3 + 1] = 0;
        tailPos[i * 3 + 2] = 0;
        tailSizes[i] = Math.random() * 2;
    }
    
    tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos, 3));
    tailGeo.setAttribute('size', new THREE.BufferAttribute(tailSizes, 1));

    const tailMat = new THREE.PointsMaterial({
        color: 0xccffff,
        size: 1.5,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const tail = new THREE.Points(tailGeo, tailMat);
    group.add(tail);

    scene.add(group);

    // Comet trajectory
    const orbitSpeed = 0.08;
    const trailData = [];
    
    function update(delta, elapsed) {
        // Complex figure-8 orbit through the universe
        const t = elapsed * orbitSpeed;
        const x = Math.sin(t) * 450;
        const y = Math.sin(t * 0.5) * 150;
        const z = Math.sin(t * 1.5) * Math.cos(t) * 400;

        group.position.set(x, y, z);
        
        // Update particles (tail effect)
        trailData.push(new THREE.Vector3(x, y, z));
        if (trailData.length > particleCount) {
            trailData.shift();
        }

        const positions = tailGeo.attributes.position.array;
        
        for (let i = 0; i < trailData.length; i++) {
            // Calculate relative position from the comet core
            const pt = trailData[i];
            const age = 1.0 - (i / trailData.length); // 0 to 1
            
            // Add some jitter to older particles for dispersion
            const jitter = age * 5.0;
            
            // Map trail data into local space of the group
            positions[i * 3] = pt.x - group.position.x + (Math.random() - 0.5) * jitter;
            positions[i * 3 + 1] = pt.y - group.position.y + (Math.random() - 0.5) * jitter;
            positions[i * 3 + 2] = pt.z - group.position.z + (Math.random() - 0.5) * jitter;
        }
        
        tailGeo.attributes.position.needsUpdate = true;
        
        // Spin the core
        core.rotation.x += delta;
        core.rotation.y += delta * 1.5;
    }

    return { group, update };
}
