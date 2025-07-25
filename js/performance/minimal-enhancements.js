// Minimal Performance Enhancements
// Only the most essential and safe optimizations

(function() {
    'use strict';
    
    console.log('Minimal Performance Enhancements: Initializing...');
    
    // Browser detection
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 1. Add passive listeners safely (only to specific events that won't break the game)
    function addPassiveSupport() {
        // Test if passive is supported
        let passiveSupported = false;
        try {
            const options = {
                get passive() {
                    passiveSupported = true;
                    return false;
                }
            };
            window.addEventListener("test", null, options);
            window.removeEventListener("test", null, options);
        } catch(err) {
            passiveSupported = false;
        }
        
        if (!passiveSupported) return;
        
        // Only add passive to window scroll/resize events
        const originalWindowAddEventListener = window.addEventListener;
        window.addEventListener = function(type, listener, options) {
            if (type === 'scroll' || type === 'resize') {
                if (typeof options === 'boolean') {
                    options = { capture: options, passive: true };
                } else if (typeof options === 'object') {
                    options.passive = true;
                } else {
                    options = { passive: true };
                }
            }
            return originalWindowAddEventListener.call(this, type, listener, options);
        };
        
        console.log('Minimal Performance: Added passive support for window scroll/resize');
    }
    
    // 2. Safari-specific CSS class
    function applySafariClass() {
        if (isSafari) {
            document.documentElement.classList.add('safari');
            if (isIOS) {
                document.documentElement.classList.add('ios');
            }
            console.log('Minimal Performance: Safari classes applied');
        }
    }
    
    // 3. Request Animation Frame optimization (non-invasive)
    function optimizeRAF() {
        // Just add frame counting for monitoring, don't modify RAF behavior
        let frameCount = 0;
        const originalRAF = window.requestAnimationFrame;
        
        window.requestAnimationFrame = function(callback) {
            return originalRAF.call(window, function(timestamp) {
                frameCount++;
                
                // Call original callback
                const result = callback(timestamp);
                
                // Update frame count in performance monitor if available
                if (window.performanceMonitor && window.performanceMonitor.frameCount !== undefined) {
                    window.performanceMonitor.frameCount = frameCount;
                }
                
                return result;
            });
        };
    }
    
    // 4. Reduce visual effects on low-end devices
    function detectLowEndDevice() {
        // Simple detection based on device memory and CPU cores
        const isLowEnd = navigator.deviceMemory && navigator.deviceMemory <= 4 ||
                        navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
        
        if (isLowEnd || isIOS) {
            document.documentElement.classList.add('reduce-effects');
            console.log('Minimal Performance: Low-end device detected, reducing effects');
        }
    }
    
    // Initialize only after DOM is ready
    function initialize() {
        addPassiveSupport();
        applySafariClass();
        optimizeRAF();
        detectLowEndDevice();
        
        console.log('Minimal Performance Enhancements: Complete');
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Expose status
    window.MinimalPerformanceEnhancements = {
        isSafari: isSafari,
        isIOS: isIOS,
        status: 'active'
    };
})();