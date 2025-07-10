// Texture Atlas System for Infinite Snake
// Combines multiple textures into a single atlas for efficient rendering

class TextureAtlas {
    constructor(size = 2048) {
        this.size = size;
        this.canvas = document.createElement('canvas');
        this.canvas.width = size;
        this.canvas.height = size;
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Packing algorithm state
        this.nodes = [{ x: 0, y: 0, width: size, height: size }];
        this.textures = new Map();
        this.padding = 2; // Padding between textures to prevent bleeding
        
        // Statistics
        this.stats = {
            textureCount: 0,
            usedArea: 0,
            efficiency: 0
        };
    }
    
    addTexture(id, source, width, height) {
        // Check if texture already exists
        if (this.textures.has(id)) {
            return this.textures.get(id);
        }
        
        // Find a node that can fit this texture
        const node = this.findNode(width + this.padding * 2, height + this.padding * 2);
        if (!node) {
            console.warn(`No space for texture ${id} (${width}x${height})`);
            return null;
        }
        
        // Split the node
        const texture = this.splitNode(node, width + this.padding * 2, height + this.padding * 2);
        
        // Draw the texture with padding
        if (source instanceof HTMLCanvasElement || source instanceof HTMLImageElement) {
            this.ctx.drawImage(source, texture.x + this.padding, texture.y + this.padding);
        } else if (typeof source === 'function') {
            // Allow custom drawing function
            this.ctx.save();
            this.ctx.translate(texture.x + this.padding, texture.y + this.padding);
            source(this.ctx, width, height);
            this.ctx.restore();
        }
        
        // Store texture info
        const textureInfo = {
            id: id,
            x: texture.x + this.padding,
            y: texture.y + this.padding,
            width: width,
            height: height,
            u0: (texture.x + this.padding) / this.size,
            v0: (texture.y + this.padding) / this.size,
            u1: (texture.x + this.padding + width) / this.size,
            v1: (texture.y + this.padding + height) / this.size
        };
        
        this.textures.set(id, textureInfo);
        this.updateStats();
        
        return textureInfo;
    }
    
    findNode(width, height) {
        let bestNode = null;
        let bestFit = Infinity;
        
        for (const node of this.nodes) {
            if (node.width >= width && node.height >= height) {
                const fit = node.width * node.height - width * height;
                if (fit < bestFit) {
                    bestFit = fit;
                    bestNode = node;
                }
            }
        }
        
        return bestNode;
    }
    
    splitNode(node, width, height) {
        // Remove the node from the list
        const index = this.nodes.indexOf(node);
        this.nodes.splice(index, 1);
        
        // Create new nodes for remaining space
        if (node.width > width) {
            this.nodes.push({
                x: node.x + width,
                y: node.y,
                width: node.width - width,
                height: height
            });
        }
        
        if (node.height > height) {
            this.nodes.push({
                x: node.x,
                y: node.y + height,
                width: node.width,
                height: node.height - height
            });
        }
        
        return { x: node.x, y: node.y, width: width, height: height };
    }
    
    getTexture(id) {
        return this.textures.get(id);
    }
    
    updateStats() {
        this.stats.textureCount = this.textures.size;
        this.stats.usedArea = 0;
        
        for (const texture of this.textures.values()) {
            this.stats.usedArea += (texture.width + this.padding * 2) * 
                                   (texture.height + this.padding * 2);
        }
        
        this.stats.efficiency = this.stats.usedArea / (this.size * this.size);
    }
    
    getStats() {
        return this.stats;
    }
    
    getCanvas() {
        return this.canvas;
    }
    
    clear() {
        this.ctx.clearRect(0, 0, this.size, this.size);
        this.nodes = [{ x: 0, y: 0, width: this.size, height: this.size }];
        this.textures.clear();
        this.updateStats();
    }
}

// Sprite Sheet Manager for organizing game sprites
class SpriteSheetManager {
    constructor() {
        this.atlas = new TextureAtlas(2048);
        this.pendingLoads = new Map();
        this.loaded = false;
    }
    
    async loadSnakeSkins(skinData) {
        const promises = [];
        
        for (const [skinId, skinInfo] of Object.entries(skinData)) {
            if (skinInfo.imageUrl) {
                promises.push(this.loadImage(skinId, skinInfo.imageUrl));
            }
        }
        
        await Promise.all(promises);
    }
    
    async loadImage(id, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.atlas.addTexture(id, img, img.width, img.height);
                resolve();
            };
            img.onerror = reject;
            img.src = url;
        });
    }
    
    generateEmojiTextures(emojis, size = 40) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        tempCtx.font = `${size * 0.8}px Arial`;
        
        for (const emoji of emojis) {
            tempCtx.clearRect(0, 0, size, size);
            tempCtx.fillText(emoji, size / 2, size / 2);
            
            this.atlas.addTexture(`emoji_${emoji}`, tempCanvas, size, size);
        }
    }
    
    generateColorTextures(colors, size = 32) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        
        for (const color of colors) {
            tempCtx.fillStyle = color;
            tempCtx.fillRect(0, 0, size, size);
            
            this.atlas.addTexture(`color_${color}`, tempCanvas, size, size);
        }
    }
    
    generateGradientTextures() {
        // Generate common gradients used in the game
        const gradients = [
            { id: 'boost_gradient', type: 'radial', colors: ['rgba(255,255,0,0.8)', 'rgba(255,255,0,0)'] },
            { id: 'glow_gradient', type: 'radial', colors: ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)'] },
            { id: 'trail_gradient', type: 'linear', colors: ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)'] }
        ];
        
        const size = 64;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = size;
        tempCanvas.height = size;
        const tempCtx = tempCanvas.getContext('2d');
        
        for (const gradientInfo of gradients) {
            tempCtx.clearRect(0, 0, size, size);
            
            let gradient;
            if (gradientInfo.type === 'radial') {
                gradient = tempCtx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
            } else {
                gradient = tempCtx.createLinearGradient(0, 0, size, 0);
            }
            
            for (let i = 0; i < gradientInfo.colors.length; i++) {
                gradient.addColorStop(i / (gradientInfo.colors.length - 1), gradientInfo.colors[i]);
            }
            
            tempCtx.fillStyle = gradient;
            tempCtx.fillRect(0, 0, size, size);
            
            this.atlas.addTexture(gradientInfo.id, tempCanvas, size, size);
        }
    }
    
    getTexture(id) {
        return this.atlas.getTexture(id);
    }
    
    getAtlas() {
        return this.atlas;
    }
    
    getStats() {
        return this.atlas.getStats();
    }
}

// Export for use in main game
window.TextureAtlas = TextureAtlas;
window.SpriteSheetManager = SpriteSheetManager;