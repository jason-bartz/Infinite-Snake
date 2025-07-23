/**
 * Mobile Background Integration - Integrates all mobile optimizations into the main game
 */

// Global mobile renderer instances
window.mobileStarRenderer = null;
window.mobileBackgroundOptimizer = null;
window.assetPreloader = null;
window.preloadedAssets = null;
window.easterEggElements = null;

/**
 * Initialize mobile renderers and optimizations
 */
async function initializeMobileRenderers() {
    if (!window.isTabletOrMobile || !window.isTabletOrMobile()) {
        return; // Desktop doesn't need mobile optimizations
    }
    
    console.log('Initializing mobile background renderers...');
    
    // Show loading screen
    showMobileLoadingScreen();
    
    try {
        // Initialize asset preloader
        window.assetPreloader = new AssetPreloader();
        
        // Start preloading with progress updates
        window.preloadedAssets = await window.assetPreloader.preload((progress) => {
            updateLoadingProgress(progress);
        });
        
        // Initialize battery optimizer
        await BatteryOptimizer.init();
        
        // Initialize background optimizer
        window.mobileBackgroundOptimizer = new MobileBackgroundOptimizer();
        
        // Create star renderer canvas
        const starCanvas = document.createElement('canvas');
        starCanvas.id = 'mobileStarCanvas';
        starCanvas.style.position = 'fixed';
        starCanvas.style.top = '0';
        starCanvas.style.left = '0';
        starCanvas.style.width = '100%';
        starCanvas.style.height = '100%';
        starCanvas.style.zIndex = '0';
        starCanvas.style.pointerEvents = 'none';
        
        // Set canvas size
        const scale = window.mobileBackgroundOptimizer.getCanvasScale();
        starCanvas.width = window.innerWidth * scale;
        starCanvas.height = window.innerHeight * scale;
        
        // Insert before game canvas
        const gameCanvas = document.getElementById('gameCanvas');
        gameCanvas.parentNode.insertBefore(starCanvas, gameCanvas);
        
        // Initialize star renderer
        window.mobileStarRenderer = new MobileStarRenderer(starCanvas, {
            maxStars: 100,
            useTwinkle: true,
            useParallax: true,
            renderMode: 'auto'
        });
        
        // Initialize Easter Egg Elements
        if (typeof EasterEggElements !== 'undefined') {
            window.easterEggElements = new EasterEggElements();
            
            // Set initial quality based on device performance
            const qualityLevel = window.mobileBackgroundOptimizer.currentQuality || 'medium';
            window.easterEggElements.setQualityLevel(qualityLevel);
        }
        
        // Hide loading screen
        hideLoadingScreen();
        
        console.log('Mobile renderers initialized successfully');
        
    } catch (error) {
        console.error('Failed to initialize mobile renderers:', error);
        hideLoadingScreen();
    }
}

/**
 * Show mobile loading screen
 */
function showMobileLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const splashScreen = document.getElementById('splashScreen');
    
    if (loadingScreen && splashScreen) {
        // Hide splash screen
        splashScreen.style.display = 'none';
        
        // Show loading screen
        loadingScreen.style.display = 'flex';
        
        // Animate stars in background
        animateLoadingStars();
        
        // Start tip rotation
        startTipRotation();
    }
}

/**
 * Update loading progress
 */
function updateLoadingProgress(progress) {
    const progressFill = document.querySelector('.loading-progress-fill');
    const progressText = document.querySelector('.loading-progress-text');
    const phaseText = document.querySelector('.loading-phase-text');
    const tipText = document.querySelector('.loading-tip-text');
    
    if (progressFill) {
        progressFill.style.width = `${progress.percent}%`;
    }
    
    if (progressText) {
        progressText.textContent = `${Math.round(progress.percent)}%`;
    }
    
    if (phaseText) {
        phaseText.textContent = progress.phase;
    }
    
    if (tipText && progress.tip) {
        tipText.textContent = progress.tip.text;
    }
}

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const gameModeSelect = document.getElementById('gameModeSelect');
    
    if (loadingScreen) {
        // Fade out animation
        loadingScreen.style.transition = 'opacity 0.5s';
        loadingScreen.style.opacity = '0';
        
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            
            // Show game mode select
            if (gameModeSelect) {
                gameModeSelect.style.display = 'block';
                // Fade in game mode select
                setTimeout(() => {
                    gameModeSelect.style.opacity = '1';
                }, 50);
            }
        }, 500);
    }
}

/**
 * Animate loading screen stars
 */
function animateLoadingStars() {
    const starsContainer = document.querySelector('.loading-stars-bg');
    if (!starsContainer) return;
    
    // Create simple CSS stars
    const starCount = 30;
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'loading-star';
        star.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: white;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            opacity: ${Math.random() * 0.8 + 0.2};
            animation: loadingStarTwinkle ${2 + Math.random() * 3}s infinite;
        `;
        starsContainer.appendChild(star);
    }
    
    // Add CSS animation
    if (!document.querySelector('#loadingStarAnimation')) {
        const style = document.createElement('style');
        style.id = 'loadingStarAnimation';
        style.textContent = `
            @keyframes loadingStarTwinkle {
                0%, 100% { opacity: 0.2; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Start tip rotation
 */
let tipRotationInterval;
function startTipRotation() {
    let tipIndex = 0;
    const tips = [
        "Tip: Combine Fire 🔥 + Water 💧 to create Steam!",
        "Tip: Earth 🌍 + Water 💧 makes Mud!",
        "Tip: Legendary skins unlock at milestone discoveries!",
        "Tip: Use boost wisely - it drains your energy!",
        "Tip: Boss snakes drop rare elements when defeated!",
        "Tip: Some combinations only work with rare elements!",
        "Tip: The more you discover, the faster rare elements spawn!"
    ];
    
    tipRotationInterval = setInterval(() => {
        const tipText = document.querySelector('.loading-tip-text');
        if (tipText) {
            tipIndex = (tipIndex + 1) % tips.length;
            tipText.style.opacity = '0';
            
            setTimeout(() => {
                tipText.textContent = tips[tipIndex];
                tipText.style.opacity = '1';
            }, 300);
        }
    }, 3000);
}

/**
 * Render mobile background (called from main game loop)
 */
function renderMobileBackground(ctx, camera) {
    if (!window.mobileBackgroundOptimizer || !window.isVisible) return;
    
    const optimizer = window.mobileBackgroundOptimizer;
    const assets = window.preloadedAssets;
    
    // Start frame timing
    optimizer.startFrame();
    
    // Clear background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    optimizer.incrementDrawCalls();
    
    // Render nebula background if available
    if (assets && assets.backgrounds && assets.backgrounds.nebulaBackground && optimizer.shouldRender('background')) {
        const zoomScale = 1.5; // 50% zoom in
        const bgWidth = assets.backgrounds.nebulaBackground.width * zoomScale;
        const bgHeight = assets.backgrounds.nebulaBackground.height * zoomScale;
        const parallaxFactor = 0.2;
        const offsetX = (camera.x * parallaxFactor) % bgWidth;
        const offsetY = (camera.y * parallaxFactor) % bgHeight;
        
        // Simple tiling for mobile with zoom
        ctx.drawImage(assets.backgrounds.nebulaBackground, -offsetX, -offsetY, ctx.canvas.width + bgWidth, ctx.canvas.height + bgHeight);
        optimizer.incrementDrawCalls();
    }
    
    // Render star overlay if available
    if (assets && assets.backgrounds && assets.backgrounds.starOverlay && optimizer.shouldRender('background')) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        const starWidth = assets.backgrounds.starOverlay.width;
        const starHeight = assets.backgrounds.starOverlay.height;
        const parallaxFactor = 0.3;
        const offsetX = (camera.x * parallaxFactor) % starWidth;
        const offsetY = (camera.y * parallaxFactor) % starHeight;
        
        ctx.drawImage(assets.backgrounds.starOverlay, -offsetX, -offsetY, ctx.canvas.width + starWidth, ctx.canvas.height + starHeight);
        ctx.restore();
        optimizer.incrementDrawCalls();
    }
    
    // Update and render stars
    if (window.mobileStarRenderer && optimizer.shouldRender('stars')) {
        window.mobileStarRenderer.update(16.67, camera.x, camera.y);
        window.mobileStarRenderer.render();
        optimizer.incrementDrawCalls();
    }
    
    // Update and render Easter Egg elements (rare background decorations)
    if (window.easterEggElements && optimizer.shouldRender('effects')) {
        // Create game state object for easter eggs
        const gameState = {
            worldWidth: window.WORLD_WIDTH || 8000,
            worldHeight: window.WORLD_HEIGHT || 8000,
            playerSnake: window.playerSnake || null,
            bossActive: window.currentBoss && window.currentBoss.isActive || false
        };
        
        window.easterEggElements.update(16.67, gameState);
        window.easterEggElements.render(ctx, camera);
        optimizer.incrementDrawCalls();
    }
    
    // Render grid pattern
    if (assets && assets.backgrounds.grid && optimizer.shouldRender('grid')) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = assets.backgrounds.grid.pattern;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
        optimizer.incrementDrawCalls();
    }
    
    // Render borders
    if (assets && assets.backgrounds.borders && optimizer.shouldRender('borders')) {
        const borders = assets.backgrounds.borders;
        const borderWidth = 15;
        
        ctx.save();
        
        // Top border
        ctx.fillStyle = borders.top;
        ctx.fillRect(0, 0, ctx.canvas.width, borderWidth);
        
        // Bottom border
        ctx.fillStyle = borders.bottom;
        ctx.fillRect(0, ctx.canvas.height - borderWidth, ctx.canvas.width, borderWidth);
        
        // Left border
        ctx.fillStyle = borders.left;
        ctx.fillRect(0, 0, borderWidth, ctx.canvas.height);
        
        // Right border
        ctx.fillStyle = borders.right;
        ctx.fillRect(ctx.canvas.width - borderWidth, 0, borderWidth, ctx.canvas.height);
        
        ctx.restore();
        optimizer.incrementDrawCalls();
    }
    
    // End frame timing
    optimizer.endFrame();
}

/**
 * Update mobile canvas scale
 */
function updateMobileCanvasScale() {
    const gameCanvas = document.getElementById('gameCanvas');
    const currentScale = window.devicePixelRatio * 0.5; // Current mobile scale
    
    // Get optimized scale from optimizer
    const optimizedScale = window.mobileBackgroundOptimizer 
        ? window.mobileBackgroundOptimizer.getCanvasScale() 
        : 0.75;
    
    // Update canvas resolution
    const newScale = Math.max(currentScale, optimizedScale);
    
    gameCanvas.width = window.innerWidth * newScale;
    gameCanvas.height = window.innerHeight * newScale;
    
    console.log(`Mobile canvas scale updated: ${currentScale} -> ${newScale}`);
    
    return newScale;
}

/**
 * Get cached emoji texture
 */
function getCachedEmojiTexture(emoji, size) {
    if (!window.preloadedAssets || !window.preloadedAssets.emojis[emoji]) {
        return null;
    }
    
    const sizes = window.preloadedAssets.emojis[emoji];
    const requestedSize = sizes[size] || sizes[20]; // Default to 20px if size not found
    
    return requestedSize ? requestedSize.canvas : null;
}

/**
 * Handle window resize
 */
function handleMobileResize() {
    if (window.mobileStarRenderer) {
        const scale = window.mobileBackgroundOptimizer.getCanvasScale();
        const starCanvas = document.getElementById('mobileStarCanvas');
        
        if (starCanvas) {
            starCanvas.width = window.innerWidth * scale;
            starCanvas.height = window.innerHeight * scale;
            window.mobileStarRenderer.resize(starCanvas.width, starCanvas.height);
        }
    }
}

// Add resize listener
window.addEventListener('resize', handleMobileResize);

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (tipRotationInterval) {
        clearInterval(tipRotationInterval);
    }
    
    if (window.mobileStarRenderer) {
        window.mobileStarRenderer.destroy();
    }
    
    if (window.easterEggElements) {
        window.easterEggElements.clear();
    }
});

// Export functions for use in main game
window.initializeMobileRenderers = initializeMobileRenderers;
window.renderMobileBackground = renderMobileBackground;
window.updateMobileCanvasScale = updateMobileCanvasScale;
window.getCachedEmojiTexture = getCachedEmojiTexture;