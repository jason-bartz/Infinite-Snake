// Performance Integration Module
// This file adds performance optimizations to the game
// It should be loaded after game-original.js

(function() {
    // Performance integration module loaded
    
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
            window.snakeQuadTree = new QuadTree(0, 0, window.WORLD_SIZE, window.WORLD_SIZE, 10);
            
            // Insert all snakes
            if (window.snakes) {
                window.snakes.forEach(snake => {
                    if (snake.alive && !snake.isDying) {
                        window.snakeQuadTree.insert({
                            x: snake.x,
                            y: snake.y,
                            width: 1,
                            height: 1,
                            snake: snake
                        });
                    }
                });
            }
            
            // Insert all active elements
            if (window.elementPool && window.elementPool.pool) {
                window.elementPool.pool.forEach(element => {
                    if (element.active) {
                        window.snakeQuadTree.insert({
                            x: element.x,
                            y: element.y,
                            width: 1,
                            height: 1,
                            element: element
                        });
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
            const searchArea = {
                x: snake.x - 150,
                y: snake.y - 150,
                width: 300,
                height: 300
            };
            const nearbyObjects = window.snakeQuadTree.retrieve(searchArea);
            nearbyObjects.forEach((obj) => {
                if (!obj.snake) return;
                const otherSnake = obj.snake;
                if (snake === otherSnake || !otherSnake.alive || otherSnake.isDying) return;

                // Check head-to-head collision
                const dist = mathOptimizer.distance(snake.x, snake.y, otherSnake.x, otherSnake.y);
                if (dist < (snake.size + otherSnake.size) * 15) {
                    collisionDetected = true;
                    // Let the original game handle the collision logic
                }
            });

            // Check element collection
            nearbyObjects.forEach((obj) => {
                if (!obj.element) return;
                const element = obj.element;
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
            
            // Performance: Game initialized, setting up optimizations
            
            // Initialize performance optimizer with canvas
            window.perfOptimizer.init(window.canvas, window.isMobile);
            
            // Replace emoji cache if it exists
            if (window.emojiCache && window.emojiCache instanceof Map) {
                // Copy existing cache entries
                window.emojiCache.forEach((value, key) => {
                    window.enhancedEmojiCache.set(key, value);
                });
                window.emojiCache = window.enhancedEmojiCache;
                // Performance: Enhanced emoji cache installed
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
                // Performance: Game loop enhanced
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
                // Performance: Resize handler optimized
            }
            
            // Replace math functions with optimized versions
            window.fastSin = mathOptimizer.fastSin.bind(mathOptimizer);
            window.fastCos = mathOptimizer.fastCos.bind(mathOptimizer);
            window.fastDistance = mathOptimizer.distance.bind(mathOptimizer);
            window.fastDistanceSquared = mathOptimizer.distanceSquared.bind(mathOptimizer);
            
            // Performance: Math optimizations available
            
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
            
            // Performance: All optimizations integrated successfully
        }
    }, 100);
})();