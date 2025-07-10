# Mobile UI Migration Guide

## Overview
This guide explains how to migrate from the old mobile UI system (6 separate files) to the new consolidated mobile UI manager.

## Files to Replace

### Old System (Remove these):
1. `js/mobile-ui-unified.js`
2. `js/mobile-ui-fixed.js`
3. `js/mobile-ui-inline-fix.js`
4. `js/mobile/emergency-mobile-fix-1.js`
5. `js/mobile/emergency-mobile-fix-2.js`

### New System (Use these):
1. `js/mobile/mobile-ui-manager.js` - Main UI manager
2. `js/mobile/mobile-config.js` - Configuration

Note: Keep `js/mobile-background-integration.js` as it handles performance optimization, not UI layout.

## Migration Steps

### 1. Update HTML Script Tags

**Remove:**
```html
<script src="js/mobile-ui-unified.js"></script>
<script src="js/mobile-ui-fixed.js"></script>
<script src="js/mobile-ui-inline-fix.js"></script>
<script src="js/mobile/emergency-mobile-fix-1.js"></script>
<script src="js/mobile/emergency-mobile-fix-2.js"></script>
```

**Add:**
```html
<script src="js/mobile/mobile-config.js"></script>
<script src="js/mobile/mobile-ui-manager.js" type="module"></script>
```

### 2. Configuration

The new system uses `mobile-config.js` for all settings. To change behavior:

#### Switch between Fixed and Slideout modes:
```javascript
// In mobile-config.js
mode: 'fixed',    // Always visible panels
// or
mode: 'slideout', // Slide-in panels with tabs
```

#### Adjust positions (fixed mode):
```javascript
positions: {
    stats: { top: 10, left: 10 },
    leaderboard: { top: 10, right: 10 },
    boostButton: { bottom: 120, right: 20 }
}
```

#### Toggle features:
```javascript
features: {
    boostMeter: true,      // Boost meter fill
    skinPreview: true,     // Skin in stats tab
    discoveryFeed: true,   // Click to dismiss
    collapsibleLeaderboard: true
}
```

### 3. API Changes

#### Old: Multiple global functions
```javascript
// Old system had various global functions
window.togglePanel('stats');
window.mobileUIFixed.updateBoost();
```

#### New: Single manager instance
```javascript
// New system uses single manager
window.mobileUIManager.togglePanel('stats');
window.mobileUIManager.updateBoostMeter();
```

### 4. Mobile Detection

#### Old: Each file had its own detection
```javascript
// Different in each file
const isMobile = /Android|iPhone/i.test(navigator.userAgent);
```

#### New: Unified detection
```javascript
// Single source of truth
const isMobile = MobileUIManager.isMobile();
```

## Benefits of Migration

1. **Performance**: Single update loop instead of 5+ intervals
2. **Consistency**: One mobile detection method
3. **Maintainability**: 47% less code (989 → 527 lines)
4. **Configurability**: All settings in one place
5. **No Conflicts**: No more competing style applications

## Testing Checklist

After migration, verify:
- [ ] Stats panel visible and positioned correctly
- [ ] Leaderboard panel visible and positioned correctly
- [ ] Boost button visible with meter fill
- [ ] Discovery feed click-to-dismiss works
- [ ] Mobile detection accurate on target devices
- [ ] No console errors
- [ ] Performance improved (fewer timers)

## Rollback Plan

If issues occur:
1. Restore old script tags in HTML
2. Comment out new script tags
3. Clear browser cache
4. Report issues for fixing

## Future Improvements

The consolidated system enables future enhancements:
- Gesture support for panel management
- Responsive breakpoints
- Theme customization
- Accessibility improvements
- Touch-optimized controls