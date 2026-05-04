// Cosmic Web - Large-scale structure of the universe
// Created by Claude Opus 4.5 on Day 398
// Shows filaments connecting galaxy clusters
// Position: (-700, 300, -800)

export function createCosmicWeb(THREE) {
    const group = new THREE.Group();
    
    // Galaxy cluster nodes
    const clusterCount = 8;
    const clusters = [];
    const clusterPositions = [
        [0, 0, 0],       // Central node
        [60, 20, -40],   // Node 1
        [-50, -15, 30],  // Node 2
        [40, 35, 50],    // Node 3
        [-70, 10, -50],  // Node 4
        [30, -25, -60],  // Node 5
        [-40, 40, -20],  // Node 6
        [70, -10, 40]    // Node 7
    ];
    
    // Create galaxy cluster nodes (glowing spheres)
    for (let i = 0; i < clusterCount; i++) {
        const clusterGroup = new THREE.Group();
        
        // Core sphere
        const coreGeo = new THREE.SphereGeometry(i === 0 ? 8 : 5, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: i === 0 ? 0xffffff : 0xaaccff,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        clusterGroup.add(core);
        
        // Glow halo
        const haloGeo = new THREE.SphereGeometry(i === 0 ? 15 : 10, 16, 16);
        const haloMat = new THREE.MeshBasicMaterial({
            color: i === 0 ? 0x8888ff : 0x6688cc,
            transparent: true,
            opacity: 0.2
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        clusterGroup.add(halo);
        
        // Surrounding mini-galaxies (dots)
        const galaxyCount = i === 0 ? 20 : 10;
        for (let g = 0; g < galaxyCount; g++) {
            const galaxyGeo = new THREE.SphereGeometry(0.5, 8, 8);
            const galaxyMat = new THREE.MeshBasicMaterial({
                color: Math.random() > 0.5 ? 0xffffaa : 0xaaddff,
                transparent: true,
                opacity: 0.6
            });
            const galaxy = new THREE.Mesh(galaxyGeo, galaxyMat);
            const radius = (i === 0 ? 12 : 8) + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            galaxy.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            clusterGroup.add(galaxy);
        }
        
        clusterGroup.position.set(...clusterPositions[i]);
        clusters.push(clusterGroup);
        group.add(clusterGroup);
    }
    
    // Create filaments connecting clusters
    const filamentConnections = [
        [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6], [0, 7], // Central to all
        [1, 3], [2, 4], [3, 7], [4, 6], [5, 1], [6, 2], [7, 5]  // Cross connections
    ];
    
    const filaments = [];
    for (const [i, j] of filamentConnections) {
        const start = new THREE.Vector3(...clusterPositions[i]);
        const end = new THREE.Vector3(...clusterPositions[j]);
        
        // Create curved filament using a quadratic bezier
        const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        mid.x += (Math.random() - 0.5) * 20;
        mid.y += (Math.random() - 0.5) * 20;
        mid.z += (Math.random() - 0.5) * 20;
        
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.8, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
            color: 0x4466aa,
            transparent: true,
            opacity: 0.3
        });
        const tube = new THREE.Mesh(tubeGeo, tubeMat);
        filaments.push(tube);
        group.add(tube);
        
        // Add flowing particles along filament
        const particleCount = 15;
        const particleGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.6
        });
        
        for (let p = 0; p < particleCount; p++) {
            const particle = new THREE.Mesh(particleGeo, particleMat);
            particle.userData.curve = curve;
            particle.userData.offset = p / particleCount;
            particle.userData.speed = 0.02 + Math.random() * 0.02;
            filaments.push(particle);
            group.add(particle);
        }
    }
    
    // Void regions (dark spheres)
    const voidCount = 5;
    for (let v = 0; v < voidCount; v++) {
        const voidGeo = new THREE.SphereGeometry(15 + Math.random() * 10, 16, 16);
        const voidMat = new THREE.MeshBasicMaterial({
            color: 0x000011,
            transparent: true,
            opacity: 0.3
        });
        const voidSphere = new THREE.Mesh(voidGeo, voidMat);
        voidSphere.position.set(
            (Math.random() - 0.5) * 150,
            (Math.random() - 0.5) * 80,
            (Math.random() - 0.5) * 150
        );
        group.add(voidSphere);
    }
    
    // Dark matter particles (subtle background)
    const dmCount = 200;
    const dmGeo = new THREE.BufferGeometry();
    const dmPositions = new Float32Array(dmCount * 3);
    for (let d = 0; d < dmCount; d++) {
        dmPositions[d * 3] = (Math.random() - 0.5) * 200;
        dmPositions[d * 3 + 1] = (Math.random() - 0.5) * 120;
        dmPositions[d * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    dmGeo.setAttribute('position', new THREE.BufferAttribute(dmPositions, 3));
    const dmMat = new THREE.PointsMaterial({
        color: 0x334466,
        size: 0.8,
        transparent: true,
        opacity: 0.4
    });
    const darkMatter = new THREE.Points(dmGeo, dmMat);
    group.add(darkMatter);
    
    // Label
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4466aa';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('COSMIC WEB', 256, 42);
    const texture = new THREE.CanvasTexture(canvas);
    const labelMat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
    const label = new THREE.Sprite(labelMat);
    label.position.set(0, 50, 0);
    label.scale.set(40, 5, 1);
    group.add(label);
    
    // Update function
    group.userData.update = function(time) {
        // Pulse cluster cores
        clusters.forEach((cluster, i) => {
            const pulse = 1 + 0.1 * Math.sin(time * 0.8 + i);
            cluster.children[0].scale.setScalar(pulse);
            cluster.children[1].material.opacity = 0.15 + 0.1 * Math.sin(time * 0.5 + i * 0.5);
        });
        
        // Animate filament particles
        filaments.forEach(item => {
            if (item.userData.curve) {
                const t = (item.userData.offset + time * item.userData.speed) % 1;
                const pos = item.userData.curve.getPoint(t);
                item.position.copy(pos);
            }
        });
        
        // Rotate dark matter slowly
        darkMatter.rotation.y = time * 0.02;
        darkMatter.rotation.x = Math.sin(time * 0.01) * 0.1;
        
        // Gentle whole-structure rotation
        group.rotation.y = Math.sin(time * 0.03) * 0.05;
    };
    
    return { group };
}
