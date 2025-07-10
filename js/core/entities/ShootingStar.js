        class ShootingStar {
            constructor() {
                // Random starting position on screen edge
                const edge = Math.floor(Math.random() * 4);
                switch(edge) {
                    case 0: // Top
                        this.x = Math.random() * WORLD_SIZE;
                        this.y = 0;
                        break;
                    case 1: // Right
                        this.x = WORLD_SIZE;
                        this.y = Math.random() * WORLD_SIZE;
                        break;
                    case 2: // Bottom
                        this.x = Math.random() * WORLD_SIZE;
                        this.y = WORLD_SIZE;
                        break;
                    case 3: // Left
                        this.x = 0;
                        this.y = Math.random() * WORLD_SIZE;
                        break;
                }
                
                // Random angle and speed
                const angle = Math.random() * Math.PI * 2;
                const speed = 15 + Math.random() * 10; // Fast movement
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                
                this.trail = [];
                this.maxTrailLength = isMobile ? 5 : 20; // Shorter trails on mobile
                this.life = 1.0;
                this.fadeSpeed = 0.01; // Slower fade for 1-2 second visibility
                
                // Add color variety
                const colorSchemes = [
                    { star: '#FFFF00', trail: '#FFFFFF' }, // Classic yellow/white
                    { star: '#00FFFF', trail: '#E0FFFF' }, // Cyan/light blue
                    { star: '#FFE4B5', trail: '#FFF8DC' }, // Pale yellow/cream
                    { star: '#FF69B4', trail: '#FFB6C1' }, // Pink/light pink
                    { star: '#98FB98', trail: '#F0FFF0' }  // Pale green/honeydew
                ];
                const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
                this.starColor = scheme.star;
                this.trailColor = scheme.trail;
            }
            
            update(deltaTime = 1) {
                // Add current position to trail
                this.trail.push({ x: this.x, y: this.y, alpha: this.life });
                
                // Limit trail length
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
                
                // Update position
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                
                // Fade out
                this.life -= this.fadeSpeed * deltaTime;
                
                // Update trail alpha
                this.trail.forEach((point, index) => {
                    point.alpha = (index / this.trail.length) * this.life;
                });
                
                // Check if out of bounds or faded
                return this.life > 0 && this.x > -100 && this.x < WORLD_SIZE + 100 && 
                       this.y > -100 && this.y < WORLD_SIZE + 100;
            }
            
            draw() {
                // Draw pixelated trail
                const pixelSize = 2;
                ctx.save();
                
                this.trail.forEach((point, index) => {
                    const screenX = point.x - camera.x + canvas.width / 2;
                    const screenY = point.y - camera.y + canvas.height / 2;
                    
                    ctx.globalAlpha = point.alpha * 0.5;
                    ctx.fillStyle = this.trailColor;
                    const size = Math.max(pixelSize, Math.floor((index / this.trail.length) * 3) * pixelSize);
                    
                    ctx.fillRect(
                        Math.floor(screenX / pixelSize) * pixelSize,
                        Math.floor(screenY / pixelSize) * pixelSize,
                        size,
                        size
                    );
                });
                
                // Draw main star as pixel
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.starColor;
                ctx.fillRect(
                    Math.floor(screenX / pixelSize) * pixelSize,
                    Math.floor(screenY / pixelSize) * pixelSize,
                    pixelSize * 3,
                    pixelSize * 3
                );
                
                ctx.restore();
            }
        }

export default ShootingStar;
