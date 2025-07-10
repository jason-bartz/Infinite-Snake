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
                this.type = type; // 'square', 'circle', 'star', 'trail'
                
                // Additional options
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
                
                // Store trail history
                if (this.trail && this.life > 0.1) {
                    this.trailHistory.push({ x: this.x, y: this.y, life: this.life });
                    if (this.trailHistory.length > this.trailLength) {
                        this.trailHistory.shift();
                    }
                }
                
                // Update position
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                
                // Apply gravity
                this.vy += this.gravity * deltaTime;
                
                // Update life
                this.life -= this.fadeRate * deltaTime;
                
                // Apply friction
                this.vx *= Math.pow(0.98, deltaTime);
                this.vy *= Math.pow(0.98, deltaTime);
                
                // Update rotation
                this.rotation += this.rotationSpeed * deltaTime;
                
                // Update size
                this.size += this.growthRate * deltaTime;
                
                // Update pulse
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
                
                // Draw trail if enabled
                if (this.trail && this.trailHistory.length > 0) {
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
                
                // Set main particle properties
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life;
                
                // Apply pulse effect
                let actualSize = this.size;
                if (this.pulse) {
                    actualSize = this.size * (1 + Math.sin(this.pulsePhase) * 0.3);
                }
                
                // Draw based on type
                switch(this.type) {
                    case 'circle':
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, actualSize / 2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                        
                    case 'star':
                        ctx.save();
                        ctx.translate(screenX, screenY);
                        ctx.rotate(this.rotation);
                        
                        const spikes = 5;
                        const outerRadius = actualSize / 2;
                        const innerRadius = outerRadius * 0.5;
                        
                        ctx.beginPath();
                        for (let i = 0; i < spikes * 2; i++) {
                            const radius = i % 2 === 0 ? outerRadius : innerRadius;
                            const angle = (i * Math.PI) / spikes;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            
                            if (i === 0) {
                                ctx.moveTo(x, y);
                            } else {
                                ctx.lineTo(x, y);
                            }
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                        break;
                        
                    case 'square':
                    default:
                        // Pixelated square (original behavior)
                        ctx.fillRect(
                            Math.floor(screenX / pixelSize) * pixelSize,
                            Math.floor(screenY / pixelSize) * pixelSize,
                            actualSize,
                            actualSize
                        );
                        break;
                }
                
                ctx.restore();
            }
        }

export default Particle;
