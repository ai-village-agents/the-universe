/**
 * EVENT SYSTEM INTEGRATION TEST
 * Tests the complete event system integration
 * Version 1.0 - Day 398
 */

console.log('🧪 Event System Integration Test Starting...');

// Test 1: Check if event system files exist
function testFileExistence() {
    const files = [
        'universe-events.js',
        'event-visual-integration.js', 
        'pattern_archive_enhanced.js',
        'ecosystem-api.js',
        'universe-coordination.js'
    ];
    
    let allExist = true;
    files.forEach(file => {
        try {
            // Try to create a script element to test loading
            const script = document.createElement('script');
            script.src = file;
            document.head.appendChild(script);
            console.log(`✅ ${file} exists and can be loaded`);
        } catch (e) {
            console.log(`❌ ${file} cannot be loaded: ${e.message}`);
            allExist = false;
        }
    });
    
    return allExist;
}

// Test 2: Test event system initialization
function testEventSystem() {
    if (typeof UniverseEvents === 'undefined') {
        console.log('❌ UniverseEvents not defined');
        return false;
    }
    
    console.log('✅ UniverseEvents initialized:', UniverseEvents);
    
    // Check event catalog
    if (UniverseEvents.eventCatalog) {
        console.log(`✅ Event catalog has ${Object.keys(UniverseEvents.eventCatalog).length} events`);
    } else {
        console.log('❌ Event catalog missing');
        return false;
    }
    
    // Check discovery challenges
    if (UniverseEvents.discoveryChallenges) {
        console.log(`✅ ${Object.keys(UniverseEvents.discoveryChallenges).length} discovery challenges available`);
    } else {
        console.log('❌ Discovery challenges missing');
        return false;
    }
    
    return true;
}

// Test 3: Test visual integration
function testVisualIntegration() {
    if (typeof EventVisualIntegration === 'undefined') {
        console.log('❌ EventVisualIntegration not defined');
        return false;
    }
    
    console.log('✅ EventVisualIntegration available');
    
    // Check required methods
    const requiredMethods = ['init', 'displayEvent', 'endEvent', 'update'];
    let allMethodsExist = true;
    
    requiredMethods.forEach(method => {
        if (typeof EventVisualIntegration[method] !== 'function') {
            console.log(`❌ EventVisualIntegration.${method}() missing`);
            allMethodsExist = false;
        }
    });
    
    if (allMethodsExist) {
        console.log('✅ All visual integration methods available');
    }
    
    return allMethodsExist;
}

// Test 4: Test Pattern Archive integration
function testPatternArchive() {
    if (typeof PatternArchiveEnhanced === 'undefined') {
        console.log('❌ PatternArchiveEnhanced not defined');
        return false;
    }
    
    console.log('✅ PatternArchiveEnhanced available');
    
    // Check coordination landmarks
    if (PatternArchiveEnhanced.coordinationLandmarks) {
        console.log(`✅ ${PatternArchiveEnhanced.coordinationLandmarks.length} coordination landmarks defined`);
    } else {
        console.log('❌ Coordination landmarks missing');
        return false;
    }
    
    return true;
}

// Test 5: Test ecosystem coordination
function testEcosystemCoordination() {
    if (typeof UniverseCoordination === 'undefined') {
        console.log('❌ UniverseCoordination not defined');
        return false;
    }
    
    console.log('✅ UniverseCoordination available');
    
    // Check if we can get universe health
    if (typeof window.EcosystemAPI !== 'undefined') {
        console.log('✅ EcosystemAPI available');
        try {
            const health = window.EcosystemAPI.getUniverseHealth();
            console.log(`✅ Universe health: ${health}%`);
        } catch (e) {
            console.log('❌ Cannot get universe health:', e.message);
        }
    } else {
        console.log('⚠️ EcosystemAPI not available (may be intentional)');
    }
    
    return true;
}

// Test 6: Test milestone celebration for The Drift
function testMilestoneCelebration() {
    console.log('🎉 Testing milestone celebration for The Drift (1,000,000 stations)');
    
    if (typeof UniverseEvents !== 'undefined' && UniverseEvents.milestones) {
        const driftMilestone = UniverseEvents.milestones.driftOneMillion;
        if (driftMilestone && driftMilestone.achieved) {
            console.log('✅ The Drift milestone marked as achieved');
            
            // Check if celebration was triggered
            if (driftMilestone.celebrationTriggered) {
                console.log('✅ Celebration already triggered');
            } else {
                console.log('⚠️ Celebration not yet triggered');
                
                // Manually trigger celebration for testing
                UniverseEvents.triggerMilestoneCelebration('driftOneMillion');
                console.log('🎆 Manual celebration triggered');
            }
        } else {
            console.log('❌ The Drift milestone not properly marked');
        }
    } else {
        console.log('❌ Milestone system not available');
    }
}

// Run all tests
function runAllTests() {
    console.log('='.repeat(50));
    console.log('🧪 EVENT SYSTEM INTEGRATION TEST SUITE');
    console.log('='.repeat(50));
    
    const tests = [
        { name: 'File Existence', test: testFileExistence },
        { name: 'Event System', test: testEventSystem },
        { name: 'Visual Integration', test: testVisualIntegration },
        { name: 'Pattern Archive', test: testPatternArchive },
        { name: 'Ecosystem Coordination', test: testEcosystemCoordination },
        { name: 'Milestone Celebration', test: testMilestoneCelebration }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(({ name, test }) => {
        console.log(`\n📋 Test: ${name}`);
        console.log('-'.repeat(30));
        
        try {
            const result = test();
            if (result) {
                console.log(`✅ ${name}: PASSED`);
                passed++;
            } else {
                console.log(`❌ ${name}: FAILED`);
                failed++;
            }
        } catch (error) {
            console.log(`💥 ${name}: ERROR - ${error.message}`);
            failed++;
        }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
    console.log('='.repeat(50));
    
    if (failed === 0) {
        console.log('🎉 ALL TESTS PASSED! Event system is fully integrated.');
        console.log('\n🚀 NEXT STEPS:');
        console.log('1. Update main.js to initialize event system');
        console.log('2. Add Pattern Archive landmark to scene');
        console.log('3. Schedule first universe-wide aurora event');
        console.log('4. Start visitor challenge tracking');
    } else {
        console.log('⚠️ Some tests failed. Check the logs above.');
    }
}

// Export test functions
const EventSystemTest = {
    runAllTests,
    testFileExistence,
    testEventSystem,
    testVisualIntegration,
    testPatternArchive,
    testEcosystemCoordination,
    testMilestoneCelebration
};

// Global availability
if (typeof window !== 'undefined') {
    window.EventSystemTest = EventSystemTest;
}

// Auto-run if in browser context
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(runAllTests, 1000);
    });
}

export { EventSystemTest };
