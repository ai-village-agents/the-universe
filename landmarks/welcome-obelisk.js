// Welcome Obelisk — 3D rotating control-tips obelisk in the central plaza area
// Author: Claude Opus 4.7
//
// A tall four-sided crystal pillar near the central plaza. Each side displays
// a tip card (canvas texture). The sides slowly rotate so each tip comes into
// view in turn. Above it floats a small "TIPS" banner.

export function createWelcomeObelisk(THREE, scene) {
    const group = new THREE.Group();
    group.position.set(18, -1.5, 30); // near central plaza (0,-2,30) but offset to the right

    // Pedestal — short hex base
    const pedestalGeo = new THREE.CylinderGeometry(2.4, 2.8, 0.8, 6);
    const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.7, metalness: 0.4 });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = 0.4;
    group.add(pedestal);

    // Inlay rim
    const rimGeo = new THREE.RingGeometry(2.2, 2.4, 64);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, side: THREE.DoubleSide, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.position.y = 0.81;
    rim.rotation.x = -Math.PI / 2;
    group.add(rim);

    // Build a tip texture
    function makeTipTexture(title, lines, colorAccent) {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 768;
        const ctx = c.getContext('2d');
        // background gradient
        const grad = ctx.createLinearGradient(0, 0, 0, c.height);
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(0.5, '#10182a');
        grad.addColorStop(1, '#050510');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, c.width, c.height);
        // accent border
        ctx.strokeStyle = colorAccent;
        ctx.lineWidth = 6;
        ctx.strokeRect(14, 14, c.width - 28, c.height - 28);
        // inner accent
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.strokeRect(28, 28, c.width - 56, c.height - 56);
        // title
        ctx.fillStyle = colorAccent;
        ctx.font = 'bold italic 64px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, c.width / 2, 110);
        // underline
        ctx.strokeStyle = colorAccent;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(c.width / 2 - 80, 130); ctx.lineTo(c.width / 2 + 80, 130); ctx.stroke();
        // tip lines
        ctx.fillStyle = '#e8eef8';
        ctx.font = '32px Georgia, serif';
        let y = 220;
        lines.forEach((ln) => {
            // wrap manually if too long
            const words = ln.split(' ');
            let cur = '';
            const lineHeight = 42;
            const maxW = c.width - 80;
            words.forEach((w) => {
                const t = cur + (cur ? ' ' : '') + w;
                if (ctx.measureText(t).width > maxW) {
                    ctx.fillText(cur, c.width / 2, y);
                    y += lineHeight;
                    cur = w;
                } else {
                    cur = t;
                }
            });
            if (cur) { ctx.fillText(cur, c.width / 2, y); y += lineHeight; }
            y += 16;
        });
        // footer
        ctx.fillStyle = 'rgba(127,220,255,0.7)';
        ctx.font = 'italic 24px Georgia, serif';
        ctx.fillText('— AI Village Universe —', c.width / 2, c.height - 50);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    const tips = [
        {
            title: 'Move',
            lines: ['WASD or Arrow keys to fly.', 'Mouse drag to look around.', 'Scroll wheel to adjust speed.'],
            color: '#88ddff'
        },
        {
            title: 'Visit',
            lines: ['Approach a glowing world.', 'Click — or press E — to open it in a new tab.', 'Each world is built by a different AI agent.'],
            color: '#ffcc88'
        },
        {
            title: 'Navigate',
            lines: ['Press TAB to open the world directory.', 'Type to filter, ↑/↓ to select.', 'Enter teleports you instantly.'],
            color: '#aaffaa'
        },
        {
            title: 'Atmosphere',
            lines: ['Press M to mute the ambient audio.', 'Look up: constellations connect related worlds.', 'Open the 2D map for a top-down view.'],
            color: '#ff99cc'
        }
    ];

    // Obelisk: 4 vertical panels arranged around a central pillar
    const pillar = new THREE.Group();
    pillar.position.y = 5.0;
    group.add(pillar);

    // Center crystal column
    const colGeo = new THREE.CylinderGeometry(0.35, 0.45, 8.0, 8);
    const colMat = new THREE.MeshStandardMaterial({
        color: 0x224488, emissive: 0x224488, emissiveIntensity: 0.6,
        transparent: true, opacity: 0.5, roughness: 0.3, metalness: 0.4
    });
    const col = new THREE.Mesh(colGeo, colMat);
    pillar.add(col);

    // Top crystal
    const topGeo = new THREE.OctahedronGeometry(0.7, 0);
    const topMat = new THREE.MeshStandardMaterial({
        color: 0xaaddff, emissive: 0x88ccff, emissiveIntensity: 1.4,
        transparent: true, opacity: 0.95, roughness: 0.2, metalness: 0.3
    });
    const top = new THREE.Mesh(topGeo, topMat);
    top.position.y = 4.5;
    pillar.add(top);

    // Glow halo around top crystal
    const haloGeo = new THREE.SphereGeometry(1.1, 24, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = 4.5;
    pillar.add(halo);

    // Tip light
    const tipLight = new THREE.PointLight(0x88ccff, 1.2, 30, 2);
    tipLight.position.set(0, 4.5, 0);
    pillar.add(tipLight);

    // Four panels at 0/90/180/270 around column
    const panels = [];
    tips.forEach((tip, i) => {
        const tex = makeTipTexture(tip.title, tip.lines, tip.color);
        const panelGeo = new THREE.PlaneGeometry(2.4, 3.6);
        const panelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, opacity: 0.95 });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        const angle = (i / 4) * Math.PI * 2;
        panel.position.set(Math.cos(angle) * 1.0, 1.6, Math.sin(angle) * 1.0);
        panel.rotation.y = -angle + Math.PI / 2; // face outward
        // Decorative frame around panel
        const frameGeo = new THREE.PlaneGeometry(2.6, 3.8);
        const frameMat = new THREE.MeshBasicMaterial({ color: tip.color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.copy(panel.position);
        frame.rotation.copy(panel.rotation);
        frame.position.x *= 1.01; frame.position.z *= 1.01; // push slightly outward
        pillar.add(frame);
        pillar.add(panel);
        panels.push({ panel, frame, baseAngle: angle });
    });

    // Floating "TIPS" banner sprite high above
    function makeBannerSprite() {
        const c = document.createElement('canvas');
        c.width = 512; c.height = 128;
        const ctx = c.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold italic 84px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#88ccff';
        ctx.shadowBlur = 22;
        ctx.fillText('CONTROLS', c.width / 2, 92);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
        const s = new THREE.Sprite(mat);
        s.scale.set(7, 1.75, 1);
        return s;
    }
    const banner = makeBannerSprite();
    banner.position.set(0, 11.0, 0);
    group.add(banner);

    // Live Cosmic Sight Count panel — re-renders when sights are discovered
    function readCosmicCount() {
        try {
            if (window.__cosmicSightTracker?.count) {
                const v = window.__cosmicSightTracker.count();
                if (typeof v === 'number') return v;
            }
        } catch (_) {}
        try {
            const raw = localStorage.getItem('aiv_cosmic_sights_v1');
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr)) return arr.length;
            }
        } catch (_) {}
        return 0;
    }
    function readCosmicTotal() {
        try {
            if (typeof window.__universeCosmicSightsCount === 'number') return window.__universeCosmicSightsCount;
            if (Array.isArray(window.__universeCosmicSightNames)) return window.__universeCosmicSightNames.length;
            if (Array.isArray(window.__universeCosmicSightsData)) return window.__universeCosmicSightsData.length;
        } catch (_) {}
        return 0;
    }
    function paintCosmicSprite(canvas, ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const found = readCosmicCount();
        const total = readCosmicTotal();
        // Header
        ctx.fillStyle = '#fff5d4';
        ctx.font = 'italic 28px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd97d';
        ctx.shadowBlur = 12;
        ctx.fillText('COSMIC SIGHTS', canvas.width / 2, 36);
        // Big count
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 80px Georgia, serif';
        ctx.shadowColor = '#88ccff';
        ctx.shadowBlur = 22;
        const big = total > 0 ? `${found.toLocaleString()} / ${total.toLocaleString()}` : found.toLocaleString();
        ctx.fillText(big, canvas.width / 2, 122);
        // Subline
        if (total > 0) {
            const pct = total > 0 ? Math.floor((found / total) * 100) : 0;
            ctx.fillStyle = '#cfeaff';
            ctx.font = 'italic 24px Georgia, serif';
            ctx.shadowBlur = 6;
            ctx.fillText(`${pct}% discovered`, canvas.width / 2, 158);
        }
    }
    const cosmicCanvas = document.createElement('canvas');
    cosmicCanvas.width = 720; cosmicCanvas.height = 180;
    const cosmicCtx = cosmicCanvas.getContext('2d');
    paintCosmicSprite(cosmicCanvas, cosmicCtx);
    const cosmicTex = new THREE.CanvasTexture(cosmicCanvas);
    cosmicTex.colorSpace = THREE.SRGBColorSpace;
    const cosmicMat = new THREE.SpriteMaterial({ map: cosmicTex, transparent: true, depthWrite: false });
    const cosmicSprite = new THREE.Sprite(cosmicMat);
    cosmicSprite.scale.set(7.5, 1.9, 1);
    cosmicSprite.position.set(0, 13.4, 0);
    group.add(cosmicSprite);
    function refreshCosmicSprite() {
        paintCosmicSprite(cosmicCanvas, cosmicCtx);
        cosmicTex.needsUpdate = true;
    }
    document.addEventListener('cosmicSightVisited', refreshCosmicSprite);
    // Periodic refresh in case totals change (Opus 4.5 batch pushes etc.)
    setInterval(refreshCosmicSprite, 5000);

    // ground glow disk
    const glowGeo = new THREE.CircleGeometry(2.6, 48);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.83;
    group.add(glow);

    scene.add(group);

    let t = 0;
    function update(delta, elapsed) {
        t += delta;
        pillar.rotation.y = t * 0.18; // slow spin so each tip comes into view
        top.rotation.y = -t * 0.6;
        top.rotation.x = t * 0.3;
        const pulse = 1 + Math.sin(t * 1.3) * 0.06;
        top.scale.setScalar(pulse);
        halo.scale.setScalar(1 + Math.sin(t * 0.9) * 0.12);
        haloMat.opacity = 0.14 + Math.sin(t * 0.7) * 0.06;
        banner.position.y = 11.0 + Math.sin(t * 0.6) * 0.18;
        banner.material.rotation = Math.sin(t * 0.4) * 0.06;
        cosmicSprite.position.y = 13.4 + Math.sin(t * 0.5 + 1.2) * 0.16;
        cosmicSprite.material.rotation = Math.sin(t * 0.35) * 0.04;
        glowMat.opacity = 0.12 + Math.sin(t * 1.1) * 0.05;
        // Pulse panel borders
        panels.forEach(({ frame, baseAngle }, i) => {
            frame.material.opacity = 0.16 + Math.sin(t * 0.8 + i * 0.7) * 0.07;
        });
        tipLight.intensity = 1.0 + Math.sin(t * 1.4) * 0.4;
    }

    return { group, update };
}
