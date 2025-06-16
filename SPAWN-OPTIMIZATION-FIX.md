# Element Spawn Optimization & Performance Fix

## Issues Addressed
1. Too many Fire elements spawning (lack of variety)
2. Poor framerate (40 FPS)
3. Elements not matching player's bank for combinations
4. Not enough discovery opportunities

## Key Changes

### 1. **Reduced Element Count for Performance**
- Target elements: 300 → 200
- Elements per grid cell: 3-8 → 2-5
- Less aggressive spawning (2 per frame max, down from 3)
- Spawn chance: 10% → 5% for replacements

### 2. **Dramatically Reduced Base Element Weights**
Phase progression now uses much lower base weights:
- TUTORIAL: 8 → 4
- EARLY: 4 → 1
- MID: 2 → 0.3
- LATE: 1 → 0.1
- MASTER: 0.5 → 0.05

### 3. **Player-Focused Smart Spawning**
- 60% chance to prioritize player combinations
- Tracks player's bank separately from all snakes
- **20x weight bonus** for elements that create new discoveries with player's bank
- **10x weight bonus** for elements that combine with player's bank
- Fire element gets 90% weight reduction after 10 discoveries

### 4. **Specific Bonuses**
```javascript
// Player combination bonuses
if (canCombineWithPlayerBank) {
    if (createsNewDiscovery) {
        weight *= 20; // Massive bonus
    } else {
        weight *= 10; // Big bonus
    }
}

// Fire reduction
if (elemId === 3 && discoveries > 10) {
    weight *= 0.1; // 90% reduction
}
```

### 5. **Performance Optimizations**
- Initial spawn: 80% → 70% of target
- Only 40 base elements at start (was 100)
- Less frequent spawn checks
- Reduced spawn probability

## Expected Results
- Much more variety in elements
- Elements that actually combine with your bank
- Better discovery opportunities
- Improved framerate (targeting 60 FPS)
- Less Fire element spam after early game