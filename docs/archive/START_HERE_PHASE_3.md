# 🚀 Start Here - Phase 3: Systems Extraction

**Date**: 2025-11-10
**Status**: Ready to begin
**Current Phase**: 3 of 11 (27% complete overall)

---

## ✅ What's Been Completed

### Phase 0: Preparation (100%)
- ✅ Vite build system
- ✅ ESLint + Prettier
- ✅ Playwright E2E tests
- ✅ Feature flags system
- ✅ 7 smoke tests passing

### Phase 1: Core Infrastructure (100%)
- ✅ ECS architecture (Entity, Component, System, Coordinator)
- ✅ GameLoop with fixed timestep
- ✅ Configuration system
- ✅ 97 tests passing

### Phase 2: State Management (100%)
- ✅ Redux-like store with middleware
- ✅ 3 reducers (game, player, ui)
- ✅ 50+ selectors for safe state access
- ✅ StorageService (69 → 15 localStorage keys)
- ✅ 346 tests passing

**Total Tests**: 450 passing ✅
**Infrastructure**: Production-ready ✅

---

## 🎯 What's Next: Phase 3

**Goal**: Extract 5 core systems from 15,699-line monolith

### Systems to Build (Weeks 5-9)
1. **RenderingSystem** (Week 5-6) 🎯 NEXT
2. CollisionSystem (Week 6-7)
3. InputSystem (Week 7)
4. AudioSystem (Week 8)
5. AISystem (Week 9)

**Target Outcome**:
- Reduce game-original.js by 30% (15,699 → ~10,989 lines)
- Add 160+ new tests
- Zero performance regressions
- All systems using ECS + Redux

---

## 📖 Key Documents (Read These!)

| Priority | Document | Purpose |
|----------|----------|---------|
| 🔴 **HIGH** | [PHASE_3_CHECKPOINT.md](PHASE_3_CHECKPOINT.md:1) | Detailed roadmap for Phase 3 |
| 🟡 **MEDIUM** | [REFACTORING_PROGRESS.md](REFACTORING_PROGRESS.md:1) | Overall project progress |
| 🟡 **MEDIUM** | [PHASE_2_SUMMARY.md](PHASE_2_SUMMARY.md:1) | What Phase 2 accomplished |
| 🟢 **LOW** | [docs/REFACTORING_PLAN.md](docs/REFACTORING_PLAN.md:1) | Master plan (all 11 phases) |

---

## 🏗️ Project Structure (Current State)

```
src/
├── core/
│   ├── ecs/                    ✅ Phase 1
│   │   ├── Entity.js
│   │   ├── Component.js
│   │   ├── System.js
│   │   ├── Coordinator.js
│   │   └── index.js
│   └── GameLoop.js             ✅ Phase 1
│
├── state/                      ✅ Phase 2
│   ├── store.js
│   ├── actions.js
│   ├── selectors.js
│   └── reducers/
│       ├── gameReducer.js
│       ├── playerReducer.js
│       ├── uiReducer.js
│       └── index.js
│
├── services/                   ✅ Phase 2
│   └── StorageService.js
│
├── systems/                    ⏳ Phase 3 (TO CREATE)
│   ├── RenderingSystem.js      🎯 NEXT
│   ├── CollisionSystem.js
│   ├── InputSystem.js
│   ├── AudioSystem.js
│   └── AISystem.js
│
config/
├── game.config.js              ✅ Phase 1
├── balance.config.js           ✅ Phase 1
└── feature-flags.js            ✅ Phase 0

tests/
├── unit/
│   ├── core/                   ✅ 97 tests
│   ├── state/                  ✅ 346 tests
│   └── systems/                ⏳ TO CREATE
└── e2e/
    └── game-smoke.spec.js      ✅ 7 tests
```

---

## 🚀 Quick Start Commands

### Verify Everything Works
```bash
# Run all tests (should see 450 passing)
npm test -- --run

# Start dev server
npm run dev

# Run E2E tests
npm run test:e2e
```

### Open Key Files
```bash
# Phase 3 checkpoint (detailed plan)
code PHASE_3_CHECKPOINT.md

# Main progress tracker
code REFACTORING_PROGRESS.md

# ECS infrastructure (Phase 1)
code src/core/ecs/

# State management (Phase 2)
code src/state/
```

---

## 🎯 Immediate Next Steps

### Step 1: Read the Plan (15 minutes)
- Open [PHASE_3_CHECKPOINT.md](PHASE_3_CHECKPOINT.md:1)
- Read "Step-by-Step Plan for RenderingSystem"
- Understand the 7-step process

### Step 2: Analyze Current Code (2-3 hours)
- Open `js/game-original.js` (15,699 lines)
- Search for rendering functions:
  - `ctx.fillRect`
  - `ctx.strokeRect`
  - `ctx.drawImage`
  - `ctx.fillText`
  - etc.
- Document what needs to be extracted

### Step 3: Create Components (1-2 hours)
- Create `src/core/ecs/components/Transform.js`
- Create `src/core/ecs/components/Renderable.js`
- Create `src/core/ecs/components/Sprite.js`
- Write tests for each component

### Step 4: Build RenderingSystem Skeleton (2-3 hours)
- Create `src/systems/RenderingSystem.js`
- Extend System class from Phase 1
- Set up update loop
- Write initial tests

### Step 5: Extract and Integrate (4-6 hours)
- Extract rendering code from game-original.js
- Connect to ECS coordinator
- Connect to Redux store
- Add feature flag

---

## 💡 Key Architectural Concepts

### How Systems Work with ECS
```javascript
// System queries entities with required components
class RenderingSystem extends System {
  constructor(ctx) {
    super();
    this.ctx = ctx;
    this.requiredComponents = ['Transform', 'Renderable'];
  }

  update(deltaTime) {
    // Automatically gets entities with Transform + Renderable
    this.entities.forEach(entity => {
      const transform = entity.getComponent('Transform');
      const renderable = entity.getComponent('Renderable');

      // Draw entity
      this.ctx.save();
      this.ctx.translate(transform.x, transform.y);
      this.ctx.rotate(transform.angle);
      // ... render logic
      this.ctx.restore();
    });
  }
}
```

### How Systems Work with Redux
```javascript
import { store } from '../state/store.js';
import { selectors } from '../state/selectors.js';

update(deltaTime) {
  // Get state from Redux
  const state = store.getState();
  const camera = selectors.game.getCameraPosition(state);
  const viewport = selectors.ui.getViewport(state);

  // Use state for rendering decisions
  this.entities.forEach(entity => {
    // Check if entity is in viewport
    if (this.isInViewport(entity, viewport)) {
      // Render with camera offset
      this.renderEntity(entity, camera);
    }
  });
}
```

### How Systems Work with GameLoop
```javascript
import { GameLoop } from '../core/GameLoop.js';
import { coordinator } from '../core/ecs/Coordinator.js';

// Create systems
const renderingSystem = new RenderingSystem(ctx);
const collisionSystem = new CollisionSystem();

// Register with coordinator
coordinator.registerSystem(renderingSystem);
coordinator.registerSystem(collisionSystem);

// Create game loop
const gameLoop = new GameLoop(
  // Update callback
  (deltaTime) => {
    coordinator.updateSystems(deltaTime);
  },
  // Render callback
  (deltaTime) => {
    renderingSystem.render(deltaTime);
  }
);

gameLoop.start();
```

---

## 🧪 Testing Strategy

### TDD Approach (Write Tests First!)
```javascript
// tests/unit/systems/RenderingSystem.test.js
describe('RenderingSystem', () => {
  it('should render entities with Transform and Renderable', () => {
    const system = new RenderingSystem(mockCtx);
    const entity = createEntity();
    entity.addComponent('Transform', { x: 100, y: 100 });
    entity.addComponent('Renderable', { visible: true });

    system.update(16); // 60 FPS

    expect(mockCtx.drawImage).toHaveBeenCalled();
  });

  it('should cull entities outside viewport', () => {
    // Test viewport culling
  });

  it('should sort entities by layer', () => {
    // Test layer sorting
  });
});
```

---

## 📊 Success Criteria for Phase 3

| Criteria | Target | How to Measure |
|----------|--------|----------------|
| Systems extracted | 5 | Count files in src/systems/ |
| Unit tests | +160 | npm test -- --run |
| Test coverage | 90%+ | npm test -- --coverage |
| LOC reduction | 30% | wc -l js/game-original.js |
| Performance | ≥Baseline | Chrome DevTools Performance |
| E2E tests | All pass | npm run test:e2e |

---

## 🐛 Common Issues & Solutions

### Issue: "System not getting entities"
**Solution**: Make sure components are registered with coordinator
```javascript
coordinator.registerComponent('Transform', Transform);
coordinator.registerComponent('Renderable', Renderable);
```

### Issue: "Cannot read property of undefined (state)"
**Solution**: Use selectors, don't access state directly
```javascript
// ❌ Bad
const score = state.game.score;

// ✅ Good
const score = selectors.game.getScore(state);
```

### Issue: "Performance regression"
**Solution**: Use viewport culling and object pooling
```javascript
// Only render visible entities
if (this.isInViewport(entity, viewport)) {
  this.renderEntity(entity);
}
```

---

## 🎉 You're Ready!

Everything is in place to start Phase 3:
- ✅ ECS infrastructure ready (Phase 1)
- ✅ State management ready (Phase 2)
- ✅ 450 tests passing
- ✅ Feature flags ready
- ✅ Detailed plan documented

**Next Action**: Open [PHASE_3_CHECKPOINT.md](PHASE_3_CHECKPOINT.md:1) and start with RenderingSystem analysis!

---

## 📞 Need Help?

1. **Check the docs**: Most questions answered in PHASE_3_CHECKPOINT.md
2. **Review Phase 1**: ECS patterns in src/core/ecs/
3. **Review Phase 2**: State patterns in src/state/
4. **Run tests**: npm test -- --run (all should pass)

---

**Status**: 🟢 Ready to Code
**Confidence**: 🟢 High (all infrastructure in place)
**Next Session**: Start RenderingSystem extraction

Good luck! 🚀

---

**Created**: 2025-11-10
**By**: Claude (Professional Mobile Web Dev Studio)
