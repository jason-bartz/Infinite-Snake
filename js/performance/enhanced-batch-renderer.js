// Enhanced Batch Renderer for Infinite Snake
// Optimizes rendering by batching draw calls and improving culling

class EnhancedBatchRenderer {
    constructor(ctx, options = {}) {
        this.ctx = ctx;
        this.options = {
            maxBatchSize: options.maxBatchSize || 200,
            cullMargin: options.cullMargin || 100,
            enableTextBatching: options.enableTextBatching !== false,
            enableImageBatching: options.enableImageBatching !== false,
            enableShapeBatching: options.enableShapeBatching !== false,
            adaptiveCulling: options.adaptiveCulling !== false,
            ...options
        };
        
        // Batch queues for different render types
        this.batches = {
            images: new Map(),      // Images and sprites
            emojis: new Map(),      // Emoji text rendering
            shapes: new Map(),      // Circles, rectangles, etc.
            text: new Map(),        // Regular text
            paths: []               // Complex paths
        };
        
        // Viewport information
        this.viewport = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            scale: 1
        };
        
        // Performance tracking
        this.stats = {
            totalDrawCalls: 0,
            batchedDrawCalls: 0,
            culledObjects: 0,
            visibleObjects: 0,
            frameCount: 0
        };
        
        // Culling margins per entity type
        this.cullMargins = {
            snake: 150,
            element: 50,
            particle: 30,
            boss: 200,
            asteroid: 100,
            powerup: 75,
            default: 100
        };
        
        // Pre-allocated arrays for batch processing
        this.tempArrays = {
            positions: new Float32Array(this.options.maxBatchSize * 2),
            sizes: new Float32Array(this.options.maxBatchSize),
            colors: new Uint32Array(this.options.maxBatchSize)
        };
    }
    
    // Update viewport for culling calculations
    updateViewport(camera, canvas, zoom) {
        this.viewport.x = camera.x - canvas.width / (2 * zoom);
        this.viewport.y = camera.y - canvas.height / (2 * zoom);
        this.viewport.width = canvas.width / zoom;
        this.viewport.height = canvas.height / zoom;
        this.viewport.scale = zoom;
    }
    
    // Start new frame
    beginFrame() {
        // Clear all batches
        this.batches.images.clear();
        this.batches.emojis.clear();
        this.batches.shapes.clear();
        this.batches.text.clear();
        this.batches.paths = [];
        
        // Reset stats for this frame
        this.stats.frameCount++;
        this.stats.culledObjects = 0;
        this.stats.visibleObjects = 0;
    }
    
    // Enhanced viewport culling with adaptive margins
    isInViewport(x, y, size, entityType = 'default') {
        const margin = this.options.adaptiveCulling 
            ? this.getAdaptiveCullMargin(entityType, size)
            : this.cullMargins[entityType] || this.cullMargins.default;
        
        const totalMargin = margin + size;
        
        const inView = x >= this.viewport.x - totalMargin &&
                      x <= this.viewport.x + this.viewport.width + totalMargin &&
                      y >= this.viewport.y - totalMargin &&
                      y <= this.viewport.y + this.viewport.height + totalMargin;
        
        if (inView) {
            this.stats.visibleObjects++;
        } else {
            this.stats.culledObjects++;
        }
        
        return inView;
    }
    
    // Get adaptive cull margin based on entity type and size
    getAdaptiveCullMargin(entityType, size) {
        // Larger objects need bigger margins
        const sizeMultiplier = Math.min(2, size / 50);
        
        // Moving objects need bigger margins
        const motionMultiplier = entityType === 'snake' || entityType === 'boss' ? 1.5 : 1;
        
        const baseMargin = this.cullMargins[entityType] || this.cullMargins.default;
        
        return baseMargin * sizeMultiplier * motionMultiplier;
    }
    
    // Queue an image for batched rendering
    queueImage(image, x, y, width, height, options = {}) {
        if (!this.options.enableImageBatching) {
            this.drawImageImmediate(image, x, y, width, height, options);
            return;
        }
        
        // Early culling
        if (!this.isInViewport(x, y, Math.max(width, height), options.entityType)) {
            return;
        }
        
        const key = this.getImageBatchKey(image, options);
        
        if (!this.batches.images.has(key)) {
            this.batches.images.set(key, {
                image: image,
                instances: [],
                options: options
            });
        }
        
        this.batches.images.get(key).instances.push({
            x, y, width, height,
            rotation: options.rotation || 0,
            alpha: options.alpha || 1
        });
    }
    
    // Queue emoji for batched rendering
    queueEmoji(emoji, x, y, size, options = {}) {
        if (!this.options.enableTextBatching) {
            this.drawEmojiImmediate(emoji, x, y, size, options);
            return;
        }
        
        // Early culling
        if (!this.isInViewport(x, y, size, options.entityType || 'element')) {
            return;
        }
        
        const key = this.getEmojiBatchKey(emoji, size, options);
        
        if (!this.batches.emojis.has(key)) {
            this.batches.emojis.set(key, {
                emoji: emoji,
                size: size,
                instances: [],
                options: options
            });
        }
        
        this.batches.emojis.get(key).instances.push({ x, y });
    }
    
    // Queue shape for batched rendering
    queueCircle(x, y, radius, options = {}) {
        if (!this.options.enableShapeBatching) {
            this.drawCircleImmediate(x, y, radius, options);
            return;
        }
        
        // Early culling
        if (!this.isInViewport(x, y, radius * 2, options.entityType)) {
            return;
        }
        
        const key = this.getShapeBatchKey('circle', options);
        
        if (!this.batches.shapes.has(key)) {
            this.batches.shapes.set(key, {
                type: 'circle',
                instances: [],
                options: options
            });
        }
        
        this.batches.shapes.get(key).instances.push({ x, y, radius });
    }
    
    // Render all batched items
    flush() {
        const startTime = performance.now();
        
        // Reset draw call counter
        this.stats.batchedDrawCalls = 0;
        
        // Render shapes first (usually backgrounds)
        this.flushShapes();
        
        // Render images
        this.flushImages();
        
        // Render emojis
        this.flushEmojis();
        
        // Render text
        this.flushText();
        
        // Render paths
        this.flushPaths();
        
        const elapsed = performance.now() - startTime;
        
        // Update total draw calls
        this.stats.totalDrawCalls += this.stats.batchedDrawCalls;
    }
    
    // Flush image batches
    flushImages() {
        this.batches.images.forEach((batch) => {
            if (batch.instances.length === 0) return;
            
            this.ctx.save();
            
            // Apply batch-wide settings
            if (batch.options.globalAlpha !== undefined) {
                this.ctx.globalAlpha = batch.options.globalAlpha;
            }
            
            // Draw all instances
            batch.instances.forEach(instance => {
                if (instance.rotation) {
                    this.ctx.save();
                    this.ctx.translate(instance.x, instance.y);
                    this.ctx.rotate(instance.rotation);
                    this.ctx.drawImage(batch.image, -instance.width/2, -instance.height/2, 
                                     instance.width, instance.height);
                    this.ctx.restore();
                } else {
                    this.ctx.drawImage(batch.image, instance.x - instance.width/2, 
                                     instance.y - instance.height/2, 
                                     instance.width, instance.height);
                }
            });
            
            this.ctx.restore();
            this.stats.batchedDrawCalls++;
        });
    }
    
    // Flush emoji batches
    flushEmojis() {
        this.batches.emojis.forEach((batch) => {
            if (batch.instances.length === 0) return;
            
            this.ctx.save();
            
            // Set font for this batch
            this.ctx.font = `${batch.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            if (batch.options.globalAlpha !== undefined) {
                this.ctx.globalAlpha = batch.options.globalAlpha;
            }
            
            // Draw all emoji instances
            batch.instances.forEach(instance => {
                // Convert world to screen coordinates
                const screenX = (instance.x - this.viewport.x) * this.viewport.scale;
                const screenY = (instance.y - this.viewport.y) * this.viewport.scale;
                
                this.ctx.fillText(batch.emoji, screenX, screenY);
            });
            
            this.ctx.restore();
            this.stats.batchedDrawCalls++;
        });
    }
    
    // Flush shape batches
    flushShapes() {
        this.batches.shapes.forEach((batch) => {
            if (batch.instances.length === 0) return;
            
            this.ctx.save();
            
            // Apply batch settings
            if (batch.options.fillStyle) {
                this.ctx.fillStyle = batch.options.fillStyle;
            }
            if (batch.options.strokeStyle) {
                this.ctx.strokeStyle = batch.options.strokeStyle;
            }
            if (batch.options.lineWidth) {
                this.ctx.lineWidth = batch.options.lineWidth;
            }
            if (batch.options.globalAlpha !== undefined) {
                this.ctx.globalAlpha = batch.options.globalAlpha;
            }
            
            // Draw all shapes in one path
            this.ctx.beginPath();
            
            batch.instances.forEach(instance => {
                if (batch.type === 'circle') {
                    // Convert world to screen coordinates
                    const screenX = (instance.x - this.viewport.x) * this.viewport.scale;
                    const screenY = (instance.y - this.viewport.y) * this.viewport.scale;
                    const screenRadius = instance.radius * this.viewport.scale;
                    
                    this.ctx.moveTo(screenX + screenRadius, screenY);
                    this.ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
                }
            });
            
            if (batch.options.fill !== false) {
                this.ctx.fill();
            }
            if (batch.options.stroke) {
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            this.stats.batchedDrawCalls++;
        });
    }
    
    // Flush text batches
    flushText() {
        // Similar to emoji flushing but for regular text
        this.batches.text.forEach((batch) => {
            if (batch.instances.length === 0) return;
            
            this.ctx.save();
            
            // Apply text settings
            this.ctx.font = batch.font;
            this.ctx.fillStyle = batch.fillStyle || '#000';
            this.ctx.textAlign = batch.textAlign || 'left';
            this.ctx.textBaseline = batch.textBaseline || 'alphabetic';
            
            batch.instances.forEach(instance => {
                this.ctx.fillText(instance.text, instance.x, instance.y);
            });
            
            this.ctx.restore();
            this.stats.batchedDrawCalls++;
        });
    }
    
    // Flush path batches
    flushPaths() {
        // Complex paths are drawn individually as they can't be easily batched
        this.batches.paths.forEach(path => {
            this.ctx.save();
            path.draw(this.ctx);
            this.ctx.restore();
            this.stats.batchedDrawCalls++;
        });
    }
    
    // Generate batch key for images
    getImageBatchKey(image, options) {
        return `img_${image.src}_${options.globalAlpha || 1}_${options.blendMode || 'normal'}`;
    }
    
    // Generate batch key for emojis
    getEmojiBatchKey(emoji, size, options) {
        return `emoji_${emoji}_${Math.round(size)}_${options.globalAlpha || 1}`;
    }
    
    // Generate batch key for shapes
    getShapeBatchKey(type, options) {
        return `${type}_${options.fillStyle || 'none'}_${options.strokeStyle || 'none'}_${options.globalAlpha || 1}`;
    }
    
    // Immediate draw methods (fallback when batching is disabled)
    drawImageImmediate(image, x, y, width, height, options) {
        this.ctx.save();
        if (options.globalAlpha !== undefined) {
            this.ctx.globalAlpha = options.globalAlpha;
        }
        this.ctx.drawImage(image, x - width/2, y - height/2, width, height);
        this.ctx.restore();
        this.stats.totalDrawCalls++;
    }
    
    drawEmojiImmediate(emoji, x, y, size, options) {
        this.ctx.save();
        this.ctx.font = `${size}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        if (options.globalAlpha !== undefined) {
            this.ctx.globalAlpha = options.globalAlpha;
        }
        this.ctx.fillText(emoji, x, y);
        this.ctx.restore();
        this.stats.totalDrawCalls++;
    }
    
    drawCircleImmediate(x, y, radius, options) {
        this.ctx.save();
        if (options.fillStyle) this.ctx.fillStyle = options.fillStyle;
        if (options.strokeStyle) this.ctx.strokeStyle = options.strokeStyle;
        if (options.globalAlpha !== undefined) this.ctx.globalAlpha = options.globalAlpha;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        
        if (options.fill !== false) this.ctx.fill();
        if (options.stroke) this.ctx.stroke();
        
        this.ctx.restore();
        this.stats.totalDrawCalls++;
    }
    
    // Get performance statistics
    getStats() {
        const cullRate = (this.stats.culledObjects + this.stats.visibleObjects) > 0
            ? (this.stats.culledObjects / (this.stats.culledObjects + this.stats.visibleObjects) * 100).toFixed(2)
            : 0;
            
        return {
            ...this.stats,
            cullRate: `${cullRate}%`,
            avgDrawCallsPerFrame: this.stats.frameCount > 0 
                ? (this.stats.totalDrawCalls / this.stats.frameCount).toFixed(2)
                : 0
        };
    }
    
    // Reset statistics
    resetStats() {
        this.stats = {
            totalDrawCalls: 0,
            batchedDrawCalls: 0,
            culledObjects: 0,
            visibleObjects: 0,
            frameCount: 0
        };
    }
}

// Export for use in game
window.EnhancedBatchRenderer = EnhancedBatchRenderer;