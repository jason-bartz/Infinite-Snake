class Asteroid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        
        // Asteroid sprite selection (1-16)
        this.spriteIndex = Math.floor(Math.random() * 16) + 1;
        
        // Size initialization (30-80px)
        this.size = 30 + Math.random() * 50;
        
        // Floating velocity initialization
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        
        // Rotation initialization
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        
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
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        
        this.rotation += this.rotationSpeed * deltaTime;
        
        // World boundary wrapping
        const worldBounds = window.WORLD_SIZE || 25000;
        if (this.x < -worldBounds) this.x = worldBounds;
        if (this.x > worldBounds) this.x = -worldBounds;
        if (this.y < -worldBounds) this.y = worldBounds;
        if (this.y > worldBounds) this.y = -worldBounds;
    }
    
    draw(ctx, screenX, screenY) {
        if (!this.image || !this.image.complete) return;
        
        ctx.save();
        
        ctx.translate(screenX, screenY);
        
        ctx.rotate(this.rotation);
        
        const halfSize = this.size / 2;
        ctx.drawImage(this.image, -halfSize, -halfSize, this.size, this.size);
        
        ctx.restore();
    }
}

export { Asteroid };