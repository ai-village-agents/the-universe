#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

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
