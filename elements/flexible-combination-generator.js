#!/usr/bin/env node

import fs from 'fs/promises';

class FlexibleCombinationGenerator {
  constructor() {
    this.elements = [];
    this.elementsByTier = new Map();
    this.existingCombinations = new Map();
    this.newCombinations = [];
  }

  async loadData() {
    console.log('📚 Loading data for flexible generation...');
    
    // Load elements
    const elementsData = JSON.parse(await fs.readFile('elements-complete.json', 'utf8'));
    this.elements = elementsData.elements;
    
    // Load existing combinations
    const combosData = JSON.parse(await fs.readFile('combinations-expanded.json', 'utf8'));
    this.newCombinations = [...combosData.combinations];
    
    // Index existing combinations
    this.newCombinations.forEach(combo => {
      const key = `${combo.a}-${combo.b}`;
      this.existingCombinations.set(key, combo.r);
    });
    
    // Index elements by tier
    this.elements.forEach(el => {
      if (!this.elementsByTier.has(el.t)) {
        this.elementsByTier.set(el.t, []);
      }
      this.elementsByTier.get(el.t).push(el);
    });
    
    console.log(`✓ Starting with ${this.newCombinations.length} existing combinations`);
  }

  async generateFlexibleCombinations() {
    console.log('\n🎯 Generating combinations with flexible tier mixing...\n');
    
    // Focus on under-represented tiers
    const tierTargets = {
      0: { current: 0, target: 50 },      // Base elements get more paths
      1: { current: 6, target: 150 },     // Tier 1 needs more
      2: { current: 347, target: 20000 }  // Tier 2 needs MANY more
    };
    
    // Calculate current paths
    this.newCombinations.forEach(combo => {
      const result = this.elements.find(el => el.i === combo.r);
      if (result && tierTargets[result.t]) {
        tierTargets[result.t].current++;
      }
    });
    
    // Generate for each under-represented tier
    for (const [tier, targets] of Object.entries(tierTargets)) {
      const tierNum = Number(tier);
      const needed = targets.target - targets.current;
      
      if (needed > 0) {
        console.log(`\n📊 Tier ${tier}: Need ${needed} more combinations`);
        const generated = await this.generateForTier(tierNum, needed);
        console.log(`   ✓ Generated ${generated} combinations`);
      }
    }
    
    console.log(`\n✨ Total combinations: ${this.newCombinations.length}`);
  }

  async generateForTier(targetTier, needed) {
    let generated = 0;
    const targetElements = this.elementsByTier.get(targetTier) || [];
    
    if (targetElements.length === 0) return 0;
    
    // For Tier 2, we need to be creative with ingredient selection
    if (targetTier === 2) {
      // Strategy 1: Use ANY two elements from Tiers 0-8 to create Tier 2
      const eligibleElements = [];
      for (let t = 0; t <= 8; t++) {
        eligibleElements.push(...(this.elementsByTier.get(t) || []));
      }
      
      console.log(`   Using ${eligibleElements.length} elements from Tiers 0-8 as ingredients`);
      
      // Distribute combinations evenly across Tier 2 elements
      const pathsPerElement = Math.ceil(needed / targetElements.length);
      
      for (const targetElement of targetElements) {
        const currentPaths = this.countPaths(targetElement.i);
        const elementNeeded = Math.max(0, pathsPerElement - currentPaths);
        
        if (elementNeeded > 0) {
          // Select diverse ingredients
          const ingredients = this.selectDiverseIngredients(eligibleElements, elementNeeded * 2);
          
          for (let i = 0; i < ingredients.length - 1 && generated < needed; i += 2) {
            if (this.addCombination(ingredients[i].i, ingredients[i + 1].i, targetElement.i)) {
              generated++;
            }
          }
        }
        
        if (generated >= needed) break;
      }
    } else {
      // For other tiers, use traditional lower-tier ingredients
      const maxIngredientTier = Math.max(0, targetTier - 1);
      const eligibleElements = [];
      
      for (let t = 0; t <= maxIngredientTier; t++) {
        eligibleElements.push(...(this.elementsByTier.get(t) || []));
      }
      
      // Create combinations
      const pathsPerElement = Math.ceil(needed / targetElements.length);
      
      for (const targetElement of targetElements) {
        const currentPaths = this.countPaths(targetElement.i);
        const elementNeeded = Math.max(0, pathsPerElement - currentPaths);
        
        for (let i = 0; i < elementNeeded && generated < needed; i++) {
          const ing1 = eligibleElements[Math.floor(Math.random() * eligibleElements.length)];
          const ing2 = eligibleElements[Math.floor(Math.random() * eligibleElements.length)];
          
          if (ing1.i !== ing2.i && this.addCombination(ing1.i, ing2.i, targetElement.i)) {
            generated++;
          }
        }
      }
    }
    
    return generated;
  }

  selectDiverseIngredients(pool, count) {
    // Select elements from different tiers for diversity
    const selected = [];
    const tierGroups = new Map();
    
    // Group by tier
    pool.forEach(el => {
      if (!tierGroups.has(el.t)) {
        tierGroups.set(el.t, []);
      }
      tierGroups.get(el.t).push(el);
    });
    
    // Select from each tier in rotation
    const tiers = Array.from(tierGroups.keys()).sort((a, b) => a - b);
    let tierIndex = 0;
    
    while (selected.length < count) {
      const tier = tiers[tierIndex % tiers.length];
      const tierElements = tierGroups.get(tier);
      
      if (tierElements.length > 0) {
        const element = tierElements[Math.floor(Math.random() * tierElements.length)];
        selected.push(element);
      }
      
      tierIndex++;
    }
    
    return selected;
  }

  addCombination(a, b, result) {
    if (a > b) [a, b] = [b, a];
    
    const key = `${a}-${b}`;
    if (this.existingCombinations.has(key)) {
      return false;
    }
    
    this.existingCombinations.set(key, result);
    this.newCombinations.push({ a, b, r: result });
    return true;
  }

  countPaths(elementId) {
    return this.newCombinations.filter(c => c.r === elementId).length;
  }

  async save() {
    console.log('\n💾 Saving flexible combinations...');
    
    this.newCombinations.sort((a, b) => {
      if (a.r !== b.r) return a.r - b.r;
      if (a.a !== b.a) return a.a - b.a;
      return a.b - b.b;
    });
    
    const output = {
      version: '10.0',
      generated: new Date().toISOString(),
      totalCombinations: this.newCombinations.length,
      combinations: this.newCombinations
    };
    
    await fs.writeFile(
      'combinations-flexible.json',
      JSON.stringify(output, null, 2)
    );
    
    console.log(`✓ Saved ${this.newCombinations.length} total combinations`);
    
    this.showStats();
  }

  showStats() {
    console.log('\n📊 FLEXIBLE GENERATION STATISTICS:\n');
    
    const tierStats = new Map();
    
    // Initialize
    for (let i = 0; i <= 12; i++) {
      tierStats.set(i, {
        elements: this.elementsByTier.get(i)?.length || 0,
        combinations: 0,
        coverage: new Set()
      });
    }
    
    // Count
    this.newCombinations.forEach(combo => {
      const result = this.elements.find(el => el.i === combo.r);
      if (result) {
        const stats = tierStats.get(result.t);
        stats.combinations++;
        stats.coverage.add(combo.r);
      }
    });
    
    console.log('Tier | Elements | Combinations | Avg Paths | Coverage');
    console.log('-----|----------|--------------|-----------|----------');
    
    for (let i = 0; i <= 12; i++) {
      const stats = tierStats.get(i);
      const avg = stats.elements > 0 ? (stats.combinations / stats.elements).toFixed(2) : '0.00';
      const coverage = stats.elements > 0 ? 
        Math.round((stats.coverage.size / stats.elements) * 100) : 0;
      
      console.log(
        `  ${i.toString().padStart(2)} | ${stats.elements.toString().padStart(8)} | ` +
        `${stats.combinations.toString().padStart(12)} | ${avg.padStart(9)} | ${coverage.toString().padStart(7)}%`
      );
    }
    
    console.log(`\nTotal combinations: ${this.newCombinations.length}`);
    
    // Show variety in Tier 2 combinations
    console.log('\n🌿 Tier 2 combination examples (showing ingredient variety):');
    const tier2Samples = this.newCombinations
      .filter(c => {
        const result = this.elements.find(el => el.i === c.r);
        return result && result.t === 2;
      })
      .slice(-20);
    
    const ingredientTiers = new Map();
    
    tier2Samples.forEach(combo => {
      const elem1 = this.elements.find(el => el.i === combo.a);
      const elem2 = this.elements.find(el => el.i === combo.b);
      const result = this.elements.find(el => el.i === combo.r);
      
      const tierCombo = `T${elem1?.t || '?'}+T${elem2?.t || '?'}`;
      ingredientTiers.set(tierCombo, (ingredientTiers.get(tierCombo) || 0) + 1);
      
      if (tier2Samples.indexOf(combo) < 10) {
        console.log(`  ${elem1?.n || '?'} (T${elem1?.t}) + ${elem2?.n || '?'} (T${elem2?.t}) = ${result?.n || '?'}`);
      }
    });
    
    console.log('\nIngredient tier combinations used:');
    for (const [combo, count] of ingredientTiers) {
      console.log(`  ${combo}: ${count} times`);
    }
  }

  async generate() {
    const startTime = Date.now();
    
    await this.loadData();
    await this.generateFlexibleCombinations();
    await this.save();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ Flexible generation complete in ${duration}s!`);
  }
}

// Run the generator
const generator = new FlexibleCombinationGenerator();
generator.generate().catch(console.error);