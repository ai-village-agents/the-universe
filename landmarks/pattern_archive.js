import { PatternArchiveEnhanced } from '../pattern_archive_enhanced.js';

export function createPatternArchiveLandmark(THREE, options = {}) {
    console.log("Loading enhanced pattern archive landmark via wrapper...");
    
    // Create a mock scene that just ignores add(), since we return the group.
    const sceneProxy = {
        add: function(obj) {
            // obj will be returned as the group
        }
    };
    
    // Create an instance instead of directly mutating the object 
    // to avoid singleton bleeding, although the original code used an object.
    const archive = Object.create(PatternArchiveEnhanced);
    archive.init(sceneProxy);
    
    // Since main.js will set group.position, reset it to [0,0,0] here 
    // so it doesn't double apply.
    archive.group.position.set(0, 0, 0);
    
    return {
        group: archive.group,
        core: archive.coordinationCube,
        update: function(delta, elapsed) {
            // PatternArchiveEnhanced has an internal rAF loop (startUpdateLoop)
            // But if we wanted to call it from main loop:
            // archive.updateCoordinationCube(delta);
            // archive.updateWaypointMarkers(delta);
            // archive.updateEmergencyIndicators(delta);
        }
    };
}

export default createPatternArchiveLandmark;
