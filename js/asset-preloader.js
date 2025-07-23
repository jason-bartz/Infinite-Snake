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
            },
            stations: {}
        };
        
        this.loadingPhases = [
            { phase: "Initializing Cosmos", weight: 15, method: 'initializeSystem' },
            { phase: "Loading Elements", weight: 20, method: 'preloadEmojis' },
            { phase: "Loading Planets", weight: 10, method: 'preloadPlanets' }, // Reduced weight due to optimization
            { phase: "Loading Stations", weight: 5, method: 'preloadStations' },
            { phase: "Crafting Combinations", weight: 25, method: 'precomputeBackgrounds' },
            { phase: "Preparing Skins", weight: 15, method: 'preRenderSnakeAssets' },
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
        
        // Planet frame counts - defined early so it's available during initial load
        this.planetFrameCounts = {
            'planet-1': 60, 'planet-2': 60, 'planet-3': 60, 'planet-4': 60, 'planet-5': 60,
            'planet-6': 60, 'planet-7': 120, 'planet-8': 60, 'planet-9': 60, 'planet-10': 60,
            'planet-11': 60, 'planet-12': 60, 'planet-13': 60, 'planet-15': 60,
            'planet-16': 60, 'planet-17': 60, 'planet-18': 60, 'planet-19': 120, 'planet-20': 60
        };
        
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
        
        // OPTIMIZATION: Only load essential emojis during startup
        // We'll lazy-load the rest after game starts
        if (window.elements && window.elements.emojis) {
            const gameEmojis = Object.values(window.elements.emojis).slice(0, 20); // Reduced from 50
            emojisToLoad.push(...gameEmojis);
            
            // Store remaining emojis for lazy loading
            this.remainingEmojis = Object.values(window.elements.emojis).slice(20);
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
        
        // Start lazy loading remaining emojis after game starts
        if (this.remainingEmojis && this.remainingEmojis.length > 0) {
            setTimeout(() => this.lazyLoadRemainingEmojis(), 3000);
        }
    }
    
    /**
     * Lazy load remaining emojis after game starts
     */
    async lazyLoadRemainingEmojis() {
        console.log(`Lazy loading ${this.remainingEmojis.length} remaining emojis...`);
        
        for (const emoji of this.remainingEmojis) {
            this.assets.emojis[emoji] = {};
            
            for (const size of this.emojiSizes) {
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                
                ctx.imageSmoothingEnabled = false;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = `${size * 0.8}px Arial`;
                ctx.fillText(emoji, size / 2, size / 2);
                
                this.assets.emojis[emoji][size] = {
                    imageData: ctx.getImageData(0, 0, size, size),
                    canvas: canvas
                };
            }
            
            // Small delay between emojis
            await this.delay(10);
        }
        
        console.log('Finished lazy loading emojis');
    }
    
    /**
     * Preload planet images
     */
    async preloadPlanets() {
        const standardPlanets = 20;
        const specialPlanets = 10;
        const isMobile = window.isTabletOrMobile && window.isTabletOrMobile();
        
        // OPTIMIZATION: Load only first frame initially for faster startup
        // We'll lazy-load additional frames after game starts
        // This applies to all devices now for consistent fast loading
        let totalPlanets = standardPlanets + specialPlanets;
        let loadedPlanets = 0;
        
        // Load standard planets (only first frame initially)
        for (let i = 1; i <= standardPlanets; i++) {
            if (i === 14) continue; // Skip missing planet-14
            
            const planetId = `planet-${i}`;
            this.updateProgress((loadedPlanets / totalPlanets) * 100, `Loading ${planetId}`);
            
            try {
                // Load only the first frame but maintain desktop structure
                const img = await this.loadImage(`assets/planets/${planetId}/1.png`);
                const frameCount = this.planetFrameCounts[planetId] || 60;
                
                this.assets.planets.standard[planetId] = {
                    frames: [img], // Start with just first frame
                    frameCount: frameCount,
                    currentFrame: 0,
                    frameTime: 0,
                    frameDuration: 120,
                    staticImage: img, // Keep for compatibility
                    isStatic: true,
                    isLoading: true // Flag to indicate more frames coming
                };
                loadedPlanets++;
            } catch (error) {
                console.warn(`Failed to load ${planetId}:`, error);
            }
            
            // Small delay to prevent blocking
            if (loadedPlanets % 5 === 0) {
                await this.delay(10);
            }
        }
        
        // Load special planets (already single images)
        for (let i = 1; i <= specialPlanets; i++) {
            if (i === 1 || i === 6 || i === 8) continue; // Skip removed special-planets 1, 6, 8
            
            const planetId = `special-planet-${i}`;
            this.updateProgress((loadedPlanets / totalPlanets) * 100, `Loading ${planetId}`);
            
            try {
                const img = await this.loadImage(`assets/planets/${planetId}.png`);
                this.assets.planets.special[planetId] = img;
                loadedPlanets++;
            } catch (error) {
                console.warn(`Failed to load ${planetId}:`, error);
            }
        }
        
        this.updateProgress(100, "Planets loaded");
        
        // Start lazy loading animation frames in background after game starts
        setTimeout(() => this.lazyLoadPlanetAnimations(), 2000);
    }
    
    /**
     * Preload station images
     */
    async preloadStations() {
        const stationCount = 3;
        
        for (let i = 1; i <= stationCount; i++) {
            const stationId = `station-${i}`;
            this.updateProgress((i / stationCount) * 100, `Loading ${stationId}`);
            
            try {
                const img = await this.loadImage(`assets/stations/${stationId}.png`);
                this.assets.stations[stationId] = img;
            } catch (error) {
                console.warn(`Failed to load ${stationId}:`, error);
            }
        }
        
        this.updateProgress(100, "Stations loaded");
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
        
        // Load pre-made background assets
        this.updateProgress(10, "Loading nebula background");
        try {
            this.assets.backgrounds.nebulaBackground = await this.loadImage('assets/background/purple-blue-bg.png');
        } catch (error) {
            console.error('Failed to load nebula background:', error);
        }
        
        this.updateProgress(20, "Loading star overlay");
        try {
            this.assets.backgrounds.starOverlay = await this.loadImage('assets/background/stars-blue.png');
        } catch (error) {
            console.error('Failed to load star overlay:', error);
        }
        
        // Skip individual star sprites on mobile
        const isMobile = window.isTabletOrMobile && window.isTabletOrMobile();
        if (!isMobile) {
            // Load blinking star sprites only on desktop
            this.updateProgress(30, "Loading star sprites");
            const starSprites = [];
            for (let i = 1; i <= 3; i++) {
                try {
                    const star = await this.loadImage(`assets/background/star-${i}.png`);
                    starSprites.push(star);
                } catch (error) {
                    console.error(`Failed to load star-${i}.png:`, error);
                }
            }
            this.assets.backgrounds.starSprites = starSprites;
        } else {
            // Skip on mobile to improve loading time
            this.assets.backgrounds.starSprites = [];
            this.updateProgress(30, "Optimizing for mobile");
        }
        
        // Create star field (keeping for compatibility)
        this.updateProgress(40, "Generating star field");
        this.assets.backgrounds.starField = await this.generateStarField(canvas, ctx);
        
        // Create grid pattern
        this.updateProgress(60, "Creating grid pattern");
        this.assets.backgrounds.grid = await this.generateGridPattern(canvas, ctx);
        
        // Create border gradients
        this.updateProgress(80, "Rendering borders");
        this.assets.backgrounds.borders = await this.generateBorderGradients(canvas, ctx);
        
        // Create space background
        this.updateProgress(90, "Painting cosmos");
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
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                        || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
        const starCount = isMobile ? 50 : 100;
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
     * Lazy load planet animations after game starts
     */
    async lazyLoadPlanetAnimations() {
        const isMobile = window.isTabletOrMobile && window.isTabletOrMobile();
        console.log('Lazy load planet animations called. isMobile:', isMobile);
        
        if (isMobile) {
            console.log('Skipping planet animations on mobile');
            return;
        }
        
        console.log('Starting background planet animation loading...');
        
        for (let i = 1; i <= 20; i++) {
            if (i === 14) continue; // Skip missing planet-14
            
            const planetId = `planet-${i}`;
            const frameCount = this.planetFrameCounts[planetId];
            const planetData = this.assets.planets.standard[planetId];
            
            if (!planetData) {
                console.log(`Planet data not found for ${planetId}`);
                continue;
            }
            
            if (!planetData.isLoading) {
                console.log(`Planet ${planetId} already fully loaded`);
                continue;
            }
            
            console.log(`Starting lazy load for ${planetId}, frameCount: ${frameCount}`);
            
            // Load remaining frames in background
            this.loadPlanetFramesAsync(planetId, frameCount);
            
            // Small delay between planets to prevent overwhelming the browser
            await this.delay(100);
        }
        
        console.log('Lazy loading initiated for all planets');
    }
    
    /**
     * Load planet frames asynchronously
     */
    async loadPlanetFramesAsync(planetId, frameCount) {
        const planetData = this.assets.planets.standard[planetId];
        console.log(`Loading frames for ${planetId}: starting with ${planetData.frames.length} frames`);
        
        // Load frames 2 through frameCount
        let loadedFrames = 0;
        for (let frame = 2; frame <= frameCount; frame++) {
            try {
                const img = await this.loadImage(`assets/planets/${planetId}/${frame}.png`);
                planetData.frames.push(img);
                loadedFrames++;
                
                // Log progress every 10 frames
                if (loadedFrames % 10 === 0) {
                    console.log(`${planetId}: loaded ${loadedFrames + 1}/${frameCount} frames`);
                }
            } catch (error) {
                console.warn(`Failed to load ${planetId} frame ${frame}:`, error);
            }
        }
        
        planetData.isLoading = false;
        planetData.isStatic = false; // No longer static
        console.log(`✓ Finished loading ${planetId} animations (${planetData.frames.length} frames)`);
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