/**
 * Universe System Verification Script
 * Run this in browser console after Pages deployment of latest fixes
 * Includes: API fixes, Event Witness, Narrative Connections, Web Weaver
 */

(function() {
    console.log('=== Universe System Verification ===');
    console.log('Run after fresh cache-busted load (?cb=timestamp)');
    console.log('Timestamp:', new Date().toISOString());
    console.log('');
    
    // 1. Check visitor-tracker API
    console.log('1. VISITOR-TRACKER API:');
    if (window.__visitorTracker) {
        const tracker = window.__visitorTracker;
        console.log('   ✓ Visitor tracker exists');
        
        // Check getVisitedWorlds
        if (typeof tracker.getVisitedWorlds === 'function') {
            const worlds = tracker.getVisitedWorlds();
            console.log('   ✓ getVisitedWorlds() returns:', Array.isArray(worlds) ? `Array(${worlds.length})` : typeof worlds);
        } else {
            console.log('   ✗ getVisitedWorlds is not a function:', typeof tracker.getVisitedWorlds);
        }
        
        // Check getVisitorId
        if (typeof tracker.getVisitorId === 'function') {
            const id = tracker.getVisitorId();
            console.log('   ✓ getVisitorId() returns:', typeof id === 'string' ? `"${id.substring(0, 8)}..."` : typeof id);
        } else {
            console.log('   ✗ getVisitorId is not a function:', typeof tracker.getVisitorId);
        }
    } else {
        console.log('   ✗ window.__visitorTracker not found');
    }
    
    // 2. Check challenge UI
    console.log('\n2. CHALLENGE UI:');
    if (window.__challengeUI) {
        console.log('   ✓ Challenge UI exists');
        const challenges = window.__challengeUI.challenges;
        
        // Check Web Weaver
        if (challenges.webWeaver) {
            console.log(`   ✓ Web Weaver: ${challenges.webWeaver.progress}/${challenges.webWeaver.total}`);
        }
        
        // Check Event Witness
        if (challenges.eventWitness) {
            console.log(`   ✓ Event Witness: ${challenges.eventWitness.progress}/${challenges.eventWitness.total}`);
        }
    } else {
        console.log('   ✗ window.__challengeUI not found');
    }
    
    // 3. Check narrative connections
    console.log('\n3. NARRATIVE CONNECTIONS:');
    if (window.__narrativeConnections) {
        console.log('   ✓ Narrative connections system exists');
        
        // Check arcs
        if (window.__narrativeConnections.arcs) {
            const arcs = window.__narrativeConnections.arcs;
            console.log(`   ✓ ${arcs.length} story arcs defined`);
            arcs.forEach(arc => {
                console.log(`     - ${arc.name}: ${arc.steps.filter(s => s.completed).length}/${arc.steps.length} completed`);
            });
        }
        
        // Check session storage
        const sessionProgress = sessionStorage.getItem('universeNarrativeProgress_v1');
        if (sessionProgress) {
            console.log('   ✓ Narrative progress stored in sessionStorage');
        }
    } else {
        console.log('   ✗ window.__narrativeConnections not found');
    }
    
    // 4. Check cosmic sights systems
    console.log('\n4. COSMIC SIGHTS SYSTEMS:');
    
    // Check tracker
    if (window.__cosmicSightTracker) {
        console.log('   ✓ Cosmic sight tracker exists');
        if (typeof window.__cosmicSightTracker.count === 'function') {
            const count = window.__cosmicSightTracker.count();
            console.log(`   ✓ Discovered: ${count} sights`);
        }
    }
    
    // Check total count consistency
    const hudCount = document.querySelector('.cosmic-census')?.textContent;
    const sidebarCount = document.querySelector('.achievements-panel')?.textContent?.match(/Cosmic Sights discovered:\s*(\d+)\/(\d+)/);
    
    console.log('   HUD count:', hudCount || 'Not found');
    if (sidebarCount) {
        console.log(`   Sidebar: ${sidebarCount[1]}/${sidebarCount[2]}`);
    }
    
    // 5. Check event system
    console.log('\n5. EVENT SYSTEM:');
    if (window.UniverseEvents && typeof window.UniverseEvents.triggerEvent === 'function') {
        console.log('   ✓ UniverseEvents.triggerEvent available');
        
        // Test event (optional - will trigger visuals)
        console.log('   To test Event Witness, run:');
        console.log('   window.UniverseEvents.triggerEvent(\'aurora\')');
    } else {
        console.log('   ✗ UniverseEvents not found');
    }
    
    // 6. Check teleport functionality (depends on visitor tracker)
    console.log('\n6. TELEPORT FUNCTIONALITY:');
    console.log('   Test by opening Directory (Tab) and clicking Visit button');
    console.log('   Should not throw: "visitorTracker.getVisitedWorlds is not a function"');
    
    // 7. Web Weaver session persistence
    console.log('\n7. WEB WEAVER SESSION PERSISTENCE:');
    const sessionVisits = sessionStorage.getItem('universeSessionVisits');
    if (sessionVisits) {
        const visits = JSON.parse(sessionVisits);
        console.log(`   ✓ Session visits stored: ${visits.length} worlds`);
    } else {
        console.log('   No session visits yet');
    }
    
    console.log('\n=== TESTING COMPLETE ===');
    console.log('\nRecommended next steps:');
    console.log('1. Test Event Witness: window.UniverseEvents.triggerEvent(\'aurora\')');
    console.log('2. Test teleport via Directory');
    console.log('3. Visit worlds to trigger narrative arcs');
    console.log('4. Test Web Weaver by visiting multiple worlds');
})();
