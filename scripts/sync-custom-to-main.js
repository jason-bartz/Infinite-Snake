#!/usr/bin/env node

/**
 * Temporary script to sync custom files back to main files
 * Use this if you've made changes before restarting the server
 */

const fs = require('fs');
const path = require('path');

console.log('=== Syncing Custom Files to Main Files ===\n');

// Sync custom emojis
const customEmojisPath = path.join(__dirname, '..', 'elements', 'emojis-custom.json');
if (fs.existsSync(customEmojisPath)) {
    const customEmojis = JSON.parse(fs.readFileSync(customEmojisPath, 'utf8'));
    const mainEmojisPath = path.join(__dirname, '..', 'elements', 'elements-new', 'emojis.json');
    const mainEmojis = JSON.parse(fs.readFileSync(mainEmojisPath, 'utf8'));
    
    // Merge custom into main
    Object.assign(mainEmojis, customEmojis);
    
    // Save
    fs.writeFileSync(mainEmojisPath, JSON.stringify(mainEmojis, null, 2));
    console.log(`✓ Synced ${Object.keys(customEmojis).length} custom emoji mappings`);
}

// Sync custom combinations
const customCombosPath = path.join(__dirname, '..', 'elements', 'combinations-custom.json');
if (fs.existsSync(customCombosPath)) {
    const customCombos = JSON.parse(fs.readFileSync(customCombosPath, 'utf8'));
    const mainCombosPath = path.join(__dirname, '..', 'elements', 'elements-new', 'combinations.json');
    const mainCombos = JSON.parse(fs.readFileSync(mainCombosPath, 'utf8'));
    
    // Merge custom into main
    Object.assign(mainCombos, customCombos);
    
    // Save
    fs.writeFileSync(mainCombosPath, JSON.stringify(mainCombos, null, 2));
    console.log(`✓ Synced ${Object.keys(customCombos).length} custom combinations`);
}

console.log('\n✓ Sync complete! Your changes are now in the main files.');
console.log('Remember to restart the server to enable direct saving.');