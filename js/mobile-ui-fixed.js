// Mobile UI Fixed - Handles the fixed positioning UI for mobile

// Initialize mobile UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (!isMobile) return;
    
    initializeMobileLeaderboard();
    removeSlideOutHandlers();
    forceFixedPositioning();
    
    // Apply fixes again after a short delay to override any late-loading styles
    setTimeout(forceFixedPositioning, 100);
    setTimeout(forceFixedPositioning, 500);
    setTimeout(forceFixedPositioning, 1000);
});

// Initialize leaderboard collapse functionality
function initializeMobileLeaderboard() {
    const leaderboardBox = document.querySelector('.leaderboard-box');
    const leaderboardHeader = document.querySelector('.leaderboard-header');
    
    if (!leaderboardBox || !leaderboardHeader) return;
    
    // Start collapsed
    leaderboardBox.classList.add('collapsed');
    
    // Load saved state from localStorage
    const isCollapsed = localStorage.getItem('mobileLeaderboardCollapsed');
    if (isCollapsed === 'false') {
        leaderboardBox.classList.remove('collapsed');
    }
    
    // Add click handler to header
    leaderboardHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleLeaderboard();
    });
    
    // Add touch handler for better mobile response
    leaderboardHeader.addEventListener('touchend', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleLeaderboard();
    });
}

// Toggle leaderboard collapsed state
function toggleLeaderboard() {
    const leaderboardBox = document.querySelector('.leaderboard-box');
    if (!leaderboardBox) return;
    
    leaderboardBox.classList.toggle('collapsed');
    
    // Save state to localStorage
    const isCollapsed = leaderboardBox.classList.contains('collapsed');
    localStorage.setItem('mobileLeaderboardCollapsed', isCollapsed);
    
    // Play UI sound if available
    if (typeof playUISound === 'function') {
        playUISound();
    }
}

// Remove old slide-out panel handlers
function removeSlideOutHandlers() {
    // Remove any existing mobile tab handles
    const tabHandles = document.querySelectorAll('.mobile-tab-handle');
    tabHandles.forEach(handle => {
        handle.remove();
    });
    
    // Remove panel overlay if exists
    const overlay = document.querySelector('.mobile-panel-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Remove expanded classes
    const panels = document.querySelectorAll('.player-info-box, .leaderboard-box');
    panels.forEach(panel => {
        panel.classList.remove('expanded');
    });
    
    // Clear any stored panel states
    localStorage.removeItem('statsPanelExpanded');
    localStorage.removeItem('leaderboardPanelExpanded');
}

// Override the togglePanel function if it exists
if (typeof window.togglePanel !== 'undefined') {
    window.togglePanel = function() {
        // Do nothing - panels are now fixed
    };
}

// Make sure panels stay visible
function ensurePanelsVisible() {
    if (!isMobile) return;
    
    const statsPanel = document.querySelector('.player-info-box');
    const leaderboardPanel = document.querySelector('.leaderboard-box');
    
    if (statsPanel) {
        statsPanel.style.display = 'block';
        statsPanel.style.visibility = 'visible';
    }
    
    if (leaderboardPanel) {
        leaderboardPanel.style.display = 'block';
        leaderboardPanel.style.visibility = 'visible';
    }
}

// Check visibility periodically
setInterval(ensurePanelsVisible, 1000);

// Force fixed positioning on panels
function forceFixedPositioning() {
    if (!isMobile) return;
    
    const statsPanel = document.querySelector('.player-info-box');
    const leaderboardPanel = document.querySelector('.leaderboard-box');
    const discoveryFeed = document.querySelector('.discovery-feed');
    
    if (statsPanel) {
        // Force remove any conflicting styles
        statsPanel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            left: 10px !important;
            right: auto !important;
            bottom: auto !important;
            width: 140px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
            transform: none !important;
        `;
        statsPanel.classList.remove('expanded');
    }
    
    if (leaderboardPanel) {
        // Force remove any conflicting styles
        const isCollapsed = leaderboardPanel.classList.contains('collapsed');
        leaderboardPanel.style.cssText = `
            position: fixed !important;
            top: 10px !important;
            right: 10px !important;
            left: auto !important;
            bottom: auto !important;
            width: 180px !important;
            height: ${isCollapsed ? '30px' : 'auto'} !important;
            max-height: 250px !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            z-index: 100 !important;
            transform: none !important;
        `;
        leaderboardPanel.classList.remove('expanded');
    }
    
    if (discoveryFeed) {
        discoveryFeed.style.cssText = `
            position: fixed !important;
            top: 120px !important;
            left: 10px !important;
            right: auto !important;
            bottom: auto !important;
            width: 180px !important;
            max-height: 200px !important;
            opacity: 0.6 !important;
            z-index: 80 !important;
        `;
    }
}

// Export functions for use in other scripts
window.mobileUIFixed = {
    toggleLeaderboard: toggleLeaderboard,
    ensurePanelsVisible: ensurePanelsVisible,
    forceFixedPositioning: forceFixedPositioning
};