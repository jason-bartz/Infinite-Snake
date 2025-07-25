const FRAME_TIME_MS = 16;
const STAMINA_DRAIN_RATE = 100 / (6.25 * 60); // Increased boost duration by 25% (from 5 to 6.25 seconds)
const STAMINA_REGEN_RATE = 100 / (2 * 60);
const STAMINA_REGEN_COOLDOWN = 30;
const BOOST_SPEED_MULTIPLIER = 1.75;
const BOOST_TURN_MULTIPLIER = 0.85;
const MOUSE_TURN_SENSITIVITY = 0.1;
const MOBILE_TURN_SENSITIVITY = 0.12;
const INVINCIBILITY_DURATION = 2000;
const DEATH_ANIMATION_DURATION = 1000;
const FLASH_FREQUENCY = 10;
const MAX_CHAIN_DEPTH = 3;
const INITIAL_SNAKE_LENGTH = 10;
const DEFAULT_MAX_VISIBLE_ELEMENTS = 6;

// Get game constants from window or use defaults
const SNAKE_SPEED = window.SNAKE_SPEED || 4.761;
const TURN_SPEED = window.TURN_SPEED || 0.08;
const WORLD_SIZE = window.WORLD_SIZE || 4000;
const SEGMENT_SIZE = window.SEGMENT_SIZE || 15;

// Note: Global dependencies are accessed from window object directly in the code

// AI Personality definitions
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
    }
};

const PERSONALITY_COLORS = {
    'Aggressive': '#ff4444',
    'Combo Master': '#44ff44',
    'Balanced': '#4444ff'
};

class Snake {
    constructor(x, y, isPlayer = false) {
        // Ensure global constants are available
        if (!window.AI_PERSONALITIES) {
            window.AI_PERSONALITIES = AI_PERSONALITIES;
        }
        if (!window.PERSONALITY_COLORS) {
            window.PERSONALITY_COLORS = PERSONALITY_COLORS;
        }
        
        this.initializePosition(x, y);
        this.initializeMovement();
        this.initializeStats();
        this.initializeGameplay(isPlayer);
        this.initializeSegments();
        this.initializeBoost();
        this.initializeSkin(isPlayer);
        this.initializeAI(isPlayer);
        this.initializeDeathAnimation();
    }
    
    initializePosition(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
    }
    
    initializeMovement() {
        this.angle = Math.random() * Math.PI * 2;
        this.prevAngle = this.angle;
        this.speed = SNAKE_SPEED;
        this.baseSpeed = SNAKE_SPEED;
    }
    
    initializeStats() {
        this.segments = [];
        this.elements = [];
        this.maxVisibleElements = DEFAULT_MAX_VISIBLE_ELEMENTS;
        this.elementsEaten = 0;
        this.length = INITIAL_SNAKE_LENGTH;
        this.score = 0;
        this.discoveries = 0;
        this.kills = 0;
        this.discoveredElements = new Set();
    }
    
    initializeGameplay(isPlayer) {
        this.isAlive = true;
        this.isPlayer = isPlayer;
        this.name = isPlayer ? 'You' : (window.generateSnakeName ? window.generateSnakeName() : 'Snake' + Math.floor(Math.random() * 1000));
        this.invincibilityTimer = 0;
        this.size = 1;
        
        if (!this.size || this.size <= 0) {
            this.size = 1;
            window.gameLogger.warn('SNAKE', 'Snake size was invalid, setting to 1');
        }
        
        if (isPlayer) {
            window.gameLogger.debug('PLAYER CREATED', 'Size:', this.size);
        }
    }
    
    // Compatibility getter/setter for game-original.js which uses 'alive' instead of 'isAlive'
    get alive() {
        return this.isAlive;
    }
    
    set alive(value) {
        this.isAlive = value;
    }
    
    initializeBoost() {
        this.stamina = 100;
        this.maxStamina = 100;
        this.isBoosting = false;
        this.wasBoosting = false;
        this.staminaRegenCooldown = 0;
        this.boostParticleTimer = 0;
        this.nearMissTracking = new Map();
        this.recentCollisions = new Set();
    }
    
    initializeSkin(isPlayer) {
        if (isPlayer) {
            this.skin = currentPlayerSkin;
        } else {
            this.assignAISkin();
        }
    }
    
    assignAISkin() {
        const playerSkin = window.currentPlayerSkin || 'snake-default-green';
        const allSkins = Object.keys(window.skinMetadata || {}).filter(skin => 
            skin !== 'snake-default-green' && 
            skin !== playerSkin && 
            !(window.skinMetadata[skin] && window.skinMetadata[skin].isBoss) && 
            !(window.usedAISkins && window.usedAISkins.has(skin))
        );
        
        if (allSkins.length === 0) {
            if (window.usedAISkins) window.usedAISkins.clear();
            // Keep player's skin in the used set even after clearing
            if (window.usedAISkins && playerSkin) window.usedAISkins.add(playerSkin);
            const resetSkins = Object.keys(window.skinMetadata || {}).filter(skin => 
                skin !== 'snake-default-green' && 
                skin !== playerSkin &&
                !(window.skinMetadata[skin] && window.skinMetadata[skin].isBoss)
            );
            this.skin = resetSkins[Math.floor(Math.random() * resetSkins.length)];
        } else {
            this.skin = allSkins[Math.floor(Math.random() * allSkins.length)];
        }
        
        if (window.usedAISkins) window.usedAISkins.add(this.skin);
    }
    
    initializeAI(isPlayer) {
        if (!isPlayer && !this.isBoss) {
            const personalities = Object.keys(AI_PERSONALITIES);
            const personalityKey = personalities[Math.floor(Math.random() * personalities.length)];
            this.personality = AI_PERSONALITIES[personalityKey];
            this.name = this.personality.name + ' ' + this.name;
            this.personalityColor = PERSONALITY_COLORS[this.personality.name];
            
            if (this.personality.name === 'Aggressive') {
            }
            
            this.targetMemory = null;
            this.targetMemoryTimer = 0;
            this.lastCollisionCheck = 0;
            this.panicMode = false;
            this.panicTimer = 0;
            this.lastDangerAngle = null;
            this.consecutiveDangerFrames = 0;
            this.huntTarget = null;
            this.huntTargetTimer = 0;
            this.lastBoostTime = 0;
            this.aggressionLevel = 0;
            this.encircleTarget = null;
            this.encirclePhase = 0;
            this.lastElementTarget = null;
            this.elementMemoryTimer = 0;
            this.voidOrbCooldown = 0;
            
            // New AI properties for enhanced behavior
            this.persistentTarget = null;
            this.persistentTargetTimer = 0;
            this.attackPattern = 0; // Cycles through different attack strategies
            this.playerSearchCooldown = 0;
            this.lastTargetPosition = null;
            this.predictedTargetPosition = null;
            this.territoryCenter = { x: this.x, y: this.y };
            this.intimidationPhase = 0;
        }
    }
    
    initializeDeathAnimation() {
        this.deathAnimationTimer = 0;
        this.deathAnimationDuration = DEATH_ANIMATION_DURATION;
        this.deathFlashPhase = 0;
        this.deathSegmentPhase = 0;
        this.isDying = false;
        this.hasExploded = false;
    }
    
    initializeSegments() {
        for (let i = 0; i < this.length; i++) {
            const segX = this.x - i * SEGMENT_SIZE * Math.cos(this.angle);
            const segY = this.y - i * SEGMENT_SIZE * Math.sin(this.angle);
            this.segments.push({
                x: segX,
                y: segY,
                prevX: segX,
                prevY: segY
            });
        }
    }
    
    update(deltaTime = 1) {
        if (this.isDying && !this.isAlive) {
            this.updateDeathAnimation(deltaTime);
            return;
        }
        
        if (!this.isAlive) return;
        
        this.updatePreviousPositions();
        this.updateInvincibility();
        this.handleControls(deltaTime);
        this.updateStamina(deltaTime);
        this.updateMovement(deltaTime);
        this.checkWorldBoundaries();
        this.updateSegments();
        this.checkCombinations();
        
        this.wasBoosting = this.isBoosting;
    }
    
    updatePreviousPositions() {
        this.prevX = this.x;
        this.prevY = this.y;
        this.prevAngle = this.angle;
        
        if (this.segments) {
            this.segments.forEach(segment => {
                segment.prevX = segment.x;
                segment.prevY = segment.y;
            });
        }
    }
    
    updateInvincibility() {
        if (this.invincibilityTimer > 0) {
            this.invincibilityTimer -= FRAME_TIME_MS;
        }
    }
    
    handleControls(deltaTime) {
        if (this.isPlayer) {
            this.handlePlayerControls();
        } else {
            this.updateAI(deltaTime);
        }
    }
    
    handlePlayerControls() {
        if (this !== window.playerSnake) {
            const playerSnakeCount = window.snakes.filter(s => s.isPlayer && s.isAlive).length;
            
            if (playerSnakeCount > 1) {
                window.gameLogger.critical('CONTROLS', 'WARNING: Multiple player snakes detected! Killing duplicate:', this.name);
                this.isAlive = false;
                return;
            } else {
                window.gameLogger.warn('CONTROLS', 'Player snake reference mismatch, updating reference');
                window.playerSnake = this;
            }
        }
        
        let turnMultiplier = this.isBoosting ? BOOST_TURN_MULTIPLIER : 1;
        
        if (window.isMobile && window.joystickActive) {
            this.handleMobileControls(turnMultiplier);
        } else if (window.controlScheme === 'arrows') {
            this.handleArrowControls(turnMultiplier);
        } else if (window.controlScheme === 'mouse') {
            this.handleMouseControls(turnMultiplier);
        }
    }
    
    handleMobileControls(turnMultiplier) {
        let angleDiff = window.mouseAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        const angleChange = angleDiff * MOBILE_TURN_SENSITIVITY * turnMultiplier;
        if (isFinite(angleChange)) {
            this.angle += angleChange;
        }
        this.isBoosting = window.mouseDown && this.stamina > 0;
    }
    
    handleArrowControls(turnMultiplier) {
        if (window.keys['ArrowLeft'] || window.keys['a'] || window.keys['A']) this.angle -= TURN_SPEED * turnMultiplier;
        if (window.keys['ArrowRight'] || window.keys['d'] || window.keys['D']) this.angle += TURN_SPEED * turnMultiplier;
        this.isBoosting = (window.keys['ArrowUp'] || window.keys['w'] || window.keys['W']) && this.stamina > 0;
    }
    
    handleMouseControls(turnMultiplier) {
        if (window.keys['a'] || window.keys['A']) this.angle -= TURN_SPEED * turnMultiplier;
        if (window.keys['d'] || window.keys['D']) this.angle += TURN_SPEED * turnMultiplier;
        
        const usingWASD = window.keys['a'] || window.keys['A'] || window.keys['d'] || window.keys['D'];
        if (!usingWASD && window.mouseMovedRecently) {
            let angleDiff = window.mouseAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            const angleChange = angleDiff * MOUSE_TURN_SENSITIVITY * turnMultiplier;
            if (isFinite(angleChange)) {
                this.angle += angleChange;
            }
        }
        
        this.isBoosting = (window.mouseDown || window.keys['w'] || window.keys['W']) && this.stamina > 0;
    }
    
    updateStamina(deltaTime) {
        if (this.isBoosting && this.stamina > 0) {
            if (!this.wasBoosting) {
                if (window.playBoostSound) window.playBoostSound(this.isPlayer);
            }
            
            this.stamina -= STAMINA_DRAIN_RATE * deltaTime;
            this.stamina = Math.max(0, this.stamina);
            this.staminaRegenCooldown = STAMINA_REGEN_COOLDOWN;
            this.speed = this.baseSpeed * BOOST_SPEED_MULTIPLIER;
            
            this.createBoostParticles();
        } else {
            this.isBoosting = false;
            this.speed = this.baseSpeed;
            
            if (this.staminaRegenCooldown > 0) {
                this.staminaRegenCooldown -= deltaTime;
            } else if (this.stamina < this.maxStamina) {
                this.stamina += STAMINA_REGEN_RATE * deltaTime;
                this.stamina = Math.min(this.maxStamina, this.stamina);
            }
        }
    }
    
    createBoostParticles() {
        this.boostParticleTimer++;
        const particleFrequency = isMobile ? 6 : 3;
        if (this.boostParticleTimer % particleFrequency === 0) {
            const particleAngle = this.angle + Math.PI + (Math.random() - 0.5) * 0.5;
            const particleSpeed = 2 + Math.random() * 2;
            const vx = Math.cos(particleAngle) * particleSpeed;
            const vy = Math.sin(particleAngle) * particleSpeed;
            const color = this.isPlayer ? 'rgba(100, 200, 255, 0.8)' : 'rgba(255, 100, 100, 0.8)';
            if (window.particlePool) window.particlePool.spawn(this.x, this.y, vx, vy, color);
        }
    }
    
    updateMovement(deltaTime) {
        if (!isFinite(this.angle)) {
            window.gameLogger.error('MOVEMENT', 'Angle is invalid!', this.angle, 'Resetting to 0');
            this.angle = 0;
        }
        
        const fastMath = window.fastMath || Math;
        const moveX = fastMath.cos(this.angle) * this.speed * deltaTime;
        const moveY = fastMath.sin(this.angle) * this.speed * deltaTime;
        
        if (isFinite(moveX) && isFinite(moveY)) {
            this.x += moveX;
            this.y += moveY;
        } else {
            window.gameLogger.error('MOVEMENT', 'Invalid movement!', 'angle:', this.angle, 'speed:', this.speed, 'deltaTime:', deltaTime);
        }
    }
    
    checkWorldBoundaries() {
        const boundaryMargin = 2;
        
        // Check if we're hitting any boundary
        const hitLeftBoundary = this.x <= -boundaryMargin;
        const hitRightBoundary = this.x >= WORLD_SIZE + boundaryMargin;
        const hitTopBoundary = this.y <= -boundaryMargin;
        const hitBottomBoundary = this.y >= WORLD_SIZE + boundaryMargin;
        
        if (hitLeftBoundary || hitRightBoundary || hitTopBoundary || hitBottomBoundary) {
            // In cozy mode, bounce instead of die
            if (this.isPlayer && window.gameMode === 'cozy') {
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
                if (window.explosionManager) {
                    window.explosionManager.createExplosion('dust-impact-small-white', explosionX, explosionY, { 
                        scale: 0.7 
                    });
                }
                
                // Ensure minimum speed to prevent getting stuck
                const minSpeed = SNAKE_SPEED * 0.5;
                if (this.speed < minSpeed) {
                    this.speed = minSpeed;
                }
            } else {
                // Normal death for non-cozy modes or AI snakes
                this.die();
            }
        }
    }
    
    updateSegments() {
        if (!this.segments) {
            window.gameLogger.error('SEGMENTS', 'Segments array is undefined!');
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
    }
    
    checkCombinations(depth = 0) {
        if (this.elements.length < 2) return;
        
        if (this.elements.length > this.maxVisibleElements) {
            window.gameLogger.critical('ELEMENT BANK', 'Elements array exceeds max visible elements!', this.elements.length);
            this.elements = this.elements.slice(0, this.maxVisibleElements);
        }
        
        const MAX_CHAIN_DEPTH = 3;
        if (depth >= MAX_CHAIN_DEPTH) return;
        
        const possibleCombos = this.findPossibleCombinations();
        
        if (possibleCombos.length === 0) {
            if (this.isPlayer && this === window.playerSnake) {
                window.comboStreak = 0;
            }
            return;
        }
        
        possibleCombos.sort((a, b) => {
            if (a.isNewDiscovery && !b.isNewDiscovery) return -1;
            if (!a.isNewDiscovery && b.isNewDiscovery) return 1;
            return b.tier - a.tier;
        });
        
        const chosen = possibleCombos[0];
        this.performCombination(chosen, depth);
    }
    
    findPossibleCombinations() {
        const possibleCombos = [];
        
        for (let i = 0; i < this.elements.length; i++) {
            for (let j = i + 1; j < this.elements.length; j++) {
                const id1 = this.elements[i];
                const id2 = this.elements[j];
                
                let resultId = null;
                if (window.elementLoader && window.elementLoader.combinations) {
                    const key = `${Math.min(id1, id2)}+${Math.max(id1, id2)}`;
                    resultId = window.elementLoader.combinations[key];
                    
                    // Debug logging for Earth element combinations
                    if (id1 === 0 || id2 === 0 || id1 === '0' || id2 === '0') {
                        window.gameLogger.debug('EARTH COMBO', 'Key:', key, 'Result:', resultId, 'id1:', id1, 'id2:', id2);
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
        
        return possibleCombos;
    }
    
    performCombination(chosen, depth) {
        if (this.isPlayer) {
            this.startCombinationAnimation(chosen.index1, chosen.index2);
            if (window.createCombinationFlash) window.createCombinationFlash();
            this.glowWobbleIndices = [chosen.index1, chosen.index2];
            this.glowWobbleTime = Date.now();
            if (window.updateUI) window.updateUI();
        }
        
        const indices = [chosen.index1, chosen.index2].sort((a, b) => b - a);
        this.elements.splice(indices[0], 1);
        this.elements.splice(indices[1], 1);
        
        const insertIndex = Math.floor(Math.random() * (this.elements.length + 1));
        this.elements.splice(insertIndex, 0, chosen.result);
        
        if (this.elements.length > this.maxVisibleElements) {
            window.gameLogger.warn('ELEMENT BANK', 'Elements exceed max after combination, trimming');
            this.elements = this.elements.slice(0, this.maxVisibleElements);
        }
        
        if (chosen.isNewDiscovery) {
            this.handleNewDiscovery(chosen);
        } else {
            this.handleExistingCombination(chosen);
        }
        
        if (window.createCombinationParticles) window.createCombinationParticles(this.segments[0].x, this.segments[0].y);
        
        if (this.isPlayer && this === window.playerSnake && window.currentBoss && window.currentBoss.alive) {
            window.gameLogger.debug('BOSS COMBO CHECK', 'Checking boss element combination. Boss:', window.currentBoss.bossType, 'Element ID:', window.currentBoss.elementId);
            this.checkBossElementCombination(chosen);
        }
        
        this.checkCombinations(depth + 1);
    }
    
    handleNewDiscovery(chosen) {
        this.discoveredElements.add(chosen.result);
        
        const gameTime = Date.now() - window.gameStartTime;
        if (this.isPlayer || gameTime > 10000) {
            window.discoveredElements.add(chosen.result);
        }
        
        if (this.isPlayer && this === window.playerSnake) {
            const resultId = typeof chosen.result === 'string' ? parseInt(chosen.result) : chosen.result;
            window.playerDiscoveredElements.add(resultId);
        }
        
        this.score += 500;
        this.discoveries++;
        
        if (this.isPlayer && this === window.playerSnake) {
            window.dispatchGameEvent('elementDiscovered', {
                element1: chosen.elem1,
                element2: chosen.elem2,
                result: chosen.result,
                totalDiscoveries: this.discoveries,
                score: this.score
            });
            
            this.saveDiscoveryRecipe(chosen);
            window.showCombinationMessage(chosen.elem1, chosen.elem2, chosen.result, true);
            this.invincibilityTimer = 2000;
            
            if (this.score > window.highScore) {
                window.highScore = this.score;
                localStorage.setItem('highScore', window.highScore.toString());
            }
        }
    }
    
    saveDiscoveryRecipe(chosen) {
        const elem1Data = window.elementLoader.elements.get(chosen.elem1);
        const elem2Data = window.elementLoader.elements.get(chosen.elem2);
        if (elem1Data && elem2Data) {
            const emoji1 = window.elementLoader.getEmojiForElement(chosen.elem1, elem1Data.e);
            const emoji2 = window.elementLoader.getEmojiForElement(chosen.elem2, elem2Data.e);
            const recipe = `${emoji1} ${elem1Data.n} + ${emoji2} ${elem2Data.n}`;
            window.allTimeDiscoveries.set(chosen.result, recipe);
            window.saveAllTimeDiscoveries();
        }
    }
    
    handleExistingCombination(chosen) {
        if (this.isPlayer && this === window.playerSnake) {
            window.comboStreak++;
            let comboBonus = 100;
            
            if (window.comboStreak >= 4) {
                comboBonus = 2500;
                window.showMessage(`4x COMBO STREAK! +${comboBonus} points!`, 'combo', 5000);
            } else if (window.comboStreak >= 3) {
                comboBonus = 1000;
                window.showMessage(`3x Combo Streak! +${comboBonus} points!`, 'combo', 5000);
            } else if (window.comboStreak >= 2) {
                comboBonus = 500;
                window.showMessage(`2x Combo! +${comboBonus} points!`, 'combo', 5000);
            }
            
            this.score += comboBonus;
            window.showCombinationMessage(chosen.elem1, chosen.elem2, chosen.result, false);
        }
    }
    
    checkBossElementCombination(chosen) {
        const bossElementId = window.currentBoss.elementId;
        // Convert to numbers for consistent comparison, handling edge cases
        const elem1Id = chosen.elem1 === '0' || chosen.elem1 === 0 ? 0 : (typeof chosen.elem1 === 'string' ? parseInt(chosen.elem1, 10) : chosen.elem1);
        const elem2Id = chosen.elem2 === '0' || chosen.elem2 === 0 ? 0 : (typeof chosen.elem2 === 'string' ? parseInt(chosen.elem2, 10) : chosen.elem2);
        const resultId = chosen.result === '0' || chosen.result === 0 ? 0 : (typeof chosen.result === 'string' ? parseInt(chosen.result, 10) : chosen.result);
        
        window.gameLogger.debug('SHOCKWAVE CHECK', 'Boss element ID:', bossElementId, 'Type:', typeof bossElementId, 'Checking against:', elem1Id, '(type:', typeof elem1Id, ')', elem2Id, '(type:', typeof elem2Id, ')', resultId, '(type:', typeof resultId, ')');
        
        // Special logging for Osseus/Earth element
        if (bossElementId === 0) {
            window.gameLogger.debug('OSSEUS CHECK', 'Earth boss detected. Comparisons:', 
                'elem1Id === 0:', elem1Id === 0, 
                'elem2Id === 0:', elem2Id === 0, 
                'resultId === 0:', resultId === 0);
        }
        
        if (elem1Id === bossElementId || elem2Id === bossElementId || resultId === bossElementId) {
            window.gameLogger.debug('SHOCKWAVE', 'MATCH FOUND! Creating shockwave for player:', this.name);
            
            const elementColors = {
                0: '#8b6914',
                1: '#0066ff',
                2: '#ffffff',
                3: '#ff4444'
            };
            
            let shockwaveColor = '#FFD700';
            if (this.elements.length > 0) {
                const primaryElement = this.elements[0];
                shockwaveColor = elementColors[primaryElement] || '#FFD700';
            }
            
            if (!window.shockwaves) {
                window.gameLogger.error('SHOCKWAVE', 'window.shockwaves is not defined!');
                return;
            }
            
            window.gameLogger.debug('SHOCKWAVE', 'Adding shockwave to array. Current count:', window.shockwaves.length);
            
            window.shockwaves.push({
                x: this.segments[0].x,
                y: this.segments[0].y,
                radius: 0,
                maxRadius: 400,
                speed: 10,
                color: shockwaveColor,
                life: 1.0,
                type: 'omnidirectional',
                owner: 'player'
            });
            
            const shockwaveSound = new Audio('sounds/explosion-shockwave.mp3');
            shockwaveSound.volume = 0.8;
            shockwaveSound.play().catch(e => {});
            
            window.showMessage('Boss Element Resonance!', 'gold', 3000);
        }
    }
    
    consume(element) {
        if (this.isPlayer) {
            if (window.playEatSound) window.playEatSound();
        }
        
        if (this.elements.length > (window.elementBankSlots || 6)) {
            this.elements = this.elements.slice(0, (window.elementBankSlots || 6));
        }
        
        if (this.elements.length >= (window.elementBankSlots || 6)) {
            this.tryImmediateCombination(element);
        } else {
            this.addElementToBank(element);
        }
        
        this.elementsEaten++;
        this.length += 2;
        this.score += 100;
        
        if (this.isPlayer && this.score > window.highScore) {
            window.highScore = this.score;
            localStorage.setItem('window.highScore', window.highScore.toString());
        }
        
        window.elementPool.remove(element);
        
        if (this.isPlayer) {
            window.updateUI();
        }
    }
    
    tryImmediateCombination(element) {
        const newElementId = element.id;
        let combined = false;
        
        if (!window.elementLoader || !window.elementLoader.combinations) {
            window.gameLogger.error('COMBINATION', 'ElementLoader or combinations not loaded!');
            return;
        }
        
        for (let i = 0; i < this.elements.length && !combined; i++) {
            const existingId = this.elements[i];
            const comboKey = `${Math.min(newElementId, existingId)}+${Math.max(newElementId, existingId)}`;
            const resultId = window.elementLoader.combinations[comboKey];
            
            if (resultId !== undefined && resultId !== null) {
                combined = true;
                
                if (this.isPlayer) {
                    this.pendingCombinationIndex = i;
                    this.pendingCombinationTime = Date.now();
                    window.updateUI();
                }
                
                setTimeout(() => {
                    this.elements[i] = resultId;
                    
                    if (this.elements.length > (window.elementBankSlots || 6)) {
                        window.gameLogger.warn('ELEMENT BANK', 'Elements exceed max after replacement, trimming');
                        this.elements = this.elements.slice(0, (window.elementBankSlots || 6));
                    }
                    
                    if (this.isPlayer) {
                        this.pendingCombinationIndex = -1;
                    }
                    
                    this.processCombinationResult(resultId, newElementId, existingId);
                    this.checkCombinations();
                    window.updateUI();
                }, 300);
            }
        }
        
        if (!combined) {
            this.checkCombinations();
        }
    }
    
    addElementToBank(element) {
        const insertIndex = Math.floor(Math.random() * (this.elements.length + 1));
        this.elements.splice(insertIndex, 0, element.id);
        
        // Debug logging for Earth elements
        if (element.id === 0 || element.id === '0') {
            window.gameLogger.debug('EARTH ELEMENT', 'Added Earth element to bank. ID:', element.id, 'Type:', typeof element.id, 'Bank now:', this.elements);
        }
        
        if (this.elements.length > elementBankSlots) {
            window.gameLogger.warn('ELEMENT BANK', 'Trimming elements array to max size');
            this.elements = this.elements.slice(0, elementBankSlots);
        }
        
        if (this.elements.length >= 2) {
            this.checkCombinations();
        }
    }
    
    processCombinationResult(resultId, elem1Id, elem2Id) {
        if (!this.discoveredElements.has(resultId)) {
            this.discoveredElements.add(resultId);
            this.score += 500;
            this.discoveries++;
            
            if (this.isPlayer && this === window.playerSnake) {
                window.discoveredElements.add(resultId);
                
                const resultData = window.elementLoader.elements.get(resultId);
                
                if (window.leaderboardModule && window.leaderboardModule.addGameEvent) {
                    window.leaderboardModule.addGameEvent('discovery', {
                        element_id: resultId,
                        element_name: resultData?.n || 'Unknown',
                        recipe: [elem1Id, elem2Id],
                        score: this.score,
                        total_discoveries: this.discoveries
                    });
                }
                
                this.saveDiscoveryFromConsumption(resultId, elem1Id, elem2Id);
                window.showCombinationMessage(elem1Id, elem2Id, resultId, true);
                this.invincibilityTimer = 2000;
            }
        } else {
            if (this.isPlayer && this === window.playerSnake) {
                this.handleComboStreak(elem1Id, elem2Id, resultId);
            }
        }
        
        if (window.createCombinationParticles) window.createCombinationParticles(this.segments[0].x, this.segments[0].y);
    }
    
    saveDiscoveryFromConsumption(resultId, elem1Id, elem2Id) {
        const elem1Data = window.elementLoader.elements.get(elem1Id);
        const elem2Data = window.elementLoader.elements.get(elem2Id);
        const resultData = window.elementLoader.elements.get(resultId);
        
        if (elem1Data && elem2Data && resultData) {
            const emoji1 = window.elementLoader.getEmojiForElement(elem1Id, elem1Data.e);
            const emoji2 = window.elementLoader.getEmojiForElement(elem2Id, elem2Data.e);
            const recipe = `${emoji1} ${elem1Data.n} + ${emoji2} ${elem2Data.n}`;
            window.allTimeDiscoveries.set(resultId, recipe);
            window.saveAllTimeDiscoveries();
        }
    }
    
    handleComboStreak(elem1Id, elem2Id, resultId) {
        window.comboStreak++;
        let comboBonus = 100;
        
        if (window.comboStreak >= 4) {
            comboBonus = 2500;
            window.showMessage(`4x COMBO STREAK! +${comboBonus} points!`, 'combo', 5000);
        } else if (window.comboStreak >= 3) {
            comboBonus = 1000;
            window.showMessage(`3x Combo Streak! +${comboBonus} points!`, 'combo', 5000);
        } else if (window.comboStreak >= 2) {
            comboBonus = 500;
            window.showMessage(`2x Combo! +${comboBonus} points!`, 'combo', 5000);
        }
        
        this.score += comboBonus;
        window.showCombinationMessage(elem1Id, elem2Id, resultId, false);
    }
    
    digest() {
        const digestedCount = this.elements.length;
        this.elements = [];
        
        const digestBonus = Math.floor(digestedCount * 50);
        this.score += digestBonus;
        
        if (this.isPlayer && this.score > window.highScore) {
            window.highScore = this.score;
            localStorage.setItem('window.highScore', window.highScore.toString());
        }
        
        if (this.isPlayer && this === window.playerSnake && digestedCount > 0) {
            window.showMessage(`Digesting ${digestedCount} elements! +${digestBonus} points`, false);
            window.updateUI();
        }
    }
    
    startCombinationAnimation(index1, index2) {
        this.combiningIndices = [index1, index2];
        this.combinationAnimationTime = 0;
        this.isAnimatingCombination = true;
        
        if (this.isPlayer) {
            combinationAnimationState.isAnimating = true;
            combinationAnimationState.combiningIndices = [index1, index2];
            combinationAnimationState.animationStartTime = Date.now();
            
            setTimeout(() => {
                const remainingElements = this.elements.length;
                if (remainingElements > 0) {
                    combinationAnimationState.newElementIndex = Math.floor(Math.random() * remainingElements);
                    window.updateUI();
                }
            }, 300);
        }
    }
    
    die(isBossDeath = false) {
        window.gameLogger.debug('SNAKE DEATH', 'die() called', {
            isPlayer: this.isPlayer,
            isDying: this.isDying,
            alive: this.isAlive,
            deathAnimationTimer: this.deathAnimationTimer
        });
        
        if (!this.isDying) {
            window.gameLogger.debug('SNAKE DEATH', 'Starting snake death animation');
            this.isDying = true;
            this.deathAnimationTimer = 0;
            this.speed = 0;
            
            if (isBossDeath && this.isPlayer) {
                this.deathAnimationTimer = this.deathAnimationDuration;
                this.isAlive = false;
                this.deathComplete = true;
            }
            
            return;
        }
        
        window.gameLogger.debug('SNAKE DEATH', 'Processing actual death (alive = false)');
        this.isAlive = false;
        
        this.dropElements();
        
        if (!this.finalExplosionTriggered) {
            const snakeColor = this.color || '#ff0000';
            if (window.createDeathParticles) window.createDeathParticles(this.x, this.y, this.length, snakeColor, this.elements);
        }
        
        if (this.isPlayer && !isBossDeath) {
            this.createPlayerDeathEffects();
        }
        
        if (this.isPlayer && isBossDeath) {
            this.createBossKillEffects();
        }
    }
    
    dropElements() {
        // Spawn elements along the snake's body shape
        const elementsToSpawn = this.elements.length;
        if (elementsToSpawn === 0 || !this.segments || this.segments.length === 0) return;
        
        // Calculate spacing between elements based on snake length
        const segmentSpacing = Math.max(1, Math.floor(this.segments.length / elementsToSpawn));
        
        for (let i = 0; i < elementsToSpawn; i++) {
            // Place elements evenly along the snake's body
            const segmentIndex = Math.min(i * segmentSpacing, this.segments.length - 1);
            const segment = this.segments[segmentIndex];
            
            if (!segment || segment.x === undefined || segment.y === undefined) {
                continue;
            }
            
            // Add small random offset to prevent exact overlap
            const smallOffset = 10;
            const offsetX = (Math.random() - 0.5) * smallOffset;
            const offsetY = (Math.random() - 0.5) * smallOffset;
            
            let finalX = segment.x + offsetX;
            let finalY = segment.y + offsetY;
            
            // Ensure elements stay within world boundaries
            const margin = 50;
            finalX = Math.max(margin, Math.min(WORLD_SIZE - margin, finalX));
            finalY = Math.max(margin, Math.min(WORLD_SIZE - margin, finalY));
            
            window.spawnElement(this.elements[i], finalX, finalY);
        }
    }
    
    createPlayerDeathEffects() {
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
    
    createBossKillEffects() {
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
        
        if (!window.musicMuted) {
            const explosionSound = new Audio('sounds/big-powerful-explosion.mp3');
            explosionSound.volume = 0.7;
            explosionSound.play().catch(e => {});
        }
        
        window.bossScreenShakeTimer = 60;
        window.bossScreenShakeIntensity = 20;
    }
    
    updateDeathAnimation(deltaTime) {
        this.deathAnimationTimer += deltaTime * 16;
        
        const progress = Math.min(this.deathAnimationTimer / this.deathAnimationDuration, 1);
        
        if (this.deathAnimationTimer < 200) {
            this.deathFlashPhase = Math.sin(this.deathAnimationTimer * 0.1) * 0.5 + 0.5;
        }
        
        if (this.deathAnimationTimer >= 200 && this.deathAnimationTimer < 600) {
            const explosionProgress = (this.deathAnimationTimer - 200) / 400;
            this.deathSegmentPhase = explosionProgress;
            
            if (Math.random() < 0.3) {
                this.createDeathAnimationParticles();
            }
        }
        
        if (this.deathAnimationTimer >= 600 && !this.finalExplosionTriggered) {
            this.triggerFinalExplosion();
        }
        
        if (this.deathAnimationTimer >= this.deathAnimationDuration) {
            this.deathComplete = true;
            this.isAlive = false;
        }
    }
    
    createDeathAnimationParticles() {
        const segmentIndex = Math.floor(Math.random() * this.segments.length);
        const segment = this.segments[segmentIndex];
        if (segment) {
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
    
    triggerFinalExplosion() {
        this.finalExplosionTriggered = true;
        
        const snakeColor = this.color || '#ff0000';
        // Pass snake type to createDeathParticles
        const snakeType = this.isPlayer ? 'player' : (this.isBoss ? 'boss' : 'ai');
        if (window.createDeathParticles) window.createDeathParticles(this.x, this.y, this.length, snakeColor, this.elements, snakeType);
        
        if (this.isPlayer && !window.musicMuted) {
            const retroExplosion = new Audio('sounds/retro-explode-boom.mp3');
            retroExplosion.volume = 0.7;
            retroExplosion.play().catch(e => {});
        }
        
        if (this.isPlayer) {
            this.createDeathCameraShake();
        }
    }
    
    createDeathCameraShake() {
        window.cameraShake.intensity = 15;
        window.cameraShake.duration = 500;
        window.cameraShake.startTime = Date.now();
    }
    
    draw(interpolation = 1) {
        if (!this.alive && !this.isDying) return;
        
        if (!this.segments || this.segments.length === 0) return;
        
        const deathOpacity = this.calculateDeathOpacity();
        if (deathOpacity <= 0) return;
        
        window.ctx.save();
        window.ctx.globalAlpha = deathOpacity;
        
        if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer / 100) % 2 === 0) {
            window.ctx.globalAlpha *= 0.5;
        }
        
        this.drawSegments(interpolation);
        this.drawHead(interpolation);
        
        window.ctx.restore();
    }
    
    calculateDeathOpacity() {
        let deathOpacity = 1;
        if (this.isDying) {
            if (this.deathAnimationTimer < 200) {
                deathOpacity = 1 + this.deathFlashPhase * 0.5;
            } else if (this.deathAnimationTimer >= 200 && this.deathAnimationTimer < 600) {
                deathOpacity = 1 - this.deathSegmentPhase * 0.7;
            } else {
                deathOpacity = 0.3 * (1 - (this.deathAnimationTimer - 600) / 400);
            }
        }
        return deathOpacity;
    }
    
    drawSegments(interpolation) {
        const skinData = window.skinMetadata[this.skin] || window.skinMetadata['snake-default-green'];
        const skinImg = window.snakeSkinImages ? window.snakeSkinImages[this.skin] : null;
        const emoji = skinData.emoji;
        
        const baseSegmentSize = SEGMENT_SIZE * this.size * window.cameraZoom;
        
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            
            // Interpolate segment position for smooth rendering
            const interpolatedX = segment.prevX + (segment.x - segment.prevX) * interpolation;
            const interpolatedY = segment.prevY + (segment.y - segment.prevY) * interpolation;
            
            const screen = window.worldToScreen(interpolatedX, interpolatedY);
            const margin = 100;
            
            if (screen.x < -margin || screen.x > window.canvas.width + margin ||
                screen.y < -margin || screen.y > window.canvas.height + margin) continue;
            
            // Calculate tapered size for this segment
            const segmentProgress = i / (this.segments.length - 1); // 0 at head, 1 at tail
            
            // Use a more gradual tapering curve
            // Keep full size for first 40% of body, then gradually taper
            let taperMultiplier;
            if (segmentProgress < 0.4) {
                taperMultiplier = 1.0; // Full size for first 40%
            } else {
                // Smooth tapering from 40% to end
                const taperProgress = (segmentProgress - 0.4) / 0.6; // Normalize to 0-1 for taper region
                // Use a power curve for smooth tapering, minimum 0.3x size at tail
                taperMultiplier = 1.0 - (taperProgress * taperProgress * 0.7); // Quadratic taper to 0.3x
            }
            
            const effectiveSegmentSize = baseSegmentSize * taperMultiplier;
            const minSize = isMobile ? 6 : 8; // Slightly reduced minimum for better visibility
            const maxSize = isMobile ? 30 : 40;
            const clampedSize = Math.max(minSize, Math.min(maxSize, effectiveSegmentSize));
            
            this.drawSegmentBody(screen, i, clampedSize, skinImg, emoji);
        }
    }
    
    drawSegmentBody(screen, index, size, skinImg, emoji) {
        if (this.isDying && this.deathAnimationTimer >= 200 && this.deathAnimationTimer < 600) {
            const explosionChance = this.deathSegmentPhase * 0.5;
            if (Math.random() < explosionChance) {
                const jitter = this.deathSegmentPhase * 10;
                screen.x += (Math.random() - 0.5) * jitter;
                screen.y += (Math.random() - 0.5) * jitter;
            }
        }
        
        if (skinImg && skinImg.complete && skinImg.width > 0 && skinImg.height > 0) {
            // Preserve aspect ratio
            const aspectRatio = skinImg.width / skinImg.height;
            let drawWidth = size;
            let drawHeight = size;
            
            if (aspectRatio > 1) {
                // Wider than tall
                drawHeight = size / aspectRatio;
            } else if (aspectRatio < 1) {
                // Taller than wide  
                drawWidth = size * aspectRatio;
            }
            // If aspectRatio is 1, keep both as size
            
            
            window.ctx.drawImage(skinImg, screen.x - drawWidth/2, screen.y - drawHeight/2, drawWidth, drawHeight);
        } else {
            const cachedEmoji = window.getCachedEmoji(emoji, size);
            window.ctx.drawImage(cachedEmoji, screen.x - cachedEmoji.width/2, screen.y - cachedEmoji.height/2);
        }
    }
    
    drawHead(interpolation) {
        // Interpolate head position for smooth rendering
        const interpolatedX = this.prevX + (this.x - this.prevX) * interpolation;
        const interpolatedY = this.prevY + (this.y - this.prevY) * interpolation;
        const interpolatedAngle = this.prevAngle + (this.angle - this.prevAngle) * interpolation;
        
        const headScreen = window.worldToScreen(interpolatedX, interpolatedY);
        const margin = 100;
        
        if (headScreen.x < -margin || headScreen.x > window.canvas.width + margin ||
            headScreen.y < -margin || headScreen.y > window.canvas.height + margin) return;
        
        const effectiveSegmentSize = SEGMENT_SIZE * this.size * window.cameraZoom;
        const minSize = isMobile ? 10 : 12;
        const maxSize = isMobile ? 35 : 50;
        const headSize = Math.max(minSize, Math.min(maxSize, effectiveSegmentSize * 1.5));
        
        const skinData = window.skinMetadata[this.skin] || window.skinMetadata['snake-default-green'];
        const skinImg = window.snakeSkinImages[this.skin + '-head'] || window.snakeSkinImages[this.skin];
        
        window.ctx.save();
        window.ctx.translate(headScreen.x, headScreen.y);
        window.ctx.rotate(interpolatedAngle);
        
        if (skinImg && skinImg.complete && skinImg.width > 0 && skinImg.height > 0) {
            // Preserve aspect ratio
            const aspectRatio = skinImg.width / skinImg.height;
            let drawWidth = headSize;
            let drawHeight = headSize;
            
            if (aspectRatio > 1) {
                // Wider than tall
                drawHeight = headSize / aspectRatio;
            } else if (aspectRatio < 1) {
                // Taller than wide
                drawWidth = headSize * aspectRatio;
            }
            
            window.ctx.drawImage(skinImg, -drawWidth/2, -drawHeight/2, drawWidth, drawHeight);
        } else {
            const cachedEmoji = window.getCachedEmoji(skinData.emoji, headSize);
            window.ctx.drawImage(cachedEmoji, -cachedEmoji.width/2, -cachedEmoji.height/2);
        }
        
        window.ctx.restore();
        
        this.drawNameAndStats(headScreen, headSize);
    }
    
    drawNameAndStats(headScreen, headSize) {
        const nameOffset = headSize * 0.8;
        
        window.ctx.font = `${Math.round(10 * window.cameraZoom)}px 'Press Start 2P'`;
        window.ctx.textAlign = 'center';
        window.ctx.textBaseline = 'bottom';
        
        const personalityColor = this.personalityColor || '#ffffff';
        
        // Get display name (remove personality prefix for AI snakes)
        let displayName = this.name;
        if (!this.isPlayer && this.personality) {
            const personalityPrefix = this.personality.name + ' ';
            displayName = this.name.substring(personalityPrefix.length);
        }
        
        // Check for invincibility effect (not in cozy mode)
        if (this.isPlayer && this.invincibilityTimer > 0 && window.gameMode !== 'cozy') {
            // Save context state
            window.ctx.save();
            
            // Add golden glow effect
            window.ctx.shadowColor = '#FFD700';
            window.ctx.shadowBlur = 20;
            
            // Draw golden outline
            window.ctx.strokeStyle = '#FFD700';
            window.ctx.lineWidth = 6;
            window.ctx.strokeText(displayName, headScreen.x, headScreen.y - nameOffset);
            
            // Draw black inner stroke for readability
            window.ctx.shadowBlur = 0;
            window.ctx.strokeStyle = 'black';
            window.ctx.lineWidth = 2;
            window.ctx.strokeText(displayName, headScreen.x, headScreen.y - nameOffset);
            
            // Draw fill text
            window.ctx.fillStyle = '#4ecdc4';
            window.ctx.fillText(displayName, headScreen.x, headScreen.y - nameOffset);
            
            // Restore context state
            window.ctx.restore();
        } else {
            // Normal name rendering
            window.ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            window.ctx.lineWidth = 3;
            window.ctx.strokeText(displayName, headScreen.x, headScreen.y - nameOffset);
            
            window.ctx.fillStyle = this.isPlayer ? '#4ecdc4' : personalityColor;
            window.ctx.fillText(displayName, headScreen.x, headScreen.y - nameOffset);
        }
        
        const scoreY = headScreen.y - nameOffset - 12 * window.cameraZoom;
        const scoreText = `${this.score}`;
        
        window.ctx.strokeText(scoreText, headScreen.x, scoreY);
        window.ctx.fillStyle = '#ffeb3b';
        window.ctx.fillText(scoreText, headScreen.x, scoreY);
    }
    
    getColor() {
        const skinData = window.skinMetadata[this.skin];
        return skinData ? skinData.color : '#4ecdc4';
    }
    
    updateAI(deltaTime) {
        if (!this.personality || !this.isAlive) return;
        
        const personality = this.personality;
        const currentTime = Date.now();
        
        // Update timers
        if (this.panicMode) {
            this.panicTimer--;
            if (this.panicTimer <= 0) {
                this.panicMode = false;
            }
        }
        
        if (this.targetMemoryTimer > 0) {
            this.targetMemoryTimer--;
        }
        
        if (this.huntTargetTimer > 0) {
            this.huntTargetTimer--;
        }
        
        if (this.elementMemoryTimer > 0) {
            this.elementMemoryTimer--;
        }
        
        if (this.voidOrbCooldown > 0) {
            this.voidOrbCooldown--;
        }
        
        // Update persistent target tracking
        if (this.persistentTargetTimer > 0) {
            this.persistentTargetTimer--;
            if (this.persistentTargetTimer <= 0) {
                this.persistentTarget = null;
                this.lastTargetPosition = null;
            }
        }
        
        if (this.playerSearchCooldown > 0) {
            this.playerSearchCooldown--;
        }
        
        // Update aggression level based on length
        this.aggressionLevel = Math.min(1.0, this.length / 100);
        
        // Get all threats and targets
        const threats = this.assessThreats();
        const targets = this.findTargets();
        
        // Decide action based on personality and situation
        let targetAngle = null;
        let shouldBoost = false;
        
        // Emergency border avoidance
        const borderAvoidance = this.checkBorderDanger();
        if (borderAvoidance.emergency) {
            targetAngle = borderAvoidance.angle;
            shouldBoost = true;
            this.panicMode = true;
            this.panicTimer = 30;
        } else if (threats.immediateDanger) {
            // Immediate danger - evade
            targetAngle = this.calculateEvasionAngle(threats);
            shouldBoost = personality.riskTolerance < 0.5 || threats.dangerLevel > 0.8;
        } else {
            // No immediate danger - pursue objectives
            const action = this.chooseAction(targets, threats);
            
            switch (action.type) {
                case 'hunt':
                    targetAngle = this.calculateHuntAngle(action.target);
                    shouldBoost = this.shouldBoostForHunt(action.target);
                    break;
                case 'collect':
                    targetAngle = this.calculateCollectAngle(action.target);
                    shouldBoost = false;
                    break;
                case 'encircle':
                    targetAngle = this.calculateEncircleAngle(action.target);
                    shouldBoost = true;
                    break;
                case 'ram':
                    targetAngle = this.calculateRamAngle(action.target);
                    shouldBoost = true;
                    break;
                case 'cutoff':
                    targetAngle = this.calculateCutoffAngle(action.target);
                    shouldBoost = true;
                    break;
                case 'intimidate':
                    targetAngle = this.calculateIntimidateAngle(action.target);
                    shouldBoost = Math.sin(this.intimidationPhase) > 0; // Alternating boost pattern
                    break;
                case 'wander':
                    targetAngle = this.calculateWanderAngle();
                    shouldBoost = false;
                    break;
            }
        }
        
        // Apply movement
        if (targetAngle !== null) {
            this.turnTowardsAngle(targetAngle, personality.avoidanceStrength);
        }
        
        // Boost management
        if (shouldBoost && this.stamina > personality.boostThreshold * 100) {
            this.isBoosting = true;
            this.lastBoostTime = currentTime;
        } else {
            this.isBoosting = false;
        }
        
        // Check if we should use void orb
        if (this.elements.length >= this.maxVisibleElements - 1) {
            this.checkVoidOrbUsage();
        }
    }
    
    assessThreats() {
        const threats = {
            immediateDanger: false,
            dangerLevel: 0,
            nearestThreat: null,
            allThreats: []
        };
        
        if (!window.snakes) return threats;
        
        const mySize = this.length;
        const personality = this.personality;
        
        for (const snake of window.snakes) {
            if (snake === this || !snake.isAlive) continue;
            
            const distance = Math.hypot(snake.x - this.x, snake.y - this.y);
            const sizeRatio = snake.length / mySize;
            
            // Check head collision danger
            const headDanger = distance < personality.dangerZoneRadius && sizeRatio > personality.fleeThreshold;
            
            // Check body collision danger
            let bodyDanger = false;
            for (const segment of snake.segments) {
                const segDist = Math.hypot(segment.x - this.x, segment.y - this.y);
                if (segDist < personality.collisionAvoidanceRadius) {
                    bodyDanger = true;
                    break;
                }
            }
            
            if (headDanger || bodyDanger) {
                const threat = {
                    snake: snake,
                    distance: distance,
                    sizeRatio: sizeRatio,
                    angle: Math.atan2(snake.y - this.y, snake.x - this.x),
                    isDangerous: sizeRatio > personality.fleeThreshold,
                    isBody: bodyDanger
                };
                
                threats.allThreats.push(threat);
                
                if (!threats.nearestThreat || distance < threats.nearestThreat.distance) {
                    threats.nearestThreat = threat;
                }
            }
        }
        
        if (threats.nearestThreat) {
            threats.immediateDanger = threats.nearestThreat.distance < personality.collisionAvoidanceRadius;
            threats.dangerLevel = 1 - (threats.nearestThreat.distance / personality.dangerZoneRadius);
        }
        
        return threats;
    }
    
    findTargets() {
        const targets = {
            snakes: [],
            playerTargets: [],
            elements: [],
            voidOrbs: []
        };
        
        const mySize = this.length;
        const personality = this.personality;
        
        // Find huntable snakes
        if (window.snakes) {
            for (const snake of window.snakes) {
                if (snake === this || !snake.isAlive) continue;
                
                const distance = Math.hypot(snake.x - this.x, snake.y - this.y);
                const sizeRatio = mySize / snake.length;
                
                // For aggressive personality, hunt players across the entire map
                const isValidTarget = personality.name === 'Aggressive' && snake.isPlayer ? 
                    true : // No distance limit for aggressive hunting players
                    (distance < personality.chaseDistance && sizeRatio > 1 / personality.preyRatioMax);
                
                if (isValidTarget) {
                    const targetData = {
                        snake: snake,
                        distance: distance,
                        sizeRatio: sizeRatio,
                        angle: Math.atan2(snake.y - this.y, snake.x - this.x),
                        priority: (sizeRatio * personality.aggressionMultiplier) / (distance / 100),
                        isPlayer: snake.isPlayer
                    };
                    
                    // Separate player targets for aggressive prioritization
                    if (snake.isPlayer) {
                        // Boost priority for player targets when aggressive
                        if (personality.name === 'Aggressive') {
                            targetData.priority *= 10; // Heavily prioritize players
                        }
                        targets.playerTargets.push(targetData);
                    } else {
                        targets.snakes.push(targetData);
                    }
                }
            }
            
            targets.snakes.sort((a, b) => b.priority - a.priority);
            targets.playerTargets.sort((a, b) => b.priority - a.priority);
        }
        
        // Find nearby elements
        if (window.elements) {
            for (const element of window.elements) {
                const distance = Math.hypot(element.x - this.x, element.y - this.y);
                if (distance < 500) {
                    targets.elements.push({
                        element: element,
                        distance: distance,
                        angle: Math.atan2(element.y - this.y, element.x - this.x)
                    });
                }
            }
            
            targets.elements.sort((a, b) => a.distance - b.distance);
        }
        
        // Find void orbs
        if (window.voidOrbs) {
            for (const orb of window.voidOrbs) {
                const distance = Math.hypot(orb.x - this.x, orb.y - this.y);
                if (distance < 300) {
                    targets.voidOrbs.push({
                        orb: orb,
                        distance: distance,
                        angle: Math.atan2(orb.y - this.y, orb.x - this.x)
                    });
                }
            }
        }
        
        return targets;
    }
    
    chooseAction(targets, threats) {
        const personality = this.personality;
        const hasFullInventory = this.elements.length >= this.maxVisibleElements - 1;
        
        // Combo-focused always prioritizes elements unless in danger
        if (personality.name === 'Combo Master') {
            if (hasFullInventory && targets.voidOrbs.length > 0 && !this.hasValidCombos()) {
                return { type: 'collect', target: targets.voidOrbs[0] };
            }
            if (targets.elements.length > 0) {
                return { type: 'collect', target: targets.elements[0] };
            }
            return { type: 'wander' };
        }
        
        // Aggressive personality - ALWAYS hunt players if available
        if (personality.name === 'Aggressive') {
            // Check if we have a valid persistent target
            let target = null;
            if (this.persistentTarget && this.persistentTarget.isAlive) {
                // Verify the persistent target is still valid
                const distance = Math.hypot(this.persistentTarget.x - this.x, this.persistentTarget.y - this.y);
                const sizeRatio = this.length / this.persistentTarget.length;
                target = {
                    snake: this.persistentTarget,
                    distance: distance,
                    sizeRatio: sizeRatio,
                    angle: Math.atan2(this.persistentTarget.y - this.y, this.persistentTarget.x - this.x),
                    isPlayer: this.persistentTarget.isPlayer
                };
            } else if (targets.playerTargets.length > 0) {
                // Get new player target
                target = targets.playerTargets[0];
                // Set as persistent target
                this.persistentTarget = target.snake;
                this.persistentTargetTimer = 500; // Track for 500 frames (~8 seconds)
                this.lastTargetPosition = { x: target.snake.x, y: target.snake.y };
            }
            
            if (target) {
                // Update last known position
                if (this.persistentTarget) {
                    this.lastTargetPosition = { x: this.persistentTarget.x, y: this.persistentTarget.y };
                }
                
                // Cycle attack patterns for variety
                this.attackPattern = (this.attackPattern + 1) % 4;
                
                // Debug logging for aggressive behavior
                if (Math.random() < 0.02) { // Log occasionally to avoid spam
                }
                
                // Choose attack strategy based on situation and pattern
                if (target.sizeRatio > personality.ramThreshold && target.distance < 250) {
                    return { type: 'ram', target: target };
                } else if (target.distance < personality.encircleDistance && this.length > 40 && this.attackPattern === 0) {
                    return { type: 'encircle', target: target };
                } else if (target.distance < 300 && target.sizeRatio > 1.1 && this.attackPattern === 1) {
                    // Cut-off attack for close targets
                    return { type: 'cutoff', target: target };
                } else if (this.attackPattern === 2 && target.distance < 400) {
                    // Intimidation behavior
                    this.intimidationPhase = (this.intimidationPhase + 0.1) % (Math.PI * 2);
                    return { type: 'intimidate', target: target };
                } else {
                    return { type: 'hunt', target: target };
                }
            }
            // Hunt AI snakes if no players available
            else if (targets.snakes.length > 0) {
                const target = targets.snakes[0];
                if (target.sizeRatio > personality.ramThreshold && target.distance < 200) {
                    return { type: 'ram', target: target };
                } else {
                    return { type: 'hunt', target: target };
                }
            }
            // Only collect elements if nothing to hunt
            else if (targets.elements.length > 0 && Math.random() < 0.3) {
                return { type: 'collect', target: targets.elements[0] };
            }
        }
        
        // Balanced personality - opportunistic hunting
        if (personality.name === 'Balanced') {
            // Hunt players if they're close
            if (targets.playerTargets.length > 0 && targets.playerTargets[0].distance < 400) {
                const target = targets.playerTargets[0];
                if (target.sizeRatio > 1.5) {
                    return { type: 'hunt', target: target };
                }
            }
            
            // Normal balanced decision making
            const huntWeight = personality.huntingPriority * (1 + this.aggressionLevel);
            const collectWeight = personality.comboPriority * (hasFullInventory ? 0.3 : 1);
            
            if (Math.random() < huntWeight && (targets.snakes.length > 0 || targets.playerTargets.length > 0)) {
                const allTargets = [...targets.playerTargets, ...targets.snakes];
                return { type: 'hunt', target: allTargets[0] };
            } else if (Math.random() < collectWeight && targets.elements.length > 0) {
                return { type: 'collect', target: targets.elements[0] };
            }
        }
        
        // Default behaviors
        if (hasFullInventory && targets.voidOrbs.length > 0 && !this.hasValidCombos()) {
            return { type: 'collect', target: targets.voidOrbs[0] };
        }
        
        return { type: 'wander' };
    }
    
    calculateEvasionAngle(threats) {
        // Calculate average danger direction
        let dangerX = 0;
        let dangerY = 0;
        
        for (const threat of threats.allThreats) {
            const weight = 1 / (threat.distance + 1);
            dangerX += Math.cos(threat.angle) * weight;
            dangerY += Math.sin(threat.angle) * weight;
        }
        
        // Move away from average danger
        const dangerAngle = Math.atan2(dangerY, dangerX);
        return dangerAngle + Math.PI;
    }
    
    calculateHuntAngle(target) {
        const personality = this.personality;
        
        // Predict target position
        const targetSpeed = target.snake.speed || SNAKE_SPEED;
        const timeToIntercept = target.distance / (this.speed * 2);
        const predictedX = target.snake.x + Math.cos(target.snake.angle) * targetSpeed * timeToIntercept * personality.predictiveLookAhead;
        const predictedY = target.snake.y + Math.sin(target.snake.angle) * targetSpeed * timeToIntercept * personality.predictiveLookAhead;
        
        // Calculate cutoff angle
        const cutoffAngle = Math.atan2(predictedY - this.y, predictedX - this.x);
        
        // Mix direct and cutoff angles based on personality
        const directAngle = target.angle;
        return directAngle + (cutoffAngle - directAngle) * personality.cutoffAnticipation;
    }
    
    calculateEncircleAngle(target) {
        // Enhanced encircle behavior - create a spiral pattern to trap target
        this.encirclePhase = (this.encirclePhase + 0.08) % (Math.PI * 2);
        
        const distance = target.distance;
        const targetSnake = target.snake;
        
        // Dynamic radius based on target size and our length
        const minRadius = targetSnake.length * 2 + 100;
        const maxRadius = targetSnake.length * 3 + 200;
        const currentRadius = minRadius + (maxRadius - minRadius) * (0.5 + 0.5 * Math.sin(this.encirclePhase * 0.5));
        
        // Calculate desired position on circle around target
        const circleX = targetSnake.x + Math.cos(this.encirclePhase) * currentRadius;
        const circleY = targetSnake.y + Math.sin(this.encirclePhase) * currentRadius;
        
        // If we're far from the circle, move towards it
        if (distance > currentRadius * 1.5) {
            return Math.atan2(circleY - this.y, circleX - this.x);
        }
        
        // If we're on the circle, follow the spiral
        const tangentAngle = this.encirclePhase + Math.PI / 2;
        
        // Add inward pressure to tighten the spiral
        const inwardAngle = Math.atan2(targetSnake.y - this.y, targetSnake.x - this.x);
        const spiralAngle = tangentAngle * 0.8 + inwardAngle * 0.2;
        
        // Predict target movement and adjust
        if (targetSnake.speed > 0) {
            const predictedX = targetSnake.x + Math.cos(targetSnake.angle) * targetSnake.speed * 30;
            const predictedY = targetSnake.y + Math.sin(targetSnake.angle) * targetSnake.speed * 30;
            const adjustAngle = Math.atan2(predictedY - this.y, predictedX - this.x);
            return spiralAngle * 0.7 + adjustAngle * 0.3;
        }
        
        return spiralAngle;
    }
    
    calculateRamAngle(target) {
        // Direct angle to target head
        return target.angle;
    }
    
    calculateCollectAngle(target) {
        return target.angle;
    }
    
    calculateWanderAngle() {
        // Wander towards center if near edge
        const centerDist = Math.hypot(this.x - WORLD_SIZE / 2, this.y - WORLD_SIZE / 2);
        if (centerDist > WORLD_SIZE * 0.4) {
            return Math.atan2(WORLD_SIZE / 2 - this.y, WORLD_SIZE / 2 - this.x);
        }
        
        // Random wander
        return this.angle + (Math.random() - 0.5) * 0.2;
    }
    
    calculateCutoffAngle(target) {
        // Advanced cut-off calculation for intercepting targets
        const targetSnake = target.snake;
        const targetSpeed = targetSnake.isBoosting ? targetSnake.speed * BOOST_SPEED_MULTIPLIER : targetSnake.speed;
        const mySpeed = this.isBoosting ? this.speed * BOOST_SPEED_MULTIPLIER : this.speed;
        
        // Calculate intercept point
        const dx = targetSnake.x - this.x;
        const dy = targetSnake.y - this.y;
        const targetVx = Math.cos(targetSnake.angle) * targetSpeed;
        const targetVy = Math.sin(targetSnake.angle) * targetSpeed;
        
        // Solve quadratic equation for intercept time
        const a = targetVx * targetVx + targetVy * targetVy - mySpeed * mySpeed;
        const b = 2 * (dx * targetVx + dy * targetVy);
        const c = dx * dx + dy * dy;
        
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
            // Can't intercept, aim ahead of target
            const leadTime = target.distance / (mySpeed * 2);
            const leadX = targetSnake.x + targetVx * leadTime;
            const leadY = targetSnake.y + targetVy * leadTime;
            return Math.atan2(leadY - this.y, leadX - this.x);
        }
        
        const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t = t1 > 0 ? t1 : t2;
        
        if (t < 0) {
            // Target is moving away, aim at predicted position
            const leadTime = target.distance / mySpeed;
            const leadX = targetSnake.x + targetVx * leadTime * 0.5;
            const leadY = targetSnake.y + targetVy * leadTime * 0.5;
            return Math.atan2(leadY - this.y, leadX - this.x);
        }
        
        // Calculate intercept position
        const interceptX = targetSnake.x + targetVx * t;
        const interceptY = targetSnake.y + targetVy * t;
        
        // Add slight adjustment for head collision
        const adjustmentAngle = Math.atan2(targetVy, targetVx);
        const adjustedX = interceptX + Math.cos(adjustmentAngle + Math.PI/2) * 20;
        const adjustedY = interceptY + Math.sin(adjustmentAngle + Math.PI/2) * 20;
        
        return Math.atan2(adjustedY - this.y, adjustedX - this.x);
    }
    
    calculateIntimidateAngle(target) {
        // Create threatening movements - circling and feinting
        const baseAngle = target.angle;
        const distance = target.distance;
        
        // Circle around target at medium distance
        if (distance > 150 && distance < 300) {
            // Orbit around target
            const orbitAngle = baseAngle + Math.PI/2 + Math.sin(this.intimidationPhase) * 0.3;
            return orbitAngle;
        } else if (distance <= 150) {
            // Feint attacks - dart in and out
            const feintAngle = baseAngle + Math.sin(this.intimidationPhase * 2) * Math.PI/3;
            return feintAngle;
        } else {
            // Move closer while weaving
            return baseAngle + Math.sin(this.intimidationPhase * 3) * 0.5;
        }
    }
    
    turnTowardsAngle(targetAngle, strength = 1.0) {
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const turnSpeed = TURN_SPEED * strength;
        if (Math.abs(angleDiff) > turnSpeed) {
            this.angle += Math.sign(angleDiff) * turnSpeed;
        } else {
            this.angle = targetAngle;
        }
    }
    
    shouldBoostForHunt(target) {
        const personality = this.personality;
        
        // Aggressive snakes boost more strategically
        if (personality.name === 'Aggressive') {
            // Always boost when very close for the kill
            if (target.distance < 200) return true;
            
            // Boost when chasing players
            if (target.isPlayer && this.stamina > 30) return true;
            
            // Tactical boost - sprint in bursts to conserve stamina
            const shouldSprint = Math.sin(Date.now() * 0.002) > 0.3;
            return this.stamina > 50 && shouldSprint;
        }
        
        // Balanced personality
        if (personality.name === 'Balanced') {
            if (target.distance < 150) return true;
            return this.stamina > personality.boostThreshold * 100 && target.distance < 300;
        }
        
        // Default conservative boosting
        return this.stamina > personality.boostThreshold * 100 && target.distance < 200;
    }
    
    checkBorderDanger() {
        const margin = 100;
        const emergencyMargin = 50;
        
        let emergency = false;
        let angle = this.angle;
        
        if (this.x < margin || this.x > WORLD_SIZE - margin ||
            this.y < margin || this.y > WORLD_SIZE - margin) {
            
            // Calculate angle to center
            angle = Math.atan2(WORLD_SIZE / 2 - this.y, WORLD_SIZE / 2 - this.x);
            
            if (this.x < emergencyMargin || this.x > WORLD_SIZE - emergencyMargin ||
                this.y < emergencyMargin || this.y > WORLD_SIZE - emergencyMargin) {
                emergency = true;
            }
        }
        
        return { emergency, angle };
    }
    
    hasValidCombos() {
        return this.findPossibleCombinations().length > 0;
    }
    
    checkVoidOrbUsage() {
        if (this.voidOrbCooldown > 0 || this.hasValidCombos()) return;
        
        // Check if we're near a void orb
        if (window.voidOrbs) {
            for (const orb of window.voidOrbs) {
                const distance = Math.hypot(orb.x - this.x, orb.y - this.y);
                if (distance < 50) {
                    // Simulate using void orb
                    this.digest();
                    this.voidOrbCooldown = 120; // 2 second cooldown
                    break;
                }
            }
        }
    }
}

export default Snake;