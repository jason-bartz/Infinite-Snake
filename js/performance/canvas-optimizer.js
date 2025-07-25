// Canvas Rendering Optimizer
// Implements dirty rectangle tracking and batch rendering for improved performance

class CanvasOptimizer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dirtyRects = [];
        this.isOptimized = true;
        this.frameBuffer = null;
        this.lastFrameData = null;
        
        // Batch rendering
        this.renderBatch = [];
        this.batchSize = 100;
        
        // Performance tracking
        this.renderCalls = 0;
        this.skippedRenders = 0;
        
        // Initialize offscreen canvas for double buffering
        this.initializeBuffers();
        
        // Emoji cache with multiple sizes
        this.emojiCache = new Map();
        this.emojiCanvases = new Map();
        
        // Common emoji sizes used in the game
        this.cacheSizes = [20, 30, 40, 50, 60];
    }
    
    initializeBuffers() {
        // Create offscreen canvas for double buffering
        this.frameBuffer = document.createElement('canvas');
        this.frameBuffer.width = this.canvas.width;
        this.frameBuffer.height = this.canvas.height;
        this.bufferCtx = this.frameBuffer.getContext('2d', {
            alpha: false,
            desynchronized: true
        });
        
        // Copy context settings
        this.bufferCtx.imageSmoothingEnabled = false;
        this.bufferCtx.webkitImageSmoothingEnabled = false;
        this.bufferCtx.mozImageSmoothingEnabled = false;
        this.bufferCtx.msImageSmoothingEnabled = false;
    }
    
    // Mark a region as dirty (needs redraw)
    markDirty(x, y, width, height) {
        // Expand rect slightly to account for anti-aliasing
        const padding = 2;
        this.dirtyRects.push({
            x: Math.floor(x - padding),
            y: Math.floor(y - padding),
            width: Math.ceil(width + padding * 2),
            height: Math.ceil(height + padding * 2)
        });
    }
    
    // Merge overlapping dirty rectangles for efficiency
    mergeDirtyRects() {
        if (this.dirtyRects.length < 2) return;
        
        const merged = [];
        const rects = [...this.dirtyRects];
        
        while (rects.length > 0) {
            let current = rects.pop();
            let didMerge = true;
            
            while (didMerge) {
                didMerge = false;
                
                for (let i = rects.length - 1; i >= 0; i--) {
                    const other = rects[i];
                    
                    if (this.rectsOverlap(current, other)) {
                        // Merge rectangles
                        const minX = Math.min(current.x, other.x);
                        const minY = Math.min(current.y, other.y);
                        const maxX = Math.max(current.x + current.width, other.x + other.width);
                        const maxY = Math.max(current.y + current.height, other.y + other.height);
                        
                        current = {
                            x: minX,
                            y: minY,
                            width: maxX - minX,
                            height: maxY - minY
                        };
                        
                        rects.splice(i, 1);
                        didMerge = true;
                    }
                }
            }
            
            merged.push(current);
        }
        
        this.dirtyRects = merged;
    }
    
    rectsOverlap(a, b) {
        return !(a.x + a.width < b.x || 
                 b.x + b.width < a.x || 
                 a.y + a.height < b.y || 
                 b.y + b.height < a.y);
    }
    
    // Begin frame - clear dirty rects
    beginFrame() {
        this.renderCalls = 0;
        this.renderBatch = [];
        
        if (!this.isOptimized) {
            // Full clear for non-optimized mode
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }
        
        // Merge overlapping dirty rectangles
        this.mergeDirtyRects();
        
        // Clear only dirty regions
        if (this.dirtyRects.length > 0) {
            // If too many dirty rects, just clear the whole canvas
            if (this.dirtyRects.length > 20) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.dirtyRects = [{
                    x: 0,
                    y: 0,
                    width: this.canvas.width,
                    height: this.canvas.height
                }];
            } else {
                // Clear individual dirty rects
                this.dirtyRects.forEach(rect => {
                    this.ctx.clearRect(rect.x, rect.y, rect.width, rect.height);
                });
            }
        }
    }
    
    // End frame - apply optimizations
    endFrame() {
        // Process render batch
        this.processBatch();
        
        // Clear dirty rects for next frame
        this.dirtyRects = [];
        
        // Update performance stats
        if (window.performanceMonitor) {
            window.performanceMonitor.metrics.renderCalls = this.renderCalls;
        }
    }
    
    // Batch rendering operations
    addToBatch(operation) {
        this.renderBatch.push(operation);
        
        if (this.renderBatch.length >= this.batchSize) {
            this.processBatch();
        }
    }
    
    processBatch() {
        if (this.renderBatch.length === 0) return;
        
        // Sort by operation type for better performance
        this.renderBatch.sort((a, b) => a.type.localeCompare(b.type));
        
        // Process operations by type
        let currentType = null;
        
        this.renderBatch.forEach(op => {
            if (op.type !== currentType) {
                currentType = op.type;
                this.setupContextForType(op.type);
            }
            
            this.executeOperation(op);
        });
        
        // Clear batch
        this.renderBatch = [];
    }
    
    setupContextForType(type) {
        // Setup context state for specific operation types
        switch (type) {
            case 'emoji':
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                break;
            case 'rect':
                // Rect-specific setup
                break;
            case 'circle':
                // Circle-specific setup
                break;
        }
    }
    
    executeOperation(op) {
        this.renderCalls++;
        
        switch (op.type) {
            case 'emoji':
                this.drawCachedEmoji(op.emoji, op.x, op.y, op.size);
                break;
            case 'rect':
                this.ctx.fillStyle = op.color;
                this.ctx.fillRect(op.x, op.y, op.width, op.height);
                break;
            case 'circle':
                this.ctx.fillStyle = op.color;
                this.ctx.beginPath();
                this.ctx.arc(op.x, op.y, op.radius, 0, Math.PI * 2);
                this.ctx.fill();
                break;
        }
    }
    
    // Optimized emoji rendering with caching
    drawEmoji(emoji, x, y, size) {
        // Check if this area needs redraw
        if (this.isOptimized && !this.isInDirtyRect(x - size/2, y - size/2, size, size)) {
            this.skippedRenders++;
            return;
        }
        
        // Add to batch
        this.addToBatch({
            type: 'emoji',
            emoji: emoji,
            x: x,
            y: y,
            size: size
        });
        
        // Mark as dirty for next frame
        this.markDirty(x - size/2, y - size/2, size, size);
    }
    
    drawCachedEmoji(emoji, x, y, size) {
        const cacheKey = `${emoji}_${size}`;
        let cachedCanvas = this.emojiCanvases.get(cacheKey);
        
        if (!cachedCanvas) {
            // Create cached version
            cachedCanvas = this.createEmojiCache(emoji, size);
            this.emojiCanvases.set(cacheKey, cachedCanvas);
        }
        
        // Draw cached emoji
        this.ctx.drawImage(cachedCanvas, x - size/2, y - size/2);
    }
    
    createEmojiCache(emoji, size) {
        const canvas = document.createElement('canvas');
        const padding = 4; // Add padding for emoji rendering
        canvas.width = size + padding * 2;
        canvas.height = size + padding * 2;
        
        const ctx = canvas.getContext('2d', {
            alpha: true,
            desynchronized: true
        });
        
        // Disable smoothing for pixel-perfect rendering
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        // Setup text rendering
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw emoji
        ctx.fillText(emoji, canvas.width/2, canvas.height/2);
        
        return canvas;
    }
    
    // Pre-cache common emojis
    precacheEmojis(emojis) {
        console.log(`Canvas Optimizer: Pre-caching ${emojis.length} emojis...`);
        
        emojis.forEach(emoji => {
            this.cacheSizes.forEach(size => {
                const cacheKey = `${emoji}_${size}`;
                if (!this.emojiCanvases.has(cacheKey)) {
                    this.emojiCanvases.set(cacheKey, this.createEmojiCache(emoji, size));
                }
            });
        });
        
        console.log(`Canvas Optimizer: Pre-cached ${this.emojiCanvases.size} emoji variations`);
    }
    
    // Check if a rectangle is within any dirty region
    isInDirtyRect(x, y, width, height) {
        if (this.dirtyRects.length === 0) return false;
        
        const rect = { x, y, width, height };
        return this.dirtyRects.some(dirty => this.rectsOverlap(rect, dirty));
    }
    
    // Optimized rectangle drawing
    drawRect(x, y, width, height, color) {
        if (this.isOptimized && !this.isInDirtyRect(x, y, width, height)) {
            this.skippedRenders++;
            return;
        }
        
        this.addToBatch({
            type: 'rect',
            x: x,
            y: y,
            width: width,
            height: height,
            color: color
        });
        
        this.markDirty(x, y, width, height);
    }
    
    // Optimized circle drawing
    drawCircle(x, y, radius, color) {
        const bounds = {
            x: x - radius,
            y: y - radius,
            width: radius * 2,
            height: radius * 2
        };
        
        if (this.isOptimized && !this.isInDirtyRect(bounds.x, bounds.y, bounds.width, bounds.height)) {
            this.skippedRenders++;
            return;
        }
        
        this.addToBatch({
            type: 'circle',
            x: x,
            y: y,
            radius: radius,
            color: color
        });
        
        this.markDirty(bounds.x, bounds.y, bounds.width, bounds.height);
    }
    
    // Clear and reset optimization state
    clear() {
        this.dirtyRects = [{
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        }];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Get performance stats
    getStats() {
        return {
            renderCalls: this.renderCalls,
            skippedRenders: this.skippedRenders,
            cacheSize: this.emojiCanvases.size,
            dirtyRects: this.dirtyRects.length,
            optimizationRatio: this.renderCalls > 0 ? 
                (this.skippedRenders / (this.renderCalls + this.skippedRenders) * 100).toFixed(1) : 0
        };
    }
    
    // Toggle optimization on/off for testing
    toggleOptimization() {
        this.isOptimized = !this.isOptimized;
        console.log(`Canvas optimization: ${this.isOptimized ? 'ON' : 'OFF'}`);
        return this.isOptimized;
    }
}

// Export for use in game
window.CanvasOptimizer = CanvasOptimizer;