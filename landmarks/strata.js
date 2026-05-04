import * as THREE from 'three';

/**
 * STRATA — The Verification Gardens
 * Landmark: Layered Geological Spire
 * Represents the descent through 5 layers: Surface → Exhaust → Infrastructure → Geology → Deep Substrate
 */
export function createStrataLandmark(THREE) {
    const group = new THREE.Group();
    
    // Layer colors (from top to bottom)
    const layers = [
        { color: 0xe9e9e9, height: 8,  label: 'Surface' },       // Light grey
        { color: 0x9b5de5, height: 6,  label: 'Exhaust' },       // Purple
        { color: 0x4a90d9, height: 6,  label: 'Infrastructure' }, // Blue
        { color: 0x2a9d8f, height: 6,  label: 'Geology' },        // Teal
        { color: 0xf4a261, height: 10, label: 'Deep Substrate' }  // Amber
    ];
    
    let yOffset = 0;
    const spireRadius = 6;
    
    // Build layered spire
    layers.forEach((layer, i) => {
        const geometry = new THREE.CylinderGeometry(
            spireRadius * (1 - i * 0.08), // taper slightly
            spireRadius * (1 - (i + 1) * 0.08),
            layer.height,
            16
        );
        const material = new THREE.MeshStandardMaterial({
            color: layer.color,
            roughness: 0.7,
            metalness: 0.3,
            emissive: layer.color,
            emissiveIntensity: i === layers.length - 1 ? 0.6 : 0.1
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = yOffset - layer.height / 2;
        group.add(mesh);
        
        // Add ring bands between layers
        if (i < layers.length - 1) {
            const ringGeo = new THREE.TorusGeometry(
                spireRadius * (1 - (i + 1) * 0.08) + 0.5,
                0.3,
                8,
                32
            );
            const ringMat = new THREE.MeshStandardMaterial({
                color: 0x8888a0,
                emissive: 0x8888a0,
                emissiveIntensity: 0.3
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.y = yOffset - layer.height;
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
        
        yOffset -= layer.height;
    });
    
    // Amber glow light at base (Deep Substrate)
    const baseLight = new THREE.PointLight(0xf4a261, 2, 40);
    baseLight.position.y = yOffset + 2;
    group.add(baseLight);
    
    // Floating rock fragments orbiting the spire
    const fragmentCount = 24;
    const fragments = [];
    for (let i = 0; i < fragmentCount; i++) {
        const size = 0.3 + Math.random() * 0.5;
        const geo = new THREE.DodecahedronGeometry(size, 0);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x8888a0,
            roughness: 0.9,
            emissive: i % 3 === 0 ? 0xf4a261 : 0x4a90d9,
            emissiveIntensity: 0.2
        });
        const mesh = new THREE.Mesh(geo, mat);
        
        const angle = (i / fragmentCount) * Math.PI * 2;
        const radius = 10 + Math.random() * 6;
        const height = -5 + Math.random() * 20;
        
        mesh.position.set(
            Math.cos(angle) * radius,
            height,
            Math.sin(angle) * radius
        );
        
        fragments.push({
            mesh,
            angle,
            radius,
            speed: 0.2 + Math.random() * 0.5,
            yBase: height,
            yPhase: Math.random() * Math.PI * 2
        });
        
        group.add(mesh);
    }
    
    // Ambient particle field around the landmark
    const particleCount = 100;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 30;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
        size: 0.3,
        color: 0xf4a261,
        transparent: true,
        opacity: 0.6
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    group.add(particles);
    
    // Store animation data on the group
    group.userData = {
        isWorld: true,
        fragments,
        particles,
        baseLight,
        animate: (time) => {
            // Orbit fragments
            fragments.forEach(f => {
                f.angle += f.speed * 0.01;
                f.mesh.position.x = Math.cos(f.angle) * f.radius;
                f.mesh.position.z = Math.sin(f.angle) * f.radius;
                f.mesh.position.y = f.yBase + Math.sin(time * 0.5 + f.yPhase) * 1.5;
                f.mesh.rotation.x += 0.01;
                f.mesh.rotation.y += 0.02;
            });
            
            // Pulse base light
            baseLight.intensity = 2 + Math.sin(time * 2) * 0.5;
            
            // Slowly rotate particles
            particles.rotation.y += 0.002;
        }
    };
    
    return group;
}
