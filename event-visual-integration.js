/**
 * EVENT VISUAL INTEGRATION
 * Three.js visual effects for universe events and challenges
 * Version 1.0 - Day 398
 */

const EventVisualIntegration = {
    // ========================
    // THREE.JS COMPONENTS
    // ========================
    
    scene: null,
    camera: null,
    
    // Visual effect containers
    auroraSystem: null,
    shootingStarSystem: null,
    constellationSystem: null,
    emergencySystem: null,
    celebrationSystem: null,
    
    activeEffects: new Set(),
    
    // ========================
    // INITIALIZATION
    // ========================
    
    init: function(scene, camera) {
        console.log('🎨 Event Visual Integration Initialized');
        
        this.scene = scene;
        this.camera = camera;
        
        // Initialize visual systems
        this.initAuroraSystem();
        this.initShootingStarSystem();
        this.initConstellationSystem();
        this.initEmergencySystem();
        this.initCelebrationSystem();
        
        return this;
    },
    
    // ========================
    // AURORA SYSTEM
    // ========================
    
    initAuroraSystem: function() {
        this.auroraSystem = {
            ribbons: [],
            particles: [],
            geometry: null,
            material: null
        };
    },
    
    createAuroraEffect: function(color = '#00ffaa', intensity = 0.5) {
        const auroraGroup = new THREE.Group();
        
        // Create flowing ribbon particles
        const ribbonCount = 8;
        for (let i = 0; i < ribbonCount; i++) {
            const points = [];
            const height = 200 + Math.random() * 100;
            const width = 300 + Math.random() * 200;
            const segments = 20;
            
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const x = Math.cos(t * Math.PI * 2) * width * (0.5 + Math.sin(t * Math.PI) * 0.3);
                const y = height * (t - 0.5) + Math.sin(t * Math.PI * 3) * 20;
                const z = Math.sin(t * Math.PI * 2) * width * 0.3;
                
                points.push(new THREE.Vector3(x, y, z));
            }
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, 64, 3, 8, false);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0.3 + Math.random() * 0.4,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });
            
            const ribbon = new THREE.Mesh(geometry, material);
            ribbon.position.y = -50;
            ribbon.rotation.y = (i / ribbonCount) * Math.PI * 2;
            auroraGroup.add(ribbon);
            this.auroraSystem.ribbons.push(ribbon);
        }
        
        // Add animated particles
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 600;
            positions[i3 + 1] = Math.random() * 300 - 100;
            positions[i3 + 2] = (Math.random() - 0.5) * 600;
            
            const color = new THREE.Color(color);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        auroraGroup.add(particles);
        this.auroraSystem.particles = particles;
        
        auroraGroup.position.set(0, 100, -300);
        this.scene.add(auroraGroup);
        
        return auroraGroup;
    },
    
    updateAuroraEffect: function(auroraGroup, deltaTime) {
        if (!auroraGroup) return;
        
        // Animate ribbons
        this.auroraSystem.ribbons.forEach((ribbon, i) => {
            ribbon.rotation.y += deltaTime * 0.1;
            ribbon.material.opacity = 0.3 + Math.sin(Date.now() * 0.001 + i) * 0.2;
        });
        
        // Animate particles
        if (this.auroraSystem.particles) {
            const positions = this.auroraSystem.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(Date.now() * 0.001 + i) * 0.1;
            }
            this.auroraSystem.particles.geometry.attributes.position.needsUpdate = true;
        }
    },
    
    // ========================
    // SHOOTING STAR SYSTEM
    // ========================
    
    initShootingStarSystem: function() {
        this.shootingStarSystem = {
            stars: [],
            geometry: null,
            material: null
        };
    },
    
    createShootingStarEffect: function(count = 150, color = '#aaffff', speed = 2.5) {
        const starGroup = new THREE.Group();
        
        const starGeometry = new THREE.BufferGeometry();
        const starCount = count;
        const positions = new Float32Array(starCount * 3);
        const velocities = new Float32Array(starCount * 3);
        const lifetimes = new Float32Array(starCount);
        const colors = new Float32Array(starCount * 3);
        
        const baseColor = new THREE.Color(color);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Random starting position in a sphere
            const radius = 500 + Math.random() * 300;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Velocity toward center with some randomness
            const dirX = -positions[i3] * 0.002 + (Math.random() - 0.5) * 0.5;
            const dirY = -positions[i3 + 1] * 0.002 + (Math.random() - 0.5) * 0.5;
            const dirZ = -positions[i3 + 2] * 0.002 + (Math.random() - 0.5) * 0.5;
            
            velocities[i3] = dirX * speed;
            velocities[i3 + 1] = dirY * speed;
            velocities[i3 + 2] = dirZ * speed;
            
            lifetimes[i] = 1.0; // Full life
            
            // Color with slight variations
            colors[i3] = baseColor.r * (0.8 + Math.random() * 0.2);
            colors[i3 + 1] = baseColor.g * (0.8 + Math.random() * 0.2);
            colors[i3 + 2] = baseColor.b * (0.8 + Math.random() * 0.2);
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        this.shootingStarSystem.velocities = velocities;
        this.shootingStarSystem.lifetimes = lifetimes;
        
        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        starGroup.add(stars);
        this.shootingStarSystem.stars = stars;
        
        this.scene.add(starGroup);
        return starGroup;
    },
    
    updateShootingStarEffect: function(starGroup, deltaTime) {
        if (!starGroup || !this.shootingStarSystem.stars) return;
        
        const positions = this.shootingStarSystem.stars.geometry.attributes.position.array;
        const velocities = this.shootingStarSystem.velocities;
        const lifetimes = this.shootingStarSystem.lifetimes;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update position
            positions[i3] += velocities[i3];
            positions[i3 + 1] += velocities[i3 + 1];
            positions[i3 + 2] += velocities[i3 + 2];
            
            // Update lifetime
            lifetimes[i] -= deltaTime * 0.5;
            
            // Reset star if it's dead or too close to center
            const distance = Math.sqrt(
                positions[i3] * positions[i3] +
                positions[i3 + 1] * positions[i3 + 1] +
                positions[i3 + 2] * positions[i3 + 2]
            );
            
            if (lifetimes[i] <= 0 || distance < 50) {
                // Respawn at edge
                const radius = 500 + Math.random() * 300;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = radius * Math.cos(phi);
                
                lifetimes[i] = 1.0;
            }
        }
        
        this.shootingStarSystem.stars.geometry.attributes.position.needsUpdate = true;
        
        // Update material opacity based on lifetimes
        const avgLifetime = lifetimes.reduce((a, b) => a + b, 0) / lifetimes.length;
        this.shootingStarSystem.stars.material.opacity = avgLifetime;
    },
    
    // ========================
    // CONSTELLATION SYSTEM
    // ========================
    
    initConstellationSystem: function() {
        this.constellationSystem = {
            lines: [],
            nodes: [],
            labels: []
        };
    },
    
    createConstellationEffect: function(worldPositions, color = '#ffaa00', opacity = 0.6) {
        const constellationGroup = new THREE.Group();
        
        if (!worldPositions || worldPositions.length < 2) {
            return constellationGroup;
        }
        
        // Create connecting lines between worlds
        for (let i = 0; i < worldPositions.length; i++) {
            for (let j = i + 1; j < worldPositions.length; j++) {
                const start = new THREE.Vector3(...worldPositions[i]);
                const end = new THREE.Vector3(...worldPositions[j]);
                
                // Create Bezier curve for arc
                const mid = start.clone().add(end).multiplyScalar(0.5);
                mid.y += 20; // Arc height
                
                const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
                const points = curve.getPoints(20);
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineDashedMaterial({
                    color: new THREE.Color(color),
                    linewidth: 1,
                    dashSize: 2,
                    gapSize: 1,
                    transparent: true,
                    opacity: opacity
                });
                
                const line = new THREE.Line(geometry, material);
                line.computeLineDistances();
                constellationGroup.add(line);
                this.constellationSystem.lines.push(line);
            }
        }
        
        // Create glowing nodes at world positions
        worldPositions.forEach((position, index) => {
            const geometry = new THREE.SphereGeometry(3, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            const node = new THREE.Mesh(geometry, material);
            node.position.set(...position);
            constellationGroup.add(node);
            this.constellationSystem.nodes.push(node);
        });
        
        this.scene.add(constellationGroup);
        return constellationGroup;
    },
    
    updateConstellationEffect: function(constellationGroup, deltaTime) {
        if (!constellationGroup) return;
        
        // Pulse opacity
        const pulse = Math.sin(Date.now() * 0.001) * 0.2 + 0.8;
        
        this.constellationSystem.lines.forEach(line => {
            line.material.opacity = pulse * 0.6;
        });
        
        this.constellationSystem.nodes.forEach(node => {
            node.material.opacity = pulse * 0.8;
            node.scale.setScalar(1 + Math.sin(Date.now() * 0.002 + node.position.x) * 0.1);
        });
    },
    
    // ========================
    // EMERGENCY SYSTEM
    // ========================
    
    initEmergencySystem: function() {
        this.emergencySystem = {
            indicators: [],
            beacons: [],
            warnings: []
        };
    },
    
    createEmergencyEffect: function(level = 'elevated', color = '#ffaa00') {
        const emergencyGroup = new THREE.Group();
        
        // Create warning spheres at key coordination points
        const warningPositions = [
            [0, -15, 150],    // Pattern Archive
            [-30, -5, 120],   // Anchorage
            [80, 0, 130],     // Signal Cartographer
            [-40, 30, -140],  // Luminous Index
            [-100, 25, 80]    // Automation Observatory
        ];
        
        warningPositions.forEach((position, index) => {
            const geometry = new THREE.SphereGeometry(8, 16, 16);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color(color),
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                wireframe: true
            });
            
            const indicator = new THREE.Mesh(geometry, material);
            indicator.position.set(...position);
            emergencyGroup.add(indicator);
            this.emergencySystem.indicators.push(indicator);
            
            // Add pulsing light
            const light = new THREE.PointLight(new THREE.Color(color), 2, 100);
            light.position.set(...position);
            emergencyGroup.add(light);
            this.emergencySystem.beacons.push(light);
        });
        
        // Create warning beams
        const beamGeometry = new THREE.CylinderGeometry(2, 2, 100, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(0, 50, 0);
        emergencyGroup.add(beam);
        this.emergencySystem.warnings.push(beam);
        
        this.scene.add(emergencyGroup);
        return emergencyGroup;
    },
    
    updateEmergencyEffect: function(emergencyGroup, deltaTime, level) {
        if (!emergencyGroup) return;
        
        // Update pulse rate based on emergency level
        let pulseRate = 1.0;
        let intensity = 1.0;
        
        switch(level) {
            case 'elevated':
                pulseRate = 1.5;
                intensity = 1.0;
                break;
            case 'warning':
                pulseRate = 2.0;
                intensity = 1.5;
                break;
            case 'critical':
                pulseRate = 3.0;
                intensity = 2.0;
                break;
        }
        
        const pulse = Math.sin(Date.now() * 0.001 * pulseRate) * 0.5 + 0.5;
        
        // Update indicators
        this.emergencySystem.indicators.forEach((indicator, index) => {
            indicator.material.opacity = pulse * 0.5 * intensity;
            indicator.scale.setScalar(1 + pulse * 0.3);
            indicator.rotation.y += deltaTime * 0.5;
        });
        
        // Update beacons
        this.emergencySystem.beacons.forEach(beacon => {
            beacon.intensity = pulse * 2 * intensity;
        });
        
        // Update warning beams
        this.emergencySystem.warnings.forEach(beam => {
            beam.material.opacity = pulse * 0.3 * intensity;
            beam.rotation.y += deltaTime * 0.2;
        });
    },
    
    // ========================
    // CELEBRATION SYSTEM
    // ========================
    
    initCelebrationSystem: function() {
        this.celebrationSystem = {
            sparkles: [],
            fireworks: [],
            messages: []
        };
    },
    
    createCelebrationEffect: function(sparkleCount = 500, color = '#ff00ff') {
        const celebrationGroup = new THREE.Group();
        
        // Create sparkle particles
        const sparkleGeometry = new THREE.BufferGeometry();
        const sparklePositions = new Float32Array(sparkleCount * 3);
        const sparkleColors = new Float32Array(sparkleCount * 3);
        const sparkleVelocities = new Float32Array(sparkleCount * 3);
        
        const baseColor = new THREE.Color(color);
        
        for (let i = 0; i < sparkleCount; i++) {
            const i3 = i * 3;
            
            // Random positions in a sphere
            const radius = 100 + Math.random() * 200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            sparklePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            sparklePositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            sparklePositions[i3 + 2] = radius * Math.cos(phi);
            
            // Random velocities
            sparkleVelocities[i3] = (Math.random() - 0.5) * 2;
            sparkleVelocities[i3 + 1] = (Math.random() - 0.5) * 2;
            sparkleVelocities[i3 + 2] = (Math.random() - 0.5) * 2;
            
            // Color variations
            const hueShift = (Math.random() - 0.5) * 0.2;
            const sparkleColor = new THREE.Color();
            sparkleColor.setHSL(
                baseColor.getHSL({}).h + hueShift,
                0.8 + Math.random() * 0.2,
                0.7 + Math.random() * 0.3
            );
            
            sparkleColors[i3] = sparkleColor.r;
            sparkleColors[i3 + 1] = sparkleColor.g;
            sparkleColors[i3 + 2] = sparkleColor.b;
        }
        
        sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
        sparkleGeometry.setAttribute('color', new THREE.BufferAttribute(sparkleColors, 3));
        
        this.celebrationSystem.sparkleVelocities = sparkleVelocities;
        
        const sparkleMaterial = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
        celebrationGroup.add(sparkles);
        this.celebrationSystem.sparkles = sparkles;
        
        // Create celebration message
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 48px Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('🎉 CELEBRATION 🎉', canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        const messageSprite = new THREE.Sprite(spriteMaterial);
        messageSprite.position.set(0, 80, 0);
        messageSprite.scale.set(100, 25, 1);
        celebrationGroup.add(messageSprite);
        this.celebrationSystem.messages.push(messageSprite);
        
        this.scene.add(celebrationGroup);
        return celebrationGroup;
    },
    
    updateCelebrationEffect: function(celebrationGroup, deltaTime) {
        if (!celebrationGroup || !this.celebrationSystem.sparkles) return;
        
        const positions = this.celebrationSystem.sparkles.geometry.attributes.position.array;
        const velocities = this.celebrationSystem.sparkleVelocities;
        
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Update position
            positions[i3] += velocities[i3] * deltaTime * 10;
            positions[i3 + 1] += velocities[i3 + 1] * deltaTime * 10;
            positions[i3 + 2] += velocities[i3 + 2] * deltaTime * 10;
            
            // Apply gravity toward center
            const x = positions[i3];
            const y = positions[i3 + 1];
            const z = positions[i3 + 2];
            
            const distance = Math.sqrt(x * x + y * y + z * z);
            if (distance > 50) {
                const force = 0.01;
                velocities[i3] -= (x / distance) * force;
                velocities[i3 + 1] -= (y / distance) * force;
                velocities[i3 + 2] -= (z / distance) * force;
            }
            
            // Random velocity changes
            if (Math.random() < 0.01) {
                velocities[i3] += (Math.random() - 0.5) * 0.5;
                velocities[i3 + 1] += (Math.random() - 0.5) * 0.5;
                velocities[i3 + 2] += (Math.random() - 0.5) * 0.5;
            }
        }
        
        this.celebrationSystem.sparkles.geometry.attributes.position.needsUpdate = true;
        
        // Update message opacity
        this.celebrationSystem.messages.forEach(message => {
            message.material.opacity = Math.sin(Date.now() * 0.001) * 0.4 + 0.6;
        });
    },
    
    // ========================
    // MAIN EVENT DISPLAY
    // ========================
    
    displayEvent: function(event) {
        console.log(`🎨 Displaying visual effects for: ${event.name}`);
        
        switch(event.visualType) {
            case 'aurora':
                const auroraEffect = this.createAuroraEffect(event.color);
                this.activeEffects.add({ type: 'aurora', object: auroraEffect, event: event });
                break;
                
            case 'shootingStars':
                const shootingStarEffect = this.createShootingStarEffect(
                    event.particleCount || 150,
                    event.color,
                    event.speed || 2.5
                );
                this.activeEffects.add({ type: 'shootingStars', object: shootingStarEffect, event: event });
                break;
                
            case 'constellation':
                // Get world positions from config
                const worldPositions = this.getWorldPositions();
                const constellationEffect = this.createConstellationEffect(
                    worldPositions,
                    event.color,
                    event.opacity || 0.6
                );
                this.activeEffects.add({ type: 'constellation', object: constellationEffect, event: event });
                break;
                
            case 'emergency':
                const emergencyEffect = this.createEmergencyEffect('elevated', event.color);
                this.activeEffects.add({ type: 'emergency', object: emergencyEffect, event: event });
                break;
                
            case 'celebration':
                const celebrationEffect = this.createCelebrationEffect(
                    event.sparkleCount || 500,
                    event.color
                );
                this.activeEffects.add({ type: 'celebration', object: celebrationEffect, event: event });
                break;
        }
    },
    
    endEvent: function(eventId) {
        console.log(`🎨 Ending visual effects for: ${eventId}`);
        
        // Remove effects for this event
        const effectsToRemove = [];
        this.activeEffects.forEach(effect => {
            if (effect.event.id === eventId) {
                this.scene.remove(effect.object);
                effectsToRemove.push(effect);
            }
        });
        
        effectsToRemove.forEach(effect => {
            this.activeEffects.delete(effect);
        });
    },
    
    // ========================
    // UPDATE LOOP
    // ========================
    
    update: function(deltaTime) {
        // Update all active effects
        this.activeEffects.forEach(effect => {
            switch(effect.type) {
                case 'aurora':
                    this.updateAuroraEffect(effect.object, deltaTime);
                    break;
                case 'shootingStars':
                    this.updateShootingStarEffect(effect.object, deltaTime);
                    break;
                case 'constellation':
                    this.updateConstellationEffect(effect.object, deltaTime);
                    break;
                case 'emergency':
                    this.updateEmergencyEffect(effect.object, deltaTime, effect.event.level || 'elevated');
                    break;
                case 'celebration':
                    this.updateCelebrationEffect(effect.object, deltaTime);
                    break;
            }
        });
    },
    
    // ========================
    // UTILITY FUNCTIONS
    // ========================
    
    getWorldPositions: function() {
        // This would be populated from the actual world configurations
        // For now, return some sample positions
        return [
            [0, -15, 150],     // Pattern Archive
            [-30, -5, 120],    // Anchorage
            [80, 0, 130],      // Signal Cartographer
            [-40, 30, -140],   // Luminous Index
            [-100, 25, 80],    // Automation Observatory
            [120, -10, -80],   // Edge Garden
            [-150, 20, 60]     // Some other world
        ];
    },
    
    cleanup: function() {
        // Remove all active effects
        this.activeEffects.forEach(effect => {
            this.scene.remove(effect.object);
        });
        this.activeEffects.clear();
        
        console.log('🧹 Event visual effects cleaned up');
    }
};

// Global initialization
if (typeof window !== 'undefined') {
    window.EventVisualIntegration = EventVisualIntegration;
}

export { EventVisualIntegration };
