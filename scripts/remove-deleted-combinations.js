#!/usr/bin/env node

/**
 * Script to remove deleted combinations from combinations.json
 * Run this whenever deleted-combinations.json gets full
 * 
 * Usage: node scripts/remove-deleted-combinations.js
 */

const fs = require('fs');
const path = require('path');

console.log('=== Remove Deleted Combinations Script ===\n');

// Paths
const projectRoot = path.join(__dirname, '..');
const deletedCombosPath = path.join(projectRoot, 'elements', 'deleted-combinations.json');
const combinationsPath = path.join(projectRoot, 'elements', 'data', 'combinations.json');

// Check if files exist
if (!fs.existsSync(deletedCombosPath)) {
    console.error('Error: deleted-combinations.json not found at:', deletedCombosPath);
    process.exit(1);
}

if (!fs.existsSync(combinationsPath)) {
    console.error('Error: combinations.json not found at:', combinationsPath);
    process.exit(1);
}

// Load deleted combinations
const deletedCombos = JSON.parse(fs.readFileSync(deletedCombosPath, 'utf8'));
console.log(`Loaded ${deletedCombos.length} combinations to delete`);

if (deletedCombos.length === 0) {
    console.log('No combinations to delete. Exiting.');
    process.exit(0);
}

// Load current combinations
const combinations = JSON.parse(fs.readFileSync(combinationsPath, 'utf8'));
const originalCount = Object.keys(combinations).length;
console.log(`Original combinations count: ${originalCount}`);

// Create a set of combinations to delete (including reverse combinations)
const toDelete = new Set();
deletedCombos.forEach(combo => {
    toDelete.add(combo);
    // Also add the reverse combination
    const [a, b] = combo.split('+');
    if (a && b) {
        toDelete.add(`${b}+${a}`);
    }
});

console.log(`Total combinations to delete (including reverses): ${toDelete.size}`);

// Count how many actually exist
let foundCount = 0;
toDelete.forEach(combo => {
    if (combinations[combo]) {
        foundCount++;
    }
});

console.log(`Found ${foundCount} combinations in the file`);

if (foundCount === 0) {
    console.log('\nNo combinations found to delete. They may have already been removed.');
    process.exit(0);
}

// Delete the combinations
let deletedCount = 0;
const deletedList = [];
toDelete.forEach(combo => {
    if (combinations[combo]) {
        delete combinations[combo];
        deletedCount++;
        deletedList.push(combo);
    }
});

const finalCount = Object.keys(combinations).length;
console.log(`\nDeletion complete:`);
console.log(`- Deleted: ${deletedCount} combinations`);
console.log(`- Final count: ${finalCount} combinations`);
console.log(`- Reduced by: ${originalCount - finalCount} combinations`);

// Backup the original file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupDir = path.join(projectRoot, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}
const backupPath = path.join(backupDir, `combinations-backup-${timestamp}.json`);
fs.copyFileSync(combinationsPath, backupPath);
console.log(`\nBacked up original to: backups/${path.basename(backupPath)}`);

// Write the updated combinations
fs.writeFileSync(combinationsPath, JSON.stringify(combinations, null, 2));
console.log('Updated combinations.json successfully!');

// Show some examples of what was deleted
if (deletedList.length > 0) {
    console.log('\nExamples of deleted combinations:');
    deletedList.slice(0, 10).forEach(combo => {
        console.log(`  - ${combo}`);
    });
    if (deletedList.length > 10) {
        console.log(`  ... and ${deletedList.length - 10} more`);
    }
}

console.log('\n✅ Script completed successfully!');