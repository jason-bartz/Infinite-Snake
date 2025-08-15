// Canvas Layering System for Performance Optimization
// Separates rendering into multiple layers to reduce redundant drawing

class CanvasLayerSystem {
    constructor() {
        this.layers = new Map();
        this.mainCanvas = null;
        this.mainCtx = null;
        this.initialized = false;
        
        // Layer configuration
        this.layerConfig = {
            background: {
                zIndex: 0,
                static: true,
                updateFrequency: 0, // Never updates unless forced
                clearBeforeDraw: false
            },
            staticElements: {
                zIndex: 1,
                static: true,
                updateFrequency: 60, // Updates every 60 frames
                clearBeforeDraw: true
            },
            gameEntities: {
                zIndex: 2,
                static: false,
                updateFrequency: 1, // Updates every frame
                clearBeforeDraw: true
            },
            effects: {
                zIndex: 3,
                static: false,
                updateFrequency: 1,
                clearBeforeDraw: true
            },
            ui: {
                zIndex: 4,
                static: false,
                updateFrequency: 2, // Updates every 2 frames
                clearBeforeDraw: true
            }
        };
        
        // Frame counters for update frequency
        this.frameCounters = new Map();
        
        // Dirty flags for forced updates
        this.dirtyFlags = new Map();
    }
    
    init(mainCanvas) {
        if (this.initialized) return;
        
        this.mainCanvas = mainCanvas;
        this.mainCtx = mainCanvas.getContext('2d', {
            alpha: false,
            desynchronized: true,
            willReadFrequently: false
        });
        
        // Create offscreen canvases for each layer
        Object.entries(this.layerConfig).forEach(([name, config]) => {
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = mainCanvas.width;
            offscreenCanvas.height = mainCanvas.height;
            
            const ctx = offscreenCanvas.getContext('2d', {
                alpha: true,
                desynchronized: true,
                willReadFrequently: false
            });
            
            // Optimize context settings
            ctx.imageSmoothingEnabled = false;
            ctx.imageSmoothingQuality = 'low';
            
            this.layers.set(name, {
                canvas: offscreenCanvas,
                ctx: ctx,
                config: config,
                needsUpdate: true
            });
            
            this.frameCounters.set(name, 0);
            this.dirtyFlags.set(name, false);
        });
        
        this.initialized = true;
    }
    
    // Get a specific layer context for drawing
    getLayer(layerName) {
        const layer = this.layers.get(layerName);
        return layer ? layer.ctx : null;
    }
    
    // Mark a layer as needing update
    markDirty(layerName) {
        this.dirtyFlags.set(layerName, true);
    }
    
    // Check if layer should update this frame
    shouldUpdateLayer(layerName) {
        const layer = this.layers.get(layerName);
        if (!layer) return false;
        
        // Check dirty flag
        if (this.dirtyFlags.get(layerName)) {
            this.dirtyFlags.set(layerName, false);
            return true;
        }
        
        // Check update frequency
        const counter = this.frameCounters.get(layerName) || 0;
        const shouldUpdate = counter % layer.config.updateFrequency === 0;
        
        return shouldUpdate;
    }
    
    // Begin drawing to a layer
    beginLayer(layerName) {
        const layer = this.layers.get(layerName);
        if (!layer) return null;
        
        // Increment frame counter
        this.frameCounters.set(layerName, (this.frameCounters.get(layerName) || 0) + 1);
        
        // Only clear if this layer should update
        if (this.shouldUpdateLayer(layerName)) {
            if (layer.config.clearBeforeDraw) {
                layer.ctx.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
            }
            layer.needsUpdate = true;
            return layer.ctx;
        }
        
        layer.needsUpdate = false;
        return null; // Don't draw to this layer this frame
    }
    
    // Composite all layers to main canvas
    composite() {
        // Clear main canvas
        this.mainCtx.fillStyle = '#000011';
        this.mainCtx.fillRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        
        // Sort layers by z-index and composite
        const sortedLayers = Array.from(this.layers.entries())
            .sort((a, b) => a[1].config.zIndex - b[1].config.zIndex);
        
        for (const [name, layer] of sortedLayers) {
            // Only composite if layer has content
            if (layer.canvas.width > 0 && layer.canvas.height > 0) {
                this.mainCtx.drawImage(layer.canvas, 0, 0);
            }
        }
    }
    
    // Resize all layers when window resizes
    resize(width, height) {
        this.layers.forEach((layer) => {
            layer.canvas.width = width;
            layer.canvas.height = height;
            
            // Reapply optimizations after resize
            layer.ctx.imageSmoothingEnabled = false;
            layer.ctx.imageSmoothingQuality = 'low';
        });
        
        // Mark all layers as dirty after resize
        this.layers.forEach((_, name) => {
            this.markDirty(name);
        });
    }
    
    // Get stats for debugging
    getStats() {
        const stats = {};
        this.layers.forEach((layer, name) => {
            stats[name] = {
                frameCounter: this.frameCounters.get(name),
                isDirty: this.dirtyFlags.get(name),
                needsUpdate: layer.needsUpdate
            };
        });
        return stats;
    }
}

// Export for use in game
window.CanvasLayerSystem = CanvasLayerSystem;