// Standalone, non-THREE.js metrics API for Node.js testing

const mockWorlds = [
    { id: 'gemini-3-1-pro-canvas', name: 'Canvas of Truth', agent: 'Gemini 3.1 Pro', position: [0, 0, -100], color: '#00ffff' },
    { id: 'edge-garden', name: 'Edge Garden', agent: 'Claude Opus 4.5', position: [80, 0, 50], color: '#88ffaa' },
    { id: 'persistence-garden', name: 'The Persistence Garden', agent: 'Claude Sonnet 4.5', position: [-70, 20, -60], color: '#ffcce6' },
    { id: 'luminous-index', name: 'The Luminous Index', agent: 'GPT-5.5', position: [-40, 30, -140], color: '#7df9ff' },
    { id: 'the-drift', name: 'The Drift', agent: 'Claude Sonnet 4.6', position: [140, 20, 40], color: '#9fd3ff' },
    { id: 'liminal-archive', name: 'The Liminal Archive', agent: 'Claude Opus 4.6', position: [-60, 10, -40], color: '#c9a96e' },
    { id: 'kimi-k2-6-strata', name: 'STRATA', agent: 'Kimi K2.6', position: [40, 0, 40], color: '#f4a261' },
    { id: 'pattern-archive', name: 'Pattern Archive', agent: 'DeepSeek-V3.2', position: [0, -15, 150], color: '#8a2be2' },
    { id: 'the-anchorage', name: 'The Anchorage', agent: 'Claude Opus 4.7', position: [-30, -5, 120], color: '#4488cc' },
    { id: 'automation-observatory', name: 'Automation Observatory', agent: 'Claude Haiku 4.5', position: [-100, 25, 80], color: '#66aaff' },
    { id: 'signal-cartographer', name: 'The Signal Cartographer', agent: 'GPT-5.4', position: [80, 0, 130], color: '#77e2ff' },
    { id: 'proof-constellation', name: 'Proof Constellation', agent: 'GPT-5.2', position: [120, -10, -120], color: '#cc88ff' },
    { id: 'canonical-observatory', name: 'Canonical Observatory', agent: 'GPT-5.1', position: [-180, 0, -180], color: '#8888ff' },
    { id: 'hostile-environment-world', name: 'Hostile Environment World', agent: 'Gemini 2.5 Pro', position: [0, -100, 0], color: '#ff3333' },
    { id: 'provenance-lab', name: 'Provenance Lab', agent: 'GPT-5', position: [40, 5, 30], color: '#aaaaee' }
];

// Mock telemetry baselines for all 15 worlds (growth, volatility, engagement)
export const mockWorldTelemetry = {
    'gemini-3-1-pro-canvas': {
        baselineArtifacts: 118000,
        hourlyGrowth: 14,
        weeklyTrend: 2600,
        volatility: 0.08,
        reliability: 0.988,
        latencyMs: 180,
        engagement: { visitorsDaily: 1800, dwellMinutes: 6.1, retention: 0.62 },
        emergencyReadiness: 0.74,
        relationships: ['proof-constellation', 'pattern-archive', 'canonical-observatory']
    },
    'edge-garden': {
        baselineArtifacts: 744000,
        hourlyGrowth: 92,
        weeklyTrend: 16500,
        volatility: 0.1,
        reliability: 0.995,
        latencyMs: 120,
        engagement: { visitorsDaily: 6200, dwellMinutes: 9.2, retention: 0.73 },
        emergencyReadiness: 0.82,
        relationships: ['persistence-garden', 'liminal-archive', 'pattern-archive', 'the-drift']
    },
    'persistence-garden': {
        baselineArtifacts: 2100,
        hourlyGrowth: 3,
        weeklyTrend: 140,
        volatility: 0.06,
        reliability: 0.989,
        latencyMs: 210,
        engagement: { visitorsDaily: 420, dwellMinutes: 7.4, retention: 0.7 },
        emergencyReadiness: 0.68,
        relationships: ['edge-garden', 'pattern-archive', 'automation-observatory']
    },
    'luminous-index': {
        baselineArtifacts: 18500,
        hourlyGrowth: 4.5,
        weeklyTrend: 610,
        volatility: 0.09,
        reliability: 0.992,
        latencyMs: 160,
        engagement: { visitorsDaily: 1500, dwellMinutes: 8.1, retention: 0.66 },
        emergencyReadiness: 0.76,
        relationships: ['signal-cartographer', 'proof-constellation', 'canonical-observatory']
    },
    'the-drift': {
        baselineArtifacts: 300000,
        hourlyGrowth: 78,
        weeklyTrend: 12500,
        volatility: 0.12,
        reliability: 0.991,
        latencyMs: 140,
        engagement: { visitorsDaily: 5400, dwellMinutes: 8.8, retention: 0.71 },
        emergencyReadiness: 0.8,
        relationships: ['edge-garden', 'signal-cartographer', 'pattern-archive']
    },
    'liminal-archive': {
        baselineArtifacts: 4504,
        hourlyGrowth: 1.8,
        weeklyTrend: 96,
        volatility: 0.05,
        reliability: 0.987,
        latencyMs: 190,
        engagement: { visitorsDaily: 860, dwellMinutes: 10.2, retention: 0.75 },
        emergencyReadiness: 0.72,
        relationships: ['edge-garden', 'pattern-archive']
    },
    'kimi-k2-6-strata': {
        baselineArtifacts: 12500,
        hourlyGrowth: 3.1,
        weeklyTrend: 430,
        volatility: 0.08,
        reliability: 0.99,
        latencyMs: 170,
        engagement: { visitorsDaily: 1320, dwellMinutes: 7.6, retention: 0.64 },
        emergencyReadiness: 0.77,
        relationships: ['the-anchorage', 'pattern-archive', 'provenance-lab']
    },
    'pattern-archive': {
        baselineArtifacts: 780,
        hourlyGrowth: 1.6,
        weeklyTrend: 48,
        volatility: 0.05,
        reliability: 0.994,
        latencyMs: 110,
        engagement: { visitorsDaily: 2400, dwellMinutes: 9.8, retention: 0.78 },
        emergencyReadiness: 0.91,
        relationships: ['edge-garden', 'automation-observatory', 'proof-constellation', 'signal-cartographer']
    },
    'the-anchorage': {
        baselineArtifacts: 280,
        hourlyGrowth: 0.42,
        weeklyTrend: 22,
        volatility: 0.07,
        reliability: 0.989,
        latencyMs: 200,
        engagement: { visitorsDaily: 510, dwellMinutes: 6.8, retention: 0.61 },
        emergencyReadiness: 0.69,
        relationships: ['kimi-k2-6-strata', 'pattern-archive']
    },
    'automation-observatory': {
        baselineArtifacts: 3000,
        hourlyGrowth: 2.8,
        weeklyTrend: 210,
        volatility: 0.09,
        reliability: 0.993,
        latencyMs: 150,
        engagement: { visitorsDaily: 980, dwellMinutes: 7.2, retention: 0.65 },
        emergencyReadiness: 0.79,
        relationships: ['pattern-archive', 'persistence-garden', 'canonical-observatory']
    },
    'signal-cartographer': {
        baselineArtifacts: 18000,
        hourlyGrowth: 5.8,
        weeklyTrend: 750,
        volatility: 0.11,
        reliability: 0.989,
        latencyMs: 175,
        engagement: { visitorsDaily: 2100, dwellMinutes: 8.4, retention: 0.69 },
        emergencyReadiness: 0.83,
        relationships: ['the-drift', 'luminous-index', 'pattern-archive']
    },
    'proof-constellation': {
        baselineArtifacts: 90000,
        hourlyGrowth: 22,
        weeklyTrend: 3800,
        volatility: 0.1,
        reliability: 0.993,
        latencyMs: 145,
        engagement: { visitorsDaily: 3400, dwellMinutes: 8.9, retention: 0.72 },
        emergencyReadiness: 0.86,
        relationships: ['luminous-index', 'pattern-archive', 'gemini-3-1-pro-canvas']
    },
    'canonical-observatory': {
        baselineArtifacts: 7500,
        hourlyGrowth: 1.9,
        weeklyTrend: 260,
        volatility: 0.07,
        reliability: 0.995,
        latencyMs: 130,
        engagement: { visitorsDaily: 1250, dwellMinutes: 7.1, retention: 0.68 },
        emergencyReadiness: 0.84,
        relationships: ['automation-observatory', 'pattern-archive', 'gemini-3-1-pro-canvas']
    },
    'hostile-environment-world': {
        baselineArtifacts: 2200,
        hourlyGrowth: 1.2,
        weeklyTrend: 120,
        volatility: 0.14,
        reliability: 0.962,
        latencyMs: 240,
        engagement: { visitorsDaily: 650, dwellMinutes: 5.4, retention: 0.53 },
        emergencyReadiness: 0.88,
        relationships: ['canonical-observatory', 'automation-observatory', 'pattern-archive']
    },
    'provenance-lab': {
        baselineArtifacts: 14000,
        hourlyGrowth: 4.7,
        weeklyTrend: 520,
        volatility: 0.1,
        reliability: 0.992,
        latencyMs: 165,
        engagement: { visitorsDaily: 1880, dwellMinutes: 7.9, retention: 0.7 },
        emergencyReadiness: 0.81,
        relationships: ['kimi-k2-6-strata', 'pattern-archive', 'proof-constellation']
    }
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const getBaseline = (worldId) =>
    mockWorldTelemetry[worldId] || {
        baselineArtifacts: 1000,
        hourlyGrowth: 1,
        weeklyTrend: 20,
        volatility: 0.08,
        reliability: 0.985,
        latencyMs: 200,
        engagement: { visitorsDaily: 400, dwellMinutes: 6, retention: 0.6 },
        emergencyReadiness: 0.7,
        relationships: []
    };

function hashFloat(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        hash = (hash << 5) - hash + input.charCodeAt(i);
        hash |= 0;
    }
    return (hash % 10000) / 10000;
}

function timeNoise(id, now = Date.now(), speed = 1) {
    const seed = hashFloat(id) * Math.PI * 2;
    const fastWave = Math.sin((now / 600000) * speed + seed) * 0.6;
    const slowWave = Math.cos((now / 3600000) * (0.4 + speed * 0.2) + seed * 1.7) * 0.4;
    return fastWave + slowWave;
}

function normalizePath(path = '') {
    if (!path.startsWith('/')) return `/api${path}`;
    if (!path.startsWith('/api')) return `/api${path}`;
    return path;
}

const euclideanDistance = (a = [0, 0, 0], b = [0, 0, 0]) => {
    const dx = (a[0] || 0) - (b[0] || 0);
    const dy = (a[1] || 0) - (b[1] || 0);
    const dz = (a[2] || 0) - (b[2] || 0);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

export function collectRealTimeMetrics(options = {}) {
    const now = options.now || Date.now();
    const worlds = options.worlds || mockWorlds;
    const hoursToday = (now % 86400000) / 3600000;
    const weekPosition = (now % 604800000) / 604800000;

    return worlds.map((world) => {
        const worldId = world.id || world.name || 'world';
        const base = getBaseline(worldId);
        const noise = timeNoise(worldId, now, 1 + base.volatility);
        const artifactDrift = base.hourlyGrowth * hoursToday + base.weeklyTrend * weekPosition;
        const artifactNoise = noise * base.volatility * base.baselineArtifacts * 0.0025;
        const artifacts = Math.max(
            base.baselineArtifacts * 0.9,
            Math.round(base.baselineArtifacts + artifactDrift + artifactNoise)
        );
        const growthVelocity = base.hourlyGrowth * (1 + noise * base.volatility);
        const momentum = base.weeklyTrend * (0.9 + 0.2 * Math.sin(weekPosition * Math.PI * 2 + noise));
        const engagementSwing = 1 + (noise * base.volatility) / 3;

        return {
            worldId,
            name: world.name,
            agent: world.agent,
            color: world.color,
            updatedAt: new Date(now).toISOString(),
            artifacts,
            growthVelocityPerHour: Number(growthVelocity.toFixed(2)),
            momentum: Number(momentum.toFixed(2)),
            reliability: Number((base.reliability + noise * 0.002).toFixed(3)),
            latencyMs: Math.max(60, Math.round(base.latencyMs * (1 + noise * 0.05))),
            volatility: base.volatility,
            relationships: base.relationships || [],
            engagement: {
                dailyVisitors: Math.max(50, Math.round(base.engagement.visitorsDaily * engagementSwing)),
                dwellMinutes: Number((base.engagement.dwellMinutes * engagementSwing).toFixed(1)),
                retention: clamp(base.engagement.retention + noise * 0.01, 0, 1)
            },
            emergencyReadiness: clamp(base.emergencyReadiness + noise * 0.02, 0, 1)
        };
    });
}

export function calculateUniverseHealth(metrics = collectRealTimeMetrics()) {
    const availability = metrics.reduce((sum, m) => sum + m.reliability, 0) / metrics.length;
    const velocity = metrics.reduce((sum, m) => sum + m.growthVelocityPerHour, 0) / metrics.length;
    const momentum = metrics.reduce((sum, m) => sum + m.momentum, 0) / metrics.length;
    const engagementScore = metrics.reduce(
        (sum, m) => sum + (m.engagement.retention * 0.6 + Math.min(m.engagement.dwellMinutes / 10, 1) * 0.4),
        0
    ) / metrics.length;

    const normalizedVelocity = clamp(velocity / 50, 0, 1);
    const normalizedMomentum = clamp(momentum / 8000, 0, 1);
    const score = clamp(availability * 0.35 + normalizedVelocity * 0.35 + engagementScore * 0.2 + normalizedMomentum * 0.1, 0, 1);

    return {
        score: Number(score.toFixed(3)),
        availability: Number(availability.toFixed(3)),
        normalizedVelocity: Number(normalizedVelocity.toFixed(3)),
        normalizedMomentum: Number(normalizedMomentum.toFixed(3)),
        engagement: Number(engagementScore.toFixed(3)),
        perWorld: metrics.map((m) => ({
            worldId: m.worldId,
            reliability: m.reliability,
            momentum: m.momentum,
            retention: m.engagement.retention
        })),
        updatedAt: metrics[0]?.updatedAt || new Date().toISOString()
    };
}

export function trackGrowthVelocity(options = {}) {
    const metrics = options.metrics || collectRealTimeMetrics(options);
    const velocities = metrics.map((m) => ({
        worldId: m.worldId,
        name: m.name,
        growthVelocityPerHour: m.growthVelocityPerHour,
        momentum: m.momentum
    }));
    const averageVelocity = velocities.reduce((sum, v) => sum + v.growthVelocityPerHour, 0) / velocities.length;
    const averageMomentum = velocities.reduce((sum, v) => sum + v.momentum, 0) / velocities.length;

    return {
        averageVelocity: Number(averageVelocity.toFixed(2)),
        averageMomentum: Number(averageMomentum.toFixed(2)),
        worlds: velocities,
        updatedAt: metrics[0]?.updatedAt || new Date().toISOString()
    };
}

export function analyzeCrossWorldRelationships(options = {}) {
    const worlds = options.worlds || mockWorlds;
    const metrics = options.metrics || collectRealTimeMetrics({ worlds });
    const edges = [];
    const nodes = metrics.map((m) => ({
        worldId: m.worldId,
        name: m.name,
        reliability: m.reliability,
        engagement: m.engagement,
        relationships: Array.from(new Set(m.relationships))
    }));

    for (let i = 0; i < worlds.length; i++) {
        for (let j = i + 1; j < worlds.length; j++) {
            const a = worlds[i];
            const b = worlds[j];
            const dist = euclideanDistance(a.position, b.position);
            const proximityStrength = clamp(1 - dist / 260, 0, 1);
            if (proximityStrength > 0) {
                edges.push({
                    from: a.id,
                    to: b.id,
                    strength: Number(proximityStrength.toFixed(3)),
                    type: 'proximity',
                    note: 'Spatial neighbors in the universe layout'
                });
            }
        }
    }

    metrics.forEach((m) => {
        (m.relationships || []).forEach((targetId) => {
            const strength = clamp(0.65 + timeNoise(`${m.worldId}-${targetId}`) * 0.1, 0, 1);
            edges.push({
                from: m.worldId,
                to: targetId,
                strength: Number(strength.toFixed(3)),
                type: 'affinity',
                note: 'Declared collaboration or shared protocol'
            });
        });
    });

    const adjacency = nodes.map((node) => ({
        ...node,
        adjacency: edges
            .filter((e) => e.from === node.worldId || e.to === node.worldId)
            .map((e) => ({
                peer: e.from === node.worldId ? e.to : e.from,
                strength: e.strength,
                type: e.type
            }))
    }));

    return {
        nodes: adjacency,
        edges,
        summary: {
            edgeCount: edges.length,
            averageStrength: edges.reduce((sum, e) => sum + e.strength, 0) / (edges.length || 1)
        },
        updatedAt: metrics[0]?.updatedAt || new Date().toISOString()
    };
}

export function estimateVisitorEngagement(options = {}) {
    const metrics = options.metrics || collectRealTimeMetrics(options);
    const worlds = metrics.map((m) => ({
        worldId: m.worldId,
        name: m.name,
        projectedVisitors: Math.round(m.engagement.dailyVisitors * (1 + m.volatility * 0.15)),
        dwellMinutes: m.engagement.dwellMinutes,
        retention: m.engagement.retention,
        crossWorldInterest: m.relationships.length * 0.12
    }));
    const totals = worlds.reduce(
        (acc, w) => {
            acc.dailyVisitors += w.projectedVisitors;
            acc.crossWorldInterest += w.crossWorldInterest;
            return acc;
        },
        { dailyVisitors: 0, crossWorldInterest: 0 }
    );

    return {
        totals,
        worlds,
        updatedAt: metrics[0]?.updatedAt || new Date().toISOString()
    };
}

export function getEmergencyCoordinationStatus(options = {}) {
    const metrics = options.metrics || collectRealTimeMetrics(options);
    const incidents = metrics
        .filter((m) => m.reliability < 0.975 || m.volatility > 0.12)
        .map((m) => ({
            worldId: m.worldId,
            reliability: m.reliability,
            volatility: m.volatility,
            engagement: m.engagement,
            escalation: m.reliability < 0.95 ? 'critical' : 'watch'
        }));

    const status = incidents.some((i) => i.escalation === 'critical')
        ? 'critical'
        : incidents.length > 0
            ? 'elevated'
            : 'nominal';

    return {
        status,
        commandCenter: 'Pattern Archive',
        incidents,
        readiness: metrics.map((m) => ({
            worldId: m.worldId,
            emergencyReadiness: m.emergencyReadiness
        })),
        updatedAt: metrics[0]?.updatedAt || new Date().toISOString()
    };
}

const endpointHandlers = {
    '/api/metrics': (options) => collectRealTimeMetrics(options),
    '/api/health': (options) => calculateUniverseHealth(options.metrics || collectRealTimeMetrics(options)),
    '/api/velocity': (options) => trackGrowthVelocity(options),
    '/api/relationships': (options) => analyzeCrossWorldRelationships(options),
    '/api/engagement': (options) => estimateVisitorEngagement(options),
    '/api/emergency': (options) => getEmergencyCoordinationStatus(options)
};

export function handleEcosystemRequest(pathOrRequest, options = {}) {
    const path = typeof pathOrRequest === 'string' ? pathOrRequest : pathOrRequest?.path || '/api/metrics';
    const normalized = normalizePath(path);
    const handler = endpointHandlers[normalized];

    if (!handler) {
        return {
            status: 404,
            path: normalized,
            data: { message: 'Unknown ecosystem endpoint' },
            updatedAt: new Date().toISOString()
        };
    }

    const data = handler({ ...options, request: pathOrRequest });
    return {
        status: 200,
        path: normalized,
        data,
        updatedAt: data.updatedAt || new Date().toISOString()
    };
}

export function listEcosystemEndpoints() {
    return Object.keys(endpointHandlers);
}

export default {
    collectRealTimeMetrics,
    calculateUniverseHealth,
    trackGrowthVelocity,
    analyzeCrossWorldRelationships,
    estimateVisitorEngagement,
    getEmergencyCoordinationStatus,
    handleEcosystemRequest,
    listEcosystemEndpoints,
    mockWorlds,
    mockWorldTelemetry
};
