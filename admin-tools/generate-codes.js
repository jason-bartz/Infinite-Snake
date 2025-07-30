#!/usr/bin/env node

// Discord Code Generator - Admin Tool
// This script generates Discord unlock codes for distribution

const fs = require('fs');
const path = require('path');

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

// Generate codes
function generateCodes(count = 10, prefix = 'DISCORD-2025-') {
    const codes = [];
    const usedSuffixes = new Set();
    
    while (codes.length < count) {
        const suffix = generateSuffix();
        
        // Ensure unique suffixes
        if (usedSuffixes.has(suffix)) continue;
        usedSuffixes.add(suffix);
        
        const fullCode = prefix + suffix;
        const hash = simpleHash(fullCode);
        
        codes.push({
            code: fullCode,
            hash: hash,
            created: new Date().toISOString()
        });
    }
    
    return codes;
}

// Save codes to files
function saveCodes(codes, batchId) {
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
    const jsonFile = path.join(outputDir, `discord-codes-${batchId}-${timestamp}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(codes, null, 2));
    
    // Generate JavaScript array for codeValidator.js
    const jsHashes = codes.map(c => `            '${c.hash}', // ${c.code}`).join('\n');
    const jsFile = path.join(outputDir, `discord-codes-${batchId}-${timestamp}-hashes.js`);
    const jsContent = `// Add these hashes to the VALID_CODES array in codeValidator.js
// Generated: ${new Date().toISOString()}
// Batch ID: ${batchId}

${jsHashes}`;
    fs.writeFileSync(jsFile, jsContent);
    
    return {
        plainFile,
        jsonFile,
        jsFile
    };
}

// Main execution
function main() {
    const args = process.argv.slice(2);
    const count = parseInt(args[0]) || 10;
    const batchId = args[1] || 'batch-' + Date.now();
    
    console.log(`\n🎮 Infinite Snake - Discord Code Generator`);
    console.log(`=========================================`);
    console.log(`Generating ${count} codes...`);
    console.log(`Batch ID: ${batchId}\n`);
    
    const codes = generateCodes(count);
    const files = saveCodes(codes, batchId);
    
    console.log(`✅ Generated ${codes.length} unique codes\n`);
    console.log(`📄 Files created:`);
    console.log(`   - Plain codes: ${path.basename(files.plainFile)}`);
    console.log(`   - JSON record: ${path.basename(files.jsonFile)}`);
    console.log(`   - JS hashes: ${path.basename(files.jsFile)}\n`);
    
    console.log(`📋 Sample codes:`);
    codes.slice(0, 5).forEach(c => {
        console.log(`   ${c.code} → ${c.hash}`);
    });
    
    if (codes.length > 5) {
        console.log(`   ... and ${codes.length - 5} more\n`);
    }
    
    console.log(`\n💡 Next steps:`);
    console.log(`1. Copy the hashes from ${path.basename(files.jsFile)} to codeValidator.js`);
    console.log(`2. Share codes from ${path.basename(files.plainFile)} in Discord`);
    console.log(`3. Keep ${path.basename(files.jsonFile)} for your records\n`);
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { generateCodes, simpleHash };