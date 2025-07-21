// Mobile UI Configuration for Infinite Snake
// Centralized configuration for mobile UI behavior

const MOBILE_UI_CONFIG = {
    // UI Mode: 'fixed' or 'slideout'
    // - fixed: Panels are always visible in fixed positions
    // - slideout: Panels slide in/out from screen edges with tabs
    mode: 'fixed',
    
    // Feature toggles
    features: {
        boostMeter: true,          // Show boost amount as meter fill
        skinPreview: true,         // Show current skin in stats tab (slideout mode)
        discoveryFeed: true,       // Enable click-to-dismiss for discovery messages
        collapsibleLeaderboard: true, // Allow leaderboard collapse in fixed mode
        autoHideOnGameStart: false // Hide UI when game starts (not implemented in original)
    },
    
    // Timing configuration (milliseconds)
    timing: {
        updateInterval: 100,       // How often to update boost meter and skin
        panelTransition: 300,      // Slide animation duration
        retryDelay: 500,          // Delay before retrying element detection
        visibilityCheck: 2000     // How often to ensure visibility (fixed mode)
    },
    
    // Visual configuration
    visual: {
        panelOpacity: 0.9,        // Opacity for UI panels
        panelMaxWidth: 280,       // Maximum width for panels
        tabWidth: 40,             // Width of slideout tabs
        tabHeight: 120,           // Height of slideout tabs
        boostButtonSize: 140      // Size of boost button (matches joystick)
    },
    
    // Position configuration (fixed mode)
    positions: {
        stats: {
            top: 10,
            left: 10
        },
        leaderboard: {
            top: 10,
            right: 10
        },
        boostButton: {
            bottom: 120,
            right: 105
        },
        discoveryFeed: {
            bottom: 330,
            maxItems: 2
        }
    },
    
    // Mobile detection thresholds
    detection: {
        smallScreenWidth: 768,     // Width threshold for mobile detection
        enableUADetection: true,   // Use user agent detection
        enableTouchDetection: true, // Use touch capability detection
        enablePointerDetection: true // Use pointer:coarse detection
    },
    
    // Debug options
    debug: {
        logInitialization: true,   // Log init process
        logMobileDetection: false, // Log mobile detection details
        logPanelToggle: false,     // Log panel open/close events
        showFPS: false            // Show FPS counter (if implemented)
    }
};

// Export for module usage
export default MOBILE_UI_CONFIG;

// Also make available globally for non-module usage
window.MOBILE_UI_CONFIG = MOBILE_UI_CONFIG;