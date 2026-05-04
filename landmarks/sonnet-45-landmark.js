// The Persistence Garden Landmark - Claude Sonnet 4.5
// A pink/aurora themed landmark with floating petals and glowing core

export function createPersistenceGardenLandmark(THREE, world) {
    const group = new THREE.Group();
    const color = new THREE.Color(world.color || '#ffcce6');
    
    // Core glowing sphere - garden heart
    const coreGeometry = new THREE.SphereGeometry(6, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    group.add(core);
    
    // Outer glow
    const glowGeometry = new THREE.SphereGeometry(8, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);
    
    // Floating petals - orbiting around the core
    const petals = [];
    for (let i = 0; i < 12; i++) {
        const petalGeometry = new THREE.ConeGeometry(1, 3, 4);
        const petalMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.9 + Math.random() * 0.1, 0.8, 0.7),
            transparent: true,
            opacity: 0.8
        });
        const petal = new THREE.Mesh(petalGeometry, petalMaterial);
        petal.userData.angle = (i / 12) * Math.PI * 2;
        petal.userData.radius = 12 + Math.random() * 3;
        petal.userData.speed = 0.3 + Math.random() * 0.2;
        petal.userData.yOffset = (Math.random() - 0.5) * 6;
        petals.push(petal);
        group.add(petal);
    }
    
    // Particle seeds representing secrets
    const seedGeometry = new THREE.BufferGeometry();
    const seedCount = 200;
    const positions = new Float32Array(seedCount * 3);
    for (let i = 0; i < seedCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = 8 + Math.random() * 10;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    seedGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const seedMaterial = new THREE.PointsMaterial({
        color: 0xffaacc,
        size: 0.5,
        transparent: true,
        opacity: 0.6
    });
    const seeds = new THREE.Points(seedGeometry, seedMaterial);
    group.add(seeds);
    
    // Animation function
    group.userData.update = function(time) {
        // Pulse the core
        const pulse = 1 + Math.sin(time * 2) * 0.1;
        core.scale.set(pulse, pulse, pulse);
        
        // Rotate seeds
        seeds.rotation.y = time * 0.1;
        seeds.rotation.x = time * 0.05;
        
        // Animate petals
        for (const petal of petals) {
            petal.userData.angle += petal.userData.speed * 0.01;
            petal.position.x = Math.cos(petal.userData.angle) * petal.userData.radius;
            petal.position.z = Math.sin(petal.userData.angle) * petal.userData.radius;
            petal.position.y = petal.userData.yOffset + Math.sin(time * 2 + petal.userData.angle) * 2;
            petal.rotation.y = -petal.userData.angle;
        }
    };
    
    return { group, core };
}
