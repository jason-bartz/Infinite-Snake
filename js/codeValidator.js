// Code Validator - Handles unlock code validation and redemption
class CodeValidator {
    constructor() {
        this.STORAGE_KEY = 'infiniteSnakeRedeemedCodes';
        this.redeemedCodes = this.loadRedeemedCodes();
        
        // Pre-hashed valid codes (hashed versions of DISCORD-2025-XXXX format)
        // These are generated offline and added here by admin
        this.VALID_CODES = [
            '507fbf89', // DISCORD-2025-JMQZ
            '5080068c', // DISCORD-2025-IYTM
            '5081fe09', // DISCORD-2025-F123
            '50876aaa', // DISCORD-2025-9R4F
            '507ab954', // DISCORD-2025-UOFM
            '507bab97', // DISCORD-2025-SLTY
            '507fcad3', // DISCORD-2025-JJQS
            '50818d4c', // DISCORD-2025-FNR3
            '50822757', // DISCORD-2025-EE20
            '5087d34c', // DISCORD-2025-8U8D
            '507ed9aa', // DISCORD-2025-LLYD
            '508105eb', // DISCORD-2025-H4T2
            '5081efb8', // DISCORD-2025-F4JY
            '508ad752', // DISCORD-2025-2AC7
            '508a5abc', // DISCORD-2025-3CI2
            '508b055c', // DISCORD-2025-24YP
            '507b1e76', // DISCORD-2025-TSHH
            '507b6087', // DISCORD-2025-TB66
            '507e4bea', // DISCORD-2025-MSR7
            '50831ae7'  // DISCORD-2025-CATD
            // Add more hashed codes as needed
        ];
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
            
            return { 
                valid: true, 
                message: 'Code redeemed successfully!',
                skinId: 'discord-elite'
            };
        }
        
        return { valid: false, message: 'Invalid code' };
    }
    
    // Check if a specific skin code has been redeemed
    hasRedeemedSkinCode(skinId) {
        if (skinId === 'discord-elite') {
            // Check if any Discord code has been redeemed
            for (const code of this.redeemedCodes) {
                if (code.startsWith('DISCORD-')) {
                    return true;
                }
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