        class Element {
            constructor(id, x, y, isCatalystSpawned = false) {
                this.id = id;
                this.x = x;
                this.y = y;
                
                // Get element data from new system
                if (window.elementLoader && window.elementLoader.isLoaded && window.elementLoader.isLoaded()) {
                    const elem = window.elementLoader.elements.get(id);
                    if (elem) {
                        this.data = {
                            emoji: window.elementLoader.getEmojiForElement(id, elem.e),
                            name: elem.n,
                            tier: elem.t,
                            base: elem.t === 0
                        };
                    }
                }
                
                // Fallback if element not found
                if (!this.data) {
                    console.warn(`Element ID ${id} not found`);
                    this.data = { emoji: '❓', name: 'Unknown', tier: 0 };
                }
                this.pulse = 0;
                this.isCatalystSpawned = isCatalystSpawned;
                this.catalystSparkleTime = 0;
                this.pendingCombination = false;
                this.combiningAnimation = 0;
            }
            
            update(deltaTime = 1) {
                this.pulse += 0.05 * deltaTime;
                if (this.isCatalystSpawned) {
                    this.catalystSparkleTime += 0.1 * deltaTime;
                }
                
                // Magnetism effect - draw elements toward nearby snakes
                const magnetRange = 100; // Range at which magnetism starts
                const magnetStrength = 4.0; // Speed of attraction
                
                for (const snake of snakes) {
                    if (!snake.alive) continue;
                    
                    // Check distance to snake head
                    const dx = snake.x - this.x;
                    const dy = snake.y - this.y;
                    const distance = Math.hypot(dx, dy);
                    
                    // Apply magnetism if within range
                    if (distance < magnetRange && distance > ELEMENT_SIZE) {
                        // Calculate normalized direction vector
                        const dirX = dx / distance;
                        const dirY = dy / distance;
                        
                        // Stronger pull when closer
                        const pullStrength = (1 - distance / magnetRange) * magnetStrength * deltaTime;
                        
                        // Move element toward snake
                        this.x += dirX * pullStrength;
                        this.y += dirY * pullStrength;
                    }
                }
            }
            
            draw() {
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                let scale = 1 + Math.sin(this.pulse || 0) * 0.1;
                
                // Add wobble effect if this element is about to combine
                if (this.pendingCombination) {
                    this.combiningAnimation += 0.15;
                    const wobble = Math.sin(this.combiningAnimation * 3) * 0.1;
                    scale = scale * (1 + wobble);
                }
                
                // Check if this element is compatible with player's tail during AlchemyVision
                let alchemyGlow = null;
                if (alchemyVisionActive && playerSnake && playerSnake.alive && playerSnake.elements.length > 0) {
                    const tailElement = playerSnake.elements[playerSnake.elements.length - 1];
                    const distance = Math.hypot(this.x - playerSnake.x, this.y - playerSnake.y);
                    
                    // Only show glows within 300 pixel radius
                    if (distance <= 300) {
                        // Check if this element can combine with tail
                        const combo1 = `${this.id}+${tailElement}`;
                        const combo2 = `${tailElement}+${this.id}`;
                        
                        if (combinations[combo1] || combinations[combo2]) {
                            const result = combinations[combo1] || combinations[combo2];
                            // Check if this is a new discovery
                            if (!discoveredElements.has(result)) {
                                alchemyGlow = 'discovery'; // Golden glow
                            } else {
                                alchemyGlow = 'known'; // Green glow
                            }
                        }
                    }
                }
                
                // Skip all glow effects on mobile for better performance
                if (!isMobile) {
                    // Draw pixelated combination glow if this element will combine when eaten
                    if (this.pendingCombination) {
                        const pixelSize = 8;
                        const glowIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.3; // Pulsing glow
                        ctx.fillStyle = `rgba(255, 215, 0, ${glowIntensity})`;
                        
                        // Draw larger pixelated glow pattern
                        for (let px = -4; px <= 4; px++) {
                            for (let py = -4; py <= 4; py++) {
                                if (Math.abs(px) + Math.abs(py) <= 6) {
                                    ctx.fillRect(
                                        Math.floor((screenX + px * pixelSize) / pixelSize) * pixelSize,
                                        Math.floor((screenY + py * pixelSize) / pixelSize) * pixelSize,
                                        pixelSize,
                                        pixelSize
                                    );
                                }
                            }
                        }
                    }
                    
                    // Draw pixelated glow effects
                    else if (alchemyGlow === 'discovery') {
                        // Golden pixels for new discoveries
                        const pixelSize = 6;
                        ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
                        
                        for (let px = -4; px <= 4; px++) {
                            for (let py = -4; py <= 4; py++) {
                                if (Math.abs(px) + Math.abs(py) <= 6) {
                                    ctx.fillRect(
                                        Math.floor((screenX + px * pixelSize) / pixelSize) * pixelSize,
                                        Math.floor((screenY + py * pixelSize) / pixelSize) * pixelSize,
                                        pixelSize,
                                        pixelSize
                                    );
                                }
                            }
                        }
                    } else if (alchemyGlow === 'known') {
                        // Green pixels for known combinations
                        const pixelSize = 6;
                        ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                        
                        for (let px = -3; px <= 3; px++) {
                            for (let py = -3; py <= 3; py++) {
                                if (Math.abs(px) + Math.abs(py) <= 4) {
                                    ctx.fillRect(
                                        Math.floor((screenX + px * pixelSize) / pixelSize) * pixelSize,
                                        Math.floor((screenY + py * pixelSize) / pixelSize) * pixelSize,
                                        pixelSize,
                                        pixelSize
                                    );
                                }
                            }
                        }
                    } else if (this.data && this.data.tier > 0) {
                        // Pixelated tier-based glow
                        const pixelSize = 6;
                        const hue = (this.data.tier * 60) % 360;
                        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.4)`;
                        
                        for (let px = -2; px <= 2; px++) {
                            for (let py = -2; py <= 2; py++) {
                                if (Math.abs(px) + Math.abs(py) <= 3) {
                                    ctx.fillRect(
                                        Math.floor((screenX + px * pixelSize) / pixelSize) * pixelSize,
                                        Math.floor((screenY + py * pixelSize) / pixelSize) * pixelSize,
                                        pixelSize,
                                        pixelSize
                                    );
                                }
                            }
                        }
                    }
                }
                
                // Draw emoji using cache
                const emojiSize = Math.round(ELEMENT_SIZE * 2 * scale * cameraZoom);
                const emoji = this.data ? window.elementLoader.getEmojiForElement(this.id, this.data.base ? this.id : window.elementLoader.elements.get(this.id)?.e || this.id) : '❓';
                const emojiCanvas = getCachedEmoji(emoji, emojiSize);
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.drawImage(emojiCanvas, screenX - emojiCanvas.width / 2, screenY - emojiCanvas.height / 2);
                ctx.restore();
                
                // Draw element name below emoji
                const elementNameFontSize = isMobile ? 10 : 12;
                ctx.font = `${elementNameFontSize}px Arial`;
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                const name = this.data ? this.data.name : 'Unknown';
                ctx.strokeText(name, screenX, screenY + ELEMENT_SIZE * cameraZoom + 5);
                ctx.fillText(name, screenX, screenY + ELEMENT_SIZE * cameraZoom + 5);
                
                // Draw catalyst sparkles if this element was spawned by catalyst (desktop only)
                if (this.isCatalystSpawned && !isMobile) {
                    ctx.save();
                    for (let i = 0; i < 4; i++) {
                        const angle = (this.catalystSparkleTime + i * Math.PI / 2) % (Math.PI * 2);
                        const dist = (ELEMENT_SIZE * cameraZoom) + 10 + Math.sin(this.catalystSparkleTime * 2) * 5;
                        const px = screenX + Math.cos(angle) * dist;
                        const py = screenY + Math.sin(angle) * dist;
                        
                        ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
                        ctx.beginPath();
                        ctx.arc(px, py, 3, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Add a small star
                        const sparkleCanvas = getCachedEmoji('✨', 12);
                        ctx.save();
                        ctx.globalAlpha = 0.9;
                        ctx.drawImage(sparkleCanvas, px - sparkleCanvas.width / 2, py - sparkleCanvas.height / 2);
                        ctx.restore();
                    }
                    ctx.restore();
                }
            }
        }

export default Element;
