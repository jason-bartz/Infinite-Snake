const BOSS_CONSTANTS = {
    SPEED_MULTIPLIER: 0.8,
    INTRO_ANIMATION_DURATION: 120,
    ATTACK_PHASE_DURATION: 180,
    CHASE_PHASE_DURATION: 240,
    INVULNERABILITY_DURATION: 180,
    DAMAGE_FLASH_DURATION: 10,
    LAUGH_MIN_DELAY: 15000,
    LAUGH_MAX_DELAY: 10000,
    LAUGH_TRIGGER_DISTANCE: 400,
    ATTACK_TRIGGER_DISTANCE: 600,
    HEALTH_ENRAGE_THRESHOLD: 0.3,
    ENRAGE_SPEED_MULTIPLIER: 1.3,
    ENRAGE_COOLDOWN_MULTIPLIER: 0.7,
    MAX_TURN_SPEED: 0.035,
    TURN_SMOOTHING: 0.1,
    VACUUM_ATTACK_INTERVAL: 4,
    BOSS_SIZE: 3,
    BOSS_LENGTH: 30,
    STATIONARY_ATTACK_INTERVAL: 20,
    STUN_PARTICLE_COUNT: 20,
    STUN_PARTICLE_MIN_SPEED: 2,
    STUN_PARTICLE_MAX_SPEED: 3,
    FLASH_WOBBLE_AMPLITUDE: 0.1,
    FLASH_WOBBLE_FREQUENCY: 0.3,
    RANDOM_WOBBLE_AMPLITUDE: 10,
    INTRO_FLASH_FREQUENCY: 4,
    INTRO_FLASH_ALPHA: 0.3,
    INTRO_FLASH_RADIUS: 100,
    ENRAGE_AURA_RADIUS: 50,
    ENRAGE_AURA_MIN_ALPHA: 0.3,
    ENRAGE_AURA_MAX_ALPHA: 0.2,
    ENRAGE_AURA_FREQUENCY: 0.01,
    FIREBALL_SPREAD_COUNT: 3,
    FIREBALL_SPREAD_ANGLE: 0.2,
    FIREBALL_SPEED: 5,
    WAVE_COUNT: 5,
    WAVE_SPEED: 6,
    WAVE_SPAWN_DELAY: 100,
    WIND_SPEED: 8,
    WIND_KNOCKBACK_FORCE: 15,
    ROCK_SPEED: 4,
    ROCK_GRAVITY: 0.15,
    VACUUM_MAX_RADIUS: 600,
    VACUUM_DURATION: 3000,
    PROJECTILE_DEFAULT_RADIUS: 15,
    PROJECTILE_LARGE_RADIUS: 20,
    PROJECTILE_WIND_RADIUS: 25,
    PROJECTILE_ROCK_RADIUS: 25
};

class Boss extends Snake {
    constructor(bossType, x, y) {
        super(x, y, false);
        this.isBoss = true;
        
        this.initializeBossProperties(bossType);
        this.initializeBossStats();
        this.initializeBossSegments();
        this.initializeBossElements();
    }
    
    initializeBossProperties(bossType) {
        this.bossType = bossType;
        const bossData = BOSS_TYPES[bossType];
        
        this.baseName = bossData.name;
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
    }
    
    initializeBossStats() {
        this.size = BOSS_CONSTANTS.BOSS_SIZE;
        this.length = BOSS_CONSTANTS.BOSS_LENGTH;
        this.speed = SNAKE_SPEED * BOSS_CONSTANTS.SPEED_MULTIPLIER;
        this.baseSpeed = SNAKE_SPEED * BOSS_CONSTANTS.SPEED_MULTIPLIER;
        this.attackTimer = 0;
        this.introAnimationTimer = BOSS_CONSTANTS.INTRO_ANIMATION_DURATION;
        this.damageFlashTimer = 0;
        this.stunTimer = 0;
        this.invulnerabilityTimer = 0;
        
        this.attackPhase = false;
        this.attackPhaseTimer = 0;
        this.attackPhaseDuration = BOSS_CONSTANTS.ATTACK_PHASE_DURATION;
        this.chasePhaseDuration = BOSS_CONSTANTS.CHASE_PHASE_DURATION;
        this.phaseTimer = this.chasePhaseDuration;
        
        this.laughCooldown = 0;
        this.nextLaughDelay = BOSS_CONSTANTS.LAUGH_MIN_DELAY + Math.random() * BOSS_CONSTANTS.LAUGH_MAX_DELAY;
        
        this.specialAttackCounter = 0;
        this.vacuumAttackInterval = 4;
    }
    
    initializeBossSegments() {
        this.segments = [];
        for (let i = 0; i < this.length; i++) {
            const segX = this.x - i * SEGMENT_SIZE * this.size * Math.cos(this.angle);
            const segY = this.y - i * SEGMENT_SIZE * this.size * Math.sin(this.angle);
            this.segments.push({
                x: segX,
                y: segY,
                prevX: segX,
                prevY: segY
            });
        }
    }
    
    initializeBossElements() {
        for (let i = 0; i < 4; i++) {
            this.elements.push(this.elementId);
        }
    }
    
    update(deltaTime = 1) {
        if (!this.isAlive) return;
        
        this.updateTimers(deltaTime);
        
        if (this.introAnimationTimer > 0) return;
        if (this.stunTimer > 0) return;
        
        this.updatePhases(deltaTime);
        this.updateMovement(deltaTime);
        this.updateAttacks(deltaTime);
        this.updateLaugh(deltaTime);
        
        super.update(deltaTime);
    }
    
    updateTimers(deltaTime) {
        if (this.introAnimationTimer > 0) {
            this.introAnimationTimer -= deltaTime;
        }
        
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime;
        }
        
        if (this.stunTimer > 0) {
            this.stunTimer -= deltaTime;
            if (this.stunTimer <= 0) {
                this.invulnerabilityTimer = 180;
            }
        }
        
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= deltaTime;
        }
    }
    
    updatePhases(deltaTime) {
        this.phaseTimer -= deltaTime;
        
        if (this.phaseTimer <= 0) {
            if (this.attackPhase) {
                this.attackPhase = false;
                this.phaseTimer = this.chasePhaseDuration;
            } else {
                this.attackPhase = true;
                this.phaseTimer = this.attackPhaseDuration;
                this.attackPhaseTimer = 0;
            }
        }
    }
    
    updateMovement(deltaTime) {
        if (this.attackPhase) {
            this.speed = 0;
            this.attackPhaseTimer += deltaTime;
            
            if (this.attackPhaseTimer % 20 === 0) {
                this.performStationaryAttack();
            }
        } else {
            this.speed = this.baseSpeed;
            this.chasePlayer(deltaTime);
        }
    }
    
    updateAttacks(deltaTime) {
        if (this.attackTimer > 0) {
            this.attackTimer -= deltaTime;
        }
        
        if (!this.attackPhase && this.attackTimer <= 0 && playerSnake && playerSnake.isAlive) {
            const dx = playerSnake.x - this.x;
            const dy = playerSnake.y - this.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 600) {
                this.performAttack();
                this.attackTimer = this.attackCooldown;
            }
        }
    }
    
    updateLaugh(deltaTime) {
        this.laughCooldown -= deltaTime;
        
        if (this.laughCooldown <= 0 && playerSnake && playerSnake.isAlive && !this.attackPhase) {
            const dx = playerSnake.x - this.x;
            const dy = playerSnake.y - this.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < 400) {
                this.playLaughSound();
                this.laughCooldown = this.nextLaughDelay;
                this.nextLaughDelay = BOSS_CONSTANTS.LAUGH_MIN_DELAY + Math.random() * BOSS_CONSTANTS.LAUGH_MAX_DELAY;
            }
        }
    }
    
    chasePlayer(deltaTime) {
        if (!playerSnake || !playerSnake.isAlive) return;
        
        const dx = playerSnake.x - this.x;
        const dy = playerSnake.y - this.y;
        const targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - this.angle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        
        const maxTurn = 0.035 * deltaTime;
        if (Math.abs(angleDiff) > maxTurn) {
            this.angle += Math.sign(angleDiff) * maxTurn;
        } else {
            this.angle += angleDiff * 0.1;
        }
    }
    
    performStationaryAttack() {
        if (!playerSnake || !playerSnake.isAlive) return;
        
        this.specialAttackCounter++;
        
        if (this.bossType === 'zephyrus' && this.specialAttackCounter % this.vacuumAttackInterval === 0) {
            this.createVacuumAttack();
        } else {
            this.createProjectileAttack();
        }
    }
    
    performAttack() {
        if (!playerSnake || !playerSnake.isAlive) return;
        
        const dx = playerSnake.x - this.x;
        const dy = playerSnake.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        switch (this.bossType) {
            case 'pyroclast':
                this.createFireballAttack(angle);
                break;
            case 'neptune':
                this.createWaveAttack(angle);
                break;
            case 'zephyrus':
                this.createWindBlastAttack(angle);
                break;
            case 'titan':
                this.createRockThrowAttack(angle);
                break;
        }
        
        this.playAttackSound();
    }
    
    createFireballAttack(angle) {
        for (let i = -1; i <= 1; i++) {
            const spreadAngle = angle + i * 0.2;
            bossProjectiles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(spreadAngle) * 5,
                vy: Math.sin(spreadAngle) * 5,
                type: 'fireball',
                owner: this,
                damage: 1,
                radius: 15,
                color: '#ff4444',
                emoji: '🔥'
            });
        }
    }
    
    createWaveAttack(angle) {
        const waveCount = 5;
        for (let i = 0; i < waveCount; i++) {
            setTimeout(() => {
                bossProjectiles.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * 6,
                    vy: Math.sin(angle) * 6,
                    type: 'wave',
                    owner: this,
                    damage: 1,
                    radius: 20,
                    color: '#0066ff',
                    emoji: '🌊'
                });
            }, i * 100);
        }
    }
    
    createWindBlastAttack(angle) {
        const vx = Math.cos(angle) * 8;
        const vy = Math.sin(angle) * 8;
        
        bossProjectiles.push({
            x: this.x,
            y: this.y,
            vx: vx,
            vy: vy,
            type: 'wind',
            owner: this,
            damage: 1,
            radius: 25,
            color: '#ffffff',
            emoji: '💨',
            knockback: true,
            knockbackForce: 15
        });
    }
    
    createRockThrowAttack(angle) {
        const baseSpeed = 4;
        const projectile = {
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * baseSpeed,
            vy: Math.sin(angle) * baseSpeed,
            type: 'rock',
            owner: this,
            damage: 2,
            radius: 25,
            color: '#8b6914',
            emoji: '🪨',
            gravity: 0.15
        };
        
        bossProjectiles.push(projectile);
    }
    
    createVacuumAttack() {
        elementVacuumActive = true;
        elementVacuumCenter = { x: this.x, y: this.y };
        elementVacuumRadius = 0;
        elementVacuumMaxRadius = 600;
        elementVacuumDuration = 3000;
        elementVacuumStartTime = Date.now();
        
        const vacuumSound = new Audio('sounds/vacuum-wind.mp3');
        vacuumSound.volume = 0.7;
        vacuumSound.play().catch(e => {});
    }
    
    createProjectileAttack() {
        if (!playerSnake || !playerSnake.isAlive) return;
        
        const dx = playerSnake.x - this.x;
        const dy = playerSnake.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        switch (this.bossType) {
            case 'pyroclast':
                this.createFireballAttack(angle);
                break;
            case 'neptune':
                this.createWaveAttack(angle);
                break;
            case 'zephyrus':
                this.createWindBlastAttack(angle);
                break;
            case 'titan':
                this.createRockThrowAttack(angle);
                break;
        }
        
        this.playAttackSound();
    }
    
    playAttackSound() {
        if (!musicMuted && this.attackSound) {
            const sound = new Audio(this.attackSound);
            sound.volume = 0.5;
            sound.play().catch(e => {});
        }
    }
    
    playLaughSound() {
        if (!musicMuted) {
            const laughSounds = [
                'sounds/boss-evil-laugh-1.mp3',
                'sounds/boss-evil-laugh-2.mp3',
                'sounds/boss-evil-laugh-3.mp3'
            ];
            const randomLaugh = laughSounds[Math.floor(Math.random() * laughSounds.length)];
            const laughSound = new Audio(randomLaugh);
            laughSound.volume = 0.6;
            laughSound.play().catch(e => {});
        }
    }
    
    takeDamage(amount) {
        if (this.invulnerabilityTimer > 0 || this.stunTimer > 0) return;
        
        this.health -= amount;
        this.damageFlashTimer = 10;
        updateBossHealthBar();
        
        const hurtSound = new Audio('sounds/boss-hurt.mp3');
        hurtSound.volume = 0.6;
        hurtSound.play().catch(e => {});
        
        if (this.health <= 0) {
            this.die();
            this.onBossDefeat();
        } else if (this.health <= this.maxHealth * 0.3 && !this.isEnraged) {
            this.enterEnragedMode();
        }
    }
    
    enterEnragedMode() {
        this.isEnraged = true;
        this.baseSpeed *= 1.3;
        this.attackCooldown *= 0.7;
        
        showMessage(`${this.name} is ENRAGED!`, 'boss', 3000);
        
        const enrageSound = new Audio('sounds/boss-enrage.mp3');
        enrageSound.volume = 0.8;
        enrageSound.play().catch(e => {});
    }
    
    stun(duration) {
        this.stunTimer = duration;
        this.speed = 0;
        
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const speed = 2 + Math.random() * 3;
            particlePool.spawn(
                this.x,
                this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffff00',
                4
            );
        }
    }
    
    onBossDefeat() {
        showMessage(`${this.name} DEFEATED!`, 'victory', 5000);
        
        const defeatSound = new Audio('sounds/boss-defeat.mp3');
        defeatSound.volume = 0.8;
        defeatSound.play().catch(e => {});
        
        setTimeout(() => {
            bossDefeated = true;
            currentBoss = null;
            bossHealthBarElement.style.display = 'none';
            
            if (this.isUndead) {
                gameWon = true;
                showVictoryScreen();
            } else {
                bossDeathCount++;
                setTimeout(spawnBoss, 30000);
            }
        }, 2000);
    }
    
    draw() {
        if (!this.isAlive) return;
        
        ctx.save();
        
        if (this.damageFlashTimer > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(this.damageFlashTimer * 0.5) * 0.5;
        }
        
        if (this.stunTimer > 0) {
            const stunWobble = Math.sin(this.stunTimer * 0.3) * 0.1;
            ctx.translate(
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );
        }
        
        super.draw();
        
        this.drawBossEffects();
        
        ctx.restore();
    }
    
    drawBossEffects() {
        if (this.introAnimationTimer > 0) {
            const progress = 1 - (this.introAnimationTimer / 120);
            const flashAlpha = Math.sin(progress * Math.PI * 4) * 0.5 + 0.5;
            
            ctx.save();
            ctx.globalAlpha = flashAlpha * 0.3;
            ctx.fillStyle = this.color;
            const flashRadius = 100 * progress;
            ctx.beginPath();
            ctx.arc(this.x, this.y, flashRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        
        if (this.isEnraged) {
            const screen = worldToScreen(this.x, this.y);
            ctx.save();
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2;
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 50 * this.size * cameraZoom, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

export default Boss;