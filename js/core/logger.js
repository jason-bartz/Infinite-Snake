// Production-ready logger for Infinite Snake
class GameLogger {
    constructor() {
        // Production mode by default - set to true for development
        this.debugMode = false;
        
        // Log levels
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3,
            CRITICAL: 4,
            NONE: 5
        };
        
        // Set minimum log level for production
        this.minLevel = this.levels.ERROR;
        
        // Check for development environment
        if (typeof window !== 'undefined') {
            // Check URL params or localStorage for debug mode
            const urlParams = new URLSearchParams(window.location.search);
            this.debugMode = urlParams.get('debug') === 'true' || 
                           localStorage.getItem('debugMode') === 'true';
            
            if (this.debugMode) {
                this.minLevel = this.levels.DEBUG;
                console.info('🐛 Debug mode enabled');
            }
        }
        
        // Suppress certain tags in production
        this.suppressedTags = new Set([
            'NEBULA GENERATION',
            'BOSS',
            'COMBINATION',
            'SHOCKWAVE',
            'VOID ORB',
            'ELEMENT BANK',
            'SPAWN POOL',
            'RESPAWN',
            'Game Event'
        ]);
    }
    
    shouldLog(level, tag = '') {
        // Never log suppressed tags in production
        if (!this.debugMode && this.suppressedTags.has(tag)) {
            return false;
        }
        
        return level >= this.minLevel;
    }
    
    formatMessage(level, tag, message, ...args) {
        if (tag) {
            return [`[${tag}] ${message}`, ...args];
        }
        return [message, ...args];
    }
    
    debug(tag, message, ...args) {
        if (this.shouldLog(this.levels.DEBUG, tag)) {
            console.log(...this.formatMessage(this.levels.DEBUG, tag, message, ...args));
        }
    }
    
    info(tag, message, ...args) {
        if (this.shouldLog(this.levels.INFO, tag)) {
            console.info(...this.formatMessage(this.levels.INFO, tag, message, ...args));
        }
    }
    
    warn(tag, message, ...args) {
        if (this.shouldLog(this.levels.WARN, tag)) {
            console.warn(...this.formatMessage(this.levels.WARN, tag, message, ...args));
        }
    }
    
    error(tag, message, ...args) {
        if (this.shouldLog(this.levels.ERROR, tag)) {
            console.error(...this.formatMessage(this.levels.ERROR, tag, message, ...args));
        }
    }
    
    critical(tag, message, ...args) {
        if (this.shouldLog(this.levels.CRITICAL, tag)) {
            console.error(...this.formatMessage(this.levels.CRITICAL, tag, message, ...args));
        }
    }
    
    // Special method for asset loading - only shows summary in production
    assetProgress(percent, phase) {
        if (this.debugMode) {
            console.log(`Loading assets: ${percent}% - ${phase}`);
        } else if (percent === 0) {
            console.info('Loading game assets...');
        } else if (percent === 100) {
            console.info('✓ Game ready');
        }
    }
    
    // Enable debug mode programmatically
    enableDebug() {
        this.debugMode = true;
        this.minLevel = this.levels.DEBUG;
        localStorage.setItem('debugMode', 'true');
        console.info('🐛 Debug mode enabled');
    }
    
    // Disable debug mode
    disableDebug() {
        this.debugMode = false;
        this.minLevel = this.levels.ERROR;
        localStorage.removeItem('debugMode');
        console.info('Debug mode disabled');
    }
}

// Create singleton instance
const gameLogger = new GameLogger();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = gameLogger;
} else {
    window.gameLogger = gameLogger;
}