#!/usr/bin/env node

// Discord Code Generator with Skin Assignment - Admin Tool
// This script generates Discord unlock codes and maps them to specific skins

const fs = require('fs');
const path = require('path');

// Load skin data
const SKIN_DATA = require('../js/skinData.js');

// Simple hash function (must match the one in codeValidator.js)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
}

// Generate random 4-character suffix
function generateSuffix() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 4; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return suffix;
}

// Get all skin IDs from skinData
function getAllSkinIds() {
    return Object.keys(SKIN_DATA);
}

// Generate codes with skin assignments
function generateCodesWithSkins(skinIds = null, prefix = 'DISCORD-2025-') {
    // If no specific skins provided, use all skins
    if (!skinIds) {
        skinIds = getAllSkinIds();
    }
    
    const codes = [];
    const usedSuffixes = new Set();
    const usedHashes = new Set();
    
    // Load existing codes to avoid duplicates
    const existingCodesFile = path.join(__dirname, 'existing-codes.json');
    if (fs.existsSync(existingCodesFile)) {
        const existingCodes = JSON.parse(fs.readFileSync(existingCodesFile, 'utf8'));
        existingCodes.forEach(code => {
            usedHashes.add(code.hash);
            if (code.code.startsWith(prefix)) {
                usedSuffixes.add(code.code.substring(prefix.length));
            }
        });
    }
    
    for (const skinId of skinIds) {
        let attempts = 0;
        let generated = false;
        
        while (!generated && attempts < 1000) {
            attempts++;
            const suffix = generateSuffix();
            
            // Ensure unique suffixes
            if (usedSuffixes.has(suffix)) continue;
            
            const fullCode = prefix + suffix;
            const hash = simpleHash(fullCode);
            
            // Ensure unique hash
            if (usedHashes.has(hash)) continue;
            
            usedSuffixes.add(suffix);
            usedHashes.add(hash);
            
            const skinData = SKIN_DATA[skinId];
            codes.push({
                code: fullCode,
                hash: hash,
                skinId: skinId,
                skinName: skinData ? skinData.name : 'Unknown',
                skinRarity: skinData ? skinData.rarity : 'unknown',
                created: new Date().toISOString()
            });
            
            generated = true;
        }
        
        if (!generated) {
            console.error(`⚠️  Failed to generate unique code for skin: ${skinId}`);
        }
    }
    
    return codes;
}

// Save codes to files
function saveCodesWithSkins(codes, batchId) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputDir = path.join(__dirname, 'generated-codes');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save plain codes (for distribution)
    const plainCodes = codes.map(c => c.code).join('\n');
    const plainFile = path.join(outputDir, `discord-codes-${batchId}-${timestamp}.txt`);
    fs.writeFileSync(plainFile, plainCodes);
    
    // Save detailed JSON (for records)
    const jsonFile = path.join(outputDir, `discord-codes-${batchId}-${timestamp}-detailed.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(codes, null, 2));
    
    // Generate code mapping for codeValidator.js
    const codeMapping = codes.map(c => 
        `            '${c.hash}': '${c.skinId}',${' '.repeat(Math.max(0, 20 - c.skinId.length))}// ${c.code} → ${c.skinName}`
    ).join('\n');
    
    const mappingFile = path.join(outputDir, `discord-codes-${batchId}-${timestamp}-mapping.js`);
    const mappingContent = `// Add these mappings to the CODE_TO_SKIN_MAP in codeValidator.js
// Generated: ${new Date().toISOString()}
// Batch ID: ${batchId}
// Total codes: ${codes.length}

${codeMapping}`;
    fs.writeFileSync(mappingFile, mappingContent);
    
    // Generate admin reference document
    const adminDoc = codes.map((c, i) => 
        `${i + 1}. \`${c.code}\` → **${c.skinName}** (${c.skinId}) - ${c.skinRarity}`
    ).join('\n');
    
    const adminFile = path.join(outputDir, `discord-codes-${batchId}-${timestamp}-admin.md`);
    const adminContent = `# Discord Codes - Batch ${batchId}
Generated: ${new Date().toISOString()}
Total codes: ${codes.length}

## Code to Skin Mapping

${adminDoc}

## Distribution Notes
- Share codes from: ${path.basename(plainFile)}
- These codes are designed to be distributed randomly
- Players will discover which skin they get upon redemption`;
    fs.writeFileSync(adminFile, adminContent);
    
    // Update existing codes record
    const existingCodesFile = path.join(__dirname, 'existing-codes.json');
    let existingCodes = [];
    if (fs.existsSync(existingCodesFile)) {
        existingCodes = JSON.parse(fs.readFileSync(existingCodesFile, 'utf8'));
    }
    existingCodes.push(...codes.map(c => ({ code: c.code, hash: c.hash, skinId: c.skinId })));
    fs.writeFileSync(existingCodesFile, JSON.stringify(existingCodes, null, 2));
    
    return {
        plainFile,
        jsonFile,
        mappingFile,
        adminFile
    };
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    console.log(`\n🎮 Infinite Snake - Discord Code Generator with Skin Assignment`);
    console.log(`==============================================================\n`);
    
    if (command === 'list-skins') {
        // List all available skins
        const skins = getAllSkinIds();
        console.log(`📋 Available skins (${skins.length} total):\n`);
        skins.forEach((skinId, i) => {
            const skin = SKIN_DATA[skinId];
            console.log(`${i + 1}. ${skinId} - "${skin.name}" (${skin.rarity})`);
        });
        return;
    }
    
    if (command === 'generate-all') {
        // Generate codes for all skins
        const batchId = args[1] || 'all-skins-' + Date.now();
        const skins = getAllSkinIds();
        
        console.log(`Generating codes for ALL ${skins.length} skins...`);
        console.log(`Batch ID: ${batchId}\n`);
        
        const codes = generateCodesWithSkins(skins);
        const files = saveCodesWithSkins(codes, batchId);
        
        console.log(`✅ Generated ${codes.length} unique codes\n`);
        console.log(`📄 Files created:`);
        console.log(`   - Plain codes: ${path.basename(files.plainFile)}`);
        console.log(`   - Detailed JSON: ${path.basename(files.jsonFile)}`);
        console.log(`   - Code mapping: ${path.basename(files.mappingFile)}`);
        console.log(`   - Admin reference: ${path.basename(files.adminFile)}\n`);
        
        // Show rarity distribution
        const rarityCount = {};
        codes.forEach(c => {
            rarityCount[c.skinRarity] = (rarityCount[c.skinRarity] || 0) + 1;
        });
        
        console.log(`🎨 Skin rarity distribution:`);
        Object.entries(rarityCount).forEach(([rarity, count]) => {
            console.log(`   ${rarity}: ${count} codes`);
        });
        
        return;
    }
    
    if (command === 'generate-for') {
        // Generate codes for specific skins
        const skinIds = args.slice(1);
        if (skinIds.length === 0) {
            console.error('❌ Please specify skin IDs to generate codes for');
            console.log('Example: node generate-codes-with-skins.js generate-for hot-head ruby pixel');
            return;
        }
        
        const batchId = 'custom-' + Date.now();
        console.log(`Generating codes for ${skinIds.length} specific skins...`);
        console.log(`Skins: ${skinIds.join(', ')}`);
        console.log(`Batch ID: ${batchId}\n`);
        
        const codes = generateCodesWithSkins(skinIds);
        const files = saveCodesWithSkins(codes, batchId);
        
        console.log(`✅ Generated ${codes.length} unique codes\n`);
        console.log(`📄 Files created:`);
        console.log(`   - Plain codes: ${path.basename(files.plainFile)}`);
        console.log(`   - Detailed JSON: ${path.basename(files.jsonFile)}`);
        console.log(`   - Code mapping: ${path.basename(files.mappingFile)}`);
        console.log(`   - Admin reference: ${path.basename(files.adminFile)}\n`);
        
        return;
    }
    
    // Show help
    console.log(`Usage:`);
    console.log(`  node generate-codes-with-skins.js <command> [options]\n`);
    console.log(`Commands:`);
    console.log(`  list-skins              List all available skins`);
    console.log(`  generate-all [batchId]  Generate codes for all skins`);
    console.log(`  generate-for <skinIds>  Generate codes for specific skins\n`);
    console.log(`Examples:`);
    console.log(`  node generate-codes-with-skins.js list-skins`);
    console.log(`  node generate-codes-with-skins.js generate-all`);
    console.log(`  node generate-codes-with-skins.js generate-for hot-head ruby pixel`);
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { generateCodesWithSkins, simpleHash, getAllSkinIds };