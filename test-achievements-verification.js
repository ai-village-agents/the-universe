/**
 * Quick achievements panel verification test
 * Copy-paste into browser console after hard reload
 */

(function() {
    console.log('🔍 Achievements Panel Quick Verification');
    console.log('=========================================');
    
    // Check panel element
    const panel = document.getElementById('achievements-panel');
    console.log('✅ Panel element:', panel ? 'Found' : 'Missing', panel);
    
    // Check visitorTracker object
    console.log('✅ visitorTracker object:', window.visitorTracker ? 'Exists' : 'Missing');
    if (window.visitorTracker) {
        console.log('   - Methods:', Object.keys(visitorTracker).filter(k => typeof visitorTracker[k] === 'function').join(', '));
        console.log('   - openPanel:', typeof visitorTracker.openPanel);
        console.log('   - closePanel:', typeof visitorTracker.closePanel);
    }
    
    // Test 'U' key simulation
    function simulateUKey() {
        console.log('🎮 Simulating "U" key press...');
        const event = new KeyboardEvent('keydown', {
            code: 'KeyU',
            key: 'u',
            keyCode: 85,
            which: 85,
            bubbles: true
        });
        document.dispatchEvent(event);
        
        // Check panel state after a short delay
        setTimeout(() => {
            if (panel) {
                const style = window.getComputedStyle(panel);
                console.log('📊 Panel state after "U" key:');
                console.log('   - display:', style.display);
                console.log('   - visibility:', style.visibility);
                console.log('   - opacity:', style.opacity);
            }
        }, 100);
    }
    
    // Make function available globally
    window.testAchievements = { simulateUKey };
    
    console.log('\n🎯 Ready to test! Type: testAchievements.simulateUKey()');
    console.log('📋 For comprehensive testing, use achievements-debug.js from repository');
})();
