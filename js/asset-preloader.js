/**
 * AssetPreloader - Pre-computes and caches game assets for improved mobile performance
 */
class AssetPreloader {
    constructor() {
        this.assets = {
            backgrounds: {},
            emojis: {},
            borders: {},
            snakeAssets: {},
            starField: null,
            planets: {
                standard: {},
                special: {}
            }
        };
        
        this.loadingPhases = [
            { phase: "Initializing Cosmos", weight: 10, method: 'initializeSystem' },
            { phase: "Loading Elements", weight: 25, method: 'preloadEmojis' },
            { phase: "Loading Planets", weight: 15, method: 'preloadPlanets' },
            { phase: "Crafting Combinations", weight: 20, method: 'precomputeBackgrounds' },
            { phase: "Preparing Skins", weight: 20, method: 'preRenderSnakeAssets' },
            { phase: "Awakening Snakes", weight: 10, method: 'cacheBorderStates' }
        ];
        
        this.totalProgress = 0;
        this.currentPhase = 0;
        this.onProgress = null;
        
        // Canvas sizes for pre-rendering
        this.canvasSizes = {
            mobile: { width: 800, height: 600 },
            desktop: { width: 1920, height: 1080 }
        };
        
        // Common emoji sizes
        this.emojiSizes = [16, 20, 24, 32];
        
        // Loading tips
        this.loadingTips = [
            { text: "Tip: Combine Fire 🔥 + Water 💧 to create Steam!", elements: ["🔥", "💧"] },
            { text: "Tip: Earth 🌍 + Water 💧 makes Mud!", elements: ["🌍", "💧"] },
            { text: "Tip: Legendary skins unlock at milestone discoveries!", icon: "🏆" },
            { text: "Tip: Use boost wisely - it drains your energy!", icon: "⚡" },
            { text: "Tip: Boss snakes drop rare elements when defeated!", icon: "👹" },
            { text: "Tip: Some combinations only work with rare elements!", icon: "💎" },
            { text: "Tip: The more you discover, the faster rare elements spawn!", icon: "✨" }
        ];
        
        this.currentTipIndex = 0;
    }
    
    /**
     * Start the preloading process
     */
    async preload(onProgress) {
        this.onProgress = onProgress;
        const startTime = Date.now();
        
        try {
            for (let i = 0; i < this.loadingPhases.length; i++) {
                this.currentPhase = i;
                const phase = this.loadingPhases[i];
                
                // Update phase text
                this.updateProgress(0, phase.phase);
                
                // Execute phase method
                await this[phase.method]();
                
                // Update total progress
                const phaseProgress = this.loadingPhases.slice(0, i + 1)
                    .reduce((sum, p) => sum + p.weight, 0);
                this.totalProgress = phaseProgress;
            }
            
            // Final progress update
            this.updateProgress(100, "Ready!");
            
            const loadTime = Date.now() - startTime;
            console.log(`Asset preloading completed in ${loadTime}ms`);
            
            return this.assets;
            
        } catch (error) {
            console.error('Asset preloading failed:', error);
            throw error;
        }
    }
    
    /**
     * Update loading progress
     */
    updateProgress(phasePercent, phaseText) {
        const baseProgress = this.loadingPhases.slice(0, this.currentPhase)
            .reduce((sum, p) => sum + p.weight, 0);
        const currentPhaseWeight = this.loadingPhases[this.currentPhase]?.weight || 0;
        const totalPercent = baseProgress + (phasePercent * currentPhaseWeight / 100);
        
        if (this.onProgress) {
            this.onProgress({
                percent: Math.min(totalPercent, 100),
                phase: phaseText,
                tip: this.getCurrentTip()
            });
        }
    }
    
    /**
     * Get current loading tip
     */
    getCurrentTip() {
        const tip = this.loadingTips[this.currentTipIndex];
        this.currentTipIndex = (this.currentTipIndex + 1) % this.loadingTips.length;
        return tip;
    }
    
    /**
     * Initialize system resources
     */
    async initializeSystem() {
        // Create offscreen canvases
        this.offscreenCanvases = {
            background: document.createElement('canvas'),
            borders: document.createElement('canvas'),
            emoji: document.createElement('canvas'),
            snake: document.createElement('canvas')
        };
        
        // Set sizes
        const isMobile = window.isTabletOrMobile && window.isTabletOrMobile();
        const size = isMobile ? this.canvasSizes.mobile : this.canvasSizes.desktop;
        
        Object.values(this.offscreenCanvases).forEach(canvas => {
            canvas.width = size.width;
            canvas.height = size.height;
        });
        
        this.updateProgress(100, "System initialized");
        await this.delay(100);
    }
    
    /**
     * Preload and render all game emojis
     */
    async preloadEmojis() {
        const emojisToLoad = [
            // Base elements
            '🔥', '💧', '🌍', '💨',
            // Common combinations
            '☁️', '⚡', '🌊', '🌋', '🏔️', '🌳',
            // UI elements
            '⭐', '💀', '🏆', '👑', '💎', '✨'
        ];
        
        // Load from elements data if available
        if (window.elements && window.elements.emojis) {
            const gameEmojis = Object.values(window.elements.emojis).slice(0, 50);
            emojisToLoad.push(...gameEmojis);
        }
        
        const totalEmojis = emojisToLoad.length * this.emojiSizes.length;
        let loaded = 0;
        
        for (const emoji of emojisToLoad) {
            this.assets.emojis[emoji] = {};
            
            for (const size of this.emojiSizes) {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                // Configure for crisp rendering
                ctx.imageSmoothingEnabled = false;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `${size * 0.8}px Arial`;
                
                // Render emoji
                ctx.fillText(emoji, size / 2, size / 2);
                
                // Store as image data
                this.assets.emojis[emoji][size] = {
                    imageData: ctx.getImageData(0, 0, size, size),
                    canvas: canvas
                };
                
                loaded++;
                this.updateProgress((loaded / totalEmojis) * 100, `Loading emoji ${emoji}`);
                
                // Small delay to prevent blocking
                if (loaded % 10 === 0) {
                    await this.delay(10);
                }
            }
        }
    }
    
    /**
     * Preload planet images
     */
    async preloadPlanets() {
        const standardPlanets = 17;
        const specialPlanets = 5;
        const totalPlanets = standardPlanets + specialPlanets;
        let loaded = 0;
        
        // Load standard planets
        for (let i = 1; i <= standardPlanets; i++) {
            const planetId = `planet-${i}`;
            this.updateProgress((loaded / totalPlanets) * 100, `Loading ${planetId}`);
            
            try {
                const img = await this.loadImage(`assets/planets/${planetId}.png`);
                this.assets.planets.standard[planetId] = img;
                loaded++;
            } catch (error) {
                console.warn(`Failed to load ${planetId}:`, error);
            }
            
            // Small delay to prevent blocking
            if (loaded % 5 === 0) {
                await this.delay(10);
            }
        }
        
        // Load special planets
        for (let i = 1; i <= specialPlanets; i++) {
            const planetId = `special-planet-${i}`;
            this.updateProgress((loaded / totalPlanets) * 100, `Loading ${planetId}`);
            
            try {
                const img = await this.loadImage(`assets/planets/${planetId}.png`);
                this.assets.planets.special[planetId] = img;
                loaded++;
            } catch (error) {
                console.warn(`Failed to load ${planetId}:`, error);
            }
        }
        
        this.updateProgress(100, "Planets loaded");
    }
    
    /**
     * Load a single image
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }
    
    /**
     * Pre-compute background layers
     */
    async precomputeBackgrounds() {
        const canvas = this.offscreenCanvases.background;
        const ctx = canvas.getContext('2d');
        
        // Create star field
        this.updateProgress(20, "Generating star field");
        this.assets.backgrounds.starField = await this.generateStarField(canvas, ctx);
        
        // Create grid pattern
        this.updateProgress(40, "Creating grid pattern");
        this.assets.backgrounds.grid = await this.generateGridPattern(canvas, ctx);
        
        // Create border gradients
        this.updateProgress(60, "Rendering borders");
        this.assets.backgrounds.borders = await this.generateBorderGradients(canvas, ctx);
        
        // Create space background
        this.updateProgress(80, "Painting cosmos");
        this.assets.backgrounds.space = await this.generateSpaceBackground(canvas, ctx);
        
        this.updateProgress(100, "Backgrounds ready");
    }
    
    /**
     * Generate star field
     */
    async generateStarField(canvas, ctx) {
        const starCanvas = document.createElement('canvas');
        starCanvas.width = canvas.width;
        starCanvas.height = canvas.height;
        const starCtx = starCanvas.getContext('2d');
        
        // Clear canvas
        starCtx.fillStyle = 'transparent';
        starCtx.fillRect(0, 0, starCanvas.width, starCanvas.height);
        
        // Generate stars
        const starCount = window.isTabletOrMobile() ? 50 : 100;
        const stars = [];
        
        for (let i = 0; i < starCount; i++) {
            const star = {
                x: Math.random() * starCanvas.width,
                y: Math.random() * starCanvas.height,
                size: Math.random() * 2 + 0.5,
                brightness: Math.random() * 0.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            };
            stars.push(star);
            
            // Draw star
            starCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            starCtx.fillRect(star.x, star.y, star.size, star.size);
        }
        
        return {
            canvas: starCanvas,
            imageData: starCtx.getImageData(0, 0, starCanvas.width, starCanvas.height),
            stars: stars
        };
    }
    
    /**
     * Generate grid pattern
     */
    async generateGridPattern(canvas, ctx) {
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = 200;
        gridCanvas.height = 200;
        const gridCtx = gridCanvas.getContext('2d');
        
        gridCtx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        gridCtx.lineWidth = 1;
        
        // Draw grid
        const gridSize = 20;
        for (let x = 0; x < gridCanvas.width; x += gridSize) {
            gridCtx.beginPath();
            gridCtx.moveTo(x, 0);
            gridCtx.lineTo(x, gridCanvas.height);
            gridCtx.stroke();
        }
        
        for (let y = 0; y < gridCanvas.height; y += gridSize) {
            gridCtx.beginPath();
            gridCtx.moveTo(0, y);
            gridCtx.lineTo(gridCanvas.width, y);
            gridCtx.stroke();
        }
        
        return {
            canvas: gridCanvas,
            pattern: ctx.createPattern(gridCanvas, 'repeat')
        };
    }
    
    /**
     * Generate border gradients
     */
    async generateBorderGradients(canvas, ctx) {
        const borders = {};
        const borderWidth = 15;
        const colors = ['#ff00ff', '#00ffff', '#ffff00', '#ff0000'];
        
        // Top border
        const topGradient = ctx.createLinearGradient(0, 0, 0, borderWidth);
        topGradient.addColorStop(0, 'rgba(255, 0, 255, 0.3)');
        topGradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        borders.top = topGradient;
        
        // Bottom border
        const bottomGradient = ctx.createLinearGradient(0, canvas.height - borderWidth, 0, canvas.height);
        bottomGradient.addColorStop(0, 'rgba(0, 255, 255, 0)');
        bottomGradient.addColorStop(1, 'rgba(0, 255, 255, 0.3)');
        borders.bottom = bottomGradient;
        
        // Left border
        const leftGradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
        leftGradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
        leftGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        borders.left = leftGradient;
        
        // Right border
        const rightGradient = ctx.createLinearGradient(canvas.width - borderWidth, 0, canvas.width, 0);
        rightGradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
        rightGradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
        borders.right = rightGradient;
        
        return borders;
    }
    
    /**
     * Generate space background
     */
    async generateSpaceBackground(canvas, ctx) {
        const spaceCanvas = document.createElement('canvas');
        spaceCanvas.width = canvas.width;
        spaceCanvas.height = canvas.height;
        const spaceCtx = spaceCanvas.getContext('2d');
        
        // Create gradient
        const gradient = spaceCtx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
        );
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(0.5, '#000022');
        gradient.addColorStop(1, '#000011');
        
        spaceCtx.fillStyle = gradient;
        spaceCtx.fillRect(0, 0, spaceCanvas.width, spaceCanvas.height);
        
        return {
            canvas: spaceCanvas,
            imageData: spaceCtx.getImageData(0, 0, spaceCanvas.width, spaceCanvas.height)
        };
    }
    
    /**
     * Pre-render snake assets
     */
    async preRenderSnakeAssets() {
        // Snake head rotations
        this.updateProgress(25, "Rendering snake heads");
        this.assets.snakeAssets.heads = await this.generateSnakeHeads();
        
        // Snake segments
        this.updateProgress(50, "Creating snake segments");
        this.assets.snakeAssets.segments = await this.generateSnakeSegments();
        
        // Boost effects
        this.updateProgress(75, "Preparing boost effects");
        this.assets.snakeAssets.boostEffects = await this.generateBoostEffects();
        
        this.updateProgress(100, "Snake assets ready");
    }
    
    /**
     * Generate snake head rotations
     */
    async generateSnakeHeads() {
        const heads = {};
        const rotations = 16; // 16 directions
        const headSize = 24;
        
        for (let i = 0; i < rotations; i++) {
            const angle = (i / rotations) * Math.PI * 2;
            const canvas = document.createElement('canvas');
            canvas.width = headSize;
            canvas.height = headSize;
            const ctx = canvas.getContext('2d');
            
            // Draw snake head
            ctx.save();
            ctx.translate(headSize / 2, headSize / 2);
            ctx.rotate(angle);
            
            // Simple triangle head
            ctx.fillStyle = '#00ff00';
            ctx.beginPath();
            ctx.moveTo(0, -headSize / 2);
            ctx.lineTo(-headSize / 3, headSize / 3);
            ctx.lineTo(headSize / 3, headSize / 3);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
            
            heads[i] = {
                canvas: canvas,
                angle: angle
            };
        }
        
        return heads;
    }
    
    /**
     * Generate snake segments
     */
    async generateSnakeSegments() {
        const segments = {};
        const sizes = [8, 12, 16, 20, 24];
        
        for (const size of sizes) {
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Draw segment
            ctx.fillStyle = '#00cc00';
            ctx.fillRect(2, 2, size - 4, size - 4);
            
            segments[size] = {
                canvas: canvas,
                imageData: ctx.getImageData(0, 0, size, size)
            };
        }
        
        return segments;
    }
    
    /**
     * Generate boost effects
     */
    async generateBoostEffects() {
        const effects = {};
        const trailLength = 5;
        
        for (let i = 0; i < trailLength; i++) {
            const opacity = 1 - (i / trailLength);
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            // Draw trail particle
            const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
            gradient.addColorStop(0, `rgba(255, 255, 0, ${opacity})`);
            gradient.addColorStop(1, `rgba(255, 100, 0, 0)`);
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
            
            effects[i] = {
                canvas: canvas,
                opacity: opacity
            };
        }
        
        return effects;
    }
    
    /**
     * Cache border states
     */
    async cacheBorderStates() {
        const borderStates = {};
        const pulsePhases = 4;
        
        for (let i = 0; i < pulsePhases; i++) {
            this.updateProgress((i / pulsePhases) * 100, `Caching border phase ${i + 1}`);
            
            const intensity = 0.5 + (Math.sin((i / pulsePhases) * Math.PI * 2) * 0.5);
            borderStates[i] = {
                intensity: intensity,
                color: `rgba(255, 0, 255, ${intensity * 0.3})`
            };
            
            await this.delay(50);
        }
        
        this.assets.borders = borderStates;
        this.updateProgress(100, "Borders cached");
    }
    
    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get loading screen tips
     */
    getRandomTip() {
        return this.loadingTips[Math.floor(Math.random() * this.loadingTips.length)];
    }
}

// Export for use in main game
window.AssetPreloader = AssetPreloader;