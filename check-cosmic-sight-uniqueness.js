#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = process.argv[2] || 'main.js';
const sourcePath = path.resolve(process.cwd(), file);
const source = fs.readFileSync(sourcePath, 'utf8');
const startNeedle = 'const cosmicSights = [';
const start = source.indexOf(startNeedle);
if (start === -1) {
  console.error(`Could not find ${startNeedle} in ${file}`);
  process.exit(2);
}
const arrayStart = source.indexOf('[', start);
const end = source.indexOf('];', arrayStart);
if (arrayStart === -1 || end === -1) {
  console.error(`Could not find closing ]; for cosmicSights in ${file}`);
  process.exit(2);
}

let sights;
try {
  sights = vm.runInNewContext(source.slice(arrayStart, end + 1), {}, { timeout: 10000 });
} catch (error) {
  console.error(`Could not evaluate cosmicSights array from ${file}: ${error.message}`);
  process.exit(1);
}

if (!Array.isArray(sights)) {
  console.error(`cosmicSights expression in ${file} did not evaluate to an array`);
  process.exit(1);
}

const names = [];
for (let index = 0; index < sights.length; index += 1) {
  if (!(index in sights)) {
    console.error(`Cosmic sight entry ${index + 1} is a sparse array hole, usually caused by an extra comma`);
    process.exit(1);
  }
  const sight = sights[index];
  if (!sight || typeof sight !== 'object') {
    console.error(`Cosmic sight entry ${index + 1} is not an object`);
    process.exit(1);
  }
  if (typeof sight.name !== 'string' || sight.name.trim() === '') {
    console.error(`Cosmic sight entry ${index + 1} is missing a non-empty string name`);
    process.exit(1);
  }
  if (!Array.isArray(sight.position) || sight.position.length !== 3 || sight.position.some((value) => typeof value !== 'number' || !Number.isFinite(value))) {
    console.error(`Cosmic sight entry ${index + 1} (${sight.name}) is missing a numeric [x, y, z] position`);
    process.exit(1);
  }
  names.push(sight.name);
}

const counts = new Map();
for (const name of names) counts.set(name, (counts.get(name) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
console.log(`Cosmic sight names: ${names.length} actual entries / ${counts.size} unique / ${duplicates.length} duplicate labels`);
if (duplicates.length) {
  for (const [name, count] of duplicates.slice(0, 120)) {
    const positions = [];
    names.forEach((candidate, index) => {
      if (candidate === name) positions.push(index + 1);
    });
    console.log(`  ${name} ×${count} at entries ${positions.join(', ')}`);
  }
  if (duplicates.length > 120) console.log(`  ... ${duplicates.length - 120} more duplicate labels`);
  process.exit(1);
}
