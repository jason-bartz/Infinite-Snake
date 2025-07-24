        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                        || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
        
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        // Initialize AssetPreloader if not already done
        async function initializeAssets() {
            if (!window.preloadedAssets && window.AssetPreloader) {
                try {
                    window.assetPreloader = new AssetPreloader();
                    window.preloadedAssets = await window.assetPreloader.preload((progress) => {
                        gameLogger.assetProgress(progress.percent, progress.phase);
                    });
                    gameLogger.assetProgress(100, 'Complete');
                } catch (error) {
                    gameLogger.error('ASSETS', 'Failed to preload assets:', error);
                }
            }
        }
        
        // Don't start asset loading here - it's now done on page load
        
        ctx.imageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = 'low';
        
        canvas.style.imageRendering = 'pixelated';
        canvas.style.imageRendering = '-moz-crisp-edges';
        canvas.style.imageRendering = 'crisp-edges';
        
        const emojiCache = new Map();
        const MAX_CACHE_SIZE = 200;
        
        const reusableObjects = {
            vector: { x: 0, y: 0 },
            point: { x: 0, y: 0 },
            distance: { dx: 0, dy: 0, dist: 0 },
            gradient: null
        };
        
        const mathTables = {
            sin: new Float32Array(360),
            cos: new Float32Array(360)
        };
        
        for (let i = 0; i < 360; i++) {
            const rad = (i * Math.PI) / 180;
            mathTables.sin[i] = Math.sin(rad);
            mathTables.cos[i] = Math.cos(rad);
        }
        
        const fastMath = {
            fastSqrt: function(n) {
                if (n < 0) return NaN;
                if (n === 0) return 0;
                let x = n;
                let y = (x + n / x) / 2;
                if (Math.abs(y - x) < 0.01) return y;
                x = y;
                y = (x + n / x) / 2;
                return y;
            },
            
            angleToIndex: function(angle) {
                let degrees = (angle * 180 / Math.PI) % 360;
                if (degrees < 0) degrees += 360;
                return Math.floor(degrees);
            },
            
            sin: function(angle) {
                return mathTables.sin[this.angleToIndex(angle)];
            },
            
            cos: function(angle) {
                return mathTables.cos[this.angleToIndex(angle)];
            }
        };
        
        function getCachedEmoji(emoji, size) {
            const validSize = Math.max(1, Math.round(size) || 20);
            const key = `${emoji}_${validSize}`;
            
            if (emojiCache.has(key)) {
                return emojiCache.get(key);
            }
            
            if (isMobile && window.getCachedEmojiTexture) {
                const preRendered = window.getCachedEmojiTexture(emoji, validSize);
                if (preRendered) {
                    emojiCache.set(key, preRendered);
                    return preRendered;
                }
            }
            
            const offscreenCanvas = document.createElement('canvas');
            const padding = 4;
            offscreenCanvas.width = validSize + padding * 2;
            offscreenCanvas.height = validSize + padding * 2;
            const offscreenCtx = offscreenCanvas.getContext('2d');
            
            if (isMobile) {
                offscreenCtx.imageSmoothingEnabled = false;
            }
            
            offscreenCtx.font = `${validSize}px Arial`;
            offscreenCtx.textAlign = 'center';
            offscreenCtx.textBaseline = 'middle';
            offscreenCtx.fillStyle = 'black';
            offscreenCtx.fillText(emoji, offscreenCanvas.width / 2, offscreenCanvas.height / 2);
            
            emojiCache.set(key, offscreenCanvas);
            
            if (emojiCache.size > MAX_CACHE_SIZE) {
                const firstKey = emojiCache.keys().next().value;
                emojiCache.delete(firstKey);
            }
            
            return offscreenCanvas;
        }
        
        let resizeTimeout;
        let lastCanvasWidth = 0;
        let lastCanvasHeight = 0;
        
        function resizeCanvas(force = false) {
            // Get actual viewport dimensions
            const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
            const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
            
            if (isMobile) {
                let mobileScale = 0.75;
                
                if (window.updateMobileCanvasScale) {
                    mobileScale = window.updateMobileCanvasScale();
                } else {
                    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
                    mobileScale = 0.75;
                }
                
                const newWidth = viewportWidth * mobileScale;
                const newHeight = viewportHeight * mobileScale;
                
                // Only resize if dimensions actually changed or forced
                if (force || Math.abs(newWidth - lastCanvasWidth) > 1 || Math.abs(newHeight - lastCanvasHeight) > 1) {
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    lastCanvasWidth = newWidth;
                    lastCanvasHeight = newHeight;
                    
                    canvas.style.width = viewportWidth + 'px';
                    canvas.style.height = viewportHeight + 'px';
                    
                    ctx.imageSmoothingEnabled = false;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Clear emoji cache on significant resize
                    if (Math.abs(newWidth - lastCanvasWidth) > 50 || Math.abs(newHeight - lastCanvasHeight) > 50) {
                        emojiCache.clear();
                    }
                }
            } else {
                const scale = 1;
                const newWidth = viewportWidth * scale;
                const newHeight = viewportHeight * scale;
                
                if (force || newWidth !== lastCanvasWidth || newHeight !== lastCanvasHeight) {
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    lastCanvasWidth = newWidth;
                    lastCanvasHeight = newHeight;
                    
                    // Ensure canvas fills viewport on desktop
                    canvas.style.width = viewportWidth + 'px';
                    canvas.style.height = viewportHeight + 'px';
                    
                    emojiCache.clear();
                }
            }
        }
        
        // Debounced resize handler
        function handleResize() {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                resizeCanvas();
            }, 100);
        }
        
        // Initial resize
        resizeCanvas(true);
        
        // Listen to multiple resize events for better mobile support
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            // Force resize on orientation change
            setTimeout(() => resizeCanvas(true), 100);
        });
        
        // Visual viewport API for mobile browsers
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        
        const WORLD_SIZE = 4000;
        const SEGMENT_SIZE = 15;
        const SNAKE_SPEED = 5.95125;
        const TURN_SPEED = 0.08;
        const ELEMENT_SIZE = 20;
        
        // Make world size available globally
        window.WORLD_WIDTH = WORLD_SIZE;
        window.WORLD_HEIGHT = WORLD_SIZE;
        
        function worldToScreen(x, y) {
            return {
                x: (x - camera.x) * cameraZoom + canvas.width / 2,
                y: (y - camera.y) * cameraZoom + canvas.height / 2
            };
        }
        
        function isInViewport(x, y, margin = 100) {
            const screen = worldToScreen(x, y);
            
            return screen.x >= -margin && 
                   screen.x <= canvas.width + margin && 
                   screen.y >= -margin && 
                   screen.y <= canvas.height + margin;
        }
        
        let gameStarted = false;
        window.gameStarted = false; // Expose globally
        let paused = false;
        let controlScheme = 'arrows';
        let gameMode = 'infinite';
        window.gameMode = gameMode; // Expose globally for Snake.js access
        let gameWon = false;
        let gameTarget = 0;
        let deathCount = 0;
        let camera = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
        let cameraZoom = isMobile ? 0.75 : 1.0;
        
        let lastTime = 0;
        let frameCount = 0;
        let lastFpsUpdate = 0;
        let currentFPS = 0;
        let accumulator = 0;
        let playerSnake = null;
        let snakes = [];
        let lastDiscoveredElement = null;
        let highScore = parseInt(localStorage.getItem('highScore') || '0');
        let gameStartTime = Date.now();
        let bestRank = 0;
        let playerRespawnTimer = 0;
        let revivesRemaining = 3;
        let savedSnakeLength = 0;
        let savedSnakeScore = 0;
        let comboStreak = 0;
        let animationFrameId = null;
        
        let deathSequenceActive = false;
        let deathSequenceTimer = 0;
        let deathProcessed = false;
        let isRespawning = false;
        let waitingForRespawnInput = false; // New flag for death screen
        const DEATH_SEQUENCE_DURATION = 2000;
        
        // Expose death variables for debugging
        window.deathSequenceActive = false;
        window.deathSequenceTimer = 0;
        window.deathProcessed = false;
        window.playerRespawnTimer = 0;
        window.savedSnakeScore = 0;
        window.savedSnakeLength = 0;
        window.waitingForRespawnInput = false;
        let deathCameraAnimation = {
            active: false,
            startZoom: 1.0,
            targetZoom: 0.7,
            currentZoom: 1.0,
            progress: 0
        };
        
        function isTabletOrMobile() {
            return window.matchMedia("(max-width: 1024px)").matches || 
                   window.matchMedia("(pointer: coarse)").matches ||
                   /iPad|iPhone|iPod|Android/i.test(navigator.userAgent);
        }
        
        // Expose to global scope for other modules
        window.isTabletOrMobile = isTabletOrMobile;
        
        function showRotateDeviceMessage() {
            if (document.getElementById('rotate-device-message')) return;
            
            const rotateMsg = document.createElement('div');
            rotateMsg.id = 'rotate-device-message';
            rotateMsg.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.95);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Press Start 2P', monospace;
                color: #fff;
                text-align: center;
                padding: 20px;
            `;
            rotateMsg.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 30px; animation: rotate 2s ease-in-out infinite;">📱</div>
                <div style="font-size: 14px; line-height: 1.8; margin-bottom: 10px;">Please rotate your device</div>
                <div style="font-size: 11px; margin-top: 10px; color: #4ecdc4;">Infinite Snake is best in landscape</div>
            `;
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes rotate {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-90deg); }
                    50% { transform: rotate(-90deg); }
                    75% { transform: rotate(0deg); }
                    100% { transform: rotate(0deg); }
                }
            `;
            rotateMsg.appendChild(style);
            
            document.body.appendChild(rotateMsg);
            
            const checkOrientation = () => {
                if (window.innerWidth > window.innerHeight) {
                    const msg = document.getElementById('rotate-device-message');
                    if (msg) msg.remove();
                    window.removeEventListener('orientationchange', checkOrientation);
                    window.removeEventListener('resize', checkOrientation);
                }
            };
            window.addEventListener('orientationchange', checkOrientation);
            window.addEventListener('resize', checkOrientation);
        }
        
        function lockToLandscape() {
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').then(() => {
                    gameLogger.debug('ORIENTATION', 'Successfully locked to landscape mode');
                }).catch((err) => {
                    gameLogger.debug('ORIENTATION', 'Could not lock orientation:', err);
                    checkAndShowRotateMessage();
                });
            } else {
                gameLogger.debug('ORIENTATION', 'Screen orientation API not supported');
                checkAndShowRotateMessage();
            }
        }
        
        function checkAndShowRotateMessage() {
            if (window.innerHeight > window.innerWidth) {
                showRotateDeviceMessage();
            }
        }
        
        let alchemyVisionPowerUps = [];
        let alchemyVisionActive = false;
        let alchemyVisionTimer = 0;
        let lastAlchemyVisionSpawn = 0;
        const ALCHEMY_VISION_DURATION = 30000;
        const ALCHEMY_VISION_SPAWN_INTERVAL = 120000;
        const ALCHEMY_VISION_SPAWN_COUNT = 3;
        
        let voidOrbs = [];
        let lastVoidOrbSpawn = 0;
        const VOID_ORB_SPAWN_INTERVAL = 50000; // Reduced from 75s to 50s for more frequent spawns
        const VOID_ORB_SPAWN_COUNT = 6; // Increased from 4 to 6 for more orbs on map
        
        let catalystGems = [];
        let lastCatalystGemSpawn = 0;
        const CATALYST_GEM_SPAWN_INTERVAL = 45000;
        const CATALYST_GEM_SPAWN_COUNT = 3;
        let catalystSpawnedElements = [];
        
        const AI_PERSONALITIES = {
            AGGRESSIVE: {
                name: 'Aggressive',
                huntingPriority: 0.9,
                comboPriority: 0.1,
                riskTolerance: 0.9,
                boostThreshold: 0.3,
                chaseDistance: 600,
                fleeThreshold: 1.5,
                preyRatioMax: 1.3,
                collisionAvoidanceRadius: 80,
                dangerZoneRadius: 150,
                aggressionMultiplier: 2.5,
                elementIgnoreChance: 0.6,
                avoidanceStrength: 0.3,
                predictiveLookAhead: 1.0,
                bodyAvoidanceMultiplier: 0.5,
                encircleDistance: 300,
                ramThreshold: 1.2,
                cutoffAnticipation: 0.8
            },
            COMBO_FOCUSED: {
                name: 'Combo Master',
                huntingPriority: 0.05,
                comboPriority: 0.95,
                riskTolerance: 0.2,
                boostThreshold: 0.7,
                chaseDistance: 100,
                fleeThreshold: 0.9,
                preyRatioMax: 0.5,
                collisionAvoidanceRadius: 200,
                dangerZoneRadius: 300,
                aggressionMultiplier: 0.1,
                elementIgnoreChance: 0.0,
                avoidanceStrength: 0.9,
                predictiveLookAhead: 0.5,
                bodyAvoidanceMultiplier: 1.0,
                encircleDistance: 0,
                ramThreshold: 2.0,
                cutoffAnticipation: 0.0
            },
            BALANCED: {
                name: 'Balanced',
                huntingPriority: 0.5,
                comboPriority: 0.5,
                riskTolerance: 0.5,
                boostThreshold: 0.5,
                chaseDistance: 400,
                fleeThreshold: 1.2,
                preyRatioMax: 0.9,
                collisionAvoidanceRadius: 120,
                dangerZoneRadius: 200,
                aggressionMultiplier: 1.0,
                elementIgnoreChance: 0.3,
                avoidanceStrength: 0.6,
                predictiveLookAhead: 0.7,
                bodyAvoidanceMultiplier: 0.8,
                encircleDistance: 250,
                ramThreshold: 1.5,
                cutoffAnticipation: 0.5
            },
        };
        
        let aiRespawnQueue = [];
        const AI_RESPAWN_COOLDOWN = 5000;
        const MAX_AI_SNAKES = 6;
        
        let usedAISkins = new Set();
        
        let aiSnakeDataMap = new Map();
        
        const PERSONALITY_COLORS = {
            'Aggressive': '#ff4444',
            'Combo Master': '#44ff44',
            'Balanced': '#4444ff'
        };
        
        let staticStars = [];
        let shootingStars = [];
        let lastShootingStarTime = 0;
        
        // Asteroid system
        let asteroids = [];
        
        // Spaceship system
        let spaceshipManager = null;
        
        const pixelStarLayers = [
            { stars: [], speed: 0.05, size: 1, color: '#666', count: 100 },
            { stars: [], speed: 0.1, size: 1, color: '#999', count: 80 },
            { stars: [], speed: 0.15, size: 2, color: '#CCC', count: 60 },
            { stars: [], speed: 0.2, size: 2, color: '#FFF', count: 40 }
        ];
        
        const pixelNebulae = [];
        const nebulaCanvases = new Map();
        
        // Blinking stars for new background system
        const blinkingStars = [];
        const BLINKING_STAR_COUNT = 150; // Number of blinking stars across the map
        
        // Initialize blinking stars
        function initializeBlinkingStars() {
            for (let i = 0; i < BLINKING_STAR_COUNT; i++) {
                blinkingStars.push({
                    x: Math.random() * WORLD_SIZE,
                    y: Math.random() * WORLD_SIZE,
                    type: Math.floor(Math.random() * 3), // 0, 1, or 2 for star-1, star-2, star-3
                    blinkPhase: Math.random() * Math.PI * 2,
                    blinkSpeed: 0.5 + Math.random() * 2, // Different blink speeds
                    scale: 0.5 + Math.random() * 1 // Size variation
                });
            }
        }
        initializeBlinkingStars();
        
        // Increase nebula count and distribute more uniformly using grid-based approach
        const nebulaColors = [
            '#4B0082', '#8B008B', '#191970', '#483D8B', '#6A0DAD', '#9400D3',
            '#FF1493', '#FF69B4', '#DA70D6', '#BA55D3', '#9370DB', '#8A2BE2',
            '#00CED1', '#48D1CC', '#00BFFF', '#1E90FF', '#6495ED', '#4169E1',
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
            '#F08080', '#87CEEB', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
        ]; // Extended color palette for more variety
        
        // Generate nebulas with improved distribution
        const NEBULA_COUNT = 14; // Further reduced number of nebulae
        const NEBULA_GRID_SIZE = 4; // 4x4 grid for distribution
        const cellWidth = WORLD_SIZE / NEBULA_GRID_SIZE;
        const cellHeight = WORLD_SIZE / NEBULA_GRID_SIZE;
        const minNebulaDistance = 500; // Minimum distance between nebulae
        
        let nebulaIndex = 0;
        
        // Generate nebulae with grid-based distribution and distance checking
        for (let gx = 0; gx < NEBULA_GRID_SIZE; gx++) {
            for (let gy = 0; gy < NEBULA_GRID_SIZE; gy++) {
                if (nebulaIndex >= NEBULA_COUNT) break;
                
                // Skip some cells randomly for more natural distribution
                if (Math.random() < 0.2) continue;
                
                let attempts = 0;
                let placed = false;
                
                while (!placed && attempts < 10) {
                    // Random position within grid cell
                    const x = gx * cellWidth + Math.random() * cellWidth;
                    const y = gy * cellHeight + Math.random() * cellHeight;
                    
                    // Check distance from other nebulae
                    let validPosition = true;
                    for (const nebula of pixelNebulae) {
                        const dx = nebula.x - x;
                        const dy = nebula.y - y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        if (distance < minNebulaDistance) {
                            validPosition = false;
                            break;
                        }
                    }
                    
                    if (validPosition) {
                        const size = 600 + Math.random() * 600; // Size range: 600-1200px (larger than before)
                        pixelNebulae.push({
                            x: x,
                            y: y,
                            width: size,
                            height: size,
                            color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)],
                            density: 0.25 + Math.random() * 0.2, // Slightly reduced density: 0.25-0.45
                            clusters: []
                        });
                        nebulaIndex++;
                        placed = true;
                    }
                    attempts++;
                }
            }
            if (nebulaIndex >= NEBULA_COUNT) break;
        }
        
        gameLogger.debug('NEBULA GENERATION', `Generated ${pixelNebulae.length} nebulas across full world`);
        
        const pixelPlanets = [];
        // Create planets with better distribution
        const planetCount = isMobile ? 15 : 22; // Mobile: 15 planets (more since static), Desktop: 22 planets
        
        // Define planet distribution (skip missing planet-14)
        const standardPlanetIds = [];
        for (let i = 1; i <= 20; i++) {
            if (i === 14) continue; // Skip missing planet-14
            standardPlanetIds.push(`planet-${i}`);
        }
        
        const specialPlanetIds = [];
        for (let i = 1; i <= 10; i++) {
            if (i === 1 || i === 6 || i === 8) continue; // Skip removed special-planets 1, 6, 8
            specialPlanetIds.push(`special-planet-${i}`);
        }
        
        // Grid-based distribution with randomization for more even spread
        const gridSize = 8; // 8x8 grid
        // Use full world size for planet distribution
        const cellSize = WORLD_SIZE / gridSize;
        const planetsPerCell = Math.ceil(planetCount / (gridSize * gridSize));
        
        // Use a minimum distance between planets to prevent clumping
        const minPlanetDistance = isMobile ? 400 : 250; // Wider spacing on mobile
        
        // Determine number of special planets
        const specialPlanetCount = isMobile ? 2 : 3; // Fewer special planets on mobile
        
        // Track used special planets to avoid duplicates
        const usedSpecialPlanets = new Set();
        
        // Shuffle standard planets to use each one exactly once
        const shuffledStandardPlanets = [...standardPlanetIds];
        for (let i = shuffledStandardPlanets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledStandardPlanets[i], shuffledStandardPlanets[j]] = [shuffledStandardPlanets[j], shuffledStandardPlanets[i]];
        }
        let standardPlanetIndex = 0;
        
        let planetIndex = 0;
        
        // First, generate all possible grid positions
        const allGridPositions = [];
        for (let gridX = 0; gridX < gridSize; gridX++) {
            for (let gridY = 0; gridY < gridSize; gridY++) {
                allGridPositions.push({ gridX, gridY });
            }
        }
        
        // Shuffle grid positions for random distribution
        for (let i = allGridPositions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allGridPositions[i], allGridPositions[j]] = [allGridPositions[j], allGridPositions[i]];
        }
        
        // Generate planet positions from shuffled grid
        const planetPositions = [];
        for (const gridPos of allGridPositions) {
            if (planetPositions.length >= planetCount) break;
            
            // Random position within grid cell
            const cellX = gridPos.gridX * cellSize;
            const cellY = gridPos.gridY * cellSize;
            
            // Try a few times to find a valid position in this cell
            let attempts = 0;
            while (attempts < 5 && planetPositions.length < planetCount) {
                attempts++;
                
                // Add some randomness to position within cell
                const x = cellX + Math.random() * cellSize;
                const y = cellY + Math.random() * cellSize;
                
                // Check distance from other planets
                let validPosition = true;
                for (let j = 0; j < planetPositions.length; j++) {
                    const dx = planetPositions[j].x - x;
                    const dy = planetPositions[j].y - y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minPlanetDistance) {
                        validPosition = false;
                        break;
                    }
                }
                
                if (validPosition) {
                    planetPositions.push({
                        x: x,
                        y: y,
                        radius: 40 + Math.random() * 60,  // Medium to large only: 40-100
                        rotation: Math.random() * Math.PI * 2,
                        rotationSpeed: (Math.random() - 0.5) * 0.01, // Increased rotation speed for visibility
                        opacity: 0.9
                    });
                    break;
                }
            }
        }
        
        // Now randomly select which positions will have special planets
        const shuffledIndices = Array.from({length: planetPositions.length}, (_, i) => i);
        for (let i = shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
        }
        
        // Assign planet types
        for (let i = 0; i < planetPositions.length; i++) {
            const position = planetPositions[i];
            let planetId;
            let isSpecial = false;
            
            // Check if this should be a special planet
            if (shuffledIndices.indexOf(i) < specialPlanetCount && usedSpecialPlanets.size < specialPlanetCount) {
                // Add a special planet
                const availableSpecials = specialPlanetIds.filter(id => !usedSpecialPlanets.has(id));
                planetId = availableSpecials[Math.floor(Math.random() * availableSpecials.length)];
                usedSpecialPlanets.add(planetId);
                isSpecial = true;
            } else {
                // Add a standard planet (no duplicates - use next from shuffled array)
                if (standardPlanetIndex < shuffledStandardPlanets.length) {
                    planetId = shuffledStandardPlanets[standardPlanetIndex];
                    standardPlanetIndex++;
                } else {
                    // Skip if we've run out of standard planets
                    continue;
                }
            }
            
            // Get the frame count for this planet
            let frameCount = 60; // default
            if (!isSpecial) {
                if (planetId === 'planet-7' || planetId === 'planet-19') frameCount = 120;
                else if (planetId >= 'planet-21' && planetId <= 'planet-24') frameCount = 8;
            }
            
            pixelPlanets.push({
                ...position,
                imageId: planetId,
                isSpecial: isSpecial,
                currentFrame: Math.floor(Math.random() * frameCount), // Random starting frame
                frameTime: 0,
                lastFrameTime: Date.now()
            });
        }
        
        // Debug planet positions
        gameLogger.debug('PLANET GENERATION', `Generated ${pixelPlanets.length} planets`);
        if (pixelPlanets.length > 0) {
            const xCoords = pixelPlanets.map(p => p.x);
            const yCoords = pixelPlanets.map(p => p.y);
            gameLogger.debug('PLANET GENERATION', `X range: ${Math.min(...xCoords)} to ${Math.max(...xCoords)}`);
            gameLogger.debug('PLANET GENERATION', `Y range: ${Math.min(...yCoords)} to ${Math.max(...yCoords)}`);
        }
        
        // Create floating space stations
        const spaceStations = [];
        const stationCount = 5 + Math.floor(Math.random() * 3); // 5-7 stations
        
        for (let i = 0; i < stationCount; i++) {
            const stationId = `station-${(i % 3) + 1}`; // Cycle through station-1, station-2, station-3
            spaceStations.push({
                x: Math.random() * WORLD_SIZE,
                y: Math.random() * WORLD_SIZE,
                vx: (Math.random() - 0.5) * 0.3, // Slow drift velocity
                vy: (Math.random() - 0.5) * 0.3,
                width: 25,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.001, // Very slow rotation
                imageId: stationId,
                driftAngle: Math.random() * Math.PI * 2,
                driftSpeed: 0.1 + Math.random() * 0.1 // Slight variation in drift
            });
        }
        
        // Pixel asteroids - REMOVED (using PNG images instead)
        const pixelAsteroids = [];
        const asteroidClusters = [];
        
        /*
        const numClusters = 8 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numClusters; i++) {
            const clusterX = Math.random() * WORLD_SIZE;
            const clusterY = Math.random() * WORLD_SIZE;
            const clusterRadius = 200 + Math.random() * 100;
            const numAsteroids = 15 + Math.floor(Math.random() * 11);
            
            const cluster = {
                x: clusterX,
                y: clusterY,
                radius: clusterRadius,
                asteroids: []
            };
            
            for (let j = 0; j < numAsteroids; j++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * clusterRadius;
                const asteroidX = clusterX + Math.cos(angle) * distance;
                const asteroidY = clusterY + Math.sin(angle) * distance;
                
                cluster.asteroids.push({
                    x: asteroidX,
                    y: asteroidY,
                    size: 2 + Math.random() * 6,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02,
                    driftX: (Math.random() - 0.5) * 0.1,
                    driftY: (Math.random() - 0.5) * 0.1
                });
            }
            
            asteroidClusters.push(cluster);
        }
        */
        
        let borderParticles = [];
        let animationTime = 0;
        const MAX_BORDER_PARTICLES = isMobile ? 50 : 150;
        
        let elementDatabase = {};
        let combinations = {};
        let discoveredElements = new Set();
        let playerDiscoveredElements = new Set();
        
        let allTimeDiscoveries = new Map();
        
        let recentlySpawnedElements = [];
        const MAX_SPAWN_HISTORY = 20;
        let recentlyDiscoveredElements = new Map();
        const DISCOVERY_ECHO_DURATION = 30000;
        
        const ELEMENT_GRID_SIZE = 400;
        let elementGrid = new Map();
        const MIN_ELEMENTS_PER_CELL = 2;
        const MAX_ELEMENTS_PER_CELL = 5;
        const TARGET_ELEMENT_COUNT = isMobile ? 100 : 200;
        
        let snakeNameData = null;
        
        const BOSS_TYPES = {
            PYRAXIS: {
                name: "Pyraxis the Molten",
                element: "fire",
                elementId: 3,
                emoji: "🔥",
                color: "#ff4444",
                maxHealth: 5,
                attackCooldown: 6000, // Increased from 4s to 6s
                defeated: false,
                skin: 'pyraxis',
                attackSound: 'sounds/magma-roar.mp3',
                laughSound: 'sounds/pyraxis-laugh.mp3'
            },
            ABYSSOS: {
                name: "Abyssos the Deep One",
                element: "water",
                elementId: 1,
                emoji: "🌊",
                color: "#4444ff",
                maxHealth: 5,
                attackCooldown: 8000, // Increased from 6s to 8s
                defeated: false,
                skin: 'abyssos',
                attackSound: 'sounds/negative-low-pitch.mp3',
                laughSound: 'sounds/abyssos-laugh.mp3'
            },
            OSSEUS: {
                name: "Osseus the Bone Sovereign",
                element: "earth",
                elementId: 0,
                emoji: "🗿",
                color: "#8b4513",
                maxHealth: 5,
                attackCooldown: 7000, // Increased from 5s to 7s
                defeated: false,
                skin: 'osseus',
                attackSound: 'sounds/boom-explosion.mp3',
                laughSound: 'sounds/osseus-laugh.mp3'
            },
            ZEPHYRUS: {
                name: "Zephyrus the Storm Caller",
                element: "air",
                elementId: 2,
                emoji: "💨",
                color: "#87ceeb",
                maxHealth: 5,
                attackCooldown: 10000, // Increased from 8s to 10s
                defeated: false,
                skin: 'zephyrus',
                attackSound: 'sounds/power-surge.mp3',
                laughSound: 'sounds/zephyrus-laugh.mp3'
            }
        };
        
        let currentBoss = null;
        let bossEncounterActive = false;
        let nextBossSpawnScore = 0;
        let lastBossDefeatScore = 0;
        let bossSpawnCount = 0;
        let defeatedBosses = new Set();
        
        // Load defeated bosses from localStorage for persistence
        const savedDefeatedBosses = JSON.parse(localStorage.getItem('defeatedBosses') || '[]');
        savedDefeatedBosses.forEach(boss => defeatedBosses.add(boss));
        
        // Make defeatedBosses available globally for unlock checks
        window.defeatedBosses = defeatedBosses;
        
        function calculateNextBossSpawn() {
            if (bossSpawnCount === 0) {
                nextBossSpawnScore = 50000 + Math.floor(Math.random() * 25000);
            } else {
                const baseInterval = 200000;
                const randomRange = 50000;
                nextBossSpawnScore = lastBossDefeatScore + baseInterval + Math.floor(Math.random() * randomRange);
            }
            gameLogger.debug('BOSS', `Next boss will spawn at ${nextBossSpawnScore.toLocaleString()} points`);
        }
        let bossesDefeatedThisCycle = 0;
        let bossIsUndead = false;
        let bossIntroMusic = null;
        let bossBattleMusic = null;
        let bossHealthBar = null;
        let bossHealthBarContainer = null;
        let bossNameDisplay = null;
        // Load element bank slots from localStorage or default to 6
        let elementBankSlots = parseInt(localStorage.getItem('elementBankSlots')) || 6;
        
        // Save element bank slots when updated
        function saveElementBankSlots() {
            localStorage.setItem('elementBankSlots', elementBankSlots.toString());
        }
        let bossDamageFlashTimer = 0;
        let bossStunTimer = 0;
        let bossProjectiles = [];
        let bossDamageCooldown = 0;
        let shockwaves = [];
        window.shockwaves = shockwaves; // Expose to window for Snake.js access
        let bossScreenShakeTimer = 0;
        let bossScreenShakeIntensity = 0;
        let elementVacuumActive = false;
        let elementVacuumTimer = 0;
        let vacuumedElements = [];
        let damageNumbers = [];
        let bossFissures = [];
        
        let skinMetadata = {
            'snake-default-green': { name: 'Basic Boy', unlocked: true, colors: ['#75d18e', '#6abf81'] },
            'neko': { name: 'Lil Beans (Beta Perk)', unlocked: true, colors: ['#c6c6cb', '#c3c3e7'] },
            '35mm': { name: 'Ansel 35', unlocked: false, colors: ['#2c3e50', '#1a1a1a'] },
            'Frank': { name: 'Franklin', unlocked: false, colors: ['#9b59b6', '#8e44ad'] },
            'af-one': { name: "Scuffy", unlocked: false, colors: ['#e74c3c', '#e23b28'] },
            'barbi': { name: 'Margot', unlocked: false, colors: ['#ff69b4', '#ff1493'] },
            'boat-mcboatface': { name: 'Boaty McBoatface', unlocked: false, colors: ['#3498db', '#2980b9'] },
            'camera-guy': { name: 'The Resistance', unlocked: false, colors: ['#2c3e50', '#1a1a1a'] },
            'coffee': { name: 'Caffeine Fiend', unlocked: false, colors: ['#8b4513', '#6b3410'] },
            'controller': { name: 'Little Bro', unlocked: false, colors: ['#9b59b6', '#8e44ad'] },
            'diet-cola': { name: 'Cola Crusader', unlocked: false, colors: ['#e74c3c', '#c0392b'] },
            'dog': { name: 'Good Boy', unlocked: false, colors: ['#8b4513', '#6b3410'] },
            'donut': { name: 'Sprinkles', unlocked: false, colors: ['#daa520', '#ff69b4'] },
            'flame': { name: 'Hot Head', unlocked: false, colors: ['#ff8c00', '#ffd700'] },
            'football': { name: 'MVP', unlocked: false, colors: ['#2ecc71', '#27ae60'] },
            'fries': { name: 'Sir Dips-a-lot', unlocked: false, colors: ['#e74c3c', '#ffd700'] },
            'green-dragon': { name: 'World Muncher', unlocked: false, colors: ['#2ecc71', '#27ae60'] },
            'handheld-game': { name: 'The Pocketeer', unlocked: false, colors: ['#393b32', '#6a7473'] },
            'hotdog': { name: 'Big Dawg', unlocked: false, colors: ['#f8c83f', '#f8c83f'] },
            'infinity-glove': { name: 'Snappy', unlocked: false, colors: ['#6c7dcd', '#6c7dcd'] },
            'kid-car': { name: 'Speed Demon Jr.', unlocked: false, colors: ['#e74c3c', '#c0392b'] },
            'lovecraft': { name: 'Eldritch Horror', unlocked: false, colors: ['#2ecc71', '#27ae60'] },
            'nyan': { name: 'Pastry Cat', unlocked: false, colors: ['#e74c3c', '#ff8c00', '#ffd700', '#2ecc71', '#3498db', '#9b59b6'] },
            'pizza': { name: 'Tony Pep', unlocked: false, colors: ['#f5bf48', '#f39c12'] },
            'potato': { name: 'Spud Bud', unlocked: false, colors: ['#8b4513', '#6b3410'] },
            'racer': { name: 'Speed Demon', unlocked: false, colors: ['#1f2d35', '#e1e7ea'] },
            'ramen': { name: 'Noodle Master', unlocked: false, colors: ['#f3c33e', '#f3c33e'] },
            'red-dragon': { name: 'Ralph', unlocked: false, colors: ['#e74c3c', '#c0392b'] },
            'robot': { name: 'Metal Boi', unlocked: false, colors: ['#95a5a6', '#7f8c8d'] },
            'santa': { name: 'Ho Ho Hose', unlocked: false, colors: ['#e34c4a', '#f2ede1'] },
            'saturn': { name: 'Ring Leader', unlocked: false, colors: ['#ff8c00', '#ff6347'] },
            'skibidi': { name: 'Mr. Swirley', unlocked: false, colors: ['#ecf0f1', '#bdc3c7'] },
            'snake-2': { name: 'Snek II', unlocked: false, colors: ['#78a060', '#5f804c'] },
            'space-cadet': { name: 'Cosmic Ray', unlocked: false, colors: ['#34495e', '#2c3e50'] },
            'tornado': { name: 'Whirlwind', unlocked: false, colors: ['#1790ff', '#3b9cf6'] },
            'tv': { name: 'CRT Surfer', unlocked: false, colors: ['#89b6c7', '#bedeeb'] },
            'unicorn': { name: 'Tres Commas', unlocked: false, colors: ['#ff69b4', '#ffd700'] },
            'brick-man': { name: 'The Special', unlocked: false, colors: ['#ff8c00', '#ff6347'] },
            'buffalo': { name: "Billy Blue", unlocked: false, colors: ['#3498db', '#2980b9'] },
            'clock': { name: 'Time-Out', unlocked: false, colors: ['#8b4513', '#6b3410'] },
            'floral': { name: 'Bo Kay', unlocked: false, colors: ['#2ecc71', '#27ae60'] },
            'gnome': { name: 'World Traveler', unlocked: false, colors: ['#2ecc71', '#27ae60'] },
            'mac': { name: 'Woz', unlocked: false, colors: ['#f5deb3', '#e6d7c3'] },
            'murica': { name: "'Murica", unlocked: false, colors: ['#ecf0f1', '#f2eeed'] },
            'pod-player': { name: 'Poddington', unlocked: false, colors: ['#87ceeb', '#5f9ea0'] },
            'whale': { name: 'Spout', unlocked: false, colors: ['#3498db', '#2980b9'] },
            'ruby': { name: 'Ruby', unlocked: true, colors: ['#87bb4a', '#7aa53f'] },
            'chirpy': { name: 'Chirpy', unlocked: true, colors: ['#8eccdb', '#7db8c7'] },
            'icecream': { name: 'Sir Whirl', unlocked: false, colors: ['#fde3a9', '#fbd692'] },
            'popcorn': { name: 'Colonel Kernel', unlocked: false, colors: ['#39b7ff', '#2aa2e6'] },
            'pixel': { name: 'Pixel', unlocked: false, colors: ['#50b72d', '#46a127'] },
            'midnight': { name: 'Midnight', unlocked: false, colors: ['#474e54', '#3a4147'] },
            'pyraxis': { name: 'Pyraxis the Molten', unlocked: false, colors: ['#ff4444', '#cc0000'], isBoss: true },
            'abyssos': { name: 'Abyssos the Deep One', unlocked: false, colors: ['#4444ff', '#0000cc'], isBoss: true },
            'osseus': { name: 'Osseus the Bone Sovereign', unlocked: false, colors: ['#8b4513', '#654321'], isBoss: true },
            'zephyrus': { name: 'Zephyrus the Storm Caller', unlocked: false, colors: ['#87ceeb', '#5f9ea0'], isBoss: true }
        };
        
        if (window.SKIN_DATA && window.skinIdConverter) {
            const mergedMetadata = {};
            
            Object.keys(skinMetadata).forEach(oldId => {
                mergedMetadata[oldId] = { ...skinMetadata[oldId] };
                
                const newId = window.skinIdConverter.toNewId(oldId);
                if (newId && window.SKIN_DATA[newId]) {
                    mergedMetadata[oldId] = {
                        ...mergedMetadata[oldId],
                        ...window.SKIN_DATA[newId],
                        colors: skinMetadata[oldId].colors,
                        unlocked: skinMetadata[oldId].unlocked
                    };
                }
            });
            
            Object.keys(window.SKIN_DATA).forEach(newId => {
                const oldId = window.skinIdConverter.toOldId(newId);
                if (!oldId || !mergedMetadata[oldId]) {
                    mergedMetadata[newId] = {
                        ...window.SKIN_DATA[newId],
                        unlocked: false,
                        colors: window.SKIN_DATA[newId].colors || ['#888888', '#666666']
                    };
                }
            });
            
            skinMetadata = mergedMetadata;
        }
        
        const aiSkins = Object.keys(skinMetadata).filter(skin => skinMetadata[skin] && !skinMetadata[skin].isBoss);
        let currentPlayerSkin = 'snake-default-green';
        let unlockedSkins = new Set(['snake-default-green', 'chirpy', 'ruby', 'lil-beans']);
        let viewedSkins = new Set(['snake-default-green', 'chirpy', 'ruby', 'lil-beans']);
        let availableUnlocks = 0;
        let skinImages = {};
        
        function loadSkinData() {
            const saved = localStorage.getItem('unlockedSkins');
            if (saved) {
                unlockedSkins = new Set(JSON.parse(saved));
            }
            // Ensure default skins are always unlocked
            const defaultSkins = ['snake-default-green', 'chirpy', 'ruby', 'lil-beans'];
            defaultSkins.forEach(skin => unlockedSkins.add(skin));
            
            const savedViewed = localStorage.getItem('viewedSkins');
            if (savedViewed) {
                viewedSkins = new Set(JSON.parse(savedViewed));
                // Ensure default skins are marked as viewed
                viewedSkins.add('snake-default-green');
                viewedSkins.add('lil-beans');
            }
            
            const savedCurrent = localStorage.getItem('currentSkin');
            if (savedCurrent && unlockedSkins.has(savedCurrent)) {
                currentPlayerSkin = savedCurrent;
                const portrait = document.getElementById('playerPortrait');
                if (portrait) {
                    const fileId = window.skinIdConverter ? (window.skinIdConverter.toOldId(currentPlayerSkin) || currentPlayerSkin) : currentPlayerSkin;
                    if (skinMetadata[currentPlayerSkin] && skinMetadata[currentPlayerSkin].isBoss) {
                        portrait.src = `assets/boss-skins/${fileId}.png`;
                    } else {
                        portrait.src = `skins/${fileId}.png`;
                    }
                    setTimeout(() => {
                        document.dispatchEvent(new Event('skinChanged'));
                        if (window.unifiedMobileUI) {
                            window.unifiedMobileUI.refreshSkin();
                        }
                    }, 500);
                }
            }
            
            for (const skin of unlockedSkins) {
                if (skinMetadata[skin]) {
                    skinMetadata[skin].unlocked = true;
                } else if (window.skinIdConverter) {
                    const oldId = window.skinIdConverter.toOldId(skin);
                    if (oldId && skinMetadata[oldId]) {
                        skinMetadata[oldId].unlocked = true;
                    }
                    const newId = window.skinIdConverter.toNewId(skin);
                    if (newId && skinMetadata[newId]) {
                        skinMetadata[newId].unlocked = true;
                    }
                }
            }
        }
        
        function saveSkinData() {
            localStorage.setItem('unlockedSkins', JSON.stringify(Array.from(unlockedSkins)));
            localStorage.setItem('viewedSkins', JSON.stringify(Array.from(viewedSkins)));
            localStorage.setItem('currentSkin', currentPlayerSkin);
        }
        
        function preloadSkins() {
            const allSkins = Object.keys(skinMetadata);
            allSkins.forEach(skin => {
                const img = new Image();
                
                // Set crossOrigin to ensure we can read image data
                img.crossOrigin = 'anonymous';
                
                img.onload = function() {
                    // Force the browser to decode the image to ensure dimensions are available
                    if (this.decode) {
                        this.decode().catch(() => {
                            gameLogger.warn('ASSETS', `Failed to decode skin: ${skin}`);
                        });
                    }
                };
                
                img.onerror = function() {
                    gameLogger.warn('ASSETS', `Failed to load skin: ${skin}.png`);
                    this.error = true;
                };
                
                // Use old ID for file path if available
                const fileId = window.skinIdConverter ? (window.skinIdConverter.toOldId(skin) || skin) : skin;
                if (skinMetadata[skin].isBoss) {
                    img.src = `assets/boss-skins/${fileId}.png`;
                } else {
                    img.src = `skins/${fileId}.png`;
                }
                skinImages[skin] = img;
            });
            
            // Also preload boss skins that are not in skinMetadata
            const bossSkins = Object.values(BOSS_TYPES).map(boss => boss.skin);
            bossSkins.forEach(skin => {
                if (!skinImages[skin]) { // Only load if not already loaded
                    const img = new Image();
                    
                    // Set crossOrigin to ensure we can read image data
                    img.crossOrigin = 'anonymous';
                    
                    img.onload = function() {
                        gameLogger.info('ASSETS', `Boss skin loaded: ${skin} (${this.width}x${this.height})`);
                        // Force the browser to decode the image to ensure dimensions are available
                        if (this.decode) {
                            this.decode().catch(() => {
                                gameLogger.warn('ASSETS', `Failed to decode boss skin: ${skin}`);
                            });
                        }
                    };
                    
                    img.onerror = function() {
                        gameLogger.warn('ASSETS', `Failed to load boss skin: ${skin}.png`);
                        this.error = true;
                    };
                    
                    // Boss skins use their direct names in the boss-skins directory
                    img.src = `assets/boss-skins/${skin}.png`;
                    skinImages[skin] = img;
                }
            });
        }
        
        function calculateAvailableUnlocks() {
            let unlocks = 0;
            if (highScore >= 50000) unlocks++;
            if (highScore >= 100000) unlocks++;
            if (highScore >= 150000) unlocks++;
            if (highScore > 150000) {
                unlocks += Math.floor((highScore - 150000) / 250000);
            }
            
            const alreadyUnlocked = unlockedSkins.size - 1;
            availableUnlocks = Math.max(0, unlocks - alreadyUnlocked);
            return availableUnlocks;
        }
        
        function loadAllTimeDiscoveries() {
            const saved = localStorage.getItem('allTimeDiscoveries');
            if (saved) {
                const data = JSON.parse(saved);
                allTimeDiscoveries = new Map(data);
            } else {
                allTimeDiscoveries.set(0, 'Base Element');
                allTimeDiscoveries.set(1, 'Base Element');
                allTimeDiscoveries.set(2, 'Base Element');
                allTimeDiscoveries.set(3, 'Base Element');
                saveAllTimeDiscoveries();
            }
        }
        
        function saveAllTimeDiscoveries() {
            const data = Array.from(allTimeDiscoveries.entries());
            localStorage.setItem('allTimeDiscoveries', JSON.stringify(data));
        }
        
        let currentTrack = null;
        let musicVolume = 0.3;
        let musicMuted = false;
        let musicShouldBePlaying = false;
        const musicTracks = [
            'astral-float.mp3',
            'cruising-through-the-asteroid-rain.mp3',
            'exploding-sun.mp3',
            'space-main-theme.mp3',
            'milky-way.mp3'
        ];
        const cozyMusicTracks = [
            'cozy-music/astral-ballad.mp3',
            'cozy-music/celestial-sonnet.mp3',
            'cozy-music/ethereal-hymn.mp3',
            'cozy-music/galactic-ode.mp3',
            'cozy-music/intersellar-elegy.mp3',
            'cozy-music/nebula-nocturne.mp3',
            'cozy-music/solar-serenade.mp3',
            'cozy-music/universal-verse.mp3',
            'cozy-music/whispering-cosmos.mp3'
        ];
        let availableTracks = [];
        
        const keys = {};
        let mouseAngle = 0;
        let mouseDown = false;
        let mouseMovedRecently = false;
        let mouseMovedTimer = null;
        
        let combinationAnimationState = {
            isAnimating: false,
            combiningIndices: [],
            animationStartTime: 0,
            newElementIndex: -1
        };
        
        let joystickActive = false;
        let joystickBase = { x: 0, y: 0 };
        let joystickKnob = { x: 0, y: 0 };
        
        window.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            if (e.key === 'p' || e.key === 'P') {
                togglePause();
            }
            if (e.key === 'm' || e.key === 'M') {
                toggleMusic();
            }
            
            
            if (window.pendingMusicTrack && !musicMuted) {
                window.pendingMusicTrack.play().then(() => {
                }).catch(err => {
                    gameLogger.error('AUDIO', 'Failed to resume music:', err);
                });
                window.pendingMusicTrack = null;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            if (controlScheme === 'mouse' && playerSnake) {
                const rect = canvas.getBoundingClientRect();
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                mouseAngle = Math.atan2(mouseY - centerY, mouseX - centerX);
                
                mouseMovedRecently = true;
                
                if (mouseMovedTimer) {
                    clearTimeout(mouseMovedTimer);
                }
                
                mouseMovedTimer = setTimeout(() => {
                    mouseMovedRecently = false;
                }, 1000); // Reset after 1 second of no mouse movement
            }
        });
        
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click
                mouseDown = true;
                
                // Spawn shooting star on click (like in demo)
                if (gameStarted) {
                    shootingStars.push(new ShootingStar());
                }
            }
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) { // Left click
                mouseDown = false;
            }
        });
        
        // Touch event for mobile audio resume
        window.addEventListener('touchstart', (e) => {
            // Resume pending music on first touch interaction
            if (window.pendingMusicTrack && !musicMuted) {
                window.pendingMusicTrack.play().then(() => {
                    currentTrack = window.pendingMusicTrack;
                    window.pendingMusicTrack = null;
                }).catch(err => {
                    gameLogger.error('AUDIO', 'Failed to resume music on touch:', err);
                });
            }
            
            // Also try to resume if music should be playing but isn't
            if (musicShouldBePlaying && !musicMuted && gameStarted && !currentTrack && !bossEncounterActive) {
                playRandomTrack();
            }
            
            // Safari-specific: Try to play current track if it exists but is paused
            if (currentTrack && currentTrack.paused && !musicMuted && gameStarted && !bossEncounterActive) {
                currentTrack.play().catch(err => {
                    gameLogger.error('AUDIO', 'Safari: Failed to resume paused music on touch:', err);
                });
            }
        }, { passive: true });
        
        // Initialize player name input when DOM is ready
        function initializePlayerNameInput() {
            const playerNameInput = document.getElementById('playerNameInput');
            let playerName = localStorage.getItem('playerName');
            let isGeneratedName = false;
            
            // Generate random name if none exists
            if (!playerName) {
                if (window.nameGenerator) {
                    playerName = window.nameGenerator.generateRandomName();
                    isGeneratedName = true;
                } else {
                    // Fallback if nameGenerator not loaded yet
                    playerName = 'Player' + Math.floor(Math.random() * 10000);
                    isGeneratedName = true;
                }
            }
            
            // Set the input value
            if (playerNameInput && playerName) {
                playerNameInput.value = playerName;
            }
            
            // Clear input on focus if it's a generated name
            if (playerNameInput) {
                playerNameInput.addEventListener('focus', function() {
                    if (isGeneratedName && this.value === playerName) {
                        this.value = '';
                    }
                });
                
                // Save name on blur
                playerNameInput.addEventListener('blur', function() {
                    if (this.value.trim()) {
                        localStorage.setItem('playerName', this.value.trim());
                        isGeneratedName = false;
                    }
                });
            }
        }
        
        // Call initialization after a small delay to ensure nameGenerator is loaded
        setTimeout(initializePlayerNameInput, 100);
        
        // Update placeholder with random names
        function updateNamePlaceholder() {
            const playerNameInput = document.getElementById('playerNameInput');
            if (playerNameInput && window.nameGenerator && !playerNameInput.value) {
                playerNameInput.placeholder = window.nameGenerator.generateRandomName();
            }
        }
        
        // Start updating placeholder after nameGenerator loads
        setTimeout(() => {
            updateNamePlaceholder();
            setInterval(updateNamePlaceholder, 3000); // Change every 3 seconds
        }, 200);
        
        // Welcome modal functionality
        function checkAndShowWelcomeModal() {
            // Get session tracking data
            let sessionCount = parseInt(localStorage.getItem('sessionCount') || '0');
            const lastWelcomeShown = parseInt(localStorage.getItem('lastWelcomeShown') || '0');
            
            // Increment session count
            sessionCount++;
            localStorage.setItem('sessionCount', sessionCount.toString());
            
            // Show modal if:
            // 1. First time player (sessionCount === 1)
            // 2. Every 5 sessions after the last shown
            const shouldShowWelcome = (sessionCount === 1) || 
                                    (sessionCount - lastWelcomeShown >= 5);
            
            if (shouldShowWelcome) {
                // Update last shown
                localStorage.setItem('lastWelcomeShown', sessionCount.toString());
                
                // Show the modal
                const modal = document.getElementById('welcomeModal');
                if (modal) {
                    modal.style.display = 'flex';
                    
                    // Setup close handlers
                    setupWelcomeModalHandlers();
                }
            }
        }
        
        // Setup welcome modal event handlers
        function setupWelcomeModalHandlers() {
            const modal = document.getElementById('welcomeModal');
            const closeBtn = modal.querySelector('.welcome-modal-close');
            const overlay = modal.querySelector('.welcome-modal-overlay');
            
            // Close function
            const closeModal = () => {
                playUISound();
                modal.style.display = 'none';
            };
            
            // Close button click
            if (closeBtn) {
                closeBtn.onclick = closeModal;
            }
            
            // Overlay click
            if (overlay) {
                overlay.onclick = closeModal;
            }
            
            // Prevent clicks on content from closing
            const content = modal.querySelector('.welcome-modal-content');
            if (content) {
                content.onclick = (e) => e.stopPropagation();
            }
        }
        
        // Make it globally available
        window.checkAndShowWelcomeModal = checkAndShowWelcomeModal;
        
        // Splash screen - wait for DOM to be ready
        function setupStartButton() {
            const startButton = document.getElementById('startButton');
            if (!startButton) {
                console.error('Start button not found');
                return;
            }
            
            startButton.addEventListener('click', async () => {
                playUISound();
                
                // Save player name
                const nameInput = document.getElementById('playerNameInput');
                if (nameInput) {
                    let name = nameInput.value.trim();
                    if (!name && window.nameGenerator && window.nameGenerator.generateRandomName) {
                        name = window.nameGenerator.generateRandomName();
                    } else if (!name) {
                        // Fallback if nameGenerator isn't loaded yet
                        name = 'Player' + Math.floor(Math.random() * 9999);
                    }
                localStorage.setItem('playerName', name);
                window.currentPlayerName = name;
            }
            
            // Ensure assets are loaded
            if (window.assetLoadingPromise && !window.assetsReady) {
                const loadingText = document.getElementById('loadingText');
                if (loadingText) {
                    loadingText.style.display = 'inline';
                    loadingText.textContent = 'Finishing asset loading...';
                }
                
                try {
                    await window.assetLoadingPromise;
                } catch (error) {
                    gameLogger.error('ASSETS', 'Asset loading failed:', error);
                }
                
                if (loadingText) {
                    loadingText.style.display = 'none';
                }
            }
            
            // Check if mobile and initialize renderers
            if (isTabletOrMobile()) {
                try {
                    await initializeMobileRenderers();
                } catch (error) {
                    gameLogger.error('MOBILE', 'Failed to initialize mobile renderers:', error);
                }
            } else {
                // Desktop: Initialize assets and hide splash screen
                await initializeAssets();
                
                document.getElementById('splashScreen').style.opacity = '0';
                setTimeout(() => {
                    document.getElementById('splashScreen').style.display = 'none';
                    document.getElementById('gameModeSelect').style.display = 'block';
                    // Fade in game mode select
                    setTimeout(() => {
                        document.getElementById('gameModeSelect').style.opacity = '1';
                    }, 50);
                }, 300);
            }
        });
        }
        
        // Setup start button when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupStartButton);
        } else {
            setupStartButton();
        }
        
        // Game mode selection
        function selectGameMode(mode) {
            playUISound();
            gameMode = mode;
            window.gameMode = gameMode; // Expose globally for Snake.js access
            
            // Track game mode selection
            if (window.GameAnalyticsWrapper) {
                window.GameAnalyticsWrapper.setGameMode(mode);
                window.GameAnalyticsWrapper.trackEvent('design', `mode:selected:${mode}`, 1);
            }
            
            // Classic mode has no target, ends on permadeath
            // Infinite mode has no target, continues forever
            gameTarget = 0;
            
            // Set default control scheme to mouse
            controlScheme = 'mouse';
            
            // Apply purple background immediately for cozy mode (desktop and mobile)
            if (gameMode === 'cozy') {
                document.body.style.backgroundImage = "url('/assets/background/purple-bg.png')";
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center center";
                document.body.style.backgroundRepeat = "no-repeat";
                document.body.style.backgroundAttachment = "fixed";
                document.body.style.minHeight = "100vh";
                
                // For Safari: Try to start music immediately on user interaction
                if (!currentTrack && !musicMuted) {
                    // Pre-initialize available tracks for cozy mode
                    availableTracks = [...cozyMusicTracks];
                    // Try to play music now while we have user interaction
                    playRandomTrack();
                }
            } else {
                // Reset background for other modes
                document.body.style.backgroundImage = "";
            }
            
            // Start the game immediately
            startGameTransition();
        }
        
        // Keep old function for compatibility but redirect to new one
        function selectVictoryMode(mode, target) {
            selectGameMode('infinite');
        }
        
        function startGameTransition() {
            const gameModeSelect = document.getElementById('gameModeSelect');
            const gameCanvas = document.getElementById('gameCanvas');
            
            // Add transition styles
            gameCanvas.style.transition = 'opacity 0.3s ease-in';
            gameCanvas.style.opacity = '0';
            
            // Fade out game mode select
            gameModeSelect.style.opacity = '0';
            
            setTimeout(() => {
                gameModeSelect.style.display = 'none';
                stopGame(); // Ensure clean state before starting
                startGame();
                
                // Show canvas and UI
                setTimeout(() => {
                    gameCanvas.style.opacity = '1';
                    document.getElementById('ui').style.opacity = '1';
                    
                    // Hide scoreboard and modify player stats in cozy mode
                    if (gameMode === 'cozy') {
                        const leaderboardBox = document.getElementById('leaderboardBox');
                        if (leaderboardBox) {
                            leaderboardBox.style.display = 'none';
                        }
                        
                        // Hide Kills and Best Rank stat lines
                        const killsStatLine = document.getElementById('playerKills')?.parentElement;
                        const bestRankStatLine = document.getElementById('playerBestRank')?.parentElement;
                        
                        if (killsStatLine) {
                            killsStatLine.style.display = 'none';
                        }
                        if (bestRankStatLine) {
                            bestRankStatLine.style.display = 'none';
                        }
                        
                        // Background is already applied in selectGameMode
                    }
                }, 100);
            }, 300);
        }
        
        function selectControls(scheme) {
            controlScheme = scheme;
            // Use the same simplified transition
            startGameTransition();
        }
        
        // Load snake names
        async function loadSnakeNames() {
            try {
                const response = await fetch('snake-names.json');
                const data = await response.json();
                snakeNameData = data;
            } catch (error) {
                gameLogger.error('ASSETS', 'Failed to load snake names:', error);
                // Fallback data
                snakeNameData = {
                    firstParts: ['Sir', 'Lord', 'Captain', 'Master', 'Swift', 'Mighty', 'Sneaky'],
                    secondParts: ['Slithers', 'McSlitherface', 'the Magnificent', 'Noodle', 'Supreme']
                };
            }
        }
        
        // Generate random snake name
        function generateSnakeName() {
            if (!snakeNameData) {
                return `Snake${Math.floor(Math.random() * 1000)}`;
            }
            const first = snakeNameData.firstParts[Math.floor(Math.random() * snakeNameData.firstParts.length)];
            const second = snakeNameData.secondParts[Math.floor(Math.random() * snakeNameData.secondParts.length)];
            return `${first} ${second}`;
        }
        
        // Load element database
        async function loadElements() {
            try {
                // Wait for the new element system to load
                if (!window.elementLoader || !window.elementLoader.isLoaded || !window.elementLoader.isLoaded()) {
                    // Wait for elementsLoaded event
                    await new Promise((resolve) => {
                        window.addEventListener('elementsLoaded', resolve, { once: true });
                    });
                }
                
                
                // Create minimal elementDatabase for compatibility
                elementDatabase = {
                    fire: { emoji: '🔥', name: 'Fire', tier: 0, base: true },
                    water: { emoji: '💧', name: 'Water', tier: 0, base: true },
                    earth: { emoji: '🌍', name: 'Earth', tier: 0, base: true },
                    air: { emoji: '💨', name: 'Air', tier: 0, base: true }
                };
            } catch (error) {
                gameLogger.error('ASSETS', 'Failed to load elements:', error);
                // Fallback to basic elements
                elementDatabase = {
                    fire: { emoji: '🔥', name: 'Fire', tier: 0, base: true },
                    water: { emoji: '💧', name: 'Water', tier: 0, base: true },
                    earth: { emoji: '🌍', name: 'Earth', tier: 0, base: true },
                    air: { emoji: '💨', name: 'Air', tier: 0, base: true }
                };
            }
        }
        
        // Sound effects
        const eatSounds = [];
        const explosionSounds = [];
        let soundIndex = 0;
        let lastExplosionSoundTime = 0;
        const EXPLOSION_SOUND_COOLDOWN = 100; // 100ms cooldown between explosion sounds
        
        function initSoundEffects() {
            // Create multiple audio instances for overlapping sounds
            for (let i = 0; i < 5; i++) {
                const eatSound = new Audio('sounds/blip.mp3');
                eatSound.volume = 0.3125; // 31.25% volume (increased by 25%)
                eatSounds.push(eatSound);
                
                const explosionSound = new Audio('sounds/fire-impact.mp3');
                explosionSound.volume = 0.75; // 75% volume
                explosionSounds.push(explosionSound);
            }
        }
        
        function playEatSound() {
            if (!musicMuted && eatSounds.length > 0) {
                // Use round-robin to cycle through sound instances
                const sound = eatSounds[soundIndex % eatSounds.length];
                soundIndex++;
                
                // Reset the sound to start
                sound.currentTime = 0;
                sound.volume = 0.25; // Reduced by 50% from 0.5
                
                // Try to play
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            }
        }
        
        function playExplosionSound(isPlayerInvolved = true) {
            if (!musicMuted && explosionSounds.length > 0) {
                // Check cooldown - only apply to AI-only explosions
                const currentTime = Date.now();
                if (!isPlayerInvolved && currentTime - lastExplosionSoundTime < EXPLOSION_SOUND_COOLDOWN) {
                    return; // Skip this sound due to cooldown
                }
                
                // Update last explosion time
                lastExplosionSoundTime = currentTime;
                
                // Use round-robin to cycle through sound instances
                const sound = explosionSounds[soundIndex % explosionSounds.length];
                soundIndex++;
                
                // Reset the sound to start
                sound.currentTime = 0;
                // Set volume based on whether player is involved
                sound.volume = isPlayerInvolved ? 0.75 : 0.1; // 75% for player, 10% for AI only
                
                // Try to play
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            }
        }
        
        // Power-up sound pools
        const voidOrbSounds = [];
        const alchemyVisionSounds = [];
        const catalystGemSounds = [];
        const boostSounds = [];
        
        function initPowerUpSounds() {
            // Create multiple instances for overlapping sounds
            for (let i = 0; i < 3; i++) {
                // Void Orb sound
                const voidSound = new Audio('sounds/magic-energy-whoosh.mp3');
                voidSound.volume = 0.6;
                voidOrbSounds.push(voidSound);
                
                // Alchemy Vision sound
                const alchemySound = new Audio('sounds/magma-roar.mp3');
                alchemySound.volume = 0.7;
                alchemyVisionSounds.push(alchemySound);
                
                // Catalyst Gem sound
                const catalystSound = new Audio('sounds/power-surge.mp3');
                catalystSound.volume = 0.6;
                catalystGemSounds.push(catalystSound);
                
                // Boost sound
                const boostSound = new Audio('sounds/whoosh-burst.mp3');
                boostSound.volume = 0.5;
                boostSounds.push(boostSound);
            }
        }
        
        function playVoidOrbSound(isPlayerInvolved = true) {
            if (!musicMuted && voidOrbSounds.length > 0) {
                const sound = voidOrbSounds[soundIndex % voidOrbSounds.length];
                soundIndex++;
                sound.currentTime = 0;
                // Set volume based on whether player is involved
                sound.volume = isPlayerInvolved ? 0.6 : 0.15; // 60% for player, 15% for AI
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            }
        }
        
        function playAlchemyVisionSound(isPlayerInvolved = true) {
            if (!musicMuted && alchemyVisionSounds.length > 0) {
                const sound = alchemyVisionSounds[soundIndex % alchemyVisionSounds.length];
                soundIndex++;
                sound.currentTime = 0;
                // Set volume based on whether player is involved
                sound.volume = isPlayerInvolved ? 0.7 : 0.2; // 70% for player, 20% for AI
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            }
        }
        
        function playCatalystGemSound(isPlayerInvolved = true) {
            if (!musicMuted && catalystGemSounds.length > 0) {
                const sound = catalystGemSounds[soundIndex % catalystGemSounds.length];
                soundIndex++;
                sound.currentTime = 0;
                // Set volume based on whether player is involved
                sound.volume = isPlayerInvolved ? 0.6 : 0.15; // 60% for player, 15% for AI
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            }
        }
        
        function playBoostSound(isPlayerInvolved = true) {
            // Only play sound for player, not AI
            if (!musicMuted && boostSounds.length > 0 && isPlayerInvolved) {
                const sound = boostSounds[soundIndex % boostSounds.length];
                soundIndex++;
                sound.currentTime = 0;
                // Reduced volume by 25% (from 0.5 to 0.375)
                sound.volume = 0.375;
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            }
        }
        
        // Combination sound array
        let combinationSounds = [];
        
        function initCombinationSounds() {
            // Use the 8-bit blip sound for combinations
            for (let i = 0; i < 3; i++) {
                const sound = new Audio('sounds/8-bit-blip.mp3');
                sound.volume = 0.5;
                combinationSounds.push(sound);
            }
        }
        
        function playCombinationSound() {
            if (!musicMuted && combinationSounds.length > 0) {
                const sound = combinationSounds[soundIndex % combinationSounds.length];
                soundIndex++;
                sound.currentTime = 0;
                sound.volume = 0.7; // Always play at good volume for player combinations
                const playPromise = sound.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {});
                }
            }
        }
        
        function createCombinationFlash() {
            // Create flash overlay
            const flash = document.createElement('div');
            flash.className = 'combination-flash';
            document.body.appendChild(flash);
            
            // Remove after animation completes
            setTimeout(() => {
                flash.remove();
            }, 500);
        }
        
        // Music functions
        function initMusic() {
            // Don't start music if it's already playing (Safari fix)
            if (currentTrack && !currentTrack.paused) {
                return;
            }
            
            // Check which tracks are available
            checkAvailableTracks().then(() => {
                if (availableTracks.length > 0) {
                    playRandomTrack();
                }
            });
        }
        
        async function checkAvailableTracks() {
            // For now, assume all tracks are available
            availableTracks = gameMode === 'cozy' ? [...cozyMusicTracks] : [...musicTracks];
            return true;
        }
        
        let isPlayingNext = false; // Prevent multiple simultaneous calls
        
        function playRandomTrack() {
            // Prevent multiple simultaneous calls
            if (isPlayingNext) {
                return;
            }
            isPlayingNext = true;
            
            // Set flag that music should be playing
            musicShouldBePlaying = true;
            
            // Refill available tracks if empty
            if (availableTracks.length === 0) {
                availableTracks = gameMode === 'cozy' ? [...cozyMusicTracks] : [...musicTracks];
            }
            
            // Stop current track if playing
            let oldTrack = null;
            if (currentTrack && currentTrack.stopRequested !== true) {
                // Mark that we're stopping this track intentionally
                currentTrack.stopRequested = true;
                // Remove all event listeners to prevent them from firing
                currentTrack.removeEventListener('ended', currentTrack.endedHandler);
                currentTrack.removeEventListener('error', currentTrack.errorHandler);
                currentTrack.pause();
                // Don't clear src as it can trigger ended event
                oldTrack = currentTrack; // Keep reference to old track
            }
            
            // Pick random track
            const randomIndex = Math.floor(Math.random() * availableTracks.length);
            const trackName = availableTracks[randomIndex];
            
            // Remove the selected track from available tracks
            availableTracks.splice(randomIndex, 1);
            
            // Create audio element - cozy tracks already have path, others need music/ prefix
            const audioPath = gameMode === 'cozy' ? `music/${trackName}` : `music/${trackName}`;
            currentTrack = new Audio(audioPath);
            currentTrack.volume = musicMuted ? 0 : musicVolume;
            
            // Create event handlers that we can reference later for removal
            currentTrack.endedHandler = function() {
                // Reset the playing flag first
                isPlayingNext = false;
                
                // Only play next if the track wasn't stopped intentionally and actually ended
                if (!this.stopRequested && this.currentTime > 0 && this.duration > 0 && this.currentTime >= this.duration - 0.5) {
                    setTimeout(() => {
                        try {
                            playRandomTrack();
                        } catch (error) {
                            gameLogger.error('AUDIO', 'Error playing next track:', error);
                            // Try again in a few seconds
                            setTimeout(playRandomTrack, 3000);
                        }
                    }, 1000); // Wait 1 second before next track
                } else {
                }
            };
            
            currentTrack.errorHandler = (e) => {
                gameLogger.error('AUDIO', 'Error loading track:', trackName, e);
                // Reset the playing flag
                isPlayingNext = false;
                // Try next track after a short delay
                setTimeout(() => {
                    playRandomTrack();
                }, 1000);
            };
            
            // Add event listeners
            currentTrack.addEventListener('ended', currentTrack.endedHandler);
            currentTrack.addEventListener('error', currentTrack.errorHandler);
            
            // Try to play
            const playPromise = currentTrack.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    isPlayingNext = false; // Reset flag on success
                    // Clear old track reference now that new one is playing
                    if (oldTrack) {
                        oldTrack = null;
                    }
                }).catch(e => {
                    gameLogger.error('AUDIO', 'Failed to play track:', trackName, e);
                    // Store track to retry on user interaction
                    window.pendingMusicTrack = currentTrack;
                    isPlayingNext = false; // Reset flag on error
                    
                    // Safari-specific: Set flag to ensure music plays on next interaction
                    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
                        musicShouldBePlaying = true;
                    }
                });
            } else {
                isPlayingNext = false; // Reset flag if no promise
                // Clear old track reference
                if (oldTrack) {
                    oldTrack = null;
                }
            }
        }
        
        window.toggleMusic = function() {
            musicMuted = !musicMuted;
            
            // Update desktop mute text
            const muteText = document.getElementById('muteText');
            if (muteText) {
                muteText.textContent = musicMuted ? 'M to Unmute' : 'M to Mute';
            }
            
            // Update mobile mute button
            const mobileMuteButton = document.getElementById('muteButtonMobile');
            if (mobileMuteButton) {
                mobileMuteButton.textContent = musicMuted ? '🔊' : '🔇';
            }
            
            if (musicMuted) {
                // Clear music should be playing flag when muting
                musicShouldBePlaying = false;
                if (currentTrack) {
                    currentTrack.pause();
                }
                // Also pause boss music
                if (bossIntroMusic) {
                    bossIntroMusic.pause();
                }
                if (bossBattleMusic) {
                    bossBattleMusic.pause();
                }
            } else {
                // Set music should be playing flag when unmuting
                musicShouldBePlaying = true;
                if (currentTrack && gameStarted && !bossEncounterActive) {
                    currentTrack.volume = musicVolume;
                    currentTrack.play().catch(() => {});
                }
                // Resume boss music if boss encounter is active
                if (bossEncounterActive) {
                    if (bossIntroMusic && !bossIntroMusic.ended) {
                        bossIntroMusic.volume = 0.7 * musicVolume;
                        bossIntroMusic.play().catch(() => {});
                    } else if (bossBattleMusic && currentBoss && currentBoss.alive) {
                        bossBattleMusic.volume = 0.6 * musicVolume;
                        bossBattleMusic.play().catch(() => {});
                    }
                }
            }
        };
        
        window.changeVolume = function(value) {
            musicVolume = value / 100;
            document.getElementById('volumeDisplay').textContent = value + '%';
            
            if (!musicMuted) {
                if (currentTrack) {
                    currentTrack.volume = musicVolume;
                }
                // Also update boss music volume
                if (bossIntroMusic) {
                    bossIntroMusic.volume = 0.7 * musicVolume;
                }
                if (bossBattleMusic) {
                    bossBattleMusic.volume = 0.6 * musicVolume;
                }
            }
        };
        
        // Audio Lifecycle Management - Fix iOS background audio issue
        let audioWasPlaying = {
            music: false,
            bossIntro: false,
            bossBattle: false
        };
        
        // Pause all audio sources
        function pauseAllAudio() {
            
            // Track what was playing
            audioWasPlaying.music = currentTrack && !currentTrack.paused;
            audioWasPlaying.bossIntro = bossIntroMusic && !bossIntroMusic.paused;
            audioWasPlaying.bossBattle = bossBattleMusic && !bossBattleMusic.paused;
            
            gameLogger.debug('AUDIO', 'Audio state before pause:', {
                music: audioWasPlaying.music,
                bossIntro: audioWasPlaying.bossIntro,
                bossBattle: audioWasPlaying.bossBattle,
                currentTrack: currentTrack ? 'exists' : 'null',
                gameStarted,
                musicMuted
            });
            
            // Pause everything
            if (currentTrack) {
                currentTrack.pause();
            }
            if (bossIntroMusic) {
                bossIntroMusic.pause();
            }
            if (bossBattleMusic) {
                bossBattleMusic.pause();
            }
            
            // Also pause any sound effects
            if (window.eatSounds) {
                eatSounds.forEach(sound => {
                    if (sound && !sound.paused) {
                        sound.pause();
                    }
                });
            }
        }
        
        // Resume audio that was playing before
        let resumeAttempts = 0;
        const MAX_RESUME_ATTEMPTS = 3;
        
        function resumeAudio() {
            
            // Check if music should be playing even if it wasn't actively playing
            const shouldAttemptResume = (audioWasPlaying.music || musicShouldBePlaying) || 
                                       audioWasPlaying.bossIntro || 
                                       audioWasPlaying.bossBattle;
            
            if (!shouldAttemptResume) {
                return;
            }
            
            // Resume background music if it should be playing and audio is not muted
            if ((audioWasPlaying.music || musicShouldBePlaying) && !musicMuted && gameStarted && !bossEncounterActive) {
                if (currentTrack) {
                    const playPromise = currentTrack.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            audioWasPlaying.music = false;
                            resumeAttempts = 0;
                        }).catch(error => {
                            gameLogger.error('AUDIO', 'Failed to resume background music:', error);
                            
                            // Retry with exponential backoff
                            if (resumeAttempts < MAX_RESUME_ATTEMPTS) {
                                resumeAttempts++;
                                const delay = Math.pow(2, resumeAttempts) * 500; // 500ms, 1s, 2s
                                
                                setTimeout(() => {
                                    // Check if conditions still valid before retry
                                    if (audioWasPlaying.music && currentTrack && !musicMuted && gameStarted) {
                                        resumeAudio();
                                    }
                                }, delay);
                            } else {
                                audioWasPlaying.music = false;
                                resumeAttempts = 0;
                            }
                        });
                    }
                } else if (window.pendingMusicTrack && !musicMuted) {
                    // Try to play the pending track
                    const playPromise = window.pendingMusicTrack.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            currentTrack = window.pendingMusicTrack;
                            window.pendingMusicTrack = null;
                        }).catch(error => {
                            gameLogger.error('AUDIO', 'Failed to play pending music track:', error);
                            // Try starting a new track instead
                            if (gameStarted && !musicMuted) {
                                playRandomTrack();
                            }
                        });
                    }
                    audioWasPlaying.music = false;
                } else {
                    // If no current track but music should be playing, start a new one
                    if (gameStarted && !musicMuted && musicShouldBePlaying) {
                        playRandomTrack();
                    }
                    audioWasPlaying.music = false;
                }
            }
            
            // Resume boss music if in boss encounter and audio is not muted
            if (bossEncounterActive && !musicMuted) {
                if (audioWasPlaying.bossIntro && bossIntroMusic && !bossIntroMusic.ended) {
                    bossIntroMusic.play().then(() => {
                        audioWasPlaying.bossIntro = false;
                    }).catch(error => {
                        gameLogger.error('AUDIO', 'Failed to resume boss intro music:', error);
                        audioWasPlaying.bossIntro = false;
                    });
                } else if (audioWasPlaying.bossBattle && bossBattleMusic) {
                    bossBattleMusic.play().then(() => {
                        audioWasPlaying.bossBattle = false;
                    }).catch(error => {
                        gameLogger.error('AUDIO', 'Failed to resume boss battle music:', error);
                        audioWasPlaying.bossBattle = false;
                    });
                }
            }
        }
        
        // Stop all audio completely
        function stopAllAudio() {
            // Clear music should be playing flag
            musicShouldBePlaying = false;
            
            // Stop and clear current track
            if (currentTrack) {
                currentTrack.pause();
                currentTrack.currentTime = 0;
                if (currentTrack.endedHandler) {
                    currentTrack.removeEventListener('ended', currentTrack.endedHandler);
                }
                if (currentTrack.errorHandler) {
                    currentTrack.removeEventListener('error', currentTrack.errorHandler);
                }
                currentTrack = null;
            }
            
            // Stop boss music
            if (bossIntroMusic) {
                bossIntroMusic.pause();
                bossIntroMusic.currentTime = 0;
                bossIntroMusic = null;
            }
            if (bossBattleMusic) {
                bossBattleMusic.pause();
                bossBattleMusic.currentTime = 0;
                bossBattleMusic = null;
            }
            
            // Stop all sound effects
            if (window.eatSounds) {
                eatSounds.forEach(sound => {
                    if (sound) {
                        sound.pause();
                        sound.currentTime = 0;
                    }
                });
            }
        }
        
        // Debounce mechanism for visibility changes
        let visibilityChangeTimeout = null;
        let lastVisibilityState = document.hidden;
        
        function handleVisibilityChange() {
            // Clear any pending visibility change
            if (visibilityChangeTimeout) {
                clearTimeout(visibilityChangeTimeout);
            }
            
            const isHidden = document.hidden;
            
            // Only act if state actually changed
            if (isHidden !== lastVisibilityState) {
                lastVisibilityState = isHidden;
                
                if (isHidden) {
                    pauseAllAudio();
                } else {
                    // Debounce the resume to avoid rapid pause/resume cycles
                    visibilityChangeTimeout = setTimeout(() => {
                        resumeAudio();
                    }, 300);
                }
            }
        }
        
        // Visibility API handlers
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // iOS-specific handlers (fallback for Safari)
        let blurTimeout = null;
        
        window.addEventListener('blur', () => {
            // Only pause if document is actually hidden
            // This prevents false positives from dev tools, etc
            blurTimeout = setTimeout(() => {
                if (document.hidden) {
                    pauseAllAudio();
                }
            }, 200);
        });
        
        window.addEventListener('focus', () => {
            // Clear any pending blur timeout
            if (blurTimeout) {
                clearTimeout(blurTimeout);
                blurTimeout = null;
            }
            
            // Small delay to ensure proper state
            setTimeout(() => {
                if (!document.hidden) {
                    resumeAudio();
                }
            }, 300);
        });
        
        // Page hide/show events (iOS Safari specific)
        window.addEventListener('pagehide', () => {
            pauseAllAudio();
        });
        
        window.addEventListener('pageshow', (event) => {
            // Check if page is being restored from cache
            if (!event.persisted) {
                resumeAudio();
            }
        });
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            stopAllAudio();
        });
        
        // Also handle unload event as fallback
        window.addEventListener('unload', () => {
            stopAllAudio();
        });
        
        // Debug function to reset discoveries
        window.resetDiscoveries = function() {
            // Clear from localStorage
            localStorage.removeItem('discoveredElements');
            localStorage.removeItem('allTimeDiscoveries');
            
            // Clear in-game discoveries
            discoveredElements = new Set([0, 1, 2, 3]); // Earth, Water, Air, Fire IDs
            playerDiscoveredElements = new Set([0, 1, 2, 3]); // Player starts with base elements
            allTimeDiscoveries = new Map();
            
            // Update UI
            updateDiscoveryLog();
            
            return 'Discoveries reset successfully';
        };
        
        // Border particle class
        class BorderParticle {
            constructor(x, y, edge) {
                this.x = x;
                this.y = y;
                this.edge = edge; // 'left', 'right', 'top', 'bottom'
                this.baseX = x;
                this.baseY = y;
                this.size = Math.random() * 3 + 1;
                this.speed = Math.random() * 0.5 + 0.1;
                this.offset = Math.random() * Math.PI * 2;
                this.opacity = Math.random() * 0.5 + 0.3;
                this.color = this.getRandomColor();
            }
            
            getRandomColor() {
                const colors = [
                    'rgba(147, 51, 234, ', // purple
                    'rgba(236, 72, 153, ', // pink
                    'rgba(59, 130, 246, ', // blue
                    'rgba(168, 85, 247, ', // purple-pink
                    'rgba(99, 102, 241, '  // indigo
                ];
                return colors[Math.floor(Math.random() * colors.length)];
            }
            
            update(deltaTime) {
                const time = animationTime + this.offset;
                
                // Float in circular motion
                const radius = 15;
                const floatX = Math.cos(time * this.speed) * radius;
                const floatY = Math.sin(time * this.speed * 0.7) * radius;
                
                this.x = this.baseX + floatX;
                this.y = this.baseY + floatY;
                
                // Pulse opacity
                this.opacity = 0.3 + Math.sin(time * 2) * 0.2;
            }
            
            draw(ctx) {
                if (isMobile) {
                    // Simplified rendering for mobile - no shadows
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color + this.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                } else {
                    // Desktop keeps full effects
                    ctx.save();
                    ctx.globalAlpha = this.opacity;
                    ctx.fillStyle = this.color + this.opacity + ')';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add glow effect
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = this.color + '0.8)';
                    ctx.fill();
                    ctx.restore();
                }
            }
        }
        
        // Snake class
        class Snake {
            constructor(x, y, isPlayer = false) {
                this.x = x;
                this.y = y;
                this.prevX = x;
                this.prevY = y;
                this.angle = Math.random() * Math.PI * 2;
                this.prevAngle = this.angle;
                this.segments = [];
                
                this.elements = [];
                this.maxVisibleElements = elementBankSlots; // Dynamic element slots based on global value
                this.elementsEaten = 0; // Track total elements eaten
                this.length = 10;
                this.score = 0;
                this.discoveries = 0; // Track discoveries for this snake
                this.kills = 0; // Track kills for this snake
                this.alive = true;
                this.isPlayer = isPlayer;
                this.speed = isPlayer ? SNAKE_SPEED : SNAKE_SPEED * 0.9; // AI snakes are 10% slower
                this.baseSpeed = isPlayer ? SNAKE_SPEED : SNAKE_SPEED * 0.9; // Store base speed for boost calculations
                this.name = isPlayer ? 'You' : generateSnakeName();
                this.invincibilityTimer = 0;
                this.size = 1; // Default size for normal snakes
                
                // Death animation properties
                this.deathAnimationTimer = 0;
                this.deathAnimationDuration = 1000; // 1 second death animation
                this.deathFlashPhase = 0;
                this.deathSegmentPhase = 0;
                this.isDying = false;
                this.hasExploded = false;
                
                // Validate size to prevent invisibility
                if (!this.size || this.size <= 0) {
                    this.size = 1;
                    gameLogger.warn('SNAKE', 'Snake size was invalid, setting to 1');
                }
                
                // Player snake created
                this.discoveredElements = new Set(); // Each snake tracks its own discoveries - starts empty
                
                // Speed boost properties
                this.stamina = 100; // Max stamina
                this.maxStamina = 100;
                this.isBoosting = false;
                this.wasBoostingLastFrame = false; // Track boost state changes
                this.staminaRegenCooldown = 0; // Prevents regen immediately after boosting
                this.boostParticleTimer = 0;
                
                // Near-miss tracking
                this.nearMissTracking = new Map(); // Track distance to other snakes over time
                this.recentCollisions = new Set(); // Track recent collisions to prevent near-miss after collision
                
                // Assign skin
                if (isPlayer) {
                    this.skin = currentPlayerSkin;
                } else {
                    // Get available AI skins (exclude snake-default-green, boss skins, and already used skins)
                    const allSkins = Object.keys(skinMetadata).filter(skin => 
                        skin !== 'snake-default-green' && !skinMetadata[skin].isBoss && !usedAISkins.has(skin)
                    );
                    
                    // If all skins are used, reset the used skins set (but still exclude default green and boss skins)
                    if (allSkins.length === 0) {
                        usedAISkins.clear();
                        const resetSkins = Object.keys(skinMetadata).filter(skin => 
                            skin !== 'snake-default-green' && !skinMetadata[skin].isBoss
                        );
                        this.skin = resetSkins[Math.floor(Math.random() * resetSkins.length)];
                    } else {
                        this.skin = allSkins[Math.floor(Math.random() * allSkins.length)];
                    }
                    
                    // Mark this skin as used
                    usedAISkins.add(this.skin);
                    
                    // Assign random personality to AI snakes (but not bosses)
                    if (!this.isBoss) {
                        const personalities = Object.keys(AI_PERSONALITIES);
                        const personalityKey = personalities[Math.floor(Math.random() * personalities.length)];
                        this.personality = AI_PERSONALITIES[personalityKey];
                        this.name = this.personality.name + ' ' + this.name;
                        this.personalityColor = PERSONALITY_COLORS[this.personality.name];
                        if (this.personality.name === 'Aggressive') {
                        }
                    }
                    
                    // AI-specific properties
                    this.targetMemory = null; // Remember targets for a few frames
                    this.targetMemoryTimer = 0;
                    this.lastCollisionCheck = 0; // Optimize collision checking
                    this.panicMode = false; // Emergency evasion state
                    this.panicTimer = 0;
                    this.lastDangerAngle = null; // Remember last danger direction
                    this.consecutiveDangerFrames = 0; // Track how long we've been in danger
                    this.huntTarget = null; // Active hunting target for aggressive snakes
                    this.huntTargetTimer = 0; // How long to track hunt target
                }
                
                // Initialize segments
                for (let i = 0; i < this.length; i++) {
                    const segX = x - i * SEGMENT_SIZE * Math.cos(this.angle);
                    const segY = y - i * SEGMENT_SIZE * Math.sin(this.angle);
                    this.segments.push({
                        x: segX,
                        y: segY,
                        prevX: segX,
                        prevY: segY
                    });
                }
                
                // Start with NO elements - snakes must collect them from the map
                // This ensures players experience the discovery process from scratch
            }
            
            update(deltaTime = 1) {
                // Handle death animation
                if (this.isDying && !this.alive) {
                    this.updateDeathAnimation(deltaTime);
                    return;
                }
                
                if (!this.alive) return;
                
                // Store previous positions for interpolation
                this.prevX = this.x;
                this.prevY = this.y;
                this.prevAngle = this.angle;
                
                // Store previous segment positions
                if (this.segments) {
                    this.segments.forEach(segment => {
                        segment.prevX = segment.x;
                        segment.prevY = segment.y;
                    });
                }
                
                // Debug check
                if (!isFinite(this.x) || !isFinite(this.y)) {
                    gameLogger.error('SNAKE', 'Snake position is NaN!', 'x:', this.x, 'y:', this.y, 'deltaTime:', deltaTime);
                }
                
                // Update invincibility
                if (this.invincibilityTimer > 0) {
                    this.invincibilityTimer -= 16; // Fixed timestep
                }
                
                // Handle controls
                if (this.isPlayer) {
                    // Only apply controls if this is the main player snake
                    if (this !== playerSnake) {
                        // Count how many player snakes exist
                        const playerSnakeCount = snakes.filter(s => s.isPlayer && s.alive).length;
                        
                        // Only kill if there's actually more than one player snake
                        if (playerSnakeCount > 1) {
                            gameLogger.error('CONTROLS', 'WARNING: Multiple player snakes detected! Killing duplicate:', this.name);
                            this.alive = false; // Kill duplicate player snake
                            return;
                        } else {
                            // If there's only one player snake, update the reference
                            gameLogger.warn('CONTROLS', 'Player snake reference mismatch, updating reference');
                            playerSnake = this;
                        }
                    }
                    
                    // Handle turning
                    let turnMultiplier = 1;
                    if (this.isBoosting) {
                        turnMultiplier = 0.85; // Reduced turn speed while boosting
                    }
                    
                    if (isMobile && joystickActive) {
                        // Mobile controls - use joystick
                        let angleDiff = mouseAngle - this.angle;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        const angleChange = angleDiff * 0.12 * turnMultiplier;
                        if (isFinite(angleChange)) {
                            this.angle += angleChange;
                        }
                        this.isBoosting = mouseDown && this.stamina > 0;
                    } else if (controlScheme === 'arrows') {
                        // Arrow keys
                        if (keys['ArrowLeft']) this.angle -= TURN_SPEED * turnMultiplier;
                        if (keys['ArrowRight']) this.angle += TURN_SPEED * turnMultiplier;
                        // WASD keys (always available alongside arrows)
                        if (keys['a'] || keys['A']) this.angle -= TURN_SPEED * turnMultiplier;
                        if (keys['d'] || keys['D']) this.angle += TURN_SPEED * turnMultiplier;
                        // Handle boost (both ArrowUp and W)
                        this.isBoosting = (keys['ArrowUp'] || keys['w'] || keys['W']) && this.stamina > 0;
                    } else if (controlScheme === 'mouse') {
                        // WASD controls - standard tank controls that just turn the snake
                        if (keys['a'] || keys['A']) this.angle -= TURN_SPEED * turnMultiplier;
                        if (keys['d'] || keys['D']) this.angle += TURN_SPEED * turnMultiplier;
                        
                        // Mouse steering only if mouse has moved recently and WASD not being used
                        const usingWASD = keys['a'] || keys['A'] || keys['d'] || keys['D'];
                        if (!usingWASD && mouseMovedRecently) {
                            // Smooth angle interpolation toward mouse
                            let angleDiff = mouseAngle - this.angle;
                            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                            const angleChange = angleDiff * 0.1 * turnMultiplier;
                            if (isFinite(angleChange)) {
                                this.angle += angleChange;
                            }
                        }
                        
                        // Handle boost (mouse click OR W key)
                        this.isBoosting = (mouseDown || keys['w'] || keys['W']) && this.stamina > 0;
                    }
                } else {
                    // Enhanced AI with personality system
                    this.updateAI(deltaTime);
                }
                
                // Update stamina and speed based on boost
                if (this.isBoosting && this.stamina > 0) {
                    // Play boost sound when starting to boost
                    if (!this.wasBoostingLastFrame) {
                        playBoostSound(this.isPlayer);
                    }
                    
                    // Deplete stamina (5 seconds of continuous use)
                    this.stamina -= (100 / (6.25 * 60)) * deltaTime; // 100 stamina over 6.25 seconds
                    this.stamina = Math.max(0, this.stamina);
                    this.staminaRegenCooldown = 30; // Half second cooldown before regen starts
                    
                    // Apply speed boost
                    this.speed = this.baseSpeed * 1.96875; // 2.1875 * 0.9 = 10% reduction
                    
                    // Create boost particles
                    this.boostParticleTimer++;
                    const particleFrequency = isMobile ? 6 : 3; // Less frequent on mobile
                    if (this.boostParticleTimer % particleFrequency === 0) {
                        const particleAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.5;
                        const particleSpeed = 2 + Math.random() * 2;
                        const vx = Math.cos(particleAngle) * particleSpeed;
                        const vy = Math.sin(particleAngle) * particleSpeed;
                        const color = this.isPlayer ? 'rgba(100, 200, 255, 0.8)' : 'rgba(255, 100, 100, 0.8)';
                        particlePool.spawn(this.x, this.y, vx, vy, color);
                    }
                } else {
                    // Not boosting
                    this.isBoosting = false;
                    this.speed = this.baseSpeed;
                    
                    // Regenerate stamina
                    if (this.staminaRegenCooldown > 0) {
                        this.staminaRegenCooldown -= deltaTime;
                    } else if (this.stamina < this.maxStamina) {
                        // Regenerate stamina (2 seconds to full)
                        this.stamina += (100 / (2.5 * 60)) * deltaTime; // 100 stamina over 2.5 seconds
                        this.stamina = Math.min(this.maxStamina, this.stamina);
                    }
                }
                
                // Ensure angle is valid
                if (!isFinite(this.angle)) {
                    gameLogger.error('SNAKE', 'Angle is invalid!', this.angle, 'Resetting to 0');
                    this.angle = 0;
                }
                
                // Move head (apply deltaTime for proper movement)
                // Performance optimization: Use fast math for movement
                const moveX = fastMath.cos(this.angle) * this.speed * deltaTime;
                const moveY = fastMath.sin(this.angle) * this.speed * deltaTime;
                
                if (isFinite(moveX) && isFinite(moveY)) {
                    this.x += moveX;
                    this.y += moveY;
                } else {
                    gameLogger.error('SNAKE', 'Invalid movement!', 'angle:', this.angle, 'speed:', this.speed, 'deltaTime:', deltaTime);
                }
                
                // World boundaries - add small margin for floating point precision
                const boundaryMargin = 2; // Small margin to prevent edge case deaths
                const hitLeftBoundary = this.x <= -boundaryMargin;
                const hitRightBoundary = this.x >= WORLD_SIZE + boundaryMargin;
                const hitTopBoundary = this.y <= -boundaryMargin;
                const hitBottomBoundary = this.y >= WORLD_SIZE + boundaryMargin;
                
                if (hitLeftBoundary || hitRightBoundary || hitTopBoundary || hitBottomBoundary) {
                    // In cozy mode, bounce instead of die
                    if (this.isPlayer && gameMode === 'cozy') {
                        // Bounce physics
                        const dampening = 0.85; // Soft bounce feel
                        const angleVariation = (Math.random() - 0.5) * 0.52; // ±15 degrees in radians
                        
                        // Store explosion position before adjusting snake position
                        let explosionX = this.x;
                        let explosionY = this.y;
                        
                        if (hitLeftBoundary || hitRightBoundary) {
                            // Reverse horizontal component of angle
                            this.angle = Math.PI - this.angle + angleVariation;
                            
                            // Adjust position to be inside bounds
                            if (hitLeftBoundary) {
                                this.x = boundaryMargin;
                                explosionX = 0;
                            } else {
                                this.x = WORLD_SIZE - boundaryMargin;
                                explosionX = WORLD_SIZE;
                            }
                            
                            // Apply dampened speed
                            this.speed = this.speed * dampening;
                        }
                        
                        if (hitTopBoundary || hitBottomBoundary) {
                            // Reverse vertical component of angle
                            this.angle = -this.angle + angleVariation;
                            
                            // Adjust position to be inside bounds
                            if (hitTopBoundary) {
                                this.y = boundaryMargin;
                                explosionY = 0;
                            } else {
                                this.y = WORLD_SIZE - boundaryMargin;
                                explosionY = WORLD_SIZE;
                            }
                            
                            // Apply dampened speed
                            this.speed = this.speed * dampening;
                        }
                        
                        // Normalize angle to 0-2π range
                        while (this.angle < 0) this.angle += Math.PI * 2;
                        while (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
                        
                        // Create dust impact explosion at boundary contact point
                        if (explosionManager) {
                            explosionManager.createExplosion('dust-impact-small-white', explosionX, explosionY, { 
                                scale: 1.4 
                            });
                        }
                        
                        // Play impact sound effect
                        const impactSound = new Audio('sounds/short-bass.mp3');
                        impactSound.volume = 0.3;
                        impactSound.play().catch(err => {
                            console.log('Failed to play impact sound:', err);
                        });
                        
                        // Ensure minimum speed to prevent getting stuck
                        const minSpeed = SNAKE_SPEED * 0.5;
                        if (this.speed < minSpeed) {
                            this.speed = minSpeed;
                        }
                        
                        return; // Don't die, continue with bounce
                    } else {
                        // Normal death for non-cozy modes or AI snakes
                        this.die();
                        return;
                    }
                }
                
                // Update segments
                if (!this.segments) {
                    gameLogger.error('SNAKE', 'Segments array is undefined!');
                    this.segments = [];
                }
                this.segments.unshift({ 
                    x: this.x, 
                    y: this.y,
                    prevX: this.prevX || this.x,
                    prevY: this.prevY || this.y
                });
                while (this.segments.length > this.length) {
                    this.segments.pop();
                }
                
                // Check element combinations
                this.checkCombinations();
                
                // Update boost state tracking
                this.wasBoostingLastFrame = this.isBoosting;
            }
            
            checkCombinations(depth = 0) {
                if (this.elements.length < 2) return;
                
                // Clean up any invalid elements before processing
                const validElements = this.elements.filter(elementId => {
                    const isValid = elementId && window.elementLoader.elements.get(elementId);
                    if (!isValid && elementId !== undefined && elementId !== null) {
                        gameLogger.warn('ELEMENT BANK', `Removing invalid element from bank: ${elementId}`);
                    }
                    return isValid;
                });
                
                if (validElements.length !== this.elements.length) {
                    this.elements = validElements;
                    if (this.isPlayer) {
                        updateUI(); // Update UI to reflect cleaned elements
                    }
                }
                
                // Safety check - ensure we never exceed max elements
                if (this.elements.length > elementBankSlots) {
                    gameLogger.critical('SNAKE', 'Elements array exceeds max visible elements!', this.elements.length);
                    // Trim to max size
                    this.elements = this.elements.slice(0, elementBankSlots);
                }
                
                // Limit chain reaction depth
                const MAX_CHAIN_DEPTH = 3;
                if (depth >= MAX_CHAIN_DEPTH) {
                    return;
                }
                
                // Log bank state periodically for player
                
                // Find all possible combinations
                let possibleCombos = [];
                
                for (let i = 0; i < this.elements.length; i++) {
                    for (let j = i + 1; j < this.elements.length; j++) {
                        const id1 = this.elements[i];
                        const id2 = this.elements[j];
                        
                        // Check if these can combine using numeric IDs
                        let resultId = null;
                        if (window.elementLoader && window.elementLoader.combinations) {
                            // Use min/max to ensure consistent key order
                            const key = `${Math.min(id1, id2)}+${Math.max(id1, id2)}`;
                            resultId = window.elementLoader.combinations[key];
                            
                            if (depth === 0 && this.isPlayer && possibleCombos.length === 0 && resultId !== undefined && resultId !== null) {
                            }
                        }
                        
                        if (resultId !== undefined && resultId !== null && window.elementLoader.elements.get(resultId)) {
                            const resultElem = window.elementLoader.elements.get(resultId);
                            const isNewDiscovery = !this.discoveredElements.has(resultId);
                            const resultTier = resultElem.t || 0;
                            
                            possibleCombos.push({
                                index1: i,
                                index2: j,
                                elem1: id1,
                                elem2: id2,
                                result: resultId,
                                isNewDiscovery,
                                tier: resultTier
                            });
                        }
                    }
                }
                
                if (possibleCombos.length === 0) {
                    if (this.isPlayer && this === playerSnake) {
                        comboStreak = 0;
                    }
                    return;
                }
                
                // Prioritize: new discoveries first, then by highest tier
                possibleCombos.sort((a, b) => {
                    if (a.isNewDiscovery && !b.isNewDiscovery) return -1;
                    if (!a.isNewDiscovery && b.isNewDiscovery) return 1;
                    return b.tier - a.tier;
                });
                
                const chosen = possibleCombos[0];
                
                // Debug logging
                
                // Start combination animation for player
                if (this.isPlayer) {
                    this.startCombinationAnimation(chosen.index1, chosen.index2);
                    // Play combination sound - disabled
                    // playCombinationSound();
                    // Create visual flash effect
                    createCombinationFlash();
                    
                    // Add glow/wobble to both combining elements in the bank
                    this.glowWobbleIndices = [chosen.index1, chosen.index2];
                    this.glowWobbleTime = Date.now();
                    
                    // Update UI immediately to show animation
                    updateUI();
                }
                
                // Remove the two elements (remove higher index first to maintain indices)
                const indices = [chosen.index1, chosen.index2].sort((a, b) => b - a);
                this.elements.splice(indices[0], 1);
                this.elements.splice(indices[1], 1);
                
                // Add the result to a random position in the available slots
                // Validate result before adding
                if (chosen.result && window.elementLoader.elements.get(chosen.result)) {
                    const insertIndex = Math.floor(Math.random() * (this.elements.length + 1));
                    this.elements.splice(insertIndex, 0, chosen.result);
                } else {
                    gameLogger.warn('ELEMENT BANK', `Invalid combination result: ${chosen.result}`);
                }
                
                // Safety check - ensure we never exceed max elements after combination
                if (this.elements.length > elementBankSlots) {
                    gameLogger.error('SAFETY', 'Elements exceed max after combination, trimming');
                    this.elements = this.elements.slice(0, elementBankSlots);
                }
                            
                    // Discovery check
                    if (chosen.isNewDiscovery) {
                        this.discoveredElements.add(chosen.result);
                        
                        // IMPORTANT: Add to global discovered elements for spawning system!
                        // But delay AI discoveries at game start to give clean beginning
                        const gameTime = Date.now() - gameStartTime;
                        if (this.isPlayer || gameTime > 10000) { // Only after 10 seconds for AI
                            discoveredElements.add(chosen.result);
                        }
                        
                        // Only add to player discoveries if this is the player
                        if (this.isPlayer && this === playerSnake) {
                            // Ensure we store as number
                            const resultId = typeof chosen.result === 'string' ? parseInt(chosen.result) : chosen.result;
                            playerDiscoveredElements.add(resultId);
                            
                            // Track discovery analytics
                            if (window.GameAnalyticsWrapper) {
                                const resultData = window.elementLoader?.elements?.get(resultId);
                                const elementName = resultData?.n || 'Unknown';
                                window.GameAnalyticsWrapper.trackDiscovery(elementName, resultId, discoveredElements.size);
                            }
                        }
                        
                        this.score += 500; // 500 points for new discovery
                        this.discoveries++; // Increment discovery count
                        
                        // Additional effects for player
                        if (this.isPlayer && this === playerSnake) {
                            // Dispatch element discovered event
                            dispatchGameEvent('elementDiscovered', {
                                element1: chosen.elem1,
                                element2: chosen.elem2,
                                result: chosen.result,
                                totalDiscoveries: this.discoveries,
                                score: this.score
                            });
                            
                            // Save to all-time discoveries with recipe
                            const elem1Data = window.elementLoader.elements.get(chosen.elem1);
                            const elem2Data = window.elementLoader.elements.get(chosen.elem2);
                            if (elem1Data && elem2Data) {
                                const emoji1 = window.elementLoader.getEmojiForElement(chosen.elem1, elem1Data.e);
                                const emoji2 = window.elementLoader.getEmojiForElement(chosen.elem2, elem2Data.e);
                                const recipe = `${emoji1} ${elem1Data.n} + ${emoji2} ${elem2Data.n}`;
                                allTimeDiscoveries.set(chosen.result, recipe);
                                saveAllTimeDiscoveries();
                            }
                            
                            showCombinationMessage(chosen.elem1, chosen.elem2, chosen.result, true); // Show new discovery
                            // Grant invincibility on new discovery
                            this.invincibilityTimer = 2000; // 2 seconds
                            
                            // Check for new high score
                            if (this.score > highScore) {
                                highScore = this.score;
                                localStorage.setItem('highScore', highScore.toString());
                            }
                        }
                    } else {
                        // Existing combination - add combo streak points
                        if (this.isPlayer && this === playerSnake) {
                            comboStreak++;
                            let comboBonus = 100; // Base combo points
                            
                            // Calculate streak bonus
                            if (comboStreak >= 4) {
                                comboBonus = 2500;
                                showMessage(`4x COMBO STREAK! +${comboBonus} points!`, 'combo', 5000);
                            } else if (comboStreak >= 3) {
                                comboBonus = 1000;
                                showMessage(`3x Combo Streak! +${comboBonus} points!`, 'combo', 5000);
                            } else if (comboStreak >= 2) {
                                comboBonus = 500;
                                showMessage(`2x Combo! +${comboBonus} points!`, 'combo', 5000);
                            }
                            
                            this.score += comboBonus;
                            showCombinationMessage(chosen.elem1, chosen.elem2, chosen.result, false); // Show combo
                        }
                    }
                            
                    // Create particle effect at snake head
                    createCombinationParticles(this.segments[0].x, this.segments[0].y);
                    
                    // Debug: Log when any snake creates a combination during boss fight
                    if (currentBoss && currentBoss.alive) {
                        gameLogger.debug('COMBINATION', `Snake: ${this.name} isPlayer: ${this.isPlayer} created combination: ${chosen.elem1} + ${chosen.elem2} = ${chosen.result} Boss element: ${currentBoss.elementId}`);
                    }
                    
                    // Check if this combination involves the boss's element and create shockwave
                    if (this.isPlayer && this === playerSnake && currentBoss && currentBoss.alive) {
                        const bossElementId = currentBoss.elementId;
                        // Check if either of the combining elements or the result is the boss element
                        if (chosen.elem1 === bossElementId || chosen.elem2 === bossElementId || chosen.result === bossElementId) {
                            gameLogger.debug('SHOCKWAVE', `Creating shockwave for player: ${this.name} isPlayer: ${this.isPlayer} playerSnake match: ${this === playerSnake}`);
                            // Create shockwave effect
                            const elementColors = {
                                0: '#8b6914', // Earth - brown
                                1: '#0066ff', // Water - blue
                                2: '#ffffff', // Air - white
                                3: '#ff4444'  // Fire - red
                            };
                            
                            // Determine the color based on player's primary element
                            let shockwaveColor = '#FFD700'; // Default gold
                            if (this.elements.length > 0) {
                                const primaryElement = this.elements[0];
                                shockwaveColor = elementColors[primaryElement] || '#FFD700';
                            }
                            
                            shockwaves.push({
                                x: this.segments[0].x,
                                y: this.segments[0].y,
                                radius: 0,
                                maxRadius: 400, // Reduced radius for increased difficulty
                                speed: 10, // Slower expansion for visibility
                                color: shockwaveColor,
                                life: 1.0,
                                type: 'omnidirectional',
                                owner: 'player' // Mark this as a player shockwave
                            });
                            
                            // Play explosion shockwave sound
                            const shockwaveSound = new Audio('sounds/explosion-shockwave.mp3');
                            shockwaveSound.volume = 0.8;
                            shockwaveSound.play().catch(e => {});
                            
                            // Show special message for boss element combination
                            showMessage('Boss Element Resonance!', 'gold', 3000);
                        }
                    }
                    
                    // Log chain reaction info
                    
                    // Check again in case there are more combinations
                    this.checkCombinations(depth + 1);
                }
            
            consume(element) {
                // Play eating sound for player only
                if (this.isPlayer) {
                    playEatSound();
                }
                
                // Debug logging
                if (this.isPlayer) {
                }
                
                // Safety check - ensure we never have more than max elements (use global elementBankSlots)
                if (this.elements.length > elementBankSlots) {
                    gameLogger.critical('ELEMENT BANK', 'Bank already exceeds maximum!', this.elements.length);
                    this.elements = this.elements.slice(0, elementBankSlots);
                }
                
                // Debug element consumption
                if (this.isPlayer && window.debugElementBank) {
                }
                
                // Check if we have space in visible slots (use global elementBankSlots)
                if (this.elements.length >= elementBankSlots) {
                    // At visible capacity - check if new element can combine with any existing
                    const newElementId = element.id;
                    let combined = false;
                    
                    // Add safety check for elementLoader
                    if (!window.elementLoader || !window.elementLoader.combinations) {
                        gameLogger.error('ELEMENT LOADER', 'ElementLoader or combinations not loaded!');
                        return;
                    }
                    
                    // Check combinations with all existing elements
                    for (let i = 0; i < this.elements.length && !combined; i++) {
                        const existingId = this.elements[i];
                        // Use min/max to ensure consistent key order
                        const comboKey = `${Math.min(newElementId, existingId)}+${Math.max(newElementId, existingId)}`;
                        const resultId = window.elementLoader.combinations[comboKey];
                        
                        
                        if (resultId !== undefined && resultId !== null) {
                            // Found a combination! Replace the existing element with the result
                            combined = true;
                            
                            // Visual feedback for the combination
                            if (this.isPlayer) {
                                // Start glow/wobble animation on the bank element
                                this.pendingCombinationIndex = i;
                                this.pendingCombinationTime = Date.now();
                                updateUI(); // Update UI to show the glow effect
                            }
                            
                            // Delay the actual combination for visual effect
                            setTimeout(() => {
                                // Validate resultId before adding
                                if (resultId && window.elementLoader.elements.get(resultId)) {
                                    this.elements[i] = resultId;
                                } else {
                                    // Remove invalid element slot
                                    gameLogger.warn('ELEMENT BANK', `Invalid resultId: ${resultId}, removing slot`);
                                    this.elements.splice(i, 1);
                                }
                                
                                // Final safety check after replacement (use global elementBankSlots)
                                if (this.elements.length > elementBankSlots) {
                                    gameLogger.error('SAFETY', 'Elements exceed max after replacement, trimming');
                                    this.elements = this.elements.slice(0, elementBankSlots);
                                }
                                
                                if (this.isPlayer) {
                                    this.pendingCombinationIndex = -1;
                                }
                                
                                // Check if it's a new discovery
                                if (!this.discoveredElements.has(resultId)) {
                                    this.discoveredElements.add(resultId);
                                this.score += 500; // Discovery bonus
                                this.discoveries++;
                                
                                if (this.isPlayer && this === playerSnake) {
                                    discoveredElements.add(resultId);
                                    
                                    // Get result data for tracking
                                    const resultData = window.elementLoader.elements.get(resultId);
                                    
                                    // Track discovery event
                                    if (window.leaderboardModule && window.leaderboardModule.addGameEvent) {
                                        window.leaderboardModule.addGameEvent('discovery', {
                                            element_id: resultId,
                                            element_name: resultData?.n || 'Unknown',
                                            recipe: [newElementId, existingId],
                                            score: this.score,
                                            total_discoveries: this.discoveries
                                        });
                                    }
                                    
                                    // Save discovery
                                    const elem1Data = window.elementLoader.elements.get(newElementId);
                                    const elem2Data = window.elementLoader.elements.get(existingId);
                                    if (elem1Data && elem2Data && resultData) {
                                        const emoji1 = window.elementLoader.getEmojiForElement(newElementId, elem1Data.e);
                                        const emoji2 = window.elementLoader.getEmojiForElement(existingId, elem2Data.e);
                                        const recipe = `${emoji1} ${elem1Data.n} + ${emoji2} ${elem2Data.n}`;
                                        allTimeDiscoveries.set(resultId, recipe);
                                        saveAllTimeDiscoveries();
                                    }
                                    
                                    showCombinationMessage(newElementId, existingId, resultId, true);
                                    this.invincibilityTimer = 2000;
                                }
                            } else {
                                // Existing combination
                                if (this.isPlayer && this === playerSnake) {
                                    comboStreak++;
                                    let comboBonus = 100;
                                    if (comboStreak >= 4) {
                                        comboBonus = 2500;
                                        showMessage(`4x COMBO STREAK! +${comboBonus} points!`, 'combo', 5000);
                                    } else if (comboStreak >= 3) {
                                        comboBonus = 1000;
                                        showMessage(`3x Combo Streak! +${comboBonus} points!`, 'combo', 5000);
                                    } else if (comboStreak >= 2) {
                                        comboBonus = 500;
                                        showMessage(`2x Combo! +${comboBonus} points!`, 'combo', 5000);
                                    }
                                    this.score += comboBonus;
                                    showCombinationMessage(newElementId, existingId, resultId, false);
                                }
                            }
                            
                            // Create particle effect
                            createCombinationParticles(this.segments[0].x, this.segments[0].y);
                            
                            // Now check if the new result can combine with other elements
                            this.checkCombinations();
                            
                            updateUI(); // Update UI after combination
                            }, 300); // 300ms delay for visual effect
                        }
                    }
                    
                    if (!combined) {
                        // No combination found with the new element
                        // Force a check for existing combinations in the bank
                        this.checkCombinations();
                        
                        // Bank is full and no combination possible - element is lost
                    }
                } else {
                    // We have space - add element to a random position within the available slots
                    // Validate element.id before adding
                    if (element.id && window.elementLoader.elements.get(element.id)) {
                        const insertIndex = Math.floor(Math.random() * (this.elements.length + 1));
                        this.elements.splice(insertIndex, 0, element.id);
                    } else {
                        gameLogger.warn('ELEMENT BANK', `Invalid element ID: ${element.id}, not adding to bank`);
                    }
                    
                    // Immediately enforce max limit as a safety measure (use global elementBankSlots)
                    if (this.elements.length > elementBankSlots) {
                        gameLogger.error('SAFETY', 'Trimming elements array to max size');
                        this.elements = this.elements.slice(0, elementBankSlots);
                    }
                    
                    
                    // Check for immediate combinations after adding
                    if (this.elements.length >= 2) {
                        this.checkCombinations();
                    }
                }
                
                // Track elements eaten
                this.elementsEaten++;
                
                // Grow snake
                this.length += 2;
                
                // Add score - 100 points per element
                this.score += 100;
                
                // Check for new high score
                if (this.isPlayer && this.score > highScore) {
                    highScore = this.score;
                    localStorage.setItem('highScore', highScore.toString());
                }
                
                // Remove element from world
                elementPool.remove(element);
                
                // Update UI if player
                if (this.isPlayer) {
                    updateUI();
                }
            }
            
            digest() {
                if (!this.isPlayer || this.elements.length === 0) {
                    // Non-player digestion happens instantly
                    const digestedCount = this.elements.length;
                    this.elements = [];
                    
                    // Bonus points for digestion based on how full we were
                    const digestBonus = Math.floor(digestedCount * 50);
                    this.score += digestBonus;
                    
                    // Check for new high score
                    if (this.isPlayer && this.score > highScore) {
                        highScore = this.score;
                        localStorage.setItem('highScore', highScore.toString());
                    }
                    return;
                }
                
                // Player digestion - show message immediately
                const digestedCount = this.elements.length;
                
                // Clear all elements immediately
                this.elements = [];
                
                // Bonus points for digestion based on how full we were
                const digestBonus = Math.floor(digestedCount * 50);
                this.score += digestBonus;
                
                // Show digestion message for player only
                if (this.isPlayer && this === playerSnake) {
                    showMessage(`Digesting ${digestedCount} elements! +${digestBonus} points`, false);
                    // Update UI immediately
                    updateUI();
                }
            }
            
            startCombinationAnimation(index1, index2) {
                // Store indices for animation
                this.combiningIndices = [index1, index2];
                this.combinationAnimationTime = 0;
                this.isAnimatingCombination = true;
                
                // Update global animation state for UI
                if (this.isPlayer) {
                    combinationAnimationState.isAnimating = true;
                    combinationAnimationState.combiningIndices = [index1, index2];
                    combinationAnimationState.animationStartTime = Date.now();
                    
                    // The new element will be inserted at a random position
                    // We'll track it after the combination completes
                    setTimeout(() => {
                        // Find the newest element (the one that's not in the old positions)
                        const remainingElements = this.elements.length;
                        if (remainingElements > 0) {
                            // Since we insert at random position, we need to find it
                            // For now, we'll animate the first slot as a placeholder
                            combinationAnimationState.newElementIndex = Math.floor(Math.random() * remainingElements);
                            // Update UI to show the new element animation
                            updateUI();
                        }
                    }, 300);
                }
            }
            
            die(isBossDeath = false) {
                
                // Start death animation if not already dying
                if (!this.isDying) {
                    this.isDying = true;
                    this.deathAnimationTimer = 0;
                    this.speed = 0; // Stop movement during death
                    
                    // Track player death analytics
                    if (this.isPlayer && window.GameAnalyticsWrapper) {
                        const deathCause = isBossDeath ? 'boss' : 'collision';
                        window.GameAnalyticsWrapper.trackDeath(deathCause, this.score, { x: this.x, y: this.y });
                    }
                    
                    // Sound will play with pixel explosion at 600ms
                    
                    // For instant death (like boss kills), skip animation
                    if (isBossDeath && this.isPlayer) {
                        this.deathAnimationTimer = this.deathAnimationDuration;
                        this.alive = false; // Immediately mark as dead for boss kills
                        this.deathComplete = true; // Mark death as complete
                    }
                    
                    return; // Don't process death yet, let animation play
                }
                
                this.alive = false;
                
                // Drop all elements in the shape of the snake
                const elementsToSpawn = this.elements.length;
                if (elementsToSpawn > 0 && this.segments && this.segments.length > 0) {
                    // Calculate spacing between elements based on snake length
                    const segmentSpacing = Math.max(1, Math.floor(this.segments.length / elementsToSpawn));
                    
                    for (let i = 0; i < elementsToSpawn; i++) {
                        // Place elements evenly along the snake's body
                        const segmentIndex = Math.min(i * segmentSpacing, this.segments.length - 1);
                        const segment = this.segments[segmentIndex];
                        
                        // Skip if segment is undefined or missing position
                        if (!segment || segment.x === undefined || segment.y === undefined) {
                            continue;
                        }
                        
                        // Add small random offset to prevent exact overlap
                        const smallOffset = 10;
                        const offsetX = (Math.random() - 0.5) * smallOffset;
                        const offsetY = (Math.random() - 0.5) * smallOffset;
                        
                        // Calculate final position
                        let finalX = segment.x + offsetX;
                        let finalY = segment.y + offsetY;
                        
                        // Ensure elements stay within world bounds
                        const margin = 50;
                        finalX = Math.max(margin, Math.min(WORLD_SIZE - margin, finalX));
                        finalY = Math.max(margin, Math.min(WORLD_SIZE - margin, finalY));
                        
                        // Spawn the element at the position along the snake
                        spawnElement(this.elements[i], finalX, finalY);
                    }
                }
                
                // Only create death particles if not already created during animation
                if (!this.finalExplosionTriggered) {
                    const snakeColor = this.color || '#ff0000';
                    createDeathParticles(this.x, this.y, this.length, snakeColor, this.elements);
                }
                
                // Additional dramatic effects for player death
                if (this.isPlayer && !isBossDeath) {
                    // Flash effect
                    const flashOverlay = document.createElement('div');
                    flashOverlay.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: white;
                        opacity: 0.8;
                        z-index: 100;
                        pointer-events: none;
                        animation: deathFlash 0.2s ease-out;
                    `;
                    document.body.appendChild(flashOverlay);
                    setTimeout(() => flashOverlay.remove(), 200);
                    
                    // Extra particle burst for player
                    for (let i = 0; i < 20; i++) {
                        const angle = (Math.PI * 2 * i) / 20;
                        const speed = 8 + Math.random() * 4;
                        particlePool.spawn(
                            this.x,
                            this.y,
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed,
                            '#fff',
                            6 + Math.random() * 4,
                            'circle',
                            { fadeRate: 0.02, glow: true }
                        );
                    }
                }
                
                // Special effects for boss deaths
                if (this.isPlayer && isBossDeath) {
                    // Create massive explosion for player death by boss
                    for (let i = 0; i < 50; i++) {
                        const angle = (Math.PI * 2 * i) / 50;
                        const speed = 5 + Math.random() * 10;
                        const color = ['#ff0000', '#ff6600', '#ffaa00', '#ffff00'][Math.floor(Math.random() * 4)];
                        const size = 10 + Math.random() * 15;
                        particlePool.spawn(
                            this.x,
                            this.y,
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed,
                            color,
                            size
                        );
                    }
                    
                    // Play powerful explosion sound
                    if (!musicMuted) {
                        const explosionSound = new Audio('sounds/big-powerful-explosion.mp3');
                        explosionSound.volume = 0.7;
                        explosionSound.play().catch(e => {});
                    }
                    
                    // Add intense screen shake
                    bossScreenShakeTimer = 60;
                    bossScreenShakeIntensity = 20;
                }
                
                // Respawn if player
                if (this.isPlayer) {
                    // Player respawn is now handled in the main game loop
                    // This prevents duplicate player snakes from being created
                }
            }
            
            updateDeathAnimation(deltaTime) {
                this.deathAnimationTimer += deltaTime * 16; // Convert to milliseconds
                
                const progress = Math.min(this.deathAnimationTimer / this.deathAnimationDuration, 1);
                
                // Phase 1: Flash effect (0-200ms)
                if (this.deathAnimationTimer < 200) {
                    this.deathFlashPhase = Math.sin(this.deathAnimationTimer * 0.1) * 0.5 + 0.5;
                }
                
                // Phase 2: Segment explosion (200-600ms)
                if (this.deathAnimationTimer >= 200 && this.deathAnimationTimer < 600) {
                    const explosionProgress = (this.deathAnimationTimer - 200) / 400;
                    this.deathSegmentPhase = explosionProgress;
                    
                    // Create particles at segment positions
                    if (Math.random() < 0.3) { // 30% chance per frame
                        const segmentIndex = Math.floor(Math.random() * this.segments.length);
                        const segment = this.segments[segmentIndex];
                        if (segment) {
                            // Create burst particles from segments
                            for (let i = 0; i < 3; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const speed = Math.random() * 4 + 2;
                                const color = ['#ff0000', '#ff6600', '#ffaa00'][Math.floor(Math.random() * 3)];
                                
                                particlePool.spawn(
                                    segment.x,
                                    segment.y,
                                    Math.cos(angle) * speed,
                                    Math.sin(angle) * speed,
                                    color,
                                    4 + Math.random() * 4,
                                    Math.random() > 0.5 ? 'circle' : 'square',
                                    {
                                        fadeRate: 0.03,
                                        gravity: 0.1
                                    }
                                );
                            }
                        }
                    }
                }
                
                // Phase 3: Final explosion (600ms)
                if (this.deathAnimationTimer >= 600 && !this.finalExplosionTriggered) {
                    this.finalExplosionTriggered = true;
                    
                    // Trigger the main death particles
                    const snakeColor = this.color || '#ff0000';
                    createDeathParticles(this.x, this.y, this.length, snakeColor, this.elements);
                    
                    // Play retro explosion sound for player death
                    if (this.isPlayer && !musicMuted) {
                        const retroExplosion = new Audio('sounds/retro-explode-boom.mp3');
                        retroExplosion.volume = 0.7;
                        retroExplosion.play().catch(e => {});
                    }
                    
                    // Screen shake for player death
                    if (this.isPlayer) {
                        // TODO: Implement regular screen shake
                        // screenShakeTimer = 20;
                        // screenShakeIntensity = 10;
                    }
                }
                
                // Complete death sequence
                if (progress >= 1 && !this.deathComplete) {
                    this.deathComplete = true;
                    this.alive = false;
                    this.die(this.isBossDeath); // Call die again to complete the death process
                }
            }
            
            explode(killer) {
                // Check if either party is a boss - bosses don't make explosion sounds
                const killerIsBoss = killer && killer.isBoss;
                const thisIsBoss = this.isBoss;
                
                // Play explosion sound - louder if player is involved, skip if either party is boss
                if (!killerIsBoss && !thisIsBoss) {
                    const isPlayerInvolved = this.isPlayer || (killer && killer.isPlayer);
                    playExplosionSound(isPlayerInvolved);
                }
                
                // Add screen flash effect for player death (helps identify what killed you)
                if (this.isPlayer && canvas) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.restore();
                }
                
                // Award points and kills to killer - but only once
                if (killer && killer.alive && !this.hasExploded) {
                    killer.score += 500; // 500 points for snake explosion
                    killer.kills++; // Increment kill count
                    
                    // Track kill event if player is the killer
                    if (killer.isPlayer) {
                        // Track killstreak for AI snake kills
                        if (!this.isPlayer && window.killstreakManager) {
                            window.killstreakManager.onKill();
                        }
                        
                        // Dispatch enemy killed event
                        dispatchGameEvent('enemyKilled', {
                            victimName: this.name,
                            victimScore: this.score,
                            victimLength: this.segments.length,
                            killerScore: killer.score,
                            totalKills: killer.kills
                        });
                        
                        if (window.leaderboardModule && window.leaderboardModule.addGameEvent) {
                            window.leaderboardModule.addGameEvent('kill', {
                                victim_name: this.name,
                                victim_score: this.score,
                                victim_length: this.segments.length,
                                killer_score: killer.score,
                                total_kills: killer.kills
                            });
                        }
                    }
                    
                    // Check for new high score if player
                    if (killer.isPlayer && killer.score > highScore) {
                        highScore = killer.score;
                        localStorage.setItem('highScore', highScore.toString());
                    }
                    
                    // Mark as exploded to prevent double scoring
                    this.hasExploded = true;
                }
                
                // Always call die to trigger death animation
                this.die();
            }
            
            draw(interpolation = 0) {
                if (!this.alive && !this.isDying) return;
                
                // Apply death animation effects
                if (this.isDying) {
                    ctx.save();
                    
                    // Flash effect during death
                    if (this.deathFlashPhase > 0) {
                        ctx.globalAlpha = 0.5 + this.deathFlashPhase * 0.5;
                    }
                    
                    // Segment dispersal effect
                    if (this.deathSegmentPhase > 0) {
                        // Make segments gradually disappear from tail to head
                        const visibleSegments = Math.floor(this.segments.length * (1 - this.deathSegmentPhase));
                        if (visibleSegments <= 0) {
                            ctx.restore();
                            return; // Don't draw if all segments are gone
                        }
                    }
                }
                
                // Get size multiplier (bosses have size = 3, normal snakes have size = 1)
                // Ensure size multiplier is always at least 1 to prevent invisibility
                const sizeMultiplier = Math.max(1, this.size || 1);
                
                // Early viewport check for the whole snake
                // Skip rendering if snake is completely off-screen (performance optimization)
                if (this.segments.length > 0) {
                    // Quick check using head position first
                    // Increase margin for larger snakes (bosses)
                    const margin = (isMobile ? 300 : 400) * sizeMultiplier;
                    if (!isInViewport(this.x, this.y, margin)) {
                        // Check if any segment is visible
                        let anyInViewport = false;
                        // Check every 5th segment for performance
                        for (let i = 0; i < this.segments.length; i += 5) {
                            if (isInViewport(this.segments[i].x, this.segments[i].y, margin)) {
                                anyInViewport = true;
                                break;
                            }
                        }
                        if (!anyInViewport) return;
                    }
                }
                
                // Explicit player visibility protection - AFTER viewport check to avoid dangling ctx.save()
                if (this.isPlayer) {
                    ctx.save();
                    ctx.globalAlpha = 1; // Force full opacity for player
                }
                
                // Draw boost trail effect (desktop only)
                if (!isMobile && this.isBoosting && this.segments && this.segments.length > 1) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    
                    // Draw speed lines
                    for (let i = 0; i < 3; i++) {
                        const segment = this.segments[Math.min(i * 2, this.segments.length - 1)];
                        const nextSegment = this.segments[Math.min(i * 2 + 5, this.segments.length - 1)];
                        
                        const screenX1 = segment.x - camera.x + canvas.width / 2;
                        const screenY1 = segment.y - camera.y + canvas.height / 2;
                        const screenX2 = nextSegment.x - camera.x + canvas.width / 2;
                        const screenY2 = nextSegment.y - camera.y + canvas.height / 2;
                        
                        // Skip if any coordinate is invalid
                        if (!isFinite(screenX1) || !isFinite(screenY1) || !isFinite(screenX2) || !isFinite(screenY2)) {
                            continue;
                        }
                        
                        const gradient = ctx.createLinearGradient(screenX1, screenY1, screenX2, screenY2);
                        gradient.addColorStop(0, this.isPlayer ? 'rgba(100, 200, 255, 0.6)' : 'rgba(255, 100, 100, 0.6)');
                        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                        
                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = SEGMENT_SIZE * 2 - i * 5;
                        ctx.beginPath();
                        ctx.moveTo(screenX1, screenY1);
                        ctx.lineTo(screenX2, screenY2);
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                }
                
                // Draw segments
                let segmentsToDraw = this.segments.length;
                if (this.isDying && this.deathSegmentPhase > 0) {
                    // Reduce visible segments during death animation
                    segmentsToDraw = Math.floor(this.segments.length * (1 - this.deathSegmentPhase));
                }
                
                for (let i = segmentsToDraw - 1; i >= 0; i--) {
                    const segment = this.segments[i];
                    
                    // Skip segments that have exploded during death
                    if (this.isDying && this.deathSegmentPhase > 0) {
                        // Random chance to skip drawing this segment (creates dissolving effect)
                        if (Math.random() < this.deathSegmentPhase * 0.3) continue;
                    }
                    
                    // Interpolate position if previous position exists
                    let x = segment.x;
                    let y = segment.y;
                    if (segment.prevX !== undefined && segment.prevY !== undefined) {
                        x = segment.prevX + (segment.x - segment.prevX) * interpolation;
                        y = segment.prevY + (segment.y - segment.prevY) * interpolation;
                    }
                    
                    const screen = worldToScreen(x, y);
                    const screenX = screen.x;
                    const screenY = screen.y;
                    
                    // Skip if off-screen
                    if (screenX < -50 || screenX > canvas.width + 50 ||
                        screenY < -50 || screenY > canvas.height + 50) continue;
                    
                    // Snake body color based on skin
                    const skinData = skinMetadata[this.skin];
                    const colors = skinData ? skinData.colors : ['#4ecdc4', '#45b7aa'];
                    
                    // Always use normal colors
                    ctx.fillStyle = colors[i % colors.length];
                    
                    // Draw pixelated square segment with tapered tail
                    const pixelSize = 4;
                    const baseSegmentSize = SEGMENT_SIZE * sizeMultiplier;
                    
                    // Calculate segment size with smooth tapering
                    let segmentRadius;
                    const totalSegments = this.segments.length;
                    
                    // Progressive tapering throughout the snake, more aggressive at the tail
                    if (i < totalSegments * 0.7) {
                        // First 70% of snake maintains mostly full size with very slight taper
                        segmentRadius = baseSegmentSize * (1 - i * 0.001) * cameraZoom;
                    } else {
                        // Last 30% tapers more aggressively
                        const tailPosition = (i - totalSegments * 0.7) / (totalSegments * 0.3);
                        // Use exponential curve for smoother taper
                        const taperFactor = Math.pow(1 - tailPosition, 1.5);
                        segmentRadius = baseSegmentSize * (0.8 * taperFactor + 0.2) * cameraZoom;
                    }
                    
                    // Ensure minimum size but allow very small tail tip
                    const segmentPixels = Math.max(1, Math.floor(segmentRadius * 2 / pixelSize));
                    
                    // Skip drawing if segment would be invisible (less than 1 pixel)
                    if (segmentPixels < 1) continue;
                    
                    // Draw main square segment
                    const segmentX = Math.floor(screenX / pixelSize) * pixelSize - segmentPixels * pixelSize / 2;
                    const segmentY = Math.floor(screenY / pixelSize) * pixelSize - segmentPixels * pixelSize / 2;
                    const segmentSize = segmentPixels * pixelSize;
                    
                    // Normal square segment for all (removed diamond shape as it was causing the lump)
                    ctx.fillRect(segmentX, segmentY, segmentSize, segmentSize);
                    
                    // Removed invincibility particles for better performance
                }
                
                // Draw head
                if (this.segments.length > 0) {
                    const head = this.segments[0];
                    
                    // Interpolate head position
                    let headX = head.x;
                    let headY = head.y;
                    let angle = this.angle;
                    
                    if (head.prevX !== undefined && head.prevY !== undefined) {
                        headX = head.prevX + (head.x - head.prevX) * interpolation;
                        headY = head.prevY + (head.y - head.prevY) * interpolation;
                    }
                    
                    if (this.prevAngle !== undefined) {
                        // Handle angle wrapping for smooth interpolation
                        let angleDiff = this.angle - this.prevAngle;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        angle = this.prevAngle + angleDiff * interpolation;
                    }
                    
                    // Offset head position forward along the snake direction
                    const offsetDistance = 10; // pixels to move head forward
                    const offsetX = Math.cos(angle) * offsetDistance;
                    const offsetY = Math.sin(angle) * offsetDistance;
                    
                    const screen = worldToScreen(headX + offsetX, headY + offsetY);
                    const screenX = screen.x;
                    const screenY = screen.y;
                    
                    // Draw boost glow around head (desktop only)
                    if (this.isBoosting && !isMobile) {
                        // Pixelated boost effect
                        const pixelSize = 8;
                        const boostColor = this.isPlayer ? 'rgba(100, 200, 255, 0.3)' : 'rgba(255, 100, 100, 0.3)';
                        ctx.fillStyle = boostColor;
                        
                        // Draw pixelated glow pattern
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
                    }
                    
                    // Removed invincibility particles for better performance
                    
                    // Draw skin image
                    const skinImage = skinImages[this.skin];
                    if (skinImage && skinImage.complete && !skinImage.error) {
                        // Debug logging for all skins
                        if (!window._gameOriginalSkinDebug) window._gameOriginalSkinDebug = new Set();
                        if (!window._gameOriginalSkinDebug.has(this.skin)) {
                            console.log(`[game-original.js] Drawing skin: ${this.skin}`);
                            console.log(`[game-original.js] Image dimensions: ${skinImage.width}x${skinImage.height}`);
                            console.log(`[game-original.js] Image complete: ${skinImage.complete}`);
                            console.log(`[game-original.js] Natural dimensions: ${skinImage.naturalWidth}x${skinImage.naturalHeight}`);
                            window._gameOriginalSkinDebug.add(this.skin);
                        }
                        
                        try {
                            ctx.save();
                            ctx.translate(screenX, screenY);
                            ctx.rotate(angle - Math.PI/2); // Rotate 90 degrees counter-clockwise so top faces body
                            // Increase head size by 15% for regular snakes (not bosses)
                            const baseMultiplier = this.isBoss ? 3.47875 : 3.47875 * 1.15; // 15% increase for non-boss snakes
                            const size = SEGMENT_SIZE * sizeMultiplier * baseMultiplier * cameraZoom;
                            
                            // Preserve aspect ratio - use naturalWidth/naturalHeight if available
                            const imgWidth = skinImage.naturalWidth || skinImage.width;
                            const imgHeight = skinImage.naturalHeight || skinImage.height;
                            
                            if (imgWidth > 0 && imgHeight > 0) {
                                const aspectRatio = imgWidth / imgHeight;
                                let drawWidth = size;
                                let drawHeight = size;
                                
                                if (aspectRatio > 1) {
                                    // Wider than tall
                                    drawHeight = size / aspectRatio;
                                } else if (aspectRatio < 1) {
                                    // Taller than wide
                                    drawWidth = size * aspectRatio;
                                }
                                
                                // Debug aspect ratio calculation
                                if (!window._aspectRatioDebug) window._aspectRatioDebug = new Set();
                                if (!window._aspectRatioDebug.has(this.skin)) {
                                    console.log(`[game-original.js] Aspect ratio for ${this.skin}: ${aspectRatio} (${imgWidth}x${imgHeight})`);
                                    console.log(`[game-original.js] Draw dimensions: ${drawWidth}x${drawHeight} (base size: ${size})`);
                                    window._aspectRatioDebug.add(this.skin);
                                }
                                
                                ctx.drawImage(skinImage, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                            } else {
                                // Fallback to square if dimensions not available
                                console.warn(`[game-original.js] No valid dimensions for ${this.skin}, using square`);
                                ctx.drawImage(skinImage, -size/2, -size/2, size, size);
                            }
                            ctx.restore();
                        } catch (e) {
                            ctx.restore();
                            // Fall through to emoji fallback
                        }
                    } else {
                        // Fallback to emoji if image not loaded
                        const emojiMultiplier = this.isBoss ? 2 : 2 * 1.15; // 15% increase for non-boss snakes
                        const snakeEmojiSize = Math.round(SEGMENT_SIZE * sizeMultiplier * emojiMultiplier * cameraZoom);
                        const snakeEmojiCanvas = getCachedEmoji(this.isPlayer ? '😊' : '🐍', snakeEmojiSize);
                        ctx.save();
                        ctx.globalAlpha = 1;
                        ctx.drawImage(snakeEmojiCanvas, screenX - snakeEmojiCanvas.width / 2, screenY - snakeEmojiCanvas.height / 2);
                        ctx.restore();
                    }
                    
                    // Draw name (with colored personality for AI snakes)
                    const nameFontSize = isMobile ? 11 : 14;
                    ctx.font = `bold ${nameFontSize}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'bottom';
                    const nameY = screenY - SEGMENT_SIZE * cameraZoom - 10;
                    
                    // Check for boss first, before checking personality
                    if (this.isBoss) {
                        // Bosses don't show their name, only the skull emoji below
                    } else if (!this.isPlayer && this.personality) {
                        // Get actual name without personality prefix
                        const personalityName = this.personality.name + ' ';
                        const actualName = this.name.substring(personalityName.length);
                        
                        // Draw only the actual name (no personality prefix)
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 3;
                        ctx.fillStyle = 'white';
                        ctx.strokeText(actualName, screenX, nameY);
                        ctx.fillText(actualName, screenX, nameY);
                    } else {
                        // Player name or AI without personality - with invincibility effect
                        if (this.isPlayer && this.invincibilityTimer > 0 && gameMode !== 'cozy') {
                            // Save context state
                            ctx.save();
                            
                            // Add golden glow effect
                            ctx.shadowColor = '#FFD700';
                            ctx.shadowBlur = 20;
                            
                            // Draw golden outline
                            ctx.strokeStyle = '#FFD700';
                            ctx.lineWidth = 6;
                            ctx.strokeText(this.name, screenX, nameY);
                            
                            // Draw black inner stroke for readability
                            ctx.shadowBlur = 0;
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 2;
                            ctx.strokeText(this.name, screenX, nameY);
                            
                            // Draw white fill text
                            ctx.fillStyle = 'white';
                            ctx.fillText(this.name, screenX, nameY);
                            
                            // Restore context state
                            ctx.restore();
                        } else {
                            // Normal name rendering
                            ctx.strokeStyle = 'black';
                            ctx.lineWidth = 3;
                            ctx.fillStyle = 'white';
                            ctx.strokeText(this.name, screenX, nameY);
                            ctx.fillText(this.name, screenX, nameY);
                        }
                    }
                    
                    // Draw crown if leader (but not in cozy mode)
                    if (this.isLeader && gameMode !== 'cozy') {
                        const crownSize = 24;
                        const crownCanvas = getCachedEmoji('👑', crownSize);
                        ctx.save();
                        ctx.globalAlpha = 1;
                        // Increased offset from 30 to 45 to move crown higher
                        ctx.drawImage(crownCanvas, screenX - crownCanvas.width / 2, screenY - SEGMENT_SIZE * cameraZoom - 45 - crownCanvas.height / 2);
                        ctx.restore();
                    }
                    
                    // Draw skull if boss
                    if (this.isBoss) {
                        const skullSize = 32; // Larger than crown
                        const skullCanvas = getCachedEmoji('💀', skullSize);
                        ctx.save();
                        ctx.globalAlpha = 1;
                        // Position skull above head, similar to crown but larger
                        ctx.drawImage(skullCanvas, screenX - skullCanvas.width / 2, screenY - SEGMENT_SIZE * cameraZoom - 50 - skullCanvas.height / 2);
                        ctx.restore();
                    }
                }
                
                // Restore death animation context
                if (this.isDying) {
                    ctx.restore();
                }
                
                // Restore context state for player
                if (this.isPlayer) {
                    ctx.restore();
                }
            }
            
            // Enhanced AI update logic with personalities
            updateAI(deltaTime) {
                const personality = this.personality;
                const currentTime = Date.now();
                
                // Update panic mode
                if (this.panicMode) {
                    this.panicTimer--;
                    if (this.panicTimer <= 0) {
                        this.panicMode = false;
                    }
                }
                
                // Border avoidance (personality-aware)
                const borderDanger = personality.riskTolerance > 0.7 ? 80 : 120;
                const emergencyDistance = personality.riskTolerance > 0.7 ? 40 : 60;
                
                // Check distances to borders
                const distToLeftBorder = this.x;
                const distToRightBorder = WORLD_SIZE - this.x;
                const distToTopBorder = this.y;
                const distToBottomBorder = WORLD_SIZE - this.y;
                
                const nearBorder = distToLeftBorder < borderDanger || distToRightBorder < borderDanger ||
                                  distToTopBorder < borderDanger || distToBottomBorder < borderDanger;
                
                const emergencyTurn = distToLeftBorder < emergencyDistance || distToRightBorder < emergencyDistance ||
                                     distToTopBorder < emergencyDistance || distToBottomBorder < emergencyDistance;
                
                if (emergencyTurn || this.panicMode) {
                    // Emergency evasion with personality-based urgency
                    let avoidAngle = this.angle;
                    const urgency = personality.riskTolerance < 0.5 ? 0.2 : 0.15;
                    
                    if (distToLeftBorder < emergencyDistance) avoidAngle = 0;
                    else if (distToRightBorder < emergencyDistance) avoidAngle = Math.PI;
                    
                    if (distToTopBorder < emergencyDistance) avoidAngle = Math.PI / 2;
                    else if (distToBottomBorder < emergencyDistance) avoidAngle = -Math.PI / 2;
                    
                    let angleDiff = avoidAngle - this.angle;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    this.angle += angleDiff * urgency;
                    
                    return; // Skip normal AI when in emergency mode
                }
                
                // Enhanced snake collision detection and avoidance
                let dangerVector = { x: 0, y: 0 };
                let nearestThreat = null;
                let nearestPrey = null;
                let threatDistance = Infinity;
                let preyDistance = Infinity;
                let lateralThreats = new Map(); // Track threats by direction - moved here to fix scope issue
                
                // Optimize: Check collisions more frequently for better avoidance
                if (currentTime - this.lastCollisionCheck > 20) { // Check more frequently for better response
                    this.lastCollisionCheck = currentTime;
                    
                    // Add future position prediction - longer for better planning
                    const futureTime = personality.predictiveLookAhead * 1.5; // Increased prediction time
                    const futureX = this.x + Math.cos(this.angle) * this.speed * futureTime * 60;
                    const futureY = this.y + Math.sin(this.angle) * this.speed * futureTime * 60;
                    
                    // Track segment density around us
                    let nearbySegmentCount = 0;
                    const densityRadius = 300; // Increased for better awareness
                    
                    // Vision cone parameters - wider and farther for better detection
                    const visionDistance = 500 + (personality.collisionAvoidanceRadius * 0.8); // Further vision
                    const visionAngle = Math.PI / 1.5; // 120 degree cone (wider)
                    const visionConeAngle = personality.riskTolerance < 0.3 ? visionAngle * 1.3 : visionAngle;
                    
                    // Additional peripheral vision for detecting segments to the side
                    const peripheralDistance = 250 + personality.collisionAvoidanceRadius;
                    const peripheralAngle = Math.PI; // 180 degrees - full side vision
                    
                    // Add lateral scanning rays for better side awareness
                    const lateralCheckAngles = [-Math.PI/2, -Math.PI/4, 0, Math.PI/4, Math.PI/2]; // Check 5 directions
                    lateralThreats.clear(); // Clear previous threats
                    
                    for (const otherSnake of snakes) {
                        if (otherSnake === this || !otherSnake.alive) continue;
                        
                        const dx = otherSnake.x - this.x;
                        const dy = otherSnake.y - this.y;
                        const distanceSq = dx * dx + dy * dy;
                        const distance = Math.sqrt(distanceSq);
                        
                        // Check if this snake is a threat or prey
                        const lengthRatio = otherSnake.length / this.length;
                        
                        // Special avoidance behavior - always avoid player
                        if (personality.playerAvoidanceRadius && otherSnake.isPlayer) {
                            if (distance < personality.playerAvoidanceRadius) {
                                // Treat player as major threat regardless of size
                                const avoidanceWeight = 1 - (distance / personality.playerAvoidanceRadius);
                                dangerVector.x -= (dx / distance) * avoidanceWeight * 3.0;
                                dangerVector.y -= (dy / distance) * avoidanceWeight * 3.0;
                            }
                        }
                        
                        // Threat detection
                        if (lengthRatio > personality.fleeThreshold && distance < 300) {
                            if (distance < threatDistance) {
                                threatDistance = distance;
                                nearestThreat = otherSnake;
                            }
                        }
                        
                        // Prey detection - fixed to use preyRatioMax
                        const isValidPrey = lengthRatio <= personality.preyRatioMax;
                        const inChaseRange = distance < personality.chaseDistance;
                        
                        if (isValidPrey && inChaseRange && personality.huntingPriority > 0) {
                            // Some personalities prefer wounded or very small targets
                            if (personality.preferWeakTargets) {
                                const isWeak = otherSnake.length < this.length * 0.5 || otherSnake.stamina < 30;
                                if (isWeak && distance < preyDistance) {
                                    preyDistance = distance;
                                    nearestPrey = otherSnake;
                                }
                            } else if (distance < preyDistance) {
                                preyDistance = distance;
                                nearestPrey = otherSnake;
                                if (this.personality && this.personality.name === 'Aggressive' && otherSnake.isPlayer) {
                                }
                            }
                        }
                        
                        // Check collision with snake body segments
                        // ALWAYS check segments, not just when close to head!
                        const maxCheckDistance = 1000; // Increased check range for better detection
                        
                        // For very long snakes, check every Nth segment for performance
                        const segmentCheckInterval = otherSnake.segments.length > 100 ? 2 : 1; // Check more segments
                        
                        // Always check segments regardless of head distance
                        const startIndex = otherSnake === this ? 5 : 1;
                        for (let i = startIndex; i < otherSnake.segments.length; i += segmentCheckInterval) {
                                const segment = otherSnake.segments[i];
                                const segDx = segment.x - this.x;
                                const segDy = segment.y - this.y;
                                const segDistanceSq = segDx * segDx + segDy * segDy;
                                const segDistance = Math.sqrt(segDistanceSq);
                                
                                // Skip segments that are too far away
                                if (segDistance > maxCheckDistance) continue;
                                
                                // Vision cone check - is this segment in our forward path?
                                const angleToSegment = Math.atan2(segDy, segDx);
                                let angleDiff = angleToSegment - this.angle;
                                while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                                while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                                
                                const inVisionCone = Math.abs(angleDiff) < visionConeAngle / 2 && segDistance < visionDistance;
                                const inPeripheral = Math.abs(angleDiff) < peripheralAngle / 2 && segDistance < peripheralDistance;
                                
                                // Also check future collision
                                const futureDx = segment.x - futureX;
                                const futureDy = segment.y - futureY;
                                const futureDistanceSq = futureDx * futureDx + futureDy * futureDy;
                                const futureDistance = Math.sqrt(futureDistanceSq);
                                
                                // Use the closer of current or future distance
                                const effectiveDistance = Math.min(segDistance, futureDistance);
                                
                                // Use appropriate check radius based on distance
                                const checkRadius = effectiveDistance < personality.collisionAvoidanceRadius ? 
                                                  personality.collisionAvoidanceRadius : 
                                                  personality.dangerZoneRadius;
                                
                                if (effectiveDistance < checkRadius || inVisionCone || inPeripheral) {
                                    // Check if this is a head or body segment
                                    const isHead = i === 0;
                                    
                                    // For aggressive snakes targeting player, don't avoid the head if we're similar size
                                    if (isHead && personality.huntingPriority > 0.7 && otherSnake.isPlayer) {
                                        const sizeRatio = this.length / otherSnake.length;
                                        if (sizeRatio >= 0.8 && sizeRatio <= 1.5) {
                                            continue; // Skip head avoidance for aggressive head-on attacks
                                        }
                                    }
                                    
                                    // Much stronger weight calculation for close segments
                                    const proximityWeight = effectiveDistance < 80 ? 
                                                          3.0 : // Triple weight for very close segments
                                                          effectiveDistance < 150 ?
                                                          2.0 : // Double weight for close segments
                                                          (1 - (effectiveDistance / checkRadius));
                                    
                                    // Stronger avoidance for body segments vs heads
                                    const bodyMultiplier = isHead ? 1.0 : personality.bodyAvoidanceMultiplier;
                                    const strengthMultiplier = personality.avoidanceStrength * bodyMultiplier;
                                    
                                    // Higher multipliers for different detection zones
                                    let visionMultiplier = 1.0;
                                    if (inVisionCone && effectiveDistance < 150) {
                                        visionMultiplier = 6.0; // Very high weight for segments directly ahead
                                    } else if (inVisionCone && effectiveDistance < 300) {
                                        visionMultiplier = 4.0;
                                    } else if (inVisionCone) {
                                        visionMultiplier = 3.0;
                                    } else if (inPeripheral) {
                                        visionMultiplier = 2.5; // Better weight for peripheral segments
                                    }
                                    
                                    const weight = proximityWeight * strengthMultiplier * 4 * visionMultiplier; // Increased base multiplier
                                    
                                    // Extra weight for player snake segments (they're more dangerous)
                                    const playerMultiplier = otherSnake.isPlayer ? 2.5 : 1.0; // Increased from 2.0
                                    
                                    // Use future position for avoidance if it's closer
                                    if (futureDistance < segDistance) {
                                        dangerVector.x -= (futureDx / futureDistance) * weight * playerMultiplier;
                                        dangerVector.y -= (futureDy / futureDistance) * weight * playerMultiplier;
                                    } else {
                                        dangerVector.x -= (segDx / segDistance) * weight * playerMultiplier;
                                        dangerVector.y -= (segDy / segDistance) * weight * playerMultiplier;
                                    }
                                    
                                    // Count nearby segments for density check
                                    if (segDistance < densityRadius) {
                                        nearbySegmentCount++;
                                    }
                                    
                                    // Track lateral threats for smarter navigation
                                    for (const checkAngle of lateralCheckAngles) {
                                        const rayAngle = this.angle + checkAngle;
                                        const rayDx = segment.x - (this.x + Math.cos(rayAngle) * 100);
                                        const rayDy = segment.y - (this.y + Math.sin(rayAngle) * 100);
                                        const rayDist = Math.sqrt(rayDx * rayDx + rayDy * rayDy);
                                        
                                        if (rayDist < 150) { // Threat detected in this direction
                                            const currentThreat = lateralThreats.get(checkAngle) || 0;
                                            lateralThreats.set(checkAngle, currentThreat + (150 - rayDist) / 150);
                                        }
                                    }
                                }
                            }
                    }
                    
                    // Add density-based danger if area is crowded
                    if (nearbySegmentCount > 8) { // Lower threshold for better response
                        const densityFactor = Math.min(nearbySegmentCount / 15, 1.0); // Cap at 1.0
                        dangerVector.x *= (1 + densityFactor * 0.8); // Stronger amplification
                        dangerVector.y *= (1 + densityFactor * 0.8);
                    }
                }
                
                // Decision making based on personality and situation
                let targetAngle = null;
                let shouldBoost = false;
                
                // Priority 1: Avoid immediate collisions - much lower threshold
                const dangerMagnitudeSq = dangerVector.x * dangerVector.x + dangerVector.y * dangerVector.y;
                const dangerMagnitude = Math.sqrt(dangerMagnitudeSq);
                if (dangerMagnitude > 0.05) { // Reduced threshold for faster response
                    // Calculate escape angle - opposite of danger
                    targetAngle = Math.atan2(dangerVector.y, dangerVector.x);
                    
                    // Add smart escape logic with lateral awareness
                    const escapeAngles = [];
                    const angleSteps = 16; // More angles for better path finding
                    
                    // Use lateral threat data to find safest initial direction
                    let safestDirection = 0;
                    let minThreat = Infinity;
                    for (const [angle, threat] of lateralThreats) {
                        if (threat < minThreat) {
                            minThreat = threat;
                            safestDirection = angle;
                        }
                    }
                    
                    for (let i = 0; i < angleSteps; i++) {
                        // Bias search toward safer lateral directions
                        const biasedAngle = targetAngle + safestDirection * 0.3;
                        const testAngle = biasedAngle + (i * Math.PI * 2 / angleSteps);
                        let clearDistance = 0;
                        let narrowestGap = Infinity;
                        let pathScore = 0;
                        
                        // Check how clear this direction is with finer granularity
                        const checkStep = 15;
                        for (let dist = checkStep; dist < personality.collisionAvoidanceRadius * 1.2; dist += checkStep) {
                            const checkX = this.x + Math.cos(testAngle) * dist;
                            const checkY = this.y + Math.sin(testAngle) * dist;
                            let blocked = false;
                            let minDist = Infinity;
                            
                            // Quick check against all snake segments
                            for (const snake of snakes) {
                                if (snake === this || !snake.alive) continue;
                                // Skip head check for aggressive snakes hunting player
                                const startJ = (snake.isPlayer && personality.huntingPriority > 0.7) ? 1 : 0;
                                const checkInterval = snake.segments.length > 100 ? 2 : 1;
                                
                                for (let j = startJ; j < snake.segments.length; j += checkInterval) {
                                    const segment = snake.segments[j];
                                    const sdx = segment.x - checkX;
                                    const sdy = segment.y - checkY;
                                    const segDist = Math.sqrt(sdx * sdx + sdy * sdy);
                                    
                                    minDist = Math.min(minDist, segDist);
                                    
                                    // Tighter gaps for aggressive, wider for cautious
                                    const threshold = personality.riskTolerance > 0.7 ? 25 : 35;
                                    if (segDist < threshold) {
                                        blocked = true;
                                        break;
                                    }
                                }
                                if (blocked) break;
                            }
                            
                            narrowestGap = Math.min(narrowestGap, minDist);
                            
                            if (blocked) break;
                            clearDistance = dist;
                            
                            // Reward wider paths
                            if (minDist > 60) pathScore += 2;
                            else if (minDist > 40) pathScore += 1;
                        }
                        
                        // Calculate overall score considering distance, gap width, and path quality
                        const score = clearDistance + 
                                     (narrowestGap > 50 ? narrowestGap : narrowestGap * 0.5) +
                                     pathScore * 10;
                        
                        escapeAngles.push({ angle: testAngle, score, clearDistance, narrowestGap });
                    }
                    
                    // Sort by score and pick best option based on personality
                    escapeAngles.sort((a, b) => b.score - a.score);
                    
                    // Aggressive snakes willing to take tighter paths
                    if (personality.riskTolerance > 0.8 && escapeAngles[0].narrowestGap > 30) {
                        targetAngle = escapeAngles[0].angle;
                    } else {
                        // Defensive snakes prefer wider gaps
                        const safeOptions = escapeAngles.filter(e => e.narrowestGap > 45);
                        targetAngle = safeOptions.length > 0 ? safeOptions[0].angle : escapeAngles[0].angle;
                    }
                    
                    // Boost decision based on danger level - more aggressive
                    shouldBoost = dangerMagnitude > 0.2 || personality.riskTolerance < 0.7; // Lower thresholds
                    
                    // Enter panic mode if danger is very high - more sensitive
                    if (dangerMagnitude > 0.3) { // Reduced from 0.5
                        this.panicMode = true;
                        this.panicTimer = 120; // 2 seconds at 60fps (increased from 1.5)
                    }
                }
                // Priority 2: Flee from threats
                else if (nearestThreat && threatDistance < 200) {
                    const dx = nearestThreat.x - this.x;
                    const dy = nearestThreat.y - this.y;
                    targetAngle = Math.atan2(-dy, -dx); // Opposite direction
                    shouldBoost = personality.riskTolerance < 0.7 && this.stamina > 40;
                }
                // Priority 3: Hunt prey (aggressive personalities)
                else if (nearestPrey || (personality.huntingPriority > 0.7 && !this.huntTarget)) {
                    if (this.personality && this.personality.name === 'Aggressive') {
                    }
                    // For aggressive personalities, actively search for prey
                    if (!nearestPrey && personality.huntingPriority > 0.7) {
                        // Active hunting - scan for ANY potential prey
                        let bestPrey = null;
                        let bestPreyScore = -Infinity;
                        const huntRadius = personality.chaseDistance * 1.5; // Extended search radius
                        
                        for (const otherSnake of snakes) {
                            if (otherSnake === this || !otherSnake.alive) continue;
                            
                            const dist = Math.hypot(otherSnake.x - this.x, otherSnake.y - this.y);
                            if (dist > huntRadius) continue;
                            
                            const lengthRatio = otherSnake.length / this.length;
                            if (lengthRatio > personality.preyRatioMax) continue;
                            
                            // Score based on size, distance, and vulnerability
                            let preyScore = (this.length - otherSnake.length) / dist;
                            
                            // Prioritize player for aggressive snakes
                            if (otherSnake.isPlayer) {
                                preyScore *= 2.0;
                                if (this.personality && this.personality.name === 'Aggressive') {
                                }
                            }
                            
                            // Prioritize wounded or low stamina targets
                            if (otherSnake.stamina < 30) preyScore *= 1.5;
                            
                            // Check if we can intercept them
                            const interceptPos = this.calculateInterceptPosition(otherSnake);
                            if (interceptPos) preyScore *= 1.3;
                            
                            if (preyScore > bestPreyScore) {
                                bestPreyScore = preyScore;
                                bestPrey = otherSnake;
                            }
                        }
                        
                        if (bestPrey) {
                            this.huntTarget = bestPrey;
                            this.huntTargetTimer = 180; // Track for 3 seconds
                            if (this.personality && this.personality.name === 'Aggressive' && bestPrey.isPlayer) {
                            }
                        }
                    }
                    
                    // Use existing nearestPrey or hunted target
                    const actualPrey = nearestPrey || this.huntTarget;
                    
                    if (actualPrey && actualPrey.alive) {
                        const preyDist = Math.hypot(actualPrey.x - this.x, actualPrey.y - this.y);
                        const shouldHunt = personality.huntingPriority > 0.8 || 
                                         (personality.huntingPriority > 0.5 && preyDist < 200);
                        
                        if (shouldHunt) {
                            // Advanced interception logic
                            let interceptPos = null;
                            
                            // For aggressive snakes, try to cut off escape routes
                            if (personality.huntingPriority > 0.8 && actualPrey.isPlayer) {
                                interceptPos = this.calculateCutoffPosition(actualPrey);
                                if (this.personality && this.personality.name === 'Aggressive') {
                                }
                            }
                            
                            // Fallback to standard interception
                            if (!interceptPos) {
                                interceptPos = this.calculateInterceptPosition(actualPrey);
                            }
                            
                            // Use prediction or current position
                            if (interceptPos) {
                                targetAngle = Math.atan2(interceptPos.y - this.y, interceptPos.x - this.x);
                            } else {
                                const dx = actualPrey.x - this.x;
                                const dy = actualPrey.y - this.y;
                                targetAngle = Math.atan2(dy, dx);
                            }
                            
                            // Aggressive boost strategy
                            if (personality.huntingPriority > 0.8) {
                                // Boost when closing in or when prey is escaping
                                shouldBoost = (this.stamina > 40 && preyDist < 300) ||
                                            (this.stamina > 60 && actualPrey.isBoosting);
                            } else {
                                shouldBoost = this.stamina > 30 && preyDist < 200;
                            }
                            
                            // Override element seeking for aggressive snakes
                            this.targetMemory = null;
                            this.targetMemoryTimer = 0;
                        }
                    }
                    
                    // Update hunt target timer
                    if (this.huntTargetTimer > 0) {
                        this.huntTargetTimer--;
                        if (this.huntTargetTimer === 0 || !this.huntTarget || !this.huntTarget.alive) {
                            this.huntTarget = null;
                        }
                    }
                }
                // Priority 4: Seek game objectives
                else {
                    // Aggressive personalities should still look for prey opportunities
                    if (personality.huntingPriority > 0.7 && Math.random() < personality.elementIgnoreChance) {
                        // Scan for any snakes we might have missed
                        for (const otherSnake of snakes) {
                            if (otherSnake === this || !otherSnake.alive) continue;
                            const dist = Math.hypot(otherSnake.x - this.x, otherSnake.y - this.y);
                            if (dist < personality.chaseDistance * 0.7 && otherSnake.length < this.length) {
                                // Found a target! Predict head position to eat them
                                const predictedPos = this.predictHeadPosition(otherSnake);
                                if (predictedPos) {
                                    const dx = predictedPos.x - this.x;
                                    const dy = predictedPos.y - this.y;
                                    targetAngle = Math.atan2(dy, dx);
                                    shouldBoost = this.stamina > 40 && dist < 200;
                                }
                                break;
                            }
                        }
                    }
                    
                    // If still no target, seek elements
                    if (targetAngle === null) {
                        let target = null;
                        
                        // Use cached target for a few frames to reduce computation
                        if (this.targetMemory && this.targetMemoryTimer > 0) {
                            target = this.targetMemory;
                            this.targetMemoryTimer--;
                        } else {
                        // Find new target based on personality
                        if (this.elements.length >= this.elementCapacity) {
                            // At capacity - prioritize Void Orbs
                            let nearestVoidOrb = null;
                            let minVoidDist = 800;
                            
                            for (const orb of voidOrbs) {
                                const dist = Math.hypot(orb.x - this.x, orb.y - this.y);
                                if (dist < minVoidDist && !this.isPathBlocked(orb.x, orb.y, dist)) {
                                    minVoidDist = dist;
                                    nearestVoidOrb = orb;
                                }
                            }
                            target = nearestVoidOrb;
                        }
                        
                        // Check for Catalyst Gems (combo-focused personalities prioritize these)
                        if (!target && this.elements.length > 0 && personality.comboPriority > Math.random()) {
                            let nearestCatalystGem = null;
                            let minCatalystDist = 600;
                            
                            for (const gem of catalystGems) {
                                const dist = Math.hypot(gem.x - this.x, gem.y - this.y);
                                if (dist < minCatalystDist && !this.isPathBlocked(gem.x, gem.y, dist)) {
                                    minCatalystDist = dist;
                                    nearestCatalystGem = gem;
                                }
                            }
                            target = nearestCatalystGem;
                        }
                        
                        // Find nearest element if no special targets
                        if (!target) {
                            let nearestElement = null;
                            let minDist = 500;
                            
                            for (const element of elementPool.getActiveElements()) {
                                const dist = Math.hypot(element.x - this.x, element.y - this.y);
                                if (dist < minDist && !this.isPathBlocked(element.x, element.y, dist)) {
                                    minDist = dist;
                                    nearestElement = element;
                                }
                            }
                            target = nearestElement;
                        }
                        
                        // Cache the target
                        this.targetMemory = target;
                        this.targetMemoryTimer = 30; // Cache for 30 frames
                    }
                    
                    if (target) {
                        targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
                        
                        // Boost decision based on personality and distance
                        const targetDist = Math.hypot(target.x - this.x, target.y - this.y);
                        if (targetDist > 300 && this.stamina > (personality.boostThreshold * 100)) {
                            shouldBoost = true;
                        }
                    }
                    } // Close the if (targetAngle === null) check
                }
                
                // Apply turning with personality-based smoothness
                if (targetAngle !== null) {
                    let angleDiff = targetAngle - this.angle;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    
                    // Dynamic turn speed based on situation - increased for better response
                    let turnSpeed;
                    if (this.panicMode || dangerMagnitude > 0.2) { // Lower threshold
                        // Emergency turn - much faster
                        turnSpeed = 0.20 + (personality.avoidanceStrength * 0.15); // Increased turn rates
                    } else if (dangerMagnitude > 0.1) {
                        // High danger - very fast turn
                        turnSpeed = 0.18 + (personality.avoidanceStrength * 0.1);
                    } else if (nearestThreat && threatDistance < 200) {
                        // Fleeing - fast turn
                        turnSpeed = 0.15;
                    } else {
                        // Normal turn - personality-based
                        turnSpeed = personality.riskTolerance > 0.7 ? 0.10 : 0.08; // Slightly increased
                    }
                    
                    this.angle += angleDiff * turnSpeed;
                } else {
                    // Wander with personality-based randomness
                    const wanderAmount = personality.riskTolerance * 0.05;
                    this.angle += (Math.random() - 0.5) * wanderAmount;
                }
                
                // Set boost state
                this.isBoosting = shouldBoost && this.stamina > 20 && !nearBorder;
            }
            
            // Helper method for predicting head position to eat smaller snakes
            predictHeadPosition(targetSnake) {
                if (!targetSnake || !targetSnake.segments || targetSnake.segments.length === 0) {
                    return null;
                }
                
                // Get the head position
                const head = targetSnake.segments[0];
                const targetSpeed = targetSnake.speed || SNAKE_SPEED;
                const distance = Math.hypot(head.x - this.x, head.y - this.y);
                
                // Calculate time to intercept
                const relativeSpeed = this.speed * 1.5; // Assume we'll boost
                const interceptTime = distance / relativeSpeed;
                
                // Predict where the head will be
                const predictedX = head.x + Math.cos(targetSnake.angle) * targetSpeed * interceptTime;
                const predictedY = head.y + Math.sin(targetSnake.angle) * targetSpeed * interceptTime;
                
                return { x: predictedX, y: predictedY };
            }
            
            // Helper method for enhanced pathfinding
            isPathBlocked(targetX, targetY, distance) {
                // Check more thoroughly for nearby targets
                const checkDistance = Math.min(distance, 400); // Check further ahead
                const steps = Math.floor(checkDistance / 12); // Finer granularity
                if (steps <= 1) return false;
                
                const stepX = (targetX - this.x) / steps;
                const stepY = (targetY - this.y) / steps;
                
                // Also check perpendicular to the path for wider clearance
                // Aggressive snakes check narrower paths
                const clearanceWidth = this.personality.riskTolerance > 0.7 ? 20 : 30;
                const perpX = -stepY / Math.hypot(stepX, stepY) * clearanceWidth;
                const perpY = stepX / Math.hypot(stepX, stepY) * clearanceWidth;
                
                for (let i = 1; i < steps; i++) {
                    const checkX = this.x + stepX * i;
                    const checkY = this.y + stepY * i;
                    
                    // Check center and both sides of the path
                    const checkPoints = [
                        { x: checkX, y: checkY },
                        { x: checkX + perpX, y: checkY + perpY },
                        { x: checkX - perpX, y: checkY - perpY }
                    ];
                    
                    for (const point of checkPoints) {
                        // Check if this point is too close to any snake body
                        for (const snake of snakes) {
                            if (!snake.alive) continue;
                            
                            // For self, check from segment 5 onward
                            // For others, check from segment 1
                            const startIndex = snake === this ? 5 : 1;
                            
                            for (let j = startIndex; j < snake.segments.length; j++) {
                                const segment = snake.segments[j];
                                const segDist = Math.hypot(segment.x - point.x, segment.y - point.y);
                                
                                const threshold = snake === this ? 50 : SEGMENT_SIZE * 2.5;
                                if (segDist < threshold) {
                                    return true; // Path is blocked
                                }
                            }
                        }
                    }
                }
                
                return false; // Path is clear
            }
            
            // Calculate intercept position for predictive targeting
            calculateInterceptPosition(targetSnake) {
                if (!targetSnake || !targetSnake.segments || targetSnake.segments.length === 0) {
                    return null;
                }
                
                // Get target's current position and velocity
                const targetHead = targetSnake.segments[0];
                const targetSpeed = targetSnake.isBoosting ? targetSnake.speed * 1.5 : targetSnake.speed;
                const targetVx = Math.cos(targetSnake.angle) * targetSpeed;
                const targetVy = Math.sin(targetSnake.angle) * targetSpeed;
                
                // Our current position and max speed
                const mySpeed = this.isBoosting ? this.speed * 1.5 : this.speed;
                const myMaxSpeed = this.speed * 1.5; // Assume we can boost
                
                // Calculate relative position
                const dx = targetHead.x - this.x;
                const dy = targetHead.y - this.y;
                const distance = Math.hypot(dx, dy);
                
                // If target is very close, just go directly to current position
                if (distance < 50) {
                    return { x: targetHead.x, y: targetHead.y };
                }
                
                // Iterative prediction - find where we'll intercept
                let interceptTime = 0;
                let interceptX = targetHead.x;
                let interceptY = targetHead.y;
                const maxPredictionTime = 120; // 2 seconds at 60fps
                const timeStep = 5; // Check every 5 frames
                
                for (let t = 0; t < maxPredictionTime; t += timeStep) {
                    // Predict target position at time t
                    const predX = targetHead.x + targetVx * t;
                    const predY = targetHead.y + targetVy * t;
                    
                    // Distance we need to travel to intercept
                    const interceptDist = Math.hypot(predX - this.x, predY - this.y);
                    
                    // Time it would take us to reach that point
                    const ourTravelTime = interceptDist / myMaxSpeed;
                    
                    // If we can reach the intercept point in time, we found it
                    if (ourTravelTime <= t) {
                        interceptTime = t;
                        interceptX = predX;
                        interceptY = predY;
                        break;
                    }
                }
                
                // If no intercept found, predict ahead a bit anyway
                if (interceptTime === 0) {
                    interceptX = targetHead.x + targetVx * 30; // Half second prediction
                    interceptY = targetHead.y + targetVy * 30;
                }
                
                return { x: interceptX, y: interceptY };
            }
            
            // Calculate cutoff position to block escape routes
            calculateCutoffPosition(targetSnake) {
                if (!targetSnake || !targetSnake.segments || targetSnake.segments.length === 0) {
                    return null;
                }
                
                const targetHead = targetSnake.segments[0];
                
                // Find nearest borders to the target
                const borderDistances = {
                    left: targetHead.x,
                    right: WORLD_SIZE - targetHead.x,
                    top: targetHead.y,
                    bottom: WORLD_SIZE - targetHead.y
                };
                
                // Find which border the target is heading towards
                const targetVx = Math.cos(targetSnake.angle);
                const targetVy = Math.sin(targetSnake.angle);
                
                let escapeDirection = null;
                let minBorderDist = Infinity;
                
                // Check which border they're closest to and moving towards
                if (targetVx < -0.3 && borderDistances.left < 400) {
                    escapeDirection = 'left';
                    minBorderDist = borderDistances.left;
                } else if (targetVx > 0.3 && borderDistances.right < 400) {
                    escapeDirection = 'right';
                    minBorderDist = borderDistances.right;
                }
                
                if (targetVy < -0.3 && borderDistances.top < 400 && borderDistances.top < minBorderDist) {
                    escapeDirection = 'top';
                    minBorderDist = borderDistances.top;
                } else if (targetVy > 0.3 && borderDistances.bottom < 400 && borderDistances.bottom < minBorderDist) {
                    escapeDirection = 'bottom';
                    minBorderDist = borderDistances.bottom;
                }
                
                // If target is heading to a border, try to cut them off
                if (escapeDirection && minBorderDist < 400) {
                    let cutoffX = targetHead.x;
                    let cutoffY = targetHead.y;
                    const cutoffDistance = 100; // How far ahead to aim
                    
                    switch (escapeDirection) {
                        case 'left':
                            cutoffX = Math.max(50, targetHead.x - cutoffDistance);
                            cutoffY = targetHead.y + targetVy * 30;
                            break;
                        case 'right':
                            cutoffX = Math.min(WORLD_SIZE - 50, targetHead.x + cutoffDistance);
                            cutoffY = targetHead.y + targetVy * 30;
                            break;
                        case 'top':
                            cutoffX = targetHead.x + targetVx * 30;
                            cutoffY = Math.max(50, targetHead.y - cutoffDistance);
                            break;
                        case 'bottom':
                            cutoffX = targetHead.x + targetVx * 30;
                            cutoffY = Math.min(WORLD_SIZE - 50, targetHead.y + cutoffDistance);
                            break;
                    }
                    
                    return { x: cutoffX, y: cutoffY };
                }
                
                // If not escaping to border, try to cut off based on map center
                // Push them towards dangerous areas (other snakes or borders)
                const centerX = WORLD_SIZE / 2;
                const centerY = WORLD_SIZE / 2;
                const toCenterX = centerX - targetHead.x;
                const toCenterY = centerY - targetHead.y;
                
                // Position ourselves opposite of center to push them out
                const cutoffAngle = Math.atan2(-toCenterY, -toCenterX);
                const cutoffDist = 150;
                
                return {
                    x: targetHead.x + Math.cos(cutoffAngle) * cutoffDist,
                    y: targetHead.y + Math.sin(cutoffAngle) * cutoffDist
                };
            }
        }
        
        // Element class
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
                    gameLogger.warn('ELEMENTS', `Element ID ${id} not found`);
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
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
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
        
        // AlchemyVision power-up class
        class AlchemyVision {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 20;
                this.pulse = 0;
                this.rotation = 0;
            }
            
            update(deltaTime = 1) {
                this.pulse += 0.05 * deltaTime;
                this.rotation += 0.02 * deltaTime;
                
                // Magnetism effect
                const magnetRange = 120; // Slightly larger range for power-ups
                const magnetRangeSq = magnetRange * magnetRange;
                const magnetStrength = 5.0; // Stronger pull for power-ups
                const sizeSq = this.size * this.size;
                
                for (const snake of snakes) {
                    if (!snake.alive) continue;
                    
                    const dx = snake.x - this.x;
                    const dy = snake.y - this.y;
                    const distanceSq = dx * dx + dy * dy;
                    
                    if (distanceSq < magnetRangeSq && distanceSq > sizeSq) {
                        const distance = Math.sqrt(distanceSq);
                        const dirX = dx / distance;
                        const dirY = dy / distance;
                        const pullStrength = (1 - distance / magnetRange) * magnetStrength * deltaTime;
                        
                        this.x += dirX * pullStrength;
                        this.y += dirY * pullStrength;
                    }
                }
            }
            
            draw() {
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                // Skip if off-screen - tighter culling on mobile
                const margin = isMobile ? 30 : 50;
                if (screenX < -margin || screenX > canvas.width + margin ||
                    screenY < -margin || screenY > canvas.height + margin) return;
                
                const scale = 1 + Math.sin(this.pulse) * 0.1;
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.rotation);
                
                // Purple/gold glow effect
                const glowSize = this.size * 2 * scale;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(255, 215, 0, 0.6)'); // Gold
                gradient.addColorStop(0.5, 'rgba(147, 0, 211, 0.4)'); // Purple
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                
                // Crystal ball emoji
                const crystalSize = Math.round(this.size * 2 * scale);
                const crystalCanvas = getCachedEmoji('🔮', crystalSize);
                ctx.save();
                ctx.globalAlpha = 1;
                ctx.drawImage(crystalCanvas, -crystalCanvas.width / 2, -crystalCanvas.height / 2);
                ctx.restore();
                
                // Swirling particles
                for (let i = 0; i < 3; i++) {
                    const angle = (this.rotation * 2) + (i * Math.PI * 2 / 3);
                    const dist = this.size * scale;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    
                    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 215, 0, 0.8)' : 'rgba(147, 0, 211, 0.8)';
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }
        
        // VoidOrb class
        class VoidOrb {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 20;
                this.pulse = Math.random() * Math.PI * 2;
                this.rotation = 0;
            }
            
            update(deltaTime = 1) {
                this.pulse += 0.05 * deltaTime;
                this.rotation += 0.03 * deltaTime;
                
                // Magnetism effect
                const magnetRange = 120; // Slightly larger range for power-ups
                const magnetRangeSq = magnetRange * magnetRange;
                const magnetStrength = 5.0; // Stronger pull for power-ups
                const sizeSq = this.size * this.size;
                
                for (const snake of snakes) {
                    if (!snake.alive) continue;
                    
                    const dx = snake.x - this.x;
                    const dy = snake.y - this.y;
                    const distanceSq = dx * dx + dy * dy;
                    
                    if (distanceSq < magnetRangeSq && distanceSq > sizeSq) {
                        const distance = Math.sqrt(distanceSq);
                        const dirX = dx / distance;
                        const dirY = dy / distance;
                        const pullStrength = (1 - distance / magnetRange) * magnetStrength;
                        
                        this.x += dirX * pullStrength;
                        this.y += dirY * pullStrength;
                    }
                }
            }
            
            draw() {
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                // Skip if off-screen - tighter culling on mobile
                const margin = isMobile ? 30 : 50;
                if (screenX < -margin || screenX > canvas.width + margin ||
                    screenY < -margin || screenY > canvas.height + margin) return;
                
                const scale = 1 + Math.sin(this.pulse) * 0.1;
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.rotation);
                
                // Blue glow effect
                const glowSize = this.size * 2 * scale * cameraZoom;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(0, 150, 255, 0.6)'); // Bright blue
                gradient.addColorStop(0.5, 'rgba(0, 50, 200, 0.4)'); // Dark blue
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                
                // Void orb emoji
                ctx.save(); // Save canvas state for emoji
                ctx.globalAlpha = 1; // Ensure full opacity
                ctx.fillStyle = 'black'; // Set solid color for emoji
                ctx.font = `${this.size * 2 * scale * cameraZoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🌀', 0, 0);
                ctx.restore(); // Restore canvas state
                
                // Swirling particles
                for (let i = 0; i < 4; i++) {
                    const angle = (this.rotation * 3) + (i * Math.PI / 2);
                    const dist = this.size * scale * 0.8 * cameraZoom;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    
                    ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(px, py, 2 * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }
        
        // CatalystGem class
        class CatalystGem {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                this.size = 20;
                this.pulse = Math.random() * Math.PI * 2;
                this.rotation = 0;
                this.sparkleTime = 0;
            }
            
            update(deltaTime = 1) {
                this.pulse += 0.04 * deltaTime;
                this.rotation += 0.02 * deltaTime;
                this.sparkleTime += 0.1 * deltaTime;
                
                // Magnetism effect
                const magnetRange = 120; // Slightly larger range for power-ups
                const magnetRangeSq = magnetRange * magnetRange;
                const magnetStrength = 5.0; // Stronger pull for power-ups
                const sizeSq = this.size * this.size;
                
                for (const snake of snakes) {
                    if (!snake.alive) continue;
                    
                    const dx = snake.x - this.x;
                    const dy = snake.y - this.y;
                    const distanceSq = dx * dx + dy * dy;
                    
                    if (distanceSq < magnetRangeSq && distanceSq > sizeSq) {
                        const distance = Math.sqrt(distanceSq);
                        const dirX = dx / distance;
                        const dirY = dy / distance;
                        const pullStrength = (1 - distance / magnetRange) * magnetStrength;
                        
                        this.x += dirX * pullStrength;
                        this.y += dirY * pullStrength;
                    }
                }
            }
            
            draw() {
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                // Skip if off-screen - tighter culling on mobile
                const margin = isMobile ? 30 : 50;
                if (screenX < -margin || screenX > canvas.width + margin ||
                    screenY < -margin || screenY > canvas.height + margin) return;
                
                const scale = 1 + Math.sin(this.pulse) * 0.15;
                
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(this.rotation);
                
                // Orange glow effect
                const glowSize = this.size * 2.5 * scale * cameraZoom;
                const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
                gradient.addColorStop(0, 'rgba(255, 165, 0, 0.8)'); // Bright orange
                gradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.5)'); // Dark orange
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2);
                
                // Catalyst gem emoji
                ctx.save(); // Save canvas state for emoji
                ctx.globalAlpha = 1; // Ensure full opacity
                ctx.fillStyle = 'black'; // Set solid color for emoji
                ctx.font = `${this.size * 2 * scale * cameraZoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('💎', 0, 0);
                ctx.restore(); // Restore canvas state
                
                // Sparkle particles
                for (let i = 0; i < 6; i++) {
                    const angle = (this.sparkleTime + i * Math.PI / 3) % (Math.PI * 2);
                    const dist = this.size * scale * (0.8 + Math.sin(this.sparkleTime * 2 + i) * 0.3) * cameraZoom;
                    const px = Math.cos(angle) * dist;
                    const py = Math.sin(angle) * dist;
                    
                    ctx.fillStyle = 'rgba(255, 200, 100, 0.9)';
                    ctx.beginPath();
                    ctx.arc(px, py, (2 + Math.sin(this.sparkleTime * 3 + i) * 1) * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            }
        }
        
        // Enhanced Particle class with more visual options
        class Particle {
            constructor(x, y, vx, vy, color, size = 4, type = 'square') {
                this.reset(x, y, vx, vy, color, size, type);
            }
            
            reset(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
                this.x = x;
                this.y = y;
                this.vx = vx;
                this.vy = vy;
                this.color = color;
                this.size = size;
                this.life = 1;
                this.active = true;
                this.type = type; // 'square', 'circle', 'star', 'trail'
                
                // Additional options
                this.gravity = options.gravity || 0;
                this.rotation = options.rotation || 0;
                this.rotationSpeed = options.rotationSpeed || 0;
                this.fadeRate = options.fadeRate || 0.02;
                this.growthRate = options.growthRate || 0;
                this.trail = options.trail || false;
                this.trailLength = options.trailLength || 5;
                this.trailHistory = [];
                this.pulse = options.pulse || false;
                this.pulseSpeed = options.pulseSpeed || 0.1;
                this.pulsePhase = 0;
            }
            
            update(deltaTime = 1) {
                if (!this.active) return false;
                
                // Store trail history
                if (this.trail && this.life > 0.1) {
                    this.trailHistory.push({ x: this.x, y: this.y, life: this.life });
                    if (this.trailHistory.length > this.trailLength) {
                        this.trailHistory.shift();
                    }
                }
                
                // Update position
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                
                // Apply gravity
                this.vy += this.gravity * deltaTime;
                
                // Update life
                this.life -= this.fadeRate * deltaTime;
                
                // Apply friction
                this.vx *= Math.pow(0.98, deltaTime);
                this.vy *= Math.pow(0.98, deltaTime);
                
                // Update rotation
                this.rotation += this.rotationSpeed * deltaTime;
                
                // Update size
                this.size += this.growthRate * deltaTime;
                
                // Update pulse
                if (this.pulse) {
                    this.pulsePhase += this.pulseSpeed * deltaTime;
                }
                
                if (this.life <= 0) {
                    this.active = false;
                    this.trailHistory = [];
                    return false;
                }
                return true;
            }
            
            draw() {
                if (!this.active) return;
                
                const pixelSize = 4;
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                ctx.save();
                
                // Draw trail if enabled
                if (this.trail && this.trailHistory.length > 0) {
                    this.trailHistory.forEach((point, index) => {
                        const trailScreen = worldToScreen(point.x, point.y);
                        const alpha = (index / this.trailHistory.length) * this.life * 0.5;
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = this.color;
                        
                        const trailSize = this.size * (index / this.trailHistory.length);
                        ctx.fillRect(
                            Math.floor(trailScreen.x / pixelSize) * pixelSize,
                            Math.floor(trailScreen.y / pixelSize) * pixelSize,
                            trailSize,
                            trailSize
                        );
                    });
                }
                
                // Set main particle properties
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.life;
                
                // Apply pulse effect
                let actualSize = this.size;
                if (this.pulse) {
                    actualSize = this.size * (1 + Math.sin(this.pulsePhase) * 0.3);
                }
                
                // Draw based on type
                switch(this.type) {
                    case 'circle':
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, actualSize / 2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                        
                    case 'star':
                        ctx.save();
                        ctx.translate(screenX, screenY);
                        ctx.rotate(this.rotation);
                        
                        const spikes = 5;
                        const outerRadius = actualSize / 2;
                        const innerRadius = outerRadius * 0.5;
                        
                        ctx.beginPath();
                        for (let i = 0; i < spikes * 2; i++) {
                            const radius = i % 2 === 0 ? outerRadius : innerRadius;
                            const angle = (i * Math.PI) / spikes;
                            const x = Math.cos(angle) * radius;
                            const y = Math.sin(angle) * radius;
                            
                            if (i === 0) {
                                ctx.moveTo(x, y);
                            } else {
                                ctx.lineTo(x, y);
                            }
                        }
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                        break;
                        
                    case 'square':
                    default:
                        // Pixelated square (original behavior)
                        ctx.fillRect(
                            Math.floor(screenX / pixelSize) * pixelSize,
                            Math.floor(screenY / pixelSize) * pixelSize,
                            actualSize,
                            actualSize
                        );
                        break;
                }
                
                ctx.restore();
            }
        }
        
        // Object pools for performance
        class ParticlePool {
            constructor(size = 200) {
                this.pool = [];
                this.activeParticles = [];
                this.poolSize = size;
                
                // Pre-allocate particles
                for (let i = 0; i < size; i++) {
                    this.pool.push(new Particle(0, 0, 0, 0, 'white'));
                }
                
                // Pre-warm the pool by cycling through particles
                this.preWarm();
            }
            
            preWarm() {
                // Temporarily activate and deactivate particles to warm up memory
                const warmupCount = Math.min(50, this.poolSize);
                const tempParticles = [];
                for (let i = 0; i < warmupCount; i++) {
                    tempParticles.push(this.spawn(0, 0, 0, 0, 'white'));
                }
                // Return them to pool
                tempParticles.forEach(p => {
                    p.active = false;
                    p.life = 0;
                });
                this.update();
            }
            
            spawn(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
                let particle = this.pool.pop();
                if (!particle) {
                    // Pool is empty, create new particle
                    particle = new Particle(x, y, vx, vy, color, size, type);
                } else {
                    particle.reset(x, y, vx, vy, color, size, type, options);
                }
                this.activeParticles.push(particle);
                return particle;
            }
            
            update(deltaTime = 1) {
                for (let i = this.activeParticles.length - 1; i >= 0; i--) {
                    const particle = this.activeParticles[i];
                    if (!particle.update(deltaTime)) {
                        // Return to pool
                        this.activeParticles.splice(i, 1);
                        this.pool.push(particle);
                    }
                }
            }
            
            draw() {
                this.activeParticles.forEach(particle => {
                    if (isInViewport(particle.x, particle.y, 50)) {
                        particle.draw();
                    }
                });
            }
            
            getActiveCount() {
                return this.activeParticles.length;
            }
        }
        
        // Initialize particle pool
        const particlePool = new ParticlePool(isMobile ? 50 : 200); // Further reduced for mobile performance
        
        // Explosion manager will be initialized when game starts
        let explosionManager = null;
        
        // Element pool for performance
        class ElementPool {
            constructor(size = 50) {
                this.pool = [];
                this.activeElements = [];
            }
            
            spawn(id, x, y, isCatalystSpawned = false) {
                let element = this.pool.pop();
                if (!element) {
                    element = new Element(id, x, y, isCatalystSpawned);
                } else {
                    // Reset existing element
                    element.id = id;
                    element.x = x;
                    element.y = y;
                    
                    // Get element data from new system
                    const elem = window.elementLoader.elements.get(id);
                    if (elem) {
                        element.data = {
                            emoji: window.elementLoader.getEmojiForElement(id, elem.e),
                            name: elem.n,
                            tier: elem.t,
                            base: elem.t === 0
                        };
                    } else {
                        gameLogger.warn('ELEMENTS', `Element ID ${id} not found`);
                        element.data = { emoji: '❓', name: 'Unknown', tier: 0 };
                    }
                    element.pulse = 0;
                    element.isCatalystSpawned = isCatalystSpawned;
                    element.catalystSparkleTime = 0;
                }
                this.activeElements.push(element);
                return element;
            }
            
            remove(element) {
                const index = this.activeElements.indexOf(element);
                if (index > -1) {
                    this.activeElements.splice(index, 1);
                    this.pool.push(element);
                }
            }
            
            update(deltaTime = 1) {
                this.activeElements.forEach(element => element.update(deltaTime));
            }
            
            draw() {
                this.activeElements.forEach(element => {
                    if (isInViewport(element.x, element.y, ELEMENT_SIZE + 50)) {
                        element.draw();
                    }
                });
            }
            
            getActiveElements() {
                return this.activeElements;
            }
            
            getActiveCount() {
                return this.activeElements.length;
            }
        }
        
        // Initialize element pool
        const elementPool = new ElementPool();
        
        // Asteroid class
        class Asteroid {
            constructor(x, y) {
                this.x = x;
                this.y = y;
                
                // Random asteroid sprite (1-16)
                this.spriteIndex = Math.floor(Math.random() * 16) + 1;
                
                // Random size
                this.size = 40 + Math.random() * 60; // 40-100 pixels
                
                // Random velocity for slow floating in all directions
                const angle = Math.random() * Math.PI * 2;
                const speed = 0.1 + Math.random() * 0.2; // 0.1-0.3 speed
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                
                // Random rotation
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.01; // Very slow rotation
                
                // Slight opacity variation
                this.opacity = 0.5 + Math.random() * 0.3; // 0.5-0.8 opacity
                
                // Preload image
                this.loadImage();
            }
            
            loadImage() {
                if (!window.asteroidImages) {
                    window.asteroidImages = new Map();
                }
                
                const key = `asteroid-${this.spriteIndex}`;
                if (!window.asteroidImages.has(key)) {
                    const img = new Image();
                    img.src = `assets/asteroids/${key}.png`;
                    
                    // Add error handling
                    img.onerror = () => {
                        console.warn(`Failed to load asteroid image: ${key}`);
                        this.imageLoadFailed = true;
                    };
                    
                    window.asteroidImages.set(key, img);
                }
                
                this.image = window.asteroidImages.get(key);
            }
            
            update(deltaTime = 1) {
                // Update position with simple floating movement
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                
                // Update rotation
                this.rotation += this.rotationSpeed * deltaTime;
                
                // Wrap around the world if asteroid goes too far
                const worldBounds = WORLD_SIZE;
                if (this.x < -worldBounds) this.x = worldBounds;
                if (this.x > worldBounds) this.x = -worldBounds;
                if (this.y < -worldBounds) this.y = worldBounds;
                if (this.y > worldBounds) this.y = -worldBounds;
            }
            
            draw() {
                // Skip drawing if image failed to load or is still loading
                if (this.imageLoadFailed || !this.image || !this.image.complete) return;
                
                // Don't draw if not in viewport
                if (!isInViewport(this.x, this.y, this.size)) return;
                
                const screen = worldToScreen(this.x, this.y);
                
                ctx.save();
                
                // Apply the asteroid's opacity
                ctx.globalAlpha = this.opacity;
                
                // Translate to asteroid position
                ctx.translate(screen.x, screen.y);
                
                // Rotate
                ctx.rotate(this.rotation);
                
                // Draw the asteroid at its actual size
                const halfSize = this.size / 2;
                try {
                    ctx.drawImage(this.image, -halfSize, -halfSize, this.size, this.size);
                } catch (e) {
                    // Silently fail if image drawing fails
                    console.warn('Failed to draw asteroid:', e);
                }
                
                ctx.restore();
            }
        }
        
        // Shooting Star class
        class ShootingStar {
            constructor() {
                // Random starting position on screen edge
                const edge = Math.floor(Math.random() * 4);
                switch(edge) {
                    case 0: // Top
                        this.x = Math.random() * WORLD_SIZE;
                        this.y = 0;
                        break;
                    case 1: // Right
                        this.x = WORLD_SIZE;
                        this.y = Math.random() * WORLD_SIZE;
                        break;
                    case 2: // Bottom
                        this.x = Math.random() * WORLD_SIZE;
                        this.y = WORLD_SIZE;
                        break;
                    case 3: // Left
                        this.x = 0;
                        this.y = Math.random() * WORLD_SIZE;
                        break;
                }
                
                // Random angle and speed
                const angle = Math.random() * Math.PI * 2;
                const speed = 15 + Math.random() * 10; // Fast movement
                this.vx = Math.cos(angle) * speed;
                this.vy = Math.sin(angle) * speed;
                
                this.trail = [];
                this.maxTrailLength = isMobile ? 5 : 20; // Shorter trails on mobile
                this.life = 1.0;
                this.fadeSpeed = 0.01; // Slower fade for 1-2 second visibility
                
                // Add color variety
                const colorSchemes = [
                    { star: '#FFFF00', trail: '#FFFFFF' }, // Classic yellow/white
                    { star: '#00FFFF', trail: '#E0FFFF' }, // Cyan/light blue
                    { star: '#FFE4B5', trail: '#FFF8DC' }, // Pale yellow/cream
                    { star: '#FF69B4', trail: '#FFB6C1' }, // Pink/light pink
                    { star: '#98FB98', trail: '#F0FFF0' }  // Pale green/honeydew
                ];
                const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
                this.starColor = scheme.star;
                this.trailColor = scheme.trail;
            }
            
            update(deltaTime = 1) {
                // Add current position to trail
                this.trail.push({ x: this.x, y: this.y, alpha: this.life });
                
                // Limit trail length
                if (this.trail.length > this.maxTrailLength) {
                    this.trail.shift();
                }
                
                // Update position
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                
                // Fade out
                this.life -= this.fadeSpeed * deltaTime;
                
                // Update trail alpha
                this.trail.forEach((point, index) => {
                    point.alpha = (index / this.trail.length) * this.life;
                });
                
                // Check if out of bounds or faded
                return this.life > 0 && this.x > -100 && this.x < WORLD_SIZE + 100 && 
                       this.y > -100 && this.y < WORLD_SIZE + 100;
            }
            
            draw() {
                // Draw pixelated trail
                const pixelSize = 2;
                ctx.save();
                
                this.trail.forEach((point, index) => {
                    const screenX = point.x - camera.x + canvas.width / 2;
                    const screenY = point.y - camera.y + canvas.height / 2;
                    
                    ctx.globalAlpha = point.alpha * 0.5;
                    ctx.fillStyle = this.trailColor;
                    const size = Math.max(pixelSize, Math.floor((index / this.trail.length) * 3) * pixelSize);
                    
                    ctx.fillRect(
                        Math.floor(screenX / pixelSize) * pixelSize,
                        Math.floor(screenY / pixelSize) * pixelSize,
                        size,
                        size
                    );
                });
                
                // Draw main star as pixel
                const screen = worldToScreen(this.x, this.y);
                const screenX = screen.x;
                const screenY = screen.y;
                
                ctx.globalAlpha = this.life;
                ctx.fillStyle = this.starColor;
                ctx.fillRect(
                    Math.floor(screenX / pixelSize) * pixelSize,
                    Math.floor(screenY / pixelSize) * pixelSize,
                    pixelSize * 3,
                    pixelSize * 3
                );
                
                ctx.restore();
            }
        }
        
        // Boss class - extends Snake with special abilities
        class Boss extends Snake {
            constructor(bossType, x, y) {
                super(x, y, false);
                this.isBoss = true; // Set this early to prevent personality assignment
                
                // Boss configuration
                this.bossType = bossType;
                const bossData = BOSS_TYPES[bossType];
                this.baseName = bossData.name; // Store the original base name
                this.isUndead = bossIsUndead;
                this.name = bossIsUndead ? `Undead ${bossData.name}` : bossData.name;
                this.maxHealth = bossIsUndead ? bossData.maxHealth * 2 : bossData.maxHealth;
                this.health = this.maxHealth;
                this.elementType = bossData.element;
                this.elementId = bossData.elementId;
                this.color = bossData.color;
                this.emoji = bossData.emoji;
                this.attackCooldown = bossData.attackCooldown;
                this.skin = bossData.skin;
                this.attackSound = bossData.attackSound;
                
                // Boss-specific properties
                this.isBoss = true;
                this.size = 3; // 300% larger than normal snakes
                this.length = 30; // Longer than normal snakes
                this.speed = SNAKE_SPEED * 0.8 * 0.9; // 80% of normal speed (20% slower) * 0.9 for AI reduction
                this.baseSpeed = SNAKE_SPEED * 0.8 * 0.9;
                this.attackTimer = 0;
                this.introAnimationTimer = 120; // 2 seconds of intro animation
                this.damageFlashTimer = 0;
                this.stunTimer = 0;
                this.invulnerabilityTimer = 0; // Post-stun invulnerability
                
                // Stationary attack phase management
                this.attackPhase = false;
                this.attackPhaseTimer = 0;
                this.attackPhaseDuration = 180; // 3 seconds
                this.chasePhaseDuration = 240; // 4 seconds
                this.phaseTimer = this.chasePhaseDuration; // Start in chase phase
                
                // Laugh sound management
                this.laughCooldown = 0;
                this.nextLaughDelay = 15000 + Math.random() * 10000; // 15-25 seconds
                
                // Special attack counter for Zephyrus vacuum
                this.specialAttackCounter = 0;
                this.vacuumAttackInterval = 4; // Use vacuum every 4th attack
                
                // Override segment initialization for longer boss
                this.segments = [];
                for (let i = 0; i < this.length; i++) {
                    const segX = x - i * SEGMENT_SIZE * this.size * Math.cos(this.angle);
                    const segY = y - i * SEGMENT_SIZE * this.size * Math.sin(this.angle);
                    this.segments.push({
                        x: segX,
                        y: segY,
                        prevX: segX,
                        prevY: segY
                    });
                }
                
                // Boss starts with some elements matching its type
                for (let i = 0; i < 4; i++) {
                    this.elements.push(this.elementId);
                }
            }
            
            update(deltaTime = 1) {
                if (!this.alive) return;
                
                // Update timers
                if (this.introAnimationTimer > 0) {
                    this.introAnimationTimer -= deltaTime;
                    return; // Don't move during intro
                }
                
                if (this.damageFlashTimer > 0) {
                    this.damageFlashTimer -= deltaTime;
                }
                
                if (this.stunTimer > 0) {
                    this.stunTimer -= deltaTime;
                    if (this.stunTimer <= 0) {
                        // When stun ends, start invulnerability period
                        this.invulnerabilityTimer = 180; // 3 seconds of invulnerability
                    }
                    return; // Don't move or attack while stunned
                }
                
                // Update invulnerability timer
                if (this.invulnerabilityTimer > 0) {
                    this.invulnerabilityTimer -= deltaTime;
                }
                
                // Update phase timer
                this.phaseTimer -= deltaTime;
                
                // Switch between chase and attack phases
                if (this.phaseTimer <= 0) {
                    if (this.attackPhase) {
                        // Exit attack phase, return to chase
                        this.attackPhase = false;
                        this.phaseTimer = this.chasePhaseDuration;
                        this.speed = this.baseSpeed; // Resume movement
                    } else {
                        // Enter attack phase
                        this.attackPhase = true;
                        this.phaseTimer = this.attackPhaseDuration;
                        this.speed = 0; // Stop moving
                        
                        // Show attack warning message
                        switch(this.bossType) {
                            case 'PYRAXIS':
                                showMessage("The Molten One gathers primordial flames!", 'orange', 2000);
                                break;
                            case 'ABYSSOS':
                                showMessage("The Deep One summons torrential fury!", 'blue', 2000);
                                break;
                            case 'OSSEUS':
                                showMessage("The Bone Sovereign calls forth earthen devastation!", 'brown', 2000);
                                break;
                            case 'ZEPHYRUS':
                                showMessage("The Storm Caller harnesses the void!", 'purple', 2000);
                                break;
                        }
                    }
                }
                
                // Update attack timer
                this.attackTimer += deltaTime * 16; // Convert to milliseconds
                
                // Update laugh cooldown and play periodic laugh sounds
                if (this.laughCooldown > 0) {
                    this.laughCooldown -= deltaTime * 16;
                } else if (this.laughCooldown <= 0 && bossEncounterActive) {
                    // Check if it's time to laugh
                    if (Math.random() < 0.3) { // 30% chance when cooldown expires
                        const bossData = BOSS_TYPES[this.bossType];
                        if (!musicMuted && bossData.laughSound) {
                            const laughSound = new Audio(bossData.laughSound);
                            laughSound.volume = 0.5; // Quieter than initial laugh
                            laughSound.play().catch(e => {});
                        }
                    }
                    // Reset cooldown with random delay
                    this.laughCooldown = 15000 + Math.random() * 10000; // 15-25 seconds
                }
                
                // Boss AI - Strategic hunting behavior
                if (playerSnake && playerSnake.alive && !this.attackPhase) {
                    const dx = playerSnake.x - this.x;
                    const dy = playerSnake.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Initialize boss AI state if not present
                    if (!this.aiState) {
                        this.aiState = 'chase';
                        this.aiStateTimer = 0;
                        this.lastPlayerAngle = playerSnake.angle;
                    }
                    
                    this.aiStateTimer += deltaTime;
                    
                    // State machine for boss behavior
                    let targetAngle = Math.atan2(dy, dx); // Default chase angle
                    let speedMultiplier = 1.0;
                    
                    switch(this.aiState) {
                        case 'chase':
                            // Direct chase for 2-3 seconds
                            targetAngle = Math.atan2(dy, dx);
                            speedMultiplier = 0.85;
                            
                            if (this.aiStateTimer > 120 + Math.random() * 60) { // 2-3 seconds
                                // Announce strategy change
                                if (distance < 400) {
                                    const nextState = Math.random() < 0.5 ? 'cutoff' : 'flank';
                                    if (nextState === 'cutoff') {
                                        showMessage(`${this.name} is trying to cut you off!`, 'orange', 1500);
                                    } else {
                                        showMessage(`${this.name} is flanking!`, 'orange', 1500);
                                    }
                                    this.aiState = nextState;
                                } else {
                                    this.aiState = 'chase'; // Keep chasing if too far
                                }
                                this.aiStateTimer = 0;
                            }
                            break;
                            
                        case 'cutoff':
                            // Try to get in front of the player
                            const playerSpeed = playerSnake.speed || SNAKE_SPEED;
                            const futureSteps = 10; // Look ahead
                            const futureX = playerSnake.x + Math.cos(playerSnake.angle) * playerSpeed * futureSteps;
                            const futureY = playerSnake.y + Math.sin(playerSnake.angle) * playerSpeed * futureSteps;
                            
                            // Aim for a point ahead of the player
                            const cutoffDx = futureX - this.x;
                            const cutoffDy = futureY - this.y;
                            targetAngle = Math.atan2(cutoffDy, cutoffDx);
                            speedMultiplier = 1.0; // Move faster to cut off
                            
                            if (this.aiStateTimer > 90 || distance < 100) { // 1.5 seconds or too close
                                this.aiState = 'coil';
                                this.aiStateTimer = 0;
                                if (distance < 150) {
                                    showMessage(`${this.name} is coiling around you!`, 'red', 1500);
                                }
                            }
                            break;
                            
                        case 'flank':
                            // Move to the side of the player
                            const sideAngle = Math.atan2(dy, dx) + (Math.random() < 0.5 ? Math.PI/2 : -Math.PI/2);
                            targetAngle = sideAngle;
                            speedMultiplier = 0.95;
                            
                            if (this.aiStateTimer > 60 || distance < 150) { // 1 second or close enough
                                this.aiState = 'coil';
                                this.aiStateTimer = 0;
                            }
                            break;
                            
                        case 'coil':
                            // Try to circle around the player
                            if (distance < 200) {
                                // Circle at current distance
                                const perpAngle = Math.atan2(dy, dx) + Math.PI/2;
                                targetAngle = perpAngle;
                                speedMultiplier = 1.0;
                            } else {
                                // Too far, get closer first
                                targetAngle = Math.atan2(dy, dx);
                                speedMultiplier = 0.85;
                            }
                            
                            if (this.aiStateTimer > 120) { // 2 seconds
                                this.aiState = 'backoff';
                                this.aiStateTimer = 0;
                            }
                            break;
                            
                        case 'backoff':
                            // Move away briefly to reset
                            targetAngle = Math.atan2(-dy, -dx); // Opposite direction
                            speedMultiplier = 0.8;
                            
                            if (this.aiStateTimer > 60 || distance > 300) { // 1 second or far enough
                                this.aiState = 'chase';
                                this.aiStateTimer = 0;
                            }
                            break;
                    }
                    
                    // Smooth angle interpolation
                    let angleDiff = targetAngle - this.angle;
                    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                    
                    // Bosses have good turning but not perfect
                    const baseTurnSpeed = this.bossType === 'ZEPHYRUS' && elementVacuumActive ? 
                        TURN_SPEED * 1.5 : TURN_SPEED * 0.5;
                    // Faster turning when cutting off or coiling
                    const turnSpeed = (this.aiState === 'cutoff' || this.aiState === 'coil') ? 
                        baseTurnSpeed * 1.5 : baseTurnSpeed;
                    this.angle += angleDiff * turnSpeed;
                    
                    // Apply speed based on state and boss type (only if not in attack phase)
                    if (!this.attackPhase) {
                        if (this.bossType === 'ZEPHYRUS' && elementVacuumActive) {
                            this.speed = this.baseSpeed * 2 * speedMultiplier;
                        } else {
                            this.speed = this.baseSpeed * speedMultiplier;
                        }
                    }
                    
                    // Store player angle for prediction
                    this.lastPlayerAngle = playerSnake.angle;
                }
                
                // Execute attack pattern only during attack phase
                // Double attack speed when desperate (health <= 25%)
                const healthPercent = this.health / this.maxHealth;
                const effectiveCooldown = healthPercent <= 0.25 ? this.attackCooldown / 2 : this.attackCooldown;
                
                if (this.attackPhase && this.attackTimer >= effectiveCooldown) {
                    this.executeAttack();
                    this.attackTimer = 0;
                }
                
                
                // Call parent update
                super.update(deltaTime);
            }
            
            executeAttack() {
                if (!playerSnake || !playerSnake.alive) return;
                
                switch (this.bossType) {
                    case 'PYRAXIS':
                        this.fireballAttack();
                        break;
                    case 'ABYSSOS':
                        this.waterWaveAttack();
                        break;
                    case 'OSSEUS':
                        this.rockFallAttack();
                        break;
                    case 'ZEPHYRUS':
                        this.specialAttackCounter++;
                        // Use vacuum attack every Nth attack, otherwise shoot void projectiles
                        if (this.specialAttackCounter >= this.vacuumAttackInterval) {
                            this.elementVacuumAttack();
                            this.specialAttackCounter = 0;
                            showMessage("Zephyrus summons a void vortex!", 'purple', 2000);
                        } else {
                            this.shootVoidProjectiles();
                        }
                        break;
                }
                
                // Play attack sound
                if (this.attackSound && !musicMuted) {
                    const audio = new Audio(this.attackSound);
                    audio.volume = 0.5;
                    audio.play().catch(e => {});
                }
            }
            
            fireballAttack() {
                // Get boss head position
                const bossHead = this.segments && this.segments.length > 0 ? this.segments[0] : {x: this.x, y: this.y};
                const bossX = bossHead.x || this.x;
                const bossY = bossHead.y || this.y;
                
                // Shoot 4 fireballs in spread pattern toward player
                const baseAngle = Math.atan2(playerSnake.y - bossY, playerSnake.x - bossX);
                const spreadAngle = Math.PI / 8; // Slightly tighter spread for 4 fireballs
                
                for (let i = -1.5; i <= 1.5; i++) {
                    const angle = baseAngle + (i * spreadAngle);
                    const speed = 8;
                    
                    bossProjectiles.push({
                        x: bossX,
                        y: bossY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        type: 'fireball',
                        size: 20,
                        damage: 0.25,
                        elementId: 3, // Fire element
                        life: 300 // 5 seconds
                    });
                }
            }
            
            waterWaveAttack() {
                // Get boss head position
                const bossHead = this.segments && this.segments.length > 0 ? this.segments[0] : {x: this.x, y: this.y};
                const bossX = bossHead.x || this.x;
                const bossY = bossHead.y || this.y;
                
                // Shoot water orbs in all directions
                const orbs = 12; // Reduced from 16 for easier dodging
                for (let i = 0; i < orbs; i++) {
                    const angle = (Math.PI * 2 * i) / orbs;
                    const speed = 5; // Reduced from 6 for more reaction time
                    
                    bossProjectiles.push({
                        x: bossX,
                        y: bossY,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        type: 'waterorb',
                        size: 25,
                        damage: 0.25,
                        elementId: 1, // Water element
                        life: 400 // 6.7 seconds
                    });
                }
            }
            
            rockFallAttack() {
                // Create ground fissures attack
                bossScreenShakeTimer = 60; // Longer shake for ground splitting
                bossScreenShakeIntensity = 12;
                
                // Clear existing fissures
                bossFissures = [];
                
                // Create multiple fissures around the map
                const fissureCount = 8 + Math.floor(Math.random() * 5); // 8-12 fissures
                
                for (let i = 0; i < fissureCount; i++) {
                    // Random position anywhere on the visible game board
                    // Get the visible world bounds based on camera
                    const worldBounds = {
                        left: camera.x - (canvas.width / 2) / cameraZoom,
                        right: camera.x + (canvas.width / 2) / cameraZoom,
                        top: camera.y - (canvas.height / 2) / cameraZoom,
                        bottom: camera.y + (canvas.height / 2) / cameraZoom
                    };
                    
                    // Add some padding to ensure fissures can appear at screen edges
                    const padding = 100;
                    const x = worldBounds.left - padding + Math.random() * (worldBounds.right - worldBounds.left + padding * 2);
                    const y = worldBounds.top - padding + Math.random() * (worldBounds.bottom - worldBounds.top + padding * 2);
                    
                    // Vary fissure sizes
                    const size = 60 + Math.random() * 80; // 60-140 pixel radius
                    
                    bossFissures.push({
                        x: x,
                        y: y,
                        radius: 0, // Start small and grow
                        targetRadius: size,
                        growthSpeed: 3, // How fast fissure opens
                        life: 285, // 4.75 seconds total (0.75s warning + 4s active)
                        maxLife: 285,
                        state: 'warning', // Start with warning state
                        warningDuration: 45 // 0.75 seconds of warning
                    });
                }
                
                // Play rumbling sound
                if (!musicMuted) {
                    const rumbleSound = new Audio('sounds/boom-explosion.mp3');
                    rumbleSound.volume = 0.6;
                    rumbleSound.play().catch(e => {});
                }
                
                showMessage("The ground splits open!", 'brown', 2000);
            }
            
            elementVacuumAttack() {
                // ALL elements get vacuumed for 7 seconds
                elementVacuumActive = true;
                elementVacuumTimer = 420; // 7 seconds at 60fps
                
                // Store current elements for vacuum effect
                vacuumedElements = [];
                const activeElements = elementPool.getActiveElements();
                activeElements.forEach(element => {
                    vacuumedElements.push({
                        element: element,
                        originalX: element.x,
                        originalY: element.y
                    });
                });
            }
            
            shootVoidProjectiles() {
                if (!playerSnake || !playerSnake.alive) return;
                
                // Get boss head position
                const bossHead = this.segments && this.segments.length > 0 ? this.segments[0] : {x: this.x, y: this.y};
                const bossX = bossHead.x || this.x;
                const bossY = bossHead.y || this.y;
                
                // Shoot tornados at the player
                const baseAngle = Math.atan2(playerSnake.y - bossY, playerSnake.x - bossX);
                
                // Create 3 large tornados that track the player
                const tornadoCount = 3;
                for (let i = 0; i < tornadoCount; i++) {
                    const spreadAngle = (i - 1) * 0.3; // Smaller spread, more focused
                    const angle = baseAngle + spreadAngle;
                    const spawnDistance = 100; // Spawn tornados away from boss center
                    const speed = 4; // Start slower for better control
                    
                    bossProjectiles.push({
                        x: bossX + Math.cos(angle) * spawnDistance,
                        y: bossY + Math.sin(angle) * spawnDistance,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        type: 'tornado',
                        size: 80, // Much larger than fireballs
                        damage: 0.3,
                        elementId: 2, // Air element
                        life: 600, // 10 seconds
                        rotation: 0,
                        rotationSpeed: 0.5, // Faster rotation
                        wanderAngle: angle,
                        wanderTimer: 0,
                        homingTimer: 180, // 3 seconds of tracking
                        baseSpeed: speed,
                        maxSpeed: 8, // Allow speed boost during tracking
                        separationForce: 0.5, // Prevent clustering
                        trackingStrength: 0.05 // How strongly it tracks the player
                    });
                }
                
                showMessage("Zephyrus unleashes twisters!", 'purple', 2000);
            }
            
            takeDamage(source = 'unknown') {
                console.trace('[BOSS] Damage call stack');
                
                // Only allow damage from player elemental combinations
                if (source !== 'player_elemental') {
                    gameLogger.warn('BOSS', 'Damage blocked - not from player elemental:', source);
                    return;
                }
                
                // Make boss invincible during stun period and post-stun invulnerability
                if (this.stunTimer > 0) {
                    gameLogger.debug('BOSS', 'Damage blocked - boss is stunned');
                    return;
                }
                
                if (this.invulnerabilityTimer > 0) {
                    gameLogger.debug('BOSS', 'Damage blocked - boss is invulnerable');
                    return;
                }
                
                // Make Zephyrus invincible during element vacuum
                if (this.bossType === 'ZEPHYRUS' && elementVacuumActive) {
                    return;
                }
                
                this.health--;
                this.damageFlashTimer = 30;
                this.stunTimer = 60; // 1 second stun (reduced from 2 seconds)
                bossDamageFlashTimer = 20;
                
                // Create damage number
                damageNumbers.push({
                    x: this.x,
                    y: this.y - 50,
                    text: '-1',
                    color: '#FFD700',
                    life: 60,
                    vy: -3
                });
                
                // Create damage particles
                for (let i = 0; i < 20; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 3;
                    particlePool.spawn(
                        this.x, 
                        this.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        this.color
                    );
                }
                
                // Check if defeated
                if (this.health <= 0) {
                    this.defeatBoss();
                }
                
                // Update health bar
                if (bossHealthBar) {
                    const healthPercent = (this.health / this.maxHealth) * 100;
                    bossHealthBar.style.width = healthPercent + '%';
                }
                
                // Update boss name with prefix based on health
                if (bossNameDisplay) {
                    let prefix = '';
                    const healthRatio = this.health / this.maxHealth;
                    
                    if (healthRatio <= 0.2) {
                        prefix = 'Desperate ';
                    } else if (healthRatio <= 0.4) {
                        prefix = 'Furious ';
                    } else if (healthRatio <= 0.6) {
                        prefix = 'Enraged ';
                    } else if (healthRatio < 1.0) {
                        prefix = 'Angry ';
                    }
                    
                    // Build display name using the stored base name
                    const displayName = this.isUndead ? `Undead ${prefix}${this.baseName}` : `${prefix}${this.baseName}`;
                    bossNameDisplay.textContent = `💀 ${displayName}`;
                }
            }
            
            defeatBoss() {
                this.alive = false;
                bossEncounterActive = false;
                defeatedBosses.add(this.bossType);
                bossesDefeatedThisCycle++;
                
                // Track boss defeat analytics
                if (window.GameAnalyticsWrapper) {
                    const timeSpent = this.bossEncounterStartTime ? 
                        Math.floor((Date.now() - this.bossEncounterStartTime) / 1000) : 0;
                    const attempts = this.defeatAttempts || 1;
                    window.GameAnalyticsWrapper.trackBossDefeat(this.bossType, attempts, timeSpent);
                }
                
                // Save defeated bosses to localStorage for persistent tracking
                const defeatedBossList = JSON.parse(localStorage.getItem('defeatedBosses') || '[]');
                if (!defeatedBossList.includes(this.bossType)) {
                    defeatedBossList.push(this.bossType);
                    localStorage.setItem('defeatedBosses', JSON.stringify(defeatedBossList));
                }
                
                // Check for lore unlocks related to this boss
                if (window.loreUnlockManager && window.loreUnlockManager.checkAllLoreUnlocks) {
                    window.loreUnlockManager.checkAllLoreUnlocks();
                }
                
                // Check for skin unlocks related to this boss
                if (window.unlockManager && window.unlockManager.onBossDefeat) {
                    window.unlockManager.onBossDefeat(this.bossType);
                }
                
                // Track score at boss defeat and calculate next spawn
                if (playerSnake) {
                    lastBossDefeatScore = playerSnake.score;
                    calculateNextBossSpawn();
                }
                
                // Award extra revive for defeating boss (Classic mode only)
                if (gameMode === 'classic' && revivesRemaining < 3) {
                    revivesRemaining++;
                    gameLogger.debug('BOSS', 'Extra revive awarded! Revives remaining:', revivesRemaining);
                    
                    // Show revive award message
                    showCombinationMessage('', '', `+1 REVIVE! Boss defeated!`, false, 3000);
                }
                
                // Stop boss battle music and resume normal music
                if (bossBattleMusic) {
                    bossBattleMusic.pause();
                    bossBattleMusic = null;
                }
                if (currentTrack && !musicMuted) {
                    currentTrack.stopRequested = false; // Allow it to continue normally
                    currentTrack.volume = musicVolume;
                    currentTrack.play();
                }
                
                // Dispatch boss defeated event
                dispatchGameEvent('bossDefeated', {
                    bossType: this.bossType,
                    bossName: this.baseName,
                    totalBossesDefeated: bossesDefeatedThisCycle
                });
                
                // Epic victory explosion sequence
                // First wave - main explosion
                for (let i = 0; i < 100; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 2 + Math.random() * 8;
                    particlePool.spawn(
                        this.x,
                        this.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        this.color
                    );
                }
                
                // Second wave - delayed secondary explosions
                setTimeout(() => {
                    for (let j = 0; j < 5; j++) {
                        const offsetAngle = (Math.PI * 2 / 5) * j;
                        const offsetDist = 100;
                        const offsetX = this.x + Math.cos(offsetAngle) * offsetDist;
                        const offsetY = this.y + Math.sin(offsetAngle) * offsetDist;
                        
                        for (let i = 0; i < 20; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = 1 + Math.random() * 4;
                            particlePool.spawn(
                                offsetX,
                                offsetY,
                                Math.cos(angle) * speed,
                                Math.sin(angle) * speed,
                                this.color
                            );
                        }
                    }
                }, 200);
                
                // Screen flash and shake
                bossScreenShakeTimer = 60;
                bossScreenShakeIntensity = 20;
                
                // Victory damage number
                damageNumbers.push({
                    x: this.x,
                    y: this.y - 100,
                    text: 'VICTORY!',
                    color: '#FFD700',
                    life: 120,
                    vy: -2
                });
                
                // Elemental burst - spawn fewer elements in a spiral (reduced from 16 to 8)
                for (let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    const delay = i * 50; // Stagger the spawns
                    
                    setTimeout(() => {
                        const dist = 150;
                        spawnElement(this.elementId, 
                            this.x + Math.cos(angle) * dist,
                            this.y + Math.sin(angle) * dist
                        );
                    }, delay);
                }
                
                // Play boss defeat sounds
                if (!musicMuted) {
                    // Play boss laugh sound immediately (as they're banished)
                    const bossData = BOSS_TYPES[this.bossType];
                    if (bossData.laughSound) {
                        const laughSound = new Audio(bossData.laughSound);
                        laughSound.volume = 0.7;
                        laughSound.play().catch(e => {});
                    }
                    
                    // Play success tone after a delay
                    setTimeout(() => {
                        const successSound = new Audio('sounds/success-tone.mp3');
                        successSound.volume = 0.6;
                        successSound.play().catch(e => {});
                    }, 800);
                    
                    // Play explosion shockwave sound
                    const shockwaveSound = new Audio('sounds/explosion-shockwave.mp3');
                    shockwaveSound.volume = 0.8;
                    shockwaveSound.play().catch(e => {});
                }
                
                // Spawn rewards
                // 4 catalyst gems
                for (let i = 0; i < 4; i++) {
                    const angle = (Math.PI * 2 / 4) * i;
                    const dist = 50;
                    catalystGems.push(new CatalystGem(
                        this.x + Math.cos(angle) * dist,
                        this.y + Math.sin(angle) * dist
                    ));
                }
                
                // 2 void orbs
                for (let i = 0; i < 2; i++) {
                    const angle = Math.PI * i;
                    const dist = 80;
                    voidOrbs.push(new VoidOrb(
                        this.x + Math.cos(angle) * dist,
                        this.y + Math.sin(angle) * dist
                    ));
                }
                
                // 8-12 random elements
                const numElements = 8 + Math.floor(Math.random() * 5);
                for (let i = 0; i < numElements; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = 100 + Math.random() * 100;
                    spawnElement(null,
                        this.x + Math.cos(angle) * dist,
                        this.y + Math.sin(angle) * dist
                    );
                }
                
                // Award points and kill credit
                if (playerSnake) {
                    playerSnake.score += 10000;
                    playerSnake.kills++; // Boss defeat counts as a kill
                }
                
                // Track skin unlock status
                const bossData = BOSS_TYPES[this.bossType];
                const bossSkinName = bossData.skin;
                let skinUnlocked = false;
                
                if (!unlockedSkins.has(bossSkinName)) {
                    unlockedSkins.add(bossSkinName);
                    if (skinMetadata[bossSkinName]) {
                        skinMetadata[bossSkinName].unlocked = true;
                    }
                    saveSkinData();
                    skinUnlocked = true;
                    
                    // Track skin unlock analytics
                    if (window.GameAnalyticsWrapper) {
                        window.GameAnalyticsWrapper.trackSkinUnlock(bossSkinName, 'boss_defeat');
                    }
                }
                
                // Track element bank expansion
                let elementBankExpanded = false;
                if (elementBankSlots < 12) {
                    elementBankSlots++;
                    saveElementBankSlots(); // Save to localStorage
                    // Update player snake's max visible elements
                    if (playerSnake) {
                        playerSnake.maxVisibleElements = elementBankSlots;
                    }
                    updateElementBankUI();
                    elementBankExpanded = true;
                }
                
                // Show the epic boss victory message
                showBossVictoryMessage(this, skinUnlocked, elementBankExpanded);
                
                // Remove boss from snakes array
                const bossIndex = snakes.indexOf(this);
                if (bossIndex > -1) {
                    snakes.splice(bossIndex, 1);
                }
                
                // Hide health bar
                if (bossHealthBarContainer) {
                    bossHealthBarContainer.style.display = 'none';
                }
                
                // Stop boss battle music and resume normal music
                if (bossBattleMusic) {
                    bossBattleMusic.pause();
                    bossBattleMusic = null;
                }
                if (currentTrack && !musicMuted) {
                    currentTrack.stopRequested = false; // Allow it to continue normally
                    currentTrack.volume = musicVolume;
                    currentTrack.play();
                }
                
                // Check if all bosses defeated for undead cycle
                if (bossesDefeatedThisCycle >= 4 && !bossIsUndead) {
                    bossIsUndead = true;
                    bossesDefeatedThisCycle = 0;
                    defeatedBosses.clear();
                    showMessage('The Bosses Rise Again... UNDEAD!', 'purple');
                }
                
                currentBoss = null;
                bossFissures = []; // Clear all fissures when boss is defeated
            }
            
            // Override die method to prevent normal death
            die() {
                // Bosses don't die from collisions, only from elemental damage
                return;
            }
            
            // Override draw method to handle boss-specific rendering
            draw(interpolation = 0) {
                if (!this.alive) return;
                
                // Boss-specific effects
                const glowIntensity = this.damageFlashTimer > 0 ? 
                    Math.sin(this.damageFlashTimer * 0.3) : 0;
                
                // Health phase effects
                const healthPercent = this.health / this.maxHealth;
                let phaseColor = this.color;
                let phaseGlow = false;
                
                if (healthPercent <= 0.25) {
                    // Critical phase - red tint and strong glow
                    phaseColor = '#ff0000';
                    phaseGlow = true;
                } else if (healthPercent <= 0.5) {
                    // Danger phase - orange tint
                    phaseColor = '#ff8800';
                    phaseGlow = true;
                } else if (healthPercent <= 0.75) {
                    // Caution phase - yellow tint
                    phaseColor = '#ffff00';
                }
                
                // Don't scale SEGMENT_SIZE globally - it can break viewport calculations
                // Instead, we'll pass the size to the parent draw method
                try {
                    // Call parent draw method directly
                    super.draw(interpolation);
                } catch (e) {
                    gameLogger.error('BOSS', 'Boss draw error:', e);
                    // Fallback to custom boss drawing
                    this.drawBossSnake(interpolation);
                }
                
                // No need to restore SEGMENT_SIZE since we didn't change it
                
                // Add invulnerability shield effect
                if (this.invulnerabilityTimer > 0) {
                    ctx.save();
                    const screen = worldToScreen(this.x, this.y);
                    
                    // Pulsing blue shield effect
                    const shieldPulse = Math.sin(Date.now() * 0.01) * 0.2 + 0.3;
                    ctx.globalAlpha = shieldPulse;
                    ctx.strokeStyle = '#00ffff';
                    ctx.lineWidth = 8 * cameraZoom;
                    
                    // Draw shield ring
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 90 * cameraZoom, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Add inner shield effect
                    ctx.globalAlpha = shieldPulse * 0.5;
                    ctx.fillStyle = '#00ffff';
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 85 * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
                
                // Add boss glow effect
                if (glowIntensity > 0 || phaseGlow) {
                    ctx.save();
                    const screen = worldToScreen(this.x, this.y);
                    
                    // Damage flash or phase glow
                    if (glowIntensity > 0) {
                        ctx.globalAlpha = glowIntensity * 0.5;
                        ctx.fillStyle = this.color;
                    } else if (phaseGlow) {
                        const phasePulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
                        ctx.globalAlpha = phasePulse * 0.4;
                        ctx.fillStyle = phaseColor;
                    }
                    
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, 100 * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add phase indicator ring
                    if (phaseGlow) {
                        ctx.strokeStyle = phaseColor;
                        ctx.lineWidth = 5 * cameraZoom;
                        ctx.globalAlpha = 0.8;
                        ctx.beginPath();
                        ctx.arc(screen.x, screen.y, 80 * cameraZoom, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    
                    ctx.restore();
                }
            }
            
            drawBossSnake(interpolation) {
                // Basic boss snake drawing if parent draw doesn't exist
                // This is a fallback implementation
                const segmentSize = SEGMENT_SIZE * this.size;
                
                // Draw segments
                for (let i = this.segments.length - 1; i >= 0; i--) {
                    const segment = this.segments[i];
                    const screen = worldToScreen(segment.x, segment.y);
                    
                    ctx.save();
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, segmentSize * cameraZoom, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                
                // Draw head with boss skin
                const headScreen = worldToScreen(this.x, this.y);
                const headSize = segmentSize * 1.2 * cameraZoom;
                
                if (skinImages[this.skin] && !skinImages[this.skin].error) {
                    ctx.save();
                    ctx.translate(headScreen.x, headScreen.y);
                    ctx.rotate(this.angle);
                    
                    // Preserve aspect ratio
                    const img = skinImages[this.skin];
                    const aspectRatio = img.width / img.height;
                    let drawWidth = headSize * 3;
                    let drawHeight = headSize * 3;
                    
                    if (aspectRatio > 1) {
                        // Wider than tall
                        drawHeight = drawWidth / aspectRatio;
                    } else if (aspectRatio < 1) {
                        // Taller than wide
                        drawWidth = drawHeight * aspectRatio;
                    }
                    
                    ctx.drawImage(img, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
                    ctx.restore();
                } else {
                    // Fallback to emoji if skin not loaded
                    const emojiCanvas = getCachedEmoji(this.emoji, Math.round(headSize * 2));
                    ctx.drawImage(emojiCanvas, 
                        headScreen.x - emojiCanvas.width / 2, 
                        headScreen.y - emojiCanvas.height / 2);
                }
            }
        }
        
        // Boss system functions
        function spawnBoss() {
            // Select a random boss that hasn't been defeated this cycle
            const availableBosses = Object.keys(BOSS_TYPES).filter(boss => !defeatedBosses.has(boss));
            if (availableBosses.length === 0) {
                return;
            }
            
            const selectedBoss = availableBosses[Math.floor(Math.random() * availableBosses.length)];
            const bossData = BOSS_TYPES[selectedBoss];
            
            // Show warning message
            const bossName = bossIsUndead ? `Undead ${bossData.name}` : bossData.name;
            showMessage(`${bossName} Emerges from the Cosmic Void!`, 'red', 3000);
            
            // Pause normal music completely
            if (currentTrack && !musicMuted) {
                currentTrack.pause();
                currentTrack.stopRequested = true; // Prevent it from restarting
            }
            
            // Also clear any pending music track
            if (window.pendingMusicTrack) {
                window.pendingMusicTrack.pause();
                window.pendingMusicTrack = null;
            }
            
            // Play boss intro music
            if (!musicMuted) {
                bossIntroMusic = new Audio('sounds/low-pitched-melody.mp3');
                bossIntroMusic.volume = 0.7 * musicVolume;
                bossIntroMusic.play().catch(e => {});
                
                // Start battle music when intro ends
                bossIntroMusic.addEventListener('ended', () => {
                    if (!musicMuted && currentBoss && currentBoss.alive) {
                        bossBattleMusic = new Audio('music/dramatic-pounding-percussion.mp3');
                        bossBattleMusic.volume = 0.6 * musicVolume;
                        bossBattleMusic.loop = true;
                        bossBattleMusic.play().catch(e => {});
                    }
                });
            }
            
            // Select random edge to spawn from
            const edge = Math.floor(Math.random() * 4);
            let spawnX, spawnY;
            
            switch(edge) {
                case 0: // Top
                    spawnX = Math.random() * WORLD_SIZE;
                    spawnY = 100;
                    break;
                case 1: // Right
                    spawnX = WORLD_SIZE - 100;
                    spawnY = Math.random() * WORLD_SIZE;
                    break;
                case 2: // Bottom
                    spawnX = Math.random() * WORLD_SIZE;
                    spawnY = WORLD_SIZE - 100;
                    break;
                case 3: // Left
                    spawnX = 100;
                    spawnY = Math.random() * WORLD_SIZE;
                    break;
            }
            
            // Create boss
            currentBoss = new Boss(selectedBoss, spawnX, spawnY);
            snakes.push(currentBoss);
            bossEncounterActive = true;
            
            // Play boss laugh sound on spawn
            if (!musicMuted && BOSS_TYPES[selectedBoss].laughSound) {
                const laughSound = new Audio(BOSS_TYPES[selectedBoss].laughSound);
                laughSound.volume = 0.7;
                laughSound.play().catch(e => {});
            }
            
            // Make AI snakes flee
            snakes.forEach(snake => {
                if (!snake.isPlayer && !snake.isBoss && snake.alive) {
                    snake.panicMode = true;
                    snake.panicTimer = 999999; // Permanent panic during boss
                }
            });
            
            // Create boss health bar UI
            createBossHealthBar();
        }
        
        function createBossHealthBar() {
            // Remove existing health bar if any
            if (bossHealthBarContainer) {
                bossHealthBarContainer.remove();
            }
            
            // Create health bar container
            bossHealthBarContainer = document.createElement('div');
            bossHealthBarContainer.style.position = 'fixed';
            bossHealthBarContainer.style.top = isMobile ? '80px' : '50px'; // Lower on mobile to avoid UI overlap
            bossHealthBarContainer.style.left = '50%';
            bossHealthBarContainer.style.transform = 'translateX(-50%)';
            bossHealthBarContainer.style.width = isMobile ? '300px' : '600px'; // Smaller on mobile
            bossHealthBarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            bossHealthBarContainer.style.border = '3px solid #fff';
            bossHealthBarContainer.style.borderRadius = '10px';
            bossHealthBarContainer.style.padding = '10px';
            bossHealthBarContainer.style.zIndex = '50'; // Below pause menu (z-index 100)
            
            // Create health bar
            const healthBarBg = document.createElement('div');
            healthBarBg.style.width = '100%';
            healthBarBg.style.height = isMobile ? '20px' : '30px';
            healthBarBg.style.backgroundColor = '#333';
            healthBarBg.style.borderRadius = '5px';
            healthBarBg.style.overflow = 'hidden';
            
            bossHealthBar = document.createElement('div');
            bossHealthBar.style.width = '100%';
            bossHealthBar.style.height = '100%';
            bossHealthBar.style.backgroundColor = currentBoss.color;
            bossHealthBar.style.transition = 'width 0.3s ease';
            
            healthBarBg.appendChild(bossHealthBar);
            
            // Create boss name display
            bossNameDisplay = document.createElement('div');
            bossNameDisplay.style.textAlign = 'center';
            bossNameDisplay.style.color = '#fff';
            bossNameDisplay.style.fontSize = isMobile ? '14px' : '18px';
            bossNameDisplay.style.fontWeight = 'bold';
            bossNameDisplay.style.marginTop = '5px';
            bossNameDisplay.style.whiteSpace = 'nowrap'; // Ensure single line display
            bossNameDisplay.style.overflow = 'hidden';
            bossNameDisplay.style.textOverflow = 'ellipsis';
            bossNameDisplay.textContent = `💀 ${currentBoss.name}`;
            
            bossHealthBarContainer.appendChild(healthBarBg);
            bossHealthBarContainer.appendChild(bossNameDisplay);
            document.body.appendChild(bossHealthBarContainer);
        }
        
        // Unified boss projectile collision check
        function checkBossProjectileCollision(projectile, effectiveRadius = null) {
            if (!playerSnake || !playerSnake.alive || playerSnake.invincibilityTimer > 0) {
                return false;
            }
            
            const playerRadius = SEGMENT_SIZE * (playerSnake.size || 1);
            const projectileRadius = effectiveRadius || projectile.size;
            const collisionRadius = projectileRadius + playerRadius;
            
            const dx = playerSnake.x - projectile.x;
            const dy = playerSnake.y - projectile.y;
            const distanceSquared = dx * dx + dy * dy;
            
            return distanceSquared < (collisionRadius * collisionRadius);
        }
        
        function updateBossProjectiles(deltaTime) {
            // Update and remove expired projectiles
            bossProjectiles = bossProjectiles.filter(projectile => {
                switch(projectile.type) {
                    case 'fireball':
                        projectile.x += projectile.vx * deltaTime;
                        projectile.y += projectile.vy * deltaTime;
                        projectile.life -= deltaTime;
                        
                        // Check collision with player
                        if (checkBossProjectileCollision(projectile)) {
                            // Create explosion particles before death
                            for (let i = 0; i < 30; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const speed = 2 + Math.random() * 5;
                                particlePool.spawn(
                                    playerSnake.x,
                                    playerSnake.y,
                                    Math.cos(angle) * speed,
                                    Math.sin(angle) * speed,
                                    '#ff6600'
                                );
                            }
                            // Boss elemental attacks are insta-death
                            playerSnake.die(true);
                            showMessage('Incinerated by Pyraxis!', 'red');
                            
                            // Rarely leave fire element (reduced from 30% to 10%)
                            if (Math.random() < 0.1) {
                                spawnElement(projectile.elementId, projectile.x, projectile.y);
                            }
                            
                            return false; // Remove projectile
                        }
                        
                        return projectile.life > 0;
                        
                    case 'waterwave':
                        projectile.radius += projectile.expandSpeed * deltaTime;
                        
                        // Check collision with player
                        if (!projectile.hasHitPlayer && checkBossProjectileCollision(projectile, projectile.radius)) {
                            // Create water splash particles before death
                            for (let i = 0; i < 30; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const speed = 2 + Math.random() * 5;
                                particlePool.spawn(
                                    playerSnake.x,
                                    playerSnake.y,
                                    Math.cos(angle) * speed,
                                    Math.sin(angle) * speed,
                                    '#0066ff'
                                );
                            }
                            // Boss elemental attacks are insta-death
                            playerSnake.die(true);
                            projectile.hasHitPlayer = true; // Prevent multiple hits from same wave
                            showMessage('Drowned by Abyssos!', 'red');
                        }
                        
                        // Spawn water elements occasionally
                        if (Math.random() < 0.02) { // Reduced from 5% to 2%
                            const angle = Math.random() * Math.PI * 2;
                            spawnElement(projectile.elementId,
                                projectile.x + Math.cos(angle) * projectile.radius,
                                projectile.y + Math.sin(angle) * projectile.radius
                            );
                        }
                        
                        return projectile.radius < projectile.maxRadius;
                        
                    case 'rock':
                        if (projectile.falling) {
                            const fallSpeed = projectile.fallSpeed || 10;
                            projectile.y += fallSpeed * deltaTime;
                            
                            // Check collision while falling
                            if (playerSnake && playerSnake.alive) {
                                const dx = playerSnake.x - projectile.x;
                                const dy = playerSnake.y - projectile.y;
                                const distSq = dx * dx + dy * dy;
                                
                                // Collision radius is larger while falling (40 pixels)
                                if (distSq < 40 * 40) {
                                    if (playerSnake.invincibilityTimer <= 0) {
                                        // Create debris particles
                                        for (let i = 0; i < 20; i++) {
                                            const angle = Math.random() * Math.PI * 2;
                                            const speed = 3 + Math.random() * 4;
                                            particlePool.spawn(
                                                playerSnake.x,
                                                playerSnake.y,
                                                Math.cos(angle) * speed,
                                                Math.sin(angle) * speed,
                                                '#8b6914'
                                            );
                                        }
                                        playerSnake.die(true);
                                        showMessage('Crushed by falling rock!', 'red');
                                    }
                                }
                            }
                            
                            if (projectile.y >= projectile.shadowY) {
                                projectile.falling = false;
                                projectile.y = projectile.shadowY;
                                
                                // Create impact crater when rock lands
                                if (!projectile.impactCrater) {
                                    projectile.impactCrater = {
                                        x: projectile.x,
                                        y: projectile.y,
                                        radius: 50, // 50 pixel radius crater
                                        life: 180 // 3 seconds
                                    };
                                    
                                    // Screen shake on impact
                                    bossScreenShakeTimer = 15;
                                    bossScreenShakeIntensity = 8;
                                    
                                    // Create impact particles
                                    for (let i = 0; i < 15; i++) {
                                        const angle = Math.random() * Math.PI * 2;
                                        const speed = 2 + Math.random() * 3;
                                        particlePool.spawn(
                                            projectile.x,
                                            projectile.y,
                                            Math.cos(angle) * speed,
                                            Math.sin(angle) * speed,
                                            '#8b6914'
                                        );
                                    }
                                }
                            }
                        }
                        
                        // Check collision with impact crater
                        if (projectile.impactCrater && playerSnake && playerSnake.alive) {
                            const crater = projectile.impactCrater;
                            const dx = playerSnake.x - crater.x;
                            const dy = playerSnake.y - crater.y;
                            
                            if (dx * dx + dy * dy < crater.radius * crater.radius) {
                                if (playerSnake.invincibilityTimer <= 0) {
                                    // Create debris particles
                                    for (let i = 0; i < 25; i++) {
                                        const angle = Math.random() * Math.PI * 2;
                                        const speed = 2 + Math.random() * 5;
                                        particlePool.spawn(
                                            playerSnake.x,
                                            playerSnake.y,
                                            Math.cos(angle) * speed,
                                            Math.sin(angle) * speed,
                                            '#8b6914'
                                        );
                                    }
                                    playerSnake.die(true);
                                    showMessage('Crushed in impact crater!', 'red');
                                }
                            }
                            
                            // Update crater life
                            crater.life -= deltaTime;
                            if (crater.life <= 0) {
                                projectile.impactCrater = null;
                            }
                        }
                        
                        // Rocks and craters stay for a while
                        if (!projectile.falling) {
                            if (!projectile.groundTimer) {
                                projectile.groundTimer = 180; // 3 seconds on ground
                                // Disabled element spawning from bone projectiles to reduce boss element abundance
                                // spawnElement(projectile.elementId, projectile.x, projectile.y);
                            }
                            projectile.groundTimer -= deltaTime;
                            
                            return projectile.groundTimer > 0 || projectile.impactCrater;
                        }
                        
                        return true; // Keep falling rocks active
                        
                case 'waterorb':
                    // Update water orb position
                    projectile.x += projectile.vx * deltaTime;
                    projectile.y += projectile.vy * deltaTime;
                    projectile.life -= deltaTime;
                    
                    // Check collision with player
                    if (playerSnake && playerSnake.alive) {
                        const dx = playerSnake.x - projectile.x;
                        const dy = playerSnake.y - projectile.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const playerRadius = SEGMENT_SIZE * (playerSnake.size || 1);
                        if (distance < projectile.size + playerRadius) {
                            if (playerSnake.invincibilityTimer <= 0) {
                                // Create water splash particles before death
                                for (let i = 0; i < 30; i++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = 2 + Math.random() * 5;
                                    particlePool.spawn(
                                        playerSnake.x,
                                        playerSnake.y,
                                        Math.cos(angle) * speed,
                                        Math.sin(angle) * speed,
                                        '#40a4df'
                                    );
                                }
                                // Boss elemental attacks are insta-death
                                playerSnake.die(true);
                                showMessage('Swept away by Abyssos!', 'red');
                            }
                            
                            // Rarely leave water element (reduced from 30% to 10%)
                            if (Math.random() < 0.1) {
                                spawnElement(projectile.elementId, projectile.x, projectile.y);
                            }
                            
                            return false; // Remove projectile
                        }
                    }
                    
                    return projectile.life > 0;
                    
                case 'void':
                    // Update void projectile position
                    projectile.x += projectile.vx * deltaTime;
                    projectile.y += projectile.vy * deltaTime;
                    projectile.life -= deltaTime;
                    
                    // Check collision with player
                    if (playerSnake && playerSnake.alive) {
                        const dx = projectile.x - playerSnake.x;
                        const dy = projectile.y - playerSnake.y;
                        if (Math.sqrt(dx * dx + dy * dy) < projectile.size + SEGMENT_SIZE) {
                            if (playerSnake.invincibilityTimer <= 0) {
                                // Create void particles before death
                                for (let i = 0; i < 30; i++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = 2 + Math.random() * 5;
                                    particlePool.spawn(
                                        playerSnake.x,
                                        playerSnake.y,
                                        Math.cos(angle) * speed,
                                        Math.sin(angle) * speed,
                                        '#9b59b6'
                                    );
                                }
                                playerSnake.die(true);
                                showMessage('Consumed by the void!', 'red');
                            }
                            return false; // Remove projectile
                        }
                    }
                    
                    return projectile.life > 0;
                    
                case 'tornado':
                    // Initialize properties
                    if (projectile.homingTimer === undefined) {
                        projectile.homingTimer = 300; // Use value from spawn
                    }
                    if (projectile.currentSpeed === undefined) {
                        projectile.currentSpeed = projectile.baseSpeed || 6;
                    }
                    
                    // Update position first!
                    projectile.x += projectile.vx * deltaTime;
                    projectile.y += projectile.vy * deltaTime;
                    
                    // Separation force to prevent clustering
                    let separationX = 0;
                    let separationY = 0;
                    bossProjectiles.forEach(other => {
                        if (other !== projectile && other.type === 'tornado') {
                            const dx = projectile.x - other.x;
                            const dy = projectile.y - other.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 100 && distance > 0) { // Separation radius
                                const force = (100 - distance) / 100 * 2;
                                separationX += (dx / distance) * force;
                                separationY += (dy / distance) * force;
                            }
                        }
                    });
                    
                    // Enhanced homing behavior (similar to fireballs)
                    if (projectile.homingTimer > 0 && playerSnake && playerSnake.alive) {
                        projectile.homingTimer -= deltaTime;
                        
                        // Calculate angle to player
                        const dx = playerSnake.x - projectile.x;
                        const dy = playerSnake.y - projectile.y;
                        const targetAngle = Math.atan2(dy, dx);
                        
                        // Current angle
                        const currentAngle = Math.atan2(projectile.vy, projectile.vx);
                        
                        // Calculate angle difference
                        let angleDiff = targetAngle - currentAngle;
                        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
                        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
                        
                        // Apply tracking with strength
                        const trackingStrength = projectile.trackingStrength || 0.05;
                        const newAngle = currentAngle + angleDiff * trackingStrength;
                        
                        // Gradually increase speed while tracking
                        if (projectile.currentSpeed < projectile.maxSpeed) {
                            projectile.currentSpeed += 0.1 * deltaTime;
                        }
                        
                        // Update velocity with new angle and speed
                        projectile.vx = Math.cos(newAngle) * projectile.currentSpeed;
                        projectile.vy = Math.sin(newAngle) * projectile.currentSpeed;
                        
                        // Apply separation force
                        projectile.vx += separationX * 0.5;
                        projectile.vy += separationY * 0.5;
                    } else {
                        // After tracking ends, continue in current direction with normal speed
                        if (projectile.currentSpeed > projectile.baseSpeed) {
                            projectile.currentSpeed -= 0.1 * deltaTime;
                        }
                        
                        // Update velocity
                        const currentAngle = Math.atan2(projectile.vy, projectile.vx);
                        projectile.vx = Math.cos(currentAngle) * projectile.currentSpeed;
                        projectile.vy = Math.sin(currentAngle) * projectile.currentSpeed;
                    }
                    projectile.life -= deltaTime;
                    projectile.rotation += projectile.rotationSpeed * deltaTime;
                    
                    // Check collision with player
                    if (playerSnake && playerSnake.alive) {
                        const dx = projectile.x - playerSnake.x;
                        const dy = projectile.y - playerSnake.y;
                        if (Math.sqrt(dx * dx + dy * dy) < projectile.size + SEGMENT_SIZE) {
                            if (playerSnake.invincibilityTimer <= 0) {
                                // Create wind particles before death
                                for (let i = 0; i < 40; i++) {
                                    const angle = Math.random() * Math.PI * 2;
                                    const speed = 3 + Math.random() * 6;
                                    particlePool.spawn(
                                        playerSnake.x,
                                        playerSnake.y,
                                        Math.cos(angle) * speed,
                                        Math.sin(angle) * speed,
                                        '#87ceeb'
                                    );
                                }
                                playerSnake.die(true);
                                showMessage('Swept away by the tornado!', 'red');
                            }
                            return false; // Remove projectile
                        }
                    }
                    
                    return projectile.life > 0;
                }
                
                return false;
            });
        }
        
        function updateElementVacuum(deltaTime) {
            // Make all elements move toward boss and consume them
            if (!currentBoss || !currentBoss.alive) return;
            
            vacuumedElements = vacuumedElements.filter(({element, originalX, originalY}) => {
                if (!element.active) return false; // Already deactivated
                
                const dx = currentBoss.x - element.x;
                const dy = currentBoss.y - element.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 50) {
                    const speed = 5 * deltaTime;
                    element.x += (dx / dist) * speed;
                    element.y += (dy / dist) * speed;
                    return true; // Keep in array
                } else {
                    // Element reached the boss - consume it into the void
                    element.deactivate();
                    
                    // Create void consumption particles
                    for (let i = 0; i < 10; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 2 + Math.random() * 3;
                        particlePool.spawn(
                            element.x,
                            element.y,
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed,
                            '#9b59b6' // Purple void color
                        );
                    }
                    
                    return false; // Remove from array
                }
            });
        }
        
        function endElementVacuum() {
            elementVacuumActive = false;
            
            // Elements have been consumed into the void - don't restore them
            // The map will naturally repopulate through the normal spawn system
            
            // Create a burst of void energy particles when vacuum ends
            if (currentBoss && currentBoss.alive) {
                for (let i = 0; i < 30; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 3 + Math.random() * 5;
                    particlePool.spawn(
                        currentBoss.x,
                        currentBoss.y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#9b59b6' // Purple void color
                    );
                }
            }
            
            vacuumedElements = [];
        }
        
        function drawBossSkullIndicator() {
            if (!currentBoss || !currentBoss.alive || !playerSnake || !playerSnake.alive) return;
            
            // Calculate boss position relative to camera
            const bossScreenX = (currentBoss.x - camera.x) * cameraZoom + canvas.width / 2;
            const bossScreenY = (currentBoss.y - camera.y) * cameraZoom + canvas.height / 2;
            
            // Check if boss is on screen
            const margin = 100; // Extra margin to ensure boss is fully visible
            if (bossScreenX >= -margin && bossScreenX <= canvas.width + margin && 
                bossScreenY >= -margin && bossScreenY <= canvas.height + margin) {
                // Boss is on screen, don't show indicator
                return;
            }
            
            // Calculate direction from player to boss
            const dx = currentBoss.x - playerSnake.x;
            const dy = currentBoss.y - playerSnake.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;
            
            // Calculate position on screen edge
            const edgeMargin = 60; // Distance from edge of screen
            let indicatorX, indicatorY;
            
            // Find intersection with screen edges
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Calculate the parameter t for the ray from center to boss
            const maxX = (canvas.width / 2 - edgeMargin) / Math.abs(dirX * cameraZoom);
            const maxY = (canvas.height / 2 - edgeMargin) / Math.abs(dirY * cameraZoom);
            const t = Math.min(maxX, maxY);
            
            indicatorX = centerX + dirX * t * cameraZoom;
            indicatorY = centerY + dirY * t * cameraZoom;
            
            // Clamp to screen bounds with margin
            indicatorX = Math.max(edgeMargin, Math.min(canvas.width - edgeMargin, indicatorX));
            indicatorY = Math.max(edgeMargin, Math.min(canvas.height - edgeMargin, indicatorY));
            
            // Draw the skull indicator
            ctx.save();
            
            // Create pulsing effect
            const pulseScale = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            const indicatorSize = 50 * pulseScale; // Increased from 30 to 50
            
            // Draw background circle with boss color
            ctx.fillStyle = currentBoss.color;
            ctx.globalAlpha = 0.5; // Increased from 0.3
            ctx.beginPath();
            ctx.arc(indicatorX, indicatorY, indicatorSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw border circle
            ctx.strokeStyle = currentBoss.color;
            ctx.lineWidth = 5; // Increased from 3
            ctx.globalAlpha = 1.0; // Increased from 0.8
            ctx.stroke();
            
            // Add white outline for better visibility
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.stroke();
            
            // Draw skull emoji
            ctx.globalAlpha = 1;
            const skullSize = Math.round(indicatorSize * 1.5);
            const skullCanvas = getCachedEmoji('💀', skullSize);
            ctx.drawImage(skullCanvas, indicatorX - skullCanvas.width / 2, indicatorY - skullCanvas.height / 2);
            
            // Draw directional arrow pointing towards boss
            ctx.save();
            ctx.translate(indicatorX, indicatorY);
            ctx.rotate(Math.atan2(dy, dx));
            
            // Arrow pointing outward
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4; // Increased from 2
            ctx.globalAlpha = 1.0; // Increased from 0.8
            ctx.beginPath();
            ctx.moveTo(indicatorSize + 10, 0);
            ctx.lineTo(indicatorSize + 25, -10); // Increased arrow size
            ctx.moveTo(indicatorSize + 10, 0);
            ctx.lineTo(indicatorSize + 25, 10); // Increased arrow size
            ctx.stroke();
            
            ctx.restore();
            
            // Draw distance text
            const distanceInUnits = Math.round(distance / 10);
            ctx.font = `bold ${14 * cameraZoom}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText(`${distanceInUnits}m`, indicatorX, indicatorY + indicatorSize + 5);
            ctx.fillStyle = '#fff';
            ctx.fillText(`${distanceInUnits}m`, indicatorX, indicatorY + indicatorSize + 5);
            
            ctx.restore();
        }
        
        function checkBossElementalDamage() {
            if (!currentBoss || !currentBoss.alive || !playerSnake || !playerSnake.alive) return;
            
            // Check cooldown to prevent spam damage
            if (bossDamageCooldown > 0) return;
            
            // Don't allow damage while boss is stunned
            if (currentBoss.stunTimer > 0) return;
            
            // Check player's element bank for combinations
            const playerElements = playerSnake.elements;
            const elementBank = getElementBankElements();
            const allPlayerElements = [...playerElements, ...elementBank];
            
            // Check if player has the right combination near the boss
            const dx = playerSnake.x - currentBoss.x;
            const dy = playerSnake.y - currentBoss.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 500) { // Within 500 pixels
                let canDamage = false;
                
                // Check if player has ANY combination containing the boss's element
                const bossElementId = currentBoss.elementId;
                let comboFound = null;
                let otherElementId = null;
                
                // First check for boss elements on the map near the player
                let mapBossElement = null;
                const elements = elementPool.getActiveElements();
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i];
                    if (!element.active || element.id !== bossElementId) continue;
                    
                    // Check if this boss element is near the player
                    const elemDx = element.x - playerSnake.x;
                    const elemDy = element.y - playerSnake.y;
                    const elemDist = Math.sqrt(elemDx * elemDx + elemDy * elemDy);
                    
                    if (elemDist < 150) { // Close enough to interact
                        mapBossElement = element;
                        break;
                    }
                }
                
                // Check if we can form a combination
                if (mapBossElement && allPlayerElements.length > 0) {
                    // Player has elements and there's a boss element on the map nearby
                    canDamage = true;
                    // Find any element in player's bank to combine with
                    otherElementId = allPlayerElements[0];
                    const comboKey = `${Math.min(bossElementId, otherElementId)}+${Math.max(bossElementId, otherElementId)}`;
                    if (window.elementLoader && window.elementLoader.combinations[comboKey]) {
                        comboFound = window.elementLoader.combinations[comboKey];
                    }
                } else if (allPlayerElements.includes(bossElementId)) {
                    // Check if player has the boss's element in their bank
                    const uniqueElements = [...new Set(allPlayerElements)];
                    if (uniqueElements.length >= 2) {
                        canDamage = true;
                        // Find the other element that isn't the boss element
                        for (let elemId of uniqueElements) {
                            if (elemId !== bossElementId) {
                                otherElementId = elemId;
                                // Check what this combination creates
                                const comboKey = `${Math.min(bossElementId, elemId)}+${Math.max(bossElementId, elemId)}`;
                                if (window.elementLoader && window.elementLoader.combinations[comboKey]) {
                                    comboFound = window.elementLoader.combinations[comboKey];
                                }
                                break;
                            }
                        }
                    }
                }
                
                if (canDamage) {
                    currentBoss.takeDamage('player_elemental');
                    
                    // Consume elements from player's bank
                    if (playerSnake && playerSnake.elements.length > 0) {
                        // Remove one boss element and one other element
                        let bossElementRemoved = false;
                        let otherElementRemoved = false;
                        
                        // Create new array without the consumed elements
                        playerSnake.elements = playerSnake.elements.filter(elemId => {
                            if (!bossElementRemoved && elemId === bossElementId) {
                                bossElementRemoved = true;
                                return false; // Remove this element
                            }
                            if (!otherElementRemoved && elemId === otherElementId) {
                                otherElementRemoved = true;
                                return false; // Remove this element
                            }
                            return true; // Keep this element
                        });
                        
                        // Update element bank display
                        if (typeof updateElementBank !== 'undefined') {
                            updateElementBank();
                        }
                    }
                    
                    // Show combo message
                    if (comboFound && otherElementId !== null) {
                        const bossElement = window.elementLoader.elementsById[bossElementId];
                        const otherElement = window.elementLoader.elementsById[otherElementId];
                        const resultElement = window.elementLoader.elementsById[comboFound];
                        if (bossElement && otherElement && resultElement) {
                            showMessage(`${bossElement.name} + ${otherElement.name} = ${resultElement.name}!`, 'gold', 5000);
                        } else {
                            showMessage('Elemental Resonance!', 'gold', 5000);
                        }
                    } else {
                        showMessage('Elemental Resonance!', 'gold', 5000);
                    }
                    
                    bossDamageCooldown = 180; // 3 second cooldown
                    
                    // Create shockwave effect
                    const elementColors = {
                        0: '#8b6914', // Earth - brown
                        1: '#0066ff', // Water - blue
                        2: '#ffffff', // Air - white
                        3: '#ff4444'  // Fire - red
                    };
                    
                    // Determine the color based on player's primary element
                    let shockwaveColor = '#FFD700'; // Default gold
                    if (allPlayerElements.length > 0) {
                        const primaryElement = allPlayerElements[0];
                        shockwaveColor = elementColors[primaryElement] || '#FFD700';
                    }
                    
                    shockwaves.push({
                        x: playerSnake.x,
                        y: playerSnake.y,
                        radius: 0,
                        maxRadius: 600, // Fixed max radius for omnidirectional wave
                        speed: 10, // Slower expansion for visibility
                        color: shockwaveColor,
                        life: 1.0,
                        type: 'omnidirectional',
                        owner: 'player' // Mark this as a player shockwave
                    });
                    
                    // Create spawn effect - energy gathering particles
                    for (let i = 0; i < 20; i++) {
                        const angle = (Math.PI * 2 * i) / 20;
                        const startRadius = 50;
                        particlePool.spawn(
                            playerSnake.x + Math.cos(angle) * startRadius,
                            playerSnake.y + Math.sin(angle) * startRadius,
                            -Math.cos(angle) * 3, // Particles move inward
                            -Math.sin(angle) * 3,
                            shockwaveColor
                        );
                    }
                    
                    // Play energy blast sound
                    if (!musicMuted) {
                        const blastSound = new Audio('sounds/magic-energy-whoosh.mp3');
                        blastSound.volume = 0.7;
                        blastSound.play().catch(e => {});
                    }
                }
            }
        }
        
        function getElementBankElements() {
            // Get elements from the element bank UI
            const slots = document.querySelectorAll('.element-slot');
            const elements = [];
            
            slots.forEach(slot => {
                const elementId = slot.dataset.elementId;
                if (elementId) {
                    elements.push(parseInt(elementId));
                }
            });
            
            return elements;
        }
        
        function updateElementBankUI() {
            // This will be called when element bank expands
            // Force a UI update to show the new slots
            if (gameStarted && playerSnake) {
                updateUI();
            }
        }
        
        function updateShockwaves(deltaTime) {
            shockwaves = shockwaves.filter(shockwave => {
                shockwave.radius += shockwave.speed * deltaTime;
                shockwave.life = 1.0 - (shockwave.radius / shockwave.maxRadius);
                
                // For omnidirectional shockwaves, check if it hits the boss
                if (shockwave.type === 'omnidirectional' && currentBoss && currentBoss.alive && !shockwave.hasHitBoss) {
                    const dx = currentBoss.x - shockwave.x;
                    const dy = currentBoss.y - shockwave.y;
                    const distToBoss = Math.sqrt(dx * dx + dy * dy);
                    
                    // Check if the expanding ring has reached the boss
                    const ringThickness = 20; // How thick the shockwave ring is
                    if (distToBoss >= shockwave.radius - ringThickness && distToBoss <= shockwave.radius + ringThickness) {
                        shockwave.hasHitBoss = true;
                        
                        // Deal damage to the boss only if this is a player shockwave
                        if (shockwave.owner === 'player') {
                            currentBoss.takeDamage('player_elemental');
                        }
                        
                        // Create impact particles at boss location
                        const impactParticles = 30;
                        for (let i = 0; i < impactParticles; i++) {
                            const angle = (Math.PI * 2 * i) / impactParticles;
                            const speed = 3 + Math.random() * 5;
                            const particleColor = i % 2 === 0 ? shockwave.color : '#ffffff';
                            
                            particlePool.spawn(
                                currentBoss.x,
                                currentBoss.y,
                                Math.cos(angle) * speed,
                                Math.sin(angle) * speed,
                                particleColor
                            );
                        }
                        
                        // Add screen shake for impact
                        if (bossScreenShakeTimer < 10) {
                            bossScreenShakeTimer = 10;
                            bossScreenShakeIntensity = 5;
                        }
                    }
                } else if (!shockwave.type) {
                    // Old directional shockwave logic (kept for compatibility)
                    if (shockwave.life <= 0 && !shockwave.exploded) {
                        shockwave.exploded = true;
                        
                        // Create explosion particles at target location
                        const explosionParticles = 50;
                        for (let i = 0; i < explosionParticles; i++) {
                            const angle = (Math.PI * 2 * i) / explosionParticles;
                            const speed = 5 + Math.random() * 7;
                            const particleColor = i % 2 === 0 ? shockwave.color : '#ffffff';
                            
                            particlePool.spawn(
                                shockwave.targetX,
                                shockwave.targetY,
                                Math.cos(angle) * speed,
                                Math.sin(angle) * speed,
                                particleColor
                            );
                        }
                    }
                }
                
                return shockwave.life > 0;
            });
        }
        
        function drawShockwaves() {
            shockwaves.forEach(shockwave => {
                ctx.save();
                
                const centerScreen = worldToScreen(shockwave.x, shockwave.y);
                
                if (shockwave.type === 'omnidirectional') {
                    // Draw expanding ring shockwave
                    const ringRadius = shockwave.radius * cameraZoom;
                    const progress = shockwave.radius / shockwave.maxRadius;
                    
                    // Outer ring
                    ctx.strokeStyle = shockwave.color;
                    ctx.lineWidth = 4 * cameraZoom;
                    ctx.globalAlpha = shockwave.life * 0.8;
                    ctx.beginPath();
                    ctx.arc(centerScreen.x, centerScreen.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Inner bright ring
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2 * cameraZoom;
                    ctx.globalAlpha = shockwave.life;
                    ctx.beginPath();
                    ctx.arc(centerScreen.x, centerScreen.y, ringRadius - 2 * cameraZoom, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Energy glow
                    const glowGradient = ctx.createRadialGradient(
                        centerScreen.x, centerScreen.y, ringRadius - 20 * cameraZoom,
                        centerScreen.x, centerScreen.y, ringRadius + 20 * cameraZoom
                    );
                    glowGradient.addColorStop(0, shockwave.color + '00');
                    glowGradient.addColorStop(0.5, shockwave.color + '66');
                    glowGradient.addColorStop(1, shockwave.color + '00');
                    
                    ctx.fillStyle = glowGradient;
                    ctx.globalAlpha = shockwave.life * 0.5;
                    ctx.beginPath();
                    ctx.arc(centerScreen.x, centerScreen.y, ringRadius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add energy particles along the ring
                    const particleCount = 16;
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (Math.PI * 2 * i) / particleCount + Date.now() * 0.001;
                        const particleX = centerScreen.x + Math.cos(angle) * ringRadius;
                        const particleY = centerScreen.y + Math.sin(angle) * ringRadius;
                        
                        ctx.fillStyle = i % 2 === 0 ? shockwave.color : '#ffffff';
                        ctx.globalAlpha = shockwave.life;
                        ctx.beginPath();
                        ctx.arc(particleX, particleY, 3 * cameraZoom, 0, Math.PI * 2);
                        ctx.fill();
                    }
                } else {
                    // Old directional blast rendering (kept for compatibility)
                    const angle = Math.atan2(
                        shockwave.targetY - shockwave.y,
                        shockwave.targetX - shockwave.x
                    );
                    
                    const currentX = shockwave.x + Math.cos(angle) * shockwave.radius;
                    const currentY = shockwave.y + Math.sin(angle) * shockwave.radius;
                    
                    const screen = worldToScreen(currentX, currentY);
                    
                    const progress = shockwave.radius / shockwave.maxRadius;
                    const pulseScale = 1 + Math.sin(Date.now() * 0.01) * 0.2 + progress * 0.5;
                    const blastSize = 40 * cameraZoom * pulseScale;
                    
                    const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, blastSize);
                    gradient.addColorStop(0, shockwave.color);
                    gradient.addColorStop(0.3, shockwave.color);
                    gradient.addColorStop(0.6, shockwave.color + '88');
                    gradient.addColorStop(1, shockwave.color + '00');
                    
                    ctx.globalAlpha = shockwave.life;
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, blastSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                ctx.restore();
            });
        }
        
        function updateBossFissures(deltaTime) {
            bossFissures = bossFissures.filter(fissure => {
                // Update fissure state
                if (fissure.state === 'warning') {
                    fissure.warningDuration -= deltaTime;
                    if (fissure.warningDuration <= 0) {
                        fissure.state = 'opening';
                    }
                } else if (fissure.state === 'opening') {
                    fissure.radius += fissure.growthSpeed * deltaTime;
                    if (fissure.radius >= fissure.targetRadius) {
                        fissure.radius = fissure.targetRadius;
                        fissure.state = 'open';
                    }
                } else if (fissure.state === 'open') {
                    fissure.life -= deltaTime;
                    if (fissure.life <= 60) { // Start closing in last second
                        fissure.state = 'closing';
                    }
                } else if (fissure.state === 'closing') {
                    fissure.radius -= fissure.growthSpeed * 2 * deltaTime; // Close faster
                    fissure.life -= deltaTime;
                    if (fissure.radius <= 0 || fissure.life <= 0) {
                        return false; // Remove fissure
                    }
                }
                
                // Check collision with player when fissure is open (not during warning)
                if (fissure.state !== 'warning' && fissure.radius > 20 && playerSnake && playerSnake.alive) {
                    const dx = playerSnake.x - fissure.x;
                    const dy = playerSnake.y - fissure.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const playerRadius = SEGMENT_SIZE * (playerSnake.size || 1);
                    
                    if (distance < fissure.radius + playerRadius) {
                        if (playerSnake.invincibilityTimer <= 0) {
                            // Create earth particles before death
                            for (let i = 0; i < 30; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const speed = 2 + Math.random() * 5;
                                particlePool.spawn(
                                    playerSnake.x,
                                    playerSnake.y,
                                    Math.cos(angle) * speed,
                                    Math.sin(angle) * speed,
                                    '#8b6914'
                                );
                            }
                            playerSnake.die(true);
                            showMessage('Swallowed by the earth!', 'red');
                        }
                    }
                }
                
                return true;
            });
        }
        
        function drawBossFissures() {
            bossFissures.forEach(fissure => {
                const screen = worldToScreen(fissure.x, fissure.y);
                
                ctx.save();
                
                // Handle warning state - draw dotted circle
                if (fissure.state === 'warning') {
                    const warningRadius = fissure.targetRadius * cameraZoom;
                    ctx.strokeStyle = 'rgba(255, 100, 0, 0.8)';
                    ctx.lineWidth = 3 * cameraZoom;
                    ctx.setLineDash([10 * cameraZoom, 10 * cameraZoom]);
                    ctx.beginPath();
                    ctx.arc(screen.x, screen.y, warningRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.setLineDash([]); // Reset line dash
                    ctx.restore();
                    return; // Skip normal fissure drawing
                }
                
                const radius = fissure.radius * cameraZoom;
                
                // Draw dark fissure hole
                const gradient = ctx.createRadialGradient(
                    screen.x, screen.y, 0,
                    screen.x, screen.y, radius
                );
                
                // Animate the colors based on state
                if (fissure.state === 'opening') {
                    gradient.addColorStop(0, 'rgba(20, 10, 0, 0.9)');
                    gradient.addColorStop(0.5, 'rgba(50, 25, 10, 0.7)');
                    gradient.addColorStop(0.8, 'rgba(80, 40, 20, 0.5)');
                    gradient.addColorStop(1, 'rgba(100, 50, 25, 0.2)');
                } else if (fissure.state === 'closing') {
                    const alpha = fissure.life / 60; // Fade out
                    gradient.addColorStop(0, `rgba(20, 10, 0, ${0.9 * alpha})`);
                    gradient.addColorStop(0.5, `rgba(50, 25, 10, ${0.7 * alpha})`);
                    gradient.addColorStop(0.8, `rgba(80, 40, 20, ${0.5 * alpha})`);
                    gradient.addColorStop(1, `rgba(100, 50, 25, ${0.2 * alpha})`);
                } else {
                    gradient.addColorStop(0, 'rgba(10, 5, 0, 1)'); // Very dark center
                    gradient.addColorStop(0.3, 'rgba(30, 15, 5, 0.9)');
                    gradient.addColorStop(0.6, 'rgba(60, 30, 15, 0.6)');
                    gradient.addColorStop(1, 'rgba(90, 45, 20, 0.3)');
                }
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw danger edge
                if (fissure.state === 'open') {
                    ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
                    ctx.lineWidth = 3 * cameraZoom;
                    ctx.stroke();
                }
                
                // Draw cracks around the edge
                ctx.strokeStyle = 'rgba(50, 25, 10, 0.8)';
                ctx.lineWidth = 2 * cameraZoom;
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const crackLength = radius * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(
                        screen.x + Math.cos(angle) * radius,
                        screen.y + Math.sin(angle) * radius
                    );
                    ctx.lineTo(
                        screen.x + Math.cos(angle) * (radius + crackLength),
                        screen.y + Math.sin(angle) * (radius + crackLength)
                    );
                    ctx.stroke();
                }
                
                ctx.restore();
            });
        }
        
        function drawBossProjectiles() {
            bossProjectiles.forEach(projectile => {
                const screen = worldToScreen(projectile.x, projectile.y);
                
                ctx.save();
                
                switch(projectile.type) {
                    case 'fireball':
                        // Draw fireball
                        const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, projectile.size);
                        gradient.addColorStop(0, '#ffff00');
                        gradient.addColorStop(0.5, '#ff6600');
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(screen.x, screen.y, projectile.size * cameraZoom, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Add fire emoji
                        const fireCanvas = getCachedEmoji('🔥', Math.round(projectile.size * cameraZoom));
                        ctx.drawImage(fireCanvas, screen.x - fireCanvas.width / 2, screen.y - fireCanvas.height / 2);
                        break;
                        
                    case 'waterwave':
                        // Draw expanding water ring
                        ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
                        ctx.lineWidth = 10 * cameraZoom;
                        ctx.beginPath();
                        ctx.arc(projectile.x - camera.x + canvas.width / 2, 
                               projectile.y - camera.y + canvas.height / 2, 
                               projectile.radius * cameraZoom, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // Inner glow
                        ctx.strokeStyle = 'rgba(100, 200, 255, 0.5)';
                        ctx.lineWidth = 20 * cameraZoom;
                        ctx.stroke();
                        break;
                        
                    case 'rock':
                        if (projectile.falling) {
                            // Draw shadow at target position with warning indicator
                            const shadowScreen = worldToScreen(projectile.x, projectile.targetY);
                            
                            // Draw pulsing red warning circle
                            const warningPulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
                            ctx.globalAlpha = warningPulse * 0.5;
                            ctx.strokeStyle = '#ff0000';
                            ctx.lineWidth = 3 * cameraZoom;
                            ctx.beginPath();
                            ctx.arc(shadowScreen.x, shadowScreen.y, 
                                  projectile.size * 1.5 * cameraZoom, 
                                  0, Math.PI * 2);
                            ctx.stroke();
                            
                            // Draw shadow
                            ctx.globalAlpha = 0.3;
                            ctx.fillStyle = '#000';
                            ctx.beginPath();
                            ctx.ellipse(shadowScreen.x, shadowScreen.y, 
                                      projectile.size * cameraZoom, 
                                      projectile.size * 0.5 * cameraZoom, 
                                      0, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.globalAlpha = 1;
                        }
                        
                        // Draw rock
                        const rockGradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, projectile.size);
                        rockGradient.addColorStop(0, '#8b6914');
                        rockGradient.addColorStop(0.7, '#654321');
                        rockGradient.addColorStop(1, '#4a3018');
                        ctx.fillStyle = rockGradient;
                        ctx.beginPath();
                        ctx.arc(screen.x, screen.y, projectile.size * cameraZoom, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Add rock emoji
                        const rockCanvas = getCachedEmoji('🪨', Math.round(projectile.size * 1.5 * cameraZoom));
                        ctx.drawImage(rockCanvas, screen.x - rockCanvas.width / 2, screen.y - rockCanvas.height / 2);
                        
                        // Draw impact crater if it exists
                        if (projectile.impactCrater) {
                            const crater = projectile.impactCrater;
                            const craterScreen = worldToScreen(crater.x, crater.y);
                            
                            // Draw crater with fading effect
                            const craterAlpha = crater.life / 180; // Fade out over time
                            ctx.globalAlpha = craterAlpha * 0.6;
                            
                            // Crater gradient
                            const craterGradient = ctx.createRadialGradient(
                                craterScreen.x, craterScreen.y, 0,
                                craterScreen.x, craterScreen.y, crater.radius * cameraZoom
                            );
                            craterGradient.addColorStop(0, 'rgba(50, 30, 10, 0.8)');
                            craterGradient.addColorStop(0.5, 'rgba(80, 50, 20, 0.5)');
                            craterGradient.addColorStop(1, 'rgba(100, 70, 30, 0)');
                            
                            ctx.fillStyle = craterGradient;
                            ctx.beginPath();
                            ctx.arc(craterScreen.x, craterScreen.y, crater.radius * cameraZoom, 0, Math.PI * 2);
                            ctx.fill();
                            
                            // Danger zone indicator
                            ctx.globalAlpha = craterAlpha * 0.3;
                            ctx.strokeStyle = '#ff4444';
                            ctx.lineWidth = 2 * cameraZoom;
                            ctx.setLineDash([5, 5]);
                            ctx.beginPath();
                            ctx.arc(craterScreen.x, craterScreen.y, crater.radius * cameraZoom, 0, Math.PI * 2);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }
                        break;
                        
                    case 'waterorb':
                        // Draw water orb
                        const waterOrbGradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, projectile.size * cameraZoom);
                        waterOrbGradient.addColorStop(0, 'rgba(100, 200, 255, 0.8)');
                        waterOrbGradient.addColorStop(0.5, 'rgba(64, 164, 223, 0.6)');
                        waterOrbGradient.addColorStop(1, 'rgba(30, 100, 200, 0.4)');
                        
                        ctx.fillStyle = waterOrbGradient;
                        ctx.beginPath();
                        ctx.arc(screen.x, screen.y, projectile.size * cameraZoom, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Add water emoji
                        const waterCanvas = getCachedEmoji('💧', Math.round(projectile.size * 1.2 * cameraZoom));
                        ctx.drawImage(waterCanvas, screen.x - waterCanvas.width / 2, screen.y - waterCanvas.height / 2);
                        break;
                        
                    case 'void':
                        // Draw void projectile with dark purple energy
                        const voidGradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, projectile.size * cameraZoom);
                        voidGradient.addColorStop(0, 'rgba(155, 89, 182, 0.9)');
                        voidGradient.addColorStop(0.5, 'rgba(75, 0, 130, 0.7)');
                        voidGradient.addColorStop(1, 'rgba(25, 0, 51, 0.5)');
                        
                        ctx.fillStyle = voidGradient;
                        ctx.beginPath();
                        ctx.arc(screen.x, screen.y, projectile.size * cameraZoom, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Add void/dark energy effect
                        ctx.strokeStyle = 'rgba(155, 89, 182, 0.8)';
                        ctx.lineWidth = 3 * cameraZoom;
                        ctx.stroke();
                        
                        // Add void emoji or symbol
                        const voidCanvas = getCachedEmoji('🌀', Math.round(projectile.size * 1.3 * cameraZoom));
                        ctx.drawImage(voidCanvas, screen.x - voidCanvas.width / 2, screen.y - voidCanvas.height / 2);
                        break;
                        
                    case 'tornado':
                        // Save context for rotation
                        ctx.save();
                        ctx.translate(screen.x, screen.y);
                        ctx.rotate(projectile.rotation);
                        
                        // Draw swirling tornado effect
                        const tornadoGradient = ctx.createRadialGradient(0, 0, projectile.size * 0.2 * cameraZoom, 0, 0, projectile.size * cameraZoom);
                        tornadoGradient.addColorStop(0, 'rgba(135, 206, 235, 0.9)'); // Light blue center
                        tornadoGradient.addColorStop(0.3, 'rgba(100, 150, 200, 0.7)');
                        tornadoGradient.addColorStop(0.6, 'rgba(70, 130, 180, 0.5)');
                        tornadoGradient.addColorStop(1, 'rgba(50, 100, 150, 0.2)');
                        
                        ctx.fillStyle = tornadoGradient;
                        ctx.beginPath();
                        ctx.arc(0, 0, projectile.size * cameraZoom, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Draw spiral lines
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                        ctx.lineWidth = 2 * cameraZoom;
                        for (let i = 0; i < 3; i++) {
                            ctx.beginPath();
                            const startAngle = (i * Math.PI * 2 / 3);
                            ctx.moveTo(0, 0);
                            const endX = Math.cos(startAngle) * projectile.size * cameraZoom;
                            const endY = Math.sin(startAngle) * projectile.size * cameraZoom;
                            ctx.quadraticCurveTo(
                                endX * 0.5, endY * 0.5 + 10 * cameraZoom,
                                endX, endY
                            );
                            ctx.stroke();
                        }
                        
                        ctx.restore();
                        
                        // Add tornado emoji
                        const tornadoCanvas = getCachedEmoji('🌪️', Math.round(projectile.size * 1.5 * cameraZoom));
                        ctx.drawImage(tornadoCanvas, screen.x - tornadoCanvas.width / 2, screen.y - tornadoCanvas.height / 2);
                        break;
                }
                
                ctx.restore();
            });
        }
        
        function updateDamageNumbers(deltaTime) {
            damageNumbers = damageNumbers.filter(num => {
                num.y += num.vy * deltaTime;
                num.life -= deltaTime;
                num.vy += 0.2 * deltaTime; // Gravity
                return num.life > 0;
            });
        }
        
        function drawDamageNumbers() {
            damageNumbers.forEach(num => {
                const screen = worldToScreen(num.x, num.y);
                
                ctx.save();
                ctx.globalAlpha = num.life / 60; // Fade out
                ctx.font = `bold ${40 * cameraZoom}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Draw outline
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 4 * cameraZoom;
                ctx.strokeText(num.text, screen.x, screen.y);
                
                // Draw text
                ctx.fillStyle = num.color;
                ctx.fillText(num.text, screen.x, screen.y);
                
                ctx.restore();
            });
        }
        
        // Helper functions
        function getGridKey(x, y) {
            const gridX = Math.floor(x / ELEMENT_GRID_SIZE);
            const gridY = Math.floor(y / ELEMENT_GRID_SIZE);
            return `${gridX},${gridY}`;
        }
        
        function updateElementGrid() {
            // Rebuild grid map based on current elements
            elementGrid.clear();
            const activeElements = elementPool.getActiveElements();
            
            activeElements.forEach(element => {
                const key = getGridKey(element.x, element.y);
                if (!elementGrid.has(key)) {
                    elementGrid.set(key, []);
                }
                elementGrid.get(key).push(element);
            });
        }
        
        function spawnElementWithGridDistribution() {
            // Update grid map
            updateElementGrid();
            
            // Find cells that need more elements
            const gridCellsX = Math.ceil(WORLD_SIZE / ELEMENT_GRID_SIZE);
            const gridCellsY = Math.ceil(WORLD_SIZE / ELEMENT_GRID_SIZE);
            const underfilledCells = [];
            
            for (let gx = 0; gx < gridCellsX; gx++) {
                for (let gy = 0; gy < gridCellsY; gy++) {
                    const key = `${gx},${gy}`;
                    const cellElements = elementGrid.get(key) || [];
                    
                    if (cellElements.length < MIN_ELEMENTS_PER_CELL) {
                        // Priority for empty or underfilled cells
                        underfilledCells.push({ gx, gy, count: cellElements.length, priority: 1 });
                    } else if (cellElements.length < MAX_ELEMENTS_PER_CELL) {
                        // Lower priority for partially filled cells
                        underfilledCells.push({ gx, gy, count: cellElements.length, priority: 0.3 });
                    }
                }
            }
            
            if (underfilledCells.length > 0) {
                // Sort by priority and element count
                underfilledCells.sort((a, b) => {
                    if (a.priority !== b.priority) return b.priority - a.priority;
                    return a.count - b.count;
                });
                
                // Pick from top candidates with some randomness
                const topCandidates = underfilledCells.slice(0, Math.min(5, underfilledCells.length));
                const selectedCell = topCandidates[Math.floor(Math.random() * topCandidates.length)];
                
                // Spawn in the selected cell
                const cellX = selectedCell.gx * ELEMENT_GRID_SIZE;
                const cellY = selectedCell.gy * ELEMENT_GRID_SIZE;
                
                // Random position within cell with margin
                const margin = 50;
                const x = cellX + margin + Math.random() * (ELEMENT_GRID_SIZE - margin * 2);
                const y = cellY + margin + Math.random() * (ELEMENT_GRID_SIZE - margin * 2);
                
                // Ensure within world bounds
                const finalX = Math.max(100, Math.min(WORLD_SIZE - 100, x));
                const finalY = Math.max(100, Math.min(WORLD_SIZE - 100, y));
                
                spawnElement(null, finalX, finalY);
            } else {
                // Fallback to random spawn if all cells are filled
                spawnElement();
            }
        }
        
        function spawnElement(id = null, x = null, y = null) {
            if (id === null || id === undefined) {
                // Smart spawning: bias towards elements that can combine with what snakes are carrying
                if (window.elementLoader && window.elementLoader.isLoaded && window.elementLoader.isLoaded()) {
                    // Focus on PLAYER's carried elements for smart spawning
                    const playerCarriedElements = new Set();
                    const allCarriedElements = new Set();
                    
                    snakes.forEach(snake => {
                        if (snake && snake.alive) {
                            snake.elements.forEach(elemId => {
                                allCarriedElements.add(elemId);
                                if (snake.isPlayer) {
                                    playerCarriedElements.add(elemId);
                                }
                            });
                        }
                    });
                    
                    // Build weighted spawn list
                    const spawnWeights = new Map();
                    
                    // Determine progression phase based on PLAYER discoveries only (much lower base weights)
                    const discoveryCount = playerDiscoveredElements.size;
                    let phase;
                    if (discoveryCount <= 10) {
                        phase = { name: 'TUTORIAL', baseWeight: 4, discoveredWeight: 2 };
                    } else if (discoveryCount <= 25) {
                        phase = { name: 'EARLY', baseWeight: 1, discoveredWeight: 5 };
                    } else if (discoveryCount <= 50) {
                        phase = { name: 'MID', baseWeight: 0.3, discoveredWeight: 8 };
                    } else if (discoveryCount <= 100) {
                        phase = { name: 'LATE', baseWeight: 0.1, discoveredWeight: 10 };
                    } else {
                        phase = { name: 'MASTER', baseWeight: 0.05, discoveredWeight: 12 };
                    }
                    
                    // 60% chance to prioritize spawning for player combinations/discoveries
                    const prioritizePlayerCombos = Math.random() < 0.6;
                    const prioritizeDiscovery = Math.random() < 0.4;
                    
                    // Less verbose debug logging
                    if (Math.random() < 0.05) { // Only log 5% of the time
                    }
                    
                    // Clean up old discovery echoes
                    const now = Date.now();
                    for (const [elemId, timestamp] of recentlyDiscoveredElements) {
                        if (now - timestamp > DISCOVERY_ECHO_DURATION) {
                            recentlyDiscoveredElements.delete(elemId);
                        }
                    }
                    
                    // Iterate through all elements in the new system
                    let totalDiscoveredNonBase = 0;
                    for (const [elemId, element] of window.elementLoader.elements) {
                        let weight = 0; // Start with 0 weight
                        
                        // Check if element should spawn
                        // IMPORTANT: Only IDs 0,1,2,3 are true base elements, not all tier 0!
                        const elemIdNum = typeof elemId === 'string' ? parseInt(elemId) : elemId;
                        const isBaseElement = elemIdNum >= 0 && elemIdNum <= 3;
                        // IMPORTANT: Only spawn elements the PLAYER has discovered, not AI discoveries
                        const isPlayerDiscovered = playerDiscoveredElements.has(elemIdNum);
                        
                        if (isBaseElement || isPlayerDiscovered) {
                            // Base weight calculation
                            if (isBaseElement) {
                                weight = phase.baseWeight;
                            } else {
                                // Discovered non-base elements
                                const tierModifier = Math.max(0.5, 1 - (element.t * 0.05)); // Less harsh tier penalty
                                weight = phase.discoveredWeight * tierModifier;
                                totalDiscoveredNonBase++;
                            }
                            
                            // Anti-clustering: reduce weight if recently spawned (less harsh)
                            const recentSpawnCount = recentlySpawnedElements.filter(id => id === elemId).length;
                            if (recentSpawnCount > 0) {
                                weight *= Math.pow(0.5, recentSpawnCount); // 50% reduction per recent spawn (was 80%)
                            }
                            
                            // SPECIAL CASE: Heavily reduce Fire element after early game
                            if (elemId === 3 && discoveryCount > 10) { // Fire element ID is 3 (correct)
                                weight *= 0.1; // 90% reduction for Fire after 10 discoveries
                            }
                            
                            // Discovery echo: boost recently discovered elements
                            if (recentlyDiscoveredElements.has(elemId)) {
                                weight *= 5; // 5x boost for recently discovered elements
                            }
                            
                            // Ensure minimum weight for player-discovered elements
                            if (isPlayerDiscovered && !isBaseElement && weight > 0) {
                                weight = Math.max(weight, 0.5); // Minimum weight of 0.5 for player-discovered elements
                            }
                            
                            let hasPlayerCombo = false;
                            let hasUndiscoveredCombo = false;
                            
                            // MASSIVE bonus for elements that can combine with PLAYER's bank
                            if (prioritizePlayerCombos && playerCarriedElements.size > 0) {
                                for (const carriedId of playerCarriedElements) {
                                    const comboKey = `${Math.min(elemId, carriedId)}+${Math.max(elemId, carriedId)}`;
                                    const resultId = window.elementLoader.combinations[comboKey];
                                    if (resultId !== undefined && resultId !== null) {
                                        hasPlayerCombo = true;
                                        // Check if the result is discovered by player
                                        if (!playerDiscoveredElements.has(resultId)) {
                                            hasUndiscoveredCombo = true;
                                            weight *= 20; // MASSIVE bonus for new discoveries from player's bank
                                        } else {
                                            weight *= 10; // Big bonus for known combinations with player's bank
                                        }
                                    }
                                }
                            }
                            
                            // Secondary check for other snakes if not prioritizing player
                            if (!hasPlayerCombo && allCarriedElements.size > 0) {
                                for (const carriedId of allCarriedElements) {
                                    const comboKey = `${Math.min(elemId, carriedId)}+${Math.max(elemId, carriedId)}`;
                                    const resultId = window.elementLoader.combinations[comboKey];
                                    if (resultId !== undefined && resultId !== null) {
                                        if (!playerDiscoveredElements.has(resultId)) {
                                            weight *= 3; // Smaller bonus for AI snake potential discoveries
                                        } else {
                                            weight *= 1.5; // Small bonus for AI snake combinations
                                        }
                                        break; // Only apply once
                                    }
                                }
                            }
                            
                            // Additional bonus for elements that can lead to many undiscovered combinations
                            if (prioritizeDiscovery && !hasUndiscoveredCombo) {
                                // Check how many undiscovered combinations this element can create
                                let undiscoveredPotential = 0;
                                for (const [otherId, otherElem] of window.elementLoader.elements) {
                                    if (playerDiscoveredElements.has(otherId) || otherElem.t === 0) { // Player discovered or base element
                                        const comboKey = `${Math.min(elemId, otherId)}+${Math.max(elemId, otherId)}`;
                                        const resultId = window.elementLoader.combinations[comboKey];
                                        if (resultId !== undefined && resultId !== null && !playerDiscoveredElements.has(resultId)) {
                                            undiscoveredPotential++;
                                        }
                                    }
                                }
                                
                                if (undiscoveredPotential > 0) {
                                    weight *= (1 + undiscoveredPotential * 0.5); // Bonus based on discovery potential
                                }
                            }
                        }
                        
                        if (weight > 0) {
                            spawnWeights.set(elemId, weight);
                        }
                    }
                    
                    // Weighted random selection
                    let totalWeight = 0;
                    spawnWeights.forEach(w => totalWeight += w);
                    
                    // Debug spawn weights at game start
                    const weightsGameTime = Date.now() - gameStartTime;
                    if (weightsGameTime < 5000) { // First 5 seconds
                        spawnWeights.forEach((weight, elemId) => {
                            const elem = window.elementLoader.elements.get(elemId);
                            const elemIdNum = typeof elemId === 'string' ? parseInt(elemId) : elemId;
                            const isRealBase = elemIdNum >= 0 && elemIdNum <= 3;
                            if (elem && !isRealBase) { // Non-base elements (excluding IDs 0-3)
                            }
                        });
                    }
                    
                    // Add discovered elements debug
                    if (totalDiscoveredNonBase > 0 && Math.random() < 0.02) {
                    }
                    
                    // If we have very few spawn options, force add some player-discovered elements
                    if (spawnWeights.size < 10 && playerDiscoveredElements.size > 10) {
                        // Add random player-discovered elements to spawn pool
                        const playerDiscoveredArray = Array.from(playerDiscoveredElements);
                        for (let i = 0; i < 5; i++) {
                            const randomDiscovered = playerDiscoveredArray[Math.floor(Math.random() * playerDiscoveredArray.length)];
                            if (!spawnWeights.has(randomDiscovered)) {
                                const elem = window.elementLoader.elements.get(randomDiscovered);
                                if (elem && elem.t > 0) { // Non-base element
                                    spawnWeights.set(randomDiscovered, phase.discoveredWeight * 0.5);
                                    totalWeight += phase.discoveredWeight * 0.5;
                                }
                            }
                        }
                    }
                    
                    let rand = Math.random() * totalWeight;
                    let selectedId = null;
                    
                    for (const [elemId, weight] of spawnWeights) {
                        rand -= weight;
                        if (rand <= 0) {
                            selectedId = elemId;
                            break;
                        }
                    }
                    
                    id = (selectedId !== null && selectedId !== undefined) ? selectedId : 3; // Fallback to Fire (ID 3) if something goes wrong
                    
                    // ALWAYS log what's being spawned at game start
                    const spawnGameTime = Date.now() - gameStartTime;
                    if (spawnGameTime < 5000) { // First 5 seconds
                        const elem = window.elementLoader.elements.get(id);
                    }
                    
                    // Debug what was selected (with player bank info)
                    if (selectedId !== undefined && selectedId !== null && window.elementLoader && Math.random() < 0.1) {
                        const elem = window.elementLoader.elements.get(selectedId);
                        if (elem && playerCarriedElements.size > 0) {
                            // Check if this can combine with player's bank
                            let canCombine = false;
                            for (const carriedId of playerCarriedElements) {
                                const comboKey = `${Math.min(selectedId, carriedId)}+${Math.max(selectedId, carriedId)}`;
                                if (window.elementLoader.combinations[comboKey]) {
                                    canCombine = true;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    // Fallback - use base elements
                    const basics = [0, 1, 2, 3]; // Earth, Water, Air, Fire
                    id = basics[Math.floor(Math.random() * basics.length)];
                }
            }
            
            // Random position if not specified
            if (!x || !y) {
                // Try to find a position not too close to snakes
                let attempts = 0;
                const maxAttempts = 20;
                const minDistanceFromSnakes = 150; // Minimum distance from any snake
                
                while (attempts < maxAttempts) {
                    x = 100 + Math.random() * (WORLD_SIZE - 200);
                    y = 100 + Math.random() * (WORLD_SIZE - 200);
                    
                    // Check distance from all snakes
                    let tooClose = false;
                    for (const snake of snakes) {
                        if (snake && snake.alive) {
                            // Check distance to snake head
                            const dist = Math.hypot(snake.x - x, snake.y - y);
                            if (dist < minDistanceFromSnakes) {
                                tooClose = true;
                                break;
                            }
                            
                            // Also check first few segments
                            for (let i = 0; i < Math.min(5, snake.segments.length); i++) {
                                const segment = snake.segments[i];
                                const segDist = Math.hypot(segment.x - x, segment.y - y);
                                if (segDist < minDistanceFromSnakes) {
                                    tooClose = true;
                                    break;
                                }
                            }
                            
                            if (tooClose) break;
                        }
                    }
                    
                    if (!tooClose) {
                        break; // Found a good position
                    }
                    
                    attempts++;
                }
                
                // If we couldn't find a good position after max attempts, use the last one
                if (attempts >= maxAttempts) {
                }
            }
            
            // Add to spawn history for anti-clustering
            recentlySpawnedElements.push(id);
            if (recentlySpawnedElements.length > MAX_SPAWN_HISTORY) {
                recentlySpawnedElements.shift(); // Remove oldest
            }
            
            // Also check distance from other elements to prevent clustering
            const minDistanceBetweenSameElements = 200;
            const activeElements = elementPool.getActiveElements();
            for (const element of activeElements) {
                if (element.id === id && element !== elementPool.activeElements[elementPool.activeElements.length - 1]) {
                    const dist = Math.hypot(element.x - x, element.y - y);
                    if (dist < minDistanceBetweenSameElements) {
                        // Try to find a better position
                        x = 100 + Math.random() * (WORLD_SIZE - 200);
                        y = 100 + Math.random() * (WORLD_SIZE - 200);
                        break;
                    }
                }
            }
            
            elementPool.spawn(id, x, y);
        }
        
        function createCombinationParticles(x, y) {
            const particleCount = isMobile ? 10 : 20; // Reduced for mobile
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const speed = 2 + Math.random() * 3;
                particlePool.spawn(
                    x, y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    `hsl(${Math.random() * 360}, 70%, 50%)`
                );
            }
        }
        
        function createDeathParticles(x, y, snakeLength = 5, snakeColor = null, elementsCarried = [], snakeType = null) {
            // Determine explosion type based on snake
            let explosionType;
            let isBossSnake = false;
            
            // Check if this is the player snake
            if (snakeType === 'player' || (snakes[0] && snakes[0].x === x && snakes[0].y === y && snakes[0].isPlayer)) {
                explosionType = 'toon-impact-large-violet';
            } 
            // Check if this is a boss snake
            else if (snakeType === 'boss' || (currentBoss && currentBoss.snake && currentBoss.snake.x === x && currentBoss.snake.y === y)) {
                explosionType = 'dust-impact-large-red';
                isBossSnake = true;
            }
            // Default to AI snake explosion
            else {
                explosionType = 'quick-impact-large-blue';
            }
            
            // Create the explosion animation if manager is loaded
            if (explosionManager) {
                if (isBossSnake) {
                    // Boss gets cluster explosion
                    explosionManager.createClusterExplosion(explosionType, x, y, 4, 60);
                } else {
                    // Regular explosion for player and AI snakes
                    const scale = 1 + (snakeLength / 100); // Scale based on snake size
                    explosionManager.createExplosion(explosionType, x, y, { scale });
                }
            }
            
            // Keep minimal particle effects for elements
            // Reduce particles significantly for players
            if (elementsCarried.length > 0 && !isMobile && snakeType !== 'player') {
                // Only spawn element particles for AI and boss snakes
                const elementParticleCount = Math.min(elementsCarried.length * 2, 8);
                for (let i = 0; i < elementParticleCount; i++) {
                    const element = elementsCarried[i % elementsCarried.length];
                    if (!element) continue;
                    
                    // Get element color based on tier or type
                    let elementColor = '#00ff00'; // Default green
                    const elemData = window.elementLoader?.elements.get(element);
                    if (elemData) {
                        // Color based on tier
                        const tierColors = ['#4CAF50', '#2196F3', '#9C27B0', '#FF9800', '#F44336', '#FFD700'];
                        elementColor = tierColors[Math.min(elemData.t || 0, tierColors.length - 1)];
                    }
                    
                    const angle = Math.random() * Math.PI * 2;
                    const speed = (Math.random() * 3 + 1) * (1 + snakeLength / 100);
                    
                    particlePool.spawn(
                        x,
                        y,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        elementColor,
                        4 * 1.2,
                        'circle',
                        {
                            fadeRate: 0.02,
                            trail: true,
                            trailLength: 4,
                            growthRate: -0.05
                        }
                    );
                }
            }
        }
        
        function showCombinationMessage(id1, id2, resultId, isNew) {
            // Get element data from new system using numeric IDs
            const elem1Data = window.elementLoader.elements.get(id1);
            const elem2Data = window.elementLoader.elements.get(id2);
            const resultData = window.elementLoader.elements.get(resultId);
            
            if (!elem1Data || !elem2Data || !resultData) {
                gameLogger.error('UI', 'Missing element data for combination message');
                return;
            }
            
            const emoji1 = window.elementLoader.getEmojiForElement(id1, elem1Data.e);
            const emoji2 = window.elementLoader.getEmojiForElement(id2, elem2Data.e);
            const emojiResult = window.elementLoader.getEmojiForElement(resultId, resultData.e);
            
            let message = `${emoji1} ${elem1Data.n} + ${emoji2} ${elem2Data.n} = ${emojiResult} ${resultData.n}`;
            if (isNew) {
                message = `New Discovery! ${message}`;
                // Update discovery log for new discoveries
                lastDiscoveredElement = resultId;
                updateDiscoveryLog();
                
                // Add to discovery echo system for boosted spawning
                recentlyDiscoveredElements.set(resultId, Date.now());
                
                // Add to discovery feed
                const recipeText = `${emoji1} ${elem1Data.n} + ${emoji2} ${elem2Data.n}`;
                throttledAddDiscovery({
                    emoji: emojiResult,
                    name: resultData.n
                }, recipeText);
            } else {
                message = `Combo! ${message}`;
            }
            
            showMessage(message, isNew, 5000);
        }
        
        function showMessage(text, isDiscovery, timeout = 3000) {
            // Don't show messages if game hasn't started
            if (!window.gameStarted) return;
            
            const popup = document.getElementById('recentDiscovery');
            popup.innerHTML = text;
            
            // Handle different types of messages
            if (isDiscovery === 'gold') {
                popup.className = 'show gold';
            } else if (isDiscovery === 'red') {
                popup.className = 'show red';
            } else if (isDiscovery === 'cyan') {
                popup.className = 'show cyan';
            } else if (isDiscovery === 'purple') {
                popup.className = 'show purple';
            } else if (isDiscovery === 'orange') {
                popup.className = 'show orange';
            } else if (isDiscovery === 'combo') {
                popup.className = 'show combo';
            } else if (isDiscovery === true) {
                popup.className = 'show';
            } else {
                popup.className = 'show combo';
            }
            
            popup.style.opacity = '1';
            
            // Clear any existing timeout
            if (popup.hideTimeout) {
                clearTimeout(popup.hideTimeout);
            }
            
            // Set new timeout
            popup.hideTimeout = setTimeout(() => {
                popup.style.opacity = '0';
                popup.className = '';
            }, timeout);
        }
        
        // Expose showMessage globally
        window.showMessage = showMessage;
        
        // Boss Victory Message function
        function showBossVictoryMessage(boss, skinUnlocked, elementBankExpanded) {
            const victoryBox = document.getElementById('bossVictoryMessage');
            
            // Build the message content
            let html = '<h2>BOSS VANQUISHED!</h2>';
            html += `<div class="boss-name">${boss.name}</div>`;
            
            // Add defeat flavor text based on boss type
            let defeatText = '';
            switch(boss.bossType) {
                case 'PYRAXIS':
                    defeatText = "The Molten Lord's flames are extinguished! Banished to the eternal void!";
                    break;
                case 'ABYSSOS':
                    defeatText = "The Deep One sinks into the abyss! Cast into the void's embrace!";
                    break;
                case 'ZEPHYRUS':
                    defeatText = "The Storm Caller's winds are silenced! Scattered to the void!";
                    break;
                case 'OSSEUS':
                    defeatText = "The Bone Sovereign crumbles to dust! Entombed in the void!";
                    break;
                default:
                    defeatText = `${boss.name} has been banished to the void!`;
            }
            html += `<div class="defeat-text">${defeatText}</div>`;
            
            // Add rewards section
            html += '<div class="rewards">';
            html += '<div class="reward-item highlight">✨ +10,000 Points!</div>';
            
            // Add revive earned message for Classic mode
            if (gameMode === 'classic' && revivesRemaining < 3) {
                html += '<div class="reward-item highlight">❤️ +1 Revive Earned!</div>';
            }
            
            html += '<div class="reward-item">💎 4x Catalyst Gems</div>';
            html += '<div class="reward-item">🌀 2x Void Orbs</div>';
            html += '<div class="reward-item">🔥 16x Boss Elements</div>';
            
            // Only show skin unlock if it's new
            if (skinUnlocked) {
                const skinName = BOSS_TYPES[boss.bossType].skin;
                html += `<div class="reward-item highlight">🎨 ${boss.name} Skin Unlocked!</div>`;
            }
            
            // Show element bank expansion if applicable
            if (elementBankExpanded) {
                html += `<div class="reward-item highlight">📦 Element Bank Expanded!</div>`;
            }
            
            html += '</div>';
            
            // Set the content and show the message
            victoryBox.innerHTML = html;
            victoryBox.className = 'show';
            victoryBox.style.display = 'block';
            
            // Clear any existing timeout
            if (victoryBox.hideTimeout) {
                clearTimeout(victoryBox.hideTimeout);
            }
            
            // Hide after 8 seconds
            victoryBox.hideTimeout = setTimeout(() => {
                victoryBox.style.opacity = '0';
                setTimeout(() => {
                    victoryBox.style.display = 'none';
                    victoryBox.className = '';
                    victoryBox.style.opacity = '1';
                }, 300);
            }, 8000);
        }
        
        // Victory popup function
        function showVictoryScreen(type, target) {
            const overlay = document.getElementById('victoryOverlay');
            const scoreDisplay = document.getElementById('victoryScore');
            const discoveryDisplay = document.getElementById('victoryDiscoveries');
            const timeDisplay = document.getElementById('victoryTime');
            const loreDisplay = document.getElementById('victoryLore');
            
            // Calculate game time
            const gameTime = Math.floor((Date.now() - gameStartTime) / 1000);
            const minutes = Math.floor(gameTime / 60);
            const seconds = gameTime % 60;
            
            // Set stats
            scoreDisplay.textContent = playerSnake.score.toLocaleString();
            const discoveryCount = discoveredElements.size;
            discoveryDisplay.textContent = `${discoveryCount}`;
            timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Set lore message based on victory type
            const loreMessages = {
                discovery: [
                    `You have mastered the art of elemental fusion, discovering ${target} unique combinations. The universe bows to your alchemical prowess!`,
                    `Through countless experiments, you've unlocked ${target} elemental secrets. Your name shall be etched in the annals of discovery!`,
                    `The elements themselves whisper your name. ${target} discoveries mark you as a true Alchemist of the Infinite!`
                ],
                points: [
                    `With ${playerSnake.score.toLocaleString()} points, you've proven your mastery over the elemental realm. The serpent of infinity coils in reverence!`,
                    `Your score of ${playerSnake.score.toLocaleString()} echoes through the void. You are the undisputed champion of the elemental dance!`,
                    `${playerSnake.score.toLocaleString()} points! The very fabric of reality trembles at your achievement. You are legend incarnate!`
                ]
            };
            
            const messages = loreMessages[type] || [`Victory achieved with ${playerSnake.score.toLocaleString()} points!`];
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            loreDisplay.textContent = randomMessage;
            
            // Show overlay
            overlay.style.display = 'flex';
            gameRunning = false;
            
            // Play victory sound if available
            if (eatSounds.length > 0 && !musicMuted) {
                const sound = eatSounds[0];
                sound.currentTime = 0;
                sound.volume = 0.75;
                sound.play().catch(e => {});
            }
        }
        
        // Add discovery to the feed (MMO chat-style)
        function addDiscoveryToFeed(element, recipe) {
            const feed = document.getElementById('discoveryFeed');
            if (!feed) {
                gameLogger.error('UI', 'Discovery feed element not found!');
                return;
            }
            
            // Debug: Make sure feed is visible
            const feedContainer = document.querySelector('.discovery-feed');
            if (feedContainer) {
                feedContainer.style.display = 'flex';
                feedContainer.style.opacity = '1';
                feedContainer.style.visibility = 'visible';
            }
            
            const message = document.createElement('div');
            message.className = 'discovery-message new-message';
            
            // Recipe is passed as parameter now
            let recipeText = recipe || '';
            
            message.innerHTML = `
                <span class="emoji">${element.emoji}</span>
                <div class="discovery-text">
                    <div class="discovery-name">${element.name}</div>
                    ${recipeText ? `<div class="discovery-combo">${recipeText}</div>` : ''}
                </div>
            `;
            
            feed.appendChild(message);
            
            // Auto-scroll to bottom
            feed.scrollTop = feed.scrollHeight;
            
            // Add fade animation timeout
            setTimeout(() => {
                message.classList.remove('new-message');
                message.classList.add('faded-message');
            }, 3000);
            
            // Update message opacity based on position
            const updateMessageOpacity = () => {
                const messages = feed.querySelectorAll('.discovery-message');
                messages.forEach((msg, index) => {
                    const opacity = Math.max(0.4, 1 - (messages.length - index - 1) * 0.15);
                    msg.style.opacity = opacity;
                });
            };
            updateMessageOpacity();
            
            // Limit messages to prevent memory issues (reduce for mobile)
            const maxMessages = isTabletOrMobile() ? 10 : 20;
            while (feed.children.length > maxMessages) {
                feed.removeChild(feed.firstChild);
            }
            
        }
        
        // Throttled version for mobile performance
        let messageUpdateTimeout;
        function throttledAddDiscovery(element, recipe) {
            if (isTabletOrMobile()) {
                clearTimeout(messageUpdateTimeout);
                messageUpdateTimeout = setTimeout(() => {
                    addDiscoveryToFeed(element, recipe);
                }, 100);
            } else {
                addDiscoveryToFeed(element, recipe);
            }
        }
        
        function updateScoreboard() {
            const scoreboardList = document.getElementById('leaderboardList'); // Still using old ID for compatibility
            
            // Sort snakes based on game mode
            let sortedSnakes = [...snakes].filter(s => s.alive);
            
            if (gameMode === 'discovery') {
                // Sort by discoveries, then by score
                sortedSnakes.sort((a, b) => {
                    if (b.discoveries !== a.discoveries) {
                        return b.discoveries - a.discoveries;
                    }
                    return b.score - a.score;
                });
            } else {
                // Sort by score
                sortedSnakes.sort((a, b) => b.score - a.score);
            }
            
            // Mark the leader
            snakes.forEach(s => s.isLeader = false);
            if (sortedSnakes.length > 0) {
                sortedSnakes[0].isLeader = true;
            }
            
            // Display top 5 with MMO-style formatting
            scoreboardList.innerHTML = '';
            sortedSnakes.slice(0, 5).forEach((snake, index) => {
                const div = document.createElement('div');
                div.className = 'leaderboard-entry';
                
                if (index === 0) {
                    div.classList.add('leader');
                }
                if (snake.isPlayer) {
                    div.classList.add('player');
                }
                
                const nameSpan = document.createElement('span');
                nameSpan.className = 'leaderboard-name';
                
                // Handle snake names and emojis
                let displayText = index === 0 ? '👑 ' : '';
                let displayName = snake.name;
                
                // For AI snakes, remove personality prefix from name (but don't add emoji)
                if (!snake.isPlayer) {
                    if (displayName.startsWith('Aggressive ')) {
                        displayName = displayName.substring(11); // "Aggressive ".length = 11
                    } else if (displayName.startsWith('Combo Master ')) {
                        displayName = displayName.substring(13); // "Combo Master ".length = 13
                    } else if (displayName.startsWith('Balanced ')) {
                        displayName = displayName.substring(9); // "Balanced ".length = 9
                    }
                }
                
                nameSpan.textContent = displayText + displayName;
                
                const statsDiv = document.createElement('div');
                statsDiv.className = 'leaderboard-stats';
                const discoveriesText = isMobile ? 'disc.' : 'discoveries';
                statsDiv.innerHTML = `
                    <div>${Math.floor(snake.score).toLocaleString()} pts</div>
                `;
                
                div.appendChild(nameSpan);
                div.appendChild(statsDiv);
                scoreboardList.appendChild(div);
            });
        }
        
        function updateDiscoveryLog() {
            const list = document.getElementById('discoveryList');
            list.innerHTML = '';
            
            // Get all PLAYER discovered elements and sort by tier (highest first)
            const discovered = Array.from(playerDiscoveredElements)
                .map(key => {
                    // Try new system first
                    if (window.elementLoader && window.elementLoader.isLoaded && window.elementLoader.isLoaded()) {
                        const element = window.elementLoader.getElementByKey(key);
                        if (element) return { key, element };
                    }
                    // Fallback to old system
                    const element = elementDatabase[key];
                    if (element) return { key, element };
                    return null;
                })
                .filter(item => item !== null)
                .sort((a, b) => {
                    // Sort by tier descending, then alphabetically
                    if (b.element.tier !== a.element.tier) {
                        return b.element.tier - a.element.tier;
                    }
                    return a.element.name.localeCompare(b.element.name);
                });
            
            discovered.forEach(({ key, element }) => {
                const div = document.createElement('div');
                div.className = 'discovery-item';
                
                // Highlight if this is the newest discovery
                if (key === lastDiscoveredElement) {
                    div.classList.add('new');
                }
                
                div.innerHTML = `
                    <div class="emoji">${element.emoji}</div>
                    <div class="info">
                        <div class="name">${element.name}</div>
                        <div class="tier">Tier ${element.tier}</div>
                    </div>
                `;
                list.appendChild(div);
            });
            
            // Update count in header
            const header = document.querySelector('#discoveryLog h3');
            if (header) {
                header.textContent = `Discoveries (${discovered.length})`;
            }
        }
        
        // Update boost bar separately for real-time updates
        function updateBoostBar() {
            if (!playerSnake) return;
            
            // Update both boost bars (mobile bottom bar and desktop player stats bar)
            const boostFill = document.getElementById('boostBarFill');
            const playerBoostFill = document.getElementById('playerBoostBarFill');
            
            // Calculate stamina percentage
            const staminaPercent = Math.max(0, Math.min(100, (playerSnake.stamina / playerSnake.maxStamina) * 100));
            
            // Update mobile boost bar
            if (boostFill) {
                // Force immediate style update
                boostFill.style.width = staminaPercent + '%';
                
                // Force browser to recalculate styles
                boostFill.offsetWidth;
                
                // Change color based on stamina level
                if (staminaPercent <= 20) {
                    boostFill.className = 'boost-bar-fill low';
                } else if (playerSnake.isBoosting) {
                    boostFill.className = 'boost-bar-fill boosting';
                } else {
                    boostFill.className = 'boost-bar-fill';
                }
            }
            
            // Update desktop player stats boost bar
            if (playerBoostFill) {
                playerBoostFill.style.width = staminaPercent + '%';
                
                // Change color based on stamina level
                if (staminaPercent <= 20) {
                    playerBoostFill.className = 'player-boost-bar-fill low';
                } else if (playerSnake.isBoosting) {
                    playerBoostFill.className = 'player-boost-bar-fill boosting';
                } else {
                    playerBoostFill.className = 'player-boost-bar-fill';
                }
            }
            
            // Update mobile boost button fill
            if (window.unifiedMobileUI) {
                window.unifiedMobileUI.updateBoost(staminaPercent);
                window.unifiedMobileUI.activateBoost(playerSnake.isBoosting);
            }
            
            // Update boost button meter fill directly
            const boostButton = document.getElementById('boostButton');
            if (boostButton) {
                let boostMeterFill = boostButton.querySelector('.boost-meter-fill');
                if (!boostMeterFill) {
                    // Create fill element if it doesn't exist
                    boostMeterFill = document.createElement('div');
                    boostMeterFill.className = 'boost-meter-fill';
                    boostButton.appendChild(boostMeterFill);
                }
                
                // Update the height
                boostMeterFill.style.height = `${staminaPercent}%`;
                
                // Use consistent purple/pink cosmic theme regardless of stamina level
                boostMeterFill.style.background = 'linear-gradient(to top, rgba(248, 40, 248, 0.6), rgba(147, 51, 234, 0.3))';
            }
        }
        
        // Leaderboard Integration Variables
        // Make leaderboardModule globally accessible
        window.leaderboardModule = null;
        let leaderboardSubmitted = false;
        let lastSubmissionTime = 0; // Track when last submission started
        let currentGameSessionId = null;
        let gameSessionStartTime = null;
        
        // Helper function to check if we should submit
        function canSubmitScore() {
            const now = Date.now();
            // Prevent submissions within 3 seconds of each other (increased from 1 second)
            if (now - lastSubmissionTime < 3000) {
                gameLogger.debug('SUBMISSION', 'Blocked - too soon after last submission', now - lastSubmissionTime, 'ms');
                return false;
            }
            if (leaderboardSubmitted) {
                gameLogger.debug('SUBMISSION', 'Blocked - already submitted');
                return false;
            }
            // Mark as submitted and record time
            leaderboardSubmitted = true;
            lastSubmissionTime = now;
            gameLogger.debug('SUBMISSION', 'Allowed - marking as submitted at', now);
            return true;
        }
        
        // Test function to verify script is working
        window.testLeaderboard = function() {
            gameLogger.debug('LEADERBOARD', 'Debug info:', {
                moduleLoaded: !!leaderboardModule,
                submitScoreExists: !!(window.leaderboardModule && window.leaderboardModule.submitScore),
                leaderboardSubmitted,
                gameMode: typeof gameMode !== 'undefined' ? gameMode : 'undefined',
                playerSnake: playerSnake ? { alive: playerSnake.alive, score: playerSnake.score } : 'null',
                gameSessionStartTime
            });
        }
        
        // Test automatic submission manually
        window.testAutoSubmit = async function() {
            if (!window.leaderboardModule || !window.leaderboardModule.submitScore) {
                gameLogger.error('LEADERBOARD', 'Supabase module not loaded!');
                return;
            }
            
            const testData = {
                username: 'TestUser_' + Date.now(),
                score: 1234,
                elements: 10,
                playTime: 60,
                kills: 5
            };
            
            gameLogger.debug('LEADERBOARD', 'Submitting test data:', testData);
            
            try {
                const result = await window.leaderboardModule.submitScore(
                    testData.username,
                    testData.score,
                    testData.elements,
                    testData.playTime,
                    testData.kills
                );
                gameLogger.debug('LEADERBOARD', 'Test submission result:', result, 'Type:', typeof result, 'Keys:', result ? Object.keys(result) : 'null');
            } catch (error) {
                gameLogger.error('LEADERBOARD', 'Test submission failed:', error);
            }
        }
        
        // Initialize Leaderboard when the module loads
        async function initLeaderboard() {
            try {
                window.leaderboardModule = await import('../leaderboard.js');
                
                if (window.leaderboardModule && window.leaderboardModule.initializeLeaderboard) {
                    await window.leaderboardModule.initializeLeaderboard();
                    
                    // Update any waiting submission forms
                    const statusEl = document.getElementById('submissionStatus');
                    if (statusEl && statusEl.textContent.includes('not ready')) {
                        statusEl.innerHTML = '';
                    }
                } else {
                    gameLogger.error('LEADERBOARD', 'Module loaded but functions not found');
                }
            } catch (error) {
                gameLogger.error('LEADERBOARD', 'Failed to initialize:', error);
                gameLogger.error('LEADERBOARD', 'Error details:', error.message, error.stack);
                
                // Show error in submission status if visible
                const statusEl = document.getElementById('submissionStatus');
                if (statusEl) {
                    statusEl.innerHTML = '<span style="color: #ff4444;">Leaderboard service unavailable</span>';
                }
            }
        }
        
        // Initialize Supabase immediately on page load
        initLeaderboard();
        
        // Also try to init again after a delay in case it failed
        setTimeout(() => {
            if (!window.leaderboardModule) {
                initLeaderboard();
            } else {
                gameLogger.debug('LEADERBOARD', 'Module loaded successfully');
            }
        }, 2000);
        
        // Add another retry after 5 seconds if still not loaded
        setTimeout(() => {
            if (!window.leaderboardModule) {
                gameLogger.debug('LEADERBOARD', 'Retrying initialization...');
                initLeaderboard();
            }
        }, 5000);
        
        // Add event listeners when elements become visible
        function setupLeaderboardListeners() {
            
            // Only set up the username input Enter key listener
            // The buttons already have onclick attributes, so we don't need to add more listeners
            const usernameInput = document.getElementById('usernameInput');
            if (usernameInput && !usernameInput.hasListener) {
                usernameInput.hasListener = true;
                usernameInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        window.submitToLeaderboard();
                    }
                });
            }
            
        }
        
        // Try to set up listeners on page load and when respawn overlay is shown
        document.addEventListener('DOMContentLoaded', setupLeaderboardListeners);
        
        // Also expose it globally so we can call it when the overlay is shown
        window.setupLeaderboardListeners = setupLeaderboardListeners;
        
        // Initialize scoreboard collapsibility for desktop only
        function initScoreboardCollapse() {
            // Skip initialization on mobile - let MobileUIManager handle it
            if (document.body.classList.contains('mobile')) {
                gameLogger.debug('GAME', 'Skipping scoreboard collapse init on mobile');
                return;
            }
            
            const scoreboardBox = document.querySelector('.leaderboard-box'); // Still using .leaderboard-box class for compatibility
            if (!scoreboardBox) return;
            
            // Use existing header
            const header = scoreboardBox.querySelector('.leaderboard-header');
            if (!header) {
                gameLogger.warn('UI', 'Scoreboard header not found');
                return;
            }
            
            // Remove any existing click handlers to avoid duplicates
            const newHeader = header.cloneNode(true);
            header.parentNode.replaceChild(newHeader, header);
            
            // Add click handler
            newHeader.addEventListener('click', function(e) {
                e.stopPropagation();
                scoreboardBox.classList.toggle('collapsed');
                
                // Update icon
                const icon = newHeader.querySelector('.collapse-icon');
                if (icon) {
                    icon.textContent = scoreboardBox.classList.contains('collapsed') ? '▲' : '▼';
                }
                
                // Save collapsed state
                const isCollapsed = scoreboardBox.classList.contains('collapsed');
                localStorage.setItem('scoreboardCollapsed', isCollapsed);
            });
            
            // Make the header more clickable
            newHeader.style.cursor = 'pointer';
            newHeader.style.userSelect = 'none';
            
            // Restore saved state
            const savedState = localStorage.getItem('scoreboardCollapsed');
            if (savedState === 'true') {
                scoreboardBox.classList.add('collapsed');
                const icon = newHeader.querySelector('.collapse-icon');
                if (icon) icon.textContent = '▲';
            }
        }
        
        // Initialize on load
        document.addEventListener('DOMContentLoaded', initScoreboardCollapse);
        
        // Submit score to leaderboard
        window.submitToLeaderboard = async function() {
            playUISound();
            
            // Visual feedback
            const submitBtn = document.getElementById('submitScoreBtn');
            if (submitBtn) {
                submitBtn.style.opacity = '0.7';
            }
            
            // Check if Supabase module is loaded
            if (!leaderboardModule) {
                gameLogger.error('LEADERBOARD', 'Supabase module not loaded');
                document.getElementById('submissionStatus').innerHTML = 
                    '<span style="color: #ff4444;">Leaderboard service not ready. Please try again.</span>';
                if (submitBtn) {
                    submitBtn.style.opacity = '1';
                }
                return;
            }
            
            // Check if already submitted
            if (leaderboardSubmitted) {
                return;
            }
            
            const usernameInput = document.getElementById('usernameInput');
            const username = usernameInput.value.trim();
            
            if (!username) {
                document.getElementById('submissionStatus').innerHTML = 
                    '<span style="color: #ff4444;">Please enter a username</span>';
                return;
            }
            
            // Check minimum play time
            // Time validation removed - allow immediate submission
            const playTime = gameSessionStartTime ? 
                Math.floor((Date.now() - gameSessionStartTime) / 1000) : 0;
            
            // Store username for future use
            localStorage.setItem('lastUsername', username);
            
            // Reuse the submitBtn variable from earlier
            submitBtn.disabled = true;
            submitBtn.textContent = 'SUBMITTING...';
            
            document.getElementById('submissionStatus').innerHTML = 
                '<span style="color: #4ecdc4;">Submitting score...</span>';
            
            try {
                
                // Calculate play time in seconds
                const playTime = gameSessionStartTime ? 
                    Math.floor((Date.now() - gameSessionStartTime) / 1000) : 0;
                
                gameLogger.debug('LEADERBOARD', 'Score data:', {
                    username,
                    score: Math.floor(playerSnake.score),
                    elements: playerDiscoveredElements.size,
                    playTime,
                    kills: playerSnake.kills
                });
                
                
                let result;
                try {
                    result = await window.leaderboardModule.submitScore(
                        username,
                        Math.floor(playerSnake.score),
                        playerDiscoveredElements.size,
                        playTime,
                        playerSnake.kills
                    );
                    gameLogger.debug('LEADERBOARD', 'Submission result:', result);
                } catch (supabaseError) {
                    gameLogger.error('LEADERBOARD', 'Supabase error details:', supabaseError);
                    
                    // Extract error message from Supabase error
                    let errorMsg = 'Score validation failed';
                    if (supabaseError.message) {
                        errorMsg = supabaseError.message;
                    }
                    if (supabaseError.details) {
                        errorMsg = supabaseError.details;
                    }
                    
                    throw new Error(errorMsg);
                }
                
                // If we got here, submission was successful
                if (result !== null && result !== undefined) {
                    leaderboardSubmitted = true;
                    const rank = result.daily_rank || result.rank || result || 'Submitted';
                    const statusElement = document.getElementById('submissionStatus');
                    statusElement.innerHTML = 
                        `<div style="background: linear-gradient(135deg, rgba(78, 205, 196, 0.3) 0%, rgba(78, 205, 196, 0.1) 100%);
                                    border: 2px solid #4ecdc4;
                                    border-radius: 8px;
                                    padding: 15px;
                                    margin: 10px 0;
                                    text-align: center;
                                    animation: successPulse 0.5s ease-out;
                                    position: relative;
                                    z-index: 1000;">
                            <div style="font-size: 24px; margin-bottom: 5px;">✅</div>
                            <span style="color: #4ecdc4; font-size: 16px; font-weight: bold;">
                                Score Successfully Submitted!
                            </span>
                            <div style="color: #4ecdc4; font-size: 18px; margin-top: 8px;">
                                ${typeof rank === 'number' ? `🏆 Daily Rank: #${rank}` : ''}
                            </div>
                        </div>`;
                    
                    // Force immediate DOM update and ensure visibility
                    statusElement.style.display = 'block';
                    statusElement.style.visibility = 'visible';
                    statusElement.style.opacity = '1';
                    statusElement.style.position = 'relative';
                    statusElement.style.zIndex = '1000';
                    
                    // Force browser to recalculate styles
                    statusElement.offsetHeight;
                    
                    // Ensure parent container is visible
                    const submissionContainer = document.getElementById('leaderboardSubmission');
                    if (submissionContainer) {
                        submissionContainer.style.display = 'block';
                        submissionContainer.style.opacity = '1';
                        submissionContainer.style.visibility = 'visible';
                        submissionContainer.style.position = 'relative';
                        submissionContainer.style.zIndex = '1000';
                    }
                    
                    // Add success animation CSS if not already present
                    if (!document.getElementById('successAnimationStyle')) {
                        const style = document.createElement('style');
                        style.id = 'successAnimationStyle';
                        style.textContent = `
                            @keyframes successPulse {
                                0% { transform: scale(0.9); opacity: 0; }
                                50% { transform: scale(1.05); }
                                100% { transform: scale(1); opacity: 1; }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                    
                    // Disable submit button to prevent double submission
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'SUBMITTED ✓';
                    submitBtn.style.opacity = '0.6';
                    submitBtn.style.background = '#4ecdc4';
                    submitBtn.style.color = '#000';
                    
                    // Hide submission form and show respawn timer after longer delay
                    setTimeout(() => {
                        document.getElementById('leaderboardSubmission').style.display = 'none';
                        document.getElementById('respawnTimerDiv').style.display = 'block';
                        document.getElementById('quickRespawnDiv').style.display = 'block';
                    }, 3000);
                } else {
                    throw new Error('No response from server');
                }
            } catch (error) {
                gameLogger.error('LEADERBOARD', 'Submission error:', error);
                
                // Check if it's a Supabase error with details
                let errorMessage = 'Score validation failed';
                if (error.message) {
                    errorMessage = error.message;
                }
                if (error.details) {
                    gameLogger.error('LEADERBOARD', 'Error details:', error.details);
                }
                if (error.code) {
                    gameLogger.error('LEADERBOARD', 'Error code:', error.code);
                }
                
                document.getElementById('submissionStatus').innerHTML = 
                    `<span style="color: #ff4444;">Failed to submit: ${errorMessage}</span>`;
                submitBtn.disabled = false;
                submitBtn.textContent = 'SUBMIT SCORE';
                submitBtn.style.opacity = '1';
            }
        }
        
        // Skip leaderboard submission
        window.skipLeaderboard = function() {
            gameLogger.debug('DEPRECATED', 'skipLeaderboard called - this function should not be used anymore');
            // Removed - auto-submit only now
        }
        
        // Force immediate respawn
        window.forceRespawn = function() {
            playUISound();
            gameLogger.debug('RESPAWN', 'forceRespawn called');
            if (playerRespawnTimer > 0) {
                playerRespawnTimer = 100; // Set to almost 0 to trigger respawn
            }
            // Reset leaderboard submission flag for next game
            leaderboardSubmitted = false;
            lastSubmissionTime = 0;
        }
        
        // Handle permadeath in Classic mode
        function handlePermadeath() {
            
            // Save player stats before they get cleared by stopGame()
            const finalScore = playerSnake ? playerSnake.score : 0;
            const finalDiscoveries = playerDiscoveredElements ? playerDiscoveredElements.size : 0;
            const finalKills = playerSnake ? playerSnake.kills : 0;
            
            // Variables for leaderboard rank
            let dailyRank = null;
            let isSubmitting = true;
            
            // Submit score to leaderboard and get rank
            if (finalScore > 0 && canSubmitScore()) {
                // Submit score and wait for rank
                const playerName = localStorage.getItem('playerName') || 'Anonymous';
                const playTime = gameSessionStartTime ? Math.floor((Date.now() - gameSessionStartTime) / 1000) : 0;
                
                if (window.leaderboardModule && window.leaderboardModule.submitScore) {
                    window.leaderboardModule.submitScore(
                        playerName,
                        Math.floor(finalScore),
                        finalDiscoveries,
                        playTime,
                        finalKills
                    ).then(result => {
                        dailyRank = result;
                        isSubmitting = false;
                        updateGameOverScreen();
                    }).catch(() => {
                        isSubmitting = false;
                        updateGameOverScreen();
                    });
                } else {
                    isSubmitting = false;
                }
            } else {
                isSubmitting = false;
            }
            
            // Hide respawn overlay
            document.getElementById('respawnOverlay').style.display = 'none';
            
            // Update best stats if current game is better
            const bestScore = parseInt(localStorage.getItem('bestScore') || '0');
            const bestDiscoveries = parseInt(localStorage.getItem('bestDiscoveries') || '0');
            const bestKills = parseInt(localStorage.getItem('bestKills') || '0');
            
            if (finalScore > bestScore) {
                localStorage.setItem('bestScore', finalScore);
            }
            if (finalDiscoveries > bestDiscoveries) {
                localStorage.setItem('bestDiscoveries', finalDiscoveries);
            }
            if (finalKills > bestKills) {
                localStorage.setItem('bestKills', finalKills);
            }
            
            // Calculate time in minutes and seconds
            const totalSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Show game over screen with SNES style
            const gameOverScreen = document.createElement('div');
            gameOverScreen.id = 'permaDeathScreen';
            gameOverScreen.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                font-family: 'Press Start 2P', monospace;
                image-rendering: pixelated;
                image-rendering: -moz-crisp-edges;
                image-rendering: crisp-edges;
            `;
            
            // Add CRT scanlines to death screen
            const deathCRT = document.createElement('div');
            deathCRT.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(0, 0, 0, 0.1) 2px,
                    rgba(0, 0, 0, 0.1) 4px
                );
                pointer-events: none;
                z-index: 10001;
                mix-blend-mode: overlay;
                opacity: 0.3;
            `;
            gameOverScreen.appendChild(deathCRT);
            
            function updateGameOverScreen() {
                // Preserve CRT effect
                const existingCRT = gameOverScreen.querySelector('div[style*="repeating-linear-gradient"]');
                
                gameOverScreen.innerHTML = `
                    <div style="
                        background: linear-gradient(135deg, rgba(42, 0, 85, 0.95) 0%, rgba(72, 0, 168, 0.95) 50%, rgba(26, 0, 51, 0.95) 100%);
                        border: 4px solid;
                        border-color: var(--snes-cosmic-pink) var(--snes-dark-purple) var(--snes-dark-purple) var(--snes-cosmic-pink);
                        border-radius: 0;
                        padding: 32px 48px;
                        box-shadow: 
                            inset 2px 2px 0 var(--snes-cosmic-teal),
                            inset -2px -2px 0 var(--snes-dark-blue),
                            8px 8px 0 rgba(0, 0, 0, 0.8),
                            0 0 30px rgba(248, 40, 248, 0.4);
                        text-align: center;
                        position: relative;
                        min-width: 400px;
                    ">
                        <!-- Corner decorations -->
                        <div style="position: absolute; top: -2px; left: -2px; width: 20px; height: 20px; border-top: 4px solid #F828F8; border-left: 4px solid #F828F8;"></div>
                        <div style="position: absolute; top: -2px; right: -2px; width: 20px; height: 20px; border-top: 4px solid #F828F8; border-right: 4px solid #F828F8;"></div>
                        <div style="position: absolute; bottom: -2px; left: -2px; width: 20px; height: 20px; border-bottom: 4px solid #F828F8; border-left: 4px solid #F828F8;"></div>
                        <div style="position: absolute; bottom: -2px; right: -2px; width: 20px; height: 20px; border-bottom: 4px solid #F828F8; border-right: 4px solid #F828F8;"></div>
                        
                        <h1 style="
                            font-size: 36px; 
                            color: var(--snes-white); 
                            margin-bottom: 24px; 
                            text-shadow: 
                                2px 2px 0 var(--snes-cosmic-pink),
                                4px 4px 0 var(--snes-dark-purple),
                                6px 6px 0 #000,
                                0 0 30px rgba(248, 40, 248, 0.6),
                                0 0 60px rgba(248, 40, 248, 0.3);
                            letter-spacing: 4px;
                            font-family: 'Press Start 2P', monospace;
                        ">GAME OVER</h1>
                        
                        <div style="
                            background: linear-gradient(135deg, rgba(40, 120, 248, 0.3) 0%, rgba(72, 0, 168, 0.4) 100%);
                            border: 3px solid;
                            border-color: var(--snes-cosmic-teal) var(--snes-dark-purple) var(--snes-dark-purple) var(--snes-cosmic-teal);
                            padding: 16px;
                            margin-bottom: 20px;
                            box-shadow: 
                                inset 2px 2px 0 rgba(255, 255, 255, 0.2),
                                inset -2px -2px 0 rgba(0, 0, 0, 0.5),
                                0 0 20px rgba(120, 40, 248, 0.3);
                        ">
                            <div style="margin-bottom: 16px;">
                                <span style="color: var(--snes-cosmic-teal); font-size: 10px; text-transform: uppercase; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">Final Score</span>
                                <div style="font-size: 16px; color: var(--snes-gold); text-shadow: 2px 2px 0 #000; margin-top: 8px; font-family: 'Press Start 2P', monospace;">
                                    ${finalScore.toLocaleString()}
                                </div>
                            </div>
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 20px;">
                                <!-- Current Game Stats -->
                                <div style="text-align: center;">
                                    <div style="color: var(--snes-cosmic-teal); font-size: 10px; margin-bottom: 12px; text-transform: uppercase; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">THIS GAME</div>
                                    <div style="margin-bottom: 10px;">
                                        <span style="color: #BBB; font-size: 8px; text-transform: uppercase; font-family: 'Press Start 2P', monospace;">Score</span>
                                        <div style="font-size: 14px; color: var(--snes-gold); margin-top: 4px; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">
                                            ${finalScore.toLocaleString()}
                                        </div>
                                    </div>
                                    <div style="margin-bottom: 10px;">
                                        <span style="color: #BBB; font-size: 8px; text-transform: uppercase; font-family: 'Press Start 2P', monospace;">Discoveries</span>
                                        <div style="font-size: 12px; color: var(--snes-cosmic-teal); margin-top: 4px; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">
                                            ${finalDiscoveries}
                                        </div>
                                    </div>
                                    <div>
                                        <span style="color: #BBB; font-size: 8px; text-transform: uppercase; font-family: 'Press Start 2P', monospace;">Kills</span>
                                        <div style="font-size: 12px; color: #ff6b6b; margin-top: 4px; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">
                                            ${finalKills}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- All Time Best Stats -->
                                <div style="text-align: center;">
                                    <div style="color: var(--snes-cosmic-pink); font-size: 10px; margin-bottom: 12px; text-transform: uppercase; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">ALL TIME BEST</div>
                                    <div style="margin-bottom: 10px;">
                                        <span style="color: #BBB; font-size: 8px; text-transform: uppercase; font-family: 'Press Start 2P', monospace;">Score</span>
                                        <div style="font-size: 14px; color: var(--snes-gold); margin-top: 4px; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">
                                            ${parseInt(localStorage.getItem('bestScore') || '0').toLocaleString()}
                                        </div>
                                    </div>
                                    <div style="margin-bottom: 10px;">
                                        <span style="color: #BBB; font-size: 8px; text-transform: uppercase; font-family: 'Press Start 2P', monospace;">Discoveries</span>
                                        <div style="font-size: 12px; color: var(--snes-cosmic-teal); margin-top: 4px; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">
                                            ${parseInt(localStorage.getItem('bestDiscoveries') || '0')}
                                        </div>
                                    </div>
                                    <div>
                                        <span style="color: #BBB; font-size: 8px; text-transform: uppercase; font-family: 'Press Start 2P', monospace;">Kills</span>
                                        <div style="font-size: 12px; color: #ff6b6b; margin-top: 4px; font-family: 'Press Start 2P', monospace; text-shadow: 1px 1px 0 #000;">
                                            ${parseInt(localStorage.getItem('bestKills') || '0')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="
                            font-size: 10px; 
                            color: var(--snes-white); 
                            margin-bottom: 24px;
                            padding: 8px;
                            background: linear-gradient(135deg, rgba(0, 248, 248, 0.2) 0%, rgba(120, 40, 248, 0.3) 100%);
                            border: 3px solid;
                            border-color: var(--snes-cosmic-teal) var(--snes-dark-purple) var(--snes-dark-purple) var(--snes-cosmic-teal);
                            font-family: 'Press Start 2P', monospace;
                            box-shadow: 
                                inset 2px 2px 0 rgba(255, 255, 255, 0.2),
                                inset -2px -2px 0 rgba(0, 0, 0, 0.5),
                                0 0 15px rgba(0, 248, 248, 0.3);
                            text-shadow: 1px 1px 0 #000;
                        ">
                            ${isSubmitting ? 
                                'Submitting score...' : 
                                (dailyRank ? 
                                    `Daily Leaderboard Rank: #${dailyRank}` : 
                                    'Score submitted to leaderboard!'
                                )
                            }
                        </div>
                        
                        <button onclick="location.reload()" style="
                            padding: 12px 32px;
                            font-size: 10px;
                            background: var(--snes-cosmic-purple);
                            color: var(--snes-white);
                            border: 4px solid;
                            border-color: var(--snes-cosmic-pink) var(--snes-dark-purple) var(--snes-dark-purple) var(--snes-cosmic-pink);
                            box-shadow: 
                                inset 2px 2px 0 var(--snes-cosmic-teal),
                                inset -2px -2px 0 var(--snes-dark-blue),
                                4px 4px 0 rgba(0, 0, 0, 0.5);
                            cursor: pointer;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            font-family: 'Press Start 2P', monospace;
                            transition: none;
                            position: relative;
                            top: 0;
                        "
                        onmousedown="this.style.top='2px'; this.style.boxShadow='0 0 20px rgba(248, 40, 248, 0.6), inset 2px 2px 0 rgba(255, 255, 255, 0.3), inset -2px -2px 0 rgba(0, 0, 0, 0.3), 0 0 0 2px #000';"
                        onmouseup="this.style.top='0'; this.style.boxShadow='0 0 20px rgba(248, 40, 248, 0.6), inset 2px 2px 0 rgba(255, 255, 255, 0.3), inset -2px -2px 0 rgba(0, 0, 0, 0.3), 0 0 0 2px #000';"
                        onmouseleave="this.style.top='0'; this.style.boxShadow='0 0 20px rgba(248, 40, 248, 0.6), inset 2px 2px 0 rgba(255, 255, 255, 0.3), inset -2px -2px 0 rgba(0, 0, 0, 0.3), 0 0 0 2px #000';"
                        >
                            New Game
                        </button>
                    </div>
                `;
                
                // Re-add CRT effect after updating innerHTML
                if (existingCRT || !gameOverScreen.querySelector('div[style*="repeating-linear-gradient"]')) {
                    const crtDiv = document.createElement('div');
                    crtDiv.style.cssText = `
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0, 0, 0, 0.1) 2px,
                            rgba(0, 0, 0, 0.1) 4px
                        );
                        pointer-events: none;
                        z-index: 10001;
                        mix-blend-mode: overlay;
                        opacity: 0.3;
                    `;
                    gameOverScreen.appendChild(crtDiv);
                }
            }
            
            // Initial render
            updateGameOverScreen();
            document.body.appendChild(gameOverScreen);
            
            // Stop the game
            stopGame();
        }
        
        // Handle revive or respawn button click
        window.handleReviveOrRespawn = function() {
            playUISound();
            
            // Check game mode
            if (gameMode === 'classic') {
                // Classic mode: Check for permadeath (4th death)
                if (deathCount >= 4 && revivesRemaining === 0) {
                    handlePermadeath();
                    return;
                }
                
                if (revivesRemaining > 0) {
                    // Use a revive
                    revivesRemaining--;
                    
                    // Track revive usage
                    if (window.GameAnalyticsWrapper) {
                        window.GameAnalyticsWrapper.trackRevive(revivesRemaining);
                    }
                    
                    // Update button text
                    const reviveBtn = document.getElementById('reviveBtn');
                    if (reviveBtn) {
                        if (revivesRemaining > 0) {
                            reviveBtn.innerHTML = `REVIVE (<span id="revivesLeft">${revivesRemaining}</span>)`;
                        } else {
                            // Last life
                            reviveBtn.innerHTML = 'FINAL LIFE';
                            reviveBtn.style.background = '#e74c3c';
                            reviveBtn.style.borderColor = '#c0392b';
                            reviveBtn.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.5)';
                        }
                    }
                    
                    // Set flag for revive (no penalty)
                    window.isReviving = true;
                } else {
                    // Should not reach here in classic mode
                    handlePermadeath();
                    return;
                }
            } else {
                // Infinite mode: Always allow respawn without penalty
                window.isReviving = true;
            }
            
            // Hide overlay and trigger respawn
            document.getElementById('respawnOverlay').style.display = 'none';
            
            // Reset death message flag for next death
            window.deathMessageSet = false;
            
            // Force end death sequence if still active
            if (deathSequenceActive) {
                deathSequenceActive = false;
                deathCameraAnimation.active = false;
                cameraZoom = isMobile ? 0.75 : 1.0;
            }
            
            // Reset death processed flag
            deathProcessed = false;
            isRespawning = true; // Set respawning flag
            waitingForRespawnInput = false; // Clear waiting flag
            window.waitingForRespawnInput = false;
            
            gameLogger.debug('RESPAWN', 'Setting timer to -1, isRespawning=true');
            playerRespawnTimer = -1; // Trigger immediate respawn
            
            // Reset leaderboard submission flag for next game
            leaderboardSubmitted = false;
            lastSubmissionTime = 0;
        }
        
        // Return to main menu
        window.returnToMainMenu = function() {
            playUISound();
            
            // Reset game state
            location.reload(); // Simple reload to return to main menu
        }
        
        // Country code to flag emoji mapping
        const countryFlags = {
            'US': '🇺🇸', 'CA': '🇨🇦', 'GB': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷',
            'JP': '🇯🇵', 'AU': '🇦🇺', 'BR': '🇧🇷', 'IN': '🇮🇳', 'CN': '🇨🇳',
            'RU': '🇷🇺', 'MX': '🇲🇽', 'IT': '🇮🇹', 'ES': '🇪🇸', 'KR': '🇰🇷',
            'NL': '🇳🇱', 'SE': '🇸🇪', 'NO': '🇳🇴', 'DK': '🇩🇰', 'FI': '🇫🇮',
            'PL': '🇵🇱', 'BE': '🇧🇪', 'AT': '🇦🇹', 'CH': '🇨🇭', 'IE': '🇮🇪',
            'PT': '🇵🇹', 'GR': '🇬🇷', 'CZ': '🇨🇿', 'HU': '🇭🇺', 'RO': '🇷🇴',
            'BG': '🇧🇬', 'HR': '🇭🇷', 'SK': '🇸🇰', 'SI': '🇸🇮', 'LT': '🇱🇹',
            'LV': '🇱🇻', 'EE': '🇪🇪', 'IS': '🇮🇸', 'TR': '🇹🇷', 'IL': '🇮🇱',
            'SA': '🇸🇦', 'AE': '🇦🇪', 'EG': '🇪🇬', 'ZA': '🇿🇦', 'NG': '🇳🇬',
            'KE': '🇰🇪', 'MA': '🇲🇦', 'TN': '🇹🇳', 'DZ': '🇩🇿', 'GH': '🇬🇭',
            'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪', 'VE': '🇻🇪',
            'UY': '🇺🇾', 'PY': '🇵🇾', 'BO': '🇧🇴', 'EC': '🇪🇨', 'CR': '🇨🇷',
            'PA': '🇵🇦', 'GT': '🇬🇹', 'HN': '🇭🇳', 'SV': '🇸🇻', 'NI': '🇳🇮',
            'XX': '🌍', 'TH': '🇹🇭', 'VN': '🇻🇳', 'MY': '🇲🇾', 'SG': '🇸🇬', 
            'ID': '🇮🇩', 'PH': '🇵🇭', 'NZ': '🇳🇿', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
        };
        
        function getCountryDisplay(countryCode) {
            const flag = countryFlags[countryCode] || '🌍';
            return `<span style="font-size: 18px; display: inline-block;">${flag}</span> <span style="font-size: 11px; color: #888;">${countryCode || 'XX'}</span>`;
        }
        
        // Leaderboard UI Functions
        let currentLeaderboardPeriod = 'daily';
        let leaderboardData = [];
        
        window.showLeaderboard = async function() {
            document.getElementById('leaderboardModal').style.display = 'block';
            await loadLeaderboard(currentLeaderboardPeriod);
        }
        
        window.closeLeaderboard = function() {
            document.getElementById('leaderboardModal').style.display = 'none';
        }
        
        window.switchLeaderboardPeriod = async function(period) {
            currentLeaderboardPeriod = period;
            
            // Update tab styles
            document.querySelectorAll('.leaderboard-tab').forEach(tab => {
                tab.classList.remove('active');
                tab.style.color = '#888';
            });
            event.target.classList.add('active');
            event.target.style.color = '#4ecdc4';
            
            await loadLeaderboard(period);
        }
        
        // Load mini leaderboard for pause menu
        let currentPauseLBPeriod = 'daily';
        
        window.loadPauseLeaderboard = async function(event, period, retryCount = 0) {
            currentPauseLBPeriod = period;
            
            // Update mini tab styles
            document.querySelectorAll('.mini-lb-tab').forEach(tab => {
                tab.classList.remove('active');
                tab.style.color = '#888';
            });
            if (event && event.target) {
                event.target.classList.add('active');
                event.target.style.color = '#4ecdc4';
            }
            
            const entriesDiv = document.getElementById('pauseLeaderboardEntries');
            
            // Check if leaderboard module is loaded
            if (!window.leaderboardModule) {
                // Show loading message while we wait for the module
                entriesDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Initializing leaderboard...</div>';
                
                // Try to initialize if not already done
                if (retryCount === 0) {
                    initLeaderboard();
                }
                
                // Retry with exponential backoff (max 3 retries)
                if (retryCount < 3) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
                    setTimeout(() => {
                        window.loadPauseLeaderboard(event, period, retryCount + 1);
                    }, delay);
                } else {
                    entriesDiv.innerHTML = '<div style="color: #ff4444; text-align: center; padding: 20px;">Leaderboard service unavailable</div>';
                }
                return;
            }
            
            entriesDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">Loading...</div>';
            
            try {
                const data = await window.leaderboardModule.getLeaderboard(period, 10); // Top 10 only
                
                if (!data || data.length === 0) {
                    entriesDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No scores yet. Be the first!</div>';
                    return;
                }
                
                const currentUsername = localStorage.getItem('lastUsername');
                
                entriesDiv.innerHTML = data.map(entry => {
                    const isPlayer = currentUsername && entry.username === currentUsername;
                    const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
                    
                    // Replace personality prefixes with emojis
                    let displayName = entry.username;
                    if (displayName.startsWith('Aggressive ')) {
                        displayName = '😡 ' + displayName.substring(11);
                    } else if (displayName.startsWith('Combo Master ')) {
                        displayName = '😎 ' + displayName.substring(13);
                    } else if (displayName.startsWith('Balanced ')) {
                        displayName = '😊 ' + displayName.substring(9);
                    }
                    
                    return `
                        <div style="display: flex; justify-content: space-between; padding: 10px; 
                                    background: ${isPlayer ? 'rgba(78, 205, 196, 0.2)' : 'rgba(0, 0, 0, 0.2)'}; 
                                    margin-bottom: 5px; border: 2px solid ${isPlayer ? '#4ecdc4' : 'transparent'}; font-size: 14px;">
                            <span class="${rankClass}" style="font-weight: bold; font-size: 14px;">#${entry.rank}</span>
                            <span style="color: ${isPlayer ? '#4ecdc4' : '#FFF'}; flex: 1; margin: 0 10px; overflow: hidden; text-overflow: ellipsis; font-size: 14px;">${displayName}</span>
                            <span style="color: #4ecdc4; font-size: 14px;">${entry.score.toLocaleString()}</span>
                        </div>
                    `;
                }).join('');
                
            } catch (error) {
                gameLogger.error('LEADERBOARD', 'Failed to load pause leaderboard:', error);
                entriesDiv.innerHTML = '<div style="color: #ff4444; text-align: center; padding: 20px;">Failed to load</div>';
            }
        }
        
        async function loadLeaderboard(period) {
            if (!window.leaderboardModule) {
                gameLogger.error('LEADERBOARD', 'Module not loaded in loadLeaderboard');
                return;
            }
            
            const entriesDiv = document.getElementById('leaderboardEntries');
            entriesDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 40px; font-family: monospace;">Loading leaderboard...</div>';
            
            try {
                leaderboardData = await window.leaderboardModule.getLeaderboard(period, 100);
                
                if (!leaderboardData || leaderboardData.length === 0) {
                    entriesDiv.innerHTML = '<div style="color: #888; text-align: center; padding: 40px; font-family: monospace;">No scores yet. Be the first!</div>';
                    return;
                }
                
                // Get current player's username to highlight their entries
                const currentUsername = localStorage.getItem('lastUsername');
                
                entriesDiv.innerHTML = leaderboardData.map(entry => {
                    const isPlayer = currentUsername && entry.username === currentUsername;
                    const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
                    
                    // Format time from seconds to MM:SS
                    const minutes = Math.floor(entry.play_time / 60);
                    const seconds = entry.play_time % 60;
                    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    
                    // Get country display
                    const countryDisplay = getCountryDisplay(entry.country_code || 'XX');
                    
                    // Replace personality prefixes with emojis
                    let displayName = entry.username;
                    if (displayName.startsWith('Aggressive ')) {
                        displayName = '😡 ' + displayName.substring(11);
                    } else if (displayName.startsWith('Combo Master ')) {
                        displayName = '😎 ' + displayName.substring(13);
                    } else if (displayName.startsWith('Balanced ')) {
                        displayName = '😊 ' + displayName.substring(9);
                    }
                    
                    return `
                        <div class="leaderboard-entry ${isPlayer ? 'player-entry' : ''}">
                            <div class="${rankClass}" style="font-weight: bold;">#${entry.rank}</div>
                            <div>${countryDisplay}</div>
                            <div style="color: ${isPlayer ? '#4ecdc4' : '#FFF'}; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${displayName}</div>
                            <div style="color: #4ecdc4; text-align: right;">${entry.score.toLocaleString()}</div>
                        </div>
                    `;
                }).join('');
            } catch (error) {
                gameLogger.error('LEADERBOARD', 'Failed to load leaderboard:', error);
                entriesDiv.innerHTML = '<div style="color: #ff4444; text-align: center; padding: 40px; font-family: monospace;">Failed to load leaderboard. Please try again.</div>';
            }
        }
        
        function updateUI() {
            if (!playerSnake) return;
            
            // Debug death screen conditions
            if (!playerSnake.alive) {
                gameLogger.debug('DEATH UI', 'Player dead, waitingForRespawnInput:', waitingForRespawnInput, 
                    'deathSequenceActive:', deathSequenceActive, 'deathProcessed:', deathProcessed);
            }
            
            // Handle dead player - show death screen when waiting for input
            if (!playerSnake.alive && waitingForRespawnInput) {
                const respawnSeconds = 0; // No countdown since we wait for player input
                
                // Check if this is the final death in classic mode (4th death)
                if (gameMode === 'classic' && deathCount >= 4 && revivesRemaining === 0) {
                    // Don't show death screen, go directly to game over
                    playerRespawnTimer = 0; // Clear respawn timer
                    handlePermadeath();
                    return;
                }
                
                // Show respawn overlay
                const respawnOverlay = document.getElementById('respawnOverlay');
                if (respawnOverlay) {
                    gameLogger.debug('DEATH SCREEN', 'Showing respawn overlay');
                    respawnOverlay.style.display = 'block';
                    
                    // Update death message with random message only if not already set for this death
                    if (window.nameGenerator && !window.deathMessageSet) {
                        document.getElementById('deathMessage').textContent = window.nameGenerator.getRandomDeathMessage();
                        window.deathMessageSet = true;
                    }
                    
                    // Update respawn stats
                    document.getElementById('respawnScore').textContent = Math.floor(playerSnake.score).toLocaleString();
                    // Use player discovery count
                    document.getElementById('respawnDiscoveries').textContent = playerDiscoveredElements.size;
                    document.getElementById('respawnKills').textContent = playerSnake.kills;
                    
                    // Load and display all-time best stats
                    const bestScore = parseInt(localStorage.getItem('bestScore') || '0');
                    const bestDiscoveries = parseInt(localStorage.getItem('bestDiscoveries') || '0');
                    const bestKills = parseInt(localStorage.getItem('bestKills') || '0');
                    
                    document.getElementById('bestScore').textContent = bestScore.toLocaleString();
                    document.getElementById('bestDiscoveries').textContent = bestDiscoveries;
                    document.getElementById('bestKills').textContent = bestKills;
                    
                    // Update best stats if current game is better
                    if (Math.floor(playerSnake.score) > bestScore) {
                        localStorage.setItem('bestScore', Math.floor(playerSnake.score));
                    }
                    if (playerDiscoveredElements.size > bestDiscoveries) {
                        localStorage.setItem('bestDiscoveries', playerDiscoveredElements.size);
                    }
                    if (playerSnake.kills > bestKills) {
                        localStorage.setItem('bestKills', playerSnake.kills);
                    }
                    
                    // Update revive button state
                    const reviveBtn = document.getElementById('reviveBtn');
                    const respawnPenaltyText = document.getElementById('respawnPenaltyText');
                    const globalRankContainer = document.getElementById('globalRankContainer');
                    
                    // Hide global rank by default - only show on permadeath
                    if (globalRankContainer) {
                        globalRankContainer.style.display = 'none';
                    }
                    
                    if (reviveBtn) {
                        if (gameMode === 'classic') {
                            // Classic mode: Show revive count or final life
                            if (revivesRemaining > 0) {
                                reviveBtn.innerHTML = `REVIVE (<span id="revivesLeft">${revivesRemaining}</span>)`;
                                reviveBtn.style.background = 'var(--snes-cosmic-purple)';
                                reviveBtn.style.color = 'var(--snes-white)';
                                reviveBtn.style.border = '4px solid var(--snes-white)';
                                reviveBtn.style.boxShadow = 'inset 2px 2px 0 var(--snes-cosmic-pink), inset -2px -2px 0 var(--snes-dark-purple), 4px 4px 0 rgba(0,0,0,0.5)';
                                const actionText = document.getElementById('actionText');
                                if (actionText) actionText.textContent = 'revive';
                                if (respawnPenaltyText) respawnPenaltyText.style.display = 'none';
                            } else {
                                // Final life
                                reviveBtn.innerHTML = 'FINAL LIFE';
                                reviveBtn.style.background = '#e74c3c';
                                reviveBtn.style.borderColor = '#c0392b';
                                reviveBtn.style.boxShadow = '0 0 20px rgba(231, 76, 60, 0.5)';
                                reviveBtn.style.color = 'var(--snes-white)';
                                const actionText = document.getElementById('actionText');
                                if (actionText) actionText.textContent = 'continue on final life';
                                if (respawnPenaltyText) respawnPenaltyText.style.display = 'none';
                            }
                        } else {
                            // Infinite mode: Always show respawn (no penalty)
                            reviveBtn.innerHTML = 'RESPAWN';
                            reviveBtn.style.background = 'var(--snes-cosmic-purple)';
                            reviveBtn.style.color = 'var(--snes-white)';
                            reviveBtn.style.border = '4px solid var(--snes-white)';
                            reviveBtn.style.boxShadow = 'inset 2px 2px 0 var(--snes-cosmic-pink), inset -2px -2px 0 var(--snes-dark-purple), 4px 4px 0 rgba(0,0,0,0.5)';
                            const actionText = document.getElementById('actionText');
                            if (actionText) actionText.textContent = 'respawn';
                            if (respawnPenaltyText) respawnPenaltyText.style.display = 'none'; // No penalty in infinite mode
                        }
                        reviveBtn.style.fontFamily = "'Press Start 2P'";
                        reviveBtn.style.textTransform = 'uppercase';
                    }
                    
                    // Automatic leaderboard submission for infinite mode
                    // Only check once per death (not every frame!)
                    if (!window.deathLeaderboardChecked) {
                        window.deathLeaderboardChecked = true;
                    
                    if (gameMode === 'infinite' && playerSnake.score > 0) {
                        const playTime = gameSessionStartTime ? 
                            Math.floor((Date.now() - gameSessionStartTime) / 1000) : 0;
                        
                        
                        // Only submit if played for at least 5 seconds (reduced from 10)
                        if (playTime >= 5 && canSubmitScore()) {
                            // Get player name
                            const playerName = localStorage.getItem('playerName') || window.nameGenerator.generateRandomName();
                            
                            
                            // Submit score automatically
                            if (window.leaderboardModule && window.leaderboardModule.submitScore) {
                                
                                // Call the working submitScore function with ALL required parameters
                                window.leaderboardModule.submitScore(
                                    playerName,
                                    Math.floor(playerSnake.score),
                                    playerDiscoveredElements.size,
                                    playTime,  // Add playTime parameter that was missing!
                                    playerSnake.kills
                                ).then(result => {
                                    
                                    // submitScore returns the rank as a number or 'Submitted' if rank is null
                                    if (result !== null && result !== undefined) {
                                        if (typeof result === 'number') {
                                            const globalRankEl = document.getElementById('globalRank');
                                            if (globalRankEl) {
                                                globalRankEl.textContent = `#${result}`;
                                            }
                                        } else if (result === 'Submitted') {
                                            const globalRankEl = document.getElementById('globalRank');
                                            if (globalRankEl) {
                                                globalRankEl.textContent = 'Submitted';
                                            }
                                        }
                                        
                                        // Already marked as submitted above
                                    } else {
                                        gameLogger.error('LEADERBOARD', '❌ Submission failed or returned invalid data:', result);
                                        // Reset flag so it can retry
                                        leaderboardSubmitted = false;
                                    }
                                }).catch(error => {
                                    gameLogger.error('LEADERBOARD', '❌ Failed to submit score:', error);
                                    gameLogger.error('LEADERBOARD', 'Error details:', {
                                        message: error.message,
                                        stack: error.stack,
                                        type: error.constructor.name
                                    });
                                    // Reset flag on failure so it can retry
                                    leaderboardSubmitted = false;
                                });
                            } else {
                                gameLogger.error('LEADERBOARD', 'Supabase module not available!', {
                                    module: window.leaderboardModule,
                                    submitScore: window.leaderboardModule?.submitScore
                                });
                                
                                // Try to initialize it now if not loaded
                                if (!window.leaderboardModule) {
                                    initLeaderboard().then(() => {
                                        if (window.leaderboardModule && window.leaderboardModule.submitScore) {
                                            // Retry the submission
                                            window.leaderboardModule.submitScore(
                                                playerName,
                                                Math.floor(playerSnake.score),
                                                playerDiscoveredElements.size,
                                                playTime,
                                                playerSnake.kills
                                            ).then(result => {
                                                if (result && typeof result === 'number') {
                                                    const globalRankEl = document.getElementById('globalRank');
                                                    if (globalRankEl) {
                                                        globalRankEl.textContent = `#${result}`;
                                                    }
                                                    leaderboardSubmitted = true;
                                                }
                                            }).catch(err => {
                                                gameLogger.error('LEADERBOARD', 'Retry failed:', err);
                                            });
                                        }
                                    });
                                }
                            }
                        }
                    }
                    } // Close the deathLeaderboardChecked if statement
                }
                
                return; // Don't update other UI elements while dead
            } else {
                // Reset death leaderboard check flag when alive
                window.deathLeaderboardChecked = false;
                // Reset death message flag when alive
                window.deathMessageSet = false;
                
                // Hide respawn overlay when alive
                const respawnOverlay = document.getElementById('respawnOverlay');
                if (respawnOverlay) {
                    respawnOverlay.style.display = 'none';
                }
                // Also hide quick respawn div
                const quickRespawnDiv = document.getElementById('quickRespawnDiv');
                if (quickRespawnDiv) {
                    quickRespawnDiv.style.display = 'none';
                }
            }
            
            // Update player info box
            document.getElementById('playerScore').textContent = Math.floor(playerSnake.score).toLocaleString();
            
            // Update discoveries count - use player discoveries only
            const discoveryCount = playerDiscoveredElements.size;
            const discoveriesElement = document.getElementById('playerDiscoveries');
            if (discoveriesElement) {
                discoveriesElement.textContent = discoveryCount.toString();
            }
            
            // Update high score display if current score is higher
            if (playerSnake.score > highScore) {
                highScore = playerSnake.score;
                localStorage.setItem('highScore', Math.floor(highScore).toString());
            }
            
            // Dispatch periodic score update event (every 5 seconds)
            if (!window.lastScoreUpdateTime) window.lastScoreUpdateTime = 0;
            if (Date.now() - window.lastScoreUpdateTime > 5000) {
                window.lastScoreUpdateTime = Date.now();
                dispatchGameEvent('scoreUpdate', {
                    score: Math.floor(playerSnake.score),
                    highScore: Math.floor(highScore),
                    discoveries: discoveryCount,
                    kills: playerSnake.kills
                });
            }
            
            // Update game time
            const gameTime = Date.now() - gameStartTime;
            const minutes = Math.floor(gameTime / 60000);
            const seconds = Math.floor((gameTime % 60000) / 1000);
            document.getElementById('playerTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Update best rank (only after 60 seconds to make it meaningful)
            const bestRankElement = document.getElementById('playerBestRank');
            if (gameTime >= 60000) { // 60 seconds
                const playerRank = snakes.filter(s => s.alive).findIndex(s => s === playerSnake) + 1;
                if (playerRank > 0 && (bestRank === 0 || playerRank < bestRank)) {
                    bestRank = playerRank;
                    bestRankElement.textContent = `#${bestRank}`;
                }
                
                // Dispatch first place achievement if applicable (only once per game)
                if (playerRank === 1 && snakes.filter(s => s.alive).length > 1) {
                    if (!window.firstPlaceAchievedThisGame) {
                        window.firstPlaceAchievedThisGame = true;
                        dispatchGameEvent('firstPlace', {
                            alivePlayers: snakes.filter(s => s.alive).length,
                            score: playerSnake.score
                        });
                    }
                }
            } else {
                // Show placeholder before 60 seconds
                bestRankElement.textContent = '-';
            }
            
            // Update kills
            document.getElementById('playerKills').textContent = playerSnake.kills;
            
            // Update AlchemyVision timer
            const timerElement = document.getElementById('alchemyVisionTimer');
            if (alchemyVisionActive && alchemyVisionTimer > 0) {
                timerElement.style.display = 'block';
                const seconds = Math.ceil(alchemyVisionTimer / 1000);
                document.getElementById('alchemyTime').textContent = seconds;
            } else {
                timerElement.style.display = 'none';
            }
            
            // Update boost bar
            updateBoostBar();
            
            // Check victory condition (only once)
            if (!gameWon) {
                if (gameMode === 'discovery' && discoveryCount >= gameTarget) {
                    gameWon = true;
                    showVictoryScreen('discovery', gameTarget);
                } else if (gameMode === 'points' && playerSnake.score >= gameTarget) {
                    gameWon = true;
                    showVictoryScreen('points', gameTarget);
                }
            }
            
            // Update scoreboard
            updateScoreboard();
            
            // Update element collection bar (MMO skill bar style)
            const elementBar = document.getElementById('elementBar');
            elementBar.innerHTML = '';
            
            // Apply two-rows class when 9 or more slots
            if (elementBankSlots >= 9) {
                elementBar.classList.add('two-rows');
                // Add data attribute for exact slot count to enable specific CSS rules
                elementBar.setAttribute('data-slots', elementBankSlots);
            } else {
                elementBar.classList.remove('two-rows');
                elementBar.removeAttribute('data-slots');
            }
            
            // Check if we're animating a combination
            const isCombining = playerSnake.isAnimatingCombination && playerSnake.combiningIndices;
            
            // Create slots based on the current elementBankSlots (starts at 6, can expand to 12)
            // Safety check: ensure we never try to render more than max elements
            const elementsToRender = Math.min(playerSnake.elements.length, elementBankSlots);
            
            // Debug logging for element bank issues
            if (playerSnake.elements.length < elementBankSlots && window.debugElementBank) {
            }
            
            for (let i = 0; i < elementBankSlots; i++) {
                const div = document.createElement('div');
                div.className = 'element-slot';
                
                if (i < elementsToRender) {
                    // Filled slot with element
                    const elementId = playerSnake.elements[i];
                    const element = window.elementLoader.elements.get(elementId);
                    if (element && elementId !== undefined && elementId !== null && elementId !== '') {
                        div.classList.add('filled');
                        div.dataset.elementId = elementId; // Store element ID for boss damage checking
                        
                        // Highlight the active element
                        if (i === playerSnake.highlightedIndex) {
                            div.classList.add('highlighted-element');
                        }
                        
                        // Add glow/wobble effect for pending combinations (eaten element)
                        if (playerSnake.pendingCombinationIndex === i && 
                            Date.now() - playerSnake.pendingCombinationTime < 300) {
                            div.classList.add('glow-wobble');
                        }
                        
                        // Add glow/wobble effect for bank-to-bank combinations
                        if (playerSnake.glowWobbleIndices && playerSnake.glowWobbleIndices.includes(i) &&
                            Date.now() - playerSnake.glowWobbleTime < 600) {
                            div.classList.add('glow-wobble');
                        }
                        
                        // Add combination animation classes
                        if (isCombining) {
                            if (playerSnake.combiningIndices.includes(i)) {
                                div.classList.add('combining');
                                
                                // Add particle effects
                                const particleContainer = document.createElement('div');
                                particleContainer.className = 'combination-particles';
                                
                                // Create multiple particles
                                for (let p = 0; p < 8; p++) {
                                    const particle = document.createElement('div');
                                    particle.className = 'combination-particle';
                                    const angle = (p / 8) * Math.PI * 2;
                                    const distance = 30;
                                    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
                                    particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
                                    particle.style.animationDelay = `${p * 0.05}s`;
                                    particleContainer.appendChild(particle);
                                }
                                
                                div.appendChild(particleContainer);
                            }
                        }
                        
                        // Check if this is a newly created element
                        if (combinationAnimationState.isAnimating && i === combinationAnimationState.newElementIndex) {
                            div.classList.add('new-element');
                        }
                        
                        const emoji = window.elementLoader.getEmojiForElement(elementId, element.e);
                        div.innerHTML += `<div class="emoji">${emoji}</div><div class="element-name">${element.n}</div>`;
                        div.title = element.n;
                    } else {
                        // Invalid element ID - treat as empty slot
                        div.classList.add('empty');
                        delete div.dataset.elementId;
                        
                        // Log the issue for debugging
                        if (window.debugElementBank && elementId !== undefined && elementId !== null) {
                            gameLogger.warn('ELEMENT BANK', `Invalid element ID in bank: ${elementId}`);
                        }
                    }
                } else {
                    // Empty slot
                    div.classList.add('empty');
                    // Clear any stale element ID to prevent phantom elements
                    delete div.dataset.elementId;
                }
                
                elementBar.appendChild(div);
            }
            
            // Reset animation state after animation completes
            if (combinationAnimationState.isAnimating && Date.now() - combinationAnimationState.animationStartTime > 600) {
                combinationAnimationState.isAnimating = false;
                combinationAnimationState.combiningIndices = [];
                combinationAnimationState.newElementIndex = -1;
                playerSnake.isAnimatingCombination = false;
                playerSnake.combiningIndices = null;
                playerSnake.glowWobbleIndices = null;
                playerSnake.pendingCombinationIndex = -1;
            }
        }
        
        function checkCollisions() {
            // Track snakes that have already died this frame to prevent multiple collisions
            const diedThisFrame = new Set();
            
            // Performance optimization: Use for loop instead of for-of
            for (let snakeIdx = 0; snakeIdx < snakes.length; snakeIdx++) {
                const snake = snakes[snakeIdx];
                if (!snake || !snake.alive || diedThisFrame.has(snake)) continue;
                
                // Check element collisions
                const activeElements = elementPool.getActiveElements();
                const activeElementsLength = activeElements.length;
                
                // Performance optimization: Cache frequently used values
                const snakeX = snake.x;
                const snakeY = snake.y;
                const collisionDistSq = (SEGMENT_SIZE + ELEMENT_SIZE) * (SEGMENT_SIZE + ELEMENT_SIZE);
                
                for (let elemIdx = 0; elemIdx < activeElementsLength; elemIdx++) {
                    const element = activeElements[elemIdx];
                    if (!element) continue; // Skip if element is undefined
                    
                    // Performance optimization: Use squared distance for initial check
                    const dx = element.x - snakeX;
                    const dy = element.y - snakeY;
                    const distSq = dx * dx + dy * dy;
                    
                    // For player snake, check if element will combine when eaten
                    if (snake.isPlayer) {
                        if (distSq < 22500 && snake.elements.length > 0) { // 150 * 150
                            // Check if this element can combine with any in the bank
                            element.pendingCombination = false;
                            const snakeElementsLength = snake.elements.length;
                            for (let i = 0; i < snakeElementsLength; i++) {
                                const bankElementId = snake.elements[i];
                                const comboKey = `${Math.min(element.id, bankElementId)}+${Math.max(element.id, bankElementId)}`;
                                if (window.elementLoader && window.elementLoader.combinations[comboKey]) {
                                    element.pendingCombination = true;
                                    element.combiningAnimation = 0.5; // Start animation immediately
                                    break;
                                }
                            }
                        } else if (distSq > 40000) { // 200 * 200
                            // Reset state for distant elements
                            element.pendingCombination = false;
                            element.combiningAnimation = 0;
                        }
                    }
                    
                    if (distSq < collisionDistSq) {
                        snake.consume(element);
                    }
                }
                
                // Check AlchemyVision power-up collision (player only)
                if (snake.isPlayer) {
                    for (let i = alchemyVisionPowerUps.length - 1; i >= 0; i--) {
                        const powerUp = alchemyVisionPowerUps[i];
                        // Performance optimization: Use squared distance
                        const dx = powerUp.x - snakeX;
                        const dy = powerUp.y - snakeY;
                        const collisionDist = SEGMENT_SIZE + powerUp.size;
                        if (dx * dx + dy * dy < collisionDist * collisionDist) {
                            // Activate Alchemy Vision
                            alchemyVisionActive = true;
                            alchemyVisionTimer = ALCHEMY_VISION_DURATION;
                            
                            // Remove collected power-up
                            alchemyVisionPowerUps.splice(i, 1);
                            
                            // Dispatch power-up collected event
                            dispatchGameEvent('powerupCollected', {
                                type: 'alchemyVision',
                                duration: 30000
                            });
                            
                            // Play alchemy vision sound (always player since only player can collect)
                            playAlchemyVisionSound(true);
                            
                            // Show notification
                            showMessage('🔮 Alchemy Vision Activated! 30s<br><small style="opacity: 0.8">Your eyes are opened to see all combinations</small>', 'success');
                            break; // Only collect one at a time
                        }
                    }
                }
                
                // Check Void Orb collision (all snakes can collect)
                for (let i = voidOrbs.length - 1; i >= 0; i--) {
                    const orb = voidOrbs[i];
                    // Performance optimization: Use squared distance
                    const dx = orb.x - snakeX;
                    const dy = orb.y - snakeY;
                    const collisionDist = SEGMENT_SIZE + orb.size;
                    if (dx * dx + dy * dy < collisionDist * collisionDist) {
                        // Consume the void orb
                        if (snake.elements.length > 0) {
                            const elementCount = snake.elements.length;
                            const points = elementCount * 100;
                            snake.score += points;
                            snake.elements = []; // Clear all elements
                            
                            // Visual feedback
                            if (snake.isPlayer) {
                                // Dispatch void orb collected event
                                dispatchGameEvent('powerupCollected', {
                                    type: 'voidOrb',
                                    elementsPurged: elementCount,
                                    pointsGained: points
                                });
                                
                                // Track void orb analytics
                                if (window.GameAnalyticsWrapper) {
                                    window.GameAnalyticsWrapper.trackPowerUp('void_orb', points);
                                }
                                
                                showMessage(`<div style="text-align: center">🌀 Void Orb consumed! +${points} points<br><small style="opacity: 0.8">Your elements have been purged to the void</small></div>`, 'info');
                            }
                            
                            // Play sound at appropriate volume
                            playVoidOrbSound(snake.isPlayer);
                            
                            // Create particle effect
                            for (let j = 0; j < 15; j++) {
                                const angle = (j / 15) * Math.PI * 2;
                                const speed = 2 + Math.random() * 3;
                                const vx = Math.cos(angle) * speed;
                                const vy = Math.sin(angle) * speed;
                                particlePool.spawn(orb.x, orb.y, vx, vy, 'rgba(100, 200, 255, 0.8)');
                            }
                            
                            // 50% chance to spawn a discovery element
                            if (Math.random() < 0.5) {
                                gameLogger.debug('VOID ORB', 'Attempting to spawn element...');
                                
                                // Get all available elements
                                let availableElements = [];
                                if (window.elementLoader && window.elementLoader.isLoaded && window.elementLoader.isLoaded()) {
                                    // Get all elements and extract their keys
                                    const allElements = window.elementLoader.getAllElements();
                                    availableElements = allElements.map(elem => elem.key);
                                    gameLogger.debug('VOID ORB', 'Using element loader, found', availableElements.length, 'total elements');
                                } else {
                                    availableElements = Object.keys(elementDatabase);
                                    gameLogger.debug('VOID ORB', 'Using legacy database, found', availableElements.length, 'total elements');
                                }
                                
                                // Filter to only discovered elements (except base elements which are always available)
                                const spawnableElements = availableElements.filter(elemKey => {
                                    // Always allow base elements (first 4)
                                    const elemIndex = availableElements.indexOf(elemKey);
                                    if (elemIndex < 4) return true;
                                    
                                    // For other elements, only spawn if discovered
                                    return discoveredElements.has(elemKey);
                                });
                                
                                // Prioritize elements that can lead to new discoveries
                                const discoveryPotentialElements = spawnableElements.filter(elemKey => {
                                    // Check if this element can combine with carried elements for new discoveries
                                    let hasDiscoveryPotential = false;
                                    snake.elements.forEach(carried => {
                                        const result = window.elementLoader ? 
                                            window.elementLoader.getCombinationByKeys(elemKey, carried) :
                                            (combinations[`${elemKey}+${carried}`] || combinations[`${carried}+${elemKey}`]);
                                        if (result && !discoveredElements.has(result.key || result)) {
                                            hasDiscoveryPotential = true;
                                        }
                                    });
                                    return hasDiscoveryPotential;
                                });
                                
                                // Use discovery potential elements if available, otherwise use any spawnable element
                                const finalPool = discoveryPotentialElements.length > 0 ? discoveryPotentialElements : spawnableElements;
                                
                                gameLogger.debug('VOID ORB', 'Spawnable elements:', spawnableElements.length, 'Discovery potential:', discoveryPotentialElements.length, 'Final pool:', finalPool.length);
                                
                                if (finalPool.length > 0) {
                                    // Pick a random element
                                    const randomElement = finalPool[Math.floor(Math.random() * finalPool.length)];
                                    gameLogger.debug('VOID ORB', 'Selected element to spawn:', randomElement);
                                    
                                    // Spawn it at a random location near the void orb
                                    const spawnAngle = Math.random() * Math.PI * 2;
                                    const spawnDistance = 50 + Math.random() * 100;
                                    const spawnX = orb.x + Math.cos(spawnAngle) * spawnDistance;
                                    const spawnY = orb.y + Math.sin(spawnAngle) * spawnDistance;
                                    
                                    // Spawn the element with glow effect (using isCatalystSpawned for glow)
                                    elementPool.spawn(randomElement, spawnX, spawnY, true);
                                    
                                    // Show message if player collected the orb
                                    if (snake.isPlayer) {
                                        const elementData = window.elementLoader && window.elementLoader.isLoaded && window.elementLoader.isLoaded() 
                                            ? window.elementLoader.elements.get(randomElement)
                                            : elementDatabase[randomElement];
                                        if (elementData) {
                                            const emoji = window.elementLoader.getEmojiForElement(randomElement, elementData.e);
                                            const name = elementData.n;
                                            showMessage(`✨ The void reveals: ${emoji} ${name}!`, 'discovery');
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Remove void orb
                        voidOrbs.splice(i, 1);
                        break;
                    }
                }
                
                // Check Catalyst Gem collision (all snakes can collect)
                for (let i = catalystGems.length - 1; i >= 0; i--) {
                    const gem = catalystGems[i];
                    // Performance optimization: Use squared distance
                    const dx = gem.x - snake.x;
                    const dy = gem.y - snake.y;
                    const collisionDist = SEGMENT_SIZE + gem.size;
                    const collisionDistSq = collisionDist * collisionDist;
                    if (dx * dx + dy * dy < collisionDistSq) {
                        // Only activate if catalyst gem logic is ready
                        if (snake.isPlayer && window.elementLoader && window.elementLoader.isLoaded && window.elementLoader.isLoaded()) {
                            // NEW CATALYST LOGIC: Spawn 3 random elements NOT in the current spawn pool
                            // These are elements the player hasn't discovered yet
                            const allElements = window.elementLoader.elements;
                            const undiscoveredElements = [];
                            
                            // Find all elements that are NOT in the spawn pool (not discovered by player)
                            for (const [elemId, element] of allElements) {
                                const elemIdNum = typeof elemId === 'string' ? parseInt(elemId) : elemId;
                                const isBaseElement = elemIdNum >= 0 && elemIdNum <= 3;
                                
                                // Skip base elements and already discovered elements
                                if (!isBaseElement && !playerDiscoveredElements.has(elemIdNum)) {
                                    undiscoveredElements.push(elemIdNum);
                                }
                            }
                            
                            if (undiscoveredElements.length >= 3) {
                                // Randomly select 3 undiscovered elements
                                const shuffled = [...undiscoveredElements].sort(() => Math.random() - 0.5);
                                const elementsToSpawn = shuffled.slice(0, 3);
                                
                                // Spawn the three elements around the player in a triangle pattern
                                for (let j = 0; j < elementsToSpawn.length; j++) {
                                    const angle = (j / 3) * Math.PI * 2;
                                    const distance = 100 + Math.random() * 100;
                                    const spawnX = snake.x + Math.cos(angle) * distance;
                                    const spawnY = snake.y + Math.sin(angle) * distance;
                                    
                                    // Create the element with catalyst sparkle effect
                                    elementPool.spawn(elementsToSpawn[j], spawnX, spawnY, true);
                                }
                                
                                showMessage(`💎 Catalyst Gem: 3 Rare Elements Materialized!`, 'gold');
                            } else if (undiscoveredElements.length > 0) {
                                // Spawn whatever undiscovered elements are left
                                const elementsToSpawn = undiscoveredElements;
                                
                                // Spawn the elements
                                for (let j = 0; j < elementsToSpawn.length; j++) {
                                    const angle = (j / elementsToSpawn.length) * Math.PI * 2;
                                    const distance = 100 + Math.random() * 100;
                                    const spawnX = snake.x + Math.cos(angle) * distance;
                                    const spawnY = snake.y + Math.sin(angle) * distance;
                                    
                                    elementPool.spawn(elementsToSpawn[j], spawnX, spawnY, true);
                                }
                                
                                showMessage(`💎 Catalyst Gem: ${elementsToSpawn.length} Rare Elements Materialized!`, 'gold');
                            } else {
                                // Fallback: All elements discovered, spawn random elements
                                const allElementsList = Array.from(allElements.keys());
                                const shuffled = [...allElementsList].sort(() => Math.random() - 0.5);
                                const elementsToSpawn = shuffled.slice(0, 3);
                                
                                // Spawn the elements
                                for (let j = 0; j < elementsToSpawn.length; j++) {
                                    const angle = (j / elementsToSpawn.length) * Math.PI * 2;
                                    const distance = 100 + Math.random() * 100;
                                    const spawnX = snake.x + Math.cos(angle) * distance;
                                    const spawnY = snake.y + Math.sin(angle) * distance;
                                    
                                    elementPool.spawn(elementsToSpawn[j], spawnX, spawnY, true);
                                }
                                
                                showMessage(`💎 Catalyst Gem: 3 Elements Materialized!`, 'gold');
                            }
                            
                            // Play catalyst gem sound at appropriate volume
                            playCatalystGemSound(true);
                            
                            // Dispatch catalyst gem collected event
                            dispatchGameEvent('powerupCollected', {
                                type: 'catalyst',
                                elementsSpawned: 3
                            });
                            
                            // Track catalyst gem analytics
                            if (window.GameAnalyticsWrapper) {
                                window.GameAnalyticsWrapper.trackPowerUp('catalyst_gem', 0);
                            }
                            
                            // Create particle effect
                            for (let j = 0; j < 20; j++) {
                                const angle = (j / 20) * Math.PI * 2;
                                const speed = 3 + Math.random() * 4;
                                const vx = Math.cos(angle) * speed;
                                const vy = Math.sin(angle) * speed;
                                particlePool.spawn(gem.x, gem.y, vx, vy, 'rgba(255, 165, 0, 0.8)');
                            }
                        } else if (!snake.isPlayer) {
                            // AI snakes get points instead
                            snake.score += 200;
                            
                            // Play catalyst gem sound at appropriate volume
                            playCatalystGemSound(false);
                            
                            // Create particle effect
                            for (let j = 0; j < 20; j++) {
                                const angle = (j / 20) * Math.PI * 2;
                                const speed = 3 + Math.random() * 4;
                                const vx = Math.cos(angle) * speed;
                                const vy = Math.sin(angle) * speed;
                                particlePool.spawn(gem.x, gem.y, vx, vy, 'rgba(255, 165, 0, 0.8)');
                            }
                        }
                        
                        // Remove catalyst gem
                        catalystGems.splice(i, 1);
                        break;
                    }
                }
                
                // Check snake collisions (skip if invincible)
                if (snake.invincibilityTimer > 0) continue;
                
                for (const otherSnake of snakes) {
                    if (snake === otherSnake || !otherSnake.alive || !snake.alive || diedThisFrame.has(otherSnake)) continue;
                    
                    // Skip collision if boss is stunned or invulnerable
                    if (otherSnake.isBoss && (otherSnake.stunTimer > 0 || otherSnake.invulnerabilityTimer > 0)) continue;
                    
                    // Skip collision check if snakes are too far apart (optimization for mobile)
                    const maxCollisionDistance = 500; // Maximum distance for collision checks
                    const dx = otherSnake.x - snake.x;
                    const dy = otherSnake.y - snake.y;
                    if (dx * dx + dy * dy > maxCollisionDistance * maxCollisionDistance) continue;
                    
                    // Check head collision with other snake's body
                    let collisionOccurred = false;
                    
                    // Calculate proper collision radius based on both snakes' sizes
                    const snakeSize = snake.size || 1;
                    const otherSnakeSize = otherSnake.size || 1;
                    const collisionRadius = SEGMENT_SIZE * (snakeSize + otherSnakeSize) / 2;
                    const collisionRadiusSq = collisionRadius * collisionRadius;
                    
                    // For body segments, check collision with all segments (including head and tail for bosses)
                    const startIndex = otherSnake.isBoss ? 0 : 3; // Boss collision includes all segments
                    for (let i = startIndex; i < otherSnake.segments.length; i++) {
                        const segment = otherSnake.segments[i];
                        // Performance optimization: Use squared distance
                        const dx = segment.x - snake.x;
                        const dy = segment.y - snake.y;
                        if (dx * dx + dy * dy < collisionRadiusSq) {
                            // Track collision for near-miss prevention
                            if (snake.isPlayer) {
                                snake.recentCollisions.add(otherSnake);
                            }
                            if (otherSnake.isPlayer) {
                                otherSnake.recentCollisions.add(snake);
                            }
                            snake.explode(otherSnake);
                            diedThisFrame.add(snake);
                            collisionOccurred = true;
                            break;
                        }
                    }
                    
                    // Skip further collision checks if this snake died
                    if (collisionOccurred || !snake.alive) break;
                    
                    // Check head-to-head collision
                    if (snake.alive && otherSnake.alive) {
                        // Performance optimization: Use squared distance
                        const hdx = otherSnake.x - snake.x;
                        const hdy = otherSnake.y - snake.y;
                        if (hdx * hdx + hdy * hdy < collisionRadiusSq) {
                            // Smaller snake explodes, or both if same size
                            if (snake.length < otherSnake.length) {
                                snake.explode(otherSnake);
                                diedThisFrame.add(snake);
                            } else if (otherSnake.length < snake.length) {
                                otherSnake.explode(snake);
                                diedThisFrame.add(otherSnake);
                            } else {
                                // Same size - both explode, no points awarded
                                snake.die();
                                otherSnake.die();
                                diedThisFrame.add(snake);
                                diedThisFrame.add(otherSnake);
                            }
                            break;
                        }
                    }
                }
            }
            
            // Near-miss detection (only for player snake, runs separately from collision)
            if (playerSnake && playerSnake.alive) {
                const now = Date.now();
                
                // Clean up old collision records
                for (const snake of playerSnake.recentCollisions) {
                    if (!snake.alive) {
                        playerSnake.recentCollisions.delete(snake);
                    }
                }
                
                for (const otherSnake of snakes) {
                    if (otherSnake === playerSnake || !otherSnake.alive) continue;
                    
                    // Skip if we recently collided with this snake
                    if (playerSnake.recentCollisions.has(otherSnake)) continue;
                    
                    // Calculate closest distance to any part of the other snake
                    let closestDistance = Infinity;
                    
                    // Check body segments
                    let closestDistanceSq = Infinity;
                    for (let i = 0; i < otherSnake.segments.length; i++) {
                        const segment = otherSnake.segments[i];
                        // Performance optimization: Use squared distance
                        const dx = segment.x - playerSnake.x;
                        const dy = segment.y - playerSnake.y;
                        const distSq = dx * dx + dy * dy;
                        closestDistanceSq = Math.min(closestDistanceSq, distSq);
                    }
                    
                    // Check head separately
                    const hdx = otherSnake.x - playerSnake.x;
                    const hdy = otherSnake.y - playerSnake.y;
                    const headDistSq = hdx * hdx + hdy * hdy;
                    closestDistanceSq = Math.min(closestDistanceSq, headDistSq);
                    closestDistance = Math.sqrt(closestDistanceSq);
                    
                    // Get previous tracking data
                    const trackingData = playerSnake.nearMissTracking.get(otherSnake) || {
                        wasClose: false,
                        lastAwardTime: 0,
                        minDistance: Infinity
                    };
                    
                    // Update minimum distance seen
                    trackingData.minDistance = Math.min(trackingData.minDistance, closestDistance);
                    
                    // Calculate collision radius based on sizes
                    const playerSize = playerSnake.size || 1;
                    const otherSize = otherSnake.size || 1;
                    const collisionRadius = SEGMENT_SIZE * (playerSize + otherSize) / 2;
                    
                    // Define near-miss zone accounting for snake sizes
                    const isClose = closestDistance <= collisionRadius + 30; // Within collision radius + 30 pixels
                    const isSafe = closestDistance > collisionRadius + 10; // At least collision radius + 10 pixels away (no collision)
                    
                    // Detect near miss: was close, now moving away, and didn't collide
                    if (trackingData.wasClose && !isClose && isSafe && 
                        trackingData.minDistance > collisionRadius && // Never got closer than collision distance
                        trackingData.minDistance <= collisionRadius + 20 && // But got pretty close
                        now - trackingData.lastAwardTime > 3000) { // 3 second cooldown per snake
                        
                        // Award near miss points
                        playerSnake.score += 250;
                        showMessage('Phew, Near Miss! +250', 'info');
                        trackingData.lastAwardTime = now;
                        trackingData.minDistance = Infinity; // Reset for next near miss
                    }
                    
                    // Update tracking state
                    trackingData.wasClose = isClose;
                    if (!isClose) {
                        trackingData.minDistance = Infinity; // Reset when we move away
                    }
                    
                    playerSnake.nearMissTracking.set(otherSnake, trackingData);
                }
                
                // Clean up tracking for dead snakes
                for (const [snake, data] of playerSnake.nearMissTracking) {
                    if (!snake.alive) {
                        playerSnake.nearMissTracking.delete(snake);
                    }
                }
            }
        }
        
        function drawBorders() {
            // Save context state
            ctx.save();
            
            // Ensure borders are fully opaque
            ctx.globalAlpha = 1;
            
            // Draw world borders with subtle pixel grid
            const borderThickness = isMobile ? 150 : 60; // Extra thick on mobile to prevent edge issues
            const borderBuffer = isMobile ? 50 : 0; // Additional buffer for mobile to extend borders
            
            const leftBorder = (-camera.x) * cameraZoom + canvas.width / 2;
            const rightBorder = (WORLD_SIZE - camera.x) * cameraZoom + canvas.width / 2;
            const topBorder = (-camera.y) * cameraZoom + canvas.height / 2;
            const bottomBorder = (WORLD_SIZE - camera.y) * cameraZoom + canvas.height / 2;
            
            // Pulsating effect for barriers
            const pulsePhase = Math.floor((animationTime * 2) % 4);
            const pixelSize = isMobile ? 16 : 8; // Larger pixels on mobile for visibility
            const warningLineThickness = isMobile ? 12 : 6; // Thicker warning lines on mobile
            
            // Left border barrier
            if (leftBorder > -borderThickness) {
                const borderWidth = Math.min(borderThickness, leftBorder);
                if (borderWidth > 0) {
                    // Solid gradient for both mobile and desktop
                    const gradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
                    gradient.addColorStop(0, 'rgba(128, 64, 255, 0.675)');
                    gradient.addColorStop(0.7, 'rgba(128, 64, 255, 0.45)');
                    gradient.addColorStop(1, 'rgba(128, 64, 255, 0.075)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, borderWidth, canvas.height);
                    
                    // Solid warning line
                    ctx.fillStyle = '#8844FF';
                    ctx.fillRect(Math.max(2, leftBorder - warningLineThickness/2), 0, warningLineThickness, canvas.height);
                }
            }
            
            // Right border barrier
            if (rightBorder < canvas.width + borderThickness + borderBuffer) {
                const startX = Math.max(0, rightBorder - borderThickness - borderBuffer);
                const borderWidth = canvas.width - startX + borderBuffer; // Extend beyond canvas edge
                if (borderWidth > 0) {
                    // Solid gradient for both mobile and desktop
                    const gradient = ctx.createLinearGradient(startX, 0, canvas.width + borderBuffer, 0);
                    gradient.addColorStop(0, 'rgba(128, 64, 255, 0.075)');
                    gradient.addColorStop(0.3, 'rgba(128, 64, 255, 0.45)');
                    gradient.addColorStop(1, 'rgba(128, 64, 255, 0.675)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(startX, 0, borderWidth, canvas.height);
                    
                    // Solid warning line
                    ctx.fillStyle = '#8844FF';
                    const lineX = Math.max(startX + warningLineThickness, Math.min(canvas.width - warningLineThickness - 2, rightBorder - warningLineThickness/2));
                    ctx.fillRect(lineX, 0, warningLineThickness, canvas.height);
                }
            }
            
            // Top border barrier
            if (topBorder > -borderThickness) {
                const borderHeight = Math.min(borderThickness, topBorder);
                if (borderHeight > 0) {
                    // Solid gradient for both mobile and desktop
                    const gradient = ctx.createLinearGradient(0, 0, 0, borderHeight);
                    gradient.addColorStop(0, 'rgba(128, 64, 255, 0.675)');
                    gradient.addColorStop(0.7, 'rgba(128, 64, 255, 0.45)');
                    gradient.addColorStop(1, 'rgba(128, 64, 255, 0.075)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, canvas.width, borderHeight);
                    
                    // Solid warning line
                    ctx.fillStyle = '#8844FF';
                    ctx.fillRect(0, Math.max(2, topBorder - warningLineThickness/2), canvas.width, warningLineThickness);
                }
            }
            
            // Bottom border barrier
            if (bottomBorder < canvas.height + borderThickness) {
                const startY = Math.max(0, bottomBorder - borderThickness);
                const borderHeight = canvas.height - startY;
                if (borderHeight > 0) {
                    // Solid gradient for both mobile and desktop
                    const gradient = ctx.createLinearGradient(0, startY, 0, canvas.height);
                    gradient.addColorStop(0, 'rgba(128, 64, 255, 0.075)');
                    gradient.addColorStop(0.3, 'rgba(128, 64, 255, 0.45)');
                    gradient.addColorStop(1, 'rgba(128, 64, 255, 0.675)');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, startY, canvas.width, borderHeight);
                    
                    // Solid warning line
                    ctx.fillStyle = '#8844FF';
                    ctx.fillRect(0, Math.min(canvas.height - warningLineThickness - 2, bottomBorder - warningLineThickness/2), canvas.width, warningLineThickness);
                }
            }
            
            // Restore context state
            ctx.restore();
        }
        
        // New background system with pre-made assets
        function drawNewBackgroundSystem(assets) {
            // Draw the nebula background covering the entire viewport
            if (assets.nebulaBackground) {
                // Calculate how many tiles we need to cover the viewport
                // Apply 100% zoom for classic and infinite modes only
                const zoomScale = (gameMode === 'classic' || gameMode === 'infinite') ? 2.0 : 1.0;
                const bgWidth = assets.nebulaBackground.width * zoomScale;
                const bgHeight = assets.nebulaBackground.height * zoomScale;
                
                // Apply parallax scrolling for depth effect
                const parallaxFactor = 0.3;
                const offsetX = (camera.x * parallaxFactor) % bgWidth;
                const offsetY = (camera.y * parallaxFactor) % bgHeight;
                
                // Tile the background to cover the entire viewport with zoom
                for (let x = -bgWidth - offsetX; x < canvas.width + bgWidth; x += bgWidth) {
                    for (let y = -bgHeight - offsetY; y < canvas.height + bgHeight; y += bgHeight) {
                        ctx.drawImage(assets.nebulaBackground, x, y, bgWidth, bgHeight);
                    }
                }
            }
            
            // Overlay the star field
            if (assets.starOverlay) {
                // Different parallax for star overlay
                const parallaxFactor = 0.5;
                const starWidth = assets.starOverlay.width;
                const starHeight = assets.starOverlay.height;
                const offsetX = (camera.x * parallaxFactor) % starWidth;
                const offsetY = (camera.y * parallaxFactor) % starHeight;
                
                ctx.save();
                ctx.globalAlpha = 0.8; // Slight transparency for blending
                
                // Tile the star overlay
                for (let x = -starWidth - offsetX; x < canvas.width + starWidth; x += starWidth) {
                    for (let y = -starHeight - offsetY; y < canvas.height + starHeight; y += starHeight) {
                        ctx.drawImage(assets.starOverlay, x, y);
                    }
                }
                
                ctx.restore();
            }
            
            // Draw blinking stars
            drawBlinkingStars(assets);
        }
        
        // Simple mobile background system
        function drawSimpleMobileBackground(assets) {
            // Draw nebula background with reduced tiling for performance
            if (assets.nebulaBackground) {
                // Apply 100% zoom for classic and infinite modes only
                const zoomScale = (gameMode === 'classic' || gameMode === 'infinite') ? 2.0 : 1.0;
                const bgWidth = assets.nebulaBackground.width * zoomScale;
                const bgHeight = assets.nebulaBackground.height * zoomScale;
                const parallaxFactor = 0.2;
                const offsetX = (camera.x * parallaxFactor) % bgWidth;
                const offsetY = (camera.y * parallaxFactor) % bgHeight;
                
                // Simpler tiling for mobile with zoom - use canvas dimensions
                ctx.drawImage(assets.nebulaBackground, -offsetX, -offsetY, canvas.width + bgWidth, canvas.height + bgHeight);
            }
            
            // Draw fewer blinking stars on mobile
            drawBlinkingStars(assets, true);
        }
        
        // Draw blinking star sprites
        function drawBlinkingStars(assets, isMobile = false) {
            if (!assets.starSprites || assets.starSprites.length === 0) return;
            
            const maxStars = isMobile ? 30 : blinkingStars.length; // Fewer stars on mobile
            
            for (let i = 0; i < Math.min(maxStars, blinkingStars.length); i++) {
                const star = blinkingStars[i];
                
                // Calculate screen position
                const screen = worldToScreen(star.x, star.y);
                
                // Skip if off-screen
                if (screen.x < -50 || screen.x > canvas.width + 50 ||
                    screen.y < -50 || screen.y > canvas.height + 50) continue;
                
                // Update blink phase
                star.blinkPhase += star.blinkSpeed * 0.02;
                
                // Calculate opacity based on blink phase
                const opacity = 0.3 + Math.sin(star.blinkPhase) * 0.7;
                
                // Get the sprite
                const sprite = assets.starSprites[star.type];
                if (!sprite) continue;
                
                ctx.save();
                ctx.globalAlpha = opacity;
                
                // Draw the star sprite
                const size = sprite.width * star.scale * cameraZoom;
                ctx.drawImage(
                    sprite,
                    screen.x - size / 2,
                    screen.y - size / 2,
                    size,
                    size
                );
                
                ctx.restore();
            }
        }
        
        function drawBackground() {
            // Clear with deep space background
            // In cozy mode, don't fill the canvas to allow purple background to show through
            if (gameMode !== 'cozy') {
                ctx.fillStyle = '#000011';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            } else {
                // Clear the canvas to transparent for cozy mode
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            // Check if assets are loaded
            if (!window.preloadedAssets || !window.preloadedAssets.backgrounds) {
                // Fallback to simple background if assets not loaded
                return;
            }
            
            const assets = window.preloadedAssets.backgrounds;
            
            // Skip background rendering in cozy mode to allow purple background to show through
            if (gameMode !== 'cozy') {
                // Use optimized mobile renderer if available
                if (isMobile) {
                    if (window.renderMobileBackground && window.mobileBackgroundOptimizer) {
                        // Use new optimized mobile background
                        window.renderMobileBackground(ctx, camera);
                    } else {
                        // Simple mobile background with new assets
                        drawSimpleMobileBackground(assets);
                    }
                } else {
                    // Desktop background rendering with new assets
                    drawNewBackgroundSystem(assets);
                }
            }
            
            // Initialize Easter Egg elements for desktop - REMOVED (not using black holes/UFOs)
            /*
            if (!window.easterEggElements && typeof EasterEggElements !== 'undefined') {
                window.easterEggElements = new EasterEggElements();
                // Desktop gets high quality by default
                window.easterEggElements.setQualityLevel('high');
            }
            */
            
            // Draw Easter Egg elements (rare background decorations) - REMOVED (not using black holes/UFOs)
            /*
            if (window.easterEggElements) {
                const gameState = {
                    worldWidth: WORLD_WIDTH,
                    worldHeight: WORLD_HEIGHT,
                    playerSnake: playerSnake,
                    bossActive: currentBoss && currentBoss.isActive || false
                };
                
                window.easterEggElements.update(16.67, gameState);
                window.easterEggElements.render(ctx, camera);
            }
            */
            
            // Draw spaceships (behind planets) - REMOVED (not using spaceships)
            /*
            if (window.spaceships) {
                window.spaceships.forEach(spaceship => {
                    spaceship.draw(ctx, camera);
                });
            }
            */
            
            // Draw pixel planets BEFORE grid
            drawPixelPlanets();
            
            // Draw floating space stations (above planets)
            drawSpaceStations();
            
            // Draw pixel asteroids - REMOVED (using PNG images instead)
            // drawPixelAsteroids();
            
            // Draw pixel grid using cached pattern - optimized
            const gridSize = 64;
            const offsetX = (camera.x * 0.05) % gridSize;
            const offsetY = (camera.y * 0.05) % gridSize;
            
            // Grid pattern drawing removed - commented out to remove grid lines
            // ctx.save();
            // ctx.translate(-offsetX, -offsetY);
            // 
            // // Draw the cached grid canvas tiled across the screen
            // const tilesX = Math.ceil((canvas.width + gridSize) / 128);
            // const tilesY = Math.ceil((canvas.height + gridSize) / 128);
            // 
            // for (let tx = 0; tx < tilesX; tx++) {
            //     for (let ty = 0; ty < tilesY; ty++) {
            //         ctx.drawImage(window.gridPatternCanvas, tx * 128, ty * 128);
            //     }
            // }
            // 
            // ctx.restore()
            
            // Draw shooting stars (desktop only)
            if (!isMobile) {
                shootingStars.forEach(star => star.draw());
            }
            
            // Add scanline effect for retro monitor feel (desktop only)
            if (!isMobile) {
                ctx.fillStyle = 'rgba(0,255,0,0.02)';
                for (let y = 0; y < canvas.height; y += 4) {
                    if (y % 8 === 0) {
                        ctx.fillRect(0, y, canvas.width, 2);
                    }
                }
            }
        }
        
        // OLD drawPixelNebulae function - no longer used
        function drawPixelNebulae() {
            // This function is no longer used - we now use pre-made background assets
            return;
        }
        
        // Update and draw floating space stations
        function drawSpaceStations() {
            if (!window.preloadedAssets || !window.preloadedAssets.stations) return;
            
            // Minimal parallax for stations (they're in foreground)
            const stationParallax = 0.95;
            
            spaceStations.forEach((station) => {
                // Update station position with drifting motion
                station.driftAngle += 0.005; // Slow oscillation
                const driftX = Math.cos(station.driftAngle) * station.driftSpeed;
                const driftY = Math.sin(station.driftAngle * 0.7) * station.driftSpeed; // Different frequency for Y
                
                station.x += station.vx + driftX;
                station.y += station.vy + driftY;
                
                // Wrap around world boundaries
                if (station.x < 0) station.x = WORLD_SIZE;
                if (station.x > WORLD_SIZE) station.x = 0;
                if (station.y < 0) station.y = WORLD_SIZE;
                if (station.y > WORLD_SIZE) station.y = 0;
                
                // Update rotation
                station.rotation += station.rotationSpeed;
                
                // Calculate screen position with parallax
                const x = station.x - camera.x * stationParallax + canvas.width / 2;
                const y = station.y - camera.y * stationParallax + canvas.height / 2;
                
                // Only draw if in viewport (with margin)
                const margin = station.width * 2;
                if (x < -margin || x > canvas.width + margin ||
                    y < -margin || y > canvas.height + margin) return;
                
                // Get station image
                const stationImage = window.preloadedAssets.stations[station.imageId];
                if (!stationImage) return;
                
                // Draw station with rotation
                ctx.save();
                ctx.globalAlpha = 0.9; // Slight transparency
                ctx.translate(x, y);
                ctx.rotate(station.rotation);
                
                // Draw centered at position
                const aspectRatio = stationImage.width / stationImage.height;
                const drawHeight = station.width / aspectRatio;
                
                ctx.drawImage(
                    stationImage,
                    -station.width / 2,
                    -drawHeight / 2,
                    station.width,
                    drawHeight
                );
                
                ctx.restore();
            });
        }
        
        // Draw pixel planets with parallax
        function drawPixelPlanets() {
            // Sort planets by type for two-layer parallax
            const specialPlanets = pixelPlanets.filter(p => p.isSpecial);
            const regularPlanets = pixelPlanets.filter(p => !p.isSpecial);
            
            // Draw special planets first (back layer with more parallax)
            const specialParallax = 0.7; // Special planets move at 70% of camera speed
            specialPlanets.forEach((planet) => {
                const x = planet.x - camera.x * specialParallax + canvas.width / 2;
                const y = planet.y - camera.y * specialParallax + canvas.height / 2;
                
                // Only draw if in viewport
                if (x < -planet.radius * 2 || x > canvas.width + planet.radius * 2 ||
                    y < -planet.radius * 2 || y > canvas.height + planet.radius * 2) return;
                
                // Update rotation for special planets
                planet.rotation += planet.rotationSpeed;
                
                // Check if planet assets are loaded
                if (window.preloadedAssets && window.preloadedAssets.planets) {
                    drawPlanetImage(x, y, planet.radius, planet.imageId, planet.isSpecial, planet, planet.opacity);
                } else {
                    drawFallbackPlanet(x, y, planet.radius, planet.opacity);
                }
            });
            
            // Draw regular planets (front layer with less parallax)
            const regularParallax = 0.9; // Regular planets move at 90% of camera speed
            regularPlanets.forEach((planet) => {
                const x = planet.x - camera.x * regularParallax + canvas.width / 2;
                const y = planet.y - camera.y * regularParallax + canvas.height / 2;
                
                // Only draw if in viewport
                if (x < -planet.radius * 2 || x > canvas.width + planet.radius * 2 ||
                    y < -planet.radius * 2 || y > canvas.height + planet.radius * 2) return;
                
                // Update rotation for standard planets on mobile
                if (window.isTabletOrMobile && window.isTabletOrMobile()) {
                    planet.rotation += planet.rotationSpeed;
                }
                
                // Check if planet assets are loaded
                if (window.preloadedAssets && window.preloadedAssets.planets) {
                    drawPlanetImage(x, y, planet.radius, planet.imageId, planet.isSpecial, planet, planet.opacity);
                } else {
                    drawFallbackPlanet(x, y, planet.radius, planet.opacity);
                }
            });
        }
        
        // Draw a planet using preloaded image
        function drawPlanetImage(x, y, radius, imageId, isSpecial, planetInstance, opacity = 1) {
            // Get the appropriate planet data
            const planetType = isSpecial ? 'special' : 'standard';
            const planetData = window.preloadedAssets.planets[planetType][imageId];
            
            if (!planetData) {
                gameLogger.warn('ASSETS', `Planet data not found: ${imageId}`);
                drawFallbackPlanet(x, y, radius, opacity);
                return;
            }
            
            // Save context
            ctx.save();
            
            // Set opacity
            ctx.globalAlpha = opacity;
            
            // Get the current frame
            let currentImage;
            if (isSpecial) {
                // Special planets are single images with rotation
                currentImage = planetData;
                
                // Apply rotation for special planets
                ctx.translate(x, y);
                ctx.rotate(planetInstance.rotation);
                
                // Draw at translated position
                const size = radius * 2;
                try {
                    ctx.drawImage(
                        currentImage,
                        -radius,
                        -radius,
                        size,
                        size
                    );
                } catch (e) {
                    // If image fails, try fallback
                    drawFallbackPlanet(0, 0, radius, opacity);
                }
                
                // Restore context
                ctx.restore();
                return;
            } else {
                // Standard planets - check if mobile static or desktop animated
                if (planetData.isStatic) {
                    // Mobile: use static image
                    currentImage = planetData.staticImage;
                    
                    // Apply slow rotation for visual variety on mobile
                    ctx.translate(x, y);
                    ctx.rotate(planetInstance.rotation || 0);
                    
                    // Draw at translated position
                    const size = radius * 2;
                    try {
                        ctx.drawImage(
                            currentImage,
                            -radius,
                            -radius,
                            size,
                            size
                        );
                    } catch (e) {
                        // If image fails, try fallback
                        drawFallbackPlanet(0, 0, radius, opacity);
                    }
                    
                    // Restore context
                    ctx.restore();
                    return;
                } else {
                    // Desktop: animated planets
                    if (!planetData.frames || planetData.frames.length === 0) {
                        // Check if we have a static image (initial load state)
                        if (planetData.staticImage) {
                            currentImage = planetData.staticImage;
                        } else {
                            drawFallbackPlanet(x, y, radius, opacity);
                            ctx.restore();
                            return;
                        }
                    } else {
                        // We have frames, animate them
                        // Update animation timing for this planet instance
                        const now = Date.now();
                        if (!planetInstance.lastFrameTime) {
                            planetInstance.lastFrameTime = now;
                        }
                        
                        const deltaTime = now - planetInstance.lastFrameTime;
                        planetInstance.frameTime += deltaTime;
                        planetInstance.lastFrameTime = now;
                        
                        // Advance frame if needed, but only up to available frames
                        const availableFrames = planetData.frames.length;
                        while (planetInstance.frameTime >= planetData.frameDuration && availableFrames > 1) {
                            planetInstance.frameTime -= planetData.frameDuration;
                            planetInstance.currentFrame = (planetInstance.currentFrame + 1) % availableFrames;
                        }
                        
                        // Ensure we don't go out of bounds
                        if (planetInstance.currentFrame >= availableFrames) {
                            planetInstance.currentFrame = 0;
                        }
                        
                        currentImage = planetData.frames[planetInstance.currentFrame];
                    }
                }
            }
            
            // Draw the planet image scaled to the radius
            const size = radius * 2;
            
            try {
                // Draw the planet image (all planets are now square)
                ctx.drawImage(
                    currentImage,
                    x - radius,
                    y - radius,
                    size,
                    size
                );
            } catch (e) {
                // If image fails, try fallback
                drawFallbackPlanet(x, y, radius, opacity);
            }
            
            // Restore context
            ctx.restore();
        }
        
        // Fallback planet drawing for when images aren't loaded
        function drawFallbackPlanet(x, y, radius, opacity = 1) {
            ctx.save();
            ctx.globalAlpha = opacity;
            
            // Draw a simple gradient circle
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, '#8B7355');
            gradient.addColorStop(0.5, '#6B5D54');
            gradient.addColorStop(1, '#4A3C3B');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a simple shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(x + radius * 0.2, y + radius * 0.2, radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        // Draw pixel asteroids with parallax - REMOVED (using PNG images instead)
        /*
        function drawPixelAsteroids() {
            // Update asteroid positions
            pixelAsteroids.forEach(asteroid => {
                asteroid.x += asteroid.driftX;
                asteroid.y += asteroid.driftY;
                asteroid.rotation += asteroid.rotSpeed;
                
                // Wrap around world
                if (asteroid.x < 0) asteroid.x = WORLD_SIZE;
                if (asteroid.x > WORLD_SIZE) asteroid.x = 0;
                if (asteroid.y < 0) asteroid.y = WORLD_SIZE;
                if (asteroid.y > WORLD_SIZE) asteroid.y = 0;
            });
            
            // Draw asteroids
            pixelAsteroids.forEach(asteroid => {
                const x = asteroid.x - camera.x * 0.15 + canvas.width / 2;
                const y = asteroid.y - camera.y * 0.15 + canvas.height / 2;
                
                // Only draw if in viewport
                if (x < -20 || x > canvas.width + 20 || y < -20 || y > canvas.height + 20) return;
                
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(asteroid.rotation);
                
                // Irregular asteroid shape
                ctx.fillStyle = '#696969';
                ctx.fillRect(-asteroid.size/2, -asteroid.size/2, asteroid.size, asteroid.size);
                
                // Details
                ctx.fillStyle = '#808080';
                ctx.fillRect(-asteroid.size/2 + 2, -asteroid.size/2 + 2, 4, 4);
                ctx.fillRect(asteroid.size/2 - 6, asteroid.size/2 - 6, 4, 4);
                
                ctx.fillStyle = '#505050';
                ctx.fillRect(0, 0, 4, 4);
                
                ctx.restore();
            });
            
            // Draw asteroid clusters
            asteroidClusters.forEach(cluster => {
                cluster.asteroids.forEach(asteroid => {
                    // Update rotation
                    asteroid.rotation += asteroid.rotationSpeed;
                    
                    // Slow drift
                    asteroid.x += asteroid.driftX;
                    asteroid.y += asteroid.driftY;
                    
                    // Calculate screen position with parallax
                    const x = asteroid.x - camera.x * 0.15 + canvas.width / 2;
                    const y = asteroid.y - camera.y * 0.15 + canvas.height / 2;
                    
                    // Skip if off-screen
                    if (x < -10 || x > canvas.width + 10 || y < -10 || y > canvas.height + 10) return;
                    
                    // Draw small asteroid
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(asteroid.rotation);
                    
                    ctx.fillStyle = '#696969';
                    ctx.fillRect(-asteroid.size/2, -asteroid.size/2, asteroid.size, asteroid.size);
                    
                    // Darker detail
                    ctx.fillStyle = '#525252';
                    ctx.fillRect(-asteroid.size/4, -asteroid.size/4, asteroid.size/2, asteroid.size/2);
                    
                    ctx.restore();
                });
            });
        }
        */
        
        // Game functions
        function initializeStaticStars() {
            staticStars = [];
            // Reduce stars on mobile for better performance
            const starCount = isMobile ? 50 : 200; // Much fewer stars on mobile
            
            for (let i = 0; i < starCount; i++) {
                staticStars.push({
                    x: Math.random() * WORLD_SIZE,
                    y: Math.random() * WORLD_SIZE,
                    size: Math.random() * 2 + 1, // 1-3px
                    opacity: Math.random() * 0.2 + 0.1, // 0.1-0.3 opacity
                    color: Math.random() > 0.5 ? '#ffffff' : '#e0e8ff' // white or pale blue
                });
            }
            
            // Initialize pixel star layers
            pixelStarLayers.forEach(layer => {
                layer.stars = [];
                for (let i = 0; i < layer.count; i++) {
                    layer.stars.push({
                        x: Math.random() * WORLD_SIZE,
                        y: Math.random() * WORLD_SIZE,
                        twinkle: Math.random() * Math.PI * 2
                    });
                }
            });
            
            // Initialize pixel asteroids - REMOVED (using PNG images instead)
            /*
            pixelAsteroids.length = 0;
            for (let i = 0; i < 50; i++) {
                pixelAsteroids.push({
                    x: Math.random() * WORLD_SIZE,
                    y: Math.random() * WORLD_SIZE,
                    size: 4 + Math.random() * 8, // Smaller asteroids
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.05,
                    driftX: (Math.random() - 0.5) * 0.2,
                    driftY: (Math.random() - 0.5) * 0.2
                });
            }
            */
        }
        
        function initializeBorderParticles() {
            borderParticles = [];
            
            // Create particles along each border
            const particleSpacing = 30;
            
            // Left border particles
            for (let y = 0; y < canvas.height; y += particleSpacing) {
                if (borderParticles.length < MAX_BORDER_PARTICLES) {
                    borderParticles.push(new BorderParticle(Math.random() * 30, y, 'left'));
                }
            }
            
            // Right border particles
            for (let y = 0; y < canvas.height; y += particleSpacing) {
                if (borderParticles.length < MAX_BORDER_PARTICLES) {
                    borderParticles.push(new BorderParticle(canvas.width - Math.random() * 30, y, 'right'));
                }
            }
            
            // Top border particles
            for (let x = 0; x < canvas.width; x += particleSpacing) {
                if (borderParticles.length < MAX_BORDER_PARTICLES) {
                    borderParticles.push(new BorderParticle(x, Math.random() * 30, 'top'));
                }
            }
            
            // Bottom border particles
            for (let x = 0; x < canvas.width; x += particleSpacing) {
                if (borderParticles.length < MAX_BORDER_PARTICLES) {
                    borderParticles.push(new BorderParticle(x, canvas.height - Math.random() * 30, 'bottom'));
                }
            }
        }
        
        function startGame() {
            // Track game session start
            if (window.GameAnalyticsWrapper) {
                window.GameAnalyticsWrapper.trackSessionStart();
            }
            
            // Cancel any existing game loop
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Prevent multiple game instances
            if (gameStarted) {
                gameLogger.debug('GAME', 'Game already running, ignoring start request');
                return;
            }
            
            // No need to lock orientation here - already locked on page load for mobile
            
            // Clear all game state to ensure fresh start
            snakes = [];
            elements = [];
            gameWon = false; // Reset victory flag
            particles = [];
            revivesRemaining = 3; // Reset revives for new game (Classic mode)
            deathCount = 0; // Reset death count
            voidOrbs = [];
            catalystGems = [];
            alchemyVisionPowerUps = [];
            aiRespawnQueue = [];
            usedAISkins.clear();
            
            // Reset boss spawn tracking
            bossSpawnCount = 0;
            lastBossDefeatScore = 0;
            calculateNextBossSpawn(); // Set first boss spawn point
            
            // ALWAYS start fresh - no saved discoveries affect spawning
            discoveredElements = new Set([0, 1, 2, 3]); // Only base elements in global pool
            playerDiscoveredElements = new Set([0, 1, 2, 3]); // Start with base elements for spawn system
            
            // Load saved discoveries for UI/journal only
            if (window.elementCompatibility) {
                const savedDiscovered = window.elementCompatibility.loadDiscoveredElements();
                if (savedDiscovered && Object.keys(savedDiscovered).length > 0) {
                    // Keep track of all-time discoveries for journal
                    Object.keys(savedDiscovered).forEach(key => {
                        if (savedDiscovered[key] && allTimeDiscoveries) {
                            // Add to all-time discoveries but NOT to spawn pool
                            allTimeDiscoveries.set(key, savedDiscovered[key]);
                        }
                    });
                }
            }
            
            
            // Reset game variables
            lastDiscoveredElement = null;
            alchemyVisionActive = false;
            alchemyVisionTimer = 0;
            bestRank = 0;
            playerSnake = null;
            window.playerSnake = null;
            
            // Reset game loop timing variables
            lastTime = 0;
            accumulator = 0;
            frameCount = 0;
            lastFpsUpdate = 0;
            
            // Reset spawn timers
            lastAlchemyVisionSpawn = Date.now();
            lastVoidOrbSpawn = Date.now();
            lastCatalystGemSpawn = Date.now();
            
            // Initialize discovery feed - starts empty
            const discoveryFeed = document.getElementById('discoveryFeed');
            if (discoveryFeed) {
                discoveryFeed.innerHTML = '';
                // Players must discover everything, even base elements
                
                // Discovery feed ready for new discoveries
            }
            
            // Initialize explosion manager if not already done
            if (!explosionManager) {
                import('./entities/ExplosionAnimation.js').then(module => {
                    const { ExplosionManager } = module;
                    explosionManager = new ExplosionManager({ isMobile });
                    window.explosionManager = explosionManager; // Expose globally for Snake.js access
                }).catch(err => {
                    console.error('Failed to load explosion manager:', err);
                    // Continue game without explosions if loading fails
                });
            }
            
            // Start fresh game
            gameStarted = true;
            window.gameStarted = true; // Update global
            gameStartTime = Date.now();
            
            // Signal that game is initialized for performance optimizations
            window.gameInitialized = true;
            
            // Reset session flags
            window.firstPlaceAchievedThisGame = false;
            
            // Dispatch game start event
            dispatchGameEvent('gameStart', { timestamp: gameStartTime });
            
            // Notify unlock manager that game has started
            if (window.unlockManager && window.unlockManager.onGameStart) {
                window.unlockManager.onGameStart();
            }
            
            // Initialize asteroids with better spacing
            asteroids = [];
            
            // Initialize spaceship manager
            if (!spaceshipManager && window.SpaceshipManager) {
                spaceshipManager = new window.SpaceshipManager(ctx, canvas);
            }
            const ASTEROID_COUNT = isMobile ? 15 : 30; // Much fewer asteroids on mobile
            const MIN_DISTANCE = isMobile ? 1200 : 800; // Wider spacing on mobile
            
            // Create asteroids with spacing constraint
            for (let i = 0; i < ASTEROID_COUNT; i++) {
                let x, y;
                let validPosition = false;
                let attempts = 0;
                
                // Try to find a position that's not too close to other asteroids
                while (!validPosition && attempts < 50) {
                    x = Math.random() * WORLD_SIZE;
                    y = Math.random() * WORLD_SIZE;
                    
                    validPosition = true;
                    // Check distance from existing asteroids
                    for (const existingAsteroid of asteroids) {
                        const dx = existingAsteroid.x - x;
                        const dy = existingAsteroid.y - y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        if (distance < MIN_DISTANCE) {
                            validPosition = false;
                            break;
                        }
                    }
                    attempts++;
                }
                
                // Create asteroid at found position
                asteroids.push(new Asteroid(x, y));
            }
            
            // Create player snake
            playerSnake = new Snake(WORLD_SIZE / 2, WORLD_SIZE / 2, true);
            window.playerSnake = playerSnake; // Make available globally
            
            // Set player name
            const playerName = localStorage.getItem('playerName') || window.nameGenerator.generateRandomName();
            playerSnake.name = playerName;
            
            snakes.push(playerSnake);
            
            // Initialize leaderboard session for infinite mode
            if (gameMode === 'infinite') {
                leaderboardSubmitted = false;
                lastSubmissionTime = 0; // Reset submission timestamp
                gameSessionStartTime = Date.now();
                
                if (window.leaderboardModule) {
                    window.leaderboardModule.startGameSession().then(sessionId => {
                        currentGameSessionId = sessionId;
                    });
                }
            }
            
            // Create AI snakes (not in cozy mode)
            if (gameMode !== 'cozy') {
                for (let i = 0; i < MAX_AI_SNAKES; i++) {
                    const x = 200 + Math.random() * (WORLD_SIZE - 400);
                    const y = 200 + Math.random() * (WORLD_SIZE - 400);
                    snakes.push(new Snake(x, y, false));
                }
            }
            
            
            // Spawn initial elements using grid distribution
            const baseElements = [0, 1, 2, 3]; // Earth, Water, Air, Fire IDs
            
            // Clear element grid
            elementGrid.clear();
            
            // Spawn elements to reach initial target count
            const initialSpawnCount = Math.floor(TARGET_ELEMENT_COUNT * 0.7); // Start with 70% of target
            
            // Track how many of each base element we spawn
            const baseElementCounts = {
                0: 0, // Earth
                1: 0, // Water
                2: 0, // Air
                3: 0  // Fire
            };
            
            for (let i = 0; i < initialSpawnCount; i++) {
                // ALL initial spawns should be base elements only
                const elementId = baseElements[i % 4];
                baseElementCounts[elementId]++;
                
                // Get random position using grid distribution
                const gridCellsX = Math.ceil(WORLD_SIZE / ELEMENT_GRID_SIZE);
                const gridCellsY = Math.ceil(WORLD_SIZE / ELEMENT_GRID_SIZE);
                const gx = Math.floor(Math.random() * gridCellsX);
                const gy = Math.floor(Math.random() * gridCellsY);
                
                const cellX = gx * ELEMENT_GRID_SIZE;
                const cellY = gy * ELEMENT_GRID_SIZE;
                
                // Random position within cell with margin
                const margin = 50;
                const x = cellX + margin + Math.random() * (ELEMENT_GRID_SIZE - margin * 2);
                const y = cellY + margin + Math.random() * (ELEMENT_GRID_SIZE - margin * 2);
                
                // Ensure within world bounds
                const finalX = Math.max(100, Math.min(WORLD_SIZE - 100, x));
                const finalY = Math.max(100, Math.min(WORLD_SIZE - 100, y));
                
                // Spawn specific base element at position
                spawnElement(elementId, finalX, finalY);
            }
            
            // Verify all base elements were spawned
            
            // Verify all 4 base elements are represented
            const missingElements = [];
            for (let i = 0; i < 4; i++) {
                if (baseElementCounts[i] === 0) {
                    missingElements.push(baseElements[i]);
                }
            }
            
            if (missingElements.length > 0) {
                gameLogger.warn('BASE ELEMENT SPAWN', 'WARNING: Missing base elements:', missingElements);
                gameLogger.warn('BASE ELEMENT SPAWN', 'This should not happen with proper distribution!');
            } else {
            }
            
            
            // Spawn initial void orbs to help players clear banks early
            const INITIAL_VOID_ORB_COUNT = 2; // Start with 2 void orbs on the map
            for (let i = 0; i < INITIAL_VOID_ORB_COUNT; i++) {
                // Distribute initial void orbs across different map sections
                const sectionWidth = WORLD_SIZE / INITIAL_VOID_ORB_COUNT;
                const sectionX = i * sectionWidth;
                
                const x = sectionX + 200 + Math.random() * (sectionWidth - 400);
                const y = 200 + Math.random() * (WORLD_SIZE - 400);
                
                voidOrbs.push(new VoidOrb(x, y));
            }
            
            // Initialize music and sound effects
            initMusic();
            initSoundEffects();
            initPowerUpSounds();
            initCombinationSounds();
            
            // Update discovery log
            updateDiscoveryLog();
            
            // Initialize border particles (desktop only)
            if (!isMobile) {
                initializeBorderParticles();
            }
            
            // Initialize static stars
            initializeStaticStars();
            
            // For mobile, ensure viewport is stable before starting game loop
            if (isMobile) {
                let viewportCheckCount = 0;
                let lastViewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
                let lastViewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                
                const checkViewportStability = () => {
                    const currentWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
                    const currentHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
                    
                    if (currentWidth === lastViewportWidth && currentHeight === lastViewportHeight) {
                        viewportCheckCount++;
                        if (viewportCheckCount >= 3) {
                            // Viewport is stable for 300ms, force resize and start game
                            resizeCanvas(true);
                            gameLoop();
                            return;
                        }
                    } else {
                        // Viewport changed, reset counter
                        viewportCheckCount = 0;
                        lastViewportWidth = currentWidth;
                        lastViewportHeight = currentHeight;
                        resizeCanvas(true); // Force resize on change
                    }
                    
                    // Check again in 100ms
                    setTimeout(checkViewportStability, 100);
                };
                
                // Start checking viewport stability
                checkViewportStability();
            } else {
                // Desktop - start immediately
                gameLoop();
            }
        }
        
        function stopGame() {
            // Track game session end if game was running
            if (gameStarted && window.GameAnalyticsWrapper) {
                const score = playerSnake ? playerSnake.score : 0;
                const discoveries = discoveryCount || 0;
                const deaths = deathCount || 0;
                window.GameAnalyticsWrapper.trackSessionEnd(score, discoveries, deaths);
            }
            
            // Cancel the game loop
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
            
            // Reset game state
            gameStarted = false;
            paused = false;
            
            // Notify unlock manager that game has ended
            if (window.unlockManager && window.unlockManager.onGameEnd) {
                window.unlockManager.onGameEnd();
            }
            
            // Keep orientation locked on mobile - no unlocking
            
            // Clear ALL game objects
            snakes = [];
            playerSnake = null;
            window.playerSnake = null;
            elements = [];
            particles = [];
            voidOrbs = [];
            catalystGems = [];
            alchemyVisionPowerUps = [];
            aiRespawnQueue = [];
            usedAISkins.clear();
            comboStreak = 0;
            playerRespawnTimer = 0;
            
            // Clear the canvas to prevent solid color issue
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
        }
        
        function togglePause() {
            if (!gameStarted) return;
            paused = !paused;
            document.getElementById('pauseOverlay').style.display = paused ? 'flex' : 'none';
            
            // Update music button state
            if (paused) {
                // Update music controls if they exist
                const muteButton = document.getElementById('muteButton');
                if (muteButton) {
                    muteButton.textContent = musicMuted ? '🔇 Unmute' : '🔊 Mute';
                }
                const volumeSlider = document.getElementById('volumeSlider');
                if (volumeSlider) {
                    volumeSlider.value = musicVolume * 100;
                }
                const volumeDisplay = document.getElementById('volumeDisplay');
                if (volumeDisplay) {
                    volumeDisplay.textContent = Math.round(musicVolume * 100) + '%';
                }
                
                // Update skin selection UI
                calculateAvailableUnlocks();
                updateUnlockDisplay();
                buildSkinGrid();
                
                // Update high score display
                document.getElementById('highScoreDisplay').textContent = Math.floor(highScore).toLocaleString();
                
                // Populate discovery journal
                populateDiscoveryJournal();
            }
        }
        
        // Helper function to play UI sound
        function playUISound() {
            try {
                const beepSound = new Audio('sounds/retro-arcade-beep.mp3');
                beepSound.volume = 0.3;
                beepSound.play().catch(() => {});
            } catch (e) {}
        }
        
        window.resumeGame = function() {
            playUISound();
            paused = false;
            document.getElementById('pauseOverlay').style.display = 'none';
        }
        
        // Debug command for element bank issues
        window.debugElementBank = false;
        window.enableElementBankDebug = function() {
            window.debugElementBank = true;
            return 'Element bank debugging enabled';
        }
        
        
        // Tab switching for pause menu
        window.switchTab = function(tabName) {
            // Update button states
            const buttons = document.querySelectorAll('.tab-button');
            buttons.forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            // Update content visibility
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            if (tabName === 'skins') {
                document.getElementById('skinsTab').classList.add('active');
            } else if (tabName === 'journal') {
                document.getElementById('journalTab').classList.add('active');
                // Populate the discovery journal when tab is opened
                populateDiscoveryJournal();
            } else if (tabName === 'howto') {
                document.getElementById('howtoTab').classList.add('active');
            } else if (tabName === 'leaderboard') {
                document.getElementById('leaderboardTab').classList.add('active');
                // Load leaderboard when tab is opened
                window.loadPauseLeaderboard(null, currentPauseLBPeriod);
            }
        }
        
        // Build skin selection UI with rarity-based tabs
        let currentRarityFilter = 'common';
        
        function buildSkinGrid() {
            const grid = document.getElementById('skinGrid');
            if (!grid) {
                gameLogger.error('UI', 'Skin grid element not found!');
                return;
            }
            
            // Update the unlock count display for current rarity
            updateUnlockCountForRarity(currentRarityFilter);
            grid.innerHTML = '';
            
            // Get all skins and filter by rarity
            let skinsToDisplay = Object.keys(skinMetadata).filter(skinId => {
                const skin = skinMetadata[skinId];
                return skin && skin.rarity === currentRarityFilter;
            });
            
            // Sort skins by rarity order and then by name
            const rarityOrder = ['common', 'uncommon', 'rare', 'legendary', 'exotic', 'secret'];
            skinsToDisplay.sort((a, b) => {
                const skinA = skinMetadata[a];
                const skinB = skinMetadata[b];
                if (!skinA || !skinB) return 0;
                
                const rarityIndexA = rarityOrder.indexOf(skinA.rarity);
                const rarityIndexB = rarityOrder.indexOf(skinB.rarity);
                
                if (rarityIndexA !== rarityIndexB) {
                    return rarityIndexA - rarityIndexB;
                }
                
                // Custom sorting for common skins: Default skins first, then alphabetical
                if (skinA.rarity === 'common' && skinB.rarity === 'common') {
                    const defaultSkins = ['snake-default-green', 'chirpy', 'ruby', 'lil-beans'];
                    const aIsDefault = defaultSkins.includes(a);
                    const bIsDefault = defaultSkins.includes(b);
                    
                    // If one is default and one isn't, default comes first
                    if (aIsDefault && !bIsDefault) return -1;
                    if (!aIsDefault && bIsDefault) return 1;
                    
                    // If both are defaults, maintain the order defined in defaultSkins array
                    if (aIsDefault && bIsDefault) {
                        return defaultSkins.indexOf(a) - defaultSkins.indexOf(b);
                    }
                }
                
                return skinA.name.localeCompare(skinB.name);
            });
            
            skinsToDisplay.forEach(skinId => {
                const skinData = skinMetadata[skinId];
                if (!skinData) return;
                
                // Skip secret skins unless on secret tab or unlocked
                if (skinData.rarity === 'secret' && !skinData.unlocked && currentRarityFilter !== 'secret') {
                    return;
                }
                
                const div = document.createElement('div');
                div.className = 'skin-item';
                div.setAttribute('data-skin-id', skinId);
                div.setAttribute('data-rarity', skinData.rarity);
                
                // Add state classes
                if (skinId === currentPlayerSkin) {
                    div.classList.add('equipped');
                }
                
                if (!skinData.unlocked) {
                    div.classList.add('locked');
                    if (availableUnlocks > 0 && !skinData.isBoss) {
                        div.classList.add('unlockable');
                    }
                }
                
                // Create inner container
                const innerContainer = document.createElement('div');
                innerContainer.className = 'skin-item-inner';
                
                // Create image or placeholder
                if (skinData.isBoss && !skinData.unlocked) {
                    // Mystery placeholder for locked boss skins
                    const placeholder = document.createElement('div');
                    placeholder.className = 'skin-mystery';
                    placeholder.innerHTML = '❓';
                    innerContainer.appendChild(placeholder);
                } else {
                    const img = document.createElement('img');
                    img.className = 'skin-image';
                    // Use old ID for file path if available
                    const fileId = window.skinIdConverter ? (window.skinIdConverter.toOldId(skinId) || skinId) : skinId;
                    img.src = skinData.isBoss ? `assets/boss-skins/${fileId}.png` : `skins/${fileId}.png`;
                    img.alt = skinData.name;
                    img.onerror = function() {
                        // Show placeholder on error
                        gameLogger.error('ASSETS', `Failed to load skin image: ${this.src}`);
                        this.style.display = 'none';
                        const placeholder = document.createElement('div');
                        placeholder.className = 'skin-error';
                        placeholder.innerHTML = '⚠️';
                        placeholder.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px;';
                        this.parentNode.appendChild(placeholder);
                    };
                    innerContainer.appendChild(img);
                }
                
                // Add rarity indicator
                const rarityIndicator = document.createElement('div');
                rarityIndicator.className = 'rarity-indicator';
                rarityIndicator.setAttribute('data-rarity', skinData.rarity);
                innerContainer.appendChild(rarityIndicator);
                
                // Add name (hidden for locked boss skins)
                const name = document.createElement('div');
                name.className = 'skin-name';
                name.textContent = (skinData.isBoss && !skinData.unlocked) ? '???' : skinData.name;
                innerContainer.appendChild(name);
                
                // Add lock overlay if locked
                if (!skinData.unlocked) {
                    const lockOverlay = document.createElement('div');
                    lockOverlay.className = 'lock-overlay';
                    const lockIcon = document.createElement('div');
                    lockIcon.className = 'lock-icon';
                    lockIcon.innerHTML = '🔒';
                    lockOverlay.appendChild(lockIcon);
                    innerContainer.appendChild(lockOverlay);
                }
                
                // Add equipped indicator
                if (skinId === currentPlayerSkin) {
                    const equippedBadge = document.createElement('div');
                    equippedBadge.className = 'equipped-badge';
                    equippedBadge.textContent = 'EQUIPPED';
                    innerContainer.appendChild(equippedBadge);
                }
                
                // Add new indicator for unlocked but not viewed skins
                if (skinData.unlocked && !viewedSkins.has(skinId) && skinId !== currentPlayerSkin) {
                    const newBadge = document.createElement('div');
                    newBadge.className = 'new-badge';
                    newBadge.textContent = 'NEW';
                    innerContainer.appendChild(newBadge);
                }
                
                div.appendChild(innerContainer);
                
                // Click handler - open preview modal
                div.onclick = () => openSkinPreview(skinId);
                
                grid.appendChild(div);
            });
        }
        
        // Handle skin selection
        function selectSkin(skinId) {
            const skinData = skinMetadata[skinId];
            
            if (skinData.unlocked) {
                // Already unlocked - just select it
                currentPlayerSkin = skinId;
                if (playerSnake) {
                    playerSnake.skin = skinId;
                }
                
                // Track skin selection analytics
                if (window.GameAnalyticsWrapper) {
                    window.GameAnalyticsWrapper.setSkin(skinId);
                    window.GameAnalyticsWrapper.trackEvent('design', `skin:selected:${skinId}`, 1);
                }
                
                // Update player portrait
                const portrait = document.getElementById('playerPortrait');
                if (portrait) {
                    // Boss skins are in a different directory
                    const fileId = window.skinIdConverter ? (window.skinIdConverter.toOldId(skinId) || skinId) : skinId;
                    if (skinMetadata[skinId].isBoss) {
                        portrait.src = `assets/boss-skins/${fileId}.png`;
                    } else {
                        portrait.src = `skins/${fileId}.png`;
                    }
                    // Dispatch event for mobile UI to update
                    document.dispatchEvent(new Event('skinChanged'));
                    // Also update mobile UI directly if available
                    if (window.unifiedMobileUI) {
                        window.unifiedMobileUI.refreshSkin();
                    }
                }
                saveSkinData();
                buildSkinGrid();
            } else if (availableUnlocks > 0) {
                // Unlock the skin
                skinData.unlocked = true;
                unlockedSkins.add(skinId);
                availableUnlocks--;
                
                // Track skin unlock analytics
                if (window.GameAnalyticsWrapper) {
                    window.GameAnalyticsWrapper.trackSkinUnlock(skinId, 'unlock_token');
                }
                
                // Select the newly unlocked skin
                currentPlayerSkin = skinId;
                if (playerSnake) {
                    playerSnake.skin = skinId;
                }
                // Update player portrait
                const portrait = document.getElementById('playerPortrait');
                if (portrait) {
                    // Boss skins are in a different directory
                    const fileId = window.skinIdConverter ? (window.skinIdConverter.toOldId(skinId) || skinId) : skinId;
                    if (skinMetadata[skinId].isBoss) {
                        portrait.src = `assets/boss-skins/${fileId}.png`;
                    } else {
                        portrait.src = `skins/${fileId}.png`;
                    }
                }
                
                saveSkinData();
                updateUnlockDisplay();
                buildSkinGrid();
                
                // Show unlock message
                showMessage(`Unlocked: ${skinData.name}!`, true);
            }
        }
        
        // Update unlock display
        function updateUnlockDisplay() {
            // Update based on current rarity filter
            if (currentRarityFilter) {
                updateUnlockCountForRarity(currentRarityFilter);
            } else {
                const display = document.getElementById('availableUnlocks');
                if (display) {
                    display.textContent = `Available Unlocks: ${availableUnlocks}`;
                    if (availableUnlocks > 0) {
                        display.style.color = '#4ecdc4';
                    } else {
                        display.style.color = '#AAA';
                    }
                }
            }
        }
        
        // Update unlock count for specific rarity
        function updateUnlockCountForRarity(rarity) {
            const display = document.getElementById('availableUnlocks');
            if (!display) return;
            
            // Count unlocked and total skins for this rarity
            let unlockedCount = 0;
            let totalCount = 0;
            
            Object.entries(skinMetadata).forEach(([skinId, skinData]) => {
                if (skinData.rarity === rarity) {
                    totalCount++;
                    if (skinData.unlocked) {
                        unlockedCount++;
                    }
                }
            });
            
            // Format rarity name
            const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);
            display.textContent = `${rarityName} Skins: ${unlockedCount}/${totalCount} Unlocked`;
            display.style.color = '#4ecdc4';
        }
        
        // Custom event dispatching helper
        function dispatchGameEvent(eventName, detail = {}) {
            const event = new CustomEvent(eventName, { detail });
            window.dispatchEvent(event);
            gameLogger.debug('Game Event', `${eventName}`, detail);
        }
        
        // Rarity tab functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Re-merge skin data after all scripts are loaded
            if (window.SKIN_DATA && window.skinIdConverter) {
                const mergedMetadata = {};
                
                Object.keys(skinMetadata).forEach(oldId => {
                    mergedMetadata[oldId] = { ...skinMetadata[oldId] };
                    const newId = window.skinIdConverter.toNewId(oldId);
                    if (newId && window.SKIN_DATA[newId]) {
                        mergedMetadata[oldId] = {
                            ...mergedMetadata[oldId],
                            ...window.SKIN_DATA[newId],
                            colors: skinMetadata[oldId].colors,
                            unlocked: skinMetadata[oldId].unlocked
                        };
                    }
                });
                
                Object.keys(window.SKIN_DATA).forEach(newId => {
                    const oldId = window.skinIdConverter.toOldId(newId);
                    if (!oldId || !mergedMetadata[oldId]) {
                        mergedMetadata[newId] = {
                            ...window.SKIN_DATA[newId],
                            unlocked: false,
                            colors: window.SKIN_DATA[newId].colors || ['#888888', '#666666']
                        };
                    }
                });
                
                skinMetadata = mergedMetadata;
            }
            
            const rarityTabs = document.querySelectorAll('.rarity-tab');
            rarityTabs.forEach(tab => {
                // Add rarity-specific class for styling
                const rarity = tab.getAttribute('data-rarity');
                tab.classList.add(rarity);
                
                tab.addEventListener('click', function() {
                    playUISound();
                    // Update active tab
                    rarityTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update filter and rebuild grid
                    currentRarityFilter = this.getAttribute('data-rarity');
                    buildSkinGrid();
                    
                    // Update unlock count display
                    updateUnlockCountForRarity(currentRarityFilter);
                });
            });
            
            // Initialize player stats and unlock manager
            if (window.PlayerStats) {
                window.PlayerStats.initialize();
            }
            if (window.unlockManager) {
                window.unlockManager.initialize();
            }
        });
        
        // Open skin preview modal
        function openSkinPreview(skinId) {
            const skinData = skinMetadata[skinId];
            if (!skinData) return;
            
            // Mark skin as viewed if unlocked
            if (skinData.unlocked && !viewedSkins.has(skinId)) {
                viewedSkins.add(skinId);
                saveSkinData();
                // Rebuild grid to remove "NEW" badge
                buildSkinGrid();
            }
            
            // Play beep sound when opening modal
            try {
                const beepSound = new Audio('sounds/retro-arcade-beep.mp3');
                beepSound.volume = 0.3;
                beepSound.play().catch(() => {});
            } catch (e) {}
            
            const modal = document.getElementById('skinPreviewModal');
            const nameEl = document.getElementById('previewSkinName');
            const rarityEl = document.getElementById('previewRarity');
            const bioEl = document.getElementById('previewBio');
            const unlockCriteriaEl = document.getElementById('previewUnlockCriteria');
            const unlockTextEl = document.getElementById('unlockText');
            const progressBarEl = document.getElementById('unlockProgress');
            const progressTextEl = document.getElementById('progressText');
            const equipButton = document.getElementById('equipButton');
            const unlockButton = document.getElementById('unlockButton');
            
            // Update modal content
            nameEl.textContent = (skinData.isBoss && !skinData.unlocked) ? '???' : skinData.name;
            
            // Update rarity badge
            const rarityBadge = rarityEl.querySelector('.rarity-text');
            const rarityStars = rarityEl.querySelector('.rarity-stars');
            if (skinData.rarity && window.RARITY_CONFIG) {
                const rarityConfig = window.RARITY_CONFIG[skinData.rarity];
                rarityBadge.textContent = skinData.rarity.charAt(0).toUpperCase() + skinData.rarity.slice(1);
                rarityEl.style.backgroundColor = rarityConfig.color;
                rarityStars.textContent = '★'.repeat(rarityConfig.stars);
            }
            
            bioEl.textContent = (skinData.isBoss && !skinData.unlocked) ? 'Defeat this boss to unlock their skin!' : skinData.bio;
            
            // Handle unlock criteria display
            if (skinData.unlocked) {
                // Show unlock criteria even for unlocked skins, but hide progress bar
                unlockCriteriaEl.style.display = 'block';
                equipButton.style.display = 'block';
                unlockButton.style.display = 'none';
                
                // Show unlock description without progress
                if (skinData.unlockCriteria && skinData.unlockCriteria.description) {
                    unlockTextEl.textContent = skinData.unlockCriteria.description;
                }
                
                // Hide progress bar and text for unlocked skins
                const progressContainer = unlockCriteriaEl.querySelector('.progress-bar');
                const progressText = document.getElementById('progressText');
                if (progressContainer) progressContainer.style.display = 'none';
                if (progressText) progressText.style.display = 'none';
                
                if (skinId === currentPlayerSkin) {
                    equipButton.textContent = 'Equipped';
                    equipButton.disabled = true;
                } else {
                    equipButton.textContent = 'Equip';
                    equipButton.disabled = false;
                    equipButton.onclick = () => {
                        // Play beep sound when equipping
                        try {
                            const beepSound = new Audio('sounds/retro-arcade-beep.mp3');
                            beepSound.volume = 0.3;
                            beepSound.play().catch(() => {});
                        } catch (e) {}
                        
                        selectSkin(skinId);
                        equipButton.textContent = 'Equipped';
                        equipButton.disabled = true;
                        buildSkinGrid();
                    };
                }
            } else {
                unlockCriteriaEl.style.display = 'block';
                
                // Show progress bar and text for locked skins
                const progressContainer = unlockCriteriaEl.querySelector('.progress-bar');
                const progressText = document.getElementById('progressText');
                if (progressContainer) progressContainer.style.display = 'block';
                if (progressText) progressText.style.display = 'block';
                
                if (window.unlockManager) {
                    // Try to get unlock criteria description
                    let unlockDescription = 'Complete challenge to unlock';
                    if (skinData.unlockCriteria && skinData.unlockCriteria.description) {
                        unlockDescription = skinData.unlockCriteria.description;
                    }
                    
                    unlockTextEl.textContent = unlockDescription;
                    
                    const progress = window.unlockManager.getUnlockProgress(skinId);
                    
                    if (progress && progress.max > 0) {
                        progressBarEl.style.width = `${(progress.current / progress.max) * 100}%`;
                        progressTextEl.textContent = `${progress.current}/${progress.max}`;
                    } else {
                        progressBarEl.style.width = '0%';
                        progressTextEl.textContent = '0/0';
                    }
                } else {
                    unlockTextEl.textContent = 'Unlock system not available';
                }
                
                equipButton.style.display = 'none';
                
                // Show unlock button if we have tokens and it's not a boss skin
                if (availableUnlocks > 0 && !skinData.isBoss) {
                    unlockButton.style.display = 'block';
                    unlockButton.onclick = () => {
                        selectSkin(skinId);
                        modal.style.display = 'none';
                    };
                } else {
                    unlockButton.style.display = 'none';
                }
            }
            
            // Draw skin preview
            drawSkinPreview(skinId);
            
            // Show modal
            modal.style.display = 'flex';
            
            // Close modal handlers
            const closeBtn = modal.querySelector('.modal-close');
            closeBtn.onclick = () => modal.style.display = 'none';
            
            modal.onclick = (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }
        
        // Show unlock notification
        function showUnlockNotification(skinId) {
            const skinData = skinMetadata[skinId];
            if (!skinData) return;
            
            const container = document.getElementById('unlockNotificationContainer');
            const notification = document.createElement('div');
            notification.className = `unlock-notification ${skinData.rarity}`;
            
            notification.innerHTML = `
                <div class="unlock-content">
                    <div class="unlock-header">
                        <span class="unlock-icon">🔓</span>
                        <span class="unlock-title">NEW SKIN UNLOCKED!</span>
                    </div>
                    <div class="unlock-skin-info">
                        <img src="${skinData.isBoss ? `assets/boss-skins/${skinId}.png` : `skins/${skinId}.png`}" 
                             alt="${skinData.name}" class="unlock-skin-image">
                        <div class="unlock-details">
                            <h3 class="unlock-skin-name">${skinData.name}</h3>
                            <div class="unlock-rarity ${skinData.rarity}">
                                <span class="rarity-stars">${'★'.repeat(window.RARITY_CONFIG[skinData.rarity].stars)}</span>
                                <span class="rarity-text">${skinData.rarity.toUpperCase()}</span>
                            </div>
                            <p class="unlock-bio">${skinData.bio}</p>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(notification);
            
            // Auto-remove after animation
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 500);
            }, 5000);
            
            // Play unlock sound based on rarity
            if (window.playUnlockSound) {
                window.playUnlockSound(skinData.rarity);
            }
        }
        
        // Listen for unlock events from UnlockManager
        window.addEventListener('skinUnlocked', (event) => {
            showUnlockNotification(event.detail.skinId);
            
            // Refresh the skin grid if the pause menu is open
            const pauseMenu = document.getElementById('pauseMenu');
            if (pauseMenu && pauseMenu.style.display !== 'none') {
                // Reload skin data to sync with UnlockManager
                loadSkinData();
                // Rebuild the skin grid to show newly unlocked skin
                buildSkinGrid();
            }
        });
        
        // Draw animated skin preview
        function drawSkinPreview(skinId) {
            const canvas = document.getElementById('skinPreviewCanvas');
            const ctx = canvas.getContext('2d');
            const skinData = skinMetadata[skinId];
            
            if (!skinData || (skinData.isBoss && !skinData.unlocked)) {
                // Draw mystery placeholder for locked boss skins
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fff';
                ctx.font = '48px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('❓', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            // Show loading indicator
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#4ecdc4';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
            
            // Load and draw the skin image with rotation animation
            const img = new Image();
            const fileId = window.skinIdConverter ? (window.skinIdConverter.toOldId(skinId) || skinId) : skinId;
            const imagePath = skinData.isBoss ? `assets/boss-skins/${fileId}.png` : `skins/${fileId}.png`;
            
            let wobbleTime = 0;
            let animationId = null;
            
            function animate() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.translate(canvas.width / 2, canvas.height / 2);
                
                // Create subtle wobble effect
                const wobbleAngle = Math.sin(wobbleTime) * 0.05; // Max 0.05 radians (~3 degrees)
                ctx.rotate(wobbleAngle);
                
                const maxSize = Math.min(canvas.width, canvas.height) * 0.8;
                
                // Preserve aspect ratio
                const aspectRatio = img.width / img.height;
                let drawWidth = maxSize;
                let drawHeight = maxSize;
                
                if (aspectRatio > 1) {
                    // Wider than tall
                    drawHeight = maxSize / aspectRatio;
                } else {
                    // Taller than wide
                    drawWidth = maxSize * aspectRatio;
                }
                
                ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
                
                ctx.restore();
                wobbleTime += 0.02; // Slow wobble speed
                
                if (document.getElementById('skinPreviewModal').style.display === 'flex') {
                    animationId = requestAnimationFrame(animate);
                }
            }
            
            // Wait for image to load before starting animation
            img.onload = function() {
                // Clear loading text
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Start animation
                animate();
            };
            
            img.onerror = function() {
                // Show error message
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#e74c3c';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('Failed to load image', canvas.width / 2, canvas.height / 2);
                gameLogger.error('ASSETS', 'Failed to load skin image:', imagePath);
            };
            
            // Set the source after setting up handlers
            img.src = imagePath;
        }
        
        // Populate discovery journal with discovered elements
        function populateDiscoveryJournal() {
            const grid = document.getElementById('discoveryGrid');
            if (!grid) {
                gameLogger.error('UI', 'Discovery grid element not found!');
                return;
            }
            
            grid.innerHTML = '';
            
            // Check if element loader is ready
            if (!window.elementLoader || !window.elementLoader.elements) {
                gameLogger.error('ELEMENT LOADER', 'Element loader not ready');
                return;
            }
            
            // Update discovery count
            const countElement = document.getElementById('discoveryCount');
            if (countElement) {
                countElement.textContent = `All-Time Discoveries: ${allTimeDiscoveries.size}`;
            }
            
            // Use allTimeDiscoveries for persistent journal
            const sortedDiscoveries = Array.from(allTimeDiscoveries.entries()).sort((a, b) => {
                const elementA = window.elementLoader.elements.get(parseInt(a[0]));
                const elementB = window.elementLoader.elements.get(parseInt(b[0]));
                const nameA = elementA?.n || 'Unknown';
                const nameB = elementB?.n || 'Unknown';
                return nameA.localeCompare(nameB);
            });
            
            sortedDiscoveries.forEach(([elementId, recipe]) => {
                const elementData = window.elementLoader.elements.get(parseInt(elementId));
                if (!elementData) return;
                
                const div = document.createElement('div');
                div.className = 'discovery-item';
                div.dataset.name = elementData.n.toLowerCase();
                
                // Element emoji/symbol
                const symbol = document.createElement('div');
                symbol.className = 'element-symbol';
                symbol.textContent = window.elementLoader.getEmojiForElement(parseInt(elementId), elementData.e);
                
                // Element name
                const name = document.createElement('div');
                name.className = 'element-name';
                name.textContent = elementData.n;
                
                div.appendChild(symbol);
                div.appendChild(name);
                
                grid.appendChild(div);
            });
        }
        
        // filterDiscoveries function removed - search bar no longer present
        
        // Fixed timestep constants
        const FIXED_TIMESTEP = 1000 / 60; // 60 FPS fixed timestep (16.67ms)
        const MAX_UPDATES = 5; // Prevent spiral of death
        
        function gameLoop(currentTime) {
            if (!gameStarted) {
                animationFrameId = null;
                return;
            }
            
            animationFrameId = requestAnimationFrame(gameLoop);
            
            if (paused) return;
            
            // Don't render if canvas is not visible
            if (canvas.style.opacity === '0') return;
            
            // Initialize lastTime on first frame
            if (lastTime === 0) {
                lastTime = currentTime;
                return;
            }
            
            // Calculate elapsed time
            const elapsed = currentTime - lastTime;
            
            // Calculate frame time
            if (!isFinite(currentTime)) {
                gameLogger.error('GAME LOOP', 'currentTime is not finite:', currentTime);
                return;
            }
            const frameTime = Math.min(elapsed, 250); // Cap at 250ms (4 FPS min)
            lastTime = currentTime;
            
            // Add to accumulator
            accumulator += frameTime;
            
            // Check for NaN
            if (!isFinite(accumulator) || !isFinite(frameTime)) {
                gameLogger.error('GAME LOOP', 'Accumulator or frameTime became NaN!', 'frameTime:', frameTime, 'currentTime:', currentTime, 'lastTime:', lastTime, 'accumulator:', accumulator);
                accumulator = 0;
                lastTime = currentTime;
                return;
            }
            
            // Calculate FPS
            frameCount++;
            if (currentTime - lastFpsUpdate > 1000) { // Update every second
                currentFPS = frameCount;
                frameCount = 0;
                lastFpsUpdate = currentTime;
                
                // Update FPS display
                const fpsElement = document.getElementById('fpsCounter');
                if (fpsElement) {
                    fpsElement.textContent = `FPS: ${currentFPS}`;
                }
            }
            
            // Update animation time for border effects
            animationTime = currentTime * 0.001; // Convert to seconds
            
            // Fixed timestep updates
            let updates = 0;
            while (accumulator >= FIXED_TIMESTEP && updates < MAX_UPDATES) {
                // Update game objects with fixed timestep (1.0 = one 60fps frame)
                // Update all snakes - staggering removed due to complexity
                for (let i = 0; i < snakes.length; i++) {
                    const snake = snakes[i];
                    if (snake.alive || snake.isDying) {
                        snake.update(1.0);
                    }
                }
                elementPool.update(1.0);
                particlePool.update(1.0);
                if (explosionManager) {
                    explosionManager.update(16.67); // Update explosions with fixed timestep
                }
                
                // Update border particles (desktop only)
                if (!isMobile) {
                    borderParticles.forEach(particle => particle.update(1.0));
                }
                
                // Update shooting stars (desktop only)
                if (!isMobile) {
                    shootingStars = shootingStars.filter(star => star.update(1.0));
                    
                    // Spawn shooting star occasionally (3-5 seconds)
                    if (currentTime - lastShootingStarTime > (3000 + Math.random() * 2000) && shootingStars.length < 3) {
                        shootingStars.push(new ShootingStar());
                        lastShootingStarTime = currentTime;
                    }
                }
                
                // Update spaceships
                if (spaceshipManager) {
                    spaceshipManager.update();
                }
                
                // Check collisions
                checkCollisions();
                
                // Store AI snake data before removing dead snakes
                snakes.forEach(snake => {
                    if (!snake.alive && !snake.isPlayer) {
                        // Store AI snake data for respawning with score
                        const snakeId = snake.name || `AI_${Date.now()}`;
                        aiSnakeDataMap.set(snakeId, {
                            score: snake.score,
                            kills: snake.kills,
                            discoveries: snake.discoveries,
                            elementCapacity: snake.elementCapacity,
                            personality: snake.personality,
                            name: snake.name,
                            skin: snake.skin
                        });
                    }
                });
                
                // Remove dead snakes (but keep dying ones for animation)
                snakes = snakes.filter(snake => snake.alive || snake.isDying);
                
                // Spawn new elements to maintain target count (increased during boss battles)
                const currentElementCount = elementPool.getActiveCount();
                // Special case for Osseus - limit to 2x spawn rate
                let bossSpawnMultiplier = 1;
                if (bossEncounterActive) {
                    if (currentBoss && currentBoss.elementId === 0) { // Osseus (Earth element)
                        bossSpawnMultiplier = 2; // Cap at 2x for Osseus
                    } else {
                        bossSpawnMultiplier = 3; // 3x for other bosses
                    }
                }
                
                if (currentElementCount < TARGET_ELEMENT_COUNT - 20) {
                    // Only spawn if significantly below target
                    const elementsToSpawn = Math.min(2 * bossSpawnMultiplier, Math.floor((TARGET_ELEMENT_COUNT - currentElementCount) / 10));
                    for (let i = 0; i < elementsToSpawn; i++) {
                        if (Math.random() < 0.8) { // 80% chance per spawn
                            if (bossEncounterActive && currentBoss && Math.random() < 0.15) {
                                // Reduced from 50% to 15% chance to spawn boss's element type during boss battles
                                spawnElement(currentBoss.elementId);
                            } else {
                                spawnElementWithGridDistribution();
                            }
                        }
                    }
                } else if (Math.random() < (0.05 * bossSpawnMultiplier) && currentElementCount < TARGET_ELEMENT_COUNT) {
                    // Occasional spawns to replace consumed elements (increased during boss battles)
                    if (bossEncounterActive && currentBoss && Math.random() < 0.15) {
                        // Reduced from 50% to 15% chance to spawn boss's element type during boss battles
                        spawnElement(currentBoss.elementId);
                    } else {
                        spawnElementWithGridDistribution();
                    }
                }
                
                // Update AlchemyVision timer
                if (alchemyVisionActive) {
                    alchemyVisionTimer -= FIXED_TIMESTEP;
                    if (alchemyVisionTimer <= 0) {
                        alchemyVisionActive = false;
                        alchemyVisionTimer = 0;
                        // Clear any remaining power-ups when one expires
                        alchemyVisionPowerUps = [];
                    }
                }
                
                // AlchemyVision power-ups removed
                // if (alchemyVisionPowerUps.length === 0 && Date.now() - lastAlchemyVisionSpawn >= ALCHEMY_VISION_SPAWN_INTERVAL) {
                //     // Spawn multiple power-ups spread across the map
                //     for (let i = 0; i < ALCHEMY_VISION_SPAWN_COUNT; i++) {
                //         // Divide the map into sections to spread out spawns
                //         const sectionWidth = WORLD_SIZE / Math.ceil(Math.sqrt(ALCHEMY_VISION_SPAWN_COUNT));
                //         const sectionHeight = WORLD_SIZE / Math.ceil(Math.sqrt(ALCHEMY_VISION_SPAWN_COUNT));
                //         
                //         // Random position within each section
                //         const sectionX = (i % Math.ceil(Math.sqrt(ALCHEMY_VISION_SPAWN_COUNT))) * sectionWidth;
                //         const sectionY = Math.floor(i / Math.ceil(Math.sqrt(ALCHEMY_VISION_SPAWN_COUNT))) * sectionHeight;
                //         
                //         const x = sectionX + 100 + Math.random() * (sectionWidth - 200);
                //         const y = sectionY + 100 + Math.random() * (sectionHeight - 200);
                //         
                //         alchemyVisionPowerUps.push(new AlchemyVision(x, y));
                //     }
                //     lastAlchemyVisionSpawn = Date.now();
                // }
                
                // Update AlchemyVision power-ups (keeping for existing ones to expire)
                alchemyVisionPowerUps.forEach(powerUp => powerUp.update(1.0));
                
                // Spawn Void Orbs to maintain count with better distribution
                if (voidOrbs.length < VOID_ORB_SPAWN_COUNT && Date.now() - lastVoidOrbSpawn >= VOID_ORB_SPAWN_INTERVAL / VOID_ORB_SPAWN_COUNT) {
                    // Try to find a position that's not too close to existing void orbs
                    let attempts = 0;
                    let validPosition = false;
                    let x, y;
                    const MIN_DISTANCE_BETWEEN_ORBS = 500; // Minimum distance between void orbs
                    
                    while (!validPosition && attempts < 20) {
                        // Divide map into grid sections for better initial distribution
                        const gridSize = Math.ceil(Math.sqrt(VOID_ORB_SPAWN_COUNT));
                        const sectionWidth = WORLD_SIZE / gridSize;
                        const sectionHeight = WORLD_SIZE / gridSize;
                        
                        // Pick a random section
                        const sectionX = Math.floor(Math.random() * gridSize) * sectionWidth;
                        const sectionY = Math.floor(Math.random() * gridSize) * sectionHeight;
                        
                        // Random position within section with buffer from edges
                        x = sectionX + 100 + Math.random() * (sectionWidth - 200);
                        y = sectionY + 100 + Math.random() * (sectionHeight - 200);
                        
                        // Ensure position is within world bounds
                        x = Math.max(100, Math.min(WORLD_SIZE - 100, x));
                        y = Math.max(100, Math.min(WORLD_SIZE - 100, y));
                        
                        // Check distance from existing void orbs
                        validPosition = true;
                        for (const orb of voidOrbs) {
                            const dx = orb.x - x;
                            const dy = orb.y - y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < MIN_DISTANCE_BETWEEN_ORBS) {
                                validPosition = false;
                                break;
                            }
                        }
                        
                        attempts++;
                    }
                    
                    // Spawn the void orb at the found position
                    voidOrbs.push(new VoidOrb(x, y));
                    lastVoidOrbSpawn = Date.now();
                }
                
                // Update Void Orbs
                voidOrbs.forEach(orb => orb.update(1.0));
                
                // Spawn Catalyst Gems to maintain count (more spread out)
                if (catalystGems.length < CATALYST_GEM_SPAWN_COUNT && Date.now() - lastCatalystGemSpawn >= CATALYST_GEM_SPAWN_INTERVAL / CATALYST_GEM_SPAWN_COUNT) {
                    // Divide map into sections for better spread
                    const sectionWidth = WORLD_SIZE / CATALYST_GEM_SPAWN_COUNT;
                    const sectionIndex = catalystGems.length;
                    const sectionX = sectionIndex * sectionWidth;
                    
                    const x = sectionX + 100 + Math.random() * (sectionWidth - 200);
                    const y = 100 + Math.random() * (WORLD_SIZE - 200);
                    catalystGems.push(new CatalystGem(x, y));
                    lastCatalystGemSpawn = Date.now();
                }
                
                // Update Catalyst Gems
                catalystGems.forEach(gem => gem.update(1.0));
                
                // Update Asteroids
                asteroids.forEach(asteroid => asteroid.update(1.0));
                
                // Boss spawn check (classic and infinite modes only, not in cozy mode)
                if ((gameMode === 'classic' || gameMode === 'infinite') && !bossEncounterActive && playerSnake && playerSnake.alive) {
                    // Check if player has reached the next boss spawn score
                    if (playerSnake.score >= nextBossSpawnScore && nextBossSpawnScore > 0) {
                        spawnBoss();
                        bossSpawnCount++;
                    }
                }
                
                // Update boss encounter
                if (bossEncounterActive && currentBoss) {
                    // Update boss projectiles
                    updateBossProjectiles(1.0);
                    updateShockwaves(1.0);
                    updateBossFissures(1.0);
                    
                    // Update damage numbers
                    updateDamageNumbers(1.0);
                    
                    // Update element vacuum
                    if (elementVacuumActive) {
                        elementVacuumTimer -= 1.0;
                        if (elementVacuumTimer <= 0) {
                            endElementVacuum();
                        } else {
                            // Update vacuum effect
                            updateElementVacuum(1.0);
                        }
                    }
                    
                    // Update screen shake
                    if (bossScreenShakeTimer > 0) {
                        bossScreenShakeTimer -= 1.0;
                    }
                    
                    // Check for elemental resonance damage
                    if (currentBoss.alive && currentBoss.stunTimer <= 0) {
                        checkBossElementalDamage();
                    }
                }
                
                accumulator -= FIXED_TIMESTEP;
                updates++;
            }
            
            // Handle AI snake respawning with cooldown (disabled in cozy mode)
            if (gameMode !== 'cozy') {
                const aiSnakes = snakes.filter(s => !s.isPlayer && s.alive).length;
                
                // Process respawn queue
                aiRespawnQueue = aiRespawnQueue.filter(respawnTime => {
                if (currentTime >= respawnTime && aiSnakes < MAX_AI_SNAKES) {
                    // Spawn new AI snake
                    const x = 200 + Math.random() * (WORLD_SIZE - 400);
                    const y = 200 + Math.random() * (WORLD_SIZE - 400);
                    const newAISnake = new Snake(x, y, false);
                    
                    // Try to restore data from a dead AI snake
                    if (aiSnakeDataMap.size > 0) {
                        // Get the first available AI snake data
                        const [snakeId, snakeData] = aiSnakeDataMap.entries().next().value;
                        
                        // Restore the AI snake's score and stats (no penalty for AI)
                        newAISnake.score = snakeData.score;
                        newAISnake.kills = snakeData.kills;
                        newAISnake.discoveries = snakeData.discoveries;
                        newAISnake.elementCapacity = snakeData.elementCapacity;
                        // Only restore personality if not a boss (safety check)
                        if (!newAISnake.isBoss && snakeData.personality) {
                            newAISnake.personality = snakeData.personality;
                            newAISnake.personalityColor = PERSONALITY_COLORS[snakeData.personality.name];
                        }
                        newAISnake.name = snakeData.name;
                        newAISnake.skin = snakeData.skin;
                        
                        // Remove used data
                        aiSnakeDataMap.delete(snakeId);
                    }
                    
                    snakes.push(newAISnake);
                    return false; // Remove from queue
                }
                return true; // Keep in queue
            });
            
            // Check if we need to add dead snakes to respawn queue
            if (aiSnakes < MAX_AI_SNAKES) {
                const deadAICount = MAX_AI_SNAKES - aiSnakes - aiRespawnQueue.length;
                for (let i = 0; i < deadAICount; i++) {
                    aiRespawnQueue.push(currentTime + AI_RESPAWN_COOLDOWN);
                }
            }
            } // End of cozy mode check
            
            // Handle player death and respawn
            if (playerSnake && (playerSnake.isDying || !playerSnake.alive) && !isRespawning) {
                // Start death sequence when player starts dying or is already dead
                // Don't start if we're about to respawn or respawn is in progress
                if (!deathSequenceActive && (playerSnake.isDying || !playerSnake.alive) && playerRespawnTimer <= 0 && !deathProcessed && !isRespawning) {
                    deathSequenceActive = true;
                    deathSequenceTimer = 0;
                    window.deathSequenceActive = true;
                    window.deathSequenceTimer = 0;
                    
                    // Save snake state for respawn
                    savedSnakeScore = playerSnake.score;
                    savedSnakeLength = playerSnake.segments.length; // Use segments.length not .length
                    window.savedSnakeScore = savedSnakeScore;
                    window.savedSnakeLength = savedSnakeLength;
                    
                    // Set death processed flag
                    deathProcessed = true;
                    window.deathProcessed = true;
                    
                    // Don't set respawn timer here - wait for player input
                    // playerRespawnTimer = 3000; // 3 seconds
                    // window.playerRespawnTimer = playerRespawnTimer;
                    
                    // Initialize camera animation
                    deathCameraAnimation.active = true;
                    deathCameraAnimation.startZoom = cameraZoom;
                    deathCameraAnimation.targetZoom = cameraZoom * 0.7; // Zoom out by 30%
                    deathCameraAnimation.currentZoom = cameraZoom;
                    deathCameraAnimation.progress = 0;
                    
                    // Reset killstreak on player death
                    if (window.killstreakManager) {
                        window.killstreakManager.onPlayerDeath();
                    }
                    
                    // Increment death count at death start (Classic mode only)
                    if (gameMode === 'classic' && !window.deathCountIncremented) {
                        deathCount++;
                        window.deathCountIncremented = true;
                            deathCount,
                            revivesRemaining,
                            deathSequenceActive,
                            deathProcessed,
                            gameMode,
                    
                    // AUTO-SUBMIT SCORE ON DEATH
                    setTimeout(() => {
                        if (gameMode === 'classic' && playerSnake.score > 0 && canSubmitScore()) {
                            const playerName = localStorage.getItem('playerName') || 'Anonymous';
                            const playTime = gameSessionStartTime ? Math.floor((Date.now() - gameSessionStartTime) / 1000) : 0;
                            
                            gameLogger.debug('AUTO-SUBMIT', 'Attempting automatic score submission...');
                            
                            if (window.leaderboardModule && window.leaderboardModule.submitScore) {
                                window.leaderboardModule.submitScore(
                                    playerName,
                                    Math.floor(playerSnake.score),
                                    playerDiscoveredElements.size,
                                    playTime,
                                    playerSnake.kills
                                ).then(result => {
                                    gameLogger.debug('AUTO-SUBMIT', 'Score submitted!', result);
                                    if (result !== null && result !== undefined) {
                                        if (typeof result === 'number') {
                                            const globalRankEl = document.getElementById('globalRank');
                                            if (globalRankEl) {
                                                globalRankEl.textContent = `#${result}`;
                                                gameLogger.debug('AUTO-SUBMIT', 'Updated rank display to:', `#${result}`);
                                            }
                                        } else if (result === 'Submitted') {
                                            const globalRankEl = document.getElementById('globalRank');
                                            if (globalRankEl) {
                                                globalRankEl.textContent = 'Submitted';
                                                gameLogger.debug('AUTO-SUBMIT', 'Score submitted (no rank available)');
                                            }
                                        }
                                        // Already set to true above
                                    } else {
                                        gameLogger.error('AUTO-SUBMIT', 'Invalid result:', result);
                                        // Reset flag on failure
                                        leaderboardSubmitted = false;
                                    }
                                }).catch(err => {
                                    gameLogger.error('AUTO-SUBMIT', 'Failed:', err);
                                    // Reset flag on error
                                    leaderboardSubmitted = false;
                                });
                            } else {
                                gameLogger.error('AUTO-SUBMIT', 'Supabase module not loaded!');
                            }
                        }
                    }, 100); // Small delay to ensure UI is ready
                    
                    // Also dispatch game end event
                    dispatchGameEvent('gameEnd', {
                        score: playerSnake.score,
                        discoveries: playerSnake.discoveries,
                        kills: playerSnake.kills,
                        playTime: gameSessionStartTime ? Math.floor((Date.now() - gameSessionStartTime) / 1000) : 0,
                        finalRank: snakes.filter(s => s.alive).length + 1
                    });
                    
                    // Track death event
                    if (leaderboardModule && leaderboardModule.addGameEvent) {
                        leaderboardModule.addGameEvent('death', {
                            score: playerSnake.score,
                            discoveries: playerSnake.discoveries,
                            kills: playerSnake.kills,
                            length: playerSnake.segments.length,
                            play_time: gameSessionStartTime ? Math.floor((Date.now() - gameSessionStartTime) / 1000) : 0
                        });
                    }
                    } // End of death sequence completion
                }
                
                // Update death sequence timer
                if (deathSequenceActive) {
                    deathSequenceTimer += frameTime;
                    window.deathSequenceTimer = deathSequenceTimer;
                    
                    // Update camera zoom animation (200ms to 1200ms)
                    if (deathSequenceTimer >= 200 && deathSequenceTimer <= 1200) {
                        const animProgress = (deathSequenceTimer - 200) / 1000; // 0 to 1 over 1 second
                        deathCameraAnimation.progress = Math.min(1, animProgress);
                        
                        // Smooth easing function
                        const easedProgress = 1 - Math.pow(1 - deathCameraAnimation.progress, 3);
                        deathCameraAnimation.currentZoom = deathCameraAnimation.startZoom + 
                            (deathCameraAnimation.targetZoom - deathCameraAnimation.startZoom) * easedProgress;
                        cameraZoom = deathCameraAnimation.currentZoom;
                    }
                    
                    // Check if death sequence is complete
                    if (deathSequenceTimer >= DEATH_SEQUENCE_DURATION) {
                        deathSequenceActive = false;
                        window.deathSequenceActive = false;
                        deathCameraAnimation.active = false;
                        waitingForRespawnInput = true; // Now waiting for player to click respawn
                        window.waitingForRespawnInput = true;
                        gameLogger.debug('DEATH', 'Death sequence complete, showing death screen');
                    }
                } // End of deathSequenceActive check
            } // End of player death check - MOVED HERE
            
            // Update respawn timer (NOW OUTSIDE death check)
            if (playerRespawnTimer > 0) {
                playerRespawnTimer -= frameTime;
                window.playerRespawnTimer = playerRespawnTimer;
                
                // Debug why respawn might be failing
                if (playerRespawnTimer <= 100 && playerRespawnTimer > 0) {
                        gameLogger.debug('RESPAWN', 'RESPAWN DEBUG', {
                            playerRespawnTimer,
                            deathSequenceActive,
                            playerAlive: playerSnake.alive,
                            playerDying: playerSnake.isDying,
                            isRespawning
                        });
                    }
                }
                
                // Also check negative timer values
                if (playerRespawnTimer < 0) {
                }
                
            // Handle respawn when timer reaches zero
            // Check isRespawning to allow forced respawn to proceed
            if (playerSnake && playerRespawnTimer <= 0 && (!deathSequenceActive || isRespawning) && !playerSnake.alive && !waitingForRespawnInput) {
                    // Store previous score before creating new snake
                    const previousScore = playerSnake.score;
                    const previousCapacity = playerSnake.elementCapacity;
                    const previousDiscoveries = playerSnake.discoveries;
                    const previousKills = playerSnake.kills;
                    
                    // Debug logging
                    
                    // Remove ALL player snakes from array (in case of duplicates)
                    const oldPlayerCount = snakes.filter(snake => snake.isPlayer).length;
                    snakes = snakes.filter(snake => !snake.isPlayer);
                    
                    // Double check that playerSnake is cleared
                    if (snakes.some(s => s.isPlayer)) {
                        gameLogger.error('RESPAWN', 'ERROR: Player snake still exists after cleanup!');
                        snakes = snakes.filter(snake => !snake.isPlayer);
                    }
                    
                    
                    // Respawn player at center
                    playerSnake = new Snake(WORLD_SIZE / 2, WORLD_SIZE / 2, true);
                    window.playerSnake = playerSnake; // Make available globally
                    
                    // Set player name
                    const playerName = localStorage.getItem('playerName') || window.nameGenerator.generateRandomName();
                    playerSnake.name = playerName;
                    
                    // Check if this is a revive or respawn
                    if (gameMode === 'classic' || window.isReviving) {
                        // Classic mode revive or Infinite mode respawn: restore full score and length
                        playerSnake.score = savedSnakeScore;
                        
                        // Restore snake to saved length
                        const targetLength = Math.max(5, savedSnakeLength); // Minimum 5 segments
                        while (playerSnake.segments.length < targetLength) {
                            const tail = playerSnake.segments[playerSnake.segments.length - 1];
                            playerSnake.segments.push({
                                x: tail.x,
                                y: tail.y
                            });
                        }
                        
                        // Restore full game state
                        playerSnake.elementCapacity = previousCapacity;
                        playerSnake.discoveries = previousDiscoveries;
                        playerSnake.kills = previousKills;
                        
                        gameLogger.debug('RESPAWN', 'Score restored to:', savedSnakeScore, 'Length:', targetLength);
                        window.isReviving = false;
                    } else {
                        // This branch should never be reached now, but keeping for safety
                        playerSnake.score = savedSnakeScore;
                        playerSnake.elementCapacity = previousCapacity;
                        playerSnake.discoveries = previousDiscoveries;
                        playerSnake.kills = previousKills;
                    }
                    
                    // Grant 3 seconds of invincibility on respawn
                    playerSnake.invincibilityTimer = 2000;
                    
                    // Add back to snakes array
                    snakes.push(playerSnake);
                    
                    
                    // Set camera to new player position to prevent jumping
                    camera.x = WORLD_SIZE / 2;
                    camera.y = WORLD_SIZE / 2;
                    
                    // Reset camera zoom to default
                    cameraZoom = isMobile ? 0.75 : 1.0;
                    deathCameraAnimation.active = false;
                    
                    // Reset respawn timer
                    playerRespawnTimer = 0;
                    window.playerRespawnTimer = 0;
                    
                    // Reset death flags for next death
                    deathProcessed = false;
                    deathSequenceActive = false;
                    isRespawning = false; // Reset respawning flag
                    waitingForRespawnInput = false; // Reset waiting flag
                    deathSequenceTimer = 0;
                    window.deathProcessed = false;
                    window.waitingForRespawnInput = false;
                    window.deathSequenceActive = false;
                    window.deathSequenceTimer = 0;
                    leaderboardSubmitted = false;
                    window.deathLeaderboardChecked = false;
                    window.deathCountIncremented = false; // Reset death count flag
                    
                    // Only reset game session start time if it's null (first spawn)
                    if (!gameSessionStartTime) {
                        gameSessionStartTime = Date.now();
                    }
                    
                    // Start a new game session for proper server-side validation
                    if (gameMode === 'infinite' && leaderboardModule) {
                        leaderboardModule.startGameSession().then(sessionId => {
                            currentGameSessionId = sessionId;
                        });
                    }
                }
            
            // Update UI
            updateUI();
            
            // Update boost bar every frame for real-time feedback
            updateBoostBar();
            
            // Calculate interpolation factor for smooth rendering
            const interpolation = accumulator / FIXED_TIMESTEP;
            
            // Update camera to follow player with interpolation
            if (playerSnake && playerSnake.alive && playerSnake.segments.length > 0) {
                const head = playerSnake.segments[0];
                
                // Interpolate player position for camera
                let playerX = playerSnake.x;
                let playerY = playerSnake.y;
                
                if (playerSnake.prevX !== undefined && playerSnake.prevY !== undefined) {
                    playerX = playerSnake.prevX + (playerSnake.x - playerSnake.prevX) * interpolation;
                    playerY = playerSnake.prevY + (playerSnake.y - playerSnake.prevY) * interpolation;
                }
                
                // Ensure camera coordinates stay within world bounds
                // Allow camera to reach edges so player can see the entire map
                camera.x = Math.max(0, Math.min(WORLD_SIZE, playerX));
                camera.y = Math.max(0, Math.min(WORLD_SIZE, playerY));
                
                // Additional check for NaN or Infinity
                if (!isFinite(camera.x)) camera.x = WORLD_SIZE / 2;
                if (!isFinite(camera.y)) camera.y = WORLD_SIZE / 2;
            } else if (playerSnake && !playerSnake.alive) {
                // Keep camera at last known position when player is dead
                // This prevents camera jumping during respawn
                if (!isFinite(camera.x)) camera.x = WORLD_SIZE / 2;
                if (!isFinite(camera.y)) camera.y = WORLD_SIZE / 2;
            }
            
            // Apply screen shake if active
            let screenShakeActive = false;
            if (bossScreenShakeTimer > 0) {
                screenShakeActive = true;
                ctx.save();
                const shakeX = (Math.random() - 0.5) * bossScreenShakeIntensity;
                const shakeY = (Math.random() - 0.5) * bossScreenShakeIntensity;
                ctx.translate(shakeX, shakeY);
                bossScreenShakeTimer--;
            }
            
            // Draw everything
            drawBackground();
            
            // Draw spaceships in pure screen space (behind all game elements)
            if (spaceshipManager) {
                ctx.save();
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to identity matrix to remove all transformations
                spaceshipManager.render();
                ctx.restore();
            }
            
            // Draw asteroids (behind elements but in front of background)
            for (let i = 0; i < asteroids.length; i++) {
                const asteroid = asteroids[i];
                if (isInViewport(asteroid.x, asteroid.y, asteroid.size + 50)) {
                    asteroid.draw();
                }
            }
            
            // Draw elements (element pool handles viewport culling)
            elementPool.draw();
            
            // Draw AlchemyVision power-ups (with viewport culling)
            for (let i = 0; i < alchemyVisionPowerUps.length; i++) {
                const powerUp = alchemyVisionPowerUps[i];
                if (isInViewport(powerUp.x, powerUp.y, 100)) {
                    powerUp.draw();
                }
            }
            
            // Draw Void Orbs (with viewport culling)
            for (let i = 0; i < voidOrbs.length; i++) {
                const orb = voidOrbs[i];
                if (isInViewport(orb.x, orb.y, 100)) {
                    orb.draw();
                }
            }
            
            // Draw Catalyst Gems (with viewport culling)
            for (let i = 0; i < catalystGems.length; i++) {
                const gem = catalystGems[i];
                if (isInViewport(gem.x, gem.y, 100)) {
                    gem.draw();
                }
            }
            
            // Draw boss projectiles
            if (bossEncounterActive) {
                drawBossFissures(); // Draw fissures first (under everything else)
                drawBossProjectiles();
                drawShockwaves();
                drawDamageNumbers();
            }
            
            // Draw snakes (they already have internal viewport culling)
            for (let i = 0; i < snakes.length; i++) {
                const snake = snakes[i];
                if (snake.alive) {
                    snake.draw(interpolation);
                }
            }
            
            // Draw boss skull indicator
            if (currentBoss && currentBoss.alive) {
                drawBossSkullIndicator();
            }
            
            // Draw particles (particle pool handles viewport culling)
            particlePool.draw();
            
            // Draw explosion animations
            if (explosionManager) {
                explosionManager.render(ctx);
            }
            
            // Draw boss damage flash
            if (bossDamageFlashTimer > 0) {
                ctx.save();
                ctx.globalAlpha = bossDamageFlashTimer / 20 * 0.3;
                ctx.fillStyle = currentBoss ? currentBoss.color : '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
                bossDamageFlashTimer--;
                
                // Redraw player on top of the damage flash to ensure visibility
                if (playerSnake && playerSnake.alive) {
                    // Save context state before redrawing to ensure clean state
                    ctx.save();
                    ctx.globalAlpha = 1; // Ensure full opacity
                    playerSnake.draw(interpolation);
                    ctx.restore();
                }
            }
            
            // Update boss damage cooldown
            if (bossDamageCooldown > 0) {
                bossDamageCooldown--;
            }
            
            // Restore context if screen shake was active
            if (screenShakeActive) {
                ctx.restore();
            }
            
            // Draw borders LAST to ensure they appear on top of everything
            drawBorders();
        }
        
        // Initialize mobile controls
        function initMobileControls() {
            if (!isMobile) return;
            
            // Add mobile class to body
            document.body.classList.add('mobile');
            
            const joystick = document.getElementById('virtualJoystick');
            const knob = document.getElementById('joystickKnob');
            const boostBtn = document.getElementById('boostButton');
            
            let joystickTouch = null;
            
            // Joystick controls
            joystick.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (joystickTouch === null && e.changedTouches.length > 0) {
                    joystickTouch = e.changedTouches[0].identifier;
                    joystickActive = true;
                    const rect = joystick.getBoundingClientRect();
                    joystickBase.x = rect.left + rect.width / 2;
                    joystickBase.y = rect.top + rect.height / 2;
                }
            });
            
            joystick.addEventListener('touchmove', (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === joystickTouch) {
                        const dx = touch.clientX - joystickBase.x;
                        const dy = touch.clientY - joystickBase.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const maxDistance = 40; // Max knob travel distance
                        
                        let knobX = dx;
                        let knobY = dy;
                        
                        if (distance > maxDistance) {
                            knobX = (dx / distance) * maxDistance;
                            knobY = (dy / distance) * maxDistance;
                        }
                        
                        // Update knob position
                        knob.style.left = `${50 + (knobX / 60) * 50}%`;
                        knob.style.top = `${50 + (knobY / 60) * 50}%`;
                        
                        // Update mouse angle for game controls
                        if (distance > 10) { // Dead zone
                            mouseAngle = Math.atan2(dy, dx);
                        }
                        break;
                    }
                }
            });
            
            const resetJoystick = () => {
                joystickActive = false;
                joystickTouch = null;
                knob.style.left = '50%';
                knob.style.top = '50%';
            };
            
            joystick.addEventListener('touchend', (e) => {
                e.preventDefault();
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === joystickTouch) {
                        resetJoystick();
                        break;
                    }
                }
            });
            
            joystick.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                resetJoystick();
            });
            
            // Boost button controls
            boostBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                mouseDown = true;
                boostBtn.classList.add('active');
            });
            
            boostBtn.addEventListener('touchend', (e) => {
                e.preventDefault();
                mouseDown = false;
                boostBtn.classList.remove('active');
            });
            
            boostBtn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                mouseDown = false;
                boostBtn.classList.remove('active');
            });
            
            // Prevent scrolling on game canvas
            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
            });
            
            // Add touch-anywhere controls for left/right sides
            let leftSideTouch = null;
            let rightSideTouch = null;
            let leftTouchStartPos = null;
            
            // Touch anywhere on left side for joystick control
            document.addEventListener('touchstart', (e) => {
                // Don't interfere with existing UI elements, but DO work on canvas
                const isCanvas = e.target.id === 'gameCanvas' || e.target.tagName === 'CANVAS';
                const isUIElement = e.target.closest('.player-info-box') || 
                    e.target.closest('.leaderboard-box') || 
                    e.target.closest('.discovery-feed') ||
                    e.target.closest('.pause-button-mobile') ||
                    e.target.closest('.mute-button-mobile') ||
                    e.target.closest('.virtual-joystick') ||
                    e.target.closest('.boost-button');
                    
                if (isUIElement && !isCanvas) {
                    return;
                }
                
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    const x = touch.clientX;
                    const screenWidth = window.innerWidth;
                    
                    // Left half of screen - joystick control
                    if (x < screenWidth / 2 && leftSideTouch === null) {
                        leftSideTouch = touch.identifier;
                        leftTouchStartPos = { x: touch.clientX, y: touch.clientY };
                        joystickActive = true;
                        
                        // Simulate joystick touch at the current position
                        const rect = joystick.getBoundingClientRect();
                        joystickBase.x = rect.left + rect.width / 2;
                        joystickBase.y = rect.top + rect.height / 2;
                    }
                    // Right half of screen - boost
                    else if (x >= screenWidth / 2 && rightSideTouch === null) {
                        rightSideTouch = touch.identifier;
                        mouseDown = true;
                        boostBtn.classList.add('active');
                    }
                }
            }, { passive: false });
            
            document.addEventListener('touchmove', (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    
                    // Handle left side joystick movement
                    if (touch.identifier === leftSideTouch && leftTouchStartPos) {
                        const dx = touch.clientX - leftTouchStartPos.x;
                        const dy = touch.clientY - leftTouchStartPos.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Update mouse angle for game controls with a lower dead zone
                        if (distance > 5) {
                            mouseAngle = Math.atan2(dy, dx);
                            
                            // Also update visual joystick position
                            const maxDistance = 40;
                            let knobX = dx;
                            let knobY = dy;
                            
                            if (distance > maxDistance) {
                                knobX = (dx / distance) * maxDistance;
                                knobY = (dy / distance) * maxDistance;
                            }
                            
                            knob.style.left = `${50 + (knobX / 60) * 50}%`;
                            knob.style.top = `${50 + (knobY / 60) * 50}%`;
                        }
                    }
                }
            }, { passive: false });
            
            document.addEventListener('touchend', (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    
                    if (touch.identifier === leftSideTouch) {
                        leftSideTouch = null;
                        leftTouchStartPos = null;
                        resetJoystick();
                    }
                    else if (touch.identifier === rightSideTouch) {
                        rightSideTouch = null;
                        mouseDown = false;
                        boostBtn.classList.remove('active');
                    }
                }
            }, { passive: false });
            
            document.addEventListener('touchcancel', (e) => {
                // Reset all touches on cancel
                leftSideTouch = null;
                rightSideTouch = null;
                leftTouchStartPos = null;
                resetJoystick();
                mouseDown = false;
                boostBtn.classList.remove('active');
            });
        }
        
        // Enhanced mobile experience JavaScript
        document.addEventListener('DOMContentLoaded', function() {
            
            // Apply mobile class more accurately
            if (isTabletOrMobile()) {
                document.body.classList.add('mobile');
                
                // Force landscape orientation immediately on mobile
                lockToLandscape();
                
                // Monitor orientation changes
                window.addEventListener('orientationchange', checkAndShowRotateMessage);
                window.addEventListener('resize', checkAndShowRotateMessage);
                
                // Initial check
                checkAndShowRotateMessage();
            }
            
            // Handle orientation changes
            function handleOrientationChange() {
                const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
                document.body.setAttribute('data-orientation', orientation);
                
                // Adjust UI scale for better visibility
                if (orientation === 'portrait' && window.innerWidth < 600) {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
                
                // Update UI positions using the unified mobile UI
                if (window.unifiedMobileUI) {
                    window.unifiedMobileUI.handleOrientationChange(orientation);
                }
            }
            
            // Removed duplicate mobileUIManager - using unifiedMobileUI instead
            
            window.addEventListener('orientationchange', handleOrientationChange);
            window.addEventListener('resize', handleOrientationChange);
            handleOrientationChange(); // Initial check
            
            // Initialize discovery feed gradients
            function initDiscoveryFeedGradients() {
                const discoveryFeed = document.querySelector('.discovery-feed');
                if (!discoveryFeed) return;
                
                if (isTabletOrMobile()) {
                    // Lighter gradients for mobile
                    discoveryFeed.classList.add('mobile-gradient');
                } else {
                    // Desktop gradients with hover effects
                    discoveryFeed.classList.add('desktop-gradient');
                    
                    // Add interactive fade on mouse proximity
                    document.addEventListener('mousemove', (e) => {
                        const rect = discoveryFeed.getBoundingClientRect();
                        const distance = Math.sqrt(
                            Math.pow(e.clientX - rect.left, 2) + 
                            Math.pow(e.clientY - (rect.top + rect.height/2), 2)
                        );
                        
                        if (distance < 300) {
                            discoveryFeed.classList.add('fading');
                        } else {
                            discoveryFeed.classList.remove('fading');
                        }
                    });
                }
            }
            
            // Call gradient initialization
            initDiscoveryFeedGradients();
            
            // Apply mobile optimizations
            if (isTabletOrMobile() && window.unifiedMobileUI) {
                window.unifiedMobileUI.applyMobileOptimizations();
            }
            
            // Removed duplicate leaderboard touch handlers - handled by unifiedMobileUI
        });
        
        // Initialize
        Promise.all([loadElements(), loadSnakeNames()]).then(() => {
            
            // Sync discovered elements from new system if available
            if (window.elementLoader && window.elementCompatibility) {
                // Load previously discovered elements
                const savedDiscovered = window.elementCompatibility.loadDiscoveredElements();
                if (savedDiscovered && savedDiscovered.size > 0) {
                    // Merge with existing discovered elements
                    for (const elementKey of savedDiscovered) {
                        discoveredElements.add(elementKey);
                    }
                }
            }
            
            // Load skin data
            loadSkinData();
            preloadSkins();
            
            // Expose skin functions to window for UnlockManager access
            window.loadSkinData = loadSkinData;
            window.saveSkinData = saveSkinData;
            window.skinMetadata = skinMetadata;
            window.unlockedSkins = unlockedSkins;
            window.snakeSkinImages = skinImages;
            
            // Sync with UnlockManager's unlocked skins
            if (window.unlockManager) {
                const unlockManagerSkins = window.unlockManager.getUnlockedSkins();
                for (const skinId of unlockManagerSkins) {
                    // Add to main game's unlockedSkins set
                    unlockedSkins.add(skinId);
                    
                    // Also add the old ID if it exists
                    if (window.skinIdConverter) {
                        const oldId = window.skinIdConverter.toOldId(skinId);
                        if (oldId && oldId !== skinId) {
                            unlockedSkins.add(oldId);
                        }
                    }
                }
                
                // Save and reload to ensure consistency
                saveSkinData();
                loadSkinData();
            }
            
            // Load all-time discoveries
            loadAllTimeDiscoveries();
            
            // Initialize mobile controls if needed
            initMobileControls();
        });
        
        // Show welcome modal on page load if needed
        document.addEventListener('DOMContentLoaded', function() {
            // Small delay to ensure everything is loaded
            setTimeout(() => {
                checkAndShowWelcomeModal();
            }, 500);
        });
        
        // Persistent stars animation for all screens
        document.addEventListener('DOMContentLoaded', function() {
            const persistentCanvas = document.getElementById('persistentStarsCanvas');
            const ctx = persistentCanvas.getContext('2d');
            
            // Resize canvas
            function resizeCanvas() {
                persistentCanvas.width = window.innerWidth;
                persistentCanvas.height = window.innerHeight;
            }
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            // Stars array (shared between both screens)
            const stars = [];
            const shootingStars = [];
            let lastShootingStarTime = 0;
            
            // Initialize stars
            for (let i = 0; i < 150; i++) {
                stars.push({
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    size: Math.random() * 2 + 0.5,
                    opacity: Math.random() * 0.5 + 0.3,
                    twinkleSpeed: Math.random() * 0.02 + 0.01
                });
            }
            
            // Shooting star class for splash
            class SplashShootingStar {
                constructor() {
                    // Start from screen edge
                    const edge = Math.floor(Math.random() * 4);
                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    
                    switch(edge) {
                        case 0: // Top
                            this.x = Math.random() * width;
                            this.y = -10;
                            break;
                        case 1: // Right
                            this.x = width + 10;
                            this.y = Math.random() * height;
                            break;
                        case 2: // Bottom
                            this.x = Math.random() * width;
                            this.y = height + 10;
                            break;
                        case 3: // Left
                            this.x = -10;
                            this.y = Math.random() * height;
                            break;
                    }
                    
                    // Aim towards screen center area
                    const targetX = width * (0.3 + Math.random() * 0.4);
                    const targetY = height * (0.3 + Math.random() * 0.4);
                    const angle = Math.atan2(targetY - this.y, targetX - this.x);
                    const speed = 3 + Math.random() * 2;
                    
                    this.vx = Math.cos(angle) * speed;
                    this.vy = Math.sin(angle) * speed;
                    this.trail = [];
                    this.maxTrailLength = 30;
                    this.life = 1.0;
                }
                
                update() {
                    this.trail.push({ x: this.x, y: this.y });
                    if (this.trail.length > this.maxTrailLength) {
                        this.trail.shift();
                    }
                    
                    this.x += this.vx;
                    this.y += this.vy;
                    this.life -= 0.01;
                    
                    return this.life > 0 && this.x > -50 && this.x < window.innerWidth + 50 && 
                           this.y > -50 && this.y < window.innerHeight + 50;
                }
                
                draw(ctx) {
                    // Draw trail
                    ctx.save();
                    this.trail.forEach((point, index) => {
                        const alpha = (index / this.trail.length) * this.life * 0.3;
                        ctx.globalAlpha = alpha;
                        ctx.fillStyle = '#ffffff';
                        const size = (index / this.trail.length) * 2;
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    
                    // Draw star
                    ctx.globalAlpha = this.life;
                    ctx.fillStyle = '#ffffff';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }
            
            // Animation loop
            function animateStars(timestamp) {
                // Clear canvas
                ctx.clearRect(0, 0, persistentCanvas.width, persistentCanvas.height);
                
                // Draw static stars with twinkling
                stars.forEach(star => {
                    star.opacity += Math.sin(timestamp * star.twinkleSpeed) * 0.05;
                    star.opacity = Math.max(0.1, Math.min(0.8, star.opacity));
                    
                    ctx.globalAlpha = star.opacity;
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();
                });
                
                // Update and draw shooting stars
                shootingStars.forEach((star, index) => {
                    if (!star.update()) {
                        shootingStars.splice(index, 1);
                    } else {
                        star.draw(ctx);
                    }
                });
                
                // Spawn new shooting star occasionally
                if (timestamp - lastShootingStarTime > 3000 + Math.random() * 4000) {
                    shootingStars.push(new SplashShootingStar());
                    lastShootingStarTime = timestamp;
                }
                
                ctx.globalAlpha = 1;
                requestAnimationFrame(animateStars);
            }
            
            // Start animation
            requestAnimationFrame(animateStars);
        });
        
        // Try to play music on first user interaction
        document.addEventListener('click', function playMusicOnInteraction() {
            
            // Try to play current track if paused
            if (currentTrack && currentTrack.paused && gameStarted && !musicMuted && !bossEncounterActive) {
                currentTrack.play().then(() => {
                }).catch(error => {
                    gameLogger.error('AUDIO', 'Failed to start music on user interaction:', error);
                });
            }
            
            // Also try pending music track if any
            if (window.pendingMusicTrack && gameStarted && !musicMuted) {
                window.pendingMusicTrack.play().then(() => {
                    window.pendingMusicTrack = null;
                }).catch(error => {
                    gameLogger.error('AUDIO', 'Failed to start pending music:', error);
                });
            }
        }, { once: true });
        
        // Expose key functions for performance integration
        window.gameLoop = gameLoop;
        window.resizeCanvas = resizeCanvas;
        window.drawBackground = drawBackground;
        window.spawnElement = spawnElement;
        window.createDeathParticles = createDeathParticles;
        
        // Console commands for element bank management
        window.addElementBankSlots = function(count = 1) {
            const newSlots = elementBankSlots + count;
            if (newSlots > 12) {
                gameLogger.debug('ELEMENT BANK', 'Maximum slots is 12. Current:', elementBankSlots);
                return;
            }
            if (newSlots < 6) {
                gameLogger.debug('ELEMENT BANK', 'Minimum slots is 6. Current:', elementBankSlots);
                return;
            }
            elementBankSlots = newSlots;
            saveElementBankSlots();
            // Update player snake's max visible elements
            if (playerSnake) {
                playerSnake.maxVisibleElements = elementBankSlots;
            }
            updateElementBankUI();
            gameLogger.debug('ELEMENT BANK', 'Slots updated to:', elementBankSlots);
        };
        
        window.setElementBankSlots = function(slots) {
            if (slots < 6 || slots > 12) {
                gameLogger.debug('ELEMENT BANK', 'Slots must be between 6 and 12. Current:', elementBankSlots);
                return;
            }
            elementBankSlots = slots;
            saveElementBankSlots();
            // Update player snake's max visible elements
            if (playerSnake) {
                playerSnake.maxVisibleElements = elementBankSlots;
            }
            updateElementBankUI();
            gameLogger.debug('ELEMENT BANK', 'Slots set to:', elementBankSlots);
        };
        
        // Console commands for spaceship system - REMOVED (not using spaceships)
        /*
        window.spawnSpaceship = function(type) {
            const validTypes = ['enterprise', 'millenium-falcon', 'pillar-of-autumn'];
            if (!type || !validTypes.includes(type)) {
                console.log('Usage: spawnSpaceship(type)');
                console.log('Valid types:', validTypes.join(', '));
                return;
            }
            
            // Spawn in player's field of view
            // Camera position is the center of the view, so we need to calculate world position
            const spawnX = camera.x + canvas.width / (2 * cameraZoom) + 100; // Just off-screen to the right
            const spawnY = camera.y + (Math.random() - 0.5) * canvas.height / (2 * cameraZoom); // Within viewport height
            
            const spaceship = new Spaceship(spawnX, spawnY, type);
            spaceships.push(spaceship);
            console.log(`Spawned ${type} spaceship at world position: ${spawnX}, ${spawnY}`);
            console.log(`Camera position: ${camera.x}, ${camera.y}, Zoom: ${cameraZoom}`);
        };
        
        window.spawnRandomSpaceship = function() {
            const types = ['enterprise', 'millenium-falcon', 'pillar-of-autumn'];
            const randomType = types[Math.floor(Math.random() * types.length)];
            window.spawnSpaceship(randomType);
        };
        
        window.setSpaceshipSpawnRate = function(minutes) {
            if (minutes < 0.1 || minutes > 60) {
                console.log('Spawn rate must be between 0.1 and 60 minutes');
                return;
            }
            SPACESHIP_SPAWN_INTERVAL = minutes * 60000;
            console.log(`Spaceship spawn interval set to ${minutes} minutes`);
        };
        
        window.toggleSpaceships = function(enabled) {
            if (enabled === undefined) {
                console.log('Usage: toggleSpaceships(true/false)');
                return;
            }
            if (!enabled) {
                spaceships = [];
                console.log('Spaceships disabled');
            } else {
                console.log('Spaceships enabled');
            }
        };
        */
        
        window.showElementBankSlots = function() {
            gameLogger.debug('ELEMENT BANK', 'Current slots:', elementBankSlots);
            gameLogger.debug('ELEMENT BANK', 'Maximum slots: 12');
            gameLogger.debug('ELEMENT BANK', 'Use addElementBankSlots(n) to add n slots');
            gameLogger.debug('ELEMENT BANK', 'Use setElementBankSlots(n) to set to n slots');
        };
        
        // Store reference to internal spawnBoss function before overriding
        const internalSpawnBoss = spawnBoss;
        
        // Debug boss spawn function
        window.spawnBossDebug = function(bossType) {
            if (!gameStarted || !playerSnake || !playerSnake.alive) {
                console.log('Cannot spawn boss: game not started or player not alive');
                return;
            }
            
            if (currentBoss && currentBoss.alive) {
                console.log('Cannot spawn boss: a boss is already active');
                return;
            }
            
            // If no boss type specified, choose randomly from ALL bosses
            if (!bossType) {
                const allBosses = Object.keys(BOSS_TYPES);
                bossType = allBosses[Math.floor(Math.random() * allBosses.length)];
            } else {
                // Validate boss type
                bossType = bossType.toUpperCase();
                if (!BOSS_TYPES[bossType]) {
                    console.log('Invalid boss type. Available bosses:', Object.keys(BOSS_TYPES).join(', '));
                    console.log('Usage: spawnBossDebug("PYRAXIS"), spawnBossDebug("ABYSSOS"), etc.');
                    return;
                }
            }
            
            // Temporarily clear defeated bosses to allow spawning
            const originalDefeatedBosses = new Set(defeatedBosses);
            defeatedBosses.clear();
            
            // Force spawn the specific boss
            const originalAvailableBosses = Object.keys(BOSS_TYPES).filter(boss => !defeatedBosses.has(boss));
            defeatedBosses = new Set(Object.keys(BOSS_TYPES).filter(boss => boss !== bossType));
            
            console.log(`Spawning ${bossType}...`);
            internalSpawnBoss();
            
            // Restore defeated bosses
            defeatedBosses = originalDefeatedBosses;
        };
        
        // Simple spawn boss function that calls the internal spawnBoss
        window.spawnBoss = function() {
            if (!gameStarted || !playerSnake || !playerSnake.alive) {
                console.log('Cannot spawn boss: game not started or player not alive');
                return;
            }
            
            if (currentBoss && currentBoss.alive) {
                console.log('Cannot spawn boss: a boss is already active');
                return;
            }
            
            // Call the internal spawnBoss function
            internalSpawnBoss();
        };
        
        // List available bosses
        window.listBosses = function() {
            console.log('Available bosses:');
            Object.keys(BOSS_TYPES).forEach(boss => {
                const data = BOSS_TYPES[boss];
                const defeated = defeatedBosses.has(boss);
                console.log(`- ${boss}: ${data.name} (${data.element}) ${defeated ? '[DEFEATED]' : '[AVAILABLE]'}`);
            });
        };
        
        // Reset defeated bosses
        window.resetBosses = function() {
            defeatedBosses.clear();
            localStorage.removeItem('defeatedBosses');
            console.log('All bosses have been reset');
        };
        
        // Expose necessary functions to global scope for HTML onclick handlers
        window.selectGameMode = selectGameMode;
        window.selectControls = selectControls;
        window.startGame = startGame;
        window.startGameTransition = startGameTransition;
        window.playUISound = playUISound;
