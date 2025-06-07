/**
 * Compatibility Layer - Converts new element system to legacy format
 * Maintains backward compatibility with existing game code
 */

class ElementCompatibilityLayer {
  constructor() {
    this.legacyCache = {
      elements: {},
      combinations: {}
    };
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🔄 Initializing Compatibility Layer...');
    
    try {
      // Wait for element loader to be ready
      if (!window.elementLoader || !window.elementLoader.isLoaded()) {
        await new Promise((resolve) => {
          window.addEventListener('elementLoaderReady', resolve, { once: true });
        });
      }
      
      // Build legacy format cache
      this.buildLegacyCache();
      
      this.initialized = true;
      console.log('✅ Compatibility Layer initialized');
      
      // Dispatch event for game
      window.dispatchEvent(new CustomEvent('compatibilityLayerReady'));
      
    } catch (error) {
      console.error('❌ Failed to initialize Compatibility Layer:', error);
      throw error;
    }
  }

  buildLegacyCache() {
    const loader = window.elementLoader;
    
    // Convert elements to legacy format
    const elementsMap = loader.getElementsMap();
    for (const [key, element] of Object.entries(elementsMap)) {
      this.legacyCache.elements[key] = {
        emoji: element.emoji,
        name: element.name,
        tier: element.tier,
        base: element.tier === 0,
        id: element.id
      };
    }
    
    // Convert combinations to legacy format
    this.legacyCache.combinations = loader.getCombinationsMap();
    
    console.log(`Legacy cache built: ${Object.keys(this.legacyCache.elements).length} elements, ${Object.keys(this.legacyCache.combinations).length} combinations`);
  }

  // Legacy interface methods
  getElement(key) {
    return this.legacyCache.elements[key];
  }

  getCombination(keyA, keyB) {
    const combo1 = `${keyA}+${keyB}`;
    const combo2 = `${keyB}+${keyA}`;
    return this.legacyCache.combinations[combo1] || this.legacyCache.combinations[combo2];
  }

  getAllElements() {
    return this.legacyCache.elements;
  }

  getAllCombinations() {
    return this.legacyCache.combinations;
  }

  // Discovery tracking methods
  getDiscoveredElements() {
    // Return base elements by default
    return new Set(['fire', 'water', 'earth', 'air']);
  }

  markDiscovered(elementKey) {
    // In the new system, this would be handled by DiscoveryTracker
    console.log(`Element discovered: ${elementKey}`);
  }

  // Load discovered elements from storage (compatibility method)
  loadDiscoveredElements() {
    try {
      const saved = localStorage.getItem('discoveredElements');
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log(`Loaded ${Object.keys(parsed).length} discovered elements from storage`);
        return parsed;
      }
    } catch (error) {
      console.warn('Could not load discovered elements:', error);
    }
    
    // Return base elements if no save data
    return {
      fire: true,
      water: true,
      earth: true,
      air: true
    };
  }

  // Save discovered elements to storage (compatibility method)
  saveDiscoveredElements(discoveredElements) {
    try {
      localStorage.setItem('discoveredElements', JSON.stringify(discoveredElements));
      console.log(`Saved ${Object.keys(discoveredElements).length} discovered elements`);
    } catch (error) {
      console.warn('Could not save discovered elements:', error);
    }
  }

  // Stats and utility methods
  getElementCount() {
    return Object.keys(this.legacyCache.elements).length;
  }

  getCombinationCount() {
    return Object.keys(this.legacyCache.combinations).length;
  }

  isInitialized() {
    return this.initialized;
  }

  // Search functionality
  searchElements(query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    for (const [key, element] of Object.entries(this.legacyCache.elements)) {
      if (element.name.toLowerCase().includes(queryLower)) {
        results.push({ key, ...element });
      }
    }
    
    return results.slice(0, 10); // Limit results
  }

  // Convert element key to display format
  formatElementName(key) {
    const element = this.getElement(key);
    return element ? element.name : key.charAt(0).toUpperCase() + key.slice(1);
  }

  // Get element emoji
  getElementEmoji(key) {
    const element = this.getElement(key);
    return element ? element.emoji : '❓';
  }

  // Tier information
  getElementTier(key) {
    const element = this.getElement(key);
    return element ? element.tier : 0;
  }

  // Get elements by tier
  getElementsByTier(tier) {
    const results = [];
    for (const [key, element] of Object.entries(this.legacyCache.elements)) {
      if (element.tier === tier) {
        results.push({ key, ...element });
      }
    }
    return results;
  }

  // Base elements check
  isBaseElement(key) {
    return ['fire', 'water', 'earth', 'air'].includes(key);
  }

  // Get all possible combinations for an element
  getCombinationsFor(elementKey) {
    const combinations = [];
    
    for (const [combo, result] of Object.entries(this.legacyCache.combinations)) {
      if (result === elementKey && combo.includes('+')) {
        const [a, b] = combo.split('+');
        combinations.push({ a, b, result });
      }
    }
    
    return combinations;
  }

  // Refresh cache (for dynamic updates)
  refreshCache() {
    if (window.elementLoader && window.elementLoader.isLoaded()) {
      this.buildLegacyCache();
      console.log('🔄 Legacy cache refreshed');
    }
  }
}

// Create global instance
window.elementCompatibility = new ElementCompatibilityLayer();

// Auto-initialize
if (window.elementLoader) {
  window.elementCompatibility.init().catch(console.error);
} else {
  // Wait for element loader
  window.addEventListener('elementLoaderReady', () => {
    window.elementCompatibility.init().catch(console.error);
  }, { once: true });
}