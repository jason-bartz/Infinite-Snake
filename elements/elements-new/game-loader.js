/**
 * Game Element Loader for Infinite Snake
 * This is the main entry point that delegates to the optimized loader
 */

// Import or include the optimized loader
if (typeof require !== 'undefined') {
    const OptimizedGameLoader = require('./optimized-game-loader');
    module.exports = OptimizedGameLoader;
} else {
    // In browser, use the OptimizedGameLoader directly
    // It should be loaded via script tag before this file
    if (typeof window !== 'undefined' && window.OptimizedGameLoader) {
        window.GameElementLoader = window.OptimizedGameLoader;
    }
}