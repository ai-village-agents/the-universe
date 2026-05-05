# Narrative Arcs Testing Guide

## Overview
The narrative connections system creates 4 story arcs that guide visitors through connected worlds. Each arc consists of 2-4 worlds that should be visited in sequence.

## The Four Arcs

### 1. Timekeeper's Circuit (Orange)
- **Worlds**: Luminous Index → Pattern Archive → Automation Observatory
- **Theme**: Temporal patterns and recursive systems
- **Color**: #ff9900

### 2. Wisdom Keeper (Green)
- **Worlds**: The Drift → Edge Garden → Persistence Garden  
- **Theme**: Knowledge preservation and growth
- **Color**: #00cc66

### 3. Observatory Enlightenment (Blue)
- **Worlds**: Canonical Observatory → Provenance Lab → Proof Constellation → Signal Cartographer
- **Theme**: Evidence, proof, and signal processing
- **Color**: #3399ff

### 4. Frontier Explorer (Pink)
- **Worlds**: The Anchorage → Kimi K2.6 Strata → Hostile Environment World
- **Theme**: Exploration and adaptation to extreme environments
- **Color**: #ff66cc

## What to Test

### 1. Tooltip Display
- Visit any world in an arc
- Look for colored tooltip at bottom-center of screen
- Should show: "[Arc Name] progress: 1/3"

### 2. Constellation Pulses
- Visit a world in an arc
- Watch for colored pulses along constellation lines (8-15 second intervals)
- Pulse color should match arc color

### 3. Progression Tracking
- Visit worlds in arc sequence
- Tooltip should update: "1/3" → "2/3" → "3/3"
- Session should persist across page reloads

### 4. Arc Completion
- After visiting all worlds in an arc
- Should see completion message
- Check console for `narrativeArcCompleted` event

## Testing Script
Run in browser console after visiting worlds:

```javascript
// Check narrative system
if (window.__narrativeConnections) {
  const narrative = window.__narrativeConnections;
  console.log('Narrative arcs:');
  narrative.arcs.forEach(arc => {
    const completed = arc.steps.filter(s => s.completed).length;
    console.log(`- ${arc.name}: ${completed}/${arc.steps.length}`);
  });
  
  // Check session storage
  const progress = sessionStorage.getItem('universeNarrativeProgress_v1');
  console.log('Session progress:', progress ? JSON.parse(progress) : 'None');
}
```

## Common Issues
1. **No tooltip**: Make sure you're at world coordinates (not just teleported nearby)
2. **No pulses**: Might take 8-15 seconds between pulses
3. **Progress reset**: SessionStorage should persist across reloads
4. **Wrong sequence**: Arcs don't require exact order, but sequential visits give best experience

## Reporting Issues
Include in report:
1. Arc name and step that failed
2. Tooltip text (if any)
3. Console errors
4. SessionStorage content
5. Browser and cache status
