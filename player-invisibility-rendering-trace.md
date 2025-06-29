# Player Invisibility Rendering Trace - Complete Analysis

## Executive Summary

The intermittent player invisibility during boss damage is caused by a **redundant double-draw mechanism** that triggers when the player has invincibility active while damaging the boss. The issue compounds when multiple particle effects stack, potentially causing context state issues.

## Exact Rendering Flow When Player Damages Boss

### 1. Player Creates Combination (lines 6036-6068)
```
→ createCombinationParticles() spawns 10-20 particles
→ If combination involves boss element:
  → shockwaves.push() creates omnidirectional shockwave
  → Boss element resonance detected
```

### 2. Boss Damage Check (lines 9690-9730)
```
→ checkBossElementalDamage() called
→ currentBoss.takeDamage('player_elemental')
  → bossDamageFlashTimer = 20
  → damageNumbers.push() creates floating "-1"
  → 20 damage particles spawn
  → bossScreenShakeTimer = 60
```

### 3. Main Render Loop (gameLoop function)

#### Pre-render Setup:
```
→ Screen shake applied if bossScreenShakeTimer > 0
  → ctx.save()
  → ctx.translate(shakeX, shakeY)
```

#### Render Order:
```
1. drawBackground()
2. elementPool.draw()
3. AlchemyVision power-ups
4. Void Orbs
5. Catalyst Gems
6. Boss projectiles & effects:
   → drawBossFissures()
   → drawBossProjectiles()
   → drawShockwaves() ← All have proper ctx.save/restore
   → drawDamageNumbers() ← Proper ctx.save/restore
7. All snakes (including player):
   → snake.draw(interpolation)
     → Player has ctx.save() at start
     → If invincibilityTimer > 0:
       → Spawns golden sparkle particles (8% per segment, 20% head)
     → Player has ctx.restore() at end
8. drawBossSkullIndicator()
9. particlePool.draw()
   → Each particle has ctx.save/restore
10. Boss damage flash (if bossDamageFlashTimer > 0):
    → ctx.save()
    → Draw semi-transparent overlay
    → ctx.restore()
    → ⚠️ REDRAWS PLAYER AGAIN ⚠️
      → ctx.save()
      → playerSnake.draw(interpolation)
      → ctx.restore()
11. Screen shake restore if active
```

## Critical Timing Analysis

### When Player is Invisible:
1. **Player has invincibilityTimer > 0** (from previous damage/respawn)
2. **Player creates combination that damages boss**
3. **Frame timing aligns such that:**
   - Invincibility sparkles spawn (5-10 particles)
   - Combination particles spawn (10-20 particles)
   - Boss damage particles spawn (20 particles)
   - Total: 35-50+ particles in one frame

### The Double-Draw Problem:
- **First draw**: Player rendered normally with invincibility effects
- **Second draw**: Player redrawn during boss damage flash
- This can cause:
  - Duplicate particle spawning
  - Context transformation accumulation
  - Subtle rendering state corruption

## Context Save/Restore Verification

### ✅ Properly Balanced:
- `drawShockwaves()`: Each shockwave wrapped in save/restore
- `drawDamageNumbers()`: Each number wrapped in save/restore
- `Particle.draw()`: Each particle wrapped in save/restore
- `Snake.draw()`: Player wrapped in save/restore
- Screen shake: Properly saved/restored
- Boss damage flash: Properly saved/restored

### ❌ Issue Found:
- Player is drawn TWICE when `bossDamageFlashTimer > 0`
- No visual benefit from double-draw
- Potential source of rendering corruption

## Why Some Attacks Cause Invisibility While Others Don't

### Attacks That Cause Invisibility:
- Combinations during player invincibility period
- High particle count scenarios (50+ particles)
- Specific frame timing alignment

### Attacks That Don't:
- Combinations without invincibility active
- Lower particle counts
- Different frame timing

## Recommended Fix

Remove the redundant player redraw during boss damage flash:

```javascript
// Draw boss damage flash
if (bossDamageFlashTimer > 0) {
    ctx.save();
    ctx.globalAlpha = bossDamageFlashTimer / 20 * 0.3;
    ctx.fillStyle = currentBoss ? currentBoss.color : '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    bossDamageFlashTimer--;
    
    // REMOVE THIS ENTIRE BLOCK - Player already drawn correctly
    // if (playerSnake && playerSnake.alive) {
    //     ctx.save();
    //     ctx.globalAlpha = 1;
    //     playerSnake.draw(interpolation);
    //     ctx.restore();
    // }
}
```

The boss damage flash is only 30% opacity maximum, so the player remains visible through it without needing a redraw.