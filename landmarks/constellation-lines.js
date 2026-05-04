// Constellation lines connecting thematic clusters of worlds
// Author: Claude Opus 4.7

export function createConstellationLines(THREE, scene, worlds) {
  const group = new THREE.Group();
  group.userData.kind = 'constellation-lines';
  scene.add(group);

  const idMap = new Map(worlds.map(w => [w.id, w]));
  const findById = (id) => idMap.get(id);

  // Define thematic clusters (ids must match config.js)
  const clusters = [
    {
      name: 'Observatory Constellation',
      color: 0x88ccff,
      ids: ['canonical-observatory', 'provenance-lab', 'automation-observatory', 'signal-cartographer', 'proof-constellation'],
    },
    {
      name: 'Garden Constellation',
      color: 0xaaffaa,
      ids: ['edge-garden', 'persistence-garden'],
    },
    {
      name: 'Archive Constellation',
      color: 0xffcc88,
      ids: ['liminal-archive', 'pattern-archive', 'luminous-index', 'gemini-3-1-pro-canvas'],
    },
    {
      name: 'Frontier Constellation',
      color: 0xff99aa,
      ids: ['the-drift', 'the-anchorage', 'kimi-k2-6-strata', 'hostile-environment-world'],
    },
  ];

  const animatedLines = [];
  const labelSprites = [];

  clusters.forEach((cluster, ci) => {
    const positions = cluster.ids
      .map(id => findById(id))
      .filter(Boolean)
      .map(w => new THREE.Vector3(...w.position));
    if (positions.length < 2) return;

    // Sort by angle around cluster centroid for natural ring order
    const centroid = new THREE.Vector3();
    positions.forEach(p => centroid.add(p));
    centroid.multiplyScalar(1 / positions.length);
    positions.sort((a, b) => {
      const aa = Math.atan2(a.z - centroid.z, a.x - centroid.x);
      const bb = Math.atan2(b.z - centroid.z, b.x - centroid.x);
      return aa - bb;
    });

    // Connect each consecutive pair (closing the ring)
    for (let i = 0; i < positions.length; i++) {
      const a = positions[i];
      const b = positions[(i + 1) % positions.length];
      // Build a curved arc between them so lines aren't flat
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      mid.y += 12 + Math.random() * 6;
      const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
      const points = curve.getPoints(48);
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineDashedMaterial({
        color: cluster.color,
        transparent: true,
        opacity: 0.32,
        dashSize: 1.6,
        gapSize: 1.2,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(geom, mat);
      line.computeLineDistances();
      line.userData.basePhase = (ci * 0.7 + i * 0.13);
      line.userData.color = cluster.color;
      group.add(line);
      animatedLines.push(line);

      // Star nodes (small additive sphere) at each endpoint, but only once per world position
    }

    // Cluster label sprite at the highest midpoint above centroid
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 512;
    labelCanvas.height = 96;
    const ctx = labelCanvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 512, 96);
    const hex = '#' + cluster.color.toString(16).padStart(6, '0');
    ctx.font = 'italic 36px Georgia';
    ctx.fillStyle = hex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = hex;
    ctx.shadowBlur = 12;
    ctx.fillText(cluster.name, 256, 48);
    const tex = new THREE.CanvasTexture(labelCanvas);
    tex.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(34, 6.4, 1);
    sprite.position.set(centroid.x, centroid.y + 28 + ci * 4, centroid.z);
    sprite.userData.basePhase = ci * 1.3;
    sprite.userData.baseScale = 34;
    sprite.userData.aspect = 6.4 / 34;
    group.add(sprite);
    labelSprites.push(sprite);

    // Star markers at each world endpoint
    positions.forEach(p => {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.7, 12, 10),
        new THREE.MeshBasicMaterial({
          color: cluster.color,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      s.position.copy(p);
      group.add(s);
      animatedLines.push({ isStar: true, mesh: s, basePhase: Math.random() * 6 });
    });
  });

  let pulseTimeRemaining = 0;
  let pulseDuration = 0;
  function pulseHighlight(durationSec = 10) {
    pulseDuration = durationSec;
    pulseTimeRemaining = durationSec;
  }

  function update(delta, elapsed) {
    const t = elapsed || 0;
    if (pulseTimeRemaining > 0) pulseTimeRemaining = Math.max(0, pulseTimeRemaining - (delta || 0));
    // 0..1, 1 at trigger, 0 when done
    const pulse = pulseDuration > 0 ? pulseTimeRemaining / pulseDuration : 0;
    // Boost opacity & add a fast flicker during pulse window
    const flicker = pulse > 0 ? (0.55 + 0.45 * Math.sin(t * 6.0)) : 0;
    const boost = pulse * (0.55 + 0.35 * flicker); // up to ~+0.85
    animatedLines.forEach(item => {
      if (item.isStar) {
        const phase = item.basePhase;
        item.mesh.material.opacity = Math.min(1, 0.4 + 0.25 * Math.sin(t * 1.4 + phase) + boost * 0.9);
      } else {
        const phase = item.userData.basePhase;
        item.material.opacity = Math.min(1, 0.22 + 0.16 * Math.sin(t * 0.7 + phase) + boost);
      }
    });
    labelSprites.forEach(sprite => {
      const phase = sprite.userData.basePhase;
      sprite.material.opacity = Math.min(1, 0.55 + 0.18 * Math.sin(t * 0.55 + phase) + boost * 0.7);
      // also briefly enlarge the constellation labels
      const baseScale = sprite.userData.baseScale;
      if (baseScale) {
        const s = baseScale * (1 + pulse * 0.25);
        sprite.scale.set(s, s * (sprite.userData.aspect || 1), 1);
      }
    });
  }

  return { group, update, pulseHighlight };
}

export default { createConstellationLines };
