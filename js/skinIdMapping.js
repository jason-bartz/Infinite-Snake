// Mapping between old skin IDs (used in index.html) and new skin IDs (used in skinData.js)
const skinIdMapping = {
    // Map old IDs to new IDs
    oldToNew: {
        // Common skins
        'flame': 'hot-head',
        'dog': 'good-boy',
        'neko': 'lil-beans',
        'whale': 'spout',
        '35mm': 'ansel-35',
        'clock': 'time-out',
        'boat-mcboatface': 'boat-mcboatface', // Same ID
        'kid-car': 'speed-demon-jr',
        'racer': 'speed-demon',
        'gnome': 'world-traveler',
        'floral': 'bo-kay',
        'brick-man': 'the-special',
        
        // Uncommon skins
        'pod-player': 'poddington',
        'tv': 'crt-surfer',
        'murica': 'murica', // Same ID
        'tornado': 'whirlwind',
        'football': 'mvp',
        'barbi': 'margot',
        'coffee': 'caffeine-fiend',
        'diet-cola': 'cola-crusader',
        'fries': 'sir-dips-a-lot',
        
        // Rare skins
        'camera-guy': 'the-resistance',
        'green-dragon': 'world-muncher',
        'red-dragon': 'ralph',
        'ice-dragon': 'ice-dragon', // Same ID
        'potato': 'spud-bud',
        'hotdog': 'big-dawg',
        'pizza': 'tony-pep',
        'donut': 'sprinkles',
        'ramen': 'noodle-master',
        'controller': 'little-bro',
        
        // Legendary skins
        'skibidi': 'mr-swirley',
        'Frank': 'franklin',
        'saturn': 'ring-leader',
        'space-cadet': 'cosmic-ray',
        'buffalo': 'billy-blue',
        'robot': 'metal-boi',
        'santa': 'ho-ho-hose',
        
        // Exotic skins
        'mac': 'woz',
        'handheld-game': 'the-pocketeer',
        'unicorn': 'tres-commas',
        'nyan': 'pastry-cat',
        'infinity-glove': 'snappy',
        'lovecraft': 'eldritch-horror'
    },
    
    // Reverse mapping (new IDs to old IDs)
    newToOld: {}
};

// Generate reverse mapping
for (const [oldId, newId] of Object.entries(skinIdMapping.oldToNew)) {
    skinIdMapping.newToOld[newId] = oldId;
}

// Conversion functions
const skinIdConverter = {
    /**
     * Convert old skin ID to new skin ID
     * @param {string} oldId - The old skin ID from index.html
     * @returns {string} The new skin ID from skinData.js
     */
    toNewId(oldId) {
        return skinIdMapping.oldToNew[oldId] || oldId;
    },
    
    /**
     * Convert new skin ID to old skin ID
     * @param {string} newId - The new skin ID from skinData.js
     * @returns {string} The old skin ID from index.html
     */
    toOldId(newId) {
        return skinIdMapping.newToOld[newId] || newId;
    },
    
    /**
     * Convert an array of old skin IDs to new skin IDs
     * @param {string[]} oldIds - Array of old skin IDs
     * @returns {string[]} Array of new skin IDs
     */
    toNewIds(oldIds) {
        return oldIds.map(id => this.toNewId(id));
    },
    
    /**
     * Convert an array of new skin IDs to old skin IDs
     * @param {string[]} newIds - Array of new skin IDs
     * @returns {string[]} Array of old skin IDs
     */
    toOldIds(newIds) {
        return newIds.map(id => this.toOldId(id));
    },
    
    /**
     * Check if a skin ID is an old format ID
     * @param {string} id - The skin ID to check
     * @returns {boolean} True if it's an old format ID
     */
    isOldId(id) {
        return id in skinIdMapping.oldToNew;
    },
    
    /**
     * Check if a skin ID is a new format ID
     * @param {string} id - The skin ID to check
     * @returns {boolean} True if it's a new format ID
     */
    isNewId(id) {
        return id in skinIdMapping.newToOld;
    },
    
    /**
     * Get all old skin IDs
     * @returns {string[]} Array of all old skin IDs
     */
    getAllOldIds() {
        return Object.keys(skinIdMapping.oldToNew);
    },
    
    /**
     * Get all new skin IDs
     * @returns {string[]} Array of all new skin IDs
     */
    getAllNewIds() {
        return Object.keys(skinIdMapping.newToOld);
    }
};

// Export for use in other modules
window.skinIdConverter = skinIdConverter;
window.skinIdMapping = skinIdMapping;