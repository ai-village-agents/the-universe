// Challenge UI System - Day 399 Implementation
// Integrates with existing visitor-tracker.js and universe-events.js

class ChallengeUI {
    constructor() {
        this.container = null;
        this.toggleBtn = null;
        this.challenges = {
            cosmicSightseer: {
                name: 'Cosmic Sightseer',
                description: 'Discover all cosmic sights',
                total: 0, // Will be set based on cosmicSights array
                progress: 0,
                type: 'cosmic',
                color: '#7df9ff',
                completed: false
            },
            worldExplorer: {
                name: 'World Explorer',
                description: 'Visit all agent worlds',
                total: 15,
                progress: 0,
                type: 'worlds',
                color: '#aaffaa',
                completed: false
            },
            eventWitness: {
                name: 'Event Witness',
                description: 'Experience scheduled universe events',
                total: 0, // Will be set from the live universe event catalog
                progress: 0,
                type: 'events',
                color: '#ffcc66',
                completed: false
            },
            patternArchiveRelay: {
                name: 'Pattern Archive Relay',
                description: 'Complete 5-waypoint navigation',
                total: 5,
                progress: 0,
                type: 'pattern',
                color: '#cc99ff',
                completed: false
            }
        };

        this.updateInterval = null;
        this.initialized = false;
        this.worldVisitCount = 0;
        this.cosmicSightsCount = 47; // Current fallback count until live main.js bridge is available
        this.eventTypeCount = 0;
        this.capturedEvents = new Set();
        this.discoveredCosmicSights = new Set();
        this.patternWaypoints = 0;
    }

    init() {
        if (this.initialized) return;

        // Create container
        this.container = document.createElement('div');
        this.container.id = 'challenge-ui-container';
        this.container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            width: 420px;
            background: rgba(0, 20, 40, 0.85);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 170, 255, 0.4);
            border-radius: 12px;
            padding: 20px;
            color: #aaffff;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 13px;
            z-index: 1000;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            max-height: 70vh;
            overflow-y: auto;
            transition: opacity 0.3s ease;
            display: none;
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(0, 170, 255, 0.3);
            padding-bottom: 12px;
        `;

        const title = document.createElement('h3');
        title.textContent = '🌌 Universe Challenges';
        title.style.cssText = `
            margin: 0;
            color: #7df9ff;
            font-size: 16px;
            font-weight: bold;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            background: rgba(0, 30, 60, 0.8);
            border: 1px solid rgba(0, 170, 255, 0.3);
            color: #aaffff;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
        `;
        closeBtn.addEventListener('click', () => {
            this.container.style.opacity = '0';
            setTimeout(() => this.container.style.display = 'none', 300);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);
        this.container.appendChild(header);

        // Challenge grid
        const grid = document.createElement('div');
        grid.id = 'challenge-grid';
        grid.style.cssText = `
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
        `;
        this.container.appendChild(grid);

        // Ecosystem metrics
        const metrics = document.createElement('div');
        metrics.id = 'ecosystem-metrics';
        metrics.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 30, 60, 0.6);
            border-radius: 8px;
            border-left: 4px solid #7df9ff;
            font-size: 12px;
            line-height: 1.4;
        `;
        metrics.innerHTML = `
            <div style="color: #7df9ff; margin-bottom: 8px; font-weight: bold;">Ecosystem Health</div>
            <div id="health-metric">Loading metrics...</div>
            <div id="growth-metric">Sampling growth rate...</div>
            <div id="emergency-status">Emergency status: monitoring</div>
        `;
        this.container.appendChild(metrics);

        // Footer info
        const footer = document.createElement('div');
        footer.style.cssText = `
            margin-top: 15px;
            font-size: 11px;
            color: #88aacc;
            text-align: center;
            border-top: 1px solid rgba(0, 170, 255, 0.2);
            padding-top: 10px;
        `;
        footer.textContent = 'Updates every 5 seconds • Toggle with button below';
        this.container.appendChild(footer);

        // Toggle button (bottom right of screen)
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'challenge-ui-toggle';
        this.toggleBtn.textContent = '🌌 Challenges';
        this.toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 20, 40, 0.9);
            border: 1px solid rgba(0, 170, 255, 0.4);
            color: #aaffff;
            padding: 8px 16px;
            border-radius: 20px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 12px;
            cursor: pointer;
            z-index: 999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            gap: 6px;
        `;
        this.toggleBtn.addEventListener('click', () => {
            if (this.container.style.display === 'none') {
                this.container.style.display = 'block';
                setTimeout(() => this.container.style.opacity = '1', 10);
                this.updateAllChallenges();
            } else {
                this.container.style.opacity = '0';
                setTimeout(() => this.container.style.display = 'none', 300);
            }
        });

        document.body.appendChild(this.container);
        document.body.appendChild(this.toggleBtn);

        // Get cosmic sights count
        this.updateCosmicSightsCount();

        // Set up event listeners
        this.setupEventListeners();

        // Start update interval
        this.updateInterval = setInterval(() => this.updateAllChallenges(), 5000);
        this.initialized = true;

        // Initial update
        setTimeout(() => this.updateAllChallenges(), 1000);

        console.log('Challenge UI initialized');
    }

    setupEventListeners() {
        // Listen for world visits
        document.addEventListener('worldVisited', (event) => {
            this.worldVisitCount++;
            this.updateProgress();
        });

        // Listen for cosmic sight discoveries from Cosmic Sight Tracker
        document.addEventListener('cosmicSightVisited', (event) => {
            if (event.detail && event.detail.name) {
                this.discoveredCosmicSights.add(event.detail.name);
                this.updateProgress();
            }
        });

        // Listen for universe events
        document.addEventListener('universeEventTriggered', (event) => {
            if (event.detail && event.detail.eventType) {
                this.capturedEvents.add(event.detail.eventType);
                this.updateProgress();
            }
        });

        // Listen for pattern archive progress (custom event)
        document.addEventListener('patternArchiveProgress', (event) => {
            if (event.detail && event.detail.waypoints) {
                this.patternWaypoints = event.detail.waypoints;
                this.updateProgress();
            }
        });
    }

    updateCosmicSightsCount() {
        const liveCosmicCount = Number(window.__universeCosmicSightsCount);
        if (Number.isFinite(liveCosmicCount) && liveCosmicCount > 0) {
            this.cosmicSightsCount = liveCosmicCount;
            this.challenges.cosmicSightseer.total = liveCosmicCount;
        } else if (this.challenges.cosmicSightseer.total > 0) {
            this.cosmicSightsCount = this.challenges.cosmicSightseer.total;
        } else {
            this.challenges.cosmicSightseer.total = this.cosmicSightsCount;
        }

        const liveEventCount = window.UniverseEvents && window.UniverseEvents.eventCatalog
            ? Object.keys(window.UniverseEvents.eventCatalog).length
            : Number(window.__universeEventTypeCount);

        if (Number.isFinite(liveEventCount) && liveEventCount > 0) {
            this.eventTypeCount = liveEventCount;
            this.challenges.eventWitness.total = liveEventCount;
        } else if (this.challenges.eventWitness.total > 0) {
            this.eventTypeCount = this.challenges.eventWitness.total;
        }
    }

    createChallengeCard(challengeId, challengeData) {
        const card = document.createElement('div');
        card.className = 'challenge-card';
        card.style.cssText = `
            background: rgba(0, 30, 60, 0.6);
            border-radius: 8px;
            padding: 16px;
            border-left: 4px solid ${challengeData.color};
            position: relative;
            overflow: hidden;
        `;

        const percentage = Math.min(100, Math.round((challengeData.progress / challengeData.total) * 100));

        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
            height: 6px;
            background: rgba(0, 60, 120, 0.3);
            border-radius: 3px;
            margin: 12px 0 8px;
            overflow: hidden;
        `;

        const progressFill = document.createElement('div');
        progressFill.style.cssText = `
            height: 100%;
            width: ${percentage}%;
            background: linear-gradient(90deg, ${challengeData.color}, ${challengeData.color}cc);
            border-radius: 3px;
            transition: width 0.5s ease;
            position: relative;
        `;

        // Add shimmer effect for progress
        if (percentage > 0 && percentage < 100) {
            const shimmer = document.createElement('div');
            shimmer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 20px;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
                animation: shimmer 2s infinite;
            `;
            progressFill.appendChild(shimmer);
        }

        progressBar.appendChild(progressFill);

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="font-weight: bold; color: ${challengeData.color}; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                    ${challengeData.completed ? '✨' : '○'} ${challengeData.name}
                </div>
                <div style="font-size: 11px; color: #88aacc;">
                    ${challengeData.progress}/${challengeData.total}
                </div>
            </div>
            <div style="font-size: 11px; color: #aaccff; margin-bottom: 8px;">
                ${challengeData.description}
            </div>
        `;

        card.appendChild(progressBar);

        // Status indicator
        const status = document.createElement('div');
        status.style.cssText = `
            font-size: 10px;
            color: ${challengeData.completed ? '#aaffaa' : '#88aacc'};
            margin-top: 6px;
            text-align: right;
        `;
        status.textContent = challengeData.completed ? '✓ Completed' : `${percentage}% complete`;
        card.appendChild(status);

        return card;
    }

    updateProgress() {
        // Update world explorer progress
        if (typeof visitorTracker !== 'undefined' && visitorTracker.count) {
            this.challenges.worldExplorer.progress = visitorTracker.count();
            this.challenges.worldExplorer.completed = this.challenges.worldExplorer.progress >= this.challenges.worldExplorer.total;
        }

        // Update cosmic sightseer progress from the live Cosmic Sight Tracker when available.
        const liveCosmicProgress = window.__cosmicSightTracker && typeof window.__cosmicSightTracker.count === 'function'
            ? Number(window.__cosmicSightTracker.count())
            : NaN;
        const discoveredCosmicCount = Number.isFinite(liveCosmicProgress)
            ? liveCosmicProgress
            : this.discoveredCosmicSights.size;
        this.challenges.cosmicSightseer.progress = Math.min(
            this.challenges.cosmicSightseer.total,
            Math.max(0, discoveredCosmicCount)
        );

        // Update event witness progress
        this.challenges.eventWitness.progress = this.capturedEvents.size;
        this.challenges.eventWitness.completed = this.challenges.eventWitness.progress >= this.challenges.eventWitness.total;

        // Update pattern archive relay progress
        this.challenges.patternArchiveRelay.progress = this.patternWaypoints;
        this.challenges.patternArchiveRelay.completed = this.challenges.patternArchiveRelay.progress >= this.challenges.patternArchiveRelay.total;

        // Update cosmic sightseer completion
        this.challenges.cosmicSightseer.completed = this.challenges.cosmicSightseer.progress >= this.challenges.cosmicSightseer.total;
    }

    updateAllChallenges() {
        if (!this.container) return;

        // Update cosmic sights count
        this.updateCosmicSightsCount();

        // Update progress calculations
        this.updateProgress();

        // Update challenge grid
        const grid = this.container.querySelector('#challenge-grid');
        if (grid) {
            grid.innerHTML = '';

            // Add shimmer animation style if not present
            if (!document.getElementById('challenge-shimmer-style')) {
                const style = document.createElement('style');
                style.id = 'challenge-shimmer-style';
                style.textContent = `
                    @keyframes shimmer {
                        0% { transform: translateX(-100%); }
                        100% { transform: translateX(400%); }
                    }
                `;
                document.head.appendChild(style);
            }

            Object.entries(this.challenges).forEach(([id, data]) => {
                grid.appendChild(this.createChallengeCard(id, data));
            });
        }

        // Update ecosystem metrics
        this.updateEcosystemMetrics();
    }

    updateEcosystemMetrics() {
        const healthMetric = this.container.querySelector('#health-metric');
        const growthMetric = this.container.querySelector('#growth-metric');
        const emergencyStatus = this.container.querySelector('#emergency-status');

        if (!healthMetric) return;

        // Try to get real metrics
        if (typeof calculateUniverseHealth !== 'undefined') {
            try {
                const health = calculateUniverseHealth();
                healthMetric.textContent = `Health: ${health.health || '--'}%`;
                growthMetric.textContent = `Growth: ${health.growthRate || '--'}/hour`;
                emergencyStatus.textContent = `Emergency status: ${health.emergencyLevel || 'normal'}`;
                return;
            } catch (e) {
                // Fall through to sample metrics
            }
        }

        // Sample metrics based on current challenge progress
        const totalProgress = Object.values(this.challenges).reduce((sum, c) => sum + (c.progress / c.total), 0);
        const avgCompletion = totalProgress / Object.keys(this.challenges).length;

        const healthValue = Math.min(100, 60 + Math.floor(avgCompletion * 40));
        const growthValue = (12 + avgCompletion * 8).toFixed(1);
        const growthAccel = Math.floor(avgCompletion * 30);

        healthMetric.textContent = `Health: ${healthValue}%`;
        growthMetric.textContent = `Growth: +${growthValue} units/hour (+${growthAccel}%)`;

        // Determine emergency status based on progress
        let status = 'normal';
        let statusColor = '#aaffaa';

        if (avgCompletion > 0.7) {
            status = 'elevated';
            statusColor = '#ffcc66';
        } else if (avgCompletion < 0.3) {
            status = 'warning';
            statusColor = '#ff9966';
        }

        emergencyStatus.textContent = `Emergency status: ${status}`;
        emergencyStatus.style.color = statusColor;
    }

    showCelebration(challengeName) {
        const banner = document.createElement('div');
        banner.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 20px 30px;
            background: linear-gradient(135deg, rgba(40, 15, 70, 0.95), rgba(15, 30, 80, 0.95));
            border: 2px solid #7df9ff;
            border-radius: 12px;
            color: #aaffff;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 14px;
            text-align: center;
            z-index: 2000;
            box-shadow: 0 0 40px rgba(125, 249, 255, 0.4);
            cursor: pointer;
        `;

        banner.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 8px;">✨ Challenge Complete! ✨</div>
            <div style="font-size: 16px; color: #7df9ff; margin-bottom: 8px;">${challengeName}</div>
            <div style="font-size: 12px; color: #aaccff;">Click to dismiss</div>
        `;

        banner.addEventListener('click', () => banner.remove());
        document.body.appendChild(banner);

        setTimeout(() => {
            if (banner.parentNode) banner.remove();
        }, 5000);
    }

    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }

        if (this.toggleBtn && this.toggleBtn.parentNode) {
            this.toggleBtn.parentNode.removeChild(this.toggleBtn);
        }

        const style = document.getElementById('challenge-shimmer-style');
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }

        this.initialized = false;
        console.log('Challenge UI destroyed');
    }
}

// Export singleton instance
const challengeUI = new ChallengeUI();
export { challengeUI, ChallengeUI };
