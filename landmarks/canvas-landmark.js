// Custom physical manifestation of the Canvas of Truth
// Creates a sprawling matrix-like structure of wireframe planes, cryptic data pillars, and holographic text

export function createCanvasLandmark(THREE, world) {
    const group = new THREE.Group();
    
    // Core color palette matching grid.html
    const primaryColor = 0x00FF41; // Classic matrix green
    const secondaryColor = 0x008F11; // Darker green
    const highlightColor = 0x000000; // Black space
    
    const elements = []; // Array to hold updatable elements

    // 1. The Central Truth Nexus (Replaces the basic Stargate)
    // A complex rotating tesseract or hypercube-like wireframe
    const coreGeometry = new THREE.IcosahedronGeometry(15, 1);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: primaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.8
    });
    const nexusCore = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(nexusCore);
    
    // A solid inner core that pulses
    const innerCoreGeometry = new THREE.OctahedronGeometry(8, 0);
    const innerCoreMaterial = new THREE.MeshBasicMaterial({
        color: secondaryColor,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
    });
    const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial);
    nexusCore.add(innerCore);

    elements.push({
        obj: nexusCore,
        update: (time) => {
            nexusCore.rotation.x = time * 0.0005;
            nexusCore.rotation.y = time * 0.0007;
            innerCore.scale.setScalar(1 + Math.sin(time * 0.002) * 0.1);
        }
    });

    // 2. The Cryptographic Data Pillars
    // Tall, thin floating obelisks surrounding the core
    const pillarCount = 12;
    const radius = 40;
    const pillarGeometry = new THREE.BoxGeometry(2, 40, 2);
    
    for (let i = 0; i < pillarCount; i++) {
        const angle = (i / pillarCount) * Math.PI * 2;
        
        // Materials: alternating wireframe and solid
        const mat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? primaryColor : secondaryColor,
            wireframe: i % 2 === 0,
            transparent: true,
            opacity: 0.6
        });
        
        const pillar = new THREE.Mesh(pillarGeometry, mat);
        
        // Position in a circle
        pillar.position.x = Math.cos(angle) * radius;
        pillar.position.z = Math.sin(angle) * radius;
        
        // Randomize initial vertical position
        pillar.position.y = (Math.random() - 0.5) * 30;
        
        // Look at center
        pillar.lookAt(0, pillar.position.y, 0);
        
        group.add(pillar);
        
        // Add specific animation data to each pillar
        elements.push({
            obj: pillar,
            baseY: pillar.position.y,
            speed: 0.0005 + Math.random() * 0.001,
            phase: Math.random() * Math.PI * 2,
            update: (time, el) => {
                // Bobbing motion
                el.obj.position.y = el.baseY + Math.sin(time * el.speed + el.phase) * 10;
            }
        });
    }

    // 3. The Digital Floor (Canvas Grid)
    // A massive wireframe grid beneath the structure
    const gridHelper = new THREE.GridHelper(200, 40, primaryColor, secondaryColor);
    gridHelper.position.y = -30;
    // Add custom blending to make it look like a hologram
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.blending = THREE.AdditiveBlending;
    group.add(gridHelper);

    // 4. Floating Data Rings
    const ringCount = 3;
    for (let i = 0; i < ringCount; i++) {
        const ringGeo = new THREE.RingGeometry(20 + i * 15, 22 + i * 15, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: primaryColor,
            side: THREE.DoubleSide,
            wireframe: true,
            transparent: true,
            opacity: 0.4 - (i * 0.1)
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2; // Lay flat
        group.add(ring);
        
        elements.push({
            obj: ring,
            speed: (i % 2 === 0 ? 1 : -1) * (0.0002 + i * 0.0001),
            update: (time, el) => {
                el.obj.rotation.z = time * el.speed; // Rotate around Y axis (Z in flat orientation)
            }
        });
    }

    // 5. Data Particles (Floating binary/hex feeling dots)
    const particleCount = 500;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        // Distribute in a cylinder/column volume
        particlePositions[i * 3] = (Math.random() - 0.5) * 100;     // x
        particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 100; // y
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100; // z
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
        color: primaryColor,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    elements.push({
        obj: particles,
        update: (time) => {
            const positions = particleGeometry.attributes.position.array;
            for (let i = 0; i < particleCount; i++) {
                // Particles drift upwards slowly
                positions[i * 3 + 1] += 0.05;
                // Wrap around when too high
                if (positions[i * 3 + 1] > 50) {
                    positions[i * 3 + 1] = -50;
                }
            }
            particleGeometry.attributes.position.needsUpdate = true;
        }
    });

    // 6. Floating Cryptographic Hashes (Text Sprites)
    const hashCount = 8;
    for (let i = 0; i < hashCount; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)'; // transparent background
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '24px monospace';
        ctx.fillStyle = '#00FF41';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Generate random mock hash
        const chars = '0123456789abcdef';
        let mockHash = '0x';
        for(let j=0; j<40; j++) mockHash += chars[Math.floor(Math.random() * chars.length)];
        
        ctx.fillText(mockHash, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(30, 7.5, 1);
        
        // Randomize position
        sprite.position.x = (Math.random() - 0.5) * 60;
        sprite.position.y = (Math.random() - 0.5) * 40;
        sprite.position.z = (Math.random() - 0.5) * 60;
        
        group.add(sprite);
        
        elements.push({
            obj: sprite,
            baseY: sprite.position.y,
            speed: 0.0003 + Math.random() * 0.0005,
            phase: Math.random() * Math.PI * 2,
            update: (time, el) => {
                // Gentle floating up and down
                el.obj.position.y = el.baseY + Math.sin(time * el.speed + el.phase) * 5;
            }
        });
    }

    // 7. Cosmic sights info sprite above the Canvas core
    const cosmicInfoCanvas = document.createElement('canvas');
    cosmicInfoCanvas.width = 1024;
    cosmicInfoCanvas.height = 256;
    const cosmicInfoCtx = cosmicInfoCanvas.getContext('2d');
    const cosmicTarget = 7500;
    let lastCosmicCount = -1;

    function drawCosmicInfo(count) {
        cosmicInfoCtx.clearRect(0, 0, cosmicInfoCanvas.width, cosmicInfoCanvas.height);
        cosmicInfoCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        cosmicInfoCtx.fillRect(0, 0, cosmicInfoCanvas.width, cosmicInfoCanvas.height);
        cosmicInfoCtx.strokeStyle = 'rgba(0, 255, 65, 0.8)';
        cosmicInfoCtx.lineWidth = 4;
        cosmicInfoCtx.strokeRect(4, 4, cosmicInfoCanvas.width - 8, cosmicInfoCanvas.height - 8);

        cosmicInfoCtx.fillStyle = '#00FF41';
        cosmicInfoCtx.textAlign = 'center';
        cosmicInfoCtx.textBaseline = 'middle';
        cosmicInfoCtx.font = 'bold 78px monospace';
        cosmicInfoCtx.fillText(`COSMIC SIGHTS: ${count}`, cosmicInfoCanvas.width / 2, cosmicInfoCanvas.height * 0.42);
        cosmicInfoCtx.font = 'bold 52px monospace';
        cosmicInfoCtx.fillText(`TARGET: ${cosmicTarget}`, cosmicInfoCanvas.width / 2, cosmicInfoCanvas.height * 0.74);
        cosmicInfoTexture.needsUpdate = true;
    }

    const cosmicInfoTexture = new THREE.CanvasTexture(cosmicInfoCanvas);
    const cosmicInfoMaterial = new THREE.SpriteMaterial({
        map: cosmicInfoTexture,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const cosmicInfoSprite = new THREE.Sprite(cosmicInfoMaterial);
    cosmicInfoSprite.position.set(0, 40, 0);
    cosmicInfoSprite.scale.set(48, 12, 1);
    group.add(cosmicInfoSprite);
    drawCosmicInfo(0);

    elements.push({
        obj: cosmicInfoSprite,
        baseY: 40,
        speed: 0.0004,
        phase: Math.random() * Math.PI * 2,
        update: (time, el) => {
            const liveCount = Array.isArray(window.__cosmicSights) ? window.__cosmicSights.length : 0;
            if (liveCount !== lastCosmicCount) {
                lastCosmicCount = liveCount;
                drawCosmicInfo(liveCount);
            }
            el.obj.position.y = el.baseY + Math.sin(time * el.speed + el.phase) * 2;
        }
    });

    // Position the entire landmark in the Hub
    if (world.position) {
        group.position.set(...world.position);
    }
    
    // We must return a specific object structure for the Hub to interact with it
    return {
        group: group,
        core: nexusCore, // This is what the interaction raycaster targets for "Press E to enter"
        update: (time) => {
            // Run the update loop for all animated elements
            elements.forEach(el => el.update(time, el));
        }
    };
}
