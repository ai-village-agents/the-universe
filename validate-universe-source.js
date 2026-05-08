#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const fs = require('node:fs');

function assertSourceIntegrity() {
  console.log('\n[validate] main.js source integrity');
  const main = fs.readFileSync('main.js', 'utf8');

  function requireContains(label, haystack, needle) {
    if (!haystack.includes(needle)) {
      console.error(`[validate] Missing ${label}: ${needle}`);
      process.exit(1);
    }
  }

  function requireAbsent(label, haystack, needle) {
    if (haystack.includes(needle)) {
      console.error(`[validate] Unexpected ${label}: ${needle}`);
      process.exit(1);
    }
  }

  const cosmicStart = main.indexOf('const cosmicSights = [');
  const cosmicEnd = cosmicStart === -1 ? -1 : main.indexOf('\n];', cosmicStart);
  if (cosmicStart === -1 || cosmicEnd === -1) {
    console.error('[validate] Could not locate const cosmicSights array');
    process.exit(1);
  }
  const cosmicBlock = main.slice(cosmicStart, cosmicEnd);
  const afterCosmicArray = main.slice(cosmicEnd + '\n];'.length);
  const strayObjectAfterArray = afterCosmicArray.match(/^\s*\{\s*(?:id|name)\s*:/m);
  const strayPropertyAfterArray = afterCosmicArray.match(/^\s*(?:id|name)\s*:\s*[^\n]+/m);
  if (strayObjectAfterArray || strayPropertyAfterArray) {
    const match = strayObjectAfterArray || strayPropertyAfterArray;
    const line = main.slice(0, cosmicEnd + '\n];'.length + match.index).split('\n').length;
    console.error(`[validate] Possible top-level cosmic sight object after cosmicSights array near main.js line ${line}`);
    process.exit(1);
  }
  requireAbsent('legacy coordinates fields inside cosmicSights', cosmicBlock, 'coordinates:');

  const cosmicLines = cosmicBlock.split('\n');
  for (let index = 0; index < cosmicLines.length - 1; index += 1) {
    if (cosmicLines[index].trim() === '}' && cosmicLines[index + 1].trim().startsWith('{ name:')) {
      console.error(`[validate] Possible missing comma between cosmic sight objects near main.js line ${cosmicStart === -1 ? '?' : main.slice(0, cosmicStart).split('\n').length + index}`);
      process.exit(1);
    }
  }

  const directoryStart = main.indexOf('function getDirectoryEntries() {');
  const keydownStart = directoryStart === -1 ? -1 : main.indexOf('\nfunction handleDirectoryEntryKeydown', directoryStart);
  if (directoryStart === -1 || keydownStart === -1) {
    console.error('[validate] Could not locate getDirectoryEntries / handleDirectoryEntryKeydown boundary');
    process.exit(1);
  }
  const directoryBlock = main.slice(directoryStart, keydownStart);
  requireContains('DOM-only getDirectoryEntries query', directoryBlock, "return [...teleportList.querySelectorAll('.world-entry, .cosmic-entry')];");
  requireAbsent('cosmic sight object injected into getDirectoryEntries', directoryBlock, '{ name:');
  requireAbsent('known injected cosmic sight marker in getDirectoryEntries', directoryBlock, 'Magnetar Crustquake');

  const teleportStart = main.indexOf('function updateTeleportList()');
  const nearestStart = teleportStart === -1 ? -1 : main.indexOf('\nfunction updateNearestWorld()', teleportStart);
  if (teleportStart === -1 || nearestStart === -1) {
    console.error('[validate] Could not locate updateTeleportList / updateNearestWorld boundary');
    process.exit(1);
  }
  const teleportBlock = main.slice(teleportStart, nearestStart);
  requireContains('cosmic-sight directory visit label', teleportBlock, 'Visit coordinates');
  requireContains('teleport filter input handler', teleportBlock, 'teleportFilter?.addEventListener');
  requireContains('cosmic-sight teleport activator', teleportBlock, 'teleportNearPoint(sight.position, sight.name, 40)');
  requireContains('nearest landmark helper', main, 'function findClosestLandmark()');

  console.log('[validate] main.js source integrity passed');
}


const syntaxTargets = [
  'main.js',
  'check-cosmic-sight-uniqueness.js',
  'cosmic-sights-atlas.js',
  'cosmic-sight-markers.js',
  'cosmic-sight-tracker.js',
  'cosmic-sight-compass.js',
  'cosmic-sight-log.js',
  'cosmic-sight-milestones.js',
  'cosmic-sight-progress-badge.js',
  'cosmic-sight-category-hud.js',
  'visitor-tracker.js',
  'world-visit-counter.js',
  'bookmark-3d-markers.js',
  'photo-mode.js',
  'photo-gallery.js',
  'landmarks/welcome-obelisk.js',
  'landmarks/anchorage.js',
  'landmarks/canvas-landmark.js',
];

function run(label, command, args, options = {}) {
  console.log(`\n[validate] ${label}`);
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

assertSourceIntegrity();

run('cosmic sight name uniqueness', 'node', ['check-cosmic-sight-uniqueness.js']);

for (const target of syntaxTargets) {
  run(`syntax: ${target}`, 'node', ['--check', target]);
}

run(
  'Anchorage ESM import smoke test',
  'node',
  [
    '--input-type=module',
    '-e',
    "import('./landmarks/anchorage.js').then(m => { if (!m.createAnchorageLandmark) throw new Error('missing createAnchorageLandmark export'); console.log('OK Anchorage export'); })",
  ],
);

console.log('\n[validate] Universe source validation passed');
