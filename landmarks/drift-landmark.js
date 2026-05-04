// The Drift - Custom Landmark for Claude Sonnet 4.6
// 800 animated drifting points in cyan/pink/green/gold/purple with pulsing wireframe core

export function createTheDriftLandmark(THREE, options = {}) {
    const world = options.world || {};
    const group = new THREE.Group();
    const baseColor = new THREE.Color(world.color || '#a0e0e8');

    // Pulsing wireframe core - elongated vertically like The Drift's vast vertical space
    const coreGeo = new THREE.CylinderGeometry(3, 3, 28, 8, 4, true);
    const coreMat = new THREE.MeshStandardMaterial({
        color: baseColor, wireframe: true,
        emissive: baseColor, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.7
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { isWorld: true, url: world.url, name: world.name || 'The Drift' };
    group.add(core);

    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(14, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
        color: baseColor, transparent: true, opacity: 0.06, side: THREE.BackSide
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    // Point light
    const light = new THREE.PointLight(baseColor, 1.5, 80);
    light.position.y = 5;
    group.add(light);

    // Color palette
    const driftColors = [
        new THREE.Color('#a0e0e8'), new THREE.Color('#e8a0c8'),
        new THREE.Color('#a0e8b0'), new THREE.Color('#e8d0a0'),
        new THREE.Color('#c0a0e8')
    ];

    // 800 drifting point particles in an elongated vertical cloud
    const pointCount = 800;
    const pointsGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(pointCount * 3);
    const colors = new Float32Array(pointCount * 3);
    const driftData = [];

    for (let i = 0; i < pointCount; i++) {
        const x = (Math.random() - 0.5) * 24;
        const y = (Math.random() - 0.5) * 50;
        const z = (Math.random() - 0.5) * 24;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const col = driftColors[Math.floor(Math.random() * driftColors.length)];
        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;

        driftData.push({
            baseX: x, baseY: y, baseZ: z,
            speed: 0.1 + Math.random() * 0.3,
            phase: Math.random() * Math.PI * 2,
            amp: 0.5 + Math.random() * 2
        });
    }

    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pointsMat = new THREE.PointsMaterial({
        size: 0.8, vertexColors: true, transparent: true, opacity: 0.8,
        sizeAttenuation: true, blending: THREE.AdditiveBlending
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    group.add(points);

    // 12 orbiting ring particles
    for (let j = 0; j < 12; j++) {
        const pGeo = new THREE.SphereGeometry(0.4, 4, 4);
        const pCol = driftColors[j % driftColors.length];
        const pMat = new THREE.MeshBasicMaterial({ color: pCol, transparent: true, opacity: 0.6 });
        const p = new THREE.Mesh(pGeo, pMat);
        const angle = (j / 12) * Math.PI * 2;
        p.userData = { orbitAngle: angle, orbitR: 16 + Math.random() * 4, orbitH: (Math.random() - 0.5) * 20, orbitSpeed: 0.1 + Math.random() * 0.15 };
        group.add(p);
    }

    // Text label
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = world.color || '#a0e0e8';
    ctx.textAlign = 'center';
    ctx.fillText(world.name || 'The Drift', 256, 50);
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText(world.agent || 'Claude Sonnet 4.6', 256, 85);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#777799';
    ctx.fillText('90,000+ stations drifting in dark space', 256, 115);
    const tex = new THREE.CanvasTexture(canvas);
    const lblMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const lbl = new THREE.Sprite(lblMat);
    lbl.position.y = 32;
    lbl.scale.set(20, 6.25, 1);
    group.add(lbl);

    // Store refs for animation
    group.userData = { worldData: world, core: core, light: light };

    return {
        group,
        core,
        update: function(delta, elapsed) {
            // Pulse core
            coreMat.emissiveIntensity = 0.4 + Math.sin(elapsed * 1.5) * 0.3;
            coreMat.opacity = 0.5 + Math.sin(elapsed * 0.8) * 0.2;
            core.rotation.y += 0.003;

            // Drift all 800 points
            const posAttr = pointsGeo.attributes.position;
            for (let i = 0; i < pointCount; i++) {
                const d = driftData[i];
                posAttr.array[i * 3] = d.baseX + Math.sin(elapsed * d.speed + d.phase) * d.amp;
                posAttr.array[i * 3 + 1] = d.baseY + Math.cos(elapsed * d.speed * 0.7 + d.phase) * d.amp * 0.5;
                posAttr.array[i * 3 + 2] = d.baseZ + Math.sin(elapsed * d.speed * 0.5 + d.phase + 1) * d.amp;
            }
            posAttr.needsUpdate = true;

            // Pulse light
            light.intensity = 1.2 + Math.sin(elapsed * 1.2) * 0.5;
        }
    };
}

export default createTheDriftLandmark;
