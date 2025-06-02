// Quick verification script to check if the updated loading system works

// Simulate the game's loading logic
async function verifyUpdates() {
    console.log('=== Verifying Element Loading Updates ===\n');
    
    // Test 1: Load and merge essential elements
    console.log('Test 1: Loading essential elements...');
    try {
        const response = await fetch('elements-essential.json');
        const data = await response.json();
        
        const ALL_ELEMENTS = {};
        if (data.basicElements) Object.assign(ALL_ELEMENTS, data.basicElements);
        if (data.tier1Elements) Object.assign(ALL_ELEMENTS, data.tier1Elements);
        if (data.tier2Elements) Object.assign(ALL_ELEMENTS, data.tier2Elements);
        
        console.log(`✓ Loaded ${Object.keys(ALL_ELEMENTS).length} elements from essential file`);
        console.log(`✓ Combinations: ${Object.keys(data.combinations || {}).length}`);
        
        // Verify basic elements exist
        const basicKeys = ['fire', 'water', 'earth', 'air'];
        const missingBasics = basicKeys.filter(key => !ALL_ELEMENTS[key]);
        if (missingBasics.length === 0) {
            console.log('✓ All basic elements present');
        } else {
            console.log(`✗ Missing basic elements: ${missingBasics.join(', ')}`);
        }
    } catch (error) {
        console.log('✗ Failed to load essential elements:', error.message);
    }
    
    // Test 2: Load manifest
    console.log('\nTest 2: Loading manifest...');
    try {
        const response = await fetch('elements-database-consolidated.json');
        const manifest = await response.json();
        
        console.log(`✓ Loaded manifest with ${Object.keys(manifest.chunkManifest).length} chunks`);
        
        // Verify chunk files exist
        const chunkFiles = Object.values(manifest.chunkManifest).map(c => c.file);
        console.log('✓ Chunk files defined:', chunkFiles.join(', '));
    } catch (error) {
        console.log('✗ Failed to load manifest:', error.message);
    }
    
    // Test 3: Simulate chunk loading
    console.log('\nTest 3: Testing chunk loading simulation...');
    const chunkFileMapping = {
        'intermediate': 'elements-intermediate.json',
        'advanced': 'elements-advanced.json',
        'pokemon': 'elements-pokemon.json',
        'fictional': 'elements-fictional.json',
        'special': 'elements-special.json'
    };
    
    for (const [chunkId, fileName] of Object.entries(chunkFileMapping)) {
        try {
            const response = await fetch(fileName);
            if (response.ok) {
                console.log(`✓ Chunk '${chunkId}' (${fileName}) is accessible`);
            } else {
                console.log(`✗ Chunk '${chunkId}' (${fileName}) returned ${response.status}`);
            }
        } catch (error) {
            console.log(`✗ Chunk '${chunkId}' (${fileName}) failed:`, error.message);
        }
    }
    
    console.log('\n=== Verification Complete ===');
}

// Run in Node.js if available, otherwise in browser
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    verifyUpdates();
} else {
    // Browser environment
    verifyUpdates();
}