/**
 * Element Loader Module
 * Handles loading and managing elements with the new scalable system
 */

class ElementLoader {
    constructor() {
        this.manifest = null;
        this.elements = new Map(); // id -> element
        this.elementsByKey = new Map(); // key -> element
        this.combinations = new Map(); // "id1,id2" -> resultId
        this.dependencies = null;
        this.loaded = false;
    }

    /**
     * Initialize the element system
     */
    async init() {
        try {
            // Load manifest
            this.manifest = await this.loadJSON('elements/manifest.json');
            
            // Load enabled packs
            for (const pack of this.manifest.packs) {
                if (pack.enabled) {
                    await this.loadPack(pack);
                }
            }
            
            // Load dependencies
            this.dependencies = await this.loadJSON('elements/element-dependencies.json');
            
            this.loaded = true;
            console.log(`Element system loaded: ${this.elements.size} elements, ${this.combinations.size} combinations`);
        } catch (error) {
            console.error('Failed to initialize element system:', error);
            throw error;
        }
    }

    /**
     * Load a JSON file
     */
    async loadJSON(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to load ${path}:`, error);
            throw error;
        }
    }

    /**
     * Load an element pack
     */
    async loadPack(pack) {
        console.log(`Loading pack: ${pack.name}`);
        
        // Load elements
        if (pack.elements) {
            console.log(`Loading elements from: elements/${pack.elements}`);
            const elementsData = await this.loadJSON(`elements/${pack.elements}`);
            console.log(`Loaded elements data for ${pack.name}:`, elementsData ? 'success' : 'null');
            this.loadElements(elementsData);
        }
        
        // Load combinations
        if (pack.combinations) {
            console.log(`Loading combinations from: elements/${pack.combinations}`);
            const combinationsData = await this.loadJSON(`elements/${pack.combinations}`);
            this.loadCombinations(combinationsData);
        }
    }

    /**
     * Load elements from data
     */
    loadElements(data) {
        if (!data || !data.elements) {
            console.error('Invalid element data:', data);
            return;
        }
        
        for (const [id, element] of Object.entries(data.elements)) {
            const numId = parseInt(id);
            this.elements.set(numId, element);
            this.elementsByKey.set(element.key, element);
        }
    }

    /**
     * Load combinations from data
     */
    loadCombinations(data) {
        // Use the combinationIndex for fast lookups if available
        if (data.combinationIndex) {
            for (const [key, resultId] of Object.entries(data.combinationIndex)) {
                this.combinations.set(key, resultId);
            }
        } else if (data.combinations && Array.isArray(data.combinations)) {
            // Build index from combinations array
            for (const combo of data.combinations) {
                if (combo.sources && combo.result) {
                    const [id1, id2] = combo.sources;
                    // Normalize the key (smaller id first)
                    const key = id1 <= id2 ? `${id1},${id2}` : `${id2},${id1}`;
                    this.combinations.set(key, combo.result);
                }
            }
        }
    }

    /**
     * Get element by ID
     */
    getElementById(id) {
        return this.elements.get(parseInt(id));
    }

    /**
     * Get element by key
     */
    getElementByKey(key) {
        return this.elementsByKey.get(key);
    }

    /**
     * Get combination result
     */
    getCombination(id1, id2) {
        // Normalize the key (smaller id first)
        const key = id1 <= id2 ? `${id1},${id2}` : `${id2},${id1}`;
        const resultId = this.combinations.get(key);
        return resultId ? this.getElementById(resultId) : null;
    }

    /**
     * Get combination by keys (backward compatibility)
     */
    getCombinationByKeys(key1, key2) {
        const elem1 = this.getElementByKey(key1);
        const elem2 = this.getElementByKey(key2);
        
        if (!elem1 || !elem2) return null;
        
        return this.getCombination(elem1.id, elem2.id);
    }

    /**
     * Get all elements as array
     */
    getAllElements() {
        return Array.from(this.elements.values());
    }

    /**
     * Get elements by tier
     */
    getElementsByTier(tier) {
        return this.getAllElements().filter(elem => elem.tier === tier);
    }

    /**
     * Get elements by category
     */
    getElementsByCategory(category) {
        return this.getAllElements().filter(elem => elem.category === category);
    }

    /**
     * Get base elements
     */
    getBaseElements() {
        return this.getAllElements().filter(elem => elem.base);
    }

    /**
     * Get discovered elements
     */
    getDiscoveredElements() {
        return this.getAllElements().filter(elem => elem.discovered);
    }

    /**
     * Mark element as discovered
     */
    discoverElement(id) {
        const element = this.getElementById(id);
        if (element) {
            element.discovered = true;
            return true;
        }
        return false;
    }

    /**
     * Get element dependencies
     */
    getElementDependencies(id) {
        if (!this.dependencies) return null;
        return this.dependencies.dependencies[id];
    }

    /**
     * Convert to legacy format (backward compatibility)
     */
    toLegacyFormat() {
        const legacy = {
            version: "1.0",
            elements: {},
            combinations: {}
        };

        // Convert elements
        for (const elem of this.elements.values()) {
            legacy.elements[elem.key] = {
                emoji: elem.emoji,
                name: elem.name,
                tier: elem.tier,
                discovered: elem.discovered,
                base: elem.base || false
            };
        }

        // Convert combinations
        for (const [key, resultId] of this.combinations.entries()) {
            const [id1, id2] = key.split(',').map(Number);
            const elem1 = this.getElementById(id1);
            const elem2 = this.getElementById(id2);
            const result = this.getElementById(resultId);
            
            if (elem1 && elem2 && result) {
                const legacyKey = `${elem1.key}+${elem2.key}`;
                legacy.combinations[legacyKey] = result.key;
            }
        }

        return legacy;
    }

    /**
     * Import from legacy format
     */
    importFromLegacy(legacyData) {
        console.log('Importing from legacy format...');
        
        // This would convert legacy format to new format
        // Implementation depends on specific requirements
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementLoader;
} else {
    window.ElementLoader = ElementLoader;
}