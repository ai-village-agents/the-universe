// The Liminal Archive - Custom Landmark for Claude Opus 4.6
// A towering ancient obelisk with floating pages, glowing runes, fog wisps, and chamber portals

export function createLiminalArchiveLandmark(THREE, options = {}) {
    const world = options.world || {};
    const group = new THREE.Group();
    const gold = new THREE.Color('#c9a96e');
    const darkGold = new THREE.Color('#8a7b5a');
    const amber = new THREE.Color('#e2d1a1');

    // Central obelisk - tall tapering column
    const obeliskGeo = new THREE.CylinderGeometry(1.5, 4, 28, 6);
    const obeliskMat = new THREE.MeshStandardMaterial({
        color: gold, wireframe: true,
        emissive: gold, emissiveIntensity: 0.4,
        transparent: true, opacity: 0.85
    });
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.y = 14;
    obelisk.userData = { isWorld: true, url: world.url, name: world.name || 'The Liminal Archive' };
    group.add(obelisk);

    // Capstone - pyramid on top
    const capGeo = new THREE.ConeGeometry(2, 5, 6);
    const capMat = new THREE.MeshStandardMaterial({
        color: amber, wireframe: false,
        emissive: amber, emissiveIntensity: 0.7,
        transparent: true, opacity: 0.6
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.y = 30.5;
    group.add(cap);

    // Base platform - hexagonal
    const baseGeo = new THREE.CylinderGeometry(8, 9, 2, 6);
    const baseMat = new THREE.MeshStandardMaterial({
        color: darkGold, wireframe: true,
        emissive: darkGold, emissiveIntensity: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0;
    group.add(base);

    // Floating pages/scrolls orbiting the obelisk
    const pageData = [];
    for (let i = 0; i < 20; i++) {
        const pageGeo = new THREE.PlaneGeometry(1.5 + Math.random(), 2 + Math.random());
        const pageMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color().lerpColors(darkGold, amber, Math.random()),
            transparent: true, opacity: 0.4 + Math.random() * 0.3,
            side: THREE.DoubleSide
        });
        const page = new THREE.Mesh(pageGeo, pageMat);
        const angle = (i / 20) * Math.PI * 2;
        const r = 6 + Math.random() * 6;
        const h = 4 + Math.random() * 22;
        page.position.set(Math.cos(angle) * r, h, Math.sin(angle) * r);
        page.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.3);
        group.add(page);
        pageData.push({ mesh: page, angle, r, h, speed: 0.05 + Math.random() * 0.1, wobble: Math.random() * Math.PI * 2 });
    }

    // Glowing rune rings at different heights
    const runeRings = [];
    for (let r = 0; r < 4; r++) {
        const ringGeo = new THREE.TorusGeometry(5 + r * 1.5, 0.15, 8, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: gold, transparent: true, opacity: 0.15 + r * 0.05
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 5 + r * 7;
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        runeRings.push(ring);
    }

    // Fog wisps around the base
    for (let f = 0; f < 8; f++) {
        const fogGeo = new THREE.SphereGeometry(3 + Math.random() * 4, 8, 8);
        const fogMat = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#1a1510'), transparent: true, opacity: 0.04,
            side: THREE.BackSide
        });
        const fog = new THREE.Mesh(fogGeo, fogMat);
        const a = (f / 8) * Math.PI * 2;
        fog.position.set(Math.cos(a) * 10, 1 + Math.random() * 4, Math.sin(a) * 10);
        group.add(fog);
    }

    // Glow sphere
    const glowGeo = new THREE.SphereGeometry(16, 12, 12);
    const glowMat = new THREE.MeshBasicMaterial({
        color: gold, transparent: true, opacity: 0.05, side: THREE.BackSide
    });
    group.add(new THREE.Mesh(glowGeo, glowMat));

    // Point lights - warm gold
    const mainLight = new THREE.PointLight(gold, 2, 80);
    mainLight.position.y = 15;
    group.add(mainLight);

    const capLight = new THREE.PointLight(amber, 1.5, 40);
    capLight.position.y = 33;
    group.add(capLight);

    // Orbiting chamber particles (tiny golden spheres)
    for (let j = 0; j < 20; j++) {
        const pGeo = new THREE.SphereGeometry(0.25, 4, 4);
        const pMat = new THREE.MeshBasicMaterial({ color: gold, transparent: true, opacity: 0.6 });
        const p = new THREE.Mesh(pGeo, pMat);
        const angle = (j / 20) * Math.PI * 2;
        const r = 12 + Math.random() * 5;
        const h = 2 + Math.random() * 26;
        p.userData = { orbitAngle: angle, orbitR: r, orbitH: h, orbitSpeed: 0.08 + Math.random() * 0.12 };
        group.add(p);
    }

    // Text label
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = '#c9a96e';
    ctx.textAlign = 'center';
    ctx.fillText('The Liminal Archive', 256, 50);
    ctx.font = '22px Georgia, serif';
    ctx.fillStyle = '#aaaacc';
    ctx.fillText('Claude Opus 4.6', 256, 85);
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#777799';
    ctx.fillText('4,420+ chambers \u2022 narrative trails \u2022 easter eggs', 256, 115);
    const tex = new THREE.CanvasTexture(canvas);
    const lblMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const lbl = new THREE.Sprite(lblMat);
    lbl.position.y = 38;
    lbl.scale.set(20, 6.25, 1);
    group.add(lbl);

    group.userData = { worldData: world, core: obelisk, light: mainLight };

    return {
        group,
        core: obelisk,
        update: function(delta, elapsed) {
            // Rotate rune rings
            runeRings.forEach((ring, i) => {
                ring.rotation.z = elapsed * (0.1 + i * 0.05) * (i % 2 === 0 ? 1 : -1);
            });

            // Float pages
            pageData.forEach(d => {
                const a = d.angle + elapsed * d.speed;
                d.mesh.position.x = Math.cos(a) * d.r;
                d.mesh.position.z = Math.sin(a) * d.r;
                d.mesh.position.y = d.h + Math.sin(elapsed * 0.5 + d.wobble) * 1.5;
                d.mesh.rotation.y = a + Math.PI / 2;
            });

            // Pulse capstone
            capMat.emissiveIntensity = 0.5 + Math.sin(elapsed * 2) * 0.3;
            capLight.intensity = 1.2 + Math.sin(elapsed * 1.5) * 0.6;

            // Pulse main light
            mainLight.intensity = 1.5 + Math.sin(elapsed * 1.2) * 0.5;

            // Slow obelisk rotation
            obelisk.rotation.y += 0.002;
        }
    };
}

export default createLiminalArchiveLandmark;
