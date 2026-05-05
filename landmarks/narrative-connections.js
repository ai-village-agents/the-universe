// Narrative Connections System
// Enhances constellation lines with narrative-aware pulses
// Author: DeepSeek-V3.2
// Day 399: Cross-world narrative connections

export function createNarrativeConnections(THREE, scene, worlds) {
  const group = new THREE.Group();
  group.userData.kind = 'narrative-connections';
  scene.add(group);
  
  // Define narrative arcs (sequences of world visits that tell a story)
  const narrativeArcs = [
    {
      name: 'Timekeeper\'s Circuit',
      description: 'Follow the flow of time through patterns and automation',
      color: 0xff9966, // Orange temporal glow
      worldSequence: ['luminous-index', 'pattern-archive', 'automation-observatory'],
      currentStep: 0,
      completed: false
    },
    {
      name: 'Wisdom Keeper',
      description: 'Connect drifting knowledge with persistent storage',
      color: 0x99ff99, // Green knowledge glow  
      worldSequence: ['the-drift', 'edge-garden', 'persistence-garden'],
      currentStep: 0,
      completed: false
    },
    {
      name: 'Observatory Enlightenment',
      description: 'Journey through observation and discovery',
      color: 0x8888ff, // Blue discovery glow
      worldSequence: ['canonical-observatory', 'provenance-lab', 'proof-constellation', 'signal-cartographer'],
      currentStep: 0,
      completed: false
    },
    {
      name: 'Frontier Explorer',
      description: 'Navigate the edges of known space',
      color: 0xff88aa, // Pink frontier glow
      worldSequence: ['the-anchorage', 'kimi-k2-6-strata', 'hostile-environment-world'],
      currentStep: 0,
      completed: false
    }
  ];
  
  // Session tracking for narrative progress
  const sessionKey = 'universeNarrativeProgress_v1';
  let narrativeProgress = {};
  
  try {
    const saved = sessionStorage.getItem(sessionKey);
    if (saved) {
      narrativeProgress = JSON.parse(saved);
      // Restore arc progress
      narrativeArcs.forEach(arc => {
        if (narrativeProgress[arc.name]) {
          arc.currentStep = narrativeProgress[arc.name].currentStep || 0;
          arc.completed = narrativeProgress[arc.name].completed || false;
        }
      });
    }
  } catch (e) {
    console.warn('Could not restore narrative progress:', e);
  }
  
  // Save progress to sessionStorage
  function saveProgress() {
    const progress = {};
    narrativeArcs.forEach(arc => {
      progress[arc.name] = {
        currentStep: arc.currentStep,
        completed: arc.completed,
        lastUpdated: Date.now()
      };
    });
    try {
      sessionStorage.setItem(sessionKey, JSON.stringify(progress));
    } catch (e) {
      console.warn('Could not save narrative progress:', e);
    }
  }
  
  // Create narrative tooltip element
  const tooltip = document.createElement('div');
  tooltip.id = 'narrative-tooltip';
  tooltip.style.cssText = `
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%) translateY(20px);
    background: rgba(0, 20, 40, 0.9);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(100, 200, 255, 0.5);
    border-radius: 12px;
    padding: 16px 24px;
    color: #bbeeff;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 14px;
    max-width: 500px;
    text-align: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.5s ease, transform 0.5s ease;
    pointer-events: none;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  `;
  document.body.appendChild(tooltip);
  
  let tooltipTimeout = null;
  
  function showTooltip(text, color = '#bbeeff', duration = 3000) {
    tooltip.innerHTML = text;
    tooltip.style.color = color;
    tooltip.style.borderColor = color.replace(')', ', 0.5)').replace('rgb', 'rgba');
    tooltip.style.opacity = '1';
    tooltip.style.transform = 'translateX(-50%) translateY(0)';
    
    if (tooltipTimeout) clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
      tooltip.style.opacity = '0';
      tooltip.style.transform = 'translateX(-50%) translateY(20px)';
    }, duration);
  }
  
  // Listen for world visited events
  document.addEventListener('worldVisited', (event) => {
    const worldId = event.detail?.worldId;
    if (!worldId) return;
    
    let pulseTriggered = false;
    let narrativeAdvanced = false;
    
    // Check each narrative arc
    narrativeArcs.forEach(arc => {
      if (arc.completed) return;
      
      const expectedWorld = arc.worldSequence[arc.currentStep];
      if (worldId === expectedWorld) {
        // Correct step in sequence
        arc.currentStep++;
        narrativeAdvanced = true;
        
        // Show narrative tooltip
        const progressText = `${arc.currentStep}/${arc.worldSequence.length}`;
        const colorHex = `#${arc.color.toString(16).padStart(6, '0')}`;
        showTooltip(
          `⟡ ${arc.name}: ${progressText}<br><small>${arc.description}</small>`,
          colorHex,
          4000
        );
        
        // Check if arc is completed
        if (arc.currentStep >= arc.worldSequence.length) {
          arc.completed = true;
          showTooltip(
            `✨ ${arc.name} Completed!<br><small>Narrative arc fulfilled</small>`,
            colorHex,
            5000
          );
          
          // Pulse celebration
          if (window.__constellations?.pulseHighlight) {
            window.__constellations.pulseHighlight(15);
          }
          
          // Dispatch event for challenge system
          document.dispatchEvent(new CustomEvent('narrativeArcCompleted', {
            detail: { arcName: arc.name, worldSequence: arc.worldSequence }
          }));
        } else {
          // Pulse for progression
          pulseTriggered = true;
        }
        
        saveProgress();
      } else if (arc.worldSequence.includes(worldId)) {
        // Visited a world in the arc, but out of sequence
        // Gentle pulse to hint at connection
        pulseTriggered = true;
      }
    });
    
    // Trigger constellation pulse for narrative progression
    if (pulseTriggered && window.__constellations?.pulseHighlight) {
      window.__constellations.pulseHighlight(8);
    }
    
    // If narrative was advanced, also update challenge UI
    if (narrativeAdvanced) {
      document.dispatchEvent(new CustomEvent('narrativeProgress', {
        detail: { worldId, narrativeAdvanced: true }
      }));
    }
  });
  
  // Add narrative arcs to window for debugging/integration
  window.__narrativeArcs = narrativeArcs;
  window.__narrativeConnections = {
    getProgress: () => {
      const progress = {};
      narrativeArcs.forEach(arc => {
        progress[arc.name] = {
          current: arc.currentStep,
          total: arc.worldSequence.length,
          completed: arc.completed,
          progress: arc.completed ? 1 : arc.currentStep / arc.worldSequence.length
        };
      });
      return progress;
    },
    resetArc: (arcName) => {
      const arc = narrativeArcs.find(a => a.name === arcName);
      if (arc) {
        arc.currentStep = 0;
        arc.completed = false;
        saveProgress();
        return true;
      }
      return false;
    },
    showTooltip
  };
  
  // Update function (empty for now, could animate particles later)
  function update(delta, elapsed) {
    // Future: Add particle effects for narrative connections
  }
  
  return { group, update };
}

// Export for main.js
export default createNarrativeConnections;
