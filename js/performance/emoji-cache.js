// Optimized Emoji Cache with LRU eviction
// Provides efficient emoji rendering with memory management

class EmojiCache {
    constructor(maxSize = 500) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = new Map(); // Track access times for LRU
        this.preRenderedSizes = [16, 20, 24, 32, 40, 48]; // Common sizes to pre-render
        this.renderingQueue = [];
        this.isPrewarming = false;
        
        // Performance tracking
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            renders: 0
        };
        
        // Device tier integration
        this.deviceTier = window.deviceTierDetector?.tier || 'medium';
        this.updateMaxSize();
    }
    
    // Update cache size based on device tier
    updateMaxSize() {
        if (window.gameQualitySettings?.emojiCacheSize) {
            this.maxSize = window.gameQualitySettings.emojiCacheSize;
        }
    }
    
    // Get cached emoji or render new one
    get(emoji, size) {
        const validSize = Math.max(1, Math.round(size) || 20);
        const key = `${emoji}_${validSize}`;
        
        // Check cache
        if (this.cache.has(key)) {
            this.stats.hits++;
            this.updateAccessTime(key);
            return this.cache.get(key);
        }
        
        // Cache miss
        this.stats.misses++;
        
        // Check for pre-rendered texture (mobile optimization)
        if (window.isMobile && window.getCachedEmojiTexture) {
            const preRendered = window.getCachedEmojiTexture(emoji, validSize);
            if (preRendered) {
                this.set(key, preRendered);
                return preRendered;
            }
        }
        
        // Render new emoji
        const canvas = this.renderEmoji(emoji, validSize);
        this.set(key, canvas);
        return canvas;
    }
    
    // Render emoji to offscreen canvas
    renderEmoji(emoji, size) {
        this.stats.renders++;
        
        const canvas = document.createElement('canvas');
        const padding = 4;
        canvas.width = size + padding * 2;
        canvas.height = size + padding * 2;
        
        const ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true // Better performance on some browsers
        });
        
        // Disable smoothing for mobile
        if (window.isMobile) {
            ctx.imageSmoothingEnabled = false;
        }
        
        // Configure text rendering
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        
        // Use faster rendering method for low-end devices
        if (this.deviceTier === 'low') {
            ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
        } else {
            // Higher quality rendering for better devices
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 1;
            ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
            ctx.restore();
        }
        
        return canvas;
    }
    
    // Set item in cache with LRU eviction
    set(key, canvas) {
        // Check if we need to evict
        if (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }
        
        this.cache.set(key, canvas);
        this.updateAccessTime(key);
    }
    
    // Update access time for LRU tracking
    updateAccessTime(key) {
        this.accessOrder.set(key, Date.now());
    }
    
    // Evict least recently used item
    evictLRU() {
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, time] of this.accessOrder) {
            if (time < oldestTime) {
                oldestTime = time;
                oldestKey = key;
            }
        }
        
        if (oldestKey) {
            this.cache.delete(oldestKey);
            this.accessOrder.delete(oldestKey);
            this.stats.evictions++;
        }
    }
    
    // Pre-warm cache with common emojis
    async prewarm(commonEmojis) {
        if (this.isPrewarming) return;
        this.isPrewarming = true;
        
        // Common game emojis
        const defaultEmojis = ['🔥', '💧', '🌍', '💨', '⚡', '🌟', '💎', '🐍', '😊', '👑', '💀', '✨', '🔮'];
        const emojisToPrewarm = commonEmojis || defaultEmojis;
        
        // Prewarm in batches to avoid blocking
        const batchSize = 5;
        for (let i = 0; i < emojisToPrewarm.length; i += batchSize) {
            const batch = emojisToPrewarm.slice(i, i + batchSize);
            
            await new Promise(resolve => {
                requestAnimationFrame(() => {
                    batch.forEach(emoji => {
                        this.preRenderedSizes.forEach(size => {
                            this.get(emoji, size);
                        });
                    });
                    resolve();
                });
            });
        }
        
        this.isPrewarming = false;
        console.log(`Emoji cache prewarmed with ${emojisToPrewarm.length} emojis`);
    }
    
    // Clear cache
    clear() {
        this.cache.clear();
        this.accessOrder.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            renders: 0
        };
    }
    
    // Get cache statistics
    getStats() {
        const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
        return {
            ...this.stats,
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: (hitRate * 100).toFixed(1) + '%'
        };
    }
    
    // Batch get for multiple emojis (reduces overhead)
    getBatch(emojiRequests) {
        const results = [];
        for (const { emoji, size } of emojiRequests) {
            results.push(this.get(emoji, size));
        }
        return results;
    }
    
    // Optimize cache based on usage patterns
    optimize() {
        // Remove items that haven't been accessed in 30 seconds
        const staleThreshold = Date.now() - 30000;
        const keysToRemove = [];
        
        for (const [key, time] of this.accessOrder) {
            if (time < staleThreshold) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            this.cache.delete(key);
            this.accessOrder.delete(key);
        });
        
        if (keysToRemove.length > 0) {
            console.log(`Removed ${keysToRemove.length} stale emoji cache entries`);
        }
    }
}

// Create global instance
window.emojiCache = new EmojiCache();

// Export for module usage
export default EmojiCache;