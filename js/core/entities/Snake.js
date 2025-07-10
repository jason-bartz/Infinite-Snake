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
                this.maxVisibleElements = 6; // Fixed max of 6 visible element slots
                this.elementsEaten = 0; // Track total elements eaten
                this.length = 10;
                this.score = 0;
                this.discoveries = 0; // Track discoveries for this snake
                this.kills = 0; // Track kills for this snake
                this.alive = true;
                this.isPlayer = isPlayer;
                this.speed = SNAKE_SPEED;
                this.baseSpeed = SNAKE_SPEED; // Store base speed for boost calculations
                this.name = isPlayer ? 'You' : generateSnakeName();
                this.invincibilityTimer = 0;
                this.size = 1; // Default size for normal snakes
                
                // Death animation properties
                this.deathAnimationTimer = 0;
                this.deathAnimationDuration = 1000; // 1 second death animation
                this.deathFlashPhase = 0;
                this.deathSegmentPhase = 0;
                this.isDying = false;
                
                // Validate size to prevent invisibility
                if (!this.size || this.size <= 0) {
                    this.size = 1;
                    console.warn('Snake size was invalid, setting to 1');
                }
                
                // Debug logging for player snake creation
                if (isPlayer) {
                    console.log('[PLAYER CREATED] Size:', this.size);
                    console.trace(); // Show stack trace to see where it's being called from
                }
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
                            console.log(`[DEBUG] Created Aggressive AI snake: ${this.name}`);
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
                    console.error('Snake position is NaN!', 'x:', this.x, 'y:', this.y, 'deltaTime:', deltaTime);
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
                            console.error('[CONTROLS] WARNING: Multiple player snakes detected! Killing duplicate:', this.name);
                            this.alive = false; // Kill duplicate player snake
                            return;
                        } else {
                            // If there's only one player snake, update the reference
                            console.warn('[CONTROLS] Player snake reference mismatch, updating reference');
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
                    this.stamina -= (100 / (5 * 60)) * deltaTime; // 100 stamina over 5 seconds
                    this.stamina = Math.max(0, this.stamina);
                    this.staminaRegenCooldown = 30; // Half second cooldown before regen starts
                    
                    // Apply speed boost
                    this.speed = this.baseSpeed * 1.75;
                    
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
                        this.stamina += (100 / (2 * 60)) * deltaTime; // 100 stamina over 2 seconds
                        this.stamina = Math.min(this.maxStamina, this.stamina);
                    }
                }
                
                // Ensure angle is valid
                if (!isFinite(this.angle)) {
                    console.error('Angle is invalid!', this.angle, 'Resetting to 0');
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
                    console.error('Invalid movement!', 'angle:', this.angle, 'speed:', this.speed, 'deltaTime:', deltaTime);
                }
                
                // World boundaries - add small margin for floating point precision
                const boundaryMargin = 2; // Small margin to prevent edge case deaths
                if (this.x <= -boundaryMargin || this.x >= WORLD_SIZE + boundaryMargin || 
                    this.y <= -boundaryMargin || this.y >= WORLD_SIZE + boundaryMargin) {
                    this.die();
                    return;
                }
                
                // Update segments
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
                
                // Check element combinations
                this.checkCombinations();
                
                // Update boost state tracking
                this.wasBoostingLastFrame = this.isBoosting;
            }
            
            checkCombinations(depth = 0) {
                if (this.elements.length < 2) return;
                
                // Safety check - ensure we never exceed max elements
                if (this.elements.length > this.maxVisibleElements) {
                    console.error('[CRITICAL] Elements array exceeds max visible elements!', this.elements.length);
                    // Trim to max size
                    this.elements = this.elements.slice(0, this.maxVisibleElements);
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
                const insertIndex = Math.floor(Math.random() * (this.elements.length + 1));
                this.elements.splice(insertIndex, 0, chosen.result);
                
                // Safety check - ensure we never exceed max elements after combination
                if (this.elements.length > this.maxVisibleElements) {
                    console.error('[SAFETY] Elements exceed max after combination, trimming');
                    this.elements = this.elements.slice(0, this.maxVisibleElements);
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
                        console.log('[COMBINATION] Snake:', this.name, 'isPlayer:', this.isPlayer, 'created combination:', chosen.elem1, '+', chosen.elem2, '=', chosen.result, 'Boss element:', currentBoss.elementId);
                    }
                    
                    // Check if this combination involves the boss's element and create shockwave
                    if (this.isPlayer && this === playerSnake && currentBoss && currentBoss.alive) {
                        const bossElementId = currentBoss.elementId;
                        // Check if either of the combining elements or the result is the boss element
                        if (chosen.elem1 === bossElementId || chosen.elem2 === bossElementId || chosen.result === bossElementId) {
                            console.log('[SHOCKWAVE] Creating shockwave for player:', this.name, 'isPlayer:', this.isPlayer, 'playerSnake match:', this === playerSnake);
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
                    console.error('[CRITICAL] Bank already exceeds maximum!', this.elements.length);
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
                        console.error('[ERROR] ElementLoader or combinations not loaded!');
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
                                this.elements[i] = resultId;
                                
                                // Final safety check after replacement (use global elementBankSlots)
                                if (this.elements.length > elementBankSlots) {
                                    console.error('[SAFETY] Elements exceed max after replacement, trimming');
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
                                    if (window.supabaseModule && window.supabaseModule.addGameEvent) {
                                        window.supabaseModule.addGameEvent('discovery', {
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
                    // We have space - add element to a random position within the 6 slots
                    const insertIndex = Math.floor(Math.random() * (this.elements.length + 1));
                    this.elements.splice(insertIndex, 0, element.id);
                    
                    // Immediately enforce max limit as a safety measure (use global elementBankSlots)
                    if (this.elements.length > elementBankSlots) {
                        console.error('[SAFETY] Trimming elements array to max size');
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
                console.log('[SNAKE DEATH] die() called', {
                    isPlayer: this.isPlayer,
                    isDying: this.isDying,
                    alive: this.alive,
                    deathAnimationTimer: this.deathAnimationTimer
                });
                
                // Start death animation if not already dying
                if (!this.isDying) {
                    console.log('[SNAKE DEATH] Starting snake death animation');
                    this.isDying = true;
                    this.deathAnimationTimer = 0;
                    this.speed = 0; // Stop movement during death
                    
                    // Sound will play with pixel explosion at 600ms
                    
                    // For instant death (like boss kills), skip animation
                    if (isBossDeath && this.isPlayer) {
                        this.deathAnimationTimer = this.deathAnimationDuration;
                        this.alive = false; // Immediately mark as dead for boss kills
                        this.deathComplete = true; // Mark death as complete
                    }
                    
                    return; // Don't process death yet, let animation play
                }
                
                console.log('[SNAKE DEATH] Processing actual death (alive = false)');
                this.alive = false;
                
                // Drop all elements with scatter effect
                for (let i = 0; i < this.elements.length && i < this.segments.length; i++) {
                    const segment = this.segments[i];
                    
                    // Skip if segment is undefined or missing position
                    if (!segment || segment.x === undefined || segment.y === undefined) {
                        continue;
                    }
                    
                    // Calculate scatter radius based on position in snake
                    // Head elements scatter less, tail elements scatter more
                    const baseRadius = 30; // Base scatter radius
                    const maxRadius = 80; // Maximum scatter radius
                    const radiusProgress = i / Math.max(1, this.elements.length - 1); // 0 to 1
                    const scatterRadius = baseRadius + (maxRadius - baseRadius) * radiusProgress;
                    
                    // Random angle for circular distribution
                    const angle = Math.random() * Math.PI * 2;
                    
                    // Calculate offset with some randomness
                    const actualRadius = scatterRadius * (0.5 + Math.random() * 0.5); // 50% to 100% of radius
                    const offsetX = Math.cos(angle) * actualRadius;
                    const offsetY = Math.sin(angle) * actualRadius;
                    
                    // Calculate final position
                    let finalX = segment.x + offsetX;
                    let finalY = segment.y + offsetY;
                    
                    // Ensure elements stay within world bounds
                    const margin = 50;
                    finalX = Math.max(margin, Math.min(WORLD_SIZE - margin, finalX));
                    finalY = Math.max(margin, Math.min(WORLD_SIZE - margin, finalY));
                    
                    // Spawn the element at the scattered position
                    spawnElement(this.elements[i], finalX, finalY);
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
                        screenShakeTimer = 20;
                        screenShakeIntensity = 10;
                    }
                }
                
                // Complete death sequence
                if (progress >= 1 && !this.deathComplete) {
                    console.log('[SNAKE DEATH] Snake death animation complete, processing actual death');
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
                
                // Award points and kills to killer
                if (killer && killer.alive) {
                    killer.score += 500; // 500 points for snake explosion
                    killer.kills++; // Increment kill count
                    
                    // Track kill event if player is the killer
                    if (killer.isPlayer) {
                        // Dispatch enemy killed event
                        dispatchGameEvent('enemyKilled', {
                            victimName: this.name,
                            victimScore: this.score,
                            victimLength: this.segments.length,
                            killerScore: killer.score,
                            totalKills: killer.kills
                        });
                        
                        if (window.supabaseModule && window.supabaseModule.addGameEvent) {
                            window.supabaseModule.addGameEvent('kill', {
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
                }
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
                    
                    // Spawn invincibility sparkle particles for player
                    if (this.invincibilityTimer > 0 && this.isPlayer) {
                        // Spawn subtle sparkle particles occasionally
                        if (Math.random() < 0.08) { // 8% chance per segment per frame
                            const sparkleAngle = Math.random() * Math.PI * 2;
                            const sparkleSpeed = 0.5 + Math.random() * 1.5;
                            
                            // Convert segment screen position to world position
                            const worldSegX = segment.x;
                            const worldSegY = segment.y;
                            
                            particlePool.spawn(
                                worldSegX,
                                worldSegY,
                                Math.cos(sparkleAngle) * sparkleSpeed,
                                Math.sin(sparkleAngle) * sparkleSpeed,
                                '#FFD700' // Golden sparkles
                            );
                        }
                    }
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
                    
                    // Spawn invincibility sparkle particles around head for player
                    if (this.invincibilityTimer > 0 && this.isPlayer) {
                        // More frequent particles around the head
                        if (Math.random() < 0.2) { // 20% chance per frame for head
                            // Create a ring of particles around the head
                            const numParticles = 2 + Math.floor(Math.random() * 2);
                            for (let i = 0; i < numParticles; i++) {
                                const angle = Math.random() * Math.PI * 2;
                                const distance = SEGMENT_SIZE * sizeMultiplier * 1.5;
                                const particleX = headX + Math.cos(angle) * distance;
                                const particleY = headY + Math.sin(angle) * distance;
                                const speed = 1 + Math.random() * 2;
                                
                                particlePool.spawn(
                                    particleX,
                                    particleY,
                                    Math.cos(angle) * speed,
                                    Math.sin(angle) * speed,
                                    '#FFD700' // Golden sparkles
                                );
                            }
                        }
                    }
                    
                    // Draw skin image
                    const skinImage = skinImages[this.skin];
                    if (skinImage && skinImage.complete && !skinImage.error) {
                        try {
                            ctx.save();
                            ctx.translate(screenX, screenY);
                            ctx.rotate(angle - Math.PI/2); // Rotate 90 degrees counter-clockwise so top faces body
                            // Increase head size by 15% for regular snakes (not bosses)
                            const baseMultiplier = this.isBoss ? 3.47875 : 3.47875 * 1.15; // 15% increase for non-boss snakes
                            const size = SEGMENT_SIZE * sizeMultiplier * baseMultiplier * cameraZoom;
                            ctx.drawImage(skinImage, -size/2, -size/2, size, size);
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
                        // Split name into personality and actual name parts
                        const personalityName = this.personality.name + ' ';
                        const actualName = this.name.substring(personalityName.length);
                        
                        // Measure text widths
                        ctx.fillStyle = this.personalityColor;
                        const personalityWidth = ctx.measureText(personalityName).width;
                        ctx.fillStyle = 'white';
                        const actualNameWidth = ctx.measureText(actualName).width;
                        const totalWidth = personalityWidth + actualNameWidth;
                        
                        // Draw personality name with color
                        const startX = screenX - totalWidth / 2;
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 3;
                        ctx.strokeText(personalityName, startX + personalityWidth / 2, nameY);
                        ctx.fillStyle = this.personalityColor;
                        ctx.fillText(personalityName, startX + personalityWidth / 2, nameY);
                        
                        // Draw actual name in white
                        ctx.strokeText(actualName, startX + personalityWidth + actualNameWidth / 2, nameY);
                        ctx.fillStyle = 'white';
                        ctx.fillText(actualName, startX + personalityWidth + actualNameWidth / 2, nameY);
                    } else {
                        // Player name or AI without personality - draw normally
                        ctx.strokeStyle = 'black';
                        ctx.lineWidth = 3;
                        ctx.fillStyle = 'white';
                        ctx.strokeText(this.name, screenX, nameY);
                        ctx.fillText(this.name, screenX, nameY);
                    }
                    
                    // Draw crown if leader
                    if (this.isLeader) {
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
                        
                        // Special Cautious behavior - always avoid player
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
                            // Opportunists prefer wounded or very small targets
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
                                    console.log(`[DEBUG] Aggressive AI ${this.name} detected player as nearestPrey at distance ${distance.toFixed(0)}`);
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
                        // Cautious snakes prefer wider gaps
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
                        console.log(`[DEBUG] Aggressive AI ${this.name} entering hunting logic. nearestPrey: ${nearestPrey ? 'YES' : 'NO'}, huntTarget: ${this.huntTarget ? 'YES' : 'NO'}`);
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
                                    console.log(`[DEBUG] Aggressive AI ${this.name} found player snake at distance ${dist.toFixed(0)}, score: ${preyScore.toFixed(2)}`);
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
                                console.log(`[DEBUG] Aggressive AI ${this.name} is now hunting PLAYER! Best score: ${bestPreyScore.toFixed(2)}`);
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
                                    console.log(`[DEBUG] Aggressive AI ${this.name} is actively hunting player! Distance: ${preyDist.toFixed(0)}`);
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
                    right: GAME_WIDTH - targetHead.x,
                    top: targetHead.y,
                    bottom: GAME_HEIGHT - targetHead.y
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
                            cutoffX = Math.min(GAME_WIDTH - 50, targetHead.x + cutoffDistance);
                            cutoffY = targetHead.y + targetVy * 30;
                            break;
                        case 'top':
                            cutoffX = targetHead.x + targetVx * 30;
                            cutoffY = Math.max(50, targetHead.y - cutoffDistance);
                            break;
                        case 'bottom':
                            cutoffX = targetHead.x + targetVx * 30;
                            cutoffY = Math.min(GAME_HEIGHT - 50, targetHead.y + cutoffDistance);
                            break;
                    }
                    
                    return { x: cutoffX, y: cutoffY };
                }
                
                // If not escaping to border, try to cut off based on map center
                // Push them towards dangerous areas (other snakes or borders)
                const centerX = GAME_WIDTH / 2;
                const centerY = GAME_HEIGHT / 2;
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
        
    }
}

export default Snake;
