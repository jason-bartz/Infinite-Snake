/**
 * Optimized Game Element Loader
 * Efficiently loads and serves elements for the Infinite Snake game
 */

class GameElementLoader {
  constructor() {
    this.elements = new Map();
    this.combinations = new Map();
    this.emojis = {};
    this.elementsByTier = new Map();
    this.elementsByName = new Map();
    this.loaded = false;
    this.baseElements = [1, 2, 3, 4]; // Fire, Water, Earth, Air
  }

  /**
   * Initialize the loader with game data
   */
  async init() {
    if (this.loaded) return;
    
    console.log('🎮 Initializing Game Element Loader...');
    
    try {
      // Load from complete files for now
      const elementsData = await this.loadJSON('elements-complete.json');
      
      // Load emoji files separately to preserve correct mappings
      const [naturalEmojis, civilizationEmojis, modernEmojis, fictionalEmojis] = await Promise.all([
        this.loadJSON('core/emojis-natural.json'),
        this.loadJSON('core/emojis-civilization.json'),
        this.loadJSON('core/emojis-modern.json'),
        this.loadJSON('core/emojis-fictional.json')
      ]);
      
      // Build emoji map preserving natural emojis (don't let them be overwritten)
      const emojisData = { ...fictionalEmojis, ...modernEmojis, ...civilizationEmojis, ...naturalEmojis };
      
      // Try loading combinations with fallback
      let combinationsData = null;
      for (const filename of ['combinations-logical-complete.json', 'combinations-flexible.json', 'combinations-expanded.json']) {
        try {
          combinationsData = await this.loadJSON(filename);
          console.log(`   ✓ Loaded combinations from ${filename}`);
          break;
        } catch (error) {
          console.log(`   ⚠️ Could not load ${filename}, trying next...`);
        }
      }
      
      if (!combinationsData) {
        throw new Error('No combination files could be loaded');
      }
      
      // Process elements
      this.emojis = emojisData;
      elementsData.elements.forEach(el => {
        this.elements.set(el.i, el);
        this.elementsByName.set(el.n.toLowerCase(), el);
        
        if (!this.elementsByTier.has(el.t)) {
          this.elementsByTier.set(el.t, []);
        }
        this.elementsByTier.get(el.t).push(el);
      });
      
      // Process combinations
      combinationsData.combinations.forEach(combo => {
        const key = `${combo.a}-${combo.b}`;
        this.combinations.set(key, combo.r);
        // Also store reverse for easier lookup
        const reverseKey = `${combo.b}-${combo.a}`;
        this.combinations.set(reverseKey, combo.r);
      });
      
      this.loaded = true;
      console.log(`✅ Loaded ${this.elements.size} elements and ${combinationsData.combinations.length} combinations`);
      
    } catch (error) {
      console.error('❌ Failed to load game data:', error);
      throw error;
    }
  }

  /**
   * Load JSON file helper
   */
  async loadJSON(filename) {
    if (typeof window !== 'undefined') {
      // Browser environment
      const response = await fetch(`/elements/${filename}`);
      if (!response.ok) throw new Error(`Failed to load ${filename}`);
      return response.json();
    } else {
      // Node.js environment
      const fs = await import('fs/promises');
      const path = await import('path');
      const data = await fs.readFile(path.join(process.cwd(), 'elements', filename), 'utf8');
      return JSON.parse(data);
    }
  }

  /**
   * Get element by ID
   */
  getElement(id) {
    return this.elements.get(id);
  }

  /**
   * Get element by name (case-insensitive)
   */
  getElementByName(name) {
    return this.elementsByName.get(name.toLowerCase());
  }

  /**
   * Get all elements in a tier
   */
  getElementsByTier(tier) {
    return this.elementsByTier.get(tier) || [];
  }

  /**
   * Get base/starting elements
   */
  getBaseElements() {
    return this.baseElements.map(id => this.getElement(id)).filter(Boolean);
  }

  /**
   * Get emoji for element
   */
  getEmoji(element) {
    if (typeof element === 'number') {
      element = this.getElement(element);
    }
    if (!element) return '❓';
    
    // Fix for base elements by ID
    const baseEmojiById = {
      1: '🔥',  // Fire
      2: '💧',  // Water  
      3: '🌍',  // Earth
      4: '💨'   // Air
    };
    
    // Check by element ID first
    if (baseEmojiById[element.i]) {
      return baseEmojiById[element.i];
    }
    
    // Then check by name
    const baseEmojis = {
      'fire': '🔥',
      'water': '💧', 
      'earth': '🌍',
      'air': '💨'
    };
    
    const elementKey = element.n.toLowerCase();
    if (baseEmojis[elementKey]) {
      return baseEmojis[elementKey];
    }
    
    return this.emojis[element.e] || '✨';
  }

  /**
   * Check if two elements can combine
   */
  canCombine(id1, id2) {
    const key = `${Math.min(id1, id2)}-${Math.max(id1, id2)}`;
    return this.combinations.has(key);
  }

  /**
   * Get combination result
   */
  getCombinationResult(id1, id2) {
    const key = `${Math.min(id1, id2)}-${Math.max(id1, id2)}`;
    const resultId = this.combinations.get(key);
    return resultId ? this.getElement(resultId) : null;
  }

  /**
   * Get all combinations that create a specific element
   */
  getRecipesFor(elementId) {
    const recipes = [];
    for (const [key, resultId] of this.combinations) {
      if (resultId === elementId && !key.includes('-')) continue;
      if (resultId === elementId) {
        const [a, b] = key.split('-').map(Number);
        if (!isNaN(a) && !isNaN(b)) {
          recipes.push({ a, b });
        }
      }
    }
    return recipes;
  }

  /**
   * Get discovery statistics
   */
  getStats() {
    const stats = {
      totalElements: this.elements.size,
      totalCombinations: Math.floor(this.combinations.size / 2), // Divided by 2 because we store both directions
      elementsByTier: {},
      baseElements: this.baseElements.length
    };
    
    for (const [tier, elements] of this.elementsByTier) {
      stats.elementsByTier[tier] = elements.length;
    }
    
    return stats;
  }

  /**
   * Search elements by partial name
   */
  searchElements(query, limit = 10) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const [name, element] of this.elementsByName) {
      if (name.includes(queryLower)) {
        results.push(element);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }

  /**
   * Get random discoverable element (has a recipe)
   */
  getRandomDiscoverable(maxTier = 12) {
    const discoverableElements = [];
    
    for (const [id, element] of this.elements) {
      if (element.t <= maxTier && !this.baseElements.includes(id)) {
        const recipes = this.getRecipesFor(id);
        if (recipes.length > 0) {
          discoverableElements.push(element);
        }
      }
    }
    
    if (discoverableElements.length === 0) return null;
    return discoverableElements[Math.floor(Math.random() * discoverableElements.length)];
  }

  /**
   * Get hint for discovering an element
   */
  getHint(elementId) {
    const recipes = this.getRecipesFor(elementId);
    if (recipes.length === 0) return null;
    
    // Get a random recipe
    const recipe = recipes[Math.floor(Math.random() * recipes.length)];
    const elem1 = this.getElement(recipe.a);
    const elem2 = this.getElement(recipe.b);
    
    if (!elem1 || !elem2) return null;
    
    return {
      element1: elem1,
      element2: elem2,
      emoji1: this.getEmoji(elem1),
      emoji2: this.getEmoji(elem2),
      hint: `Try combining ${elem1.n} and ${elem2.n}`
    };
  }

  /**
   * Format element for display
   */
  formatElement(element) {
    if (typeof element === 'number') {
      element = this.getElement(element);
    }
    
    if (!element) return { name: 'Unknown', emoji: '❓', tier: 0 };
    
    return {
      id: element.i,
      name: element.n,
      emoji: this.getEmoji(element),
      tier: element.t,
      flags: element.f,
      combinable: element.c !== false
    };
  }

  /**
   * Get tier name
   */
  getTierName(tier) {
    const tierNames = {
      0: 'Primordial',
      1: 'Basic Natural',
      2: 'Complex Natural',
      3: 'Early Tools',
      4: 'Civilization',
      5: 'Knowledge',
      6: 'Contemporary',
      7: 'Advanced',
      8: 'Future',
      9: 'Fantasy',
      10: 'Pop Culture',
      11: 'Crossover',
      12: 'Meta'
    };
    return tierNames[tier] || 'Unknown';
  }

  /**
   * Get tier color for UI
   */
  getTierColor(tier) {
    const colors = {
      0: '#FF6B6B',  // Red - Primordial
      1: '#4ECDC4',  // Teal - Basic
      2: '#45B7D1',  // Blue - Complex
      3: '#96CEB4',  // Green - Tools
      4: '#FECA57',  // Yellow - Civilization
      5: '#FF9FF3',  // Pink - Knowledge
      6: '#54A0FF',  // Light Blue - Contemporary
      7: '#48DBFB',  // Sky Blue - Advanced
      8: '#A29BFE',  // Purple - Future
      9: '#FD79A8',  // Rose - Fantasy
      10: '#FDCB6E', // Orange - Pop Culture
      11: '#6C5CE7', // Deep Purple - Crossover
      12: '#FFD700'  // Gold - Meta
    };
    return colors[tier] || '#95A5A6';
  }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameElementLoader;
} else if (typeof window !== 'undefined') {
  window.GameElementLoader = GameElementLoader;
}