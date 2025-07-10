        class BorderParticle {
            constructor(x, y, edge) {
                this.x = x;
                this.y = y;
                this.edge = edge; // 'left', 'right', 'top', 'bottom'
                this.baseX = x;
                this.baseY = y;
                this.size = Math.random() * 3 + 1;
                this.speed = Math.random() * 0.5 + 0.1;
                this.offset = Math.random() * Math.PI * 2;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.color = this.getRandomColor();
            }
            
            getRandomColor() {
                const colors = [
                    'rgba(147, 51, 234, ', // purple
                    'rgba(236, 72, 153, ', // pink
                    'rgba(59, 130, 246, ', // blue
                    'rgba(168, 85, 247, ', // purple-pink
                    'rgba(99, 102, 241, '  // indigo
                ];
                return colors[Math.floor(Math.random() * colors.length)];
            }
            
            update(deltaTime) {
                const time = animationTime + this.offset;
                
                // Float in circular motion
                const radius = 15;
                const floatX = Math.cos(time * this.speed) * radius;
                const floatY = Math.sin(time * this.speed * 0.7) * radius;
                
                this.x = this.baseX + floatX;
                this.y = this.baseY + floatY;
                
                // Pulse opacity
                this.opacity = 0.3 + Math.sin(time * 2) * 0.2;
            }
            
            draw(ctx) {
                if (isMobile) {
                    // Simplified rendering for mobile - no shadows
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color + this.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else {
                    // Desktop keeps full effects
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color + this.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add glow effect
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = this.color + '0.8)';
                    ctx.fill();
                    ctx.restore();
                }
            }
        }

export default BorderParticle;
