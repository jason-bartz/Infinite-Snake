class Spaceship {
    constructor(context, canvas, isSpecial = false, specialNum = null) {
        this.context = context;
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.vx = (Math.random() - 0.5) * 0.6; // Base velocity -0.3 to 0.3
        this.vy = (Math.random() - 0.5) * 0.6;
        this.driftAngle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.15 + Math.random() * 0.1; // 0.15-0.25, faster than stations
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02; // Faster rotation than stations
        this.image = new Image();
        this.loaded = false;
        this.width = 0;
        this.height = 0;
        this.active = true;
        this.isSpecial = isSpecial;
        this.facesLeft = isSpecial; // Special spaceships face left by default
        
        // Select spaceship
        if (isSpecial) {
            const num = specialNum || (Math.floor(Math.random() * 2) + 1);
            this.image.src = `assets/spaceships/spaceship-special-${num}.png`;
        } else {
            const spaceshipNum = Math.floor(Math.random() * 9) + 1; // 1-9
            this.image.src = `assets/spaceships/spaceship-${spaceshipNum}.png`;
        }
        
        this.image.onload = () => {
            this.loaded = true;
            
            // Scale special spaceships to 30px width
            if (this.isSpecial) {
                const aspectRatio = this.image.width / this.image.height;
                this.width = 30;
                this.height = 30 / aspectRatio;
            } else {
                this.width = this.image.width;
                this.height = this.image.height;
            }
            
            this.initialize();
        };
    }
    
    initialize() {
        // Random spawn position around screen edges
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        const margin = 50; // Start slightly off-screen
        
        switch(edge) {
            case 0: // Top edge
                this.x = Math.random() * this.canvas.width;
                this.y = -margin;
                this.vy = Math.abs(this.vy) * 0.5; // Bias downward
                break;
            case 1: // Right edge
                this.x = this.canvas.width + margin;
                this.y = Math.random() * this.canvas.height;
                this.vx = -Math.abs(this.vx) * 0.5; // Bias leftward
                break;
            case 2: // Bottom edge
                this.x = Math.random() * this.canvas.width;
                this.y = this.canvas.height + margin;
                this.vy = -Math.abs(this.vy) * 0.5; // Bias upward
                break;
            case 3: // Left edge
                this.x = -margin;
                this.y = Math.random() * this.canvas.height;
                this.vx = Math.abs(this.vx) * 0.5; // Bias rightward
                break;
        }
    }
    
    update() {
        if (!this.loaded || !this.active) return;
        
        // Update drift angle for oscillating motion
        this.driftAngle += 0.005;
        const driftX = Math.cos(this.driftAngle) * this.driftSpeed;
        const driftY = Math.sin(this.driftAngle * 0.7) * this.driftSpeed; // Different frequency for Y
        
        // Update position with base velocity + drift
        this.x += this.vx + driftX;
        this.y += this.vy + driftY;
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        
        // Check if spaceship has moved off screen (with margin)
        const margin = 100;
        if (this.x < -this.width - margin || 
            this.x > this.canvas.width + margin ||
            this.y < -this.height - margin || 
            this.y > this.canvas.height + margin) {
            this.active = false;
        }
    }
    
    render() {
        if (!this.loaded || !this.active) return;
        
        // Render with rotation in screen space
        this.context.save();
        this.context.globalAlpha = 0.95; // Slight transparency like stations
        
        // Translate to center position and rotate
        this.context.translate(this.x, this.y);
        this.context.rotate(this.rotation);
        
        // Draw centered at position
        if (this.facesLeft) {
            // Flip horizontally for left-facing spaceships
            this.context.scale(-1, 1);
        }
        
        this.context.drawImage(
            this.image, 
            -this.width / 2, 
            -this.height / 2,
            this.width,
            this.height
        );
        
        this.context.restore();
    }
}

export default Spaceship;