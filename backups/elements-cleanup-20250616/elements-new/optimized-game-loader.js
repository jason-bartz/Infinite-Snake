/**
 * Optimized Game Element Loader for Infinite Snake
 * Loads elements and combinations efficiently for the game
 */

(function() {
    'use strict';

    class OptimizedGameLoader {
        constructor() {
            this.elements = new Map();
            this.combinations = {};
            this.elementsByName = new Map();
            this.loaded = false;
        }

        async loadAll() {
            if (this.loaded) return;

            try {
                // Load all element files
                const elementFiles = [
                    'elements-core.json',
                    'elements-life.json',
                    'elements-civilization.json',
                    'elements-modern.json',
                    'elements-fictional.json',
                    'elements-humorous-fusions.json'
                ];

                // Load elements
                const elementPromises = elementFiles.map(file => 
                    fetch(`elements/elements-new/${file}`).then(r => r.json())
                );
                
                const elementArrays = await Promise.all(elementPromises);
                
                // Process all elements
                elementArrays.forEach(elements => {
                    elements.forEach(elem => {
                        this.elements.set(elem.i, elem);
                        this.elementsByName.set(elem.n.toLowerCase(), elem);
                    });
                });

                // Load combinations
                const combinationsResponse = await fetch('elements/elements-new/combinations.json');
                this.combinations = await combinationsResponse.json();

                // Load emoji mapping
                try {
                    const emojiModule = await import('./emojis.js');
                    this.emojiMap = emojiModule.EMOJI_MAP;
                    console.log('Loaded emoji map via import, entries:', Object.keys(this.emojiMap).length);
                } catch (e) {
                    console.log('Import failed, trying fetch method:', e.message);
                    // Fallback: try loading as regular script
                    const emojiResponse = await fetch('elements/elements-new/emojis.js');
                    const emojiText = await emojiResponse.text();
                    
                    // Extract EMOJI_MAP from the text
                    const match = emojiText.match(/export const EMOJI_MAP = ({[\s\S]*?});/);
                    if (match) {
                        this.emojiMap = eval('(' + match[1] + ')');
                        console.log('Loaded emoji map via fetch, entries:', Object.keys(this.emojiMap).length);
                    } else {
                        console.error('Failed to parse emoji map');
                        this.emojiMap = {};
                    }
                }
                
                // Verify emoji map loaded
                console.log('Emoji map sample:', {
                    fire: this.emojiMap[3],
                    water: this.emojiMap[1],
                    earth: this.emojiMap[0],
                    air: this.emojiMap[2]
                });

                this.loaded = true;
                console.log(`Loaded ${this.elements.size} elements and ${Object.keys(this.combinations).length} combinations`);

                // Create compatibility layer for legacy game code
                this.createCompatibilityLayer();

                // Dispatch loaded event
                window.dispatchEvent(new Event('elementsLoaded'));

            } catch (error) {
                console.error('Failed to load game elements:', error);
                this.createFallbackElements();
            }
        }

        createCompatibilityLayer() {
            // Create legacy format for backward compatibility
            const legacyElements = {};
            const legacyCombinations = {};

            // Convert elements to legacy format
            this.elements.forEach((elem, id) => {
                const legacyKey = elem.n.toLowerCase().replace(/\s+/g, '_');
                legacyElements[legacyKey] = {
                    id: elem.i,
                    emoji: this.emojiMap[elem.e] || '❓',
                    name: elem.n,
                    tier: elem.t,
                    base: elem.t === 0
                };
            });
            
            // Log some sample elements to verify
            console.log('Legacy elements sample:', {
                fire: legacyElements.fire,
                water: legacyElements.water,
                earth: legacyElements.earth,
                air: legacyElements.air
            });

            // Convert combinations to legacy format
            Object.entries(this.combinations).forEach(([combo, resultId]) => {
                const [id1, id2] = combo.split('+').map(Number);
                const elem1 = this.elements.get(id1);
                const elem2 = this.elements.get(id2);
                const result = this.elements.get(resultId);

                if (elem1 && elem2 && result) {
                    const key1 = elem1.n.toLowerCase().replace(/\s+/g, '_');
                    const key2 = elem2.n.toLowerCase().replace(/\s+/g, '_');
                    const resultKey = result.n.toLowerCase().replace(/\s+/g, '_');
                    
                    // Store both orders
                    legacyCombinations[`${key1}+${key2}`] = resultKey;
                    legacyCombinations[`${key2}+${key1}`] = resultKey;
                }
            });

            // Set up compatibility layer
            window.elementDatabase = legacyElements;
            window.combinations = legacyCombinations;
            
            window.elementCompatibility = {
                legacyCache: {
                    elements: legacyElements,
                    combinations: legacyCombinations
                },
                getElement: (nameOrId) => {
                    if (typeof nameOrId === 'number') {
                        return this.elements.get(nameOrId);
                    }
                    return this.elementsByName.get(nameOrId.toLowerCase());
                },
                getCombination: (elem1, elem2) => {
                    const id1 = typeof elem1 === 'number' ? elem1 : this.elementsByName.get(elem1.toLowerCase())?.i;
                    const id2 = typeof elem2 === 'number' ? elem2 : this.elementsByName.get(elem2.toLowerCase())?.i;
                    
                    if (!id1 || !id2) return null;
                    
                    const key = `${Math.min(id1, id2)}+${Math.max(id1, id2)}`;
                    const resultId = this.combinations[key];
                    
                    return resultId ? this.elements.get(resultId) : null;
                },
                loadDiscoveredElements: () => {
                    // Load discovered elements from localStorage
                    try {
                        const saved = localStorage.getItem('infiniteSnake_discoveredElements');
                        if (saved) {
                            const discovered = JSON.parse(saved);
                            // Convert to Set of element keys
                            return new Set(discovered);
                        }
                    } catch (e) {
                        console.error('Failed to load discovered elements:', e);
                    }
                    // Return set with base elements
                    return new Set(['earth', 'water', 'air', 'fire']);
                },
                saveDiscoveredElements: (discoveries) => {
                    // Save discovered elements to localStorage
                    try {
                        const elementsArray = Array.from(discoveries);
                        localStorage.setItem('infiniteSnake_discoveredElements', JSON.stringify(elementsArray));
                    } catch (e) {
                        console.error('Failed to save discovered elements:', e);
                    }
                },
                resetDiscoveries: () => {
                    // Reset discoveries to just base elements
                    try {
                        localStorage.removeItem('infiniteSnake_discoveredElements');
                    } catch (e) {
                        console.error('Failed to reset discoveries:', e);
                    }
                    return new Set(['earth', 'water', 'air', 'fire']);
                },
                getCombinationByKeys: (key1, key2) => {
                    // Get combination result by element keys (legacy format)
                    const combo = legacyCombinations[`${key1}+${key2}`] || legacyCombinations[`${key2}+${key1}`];
                    return combo ? { key: combo } : null;
                }
            };
            
            // Store legacy combinations globally for access
            this.legacyCombinations = legacyCombinations;
            
            // Also add the function to window.elementLoader for backward compatibility
            window.elementLoader.getCombinationByKeys = (key1, key2) => {
                const combo = this.legacyCombinations[`${key1}+${key2}`] || this.legacyCombinations[`${key2}+${key1}`];
                return combo || null;
            };
            
            // Add getElementByKey for emoji display
            window.elementLoader.getElementByKey = (key) => {
                // First check legacy cache
                const legacyElem = legacyElements[key];
                if (legacyElem) {
                    return {
                        emoji: legacyElem.emoji,
                        name: legacyElem.name,
                        tier: legacyElem.tier,
                        base: legacyElem.base
                    };
                }
                
                // Try to find by name (normalize the key)
                const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                
                // First try with the underscore version
                let elem = this.elementsByName.get(normalizedKey);
                
                // If not found, try without underscores (direct lowercase)
                if (!elem) {
                    elem = this.elementsByName.get(key.toLowerCase());
                }
                
                if (elem) {
                    return {
                        emoji: this.emojiMap[elem.e] || '❓',
                        name: elem.n,
                        tier: elem.t,
                        base: elem.t === 0
                    };
                }
                
                // Also check the direct legacy lookup
                if (legacyElements[normalizedKey]) {
                    return legacyElements[normalizedKey];
                }
                
                return null;
            };
            
            // Add isLoaded method
            window.elementLoader.isLoaded = () => this.loaded;
            
            // Add getAllElements method
            window.elementLoader.getAllElements = () => {
                // Return array of element objects from legacy cache
                return Object.entries(legacyElements).map(([key, elem]) => ({
                    key: key,
                    emoji: elem.emoji,
                    name: elem.name,
                    tier: elem.tier,
                    base: elem.base
                }));
            };
            
            // Add discoverElement method (placeholder - just logs for now)
            window.elementLoader.discoverElement = (elementId) => {
                console.log('[discoverElement] Element discovered:', elementId);
            };
        }

        createFallbackElements() {
            // Basic fallback elements if loading fails
            const fallbackElements = [
                { i: 0, n: 'Earth', t: 0, e: 0 },
                { i: 1, n: 'Water', t: 0, e: 1 },
                { i: 2, n: 'Air', t: 0, e: 2 },
                { i: 3, n: 'Fire', t: 0, e: 3 }
            ];

            fallbackElements.forEach(elem => {
                this.elements.set(elem.i, elem);
                this.elementsByName.set(elem.n.toLowerCase(), elem);
            });

            this.createCompatibilityLayer();
            window.dispatchEvent(new Event('elementsLoaded'));
        }
    }

    // Create and initialize the loader
    const loader = new OptimizedGameLoader();
    
    // Export for use
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = OptimizedGameLoader;
    } else {
        window.OptimizedGameLoader = OptimizedGameLoader;
        window.elementLoader = loader;
        
        // Auto-load on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => loader.loadAll());
        } else {
            loader.loadAll();
        }
    }
})();