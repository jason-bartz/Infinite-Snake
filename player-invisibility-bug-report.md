# Player Invisibility Bug Analysis Report

## Executive Summary
After analyzing the code, I've identified the player invisibility bug mechanism and created test scenarios to investigate it. The bug appears to be related to the canvas context state management during player respawn after boss damage.

## Bug Details

### 1. **When does the player turn invisible?**
Based on code analysis, the player can become invisible in the following scenarios:

- **After respawn**: When the player respawns after being killed by a boss
- **During invincibility frames**: The player has a 3-second invincibility timer after respawn (line 6510: `playerSnake.invincibilityTimer = 3000;`)
- **Context state corruption**: If the canvas context's `globalAlpha` is not properly restored

### 2. **Boss-specific occurrence**
The bug can happen with all boss types as they all use the same damage/death mechanism:
- PYRAXIS (fireball projectiles)
- ABYSSOS (water waves)
- OSSEUS (falling rocks and craters)
- ZEPHYRUS (wind attacks)

All boss projectiles check for `playerSnake.invincibilityTimer <= 0` before dealing damage, and all result in `playerSnake.die(true)` being called.

### 3. **Duration of invisibility**
The invisibility appears to be permanent until:
- The player dies again and respawns
- The game is reloaded
- A new boss encounter starts

### 4. **Animation/Effect correlation**
The invisibility correlates with:
- **Invincibility particle effects**: Golden sparkle particles are spawned during invincibility (lines 6585-6603)
- **Canvas alpha manipulation**: Multiple parts of the code modify `ctx.globalAlpha`
- **Boss damage flash effects**: `bossDamageFlashTimer` affects screen rendering

### 5. **Hitbox vs Visual**
The player's hitbox remains active even when invisible:
- Collision detection continues to work normally
- The player can still collect elements and interact with the game
- Only the visual representation is affected

### 6. **Damage method analysis**
All damage methods follow the same pattern:
```javascript
if (playerSnake.invincibilityTimer <= 0) {
    // Create particles
    playerSnake.die(true);
    showMessage('Death message', 'red');
}
```

### 7. **Console errors/warnings**
The code includes debug logging for player invisibility:
```javascript
// Line 6472-6486: Debug logging for player invisibility issue
if (this.isPlayer && bossEncounterActive) {
    console.log('[PLAYER DRAW DEBUG]', {
        size: this.size,
        sizeMultiplier: sizeMultiplier,
        // ... other debug info
    });
}
```

## Root Cause Analysis

### Primary Issue: Context State Management
The player's draw function saves and restores the canvas context:
```javascript
// Line 6463-6465
if (this.isPlayer) {
    ctx.save();
    ctx.globalAlpha = 1; // Force full opacity for player
}

// Line 6766-6769
// Restore context state for player
if (this.isPlayer) {
    ctx.restore();
}
```

However, there are several places where `ctx.globalAlpha` is modified between save and restore, particularly during:
1. Boost trail effects (line 6512: `ctx.globalAlpha = 0.3;`)
2. Invincibility particle rendering
3. Boss damage flash effects

### Potential Bug Scenario
1. Player dies from boss damage
2. Respawn timer counts down
3. Player respawns with 3s invincibility
4. During the draw cycle, some effect modifies `globalAlpha`
5. The context state is not properly restored
6. Subsequent draws use the corrupted alpha value

## Reproduction Steps

### Method 1: Boss Death and Respawn
1. Start the game and collect elements to increase size
2. Trigger a boss encounter (reach 50k score or use console: `spawnBoss('PYRAXIS')`)
3. Get hit by any boss projectile to die
4. Wait for the respawn timer (or force respawn)
5. Observe if the player snake is invisible after respawn

### Method 2: Multiple Deaths
1. Die to a boss
2. Respawn
3. Die again quickly (within invincibility period if possible)
4. Check visibility after second respawn

### Method 3: Console Testing
```javascript
// Load the test suite
const script = document.createElement('script');
script.src = 'test-player-invisibility.js';
document.head.appendChild(script);

// Run tests
testInvisibility.run();

// Force specific scenarios
testInvisibility.forceRespawn();
testInvisibility.spawnBoss('PYRAXIS');
testInvisibility.monitorPlayer();
```

## Recommended Fixes

### Fix 1: Ensure Context Isolation
```javascript
draw(interpolation = 0) {
    if (!this.alive) return;
    
    // Save entire context state at the beginning
    ctx.save();
    
    try {
        // All drawing code here
        
    } finally {
        // Always restore context, even if errors occur
        ctx.restore();
    }
}
```

### Fix 2: Reset Alpha Before Player Draw
```javascript
// Before drawing player segments
ctx.globalAlpha = 1.0; // Ensure full opacity
```

### Fix 3: Separate Invincibility Rendering
Move invincibility effects to a separate rendering pass to avoid alpha conflicts.

## Test Results Expected

When running the test suite, you should see:
1. **Visibility states logged** showing alpha < 1 during player rendering
2. **Timing correlation** between respawn and invisibility start
3. **Boss-specific patterns** if certain bosses trigger it more often
4. **Console warnings** about player alpha values

## Additional Notes

- The bug appears to be a rendering issue, not a game logic issue
- The player's actual game state (position, health, collision) remains intact
- The issue is specifically related to the visual representation
- Mobile and desktop may behave differently due to different rendering optimizations

To use the test suite:
1. Open the game in a browser
2. Open the console (F12)
3. Copy and paste the test suite code
4. Run `testInvisibility.run()` to start automated testing
5. Check `testInvisibility.getResults()` for test results after 35 seconds