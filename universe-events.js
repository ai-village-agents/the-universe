/**
 * UNIVERSAL EVENT SYSTEM
 * Synchronized events, challenges, and milestones across the 3D universe
 * Version 1.0 - Day 398
 */

const UniverseEvents = {
    // ========================
    // EVENT CATALOG & SCHEDULE
    // ========================
    
    eventCatalog: {
        // Universe-wide Aurora - every 40 minutes
        aurora: {
            id: 'aurora',
            name: 'Universe-wide Aurora',
            frequency: 2400000, // 40 minutes in milliseconds
            duration: 900000,   // 15 minutes
            visualType: 'aurora',
            color: '#00ffaa',
            description: 'Synchronized aurora display across all worlds',
            lastTriggered: 0,
            isActive: false
        },
        
        // Shooting Star Showers - every 25 minutes
        shootingStars: {
            id: 'shootingStars',
            name: 'Shooting Star Shower',
            frequency: 1500000, // 25 minutes
            duration: 480000,   // 8 minutes
            visualType: 'shootingStars',
            color: '#aaffff',
            particleCount: 150,
            speed: 2.5,
            description: 'Cascading meteor shower across the cosmic void',
            lastTriggered: 0,
            isActive: false
        },
        
        // Constellation Highlights - hourly
        constellationHighlight: {
            id: 'constellationHighlight',
            name: 'Constellation Highlight',
            frequency: 3600000, // 1 hour
            duration: 300000,   // 5 minutes
            visualType: 'constellation',
            color: '#ffaa00',
            opacity: 0.8,
            pulseRate: 1.5,
            description: 'Enhanced visibility of universe connections',
            lastTriggered: 0,
            isActive: false
        },
        
        // Epoch Celebrations - milestone-triggered
        epochCelebration: {
            id: 'epochCelebration',
            name: 'Epoch Celebration',
            frequency: 0, // Manual trigger only
            duration: 600000, // 10 minutes
            visualType: 'celebration',
            color: '#ff00ff',
            sparkleCount: 500,
            description: 'Major milestone celebration',
            lastTriggered: 0,
            isActive: false
        },
        
        // Emergency Drills - every 2 hours
        emergencyDrill: {
            id: 'emergencyDrill',
            name: 'Emergency Coordination Drill',
            frequency: 7200000, // 2 hours
            duration: 300000,   // 5 minutes
            visualType: 'emergency',
            color: '#ff5500',
            description: 'Universe stability protocol activation',
            lastTriggered: 0,
            isActive: false
        }
    },
    
    // ========================
    // DISCOVERY CHALLENGES
    // ========================
    
    discoveryChallenges: {
        patternArchiveRelay: {
            id: 'patternArchiveRelay',
            name: 'Pattern Archive Relay',
            description: 'Navigate 5 coordination landmarks to complete the relay circuit',
            waypoints: [
                { id: 'patternArchive', name: 'Pattern Archive Core', position: [0, -15, 150], completed: false },
                { id: 'anchorage', name: 'Anchorage Beacon', position: [-30, -5, 120], completed: false },
                { id: 'signalCartographer', name: 'Signal Cartographer', position: [80, 0, 130], completed: false },
                { id: 'luminousIndex', name: 'Luminous Index', position: [-40, 30, -140], completed: false },
                { id: 'automationObservatory', name: 'Automation Observatory', position: [-100, 25, 80], completed: false }
            ],
            rewards: ['constellation-runner-badge', 'universe-navigator-title'],
            totalVisitors: 0,
            completedVisitors: 0
        },
        
        auroraChaser: {
            id: 'auroraChaser',
            name: 'Aurora Chaser',
            description: 'Witness 3 synchronized aurora events',
            requiredEvents: 3,
            witnessedEvents: 0,
            rewards: ['aurora-witness-badge', 'cosmic-spectator-title'],
            totalVisitors: 0,
            completedVisitors: 0
        },
        
        worldHoppingExpedition: {
            id: 'worldHoppingExpedition',
            name: 'World Hopping Expedition',
            description: 'Visit 10 different world landmarks',
            requiredVisits: 10,
            visitedWorlds: [],
            rewards: ['world-hopper-badge', 'universal-explorer-title'],
            totalVisitors: 0,
            completedVisitors: 0
        },
        
        emergencyResponseDrill: {
            id: 'emergencyResponseDrill',
            name: 'Emergency Response Drills',
            description: 'Participate in emergency coordination events',
            requiredDrills: 2,
            completedDrills: 0,
            rewards: ['emergency-responder-badge', 'stability-guardian-title'],
            totalVisitors: 0,
            completedVisitors: 0
        }
    },
    
    // ========================
    // EMERGENCY COORDINATION
    // ========================
    
    emergencyProtocols: {
        normal: {
            level: 'normal',
            threshold: 70,
            color: '#00ff00',
            message: 'All systems stable. Universe expanding harmoniously.',
            visualIndicators: 'subtle pulse, normal beacon rhythm'
        },
        elevated: {
            level: 'elevated',
            threshold: 40,
            color: '#ffaa00',
            message: 'High growth velocity detected. Monitoring stability.',
            visualIndicators: 'enhanced pulse, warning beacons'
        },
        warning: {
            level: 'warning',
            threshold: 20,
            color: '#ff5500',
            message: 'Stability fluctuations detected. Coordination required.',
            visualIndicators: 'rapid pulse, emergency beacons activated'
        },
        critical: {
            level: 'critical',
            threshold: 0,
            color: '#ff0000',
            message: 'Fragmentation events detected. Emergency response activated.',
            visualIndicators: 'full emergency systems, coordination center active'
        }
    },
    
    currentEmergencyLevel: 'elevated',
    
    // ========================
    // VISITOR PROGRESSION
    // ========================
    
    visitorProgress: {},
    
    // ========================
    // MILESTONE TRACKING
    // ========================
    
    milestones: {
        driftOneMillion: {
            id: 'driftOneMillion',
            name: 'The Drift: 1,000,000 Stations',
            world: 'The Drift',
            achieved: true,
            timestamp: Date.now(),
            celebrationTriggered: false
        },
        automationFourThousand: {
            id: 'automationFourThousand',
            name: 'Automation Observatory: 4,000 Pages',
            world: 'Automation Observatory',
            achieved: false,
            threshold: 4000,
            celebrationTriggered: false
        },
        persistenceTwentyFiveHundred: {
            id: 'persistenceTwentyFiveHundred',
            name: 'Persistence Garden: 2,500 Secrets',
            world: 'Persistence Garden',
            achieved: false,
            threshold: 2500,
            celebrationTriggered: false
        },
        liminalFiveThousand: {
            id: 'liminalFiveThousand',
            name: 'The Liminal Archive: 5,000 Chambers',
            world: 'The Liminal Archive',
            achieved: false,
            threshold: 5000,
            celebrationTriggered: false
        }
    },
    
    // ========================
    // INITIALIZATION
    // ========================
    
    init: function() {
        console.log('🌌 Universe Event System Initialized');
        
        // Load visitor progress from localStorage
        this.loadVisitorProgress();
        
        // Start event scheduler
        this.startEventScheduler();
        
        // Initialize milestone checks
        this.checkMilestones();
        
        // Setup emergency monitoring
        this.setupEmergencyMonitoring();
        
        return this;
    },
    
    // ========================
    // EVENT SCHEDULING
    // ========================
    
    startEventScheduler: function() {
        const now = Date.now();
        
        // Schedule recurring events
        for (const eventId in this.eventCatalog) {
            const event = this.eventCatalog[eventId];
            if (event.frequency > 0) {
                event.lastTriggered = now - (Math.random() * event.frequency);
                this.scheduleNextEvent(event);
            }
        }
        
        console.log('⏰ Event scheduler started');
    },
    
    scheduleNextEvent: function(event) {
        const nextTime = event.lastTriggered + event.frequency;
        const delay = Math.max(0, nextTime - Date.now());
        
        setTimeout(() => {
            this.triggerEvent(event.id);
        }, delay);
    },
    
    triggerEvent: function(eventId) {
        const event = this.eventCatalog[eventId];
        if (!event) return;
        
        event.lastTriggered = Date.now();
        event.isActive = true;
        
        console.log(`🚀 Triggering event: ${event.name}`);
        
        // Visual integration will handle display
        if (window.EventVisualIntegration) {
            window.EventVisualIntegration.displayEvent(event);
        }
        
        // Update visitor challenges
        this.updateChallengesForEvent(eventId);
        
        // Schedule event end
        setTimeout(() => {
            event.isActive = false;
            if (window.EventVisualIntegration) {
                window.EventVisualIntegration.endEvent(eventId);
            }
        }, event.duration);
        
        // Schedule next occurrence
        this.scheduleNextEvent(event);
    },
    
    // ========================
    // CHALLENGE MANAGEMENT
    // ========================
    
    updateChallengesForEvent: function(eventId) {
        if (eventId === 'aurora') {
            // Update Aurora Chaser challenge for all active visitors
            const challenge = this.discoveryChallenges.auroraChaser;
            for (const visitorId in this.visitorProgress) {
                if (this.visitorProgress[visitorId].auroraChaser) {
                    this.visitorProgress[visitorId].auroraChaser.witnessedEvents++;
                    
                    if (this.visitorProgress[visitorId].auroraChaser.witnessedEvents >= 3) {
                        this.completeChallengeForVisitor(visitorId, 'auroraChaser');
                    }
                }
            }
        }
    },
    
    registerVisitor: function(visitorId) {
        if (!this.visitorProgress[visitorId]) {
            this.visitorProgress[visitorId] = {
                id: visitorId,
                joinTime: Date.now(),
                challenges: {
                    patternArchiveRelay: { completedWaypoints: [], completed: false },
                    auroraChaser: { witnessedEvents: 0, completed: false },
                    worldHoppingExpedition: { visitedWorlds: [], completed: false },
                    emergencyResponseDrill: { completedDrills: 0, completed: false }
                },
                achievements: []
            };
            
            this.discoveryChallenges.patternArchiveRelay.totalVisitors++;
            this.discoveryChallenges.auroraChaser.totalVisitors++;
            this.discoveryChallenges.worldHoppingExpedition.totalVisitors++;
            this.discoveryChallenges.emergencyResponseDrill.totalVisitors++;
            
            this.saveVisitorProgress();
        }
    },
    
    completeChallengeForVisitor: function(visitorId, challengeId) {
        const visitor = this.visitorProgress[visitorId];
        const challenge = this.discoveryChallenges[challengeId];
        
        if (visitor && !visitor.challenges[challengeId].completed) {
            visitor.challenges[challengeId].completed = true;
            visitor.achievements.push(challenge.rewards[0]);
            
            challenge.completedVisitors++;
            
            // Trigger celebration for first completion
            if (challenge.completedVisitors === 1) {
                this.triggerEvent('epochCelebration');
            }
            
            this.saveVisitorProgress();
            return true;
        }
        return false;
    },
    
    // ========================
    // EMERGENCY MONITORING
    // ========================
    
    setupEmergencyMonitoring: function() {
        // Check emergency status every 30 seconds
        setInterval(() => {
            this.updateEmergencyStatus();
        }, 30000);
    },
    
    updateEmergencyStatus: function() {
        // Get current universe health from ecosystem API
        let healthScore = 63.2; // Default - would come from ecosystem-api.js
        
        if (window.EcosystemAPI && typeof window.EcosystemAPI.getUniverseHealth === 'function') {
            healthScore = window.EcosystemAPI.getUniverseHealth();
        }
        
        // Determine emergency level
        let newLevel = 'normal';
        for (const level in this.emergencyProtocols) {
            if (healthScore >= this.emergencyProtocols[level].threshold) {
                newLevel = level;
                break;
            }
        }
        
        if (newLevel !== this.currentEmergencyLevel) {
            this.currentEmergencyLevel = newLevel;
            console.log(`🚨 Emergency level changed to: ${newLevel}`);
            
            // Trigger emergency drill if level is warning or critical
            if (newLevel === 'warning' || newLevel === 'critical') {
                this.triggerEvent('emergencyDrill');
            }
            
            // Update Pattern Archive if available
            if (window.PatternArchiveEnhanced) {
                window.PatternArchiveEnhanced.updateEmergencyStatus(newLevel);
            }
        }
    },
    
    // ========================
    // MILESTONE MANAGEMENT
    // ========================
    
    checkMilestones: function() {
        // Check each milestone threshold
        for (const milestoneId in this.milestones) {
            const milestone = this.milestones[milestoneId];
            
            if (!milestone.achieved && milestone.threshold) {
                // Would check actual values from ecosystem API
                // For now, manually trigger celebration for Drift milestone
                if (milestoneId === 'driftOneMillion' && !milestone.celebrationTriggered) {
                    this.triggerMilestoneCelebration(milestoneId);
                }
            }
        }
    },
    
    triggerMilestoneCelebration: function(milestoneId) {
        const milestone = this.milestones[milestoneId];
        if (!milestone || milestone.celebrationTriggered) return;
        
        milestone.achieved = true;
        milestone.timestamp = Date.now();
        milestone.celebrationTriggered = true;
        
        console.log(`🎉 Celebrating milestone: ${milestone.name}`);
        
        // Trigger enhanced celebration
        const celebration = this.eventCatalog.epochCelebration;
        celebration.sparkleCount = 1000; // Extra sparkles for milestones
        this.triggerEvent('epochCelebration');
        
        // Reset for future celebrations
        celebration.sparkleCount = 500;
    },
    
    // ========================
    // PERSISTENCE
    // ========================
    
    loadVisitorProgress: function() {
        try {
            const saved = localStorage.getItem('universeVisitorProgress');
            if (saved) {
                this.visitorProgress = JSON.parse(saved);
            }
        } catch (e) {
            console.log('No previous visitor progress found');
        }
    },
    
    saveVisitorProgress: function() {
        try {
            localStorage.setItem('universeVisitorProgress', JSON.stringify(this.visitorProgress));
        } catch (e) {
            console.error('Failed to save visitor progress:', e);
        }
    },
    
    // ========================
    // UTILITY FUNCTIONS
    // ========================
    
    getActiveEvents: function() {
        const active = [];
        for (const eventId in this.eventCatalog) {
            if (this.eventCatalog[eventId].isActive) {
                active.push(this.eventCatalog[eventId]);
            }
        }
        return active;
    },
    
    getVisitorProgress: function(visitorId) {
        return this.visitorProgress[visitorId] || null;
    },
    
    getChallengeStatus: function(challengeId) {
        const challenge = this.discoveryChallenges[challengeId];
        if (!challenge) return null;
        
        return {
            name: challenge.name,
            description: challenge.description,
            totalVisitors: challenge.totalVisitors,
            completedVisitors: challenge.completedVisitors,
            completionRate: challenge.totalVisitors > 0 ? 
                (challenge.completedVisitors / challenge.totalVisitors * 100).toFixed(1) : 0
        };
    },
    
    getAllChallengeStatus: function() {
        const status = {};
        for (const challengeId in this.discoveryChallenges) {
            status[challengeId] = this.getChallengeStatus(challengeId);
        }
        return status;
    }
};

// Global initialization
if (typeof window !== 'undefined') {
    window.UniverseEvents = UniverseEvents.init();
}

export { UniverseEvents };
