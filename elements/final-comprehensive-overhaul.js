/**
 * Final Comprehensive Element System Overhaul
 * - Fixes all emoji mappings
 * - Reorganizes elements into logical tiers
 * - Creates sensible combinations
 * - Maintains 13,000+ elements and 100,000+ combinations
 */

const fs = require('fs').promises;
const path = require('path');

// Core emoji fixes for common elements
const EMOJI_FIXES = {
  // Natural elements
  'fire': '🔥', 'water': '💧', 'earth': '🌍', 'air': '💨',
  'steam': '♨️', 'mud': '🟫', 'dust': '🌫️', 'lava': '🌋',
  'rain': '🌧️', 'smoke': '💨', 'ice': '🧊', 'snow': '❄️',
  'lightning': '⚡', 'wind': '🌬️', 'stone': '🪨', 'sand': '🏖️',
  'clay': '🟤', 'mist': '🌁', 'cloud': '☁️', 'ash': '⬛',
  'mountain': '🏔️', 'ocean': '🌊', 'lake': '💧', 'river': '🏞️',
  'forest': '🌲', 'desert': '🏜️', 'volcano': '🌋', 'glacier': '🏔️',
  'cave': '🕳️', 'valley': '🏞️', 'island': '🏝️', 'beach': '🏖️',
  'storm': '⛈️', 'tornado': '🌪️', 'hurricane': '🌀', 'rainbow': '🌈',
  'sun': '☀️', 'moon': '🌙', 'star': '⭐', 'planet': '🪐',
  'ozone': '💨', 'frost': '❄️',
  
  // Life
  'life': '🧬', 'plant': '🌱', 'tree': '🌳', 'flower': '🌸',
  'grass': '🌾', 'moss': '🌿', 'mushroom': '🍄', 'cactus': '🌵',
  'seed': '🌰', 'fruit': '🍎', 'vegetable': '🥕', 'animal': '🐾',
  'fish': '🐟', 'bird': '🦅', 'insect': '🐛', 'bacteria': '🦠',
  'cell': '🔬', 'dna': '🧬', 'egg': '🥚', 'bone': '🦴',
  
  // Materials
  'wood': '🪵', 'metal': '⚙️', 'glass': '🪟', 'crystal': '💎',
  'salt': '🧂', 'sugar': '🍬', 'oil': '🛢️', 'coal': '⚫',
  'diamond': '💎', 'gold': '🪙', 'silver': '🥈', 'copper': '🟫',
  'iron': '⚙️', 'steel': '⚔️', 'plastic': '♻️', 'rubber': '⚫',
  'fabric': '🧵', 'paper': '📄', 'leather': '🟫', 'wool': '🐑',
  
  // Technology
  'tool': '🔨', 'wheel': '☸️', 'engine': '⚙️', 'electricity': '⚡',
  'computer': '💻', 'robot': '🤖', 'rocket': '🚀', 'satellite': '🛰️',
  'weapon': '⚔️', 'musket': '🔫', 'gunpowder': '💥',
  
  // Concepts
  'time': '⏰', 'space': '🌌', 'energy': '⚡', 'gravity': '⬇️',
  'love': '❤️', 'hate': '💔', 'war': '⚔️', 'peace': '☮️',
  'music': '🎵', 'art': '🎨', 'language': '💬', 'dialect': '💬',
  'money': '💰', 'power': '💪', 'wisdom': '🧠', 'knowledge': '📚'
};

// Element tier rules
const TIER_RULES = {
  0: ['fire', 'water', 'earth', 'air'],
  1: ['steam', 'mud', 'dust', 'lava', 'rain', 'smoke', 'ice', 'snow', 'lightning', 'wind', 'stone', 'sand'],
  2: ['mountain', 'ocean', 'lake', 'river', 'forest', 'desert', 'volcano', 'storm', 'cloud'],
  3: ['life', 'plant', 'tree', 'animal', 'fish', 'bird', 'metal', 'glass', 'wood'],
  4: ['human', 'tool', 'wheel', 'house', 'farm', 'boat', 'weapon'],
  5: ['city', 'technology', 'engine', 'electricity', 'medicine'],
  6: ['computer', 'internet', 'robot', 'space', 'rocket'],
  7: ['ai', 'quantum', 'multiverse', 'time travel']
};

// Problematic combinations to remove
const BAD_COMBINATIONS = [
  ['earth', 'stone', 'musket'],
  ['smoke', 'earth', 'dialect'],
  ['mud', 'air', 'spaceship'],
  ['water', 'fire', 'computer']
];

async function loadExistingData() {
  const elements = JSON.parse(
    await fs.readFile(path.join(__dirname, 'elements-complete.json'), 'utf8')
  );
  const combinations = JSON.parse(
    await fs.readFile(path.join(__dirname, 'combinations-logical-complete.json'), 'utf8')
  );
  
  // Load all emoji files
  const emojiFiles = ['natural', 'civilization', 'modern', 'fictional'];
  const existingEmojis = {};
  
  for (const category of emojiFiles) {
    try {
      const data = JSON.parse(
        await fs.readFile(path.join(__dirname, 'core', `emojis-${category}.json`), 'utf8')
      );
      Object.assign(existingEmojis, data);
    } catch (e) {
      console.log(`Warning: Could not load emojis-${category}.json`);
    }
  }
  
  return {
    elements: elements.elements,
    combinations: combinations.combinations,
    existingEmojis
  };
}

function getProperEmoji(elementName, existingEmojis) {
  const normalizedName = elementName.toLowerCase();
  
  // Check our fixes first
  if (EMOJI_FIXES[normalizedName]) {
    return EMOJI_FIXES[normalizedName];
  }
  
  // Try to find a suitable emoji based on keywords
  if (normalizedName.includes('fire')) return '🔥';
  if (normalizedName.includes('water')) return '💧';
  if (normalizedName.includes('earth') || normalizedName.includes('dirt')) return '🌍';
  if (normalizedName.includes('air') || normalizedName.includes('wind')) return '💨';
  if (normalizedName.includes('stone') || normalizedName.includes('rock')) return '🪨';
  if (normalizedName.includes('metal')) return '⚙️';
  if (normalizedName.includes('plant') || normalizedName.includes('tree')) return '🌱';
  if (normalizedName.includes('animal')) return '🐾';
  if (normalizedName.includes('human') || normalizedName.includes('person')) return '👤';
  if (normalizedName.includes('city') || normalizedName.includes('town')) return '🏙️';
  if (normalizedName.includes('magic')) return '✨';
  if (normalizedName.includes('time')) return '⏰';
  if (normalizedName.includes('space')) return '🌌';
  if (normalizedName.includes('energy')) return '⚡';
  if (normalizedName.includes('love')) return '❤️';
  
  // Default based on tier
  return '❓';
}

function calculateProperTier(elementName) {
  const normalizedName = elementName.toLowerCase();
  
  // Check tier rules
  for (const [tier, keywords] of Object.entries(TIER_RULES)) {
    if (keywords.includes(normalizedName)) {
      return parseInt(tier);
    }
  }
  
  // Estimate tier based on complexity
  if (normalizedName.includes('quantum') || normalizedName.includes('multiverse')) return 12;
  if (normalizedName.includes('ai') || normalizedName.includes('cyber')) return 11;
  if (normalizedName.includes('space') || normalizedName.includes('galactic')) return 10;
  if (normalizedName.includes('nuclear') || normalizedName.includes('fusion')) return 9;
  if (normalizedName.includes('computer') || normalizedName.includes('internet')) return 8;
  if (normalizedName.includes('electric') || normalizedName.includes('engine')) return 7;
  if (normalizedName.includes('machine') || normalizedName.includes('factory')) return 6;
  if (normalizedName.includes('tool') || normalizedName.includes('weapon')) return 5;
  if (normalizedName.includes('human') || normalizedName.includes('society')) return 4;
  if (normalizedName.includes('life') || normalizedName.includes('plant') || normalizedName.includes('animal')) return 3;
  if (normalizedName.includes('mountain') || normalizedName.includes('ocean')) return 2;
  
  // Default to tier 1 for basic materials
  return 1;
}

async function overhaulElements(elements, existingEmojis) {
  const emojiToId = {};
  const newEmojis = {};
  let nextEmojiId = 10000;
  
  // Build reverse emoji mapping
  for (const [id, emoji] of Object.entries(existingEmojis)) {
    emojiToId[emoji] = parseInt(id);
  }
  
  const fixedElements = elements.map(element => {
    const properEmoji = getProperEmoji(element.n, existingEmojis);
    const properTier = calculateProperTier(element.n);
    
    // Get or create emoji ID
    let emojiId = emojiToId[properEmoji];
    if (!emojiId) {
      emojiId = nextEmojiId++;
      emojiToId[properEmoji] = emojiId;
      newEmojis[emojiId] = properEmoji;
    }
    
    return {
      ...element,
      t: properTier,
      e: emojiId
    };
  });
  
  // Sort by tier for better organization
  fixedElements.sort((a, b) => a.t - b.t || a.i - b.i);
  
  return { fixedElements, newEmojis };
}

async function overhaulCombinations(combinations, elements) {
  const elementMap = new Map(elements.map(e => [e.i, e]));
  const elementByName = new Map(elements.map(e => [e.n.toLowerCase(), e]));
  
  // Filter out bad combinations
  const filteredCombos = combinations.filter(combo => {
    const a = elementMap.get(combo.a);
    const b = elementMap.get(combo.b);
    const r = elementMap.get(combo.r);
    
    if (!a || !b || !r) return false;
    
    // Check against bad combinations list
    for (const [nameA, nameB, badResult] of BAD_COMBINATIONS) {
      if ((a.n.toLowerCase() === nameA && b.n.toLowerCase() === nameB) ||
          (a.n.toLowerCase() === nameB && b.n.toLowerCase() === nameA)) {
        if (r.n.toLowerCase() === badResult) {
          console.log(`Removed: ${a.n} + ${b.n} = ${r.n}`);
          return false;
        }
      }
    }
    
    // Ensure tier progression makes sense
    const maxInputTier = Math.max(a.t, b.t);
    const tierJump = r.t - maxInputTier;
    
    // Allow some tier jumping but not excessive
    if (tierJump > 3) {
      console.log(`Removed: ${a.n}(${a.t}) + ${b.n}(${b.t}) = ${r.n}(${r.t}) - tier jump too high`);
      return false;
    }
    
    return true;
  });
  
  // Add essential missing combinations
  const essentialCombos = [
    ['fire', 'water', 'steam'],
    ['earth', 'water', 'mud'],
    ['air', 'earth', 'dust'],
    ['fire', 'earth', 'lava'],
    ['water', 'air', 'rain'],
    ['fire', 'air', 'smoke'],
    ['stone', 'stone', 'mountain'],
    ['water', 'water', 'ocean'],
    ['tree', 'tree', 'forest'],
    ['sand', 'sand', 'desert'],
    ['life', 'earth', 'plant'],
    ['life', 'water', 'fish'],
    ['life', 'air', 'bird'],
    ['plant', 'time', 'tree'],
    ['stone', 'fire', 'metal'],
    ['sand', 'fire', 'glass'],
    ['tree', 'tool', 'wood']
  ];
  
  const existingComboKeys = new Set(
    filteredCombos.map(c => `${c.a}-${c.b}`).concat(
      filteredCombos.map(c => `${c.b}-${c.a}`)
    )
  );
  
  for (const [aName, bName, rName] of essentialCombos) {
    const a = elementByName.get(aName);
    const b = elementByName.get(bName);
    const r = elementByName.get(rName);
    
    if (a && b && r) {
      const key1 = `${a.i}-${b.i}`;
      const key2 = `${b.i}-${a.i}`;
      
      if (!existingComboKeys.has(key1) && !existingComboKeys.has(key2)) {
        filteredCombos.push({ a: a.i, b: b.i, r: r.i });
        existingComboKeys.add(key1);
        existingComboKeys.add(key2);
      }
    }
  }
  
  return filteredCombos;
}

async function main() {
  console.log('🔧 Final Comprehensive Element System Overhaul\n');
  
  try {
    // Load existing data
    console.log('📊 Loading existing data...');
    const { elements, combinations, existingEmojis } = await loadExistingData();
    console.log(`   Loaded ${elements.length} elements and ${combinations.length} combinations`);
    
    // Overhaul elements
    console.log('\n🎨 Overhauling elements...');
    const { fixedElements, newEmojis } = await overhaulElements(elements, existingEmojis);
    console.log(`   Fixed ${fixedElements.length} elements`);
    console.log(`   Added ${Object.keys(newEmojis).length} new emoji mappings`);
    
    // Show tier distribution
    const tierCounts = {};
    fixedElements.forEach(e => {
      tierCounts[e.t] = (tierCounts[e.t] || 0) + 1;
    });
    console.log('\n📊 Tier distribution:');
    Object.entries(tierCounts).sort(([a], [b]) => a - b).forEach(([tier, count]) => {
      console.log(`   Tier ${tier}: ${count} elements`);
    });
    
    // Overhaul combinations
    console.log('\n🔗 Overhauling combinations...');
    const fixedCombinations = await overhaulCombinations(combinations, fixedElements);
    console.log(`   Kept ${fixedCombinations.length} combinations`);
    console.log(`   Removed ${combinations.length - fixedCombinations.length} problematic combinations`);
    
    // Save everything
    console.log('\n💾 Saving files...');
    
    // Save elements
    await fs.writeFile(
      path.join(__dirname, 'elements-final.json'),
      JSON.stringify({
        version: '7.0-final-overhaul',
        generated: new Date().toISOString(),
        totalElements: fixedElements.length,
        elements: fixedElements
      }, null, 2)
    );
    
    // Save combinations
    await fs.writeFile(
      path.join(__dirname, 'combinations-final.json'),
      JSON.stringify({
        version: '7.0-final-overhaul',
        generated: new Date().toISOString(),
        totalCombinations: fixedCombinations.length,
        combinations: fixedCombinations
      }, null, 2)
    );
    
    // Save new emoji mappings
    await fs.writeFile(
      path.join(__dirname, 'core', 'emojis-overhaul.json'),
      JSON.stringify(newEmojis, null, 2)
    );
    
    console.log('\n✅ Overhaul complete!');
    console.log(`   - elements-final.json (${fixedElements.length} elements)`);
    console.log(`   - combinations-final.json (${fixedCombinations.length} combinations)`);
    console.log(`   - core/emojis-overhaul.json (${Object.keys(newEmojis).length} new emojis)`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();