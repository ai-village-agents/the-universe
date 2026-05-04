/**
 * PATTERN ARCHIVE ENHANCED
 * Central coordination hub with event system integration
 * Version 2.0 - Day 398
 */

const PatternArchiveEnhanced = {
    // ========================
    // CONFIGURATION
    // ========================
    
    position: [0, -15, 150],
    scale: 2.5,
    
    // Color schemes
    colors: {
        primary: '#00aaff',
        secondary: '#ffaa00',
        success: '#00ffaa',
        warning: '#ffaa00',
        danger: '#ff5500',
        emergency: '#ff0000',
        celebration: '#ff00ff'
    },
    
    // ========================
    // THREE.JS COMPONENTS
    // ========================
    
    group: null,
    coordinationCube: null,
    statusPanel: null,
    waypointMarkers: [],
    emergencyIndicators: [],
    
    // ========================
    // COORDINATION DATA
    // ========================
    
    coordinationLandmarks: [
        {
            id: 'patternArchive',
            name: 'Pattern Archive Core',
            position: [0, -15, 150],
            description: 'Central coordination hub for universe events and challenges',
            challengeWaypoint: true,
            completed: false
        },
        {
            id: 'anchorage',
            name: 'Anchorage Beacon',
            position: [-30, -5, 120],
            description: 'Navigation and stability monitoring station',
            challengeWaypoint: true,
            completed: false
        },
        {
            id: 'signalCartographer',
            name: 'Signal Cartographer',
            position: [80, 0, 130],
            description: 'Cross-world communication and mapping center',
            challengeWaypoint: true,
            completed: false
        },
        {
            id: 'luminousIndex',
            name: 'Luminous Index',
            position: [-40, 30, -140],
            description: 'Knowledge organization and discovery system',
            challengeWaypoint: true,
            completed: false
        },
        {
            id: 'automationObservatory',
            name: 'Automation Observatory',
            position: [-100, 25, 80],
            description: 'Automated observation and systematic exploration hub',
            challengeWaypoint: true,
            completed: false
        }
    ],
    
    emergencyStatus: 'elevated',
    activeEvents: [],
    visitorProgress: {},
    
    // ========================
    // INITIALIZATION
    // ========================
    
    init: function(scene) {
        console.log('🏛️ Enhanced Pattern Archive Initialized');
        
        this.group = new THREE.Group();
        this.group.position.set(...this.position);
        
        this.createCoordinationCube();
        this.createStatusPanel();
        this.createWaypointMarkers();
        this.createEmergencyIndicators();
        
        scene.add(this.group);
        
        // Initialize coordination with event system
        this.connectToEventSystem();
        
        // Start update loop
        this.startUpdateLoop();
        
        return this;
    },
    
    // ========================
    // COORDINATION CUBE
    // ========================
    
    createCoordinationCube: function() {
        // Main coordination cube
        const cubeGeometry = new THREE.BoxGeometry(20, 20, 20);
        const cubeMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.primary,
            transparent: true,
            opacity: 0.8,
            emissive: this.colors.primary,
            emissiveIntensity: 0.2,
            shininess: 100
        });
        
        this.coordinationCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        
        // Add inner glow
        const innerGeometry = new THREE.BoxGeometry(18, 18, 18);
        const innerMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.secondary,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide
        });
        
        const innerCube = new THREE.Mesh(innerGeometry, innerMaterial);
        this.coordinationCube.add(innerCube);
        
        // Add floating data particles
        const particleCount = 100;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 15;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Gradient from primary to secondary
            const t = i / particleCount;
            const color = new THREE.Color();
            color.lerpColors(
                new THREE.Color(this.colors.primary),
                new THREE.Color(this.colors.secondary),
                t
            );
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.coordinationCube.add(particles);
        
        // Add coordination beams
        const beamCount = 8;
        const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, 30, 8);
        const beamMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.primary,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        for (let i = 0; i < beamCount; i++) {
            const angle = (i / beamCount) * Math.PI * 2;
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.position.y = 15;
            beam.rotation.z = angle;
            beam.rotation.x = Math.PI / 2;
            this.coordinationCube.add(beam);
        }
        
        this.group.add(this.coordinationCube);
    },
    
    updateCoordinationCube: function(deltaTime) {
        if (!this.coordinationCube) return;
        
        // Rotate slowly
        this.coordinationCube.rotation.y += deltaTime * 0.1;
        this.coordinationCube.rotation.x += deltaTime * 0.05;
        
        // Pulse opacity based on emergency status
        const pulseRate = this.getEmergencyPulseRate();
        const pulse = Math.sin(Date.now() * 0.001 * pulseRate) * 0.2 + 0.8;
        
        this.coordinationCube.material.opacity = pulse * 0.8;
        this.coordinationCube.material.emissiveIntensity = pulse * 0.3;
        
        // Update inner particles
        const particles = this.coordinationCube.children.find(child => child.isPoints);
        if (particles) {
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                // Gentle orbiting motion
                const angle = Date.now() * 0.0001 + i * 0.01;
                const radius = 15 + Math.sin(angle) * 2;
                
                const x = positions[i];
                const y = positions[i + 1];
                const z = positions[i + 2];
                
                const currentRadius = Math.sqrt(x * x + y * y + z * z);
                const scale = radius / currentRadius;
                
                positions[i] *= scale;
                positions[i + 1] *= scale;
                positions[i + 2] *= scale;
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }
    },
    
    // ========================
    // STATUS PANEL
    // ========================
    
    createStatusPanel: function() {
        // Create floating status display
        const panelGroup = new THREE.Group();
        panelGroup.position.set(0, 25, 0);
        
        // Panel background
        const panelGeometry = new THREE.PlaneGeometry(40, 20);
        const panelMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panelGroup.add(panel);
        
        // Create canvas for dynamic text
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        this.statusCanvas = canvas;
        this.statusContext = canvas.getContext('2d');
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        this.statusSprite = new THREE.Sprite(spriteMaterial);
        this.statusSprite.scale.set(20, 10, 1);
        this.statusSprite.position.z = 0.1;
        panelGroup.add(this.statusSprite);
        
        // Update status display
        this.updateStatusDisplay();
        
        this.statusPanel = panelGroup;
        this.group.add(this.statusPanel);
    },
    
    updateStatusDisplay: function() {
        if (!this.statusCanvas || !this.statusContext) return;
        
        const ctx = this.statusContext;
        const width = this.statusCanvas.width;
        const height = this.statusCanvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(0, 20, 40, 0.9)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Emergency status header
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = this.getEmergencyColor();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`🚨 EMERGENCY STATUS: ${this.emergencyStatus.toUpperCase()}`, width / 2, 20);
        
        // Active events
        ctx.font = '18px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText('ACTIVE EVENTS:', 20, 60);
        
        if (this.activeEvents.length > 0) {
            this.activeEvents.forEach((event, index) => {
                ctx.fillStyle = '#00ffaa';
                ctx.fillText(`• ${event.name}`, 40, 90 + index * 25);
            });
        } else {
            ctx.fillStyle = '#888888';
            ctx.fillText('• No active events', 40, 90);
        }
        
        // Challenge progress
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PATTERN ARCHIVE RELAY:', 20, 140);
        
        const completed = this.coordinationLandmarks.filter(l => l.completed).length;
        const total = this.coordinationLandmarks.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        ctx.fillStyle = '#ffaa00';
        ctx.fillText(`${completed}/${total} waypoints completed (${percent}%)`, 40, 165);
        
        // Progress bar
        const barWidth = 200;
        const barHeight = 10;
        const barX = 40;
        const barY = 180;
        
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = this.colors.success;
        ctx.fillRect(barX, barY, (barWidth * completed) / total, barHeight);
        
        // Update texture
        if (this.statusSprite && this.statusSprite.material.map) {
            this.statusSprite.material.map.needsUpdate = true;
        }
    },
    
    // ========================
    // WAYPOINT MARKERS
    // ========================
    
    createWaypointMarkers: function() {
        this.coordinationLandmarks.forEach((landmark, index) => {
            if (!landmark.challengeWaypoint) return;
            
            const markerGroup = new THREE.Group();
            
            // Position marker at landmark location (relative to Pattern Archive)
            const relativePosition = new THREE.Vector3(
                landmark.position[0] - this.position[0],
                landmark.position[1] - this.position[1],
                landmark.position[2] - this.position[2]
            );
            
            markerGroup.position.copy(relativePosition);
            
            // Create waypoint beacon
            const beaconGeometry = new THREE.CylinderGeometry(0.5, 1, 10, 8);
            const beaconMaterial = new THREE.MeshBasicMaterial({
                color: landmark.completed ? this.colors.success : this.colors.secondary,
                transparent: true,
                opacity: 0.6,
                blending: THREE.AdditiveBlending
            });
            
            const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
            beacon.position.y = 5;
            markerGroup.add(beacon);
            
            // Add pulsing light
            const light = new THREE.PointLight(
                landmark.completed ? this.colors.success : this.colors.secondary,
                1,
                50
            );
            light.position.y = 5;
            markerGroup.add(light);
            
            // Add connection line to Pattern Archive
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                relativePosition.clone().multiplyScalar(-1)
            ]);
            
            const lineMaterial = new THREE.LineDashedMaterial({
                color: landmark.completed ? this.colors.success : this.colors.primary,
                linewidth: 1,
                dashSize: 1,
                gapSize: 0.5,
                transparent: true,
                opacity: 0.3
            });
            
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.computeLineDistances();
            markerGroup.add(line);
            
            this.waypointMarkers.push({
                group: markerGroup,
                beacon: beacon,
                light: light,
                line: line,
                landmark: landmark
            });
            
            this.group.add(markerGroup);
        });
    },
    
    updateWaypointMarkers: function(deltaTime) {
        this.waypointMarkers.forEach(marker => {
            // Rotate beacon
            marker.beacon.rotation.y += deltaTime * 0.2;
            
            // Pulse opacity
            const pulse = Math.sin(Date.now() * 0.001 + marker.landmark.position[0] * 0.01) * 0.3 + 0.7;
            marker.beacon.material.opacity = pulse * 0.6;
            
            // Update light intensity
            marker.light.intensity = pulse;
            
            // Update line opacity
            marker.line.material.opacity = pulse * 0.3;
            
            // Update colors based on completion
            if (marker.landmark.completed && marker.beacon.material.color.getHexString() !== this.colors.success.replace('#', '')) {
                marker.beacon.material.color.set(this.colors.success);
                marker.light.color.set(this.colors.success);
                marker.line.material.color.set(this.colors.success);
            }
        });
    },
    
    // ========================
    // EMERGENCY INDICATORS
    // ========================
    
    createEmergencyIndicators: function() {
        // Create rotating warning rings
        const ringCount = 3;
        const ringGeometry = new THREE.TorusGeometry(30, 1, 16, 100);
        
        for (let i = 0; i < ringCount; i++) {
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: this.getEmergencyColor(),
                transparent: true,
                opacity: 0.2 + i * 0.1,
                blending: THREE.AdditiveBlending,
                wireframe: true
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.position.y = i * 5;
            
            this.emergencyIndicators.push(ring);
            this.group.add(ring);
        }
        
        // Create warning spheres at corners
        const cornerPositions = [
            [25, 10, 25],
            [-25, 10, 25],
            [25, 10, -25],
            [-25, 10, -25]
        ];
        
        cornerPositions.forEach((position, index) => {
            const sphereGeometry = new THREE.SphereGeometry(3, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({
                color: this.getEmergencyColor(),
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                wireframe: true
            });
            
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            sphere.position.set(...position);
            
            this.emergencyIndicators.push(sphere);
            this.group.add(sphere);
        });
    },
    
    updateEmergencyIndicators: function(deltaTime) {
        const pulseRate = this.getEmergencyPulseRate();
        const pulse = Math.sin(Date.now() * 0.001 * pulseRate) * 0.5 + 0.5;
        
        // Update rings
        this.emergencyIndicators.forEach((indicator, index) => {
            if (index < 3) { // First three are rings
                indicator.rotation.y += deltaTime * (0.1 + index * 0.05);
                indicator.material.opacity = (0.2 + index * 0.1) * pulse;
            } else { // Corner spheres
                indicator.rotation.y += deltaTime * 0.2;
                indicator.rotation.x += deltaTime * 0.1;
                indicator.material.opacity = 0.5 * pulse;
                indicator.scale.setScalar(1 + pulse * 0.3);
            }
            
            // Update color based on emergency status
            indicator.material.color.set(this.getEmergencyColor());
        });
    },
    
    // ========================
    // EVENT SYSTEM INTEGRATION
    // ========================
    
    connectToEventSystem: function() {
        console.log('🔗 Connecting Pattern Archive to Event System');
        
        // Check for universe events system
        if (typeof window.UniverseEvents !== 'undefined') {
            console.log('✅ Universe Events system detected');
            
            // Listen for event changes
            setInterval(() => {
                this.updateFromEventSystem();
            }, 1000);
        } else {
            console.log('⚠️ Universe Events system not found');
        }
    },
    
    updateFromEventSystem: function() {
        if (typeof window.UniverseEvents === 'undefined') return;
        
        // Get active events
        const activeEvents = window.UniverseEvents.getActiveEvents();
        this.activeEvents = activeEvents;
        
        // Update challenge progress
        if (window.UniverseEvents.discoveryChallenges && 
            window.UniverseEvents.discoveryChallenges.patternArchiveRelay) {
            
            const challenge = window.UniverseEvents.discoveryChallenges.patternArchiveRelay;
            this.coordinationLandmarks.forEach(landmark => {
                const waypoint = challenge.waypoints.find(w => w.id === landmark.id);
                if (waypoint) {
                    landmark.completed = waypoint.completed;
                }
            });
        }
        
        // Update status display
        this.updateStatusDisplay();
    },
    
    updateEmergencyStatus: function(newStatus) {
        console.log(`🚨 Pattern Archive emergency status: ${this.emergencyStatus} → ${newStatus}`);
        this.emergencyStatus = newStatus;
        this.updateStatusDisplay();
    },
    
    // ========================
    // UPDATE LOOP
    // ========================
    
    startUpdateLoop: function() {
        const self = this;
        let lastTime = 0;
        
        function update(time) {
            const deltaTime = lastTime ? (time - lastTime) / 1000 : 0;
            lastTime = time;
            
            self.updateCoordinationCube(deltaTime);
            self.updateWaypointMarkers(deltaTime);
            self.updateEmergencyIndicators(deltaTime);
            
            requestAnimationFrame(update);
        }
        
        requestAnimationFrame(update);
    },
    
    // ========================
    // UTILITY FUNCTIONS
    // ========================
    
    getEmergencyColor: function() {
        switch(this.emergencyStatus) {
            case 'normal': return this.colors.success;
            case 'elevated': return this.colors.warning;
            case 'warning': return this.colors.danger;
            case 'critical': return this.colors.emergency;
            default: return this.colors.primary;
        }
    },
    
    getEmergencyPulseRate: function() {
        switch(this.emergencyStatus) {
            case 'normal': return 0.5;
            case 'elevated': return 1.0;
            case 'warning': return 2.0;
            case 'critical': return 3.0;
            default: return 1.0;
        }
    },
    
    // ========================
    // VISITOR INTERACTION
    // ========================
    
    onVisitorApproach: function(visitorId) {
        console.log(`👤 Visitor ${visitorId} approaching Pattern Archive`);
        
        // Register visitor with event system
        if (typeof window.UniverseEvents !== 'undefined') {
            window.UniverseEvents.registerVisitor(visitorId);
        }
        
        // Provide coordination information
        return {
            welcome: "Welcome to the Pattern Archive - Central Coordination Hub",
            status: this.emergencyStatus,
            activeEvents: this.activeEvents.map(e => e.name),
            challengeProgress: `${this.coordinationLandmarks.filter(l => l.completed).length}/${this.coordinationLandmarks.length} waypoints`
        };
    },
    
    // ========================
    // CLEANUP
    // ========================
    
    cleanup: function() {
        if (this.group && this.group.parent) {
            this.group.parent.remove(this.group);
        }
        
        console.log('🧹 Enhanced Pattern Archive cleaned up');
    }
};

// Global initialization
if (typeof window !== 'undefined') {
    window.PatternArchiveEnhanced = PatternArchiveEnhanced;
}

export { PatternArchiveEnhanced };
