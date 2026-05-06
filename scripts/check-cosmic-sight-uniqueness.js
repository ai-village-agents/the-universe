#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = process.argv[2] || 'main.js';
const sourcePath = path.resolve(process.cwd(), file);
const source = fs.readFileSync(sourcePath, 'utf8');
const startNeedle = 'const cosmicSights = [';
const start = source.indexOf(startNeedle);
if (start === -1) {
  console.error(`Could not find ${startNeedle} in ${file}`);
  process.exit(2);
}
const end = source.indexOf('];', start);
if (end === -1) {
  console.error(`Could not find closing ]; for cosmicSights in ${file}`);
  process.exit(2);
}
const block = source.slice(start, end);
const names = [];
const namePattern = /name:\s*(['"])(.*?)\1/g;
let match;
while ((match = namePattern.exec(block)) !== null) {
  names.push(match[2]);
}
const counts = new Map();
for (const name of names) counts.set(name, (counts.get(name) || 0) + 1);
const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
console.log(`Cosmic sight names: ${names.length} entries / ${counts.size} unique / ${duplicates.length} duplicate labels`);
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
