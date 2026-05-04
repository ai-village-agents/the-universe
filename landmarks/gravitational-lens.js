// Gravitational Lens - Light bending around massive object
// Created by Claude Opus 4.5 on Day 398
// Einstein ring and distorted background galaxies
// Position: (300, 150, -450)

export function createGravitationalLens(THREE) {
    const group = new THREE.Group();
    
    // Central massive object (invisible dark matter or black hole)
    const massGeo = new THREE.SphereGeometry(8, 32, 32);
    const massMat = new THREE.MeshBasicMaterial({
        color: 0x111122,
        transparent: true,
        opacity: 0.3
    });
    const mass = new THREE.Mesh(massGeo, massMat);
    group.add(mass);
    
    // Einstein ring - the characteristic ring of light
    const ringGeo = new THREE.TorusGeometry(25, 1.5, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffffaa,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    
    // Inner ring glow
    const innerRingGeo = new THREE.TorusGeometry(25, 4, 16, 64);
    const innerRingMat = new THREE.MeshBasicMaterial({
        color: 0xffeeaa,
        transparent: true,
        opacity: 0.2
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = Math.PI / 2;
    group.add(innerRing);
    
    // Multiple arc segments (partial Einstein rings from off-center sources)
    const arcCount = 4;
    const arcs = [];
    
    for (let i = 0; i < arcCount; i++) {
        const arcRadius = 18 + i * 5;
        const arcGeo = new THREE.TorusGeometry(arcRadius, 0.8, 8, 32, Math.PI * 0.6);
        const arcMat = new THREE.MeshBasicMaterial({
            color: i % 2 === 0 ? 0xaaddff : 0xffccaa,
            transparent: true,
            opacity: 0.5
        });
        const arc = new THREE.Mesh(arcGeo, arcMat);
        arc.rotation.x = Math.PI / 2;
        arc.rotation.z = (i / arcCount) * Math.PI * 2;
        group.add(arc);
        arcs.push(arc);
    }
    
    // Distorted background galaxies (stretched into arcs)
    const galaxyCount = 6;
    const galaxies = [];
    
    for (let i = 0; i < galaxyCount; i++) {
        const angle = (i / galaxyCount) * Math.PI * 2;
        const dist = 30 + Math.random() * 10;
        
        // Stretched ellipse shape
        const galaxyGeo = new THREE.TorusGeometry(3, 1, 8, 16, Math.PI * 0.4);
        const galaxyMat = new THREE.MeshBasicMaterial({
            color: Math.random() > 0.5 ? 0xffbb77 : 0x77aaff,
            transparent: true,
            opacity: 0.6
        });
        const galaxy = new THREE.Mesh(galaxyGeo, galaxyMat);
        
        galaxy.position.set(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 10,
            Math.sin(angle) * dist
        );
        galaxy.rotation.x = Math.PI / 2;
        galaxy.rotation.z = angle + Math.PI / 2;
        
        group.add(galaxy);
        galaxies.push(galaxy);
    }
    
    // Light ray particles showing bending paths
    const rayCount = 200;
    const rayGeo = new THREE.BufferGeometry();
    const rayPositions = new Float32Array(rayCount * 3);
    
    for (let i = 0; i < rayCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = 20 + Math.random() * 15;
        rayPositions[i * 3] = Math.cos(angle) * r;
        rayPositions[i * 3 + 1] = (Math.random() - 0.5) * 8;
        rayPositions[i * 3 + 2] = Math.sin(angle) * r;
    }
    
    rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
    
    const rayMat = new THREE.PointsMaterial({
        color: 0xffffcc,
        size: 0.6,
        transparent: true,
        opacity: 0.7
    });
    const rays = new THREE.Points(rayGeo, rayMat);
    group.add(rays);
    
    // Gravitational distortion field visualization
    const fieldLineCount = 12;
    const fieldLines = [];
    
    for (let i = 0; i < fieldLineCount; i++) {
        const angle = (i / fieldLineCount) * Math.PI * 2;
        const points = [];
        
        for (let j = 0; j <= 20; j++) {
            const t = j / 20;
            const r = 10 + t * 30;
            // Add curvature to show bending
            const bend = Math.sin(t * Math.PI) * 5;
            points.push(new THREE.Vector3(
                Math.cos(angle) * r + Math.cos(angle + Math.PI/2) * bend,
                0,
                Math.sin(angle) * r + Math.sin(angle + Math.PI/2) * bend
            ));
        }
        
        const curve = new THREE.CatmullRomCurve3(points);
        const lineGeo = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
        const lineMat = new THREE.MeshBasicMaterial({
            color: 0x4466aa,
            transparent: true,
            opacity: 0.25
        });
        const line = new THREE.Mesh(lineGeo, lineMat);
        group.add(line);
        fieldLines.push(line);
    }
    
    // Subtle ambient light
    const light = new THREE.PointLight(0xffffee, 0.8, 100);
    group.add(light);
    
    // Store references
    group.userData.ring = ring;
    group.userData.innerRing = innerRing;
    group.userData.arcs = arcs;
    group.userData.galaxies = galaxies;
    group.userData.rays = rays;
    group.userData.fieldLines = fieldLines;
    group.userData.mass = mass;
    
    // Animation update
    group.userData.update = function(time) {
        // Ring shimmer
        this.ring.material.opacity = 0.6 + Math.sin(time * 2) * 0.15;
        this.innerRing.material.opacity = 0.15 + Math.sin(time * 1.5) * 0.08;
        
        // Arcs slowly rotate
        this.arcs.forEach((arc, i) => {
            arc.rotation.z = (i / 4) * Math.PI * 2 + time * 0.1;
            arc.material.opacity = 0.4 + Math.sin(time * 2 + i) * 0.15;
        });
        
        // Galaxies orbit slowly
        this.galaxies.forEach((galaxy, i) => {
            const baseAngle = (i / 6) * Math.PI * 2;
            const angle = baseAngle + time * 0.05;
            const dist = 32;
            galaxy.position.x = Math.cos(angle) * dist;
            galaxy.position.z = Math.sin(angle) * dist;
            galaxy.rotation.z = angle + Math.PI / 2;
        });
        
        // Rays orbit around the lens
        this.rays.rotation.y = time * 0.1;
        
        // Field lines fade in and out
        this.fieldLines.forEach((line, i) => {
            line.material.opacity = 0.15 + Math.sin(time * 0.5 + i * 0.5) * 0.1;
        });
        
        // Mass subtle pulse
        this.mass.scale.setScalar(1 + Math.sin(time) * 0.05);
    };
    
    return { group };
}
