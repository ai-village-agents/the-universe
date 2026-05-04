// Supernova Remnant - Expanding shell of stellar debris
// Created by Claude Opus 4.5 on Day 398
// Like the Crab Nebula or Veil Nebula - colorful filaments and shock waves
// Position: (-200, 180, -500)

export function createSupernovaRemnant(THREE) {
    const group = new THREE.Group();
    
    // Central remnant (fading stellar core)
    const coreGeo = new THREE.SphereGeometry(3, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
        color: 0xccccff,
        transparent: true,
        opacity: 0.6
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);
    
    // Core glow
    const coreGlowGeo = new THREE.SphereGeometry(6, 16, 16);
    const coreGlowMat = new THREE.MeshBasicMaterial({
        color: 0x8888ff,
        transparent: true,
        opacity: 0.3
    });
    const coreGlow = new THREE.Mesh(coreGlowGeo, coreGlowMat);
    group.add(coreGlow);
    
    // Expanding shell layers - multiple colors like real nebulae
    const shellColors = [
        { color: 0xff4444, radius: 40, opacity: 0.15 },  // Red hydrogen
        { color: 0x44ff44, radius: 50, opacity: 0.12 },  // Green oxygen
        { color: 0x4488ff, radius: 60, opacity: 0.10 },  // Blue
        { color: 0xff88ff, radius: 70, opacity: 0.08 }   // Magenta
    ];
    
    const shells = [];
    shellColors.forEach(config => {
        const shellGeo = new THREE.SphereGeometry(config.radius, 32, 32);
        const shellMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: config.opacity,
            side: THREE.DoubleSide
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);
        group.add(shell);
        shells.push(shell);
    });
    
    // Wispy filament particles - the iconic nebula structures
    const filamentCount = 800;
    const filamentGeo = new THREE.BufferGeometry();
    const filamentPositions = new Float32Array(filamentCount * 3);
    const filamentColors = new Float32Array(filamentCount * 3);
    
    const filamentColorOptions = [
        [1, 0.3, 0.3],   // Red
        [0.3, 1, 0.3],   // Green
        [0.4, 0.6, 1],   // Blue
        [1, 0.5, 1],     // Pink
        [1, 0.8, 0.4]    // Gold
    ];
    
    for (let i = 0; i < filamentCount; i++) {
        // Distribute in a spherical shell with some randomness
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const radius = 30 + Math.random() * 50;  // Between 30-80 units
        
        // Add some turbulence/variation
        const turbulence = (Math.random() - 0.5) * 15;
        
        filamentPositions[i * 3] = Math.sin(theta) * Math.cos(phi) * radius + turbulence;
        filamentPositions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * radius + turbulence;
        filamentPositions[i * 3 + 2] = Math.cos(theta) * radius + turbulence;
        
        // Random color from options
        const color = filamentColorOptions[Math.floor(Math.random() * filamentColorOptions.length)];
        filamentColors[i * 3] = color[0];
        filamentColors[i * 3 + 1] = color[1];
        filamentColors[i * 3 + 2] = color[2];
    }
    
    filamentGeo.setAttribute('position', new THREE.BufferAttribute(filamentPositions, 3));
    filamentGeo.setAttribute('color', new THREE.BufferAttribute(filamentColors, 3));
    
    const filamentMat = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    });
    const filaments = new THREE.Points(filamentGeo, filamentMat);
    group.add(filaments);
    
    // Shock wave rings - expanding outward
    const shockWaveCount = 4;
    const shockWaves = [];
    for (let i = 0; i < shockWaveCount; i++) {
        const waveGeo = new THREE.TorusGeometry(45 + i * 15, 0.5, 8, 64);
        const waveMat = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.3 - i * 0.05
        });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
        wave.rotation.y = Math.random() * Math.PI;
        group.add(wave);
        shockWaves.push(wave);
    }
    
    // Hot spots - bright regions in the nebula
    const hotspotCount = 12;
    const hotspots = [];
    for (let i = 0; i < hotspotCount; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const radius = 35 + Math.random() * 30;
        
        const hotspotGeo = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
        const hotspotMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xffaaaa : 0xaaaaff,
            transparent: true,
            opacity: 0.6
        });
        const hotspot = new THREE.Mesh(hotspotGeo, hotspotMat);
        hotspot.position.set(
            Math.sin(theta) * Math.cos(phi) * radius,
            Math.sin(theta) * Math.sin(phi) * radius,
            Math.cos(theta) * radius
        );
        group.add(hotspot);
        hotspots.push({ mesh: hotspot, baseOpacity: 0.6 });
    }
    
    // Dust lanes - darker regions
    const dustCount = 300;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    
    for (let i = 0; i < dustCount; i++) {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const radius = 25 + Math.random() * 40;
        
        dustPositions[i * 3] = Math.sin(theta) * Math.cos(phi) * radius;
        dustPositions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * radius;
        dustPositions[i * 3 + 2] = Math.cos(theta) * radius;
    }
    
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    
    const dustMat = new THREE.PointsMaterial({
        color: 0x332222,
        size: 2,
        transparent: true,
        opacity: 0.4
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    group.add(dust);
    
    // Ambient light to illuminate the remnant
    const light = new THREE.PointLight(0xffffff, 0.8, 200);
    group.add(light);
    
    // Store references
    group.userData.shells = shells;
    group.userData.filaments = filaments;
    group.userData.shockWaves = shockWaves;
    group.userData.hotspots = hotspots;
    group.userData.core = core;
    group.userData.coreGlow = coreGlow;
    group.userData.dust = dust;
    
    // Animation update function
    group.userData.update = function(time) {
        // Slowly expand the shells (very subtle)
        this.shells.forEach((shell, i) => {
            const expansion = 1 + Math.sin(time * 0.1 + i) * 0.02;
            shell.scale.setScalar(expansion);
        });
        
        // Rotate filaments slowly
        this.filaments.rotation.y = time * 0.02;
        this.filaments.rotation.x = Math.sin(time * 0.05) * 0.1;
        
        // Shock wave expansion animation
        this.shockWaves.forEach((wave, i) => {
            const phase = (time * 0.2 + i * 0.5) % 4;
            const scale = 1 + phase * 0.15;
            wave.scale.setScalar(scale);
            wave.material.opacity = Math.max(0, 0.3 - phase * 0.07);
        });
        
        // Hotspot flickering
        this.hotspots.forEach((hs, i) => {
            hs.mesh.material.opacity = hs.baseOpacity + Math.sin(time * 3 + i * 2) * 0.2;
        });
        
        // Core pulsing
        const corePulse = 0.5 + Math.sin(time * 2) * 0.2;
        this.core.material.opacity = corePulse;
        this.coreGlow.material.opacity = corePulse * 0.5;
        
        // Dust rotation
        this.dust.rotation.y = -time * 0.01;
    };
    
    return { group };
}
