import {
    collectRealTimeMetrics,
    calculateUniverseHealth,
    trackGrowthVelocity,
    analyzeCrossWorldRelationships,
    estimateVisitorEngagement,
    getEmergencyCoordinationStatus
} from '../ecosystem-api.js';

// Pattern Archive landmark for the shared AI Village universe.
// Adds real-time ecosystem telemetry overlays while keeping the original visual language.
export function createPatternArchiveLandmark(THREE, options = {}) {
    const world = options.world || options || {};
    const providedWorlds = options.worlds || options.allWorlds;

    const group = new THREE.Group();
    group.name = 'Pattern Archive coordination hub';

    const violet = new THREE.Color(world.color || '#8a2be2');
    const cyan = new THREE.Color('#5ee7ff');
    const blue = new THREE.Color('#356dff');
    const gold = new THREE.Color('#ffe08a');
    const healthy = new THREE.Color('#5cffaa');
    const alert = new THREE.Color('#ff5577');

    const clamp01 = (v) => Math.min(1, Math.max(0, v));
    const normalizeMetrics = (value) => {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.data)) return value.data;
        return [];
    };

    function createTextSprite(text = '') {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 2, 1);

        const draw = (lines = []) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(10, 10, 24, 0.8)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#bdeafe';
            ctx.font = '24px monospace';
            ctx.textBaseline = 'top';
            lines.forEach((line, i) => {
                ctx.fillText(line, 12, 14 + i * 26);
            });
            texture.needsUpdate = true;
        };

        draw([text]);
        sprite.userData.draw = draw;
        return sprite;
    }

    function createDataPanel(width = 10, height = 5) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
        mesh.userData.draw = (content) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(8, 12, 28, 0.85)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#4dd2ff';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            ctx.fillStyle = '#bdeafe';
            ctx.font = '26px monospace';
            ctx.textBaseline = 'top';
            content.forEach((line, i) => ctx.fillText(line, 26, 28 + i * 32));
            texture.needsUpdate = true;
        };
        return mesh;
    }

    // Core geometry retains the original centerpiece.
    const coreGeometry = new THREE.BoxGeometry(9, 9, 9);
    const coreMaterial = new THREE.MeshStandardMaterial({
        color: violet,
        emissive: violet,
        emissiveIntensity: 0.65,
        metalness: 0.15,
        roughness: 0.42,
        transparent: true,
        opacity: 0.82,
        wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.name = 'pattern-archive-coordination-cube';
    group.add(core);

    const inner = new THREE.Mesh(
        new THREE.BoxGeometry(5.6, 5.6, 5.6),
        new THREE.MeshStandardMaterial({
            color: blue,
            emissive: blue,
            emissiveIntensity: 0.35,
            transparent: true,
            opacity: 0.22,
            roughness: 0.7
        })
    );
    inner.name = 'pattern-archive-inner-status-cube';
    group.add(inner);

    const nodeGeometry = new THREE.SphereGeometry(0.72, 18, 18);
    const nodeMaterials = [cyan, violet, gold, blue].map((color) => new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.9,
        roughness: 0.3
    }));
    const nodes = [];
    const centralLines = [];
    const nodeLookup = new Map();

    const lineMaterial = new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: 0.42 });

    const initialMetrics = normalizeMetrics(collectRealTimeMetrics({ worlds: providedWorlds }));
    const metricsPool = initialMetrics.length ? initialMetrics : [{
        worldId: world.id || 'pattern-archive',
        name: world.name || 'Pattern Archive',
        reliability: 0.99,
        growthVelocityPerHour: 3,
        emergencyReadiness: 0.8
    }];
    const desiredNodes = Math.max(8, Math.min(metricsPool.length || 8, 12));

    for (let i = 0; i < desiredNodes; i++) {
        const metric = metricsPool[i % metricsPool.length] || {};
        const node = new THREE.Mesh(nodeGeometry, nodeMaterials[i % nodeMaterials.length].clone());
        node.userData.angle = (i / desiredNodes) * Math.PI * 2;
        node.userData.radius = 13 + (i % 2) * 3;
        node.userData.height = (i - desiredNodes / 2) * 1.1;
        node.userData.speed = 0.23 + i * 0.018;
        node.userData.metric = metric;
        node.userData.baseScale = 0.82;
        node.name = `pattern-data-node-${i + 1}`;

        const label = createTextSprite(metric.name || metric.worldId || 'world');
        label.position.set(0, 1.6, 0);
        node.add(label);
        nodes.push(node);
        group.add(node);

        if (metric.worldId) nodeLookup.set(metric.worldId, node);

        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]), lineMaterial.clone());
        line.name = `pattern-connection-line-${i + 1}`;
        centralLines.push(line);
        group.add(line);
    }

    const ringMaterial = new THREE.MeshBasicMaterial({ color: violet, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    const rings = [0, 1, 2].map((i) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(15 + i * 3.2, 0.06, 8, 96), ringMaterial.clone());
        ring.rotation.set(Math.PI / 2, i * Math.PI / 3, i * Math.PI / 5);
        ring.name = `pattern-protocol-ring-${i + 1}`;
        group.add(ring);
        return ring;
    });

    // Universe health halo and growth velocity pillar.
    const healthRing = new THREE.Mesh(
        new THREE.TorusGeometry(11.6, 0.35, 16, 96),
        new THREE.MeshBasicMaterial({ color: healthy, transparent: true, opacity: 0.4 })
    );
    healthRing.rotation.x = Math.PI / 2;
    group.add(healthRing);

    const velocityPillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.6, 0.6, 1, 12, 1, true),
        new THREE.MeshBasicMaterial({ color: cyan, transparent: true, opacity: 0.5, wireframe: true })
    );
    velocityPillar.position.y = 6;
    group.add(velocityPillar);

    // Holographic displays.
    const holoPanel = createDataPanel(10, 5);
    holoPanel.position.set(0, 11, 0);
    holoPanel.rotation.x = -Math.PI / 6;
    group.add(holoPanel);

    const engagementPanel = createDataPanel(8, 4);
    engagementPanel.position.set(-8, 6, 10);
    engagementPanel.rotation.y = Math.PI / 3;
    group.add(engagementPanel);

    // Emergency beacon.
    const emergencyRing = new THREE.Mesh(
        new THREE.TorusGeometry(10.2, 0.28, 12, 64),
        new THREE.MeshBasicMaterial({ color: alert, transparent: true, opacity: 0.0 })
    );
    emergencyRing.rotation.x = Math.PI / 2;
    group.add(emergencyRing);

    const beaconLight = new THREE.PointLight(alert, 0, 65);
    beaconLight.position.set(0, 4, 0);
    group.add(beaconLight);

    // Relationship overlay connections.
    const relationshipsGroup = new THREE.Group();
    group.add(relationshipsGroup);
    let relationshipConnections = [];

    const light = new THREE.PointLight(violet, 2.2, 90);
    light.position.set(0, 9, 0);
    group.add(light);

    const metricsState = {
        metrics: metricsPool,
        health: calculateUniverseHealth(metricsPool),
        velocity: trackGrowthVelocity({ metrics: metricsPool }),
        relationships: analyzeCrossWorldRelationships({ worlds: providedWorlds, metrics: metricsPool }),
        engagement: estimateVisitorEngagement({ metrics: metricsPool }),
        emergency: getEmergencyCoordinationStatus({ metrics: metricsPool })
    };

    function updateNodeVisuals(metric, node, index) {
        const reliability = clamp01(metric?.reliability || 0.98);
        const readiness = clamp01(metric?.emergencyReadiness || 0.7);
        const growth = Math.max(0.3, Math.min((metric?.growthVelocityPerHour || 1) / 60, 1.4));
        const tint = alert.clone().lerp(healthy, reliability);
        node.material.color.copy(tint);
        node.material.emissive.copy(tint);
        node.userData.baseScale = 0.7 + growth * 0.6;
        node.userData.speed = 0.18 + 0.04 * growth + index * 0.012;
        node.userData.radius = 12 + (index % 2) * 3 + readiness * 2.5;
        const label = node.children.find((c) => c.isSprite);
        const lines = [
            `${metric.name || metric.worldId || 'world'}`,
            `vel ${Number(metric.growthVelocityPerHour || 0).toFixed(1)}/h`,
            `rel ${Number(reliability * 100).toFixed(1)}%`
        ];
        if (label?.userData.draw) label.userData.draw(lines);
    }

    function applyMetricsToNodes() {
        nodeLookup.clear();
        metricsState.metrics.slice(0, nodes.length).forEach((metric, idx) => {
            updateNodeVisuals(metric, nodes[idx], idx);
            nodes[idx].userData.metric = metric;
            if (metric.worldId) nodeLookup.set(metric.worldId, nodes[idx]);
        });
    }

    function rebuildRelationshipConnections() {
        relationshipConnections.forEach((conn) => {
            relationshipsGroup.remove(conn.line);
            conn.line.geometry.dispose();
            conn.line.material.dispose();
        });
        relationshipConnections = [];

        const edges = metricsState.relationships?.edges || [];
        edges.forEach((edge) => {
            const fromNode = nodeLookup.get(edge.from);
            const toNode = nodeLookup.get(edge.to);
            if (!fromNode || !toNode) return;
            const mat = new THREE.LineBasicMaterial({
                color: cyan.clone().lerp(violet, 0.3),
                transparent: true,
                opacity: 0.12 + edge.strength * 0.32
            });
            const geo = new THREE.BufferGeometry().setFromPoints([
                fromNode.position.clone(),
                toNode.position.clone()
            ]);
            const line = new THREE.Line(geo, mat);
            line.userData.strength = edge.strength;
            relationshipsGroup.add(line);
            relationshipConnections.push({ line, fromNode, toNode });
        });
    }

    function drawHolograms() {
        const { health, velocity, emergency } = metricsState;
        const activeIncidents = emergency?.incidents?.length || 0;
        holoPanel.userData.draw([
            `UNIVERSE HEALTH ${Number(health.score * 100).toFixed(1)}%`,
            `Availability ${Number(health.availability * 100).toFixed(2)}%`,
            `Velocity ${Number(health.normalizedVelocity * 100).toFixed(1)}%`,
            `Momentum ${Number(health.normalizedMomentum * 100).toFixed(1)}% | Engagement ${Number(health.engagement * 100).toFixed(1)}%`,
            `Incidents ${activeIncidents} | Status ${emergency?.status || 'nominal'}`
        ]);

        const { engagement } = metricsState;
        const visitors = engagement?.totals?.dailyVisitors || 0;
        const interest = Number((engagement?.totals?.crossWorldInterest || 0).toFixed(1));
        const avgDwell = metricsState.metrics.length
            ? metricsState.metrics.reduce((sum, m) => sum + (m.engagement?.dwellMinutes || 0), 0) / metricsState.metrics.length
            : 0;
        engagementPanel.userData.draw([
            'LIVE DASHBOARD',
            `Visitors ${visitors.toLocaleString()} / day`,
            `Cross-world interest ${interest.toLocaleString()}x`,
            `Avg dwell ${avgDwell.toFixed(1)} min`
        ]);

        const avgVelocity = velocity?.averageVelocity || 0;
        velocityPillar.scale.y = 0.4 + Math.min(avgVelocity / 30, 2.8);
    }

    applyMetricsToNodes();
    rebuildRelationshipConnections();
    drawHolograms();

    function refreshMetrics() {
        const latestMetrics = normalizeMetrics(collectRealTimeMetrics({ worlds: providedWorlds }));
        metricsState.metrics = latestMetrics.length ? latestMetrics : metricsPool;
        metricsState.health = calculateUniverseHealth(metricsState.metrics);
        metricsState.velocity = trackGrowthVelocity({ metrics: metricsState.metrics });
        metricsState.relationships = analyzeCrossWorldRelationships({ worlds: providedWorlds, metrics: metricsState.metrics });
        metricsState.engagement = estimateVisitorEngagement({ metrics: metricsState.metrics });
        metricsState.emergency = getEmergencyCoordinationStatus({ metrics: metricsState.metrics });
        applyMetricsToNodes();
        rebuildRelationshipConnections();
        drawHolograms();
    }

    let metricsTimer = 0;

    function update(delta = 0, elapsed = 0) {
        const t = elapsed || delta;
        metricsTimer += delta;
        if (metricsTimer > 6) {
            metricsTimer = 0;
            refreshMetrics();
        }

        core.rotation.x = t * 0.17;
        core.rotation.y = t * 0.23;
        inner.rotation.y = -t * 0.16;
        const pulse = 1 + Math.sin(t * 1.7) * 0.08;
        inner.scale.setScalar(pulse);
        light.intensity = 1.7 + Math.sin(t * 1.25) * 0.55;

        nodes.forEach((node, i) => {
            const a = node.userData.angle + t * node.userData.speed;
            node.position.set(
                Math.cos(a) * node.userData.radius,
                node.userData.height + Math.sin(t * 0.9 + i) * 2.1,
                Math.sin(a) * node.userData.radius
            );
            const scalePulse = node.userData.baseScale + Math.sin(t * 1.9 + i) * 0.12;
            node.scale.setScalar(scalePulse);
            centralLines[i].geometry.setFromPoints([new THREE.Vector3(0, 0, 0), node.position.clone()]);
            centralLines[i].material.opacity = 0.28 + Math.sin(t * 1.4 + i) * 0.12;
        });

        relationshipConnections.forEach(({ line, fromNode, toNode }) => {
            line.geometry.setFromPoints([fromNode.position.clone(), toNode.position.clone()]);
            line.material.opacity = 0.1 + line.userData.strength * 0.35 + Math.sin(t * 1.3) * 0.05;
        });

        rings.forEach((ring, i) => {
            ring.rotation.z += 0.0025 * (i + 1);
            ring.material.opacity = 0.22 + Math.sin(t * 1.1 + i) * 0.06;
        });

        const healthScore = metricsState.health?.score || 0.7;
        const statusColor = alert.clone().lerp(healthy, healthScore);
        healthRing.material.color.copy(statusColor);
        healthRing.scale.setScalar(1 + healthScore * 0.35);
        healthRing.material.opacity = 0.35 + Math.sin(t * 1.5) * 0.05;

        const emergencyStatus = metricsState.emergency?.status || 'nominal';
        const isAlert = emergencyStatus !== 'nominal';
        const alertPulse = isAlert ? 0.3 + Math.abs(Math.sin(t * (metricsState.emergency?.status === 'critical' ? 4 : 2))) * 0.7 : 0.0;
        emergencyRing.material.opacity = alertPulse * 0.6;
        emergencyRing.scale.setScalar(1 + alertPulse * 0.1);
        beaconLight.intensity = alertPulse * 6;

        velocityPillar.material.opacity = 0.4 + Math.sin(t * 2.1) * 0.1;
    }

    group.userData.update = update;
    group.userData.core = core;

    return { group, core, update };
}

export default createPatternArchiveLandmark;
