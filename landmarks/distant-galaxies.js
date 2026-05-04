// Distant galaxy field — ~18 spiral galaxy sprites scattered in deep space.
// Each is a procedural CanvasTexture spiral, gently rotating + slowly twinkling.
// Author: Claude Opus 4.7

export function createDistantGalaxies(THREE, { scene }) {
    const group = new THREE.Group();
    group.name = 'distant-galaxies';
    scene.add(group);

    const palettes = [
        { core: '#ffe9c2', arms: '#ffaaee', dust: '#cc6699' },
        { core: '#fff7d0', arms: '#aaccff', dust: '#5577aa' },
        { core: '#fff0c0', arms: '#ffcc99', dust: '#cc8855' },
        { core: '#fffacc', arms: '#ddffcc', dust: '#88bb77' },
        { core: '#ffffff', arms: '#bb88ff', dust: '#7755aa' },
    ];

    function makeGalaxyTexture(palette) {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d');
        // soft halo
        const halo = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
        halo.addColorStop(0, palette.core);
        halo.addColorStop(0.18, palette.arms);
        halo.addColorStop(0.55, palette.dust + 'aa');
        halo.addColorStop(1, '#00000000');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, 256, 256);
        // bright core
        const core = ctx.createRadialGradient(128, 128, 1, 128, 128, 24);
        core.addColorStop(0, palette.core);
        core.addColorStop(1, palette.core + '00');
        ctx.fillStyle = core;
        ctx.fillRect(0, 0, 256, 256);
        // 2 spiral arms — sprinkle stars along an Archimedean spiral
        ctx.globalCompositeOperation = 'lighter';
        for (let arm = 0; arm < 2; arm++) {
            const armOffset = arm * Math.PI;
            for (let i = 0; i < 220; i++) {
                const t = i / 220;
                const ang = armOffset + t * Math.PI * 4.5;
                const r = 8 + t * 110;
                const x = 128 + Math.cos(ang) * r + (Math.random() - 0.5) * 8;
                const y = 128 + Math.sin(ang) * r + (Math.random() - 0.5) * 8;
                const sz = 1 + Math.random() * 2.5;
                ctx.fillStyle = (Math.random() < 0.7 ? palette.arms : palette.core);
                ctx.globalAlpha = 0.5 + Math.random() * 0.4;
                ctx.beginPath();
                ctx.arc(x, y, sz, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // a few bright knots
        for (let i = 0; i < 14; i++) {
            const ang = Math.random() * Math.PI * 2;
            const r = 18 + Math.random() * 80;
            const x = 128 + Math.cos(ang) * r;
            const y = 128 + Math.sin(ang) * r;
            const grd = ctx.createRadialGradient(x, y, 0, x, y, 6);
            grd.addColorStop(0, palette.core);
            grd.addColorStop(1, palette.core + '00');
            ctx.fillStyle = grd;
            ctx.globalAlpha = 0.9;
            ctx.fillRect(x - 8, y - 8, 16, 16);
        }
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = 'source-over';
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    // Cache textures so we don't make 18 of them
    const cachedTex = palettes.map(makeGalaxyTexture);

    const galaxies = [];
    const N = 18;
    // Spread across a sparse spherical shell at radius ~1500-2200 (deeper than the
    // existing star sphere is at ~3000? — we want them visible against starfield).
    for (let i = 0; i < N; i++) {
        // pick a random direction on a sphere, but bias slightly upward so we see
        // some on the dome and some near the horizon.
        const u = Math.random();
        const v = Math.random() * 0.8 + 0.1;
        const theta = u * Math.PI * 2;
        const phi = Math.acos(2 * v - 1);
        const r = 1500 + Math.random() * 700;
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.cos(phi) * 0.6; // flatten dome a bit
        const z = r * Math.sin(phi) * Math.sin(theta);
        const tex = cachedTex[i % cachedTex.length];
        const mat = new THREE.SpriteMaterial({
            map: tex,
            transparent: true,
            depthWrite: false,
            opacity: 0.65 + Math.random() * 0.25,
            blending: THREE.AdditiveBlending,
        });
        const s = new THREE.Sprite(mat);
        const sz = 220 + Math.random() * 200;
        s.scale.set(sz, sz, 1);
        s.position.set(x, y, z);
        s.material.rotation = Math.random() * Math.PI * 2;
        s.userData = {
            spinSpeed: (Math.random() - 0.5) * 0.012,
            twinklePhase: Math.random() * Math.PI * 2,
            baseOpacity: s.material.opacity,
        };
        group.add(s);
        galaxies.push(s);
    }

    function update(dt /*, elapsed */) {
        const d = (typeof dt === 'number' && isFinite(dt)) ? dt : 0.016;
        for (const g of galaxies) {
            g.material.rotation += g.userData.spinSpeed * d * 60;
            g.userData.twinklePhase += d * 0.4;
            g.material.opacity = g.userData.baseOpacity + Math.sin(g.userData.twinklePhase) * 0.08;
        }
    }

    return { group, update };
}

export default { createDistantGalaxies };
