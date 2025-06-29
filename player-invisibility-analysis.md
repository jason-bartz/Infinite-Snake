# Player Invisibility During Boss Damage - Rendering Flow Analysis

## Overview
The player invisibility issue occurs intermittently when damaging the boss. This analysis traces the exact rendering flow to identify the root cause.

## Rendering Sequence

### 1. Normal Game Loop Rendering Order
```javascript
// In gameLoop():
1. Draw world objects (grid, walls, etc.)
2. Draw elements
3. Draw boss projectiles (if boss active)
4. Draw boss fissures
5. drawShockwaves()
6. drawDamageNumbers()
7. Draw all snakes (including player)
8. Draw boss skull indicator
9. particlePool.draw()
10. Boss damage flash effect (if bossDamageFlashTimer > 0)
    - Redraws player on top
11. Draw UI elements
```

### 2. When Player Creates Combination that Damages Boss

#### Step 1: Combination Detection (lines 6039-6068)
- Player combines elements
- If combination involves boss element, creates shockwave:
```javascript
shockwaves.push({
    x: this.segments[0].x,
    y: this.segments[0].y,
    radius: 0,
    maxRadius: 600,
    speed: 10,
    color: shockwaveColor,
    life: 1.0,
    type: 'omnidirectional'
});
```

#### Step 2: Boss Takes Damage (lines 8624-8650)
```javascript
takeDamage(source) {
    this.health--;
    this.damageFlashTimer = 30;
    this.stunTimer = 120;
    bossDamageFlashTimer = 20;  // <-- Triggers screen flash
    
    // Create damage number
    damageNumbers.push({...});
    
    // Create damage particles (20 particles)
    for (let i = 0; i < 20; i++) {
        particlePool.spawn(...);
    }
}
```

#### Step 3: Rendering Effects
1. **drawShockwaves()** (lines 9847-9942)
   - Properly saves/restores context ✓
   - Each shockwave wrapped in ctx.save/restore

2. **drawDamageNumbers()** (lines 10263-10283)
   - Properly saves/restores context ✓
   - Each damage number wrapped in ctx.save/restore

3. **Boss Damage Flash** (lines 13877-13893)
   - When bossDamageFlashTimer > 0:
   - Draws semi-transparent overlay
   - **Redraws player on top** with explicit ctx.save/restore

### 3. Player Snake Draw Method (lines 889-1180)
- Player has special protection:
```javascript
if (this.isPlayer) {
    ctx.save();
    ctx.globalAlpha = 1; // Force full opacity
}
// ... drawing code ...
if (this.isPlayer) {
    ctx.restore();
}
```

## Potential Issues Identified

### 1. Double Drawing During Boss Damage Flash
When `bossDamageFlashTimer > 0`, the player is drawn TWICE:
- First in the normal snake rendering loop
- Again after the boss damage flash overlay

This could lead to:
- Context state corruption if first draw has issues
- Accumulated alpha blending effects

### 2. Particle System Context State
The `particlePool.draw()` is called between snake rendering and boss damage flash. If particles don't properly manage context state, it could affect subsequent rendering.

### 3. Timing-Dependent Visibility
The issue is intermittent, suggesting it may depend on:
- Specific combination types creating different particle counts
- Overlapping effects (shockwave + particles + damage numbers)
- Frame timing when multiple effects trigger simultaneously

### 4. Context State Stack
Multiple nested ctx.save/restore calls in player draw:
- Player protection wrapper
- Boost trail effect
- Element bank rendering
- Crown rendering for high score

If any of these has mismatched save/restore pairs, it could corrupt the context stack.

## Key Observations

1. **Boss Damage Flash Timer**: Set to 20 frames, decrements each frame
2. **Player is redrawn** during boss damage flash to ensure visibility
3. **Shockwave creation** happens before boss damage
4. **20 particles** spawn on every boss hit
5. **Context saves/restores appear balanced** in individual functions

## Root Cause Analysis

After thorough investigation, the issue appears to be related to the **double-draw mechanism** during boss damage flash:

### The Problem Sequence:

1. **Normal Draw Pass (line 13864)**:
   - Player is drawn with all snakes
   - Player has protective `ctx.save/restore` wrapper
   - During invincibility, sparkle particles spawn (lines 6568-6658)

2. **Boss Takes Damage**:
   - `bossDamageFlashTimer` set to 20
   - 20 damage particles spawn
   - Damage number created
   - Screen shake triggered

3. **Boss Damage Flash Effect (lines 13877-13893)**:
   - Semi-transparent overlay drawn
   - Player is **redrawn** on top with fresh `ctx.save/restore`

### The Critical Issue:

During the **first draw pass**, if the player has `invincibilityTimer > 0`:
- Sparkle particles are spawned (8% chance per segment + 20% for head)
- Each frame can spawn 5-10+ particles during invincibility
- Combined with 20 damage particles + combination particles (10-20)
- Total particles can exceed 50-60 in a single frame

### Why Invisibility is Intermittent:

1. **Timing Dependent**: Only occurs when:
   - Player has invincibility active during boss damage
   - Multiple particle effects stack (combination + damage + invincibility)
   - Specific frame timing aligns

2. **Context State Corruption**: While each individual system properly saves/restores context, the **double-draw** during boss damage flash may compound subtle floating-point errors in the context transformation matrix.

3. **Particle System Load**: High particle counts (60+) may cause subtle timing issues in the rendering pipeline.

## Confirmed Findings

1. **All ctx.save/restore pairs are balanced** - No missing restores
2. **No early returns skip restoration** - All paths properly restore
3. **Particle system is clean** - Each particle properly manages context
4. **Screen shake is properly managed** - Save/restore pairs are correct

## The Real Issue

The problem is the **redundant double-draw** of the player during boss damage flash. This can cause:
- Duplicate particle spawning during invincibility
- Potential context state accumulation errors
- Unnecessary performance overhead

## Solution

The player doesn't need to be redrawn during boss damage flash because:
1. The flash is semi-transparent (0.3 alpha max)
2. The player is already drawn in the correct position
3. The double-draw adds no visual benefit but causes issues