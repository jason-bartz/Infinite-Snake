const FRAME_TIME_MS = 16;
const STAMINA_DRAIN_RATE = 100 / (5 * 60);
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

class Snake {
    constructor(x, y, isPlayer = false) {
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
        this.name = isPlayer ? 'You' : generateSnakeName();
        this.invincibilityTimer = 0;
        this.size = 1;
        
        if (!this.size || this.size <= 0) {
            this.size = 1;
            console.warn('Snake size was invalid, setting to 1');
        }
        
        if (isPlayer) {
            console.log('[PLAYER CREATED] Size:', this.size);
            console.trace();
        }
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
        const allSkins = Object.keys(skinMetadata).filter(skin => 
            skin !== 'snake-default-green' && !skinMetadata[skin].isBoss && !usedAISkins.has(skin)
        );
        
        if (allSkins.length === 0) {
            usedAISkins.clear();
            const resetSkins = Object.keys(skinMetadata).filter(skin => 
                skin !== 'snake-default-green' && !skinMetadata[skin].isBoss
            );
            this.skin = resetSkins[Math.floor(Math.random() * resetSkins.length)];
        } else {
            this.skin = allSkins[Math.floor(Math.random() * allSkins.length)];
        }
        
        usedAISkins.add(this.skin);
    }
    
    initializeAI(isPlayer) {
        if (!isPlayer && !this.isBoss) {
            const personalities = Object.keys(AI_PERSONALITIES);
            const personalityKey = personalities[Math.floor(Math.random() * personalities.length)];
            this.personality = AI_PERSONALITIES[personalityKey];
            this.name = this.personality.name + ' ' + this.name;
            this.personalityColor = PERSONALITY_COLORS[this.personality.name];
            
            if (this.personality.name === 'Aggressive') {
                console.log(`[DEBUG] Created Aggressive AI snake: ${this.name}`);
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
        }
    }
    
    initializeDeathAnimation() {
        this.deathAnimationTimer = 0;
        this.deathAnimationDuration = DEATH_ANIMATION_DURATION;
        this.deathFlashPhase = 0;
        this.deathSegmentPhase = 0;
        this.isDying = false;
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
        if (this !== playerSnake) {
            const playerSnakeCount = snakes.filter(s => s.isPlayer && s.isAlive).length;
            
            if (playerSnakeCount > 1) {
                console.error('[CONTROLS] WARNING: Multiple player snakes detected! Killing duplicate:', this.name);
                this.isAlive = false;
                return;
            } else {
                console.warn('[CONTROLS] Player snake reference mismatch, updating reference');
                playerSnake = this;
            }
        }
        
        let turnMultiplier = this.isBoosting ? BOOST_TURN_MULTIPLIER : 1;
        
        if (isMobile && joystickActive) {
            this.handleMobileControls(turnMultiplier);
        } else if (controlScheme === 'arrows') {
            this.handleArrowControls(turnMultiplier);
        } else if (controlScheme === 'mouse') {
            this.handleMouseControls(turnMultiplier);
        }
    }
    
    handleMobileControls(turnMultiplier) {
        let angleDiff = mouseAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        const angleChange = angleDiff * MOBILE_TURN_SENSITIVITY * turnMultiplier;
        if (isFinite(angleChange)) {
            this.angle += angleChange;
        }
        this.isBoosting = mouseDown && this.stamina > 0;
    }
    
    handleArrowControls(turnMultiplier) {
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) this.angle -= TURN_SPEED * turnMultiplier;
        if (keys['ArrowRight'] || keys['d'] || keys['D']) this.angle += TURN_SPEED * turnMultiplier;
        this.isBoosting = (keys['ArrowUp'] || keys['w'] || keys['W']) && this.stamina > 0;
    }
    
    handleMouseControls(turnMultiplier) {
        if (keys['a'] || keys['A']) this.angle -= TURN_SPEED * turnMultiplier;
        if (keys['d'] || keys['D']) this.angle += TURN_SPEED * turnMultiplier;
        
        const usingWASD = keys['a'] || keys['A'] || keys['d'] || keys['D'];
        if (!usingWASD && mouseMovedRecently) {
            let angleDiff = mouseAngle - this.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            const angleChange = angleDiff * MOUSE_TURN_SENSITIVITY * turnMultiplier;
            if (isFinite(angleChange)) {
                this.angle += angleChange;
            }
        }
        
        this.isBoosting = (mouseDown || keys['w'] || keys['W']) && this.stamina > 0;
    }
    
    updateStamina(deltaTime) {
        if (this.isBoosting && this.stamina > 0) {
            if (!this.wasBoosting) {
                playBoostSound(this.isPlayer);
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
            particlePool.spawn(this.x, this.y, vx, vy, color);
        }
    }
    
    updateMovement(deltaTime) {
        if (!isFinite(this.angle)) {
            console.error('Angle is invalid!', this.angle, 'Resetting to 0');
            this.angle = 0;
        }
        
        const moveX = fastMath.cos(this.angle) * this.speed * deltaTime;
        const moveY = fastMath.sin(this.angle) * this.speed * deltaTime;
        
        if (isFinite(moveX) && isFinite(moveY)) {
            this.x += moveX;
            this.y += moveY;
        } else {
            console.error('Invalid movement!', 'angle:', this.angle, 'speed:', this.speed, 'deltaTime:', deltaTime);
        }
    }
    
    checkWorldBoundaries() {
        const boundaryMargin = 2;
        if (this.x <= -boundaryMargin || this.x >= WORLD_SIZE + boundaryMargin || 
            this.y <= -boundaryMargin || this.y >= WORLD_SIZE + boundaryMargin) {
            this.die();
        }
    }
    
    updateSegments() {
        if (!this.segments) {
            console.error('Segments array is undefined!');
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
            console.error('[CRITICAL] Elements array exceeds max visible elements!', this.elements.length);
            this.elements = this.elements.slice(0, this.maxVisibleElements);
        }
        
        const MAX_CHAIN_DEPTH = 3;
        if (depth >= MAX_CHAIN_DEPTH) return;
        
        const possibleCombos = this.findPossibleCombinations();
        
        if (possibleCombos.length === 0) {
            if (this.isPlayer && this === playerSnake) {
                comboStreak = 0;
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
            createCombinationFlash();
            this.glowWobbleIndices = [chosen.index1, chosen.index2];
            this.glowWobbleTime = Date.now();
            updateUI();
        }
        
        const indices = [chosen.index1, chosen.index2].sort((a, b) => b - a);
        this.elements.splice(indices[0], 1);
        this.elements.splice(indices[1], 1);
        
        const insertIndex = Math.floor(Math.random() * (this.elements.length + 1));
        this.elements.splice(insertIndex, 0, chosen.result);
        
        if (this.elements.length > this.maxVisibleElements) {
            console.error('[SAFETY] Elements exceed max after combination, trimming');
            this.elements = this.elements.slice(0, this.maxVisibleElements);
        }
        
        if (chosen.isNewDiscovery) {
            this.handleNewDiscovery(chosen);
        } else {
            this.handleExistingCombination(chosen);
        }
        
        createCombinationParticles(this.segments[0].x, this.segments[0].y);
        
        if (this.isPlayer && this === playerSnake && currentBoss && currentBoss.alive) {
            this.checkBossElementCombination(chosen);
        }
        
        this.checkCombinations(depth + 1);
    }
    
    handleNewDiscovery(chosen) {
        this.discoveredElements.add(chosen.result);
        
        const gameTime = Date.now() - gameStartTime;
        if (this.isPlayer || gameTime > 10000) {
            discoveredElements.add(chosen.result);
        }
        
        if (this.isPlayer && this === playerSnake) {
            const resultId = typeof chosen.result === 'string' ? parseInt(chosen.result) : chosen.result;
            playerDiscoveredElements.add(resultId);
        }
        
        this.score += 500;
        this.discoveries++;
        
        if (this.isPlayer && this === playerSnake) {
            dispatchGameEvent('elementDiscovered', {
                element1: chosen.elem1,
                element2: chosen.elem2,
                result: chosen.result,
                totalDiscoveries: this.discoveries,
                score: this.score
            });
            
            this.saveDiscoveryRecipe(chosen);
            showCombinationMessage(chosen.elem1, chosen.elem2, chosen.result, true);
            this.invincibilityTimer = 2000;
            
            if (this.score > highScore) {
                highScore = this.score;
                localStorage.setItem('highScore', highScore.toString());
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
            allTimeDiscoveries.set(chosen.result, recipe);
            saveAllTimeDiscoveries();
        }
    }
    
    handleExistingCombination(chosen) {
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
            showCombinationMessage(chosen.elem1, chosen.elem2, chosen.result, false);
        }
    }
    
    checkBossElementCombination(chosen) {
        const bossElementId = currentBoss.elementId;
        if (chosen.elem1 === bossElementId || chosen.elem2 === bossElementId || chosen.result === bossElementId) {
            console.log('[SHOCKWAVE] Creating shockwave for player:', this.name);
            
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
            
            shockwaves.push({
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
            
            showMessage('Boss Element Resonance!', 'gold', 3000);
        }
    }
    
    consume(element) {
        if (this.isPlayer) {
            playEatSound();
        }
        
        if (this.elements.length > elementBankSlots) {
            this.elements = this.elements.slice(0, elementBankSlots);
        }
        
        if (this.elements.length >= elementBankSlots) {
            this.tryImmediateCombination(element);
        } else {
            this.addElementToBank(element);
        }
        
        this.elementsEaten++;
        this.length += 2;
        this.score += 100;
        
        if (this.isPlayer && this.score > highScore) {
            highScore = this.score;
            localStorage.setItem('highScore', highScore.toString());
        }
        
        elementPool.remove(element);
        
        if (this.isPlayer) {
            updateUI();
        }
    }
    
    tryImmediateCombination(element) {
        const newElementId = element.id;
        let combined = false;
        
        if (!window.elementLoader || !window.elementLoader.combinations) {
            console.error('[ERROR] ElementLoader or combinations not loaded!');
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
                    updateUI();
                }
                
                setTimeout(() => {
                    this.elements[i] = resultId;
                    
                    if (this.elements.length > elementBankSlots) {
                        console.error('[SAFETY] Elements exceed max after replacement, trimming');
                        this.elements = this.elements.slice(0, elementBankSlots);
                    }
                    
                    if (this.isPlayer) {
                        this.pendingCombinationIndex = -1;
                    }
                    
                    this.processCombinationResult(resultId, newElementId, existingId);
                    this.checkCombinations();
                    updateUI();
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
        
        if (this.elements.length > elementBankSlots) {
            console.error('[SAFETY] Trimming elements array to max size');
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
            
            if (this.isPlayer && this === playerSnake) {
                discoveredElements.add(resultId);
                
                const resultData = window.elementLoader.elements.get(resultId);
                
                if (window.supabaseModule && window.supabaseModule.addGameEvent) {
                    window.supabaseModule.addGameEvent('discovery', {
                        element_id: resultId,
                        element_name: resultData?.n || 'Unknown',
                        recipe: [elem1Id, elem2Id],
                        score: this.score,
                        total_discoveries: this.discoveries
                    });
                }
                
                this.saveDiscoveryFromConsumption(resultId, elem1Id, elem2Id);
                showCombinationMessage(elem1Id, elem2Id, resultId, true);
                this.invincibilityTimer = 2000;
            }
        } else {
            if (this.isPlayer && this === playerSnake) {
                this.handleComboStreak(elem1Id, elem2Id, resultId);
            }
        }
        
        createCombinationParticles(this.segments[0].x, this.segments[0].y);
    }
    
    saveDiscoveryFromConsumption(resultId, elem1Id, elem2Id) {
        const elem1Data = window.elementLoader.elements.get(elem1Id);
        const elem2Data = window.elementLoader.elements.get(elem2Id);
        const resultData = window.elementLoader.elements.get(resultId);
        
        if (elem1Data && elem2Data && resultData) {
            const emoji1 = window.elementLoader.getEmojiForElement(elem1Id, elem1Data.e);
            const emoji2 = window.elementLoader.getEmojiForElement(elem2Id, elem2Data.e);
            const recipe = `${emoji1} ${elem1Data.n} + ${emoji2} ${elem2Data.n}`;
            allTimeDiscoveries.set(resultId, recipe);
            saveAllTimeDiscoveries();
        }
    }
    
    handleComboStreak(elem1Id, elem2Id, resultId) {
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
        showCombinationMessage(elem1Id, elem2Id, resultId, false);
    }
    
    digest() {
        const digestedCount = this.elements.length;
        this.elements = [];
        
        const digestBonus = Math.floor(digestedCount * 50);
        this.score += digestBonus;
        
        if (this.isPlayer && this.score > highScore) {
            highScore = this.score;
            localStorage.setItem('highScore', highScore.toString());
        }
        
        if (this.isPlayer && this === playerSnake && digestedCount > 0) {
            showMessage(`Digesting ${digestedCount} elements! +${digestBonus} points`, false);
            updateUI();
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
                    updateUI();
                }
            }, 300);
        }
    }
    
    die(isBossDeath = false) {
        console.log('[SNAKE DEATH] die() called', {
            isPlayer: this.isPlayer,
            isDying: this.isDying,
            alive: this.isAlive,
            deathAnimationTimer: this.deathAnimationTimer
        });
        
        if (!this.isDying) {
            console.log('[SNAKE DEATH] Starting snake death animation');
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
        
        console.log('[SNAKE DEATH] Processing actual death (alive = false)');
        this.isAlive = false;
        
        this.dropElements();
        
        if (!this.finalExplosionTriggered) {
            const snakeColor = this.color || '#ff0000';
            createDeathParticles(this.x, this.y, this.length, snakeColor, this.elements);
        }
        
        if (this.isPlayer && !isBossDeath) {
            this.createPlayerDeathEffects();
        }
        
        if (this.isPlayer && isBossDeath) {
            this.createBossKillEffects();
        }
    }
    
    dropElements() {
        for (let i = 0; i < this.elements.length && i < this.segments.length; i++) {
            const segment = this.segments[i];
            
            if (!segment || segment.x === undefined || segment.y === undefined) {
                continue;
            }
            
            const baseRadius = 30;
            const maxRadius = 80;
            const radiusProgress = i / Math.max(1, this.elements.length - 1);
            const scatterRadius = baseRadius + (maxRadius - baseRadius) * radiusProgress;
            
            const angle = Math.random() * Math.PI * 2;
            const actualRadius = scatterRadius * (0.5 + Math.random() * 0.5);
            const offsetX = Math.cos(angle) * actualRadius;
            const offsetY = Math.sin(angle) * actualRadius;
            
            let finalX = segment.x + offsetX;
            let finalY = segment.y + offsetY;
            
            const margin = 50;
            finalX = Math.max(margin, Math.min(WORLD_SIZE - margin, finalX));
            finalY = Math.max(margin, Math.min(WORLD_SIZE - margin, finalY));
            
            spawnElement(this.elements[i], finalX, finalY);
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
        
        if (!musicMuted) {
            const explosionSound = new Audio('sounds/big-powerful-explosion.mp3');
            explosionSound.volume = 0.7;
            explosionSound.play().catch(e => {});
        }
        
        bossScreenShakeTimer = 60;
        bossScreenShakeIntensity = 20;
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
        createDeathParticles(this.x, this.y, this.length, snakeColor, this.elements);
        
        if (this.isPlayer && !musicMuted) {
            const retroExplosion = new Audio('sounds/retro-explode-boom.mp3');
            retroExplosion.volume = 0.7;
            retroExplosion.play().catch(e => {});
        }
        
        if (this.isPlayer) {
            this.createDeathCameraShake();
        }
    }
    
    createDeathCameraShake() {
        cameraShake.intensity = 15;
        cameraShake.duration = 500;
        cameraShake.startTime = Date.now();
    }
    
    draw() {
        if (!this.alive && !this.isDying) return;
        
        if (!this.segments || this.segments.length === 0) return;
        
        const deathOpacity = this.calculateDeathOpacity();
        if (deathOpacity <= 0) return;
        
        ctx.save();
        ctx.globalAlpha = deathOpacity;
        
        if (this.invincibilityTimer > 0 && Math.floor(this.invincibilityTimer / 100) % 2 === 0) {
            ctx.globalAlpha *= 0.5;
        }
        
        this.drawSegments();
        this.drawHead();
        
        ctx.restore();
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
    
    drawSegments() {
        const skinData = skinMetadata[this.skin] || skinMetadata['snake-default-green'];
        const skinImg = snakeSkinImages[this.skin];
        const emoji = skinData.emoji;
        
        const effectiveSegmentSize = SEGMENT_SIZE * this.size * cameraZoom;
        const minSize = isMobile ? 8 : 10;
        const maxSize = isMobile ? 30 : 40;
        const clampedSize = Math.max(minSize, Math.min(maxSize, effectiveSegmentSize));
        
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i];
            const screen = worldToScreen(segment.x, segment.y);
            const margin = 100;
            
            if (screen.x < -margin || screen.x > canvas.width + margin ||
                screen.y < -margin || screen.y > canvas.height + margin) continue;
            
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
        
        if (skinImg && skinImg.complete) {
            ctx.drawImage(skinImg, screen.x - size/2, screen.y - size/2, size, size);
        } else {
            const cachedEmoji = getCachedEmoji(emoji, size);
            ctx.drawImage(cachedEmoji, screen.x - cachedEmoji.width/2, screen.y - cachedEmoji.height/2);
        }
    }
    
    drawHead() {
        const headScreen = worldToScreen(this.x, this.y);
        const margin = 100;
        
        if (headScreen.x < -margin || headScreen.x > canvas.width + margin ||
            headScreen.y < -margin || headScreen.y > canvas.height + margin) return;
        
        const effectiveSegmentSize = SEGMENT_SIZE * this.size * cameraZoom;
        const minSize = isMobile ? 10 : 12;
        const maxSize = isMobile ? 35 : 50;
        const headSize = Math.max(minSize, Math.min(maxSize, effectiveSegmentSize * 1.5));
        
        const skinData = skinMetadata[this.skin] || skinMetadata['snake-default-green'];
        const skinImg = snakeSkinImages[this.skin + '-head'] || snakeSkinImages[this.skin];
        
        ctx.save();
        ctx.translate(headScreen.x, headScreen.y);
        ctx.rotate(this.angle);
        
        if (skinImg && skinImg.complete) {
            ctx.drawImage(skinImg, -headSize/2, -headSize/2, headSize, headSize);
        } else {
            const cachedEmoji = getCachedEmoji(skinData.emoji, headSize);
            ctx.drawImage(cachedEmoji, -cachedEmoji.width/2, -cachedEmoji.height/2);
        }
        
        ctx.restore();
        
        this.drawNameAndStats(headScreen, headSize);
    }
    
    drawNameAndStats(headScreen, headSize) {
        const nameOffset = headSize * 0.8;
        
        ctx.font = `${Math.round(10 * cameraZoom)}px 'Press Start 2P'`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        const personalityColor = this.personalityColor || '#ffffff';
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.strokeText(this.name, headScreen.x, headScreen.y - nameOffset);
        
        ctx.fillStyle = this.isPlayer ? '#4ecdc4' : personalityColor;
        ctx.fillText(this.name, headScreen.x, headScreen.y - nameOffset);
        
        const scoreY = headScreen.y - nameOffset - 12 * cameraZoom;
        const scoreText = `${this.score}`;
        
        ctx.strokeText(scoreText, headScreen.x, scoreY);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(scoreText, headScreen.x, scoreY);
    }
    
    getColor() {
        const skinData = skinMetadata[this.skin];
        return skinData ? skinData.color : '#4ecdc4';
    }
    
    updateAI(deltaTime) {
        // AI implementation would go here
        // This is a placeholder for the AI logic
    }
}

export default Snake;