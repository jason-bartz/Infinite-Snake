class ExplosionAnimation {
    constructor(type, x, y, game, options = {}) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.game = game;
        this.currentFrame = 0;
        this.frameTime = 0;
        this.isComplete = false;
        this.scale = options.scale || 1;
        this.rotation = options.rotation || 0;
        this.alpha = options.alpha || 1;
        this.delay = options.delay || 0;
        this.delayTime = 0;
        this.hasStarted = false;
        
        // Frame configurations for each explosion type
        this.frameConfigs = {
            'toon-impact-large-violet': {
                frames: 7,
                frameDuration: 100, // 700ms total to match current timing
                path: 'assets/explosions/toon-impact-large-violet'
            },
            'quick-impact-large-blue': {
                frames: 5,
                frameDuration: 60, // 300ms total for quicker AI deaths
                path: 'assets/explosions/quick-impact-large-blue'
            },
            'dust-impact-large-red': {
                frames: 9,
                frameDuration: 80, // 720ms total for boss explosions
                path: 'assets/explosions/dust-impact-large-red'
            }
        };
        
        this.config = this.frameConfigs[type];
        if (!this.config) {
            console.error(`Unknown explosion type: ${type}`);
            this.isComplete = true;
            return;
        }
        
        // Preload all frames
        this.frames = [];
        this.loadFrames();
    }
    
    loadFrames() {
        for (let i = 0; i < this.config.frames; i++) {
            const img = new Image();
            img.src = `${this.config.path}/frame${String(i).padStart(4, '0')}.png`;
            this.frames.push(img);
        }
    }
    
    update(deltaTime) {
        if (this.isComplete) return;
        
        // Handle initial delay
        if (!this.hasStarted) {
            this.delayTime += deltaTime;
            if (this.delayTime >= this.delay) {
                this.hasStarted = true;
            } else {
                return;
            }
        }
        
        this.frameTime += deltaTime;
        
        if (this.frameTime >= this.config.frameDuration) {
            this.frameTime = 0;
            this.currentFrame++;
            
            if (this.currentFrame >= this.config.frames) {
                this.isComplete = true;
            }
        }
    }
    
    render(ctx) {
        if (this.isComplete || !this.hasStarted) return;
        
        const frame = this.frames[this.currentFrame];
        if (!frame || !frame.complete) return;
        
        // Check if explosion is in viewport
        if (window.isInViewport && !window.isInViewport(this.x, this.y, 200)) {
            return; // Skip rendering if outside viewport
        }
        
        // Convert world coordinates to screen coordinates
        let screenX = this.x;
        let screenY = this.y;
        
        // Check if worldToScreen function exists (it should be available globally)
        if (window.worldToScreen) {
            const screen = window.worldToScreen(this.x, this.y);
            screenX = screen.x;
            screenY = screen.y;
        }
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);
        
        // Apply camera zoom if available
        const zoom = window.cameraZoom || 1;
        ctx.scale(this.scale * zoom, this.scale * zoom);
        
        // Center the explosion
        const width = frame.width;
        const height = frame.height;
        ctx.drawImage(frame, -width / 2, -height / 2);
        
        ctx.restore();
    }
}

// Explosion Manager to handle multiple explosions
class ExplosionManager {
    constructor(game) {
        this.game = game;
        this.explosions = [];
    }
    
    createExplosion(type, x, y, options = {}) {
        const explosion = new ExplosionAnimation(type, x, y, this.game, options);
        this.explosions.push(explosion);
        return explosion;
    }
    
    createClusterExplosion(type, x, y, count = 4, spread = 50) {
        const explosions = [];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const offsetX = Math.cos(angle) * spread;
            const offsetY = Math.sin(angle) * spread;
            const delay = i * 50; // 50ms delay between each explosion
            
            const explosion = this.createExplosion(type, x + offsetX, y + offsetY, {
                scale: 0.8 + Math.random() * 0.4,
                rotation: Math.random() * Math.PI * 2,
                delay: delay
            });
            explosions.push(explosion);
        }
        return explosions;
    }
    
    update(deltaTime) {
        // Update all explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.update(deltaTime);
            
            // Remove completed explosions
            if (explosion.isComplete) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        // Render all explosions
        this.explosions.forEach(explosion => {
            explosion.render(ctx);
        });
    }
    
    clear() {
        this.explosions = [];
    }
}

export { ExplosionAnimation, ExplosionManager };