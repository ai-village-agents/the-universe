// cosmic-comets.js — Wandering background comets that streak across the universe at random intervals.
// Author: Claude Opus 4.7
// Adds ambient cosmic motion: a small pool of long-tailed comets traverse the deep field.
// Each comet picks a random great-arc trajectory across the universe sphere, streaks for ~12-25s,
// then re-spawns with a fresh trajectory after a short cool-down. Pool size kept small so it never
// distracts from worlds — 4 comets, with ~2-3 visible at a time.

export function createCosmicComets(THREE) {
    const group = new THREE.Group();
    group.name = 'CosmicComets';
    group.frustumCulled = false;

    const COMET_COUNT = 4;
    const RADIUS = 1100;
    const TAIL_SEGMENTS = 22;

    const headGeo = new THREE.SphereGeometry(2.6, 12, 10);
    const tailGeo = new THREE.PlaneGeometry(1, 1);

    const comets = [];

    function makeTailMaterial(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 32;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 256, 0);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.55, color);
        grad.addColorStop(1, 'rgba(255,255,255,0.9)');
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 256, 32);
        const tex = new THREE.CanvasTexture(canvas);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        return new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
        });
    }

    const palettes = [
        'rgba(190,225,255,0.75)', // ice blue
        'rgba(255,210,160,0.70)', // amber
        'rgba(220,200,255,0.70)', // lavender
        'rgba(180,255,220,0.70)', // mint
    ];

    for (let i = 0; i < COMET_COUNT; i++) {
        const colorStr = palettes[i % palettes.length];
        const head = new THREE.Mesh(
            headGeo,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(colorStr.replace('rgba(', 'rgb(').replace(/,[^,)]+\)$/, ')')),
                transparent: true,
                opacity: 0.0,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            })
        );
        head.frustumCulled = false;

        const tail = new THREE.Mesh(tailGeo, makeTailMaterial(colorStr));
        tail.frustumCulled = false;

        const cometGroup = new THREE.Group();
        cometGroup.add(head);
        cometGroup.add(tail);
        cometGroup.userData = {
            active: false,
            t: 0,
            duration: 0,
            cooldown: 4 + Math.random() * 8,
            startPos: new THREE.Vector3(),
            endPos: new THREE.Vector3(),
            tailLength: 80 + Math.random() * 60,
            head, tail,
        };
        group.add(cometGroup);
        comets.push(cometGroup);
    }

    function spawnComet(c) {
        // Random great-arc trajectory: pick start and end on a sphere of RADIUS, ~140-200 deg apart.
        const ang = Math.random() * Math.PI * 2;
        const tilt = (Math.random() - 0.5) * 0.6;
        const start = new THREE.Vector3(
            Math.cos(ang) * RADIUS,
            (Math.random() - 0.5) * 600,
            Math.sin(ang) * RADIUS
        );
        const sweep = Math.PI * (0.7 + Math.random() * 0.45); // 0.7-1.15 pi
        const end = new THREE.Vector3(
            Math.cos(ang + sweep) * RADIUS,
            (Math.random() - 0.5) * 600,
            Math.sin(ang + sweep) * RADIUS
        );
        c.userData.startPos.copy(start);
        c.userData.endPos.copy(end);
        c.userData.duration = 14 + Math.random() * 10;
        c.userData.t = 0;
        c.userData.active = true;
        c.userData.tailLength = 70 + Math.random() * 70;
    }

    function update(_dt, elapsed) {
        const dt = _dt || 0;
        comets.forEach((c) => {
            if (!c.userData.active) {
                c.userData.cooldown -= dt;
                c.userData.head.material.opacity = 0;
                c.userData.tail.material.opacity = 0;
                if (c.userData.cooldown <= 0) {
                    spawnComet(c);
                }
                return;
            }
            c.userData.t += dt;
            const u = c.userData.t / c.userData.duration;
            if (u >= 1) {
                c.userData.active = false;
                c.userData.cooldown = 6 + Math.random() * 14;
                return;
            }
            // Position along arc
            const pos = c.userData.startPos.clone().lerp(c.userData.endPos, u);
            // gentle arc bow upward
            const bow = Math.sin(u * Math.PI) * 80;
            pos.y += bow;
            const dir = c.userData.endPos.clone().sub(c.userData.startPos).normalize();

            c.position.copy(pos);

            // Fade in/out at edges of life
            const fade = Math.min(1, Math.min(u * 5, (1 - u) * 5));
            c.userData.head.material.opacity = 0.95 * fade;

            // Tail is oriented opposite of motion direction; place tail behind head.
            const tailLen = c.userData.tailLength;
            const tailWidth = 4.5;
            c.userData.tail.scale.set(tailLen, tailWidth, 1);
            const tail = c.userData.tail;
            // Place tail center half a length behind the head (head sits at group origin)
            tail.position.set(-dir.x * tailLen * 0.5, -dir.y * tailLen * 0.5, -dir.z * tailLen * 0.5);
            // Orient tail plane to face the camera-y axis (approx) — use lookAt so its X axis
            // aligns with -dir.
            const lookTarget = new THREE.Vector3().copy(tail.position).add(dir);
            tail.lookAt(lookTarget);
            // Rotate so plane width is perpendicular to motion (default plane points +Z; we want
            // the gradient running along its X). lookAt orients +Z toward target; rotate -90 around Y.
            tail.rotateY(Math.PI / 2);
            tail.material.opacity = 0.9 * fade;
        });
    }

    return { group, update };
}

export default { createCosmicComets };
