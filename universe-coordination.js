// Standalone coordination framework without THREE.js or visual dependencies.
// Provides event scheduling, discovery challenges, achievement tracking, and
// time synchronization. Designed to work with ecosystem-api.js and to be
// runnable under Node.js tests or browser landmarks.

import { worlds as defaultWorlds } from './config.js';
import {
    collectRealTimeMetrics,
    calculateUniverseHealth,
    analyzeCrossWorldRelationships
} from './ecosystem-api.js';

const DEFAULT_DAY_LENGTH_MS = 1000 * 60 * 60 * 6; // 6-hour ambient day
const STORAGE_KEY = 'universe:coordination:visitors';

const clamp01 = (v) => Math.min(1, Math.max(0, v));

const createMemoryStorage = () => {
    const store = new Map();
    return {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key)
    };
};

const resolveStorage = (candidate) => {
    if (candidate?.getItem && candidate?.setItem) return candidate;
    if (typeof localStorage !== 'undefined') return localStorage;
    return createMemoryStorage();
};

const defaultAchievements = (hubId) => [
    {
        id: 'first-contact',
        description: 'Visit any world.',
        check: (state) => state.visited.size >= 1
    },
    {
        id: 'triple-hop',
        description: 'Visit three distinct worlds.',
        check: (state) => state.visited.size >= 3
    },
    {
        id: 'constellation-runner',
        description: 'Visit seven distinct worlds.',
        check: (state) => state.visited.size >= 7
    },
    {
        id: 'hub-docked',
        description: `Visit the hub world (${hubId}).`,
        check: (state) => state.visited.has(hubId)
    },
    {
        id: 'challenge-solver',
        description: 'Complete any discovery challenge.',
        check: (state) => state.completedChallenges.size > 0
    }
];

const ensureVisitorState = () => ({
    visited: new Set(),
    achievements: new Set(),
    completedChallenges: new Set(),
    history: []
});

export class UniverseCoordination {
    constructor(options = {}) {
        this.worlds = options.worlds || defaultWorlds || [];
        this.hubId = options.hubId || 'pattern-archive';
        this.clock = options.clock || (() => Date.now());
        this.storage = resolveStorage(options.storage);
        this.storageKey = options.storageKey || STORAGE_KEY;

        this.eventSchedule = new Map();
        this.discoveryChallenges = new Map();
        this.visitorProgress = new Map();
        this.achievementRules = options.achievementRules || defaultAchievements(this.hubId);
        this.timeSync = {
            epochAnchor: options.epochAnchor || this.clock(),
            dayLengthMs: options.dayLengthMs || DEFAULT_DAY_LENGTH_MS,
            daylightBias: options.daylightBias ?? 0.15
        };

        this.metrics = {
            collectRealTimeMetrics: options.collectRealTimeMetrics || collectRealTimeMetrics,
            calculateUniverseHealth: options.calculateUniverseHealth || calculateUniverseHealth,
            analyzeCrossWorldRelationships: options.analyzeCrossWorldRelationships || analyzeCrossWorldRelationships
        };

        if (options.autoLoad !== false) {
            this.loadVisitorState();
        }

        if (options.seedChallenges !== false) {
            this.seedDefaultChallenges();
        }
    }

    // --- Persistence -------------------------------------------------------
    loadVisitorState() {
        try {
            const raw = this.storage.getItem(this.storageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            Object.entries(parsed).forEach(([visitorId, state]) => {
                this.visitorProgress.set(visitorId, {
                    visited: new Set(state.visited || []),
                    achievements: new Set(state.achievements || []),
                    completedChallenges: new Set(state.completedChallenges || []),
                    history: state.history || []
                });
            });
        } catch {
            // Ignore malformed or unavailable storage
        }
    }

    persistVisitorState() {
        try {
            const serialized = {};
            this.visitorProgress.forEach((state, id) => {
                serialized[id] = {
                    visited: [...state.visited],
                    achievements: [...state.achievements],
                    completedChallenges: [...state.completedChallenges],
                    history: state.history
                };
            });
            this.storage.setItem(this.storageKey, JSON.stringify(serialized));
        } catch {
            // Ignore persistence failures in restricted environments
        }
    }

    // --- Event Scheduling --------------------------------------------------
    scheduleEvent(config = {}) {
        const id = config.id || `event-${this.eventSchedule.size + 1}`;
        if (this.eventSchedule.has(id)) return this.eventSchedule.get(id);
        const startMs = config.startMs ?? this.clock();
        const entry = {
            id,
            name: config.name || id,
            startMs,
            durationMs: config.durationMs || 1000 * 60 * 10,
            cadence: config.cadence || 'adhoc',
            worlds: config.worlds || this.worlds.map((w) => w.id),
            metadata: config.metadata || {},
            createdAt: this.clock()
        };
        this.eventSchedule.set(id, entry);
        return entry;
    }

    listEvents() {
        return [...this.eventSchedule.values()].sort((a, b) => a.startMs - b.startMs);
    }

    getActiveEvents(at = this.clock()) {
        return this.listEvents().filter((e) => at >= e.startMs && at <= e.startMs + e.durationMs);
    }

    cancelEvent(id) {
        return this.eventSchedule.delete(id);
    }

    getEventEnvelope(worldId, at = this.clock()) {
        const active = this.getActiveEvents(at).filter((e) => e.worlds.includes(worldId));
        return {
            worldId,
            active,
            summary: active.map((event) => ({
                id: event.id,
                name: event.name,
                progress: clamp01((at - event.startMs) / event.durationMs),
                metadata: event.metadata
            }))
        };
    }

    // --- Time Synchronization ---------------------------------------------
    computeTimeOfDay(at = this.clock()) {
        const elapsed = (at - this.timeSync.epochAnchor) % this.timeSync.dayLengthMs;
        const phase = elapsed / this.timeSync.dayLengthMs;
        const daylight = clamp01(Math.sin(phase * Math.PI * 2) * 0.5 + 0.5 + this.timeSync.daylightBias);
        return {
            phase,
            daylight,
            label: daylight > 0.66 ? 'midday' : daylight > 0.33 ? 'twilight' : 'night',
            anchor: this.timeSync.epochAnchor,
            dayLengthMs: this.timeSync.dayLengthMs
        };
    }

    getTimeSyncEnvelope(at = this.clock()) {
        const tod = this.computeTimeOfDay(at);
        return {
            at,
            phase: tod.phase,
            daylight: tod.daylight,
            label: tod.label,
            hub: this.hubId
        };
    }

    // --- Challenges & Achievements ----------------------------------------
    registerDiscoveryChallenge(challenge) {
        if (!challenge?.id) return null;
        const entry = {
            id: challenge.id,
            name: challenge.name || 'Discovery Challenge',
            description: challenge.description || '',
            waypoints: challenge.waypoints || [],
            reward: challenge.reward || 'cross-world badge',
            timeline: challenge.timeline || 'open'
        };
        this.discoveryChallenges.set(entry.id, entry);
        return entry;
    }

    seedDefaultChallenges() {
        this.registerDiscoveryChallenge({
            id: 'pattern-archive-relay',
            name: 'Pattern Archive Relay',
            description: 'Visit the hub and any two adjacent spokes.',
            waypoints: [this.hubId, 'edge-garden', 'automation-observatory']
        });
        this.registerDiscoveryChallenge({
            id: 'aurora-chaser',
            name: 'Aurora Chaser',
            description: 'Be present for any two active events across different worlds.',
            waypoints: ['luminous-index', 'the-drift']
        });
    }

    listChallenges() {
        return [...this.discoveryChallenges.values()];
    }

    recordVisit(visitorId, worldId, at = this.clock()) {
        if (!visitorId || !worldId) return null;
        const state = this.visitorProgress.get(visitorId) || ensureVisitorState();
        state.visited.add(worldId);
        state.history.push({ worldId, at });
        this.evaluateAchievements(state);
        this.checkChallengeCompletion(state);
        this.visitorProgress.set(visitorId, state);
        this.persistVisitorState();
        return this.getVisitorState(visitorId);
    }

    evaluateAchievements(state) {
        this.achievementRules.forEach((rule) => {
            if (rule.check(state)) {
                state.achievements.add(rule.id);
            }
        });
    }

    checkChallengeCompletion(state) {
        this.discoveryChallenges.forEach((challenge) => {
            const satisfied = challenge.waypoints.every((w) => state.visited.has(w));
            if (satisfied) state.completedChallenges.add(challenge.id);
        });
    }

    getVisitorState(visitorId) {
        const state = this.visitorProgress.get(visitorId);
        if (!state) return null;
        return {
            visited: [...state.visited],
            achievements: [...state.achievements],
            completedChallenges: [...state.completedChallenges],
            history: state.history
        };
    }

    // --- Ecosystem-aware snapshots ----------------------------------------
    async sampleStatus(options = {}) {
        const now = options.now || this.clock();
        const metrics = this.metrics.collectRealTimeMetrics({ worlds: this.worlds, now });
        const health = this.metrics.calculateUniverseHealth(metrics);
        const relationships = this.metrics.analyzeCrossWorldRelationships({ worlds: this.worlds, metrics });
        return {
            at: now,
            timeSync: this.getTimeSyncEnvelope(now),
            health,
            metrics,
            relationships
        };
    }
}

export function createUniverseCoordinator(options = {}) {
    const coordinator = new UniverseCoordination(options);
    if (options.seedExampleEvents) {
        const now = coordinator.clock();
        coordinator.scheduleEvent({
            id: 'universe-aurora',
            name: 'Universe-wide aurora',
            startMs: now,
            durationMs: 1000 * 60 * 15,
            cadence: 'every-40m'
        });
        coordinator.scheduleEvent({
            id: 'shooting-stars',
            name: 'Shooting star showers',
            startMs: now + 500,
            durationMs: 1000 * 60 * 8,
            cadence: 'every-25m'
        });
    }
    return coordinator;
}

export default UniverseCoordination;
