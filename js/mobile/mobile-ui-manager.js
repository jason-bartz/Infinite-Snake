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
    
    static isMobile() {
        if (window.mobileDetected !== undefined) {
            return window.mobileDetected;
        }
        
        const hasBodyClass = document.body && document.body.classList.contains('mobile');
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        const isSmallScreen = window.innerWidth < MOBILE_UI_CONFIG.detection.smallScreenWidth;
        
        window.mobileDetected = hasBodyClass || isMobileUA || (hasTouchScreen && hasCoarsePointer) || (isSmallScreen && hasTouchScreen);
        
        return window.mobileDetected;
    }
    
    init() {
        if (!MobileUIManager.isMobile() || this.initialized) {
            return;
        }
        
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Initializing mobile UI manager...');
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }
        
        this.findElements();
        
        if (this.mode === 'fixed') {
            this.setupFixedMode();
        } else {
            this.setupSlideoutMode();
        }
        
        this.setupBoostMeter();
        this.setupDiscoveryFeed();
        this.startMonitoring();
        this.setupMutationObserver();
        
        this.initialized = true;
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Mobile UI manager initialized successfully');
        }
    }
    
    findElements() {
        this.panels.stats = document.querySelector('.player-info-box');
        this.panels.leaderboard = document.querySelector('.leaderboard-box');
        this.boostButton = document.querySelector('.boost-button');
        this.discoveryFeed = document.querySelector('.discovery-feed');
        
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
    
    setupFixedMode() {
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Setting up fixed mode');
        }
        
        document.querySelectorAll('.mobile-tab-handle').forEach(el => el.remove());
        
        if (this.panels.stats) {
            this.applyFixedStyles(this.panels.stats, 'stats');
        }
        
        if (this.panels.leaderboard) {
            this.applyFixedStyles(this.panels.leaderboard, 'leaderboard');
            this.setupCollapsibleLeaderboard();
        }
        
        if (this.boostButton) {
            this.applyBoostButtonStyles();
        }
    }
    
    applyFixedStyles(panel, type) {
        const positions = this.config.positions[type];
        const isStats = type === 'stats';
        
        panel.style.cssText = `
            position: fixed !important;
            ${isStats ? 'top' : 'top'}: ${positions.top}px !important;
            ${isStats ? 'left' : 'right'}: ${isStats ? positions.left : positions.right}px !important;
            transform: none !important;
            opacity: ${this.config.visual.panelOpacity} !important;
            visibility: visible !important;
            display: block !important;
            z-index: 1001 !important;
            max-width: ${this.config.visual.panelMaxWidth}px !important;
        `;
    }
    
    applyBoostButtonStyles() {
        const pos = this.config.positions.boostButton;
        this.boostButton.style.cssText = `
            position: fixed !important;
            bottom: ${pos.bottom}px !important;
            right: ${pos.right}px !important;
            width: ${this.config.visual.boostButtonSize}px !important;
            height: ${this.config.visual.boostButtonSize}px !important;
            opacity: ${this.config.visual.panelOpacity} !important;
            visibility: visible !important;
            display: flex !important;
            z-index: 1002 !important;
            border: 3px solid rgba(147, 51, 234, 0.6) !important;
            border-radius: 0 !important;
            background: rgba(0, 0, 0, 0.5) !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
        `;
    }
    
    setupSlideoutMode() {
        if (this.config.debug.logInitialization) {
            console.log('[MobileUI] Setting up slideout mode');
        }
        
        if (this.panels.stats && !this.panels.stats.querySelector('.mobile-tab-handle')) {
            this.createSlideoutTab(this.panels.stats, 'stats', 'left');
        }
        
        if (this.panels.leaderboard && !this.panels.leaderboard.querySelector('.mobile-tab-handle')) {
            this.createSlideoutTab(this.panels.leaderboard, 'leaderboard', 'right');
        }
        
        this.applySlideoutStyles();
    }
    
    applySlideoutStyles() {
        if (this.panels.stats) {
            this.applyPanelSlideoutStyle(this.panels.stats, 'left');
        }
        
        if (this.panels.leaderboard) {
            this.applyPanelSlideoutStyle(this.panels.leaderboard, 'right');
        }
    }
    
    applyPanelSlideoutStyle(panel, side) {
        const isLeft = side === 'left';
        panel.style.cssText = `
            position: fixed !important;
            top: 50% !important;
            ${side}: 0 !important;
            transform: translate(${isLeft ? '-100%' : '100%'}, -50%) !important;
            opacity: ${this.config.visual.panelOpacity} !important;
            visibility: visible !important;
            display: block !important;
            z-index: 1001 !important;
            transition: transform ${this.config.timing.panelTransition}ms ease !important;
            max-width: ${this.config.visual.panelMaxWidth + 20}px !important;
        `;
        panel.dataset.mobilePanel = 'closed';
    }
    
    createSlideoutTab(panel, type, side) {
        const tab = document.createElement('div');
        tab.className = 'mobile-tab-handle';
        tab.dataset.panel = type;
        
        const icon = type === 'stats' ? '📊' : '🏆';
        const label = type === 'stats' ? 'Stats' : 'Ranks';
        
        tab.innerHTML = `
            <span class="mobile-tab-icon">${icon}</span>
            <span class="mobile-tab-label">${label}</span>
        `;
        
        this.styleSlideoutTab(tab, side);
        
        if (type === 'stats' && this.config.features.skinPreview) {
            this.addSkinPreview(tab);
        }
        
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel(type);
        });
        
        panel.appendChild(tab);
    }
    
    styleSlideoutTab(tab, side) {
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
    }
    
    addSkinPreview(tab) {
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
    
    setupCollapsibleLeaderboard() {
        if (!this.panels.leaderboard) return;
        
        // Remove any existing mobile headers first
        const existingMobileHeader = this.panels.leaderboard.querySelector('.mobile-leaderboard-header');
        if (existingMobileHeader) {
            existingMobileHeader.remove();
        }
        
        // Check if there's already a leaderboard-header from the HTML
        const existingHeader = this.panels.leaderboard.querySelector('.leaderboard-header');
        if (!existingHeader) {
            console.warn('[MobileUI] No existing leaderboard header found');
            return;
        }
        
        // Store reference to the scrollable content  
        const scrollableContent = this.panels.leaderboard.querySelector('.scrollable-content');
        if (!scrollableContent) {
            console.warn('[MobileUI] No scrollable content found in leaderboard');
            return;
        }
        
        // Remove any existing click handlers by cloning the header
        const newHeader = existingHeader.cloneNode(true);
        existingHeader.parentNode.replaceChild(newHeader, existingHeader);
        
        // Apply mobile-specific styles to the existing header
        newHeader.style.cssText += `
            cursor: pointer !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            position: relative !important;
            z-index: 1010 !important;
        `;
        
        // Set up proper collapse functionality
        const collapseIcon = newHeader.querySelector('.collapse-icon');
        
        // Initialize state
        const savedState = localStorage.getItem('mobileLeaderboardCollapsed');
        const startCollapsed = savedState === 'true';
        
        if (startCollapsed) {
            this.panels.leaderboard.classList.add('collapsed');
            scrollableContent.style.display = 'none';
            if (collapseIcon) collapseIcon.textContent = '▲';
        } else {
            scrollableContent.style.display = 'block';
            if (collapseIcon) collapseIcon.textContent = '▼';
        }
        
        // Add click handler
        newHeader.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            const isCollapsed = this.panels.leaderboard.classList.contains('collapsed');
            
            if (isCollapsed) {
                // Expand
                this.panels.leaderboard.classList.remove('collapsed');
                scrollableContent.style.display = 'block';
                if (collapseIcon) collapseIcon.textContent = '▼';
                localStorage.setItem('mobileLeaderboardCollapsed', 'false');
            } else {
                // Collapse
                this.panels.leaderboard.classList.add('collapsed');
                scrollableContent.style.display = 'none';
                if (collapseIcon) collapseIcon.textContent = '▲';
                localStorage.setItem('mobileLeaderboardCollapsed', 'true');
            }
            
            if (this.config.debug.logInitialization) {
                console.log(`[MobileUI] Leaderboard ${isCollapsed ? 'expanded' : 'collapsed'}`);
            }
        });
    }
    
    setupBoostMeter() {
        if (!this.boostButton || !this.boostMeterFill) return;
        
        const updateBoostDisplay = () => {
            if (window.playerSnake && window.playerSnake.isAlive) {
                const staminaPercent = window.playerSnake.stamina;
                this.boostMeterFill.style.height = `${staminaPercent}%`;
                
                if (staminaPercent < 30) {
                    this.boostMeterFill.style.background = 'linear-gradient(to top, rgba(59, 16, 83, 0.8), rgba(76, 29, 117, 0.8))';
                } else if (staminaPercent < 60) {
                    this.boostMeterFill.style.background = 'linear-gradient(to top, rgba(89, 28, 135, 0.8), rgba(147, 51, 234, 0.8))';
                } else {
                    this.boostMeterFill.style.background = 'linear-gradient(to top, rgba(124, 58, 237, 0.8), rgba(167, 139, 250, 0.8))';
                }
                
                if (Math.abs(staminaPercent - this.lastBoostAmount) > 1) {
                    this.animateBoostChange(staminaPercent > this.lastBoostAmount);
                    this.lastBoostAmount = staminaPercent;
                }
            }
        };
        
        this.boostUpdateInterval = setInterval(updateBoostDisplay, 50);
    }
    
    animateBoostChange(isIncreasing) {
        if (!this.boostButton) return;
        
        const animation = isIncreasing ? 'boost-pulse' : 'boost-drain';
        this.boostButton.style.animation = `${animation} 0.3s ease`;
        
        setTimeout(() => {
            if (this.boostButton) {
                this.boostButton.style.animation = '';
            }
        }, 300);
    }
    
    setupDiscoveryFeed() {
        if (!this.config.features.discoveryFeed) return;
        
        this.createDiscoveryFeed();
        this.listenForDiscoveries();
    }
    
    createDiscoveryFeed() {
        if (document.querySelector('.discovery-feed')) return;
        
        const feed = document.createElement('div');
        feed.className = 'discovery-feed';
        feed.style.cssText = `
            position: fixed !important;
            bottom: ${this.config.positions.discoveryFeed.bottom}px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            width: 80% !important;
            max-width: 300px !important;
            height: 60px !important;
            pointer-events: none !important;
            z-index: 1000 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: flex-end !important;
        `;
        
        document.body.appendChild(feed);
        this.discoveryFeed = feed;
    }
    
    listenForDiscoveries() {
        window.addEventListener('elementDiscovered', (event) => {
            if (!this.discoveryFeed) return;
            
            const { element } = event.detail;
            this.showDiscoveryNotification(element);
        });
    }
    
    showDiscoveryNotification(element) {
        const notification = document.createElement('div');
        notification.className = 'discovery-notification';
        notification.style.cssText = `
            background: rgba(30, 30, 30, 0.95) !important;
            border: 2px solid #ffd700 !important;
            border-radius: 10px !important;
            padding: 8px 15px !important;
            margin-bottom: 5px !important;
            animation: discoverySlideUp 0.5s ease, discoveryFadeOut 0.5s ease 2.5s !important;
            display: flex !important;
            align-items: center !important;
            gap: 10px !important;
            font-size: 14px !important;
            color: #fff !important;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 20px;">${element.emoji}</span>
            <span>Discovered ${element.name}!</span>
        `;
        
        this.discoveryFeed.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
    
    startMonitoring() {
        this.monitorInterval = setInterval(() => {
            this.updateSkinPreview();
            this.checkPanelVisibility();
        }, 1000);
    }
    
    updateSkinPreview() {
        if (!this.config.features.skinPreview) return;
        
        const skinPreview = document.querySelector('.mobile-tab-skin');
        if (!skinPreview) return;
        
        const currentSkin = window.currentPlayerSkin || 'snake-default-green';
        if (currentSkin !== this.currentSkin) {
            this.currentSkin = currentSkin;
            const skinData = window.skinMetadata?.[currentSkin];
            if (skinData && skinData.image) {
                skinPreview.style.backgroundImage = `url('${skinData.image}')`;
            }
        }
    }
    
    checkPanelVisibility() {
        if (this.panels.stats && !this.panels.stats.querySelector('.player-info-header')) {
            this.panels.stats.style.display = 'none';
        } else if (this.panels.stats) {
            this.panels.stats.style.display = 'block';
        }
    }
    
    setupMutationObserver() {
        const observer = new MutationObserver(() => {
            if (!this.panels.stats || !this.panels.leaderboard) {
                this.findElements();
                if (this.mode === 'fixed') {
                    this.setupFixedMode();
                } else {
                    this.setupSlideoutMode();
                }
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    destroy() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        if (this.boostUpdateInterval) {
            clearInterval(this.boostUpdateInterval);
        }
        
        document.querySelectorAll('.mobile-tab-handle').forEach(el => el.remove());
        
        if (this.discoveryFeed) {
            this.discoveryFeed.remove();
        }
        
        this.initialized = false;
    }
    
    switchMode(newMode) {
        if (newMode === this.mode) return;
        
        this.mode = newMode;
        this.config.mode = newMode;
        
        document.querySelectorAll('.mobile-tab-handle').forEach(el => el.remove());
        
        if (newMode === 'fixed') {
            this.setupFixedMode();
        } else {
            this.setupSlideoutMode();
        }
    }
}

window.MobileUIManager = MobileUIManager;
export default MobileUIManager;