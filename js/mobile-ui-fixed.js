// Mobile UI Fixed - Handles the fixed positioning UI for mobile

// Initialize mobile UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check for mobile using the same method as mobile-ui-unified.js
    const checkMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               'ontouchstart' in window ||
               window.innerWidth < 768;
    };
    
    if (!checkMobile()) return;
    
    // Wait for mobile-ui-unified to initialize first
    setTimeout(() => {
        initializeMobileLeaderboard();
        removeSlideOutHandlers();
        forceFixedPositioning();
        
        // Apply fixes again after delays to override any late-loading styles
        setTimeout(forceFixedPositioning, 100);
        setTimeout(forceFixedPositioning, 500);
        setTimeout(forceFixedPositioning, 1000);
        
        // Keep applying periodically to combat other scripts
        setInterval(forceFixedPositioning, 2000);
    }, 200);
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

// Override the togglePanel function to prevent slide-out behavior
if (typeof window.togglePanel !== 'undefined') {
    const originalTogglePanel = window.togglePanel;
    window.togglePanel = function(panelType) {
        // Allow boost functionality to continue
        if (panelType === 'boost') {
            return originalTogglePanel(panelType);
        }
        // Block panel sliding for stats and leaderboard
        return false;
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
    const checkMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               'ontouchstart' in window ||
               window.innerWidth < 768;
    };
    
    if (!checkMobile()) return;
    
    const statsPanel = document.querySelector('.player-info-box');
    const leaderboardPanel = document.querySelector('.leaderboard-box');
    const discoveryFeed = document.querySelector('.discovery-feed');
    
    if (statsPanel) {
        // Remove any tab handles first
        const tabHandle = statsPanel.querySelector('.mobile-tab-handle');
        if (tabHandle) tabHandle.remove();
        
        // Force fixed positioning
        statsPanel.style.position = 'fixed';
        statsPanel.style.top = '10px';
        statsPanel.style.left = '10px';
        statsPanel.style.right = 'auto';
        statsPanel.style.bottom = 'auto';
        statsPanel.style.width = '140px';
        statsPanel.style.display = 'block';
        statsPanel.style.visibility = 'visible';
        statsPanel.style.opacity = '1';
        statsPanel.style.zIndex = '100';
        statsPanel.style.transform = 'none';
        statsPanel.style.transition = 'none';
        statsPanel.style.background = '#1a1a1a';
        statsPanel.style.border = '3px solid';
        statsPanel.style.borderColor = '#505050 #000000 #000000 #505050';
        
        statsPanel.classList.remove('expanded');
    }
    
    if (leaderboardPanel) {
        // Remove any tab handles first
        const tabHandle = leaderboardPanel.querySelector('.mobile-tab-handle');
        if (tabHandle) tabHandle.remove();
        
        // Check if header exists, if not create it
        let header = leaderboardPanel.querySelector('.leaderboard-header');
        if (!header) {
            const existingContent = leaderboardPanel.innerHTML;
            leaderboardPanel.innerHTML = '<div class="leaderboard-header">Leaderboard</div>' + existingContent;
            header = leaderboardPanel.querySelector('.leaderboard-header');
        }
        
        // Force fixed positioning
        const isCollapsed = leaderboardPanel.classList.contains('collapsed');
        leaderboardPanel.style.position = 'fixed';
        leaderboardPanel.style.top = '10px';
        leaderboardPanel.style.right = '10px';
        leaderboardPanel.style.left = 'auto';
        leaderboardPanel.style.bottom = 'auto';
        leaderboardPanel.style.width = '180px';
        leaderboardPanel.style.height = isCollapsed ? '30px' : 'auto';
        leaderboardPanel.style.maxHeight = '250px';
        leaderboardPanel.style.display = 'block';
        leaderboardPanel.style.visibility = 'visible';
        leaderboardPanel.style.opacity = '1';
        leaderboardPanel.style.zIndex = '100';
        leaderboardPanel.style.transform = 'none';
        leaderboardPanel.style.transition = 'height 0.3s ease-out';
        leaderboardPanel.style.background = '#1a1a1a';
        leaderboardPanel.style.border = '3px solid';
        leaderboardPanel.style.borderColor = '#505050 #000000 #000000 #505050';
        leaderboardPanel.style.overflow = 'hidden';
        
        leaderboardPanel.classList.remove('expanded');
        
        // Re-attach click handler if needed
        if (header && !header.hasAttribute('data-click-attached')) {
            header.style.cursor = 'pointer';
            header.style.pointerEvents = 'auto';
            header.addEventListener('click', toggleLeaderboard);
            header.setAttribute('data-click-attached', 'true');
        }
    }
    
    if (discoveryFeed) {
        discoveryFeed.style.position = 'fixed';
        discoveryFeed.style.top = '120px';
        discoveryFeed.style.left = '10px';
        discoveryFeed.style.right = 'auto';
        discoveryFeed.style.bottom = 'auto';
        discoveryFeed.style.width = '180px';
        discoveryFeed.style.maxHeight = '200px';
        discoveryFeed.style.opacity = '0.6';
        discoveryFeed.style.zIndex = '80';
    }
}

// Export functions for use in other scripts
window.mobileUIFixed = {
    toggleLeaderboard: toggleLeaderboard,
    ensurePanelsVisible: ensurePanelsVisible,
    forceFixedPositioning: forceFixedPositioning
};