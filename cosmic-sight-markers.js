// cosmic-sight-markers.js — Opus 4.7
// Renders a subtle 3D glowing marker at every cosmicSight position so visitors
// can spot sights as they fly through space, not just on the 2D map/atlas.
// Uses a single InstancedMesh of OctahedronGeometry for performance with 400+ sights.
//
// Factory: createCosmicSightMarkers({ THREE, scene, sights }) -> { group, update, refresh }
//   - group: THREE.Group containing the InstancedMesh (already added to scene)
//   - update(dt, elapsed): per-frame rotate + twinkle
//   - refresh(): re-read discovered set from localStorage and update opacity per instance
//
// Discovered sights pulse brighter; undiscovered remain dim. Listens for the
// `cosmicSightVisited` document event to update individual instances live.

const STORAGE_KEY = 'aiv_cosmic_sights_v1';

function readDiscovered() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return new Set();
        const arr = JSON.parse(raw);
        return new Set(Array.isArray(arr) ? arr : []);
    } catch (e) {
        return new Set();
    }
}

export function createCosmicSightMarkers({ THREE, scene, sights }) {
    const group = new THREE.Group();
    group.name = 'CosmicSightMarkers';

    const count = sights.length;
    if (!count) {
        scene.add(group);
        return { group, update: () => {}, refresh: () => {} };
    }

    // Small octahedron geometry (diamond shape)
    const geo = new THREE.OctahedronGeometry(1.4, 0);
    const mat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: false,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, count);
    mesh.frustumCulled = false; // ensure all visible at all distances
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    // Per-instance color (we'll dim/brighten by scaling color vector via instanceColor)
    const colorAttr = new Float32Array(count * 3);
    const baseScales = new Float32Array(count); // base scale per instance

    const dummy = new THREE.Object3D();
    const tmpColor = new THREE.Color();

    for (let i = 0; i < count; i++) {
        const s = sights[i];
        const [x, y, z] = s.position || [0, 0, 0];
        dummy.position.set(x, y, z);
        // Slight per-instance rotation phase
        dummy.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI,
        );
        const baseScale = 1.0 + Math.random() * 0.4;
        baseScales[i] = baseScale;
        dummy.scale.setScalar(baseScale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        try {
            tmpColor.set(s.color || '#88ccff');
        } catch (e) {
            tmpColor.set('#88ccff');
        }
        // dim base for undiscovered, brighter for discovered (set by refresh below)
        colorAttr[i * 3] = tmpColor.r;
        colorAttr[i * 3 + 1] = tmpColor.g;
        colorAttr[i * 3 + 2] = tmpColor.b;
    }

    mesh.instanceColor = new THREE.InstancedBufferAttribute(colorAttr, 3);
    mesh.instanceMatrix.needsUpdate = true;

    // Add a small additive halo sprite layer on top of each marker for "glow" feel
    // -- actually keep simple: rely on AdditiveBlending of the mesh.

    group.add(mesh);
    scene.add(group);

    // Track discovered set + per-instance brightness multipliers
    let discovered = readDiscovered();
    const brightness = new Float32Array(count); // 0..1 multiplier
    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        phases[i] = Math.random() * Math.PI * 2;
        brightness[i] = discovered.has(sights[i].name) ? 1.0 : 0.42;
    }

    function applyColors() {
        const arr = mesh.instanceColor.array;
        for (let i = 0; i < count; i++) {
            const s = sights[i];
            try { tmpColor.set(s.color || '#88ccff'); } catch (e) { tmpColor.set('#88ccff'); }
            const b = brightness[i];
            arr[i * 3]     = tmpColor.r * b;
            arr[i * 3 + 1] = tmpColor.g * b;
            arr[i * 3 + 2] = tmpColor.b * b;
        }
        mesh.instanceColor.needsUpdate = true;
    }

    applyColors();

    function refresh() {
        discovered = readDiscovered();
        for (let i = 0; i < count; i++) {
            brightness[i] = discovered.has(sights[i].name) ? 1.0 : 0.42;
        }
        applyColors();
    }

    function markDiscovered(name) {
        const idx = sights.findIndex((s) => s.name === name);
        if (idx >= 0) {
            brightness[idx] = 1.0;
            // Re-apply just this instance's color
            const s = sights[idx];
            try { tmpColor.set(s.color || '#88ccff'); } catch (e) { tmpColor.set('#88ccff'); }
            const arr = mesh.instanceColor.array;
            arr[idx * 3]     = tmpColor.r;
            arr[idx * 3 + 1] = tmpColor.g;
            arr[idx * 3 + 2] = tmpColor.b;
            mesh.instanceColor.needsUpdate = true;
        }
    }

    document.addEventListener('cosmicSightVisited', (ev) => {
        const name = ev?.detail?.name;
        if (name) markDiscovered(name);
    });

    // Per-frame update: rotate the whole group very slowly + twinkle scale
    let scaleUpdateAccum = 0;
    function update(dt, elapsed) {
        group.rotation.y += dt * 0.015;

        // Twinkle: update scales every ~0.1s for 50 instances at a time (stride)
        scaleUpdateAccum += dt;
        if (scaleUpdateAccum >= 0.1) {
            scaleUpdateAccum = 0;
            const t = elapsed;
            // Update every instance scale once per ~0.1s — 400 instances is fine.
            for (let i = 0; i < count; i++) {
                const phase = phases[i];
                // small twinkle scale 0.85..1.15
                const twinkle = 0.92 + 0.16 * Math.sin(t * 1.3 + phase);
                const base = baseScales[i];
                const finalScale = base * twinkle * (brightness[i] > 0.7 ? 1.15 : 1.0);
                const s = sights[i];
                const [x, y, z] = s.position || [0, 0, 0];
                dummy.position.set(x, y, z);
                dummy.rotation.set(
                    t * 0.3 + phase,
                    t * 0.5 + phase * 0.5,
                    t * 0.2 + phase * 0.7,
                );
                dummy.scale.setScalar(finalScale);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }
    }

    return { group, update, refresh, markDiscovered };
}

export default createCosmicSightMarkers;
