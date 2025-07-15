// Performance Optimizer Module
// Handles memory management, event optimization, and rendering improvements

class PerformanceOptimizer {
    constructor() {
        this.resizeHandlers = new Map();
        this.eventListeners = new Map();
        this.backgroundCanvas = null;
        this.backgroundCtx = null;
        this.backgroundDirty = true;
        this.lastBackgroundUpdate = 0;
        this.aiDataCleanupInterval = 30000; // Clean up AI data every 30 seconds
        this.lastAICleanup = 0;
        this.maxAIDataEntries = 10; // Limit AI snake data storage
        
        // Debounce timers
        this.resizeDebounceTimer = null;
        this.resizeDebounceDelay = 16; // ~60fps
        
        // Performance monitoring
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.currentFPS = 60;
    }

    // Initialize performance optimizations
    init(canvas, isMobile) {
        this.canvas = canvas;
        this.isMobile = isMobile;
        
        // Create offscreen canvas for background caching
        if (!isMobile) {
            this.setupBackgroundCache();
        }
        
        // Setup optimized event handlers
        this.setupOptimizedEventHandlers();
        
        return this;
    }

    // Setup background caching for desktop
    setupBackgroundCache() {
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCtx = this.backgroundCanvas.getContext('2d', {
            alpha: true,
            desynchronized: true
        });
    }

    // Update background cache dimensions
    updateBackgroundCache(width, height) {
        if (this.backgroundCanvas) {
            this.backgroundCanvas.width = width;
            this.backgroundCanvas.height = height;
            this.backgroundDirty = true;
        }
    }

    // Cache static background elements
    cacheBackground(drawFunction) {
        if (!this.backgroundCanvas || this.isMobile) return false;
        
        const now = Date.now();
        if (this.backgroundDirty || now - this.lastBackgroundUpdate > 5000) {
            this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
            drawFunction(this.backgroundCtx);
            this.backgroundDirty = false;
            this.lastBackgroundUpdate = now;
            return true;
        }
        return false;
    }

    // Draw cached background
    drawCachedBackground(ctx) {
        if (this.backgroundCanvas && !this.backgroundDirty) {
            ctx.drawImage(this.backgroundCanvas, 0, 0);
            return true;
        }
        return false;
    }

    // Setup optimized event handlers with debouncing
    setupOptimizedEventHandlers() {
        // Optimized resize handler
        this.addOptimizedListener(window, 'resize', (callback) => {
            return (event) => {
                if (this.resizeDebounceTimer) {
                    clearTimeout(this.resizeDebounceTimer);
                }
                this.resizeDebounceTimer = setTimeout(() => {
                    callback(event);
                }, this.resizeDebounceDelay);
            };
        });

        // Passive event listeners for better scrolling performance
        const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'mousewheel'];
        passiveEvents.forEach(eventType => {
            this.addPassiveSupport(eventType);
        });
    }

    // Add listener with optimization wrapper
    addOptimizedListener(target, event, callbackWrapper, callback) {
        const wrappedCallback = callbackWrapper ? callbackWrapper(callback) : callback;
        const key = `${target.id || 'window'}_${event}`;
        
        // Remove old listener if exists
        if (this.eventListeners.has(key)) {
            const oldListener = this.eventListeners.get(key);
            target.removeEventListener(event, oldListener);
        }
        
        this.eventListeners.set(key, wrappedCallback);
        target.addEventListener(event, wrappedCallback);
    }

    // Add passive event support
    addPassiveSupport(eventType) {
        let supportsPassive = false;
        try {
            const opts = Object.defineProperty({}, 'passive', {
                get: function() {
                    supportsPassive = true;
                    return true;
                }
            });
            window.addEventListener("testPassive", null, opts);
            window.removeEventListener("testPassive", null, opts);
        } catch (e) {}

        return supportsPassive ? { passive: true } : false;
    }

    // Clean up AI snake data map to prevent memory leaks
    cleanupAIData(aiSnakeDataMap, currentTime) {
        if (currentTime - this.lastAICleanup < this.aiDataCleanupInterval) {
            return;
        }

        this.lastAICleanup = currentTime;

        // Limit map size
        if (aiSnakeDataMap.size > this.maxAIDataEntries) {
            // Convert to array, sort by score, keep top entries
            const entries = Array.from(aiSnakeDataMap.entries());
            entries.sort((a, b) => b[1].score - a[1].score);
            
            // Clear and repopulate with top entries
            aiSnakeDataMap.clear();
            entries.slice(0, this.maxAIDataEntries).forEach(([key, value]) => {
                aiSnakeDataMap.set(key, value);
            });
        }
    }

    // Clean up dead snake segments
    cleanupDeadSnakeSegments(snakes) {
        snakes.forEach(snake => {
            if (!snake.alive && !snake.isDying) {
                // Clear segments array to free memory
                snake.segments = [];
                snake.elements = [];
            }
        });
    }

    // Limit shooting stars array
    limitShootingStars(shootingStars, maxStars = 5) {
        if (shootingStars.length > maxStars) {
            // Keep only the newest stars
            return shootingStars.slice(-maxStars);
        }
        return shootingStars;
    }

    // Check if entity is in viewport (with margin)
    isInViewport(entity, camera, canvas, margin = 100) {
        const screenX = (entity.x - camera.x) * camera.zoom + canvas.width / 2;
        const screenY = (entity.y - camera.y) * camera.zoom + canvas.height / 2;
        
        return screenX > -margin && 
               screenX < canvas.width + margin && 
               screenY > -margin && 
               screenY < canvas.height + margin;
    }

    // Batch similar draw operations
    batchDrawCalls(entities, drawFunction) {
        // Sort entities by type/texture to minimize state changes
        entities.sort((a, b) => {
            if (a.type !== b.type) return a.type.localeCompare(b.type);
            if (a.texture !== b.texture) return a.texture.localeCompare(b.texture);
            return 0;
        });

        // Draw in batches
        let lastType = null;
        let lastTexture = null;
        
        entities.forEach(entity => {
            if (entity.type !== lastType || entity.texture !== lastTexture) {
                // State change - could setup new render state here
                lastType = entity.type;
                lastTexture = entity.texture;
            }
            drawFunction(entity);
        });
    }

    // Update FPS counter
    updateFPS(currentTime) {
        this.frameCount++;
        
        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.currentFPS = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;
        }
        
        return this.currentFPS;
    }

    // Get performance recommendations based on FPS
    getPerformanceMode() {
        if (this.currentFPS < 30) {
            return 'low';
        } else if (this.currentFPS < 50) {
            return 'medium';
        }
        return 'high';
    }

    // Cleanup all event listeners
    cleanup() {
        // Clear all event listeners
        this.eventListeners.forEach((listener, key) => {
            const [targetId, event] = key.split('_');
            const target = targetId === 'window' ? window : document.getElementById(targetId);
            if (target) {
                target.removeEventListener(event, listener);
            }
        });
        this.eventListeners.clear();

        // Clear timers
        if (this.resizeDebounceTimer) {
            clearTimeout(this.resizeDebounceTimer);
        }

        // Clear canvases
        this.backgroundCanvas = null;
        this.backgroundCtx = null;
    }
}

// Enhanced emoji cache with LRU eviction
class EnhancedEmojiCache {
    constructor(maxSize = 500) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = [];
    }

    get(key) {
        if (this.cache.has(key)) {
            // Move to end (most recently used)
            this.updateAccessOrder(key);
            return this.cache.get(key);
        }
        return null;
    }

    set(key, canvas) {
        // Check if we need to evict
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            // Evict least recently used
            const lru = this.accessOrder.shift();
            this.cache.delete(lru);
        }

        this.cache.set(key, canvas);
        this.updateAccessOrder(key);
    }

    updateAccessOrder(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
        }
        this.accessOrder.push(key);
    }

    clear() {
        this.cache.clear();
        this.accessOrder = [];
    }

    get size() {
        return this.cache.size;
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceOptimizer, EnhancedEmojiCache };
}