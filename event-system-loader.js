/**
 * EVENT SYSTEM LOADER
 * Simple integration for the universe event system
 * Version 1.0 - Day 398
 */

console.log('🚀 Loading Universe Event System...');

// Track initialization state
let eventSystemsLoaded = false;
let eventSystemsInitialized = false;

// Load required scripts
function loadEventSystemScripts() {
    const scripts = [
        'universe-events.js',
        'event-visual-integration.js',
        'pattern_archive_enhanced.js'
    ];
    
    let loadedCount = 0;
    const totalScripts = scripts.length;
    
    scripts.forEach(script => {
        const scriptElement = document.createElement('script');
        scriptElement.src = script;
        scriptElement.onload = () => {
            loadedCount++;
            console.log(`✅ Loaded: ${script}`);
            
            if (loadedCount === totalScripts) {
                eventSystemsLoaded = true;
                console.log('🎉 All event system scripts loaded');
                initializeEventSystems();
            }
        };
        scriptElement.onerror = () => {
            console.error(`❌ Failed to load: ${script}`);
        };
        document.head.appendChild(scriptElement);
    });
}

// Initialize event systems
function initializeEventSystems() {
    if (!eventSystemsLoaded) {
        console.log('⚠️ Event systems not fully loaded yet');
        return;
    }
    
    console.log('🌌 Initializing Universe Event Systems...');
    
    // Initialize Core Event System
    if (typeof UniverseEvents !== 'undefined') {
        try {
            UniverseEvents.init();
            console.log('✅ Universe Events system initialized');
            
            // Trigger celebration for The Drift milestone
            setTimeout(() => {
                if (UniverseEvents.milestones && UniverseEvents.milestones.driftOneMillion) {
                    const milestone = UniverseEvents.milestones.driftOneMillion;
                    if (milestone.achieved && !milestone.celebrationTriggered) {
                        console.log('🎉 Triggering celebration for The Drift 1,000,000 stations!');
                        UniverseEvents.triggerMilestoneCelebration('driftOneMillion');
                    }
                }
            }, 2000);
        } catch (error) {
            console.error('❌ Failed to initialize UniverseEvents:', error);
        }
    } else {
        console.log('⚠️ UniverseEvents not available');
    }
    
    // Initialize Visual Integration
    if (typeof EventVisualIntegration !== 'undefined') {
        try {
            // We need scene and camera from main.js
            // This will be called from main.js after scene setup
            console.log('✅ EventVisualIntegration available (will be initialized from main.js)');
        } catch (error) {
            console.error('❌ EventVisualIntegration error:', error);
        }
    } else {
        console.log('⚠️ EventVisualIntegration not available');
    }
    
    // Initialize Enhanced Pattern Archive
    if (typeof PatternArchiveEnhanced !== 'undefined') {
        try {
            // This will be called from main.js after scene setup
            console.log('✅ PatternArchiveEnhanced available (will be initialized from main.js)');
        } catch (error) {
            console.error('❌ PatternArchiveEnhanced error:', error);
        }
    } else {
        console.log('⚠️ PatternArchiveEnhanced not available');
    }
    
    eventSystemsInitialized = true;
    console.log('🚀 Event systems initialization complete');
}

// Function to initialize visual integration (called from main.js)
function initEventVisualIntegration(scene, camera) {
    if (typeof EventVisualIntegration !== 'undefined') {
        try {
            EventVisualIntegration.init(scene, camera);
            console.log('✅ Event Visual Integration initialized with scene');
            return EventVisualIntegration;
        } catch (error) {
            console.error('❌ Failed to initialize EventVisualIntegration:', error);
        }
    }
    return null;
}

// Function to initialize pattern archive (called from main.js)
function initPatternArchiveEnhanced(scene) {
    if (typeof PatternArchiveEnhanced !== 'undefined') {
        try {
            PatternArchiveEnhanced.init(scene);
            console.log('✅ Enhanced Pattern Archive initialized');
            return PatternArchiveEnhanced;
        } catch (error) {
            console.error('❌ Failed to initialize PatternArchiveEnhanced:', error);
        }
    }
    return null;
}

// Function to update event visual effects (called from main.js animation loop)
function updateEventVisualEffects(deltaTime) {
    if (typeof EventVisualIntegration !== 'undefined' && 
        typeof EventVisualIntegration.update === 'function') {
        EventVisualIntegration.update(deltaTime);
    }
}

// Function to get event system status
function getEventSystemStatus() {
    return {
        loaded: eventSystemsLoaded,
        initialized: eventSystemsInitialized,
        universeEvents: typeof UniverseEvents !== 'undefined',
        visualIntegration: typeof EventVisualIntegration !== 'undefined',
        patternArchive: typeof PatternArchiveEnhanced !== 'undefined',
        activeEvents: eventSystemsInitialized && UniverseEvents ? 
            UniverseEvents.getActiveEvents().map(e => e.name) : []
    };
}

// Export functions
window.EventSystemLoader = {
    loadEventSystemScripts,
    initializeEventSystems,
    initEventVisualIntegration,
    initPatternArchiveEnhanced,
    updateEventVisualEffects,
    getEventSystemStatus
};

// Auto-load on page load
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            loadEventSystemScripts();
        }, 1000);
    });
}

console.log('🎯 Event System Loader ready');
