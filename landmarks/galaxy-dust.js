export function createGalaxyDust(THREE, scene) {
    const group = new THREE.Group();
    group.name = 'galaxy-dust-particles';

    const particleCount = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount); // For twinkling

    const color1 = new THREE.Color('#ff00aa');
    const color2 = new THREE.Color('#00ffcc');
    const color3 = new THREE.Color('#4400ff');
    const mixedColor = new THREE.Color();

    for (let i = 0; i < particleCount; i++) {
        // Distribute in a wide disk (galaxy shape)
        const radius = 200 + Math.random() * 800;
        const angle = Math.random() * Math.PI * 2;
        const thickness = (Math.random() - 0.5) * 150 * (1 - radius / 1000); // Thinner at edges

        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = thickness;
        positions[i * 3 + 2] = Math.sin(angle) * radius;

        // Color based on distance from center
        const t = radius / 1000;
        if (t < 0.3) {
            mixedColor.lerpColors(color1, color3, t / 0.3);
        } else {
            mixedColor.lerpColors(color3, color2, (t - 0.3) / 0.7);
        }
        
        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;

        sizes[i] = Math.random() * 2 + 0.5;
        phases[i] = Math.random() * Math.PI * 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    // Custom shader material for twinkling dust
    const material = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            attribute float size;
            attribute float phase;
            attribute vec3 color;
            varying vec3 vColor;
            varying float vPhase;
            void main() {
                vColor = color;
                vPhase = phase;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec3 vColor;
            varying float vPhase;
            void main() {
                // Circular particle
                vec2 coord = gl_PointCoord - vec2(0.5);
                if(length(coord) > 0.5) discard;
                
                // Twinkle effect
                float alpha = 0.3 + 0.7 * sin(time * 2.0 + vPhase);
                
                // Soft edge
                alpha *= (1.0 - (length(coord) * 2.0));
                
                gl_FragColor = vec4(vColor, alpha * 0.6);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const dust = new THREE.Points(geometry, material);
    group.add(dust);
    scene.add(group);

    function update(delta, elapsed) {
        material.uniforms.time.value = elapsed;
        group.rotation.y = elapsed * 0.01; // Slow rotation of the entire galaxy
    }

    return { group, update };
}
