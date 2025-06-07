/**
 * Compatibility Layer
 * Bridges the new element system with the existing game code
 */

class ElementCompatibilityLayer {
    constructor(elementLoader) {
        this.loader = elementLoader;
        this.legacyCache = null;
    }

    /**
     * Initialize compatibility layer
     */
    async init() {
        if (!this.loader.loaded) {
            await this.loader.init();
        }
        
        // Create legacy format cache
        this.legacyCache = this.loader.toLegacyFormat();
        
        // Override global elements if they exist
        if (typeof window !== 'undefined') {
            this.installGlobalHooks();
        }
    }

    /**
     * Install global hooks for backward compatibility
     */
    installGlobalHooks() {
        const self = this;
        
        // If there's a global elements object, replace it
        if (window.elements) {
            console.log('Replacing global elements with compatibility layer');
            
            // Create proxy for elements
            window.elements = new Proxy({}, {
                get(target, prop) {
                    if (prop === 'version') return self.legacyCache.version;
                    if (prop === 'elements') return self.legacyCache.elements;
                    if (prop === 'combinations') return self.legacyCache.combinations;
                    
                    // Direct element access
                    const element = self.loader.getElementByKey(prop);
                    if (element) {
                        return {
                            emoji: element.emoji,
                            name: element.name,
                            tier: element.tier,
                            discovered: element.discovered,
                            base: element.base || false
                        };
                    }
                    
                    return undefined;
                }
            });
        }

        // Hook into game functions if they exist
        this.hookGameFunctions();
    }

    /**
     * Hook into existing game functions
     */
    hookGameFunctions() {
        // Hook checkCombination if it exists
        if (typeof window.checkCombination === 'function') {
            const originalCheckCombination = window.checkCombination;
            window.checkCombination = (elem1, elem2) => {
                // Try new system first
                const result = this.loader.getCombinationByKeys(elem1, elem2);
                if (result) {
                    return result.key;
                }
                
                // Fall back to original
                return originalCheckCombination(elem1, elem2);
            };
        }

        // Hook discoverElement if it exists
        if (typeof window.discoverElement === 'function') {
            const originalDiscoverElement = window.discoverElement;
            window.discoverElement = (elementKey) => {
                // Update new system
                const element = this.loader.getElementByKey(elementKey);
                if (element) {
                    this.loader.discoverElement(element.id);
                    
                    // Update legacy cache
                    if (this.legacyCache.elements[elementKey]) {
                        this.legacyCache.elements[elementKey].discovered = true;
                    }
                }
                
                // Call original
                return originalDiscoverElement(elementKey);
            };
        }

        // Hook getDiscoveredElements if it exists
        if (typeof window.getDiscoveredElements === 'function') {
            window.getDiscoveredElements = () => {
                return this.loader.getDiscoveredElements().map(elem => elem.key);
            };
        }
    }

    /**
     * Get element data in legacy format
     */
    getElementLegacy(key) {
        const element = this.loader.getElementByKey(key);
        if (!element) return null;
        
        return {
            emoji: element.emoji,
            name: element.name,
            tier: element.tier,
            discovered: element.discovered,
            base: element.base || false
        };
    }

    /**
     * Check combination in legacy format
     */
    checkCombinationLegacy(key1, key2) {
        const result = this.loader.getCombinationByKeys(key1, key2);
        return result ? result.key : null;
    }

    /**
     * Get all combinations in legacy format
     */
    getCombinationsLegacy() {
        const combinations = {};
        
        for (const [key, resultId] of this.loader.combinations.entries()) {
            const [id1, id2] = key.split(',').map(Number);
            const elem1 = this.loader.getElementById(id1);
            const elem2 = this.loader.getElementById(id2);
            const result = this.loader.getElementById(resultId);
            
            if (elem1 && elem2 && result) {
                combinations[`${elem1.key}+${elem2.key}`] = result.key;
            }
        }
        
        return combinations;
    }

    /**
     * Save discovered elements (integrate with existing save system)
     */
    saveDiscoveredElements() {
        const discovered = this.loader.getDiscoveredElements().map(elem => elem.key);
        
        // Try to use existing save mechanism
        if (typeof window.saveDiscoveredElements === 'function') {
            window.saveDiscoveredElements(discovered);
        } else {
            // Fallback to localStorage
            localStorage.setItem('discoveredElements', JSON.stringify(discovered));
        }
    }

    /**
     * Load discovered elements
     */
    loadDiscoveredElements() {
        let discovered = [];
        
        // Try to use existing load mechanism
        if (typeof window.loadDiscoveredElements === 'function') {
            discovered = window.loadDiscoveredElements();
        } else {
            // Fallback to localStorage
            const saved = localStorage.getItem('discoveredElements');
            if (saved) {
                discovered = JSON.parse(saved);
            }
        }

        // Update element states
        for (const key of discovered) {
            const element = this.loader.getElementByKey(key);
            if (element) {
                this.loader.discoverElement(element.id);
            }
        }
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementCompatibilityLayer;
} else {
    window.ElementCompatibilityLayer = ElementCompatibilityLayer;
}