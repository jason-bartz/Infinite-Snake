// Safe Performance Integration
// A more conservative approach that doesn't break game functionality

(function() {
    'use strict';
    
    console.log('Safe Performance Integration: Starting...');
    
    // Only apply non-invasive optimizations
    let performanceMode = 'safe';
    let canvasOptimizer = null;
    
    // Wait for game to fully initialize
    function waitForGameReady() {
        // Check if game is fully loaded by looking for game-specific elements
        const gameCanvas = document.getElementById('gameCanvas');
        const gameStarted = gameCanvas && gameCanvas.getContext && 
                          window.gameLoop || window.animate || window.update;
        
        if (!gameStarted) {
            // Wait longer for game to initialize
            setTimeout(waitForGameReady, 500);
            return;
        }
        
        console.log('Safe Performance Integration: Game detected, applying optimizations');
        
        // Apply only safe optimizations
        applySafeOptimizations();
    }
    
    function applySafeOptimizations() {
        // 1. Add performance monitor without modifying game code
        if (window.performanceMonitor) {
            console.log('Performance monitor available - Press Shift+P to toggle');
        }
        
        // 2. Apply CSS performance improvements (already done via CSS file)
        
        // 3. Safari-specific CSS optimizations
        if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            document.body.classList.add('safari-optimized');
            console.log('Safari detected - Applied Safari optimizations');
        }
        
        // 4. iOS-specific optimizations
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            document.body.classList.add('ios-device');
            console.log('iOS detected - Applied iOS optimizations');
        }
        
        // 5. Don't override canvas methods in safe mode
        console.log('Safe Performance Integration: Running in safe mode - canvas methods not modified');
        
        // 6. Setup performance monitoring hooks without breaking game
        setupSafeMonitoring();
    }
    
    function setupSafeMonitoring() {
        // Monitor frame rate without modifying game loop
        let frameCount = 0;
        let lastTime = performance.now();
        
        function monitorFrameRate() {
            frameCount++;
            const now = performance.now();
            
            if (now - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (now - lastTime));
                if (window.performanceMonitor) {
                    window.performanceMonitor.metrics.safeFps = fps;
                }
                frameCount = 0;
                lastTime = now;
            }
            
            requestAnimationFrame(monitorFrameRate);
        }
        
        // Start monitoring
        requestAnimationFrame(monitorFrameRate);
    }
    
    // Utility to enable full optimizations if needed
    window.enableFullPerformanceMode = function() {
        if (performanceMode === 'full') {
            console.log('Full performance mode already enabled');
            return;
        }
        
        performanceMode = 'full';
        console.log('Enabling full performance mode...');
        
        // Load the full integration
        const script = document.createElement('script');
        script.src = 'js/performance/game-performance-integration.js';
        document.body.appendChild(script);
    };
    
    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForGameReady);
    } else {
        waitForGameReady();
    }
    
    // Expose safe API
    window.SafePerformanceIntegration = {
        mode: () => performanceMode,
        enableFullMode: window.enableFullPerformanceMode
    };
    
    console.log('Safe Performance Integration: Initialized in safe mode');
    console.log('To enable full optimizations, run: enableFullPerformanceMode()');
})();