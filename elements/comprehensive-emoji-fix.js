/**
 * Comprehensive emoji fix - creates proper emoji mappings and fixes all elements
 */

const fs = require('fs').promises;
const path = require('path');

// Define the correct emoji for each element
const ELEMENT_EMOJI_FIXES = {
  // Tier 0 - Base Elements (these are correct)
  1: { name: 'Fire', emoji: '🔥' },
  2: { name: 'Water', emoji: '💧' },
  3: { name: 'Earth', emoji: '🌍' },
  4: { name: 'Air', emoji: '💨' },
  
  // Tier 1 - Fix these
  5: { name: 'Steam', emoji: '♨️' },
  6: { name: 'Mud', emoji: '🟫' },
  7: { name: 'Dust', emoji: '🌫️' },
  8: { name: 'Lava', emoji: '🌋' },
  9: { name: 'Rain', emoji: '🌧️' },
  10: { name: 'Smoke', emoji: '💨' },
  11: { name: 'Ice', emoji: '🧊' },
  12: { name: 'Snow', emoji: '❄️' },
  13: { name: 'Lightning', emoji: '⚡' },
  14: { name: 'Wind', emoji: '🌬️' },
  15: { name: 'Stone', emoji: '🪨' },
  16: { name: 'Sand', emoji: '🏖️' },
  17: { name: 'Clay', emoji: '🟤' },
  18: { name: 'Mist', emoji: '🌁' },
  19: { name: 'Frost', emoji: '❄️' },
  20: { name: 'Cloud', emoji: '☁️' },
  
  // Fix specific problematic elements mentioned
  1752: { name: 'Ozone', emoji: '💨' }, // Use air/gas emoji instead of rock
  4922: { name: 'Musket', emoji: '🔫' }, // If it exists, at least use gun emoji
  4617: { name: 'Dialect', emoji: '💬' }, // If it exists, use speech emoji
};

// Define logical early-tier combinations
const EARLY_TIER_COMBINATIONS = [
  // Basic Tier 0 → Tier 1
  { a: 1, b: 2, r: 5 },    // Fire + Water = Steam
  { a: 3, b: 2, r: 6 },    // Earth + Water = Mud  
  { a: 4, b: 3, r: 7 },    // Air + Earth = Dust
  { a: 1, b: 3, r: 8 },    // Fire + Earth = Lava
  { a: 2, b: 4, r: 9 },    // Water + Air = Rain
  { a: 1, b: 4, r: 10 },   // Fire + Air = Smoke
  { a: 2, b: 19, r: 11 },  // Water + Frost = Ice
  { a: 9, b: 19, r: 12 },  // Rain + Frost = Snow
  { a: 4, b: 4, r: 14 },   // Air + Air = Wind
  { a: 3, b: 3, r: 15 },   // Earth + Earth = Stone (pressure)
  { a: 15, b: 14, r: 16 }, // Stone + Wind = Sand
  { a: 6, b: 1, r: 17 },   // Mud + Fire = Clay
  { a: 2, b: 10, r: 18 },  // Water + Smoke = Mist
  { a: 2, b: 14, r: 19 },  // Water + Wind = Frost (cold wind)
  { a: 2, b: 5, r: 20 },   // Water + Steam = Cloud
];

// Map to store the new emoji assignments
const newEmojiMap = {};
let nextEmojiId = 1000; // Start from a high number to avoid conflicts

async function loadAllData() {
  const elements = JSON.parse(await fs.readFile(path.join(__dirname, 'elements-complete.json'), 'utf8'));
  const combinations = JSON.parse(await fs.readFile(path.join(__dirname, 'combinations-logical-complete.json'), 'utf8'));
  
  // Load emoji mappings
  const emojiFiles = ['natural', 'civilization', 'modern', 'fictional'];
  const allEmojis = {};
  
  for (const category of emojiFiles) {
    try {
      const data = JSON.parse(await fs.readFile(path.join(__dirname, 'core', `emojis-${category}.json`), 'utf8'));
      Object.assign(allEmojis, data);
    } catch (e) {
      console.log(`Warning: Could not load emojis-${category}.json`);
    }
  }
  
  return { elements: elements.elements, combinations: combinations.combinations, emojis: allEmojis };
}

async function fixElements(elements, existingEmojis) {
  const fixedElements = [];
  const emojiToId = {};
  
  // Build reverse mapping of existing emojis
  for (const [id, emoji] of Object.entries(existingEmojis)) {
    emojiToId[emoji] = parseInt(id);
  }
  
  // Process each element
  for (const element of elements) {
    let fixedElement = { ...element };
    
    // Check if this element needs an emoji fix
    const fix = ELEMENT_EMOJI_FIXES[element.i];
    if (fix) {
      // Check if the emoji already exists in the mapping
      let emojiId = emojiToId[fix.emoji];
      
      if (!emojiId) {
        // Add new emoji to mapping
        emojiId = nextEmojiId++;
        newEmojiMap[emojiId] = fix.emoji;
        emojiToId[fix.emoji] = emojiId;
      }
      
      fixedElement.e = emojiId;
      console.log(`Fixed ${fix.name}: ${fix.emoji} (emoji_id: ${emojiId})`);
    }
    
    fixedElements.push(fixedElement);
  }
  
  return fixedElements;
}

async function filterCombinations(combinations, elements) {
  const elementMap = new Map(elements.map(e => [e.i, e]));
  const filteredCombos = [];
  
  // First add our logical early-tier combinations
  filteredCombos.push(...EARLY_TIER_COMBINATIONS);
  
  // Then filter existing combinations
  for (const combo of combinations) {
    const a = elementMap.get(combo.a);
    const b = elementMap.get(combo.b);
    const r = elementMap.get(combo.r);
    
    if (!a || !b || !r) continue;
    
    // Skip if this is one of our manually defined combinations
    const isDuplicate = EARLY_TIER_COMBINATIONS.some(
      ec => (ec.a === combo.a && ec.b === combo.b) || (ec.a === combo.b && ec.b === combo.a)
    );
    if (isDuplicate) continue;
    
    // Remove illogical combinations
    // 1. Result tier shouldn't jump more than 2 tiers
    const maxInputTier = Math.max(a.t, b.t);
    if (r.t > maxInputTier + 2) {
      continue;
    }
    
    // 2. Remove specific bad combinations
    if (a.n === 'Earth' && b.n === 'Stone' && r.n === 'Musket') {
      console.log('Removed: Earth + Stone = Musket');
      continue;
    }
    if ((a.n === 'Smoke' && b.n === 'Earth') || (a.n === 'Earth' && b.n === 'Smoke')) {
      if (r.n === 'Dialect') {
        console.log('Removed: Smoke + Earth = Dialect');
        continue;
      }
    }
    
    filteredCombos.push(combo);
  }
  
  return filteredCombos;
}

async function main() {
  console.log('🔧 Starting comprehensive emoji fix...\n');
  
  try {
    const { elements, combinations, emojis } = await loadAllData();
    console.log(`📊 Loaded ${elements.length} elements and ${combinations.length} combinations\n`);
    
    // Fix elements
    console.log('🎨 Fixing element emojis...');
    const fixedElements = await fixElements(elements, emojis);
    
    // Filter combinations
    console.log('\n🔗 Filtering combinations...');
    const filteredCombinations = await filterCombinations(combinations, fixedElements);
    console.log(`Kept ${filteredCombinations.length} combinations (removed ${combinations.length - filteredCombinations.length})`);
    
    // Save fixed elements
    await fs.writeFile(
      path.join(__dirname, 'elements-emoji-fixed.json'),
      JSON.stringify({
        version: '5.1-comprehensive-fix',
        generated: new Date().toISOString(),
        totalElements: fixedElements.length,
        elements: fixedElements
      }, null, 2)
    );
    
    // Save filtered combinations
    await fs.writeFile(
      path.join(__dirname, 'combinations-logical-fixed.json'),
      JSON.stringify({
        version: '5.1-logical-fix',
        generated: new Date().toISOString(),
        totalCombinations: filteredCombinations.length,
        combinations: filteredCombinations
      }, null, 2)
    );
    
    // Save new emoji mappings
    if (Object.keys(newEmojiMap).length > 0) {
      await fs.writeFile(
        path.join(__dirname, 'core', 'emojis-fixes.json'),
        JSON.stringify(newEmojiMap, null, 2)
      );
      console.log(`\n📝 Created new emoji mappings: ${Object.keys(newEmojiMap).length} new emojis`);
    }
    
    console.log('\n✅ Fix complete!');
    console.log('   - elements-emoji-fixed.json');
    console.log('   - combinations-logical-fixed.json');
    if (Object.keys(newEmojiMap).length > 0) {
      console.log('   - core/emojis-fixes.json');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();