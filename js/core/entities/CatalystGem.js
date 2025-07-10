import { MagnetismMixin, MAGNETISM_PRESETS } from '../utilities/magnetism.js';

class CatalystGem {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 20;
                this.pulse = Math.random() * Math.PI * 2;
                this.rotation = 0;
                this.sparkleTime = 0;
                
                this.magnetRange = 120;
                this.magnetStrength = 5.0;
            }
            
            update(deltaTime = 1) {
                this.pulse += 0.04 * deltaTime;
                this.rotation += 0.02 * deltaTime;
                this.sparkleTime += 0.1 * deltaTime;
                
                MagnetismMixin.applyMagnetism.call(this, 1, true);
            }
            
            draw() {
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                const margin = isMobile ? 30 : 50;
                if (screenX < -margin || screenX > canvas.width + margin ||
                    screenY < -margin || screenY > canvas.height + margin) return;
                
                const scale = 1 + Math.sin(this.pulse) * 0.15;
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.rotation);
                
                // Orange glow effect
                const glowSize = this.size * 2.5 * scale * cameraZoom;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)'); // Bright orange
                gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)'); // Dark orange
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                
                // Catalyst gem emoji
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.fillStyle = 'black';
                ctx.font = `${this.size * 2 * scale * cameraZoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💎', 0, 0);
                ctx.restore();
                
                // Sparkle particles
                for (let i = 0; i < 6; i++) {
                    const angle = (this.sparkleTime + i * Math.PI / 3) % (Math.PI * 2);
                    const dist = this.size * scale * (0.8 + Math.sin(this.sparkleTime * 2 + i) * 0.3) * cameraZoom;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
                    ctx.beginPath();
                    ctx.arc(px, py, (2 + Math.sin(this.sparkleTime * 3 + i) * 1) * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }

export default CatalystGem;
