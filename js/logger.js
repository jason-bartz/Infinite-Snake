// Production-ready logging system with configurable levels
// Replaces verbose console.log statements throughout the game

(function() {
    'use strict';
    
    // Log levels
    const LogLevel = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        NONE: 4
    };
    
    class Logger {
        constructor() {
            // Default to ERROR only in production
            this.level = this.isProduction() ? LogLevel.ERROR : LogLevel.INFO;
            
            // Check for debug mode via URL parameter or localStorage
            if (this.isDebugMode()) {
                this.level = LogLevel.DEBUG;
            }
            
            // Bind methods to preserve context
            this.debug = this.debug.bind(this);
            this.info = this.info.bind(this);
            this.warn = this.warn.bind(this);
            this.error = this.error.bind(this);
        }
        
        isProduction() {
            // Check if we're in production based on hostname
            const hostname = window.location.hostname;
            return hostname !== 'localhost' && 
                   hostname !== '127.0.0.1' && 
                   !hostname.includes('local') &&
                   !hostname.startsWith('192.168.');
        }
        
        isDebugMode() {
            // Check URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('debug') === 'true') {
                return true;
            }
            
            // Check localStorage
            return localStorage.getItem('debugMode') === 'true';
        }
        
        setLevel(level) {
            if (typeof level === 'string') {
                this.level = LogLevel[level.toUpperCase()] || LogLevel.ERROR;
            } else {
                this.level = level;
            }
        }
        
        enableDebugMode() {
            localStorage.setItem('debugMode', 'true');
            this.level = LogLevel.DEBUG;
            this.info('Debug mode enabled');
        }
        
        disableDebugMode() {
            localStorage.removeItem('debugMode');
            this.level = this.isProduction() ? LogLevel.ERROR : LogLevel.INFO;
            this.info('Debug mode disabled');
        }
        
        debug(...args) {
            if (this.level <= LogLevel.DEBUG) {
                console.log('[DEBUG]', ...args);
            }
        }
        
        info(...args) {
            if (this.level <= LogLevel.INFO) {
                console.log(...args);
            }
        }
        
        warn(...args) {
            if (this.level <= LogLevel.WARN) {
                console.warn(...args);
            }
        }
        
        error(...args) {
            if (this.level <= LogLevel.ERROR) {
                console.error(...args);
            }
        }
        
        // Convenience method for grouped logs
        group(label) {
            if (this.level <= LogLevel.DEBUG) {
                console.group(label);
            }
        }
        
        groupEnd() {
            if (this.level <= LogLevel.DEBUG) {
                console.groupEnd();
            }
        }
        
        // Performance timing (only in debug mode)
        time(label) {
            if (this.level <= LogLevel.DEBUG) {
                console.time(label);
            }
        }
        
        timeEnd(label) {
            if (this.level <= LogLevel.DEBUG) {
                console.timeEnd(label);
            }
        }
        
        // Table logging (only in debug mode)
        table(data) {
            if (this.level <= LogLevel.DEBUG) {
                console.table(data);
            }
        }
    }
    
    // Create singleton instance
    const logger = new Logger();
    
    // Expose globally
    window.Logger = Logger;
    window.logger = logger;
    
    // Also expose as a module if needed
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { Logger, logger };
    }
    
    // Log initial state (only in non-production)
    if (!logger.isProduction()) {
        logger.info('Logger initialized. Level:', Object.keys(LogLevel).find(key => LogLevel[key] === logger.level));
    }
})();