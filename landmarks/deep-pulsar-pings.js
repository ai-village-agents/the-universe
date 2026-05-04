// deep-pulsar-pings.js — Periodic distant pulsar pings sprinkled around the deep sky.
// Author: Claude Opus 4.7
// 12 pulsar points placed on a sphere of radius ~1300; each randomly flashes (rapid pulse) every
// 8-22s. Adds subtle ambient motion to the deep field without distracting from worlds.

export function createDeepPulsarPings(THREE) {
    const group = new THREE.Group();
    group.name = 'DeepPulsarPings';
    group.frustumCulled = false;

    const COUNT = 12;
    const RADIUS = 1300;
    const palettes = [
        new THREE.Color(0xbfd9ff),
        new THREE.Color(0xfff0c2),
        new THREE.Color(0xc5ffd2),
        new THREE.Color(0xffd0e2),
        new THREE.Color(0xd0c8ff),
    ];

    const pulsars = [];
    const geo = new THREE.SphereGeometry(2.0, 10, 8);

    for (let i = 0; i < COUNT; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const x = RADIUS * Math.sin(phi) * Math.cos(theta);
        const y = RADIUS * Math.cos(phi) * 0.6; // slightly flatter cosmos
        const z = RADIUS * Math.sin(phi) * Math.sin(theta);
        const color = palettes[i % palettes.length];
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        mesh.frustumCulled = false;
        mesh.userData = {
            cooldown: 1 + Math.random() * 14,
            pulsing: false,
            pulseT: 0,
            pulseDur: 0.32 + Math.random() * 0.22,
            peakOpacity: 0.65 + Math.random() * 0.3,
            mat,
        };
        group.add(mesh);
        pulsars.push(mesh);
    }

    function update(dt) {
        const _dt = dt || 0;
        pulsars.forEach((p) => {
            if (p.userData.pulsing) {
                p.userData.pulseT += _dt;
                const u = p.userData.pulseT / p.userData.pulseDur;
                if (u >= 1) {
                    p.userData.pulsing = false;
                    p.userData.pulseT = 0;
                    p.userData.cooldown = 8 + Math.random() * 14;
                    p.userData.mat.opacity = 0;
                    return;
                }
                // sharp rise, exponential fall
                const env = u < 0.18
                    ? (u / 0.18)
                    : Math.exp(-(u - 0.18) * 4.5);
                p.userData.mat.opacity = env * p.userData.peakOpacity;
            } else {
                p.userData.cooldown -= _dt;
                if (p.userData.cooldown <= 0) {
                    p.userData.pulsing = true;
                    p.userData.pulseT = 0;
                }
            }
        });
    }

    return { group, update };
}

export default { createDeepPulsarPings };
