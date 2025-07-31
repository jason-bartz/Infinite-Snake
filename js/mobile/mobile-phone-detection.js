// Mobile Phone Detection Module
// Differentiates between phones and tablets/iPads

class MobilePhoneDetector {
    static isPhone() {
        // Check if we've already detected
        if (window.mobilePhoneDetected !== undefined) {
            return window.mobilePhoneDetected;
        }
        
        // Get screen dimensions
        const screenWidth = Math.min(window.screen.width, window.screen.height);
        const screenHeight = Math.max(window.screen.width, window.screen.height);
        const pixelRatio = window.devicePixelRatio || 1;
        
        // Calculate physical dimensions (approximate)
        const physicalWidth = screenWidth / pixelRatio;
        const physicalHeight = screenHeight / pixelRatio;
        
        // Phone detection criteria:
        // 1. Screen width < 500px (physical pixels)
        // 2. OR viewport width < 500px
        // 3. AND has touch capability
        // 4. AND is mobile user agent
        
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isIPad = /iPad/i.test(navigator.userAgent);
        
        // Viewport check
        const viewportWidth = window.innerWidth;
        const isSmallViewport = viewportWidth < 500;
        
        // Physical size check (phones typically < 500px wide)
        const isPhoneSize = physicalWidth < 500 || screenWidth < 500;
        
        // Final determination
        window.mobilePhoneDetected = hasTouch && isMobileUA && !isIPad && (isSmallViewport || isPhoneSize);
        
        // Add class to body for CSS targeting
        if (window.mobilePhoneDetected) {
            document.body.classList.add('mobile-phone');
        }
        
        return window.mobilePhoneDetected;
    }
    
    static init() {
        // Run detection on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.isPhone());
        } else {
            this.isPhone();
        }
        
        // Re-run on orientation change
        window.addEventListener('orientationchange', () => {
            window.mobilePhoneDetected = undefined;
            this.isPhone();
        });
    }
}

// Initialize on load
MobilePhoneDetector.init();

// Export for use in other modules
window.MobilePhoneDetector = MobilePhoneDetector;
export default MobilePhoneDetector;