// Math Optimizations Module
// Pre-calculated values and optimized math functions for better performance

class MathOptimizer {
    constructor() {
        // Extended lookup tables
        this.sinTable = new Float32Array(3600); // 0.1 degree precision
        this.cosTable = new Float32Array(3600);
        this.atan2Cache = new Map();
        this.distanceCache = new Map();
        
        // Initialize lookup tables
        this.initializeLookupTables();
        
        // Constants for fast calculations
        this.RAD_TO_INDEX = 3600 / (2 * Math.PI);
        this.INDEX_TO_RAD = (2 * Math.PI) / 3600;
    }

    initializeLookupTables() {
        // Pre-calculate sin/cos values
        for (let i = 0; i < 3600; i++) {
            const angle = (i / 3600) * 2 * Math.PI;
            this.sinTable[i] = Math.sin(angle);
            this.cosTable[i] = Math.cos(angle);
        }
    }

    // Fast sin using lookup table
    fastSin(angle) {
        // Normalize angle to 0-2π
        angle = angle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;
        
        const index = Math.floor(angle * this.RAD_TO_INDEX);
        return this.sinTable[index];
    }

    // Fast cos using lookup table
    fastCos(angle) {
        // Normalize angle to 0-2π
        angle = angle % (2 * Math.PI);
        if (angle < 0) angle += 2 * Math.PI;
        
        const index = Math.floor(angle * this.RAD_TO_INDEX);
        return this.cosTable[index];
    }

    // Fast distance calculation (without square root when not needed)
    distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    // Cached distance calculation
    distance(x1, y1, x2, y2) {
        // Create cache key (rounded to reduce cache size)
        const key = `${Math.round(x1)},${Math.round(y1)},${Math.round(x2)},${Math.round(y2)}`;
        
        if (this.distanceCache.has(key)) {
            return this.distanceCache.get(key);
        }
        
        const dist = Math.sqrt(this.distanceSquared(x1, y1, x2, y2));
        
        // Limit cache size
        if (this.distanceCache.size > 1000) {
            // Clear half the cache
            const entries = Array.from(this.distanceCache.entries());
            this.distanceCache.clear();
            entries.slice(entries.length / 2).forEach(([k, v]) => {
                this.distanceCache.set(k, v);
            });
        }
        
        this.distanceCache.set(key, dist);
        return dist;
    }

    // Fast atan2 with caching for common angles
    fastAtan2(y, x) {
        // Round to reduce cache keys
        const roundedY = Math.round(y * 100) / 100;
        const roundedX = Math.round(x * 100) / 100;
        const key = `${roundedY},${roundedX}`;
        
        if (this.atan2Cache.has(key)) {
            return this.atan2Cache.get(key);
        }
        
        const result = Math.atan2(y, x);
        
        // Limit cache size
        if (this.atan2Cache.size > 500) {
            this.atan2Cache.clear();
        }
        
        this.atan2Cache.set(key, result);
        return result;
    }

    // Optimized angle difference calculation
    angleDifference(angle1, angle2) {
        let diff = angle2 - angle1;
        
        // Normalize to -π to π
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        
        return diff;
    }

    // Fast lerp (linear interpolation)
    lerp(start, end, t) {
        return start + (end - start) * t;
    }

    // Fast clamp
    clamp(value, min, max) {
        return value < min ? min : value > max ? max : value;
    }

    // Optimized random in range
    randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    // Fast absolute value
    fastAbs(value) {
        return value < 0 ? -value : value;
    }

    // Optimized vector operations
    normalizeVector(x, y) {
        const lengthSq = x * x + y * y;
        if (lengthSq === 0) return { x: 0, y: 0 };
        
        const invLength = 1 / Math.sqrt(lengthSq);
        return {
            x: x * invLength,
            y: y * invLength
        };
    }

    // Fast point rotation
    rotatePoint(x, y, angle, centerX = 0, centerY = 0) {
        const cos = this.fastCos(angle);
        const sin = this.fastSin(angle);
        
        const dx = x - centerX;
        const dy = y - centerY;
        
        return {
            x: centerX + dx * cos - dy * sin,
            y: centerY + dx * sin + dy * cos
        };
    }

    // Optimized circle-circle collision
    circlesCollide(x1, y1, r1, x2, y2, r2) {
        const distSq = this.distanceSquared(x1, y1, x2, y2);
        const radiusSum = r1 + r2;
        return distSq < radiusSum * radiusSum;
    }

    // Clear caches (call periodically to prevent memory bloat)
    clearCaches() {
        this.atan2Cache.clear();
        this.distanceCache.clear();
    }
}

// Singleton instance
const mathOptimizer = new MathOptimizer();

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathOptimizer, mathOptimizer };
}