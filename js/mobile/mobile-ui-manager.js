// Consolidated Mobile UI Manager for Infinite Snake
// Combines functionality from multiple mobile UI files into a single, efficient system

import MOBILE_UI_CONFIG from './mobile-config.js';

class MobileUIManager {
    constructor() {
        this.initialized = false;
        this.config = window.MOBILE_UI_CONFIG || MOBILE_UI_CONFIG;
        this.mode = this.config.mode;
        this.panels = {
            stats: null,
            leaderboard: null
        };
        this.boostButton = null;
        this.boostMeterFill = null;
        this.discoveryFeed = null;
        this.monitorInterval = null;
        this.lastBoostAmount = 0;
        this.currentSkin = null;
    }
    
    // Unified mobile detection - single source of truth
    static isMobile() {
        // Check if already determined
        if (window.mobileDetected !== undefined) {
            return window.mobileDetected;
        }
        
        // Multiple detection methods
        const hasBodyClass = document.body && document.body.classList.contains('mobile');
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const isSmallScreen = window.innerWidth < MOBILE_UI_CONFIG.detection.smallScreenWidth;
        
        // Determine if mobile
        window.mobileDetected = hasBodyClass || isMobileUA || (hasTouchScreen && hasCoarsePointer) || (isSmallScreen && hasTouchScreen);
        
        return window.mobileDetected;
    }
    
    // Initialize the mobile UI system
    init() {
        if (!MobileUIManager.isMobile() || this.initialized) {
            return;
        }
        
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Initializing mobile UI manager...');
        }
        
        // Wait for DOM if needed
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }
        
        // Find UI elements
        this.findElements();
        
        // Setup based on mode
        if (this.mode === 'fixed') {
            this.setupFixedMode();
        } else {
            this.setupSlideoutMode();
        }
        
        // Setup common features
        this.setupBoostMeter();
        this.setupDiscoveryFeed();
        
        // Start monitoring
        this.startMonitoring();
        
        // Setup mutation observer for dynamic content
        this.setupMutationObserver();
        
        this.initialized = true;
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Mobile UI manager initialized successfully');
        }
    }
    
    // Find all UI elements
    findElements() {
        this.panels.stats = document.querySelector('.player-info-box');
        this.panels.leaderboard = document.querySelector('.leaderboard-box');
        this.boostButton = document.querySelector('.boost-button');
        this.discoveryFeed = document.querySelector('.discovery-feed');
        
        // Create boost meter fill if needed
        if (this.boostButton && !this.boostButton.querySelector('.boost-meter-fill')) {
            const fill = document.createElement('div');
            fill.className = 'boost-meter-fill';
            fill.style.cssText = `
                position: absolute;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 0%;
                background: linear-gradient(to top, #00ff00, #00cc00);
                transition: height 0.3s ease;
                border-radius: inherit;
                z-index: 1;
            `;
            this.boostButton.appendChild(fill);
        }
        this.boostMeterFill = this.boostButton?.querySelector('.boost-meter-fill');
    }
    
    // Setup fixed positioning mode
    setupFixedMode() {
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Setting up fixed mode');
        }
        
        // Remove any existing tab handles
        document.querySelectorAll('.mobile-tab-handle').forEach(el => el.remove());
        
        // Apply fixed positioning to panels
        if (this.panels.stats) {
            this.panels.stats.style.cssText = `
                position: fixed !important;
                top: ${this.config.positions.stats.top}px !important;
                left: ${this.config.positions.stats.left}px !important;
                transform: none !important;
                opacity: ${this.config.visual.panelOpacity} !important;
                visibility: visible !important;
                display: block !important;
                z-index: 1001 !important;
                max-width: ${this.config.visual.panelMaxWidth}px !important;
            `;
        }
        
        if (this.panels.leaderboard) {
            this.panels.leaderboard.style.cssText = `
                position: fixed !important;
                top: ${this.config.positions.leaderboard.top}px !important;
                right: ${this.config.positions.leaderboard.right}px !important;
                transform: none !important;
                opacity: ${this.config.visual.panelOpacity} !important;
                visibility: visible !important;
                display: block !important;
                z-index: 1001 !important;
                max-width: ${this.config.visual.panelMaxWidth}px !important;
            `;
            
            // Make leaderboard collapsible
            this.setupCollapsibleLeaderboard();
        }
        
        // Setup boost button
        if (this.boostButton) {
            this.boostButton.style.cssText = `
                position: fixed !important;
                bottom: ${this.config.positions.boostButton.bottom}px !important;
                right: ${this.config.positions.boostButton.right}px !important;
                width: ${this.config.visual.boostButtonSize}px !important;
                height: ${this.config.visual.boostButtonSize}px !important;
                opacity: ${this.config.visual.panelOpacity} !important;
                visibility: visible !important;
                display: flex !important;
                z-index: 1002 !important;
            `;
        }
    }
    
    // Setup slide-out mode (based on unified implementation)
    setupSlideoutMode() {
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Setting up slideout mode');
        }
        
        // Create tabs for panels
        if (this.panels.stats && !this.panels.stats.querySelector('.mobile-tab-handle')) {
            this.createSlideoutTab(this.panels.stats, 'stats', 'left');
        }
        
        if (this.panels.leaderboard && !this.panels.leaderboard.querySelector('.mobile-tab-handle')) {
            this.createSlideoutTab(this.panels.leaderboard, 'leaderboard', 'right');
        }
        
        // Apply slideout styles
        if (this.panels.stats) {
            this.panels.stats.style.cssText = `
                position: fixed !important;
                top: 50% !important;
                left: 0 !important;
                transform: translate(-100%, -50%) !important;
                opacity: ${this.config.visual.panelOpacity} !important;
                visibility: visible !important;
                display: block !important;
                z-index: 1001 !important;
                transition: transform ${this.config.timing.panelTransition}ms ease !important;
                max-width: ${this.config.visual.panelMaxWidth + 20}px !important;
            `;
            this.panels.stats.dataset.mobilePanel = 'closed';
        }
        
        if (this.panels.leaderboard) {
            this.panels.leaderboard.style.cssText = `
                position: fixed !important;
                top: 50% !important;
                right: 0 !important;
                transform: translate(100%, -50%) !important;
                opacity: ${this.config.visual.panelOpacity} !important;
                visibility: visible !important;
                display: block !important;
                z-index: 1001 !important;
                transition: transform ${this.config.timing.panelTransition}ms ease !important;
                max-width: ${this.config.visual.panelMaxWidth + 20}px !important;
            `;
            this.panels.leaderboard.dataset.mobilePanel = 'closed';
        }
    }
    
    // Create slide-out tab
    createSlideoutTab(panel, type, side) {
        const tab = document.createElement('div');
        tab.className = 'mobile-tab-handle';
        tab.dataset.panel = type;
        
        // Tab content based on type
        const icon = type === 'stats' ? '📊' : '🏆';
        const label = type === 'stats' ? 'Stats' : 'Ranks';
        
        tab.innerHTML = `
            <span class="mobile-tab-icon">${icon}</span>
            <span class="mobile-tab-label">${label}</span>
        `;
        
        // Tab styling
        const isLeft = side === 'left';
        tab.style.cssText = `
            position: absolute !important;
            top: 50% !important;
            ${isLeft ? 'right' : 'left'}: -${this.config.visual.tabWidth}px !important;
            transform: translateY(-50%) !important;
            width: ${this.config.visual.tabWidth}px !important;
            height: ${this.config.visual.tabHeight}px !important;
            background: rgba(30, 30, 30, 0.95) !important;
            border: 2px solid rgba(147, 51, 234, 0.6) !important;
            border-${isLeft ? 'left' : 'right'}: none !important;
            border-radius: ${isLeft ? '0 10px 10px 0' : '10px 0 0 10px'} !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 5px !important;
            cursor: pointer !important;
            z-index: 1002 !important;
            visibility: visible !important;
            opacity: 1 !important;
        `;
        
        // Add skin preview for stats tab
        if (type === 'stats' && this.config.features.skinPreview) {
            const skinPreview = document.createElement('div');
            skinPreview.className = 'mobile-tab-skin';
            skinPreview.style.cssText = `
                width: 24px !important;
                height: 24px !important;
                background-size: contain !important;
                background-repeat: no-repeat !important;
                background-position: center !important;
                margin-top: 5px !important;
            `;
            tab.appendChild(skinPreview);
        }
        
        // Touch event handling
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(type);
        });
        
        panel.appendChild(tab);
    }
    
    // Toggle panel visibility
    togglePanel(type) {
        const panel = type === 'stats' ? this.panels.stats : this.panels.leaderboard;
        if (!panel) return;
        
        const isClosed = panel.dataset.mobilePanel === 'closed';
        const side = type === 'stats' ? 'left' : 'right';
        
        if (isClosed) {
            panel.style.transform = 'translate(0, -50%)';
            panel.dataset.mobilePanel = 'open';
        } else {
            const translateX = side === 'left' ? '-100%' : '100%';
            panel.style.transform = `translate(${translateX}, -50%)`;
            panel.dataset.mobilePanel = 'closed';
        }
    }
    
    // Setup collapsible leaderboard for fixed mode
    setupCollapsibleLeaderboard() {
        let header = this.panels.leaderboard.querySelector('.leaderboard-header');
        if (!header) {
            // Find first h2 or create header
            const h2 = this.panels.leaderboard.querySelector('h2');
            if (h2) {
                header = document.createElement('div');
                header.className = 'leaderboard-header';
                header.style.cssText = 'cursor: pointer; user-select: none;';
                h2.parentNode.insertBefore(header, h2);
                header.appendChild(h2);
            }
        }
        
        if (header) {
            header.addEventListener('click', () => {
                const content = this.panels.leaderboard.querySelector('.leaderboard-content') ||
                               this.panels.leaderboard.querySelector('table') ||
                               this.panels.leaderboard.querySelector('ul');
                
                if (content) {
                    const isHidden = content.style.display === 'none';
                    content.style.display = isHidden ? '' : 'none';
                    this.panels.leaderboard.classList.toggle('collapsed', !isHidden);
                }
            });
        }
    }
    
    // Setup boost meter
    setupBoostMeter() {
        if (!this.config.features.boostMeter || !this.boostButton || !this.boostMeterFill) {
            return;
        }
        
        // Ensure boost button text is on top
        const boostText = this.boostButton.querySelector('.boost-text') || this.boostButton;
        if (boostText && boostText !== this.boostButton) {
            boostText.style.position = 'relative';
            boostText.style.zIndex = '2';
        }
    }
    
    // Setup discovery feed click to dismiss
    setupDiscoveryFeed() {
        if (!this.config.features.discoveryFeed || !this.discoveryFeed) {
            return;
        }
        
        this.discoveryFeed.style.cursor = 'pointer';
        this.discoveryFeed.addEventListener('click', (e) => {
            if (e.target.closest('.discovery-feed')) {
                this.discoveryFeed.style.display = 'none';
                setTimeout(() => {
                    this.discoveryFeed.style.display = '';
                }, 5000);
            }
        });
    }
    
    // Start monitoring for updates
    startMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        
        this.monitorInterval = setInterval(() => {
            this.updateBoostMeter();
            this.updateSkinPreview();
            this.ensureVisibility();
        }, this.config.timing.updateInterval);
    }
    
    // Update boost meter fill
    updateBoostMeter() {
        if (!this.config.features.boostMeter || !this.boostMeterFill) {
            return;
        }
        
        const boostAmount = window.boostAmount || 0;
        if (boostAmount !== this.lastBoostAmount) {
            this.lastBoostAmount = boostAmount;
            const percentage = Math.min(100, Math.max(0, boostAmount));
            this.boostMeterFill.style.height = `${percentage}%`;
        }
    }
    
    // Update skin preview in tab
    updateSkinPreview() {
        if (!this.config.features.skinPreview || this.mode !== 'slideout') {
            return;
        }
        
        const playerPortrait = document.querySelector('.player-portrait');
        const skinPreview = document.querySelector('.mobile-tab-skin');
        
        if (playerPortrait && skinPreview) {
            const bgImage = playerPortrait.style.backgroundImage;
            if (bgImage && bgImage !== this.currentSkin) {
                this.currentSkin = bgImage;
                skinPreview.style.backgroundImage = bgImage;
            }
        }
    }
    
    // Ensure elements remain visible
    ensureVisibility() {
        // Only for fixed mode
        if (this.mode !== 'fixed') {
            return;
        }
        
        // Check and restore visibility if needed
        [this.panels.stats, this.panels.leaderboard, this.boostButton].forEach(element => {
            if (element && (element.style.display === 'none' || element.style.visibility === 'hidden')) {
                element.style.display = '';
                element.style.visibility = 'visible';
            }
        });
    }
    
    // Setup mutation observer for dynamic content
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Re-find elements if they were replaced
                    if (!document.body.contains(this.panels.stats) ||
                        !document.body.contains(this.panels.leaderboard)) {
                        this.findElements();
                        
                        // Reapply mode setup
                        if (this.mode === 'fixed') {
                            this.setupFixedMode();
                        } else {
                            this.setupSlideoutMode();
                        }
                    }
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Cleanup method
    destroy() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        
        // Remove added elements
        document.querySelectorAll('.mobile-tab-handle').forEach(el => el.remove());
        
        // Reset styles
        [this.panels.stats, this.panels.leaderboard, this.boostButton].forEach(element => {
            if (element) {
                element.style.cssText = '';
            }
        });
        
        this.initialized = false;
    }
}

// Global instance
window.mobileUIManager = new MobileUIManager();

// Auto-initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.mobileUIManager.init();
    });
} else {
    window.mobileUIManager.init();
}

export default MobileUIManager;