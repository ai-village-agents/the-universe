/**
 * achievements-debug.js - Diagnostic tool for achievements panel
 * Copy and paste into browser console when achievements panel doesn't work
 */
(function() {
    'use strict';
    
    console.log('🔍 Achievements Debug Tool v1.0');
    console.log('==============================');
    
    // Check panel element
    const panel = document.getElementById('achievements-panel');
    console.log('1. Panel element:', panel ? 'FOUND' : 'NOT FOUND', panel);
    
    if (panel) {
        const style = window.getComputedStyle(panel);
        console.log('   - display:', style.display);
        console.log('   - visibility:', style.visibility);
        console.log('   - opacity:', style.opacity);
        console.log('   - z-index:', style.zIndex);
        console.log('   - position:', style.position);
        console.log('   - left:', style.left);
        console.log('   - bottom:', style.bottom);
    }
    
    // Check visitorTracker object
    console.log('2. visitorTracker object:', typeof visitorTracker !== 'undefined' ? 'EXISTS' : 'UNDEFINED');
    if (typeof visitorTracker !== 'undefined') {
        console.log('   - openPanel:', typeof visitorTracker.openPanel);
        console.log('   - closePanel:', typeof visitorTracker.closePanel);
        console.log('   - getVisitorId:', typeof visitorTracker.getVisitorId);
        console.log('   - getVisitedWorlds:', typeof visitorTracker.getVisitedWorlds);
        console.log('   - count:', typeof visitorTracker.count);
    }
    
    // Check window globals
    console.log('3. Window globals:');
    console.log('   - window.__visitorTracker:', typeof window.__visitorTracker);
    console.log('   - window.__cosmicSightTracker:', typeof window.__cosmicSightTracker);
    console.log('   - window.__photoGallery:', typeof window.__photoGallery);
    
    // Check key event listeners
    console.log('4. Key event analysis:');
    console.log('   - "U" key should toggle achievements panel');
    console.log('   - Check main.js line ~1343 for KeyU handler');
    
    // Test functions
    window.debugAchievements = {
        show: function() {
            if (panel) {
                panel.style.display = 'block';
                console.log('✅ Panel set to display: block');
            } else {
                console.log('❌ Panel not found');
            }
        },
        hide: function() {
            if (panel) {
                panel.style.display = 'none';
                console.log('✅ Panel set to display: none');
            } else {
                console.log('❌ Panel not found');
            }
        },
        toggle: function() {
            if (panel) {
                const current = panel.style.display;
                panel.style.display = current === 'block' ? 'none' : 'block';
                console.log(`✅ Panel toggled: ${current} → ${panel.style.display}`);
            } else {
                console.log('❌ Panel not found');
            }
        },
        testKey: function() {
            console.log('Simulating "U" key press...');
            const event = new KeyboardEvent('keydown', {
                code: 'KeyU',
                key: 'u',
                keyCode: 85,
                which: 85,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
            console.log('Event dispatched. Check if panel toggled.');
        },
        inspect: function() {
            console.log('=== Achievements Panel Inspection ===');
            console.log('Panel:', panel);
            if (panel) {
                console.log('Inner HTML (first 500 chars):', panel.innerHTML.substring(0, 500));
            }
            console.log('visitorTracker:', visitorTracker);
            console.log('=== End Inspection ===');
        }
    };
    
    console.log('5. Test functions available:');
    console.log('   - debugAchievements.show()');
    console.log('   - debugAchievements.hide()');
    console.log('   - debugAchievements.toggle()');
    console.log('   - debugAchievements.testKey()');
    console.log('   - debugAchievements.inspect()');
    console.log('');
    console.log('📝 Usage: Call debugAchievements.toggle() to test panel visibility.');
    console.log('📝 If panel works with toggle() but not "U" key, check key handler.');
})();
