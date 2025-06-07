#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

class ExpandedCombinationGenerator {
  constructor() {
    this.elements = [];
    this.existingCombinations = new Map();
    this.newCombinations = [];
    this.elementsByTier = new Map();
    this.elementsByName = new Map();
    
    // Target paths per element for balanced gameplay
    this.targetPaths = {
      0: { min: 8, max: 12 },    // Base elements - many paths
      1: { min: 6, max: 10 },    // Tier 1 - lots of paths
      2: { min: 5, max: 8 },     // Tier 2 - good variety
      3: { min: 4, max: 6 },     // Tier 3 - moderate paths
      4: { min: 3, max: 5 },     // Tier 4 - moderate paths
      5: { min: 3, max: 4 },     // Tier 5 - moderate paths
      6: { min: 2, max: 3 },     // Tier 6+ - fewer paths
      7: { min: 2, max: 3 },
      8: { min: 2, max: 3 },
      9: { min: 1, max: 2 },
      10: { min: 1, max: 2 },
      11: { min: 1, max: 2 },
      12: { min: 1, max: 2 }
    };
  }

  async loadData() {
    console.log('📚 Loading existing data...');
    
    // Load elements
    const elementsData = JSON.parse(await fs.readFile('elements-complete.json', 'utf8'));
    this.elements = elementsData.elements;
    
    // Load existing combinations
    const combosData = JSON.parse(await fs.readFile('combinations-massive.json', 'utf8'));
    
    // Index elements
    this.elements.forEach(el => {
      if (!this.elementsByTier.has(el.t)) {
        this.elementsByTier.set(el.t, []);
      }
      this.elementsByTier.get(el.t).push(el);
      this.elementsByName.set(el.n.toLowerCase(), el);
    });
    
    // Index existing combinations
    combosData.combinations.forEach(combo => {
      const key = `${combo.a}-${combo.b}`;
      this.existingCombinations.set(key, combo.r);
    });
    
    console.log(`✓ Loaded ${this.elements.length} elements and ${combosData.combinations.length} existing combinations`);
  }

  async generateExpandedCombinations() {
    console.log('\n🔧 Generating expanded combinations for balanced gameplay...\n');
    
    // Start with existing combinations
    this.existingCombinations.forEach((resultId, key) => {
      const [a, b] = key.split('-').map(Number);
      this.newCombinations.push({ a, b, r: resultId });
    });
    
    // Generate combinations tier by tier
    for (let tier = 0; tier <= 12; tier++) {
      await this.generateTierCombinations(tier);
    }
    
    // Add cross-tier combinations for natural progression
    await this.generateCrossTierCombinations();
    
    // Add thematic combinations
    await this.generateThematicCombinations();
    
    console.log(`\n✨ Total combinations generated: ${this.newCombinations.length}`);
  }

  async generateTierCombinations(tier) {
    const tierElements = this.elementsByTier.get(tier) || [];
    if (tierElements.length === 0) return;
    
    console.log(`\n🎯 Tier ${tier}: ${tierElements.length} elements`);
    
    const targetMin = this.targetPaths[tier].min;
    const targetMax = this.targetPaths[tier].max;
    
    let totalGenerated = 0;
    
    for (const element of tierElements) {
      const currentPaths = this.countExistingPaths(element.i);
      const targetPaths = Math.floor(Math.random() * (targetMax - targetMin + 1)) + targetMin;
      const needed = Math.max(0, targetPaths - currentPaths);
      
      if (needed > 0) {
        const generated = this.generatePathsForElement(element, needed, tier);
        totalGenerated += generated;
      }
    }
    
    console.log(`   ✓ Generated ${totalGenerated} new combinations`);
  }

  countExistingPaths(elementId) {
    let count = 0;
    this.newCombinations.forEach(combo => {
      if (combo.r === elementId) count++;
    });
    return count;
  }

  generatePathsForElement(element, needed, tier) {
    let generated = 0;
    const attempts = needed * 10;
    
    // Get potential ingredients based on tier
    const ingredients = this.getIngredientPool(tier);
    
    for (let i = 0; i < attempts && generated < needed; i++) {
      const combo = this.createLogicalCombination(element, ingredients, tier);
      if (combo && this.isValidNewCombination(combo)) {
        this.newCombinations.push(combo);
        generated++;
      }
    }
    
    return generated;
  }

  getIngredientPool(resultTier) {
    const pool = [];
    
    // Add elements from lower tiers
    for (let t = 0; t <= Math.min(resultTier, 12); t++) {
      const tierElements = this.elementsByTier.get(t) || [];
      pool.push(...tierElements);
    }
    
    return pool;
  }

  createLogicalCombination(resultElement, pool, tier) {
    const strategies = [
      () => this.createElementalCombination(resultElement, pool, tier),
      () => this.createProgressionCombination(resultElement, pool, tier),
      () => this.createThematicCombination(resultElement, pool, tier),
      () => this.createCategoricalCombination(resultElement, pool, tier)
    ];
    
    const strategy = strategies[Math.floor(Math.random() * strategies.length)];
    return strategy();
  }

  createElementalCombination(result, pool, tier) {
    // For elemental combinations (especially good for Tiers 0-2)
    const elementalPairs = [
      ['fire', 'water', ['steam', 'mist', 'fog', 'vapor']],
      ['fire', 'earth', ['lava', 'magma', 'volcano', 'ash']],
      ['fire', 'air', ['smoke', 'heat', 'plasma', 'energy']],
      ['water', 'earth', ['mud', 'clay', 'swamp', 'soil']],
      ['water', 'air', ['rain', 'cloud', 'storm', 'mist']],
      ['earth', 'air', ['dust', 'sand', 'erosion', 'desert']],
      ['fire', 'ice', ['water', 'steam', 'thaw', 'melt']],
      ['water', 'cold', ['ice', 'snow', 'frost', 'glacier']],
      ['earth', 'water', ['plant', 'life', 'moss', 'algae']],
      ['life', 'time', ['evolution', 'growth', 'change', 'adaptation']]
    ];
    
    const resultName = result.n.toLowerCase();
    
    for (const [elem1, elem2, results] of elementalPairs) {
      if (results.some(r => resultName.includes(r))) {
        const ingredient1 = pool.find(el => el.n.toLowerCase().includes(elem1));
        const ingredient2 = pool.find(el => el.n.toLowerCase().includes(elem2));
        
        if (ingredient1 && ingredient2 && ingredient1.i !== ingredient2.i) {
          return {
            a: Math.min(ingredient1.i, ingredient2.i),
            b: Math.max(ingredient1.i, ingredient2.i),
            r: result.i
          };
        }
      }
    }
    
    return null;
  }

  createProgressionCombination(result, pool, tier) {
    // Natural progression: combine lower tier elements to get higher tier
    if (tier === 0) return null;
    
    const lowerTier = tier - 1;
    const lowerElements = pool.filter(el => el.t === lowerTier);
    
    if (lowerElements.length >= 2) {
      // Find elements that logically combine
      const resultWords = new Set(result.n.toLowerCase().split(/\s+/));
      
      // Try to find two elements that share words with result
      for (let i = 0; i < Math.min(lowerElements.length, 20); i++) {
        const elem1 = lowerElements[i];
        const elem1Words = new Set(elem1.n.toLowerCase().split(/\s+/));
        
        for (let j = i + 1; j < Math.min(lowerElements.length, 20); j++) {
          const elem2 = lowerElements[j];
          const elem2Words = new Set(elem2.n.toLowerCase().split(/\s+/));
          
          // Check if combined they relate to result
          const combined = new Set([...elem1Words, ...elem2Words]);
          const overlap = [...resultWords].filter(w => combined.has(w));
          
          if (overlap.length > 0 || Math.random() < 0.1) {
            return {
              a: Math.min(elem1.i, elem2.i),
              b: Math.max(elem1.i, elem2.i),
              r: result.i
            };
          }
        }
      }
    }
    
    // Fallback: random from lower tier
    if (lowerElements.length >= 2) {
      const elem1 = lowerElements[Math.floor(Math.random() * lowerElements.length)];
      const elem2 = lowerElements[Math.floor(Math.random() * lowerElements.length)];
      
      if (elem1.i !== elem2.i) {
        return {
          a: Math.min(elem1.i, elem2.i),
          b: Math.max(elem1.i, elem2.i),
          r: result.i
        };
      }
    }
    
    return null;
  }

  createThematicCombination(result, pool, tier) {
    // Thematic combinations based on categories
    const themes = {
      nature: ['tree', 'plant', 'animal', 'forest', 'ocean', 'mountain', 'river'],
      technology: ['computer', 'robot', 'machine', 'engine', 'circuit', 'code', 'ai'],
      magic: ['spell', 'wizard', 'magic', 'potion', 'enchant', 'mystic', 'mana'],
      cosmic: ['star', 'planet', 'galaxy', 'universe', 'space', 'cosmic', 'nebula'],
      life: ['human', 'animal', 'plant', 'cell', 'dna', 'evolution', 'species'],
      energy: ['fire', 'electric', 'plasma', 'nuclear', 'solar', 'power', 'force'],
      matter: ['atom', 'molecule', 'particle', 'quantum', 'element', 'compound'],
      time: ['past', 'future', 'time', 'clock', 'age', 'era', 'epoch']
    };
    
    const resultName = result.n.toLowerCase();
    let resultTheme = null;
    
    // Find result's theme
    for (const [theme, keywords] of Object.entries(themes)) {
      if (keywords.some(kw => resultName.includes(kw))) {
        resultTheme = theme;
        break;
      }
    }
    
    if (resultTheme) {
      // Find ingredients from same or related themes
      const themeElements = pool.filter(el => {
        const name = el.n.toLowerCase();
        return themes[resultTheme].some(kw => name.includes(kw));
      });
      
      if (themeElements.length >= 2) {
        const elem1 = themeElements[Math.floor(Math.random() * themeElements.length)];
        const elem2 = themeElements[Math.floor(Math.random() * themeElements.length)];
        
        if (elem1.i !== elem2.i && elem1.t < result.t && elem2.t < result.t) {
          return {
            a: Math.min(elem1.i, elem2.i),
            b: Math.max(elem1.i, elem2.i),
            r: result.i
          };
        }
      }
    }
    
    return null;
  }

  createCategoricalCombination(result, pool, tier) {
    // Use element flags for categorical combinations
    const resultFlags = result.f || 0;
    
    if (resultFlags === 0) return null;
    
    // Find elements with related flags
    const relatedElements = pool.filter(el => {
      const elFlags = el.f || 0;
      return (elFlags & resultFlags) !== 0 && el.t < result.t;
    });
    
    if (relatedElements.length >= 2) {
      const elem1 = relatedElements[Math.floor(Math.random() * relatedElements.length)];
      const elem2 = relatedElements[Math.floor(Math.random() * relatedElements.length)];
      
      if (elem1.i !== elem2.i) {
        return {
          a: Math.min(elem1.i, elem2.i),
          b: Math.max(elem1.i, elem2.i),
          r: result.i
        };
      }
    }
    
    return null;
  }

  async generateCrossTierCombinations() {
    console.log('\n🌐 Generating cross-tier combinations...');
    
    let generated = 0;
    
    // Base + Base = Tier 1
    const base = this.elementsByTier.get(0) || [];
    const tier1 = this.elementsByTier.get(1) || [];
    
    for (let i = 0; i < base.length; i++) {
      for (let j = i + 1; j < base.length; j++) {
        // All base combinations should produce tier 1 results
        const results = tier1.filter(el => this.countExistingPaths(el.i) < 10);
        if (results.length > 0) {
          const result = results[Math.floor(Math.random() * results.length)];
          const combo = {
            a: Math.min(base[i].i, base[j].i),
            b: Math.max(base[i].i, base[j].i),
            r: result.i
          };
          
          if (this.isValidNewCombination(combo)) {
            this.newCombinations.push(combo);
            generated++;
          }
        }
      }
    }
    
    // Base + Tier 1 = Tier 2
    for (const baseEl of base) {
      for (const t1El of tier1) {
        const tier2 = this.elementsByTier.get(2) || [];
        const results = tier2.filter(el => this.countExistingPaths(el.i) < 8);
        
        if (results.length > 0) {
          const result = results[Math.floor(Math.random() * Math.min(5, results.length))];
          const combo = {
            a: Math.min(baseEl.i, t1El.i),
            b: Math.max(baseEl.i, t1El.i),
            r: result.i
          };
          
          if (this.isValidNewCombination(combo)) {
            this.newCombinations.push(combo);
            generated++;
          }
        }
      }
    }
    
    console.log(`   ✓ Generated ${generated} cross-tier combinations`);
  }

  async generateThematicCombinations() {
    console.log('\n🎨 Generating thematic combination sets...');
    
    let generated = 0;
    
    // Common combination patterns
    const patterns = [
      // Tool creation
      { ingredients: ['stone', 'stick'], results: ['hammer', 'axe', 'tool'] },
      { ingredients: ['metal', 'fire'], results: ['sword', 'blade', 'forge'] },
      { ingredients: ['wood', 'metal'], results: ['spear', 'arrow', 'weapon'] },
      
      // Life combinations
      { ingredients: ['water', 'earth'], results: ['plant', 'seed', 'life'] },
      { ingredients: ['plant', 'time'], results: ['tree', 'flower', 'fruit'] },
      { ingredients: ['life', 'water'], results: ['fish', 'algae', 'coral'] },
      
      // Technology
      { ingredients: ['metal', 'electricity'], results: ['circuit', 'wire', 'component'] },
      { ingredients: ['circuit', 'code'], results: ['computer', 'chip', 'processor'] },
      
      // Natural phenomena
      { ingredients: ['water', 'cold'], results: ['ice', 'snow', 'frost'] },
      { ingredients: ['fire', 'wood'], results: ['ash', 'smoke', 'charcoal'] },
      { ingredients: ['water', 'heat'], results: ['steam', 'vapor', 'mist'] }
    ];
    
    for (const pattern of patterns) {
      const ingredients = pattern.ingredients.map(name => 
        this.findElementByName(name)
      ).filter(el => el !== null);
      
      const results = pattern.results.map(name => 
        this.findElementByName(name)
      ).filter(el => el !== null);
      
      if (ingredients.length >= 2 && results.length > 0) {
        for (const result of results) {
          const combo = {
            a: Math.min(ingredients[0].i, ingredients[1].i),
            b: Math.max(ingredients[0].i, ingredients[1].i),
            r: result.i
          };
          
          if (this.isValidNewCombination(combo)) {
            this.newCombinations.push(combo);
            generated++;
          }
        }
      }
    }
    
    console.log(`   ✓ Generated ${generated} thematic combinations`);
  }

  findElementByName(searchName) {
    searchName = searchName.toLowerCase();
    
    // Try exact match first
    if (this.elementsByName.has(searchName)) {
      return this.elementsByName.get(searchName);
    }
    
    // Try partial match
    for (const [name, element] of this.elementsByName) {
      if (name.includes(searchName)) {
        return element;
      }
    }
    
    return null;
  }

  isValidNewCombination(combo) {
    // Check if combination already exists
    const key = `${combo.a}-${combo.b}`;
    if (this.existingCombinations.has(key)) {
      return false;
    }
    
    // Check if already in new combinations
    const exists = this.newCombinations.some(c => 
      c.a === combo.a && c.b === combo.b
    );
    if (exists) return false;
    
    // Validate elements exist and tiers make sense
    const elemA = this.elements.find(el => el.i === combo.a);
    const elemB = this.elements.find(el => el.i === combo.b);
    const elemR = this.elements.find(el => el.i === combo.r);
    
    if (!elemA || !elemB || !elemR) return false;
    
    // Result should generally be higher or equal tier
    if (elemR.t < Math.max(elemA.t, elemB.t) - 1) return false;
    
    // Add to existing combinations map
    this.existingCombinations.set(key, combo.r);
    
    return true;
  }

  async saveCombinations() {
    console.log('\n💾 Saving expanded combinations...');
    
    // Sort combinations
    this.newCombinations.sort((a, b) => {
      if (a.r !== b.r) return a.r - b.r;
      if (a.a !== b.a) return a.a - b.a;
      return a.b - b.b;
    });
    
    // Save new combination file
    const output = {
      version: '5.0',
      generated: new Date().toISOString(),
      totalCombinations: this.newCombinations.length,
      combinations: this.newCombinations
    };
    
    await fs.writeFile(
      'combinations-expanded.json',
      JSON.stringify(output, null, 2)
    );
    
    console.log(`✓ Saved ${this.newCombinations.length} combinations to combinations-expanded.json`);
    
    // Generate statistics
    this.generateStatistics();
  }

  generateStatistics() {
    console.log('\n📊 EXPANDED COMBINATION STATISTICS:\n');
    
    // Count combinations per tier
    const combosPerTier = new Map();
    const elementsPerTier = new Map();
    
    for (let i = 0; i <= 12; i++) {
      combosPerTier.set(i, 0);
      elementsPerTier.set(i, (this.elementsByTier.get(i) || []).length);
    }
    
    const elementPaths = new Map();
    this.newCombinations.forEach(combo => {
      const result = this.elements.find(el => el.i === combo.r);
      if (result) {
        combosPerTier.set(result.t, (combosPerTier.get(result.t) || 0) + 1);
        elementPaths.set(combo.r, (elementPaths.get(combo.r) || 0) + 1);
      }
    });
    
    console.log('Tier | Elements | Combinations | Avg Paths | Target Range');
    console.log('-----|----------|--------------|-----------|-------------');
    
    for (let tier = 0; tier <= 12; tier++) {
      const elements = elementsPerTier.get(tier);
      const combos = combosPerTier.get(tier);
      const avg = elements > 0 ? (combos / elements).toFixed(2) : '0.00';
      const target = `${this.targetPaths[tier].min}-${this.targetPaths[tier].max}`;
      
      console.log(
        `  ${tier.toString().padStart(2)} | ${elements.toString().padStart(8)} | ` +
        `${combos.toString().padStart(12)} | ${avg.padStart(9)} | ${target.padStart(11)}`
      );
    }
    
    console.log(`\nTotal combinations: ${this.newCombinations.length}`);
    
    // Show some sample combinations for base elements
    console.log('\n🔥 Sample base element combinations:');
    const fire = this.findElementByName('fire');
    const water = this.findElementByName('water');
    
    if (fire) {
      const fireCombos = this.newCombinations.filter(c => c.a === fire.i || c.b === fire.i).slice(0, 5);
      console.log('\nFire combinations:');
      fireCombos.forEach(combo => {
        const other = combo.a === fire.i ? combo.b : combo.a;
        const otherEl = this.elements.find(el => el.i === other);
        const result = this.elements.find(el => el.i === combo.r);
        console.log(`  Fire + ${otherEl?.n || '?'} = ${result?.n || '?'}`);
      });
    }
  }

  async generate() {
    const startTime = Date.now();
    
    await this.loadData();
    await this.generateExpandedCombinations();
    await this.saveCombinations();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ Expanded combination generation complete in ${duration}s!`);
  }
}

// Run the generator
const generator = new ExpandedCombinationGenerator();
generator.generate().catch(console.error);