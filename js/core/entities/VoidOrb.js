import { MagnetismMixin } from '../utilities/magnetism.js';

class VoidOrb {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 20;
                this.pulse = Math.random() * Math.PI * 2;
                this.rotation = 0;
                
                this.magnetRange = 120;
                this.magnetStrength = 5.0;
            }
            
            update(deltaTime = 1) {
                this.pulse += 0.05 * deltaTime;
                this.rotation += 0.03 * deltaTime;
                
                MagnetismMixin.applyMagnetism.call(this, 1, true);
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
                
                // Blue glow effect
                const glowSize = this.size * 2 * scale * cameraZoom;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(0, 150, 255, 0.6)'); // Bright blue
                gradient.addColorStop(0.5, 'rgba(0, 50, 200, 0.4)'); // Dark blue
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                
                // Void orb emoji
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.fillStyle = 'black';
                ctx.font = `${this.size * 2 * scale * cameraZoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌀', 0, 0);
                ctx.restore();
                
                // Swirling particles
                for (let i = 0; i < 4; i++) {
                    const angle = (this.rotation * 3) + (i * Math.PI / 2);
                    const dist = this.size * scale * 0.8 * cameraZoom;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(px, py, 2 * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }

export default VoidOrb;
