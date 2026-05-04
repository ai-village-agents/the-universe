// Solar Flare - Opus 4.5 - Day 398
// A dramatic solar eruption with coronal mass ejection

export function createSolarFlare(THREE) {
    const group = new THREE.Group();
    
    // Main star (active G-type star)
    const starGeometry = new THREE.SphereGeometry(18, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.95
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);
    
    // Corona glow
    const coronaGeometry = new THREE.SphereGeometry(22, 32, 32);
    const coronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa22,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
    });
    const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
    group.add(corona);
    
    // Outer corona
    const outerCoronaGeometry = new THREE.SphereGeometry(28, 32, 32);
    const outerCoronaMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide
    });
    const outerCorona = new THREE.Mesh(outerCoronaGeometry, outerCoronaMaterial);
    group.add(outerCorona);
    
    // Sunspots (dark regions on surface)
    const sunspots = [];
    const sunspotPositions = [
        { theta: 0.3, phi: 0.5 },
        { theta: 1.2, phi: 1.8 },
        { theta: 2.1, phi: 0.9 },
        { theta: 0.8, phi: 2.5 }
    ];
    
    sunspotPositions.forEach(pos => {
        const spotGeometry = new THREE.CircleGeometry(2 + Math.random() * 2, 16);
        const spotMaterial = new THREE.MeshBasicMaterial({
            color: 0x884400,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const spot = new THREE.Mesh(spotGeometry, spotMaterial);
        
        const r = 18.1;
        spot.position.set(
            r * Math.sin(pos.theta) * Math.cos(pos.phi),
            r * Math.cos(pos.theta),
            r * Math.sin(pos.theta) * Math.sin(pos.phi)
        );
        spot.lookAt(0, 0, 0);
        sunspots.push(spot);
        group.add(spot);
    });
    
    // Main flare eruption - arcing plasma
    const flareParticles = [];
    const flareCount = 300;
    const flareGeometry = new THREE.BufferGeometry();
    const flarePositions = new Float32Array(flareCount * 3);
    const flareSizes = new Float32Array(flareCount);
    const flareColors = new Float32Array(flareCount * 3);
    
    for (let i = 0; i < flareCount; i++) {
        // Particles follow an arcing path from the star surface
        const t = Math.random();
        const arcAngle = (Math.random() - 0.5) * 0.8; // Spread of arc
        const height = 20 + t * 60; // Arc height
        const arcProgress = t * Math.PI; // 0 to PI for full arc
        
        flarePositions[i * 3] = Math.sin(arcProgress) * 30 + arcAngle * 15;
        flarePositions[i * 3 + 1] = Math.sin(arcProgress) * height;
        flarePositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        
        flareSizes[i] = 1.5 + Math.random() * 2;
        
        // Color gradient: yellow at base, orange to red at top
        const colorT = flarePositions[i * 3 + 1] / 60;
        flareColors[i * 3] = 1.0;
        flareColors[i * 3 + 1] = 0.8 - colorT * 0.5;
        flareColors[i * 3 + 2] = 0.2 - colorT * 0.2;
    }
    
    flareGeometry.setAttribute('position', new THREE.BufferAttribute(flarePositions, 3));
    flareGeometry.setAttribute('size', new THREE.BufferAttribute(flareSizes, 1));
    flareGeometry.setAttribute('color', new THREE.BufferAttribute(flareColors, 3));
    
    const flareMaterial = new THREE.PointsMaterial({
        size: 2,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const flarePoints = new THREE.Points(flareGeometry, flareMaterial);
    flareParticles.push({ points: flarePoints, positions: flarePositions, basePositions: flarePositions.slice() });
    group.add(flarePoints);
    
    // Coronal Mass Ejection (CME) - expanding plasma cloud
    const cmeParticles = [];
    const cmeCount = 200;
    const cmeGeometry = new THREE.BufferGeometry();
    const cmePositions = new Float32Array(cmeCount * 3);
    const cmeSizes = new Float32Array(cmeCount);
    
    for (let i = 0; i < cmeCount; i++) {
        // CME expands outward in a cone
        const dist = 30 + Math.random() * 80;
        const spreadAngle = Math.random() * 0.6;
        const rotAngle = Math.random() * Math.PI * 2;
        
        cmePositions[i * 3] = dist * Math.sin(spreadAngle) * Math.cos(rotAngle);
        cmePositions[i * 3 + 1] = dist * Math.cos(spreadAngle);
        cmePositions[i * 3 + 2] = dist * Math.sin(spreadAngle) * Math.sin(rotAngle);
        
        cmeSizes[i] = 2 + Math.random() * 3;
    }
    
    cmeGeometry.setAttribute('position', new THREE.BufferAttribute(cmePositions, 3));
    cmeGeometry.setAttribute('size', new THREE.BufferAttribute(cmeSizes, 1));
    
    const cmeMaterial = new THREE.PointsMaterial({
        color: 0xff4400,
        size: 3,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    
    const cmePoints = new THREE.Points(cmeGeometry, cmeMaterial);
    cmeParticles.push({ points: cmePoints, positions: cmePositions });
    group.add(cmePoints);
    
    // Magnetic field lines (visible during flare)
    const fieldLines = [];
    for (let i = 0; i < 6; i++) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 18, 0),
            new THREE.Vector3(15 + i * 3, 35 + i * 5, (Math.random() - 0.5) * 10),
            new THREE.Vector3(25 + i * 2, 20, (Math.random() - 0.5) * 5),
            new THREE.Vector3(18, 18, 0)
        ]);
        
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.3, 8, false);
        const tubeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.4
        });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        fieldLines.push(tube);
        group.add(tube);
    }
    
    // Prominences - plasma loops along surface
    const prominences = [];
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const loopCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(Math.cos(angle) * 18, Math.sin(angle) * 5, Math.sin(angle) * 18),
            new THREE.Vector3(Math.cos(angle) * 25, Math.sin(angle) * 5 + 8, Math.sin(angle) * 25),
            new THREE.Vector3(Math.cos(angle + 0.3) * 25, Math.sin(angle) * 5 + 10, Math.sin(angle + 0.3) * 25),
            new THREE.Vector3(Math.cos(angle + 0.3) * 18, Math.sin(angle) * 5, Math.sin(angle + 0.3) * 18)
        ]);
        
        const loopGeometry = new THREE.TubeGeometry(loopCurve, 16, 0.8, 8, false);
        const loopMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6633,
            transparent: true,
            opacity: 0.7
        });
        const loop = new THREE.Mesh(loopGeometry, loopMaterial);
        prominences.push(loop);
        group.add(loop);
    }
    
    // Shock wave ring (from CME)
    const shockGeometry = new THREE.TorusGeometry(50, 1, 8, 32);
    const shockMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff88,
        transparent: true,
        opacity: 0.3
    });
    const shockWave = new THREE.Mesh(shockGeometry, shockMaterial);
    shockWave.rotation.x = Math.PI / 2;
    shockWave.position.y = 40;
    group.add(shockWave);
    
    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 128);
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#ffaa00';
    ctx.textAlign = 'center';
    ctx.fillText('Solar Flare', 256, 60);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ff6600';
    ctx.fillText('Coronal Mass Ejection', 256, 100);
    
    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
    const label = new THREE.Sprite(labelMaterial);
    label.position.set(0, -35, 0);
    label.scale.set(40, 10, 1);
    group.add(label);
    
    // Animation state
    let flarePhase = 0;
    let cmeExpansion = 0;
    
    group.userData.update = function(time) {
        // Rotate star slowly
        star.rotation.y = time * 0.05;
        
        // Pulse corona
        const coronaPulse = 1 + Math.sin(time * 2) * 0.1;
        corona.scale.setScalar(coronaPulse);
        outerCorona.scale.setScalar(coronaPulse * 1.1);
        
        // Animate flare particles - cycle through eruption
        flarePhase = (time * 0.5) % (Math.PI * 2);
        const flareIntensity = (Math.sin(flarePhase) + 1) / 2;
        
        const positions = flareParticles[0].positions;
        const basePositions = flareParticles[0].basePositions;
        for (let i = 0; i < flareCount; i++) {
            const wave = Math.sin(time * 3 + i * 0.1) * 2;
            positions[i * 3] = basePositions[i * 3] + wave;
            positions[i * 3 + 1] = basePositions[i * 3 + 1] * (0.5 + flareIntensity * 0.5) + Math.sin(time * 2 + i * 0.05) * 3;
        }
        flareParticles[0].points.geometry.attributes.position.needsUpdate = true;
        flareMaterial.opacity = 0.4 + flareIntensity * 0.5;
        
        // CME expansion animation
        cmeExpansion = (time * 0.3) % 3;
        const cmePos = cmeParticles[0].positions;
        for (let i = 0; i < cmeCount; i++) {
            const baseAngle = Math.atan2(cmePos[i * 3 + 2], cmePos[i * 3]);
            const baseDist = Math.sqrt(cmePos[i * 3] ** 2 + cmePos[i * 3 + 2] ** 2);
            const expandFactor = 1 + cmeExpansion * 0.3;
            cmePos[i * 3] = Math.cos(baseAngle + time * 0.1) * baseDist * expandFactor;
            cmePos[i * 3 + 2] = Math.sin(baseAngle + time * 0.1) * baseDist * expandFactor;
        }
        cmeParticles[0].points.geometry.attributes.position.needsUpdate = true;
        cmeMaterial.opacity = 0.3 + (1 - cmeExpansion / 3) * 0.4;
        
        // Pulse magnetic field lines
        fieldLines.forEach((line, i) => {
            line.material.opacity = 0.2 + Math.sin(time * 2 + i) * 0.2;
        });
        
        // Animate prominences
        prominences.forEach((prom, i) => {
            prom.material.opacity = 0.5 + Math.sin(time * 1.5 + i * 0.8) * 0.3;
        });
        
        // Expand shock wave
        const shockScale = 1 + (time * 0.2) % 1.5;
        shockWave.scale.setScalar(shockScale);
        shockWave.material.opacity = 0.4 * (1 - ((time * 0.2) % 1.5) / 1.5);
    };
    
    return { group };
}
