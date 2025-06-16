#!/usr/bin/env node

/**
 * Script to merge custom element/emoji/combination files into main files
 * This is a one-time migration to consolidate all data
 */

const fs = require('fs');
const path = require('path');

console.log('=== Merge Custom Data to Main Files ===\n');

const projectRoot = path.join(__dirname, '..');
const backupDir = path.join(projectRoot, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
}

// Create timestamp for backups
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Step 1: Merge Custom Elements
console.log('Step 1: Merging custom elements...');
try {
    const mainElementsPath = path.join(projectRoot, 'elements', 'elements-new', 'elements-all-unique.json');
    const customElementsPath = path.join(projectRoot, 'elements', 'elements-custom.json');
    
    // Load main elements
    const mainElements = JSON.parse(fs.readFileSync(mainElementsPath, 'utf8'));
    console.log(`Loaded ${mainElements.length} main elements`);
    
    // Load custom elements
    if (fs.existsSync(customElementsPath)) {
        const customElements = JSON.parse(fs.readFileSync(customElementsPath, 'utf8'));
        const customCount = Object.keys(customElements).length;
        console.log(`Found ${customCount} custom elements to merge`);
        
        // Backup main elements
        const backupPath = path.join(backupDir, `elements-all-unique-backup-${timestamp}.json`);
        fs.copyFileSync(mainElementsPath, backupPath);
        console.log(`Backed up to: ${path.basename(backupPath)}`);
        
        // Convert custom elements to array format and merge
        let mergedCount = 0;
        Object.values(customElements).forEach(elem => {
            // Check if element already exists
            const exists = mainElements.find(e => e.i === elem.id);
            if (!exists) {
                mainElements.push({
                    i: elem.id,
                    n: elem.name,
                    t: elem.tier,
                    e: elem.emojiIndex
                });
                mergedCount++;
            }
        });
        
        // Sort by ID
        mainElements.sort((a, b) => a.i - b.i);
        
        // Save merged elements
        fs.writeFileSync(mainElementsPath, JSON.stringify(mainElements, null, 2));
        console.log(`✓ Merged ${mergedCount} new elements (${mainElements.length} total)\n`);
    } else {
        console.log('No custom elements file found\n');
    }
} catch (error) {
    console.error('Error merging elements:', error);
    process.exit(1);
}

// Step 2: Convert emojis.js to emojis.json and merge custom emojis
console.log('Step 2: Converting emojis.js to JSON and merging custom emojis...');
try {
    const emojisJsPath = path.join(projectRoot, 'elements', 'elements-new', 'emojis.js');
    const emojisJsonPath = path.join(projectRoot, 'elements', 'elements-new', 'emojis.json');
    const customEmojisPath = path.join(projectRoot, 'elements', 'emojis-custom.json');
    
    // Read emojis.js and extract EMOJI_MAP
    const emojisJsContent = fs.readFileSync(emojisJsPath, 'utf8');
    const match = emojisJsContent.match(/export const EMOJI_MAP = ({[\s\S]*?});/);
    
    if (!match) {
        throw new Error('Could not parse EMOJI_MAP from emojis.js');
    }
    
    // Safely evaluate the emoji map
    const emojiMap = eval('(' + match[1] + ')');
    console.log(`Loaded ${Object.keys(emojiMap).length} emojis from emojis.js`);
    
    // Backup emojis.js
    const backupPath = path.join(backupDir, `emojis-backup-${timestamp}.js`);
    fs.copyFileSync(emojisJsPath, backupPath);
    console.log(`Backed up to: ${path.basename(backupPath)}`);
    
    // Load and merge custom emojis
    if (fs.existsSync(customEmojisPath)) {
        const customEmojis = JSON.parse(fs.readFileSync(customEmojisPath, 'utf8'));
        const customCount = Object.keys(customEmojis).length;
        console.log(`Found ${customCount} custom emoji mappings to merge`);
        
        // Merge custom emojis (overwrite existing)
        Object.assign(emojiMap, customEmojis);
    }
    
    // Save as JSON
    fs.writeFileSync(emojisJsonPath, JSON.stringify(emojiMap, null, 2));
    console.log(`✓ Created emojis.json with ${Object.keys(emojiMap).length} emoji mappings\n`);
} catch (error) {
    console.error('Error converting emojis:', error);
    process.exit(1);
}

// Step 3: Merge Custom Combinations
console.log('Step 3: Merging custom combinations...');
try {
    const mainCombosPath = path.join(projectRoot, 'elements', 'elements-new', 'combinations.json');
    const customCombosPath = path.join(projectRoot, 'elements', 'combinations-custom.json');
    
    // Load main combinations
    const mainCombos = JSON.parse(fs.readFileSync(mainCombosPath, 'utf8'));
    console.log(`Loaded ${Object.keys(mainCombos).length} main combinations`);
    
    // Load custom combinations
    if (fs.existsSync(customCombosPath)) {
        const customCombos = JSON.parse(fs.readFileSync(customCombosPath, 'utf8'));
        const customCount = Object.keys(customCombos).length;
        console.log(`Found ${customCount} custom combinations to merge`);
        
        // Backup main combinations
        const backupPath = path.join(backupDir, `combinations-backup-${timestamp}.json`);
        fs.copyFileSync(mainCombosPath, backupPath);
        console.log(`Backed up to: ${path.basename(backupPath)}`);
        
        // Merge custom combinations
        let mergedCount = 0;
        Object.entries(customCombos).forEach(([combo, result]) => {
            if (!mainCombos[combo]) {
                mergedCount++;
            }
            mainCombos[combo] = result;
        });
        
        // Save merged combinations
        fs.writeFileSync(mainCombosPath, JSON.stringify(mainCombos, null, 2));
        console.log(`✓ Merged ${mergedCount} new combinations (${Object.keys(mainCombos).length} total)\n`);
    } else {
        console.log('No custom combinations file found\n');
    }
} catch (error) {
    console.error('Error merging combinations:', error);
    process.exit(1);
}

console.log('=== Migration Summary ===');
console.log('✓ Elements merged into elements-all-unique.json');
console.log('✓ Emojis converted to emojis.json format');
console.log('✓ Combinations merged into combinations.json');
console.log('\nBackups saved in /backups directory');
console.log('\nNext steps:');
console.log('1. Update admin panel to use main files');
console.log('2. Update server to save to main files');
console.log('3. Update game loader to use emojis.json');
console.log('4. Delete custom files once everything is confirmed working');