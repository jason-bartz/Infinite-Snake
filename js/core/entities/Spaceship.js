class Spaceship {
    constructor(context, canvas) {
        this.context = context;
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.speed = 1 + Math.random() * 2; // Random speed between 1-3
        this.image = new Image();
        this.loaded = false;
        this.width = 0;
        this.height = 0;
        this.direction = Math.random() > 0.5 ? 1 : -1; // 1 for left to right, -1 for right to left
        this.active = true;
        
        // Select random spaceship (1-8)
        const spaceshipNum = Math.floor(Math.random() * 8) + 1;
        this.image.src = `assets/spaceships/spaceship-${spaceshipNum}.png`;
        
        this.image.onload = () => {
            this.loaded = true;
            this.width = this.image.width;
            this.height = this.image.height;
            this.initialize();
        };
    }
    
    initialize() {
        // Random Y position (20% to 80% of screen height) - using screen coordinates
        this.y = this.canvas.height * (0.2 + Math.random() * 0.6);
        
        if (this.direction === 1) {
            // Moving left to right, start off-screen left
            this.x = -this.width;
        } else {
            // Moving right to left, start off-screen right
            this.x = this.canvas.width;
        }
    }
    
    update() {
        if (!this.loaded || !this.active) return;
        
        // Move spaceship
        this.x += this.speed * this.direction;
        
        // Check if spaceship has moved off screen
        if (this.direction === 1 && this.x > this.canvas.width) {
            this.active = false;
        } else if (this.direction === -1 && this.x + this.width < 0) {
            this.active = false;
        }
    }
    
    render() {
        if (!this.loaded || !this.active) return;
        
        // Render directly in screen space - no camera transformation needed
        this.context.save();
        
        if (this.direction === -1) {
            // Flip horizontally for right to left movement
            this.context.translate(this.x + this.width / 2, this.y);
            this.context.scale(-1, 1);
            this.context.drawImage(this.image, -this.width / 2, -this.height / 2);
        } else {
            // Normal rendering for left to right
            this.context.drawImage(this.image, this.x, this.y - this.height / 2);
        }
        
        this.context.restore();
    }
}

export default Spaceship;