// Mobile UI Overhaul - Interactive Collapsible Panels
class MobileUIOverhaul {
    constructor() {
        this.statsPanel = null;
        this.leaderboardPanel = null;
        this.boostButton = null;
        this.boostAmount = 100; // Track boost percentage
        this.isInitialized = false;
    }

    init() {
        if (!this.isMobile() || this.isInitialized) return;
        
        this.isInitialized = true;
        
        // Get UI elements
        this.statsPanel = document.querySelector('.player-info-box');
        this.leaderboardPanel = document.querySelector('.leaderboard-box');
        this.boostButton = document.querySelector('.boost-button');
        
        if (!this.statsPanel || !this.leaderboardPanel) {
            console.warn('Mobile UI elements not found, retrying...');
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // Setup collapsible panels
        this.setupCollapsiblePanels();
        
        // Setup boost button fill effect
        this.setupBoostButton();
        
        // Update player skin preview
        this.updatePlayerSkinPreview();
        this.watchPortraitChanges();
        
        // Setup discovery feed fade
        this.setupDiscoveryFeed();
    }

    isMobile() {
        return document.body.classList.contains('mobile') || 
               window.innerWidth <= 800 || 
               'ontouchstart' in window;
    }

    setupCollapsiblePanels() {
        // Stats panel click handler
        this.createClickHandler(this.statsPanel);
        
        // Leaderboard panel click handler
        this.createClickHandler(this.leaderboardPanel);
        
        // Restore saved states
        this.restorePanelStates();
        
        // Close panels when tapping outside
        document.addEventListener('touchstart', (e) => {
            if (!e.target.closest('.player-info-box') && 
                !e.target.closest('.leaderboard-box')) {
                this.closeAllPanels();
            }
        });
    }

    createClickHandler(panel) {
        // Create invisible click area for the tab
        const clickArea = document.createElement('div');
        clickArea.style.cssText = `
            position: absolute;
            right: -50px;
            top: 0;
            width: 50px;
            height: 80px;
            cursor: pointer;
            z-index: 101;
        `;
        panel.appendChild(clickArea);
        
        // Handle clicks
        clickArea.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(panel);
        });
        
        // Also handle clicks on the panel header
        const header = panel.querySelector('.leaderboard-header') || 
                      panel.querySelector('.player-info-header');
        if (header) {
            header.style.cursor = 'pointer';
            header.addEventListener('click', (e) => {
                e.stopPropagation();
                this.togglePanel(panel);
            });
        }
    }

    togglePanel(panel) {
        const isExpanded = panel.classList.contains('expanded');
        
        if (isExpanded) {
            panel.classList.remove('expanded');
        } else {
            // Close other panels first
            this.closeAllPanels();
            panel.classList.add('expanded');
        }
        
        // Save state
        const panelName = panel.classList.contains('player-info-box') ? 'stats' : 'leaderboard';
        localStorage.setItem(`mobilePanel_${panelName}`, !isExpanded);
    }

    closeAllPanels() {
        this.statsPanel.classList.remove('expanded');
        this.leaderboardPanel.classList.remove('expanded');
    }

    restorePanelStates() {
        // Don't auto-expand panels on mobile - let user open them
        // This improves initial game visibility
    }

    setupBoostButton() {
        if (!this.boostButton) return;
        
        // Add span for text if not present
        if (!this.boostButton.querySelector('span')) {
            const span = document.createElement('span');
            span.textContent = this.boostButton.textContent;
            this.boostButton.textContent = '';
            this.boostButton.appendChild(span);
        }
        
        // Update boost fill based on game state
        this.updateBoostFill();
    }

    updateBoostFill() {
        if (!this.boostButton) return;
        
        // Get boost amount from game state if available
        const boostBar = document.getElementById('boostBarFill');
        if (boostBar) {
            const width = boostBar.style.width || '100%';
            this.boostAmount = parseInt(width);
        }
        
        // Update CSS variable for fill height
        this.boostButton.style.setProperty('--boost-fill', `${this.boostAmount}%`);
        
        // Update button appearance based on boost level
        if (this.boostAmount < 20) {
            this.boostButton.classList.add('low-boost');
        } else {
            this.boostButton.classList.remove('low-boost');
        }
    }

    updatePlayerSkinPreview() {
        // Get current player portrait
        const portrait = document.querySelector('.player-portrait img');
        if (portrait && portrait.src) {
            document.documentElement.style.setProperty('--player-skin-url', `url('${portrait.src}')`);
        }
    }
    
    watchPortraitChanges() {
        const portrait = document.querySelector('.player-portrait img');
        if (!portrait) return;
        
        // Watch for src attribute changes
        const observer = new MutationObserver(() => {
            this.updatePlayerSkinPreview();
        });
        
        observer.observe(portrait, {
            attributes: true,
            attributeFilter: ['src']
        });
    }

    setupDiscoveryFeed() {
        const feed = document.querySelector('.discovery-feed');
        if (!feed) return;
        
        // Ensure it's visible on mobile
        feed.style.display = 'flex';
        
        // Add touch-through for better game interaction
        feed.style.pointerEvents = 'none';
        
        // Make individual messages slightly interactive
        const observer = new MutationObserver(() => {
            const messages = feed.querySelectorAll('.discovery-message');
            messages.forEach(msg => {
                msg.style.pointerEvents = 'auto';
                msg.addEventListener('click', () => {
                    // Fade out clicked message faster
                    msg.style.opacity = '0';
                    setTimeout(() => msg.remove(), 300);
                });
            });
        });
        
        observer.observe(feed, { childList: true, subtree: true });
    }

    // Public method to update boost from game
    setBoostAmount(amount) {
        this.boostAmount = Math.max(0, Math.min(100, amount));
        this.updateBoostFill();
    }
    
    // Public method to update boost active state
    setBoostActive(isActive) {
        if (!this.boostButton) return;
        
        if (isActive) {
            this.boostButton.classList.add('active');
        } else {
            this.boostButton.classList.remove('active');
        }
    }
}

// Initialize mobile UI overhaul
const mobileUIOverhaul = new MobileUIOverhaul();

// Wait for DOM and game to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => mobileUIOverhaul.init());
} else {
    // DOM already loaded, wait a bit for game elements
    setTimeout(() => mobileUIOverhaul.init(), 100);
}

// Export for game integration
window.mobileUIOverhaul = mobileUIOverhaul;