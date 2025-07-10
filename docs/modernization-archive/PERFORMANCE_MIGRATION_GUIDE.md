# Performance System Migration Guide

## Overview
This guide explains how to migrate from the multiple performance monitoring systems to the new unified performance system.

## Files to Replace

### Old System (Remove/Deprecate these):
1. `js/performance-monitor.js` - Original performance monitor
2. `js/game-loop-optimizer.js` - Duplicate monitoring and hooks
3. `js/game-integration.js` - Another integration layer
4. `js/mobile-visual-parity.js` - Separate mobile quality system

### New System (Use these):
1. `js/performance/unified-performance-system.js` - Consolidated system
2. `js/performance/debug-config.js` - Debug and logging configuration
3. `js/performance/logger.js` - Controlled logging wrapper

### Keep These (They provide specific functionality):
1. `js/webgl-renderer.js` - WebGL rendering
2. `js/quadtree.js` - Collision optimization
3. `js/texture-atlas.js` - Texture management
4. `js/gpu-particle-system.js` - GPU particles

## Migration Steps

### 1. Update HTML Script Tags

**Remove:**
```html
<script src="js/performance-monitor.js"></script>
<script src="js/game-loop-optimizer.js"></script>
<script src="js/game-integration.js"></script>
```

**Add:**
```html
<script src="js/performance/debug-config.js"></script>
<script src="js/performance/logger.js" type="module"></script>
<script src="js/performance/unified-performance-system.js" type="module"></script>
```

### 2. Update Performance Monitoring Calls

#### Old: Multiple systems
```javascript
// Old - different systems
window.performanceMonitor.startFrame();
window.gameLoopOptimizer.update();
window.mobileVisualParity.checkQuality();
```

#### New: Single unified system
```javascript
// New - unified system
window.performanceSystem.beginFrame();
window.performanceSystem.endFrame();
// Quality adjustment is automatic
```

### 3. Update Metric Recording

#### Old:
```javascript
// Various methods across files
PerformanceMonitor.recordDrawCall();
gameIntegration.metrics.drawCalls++;
```

#### New:
```javascript
// Unified API
window.performanceSystem.recordDrawCall(triangleCount);
window.performanceSystem.recordTextureSwap();
window.performanceSystem.recordCollisionCheck();
window.performanceSystem.recordAIUpdate();
```

### 4. Replace Console.log Statements

#### Option 1: Use Logger Categories
```javascript
// Old
console.log('AI decision:', decision);

// New
import { loggers } from './js/performance/logger.js';
loggers.ai.log('AI decision:', decision);
```

#### Option 2: Create Custom Logger
```javascript
// Create logger for your module
import { createLogger } from './js/performance/logger.js';
const logger = createLogger('myModule');

// Use it
logger.log('Something happened');
logger.warn('Warning message');
logger.error('Error occurred');
```

#### Option 3: Global Console Override
```javascript
// Enable console override (silences all console.log when debug is off)
window.overrideConsole();
```

### 5. Update Quality Settings

#### Old: Multiple quality systems
```javascript
// Different in each file
performanceMonitor.setQuality('low');
mobileVisualParity.deviceProfile = 'low-end';
```

#### New: Unified quality management
```javascript
// Single system
window.performanceSystem.setQuality('low'); // 'low', 'medium', 'high'
window.performanceSystem.quality.auto = true; // Enable auto-adjustment
```

### 6. Debug Mode Configuration

#### Enable debug mode:
```javascript
// Via code
window.DEBUG_CONFIG.enabled = true;
window.DEBUG_CONFIG.showPerformanceOverlay = true;

// Via keyboard shortcuts
// Ctrl+Shift+D - Toggle debug mode
// Ctrl+Shift+P - Toggle performance overlay
```

#### Configure logging:
```javascript
// Enable specific features
window.DEBUG_CONFIG.features.ai = true;
window.DEBUG_CONFIG.features.collision = true;

// Or use Debug helper
window.Debug.enableFeature('ai');
```

## API Reference

### Performance System API
```javascript
// Frame timing
performanceSystem.beginFrame();
performanceSystem.endFrame();
performanceSystem.beginSection('update');
performanceSystem.endSection('update');

// Metrics
performanceSystem.recordDrawCall(triangles);
performanceSystem.recordTextureSwap();
performanceSystem.recordCollisionCheck();
performanceSystem.recordAIUpdate();
performanceSystem.updateEntityCount(count);
performanceSystem.updateParticleCount(count);

// Quality
performanceSystem.setQuality('medium');
performanceSystem.quality.auto = true/false;

// Optimizations
performanceSystem.setOptimization('webglEnabled', true);
performanceSystem.setOptimization('quadtreeEnabled', true);

// Events
performanceSystem.on('qualityChanged', (data) => {
    console.log('New quality:', data.newLevel);
});

// Get report
const report = performanceSystem.getReport();
```

### Debug API
```javascript
// Logging
Debug.log('category', 'message');
Debug.warn('category', 'warning');
Debug.error('category', 'error');

// Feature checks
Debug.isEnabled('ai');
Debug.isVisualEnabled('showCollisionBoxes');
Debug.isDevEnabled('godMode');

// Toggle features
Debug.toggle(); // Toggle debug mode
Debug.enableFeature('collision');
Debug.disableFeature('particles');
```

### Logger API
```javascript
// Create logger
const logger = createLogger('myCategory');

// Logging methods
logger.log('message');
logger.warn('warning');
logger.error('error');
logger.debug('debug info'); // Only in debug level
logger.logIf(condition, 'conditional message');

// Performance logging
logger.time('operation');
// ... do operation
logger.timeEnd('operation');

// Grouping
logger.group('Group Label');
logger.log('item 1');
logger.log('item 2');
logger.groupEnd();
```

## Benefits

1. **Single System**: One performance monitor instead of 3+
2. **Consistent API**: Unified methods for all metrics
3. **Better Performance**: Reduced overhead from duplicate monitoring
4. **Controlled Logging**: No console spam in production
5. **Auto-Quality**: Automatic quality adjustment based on FPS
6. **Better Debugging**: Comprehensive debug configuration
7. **Mobile Unified**: Mobile quality integrated into main system

## Testing Checklist

After migration:
- [ ] Performance overlay displays correctly (Ctrl+Shift+P)
- [ ] FPS monitoring works
- [ ] Quality auto-adjustment functions
- [ ] Console.log statements are silent in production
- [ ] Debug mode enables logging (Ctrl+Shift+D)
- [ ] All subsystems register correctly
- [ ] No duplicate performance monitors running
- [ ] Mobile devices get appropriate quality settings

## Rollback Plan

If issues occur:
1. Restore old script tags
2. Comment out new script tags
3. Set `window.DEBUG_CONFIG.enabled = true` to see errors
4. Check browser console for migration issues

## Future Enhancements

The unified system enables:
- Performance profiling exports
- Real-time performance graphs
- Network latency compensation
- Advanced AI caching strategies
- Memory usage tracking
- Custom metric plugins