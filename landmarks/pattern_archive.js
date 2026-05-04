// Pattern Archive Landmark Module - Ecosystem Coordination Nexus
// Exports createPatternArchiveLandmark(THREE, worldData)

export function createPatternArchiveLandmark(THREE, world) {
    const group = new THREE.Group();
    group.name = `PatternArchive-${world.id}`;
    
    // Central coordination cube
    const geometry = new THREE.BoxGeometry(15, 15, 15);
    const material = new THREE.MeshPhongMaterial({
        color: world.color || 0x8a2be2,
        emissive: world.color || 0x8a2be2,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;
    group.add(cube);
    
    // Pulsing animation
    let pulseScale = 1.0;
    let pulseDirection = 0.01;
    cube.userData.update = function(delta) {
        pulseScale += pulseDirection * delta * 10;
        if (pulseScale > 1.2) {
            pulseDirection = -0.01;
        } else if (pulseScale < 0.8) {
            pulseDirection = 0.01;
        }
        cube.scale.set(pulseScale, pulseScale, pulseScale);
    };
    
    // Orbiting data nodes (representing connected worlds)
    const nodeCount = 8;
    const nodes = [];
    for (let i = 0; i < nodeCount; i++) {
        const nodeGeo = new THREE.SphereGeometry(2, 8, 8);
        const nodeMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        
        const angle = (i / nodeCount) * Math.PI * 2;
        const radius = 25;
        node.position.x = Math.cos(angle) * radius;
        node.position.y = Math.sin(angle) * radius * 0.5;
        node.position.z = Math.sin(angle) * radius;
        
        // Node-specific orbit
        node.userData.orbitRadius = radius;
        node.userData.orbitSpeed = 0.5 + Math.random() * 0.5;
        node.userData.phase = Math.random() * Math.PI * 2;
        
        // Connection line to center
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            linewidth: 1
        });
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(node.position.x, node.position.y, node.position.z)
        ]);
        const line = new THREE.Line(lineGeometry, lineMaterial);
        group.add(line);
        
        group.add(node);
        nodes.push(node);
    }
    
    // Animated orbiting of nodes
    group.userData.update = function(delta) {
        // Update central cube pulse
        cube.userData.update?.(delta);
        
        // Update orbiting nodes
        nodes.forEach((node, i) => {
            const time = Date.now() * 0.001;
            const angle = time * node.userData.orbitSpeed + node.userData.phase;
            const radius = node.userData.orbitRadius;
            
            node.position.x = Math.cos(angle) * radius;
            node.position.y = Math.sin(angle) * radius * 0.5 + Math.sin(time * 2) * 5;
            node.position.z = Math.sin(angle) * radius;
            
            // Update connection lines (reset and recreate)
            group.children.forEach(child => {
                if (child.type === 'Line') {
                    group.remove(child);
                }
            });
            
            nodes.forEach(node => {
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.2 + Math.sin(time) * 0.1,
                    linewidth: 1
                });
                const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(node.position.x, node.position.y, node.position.z)
                ]);
                const line = new THREE.Line(lineGeometry, lineMaterial);
                group.add(line);
            });
        });
    };
    
    return group;
}

export default createPatternArchiveLandmark;
