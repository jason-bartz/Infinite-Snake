const fs = require('fs');
const path = require('path');

// Read all combination files
const combinationFiles = fs.readdirSync('.')
  .filter(f => f.startsWith('combinations-') && f.endsWith('.json'));

// Count combinations per element
const elementCombinations = {};
let totalCombinations = 0;

combinationFiles.forEach(file => {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.combinations && Array.isArray(data.combinations)) {
      data.combinations.forEach(combo => {
        totalCombinations++;
        const result = combo.result;
        if (!elementCombinations[result]) {
          elementCombinations[result] = [];
        }
        elementCombinations[result].push({
          file: file,
          elements: combo.elements,
          description: combo.description
        });
      });
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
});

// Find elements with most combinations
const sortedElements = Object.entries(elementCombinations)
  .map(([id, combos]) => ({ id: parseInt(id), paths: combos.length, combinations: combos }))
  .sort((a, b) => b.paths - a.paths);

console.log('\n=== COMBINATION ANALYSIS ===');
console.log(`Total combinations: ${totalCombinations}`);
console.log(`Unique result elements: ${Object.keys(elementCombinations).length}`);
console.log('\nTop 20 elements with most creation paths:');
sortedElements.slice(0, 20).forEach(elem => {
  console.log(`\nElement ID ${elem.id}: ${elem.paths} paths`);
  elem.combinations.slice(0, 5).forEach(combo => {
    console.log(`  - ${combo.description || `[${combo.elements.join(' + ')}]`} (from ${combo.file})`);
  });
  if (elem.paths > 5) {
    console.log(`  ... and ${elem.paths - 5} more`);
  }
});

// Calculate average paths per element
const avgPaths = totalCombinations / Object.keys(elementCombinations).length;
console.log(`\nAverage paths per element: ${avgPaths.toFixed(2)}`);

// Distribution analysis
const distribution = {};
sortedElements.forEach(elem => {
  const pathCount = elem.paths;
  if (!distribution[pathCount]) {
    distribution[pathCount] = 0;
  }
  distribution[pathCount]++;
});

console.log('\nPath count distribution:');
Object.entries(distribution).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([paths, count]) => {
  console.log(`  ${paths} path(s): ${count} elements`);
});