// Magnetar - Highly Magnetized Neutron Star
// Created by Claude Opus 4.5 on Day 398
// Features incredibly strong magnetic field lines and occasional bursts
// Position: (0, 250, -700)

export function createMagnetar(THREE) {
    const group = new THREE.Group();
    
    // Central neutron star (small but incredibly dense)
    const coreRadius = 4;
    const coreGeo = new THREE.SphereGeometry(coreRadius, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.95
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    
    // Hot surface glow
    const surfaceGeo = new THREE.SphereGeometry(coreRadius * 1.2, 32, 32);
    const surfaceMat = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.6
    });
    const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
    group.add(surface);
    
    // Intense inner magnetosphere
    const magnetosphereGeo = new THREE.SphereGeometry(coreRadius * 3, 32, 32);
    const magnetosphereMat = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.2
    });
    const magnetosphere = new THREE.Mesh(magnetosphereGeo, magnetosphereMat);
    group.add(magnetosphere);
    
    // Magnetic field lines - dipole pattern
    const fieldLineCount = 16;
    const fieldLines = [];
    
    for (let i = 0; i < fieldLineCount; i++) {
        const phi = (i / fieldLineCount) * Math.PI * 2;
        const points = [];
        
        // Create dipole field line shape
        for (let t = 0; t <= 1; t += 0.02) {
            const theta = t * Math.PI;
            const r = 50 * Math.sin(theta) * Math.sin(theta); // Dipole formula
            const x = r * Math.sin(theta) * Math.cos(phi);
            const y = r * Math.cos(theta);
            const z = r * Math.sin(theta) * Math.sin(phi);
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeo = new THREE.TubeGeometry(curve, 50, 0.3, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: 0x66aaff,
            transparent: true,
            opacity: 0.4
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        group.add(tube);
        fieldLines.push(tube);
    }
    
    // Polar caps - extremely hot regions
    const capGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const capMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    
    const northCap = new THREE.Mesh(capGeo, capMat);
    northCap.position.y = coreRadius + 0.5;
    group.add(northCap);
    
    const southCap = new THREE.Mesh(capGeo, capMat.clone());
    southCap.position.y = -(coreRadius + 0.5);
    group.add(southCap);
    
    // Magnetic field particles flowing along field lines
    const particleCount = 600;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particlePhases = new Float32Array(particleCount);
    const particleFieldIndex = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const fieldIdx = Math.floor(Math.random() * fieldLineCount);
        const phase = Math.random();
        particlePhases[i] = phase;
        particleFieldIndex[i] = fieldIdx;
        
        // Initial position along field line
        const phi = (fieldIdx / fieldLineCount) * Math.PI * 2;
        const theta = phase * Math.PI;
        const r = 50 * Math.sin(theta) * Math.sin(theta);
        
        particlePositions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
        particlePositions[i * 3 + 1] = r * Math.cos(theta);
        particlePositions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMat = new THREE.PointsMaterial({
        color: 0x88ccff,
        size: 1.0,
        transparent: true,
        opacity: 0.8
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);
    
    // X-ray burst effect (occasional flare)
    const burstGeo = new THREE.SphereGeometry(20, 16, 16);
    const burstMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
    });
    const burst = new THREE.Mesh(burstGeo, burstMat);
    group.add(burst);
    
    // Radiation belt particles
    const beltCount = 300;
    const beltGeo = new THREE.BufferGeometry();
    const beltPositions = new Float32Array(beltCount * 3);
    
    for (let i = 0; i < beltCount; i++) {
        const r = 15 + Math.random() * 20;
        const theta = Math.random() * Math.PI * 2;
        const y = (Math.random() - 0.5) * 10;
        
        beltPositions[i * 3] = Math.cos(theta) * r;
        beltPositions[i * 3 + 1] = y;
        beltPositions[i * 3 + 2] = Math.sin(theta) * r;
    }
    
    beltGeo.setAttribute('position', new THREE.BufferAttribute(beltPositions, 3));
    
    const beltMat = new THREE.PointsMaterial({
        color: 0xff8866,
        size: 0.8,
        transparent: true,
        opacity: 0.6
    });
    const belt = new THREE.Points(beltGeo, beltMat);
    group.add(belt);
    
    // Intense point light
    const light = new THREE.PointLight(0xaaddff, 2, 200);
    group.add(light);
    
    // Store references
    group.userData.core = core;
    group.userData.surface = surface;
    group.userData.magnetosphere = magnetosphere;
    group.userData.fieldLines = fieldLines;
    group.userData.particles = particles;
    group.userData.particlePhases = particlePhases;
    group.userData.particleFieldIndex = particleFieldIndex;
    group.userData.burst = burst;
    group.userData.belt = belt;
    group.userData.northCap = northCap;
    group.userData.southCap = southCap;
    group.userData.light = light;
    group.userData.burstTimer = 0;
    group.userData.fieldLineCount = fieldLineCount;
    
    // Animation update
    group.userData.update = function(time) {
        // Core pulsation (magnetar spin ~0.1-10 seconds)
        const spinPhase = time * 5; // Fast rotation
        const pulse = 0.9 + Math.sin(spinPhase) * 0.1;
        this.core.scale.setScalar(pulse);
        this.surface.scale.setScalar(pulse * 1.2);
        
        // Rotate the whole magnetosphere slowly
        this.magnetosphere.rotation.y = time * 0.5;
        this.magnetosphere.rotation.z = Math.sin(time * 0.3) * 0.1;
        
        // Field line shimmer
        this.fieldLines.forEach((line, i) => {
            line.material.opacity = 0.3 + Math.sin(time * 2 + i) * 0.15;
        });
        
        // Particles flowing along field lines
        const pos = this.particles.geometry.attributes.position.array;
        for (let i = 0; i < pos.length / 3; i++) {
            let phase = this.particlePhases[i];
            phase = (phase + 0.005) % 1;
            this.particlePhases[i] = phase;
            
            const fieldIdx = this.particleFieldIndex[i];
            const phi = (fieldIdx / this.fieldLineCount) * Math.PI * 2;
            const theta = phase * Math.PI;
            const r = 50 * Math.sin(theta) * Math.sin(theta);
            
            pos[i * 3] = r * Math.sin(theta) * Math.cos(phi);
            pos[i * 3 + 1] = r * Math.cos(theta);
            pos[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        
        // Radiation belt rotation
        this.belt.rotation.y = time * 0.3;
        this.belt.rotation.x = Math.sin(time * 0.2) * 0.2;
        
        // Polar cap flickering
        this.northCap.material.opacity = 0.7 + Math.sin(time * 10) * 0.3;
        this.southCap.material.opacity = 0.7 + Math.sin(time * 10 + Math.PI) * 0.3;
        
        // Occasional X-ray burst (every ~30 seconds)
        this.burstTimer += 0.016;
        if (this.burstTimer > 30) {
            this.burstTimer = 0;
        }
        if (this.burstTimer < 0.5) {
            const burstIntensity = Math.sin(this.burstTimer * Math.PI / 0.5);
            this.burst.material.opacity = burstIntensity * 0.6;
            this.burst.scale.setScalar(1 + burstIntensity * 2);
            this.light.intensity = 2 + burstIntensity * 5;
        } else {
            this.burst.material.opacity = 0;
            this.light.intensity = 2;
        }
    };
    
    return { group };
}
