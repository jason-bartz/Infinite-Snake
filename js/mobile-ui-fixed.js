// Mobile UI Fixed - Handles the fixed positioning UI for mobile

// Initialize mobile UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    if (!isMobile) return;
    
    initializeMobileLeaderboard();
    removeSlideOutHandlers();
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

// Export functions for use in other scripts
window.mobileUIFixed = {
    toggleLeaderboard: toggleLeaderboard,
    ensurePanelsVisible: ensurePanelsVisible
};