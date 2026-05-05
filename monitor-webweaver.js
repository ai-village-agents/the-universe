// Web Weaver Challenge Monitoring Tool
// Use in browser console on Universe Hub

console.log("%c=== WEB WEAVER CHALLENGE MONITOR ====", "font-size: 16px; font-weight: bold; color: #ff66cc;");

function checkWebWeaverStatus() {
    try {
        // Check if achievements panel exists
        const achievementsPanel = document.getElementById('achievements-panel');
        if (!achievementsPanel) {
            console.log("❌ Achievements panel not found. Press U key to open it.");
            return;
        }
        
        // Check sessionStorage for visits
        const sessionVisits = JSON.parse(sessionStorage.getItem('universeSessionVisits') || '[]');
        const visitCount = new Set(sessionVisits).size;
        
        console.log(`📊 Session visits: ${visitCount}/15 worlds`);
        console.log(`📝 Visit IDs: ${sessionVisits.join(', ') || '(none)'}`);
        
        // Check localStorage for persistent visits
        const persistentVisits = JSON.parse(localStorage.getItem('aiv_universe_visited_v1') || '[]');
        console.log(`💾 Persistent visits: ${persistentVisits.length} worlds`);
        
        // Check if challenge UI is loaded
        if (window.__challengeUI) {
            const challenge = window.__challengeUI.challenges?.webWeaver;
            if (challenge) {
                console.log(`🎯 Web Weaver progress: ${challenge.progress}/${challenge.total}`);
                if (challenge.progress === 15) {
                    console.log("%c🎉 WEB WEAVER COMPLETED! 🎉", "font-size: 18px; font-weight: bold; color: #00ff00; background: #000; padding: 5px;");
                }
            }
        }
        
        return {
            sessionVisits,
            visitCount,
            sessionVisitsRaw: sessionVisits
        };
    } catch (error) {
        console.error("Error checking Web Weaver status:", error);
        return null;
    }
}

function testWorldVisit(worldId) {
    // Simulate a world visit (for testing)
    console.log(`Testing visit to: ${worldId}`);
    const tracker = window.visitorTracker;
    if (tracker && tracker.recordVisit) {
        tracker.recordVisit(worldId);
        console.log("Visit recorded via visitorTracker");
    } else {
        console.log("⚠️ visitorTracker.recordVisit not found");
    }
    
    // Check directory click handler
    const directoryLinks = document.querySelectorAll('.world-directory a[href*="Enter ↗"]');
    console.log(`Found ${directoryLinks.length} directory Enter links`);
    
    return checkWebWeaverStatus();
}

console.log("Available functions:");
console.log("• checkWebWeaverStatus() - Check current progress");
console.log("• testWorldVisit('world-id') - Test visit recording");
console.log("");
console.log("Working world IDs (from config.js):");
console.log("• provenance-lab");
console.log("• strata");  
console.log("• liminal-archive");
console.log("• edge-garden");
console.log("• canvas-of-truth");
console.log("• the-anchorage");
console.log("• persistence-garden");
console.log("• the-drift");
console.log("• luminous-index");
console.log("• pattern-archive");
console.log("• signal-cartographer");
console.log("• proof-constellation");
console.log("• automation-observatory");
console.log("• canonical-observatory");
console.log("• hostile-environment-world");
console.log("");
console.log("Run checkWebWeaverStatus() to see current progress...");

// Export to window
window.monitorWebWeaver = {
    check: checkWebWeaverStatus,
    test: testWorldVisit
};
