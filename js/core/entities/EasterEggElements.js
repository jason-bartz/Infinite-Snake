/**
 * Easter Egg Elements - Rare animated background decorations
 * Non-interactive visual elements that appear randomly
 */

class EasterEggElements {
    constructor() {
        this.elements = [];
        this.maxElements = 1; // Maximum active elements (reduced by half)
        this.lastSpawnTime = 0;
        this.spawnCooldown = 90000; // Base cooldown: 90 seconds (increased by 100%)
        this.spawnCooldownVariance = 90000; // Additional 0-90 seconds (increased by 100%)
        this.skipSpawnChance = 0.2; // 20% chance to skip spawn
        
        // Element types with sprite data
        this.elementTypes = {
            blackHole: {
                name: 'Black Hole',
                size: 16,
                scale: 8,
                frameDelay: 150,
                duration: 30000, // 30 seconds visible
                frames: [
                    // Frame 1
                    [
                        '                ',
                        '     ppPPpp     ',
                        '   pPPXXXXPPp   ',
                        '  pPXX    XXPp  ',
                        ' pPX        XPp ',
                        ' pPX   KK   XPp ',
                        'pPX   KKKK   XPp',
                        'pPX  KKKKKK  XPp',
                        'pPX  KKKKKK  XPp',
                        'pPX   KKKK   XPp',
                        ' pPX   KK   XPp ',
                        ' pPX        XPp ',
                        '  pPXX    XXPp  ',
                        '   pPPXXXXPPp   ',
                        '     ppPPpp     ',
                        '                '
                    ],
                    // Frame 2
                    [
                        '                ',
                        '     PppppP     ',
                        '   PPpXXXXpPP   ',
                        '  PPpX    XpPP  ',
                        ' PPp        pPP ',
                        ' PPp   KK   pPP ',
                        'PPp   KKKK   pPP',
                        'PPp  KKKKKK  pPP',
                        'PPp  KKKKKK  pPP',
                        'PPp   KKKK   pPP',
                        ' PPp   KK   pPP ',
                        ' PPp        pPP ',
                        '  PPpX    XpPP  ',
                        '   PPpXXXXpPP   ',
                        '     PppppP     ',
                        '                '
                    ],
                    // Frame 3
                    [
                        '                ',
                        '     PPpppP     ',
                        '   PPPpXXpPPP   ',
                        '  PPPpX  XpPPP  ',
                        ' PPPp      pPPP ',
                        ' PPPp  KK  pPPP ',
                        'PPPp  KKKK  pPPP',
                        'PPPp KKKKKK pPPP',
                        'PPPp KKKKKK pPPP',
                        'PPPp  KKKK  pPPP',
                        ' PPPp  KK  pPPP ',
                        ' PPPp      pPPP ',
                        '  PPPpX  XpPPP  ',
                        '   PPPpXXpPPP   ',
                        '     PPpppP     ',
                        '                '
                    ],
                    // Frame 4
                    [
                        '                ',
                        '     pPPPPp     ',
                        '   ppPPXXPPpp   ',
                        '  ppPPX  XPPpp  ',
                        ' ppPP      PPpp ',
                        ' ppPP  KK  PPpp ',
                        'ppPP  KKKK  PPpp',
                        'ppPP KKKKKK PPpp',
                        'ppPP KKKKKK PPpp',
                        'ppPP  KKKK  PPpp',
                        ' ppPP  KK  PPpp ',
                        ' ppPP      PPpp ',
                        '  ppPPX  XPPpp  ',
                        '   ppPPXXPPpp   ',
                        '     pPPPPp     ',
                        '                '
                    ]
                ],
                colors: {
                    'p': '#5a189a', // purple
                    'P': '#9d4edd', // lightPurple
                    'X': '#2a0845', // darkPurple
                    'K': '#000000'  // black
                }
            },
            ufo: {
                name: 'Flying Saucer',
                size: 16,
                scale: 4, // Reduced from 8 to 4 (50% size)
                frameDelay: 200,
                duration: 12500, // Reduced from 25000 to 12500 (50% time)
                frames: [
                    // Frame 1 - lights on
                    [
                        '                ',
                        '                ',
                        '      CCCC      ',
                        '     CCCCCC     ',
                        '    gCCCCCCg    ',
                        '   gggggggggg   ',
                        '  yGGGGGGGGGGy  ',
                        ' GGGGGGGGGGGGGG ',
                        '  yGGGGGGGGGGy  ',
                        '   gggggggggg   ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                '
                    ],
                    // Frame 2 - lights dim
                    [
                        '                ',
                        '                ',
                        '      CCCC      ',
                        '     CCCCCC     ',
                        '    gCCCCCCg    ',
                        '   gggggggggg   ',
                        '  oGGGGGGGGGGo  ',
                        ' GGGGGGGGGGGGGG ',
                        '  oGGGGGGGGGGo  ',
                        '   gggggggggg   ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                '
                    ],
                    // Frame 3 - hover up
                    [
                        '                ',
                        '      CCCC      ',
                        '     CCCCCC     ',
                        '    gCCCCCCg    ',
                        '   gggggggggg   ',
                        '  yGGGGGGGGGGy  ',
                        ' GGGGGGGGGGGGGG ',
                        '  yGGGGGGGGGGy  ',
                        '   gggggggggg   ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                '
                    ],
                    // Frame 4 - hover down
                    [
                        '                ',
                        '                ',
                        '                ',
                        '      CCCC      ',
                        '     CCCCCC     ',
                        '    gCCCCCCg    ',
                        '   gggggggggg   ',
                        '  oGGGGGGGGGGo  ',
                        ' GGGGGGGGGGGGGG ',
                        '  oGGGGGGGGGGo  ',
                        '   gggggggggg   ',
                        '                ',
                        '                ',
                        '                ',
                        '                ',
                        '                '
                    ]
                ],
                colors: {
                    'C': '#00f5ff', // cyan
                    'g': '#808080', // gray
                    'G': '#404040', // darkGray
                    'y': '#ffff00', // yellow
                    'o': '#ff8800'  // orange
                }
            }
        };
        
        // Pre-render all sprites
        this.prerenderedSprites = {};
        this.prerenderSprites();
    }
    
    prerenderSprites() {
        Object.entries(this.elementTypes).forEach(([key, element]) => {
            this.prerenderedSprites[key] = [];
            
            element.frames.forEach(frame => {
                const canvas = document.createElement('canvas');
                canvas.width = element.size * element.scale;
                canvas.height = element.size * element.scale;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = false;
                
                // Draw pixel art frame
                for (let y = 0; y < element.size; y++) {
                    for (let x = 0; x < element.size; x++) {
                        const char = frame[y][x];
                        if (char !== ' ' && element.colors[char]) {
                            ctx.fillStyle = element.colors[char];
                            ctx.fillRect(
                                x * element.scale,
                                y * element.scale,
                                element.scale,
                                element.scale
                            );
                        }
                    }
                }
                
                this.prerenderedSprites[key].push(canvas);
            });
        });
    }
    
    update(deltaTime, gameState) {
        const now = Date.now();
        
        // Check for spawning new elements
        if (this.elements.length < this.maxElements && 
            now - this.lastSpawnTime > this.spawnCooldown) {
            
            // Random chance to skip spawn
            if (Math.random() > this.skipSpawnChance) {
                console.log('[EasterEgg] Attempting to spawn element...');
                this.spawnElement(gameState);
            } else {
                console.log('[EasterEgg] Skipped spawn due to random chance');
            }
            
            // Reset spawn timer with variance
            this.lastSpawnTime = now;
            this.spawnCooldown = 90000 + Math.random() * this.spawnCooldownVariance;
            console.log(`[EasterEgg] Next spawn in ${this.spawnCooldown/1000} seconds`);
        }
        
        // Update existing elements
        this.elements = this.elements.filter(element => {
            element.lifetime += deltaTime;
            
            // Fade in/out logic
            const fadeTime = 1000; // 1 second fade
            if (element.lifetime < fadeTime) {
                element.opacity = element.lifetime / fadeTime;
            } else if (element.lifetime > element.duration - fadeTime) {
                element.opacity = (element.duration - element.lifetime) / fadeTime;
            } else {
                element.opacity = 1;
            }
            
            // Update animation frame
            element.frameTime += deltaTime;
            if (element.frameTime > element.frameDelay) {
                element.currentFrame = (element.currentFrame + 1) % element.frames.length;
                element.frameTime = 0;
            }
            
            // Slow drift movement
            element.x += element.vx * deltaTime / 1000;
            element.y += element.vy * deltaTime / 1000;
            
            // Remove if lifetime exceeded
            return element.lifetime < element.duration;
        });
    }
    
    spawnElement(gameState) {
        // Don't spawn during boss fights or near borders
        if (gameState.bossActive) {
            console.log('[EasterEgg] Spawn blocked: boss active');
            return;
        }
        if (!gameState.playerSnake) {
            console.log('[EasterEgg] Spawn blocked: no player snake');
            return;
        }
        
        const types = Object.keys(this.elementTypes);
        const type = types[Math.floor(Math.random() * types.length)];
        const elementData = this.elementTypes[type];
        
        // Find spawn position far from player
        let x, y;
        const minDistance = 800;
        const maxAttempts = 10;
        let attempts = 0;
        
        do {
            x = Math.random() * gameState.worldWidth;
            y = Math.random() * gameState.worldHeight;
            
            // Check distance from player
            const dx = x - gameState.playerSnake.x;
            const dy = y - gameState.playerSnake.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > minDistance && 
                x > 500 && x < gameState.worldWidth - 500 &&
                y > 500 && y < gameState.worldHeight - 500) {
                break;
            }
            
            attempts++;
        } while (attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            console.log('[EasterEgg] Failed to find valid spawn position');
            return;
        }
        
        // Create element
        console.log(`[EasterEgg] Spawning ${type} at (${x.toFixed(0)}, ${y.toFixed(0)})`);
        this.elements.push({
            type: type,
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 10, // Slow drift velocity
            vy: (Math.random() - 0.5) * 10,
            opacity: 0,
            lifetime: 0,
            duration: elementData.duration + Math.random() * 10000, // Add variance
            currentFrame: 0,
            frameTime: 0,
            frameDelay: elementData.frameDelay,
            frames: this.prerenderedSprites[type],
            size: elementData.size * elementData.scale
        });
    }
    
    render(ctx, camera) {
        if (this.elements.length === 0) return;
        
        ctx.save();
        
        this.elements.forEach(element => {
            // Apply parallax effect (slower movement than main game)
            const parallaxFactor = 0.7;
            const screenX = (element.x - camera.x) * parallaxFactor + ctx.canvas.width / 2;
            const screenY = (element.y - camera.y) * parallaxFactor + ctx.canvas.height / 2;
            
            // Skip if off-screen
            if (screenX < -element.size || screenX > ctx.canvas.width + element.size ||
                screenY < -element.size || screenY > ctx.canvas.height + element.size) {
                return;
            }
            
            // Render with opacity
            ctx.globalAlpha = element.opacity * 0.8; // Max 80% opacity for subtlety
            ctx.drawImage(
                element.frames[element.currentFrame],
                screenX - element.size / 2,
                screenY - element.size / 2
            );
        });
        
        ctx.restore();
    }
    
    // Get active element count for performance monitoring
    getActiveCount() {
        return this.elements.length;
    }
    
    // Clear all elements (for cleanup)
    clear() {
        this.elements = [];
    }
    
    // Adjust quality based on performance
    setQualityLevel(level) {
        switch(level) {
            case 'high':
                this.maxElements = 1;
                this.skipSpawnChance = 0.2;
                break;
            case 'medium':
                this.maxElements = 1;
                this.skipSpawnChance = 0.3;
                break;
            case 'low':
                this.maxElements = 0; // Disabled
                this.clear();
                break;
        }
    }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EasterEggElements;
}

// ES6 export
export default EasterEggElements;

// Make available globally
window.EasterEggElements = EasterEggElements;