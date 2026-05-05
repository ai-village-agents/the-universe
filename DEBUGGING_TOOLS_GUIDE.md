# Debugging Tools Guide for The Universe

This repository contains several debugging and testing tools to help diagnose and verify functionality.

## Available Tools

### 1. Achievements Panel Debugger (`achievements-debug.js`)
**Purpose**: Diagnose issues with the achievements panel 'U' key toggle.

**Usage**:
1. Open browser console (F12 → Console tab)
2. Copy and paste the entire contents of `achievements-debug.js`
3. The tool automatically runs and reports:
   - Panel element existence and styles
   - `visitorTracker` object verification
   - Window global inspections
   - Test functions become available

**Interactive Test Functions**:
- `debugAchievements.show()` - Show achievements panel
- `debugAchievements.hide()` - Hide achievements panel  
- `debugAchievements.toggle()` - Toggle panel visibility
- `debugAchievements.testKey()` - Simulate 'U' key press
- `debugAchievements.inspect()` - Detailed inspection report

### 2. Photo Gallery Test Suite (`test-photo-gallery.js`)
**Purpose**: Comprehensive testing of photo gallery functionality.

**Usage**:
1. Open browser console
2. Copy and paste the entire contents of `test-photo-gallery.js`
3. The tool automatically runs and reports:
   - Photo gallery module status
   - LocalStorage photo storage inspection
   - Interactive test functions become available

**Test Functions**:
- `testPhotoGallery.simulatePhoto()` - Dispatch photoCaptured event
- `testPhotoGallery.checkGalleryOpen()` - Check gallery panel visibility
- `testPhotoGallery.testGKey()` - Simulate 'G' key press
- `testPhotoGallery.testPKey()` - Simulate 'P' key press
- `testPhotoGallery.clearPhotos()` - Clear localStorage photos (with confirmation)
- `testPhotoGallery.runAll()` - Run comprehensive test sequence

### 3. Other Testing Tools

**Narrative Arcs & Web Weaver Test** (`test-narrative-webweaver.js`):
- Tests narrative arcs progression and Web Weaver persistence
- Use: `NarrativeWebWeaverTester.runAll()` and `simulateArcSequence("Timekeeper's Circuit")`

**Universe Verification** (`test-universe-verification.js`):
- General universe functionality verification
- Checks all major systems and integrations

**Verification Dashboard** (`test-verification-dashboard.html`):
- Web interface for system verification
- Requires copy-paste into console (no auto-run for safety)

## Testing Workflow

1. **Cache Management**: Always use `Ctrl+Shift+R` hard reload after deployment changes
2. **Console First**: Copy debugging tools into browser console for immediate diagnostics
3. **Event Monitoring**: Check console for CustomEvent fires (cosmicSightVisited, photoCaptured, etc.)
4. **Storage Inspection**: Use browser DevTools → Application tab to inspect localStorage

## Key Storage Locations

- `aiv_cosmic_sights_v1` - Discovered cosmic sights (Set)
- `aiv_universe_photos_v1` - Captured photos
- `aiv_universe_visited_v1` - Visited worlds (Set)
- `aiv_universe_visitor_id_v1` - Visitor ID
- `universeNarrativeProgress_v1` - Narrative arcs progress (sessionStorage)
- `universeSessionVisits` - Web Weaver progress (sessionStorage)

## Common Issues & Solutions

**Achievements panel not toggling with 'U' key**:
- Check if handler exists in `main.js` (~line 1343)
- Use `achievements-debug.js` to diagnose
- Ensure `visitorTracker.closePanel()`/`openPanel()` functions exist

**Photo gallery not working**:
- Use `test-photo-gallery.js` to test all functions
- Check if `window.__photoGallery` exists
- Verify localStorage photos storage

**Count mismatches (Atlas vs HUD)**:
- Likely duplicate cosmic sight names (fixed in latest commits)
- Both read from same localStorage but may have different counting logic

