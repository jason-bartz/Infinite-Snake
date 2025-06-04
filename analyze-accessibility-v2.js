const fs = require('fs');
const path = require('path');

async function analyze() {
    // Load manifest
    const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'elements/manifest.json'), 'utf8'));
    
    // Load all elements
    let allElements = {};
    let allCombinations = [];
    
    // Process each pack
    for (const pack of manifest.packs) {
        if (pack.enabled) {
            console.log(`Processing pack: ${pack.name}`);
            
            // Load elements
            if (pack.elements) {
                try {
                    const elementsPath = path.join(__dirname, 'elements', pack.elements);
                    const data = JSON.parse(fs.readFileSync(elementsPath, 'utf8'));
                    if (data.elements) {
                        Object.assign(allElements, data.elements);
                    } else {
                        Object.assign(allElements, data);
                    }
                } catch (e) {
                    console.error(`Error loading elements from ${pack.elements}:`, e.message);
                }
            }
            
            // Load combinations
            if (pack.combinations) {
                try {
                    const combosPath = path.join(__dirname, 'elements', pack.combinations);
                    const data = JSON.parse(fs.readFileSync(combosPath, 'utf8'));
                    
                    if (data.combinations) {
                        for (const combo of data.combinations) {
                            // Support both 'sources' and 'elements' field names
                            const sources = combo.sources || combo.elements;
                            if (sources && combo.result) {
                                allCombinations.push({
                                    elements: sources,
                                    result: combo.result
                                });
                            }
                        }
                    }
                    
                    // Also process combinationIndex if present
                    if (data.combinationIndex) {
                        for (const [key, resultId] of Object.entries(data.combinationIndex)) {
                            const [id1, id2] = key.split(/[-,]/).map(Number);
                            if (!isNaN(id1) && !isNaN(id2) && !isNaN(resultId)) {
                                allCombinations.push({
                                    elements: [id1, id2],
                                    result: resultId
                                });
                            }
                        }
                    }
                } catch (e) {
                    console.error(`Error loading combinations from ${pack.combinations}:`, e.message);
                }
            }
        }
    }
    
    console.log(`\nLoaded ${Object.keys(allElements).length} elements and ${allCombinations.length} combinations\n`);
    
    // Find obtainable elements
    const obtainableElements = new Set();
    const baseElements = new Set();
    
    // First, mark all base elements as obtainable
    for (const [id, element] of Object.entries(allElements)) {
        if (element.base === true) {
            obtainableElements.add(parseInt(id));
            baseElements.add(parseInt(id));
        }
    }
    
    console.log(`Found ${baseElements.size} base elements`);
    
    // Iteratively find obtainable elements
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 100) {
        changed = false;
        iterations++;
        let newFound = 0;
        
        for (const combo of allCombinations) {
            const elem1 = parseInt(combo.elements[0]);
            const elem2 = parseInt(combo.elements[1]);
            const result = parseInt(combo.result);
            
            if (obtainableElements.has(elem1) && obtainableElements.has(elem2)) {
                if (!obtainableElements.has(result)) {
                    obtainableElements.add(result);
                    changed = true;
                    newFound++;
                }
            }
        }
        
        if (changed) {
            console.log(`Iteration ${iterations}: Found ${newFound} new obtainable elements`);
        }
    }
    
    // Find inaccessible elements
    const inaccessibleElements = [];
    for (const [id, element] of Object.entries(allElements)) {
        if (!obtainableElements.has(parseInt(id))) {
            inaccessibleElements.push({
                id: parseInt(id),
                key: element.key,
                name: element.name,
                emoji: element.emoji,
                tier: element.tier,
                category: element.category || 'unknown'
            });
        }
    }
    
    // Sort by category and tier
    inaccessibleElements.sort((a, b) => {
        const catA = a.category || 'unknown';
        const catB = b.category || 'unknown';
        if (catA !== catB) return catA.localeCompare(catB);
        if (a.tier !== b.tier) return (a.tier || 0) - (b.tier || 0);
        return (a.name || '').localeCompare(b.name || '');
    });
    
    // Generate report
    console.log(`\n=== ELEMENT ACCESSIBILITY REPORT ===`);
    console.log(`Total elements: ${Object.keys(allElements).length}`);
    console.log(`Base elements: ${baseElements.size}`);
    console.log(`Obtainable elements: ${obtainableElements.size}`);
    console.log(`Inaccessible elements: ${inaccessibleElements.length}`);
    console.log(`Accessibility rate: ${(obtainableElements.size / Object.keys(allElements).length * 100).toFixed(1)}%`);
    
    // Group by category
    const byCategory = {};
    for (const elem of inaccessibleElements) {
        if (!byCategory[elem.category]) byCategory[elem.category] = [];
        byCategory[elem.category].push(elem);
    }
    
    console.log(`\n=== INACCESSIBLE ELEMENTS BY CATEGORY ===`);
    let sampleCount = 0;
    for (const [category, elements] of Object.entries(byCategory)) {
        console.log(`\n${category.toUpperCase()} (${elements.length} elements):`);
        // Show first 5 elements as samples
        for (let i = 0; i < Math.min(5, elements.length); i++) {
            const elem = elements[i];
            console.log(`  ${elem.id}: ${elem.name} ${elem.emoji} (tier ${elem.tier})`);
        }
        if (elements.length > 5) {
            console.log(`  ... and ${elements.length - 5} more`);
        }
    }
    
    // Save detailed report
    const report = {
        summary: {
            totalElements: Object.keys(allElements).length,
            baseElements: baseElements.size,
            obtainableElements: obtainableElements.size,
            inaccessibleElements: inaccessibleElements.length,
            accessibilityRate: (obtainableElements.size / Object.keys(allElements).length * 100).toFixed(1) + '%'
        },
        inaccessibleByCategory: byCategory,
        inaccessibleElements: inaccessibleElements
    };
    
    fs.writeFileSync('accessibility-report-v2.json', JSON.stringify(report, null, 2));
    console.log('\nDetailed report saved to accessibility-report-v2.json');
}

// Run the analysis
analyze().catch(console.error);