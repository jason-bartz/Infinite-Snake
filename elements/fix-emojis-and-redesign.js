/**
 * Script to fix emoji mappings and redesign element system
 * This will create new element and combination files with proper emojis and logical progression
 */

const fs = require('fs').promises;
const path = require('path');

// Correct emoji mappings for base elements and common materials
const CORRECT_EMOJI_MAPPINGS = {
  // Tier 0 - Primordial (already correct)
  'Fire': '🔥',
  'Water': '💧', 
  'Earth': '🌍',
  'Air': '💨',
  
  // Tier 1 - Basic Natural
  'Steam': '♨️',
  'Mud': '🟫',
  'Dust': '🌫️',
  'Lava': '🌋',
  'Rain': '🌧️',
  'Smoke': '💨',
  'Ice': '🧊',
  'Snow': '❄️',
  'Lightning': '⚡',
  'Wind': '🌬️',
  'Stone': '🪨',
  'Sand': '🏖️',
  'Clay': '🟤',
  'Mist': '🌁',
  'Frost': '❄️',
  'Cloud': '☁️',
  
  // Tier 2 - Complex Natural
  'Mountain': '🏔️',
  'Ocean': '🌊',
  'Lake': '💧',
  'River': '🏞️',
  'Forest': '🌲',
  'Desert': '🏜️',
  'Swamp': '🌿',
  'Volcano': '🌋',
  'Glacier': '🏔️',
  'Cave': '🕳️',
  'Valley': '🏞️',
  'Island': '🏝️',
  'Beach': '🏖️',
  'Oasis': '🌴',
  'Geyser': '♨️',
  'Waterfall': '💦',
  
  // Tier 3 - Life & Basic Technology  
  'Plant': '🌱',
  'Tree': '🌳',
  'Flower': '🌸',
  'Grass': '🌾',
  'Animal': '🐾',
  'Fish': '🐟',
  'Bird': '🦅',
  'Seed': '🌰',
  'Wood': '🪵',
  'Metal': '⚙️',
  'Glass': '🪟',
  'Wheel': '☸️',
  'Tool': '🔨',
  'Fire Pit': '🔥',
  'Shelter': '🏠',
  'Rope': '🪢'
};

// Logical combinations for early tiers
const LOGICAL_COMBINATIONS = [
  // Tier 0 → Tier 1
  { a: 'Fire', b: 'Water', result: 'Steam' },
  { a: 'Earth', b: 'Water', result: 'Mud' },
  { a: 'Air', b: 'Earth', result: 'Dust' },
  { a: 'Fire', b: 'Earth', result: 'Lava' },
  { a: 'Water', b: 'Air', result: 'Rain' },
  { a: 'Fire', b: 'Air', result: 'Smoke' },
  { a: 'Water', b: 'Cold', result: 'Ice' },
  { a: 'Rain', b: 'Cold', result: 'Snow' },
  { a: 'Fire', b: 'Air', result: 'Lightning', condition: 'storm' },
  { a: 'Air', b: 'Air', result: 'Wind' },
  { a: 'Earth', b: 'Pressure', result: 'Stone' },
  { a: 'Stone', b: 'Wind', result: 'Sand' },
  
  // Tier 1 → Tier 2
  { a: 'Stone', b: 'Stone', result: 'Mountain' },
  { a: 'Water', b: 'Water', result: 'Ocean' },
  { a: 'Water', b: 'Earth', result: 'Lake' },
  { a: 'Water', b: 'Mountain', result: 'River' },
  { a: 'Tree', b: 'Tree', result: 'Forest' },
  { a: 'Sand', b: 'Sand', result: 'Desert' },
  { a: 'Water', b: 'Mud', result: 'Swamp' },
  { a: 'Mountain', b: 'Lava', result: 'Volcano' },
  { a: 'Ice', b: 'Mountain', result: 'Glacier' },
  { a: 'Stone', b: 'Water', result: 'Cave' },
  
  // Tier 2 → Tier 3
  { a: 'Earth', b: 'Rain', result: 'Plant' },
  { a: 'Plant', b: 'Time', result: 'Tree' },
  { a: 'Plant', b: 'Sun', result: 'Flower' },
  { a: 'Earth', b: 'Plant', result: 'Grass' },
  { a: 'Life', b: 'Earth', result: 'Animal' },
  { a: 'Life', b: 'Water', result: 'Fish' },
  { a: 'Life', b: 'Air', result: 'Bird' },
  { a: 'Tree', b: 'Tool', result: 'Wood' },
  { a: 'Stone', b: 'Fire', result: 'Metal' },
  { a: 'Sand', b: 'Fire', result: 'Glass' },
  
  // Remove problematic combinations
  // NO: Earth + Stone = Musket (too advanced)
  // NO: Smoke + Earth = Dialect (nonsensical)
];

async function loadCurrentData() {
  try {
    const elementsData = await fs.readFile(path.join(__dirname, 'elements-complete.json'), 'utf8');
    const elements = JSON.parse(elementsData);
    
    const combinationsData = await fs.readFile(path.join(__dirname, 'combinations-logical-complete.json'), 'utf8');
    const combinations = JSON.parse(combinationsData);
    
    return { elements: elements.elements, combinations: combinations.combinations };
  } catch (error) {
    console.error('Error loading current data:', error);
    throw error;
  }
}

async function createEmojiMapping() {
  // Load all emoji files
  const emojiFiles = [
    'core/emojis-natural.json',
    'core/emojis-civilization.json', 
    'core/emojis-modern.json',
    'core/emojis-fictional.json'
  ];
  
  const allEmojis = {};
  
  for (const file of emojiFiles) {
    try {
      const data = await fs.readFile(path.join(__dirname, file), 'utf8');
      const emojis = JSON.parse(data);
      Object.assign(allEmojis, emojis);
    } catch (error) {
      console.log(`Warning: Could not load ${file}`);
    }
  }
  
  // Create reverse mapping (emoji → ID)
  const emojiToId = {};
  for (const [id, emoji] of Object.entries(allEmojis)) {
    emojiToId[emoji] = id;
  }
  
  return { allEmojis, emojiToId };
}

async function fixElementEmojis(elements, emojiMapping) {
  const { allEmojis, emojiToId } = emojiMapping;
  const fixedElements = [];
  
  for (const element of elements) {
    const fixedElement = { ...element };
    
    // Check if we have a correct emoji mapping
    const correctEmoji = CORRECT_EMOJI_MAPPINGS[element.n];
    if (correctEmoji) {
      // Find the emoji ID for the correct emoji
      const correctEmojiId = emojiToId[correctEmoji];
      if (correctEmojiId) {
        fixedElement.e = parseInt(correctEmojiId);
      } else {
        console.log(`Warning: No emoji ID found for ${correctEmoji} (${element.n})`);
      }
    }
    
    fixedElements.push(fixedElement);
  }
  
  return fixedElements;
}

async function createLogicalCombinations(elements) {
  const elementsByName = new Map();
  elements.forEach(el => elementsByName.set(el.n, el));
  
  const newCombinations = [];
  
  // Add logical combinations
  for (const combo of LOGICAL_COMBINATIONS) {
    const elementA = elementsByName.get(combo.a);
    const elementB = elementsByName.get(combo.b);
    const resultElement = elementsByName.get(combo.result);
    
    if (elementA && elementB && resultElement) {
      newCombinations.push({
        a: elementA.i,
        b: elementB.i,
        r: resultElement.i
      });
    }
  }
  
  return newCombinations;
}

async function main() {
  console.log('🔧 Starting emoji fix and element redesign...');
  
  try {
    // Load current data
    const { elements, combinations } = await loadCurrentData();
    console.log(`📊 Loaded ${elements.length} elements and ${combinations.length} combinations`);
    
    // Create emoji mapping
    const emojiMapping = await createEmojiMapping();
    console.log('🎨 Created emoji mapping');
    
    // Fix element emojis
    const fixedElements = await fixElementEmojis(elements, emojiMapping);
    console.log('✅ Fixed element emojis');
    
    // Create logical combinations for early tiers
    const logicalCombos = await createLogicalCombinations(fixedElements);
    console.log(`🔗 Created ${logicalCombos.length} logical combinations`);
    
    // Filter out problematic combinations
    const filteredCombinations = combinations.filter(combo => {
      // Remove Earth + Stone = Musket type combinations
      const el1 = fixedElements.find(e => e.i === combo.a);
      const el2 = fixedElements.find(e => e.i === combo.b);
      const result = fixedElements.find(e => e.i === combo.r);
      
      if (!el1 || !el2 || !result) return true; // Keep if we can't verify
      
      // Remove if result tier is too high compared to inputs
      const maxInputTier = Math.max(el1.t, el2.t);
      if (result.t > maxInputTier + 2) {
        console.log(`Removing: ${el1.n} + ${el2.n} = ${result.n} (tier jump too high)`);
        return false;
      }
      
      return true;
    });
    
    // Merge logical combos with filtered existing ones
    const finalCombinations = [...logicalCombos];
    const comboKeys = new Set(logicalCombos.map(c => `${c.a}-${c.b}`));
    
    for (const combo of filteredCombinations) {
      const key = `${combo.a}-${combo.b}`;
      const reverseKey = `${combo.b}-${combo.a}`;
      if (!comboKeys.has(key) && !comboKeys.has(reverseKey)) {
        finalCombinations.push(combo);
        comboKeys.add(key);
      }
    }
    
    // Save fixed elements
    const elementsOutput = {
      version: "5.0-emoji-fixed",
      generated: new Date().toISOString(),
      totalElements: fixedElements.length,
      elements: fixedElements
    };
    
    await fs.writeFile(
      path.join(__dirname, 'elements-fixed.json'),
      JSON.stringify(elementsOutput, null, 2)
    );
    
    // Save logical combinations
    const combinationsOutput = {
      version: "5.0-logical-fixed", 
      generated: new Date().toISOString(),
      totalCombinations: finalCombinations.length,
      combinations: finalCombinations
    };
    
    await fs.writeFile(
      path.join(__dirname, 'combinations-fixed.json'),
      JSON.stringify(combinationsOutput, null, 2)
    );
    
    console.log('✅ Complete! Created:');
    console.log(`   - elements-fixed.json (${fixedElements.length} elements)`);
    console.log(`   - combinations-fixed.json (${finalCombinations.length} combinations)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();