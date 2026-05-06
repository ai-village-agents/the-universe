#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

console.log('🚨 EMERGENCY DEDUPLICATION - Fixing 72 duplicate cosmic sights\n');

// Read main.js
const sourcePath = path.resolve(process.cwd(), 'main.js');
let source = fs.readFileSync(sourcePath, 'utf8');

// Backup first
const backupPath = `main.js.backup.${Date.now()}`;
fs.writeFileSync(backupPath, source);
console.log(`✅ Backup created: ${backupPath}`);

// Track all names and their positions
const namePattern = /name:\s*(['\"])(.*?)\1/g;
const names = [];
const positions = [];
let match;
let offset = 0;

while ((match = namePattern.exec(source)) !== null) {
    names.push(match[2]);
    positions.push({
        start: match.index,
        end: match.index + match[0].length,
        name: match[2],
        fullMatch: match[0]
    });
}

// Find duplicates
const nameCounts = new Map();
for (const name of names) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
const duplicates = [...nameCounts.entries()].filter(([, count]) => count > 1);

console.log(`Found ${duplicates.length} duplicate names affecting ${names.length - nameCounts.size} entries`);

// Fix duplicates by renaming subsequent occurrences
let modifiedSource = source;
let fixesApplied = 0;

// Process from end to beginning to maintain positions
for (let i = positions.length - 1; i >= 0; i--) {
    const pos = positions[i];
    const name = pos.name;
    const count = nameCounts.get(name);
    
    if (count > 1) {
        // This is a duplicate (not the first occurrence)
        // Find which occurrence this is
        let occurrence = 0;
        for (let j = 0; j <= i; j++) {
            if (positions[j].name === name) occurrence++;
        }
        
        if (occurrence > 1) {
            // Rename with (2), (3), etc.
            const newName = `${name} (${occurrence})`;
            const oldMatch = pos.fullMatch;
            const newMatch = oldMatch.replace(`"${name}"`, `"${newName}"`).replace(`'${name}'`, `'${newName}'`);
            
            modifiedSource = modifiedSource.slice(0, pos.start) + newMatch + modifiedSource.slice(pos.end);
            fixesApplied++;
            console.log(`  Fixed: ${name} → ${newName} (occurrence ${occurrence})`);
        }
    }
}

// Write fixed file
fs.writeFileSync(sourcePath, modifiedSource);
console.log(`\n✅ Applied ${fixesApplied} fixes`);

// Verify fix
console.log('\n🔍 Verifying fix...');
const { spawnSync } = require('child_process');
const result = spawnSync('node', ['check-cosmic-sight-uniqueness.js'], { encoding: 'utf8' });
console.log(result.stdout);
if (result.status === 0) {
    console.log('🎉 SUCCESS: All duplicates fixed!');
} else {
    console.log('❌ FAILED: Still have duplicates');
    process.exit(1);
}
