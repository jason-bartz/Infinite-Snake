/**
 * Element System Integration - Coordinates initialization and provides unified interface
 * This is the main entry point that ensures everything loads in the correct order
 */

(function() {
  'use strict';
  
  let integrationReady = false;
  let initializationPromise = null;
  
  // Integration status
  const integration = {
    gameLoader: false,
    elementLoader: false,
    compatibility: false,
    prefixSystem: false,
    ready: false
  };

  /**
   * Main integration initialization
   */
  async function initializeElementSystem() {
    if (initializationPromise) return initializationPromise;
    
    initializationPromise = (async () => {
      console.log('🚀 Starting Element System Integration...');
      
      try {
        // Step 1: Wait for GameElementLoader to be available
        await waitForScript('GameElementLoader', 'game-loader.js');
        integration.gameLoader = true;
        console.log('✅ GameElementLoader ready');
        
        // Step 2: Initialize element loader
        await waitForReady('elementLoaderReady', () => window.elementLoader?.isLoaded());
        integration.elementLoader = true;
        console.log('✅ ElementLoader ready');
        
        // Step 3: Initialize compatibility layer
        await waitForReady('compatibilityLayerReady', () => window.elementCompatibility?.isInitialized());
        integration.compatibility = true;
        console.log('✅ CompatibilityLayer ready');
        
        // Step 4: Initialize dynamic prefix system
        await waitForScript('DynamicPrefixSystem', 'dynamic-prefix-system.js');
        setupPrefixSystem();
        integration.prefixSystem = true;
        console.log('✅ DynamicPrefixSystem ready');
        
        // Step 5: Final integration setup
        setupGlobalInterface();
        integration.ready = true;
        integrationReady = true;
        
        console.log('🎉 Element System Integration Complete!');
        console.log('📊 System Status:', getSystemStatus());
        
        // Dispatch global ready event
        window.dispatchEvent(new CustomEvent('elementsLoaded', {
          detail: {
            stats: getSystemStatus(),
            interface: getGlobalInterface()
          }
        }));
        
        return true;
        
      } catch (error) {
        console.error('❌ Element System Integration Failed:', error);
        
        // Setup fallback system
        setupFallbackSystem();
        
        // Still dispatch event so game doesn't hang
        window.dispatchEvent(new CustomEvent('elementsLoaded', {
          detail: { fallback: true, error: error.message }
        }));
        
        throw error;
      }
    })();
    
    return initializationPromise;
  }

  /**
   * Wait for a script/class to be available
   */
  async function waitForScript(className, scriptName, timeout = 10000) {
    const startTime = Date.now();
    
    while (!window[className] && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!window[className]) {
      throw new Error(`Failed to load ${className} from ${scriptName}`);
    }
  }

  /**
   * Wait for ready event or condition
   */
  async function waitForReady(eventName, condition, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for ${eventName}`));
      }, timeout);
      
      // Check condition immediately
      if (condition && condition()) {
        clearTimeout(timeoutId);
        resolve();
        return;
      }
      
      // Listen for event
      window.addEventListener(eventName, () => {
        clearTimeout(timeoutId);
        resolve();
      }, { once: true });
    });
  }

  /**
   * Setup dynamic prefix system
   */
  function setupPrefixSystem() {
    if (!window.DynamicPrefixSystem) {
      throw new Error('DynamicPrefixSystem not available');
    }
    
    // Initialize prefix system
    window.dynamicPrefixSystem = new window.DynamicPrefixSystem();
    
    // Integrate with game element loader
    if (window.elementLoader?.gameLoader) {
      window.dynamicPrefixSystem.integrateWithGame(window.elementLoader.gameLoader);
      console.log('🎨 Dynamic prefix system integrated with game loader');
    }
  }

  /**
   * Setup global interface for easy access
   */
  function setupGlobalInterface() {
    window.elements = {
      // Core instances
      loader: window.elementLoader,
      compatibility: window.elementCompatibility,
      gameLoader: window.elementLoader?.gameLoader,
      prefixSystem: window.dynamicPrefixSystem,
      
      // Quick access methods
      get: (key) => window.elementCompatibility.getElement(key),
      combine: (a, b) => window.elementCompatibility.getCombination(a, b),
      search: (query) => window.elementCompatibility.searchElements(query),
      
      // Discovery methods
      discover: (key) => window.elementCompatibility.markDiscovered(key),
      isDiscovered: (key) => window.elementCompatibility.getDiscoveredElements().has(key),
      
      // Prefix system methods
      getPrefixedElements: () => window.dynamicPrefixSystem?.getActivePrefixedElements() || [],
      clearPrefixes: () => window.dynamicPrefixSystem?.clearPrefixedElements(),
      
      // Stats and info
      stats: () => getSystemStatus(),
      count: () => window.elementCompatibility.getElementCount(),
      combinations: () => window.elementCompatibility.getCombinationCount(),
      
      // Utility
      format: (key) => window.elementCompatibility.formatElementName(key),
      emoji: (key) => window.elementCompatibility.getElementEmoji(key),
      tier: (key) => window.elementCompatibility.getElementTier(key),
      
      // Legacy access
      elements: () => window.elementCompatibility.getAllElements(),
      combos: () => window.elementCompatibility.getAllCombinations(),
      
      // System status
      ready: () => integrationReady,
      integration: () => ({ ...integration })
    };
    
    console.log('🌐 Global elements interface available at window.elements');
  }

  /**
   * Setup fallback system if main system fails
   */
  function setupFallbackSystem() {
    console.warn('⚠️ Setting up fallback element system');
    
    const fallbackElements = {
      fire: { emoji: '🔥', name: 'Fire', tier: 0, base: true },
      water: { emoji: '💧', name: 'Water', tier: 0, base: true },
      earth: { emoji: '🌍', name: 'Earth', tier: 0, base: true },
      air: { emoji: '💨', name: 'Air', tier: 0, base: true },
      steam: { emoji: '💨', name: 'Steam', tier: 1 },
      mud: { emoji: '🟫', name: 'Mud', tier: 1 },
      dust: { emoji: '🌪️', name: 'Dust', tier: 1 },
      lava: { emoji: '🌋', name: 'Lava', tier: 1 }
    };
    
    const fallbackCombinations = {
      'fire+water': 'steam',
      'water+fire': 'steam',
      'water+earth': 'mud',
      'earth+water': 'mud',
      'earth+air': 'dust',
      'air+earth': 'dust',
      'fire+earth': 'lava',
      'earth+fire': 'lava'
    };
    
    // Create minimal compatibility layer
    window.elementCompatibility = {
      legacyCache: {
        elements: fallbackElements,
        combinations: fallbackCombinations
      },
      isInitialized: () => true,
      getElement: (key) => fallbackElements[key],
      getCombination: (a, b) => fallbackCombinations[`${a}+${b}`] || fallbackCombinations[`${b}+${a}`],
      getAllElements: () => fallbackElements,
      getAllCombinations: () => fallbackCombinations
    };
    
    // Setup minimal global interface
    window.elements = {
      get: (key) => fallbackElements[key],
      combine: (a, b) => fallbackCombinations[`${a}+${b}`] || fallbackCombinations[`${b}+${a}`],
      elements: () => fallbackElements,
      combos: () => fallbackCombinations,
      ready: () => true,
      fallback: true
    };
  }

  /**
   * Get system status
   */
  function getSystemStatus() {
    return {
      integration: { ...integration },
      elements: window.elementCompatibility?.getElementCount() || 0,
      combinations: window.elementCompatibility?.getCombinationCount() || 0,
      gameLoader: !!window.elementLoader?.gameLoader,
      memoryUsage: getMemoryUsage(),
      ready: integrationReady
    };
  }

  /**
   * Get memory usage estimate
   */
  function getMemoryUsage() {
    try {
      if (window.elementLoader?.gameLoader) {
        const stats = window.elementLoader.gameLoader.getStats();
        return {
          elements: stats.totalElements || 0,
          emojis: stats.totalEmojis || 0,
          estimated: '~1MB'
        };
      }
    } catch (error) {
      // Ignore errors
    }
    
    return { estimated: 'Unknown' };
  }

  /**
   * Get global interface object
   */
  function getGlobalInterface() {
    return {
      available: !!window.elements,
      methods: window.elements ? Object.keys(window.elements) : [],
      compatibility: !!window.elementCompatibility,
      loader: !!window.elementLoader
    };
  }

  // Auto-start integration when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeElementSystem);
  } else {
    // DOM already loaded, start immediately
    setTimeout(initializeElementSystem, 0);
  }

  // Expose integration function globally
  window.initializeElementSystem = initializeElementSystem;
  
  // Debug helpers
  window.elementSystemDebug = {
    status: getSystemStatus,
    restart: initializeElementSystem,
    fallback: setupFallbackSystem,
    interface: getGlobalInterface
  };

})();