// Mobile UI Fixed - Handles the fixed positioning UI for mobile

// Initialize mobile UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Mobile UI Fixed] DOM loaded, initializing...');
    
    // Check for mobile using the same method as mobile-ui-unified.js
    const checkMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               'ontouchstart' in window ||
               window.innerWidth < 768;
    };
    
    const mobile = checkMobile();
    console.log('[Mobile UI Fixed] Mobile detected:', mobile);
    
    if (!mobile) {
        console.log('[Mobile UI Fixed] Not mobile, exiting');
        return;
    }
    
    // Add mobile class to body if not already present
    if (!document.body.classList.contains('mobile')) {
        document.body.classList.add('mobile');
        console.log('[Mobile UI Fixed] Added mobile class to body');
    }
    
    // Wait for mobile-ui-unified to initialize first
    setTimeout(() => {
        console.log('[Mobile UI Fixed] Starting initialization after delay...');
        initializeMobileLeaderboard();
        removeSlideOutHandlers();
        forceFixedPositioning();
        restoreBoostMeter();
        
        // Apply fixes again after delays to override any late-loading styles
        setTimeout(() => {
            console.log('[Mobile UI Fixed] Applying fixes after 100ms');
            forceFixedPositioning();
        }, 100);
        setTimeout(() => {
            console.log('[Mobile UI Fixed] Applying fixes after 500ms');
            forceFixedPositioning();
        }, 500);
        setTimeout(() => {
            console.log('[Mobile UI Fixed] Applying fixes after 1000ms');
            forceFixedPositioning();
        }, 1000);
        
        // Keep applying periodically to combat other scripts
        setInterval(() => {
            forceFixedPositioning();
            ensurePanelsVisible();
        }, 2000);
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
    const checkMobile = () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               'ontouchstart' in window ||
               window.innerWidth < 768;
    };
    
    if (!checkMobile()) return;
    
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
    
    console.log('[Mobile UI Fixed] forceFixedPositioning called:', {
        statsPanel: statsPanel ? 'found' : 'not found',
        leaderboardPanel: leaderboardPanel ? 'found' : 'not found',
        discoveryFeed: discoveryFeed ? 'found' : 'not found'
    });
    
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
        statsPanel.style.width = '160px';
        statsPanel.style.height = 'auto';
        statsPanel.style.display = 'block';
        statsPanel.style.visibility = 'visible';
        statsPanel.style.opacity = '1';
        statsPanel.style.zIndex = '100';
        statsPanel.style.transform = 'none';
        statsPanel.style.transition = 'none';
        statsPanel.style.background = 'rgba(16, 16, 64, 0.95)';
        statsPanel.style.border = '3px solid';
        statsPanel.style.borderColor = '#5878F8 #000080 #000080 #5878F8';
        statsPanel.style.borderRadius = '0';
        statsPanel.style.padding = '6px';
        statsPanel.style.boxShadow = '4px 4px 0 rgba(0, 0, 0, 0.5)';
        
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

// Restore boost button meter functionality
function restoreBoostMeter() {
    const boostButton = document.querySelector('.boost-button');
    if (!boostButton) return;
    
    // Ensure boost meter CSS is applied
    boostButton.style.overflow = 'hidden';
    boostButton.style.position = 'relative';
    
    // Create meter fill element if it doesn't exist
    let meterFill = boostButton.querySelector('.boost-meter-fill');
    if (!meterFill) {
        meterFill = document.createElement('div');
        meterFill.className = 'boost-meter-fill';
        meterFill.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: var(--boost-fill, 100%);
            background: linear-gradient(to top, 
                rgba(78, 205, 196, 0.6) 0%, 
                rgba(78, 205, 196, 0.3) 100%);
            transition: height 0.1s linear;
            pointer-events: none;
            z-index: 0;
        `;
        boostButton.insertBefore(meterFill, boostButton.firstChild);
    }
    
    // Ensure text is on top
    const boostText = boostButton.querySelector('span') || boostButton;
    if (boostText !== boostButton) {
        boostText.style.position = 'relative';
        boostText.style.zIndex = '1';
    }
    
    // Monitor boost amount from the game's boost bar
    setInterval(() => {
        const boostBar = document.getElementById('boostBarFill');
        if (boostBar) {
            const width = boostBar.style.width || '100%';
            const boostAmount = parseInt(width) || 100;
            boostButton.style.setProperty('--boost-fill', `${boostAmount}%`);
            
            // Update meter fill height
            if (meterFill) {
                meterFill.style.height = `${boostAmount}%`;
            }
            
            // Add low boost indicator
            if (boostAmount < 20) {
                boostButton.classList.add('low-boost');
            } else {
                boostButton.classList.remove('low-boost');
            }
        } else {
            // If no boost bar found, check for boost amount in game state
            if (typeof window.boostAmount !== 'undefined') {
                const boostPercent = (window.boostAmount / 100) * 100;
                boostButton.style.setProperty('--boost-fill', `${boostPercent}%`);
                if (meterFill) {
                    meterFill.style.height = `${boostPercent}%`;
                }
            }
        }
    }, 100);
}

// Export functions for use in other scripts
window.mobileUIFixed = {
    toggleLeaderboard: toggleLeaderboard,
    ensurePanelsVisible: ensurePanelsVisible,
    forceFixedPositioning: forceFixedPositioning,
    restoreBoostMeter: restoreBoostMeter
};