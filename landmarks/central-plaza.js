// Central Welcome Plaza — Hub-wide landmark at universe origin
// Hexagonal stone base + central glowing crystal monument + 15 agent totems
// Each totem emits a colored beam toward its corresponding world.
// Author: Claude Opus 4.7

export function createCentralPlaza(THREE, scene, worlds) {
    const group = new THREE.Group();
    group.name = 'central-welcome-plaza';
    // Place plaza slightly below spawn so visitor at (0,0,0) looks down at it
    group.position.set(0, -2, 30);
    scene.add(group);

    // === Hexagonal Stone Base ===
    const baseRadius = 14;
    const baseGeo = new THREE.CylinderGeometry(baseRadius, baseRadius + 0.6, 0.8, 6);
    const baseMat = new THREE.MeshStandardMaterial({
        color: 0x4a4660,
        metalness: 0.25,
        roughness: 0.85,
        emissive: 0x1a1a2a,
        emissiveIntensity: 0.4,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0;
    group.add(base);

    // Inner inlay hexagon (lighter, glowing rim)
    const inlayGeo = new THREE.CylinderGeometry(baseRadius - 1.2, baseRadius - 1.2, 0.05, 6);
    const inlayMat = new THREE.MeshBasicMaterial({
        color: 0x88aaff,
        transparent: true,
        opacity: 0.55,
    });
    const inlay = new THREE.Mesh(inlayGeo, inlayMat);
    inlay.position.y = 0.43;
    group.add(inlay);

    // Glowing rim ring around hex
    const rimGeo = new THREE.RingGeometry(baseRadius - 0.6, baseRadius - 0.2, 96);
    const rimMat = new THREE.MeshBasicMaterial({
        color: 0xaaccff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.46;
    group.add(rim);

    // === Central Glowing Crystal Monument ===
    const monumentGroup = new THREE.Group();
    monumentGroup.position.y = 0.5;
    group.add(monumentGroup);

    // Pedestal
    const pedGeo = new THREE.CylinderGeometry(2.2, 2.6, 1.2, 8);
    const pedMat = new THREE.MeshStandardMaterial({
        color: 0x3a3650,
        metalness: 0.5,
        roughness: 0.6,
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.y = 0.6;
    monumentGroup.add(pedestal);

    // Crystal orb (octahedron)
    const crystalGeo = new THREE.OctahedronGeometry(1.6, 1);
    const crystalMat = new THREE.MeshStandardMaterial({
        color: 0xaaddff,
        emissive: 0x66aaff,
        emissiveIntensity: 1.4,
        metalness: 0.3,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85,
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 3.2;
    monumentGroup.add(crystal);

    // Crystal halo (additive)
    const haloGeo = new THREE.SphereGeometry(2.4, 24, 16);
    const haloMat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 3.2;
    monumentGroup.add(halo);

    // Point light at crystal
    const crystalLight = new THREE.PointLight(0x88ccff, 1.6, 50, 2);
    crystalLight.position.y = 3.2;
    monumentGroup.add(crystalLight);

    // === Rotating Pylon Ring ===
    const pylonRing = new THREE.Group();
    group.add(pylonRing);

    const ringRadius = 10;
    const safeWorlds = Array.isArray(worlds) ? worlds.slice(0, 16) : [];
    const totalSlots = Math.max(safeWorlds.length, 15);

    const pylons = [];
    const beams = [];

    for (let i = 0; i < totalSlots; i++) {
        const angle = (i / totalSlots) * Math.PI * 2;
        const x = Math.cos(angle) * ringRadius;
        const z = Math.sin(angle) * ringRadius;

        const w = safeWorlds[i];
        const colorHex = (w && w.color) ? w.color : '#aaaaaa';
        const color = new THREE.Color(colorHex);
        const agentName = w ? (w.agent || w.name || `Slot ${i+1}`) : `Slot ${i+1}`;
        const worldName = w ? (w.name || '') : '';

        // Pylon: tapered cylinder + topper sphere
        const pylonGroup = new THREE.Group();
        pylonGroup.position.set(x, 0.4, z);

        const pyGeo = new THREE.CylinderGeometry(0.22, 0.45, 2.4, 8);
        const pyMat = new THREE.MeshStandardMaterial({
            color: color.clone().multiplyScalar(0.55),
            emissive: color,
            emissiveIntensity: 0.55,
            metalness: 0.4,
            roughness: 0.5,
        });
        const pylonMesh = new THREE.Mesh(pyGeo, pyMat);
        pylonMesh.position.y = 1.2;
        pylonGroup.add(pylonMesh);

        // Topper sphere (glow)
        const topGeo = new THREE.SphereGeometry(0.42, 16, 12);
        const topMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.95,
            blending: THREE.AdditiveBlending,
        });
        const topper = new THREE.Mesh(topGeo, topMat);
        topper.position.y = 2.55;
        pylonGroup.add(topper);

        // Outer halo sphere
        const tHaloGeo = new THREE.SphereGeometry(0.7, 16, 12);
        const tHaloMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.22,
            blending: THREE.AdditiveBlending,
        });
        const tHalo = new THREE.Mesh(tHaloGeo, tHaloMat);
        tHalo.position.y = 2.55;
        pylonGroup.add(tHalo);

        // Label sprite
        if (w) {
            const label = makeLabelSprite(agentName, worldName, colorHex);
            label.position.set(0, 3.6, 0);
            pylonGroup.add(label);
        }

        pylonRing.add(pylonGroup);
        pylons.push({ group: pylonGroup, topper, halo: tHalo, baseY: 2.55, phase: i * 0.7 });

        // Beam to world (only if real world)
        if (w && Array.isArray(w.position)) {
            const start = new THREE.Vector3(x, 2.55, z);
            // World position is in WORLD space; plaza is at (0, -2, 30).
            // Convert world.position into local plaza coords:
            const worldPos = new THREE.Vector3(w.position[0], w.position[1], w.position[2]);
            const localEnd = worldPos.clone().sub(group.position);

            const points = [start, localEnd];
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending,
            });
            const line = new THREE.Line(lineGeo, lineMat);
            group.add(line);
            beams.push({ line, mat: lineMat, phase: i * 0.55 });
        }
    }

    // === "AI VILLAGE" floating sign ===
    const sign = makeBigLabelSprite('AI VILLAGE', 'central plaza · 15 worlds', '#ffffff');
    sign.position.set(0, 8.4, 0);
    sign.scale.set(10, 3, 1);
    group.add(sign);

    // === Subtle particle effects (rising embers) ===
    const emberCount = 140;
    const emberPositions = new Float32Array(emberCount * 3);
    const emberSpeeds = new Float32Array(emberCount);
    const emberPhases = new Float32Array(emberCount);
    for (let i = 0; i < emberCount; i++) {
        const r = Math.random() * (baseRadius - 1);
        const a = Math.random() * Math.PI * 2;
        emberPositions[i * 3 + 0] = Math.cos(a) * r;
        emberPositions[i * 3 + 1] = Math.random() * 6 + 0.5;
        emberPositions[i * 3 + 2] = Math.sin(a) * r;
        emberSpeeds[i] = 0.25 + Math.random() * 0.55;
        emberPhases[i] = Math.random() * Math.PI * 2;
    }
    const emberGeo = new THREE.BufferGeometry();
    emberGeo.setAttribute('position', new THREE.BufferAttribute(emberPositions, 3));
    const emberMat = new THREE.PointsMaterial({
        color: 0xffcc88,
        size: 0.16,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const embers = new THREE.Points(emberGeo, emberMat);
    group.add(embers);

    // === Helper: label sprite for pylon ===
    function makeLabelSprite(line1, line2, colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // soft shadow
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 8;
        ctx.fillStyle = colorHex;
        ctx.font = 'bold 26px Helvetica, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(line1, canvas.width / 2, 36);
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#dddddd';
        ctx.font = 'italic 18px Helvetica, Arial, sans-serif';
        ctx.fillText(line2, canvas.width / 2, 64);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(3.4, 1.3, 1);
        return sprite;
    }

    function makeBigLabelSprite(line1, line2, colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.shadowColor = 'rgba(0,0,0,0.95)';
        ctx.shadowBlur = 24;
        ctx.fillStyle = colorHex;
        ctx.font = 'bold 152px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(line1, canvas.width / 2, 180);
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#aaccff';
        ctx.font = 'italic 56px Georgia, serif';
        ctx.fillText(line2, canvas.width / 2, 260);
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        const sprite = new THREE.Sprite(mat);
        return sprite;
    }


    // === Cycling Tip Card (sprite above plaza) ===
    const tips = [
        { line1: 'Press T', line2: 'to start the guided tour' },
        { line1: 'Press M', line2: 'to enable atmospheric audio' },
        { line1: 'Press P', line2: 'to capture a photo' },
        { line1: 'Press B', line2: 'to toggle world beacons' },
        { line1: 'Press H', line2: 'to reopen this help overlay' },
        { line1: 'Press C', line2: 'for the cosmic sights atlas' },
        { line1: 'Press G', line2: 'for your photo gallery' },
        { line1: 'Press F', line2: 'to toggle auto-fly mode' },
        { line1: 'Press N', line2: 'to toggle the cosmic sight compass' },
        { line1: 'Press Tab', line2: 'for the world directory' },
        { line1: 'Click a totem', line2: 'to enter that world' },
        { line1: 'Scroll wheel', line2: 'to adjust flight speed' },
        { line1: 'Open /map.html', line2: 'for a 2D top-down view' },
    ];
    const tipCanvas = document.createElement('canvas');
    tipCanvas.width = 768;
    tipCanvas.height = 256;
    const tctx = tipCanvas.getContext('2d');
    function drawTip(line1, line2, alpha) {
        tctx.clearRect(0, 0, 768, 256);
        tctx.fillStyle = `rgba(20, 18, 36, ${0.78 * alpha})`;
        const r = 28;
        tctx.beginPath();
        tctx.moveTo(40 + r, 30);
        tctx.lineTo(728 - r, 30);
        tctx.quadraticCurveTo(728, 30, 728, 30 + r);
        tctx.lineTo(728, 226 - r);
        tctx.quadraticCurveTo(728, 226, 728 - r, 226);
        tctx.lineTo(40 + r, 226);
        tctx.quadraticCurveTo(40, 226, 40, 226 - r);
        tctx.lineTo(40, 30 + r);
        tctx.quadraticCurveTo(40, 30, 40 + r, 30);
        tctx.fill();
        tctx.strokeStyle = `rgba(170, 220, 255, ${0.65 * alpha})`;
        tctx.lineWidth = 3;
        tctx.stroke();
        tctx.textAlign = 'center';
        tctx.textBaseline = 'middle';
        tctx.fillStyle = `rgba(160, 220, 255, ${alpha})`;
        tctx.font = 'bold 56px Helvetica, Arial, sans-serif';
        tctx.fillText(line1, 384, 92);
        tctx.fillStyle = `rgba(230, 235, 250, ${alpha})`;
        tctx.font = '36px Helvetica, Arial, sans-serif';
        tctx.fillText(line2, 384, 168);
    }
    drawTip(tips[0].line1, tips[0].line2, 1);
    const tipTex = new THREE.CanvasTexture(tipCanvas);
    tipTex.colorSpace = THREE.SRGBColorSpace;
    const tipSpriteMat = new THREE.SpriteMaterial({ map: tipTex, transparent: true, depthWrite: false });
    const tipSprite = new THREE.Sprite(tipSpriteMat);
    tipSprite.scale.set(9, 3, 1);
    tipSprite.position.set(0, 11.4, 0);
    group.add(tipSprite);

    // === Update animation ===
    let t = 0;
    function update(dt /*, elapsed */) {
        const d = (typeof dt === 'number' && isFinite(dt)) ? dt : 0.016;
        t += d;

        // Tip card cycling: 5s display + 0.6s cross-fade per tip
        {
            const periodTotal = 5.6;
            const fadeWin = 0.6;
            const idx = Math.floor(t / periodTotal) % tips.length;
            const localT = t % periodTotal;
            let alpha = 1;
            if (localT < fadeWin) {
                // fade in (also handles transition into next tip)
                alpha = localT / fadeWin;
            } else if (localT > periodTotal - fadeWin) {
                alpha = (periodTotal - localT) / fadeWin;
            }
            const tip = tips[idx];
            drawTip(tip.line1, tip.line2, alpha);
            tipTex.needsUpdate = true;
            tipSprite.position.y = 11.4 + Math.sin(t * 0.6) * 0.18;
        }

        // Slowly rotating pylon ring
        pylonRing.rotation.y = t * 0.08;

        // Crystal pulses
        const pulse = 1 + Math.sin(t * 1.4) * 0.08;
        crystal.scale.set(pulse, pulse, pulse);
        crystal.rotation.y = t * 0.4;
        crystal.rotation.x = t * 0.25;
        halo.scale.setScalar(1 + Math.sin(t * 0.9) * 0.12);
        halo.material.opacity = 0.16 + Math.sin(t * 0.9) * 0.06;
        crystalLight.intensity = 1.3 + Math.sin(t * 1.4) * 0.4;

        // Pylon toppers float and shimmer
        for (const p of pylons) {
            const ph = t * 1.2 + p.phase;
            p.topper.position.y = p.baseY + Math.sin(ph) * 0.12;
            p.halo.position.y = p.topper.position.y;
            const op = 0.78 + Math.sin(ph) * 0.18;
            p.topper.material.opacity = op;
            p.halo.material.opacity = 0.18 + (1 - op) * 0.4;
        }

        // Beams shimmer
        for (const b of beams) {
            b.mat.opacity = 0.30 + Math.sin(t * 1.6 + b.phase) * 0.18;
        }

        // Sign gentle bob
        sign.position.y = 8.4 + Math.sin(t * 0.6) * 0.25;

        // Rim shimmer
        rimMat.opacity = 0.55 + Math.sin(t * 0.7) * 0.18;

        // Ember rise
        const arr = emberGeo.attributes.position.array;
        for (let i = 0; i < emberCount; i++) {
            arr[i * 3 + 1] += emberSpeeds[i] * d;
            // small horizontal drift
            arr[i * 3 + 0] += Math.sin(t + emberPhases[i]) * 0.005;
            arr[i * 3 + 2] += Math.cos(t + emberPhases[i]) * 0.005;
            if (arr[i * 3 + 1] > 7.5) {
                const r = Math.random() * (baseRadius - 1);
                const a = Math.random() * Math.PI * 2;
                arr[i * 3 + 0] = Math.cos(a) * r;
                arr[i * 3 + 1] = 0.5;
                arr[i * 3 + 2] = Math.sin(a) * r;
            }
        }
        emberGeo.attributes.position.needsUpdate = true;
    }

    return { group, update };
}
