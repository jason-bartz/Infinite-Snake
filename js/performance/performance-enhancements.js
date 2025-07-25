// Performance Enhancements Module
// Applies universal performance optimizations that benefit all browsers

(function() {
    'use strict';
    
    // Browser detection
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    console.log('Performance Enhancements: Initializing...');
    
    // 1. Convert existing event listeners to passive where appropriate
    function makePassiveListeners() {
        // Store original addEventListener
        const originalAddEventListener = EventTarget.prototype.addEventListener;
        
        // Override addEventListener to add passive flag for scroll/touch events
        EventTarget.prototype.addEventListener = function(type, listener, options) {
            // Events that should be passive for better scrolling performance
            const passiveEvents = ['touchstart', 'touchmove', 'touchend', 'wheel', 'mousewheel'];
            
            // Events that should NOT be passive (need preventDefault)
            const nonPassiveEvents = ['touchmove'];
            const nonPassiveElements = ['canvas', 'joystick'];
            
            // Check if this is a scroll-related event that can be passive
            if (passiveEvents.includes(type)) {
                // Check if this element needs preventDefault (game canvas, joystick)
                const needsPreventDefault = 
                    this.id && nonPassiveElements.some(id => this.id.includes(id)) ||
                    this.classList && this.classList.contains('game-canvas') ||
                    this.tagName === 'CANVAS';
                
                if (!needsPreventDefault && type !== 'touchmove') {
                    // Make it passive
                    if (typeof options === 'object') {
                        options.passive = true;
                    } else if (typeof options === 'boolean') {
                        options = { capture: options, passive: true };
                    } else {
                        options = { passive: true };
                    }
                }
            }
            
            // Special handling for scroll events - always passive
            if (type === 'scroll' || type === 'resize') {
                if (typeof options === 'object') {
                    options.passive = true;
                } else if (typeof options === 'boolean') {
                    options = { capture: options, passive: true };
                } else {
                    options = { passive: true };
                }
            }
            
            return originalAddEventListener.call(this, type, listener, options);
        };
    }
    
    // 2. Optimize RAF (RequestAnimationFrame) for consistent frame timing
    function optimizeRAF() {
        const targetFPS = 60;
        const targetFrameTime = 1000 / targetFPS;
        let lastFrameTime = 0;
        
        // Store original RAF
        const originalRAF = window.requestAnimationFrame;
        
        // Enhanced RAF with frame timing
        window.requestAnimationFrame = function(callback) {
            return originalRAF.call(window, (timestamp) => {
                // Calculate delta time
                const deltaTime = timestamp - lastFrameTime;
                
                // Skip frame if running too fast (prevents unnecessary renders)
                if (deltaTime < targetFrameTime * 0.75) {
                    return originalRAF.call(window, arguments.callee);
                }
                
                lastFrameTime = timestamp;
                
                // Call original callback with timing info
                if (window.performanceMonitor) {
                    window.performanceMonitor.startFrame();
                    callback(timestamp);
                    window.performanceMonitor.endFrame();
                    window.performanceMonitor.frameCount++;
                } else {
                    callback(timestamp);
                }
            });
        };
    }
    
    // 3. Optimize Canvas Context operations
    function optimizeCanvas() {
        // Get all canvas contexts when created
        const originalGetContext = HTMLCanvasElement.prototype.getContext;
        
        HTMLCanvasElement.prototype.getContext = function(type, options) {
            const context = originalGetContext.call(this, type, options);
            
            if (type === '2d' && context) {
                // Apply performance optimizations to 2D context
                
                // Disable image smoothing for pixel art style (better performance)
                context.imageSmoothingEnabled = false;
                context.webkitImageSmoothingEnabled = false;
                context.mozImageSmoothingEnabled = false;
                context.msImageSmoothingEnabled = false;
                
                // Wrap drawing operations to track performance
                if (window.performanceMonitor) {
                    const originalFillText = context.fillText;
                    const originalDrawImage = context.drawImage;
                    const originalFillRect = context.fillRect;
                    
                    context.fillText = function() {
                        window.performanceMonitor.trackCanvasOperation();
                        return originalFillText.apply(this, arguments);
                    };
                    
                    context.drawImage = function() {
                        window.performanceMonitor.trackCanvasOperation();
                        return originalDrawImage.apply(this, arguments);
                    };
                    
                    context.fillRect = function() {
                        window.performanceMonitor.trackCanvasOperation();
                        return originalFillRect.apply(this, arguments);
                    };
                }
            }
            
            return context;
        };
    }
    
    // 4. Optimize DOM operations
    function optimizeDOMOperations() {
        // Batch DOM reads/writes using requestIdleCallback when available
        if ('requestIdleCallback' in window) {
            window.batchDOMUpdate = function(updateFn) {
                requestIdleCallback(updateFn, { timeout: 16 });
            };
        } else {
            window.batchDOMUpdate = function(updateFn) {
                setTimeout(updateFn, 0);
            };
        }
        
        // Track DOM updates
        if (window.performanceMonitor) {
            const originalClassListAdd = DOMTokenList.prototype.add;
            const originalClassListRemove = DOMTokenList.prototype.remove;
            
            DOMTokenList.prototype.add = function() {
                window.performanceMonitor.trackDOMUpdate();
                return originalClassListAdd.apply(this, arguments);
            };
            
            DOMTokenList.prototype.remove = function() {
                window.performanceMonitor.trackDOMUpdate();
                return originalClassListRemove.apply(this, arguments);
            };
        }
    }
    
    // 5. Safari-specific optimizations
    function applySafariOptimizations() {
        if (!isSafari) return;
        
        console.log('Performance Enhancements: Applying Safari-specific optimizations');
        
        // Force hardware acceleration on key elements
        const acceleratedSelectors = [
            '#gameCanvas',
            '.mobile-ui',
            '.discovery-feed',
            '.pause-overlay',
            '.unlock-notification'
        ];
        
        acceleratedSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                el.style.transform = 'translateZ(0)';
                el.style.webkitTransform = 'translateZ(0)';
            });
        });
        
        // Reduce visual effects on iOS
        if (isIOS) {
            document.body.classList.add('ios-performance-mode');
        }
    }
    
    // 6. Memory optimization - clean up unused objects
    function setupMemoryOptimization() {
        // Periodically trigger garbage collection hints
        setInterval(() => {
            if (window.gc) {
                window.gc();
            }
        }, 30000); // Every 30 seconds
    }
    
    // 7. Initialize all optimizations
    function initialize() {
        // Apply optimizations
        makePassiveListeners();
        optimizeRAF();
        optimizeCanvas();
        optimizeDOMOperations();
        setupMemoryOptimization();
        
        // Apply Safari optimizations after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applySafariOptimizations);
        } else {
            applySafariOptimizations();
        }
        
        console.log('Performance Enhancements: All optimizations applied');
        
        // Log performance improvements
        if (window.performanceMonitor) {
            setTimeout(() => {
                console.log('Performance Enhancements: Initial report');
                window.performanceMonitor.logReport();
            }, 5000);
        }
    }
    
    // Start initialization
    initialize();
    
    // Expose API for manual optimization triggers
    window.PerformanceEnhancements = {
        reapplyOptimizations: initialize,
        applySafariOptimizations: applySafariOptimizations,
        isSafari: isSafari,
        isIOS: isIOS
    };
})();