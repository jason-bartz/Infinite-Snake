const fs = require('fs');
const path = require('path');

// Load all elements
const elementFiles = [
    'elements-core.json',
    'elements-nature.json', 
    'elements-technology.json',
    'elements-magic.json',
    'elements-cosmic.json',
    'elements-abstract.json',
    'elements-material.json',
    'elements-fictional.json',
    'elements-fictional-expanded.json',
    'elements-pokemon-expanded.json',
    'elements-missing-core.json'
];

// Load all combination files
const combinationFiles = [
    'combinations-core.json',
    'combinations-nature.json',
    'combinations-technology.json', 
    'combinations-magic.json',
    'combinations-cosmic.json',
    'combinations-abstract.json',
    'combinations-material.json',
    'combinations-fictional.json',
    'combinations-fictional-expanded.json',
    'combinations-pokemon-expanded.json',
    'combinations-cross-pack.json',
    'combinations-fictional-cross.json',
    'combinations-fictional-expanded-cross.json',
    'combinations-pokemon-expanded-cross.json',
    'combinations-orphan-fixes.json',
    'combinations-critical-fixes.json'
];

const elementsDir = path.join(__dirname, 'elements');

// Load all elements
let allElements = {};
for (const file of elementFiles) {
    try {
        const filePath = path.join(elementsDir, file);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            // Handle both direct element objects and wrapped format
            if (data.elements) {
                Object.assign(allElements, data.elements);
            } else {
                Object.assign(allElements, data);
            }
        }
    } catch (e) {
        console.error(`Error loading ${file}:`, e.message);
    }
}

// Load all combinations to find obtainable elements
const obtainableElements = new Set();
const baseElements = new Set();

// First, mark all base elements as obtainable
for (const [id, element] of Object.entries(allElements)) {
    if (element.base === true) {
        obtainableElements.add(parseInt(id));
        baseElements.add(parseInt(id));
    }
}

// Load all combinations
let allCombinations = [];
for (const file of combinationFiles) {
    try {
        const filePath = path.join(elementsDir, file);
        if (fs.existsSync(filePath)) {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (data.combinations) {
                allCombinations.push(...data.combinations);
            }
        }
    } catch (e) {
        console.error(`Error loading ${file}:`, e.message);
    }
}

// Iteratively find obtainable elements
let changed = true;
let iterations = 0;
while (changed && iterations < 100) {
    changed = false;
    iterations++;
    
    for (const combo of allCombinations) {
        if (!combo.elements || combo.elements.length < 2) continue;
        
        const elem1 = parseInt(combo.elements[0]);
        const elem2 = parseInt(combo.elements[1]);
        const result = parseInt(combo.result);
        
        if (obtainableElements.has(elem1) && obtainableElements.has(elem2)) {
            if (!obtainableElements.has(result)) {
                obtainableElements.add(result);
                changed = true;
            }
        }
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
for (const [category, elements] of Object.entries(byCategory)) {
    console.log(`\n${category.toUpperCase()} (${elements.length} elements):`);
    for (const elem of elements) {
        console.log(`  ${elem.id}: ${elem.name} ${elem.emoji} (tier ${elem.tier})`);
    }
}

// Find patterns in Pokemon
const inaccessiblePokemon = inaccessibleElements.filter(e => 
    e.id >= 536 && e.id <= 686 && e.name.toLowerCase().includes('mon')
);

if (inaccessiblePokemon.length > 0) {
    console.log(`\n=== INACCESSIBLE POKEMON (${inaccessiblePokemon.length}) ===`);
    console.log(inaccessiblePokemon.map(p => `${p.id}: ${p.name}`).join(', '));
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

fs.writeFileSync('accessibility-report.json', JSON.stringify(report, null, 2));
console.log('\nDetailed report saved to accessibility-report.json');