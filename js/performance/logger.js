// Logger Wrapper for Infinite Snake
// Provides controlled logging based on debug configuration

import { Debug } from './debug-config.js';

class Logger {
    constructor(category = 'general') {
        this.category = category;
    }
    
    log(...args) {
        Debug.log(this.category, ...args);
    }
    
    warn(...args) {
        Debug.warn(this.category, ...args);
    }
    
    error(...args) {
        Debug.error(this.category, ...args);
    }
    
    info(...args) {
        this.log(...args);
    }
    
    debug(...args) {
        if (window.DEBUG_CONFIG?.logLevel === 'debug') {
            this.log(...args);
        }
    }
    
    // Conditional logging
    logIf(condition, ...args) {
        if (condition) {
            this.log(...args);
        }
    }
    
    // Performance logging
    time(label) {
        if (Debug.isEnabled(this.category)) {
            console.time(`[${this.category.toUpperCase()}] ${label}`);
        }
    }
    
    timeEnd(label) {
        if (Debug.isEnabled(this.category)) {
            console.timeEnd(`[${this.category.toUpperCase()}] ${label}`);
        }
    }
    
    // Group logging
    group(label) {
        if (Debug.isEnabled(this.category)) {
            console.group(`[${this.category.toUpperCase()}] ${label}`);
        }
    }
    
    groupEnd() {
        if (Debug.isEnabled(this.category)) {
            console.groupEnd();
        }
    }
    
    // Table logging
    table(data) {
        if (Debug.isEnabled(this.category)) {
            console.table(data);
        }
    }
}

// Factory function to create loggers for different categories
function createLogger(category) {
    return new Logger(category);
}

// Pre-created loggers for common categories
const loggers = {
    general: createLogger('general'),
    ai: createLogger('ai'),
    collision: createLogger('collision'),
    rendering: createLogger('rendering'),
    particles: createLogger('particles'),
    elements: createLogger('elements'),
    network: createLogger('network'),
    mobile: createLogger('mobile'),
    audio: createLogger('audio'),
    gameState: createLogger('gameState'),
    input: createLogger('input'),
    performance: createLogger('performance')
};

// Global console override (optional - can be enabled in debug config)
const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
};

function overrideConsole() {
    console.log = (...args) => {
        if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.enableLogging) {
            originalConsole.log(...args);
        }
    };
    
    console.info = (...args) => {
        if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.enableLogging) {
            originalConsole.info(...args);
        }
    };
    
    console.debug = (...args) => {
        if (window.DEBUG_CONFIG?.enabled && window.DEBUG_CONFIG?.logLevel === 'debug') {
            originalConsole.debug(...args);
        }
    };
    
    // Always allow warnings and errors, but only in debug mode
    console.warn = (...args) => {
        if (window.DEBUG_CONFIG?.enabled) {
            originalConsole.warn(...args);
        }
    };
    
    console.error = (...args) => {
        if (window.DEBUG_CONFIG?.enabled) {
            originalConsole.error(...args);
        }
    };
}

function restoreConsole() {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
    console.debug = originalConsole.debug;
}

// Migration helper - replaces console.log with logger
function migrateConsoleLog(code, category = 'general') {
    // This is a helper function that could be used in build process
    // to automatically replace console.log statements
    return code.replace(/console\.log\(/g, `logger.${category}.log(`);
}

// Export everything
export { Logger, createLogger, loggers, overrideConsole, restoreConsole, migrateConsoleLog };

// Make available globally
window.Logger = Logger;
window.createLogger = createLogger;
window.loggers = loggers;
window.overrideConsole = overrideConsole;
window.restoreConsole = restoreConsole;