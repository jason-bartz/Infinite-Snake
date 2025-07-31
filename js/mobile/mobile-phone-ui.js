// Mobile Phone UI Enhancements
import MobilePhoneDetector from './mobile-phone-detection.js';

class MobilePhoneUI {
    constructor() {
        this.menuOpen = false;
        this.hamburgerMenu = null;
        this.menuOverlay = null;
    }
    
    init() {
        if (!MobilePhoneDetector.isPhone()) {
            return;
        }
        
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupUI());
        } else {
            this.setupUI();
        }
    }
    
    setupUI() {
        this.createHamburgerMenu();
        this.createMenuOverlay();
        this.attachEventListeners();
    }
    
    createHamburgerMenu() {
        // Check if we're on a page with navigation
        const splashScreen = document.getElementById('splashScreen');
        const gameModeSelect = document.getElementById('gameModeSelect');
        
        if (!splashScreen && !gameModeSelect) {
            return;
        }
        
        // Create hamburger menu
        this.hamburgerMenu = document.createElement('div');
        this.hamburgerMenu.className = 'mobile-hamburger-menu';
        this.hamburgerMenu.innerHTML = `
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
            <div class="hamburger-line"></div>
        `;
        
        // Add to both screens if they exist
        if (splashScreen) {
            splashScreen.appendChild(this.hamburgerMenu.cloneNode(true));
        }
        if (gameModeSelect) {
            gameModeSelect.appendChild(this.hamburgerMenu.cloneNode(true));
        }
    }
    
    createMenuOverlay() {
        // Create menu overlay
        this.menuOverlay = document.createElement('div');
        this.menuOverlay.className = 'mobile-menu-overlay';
        this.menuOverlay.innerHTML = `
            <div class="mobile-menu-close">&times;</div>
            <a href="/how-to-play.html">📖 How to Play</a>
            <a href="/lore.html">📜 Lore</a>
            <a href="/leaderboard.html">🏆 Leaderboard</a>
            <a href="/profile.html">👤 Profile</a>
            <a href="https://discord.gg/a6X4W7QbkG" target="_blank">💬 Join Discord</a>
        `;
        
        document.body.appendChild(this.menuOverlay);
    }
    
    attachEventListeners() {
        // Hamburger menu click handlers
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mobile-hamburger-menu')) {
                this.toggleMenu();
            }
            
            if (e.target.classList.contains('mobile-menu-close')) {
                this.closeMenu();
            }
        });
        
        // Close menu when clicking overlay background
        this.menuOverlay.addEventListener('click', (e) => {
            if (e.target === this.menuOverlay) {
                this.closeMenu();
            }
        });
        
        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.menuOpen) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        this.menuOpen = !this.menuOpen;
        if (this.menuOpen) {
            this.menuOverlay.classList.add('active');
        } else {
            this.menuOverlay.classList.remove('active');
        }
    }
    
    closeMenu() {
        this.menuOpen = false;
        this.menuOverlay.classList.remove('active');
    }
}

// Initialize
const mobilePhoneUI = new MobilePhoneUI();
mobilePhoneUI.init();

// Export for use in other modules
window.MobilePhoneUI = MobilePhoneUI;
export default MobilePhoneUI;