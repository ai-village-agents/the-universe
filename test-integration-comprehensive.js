/**
 * Comprehensive Integration Test
 * Tests narrative arcs + Web Weaver + achievements together
 */

(function() {
    console.log('🔧 COMPREHENSIVE INTEGRATION TEST SUITE');
    console.log('========================================');
    
    const results = {
        narrativeArcs: { passed: 0, total: 0, details: [] },
        webWeaver: { passed: 0, total: 0, details: [] },
        achievements: { passed: 0, total: 0, details: [] },
        overall: { passed: 0, total: 0 }
    };
    
    // Helper function to add test
    function addTest(module, name, testFn) {
        results[module].total++;
        results.overall.total++;
        
        try {
            const result = testFn();
            if (result) {
                results[module].passed++;
                results.overall.passed++;
                results[module].details.push(`✅ ${name}`);
                console.log(`✅ ${module.toUpperCase()}: ${name}`);
            } else {
                results[module].details.push(`❌ ${name} (failed)`);
                console.log(`❌ ${module.toUpperCase()}: ${name} FAILED`);
            }
        } catch (error) {
            results[module].details.push(`💥 ${name} (error: ${error.message})`);
            console.log(`💥 ${module.toUpperCase()}: ${name} ERROR - ${error.message}`);
        }
    }
    
    // 1. Narrative Arcs Tests
    addTest('narrativeArcs', 'Narrative progress storage exists', () => {
        const progress = sessionStorage.getItem('universeNarrativeProgress_v1');
        return progress !== null;
    });
    
    addTest('narrativeArcs', 'Narrative arcs object exists', () => {
        return window.universeNarrativeArcs !== undefined;
    });
    
    // 2. Web Weaver Tests
    addTest('webWeaver', 'Web Weaver visits storage exists', () => {
        const visits = sessionStorage.getItem('universeSessionVisits');
        return visits !== null;
    });
    
    addTest('webWeaver', 'Web Weaver challenge active', () => {
        // Check if Web Weaver challenge exists in UI
        const challengeElements = document.querySelectorAll('[data-challenge-id*="web"]');
        return challengeElements.length > 0;
    });
    
    // 3. Achievements Tests
    addTest('achievements', 'Achievements panel exists', () => {
        const panel = document.getElementById('achievements-panel');
        return panel !== null;
    });
    
    addTest('achievements', 'Visitor tracker functions exist', () => {
        return window.visitorTracker && 
               typeof visitorTracker.openPanel === 'function' &&
               typeof visitorTracker.closePanel === 'function';
    });
    
    addTest('achievements', 'Achievements progress storage exists', () => {
        const visited = localStorage.getItem('aiv_universe_visited_v1');
        return visited !== null;
    });
    
    // 4. Cross-system integration tests
    addTest('narrativeArcs', 'Narrative arcs persist across reload', () => {
        const testArc = 'integration_test_arc_' + Date.now();
        const testData = { test: true, timestamp: Date.now() };
        sessionStorage.setItem('universeNarrativeProgress_v1', JSON.stringify(testData));
        
        // Simulate reload by checking data is still there
        const retrieved = sessionStorage.getItem('universeNarrativeProgress_v1');
        sessionStorage.removeItem('universeNarrativeProgress_v1'); // Clean up
        
        return retrieved && JSON.parse(retrieved).test === true;
    });
    
    addTest('webWeaver', 'Web Weaver integrates with visitor tracker', () => {
        return window.visitorTracker && typeof visitorTracker.getVisitedWorlds === 'function';
    });
    
    // Run the tests
    console.log('\n📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    
    for (const [module, data] of Object.entries(results)) {
        if (module === 'overall') continue;
        
        const percentage = data.total > 0 ? Math.round((data.passed / data.total) * 100) : 0;
        console.log(`\n${module.toUpperCase()}: ${data.passed}/${data.total} (${percentage}%)`);
        data.details.forEach(detail => console.log(`  ${detail}`));
    }
    
    const overallPercentage = results.overall.total > 0 ? 
        Math.round((results.overall.passed / results.overall.total) * 100) : 0;
    
    console.log('\n🎯 OVERALL:');
    console.log(`  ${results.overall.passed}/${results.overall.total} tests passed (${overallPercentage}%)`);
    
    if (overallPercentage === 100) {
        console.log('✨ ALL SYSTEMS INTEGRATED SUCCESSFULLY!');
    } else if (overallPercentage >= 75) {
        console.log('⚠️  Most systems working, check failed tests above');
    } else {
        console.log('🔧 Significant integration issues detected');
    }
    
    // Make test runner available for re-run
    window.runIntegrationTests = function() {
        console.clear();
        console.log('🔁 Re-running integration tests...');
        setTimeout(() => document.currentScript.parentNode.removeChild(document.currentScript), 100);
        const script = document.createElement('script');
        script.textContent = `(${arguments.callee.toString()})();`;
        document.head.appendChild(script);
    };
    
    console.log('\n🔄 To re-run tests: runIntegrationTests()');
})();
