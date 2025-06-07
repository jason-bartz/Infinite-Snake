/**
 * Dynamic Prefix System for Runtime Element Variants
 * Creates "Flaming X", "Cosmic Y", etc. when players combine high-tier elements with modifiers
 */

class DynamicPrefixSystem {
  constructor() {
    // Prefix progression: base -> Double -> Triple -> Mega
    this.prefixLevels = ['', 'Double', 'Triple', 'Mega'];
    
    // Prefix categories and their trigger elements
    this.prefixCategories = {
      // Fire-based prefixes: Fire + High-tier = Flaming X
      flaming: {
        prefix: 'Flaming',
        emoji: '🔥',
        triggerElements: ['fire', 'flame', 'volcano', 'lava', 'inferno', 'blaze', 'ember', 'heat'],
        triggerFlags: 1, // Fire flag
        minTier: 8 // Only works on Tier 8+ elements
      },
      
      // Space-based prefixes: Space elements + High-tier = Cosmic X
      cosmic: {
        prefix: 'Cosmic',
        emoji: '🌌',
        triggerElements: ['space', 'star', 'galaxy', 'universe', 'nebula', 'cosmic', 'void', 'astral'],
        triggerFlags: 32, // Space flag
        minTier: 8
      },
      
      // Magic-based prefixes: Magic + High-tier = Mystical X
      mystical: {
        prefix: 'Mystical',
        emoji: '✨',
        triggerElements: ['magic', 'spell', 'wizard', 'witch', 'enchant', 'mystic', 'arcane', 'rune'],
        triggerFlags: 512, // Magic flag
        minTier: 8
      },
      
      // Technology-based prefixes: Tech + High-tier = Mecha X
      mecha: {
        prefix: 'Mecha',
        emoji: '🤖',
        triggerElements: ['robot', 'machine', 'mech', 'cyborg', 'android', 'tech', 'computer', 'ai'],
        triggerFlags: 64, // Tech flag
        minTier: 8
      },
      
      // Water-based prefixes: Water + High-tier = Torrential X
      torrential: {
        prefix: 'Torrential',
        emoji: '🌊',
        triggerElements: ['water', 'ocean', 'sea', 'tsunami', 'flood', 'torrent', 'deluge', 'rain'],
        triggerFlags: 2, // Water flag
        minTier: 8
      },
      
      // Death-based prefixes: Death + High-tier = Undead X
      undead: {
        prefix: 'Undead',
        emoji: '💀',
        triggerElements: ['death', 'undead', 'zombie', 'skeleton', 'ghost', 'necro', 'grave', 'soul'],
        triggerFlags: 2048, // Death flag
        minTier: 8
      }
    };
    
    // Store active prefixed elements (runtime only)
    this.activePrefixedElements = new Map();
    this.prefixCombinations = new Map();
  }

  /**
   * Check if a combination should create a prefixed variant
   */
  checkForPrefixCombination(elementA, elementB, gameElements) {
    // Determine which element is the modifier and which is the target
    let modifier = null;
    let target = null;
    
    // Higher tier element becomes the target
    if (elementA.t > elementB.t) {
      target = elementA;
      modifier = elementB;
    } else if (elementB.t > elementA.t) {
      target = elementB;
      modifier = elementA;
    } else {
      // Same tier - check if one is already prefixed
      const aName = elementA.n.toLowerCase();
      const bName = elementB.n.toLowerCase();
      
      if (this.isPrefixedElement(aName)) {
        target = elementA;
        modifier = elementB;
      } else if (this.isPrefixedElement(bName)) {
        target = elementB;
        modifier = elementA;
      } else {
        return null; // No prefix combination possible
      }
    }
    
    // Check if target is eligible for prefixing
    if (target.t < 8) return null; // Only Tier 8+ elements can be prefixed
    
    // Check each prefix category
    for (const [categoryKey, category] of Object.entries(this.prefixCategories)) {
      if (this.isModifierForCategory(modifier, category)) {
        return this.createPrefixedVariant(target, categoryKey, category);
      }
    }
    
    return null;
  }

  /**
   * Check if an element can trigger a specific prefix category
   */
  isModifierForCategory(element, category) {
    const name = element.n.toLowerCase();
    const flags = element.f || 0;
    
    // Check by name keywords
    const nameMatch = category.triggerElements.some(keyword => 
      name.includes(keyword)
    );
    
    // Check by flags
    const flagMatch = (flags & category.triggerFlags) !== 0;
    
    return nameMatch || flagMatch;
  }

  /**
   * Create a prefixed variant of an element
   */
  createPrefixedVariant(baseElement, categoryKey, category) {
    const baseName = baseElement.n;
    let currentLevel = 0;
    let workingName = baseName;
    
    // Check if element is already prefixed and determine level
    if (this.isPrefixedElement(baseName.toLowerCase())) {
      const prefixInfo = this.getPrefixInfo(baseName);
      if (prefixInfo && prefixInfo.category === categoryKey) {
        currentLevel = prefixInfo.level;
        workingName = prefixInfo.baseName;
      } else {
        // Different prefix category, start over
        workingName = baseName;
        currentLevel = 0;
      }
    }
    
    // Can't go beyond Mega level
    if (currentLevel >= 3) return null;
    
    const nextLevel = currentLevel + 1;
    const levelPrefix = this.prefixLevels[nextLevel];
    const categoryPrefix = category.prefix;
    
    // Build the new name
    let newName;
    if (levelPrefix) {
      newName = `${levelPrefix} ${categoryPrefix} ${workingName}`;
    } else {
      newName = `${categoryPrefix} ${workingName}`;
    }
    
    // Create the variant element
    const variant = {
      i: this.generateVariantId(newName),
      n: newName,
      t: Math.min(12, baseElement.t + 1), // Increase tier by 1
      e: category.emoji,
      f: baseElement.f || 0,
      c: true,
      // Metadata for prefix system
      prefixed: true,
      prefixCategory: categoryKey,
      prefixLevel: nextLevel,
      baseName: workingName,
      baseElementId: baseElement.i
    };
    
    // Store the variant
    this.activePrefixedElements.set(variant.i, variant);
    
    return variant;
  }

  /**
   * Check if an element name indicates it's already prefixed
   */
  isPrefixedElement(name) {
    const lowerName = name.toLowerCase();
    
    // Check for any prefix category
    for (const category of Object.values(this.prefixCategories)) {
      if (lowerName.includes(category.prefix.toLowerCase())) {
        return true;
      }
    }
    
    // Check for level prefixes
    return this.prefixLevels.slice(1).some(level => 
      lowerName.includes(level.toLowerCase())
    );
  }

  /**
   * Extract prefix information from an element name
   */
  getPrefixInfo(name) {
    const lowerName = name.toLowerCase();
    
    // Find the prefix category
    let category = null;
    let categoryKey = null;
    
    for (const [key, cat] of Object.entries(this.prefixCategories)) {
      if (lowerName.includes(cat.prefix.toLowerCase())) {
        category = cat;
        categoryKey = key;
        break;
      }
    }
    
    if (!category) return null;
    
    // Find the level prefix
    let level = 0;
    for (let i = 1; i < this.prefixLevels.length; i++) {
      if (lowerName.includes(this.prefixLevels[i].toLowerCase())) {
        level = i;
        break;
      }
    }
    
    // Extract base name
    let baseName = name;
    
    // Remove level prefix if present
    if (level > 0) {
      baseName = baseName.replace(new RegExp(this.prefixLevels[level], 'i'), '').trim();
    }
    
    // Remove category prefix
    baseName = baseName.replace(new RegExp(category.prefix, 'i'), '').trim();
    
    return {
      category: categoryKey,
      level: level,
      baseName: baseName
    };
  }

  /**
   * Generate a unique ID for variant elements
   */
  generateVariantId(name) {
    // Use a hash-like approach to generate consistent IDs
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      const char = name.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Ensure positive and start from 100000 to avoid conflicts
    return Math.abs(hash) % 900000 + 100000;
  }

  /**
   * Get all active prefixed elements
   */
  getActivePrefixedElements() {
    return Array.from(this.activePrefixedElements.values());
  }

  /**
   * Get a prefixed element by ID
   */
  getPrefixedElement(id) {
    return this.activePrefixedElements.get(id);
  }

  /**
   * Clear all prefixed elements (for game reset)
   */
  clearPrefixedElements() {
    this.activePrefixedElements.clear();
    this.prefixCombinations.clear();
  }

  /**
   * Generate combinations that create prefixed elements
   */
  generatePrefixCombinations(baseElements) {
    const combinations = [];
    
    // Find high-tier elements (8+) that can be prefixed
    const eligibleTargets = baseElements.filter(el => el.t >= 8);
    
    // Find modifier elements for each category
    const modifiers = {};
    for (const [categoryKey, category] of Object.entries(this.prefixCategories)) {
      modifiers[categoryKey] = baseElements.filter(el => 
        this.isModifierForCategory(el, category)
      );
    }
    
    // Generate combinations
    for (const target of eligibleTargets) {
      for (const [categoryKey, category] of Object.entries(this.prefixCategories)) {
        const categoryModifiers = modifiers[categoryKey];
        
        if (categoryModifiers.length > 0) {
          // Pick a few representative modifiers
          const selectedModifiers = categoryModifiers.slice(0, 3);
          
          for (const modifier of selectedModifiers) {
            const variant = this.createPrefixedVariant(target, categoryKey, category);
            if (variant) {
              combinations.push({
                a: Math.min(target.i, modifier.i),
                b: Math.max(target.i, modifier.i),
                r: variant.i,
                prefixed: true
              });
            }
          }
        }
      }
    }
    
    return combinations;
  }

  /**
   * Integration method for game element system
   */
  integrateWithGame(gameElementLoader) {
    // Hook into the combination checking
    const originalGetCombination = gameElementLoader.getCombinationByKeys;
    
    gameElementLoader.getCombinationByKeys = (keyA, keyB) => {
      // First check normal combinations
      const normalCombo = originalGetCombination.call(gameElementLoader, keyA, keyB);
      if (normalCombo) return normalCombo;
      
      // Check for prefix combinations
      const elementA = gameElementLoader.getElementByKey(keyA);
      const elementB = gameElementLoader.getElementByKey(keyB);
      
      if (elementA && elementB) {
        const prefixResult = this.checkForPrefixCombination(elementA, elementB, gameElementLoader.elements);
        if (prefixResult) {
          return {
            result: prefixResult.i,
            element: prefixResult
          };
        }
      }
      
      return null;
    };
    
    // Hook into element getting to include prefixed elements
    const originalGetElement = gameElementLoader.getElementByKey;
    
    gameElementLoader.getElementByKey = (key) => {
      // Check normal elements first
      const normalElement = originalGetElement.call(gameElementLoader, key);
      if (normalElement) return normalElement;
      
      // Check prefixed elements
      const prefixedElement = this.getPrefixedElement(parseInt(key));
      return prefixedElement || null;
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicPrefixSystem;
} else if (typeof window !== 'undefined') {
  window.DynamicPrefixSystem = DynamicPrefixSystem;
}