import { MagnetismMixin } from '../utilities/magnetism.js';

class AlchemyVision {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 20;
                this.pulse = 0;
                this.rotation = 0;
                
                this.magnetRange = 120;
                this.magnetStrength = 5.0;
            }
            
            update(deltaTime = 1) {
                this.pulse += 0.05 * deltaTime;
                this.rotation += 0.02 * deltaTime;
                
                MagnetismMixin.applyMagnetism.call(this, deltaTime, true);
            }
            
            draw() {
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                const margin = isMobile ? 30 : 50;
                if (screenX < -margin || screenX > canvas.width + margin ||
                    screenY < -margin || screenY > canvas.height + margin) return;
                
                const scale = 1 + Math.sin(this.pulse) * 0.1;
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.rotation);
                
                // Purple/gold glow effect
                const glowSize = this.size * 2 * scale;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)'); // Gold
                gradient.addColorStop(0.5, 'rgba(147, 0, 211, 0.4)'); // Purple
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                
                // Crystal ball emoji
                const crystalSize = Math.round(this.size * 2 * scale);
                const crystalCanvas = getCachedEmoji('🔮', crystalSize);
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.drawImage(crystalCanvas, -crystalCanvas.width / 2, -crystalCanvas.height / 2);
                ctx.restore();
                
                // Swirling particles
                for (let i = 0; i < 3; i++) {
                    const angle = (this.rotation * 2) + (i * Math.PI * 2 / 3);
                    const dist = this.size * scale;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.8)' : 'rgba(147, 0, 211, 0.8)';
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }

export default AlchemyVision;
