// Guided Tour Mode — Press T to fly through all worlds in sequence.
// Author: Claude Opus 4.7
// Hooks: factory(THREE, { camera, controls, worlds }) -> { update(delta), toggle(), isActive() }

export function createGuidedTour(THREE, { camera, controls, worlds }) {
  // Build waypoints: for each world, compute a viewing position offset from world center
  // The offset places the camera back along the ray from world to the universe origin (0,0,30 plaza),
  // so the tour appears to fly outward from plaza into each world.
  const HOLD_SECONDS = 3.2;       // time the camera dwells at each waypoint with caption visible
  const TRAVEL_SECONDS = 4.5;     // time to interpolate between waypoints (eased)
  const PLAZA = new THREE.Vector3(0, -2, 30);

  const waypoints = worlds.map((w) => {
    const target = new THREE.Vector3(...w.position);
    // Direction from plaza to world (so we approach from plaza side)
    const dir = target.clone().sub(PLAZA);
    if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1);
    dir.normalize();
    // Camera position: slightly back from target along the dir, raised, plus a little side offset
    const back = 38;
    const up = 14;
    const cam = target.clone().sub(dir.clone().multiplyScalar(back));
    cam.y += up;
    return { name: w.name, agent: w.agent, target, cam, color: w.color };
  });

  // Final waypoint — return to plaza for a "tour complete" moment
  waypoints.push({
    name: 'AI Village Plaza',
    agent: 'all of us',
    target: PLAZA.clone().add(new THREE.Vector3(0, 6, 0)),
    cam: new THREE.Vector3(0, 12, 75),
    color: '#ffe6a8',
    finale: true,
  });

  // ------- Caption HUD -------
  const caption = document.createElement('div');
  caption.id = 'guided-tour-caption';
  caption.style.cssText = `
    position: fixed; left: 50%; bottom: 80px; transform: translateX(-50%);
    z-index: 95; pointer-events: none;
    font-family: 'Georgia', serif; font-size: 18px; line-height: 1.45;
    color: #fff; text-align: center; letter-spacing: 0.04em;
    background: linear-gradient(180deg, rgba(8,12,32,0.85), rgba(20,8,40,0.85));
    border: 1px solid rgba(170,200,255,0.45); border-radius: 14px;
    padding: 12px 24px; min-width: 280px; max-width: 80vw;
    box-shadow: 0 0 30px rgba(120,170,255,0.35);
    opacity: 0; transition: opacity 0.6s ease;
    backdrop-filter: blur(6px);
  `;
  caption.innerHTML = `
    <div id="gt-caption-eyebrow" style="font-size:11px;color:#88aaff;text-transform:uppercase;letter-spacing:0.2em;">Guided Tour</div>
    <div id="gt-caption-name" style="font-size:22px;color:#fff;margin-top:4px;font-style:italic;">—</div>
    <div id="gt-caption-agent" style="font-size:13px;color:#aaccff;margin-top:4px;">—</div>
    <div id="gt-caption-progress" style="font-size:11px;color:#888;margin-top:8px;">—</div>
    <div style="font-size:11px;color:#778;margin-top:6px;">Press <b>T</b> to exit · <b>WASD</b> to take the wheel</div>
  `;
  document.body.appendChild(caption);
  const elName = caption.querySelector('#gt-caption-name');
  const elAgent = caption.querySelector('#gt-caption-agent');
  const elProgress = caption.querySelector('#gt-caption-progress');

  // ------- State -------
  let active = false;
  let phaseIdx = 0;          // index of current waypoint
  let phaseTime = 0;         // seconds since current phase began
  let phase = 'travel';      // 'travel' | 'hold'
  // Source position for the current travel phase (camera position when travel began)
  const fromPos = new THREE.Vector3();
  const fromLook = new THREE.Vector3();
  // Smooth lookAt direction
  const tmpDir = new THREE.Vector3();
  const tmpV = new THREE.Vector3();

  function startTour() {
    active = true;
    phaseIdx = 0;
    phaseTime = 0;
    phase = 'travel';
    // Capture current camera state as initial "from"
    fromPos.copy(camera.position);
    // Look-at direction: extend forward
    camera.getWorldDirection(tmpDir);
    fromLook.copy(camera.position).add(tmpDir.multiplyScalar(60));
    if (controls.isLocked) controls.unlock();
    showCaption();
    updateCaptionForIndex(0);
  }

  function endTour(silent = false) {
    active = false;
    hideCaption();
    if (!silent) {
      // brief flash
      caption.style.transition = 'opacity 0.4s ease';
      caption.querySelector('#gt-caption-name').textContent = 'Tour ended';
      caption.querySelector('#gt-caption-eyebrow').textContent = 'Resume control';
      caption.querySelector('#gt-caption-agent').textContent = 'Click to lock cursor and explore';
      caption.querySelector('#gt-caption-progress').textContent = '';
      caption.style.opacity = '1';
      setTimeout(() => { caption.style.opacity = '0'; }, 1800);
    }
  }

  function toggle() {
    if (active) endTour(false);
    else startTour();
  }

  function showCaption() { caption.style.opacity = '1'; }
  function hideCaption() { caption.style.opacity = '0'; }

  function updateCaptionForIndex(i) {
    const wp = waypoints[i];
    if (!wp) return;
    elName.textContent = wp.name;
    elAgent.textContent = wp.finale ? 'Tour complete — thanks for visiting!' : `by ${wp.agent}`;
    elProgress.textContent = `Stop ${i + 1} of ${waypoints.length}`;
    caption.style.borderColor = wp.color || 'rgba(170,200,255,0.45)';
  }

  // Easing
  const ease = (t) => t * t * (3 - 2 * t); // smoothstep

  // Quaternion for smooth lookAt
  const _m = new THREE.Matrix4();
  const _qFrom = new THREE.Quaternion();
  const _qTo = new THREE.Quaternion();
  const _up = new THREE.Vector3(0, 1, 0);

  function update(delta) {
    if (!active) return;
    phaseTime += delta;
    const wp = waypoints[phaseIdx];
    const prev = phaseIdx > 0 ? waypoints[phaseIdx - 1] : null;

    if (phase === 'travel') {
      const dur = phaseIdx === 0 ? Math.min(2.6, TRAVEL_SECONDS) : TRAVEL_SECONDS;
      const t = Math.min(1, phaseTime / dur);
      const e = ease(t);
      // Position interpolation
      camera.position.lerpVectors(fromPos, wp.cam, e);
      // Look-at interpolation via quaternion blend
      const fromQ = _qFrom;
      const toQ = _qTo;
      // From quaternion: use camera's current orientation snapshot at start
      // We approximate by computing both lookAt orientations and slerping
      _m.lookAt(fromPos, fromLook, _up); fromQ.setFromRotationMatrix(_m);
      _m.lookAt(wp.cam, wp.target, _up); toQ.setFromRotationMatrix(_m);
      camera.quaternion.copy(fromQ).slerp(toQ, e);

      if (t >= 1) {
        phase = 'hold';
        phaseTime = 0;
      }
    } else if (phase === 'hold') {
      // Slow drift: orbit camera slightly around target
      const a = phaseTime * 0.15;
      const offset = wp.cam.clone().sub(wp.target);
      const radius = offset.length();
      const baseAngle = Math.atan2(offset.x, offset.z);
      const angle = baseAngle + a * 0.4;
      camera.position.set(
        wp.target.x + Math.sin(angle) * radius,
        wp.cam.y + Math.sin(phaseTime * 0.6) * 0.6,
        wp.target.z + Math.cos(angle) * radius,
      );
      tmpV.copy(wp.target);
      camera.lookAt(tmpV);

      if (phaseTime >= HOLD_SECONDS) {
        // advance to next waypoint
        if (phaseIdx >= waypoints.length - 1) {
          // finished — exit gracefully
          endTour(false);
          return;
        }
        phaseIdx += 1;
        phase = 'travel';
        phaseTime = 0;
        fromPos.copy(camera.position);
        // current look direction:
        camera.getWorldDirection(tmpDir);
        fromLook.copy(camera.position).add(tmpDir.multiplyScalar(60));
        updateCaptionForIndex(phaseIdx);
      }
    }
  }

  function isActive() { return active; }

  return { update, toggle, isActive, startTour, endTour };
}
