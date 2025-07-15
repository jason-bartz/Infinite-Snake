// Debug Configuration for Infinite Snake
// Controls logging, performance overlay, and debug features

const DEBUG_CONFIG = {
    // Master debug switch
    enabled: false,
    
    // Logging controls
    enableLogging: false,           // Enable console.log statements
    logLevel: 'warn',              // 'debug', 'info', 'warn', 'error'
    
    // Performance monitoring
    showPerformanceOverlay: false,  // Show FPS and metrics overlay
    logPerformanceWarnings: true,   // Log when FPS drops below threshold
    performanceThreshold: 30,       // FPS threshold for warnings
    
    // Feature-specific logging
    features: {
        ai: false,                  // AI decision logging
        collision: false,           // Collision detection logging
        rendering: false,           // Rendering pipeline logging
        particles: false,           // Particle system logging
        elements: false,            // Element spawning/collection logging
        network: false,             // Network/leaderboard logging
        mobile: false,              // Mobile UI logging
        audio: false,               // Sound system logging
        gameState: false,           // Game state changes logging
        input: false,               // Input handling logging
        performance: false          // Performance system logging
    },
    
    // Visual debugging
    visual: {
        showCollisionBoxes: false,  // Draw collision boundaries
        showQuadtree: false,        // Visualize quadtree divisions
        showAITargets: false,       // Show AI snake targets
        showPathfinding: false,     // Show AI pathfinding
        showElementSpawns: false,   // Highlight element spawn points
        showPerformanceHints: false // Show performance optimization hints
    },
    
    // Development helpers
    dev: {
        skipLoadingScreen: false,   // Skip loading screen
        unlockAllSkins: false,      // Unlock all skins for testing
        infiniteBoost: false,       // Unlimited boost
        godMode: false,             // Player can't die
        spawnBoss: false,           // Spawn boss on demand
        controlAI: false,           // Control AI snakes
        slowMotion: false,          // Slow down game speed
        speedMultiplier: 1.0        // Game speed multiplier
    },
    
    // Performance profiling
    profiling: {
        enabled: false,             // Enable detailed profiling
        sampleRate: 100,            // Sample every N frames
        sections: {                 // Profile these sections
            update: true,
            render: true,
            collision: true,
            ai: true,
            particles: true,
            physics: true
        }
    },
    
    // Network debugging
    network: {
        logRequests: false,         // Log all network requests
        simulateLatency: 0,         // Add artificial latency (ms)
        simulateOffline: false,     // Simulate offline mode
        logLeaderboard: false       // Log leaderboard updates
    },
    
    // Mobile debugging
    mobile: {
        forceMode: null,            // Force 'fixed' or 'slideout' mode
        logTouches: false,          // Log touch events
        showTouchPoints: false,     // Visualize touch points
        logOrientation: false       // Log orientation changes
    }
};

// Debug utilities
const Debug = {
    // Conditional logging based on debug config
    log(category, ...args) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.enableLogging) return;
        
        if (category === 'general' || DEBUG_CONFIG.features[category]) {
            console.log(`[${category.toUpperCase()}]`, ...args);
        }
    },
    
    warn(category, ...args) {
        if (!DEBUG_CONFIG.enabled) return;
        
        if (DEBUG_CONFIG.logLevel === 'warn' || DEBUG_CONFIG.logLevel === 'debug') {
            console.warn(`[${category.toUpperCase()}]`, ...args);
        }
    },
    
    error(category, ...args) {
        // Always log errors when debug is enabled
        if (DEBUG_CONFIG.enabled) {
            console.error(`[${category.toUpperCase()}]`, ...args);
        }
    },
    
    // Performance-specific logging
    performance(metric, value) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.features.performance) return;
        
        console.log(`[PERFORMANCE] ${metric}:`, value);
    },
    
    // Network logging
    network(action, data) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.network.logRequests) return;
        
        console.log(`[NETWORK] ${action}:`, data);
    },
    
    // Visual debug helpers
    drawDebugInfo(ctx, info) {
        if (!DEBUG_CONFIG.enabled || !DEBUG_CONFIG.visual.showPerformanceHints) return;
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
        ctx.font = '12px monospace';
        ctx.fillText(info, 10, 30);
        ctx.restore();
    },
    
    // Check if a feature is enabled
    isEnabled(feature) {
        return DEBUG_CONFIG.enabled && DEBUG_CONFIG.features[feature];
    },
    
    // Check if visual debugging is enabled
    isVisualEnabled(visualFeature) {
        return DEBUG_CONFIG.enabled && DEBUG_CONFIG.visual[visualFeature];
    },
    
    // Check if dev mode is enabled
    isDevEnabled(devFeature) {
        return DEBUG_CONFIG.enabled && DEBUG_CONFIG.dev[devFeature];
    },
    
    // Toggle debug mode
    toggle() {
        DEBUG_CONFIG.enabled = !DEBUG_CONFIG.enabled;
        console.log(`Debug mode: ${DEBUG_CONFIG.enabled ? 'ON' : 'OFF'}`);
        
        // Notify performance system
        if (window.performanceSystem) {
            window.performanceSystem.debug = DEBUG_CONFIG;
            if (DEBUG_CONFIG.showPerformanceOverlay && !window.performanceSystem.overlayEnabled) {
                window.performanceSystem.createOverlay();
            } else if (!DEBUG_CONFIG.showPerformanceOverlay && window.performanceSystem.overlayEnabled) {
                window.performanceSystem.overlay?.remove();
                window.performanceSystem.overlayEnabled = false;
            }
        }
    },
    
    // Enable specific feature
    enableFeature(feature) {
        if (DEBUG_CONFIG.features.hasOwnProperty(feature)) {
            DEBUG_CONFIG.features[feature] = true;
            console.log(`Debug feature '${feature}' enabled`);
        }
    },
    
    // Disable specific feature
    disableFeature(feature) {
        if (DEBUG_CONFIG.features.hasOwnProperty(feature)) {
            DEBUG_CONFIG.features[feature] = false;
            console.log(`Debug feature '${feature}' disabled`);
        }
    }
};

// Keyboard shortcuts for debug mode (only in development)
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
        // Ctrl+Shift+D to toggle debug mode
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            Debug.toggle();
        }
        
        // Ctrl+Shift+P to toggle performance overlay
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            DEBUG_CONFIG.showPerformanceOverlay = !DEBUG_CONFIG.showPerformanceOverlay;
            Debug.toggle(); // Refresh overlay
            Debug.toggle();
        }
    });
}

// Make available globally
window.DEBUG_CONFIG = DEBUG_CONFIG;
window.Debug = Debug;

// Export for module usage
export default DEBUG_CONFIG;
export { Debug };