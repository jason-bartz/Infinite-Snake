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
                this.speed = SNAKE_SPEED * 0.8; // 80% of normal speed (20% slower)
                this.baseSpeed = SNAKE_SPEED * 0.8;
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
                // Shoot 4 fireballs in spread pattern toward player
                const baseAngle = Math.atan2(playerSnake.y - this.y, playerSnake.x - this.x);
                const spreadAngle = Math.PI / 8; // Slightly tighter spread for 4 fireballs
                
                for (let i = -1.5; i <= 1.5; i++) {
                    const angle = baseAngle + (i * spreadAngle);
                    const speed = 8;
                    
                    bossProjectiles.push({
                        x: this.x,
                        y: this.y,
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
                // Shoot water orbs in all directions
                const orbs = 12; // Reduced from 16 for easier dodging
                for (let i = 0; i < orbs; i++) {
                    const angle = (Math.PI * 2 * i) / orbs;
                    const speed = 5; // Reduced from 6 for more reaction time
                    
                    bossProjectiles.push({
                        x: this.x,
                        y: this.y,
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
                        life: 270, // 4.5 seconds total (0.5s warning + 4s active)
                        maxLife: 270,
                        state: 'warning', // Start with warning state
                        warningDuration: 30 // 0.5 seconds of warning
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
                
                // Shoot tornados at the player
                const baseAngle = Math.atan2(playerSnake.y - this.y, playerSnake.x - this.x);
                
                // Create 5 tornados in a spread pattern
                const tornadoCount = 5;
                for (let i = 0; i < tornadoCount; i++) {
                    const spreadAngle = (Math.PI * 2 / tornadoCount) * i; // Evenly distribute in circle
                    const angle = baseAngle + spreadAngle;
                    const spawnDistance = 50; // Spawn tornados away from boss center
                    const speed = 6; // Increased from 4
                    
                    bossProjectiles.push({
                        x: this.x + Math.cos(angle) * spawnDistance,
                        y: this.y + Math.sin(angle) * spawnDistance,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        type: 'tornado',
                        size: 40,
                        damage: 0.3,
                        elementId: 2, // Air element
                        life: 900, // Increased from 600
                        rotation: 0,
                        rotationSpeed: 0.3, // Increased from 0.2
                        wanderAngle: angle,
                        wanderTimer: 0,
                        homingTimer: 300, // 5 seconds of aggressive homing
                        baseSpeed: speed,
                        maxSpeed: 10, // Allow speed boost during tracking
                        separationForce: 0.5 // Prevent clustering
                    });
                }
                
                showMessage("Zephyrus unleashes twisters!", 'purple', 2000);
            }
            
            takeDamage(source = 'unknown') {
                console.trace('[BOSS] Damage call stack');
                
                // Only allow damage from player elemental combinations
                if (source !== 'player_elemental') {
                    console.warn('[BOSS] Damage blocked - not from player elemental:', source);
                    return;
                }
                
                // Make boss invincible during stun period and post-stun invulnerability
                if (this.stunTimer > 0) {
                    console.log('[BOSS] Damage blocked - boss is stunned');
                    return;
                }
                
                if (this.invulnerabilityTimer > 0) {
                    console.log('[BOSS] Damage blocked - boss is invulnerable');
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
                
                // Track score at boss defeat and calculate next spawn
                if (playerSnake) {
                    lastBossDefeatScore = playerSnake.score;
                    calculateNextBossSpawn();
                }
                
                // Award extra revive for defeating boss
                if (gameMode === 'classic' && revivesRemaining < 3) {
                    revivesRemaining++;
                    console.log('[BOSS] Extra revive awarded! Revives remaining:', revivesRemaining);
                    
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
                }

export default Boss;
