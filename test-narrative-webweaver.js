/**
 * Narrative + Web Weaver Test Harness
 * Drop this into the browser console (or load as a script) to validate:
 * - Narrative connections (all 4 arcs)
 * - Web Weaver challenge progress + session persistence
 * - SessionStorage contents for both systems
 * - Simulated world visits to quickly exercise flows
 *
 * Usage highlights:
 *   NarrativeWebWeaverTester.runAll();
 *   NarrativeWebWeaverTester.checkNarratives();
 *   NarrativeWebWeaverTester.checkWebWeaver();
 *   NarrativeWebWeaverTester.simulateWorldVisit('luminous-index');
 *   NarrativeWebWeaverTester.simulateArcSequence('Timekeeper\'s Circuit');
 *   NarrativeWebWeaverTester.showPersistenceChecklist();
 */
(function () {
  const badge = (bg, fg = '#e5f7ff') =>
    `padding:2px 8px;border-radius:8px;font-weight:700;background:${bg};color:${fg}`;
  const soft = 'color:#b8dcff;font-weight:500';
  const divider = () =>
    console.log('%c────────────────────────────────────────', 'color:#123a5c');

  function logTitle(text) {
    console.log(`%c${text}`, 'background:#0c2338;color:#8cd0ff;padding:6px 8px;font-weight:700;border-radius:10px;');
  }

  function logStatus(pass, label, detail = '') {
    const bg = pass ? '#0f3d1f' : '#421313';
    const fg = pass ? '#9ff3b2' : '#ffc0c0';
    const icon = pass ? '✅' : '❌';
    const base = `%c${icon} ${label}`;
    if (detail) {
      console.log(`${base}%c ${detail}`, badge(bg, fg), soft);
    } else {
      console.log(base, badge(bg, fg));
    }
  }

  function formatArcStatus(arcs = []) {
    arcs.forEach((arc, idx) => {
      const completedSteps = arc.currentStep ?? arc.stepsCompleted ?? 0;
      const totalSteps = arc.worldSequence ? arc.worldSequence.length : arc.totalSteps || arc.steps?.length || 0;
      const done = arc.completed || completedSteps >= totalSteps;
      const label = `Arc ${idx + 1}: ${arc.name || 'Unnamed'}`;
      const detail = `${completedSteps}/${totalSteps} ${done ? '(complete)' : '(in progress)'}`;
      logStatus(done, label, detail);
    });
  }

  function readSession(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return { error: e?.message || 'parse failed' };
    }
  }

  function checkNarratives() {
    logTitle('🧭 Narrative Connections');
    const system = window.__narrativeConnections || window.__narrativeArcs;
    const arcs = window.__narrativeArcs || system?.arcs || system?.getProgress?.();

    const systemLoaded = Boolean(system);
    logStatus(systemLoaded, 'System loaded', systemLoaded ? 'window.__narrativeConnections found' : 'Not found on window');

    if (!systemLoaded) {
      divider();
      return { systemLoaded, arcsOk: false, arcCount: 0, session: null };
    }

    const arcList = Array.isArray(arcs)
      ? arcs
      : arcs && typeof arcs === 'object'
        ? Object.keys(arcs).map((name) => ({ name, ...arcs[name] }))
        : [];

    const arcCount = arcList.length;
    const arcsOk = arcCount === 4;
    logStatus(arcsOk, 'All 4 arcs present', `Found ${arcCount}`);
    formatArcStatus(arcList);

    const session = readSession('universeNarrativeProgress_v1');
    const hasSession = session && !session.error;
    const sessionDetail = hasSession
      ? 'universeNarrativeProgress_v1 present'
      : session && session.error
        ? `Error: ${session.error}`
        : 'No session data yet';
    logStatus(hasSession, 'SessionStorage (narrative)', sessionDetail);
    if (hasSession) {
      console.log('%cNarrative session snapshot:', soft);
      console.log(session);
    }
    divider();
    return { systemLoaded, arcsOk, arcCount, session };
  }

  function checkWebWeaver() {
    logTitle('🕸️ Web Weaver Challenge');
    const ui = window.__challengeUI;
    const hasUI = Boolean(ui);
    logStatus(hasUI, 'Challenge UI loaded', hasUI ? 'window.__challengeUI ready' : 'Not found on window');

    if (!hasUI) {
      divider();
      return { hasUI: false, challenge: null, sessionVisits: null };
    }

    const ww = ui.challenges?.webWeaver;
    const hasChallenge = Boolean(ww);
    logStatus(hasChallenge, 'Challenge registered', hasChallenge ? 'webWeaver entry exists' : 'Missing in challenges');

    if (hasChallenge) {
      const hasProgressNumber = typeof ww.progress === 'number' && typeof ww.total === 'number';
      const detail = hasProgressNumber
        ? `${ww.progress}/${ww.total} visited this session`
        : 'Progress numbers missing';
      const complete = hasProgressNumber && ww.total > 0 && ww.progress >= ww.total;
      logStatus(hasProgressNumber, 'Progress', detail);
      if (complete) {
        console.log('%c🎉 Web Weaver completed this session!', badge('#2f114b', '#ffccff'));
      }
    }

    const sessionVisits = readSession(ui.sessionStorageKey || 'universeSessionVisits');
    const hasSessionVisits = Array.isArray(sessionVisits);
    const detail = hasSessionVisits
      ? `${sessionVisits.length} worlds stored`
      : sessionVisits && sessionVisits.error
        ? `Error: ${sessionVisits.error}`
        : 'No session data yet';
    logStatus(hasSessionVisits, 'SessionStorage (Web Weaver)', detail);
    if (hasSessionVisits) {
      console.log('%cSession visit list:', soft);
      console.log(sessionVisits);
    }

    divider();
    return { hasUI, challenge: ww, sessionVisits };
  }

  function simulateWorldVisit(worldId, { suppressLog = false } = {}) {
    if (!worldId) {
      console.warn('simulateWorldVisit: worldId is required');
      return false;
    }
    const detail = { worldId, simulated: true, timestamp: Date.now() };
    document.dispatchEvent(new CustomEvent('worldVisited', { detail }));
    if (!suppressLog) {
      console.log(`%c🛰️ Simulated visit:%c ${worldId}`, badge('#14324d'), soft);
    }
    return true;
  }

  function simulateArcSequence(arcName, delayMs = 350) {
    const arcs = window.__narrativeArcs;
    if (!arcs || !arcName) {
      console.warn('simulateArcSequence: arcName and window.__narrativeArcs required');
      return Promise.resolve(false);
    }
    const arc = arcs.find((a) => a.name === arcName);
    if (!arc) {
      console.warn(`simulateArcSequence: arc "${arcName}" not found`);
      return Promise.resolve(false);
    }
    console.log(`%c🚀 Simulating arc:%c ${arc.name}`, badge('#1f2b46'), soft);
    return arc.worldSequence.reduce((p, worldId, idx) => {
      return p.then(() => {
        simulateWorldVisit(worldId, { suppressLog: true });
        console.log(`%c   ↳ Step ${idx + 1}/${arc.worldSequence.length}:%c ${worldId}`, badge('#0f3d1f', '#a9ffbf'), soft);
        return new Promise((resolve) => setTimeout(resolve, delayMs));
      });
    }, Promise.resolve(true));
  }

  function showPersistenceChecklist() {
    logTitle('💾 Persistence Checklist');
    console.log('%c1) Run NarrativeWebWeaverTester.runAll();', soft);
    console.log('%c2) Visit a few worlds (or simulate with simulateWorldVisit).', soft);
    console.log('%c3) Confirm sessionStorage keys appear:\n   - universeNarrativeProgress_v1\n   - universeSessionVisits', soft);
    console.log('%c4) Reload the page (keep tab open).', soft);
    console.log('%c5) Run NarrativeWebWeaverTester.runAll(); again.', soft);
    console.log('%c6) Verify progress counts match pre-reload values.', soft);
    divider();
  }

  function runAll() {
    console.clear();
    console.log('%c🌠 Narrative + Web Weaver Test Runner', 'background:#102a44;color:#a8dcff;padding:6px 10px;font-size:14px;font-weight:700;border-radius:10px;');
    console.log('%cUse the helper functions below for quick world simulations.', soft);
    divider();
    const narrative = checkNarratives();
    const webWeaver = checkWebWeaver();
    console.log('%cHelper usage examples:', soft);
    console.log('%c- NarrativeWebWeaverTester.simulateWorldVisit("luminous-index");', soft);
    console.log('%c- NarrativeWebWeaverTester.simulateArcSequence("Timekeeper\'s Circuit");', soft);
    console.log('%c- NarrativeWebWeaverTester.showPersistenceChecklist();', soft);
    divider();
    logStatus(true, 'Diagnostics finished', 'Scroll up for details');
    return { narrative, webWeaver };
  }

  window.NarrativeWebWeaverTester = {
    runAll,
    checkNarratives,
    checkWebWeaver,
    simulateWorldVisit,
    simulateArcSequence,
    showPersistenceChecklist
  };

  console.log('%c🔧 NarrativeWebWeaverTester ready. Run `NarrativeWebWeaverTester.runAll();` to begin.', badge('#1a3a5c'));
})();
