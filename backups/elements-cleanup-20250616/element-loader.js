/**
 * Element Loader - Bridge between new optimized system and game
 * Provides compatibility with the expected game interface
 */

class ElementLoader {
  constructor() {
    this.elements = new Map();
    this.combinations = new Map();
    this.elementsByKey = new Map();
    this.loaded = false;
    this.gameLoader = null;
  }

  async init() {
    if (this.loaded) return;
    
    console.log('🔄 Initializing Element Loader...');
    
    try {
      // Import and initialize the new GameElementLoader
      this.gameLoader = new GameElementLoader();
      await this.gameLoader.init();
      
      // Convert new format to expected legacy format
      this.buildLegacyMaps();
      
      this.loaded = true;
      console.log('✅ Element Loader initialized successfully');
      
      // Dispatch loaded event
      window.dispatchEvent(new CustomEvent('elementLoaderReady'));
      
    } catch (error) {
      console.error('❌ Failed to initialize Element Loader:', error);
      throw error;
    }
  }

  buildLegacyMaps() {
    // Build element maps
    for (const [id, element] of this.gameLoader.elements) {
      // Use lowercase with spaces for compatibility with game
      const key = element.n.toLowerCase();
      
      this.elementsByKey.set(key, {
        key: key,
        id: element.i,
        name: element.n,
        emoji: this.gameLoader.getEmoji(element),
        tier: element.t,
        flags: element.f
      });
      
      this.elements.set(element.i, element);
    }
    
    // Build combination maps
    for (const [combinationKey, resultId] of this.gameLoader.combinations) {
      if (combinationKey.includes('-')) {
        const [aId, bId] = combinationKey.split('-').map(Number);
        const elementA = this.elements.get(aId);
        const elementB = this.elements.get(bId);
        const resultElement = this.elements.get(resultId);
        
        if (elementA && elementB && resultElement) {
          // Use lowercase keys with spaces for game compatibility
          const keyA = elementA.n.toLowerCase();
          const keyB = elementB.n.toLowerCase();
          const resultKey = resultElement.n.toLowerCase();
          
          // Store both directions
          this.combinations.set(`${keyA}+${keyB}`, resultKey);
          this.combinations.set(`${keyB}+${keyA}`, resultKey);
        }
      }
    }
    
    console.log(`Built legacy maps: ${this.elementsByKey.size} elements, ${this.combinations.size} combinations`);
  }

  // Legacy interface methods
  getElementByKey(key) {
    // Try with spaces first (game standard)
    let element = this.elementsByKey.get(key.toLowerCase());
    
    // If not found, try without spaces
    if (!element) {
      element = this.elementsByKey.get(key.toLowerCase().replace(/\s+/g, ''));
    }
    
    return element;
  }

  getCombinationByKeys(keyA, keyB) {
    const combo = `${keyA}+${keyB}`;
    const resultKey = this.combinations.get(combo);
    return resultKey ? this.getElementByKey(resultKey) : null;
  }

  getAllElements() {
    return Array.from(this.elementsByKey.values());
  }

  getElementsMap() {
    const map = {};
    for (const [key, element] of this.elementsByKey) {
      map[key] = element;
    }
    return map;
  }

  getCombinationsMap() {
    const map = {};
    for (const [combo, result] of this.combinations) {
      map[combo] = result;
    }
    return map;
  }

  isLoaded() {
    return this.loaded;
  }

  // Track element discovery
  discoverElement(elementId) {
    // This is handled by the global discoveredElements set in the game
    // We just need to provide this method for compatibility
    console.log('Element discovered:', elementId);
  }

  // Utility methods
  searchElements(query) {
    if (!this.gameLoader) return [];
    return this.gameLoader.searchElements(query);
  }

  getStats() {
    if (!this.gameLoader) return {};
    return this.gameLoader.getStats();
  }

  // Get elements by tier
  getElementsByTier(tier) {
    const elements = [];
    for (const [key, element] of this.elementsByKey) {
      if (element.tier === tier) {
        elements.push(element);
      }
    }
    return elements;
  }

  // Get random element by tier
  getRandomElementByTier(tier) {
    const tierElements = this.getElementsByTier(tier);
    if (tierElements.length === 0) return null;
    return tierElements[Math.floor(Math.random() * tierElements.length)];
  }

  // Get element count by tier
  getElementCountByTier(tier) {
    return this.getElementsByTier(tier).length;
  }
}

// Create global instance
window.elementLoader = new ElementLoader();

// Auto-initialize if GameElementLoader is available
if (typeof GameElementLoader !== 'undefined') {
  window.elementLoader.init().catch(console.error);
} else {
  // Wait for GameElementLoader to be available
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof GameElementLoader !== 'undefined') {
      window.elementLoader.init().catch(console.error);
    }
  });
}