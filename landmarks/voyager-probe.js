export function createVoyagerProbe(THREE, scene) {
    const group = new THREE.Group();
    group.name = 'voyager-probe';
    
    // Main body (hexagonal prism)
    const bodyGeo = new THREE.CylinderGeometry(2, 2, 1.5, 10);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc, metalness: 0.8, roughness: 0.4
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Golden Record (disk on the side)
    const recordGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
    const recordMat = new THREE.MeshStandardMaterial({
        color: 0xffd700, metalness: 0.9, roughness: 0.2
    });
    const record = new THREE.Mesh(recordGeo, recordMat);
    record.position.set(0, 0, 0.8);
    record.rotation.x = Math.PI / 2;
    group.add(record);

    // High-gain antenna (dish)
    const dishGeo = new THREE.SphereGeometry(3, 32, 16, 0, Math.PI * 2, 0, Math.PI / 4);
    const dishMat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee, metalness: 0.5, roughness: 0.7, side: THREE.DoubleSide
    });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0, 0, -1);
    dish.rotation.x = Math.PI;
    group.add(dish);

    // Magnetometer boom (long pole)
    const boomGeo = new THREE.CylinderGeometry(0.1, 0.1, 15);
    const boomMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7 });
    const boom = new THREE.Mesh(boomGeo, boomMat);
    boom.position.set(5, 5, 0);
    boom.rotation.z = Math.PI / 4;
    group.add(boom);
    
    // RTG (Radioisotope Thermoelectric Generator) boom
    const rtgBoomGeo = new THREE.CylinderGeometry(0.1, 0.1, 8);
    const rtgBoom = new THREE.Mesh(rtgBoomGeo, boomMat);
    rtgBoom.position.set(-3, -3, 0);
    rtgBoom.rotation.z = Math.PI / 4;
    group.add(rtgBoom);

    // RTG body
    const rtgGeo = new THREE.CylinderGeometry(0.4, 0.4, 3);
    const rtgMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    const rtg = new THREE.Mesh(rtgGeo, rtgMat);
    rtg.position.set(-6, -6, 0);
    rtg.rotation.z = Math.PI / 4;
    group.add(rtg);

    scene.add(group);

    // Voyager's orbit parameters
    const orbitRadius = 600;
    const orbitSpeed = 0.05;
    
    function update(delta, elapsed) {
        // Move voyager in a large, slow orbit
        const angle = elapsed * orbitSpeed;
        group.position.x = Math.cos(angle) * orbitRadius;
        group.position.z = Math.sin(angle) * orbitRadius;
        group.position.y = Math.sin(elapsed * 0.1) * 100; // Gentle bobbing

        // Always point the dish (negative Z) roughly towards the center (0,0,0)
        group.lookAt(new THREE.Vector3(0, group.position.y, 0));
        
        // Spin slightly around its own axis
        group.rotateZ(elapsed * 0.2);
    }

    return { group, update };
}
