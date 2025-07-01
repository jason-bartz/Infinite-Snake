// Mobile Background Integration Module
// This code shows how to integrate the optimized mobile renderers into the main game

// Integration example for the main game's drawBackground function
function drawBackgroundMobileOptimized() {
    // Deep space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Always draw borders first
    drawBorders();
    
    if (isMobile) {
        // Use optimized mobile rendering
        renderMobileBackground();
    } else {
        // Use existing desktop rendering
        renderDesktopBackground();
    }
}

// Initialize mobile renderers (add to game initialization)
let mobileStarRenderer = null;
let mobilePlanetRenderer = null;
let mobileOptimizer = null;
let particleOptimizer = null;

function initializeMobileRenderers() {
    if (!isMobile) return;
    
    // Try WebGL first, fallback to Canvas2D
    const starCanvas = document.createElement('canvas');
    starCanvas.width = canvas.width;
    starCanvas.height = canvas.height;
    
    mobileStarRenderer = new MobileStarRenderer(starCanvas);
    if (!mobileStarRenderer.gl) {
        // Fallback to Canvas2D
        mobileStarRenderer = new Canvas2DStarRenderer(canvas, ctx);
    }
    
    // Initialize other components
    mobilePlanetRenderer = new MobilePlanetRenderer(canvas, ctx);
    mobileOptimizer = new MobileBackgroundOptimizer();
    particleOptimizer = new MobileParticleOptimizer();
}

// Optimized mobile background rendering
function renderMobileBackground() {
    // Update performance optimizer
    mobileOptimizer.update();
    
    // Render stars if enabled
    if (mobileOptimizer.features.stars && mobileStarRenderer) {
        if (mobileStarRenderer instanceof MobileStarRenderer) {
            // WebGL rendering
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            mobileStarRenderer.render(camera, cameraZoom, animationTime / 1000);
            ctx.restore();
        } else {
            // Canvas2D rendering
            mobileStarRenderer.render(camera, cameraZoom, animationTime / 1000);
        }
    }
    
    // Render planets if enabled and performance allows
    if (mobileOptimizer.features.planets && mobilePlanetRenderer) {
        const visiblePlanets = mobileOptimizer.getPlanetCount();
        mobilePlanetRenderer.render(camera, cameraZoom, visiblePlanets);
    }
    
    // Shooting stars (only if high performance)
    if (mobileOptimizer.features.shootingStars && mobileOptimizer.shouldUpdate('shootingStars')) {
        updateAndRenderShootingStars();
    }
}

// Optimized shooting stars for mobile
function updateAndRenderShootingStars() {
    const now = Date.now();
    
    // Spawn new shooting star occasionally
    if (now - lastShootingStarTime > 5000 && Math.random() < 0.1) {
        const star = particleOptimizer.spawn('shootingStar', {
            x: Math.random() * WORLD_SIZE,
            y: Math.random() * WORLD_SIZE,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 60,
            trail: []
        });
        
        if (star) {
            lastShootingStarTime = now;
        }
    }
    
    // Update shooting stars
    particleOptimizer.update('shootingStar', (star, dt) => {
        star.x += star.vx;
        star.y += star.vy;
        star.life--;
        
        // Add to trail
        if (star.trail.length < 10) {
            star.trail.push({ x: star.x, y: star.y });
        } else {
            star.trail.shift();
            star.trail.push({ x: star.x, y: star.y });
        }
    });
    
    // Render shooting stars
    particleOptimizer.render('shootingStar', (star, ctx) => {
        const screen = worldToScreen(star.x, star.y);
        
        // Draw trail
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        star.trail.forEach((point, i) => {
            const trailScreen = worldToScreen(point.x, point.y);
            if (i === 0) {
                ctx.moveTo(trailScreen.x, trailScreen.y);
            } else {
                ctx.lineTo(trailScreen.x, trailScreen.y);
            }
        });
        ctx.stroke();
        
        // Draw star
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }, ctx);
}

// Performance measurement integration
function gameLoopWithMobileOptimization(currentTime) {
    if (!gameStarted) {
        animationFrameId = null;
        return;
    }
    
    animationFrameId = requestAnimationFrame(gameLoopWithMobileOptimization);
    
    if (paused) return;
    
    // Calculate delta time
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Update performance metrics on mobile
    if (isMobile && mobileOptimizer) {
        mobileOptimizer.measurePerformance(deltaTime);
    }
    
    // Continue with normal game loop...
    // [rest of game loop code]
}

// Battery-efficient animation strategies
const BatteryOptimizer = {
    isLowPowerMode: false,
    batteryLevel: 1,
    
    init() {
        if ('getBattery' in navigator) {
            navigator.getBattery().then(battery => {
                this.batteryLevel = battery.level;
                this.isLowPowerMode = battery.level < 0.2;
                
                battery.addEventListener('levelchange', () => {
                    this.batteryLevel = battery.level;
                    this.isLowPowerMode = battery.level < 0.2;
                    this.adjustPerformance();
                });
            });
        }
    },
    
    adjustPerformance() {
        if (this.isLowPowerMode && mobileOptimizer) {
            // Force low performance mode
            mobileOptimizer.currentLOD = 'low';
            mobileOptimizer.adjustFeatures();
        }
    }
};

// Visibility API integration for battery saving
document.addEventListener('visibilitychange', () => {
    if (document.hidden && isMobile) {
        // Pause all background animations when app is hidden
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    } else if (!document.hidden && gameStarted && isMobile) {
        // Resume animations
        animationFrameId = requestAnimationFrame(gameLoopWithMobileOptimization);
    }
});

// Touch-friendly star interaction (optional feature)
function addStarInteraction() {
    if (!isMobile) return;
    
    canvas.addEventListener('touchstart', (e) => {
        if (!mobileOptimizer.features.stars) return;
        
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        // Create sparkle effect at touch point
        for (let i = 0; i < 5; i++) {
            particleOptimizer.spawn('sparkle', {
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                life: 30,
                size: Math.random() * 3 + 1
            });
        }
    });
}

// Export integration functions
window.initializeMobileRenderers = initializeMobileRenderers;
window.renderMobileBackground = renderMobileBackground;
window.BatteryOptimizer = BatteryOptimizer;