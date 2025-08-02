// Batch Renderer for Infinite Snake
// Optimizes canvas rendering by batching multiple draw calls

class BatchRenderer {
    constructor(ctx, isMobile) {
        this.ctx = ctx;
        this.isMobile = isMobile;
        this.batches = new Map(); // Group by texture/emoji
        this.renderQueue = [];
        this.maxBatchSize = isMobile ? 50 : 100;
        
        // Pre-rendered emoji sizes for common use cases
        this.commonSizes = isMobile ? [16, 20, 24, 30] : [20, 24, 30, 40];
        this.preRenderedEmojis = new Map();
        
        // Viewport culling margin
        this.cullMargin = isMobile ? 50 : 100;
        
        // Performance tracking
        this.drawCallsThisFrame = 0;
        this.drawCallsSaved = 0;
    }
    
    // Pre-render common emojis at startup
    preRenderCommonEmojis(emojis) {
        // Pre-rendering common emojis...
        const startTime = performance.now();
        
        emojis.forEach(emoji => {
            this.commonSizes.forEach(size => {
                const key = `${emoji}_${size}`;
                const canvas = this.createEmojiCanvas(emoji, size);
                this.preRenderedEmojis.set(key, canvas);
            });
        });
        
        const elapsed = performance.now() - startTime;
        // Pre-rendered ${this.preRenderedEmojis.size} emojis in ${elapsed}ms
    }
    
    createEmojiCanvas(emoji, size) {
        const canvas = document.createElement('canvas');
        const padding = 4;
        canvas.width = size + padding * 2;
        canvas.height = size + padding * 2;
        const ctx = canvas.getContext('2d');
        
        if (this.isMobile) {
            ctx.imageSmoothingEnabled = false;
        }
        
        ctx.font = `${size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        ctx.fillText(emoji, canvas.width / 2, canvas.height / 2);
        
        return canvas;
    }
    
    // Get emoji canvas from cache or create new
    getEmojiCanvas(emoji, size) {
        // Round size for consistency
        const validSize = Math.max(1, Math.round(size || 20));
        const key = `${emoji}_${validSize}`;
        
        // Check pre-rendered cache first
        if (this.preRenderedEmojis.has(key)) {
            return this.preRenderedEmojis.get(key);
        }
        
        // Fall back to regular emoji cache (if integrated with existing system)
        if (window.getCachedEmoji) {
            return window.getCachedEmoji(emoji, validSize);
        }
        
        // Create new if not cached
        return this.createEmojiCanvas(emoji, validSize);
    }
    
    // Start a new frame
    startFrame() {
        this.batches.clear();
        this.renderQueue = [];
        this.drawCallsThisFrame = 0;
        this.drawCallsSaved = 0;
    }
    
    // Add emoji to render queue
    queueEmoji(emoji, x, y, size, alpha = 1) {
        // Early viewport culling
        if (!this.isInViewport(x, y, size)) {
            this.drawCallsSaved++;
            return;
        }
        
        const validSize = Math.max(1, Math.round(size || 20));
        const key = `emoji_${emoji}_${validSize}_${alpha}`;
        
        if (!this.batches.has(key)) {
            this.batches.set(key, {
                type: 'emoji',
                emoji: emoji,
                size: validSize,
                alpha: alpha,
                instances: []
            });
        }
        
        this.batches.get(key).instances.push({ x, y });
    }
    
    // Add image to render queue
    queueImage(image, x, y, width, height, alpha = 1) {
        // Early viewport culling
        if (!this.isInViewport(x, y, Math.max(width, height))) {
            this.drawCallsSaved++;
            return;
        }
        
        const key = `img_${image.src}_${alpha}`;
        
        if (!this.batches.has(key)) {
            this.batches.set(key, {
                type: 'image',
                image: image,
                alpha: alpha,
                instances: []
            });
        }
        
        this.batches.get(key).instances.push({ x, y, width, height });
    }
    
    // Check if position is in viewport (with margin)
    isInViewport(worldX, worldY, size) {
        if (!window.worldToScreen) return true; // Fallback if not available
        
        const screen = window.worldToScreen(worldX, worldY);
        const margin = this.cullMargin + size;
        
        return screen.x >= -margin && 
               screen.x <= this.ctx.canvas.width + margin &&
               screen.y >= -margin && 
               screen.y <= this.ctx.canvas.height + margin;
    }
    
    // Render all queued items
    flush() {
        // Sort batches by type and alpha for better performance
        const sortedBatches = Array.from(this.batches.values())
            .sort((a, b) => {
                if (a.type !== b.type) return a.type.localeCompare(b.type);
                return b.alpha - a.alpha; // Higher alpha first
            });
        
        sortedBatches.forEach(batch => {
            this.renderBatch(batch);
        });
        
        // Log performance stats in debug mode
        if (window.DEBUG_RENDERING) {
            // Draw calls: ${this.drawCallsThisFrame}, Saved: ${this.drawCallsSaved}
        }
    }
    
    renderBatch(batch) {
        if (batch.instances.length === 0) return;
        
        const ctx = this.ctx;
        ctx.save();
        
        if (batch.alpha < 1) {
            ctx.globalAlpha = batch.alpha;
        }
        
        if (batch.type === 'emoji') {
            const canvas = this.getEmojiCanvas(batch.emoji, batch.size);
            
            // Render all instances of this emoji
            batch.instances.forEach(instance => {
                const screen = window.worldToScreen(instance.x, instance.y);
                ctx.drawImage(canvas, 
                    screen.x - canvas.width / 2, 
                    screen.y - canvas.height / 2
                );
                this.drawCallsThisFrame++;
            });
        } else if (batch.type === 'image') {
            // Render all instances of this image
            batch.instances.forEach(instance => {
                const screen = window.worldToScreen(instance.x, instance.y);
                ctx.drawImage(batch.image,
                    screen.x - instance.width / 2,
                    screen.y - instance.height / 2,
                    instance.width,
                    instance.height
                );
                this.drawCallsThisFrame++;
            });
        }
        
        ctx.restore();
    }
    
    // Get performance stats
    getStats() {
        return {
            drawCalls: this.drawCallsThisFrame,
            saved: this.drawCallsSaved,
            batches: this.batches.size,
            efficiency: this.drawCallsSaved / (this.drawCallsThisFrame + this.drawCallsSaved)
        };
    }
}

// Export for use in game
window.BatchRenderer = BatchRenderer;