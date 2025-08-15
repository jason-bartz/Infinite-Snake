// Gradient Cache System for Performance Optimization
// Caches and reuses gradients instead of recreating them each frame

class GradientCache {
    constructor(ctx) {
        this.ctx = ctx;
        this.cache = new Map();
        this.maxCacheSize = 100;
        this.hits = 0;
        this.misses = 0;
        
        // Common gradient presets
        this.presets = {
            fireball: null,
            waterwave: null,
            earthShock: null,
            airBlast: null,
            energyGlow: null,
            shieldGradient: null,
            explosionGradient: null,
            boostTrail: null,
            portalEffect: null,
            healingAura: null
        };
        
        this.initPresets();
    }
    
    // Initialize common gradient presets
    initPresets() {
        // These will be created lazily when first requested
        // This avoids creating gradients that might not be used
    }
    
    // Generate a unique key for gradient parameters
    generateKey(type, ...params) {
        return `${type}_${params.join('_')}`;
    }
    
    // Get or create a radial gradient
    getRadialGradient(x0, y0, r0, x1, y1, r1, colorStops) {
        // Round coordinates to reduce cache misses from minor position changes
        const roundedParams = [
            Math.round(x0), Math.round(y0), Math.round(r0),
            Math.round(x1), Math.round(y1), Math.round(r1)
        ];
        
        const key = this.generateKey('radial', ...roundedParams, JSON.stringify(colorStops));
        
        if (this.cache.has(key)) {
            this.hits++;
            return this.cache.get(key);
        }
        
        this.misses++;
        
        // Create new gradient
        const gradient = this.ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        
        // Add to cache with LRU eviction
        this.addToCache(key, gradient);
        
        return gradient;
    }
    
    // Get or create a linear gradient
    getLinearGradient(x0, y0, x1, y1, colorStops) {
        // Round coordinates to reduce cache misses
        const roundedParams = [
            Math.round(x0), Math.round(y0),
            Math.round(x1), Math.round(y1)
        ];
        
        const key = this.generateKey('linear', ...roundedParams, JSON.stringify(colorStops));
        
        if (this.cache.has(key)) {
            this.hits++;
            return this.cache.get(key);
        }
        
        this.misses++;
        
        // Create new gradient
        const gradient = this.ctx.createLinearGradient(x0, y0, x1, y1);
        colorStops.forEach(stop => {
            gradient.addColorStop(stop.offset, stop.color);
        });
        
        // Add to cache
        this.addToCache(key, gradient);
        
        return gradient;
    }
    
    // Get preset gradient (creates it once on first use)
    getPreset(name, createFunction) {
        if (!this.presets.hasOwnProperty(name)) {
            console.warn(`Unknown gradient preset: ${name}`);
            return null;
        }
        
        if (!this.presets[name] && createFunction) {
            this.presets[name] = createFunction(this.ctx);
        }
        
        return this.presets[name];
    }
    
    // Common gradient creators
    createFireballGradient(x, y, radius) {
        return this.getRadialGradient(x, y, 0, x, y, radius, [
            { offset: 0, color: '#ffff00' },
            { offset: 0.5, color: '#ff6600' },
            { offset: 1, color: 'rgba(255, 0, 0, 0.3)' }
        ]);
    }
    
    createWaterWaveGradient(x, y, innerRadius, outerRadius) {
        return this.getRadialGradient(x, y, innerRadius, x, y, outerRadius, [
            { offset: 0, color: 'rgba(0, 150, 255, 0.8)' },
            { offset: 0.5, color: 'rgba(0, 100, 255, 0.6)' },
            { offset: 1, color: 'rgba(0, 50, 255, 0.2)' }
        ]);
    }
    
    createEnergyGlowGradient(x, y, innerRadius, outerRadius, color) {
        const baseColor = color || '#00ff00';
        return this.getRadialGradient(x, y, innerRadius, x, y, outerRadius, [
            { offset: 0, color: baseColor },
            { offset: 0.5, color: this.adjustAlpha(baseColor, 0.5) },
            { offset: 1, color: this.adjustAlpha(baseColor, 0.1) }
        ]);
    }
    
    createExplosionGradient(x, y, radius, progress) {
        const alpha = 1 - progress;
        return this.getRadialGradient(x, y, 0, x, y, radius, [
            { offset: 0, color: `rgba(255, 255, 255, ${alpha})` },
            { offset: 0.3, color: `rgba(255, 200, 0, ${alpha * 0.8})` },
            { offset: 0.6, color: `rgba(255, 100, 0, ${alpha * 0.5})` },
            { offset: 1, color: `rgba(255, 0, 0, 0)` }
        ]);
    }
    
    createBoostTrailGradient(x, y, radius) {
        return this.getRadialGradient(x, y, 0, x, y, radius, [
            { offset: 0, color: 'rgba(100, 200, 255, 0.8)' },
            { offset: 0.5, color: 'rgba(50, 150, 255, 0.4)' },
            { offset: 1, color: 'rgba(0, 100, 255, 0)' }
        ]);
    }
    
    // Add gradient to cache with LRU eviction
    addToCache(key, gradient) {
        // Evict oldest entry if cache is full
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, gradient);
    }
    
    // Clear the cache
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
        
        // Clear presets
        Object.keys(this.presets).forEach(key => {
            this.presets[key] = null;
        });
    }
    
    // Utility function to adjust alpha of a color
    adjustAlpha(color, alpha) {
        // Handle hex colors
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // Handle rgb/rgba colors
        if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match && match.length >= 3) {
                return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
            }
        }
        
        return color;
    }
    
    // Get cache statistics
    getStats() {
        const hitRate = this.hits + this.misses > 0 
            ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) 
            : 0;
            
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            hits: this.hits,
            misses: this.misses,
            hitRate: `${hitRate}%`
        };
    }
    
    // Update context (useful after canvas resize)
    updateContext(ctx) {
        this.ctx = ctx;
        this.clear(); // Clear cache as gradients are tied to context
    }
}

// Export for use in game
window.GradientCache = GradientCache;