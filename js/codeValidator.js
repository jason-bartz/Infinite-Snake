// Code Validator - Handles unlock code validation and redemption
class CodeValidator {
    constructor() {
        this.STORAGE_KEY = 'infiniteSnakeRedeemedCodes';
        this.redeemedCodes = this.loadRedeemedCodes();
        
        // Map of code hashes to skin IDs
        // Each Discord code unlocks a specific skin
        this.CODE_TO_SKIN_MAP = {
            // Original 20 codes
            '507fbf89': 'discord-elite',    // DISCORD-2025-JMQZ - Keep Scarabyte for first code
            '5080068c': 'hot-head',         // DISCORD-2025-IYTM
            '5081fe09': 'good-boy',         // DISCORD-2025-F123
            '50876aaa': 'lil-beans',        // DISCORD-2025-9R4F
            '507ab954': 'spout',            // DISCORD-2025-UOFM
            '507bab97': 'ansel-35',         // DISCORD-2025-SLTY
            '507fcad3': 'time-out',         // DISCORD-2025-JJQS
            '50818d4c': 'boat-mcboatface',  // DISCORD-2025-FNR3
            '50822757': 'speed-demon-jr',   // DISCORD-2025-EE20
            '5087d34c': 'speed-demon',      // DISCORD-2025-8U8D
            '507ed9aa': 'world-traveler',   // DISCORD-2025-LLYD
            '508105eb': 'bo-kay',           // DISCORD-2025-H4T2
            '5081efb8': 'the-special',      // DISCORD-2025-F4JY
            '508ad752': 'ruby',             // DISCORD-2025-2AC7
            '508a5abc': 'chirpy',           // DISCORD-2025-3CI2
            '508b055c': 'poddington',       // DISCORD-2025-24YP
            '507b1e76': 'crt-surfer',       // DISCORD-2025-TSHH
            '507b6087': 'murica',           // DISCORD-2025-TB66
            '507e4bea': 'whirlwind',        // DISCORD-2025-MSR7
            '50831ae7': 'mvp',              // DISCORD-2025-CATD
            
            // New batch codes (38 more for remaining skins)
            '5082db5d': 'margot',           // DISCORD-2025-CS2Z
            '5079177a': 'caffeine-fiend',   // DISCORD-2025-YC1B
            '507fc8c0': 'cola-crusader',    // DISCORD-2025-JKD8
            '50793346': 'sir-dips-a-lot',   // DISCORD-2025-XZCP
            '508ab79e': 'sir-whirl',        // DISCORD-2025-2J1P
            '507b8977': 'colonel-kernel',   // DISCORD-2025-T6WS
            '507f5be7': 'scuffy',           // DISCORD-2025-KICS
            '507ec783': 'the-resistance',   // DISCORD-2025-LQTA
            '50897093': 'world-muncher',    // DISCORD-2025-5CTH
            '5079c8b2': 'ralph',            // DISCORD-2025-WQJ3
            '507d00f4': 'ice-dragon',       // DISCORD-2025-Q07Y
            '508269ed': 'spud-bud',         // DISCORD-2025-E2XS
            '508a9910': 'big-dawg',         // DISCORD-2025-335Z
            '507e7154': 'tony-pep',         // DISCORD-2025-MJ48
            '507cb650': 'sprinkles',        // DISCORD-2025-QCSF
            '507f6976': 'noodle-master',    // DISCORD-2025-KF0T
            '508853e8': 'little-bro',       // DISCORD-2025-82OB
            '508014f0': 'mr-swirley',       // DISCORD-2025-IUYR
            '5089d588': 'franklin',         // DISCORD-2025-4H8Q
            '50830824': 'ring-leader',      // DISCORD-2025-CG5B
            '507fd593': 'cosmic-ray',       // DISCORD-2025-JH6Z
            '507b5986': 'billy-blue',       // DISCORD-2025-TCQ1
            '507fd54f': 'metal-boi',        // DISCORD-2025-JH9A
            '5079bb7d': 'ho-ho-hose',       // DISCORD-2025-X5Z5
            '507bec2d': 'pixel',            // DISCORD-2025-RZNN
            '507caf60': 'woz',              // DISCORD-2025-QENO
            '507ad25d': 'the-pocketeer',    // DISCORD-2025-UI26
            '50793cb9': 'tres-commas',      // DISCORD-2025-Y8S0
            '50891c5d': 'pastry-cat',       // DISCORD-2025-5ZC6
            '50893019': 'snappy',           // DISCORD-2025-5TZ7
            '507bf67b': 'eldritch-horror',  // DISCORD-2025-S8VK
            '507d2685': 'midnight',         // DISCORD-2025-PDW3
            '507a2517': 'gilly',            // DISCORD-2025-VWUR
            '5082f3c0': 'abyssos',          // DISCORD-2025-CLBN
            '507d1599': 'osseus',           // DISCORD-2025-PIGJ
            '507e7d94': 'pyraxis',          // DISCORD-2025-MFJR
            '50883336': 'zephyrus',         // DISCORD-2025-7ZFB
            '5078664b': 'snake-default-green', // DISCORD-2025-ZRVH - Default green as bonus
            '507e0cda': 'neko-chan'         // DISCORD-2025-NEKO
        };
        
        // Extract valid codes array from the map
        this.VALID_CODES = Object.keys(this.CODE_TO_SKIN_MAP);
    }
    
    // Simple hash function for code validation
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 8);
    }
    
    // Load redeemed codes from localStorage
    loadRedeemedCodes() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch (error) {
            console.error('Failed to load redeemed codes:', error);
            return new Set();
        }
    }
    
    // Save redeemed codes to localStorage
    saveRedeemedCodes() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(Array.from(this.redeemedCodes)));
        } catch (error) {
            console.error('Failed to save redeemed codes:', error);
        }
    }
    
    // Validate and redeem a code
    validateCode(code) {
        // Normalize code (uppercase, trim whitespace)
        code = code.trim().toUpperCase();
        
        // Check if code matches expected format
        if (!code.match(/^DISCORD-\d{4}-[A-Z0-9]{4}$/)) {
            return { valid: false, message: 'Invalid code format' };
        }
        
        // Check if already redeemed
        if (this.redeemedCodes.has(code)) {
            return { valid: false, message: 'Code already redeemed' };
        }
        
        // Hash the code
        const hashedCode = this.simpleHash(code);
        
        // Check if hash matches any valid code
        if (this.VALID_CODES.includes(hashedCode)) {
            // Mark as redeemed
            this.redeemedCodes.add(code);
            this.saveRedeemedCodes();
            
            // Get the skin ID for this code
            const skinId = this.CODE_TO_SKIN_MAP[hashedCode];
            
            return { 
                valid: true, 
                message: 'Code redeemed successfully!',
                skinId: skinId
            };
        }
        
        return { valid: false, message: 'Invalid code' };
    }
    
    // Check if a specific skin code has been redeemed
    hasRedeemedSkinCode(skinId) {
        // Check if a code that unlocks this specific skin has been redeemed
        for (const code of this.redeemedCodes) {
            const hashedCode = this.simpleHash(code);
            if (this.CODE_TO_SKIN_MAP[hashedCode] === skinId) {
                return true;
            }
        }
        return false;
    }
    
    // Get stats about redemptions
    getRedemptionStats() {
        return {
            totalRedeemed: this.redeemedCodes.size,
            discordCodes: Array.from(this.redeemedCodes).filter(code => code.startsWith('DISCORD-')).length
        };
    }
}

// Initialize and export
window.codeValidator = new CodeValidator();