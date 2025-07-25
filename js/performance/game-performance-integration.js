// Game Performance Integration
// Integrates performance optimizations into the existing game code

(function() {
    'use strict';
    
    console.log('Game Performance Integration: Initializing...');
    
    let canvasOptimizer = null;
    let gameCanvas = null;
    let gameContext = null;
    let originalDrawFunctions = {};
    
    // Wait for game to initialize
    function waitForGame() {
        // Check for canvas element
        gameCanvas = document.getElementById('gameCanvas') || document.querySelector('canvas');
        
        if (!gameCanvas) {
            setTimeout(waitForGame, 100);
            return;
        }
        
        console.log('Game Performance Integration: Canvas found, initializing optimizations');
        
        // Get the context
        gameContext = gameCanvas.getContext('2d');
        
        if (!gameContext) {
            console.error('Game Performance Integration: Could not get canvas context');
            return;
        }
        
        // Initialize canvas optimizer
        initializeCanvasOptimizer();
        
        // Hook into game rendering
        hookGameRendering();
        
        // Pre-cache common game emojis
        precacheGameEmojis();
    }
    
    function initializeCanvasOptimizer() {
        // Create canvas optimizer instance
        canvasOptimizer = new CanvasOptimizer(gameCanvas, gameContext);
        
        // Make it globally accessible for debugging
        window.gameCanvasOptimizer = canvasOptimizer;
        
        console.log('Game Performance Integration: Canvas optimizer initialized');
    }
    
    function hookGameRendering() {
        // Store original drawing functions
        originalDrawFunctions.fillText = gameContext.fillText.bind(gameContext);
        originalDrawFunctions.fillRect = gameContext.fillRect.bind(gameContext);
        originalDrawFunctions.clearRect = gameContext.clearRect.bind(gameContext);
        originalDrawFunctions.drawImage = gameContext.drawImage.bind(gameContext);
        
        // Override fillText for emoji rendering
        gameContext.fillText = function(text, x, y) {
            // Check if it's an emoji (simple check - can be improved)
            if (text && text.length <= 2 && /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/u.test(text)) {
                // Get font size from context
                const fontSize = parseInt(gameContext.font) || 30;
                canvasOptimizer.drawEmoji(text, x, y, fontSize);
            } else {
                // Regular text
                originalDrawFunctions.fillText.call(gameContext, text, x, y);
            }
        };
        
        // Override fillRect for optimized rectangle drawing
        const originalFillRect = gameContext.fillRect.bind(gameContext);
        gameContext.fillRect = function(x, y, width, height) {
            canvasOptimizer.drawRect(x, y, width, height, gameContext.fillStyle);
        };
        
        // Hook into game loop if possible
        hookGameLoop();
    }
    
    function hookGameLoop() {
        // Try to find the game loop
        const possibleGameLoopNames = ['gameLoop', 'update', 'render', 'draw', 'animate'];
        
        for (const funcName of possibleGameLoopNames) {
            if (window[funcName] && typeof window[funcName] === 'function') {
                const originalFunc = window[funcName];
                window[funcName] = function() {
                    // Begin frame
                    canvasOptimizer.beginFrame();
                    
                    // Call original function
                    const result = originalFunc.apply(this, arguments);
                    
                    // End frame
                    canvasOptimizer.endFrame();
                    
                    return result;
                };
                
                console.log(`Game Performance Integration: Hooked into ${funcName}`);
                break;
            }
        }
        
        // Alternative: Hook into requestAnimationFrame
        const originalRAF = window.requestAnimationFrame;
        let frameCount = 0;
        
        window.requestAnimationFrame = function(callback) {
            return originalRAF.call(window, function(timestamp) {
                // Begin frame every other call (assuming game uses RAF directly)
                if (frameCount % 2 === 0) {
                    canvasOptimizer.beginFrame();
                }
                
                // Call original callback
                const result = callback(timestamp);
                
                // End frame
                if (frameCount % 2 === 0) {
                    canvasOptimizer.endFrame();
                }
                
                frameCount++;
                return result;
            });
        };
    }
    
    function precacheGameEmojis() {
        // Common game emojis to pre-cache
        const commonEmojis = [
            // Snake and food
            '🐍', '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑',
            // Elements
            '🔥', '💧', '🌍', '💨', '⚡', '🌊', '🌋', '❄️', '☀️', '🌙', '⭐', '💫',
            // Nature
            '🌳', '🌲', '🌴', '🌵', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌺',
            // Animals
            '🐝', '🦋', '🐛', '🐜', '🐞', '🦗', '🕷️', '🦂', '🐢', '🐸', '🦎', '🐊',
            // Objects
            '💎', '🔮', '🎮', '🎯', '🎲', '🧩', '🎨', '🖌️', '🖍️', '📐', '📏', '🧮',
            // Space
            '🚀', '🛸', '🌌', '🪐', '☄️', '🌠', '🌟', '✨', '💫', '🌑', '🌒', '🌓'
        ];
        
        // Pre-cache emojis
        setTimeout(() => {
            canvasOptimizer.precacheEmojis(commonEmojis);
        }, 1000);
    }
    
    // Performance monitoring integration
    function integratePerformanceMonitoring() {
        if (!window.performanceMonitor) return;
        
        // Add canvas optimizer stats to performance monitor
        setInterval(() => {
            if (canvasOptimizer) {
                const stats = canvasOptimizer.getStats();
                window.performanceMonitor.metrics.canvasOptimization = stats;
            }
        }, 1000);
    }
    
    // Keyboard shortcuts for debugging
    function setupDebugShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Shift + O to toggle optimization
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'O') {
                if (canvasOptimizer) {
                    const isEnabled = canvasOptimizer.toggleOptimization();
                    console.log(`Canvas optimization toggled: ${isEnabled ? 'ON' : 'OFF'}`);
                }
            }
            
            // Ctrl/Cmd + Shift + S for stats
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                if (canvasOptimizer) {
                    console.log('Canvas Optimizer Stats:', canvasOptimizer.getStats());
                }
                if (window.performanceMonitor) {
                    window.performanceMonitor.logReport();
                }
            }
        });
    }
    
    // Initialize everything
    function initialize() {
        waitForGame();
        integratePerformanceMonitoring();
        setupDebugShortcuts();
        
        console.log('Game Performance Integration: Setup complete');
        console.log('Shortcuts: Ctrl+Shift+P (performance monitor), Ctrl+Shift+O (toggle optimization), Ctrl+Shift+S (stats)');
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Expose API
    window.GamePerformanceIntegration = {
        getCanvasOptimizer: () => canvasOptimizer,
        getStats: () => canvasOptimizer ? canvasOptimizer.getStats() : null,
        toggleOptimization: () => canvasOptimizer ? canvasOptimizer.toggleOptimization() : false
    };
})();