// Unified Mobile UI - Consolidated mobile interface functionality
class UnifiedMobileUI {
    constructor() {
        this.statsPanel = null;
        this.leaderboardPanel = null;
        this.boostButton = null;
        this.boostAmount = 100;
        this.isInitialized = false;
        this.skinObserver = null;
    }

    init() {
        console.log('Unified Mobile UI: Initializing...', {
            isMobile: this.isMobile(),
            hasBodyClass: document.body.classList.contains('mobile'),
            isInitialized: this.isInitialized
        });
        
        if (!this.isMobile()) {
            console.log('Unified Mobile UI: Not a mobile device, exiting...');
            // Remove mobile class if it was incorrectly added
            document.body.classList.remove('mobile');
            return;
        }
        
        if (this.isInitialized) return;
        
        this.isInitialized = true;
        
        // Force add mobile class if needed
        document.body.classList.add('mobile');
        
        // Wait for DOM elements
        this.waitForElements();
    }

    isMobile() {
        // Check user agent first for definitive mobile detection
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Check for touch capability AND coarse pointer (more reliable than just touch)
        const hasTouchAndCoarsePointer = 'ontouchstart' in window && window.matchMedia("(pointer: coarse)").matches;
        
        // Only consider small window size as mobile if other indicators are present
        const isSmallScreen = window.innerWidth <= 800;
        
        // Return true only if we have strong evidence of mobile
        return isMobileUA || hasTouchAndCoarsePointer || (isSmallScreen && 'ontouchstart' in window);
    }

    waitForElements() {
        const checkElements = () => {
            this.statsPanel = document.querySelector('.player-info-box');
            this.leaderboardPanel = document.querySelector('.leaderboard-box');
            this.boostButton = document.querySelector('.boost-button');
            
            console.log('Unified Mobile UI: Element check:', {
                statsPanel: this.statsPanel ? 'found' : 'not found',
                leaderboardPanel: this.leaderboardPanel ? 'found' : 'not found',
                boostButton: this.boostButton ? 'found' : 'not found',
                bodyHasMobileClass: document.body.classList.contains('mobile')
            });
            
            if (!this.statsPanel || !this.leaderboardPanel) {
                console.log('Unified Mobile UI: Waiting for elements...');
                setTimeout(checkElements, 100);
                return;
            }
            
            console.log('Unified Mobile UI: Elements found, initializing features');
            this.setupPanels();
            this.setupBoostButton();
            this.setupSkinSync();
            this.setupDiscoveryFeed();
        };
        
        checkElements();
    }

    setupPanels() {
        // Clear any existing handlers by removing old tabs
        this.clearExistingTabs();
        
        // Create tabs for both panels
        this.createStatsTab();
        this.createLeaderboardTab();
        
        // Handle clicks outside panels
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.player-info-box') && 
                !e.target.closest('.leaderboard-box') &&
                !e.target.closest('.mobile-tab-handle')) {
                this.closeAllPanels();
            }
        });
        
        // Handle clicks on document to close panels
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.player-info-box') && 
                !e.target.closest('.leaderboard-box') &&
                !e.target.closest('.mobile-tab-handle')) {
                this.closeAllPanels();
            }
        });
    }

    clearExistingTabs() {
        // Remove any existing mobile tab handles
        document.querySelectorAll('.mobile-tab-handle').forEach(tab => tab.remove());
        
        // Remove any pseudo-element click areas
        document.querySelectorAll('.player-info-box > div[style*="cursor: pointer"]').forEach(el => el.remove());
        document.querySelectorAll('.leaderboard-box > div[style*="cursor: pointer"]').forEach(el => el.remove());
    }

    createStatsTab() {
        console.log('Creating stats tab...');
        
        if (!this.statsPanel) {
            console.error('Stats panel not found when creating tab!');
            return;
        }
        
        const tab = document.createElement('div');
        tab.className = 'mobile-tab-handle stats-tab';
        
        // Create skin preview div
        const skinPreview = document.createElement('div');
        skinPreview.className = 'mobile-tab-skin';
        tab.appendChild(skinPreview);
        
        this.statsPanel.appendChild(tab);
        console.log('Stats tab appended to panel');
        
        // Add event handlers
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(this.statsPanel);
        });
        
        tab.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.togglePanel(this.statsPanel);
        });
        
        // Update skin preview
        this.updateTabSkin();
        
        // Verify tab was created
        const verifyTab = document.querySelector('.player-info-box .mobile-tab-handle');
        console.log('Stats tab verification:', verifyTab ? 'SUCCESS' : 'FAILED');
    }

    createLeaderboardTab() {
        console.log('Creating leaderboard tab...');
        
        if (!this.leaderboardPanel) {
            console.error('Leaderboard panel not found when creating tab!');
            return;
        }
        
        const tab = document.createElement('div');
        tab.className = 'mobile-tab-handle leaderboard-tab';
        tab.innerHTML = '🏆';
        
        this.leaderboardPanel.appendChild(tab);
        console.log('Leaderboard tab appended to panel');
        
        // Add event handlers
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(this.leaderboardPanel);
        });
        
        tab.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.togglePanel(this.leaderboardPanel);
        });
        
        // Verify tab was created
        const verifyTab = document.querySelector('.leaderboard-box .mobile-tab-handle');
        console.log('Leaderboard tab verification:', verifyTab ? 'SUCCESS' : 'FAILED');
    }

    togglePanel(panel) {
        const isExpanded = panel.classList.contains('expanded');
        
        if (isExpanded) {
            panel.classList.remove('expanded');
        } else {
            this.closeAllPanels();
            panel.classList.add('expanded');
        }
        
        // Save state
        const panelName = panel === this.statsPanel ? 'stats' : 'leaderboard';
        localStorage.setItem(`mobilePanel_${panelName}`, !isExpanded);
    }

    closeAllPanels() {
        if (this.statsPanel) this.statsPanel.classList.remove('expanded');
        if (this.leaderboardPanel) this.leaderboardPanel.classList.remove('expanded');
    }

    setupBoostButton() {
        if (!this.boostButton) return;
        
        // Ensure button has span for text
        if (!this.boostButton.querySelector('span')) {
            const span = document.createElement('span');
            span.textContent = this.boostButton.textContent || 'BOOST';
            this.boostButton.textContent = '';
            this.boostButton.appendChild(span);
        }
        
        // Start monitoring boost amount
        this.monitorBoost();
    }

    monitorBoost() {
        // Check for boost updates periodically
        setInterval(() => {
            const boostBar = document.getElementById('boostBarFill');
            if (boostBar) {
                const width = boostBar.style.width || '100%';
                this.setBoostAmount(parseInt(width));
            }
        }, 100);
    }

    setBoostAmount(amount) {
        this.boostAmount = Math.max(0, Math.min(100, amount));
        if (this.boostButton) {
            this.boostButton.style.setProperty('--boost-fill', `${this.boostAmount}%`);
            
            if (this.boostAmount < 20) {
                this.boostButton.classList.add('low-boost');
            } else {
                this.boostButton.classList.remove('low-boost');
            }
        }
    }

    setBoostActive(isActive) {
        if (!this.boostButton) return;
        
        if (isActive) {
            this.boostButton.classList.add('active');
        } else {
            this.boostButton.classList.remove('active');
        }
    }

    setupSkinSync() {
        this.updateTabSkin();
        
        // Watch for changes to player portrait
        const portrait = document.querySelector('.player-portrait img');
        if (!portrait) {
            // Try again later if portrait not found
            setTimeout(() => this.setupSkinSync(), 500);
            return;
        }
        
        // Create mutation observer for skin changes
        this.skinObserver = new MutationObserver(() => {
            this.updateTabSkin();
        });
        
        this.skinObserver.observe(portrait, {
            attributes: true,
            attributeFilter: ['src']
        });
        
        // Also watch for changes to the portrait container
        const portraitContainer = document.querySelector('.player-portrait');
        if (portraitContainer) {
            this.skinObserver.observe(portraitContainer, {
                childList: true,
                subtree: true
            });
        }
        
        // Also listen for skin change events if they exist
        document.addEventListener('skinChanged', () => {
            setTimeout(() => this.updateTabSkin(), 100);
        });
    }

    updateTabSkin() {
        // Try multiple sources for the current skin
        let skinUrl = null;
        
        // 1. Check player portrait in pause menu
        const pausePortrait = document.querySelector('#playerPortrait');
        if (pausePortrait && pausePortrait.src) {
            skinUrl = pausePortrait.src;
        }
        
        // 2. Check player portrait in stats box
        if (!skinUrl) {
            const statsPortrait = document.querySelector('.player-portrait img');
            if (statsPortrait && statsPortrait.src) {
                skinUrl = statsPortrait.src;
            }
        }
        
        // 3. Check for any equipped skin indicator
        if (!skinUrl) {
            const equippedSkin = document.querySelector('.skin-card.equipped .skin-preview');
            if (equippedSkin) {
                const bgImage = window.getComputedStyle(equippedSkin).backgroundImage;
                if (bgImage && bgImage !== 'none') {
                    skinUrl = bgImage.replace(/^url\(['"]?/, '').replace(/['"]?\)$/, '');
                }
            }
        }
        
        // 4. Default skin
        if (!skinUrl) {
            skinUrl = 'skins/snake-default-green.png';
        }
        
        // Update CSS variable
        document.documentElement.style.setProperty('--player-skin-url', `url('${skinUrl}')`);
        
        // Force update of tab skin preview
        const tabSkin = document.querySelector('.mobile-tab-skin');
        if (tabSkin) {
            tabSkin.style.backgroundImage = `url('${skinUrl}')`;
        }
        
        console.log('Unified Mobile UI: Updated skin to', skinUrl);
    }

    setupDiscoveryFeed() {
        const feed = document.querySelector('.discovery-feed');
        if (!feed) return;
        
        // Make messages clickable to dismiss
        const observer = new MutationObserver(() => {
            const messages = feed.querySelectorAll('.discovery-message');
            messages.forEach(msg => {
                if (!msg.hasAttribute('data-clickable')) {
                    msg.setAttribute('data-clickable', 'true');
                    msg.addEventListener('click', () => {
                        msg.style.opacity = '0';
                        msg.style.transition = 'opacity 0.3s';
                        setTimeout(() => msg.remove(), 300);
                    });
                }
            });
        });
        
        observer.observe(feed, { childList: true, subtree: true });
    }

    // Public methods for game integration
    updateBoost(amount) {
        this.setBoostAmount(amount);
    }
    
    activateBoost(isActive) {
        this.setBoostActive(isActive);
    }
    
    refreshSkin() {
        this.updateTabSkin();
    }
    
    handleOrientationChange(orientation) {
        // Handle orientation changes
        console.log('Unified Mobile UI: Handling orientation change:', orientation);
        
        // You can add orientation-specific adjustments here if needed
        if (orientation === 'landscape') {
            // Landscape adjustments
        } else {
            // Portrait adjustments
        }
    }
    
    applyMobileOptimizations() {
        // Apply mobile-specific optimizations
        const discoveryFeed = document.querySelector('.discovery-feed');
        if (discoveryFeed && this.isMobile()) {
            discoveryFeed.style.pointerEvents = 'none';
            discoveryFeed.style.userSelect = 'none';
        }
    }
}

// Initialize unified mobile UI
const unifiedMobileUI = new UnifiedMobileUI();

// Function to detect and set mobile class
function detectAndSetMobile() {
    // Check user agent first for definitive mobile detection
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check for touch capability AND coarse pointer (more reliable than just touch)
    const hasTouchAndCoarsePointer = 'ontouchstart' in window && window.matchMedia("(pointer: coarse)").matches;
    
    // Only consider small window size as mobile if other indicators are present
    const isSmallScreen = window.innerWidth <= 800;
    
    // Only add mobile class if we have strong evidence of mobile
    if (isMobileUA || hasTouchAndCoarsePointer || (isSmallScreen && 'ontouchstart' in window)) {
        if (document.body) {
            document.body.classList.add('mobile');
            console.log('Mobile class added to body');
        }
        return true;
    }
    return false;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        detectAndSetMobile();
        setTimeout(() => unifiedMobileUI.init(), 300);
    });
} else {
    // DOM is already loaded
    detectAndSetMobile();
    setTimeout(() => unifiedMobileUI.init(), 300);
}

// Re-initialize if needed (for dynamic content)
document.addEventListener('gameReady', () => {
    unifiedMobileUI.init();
});

// Export for game integration
window.unifiedMobileUI = unifiedMobileUI;

// Compatibility with existing code
window.mobileUIOverhaul = unifiedMobileUI;

// Force initialization function for debugging
window.forceMobileUIInit = function() {
    console.log('Force initializing mobile UI...');
    document.body.classList.add('mobile');
    unifiedMobileUI.isInitialized = false; // Reset flag
    unifiedMobileUI.init();
};