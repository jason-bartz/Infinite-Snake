class Particle {
    constructor(x, y, vx, vy, color, size = 4, type = 'square') {
        this.reset(x, y, vx, vy, color, size, type);
    }
    
    reset(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = 1;
        this.active = true;
        this.type = type;
        
        this.gravity = options.gravity || 0;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.fadeRate = options.fadeRate || 0.02;
        this.growthRate = options.growthRate || 0;
        this.trail = options.trail || false;
        this.trailLength = options.trailLength || 5;
        this.trailHistory = [];
        this.pulse = options.pulse || false;
        this.pulseSpeed = options.pulseSpeed || 0.1;
        this.pulsePhase = 0;
    }
    
    update(deltaTime = 1) {
        if (!this.active) return false;
        
        if (this.trail && this.life > 0.1) {
            this.trailHistory.push({ x: this.x, y: this.y, life: this.life });
            if (this.trailHistory.length > this.trailLength) {
                this.trailHistory.shift();
            }
        }
        
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.vy += this.gravity * deltaTime;
        this.life -= this.fadeRate * deltaTime;
        
        this.vx *= Math.pow(0.98, deltaTime);
        this.vy *= Math.pow(0.98, deltaTime);
        
        this.rotation += this.rotationSpeed * deltaTime;
        this.size += this.growthRate * deltaTime;
        
        if (this.pulse) {
            this.pulsePhase += this.pulseSpeed * deltaTime;
        }
        
        if (this.life <= 0) {
            this.active = false;
            this.trailHistory = [];
            return false;
        }
        return true;
    }
    
    draw() {
        if (!this.active) return;
        
        const pixelSize = 4;
        const screen = worldToScreen(this.x, this.y);
        const screenX = screen.x;
        const screenY = screen.y;
        
        ctx.save();
        
        if (this.trail && this.trailHistory.length > 0) {
            this.drawTrail(pixelSize);
        }
        
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        
        const currentSize = this.pulse ? this.size * (1 + Math.sin(this.pulsePhase) * 0.2) : this.size;
        
        switch (this.type) {
            case 'circle':
                this.drawCircle(screenX, screenY, currentSize);
                break;
            case 'star':
                this.drawStar(screenX, screenY, currentSize);
                break;
            case 'trail':
                this.drawTrailType(screenX, screenY, currentSize, pixelSize);
                break;
            default:
                this.drawSquare(screenX, screenY, currentSize, pixelSize);
        }
        
        ctx.restore();
    }
    
    drawTrail(pixelSize) {
        this.trailHistory.forEach((point, index) => {
            const trailScreen = worldToScreen(point.x, point.y);
            const alpha = (index / this.trailHistory.length) * this.life * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.color;
            
            const trailSize = this.size * (index / this.trailHistory.length);
            ctx.fillRect(
                Math.floor(trailScreen.x / pixelSize) * pixelSize,
                Math.floor(trailScreen.y / pixelSize) * pixelSize,
                trailSize,
                trailSize
            );
        });
    }
    
    drawCircle(x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawStar(x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);
        
        const spikes = 5;
        const outerRadius = size / 2;
        const innerRadius = outerRadius * 0.5;
        
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const px = Math.cos(angle) * radius;
            const py = Math.sin(angle) * radius;
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
    
    drawTrailType(x, y, size, pixelSize) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }
    
    drawSquare(x, y, size, pixelSize) {
        ctx.fillRect(
            Math.floor(x / pixelSize) * pixelSize,
            Math.floor(y / pixelSize) * pixelSize,
            size,
            size
        );
    }
}

// Make available globally
window.Particle = Particle;

// Export for ES6 modules
export default Particle;