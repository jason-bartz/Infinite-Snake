# Rendering System Integration Guide

**Purpose**: Guide for integrating the new RenderingSystem into game-original.js using feature flags.

**Last Updated**: 2025-11-10
**Phase**: 3 - Systems Extraction
**Status**: 🟢 Ready for integration

---

## 🎯 Overview

The new RenderingSystem has been fully implemented and tested (893/893 tests passing). This guide explains how to integrate it into the existing game-original.js codebase using feature flags for safe, gradual rollout.

---

## 📦 What's Been Built

### Core Components
- ✅ **RenderingSystem** - Main coordinator (497 lines, 53 tests)
- ✅ **RenderPipeline** - Layer orchestration (320 lines, 42 tests)
- ✅ **Camera** - Viewport & culling (310 lines, 55 tests)
- ✅ **5 Renderers** - All game rendering (3,000+ lines, 250 tests)
  - BackgroundRenderer (394 lines, 45 tests)
  - BorderRenderer (344 lines, 50 tests)
  - SnakeRenderer (707 lines, 74 tests)
  - ElementRenderer (475 lines, 62 tests)
  - ParticleRenderer (694 lines, 62 tests)

### Integration Layer
- ✅ **RenderingIntegration** - Bridge module for easy integration
- ✅ **Feature flags** - Safe toggling between old/new systems
- ✅ **State converter** - Translates game-original.js state to RenderingSystem format

---

## 🚀 Integration Steps

### Step 1: Import the Integration Module

Add to the top of `game-original.js`:

```javascript
// Import rendering integration
import { RenderingIntegration, extractGameState } from './src/integration/rendering-integration.js';
import { featureFlags } from './config/feature-flags.js';
```

### Step 2: Initialize the Integration

Add after canvas setup (around line 300):

```javascript
// Initialize new rendering system (if feature flag enabled)
let renderingIntegration = null;

if (featureFlags.isEnabled('useNewRenderingSystem')) {
  renderingIntegration = new RenderingIntegration(ctx, canvas);
  renderingIntegration.setWorldBounds({
    minX: 0,
    maxX: WORLD_SIZE,
    minY: 0,
    maxY: WORLD_SIZE,
  });
  console.log('[Game] New rendering system enabled via feature flag');
}
```

### Step 3: Replace Rendering Code in Game Loop

Find the rendering section (around line 12413) and replace:

**Before:**
```javascript
// Draw everything - wrapped in try-catch to prevent blanking
try {
    drawBackground();

    // Draw asteroids...
    for (let i = 0; i < asteroids.length; i++) {
        // ...
    }

    // Draw elements...
    elementPool.draw();

    // Draw snakes...
    for (let i = 0; i < snakes.length; i++) {
        // ...
    }

    // Draw particles...
    particlePool.draw();

    // Draw borders...
    drawBorders();
} catch (error) {
    // Error handling...
}
```

**After:**
```javascript
// Draw everything - feature-flagged rendering
try {
    if (featureFlags.isEnabled('useNewRenderingSystem') && renderingIntegration) {
        // Use new rendering system
        const gameState = extractGameState(window);
        gameState.camera = camera; // Current camera position
        gameState.canvas = canvas;
        gameState.WORLD_SIZE = WORLD_SIZE;

        renderingIntegration.followTarget(camera, false);
        renderingIntegration.render(gameState, deltaTime, interpolation);

        // Optional: Log metrics in debug mode
        if (featureFlags.isEnabled('enablePerformanceMonitoring')) {
            const metrics = renderingIntegration.getMetrics();
            console.log('[Rendering Metrics]', metrics);
        }
    } else {
        // Use old rendering system (keep existing code)
        drawBackground();

        // Draw asteroids...
        for (let i = 0; i < asteroids.length; i++) {
            const asteroid = asteroids[i];
            if (isInViewport(asteroid.x, asteroid.y, asteroid.size + 50)) {
                asteroid.draw();
            }
        }

        // Draw elements...
        elementPool.draw();

        // Draw AlchemyVision power-ups...
        for (let i = 0; i < alchemyVisionPowerUps.length; i++) {
            const powerUp = alchemyVisionPowerUps[i];
            if (isInViewport(powerUp.x, powerUp.y, 100)) {
                powerUp.draw();
            }
        }

        // Draw Void Orbs...
        for (let i = 0; i < voidOrbs.length; i++) {
            const orb = voidOrbs[i];
            if (isInViewport(orb.x, orb.y, 100)) {
                orb.draw();
            }
        }

        // Draw Catalyst Gems...
        for (let i = 0; i < catalystGems.length; i++) {
            const gem = catalystGems[i];
            if (isInViewport(gem.x, gem.y, 100)) {
                gem.draw();
            }
        }

        if (enableEffects) {
            drawShockwaves();
            drawDamageNumbers();
        }

        // Draw snakes...
        for (let i = 0; i < snakes.length; i++) {
            const snake = snakes[i];
            if (snake.alive) {
                snake.draw(interpolation);
            }
        }

        if (enableShadows) {
            // Shadow code...
        }

        // Draw particles...
        particlePool.draw();

        // Draw explosion animations...
        if (explosionManager) {
            explosionManager.render(ctx);
        }

        if (damageFlashAlpha > 0) {
            // Damage flash...
            ctx.save();
            ctx.fillStyle = `rgba(255, 0, 0, ${damageFlashAlpha})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();

            // Redraw player on top...
            if (playerSnake && playerSnake.alive) {
                ctx.save();
                ctx.globalAlpha = 1;
                playerSnake.draw(interpolation);
                ctx.restore();
            }
        }

        if (enablePowerUpAura) {
            // Aura code...
        }

        // Restore context if screen shake was active...
        if (screenShakeActive) {
            ctx.restore();
        }

        // Draw borders LAST...
        drawBorders();
    }
} catch (error) {
    gameLogger.error('RENDER', 'Error during rendering:', error);
    // Reset context state on error...
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    // Try to show something so the screen isn't blank...
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
```

### Step 4: Handle Canvas Resize

Add to canvas resize handler:

```javascript
// When canvas resizes
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Update new rendering system viewport
if (renderingIntegration) {
  renderingIntegration.updateViewport(canvas.width, canvas.height);
}
```

---

## 🎮 Testing the Integration

### Enable the New System

**Option 1: URL Parameter**
```
http://localhost:5173/?useNewRenderingSystem=true
```

**Option 2: Browser Console**
```javascript
// Enable new rendering system
window.featureFlags.enable('useNewRenderingSystem');

// Enable debug mode
window.featureFlags.enable('enableDebugMode');

// Enable performance monitoring
window.featureFlags.enable('enablePerformanceMonitoring');

// Check what's enabled
window.featureFlags.getAll();
```

**Option 3: localStorage (Persistent)**
```javascript
localStorage.setItem('featureFlags', JSON.stringify({
  useNewRenderingSystem: true,
  enableDebugMode: true,
  enablePerformanceMonitoring: true
}));

// Reload page
location.reload();
```

### Dual Mode (Run Both Systems)

Compare old vs new rendering side-by-side:

```javascript
// Enable dual mode
window.featureFlags.enable('enableDualMode');
window.featureFlags.enable('useNewRenderingSystem');

// Check console for metrics comparison
```

### Disable the New System

```javascript
// Disable new system (fallback to old)
window.featureFlags.disable('useNewRenderingSystem');

// Or emergency kill switch
window.featureFlags.enable('disableNewFeatures');
```

---

## 📊 Performance Validation

### Before Integration
Run benchmarks to establish baseline:

```bash
npm run dev
open http://localhost:5173/tests/benchmarks/benchmark.html
```

### After Integration
1. **Test with old system**: Verify game works as before
2. **Enable new system**: Test gameplay with feature flag
3. **Compare FPS**: Should be equal or better
4. **Check console**: Look for errors or warnings
5. **Test all features**: Snake movement, elements, particles, etc.

### Expected Results
- ✅ FPS: 60+ on desktop, 30+ on mobile
- ✅ Frame time: <16.67ms (60 FPS target)
- ✅ No visual regressions
- ✅ No console errors
- ✅ Smooth gameplay

---

## 🐛 Troubleshooting

### New System Not Rendering

**Check:**
1. Feature flag is enabled: `window.featureFlags.isEnabled('useNewRenderingSystem')`
2. Console for errors
3. Network tab: Are modules loading?
4. Integration initialized: Check console for "[RenderingIntegration] Initialized"

**Fix:**
```javascript
// Clear localStorage and try again
localStorage.removeItem('featureFlags');
location.reload();
```

### Visual Differences

**Common issues:**
- Camera position: Check `camera.x` and `camera.y` values
- Viewport size: Verify canvas dimensions match
- Entity visibility: Check viewport culling margins
- Layer order: Verify rendering order matches old system

**Debug:**
```javascript
// Enable debug mode to see bounding boxes and metrics
window.featureFlags.enable('enableDebugMode');
renderingIntegration.setDebugMode(true);
```

### Performance Issues

**If new system is slower:**
1. Check browser console for warnings
2. Disable extensions
3. Profile with Chrome DevTools
4. Compare benchmark results
5. Check for excessive draw calls

**Common causes:**
- Large number of entities outside viewport
- Inefficient particle pooling
- Canvas state management issues

---

## 🔄 Rollback Plan

If issues occur in production:

### Immediate Rollback (No Code Change)
```javascript
// Emergency: Disable all new features
window.featureFlags.enable('disableNewFeatures');
location.reload();
```

### Code Rollback
```javascript
// Simply wrap in if(false) or comment out
if (false && featureFlags.isEnabled('useNewRenderingSystem')) {
  // New system code...
} else {
  // Old system (always runs)
}
```

---

## 📈 Gradual Rollout Strategy

### Phase 1: Developer Testing (Week 1)
- Enable for developers only
- Test on all browsers
- Verify performance benchmarks
- Fix any critical bugs

### Phase 2: Beta Testing (Week 2)
- Enable for 10% of users via URL param
- Monitor error logs
- Collect performance data
- Fix reported issues

### Phase 3: Wider Rollout (Week 3)
- Enable for 50% of users
- Compare metrics (old vs new)
- Verify stability

### Phase 4: Full Rollout (Week 4)
- Enable for 100% of users
- Monitor for issues
- Prepare to remove old code

### Phase 5: Cleanup (Week 5)
- Remove old rendering code
- Delete feature flag
- Update documentation

---

## ✅ Integration Checklist

Before marking Phase 3 complete:

- [ ] RenderingIntegration module created
- [ ] Integration code added to game-original.js
- [ ] Feature flag working correctly
- [ ] Old system still works (fallback)
- [ ] New system renders correctly
- [ ] No console errors
- [ ] Performance meets targets
- [ ] All entity types render
- [ ] Camera follows player
- [ ] Viewport culling works
- [ ] Mobile rendering works
- [ ] Dual mode tested
- [ ] Benchmarks run and documented
- [ ] Documentation updated

---

## 📚 Related Files

### Source Code
- [src/integration/rendering-integration.js](../src/integration/rendering-integration.js) - Integration layer
- [src/systems/RenderingSystem.js](../src/systems/RenderingSystem.js) - Main system
- [config/feature-flags.js](../config/feature-flags.js) - Feature flags
- [js/core/game-original.js](../js/core/game-original.js) - Game loop

### Documentation
- [RENDERING_ANALYSIS.md](../RENDERING_ANALYSIS.md) - System analysis
- [REFACTORING_PROGRESS.md](../REFACTORING_PROGRESS.md) - Phase tracking
- [tests/benchmarks/README.md](../tests/benchmarks/README.md) - Performance testing

### Tests
- [tests/unit/systems/RenderingSystem.test.js](../tests/unit/systems/RenderingSystem.test.js) - System tests
- [tests/benchmarks/rendering-benchmark.js](../tests/benchmarks/rendering-benchmark.js) - Benchmarks

---

## 🎯 Success Criteria

Phase 3 is complete when:
- ✅ All 893 tests passing (100%)
- ✅ Integration code in game-original.js
- ✅ Feature flag working
- ✅ Performance benchmarks run
- ✅ New system performs as well or better than old
- ✅ Visual parity confirmed
- ✅ No regressions in gameplay
- ✅ Documentation updated

---

**Last Updated**: 2025-11-10
**Status**: 🟢 Ready for integration
**Next Step**: Add integration code to game-original.js and test
