// Day-night cycle for the universe hub.
// Slow oscillation of ambient/directional light intensity & color, fog tint,
// and star opacity. Period ~360s. Subtle so it never feels like real day.

export function createDayNightCycle(THREE, { scene, ambientLight, dirLight, starMesh }) {
  const period = 360; // seconds for full cycle
  const baseAmbient = ambientLight.intensity;
  const baseDir = dirLight.intensity;
  const baseStarOpacity = (starMesh && starMesh.material && starMesh.material.opacity) || 0.8;
  const baseFogColor = (scene.fog && scene.fog.color) ? scene.fog.color.clone() : new THREE.Color(0x000000);

  // Color presets
  const dayAmbient = new THREE.Color(0xb8d4ff);   // cool blue
  const nightAmbient = new THREE.Color(0x1a1838);  // deep indigo
  const dayDir = new THREE.Color(0xfff2d8);        // warm sunlight
  const nightDir = new THREE.Color(0x6688cc);      // cool moonlight
  const dayFog = new THREE.Color(0x080820);        // very deep blue
  const nightFog = new THREE.Color(0x000005);      // near-black

  // HUD pill (top-left under HEALTH overlay)
  const hud = document.createElement('div');
  hud.style.cssText = `
    position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
    margin-left: -260px;
    background: rgba(8, 12, 24, 0.55);
    color: #cfe1ff; font: 11px/1.2 ui-monospace, "SF Mono", Menlo, monospace;
    padding: 4px 10px; border-radius: 999px; border: 1px solid rgba(120,160,220,0.25);
    pointer-events: none; z-index: 1100; letter-spacing: 0.06em;
    text-shadow: 0 0 6px rgba(120,160,220,0.3);
  `;
  hud.textContent = '⏱ universe time: dusk';
  document.body.appendChild(hud);

  let elapsed = 0;
  function update(dt) {
    elapsed += dt;
    // phase 0..1
    const p = (elapsed % period) / period;
    // smooth day/night using sine: 0 = midnight, 0.5 = midday
    const sun = (Math.sin(p * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0..1
    // weight ambient and directional light
    ambientLight.intensity = baseAmbient * (0.55 + sun * 0.65);
    dirLight.intensity = baseDir * (0.4 + sun * 0.7);
    ambientLight.color.lerpColors(nightAmbient, dayAmbient, sun);
    dirLight.color.lerpColors(nightDir, dayDir, sun);
    if (scene.fog && scene.fog.color) {
      scene.fog.color.lerpColors(nightFog, dayFog, sun);
    }
    if (starMesh && starMesh.material) {
      // stars dim in day, bright at night
      starMesh.material.opacity = baseStarOpacity * (1.05 - sun * 0.7);
    }
    // HUD label every ~0.5s
    if (Math.floor(elapsed * 2) !== Math.floor((elapsed - dt) * 2)) {
      let label;
      if (sun < 0.15) label = 'midnight';
      else if (sun < 0.35) label = 'pre-dawn';
      else if (sun < 0.5) label = 'dawn';
      else if (sun < 0.65) label = 'midday';
      else if (sun < 0.85) label = 'afternoon';
      else label = 'dusk';
      hud.textContent = `⏱ universe time: ${label}`;
    }
  }

  return { update };
}

export default { createDayNightCycle };
