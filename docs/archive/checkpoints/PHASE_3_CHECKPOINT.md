# Phase 3 Checkpoint - Systems Extraction

**Date**: 2025-11-10
**Status**: 🟡 IN PROGRESS (0% Complete)
**Target Duration**: Weeks 5-9 (5 weeks)
**Current Week**: 5

---

## 🎯 Phase 3 Goals

**Primary Objective**: Extract 5 core systems from 15,699-line monolith into modular, testable systems using ECS architecture and Redux state management.

**Target Outcome**:
- Reduce game-original.js by 30%+ (15,699 → ~10,989 lines)
- Create 5 independent systems with 160+ tests
- Zero performance regressions
- All systems integrated with ECS + Redux

---

## 📋 Systems to Extract (In Order)

### 1. RenderingSystem (Week 5-6) 🎯 NEXT
**Priority**: HIGHEST - Foundation for other systems
**Complexity**: HIGH
**Lines to Extract**: ~2,500 lines
**Tests Target**: 40+ tests

**What it does**:
- Draws all game entities to canvas
- Handles viewport culling
- Manages camera/viewport transforms
- Implements parallax effects
- Renders UI overlays

**Why first?**:
- Most visible to users (easy to validate)
- No dependencies on other systems
- Foundation for debugging other systems
- Performance-critical path

**Files to create**:
- `src/systems/RenderingSystem.js`
- `src/core/ecs/components/Transform.js`
- `src/core/ecs/components/Renderable.js`
- `src/core/ecs/components/Sprite.js`
- `tests/unit/systems/RenderingSystem.test.js`

---

### 2. CollisionSystem (Week 6-7)
**Priority**: HIGH - Required for gameplay
**Complexity**: HIGH
**Lines to Extract**: ~1,800 lines
**Tests Target**: 35+ tests

**What it does**:
- Detects collisions between entities
- Implements spatial hashing/quadtree
- Handles snake self-collision
- Detects element collection
- AI snake collision

**Dependencies**:
- Needs Transform component (from RenderingSystem)
- Needs Redux state for game entities

**Files to create**:
- `src/systems/CollisionSystem.js`
- `src/core/ecs/components/Collider.js`
- `src/core/ecs/components/RigidBody.js`
- `src/utils/SpatialGrid.js`
- `tests/unit/systems/CollisionSystem.test.js`

---

### 3. InputSystem (Week 7)
**Priority**: HIGH - User interaction
**Complexity**: MEDIUM
**Lines to Extract**: ~1,200 lines
**Tests Target**: 30+ tests

**What it does**:
- Handles keyboard input
- Handles mouse/touch input
- Consolidates mobile-ui-manager.js
- Input buffering
- Gamepad support (optional)

**Dependencies**:
- Needs Redux actions to dispatch input events
- Needs UI state for mobile controls

**Files to create**:
- `src/systems/InputSystem.js`
- `src/core/ecs/components/InputController.js`
- `tests/unit/systems/InputSystem.test.js`

---

### 4. AudioSystem (Week 8)
**Priority**: MEDIUM - Quality of life
**Complexity**: MEDIUM
**Lines to Extract**: ~800 lines
**Tests Target**: 25+ tests

**What it does**:
- Loads and manages audio assets
- Plays sound effects
- Plays background music
- Audio pooling for performance
- Respects user settings

**Dependencies**:
- Needs Redux state for audio settings
- Needs AssetManager integration

**Files to create**:
- `src/systems/AudioSystem.js`
- `src/core/ecs/components/AudioSource.js`
- `tests/unit/systems/AudioSystem.test.js`

---

### 5. AISystem (Week 9)
**Priority**: MEDIUM - Gameplay feature
**Complexity**: HIGH
**Lines to Extract**: ~1,500 lines
**Tests Target**: 30+ tests

**What it does**:
- Controls AI snake behavior
- Implements pathfinding
- Difficulty scaling
- AI decision making

**Dependencies**:
- Needs CollisionSystem for obstacle detection
- Needs Transform for position/movement
- Needs Redux state for game elements

**Files to create**:
- `src/systems/AISystem.js`
- `src/core/ecs/components/AIController.js`
- `tests/unit/systems/AISystem.test.js`

---

## 🚀 Step-by-Step Plan for RenderingSystem (NEXT)

### Step 1: Analysis (2-3 hours)
- [ ] Read game-original.js rendering sections
- [ ] Identify all `ctx.` drawing calls
- [ ] Map rendering functions (drawSnake, drawElements, drawBackground, etc.)
- [ ] Identify state dependencies (what data is needed?)
- [ ] Document performance-critical paths
- [ ] Create architecture sketch

### Step 2: Create Component Definitions (1-2 hours)
- [ ] Create `Transform.js` component (position, rotation, scale)
- [ ] Create `Renderable.js` component (visible, layer, opacity)
- [ ] Create `Sprite.js` component (texture, frame, animations)
- [ ] Write tests for each component (15 tests total)

### Step 3: Build RenderingSystem Skeleton (2-3 hours)
- [ ] Create `RenderingSystem.js` extending System
- [ ] Set up constructor (canvas context, required components)
- [ ] Implement `update()` method stub
- [ ] Add viewport culling logic
- [ ] Add layer sorting logic
- [ ] Write 10 tests for system initialization

### Step 4: Extract Rendering Code (4-6 hours)
- [ ] Extract background rendering
- [ ] Extract grid rendering
- [ ] Extract element rendering
- [ ] Extract snake rendering
- [ ] Extract particle rendering
- [ ] Extract UI overlay rendering
- [ ] Write 20+ tests for rendering functions

### Step 5: Integration (3-4 hours)
- [ ] Connect to Redux store via selectors
- [ ] Connect to ECS coordinator
- [ ] Connect to GameLoop
- [ ] Add feature flag `useRenderingSystem`
- [ ] Test dual-mode (old + new running together)
- [ ] Write integration tests

### Step 6: Optimization (2-3 hours)
- [ ] Implement viewport culling
- [ ] Implement dirty rectangle optimization
- [ ] Add object pooling for render calls
- [ ] Benchmark performance vs old code
- [ ] Document performance improvements

### Step 7: Testing & Validation (2-3 hours)
- [ ] Run all unit tests (40+ target)
- [ ] Run E2E smoke tests
- [ ] Visual regression testing
- [ ] Performance benchmarks
- [ ] Mobile device testing

**Total Estimated Time**: 16-24 hours (2-3 days)

---

## 🧪 Testing Strategy

### Unit Tests (Per System)
- Component creation/destruction
- System initialization
- Update loop logic
- Edge cases and error handling
- Performance benchmarks

### Integration Tests
- System + ECS integration
- System + Redux integration
- System + GameLoop integration
- Multiple systems working together

### E2E Tests
- No visual regressions
- No gameplay changes
- Performance maintained
- Mobile compatibility

---

## 🏗️ Architecture Pattern

All systems will follow this pattern:

```javascript
import { System } from '../core/ecs/System.js';
import { coordinator } from '../core/ecs/Coordinator.js';
import { store } from '../state/store.js';
import { selectors } from '../state/selectors.js';

/**
 * SystemName - Brief description
 *
 * Responsibilities:
 * - List key responsibilities
 *
 * Required Components:
 * - ComponentA
 * - ComponentB
 *
 * State Dependencies:
 * - state.game.something
 * - state.player.something
 */
export class SystemName extends System {
  constructor(dependencies) {
    super();
    this.requiredComponents = ['ComponentA', 'ComponentB'];
    this.dependencies = dependencies;
    this.init();
  }

  /**
   * Initialize system resources
   */
  init() {
    // Setup code
  }

  /**
   * Update system each frame
   * @param {number} deltaTime - Time since last frame (ms)
   */
  update(deltaTime) {
    // Get state from Redux
    const state = store.getState();
    const relevantData = selectors.something.get(state);

    // Update entities with required components
    this.entities.forEach(entity => {
      const transform = entity.getComponent('Transform');
      const other = entity.getComponent('ComponentB');

      // System logic here
    });
  }

  /**
   * Cleanup system resources
   */
  destroy() {
    // Cleanup code
  }
}
```

---

## 📊 Success Metrics (Phase 3)

| Metric | Start | Target | Measure |
|--------|-------|--------|---------|
| game-original.js LOC | 15,699 | ~10,989 | 30% reduction |
| Unit tests | 450 | 610+ | +160 tests |
| Systems extracted | 0 | 5 | All complete |
| Test coverage | 100% new | 90%+ | Per system |
| Performance (FPS) | Baseline | ≥Baseline | No regressions |
| E2E tests passing | 7 | 7 | Zero breaks |

---

## 🔧 Tools & Commands

### Run Tests
```bash
# All tests
npm test -- --run

# Watch mode
npm test

# Specific system
npm test -- RenderingSystem

# Coverage report
npm test -- --coverage
```

### Performance Benchmarks
```bash
# Browser DevTools
# 1. Open Performance tab
# 2. Record 60 seconds of gameplay
# 3. Check FPS, memory, render time

# Before/After comparison
# Save baseline metrics before extraction
# Compare after system implementation
```

### Feature Flags
```javascript
// Enable/disable systems via console
window.featureFlags.enable('useRenderingSystem');
window.featureFlags.disable('useRenderingSystem');

// Check current flags
window.featureFlags.list();
```

---

## 🐛 Common Pitfalls to Avoid

### 1. Breaking Existing Code
**Problem**: Removing old code too early
**Solution**: Keep dual-mode until new system is proven stable

### 2. State Coupling
**Problem**: Systems directly accessing window.* globals
**Solution**: All state access through Redux selectors

### 3. Over-Engineering
**Problem**: Making systems too generic/complex
**Solution**: Start simple, refactor later if needed

### 4. Skipping Tests
**Problem**: "I'll write tests later" syndrome
**Solution**: TDD approach - write tests first

### 5. Performance Regressions
**Problem**: New code is slower than old code
**Solution**: Benchmark before/after, optimize critical paths

---

## 📚 Key Documents

| Document | Purpose |
|----------|---------|
| [REFACTORING_PROGRESS.md](REFACTORING_PROGRESS.md:1) | Overall progress tracker |
| **[PHASE_3_CHECKPOINT.md](PHASE_3_CHECKPOINT.md:1)** | 📍 **YOU ARE HERE** |
| [PHASE_2_SUMMARY.md](PHASE_2_SUMMARY.md:1) | Previous phase summary |
| [docs/REFACTORING_PLAN.md](docs/REFACTORING_PLAN.md:1) | Master refactoring plan |
| [src/core/ecs/README.md](src/core/ecs/README.md:1) | ECS architecture docs |

---

## 🎯 Next Actions

### Immediate (Next Session)
1. **Read game-original.js** - Analyze rendering code
2. **Create architecture sketch** - Plan system structure
3. **Create Transform component** - Foundation for positioning
4. **Create Renderable component** - Foundation for drawing
5. **Start RenderingSystem.test.js** - TDD approach

### This Week (Week 5-6)
- Complete RenderingSystem extraction
- 40+ unit tests written
- Integration with ECS + Redux complete
- Performance benchmarks completed
- Feature flag integration ready

### This Month (Week 5-9)
- Complete all 5 systems
- 160+ new tests
- 30% reduction in main file
- Zero E2E test failures
- Ready for Phase 4: Entity Migration

---

## 💡 Tips for Success

1. **Take it slow**: One system at a time, fully tested before moving on
2. **Use feature flags**: Keep old code working while testing new system
3. **Benchmark everything**: Performance must match or exceed baseline
4. **Write tests first**: TDD approach catches issues early
5. **Document as you go**: Future you will thank present you
6. **Ask for help**: Review code with team, get feedback early

---

**Status**: Ready to begin RenderingSystem extraction 🚀
**Next Step**: Analyze game-original.js rendering code
**Estimated Effort**: 16-24 hours for RenderingSystem

---

**Created**: 2025-11-10
**By**: Claude (Professional Mobile Web Dev Studio)
**For**: Infinite Snake - Phase 3 Guidance
