// Performance Integration Module
// This file adds performance optimizations to the game
// It should be loaded after game-original.js

(function() {
    console.log('[Performance] Performance integration module loaded');
    
    // Initialize performance systems
    window.perfOptimizer = new PerformanceOptimizer();
    window.enhancedEmojiCache = new EnhancedEmojiCache(window.isMobile ? 200 : 500);
    window.snakeQuadTree = null;
    
    // Performance helper functions
    window.performanceUpdate = function(currentTime) {
        // Clean up AI data periodically
        if (window.aiSnakeDataMap && window.perfOptimizer) {
            window.perfOptimizer.cleanupAIData(window.aiSnakeDataMap, currentTime);
        }

        // Clean up dead snake segments
        if (window.snakes && window.perfOptimizer) {
            window.perfOptimizer.cleanupDeadSnakeSegments(window.snakes);
        }

        // Limit shooting stars
        if (window.shootingStars && !window.isMobile && window.perfOptimizer) {
            window.shootingStars = window.perfOptimizer.limitShootingStars(window.shootingStars);
        }

        // Rebuild quadtree each frame
        if (window.WORLD_SIZE) {
            window.snakeQuadTree = new SnakeQuadTree(window.WORLD_SIZE);
            
            // Insert all snakes
            if (window.snakes) {
                window.snakes.forEach(snake => {
                    window.snakeQuadTree.insertSnake(snake);
                });
            }
            
            // Insert all active elements
            if (window.elementPool && window.elementPool.pool) {
                window.elementPool.pool.forEach(element => {
                    if (element.active) {
                        window.snakeQuadTree.insertElement(element);
                    }
                });
            }
        }

        // Update FPS
        if (window.perfOptimizer) {
            window.perfOptimizer.updateFPS(currentTime);
        }

        // Clear math caches periodically
        if (currentTime % 10000 < 16 && window.mathOptimizer) {
            window.mathOptimizer.clearCaches();
        }
    };

    // Optimized collision detection using quadtree
    window.checkCollisionsOptimized = function() {
        if (!window.snakeQuadTree || !window.snakes) return false;

        let collisionDetected = false;

        window.snakes.forEach(snake => {
            if (!snake.alive || snake.isDying) return;

            // Check collisions with other snakes
            const nearbySnakes = window.snakeQuadTree.getPotentialSnakeCollisions(snake);
            nearbySnakes.forEach(({ snake: otherSnake }) => {
                if (snake === otherSnake || !otherSnake.alive || otherSnake.isDying) return;

                // Check head-to-head collision
                const dist = mathOptimizer.distance(snake.x, snake.y, otherSnake.x, otherSnake.y);
                if (dist < (snake.size + otherSnake.size) * 15) {
                    collisionDetected = true;
                    // Let the original game handle the collision logic
                }
            });

            // Check element collection
            const nearbyElements = window.snakeQuadTree.getNearbyElements(snake);
            nearbyElements.forEach(({ element }) => {
                if (!element.active) return;

                const dist = mathOptimizer.distance(snake.x, snake.y, element.x, element.y);
                if (dist < 30 + snake.size * 10) {
                    // Element can be collected - let original game handle it
                }
            });
        });

        return collisionDetected;
    };

    // Wait for game initialization
    let initCheckInterval = setInterval(function() {
        if (window.canvas && window.gameInitialized) {
            clearInterval(initCheckInterval);
            
            console.log('[Performance] Game initialized, setting up optimizations');
            
            // Initialize performance optimizer with canvas
            window.perfOptimizer.init(window.canvas, window.isMobile);
            
            // Replace emoji cache if it exists
            if (window.emojiCache && window.emojiCache instanceof Map) {
                // Copy existing cache entries
                window.emojiCache.forEach((value, key) => {
                    window.enhancedEmojiCache.set(key, value);
                });
                window.emojiCache = window.enhancedEmojiCache;
                console.log('[Performance] Enhanced emoji cache installed');
            }
            
            // Add performance monitoring to game loop
            const originalGameLoop = window.gameLoop;
            if (originalGameLoop) {
                window.gameLoop = function(currentTime) {
                    // Run performance updates
                    window.performanceUpdate(currentTime);
                    
                    // Call original game loop
                    originalGameLoop.call(this, currentTime);
                };
                console.log('[Performance] Game loop enhanced');
            }
            
            // Setup optimized resize handler
            const originalResize = window.resizeCanvas;
            if (originalResize) {
                window.resizeCanvas = function() {
                    // Update background cache dimensions
                    if (window.perfOptimizer) {
                        window.perfOptimizer.updateBackgroundCache(window.innerWidth, window.innerHeight);
                    }
                    
                    // Call original resize
                    originalResize.call(this);
                };
                console.log('[Performance] Resize handler optimized');
            }
            
            // Replace math functions with optimized versions
            window.fastSin = mathOptimizer.fastSin.bind(mathOptimizer);
            window.fastCos = mathOptimizer.fastCos.bind(mathOptimizer);
            window.fastDistance = mathOptimizer.distance.bind(mathOptimizer);
            window.fastDistanceSquared = mathOptimizer.distanceSquared.bind(mathOptimizer);
            
            console.log('[Performance] Math optimizations available');
            
            // Expose performance metrics
            window.getPerformanceMetrics = function() {
                return {
                    fps: window.perfOptimizer ? window.perfOptimizer.currentFPS : 0,
                    performanceMode: window.perfOptimizer ? window.perfOptimizer.getPerformanceMode() : 'unknown',
                    emojiCacheSize: window.enhancedEmojiCache ? window.enhancedEmojiCache.size : 0,
                    aiDataMapSize: window.aiSnakeDataMap ? window.aiSnakeDataMap.size : 0,
                    quadtreeActive: window.snakeQuadTree !== null
                };
            };
            
            console.log('[Performance] All optimizations integrated successfully');
        }
    }, 100);
})();