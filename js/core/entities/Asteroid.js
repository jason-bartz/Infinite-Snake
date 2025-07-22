class Asteroid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        // Random asteroid sprite (1-16)
        this.spriteIndex = Math.floor(Math.random() * 16) + 1;
        
        // Random size
        this.size = 30 + Math.random() * 50; // 30-80 pixels
        
        // Random velocity for slow floating
        this.vx = (Math.random() - 0.5) * 0.3; // -0.15 to 0.15
        this.vy = (Math.random() - 0.5) * 0.3;
        
        // Random rotation
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02; // Slow rotation
        
        // Preload image
        this.loadImage();
    }
    
    loadImage() {
        if (!window.asteroidImages) {
            window.asteroidImages = new Map();
        }
        
        const key = `asteroid-${this.spriteIndex}`;
        if (!window.asteroidImages.has(key)) {
            const img = new Image();
            img.src = `assets/asteroids/${key}.png`;
            window.asteroidImages.set(key, img);
        }
        
        this.image = window.asteroidImages.get(key);
    }
    
    update(deltaTime = 1) {
        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Wrap around the world if asteroid goes too far
        const worldBounds = window.WORLD_SIZE || 25000;
        if (this.x < -worldBounds) this.x = worldBounds;
        if (this.x > worldBounds) this.x = -worldBounds;
        if (this.y < -worldBounds) this.y = worldBounds;
        if (this.y > worldBounds) this.y = -worldBounds;
    }
    
    draw(ctx, screenX, screenY) {
        if (!this.image || !this.image.complete) return;
        
        ctx.save();
        
        // Translate to asteroid position
        ctx.translate(screenX, screenY);
        
        // Rotate
        ctx.rotate(this.rotation);
        
        // Draw the asteroid
        const halfSize = this.size / 2;
        ctx.drawImage(this.image, -halfSize, -halfSize, this.size, this.size);
        
        ctx.restore();
    }
}

export { Asteroid };