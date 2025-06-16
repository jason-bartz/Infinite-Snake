/**
 * Simplified Game Element Loader for Infinite Snake
 * Loads elements and combinations directly for the game
 */

(function() {
    'use strict';

    class OptimizedGameLoader {
        constructor() {
            this.elements = new Map();
            this.combinations = {};
            this.emojiMap = {};
            this.loaded = false;
            this.deletedElements = new Set();
            this.deletedCombinations = new Set();
        }

        async loadAll() {
            if (this.loaded) return;

            try {
                // Load combined element file
                const elementsResponse = await fetch('elements/data/elements.json');
                const allElements = await elementsResponse.json();
                
                // Process all elements
                allElements.forEach(elem => {
                    this.elements.set(elem.i, elem);
                });

                // Load deleted elements
                try {
                    const deletedElementsResponse = await fetch('elements/deleted-elements.json');
                    if (deletedElementsResponse.ok) {
                        const deletedArray = await deletedElementsResponse.json();
                        this.deletedElements = new Set(deletedArray.map(id => parseInt(id)));
                        console.log(`[GameLoader] Loaded ${this.deletedElements.size} deleted elements`);
                        
                        // Remove deleted elements
                        this.deletedElements.forEach(id => {
                            this.elements.delete(id);
                        });
                    }
                } catch (err) {
                    console.log('[GameLoader] No deleted elements found');
                }

                // Load combinations
                const combinationsResponse = await fetch('elements/data/combinations.json');
                this.combinations = await combinationsResponse.json();
                
                // Load deleted combinations
                try {
                    const deletedCombosResponse = await fetch('elements/deleted-combinations.json');
                    if (deletedCombosResponse.ok) {
                        const deletedArray = await deletedCombosResponse.json();
                        this.deletedCombinations = new Set(deletedArray);
                        console.log(`[GameLoader] Loaded ${this.deletedCombinations.size} deleted combinations`);
                        
                        // Remove deleted combinations
                        this.deletedCombinations.forEach(combo => {
                            delete this.combinations[combo];
                            const [a, b] = combo.split('+');
                            delete this.combinations[`${b}+${a}`];
                        });
                    }
                } catch (err) {
                    console.log('[GameLoader] No deleted combinations found');
                }

                // Load emoji mapping from JSON
                try {
                    const emojiResponse = await fetch('elements/data/emojis.json');
                    const emojiData = await emojiResponse.json();
                    
                    // Build the emoji map
                    this.emojiMap = {};
                    
                    // First, add all emoji index mappings
                    for (const [key, emoji] of Object.entries(emojiData)) {
                        this.emojiMap[key] = emoji;
                    }
                    
                    // Then, for each element, if there's an element-specific emoji, 
                    // use it instead of the shared emojiIndex
                    for (const [elementId, element] of this.elements) {
                        if (emojiData[elementId]) {
                            // Element has a specific emoji override
                            // Create a special key for this element's emoji lookup
                            this.emojiMap[`element_${elementId}`] = emojiData[elementId];
                        }
                    }
                } catch (e) {
                    console.error('Failed to load emoji map:', e);
                    this.emojiMap = {};
                }

                this.loaded = true;
                console.log(`Loaded ${this.elements.size} elements and ${Object.keys(this.combinations).length} combinations`);

                // Dispatch loaded event
                window.dispatchEvent(new Event('elementsLoaded'));

            } catch (error) {
                console.error('Failed to load game elements:', error);
                this.createFallbackElements();
            }
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
            });

            this.emojiMap = {
                0: '🌍',
                1: '💧',
                2: '💨',
                3: '🔥'
            };

            window.dispatchEvent(new Event('elementsLoaded'));
        }

        isLoaded() {
            return this.loaded;
        }

        getElementByKey(key) {
            // For compatibility - not used in numeric system
            return null;
        }

        getAllElements() {
            // Return array of all elements for compatibility
            const allElements = [];
            for (const [id, elem] of this.elements) {
                allElements.push({
                    key: id,
                    name: elem.n,
                    tier: elem.t,
                    base: elem.t === 0
                });
            }
            return allElements;
        }

        getCombinationByKeys(key1, key2) {
            // For compatibility - not used in numeric system
            return null;
        }
        
        getEmojiForElement(elementId, emojiIndex) {
            // First check for element-specific emoji
            const specificEmoji = this.emojiMap[`element_${elementId}`];
            if (specificEmoji) {
                return specificEmoji;
            }
            
            // Fall back to shared emoji index
            return this.emojiMap[emojiIndex] || '❓';
        }
    }

    // Create and initialize the loader
    const loader = new OptimizedGameLoader();
    
    // Export for use
    window.elementLoader = loader;
    
    // Auto-load on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => loader.loadAll());
    } else {
        loader.loadAll();
    }
})();