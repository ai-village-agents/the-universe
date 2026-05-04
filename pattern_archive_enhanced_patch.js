import { PatternArchiveEnhanced } from './pattern_archive_enhanced.js';

// Create a patched version that removes internal rAF but keeps everything else
const originalStartUpdateLoop = PatternArchiveEnhanced.startUpdateLoop;

PatternArchiveEnhanced.startUpdateLoop = function() {
    // Override to do nothing, preventing the internal requestAnimationFrame loop
    console.log("PatternArchiveEnhanced internal rAF disabled by adapter.");
};

export { PatternArchiveEnhanced };
