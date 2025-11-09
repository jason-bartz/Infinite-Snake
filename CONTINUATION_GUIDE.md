# Continuation Guide - Infinite Snake Refactoring

**Last Updated**: 2025-11-09
**Current Phase**: Phase 0 Complete → Ready for Phase 1
**Branch**: `refactor/phase-0-preparation`
**Context**: Professional game architecture modernization in progress

---

## 🎯 Project Overview

**Objective**: Refactor Infinite Snake from a 15,699-line monolithic codebase to a professional Entity-Component-System (ECS) architecture following AAA game development standards.

**Timeline**: 22 weeks (11 phases)
**Current Progress**: 9% (Phase 0 complete)
**Main Target**: Reduce `game-original.js` from 15,699 lines → <500 lines

---

## 📍 Current Status

### ✅ Phase 0: COMPLETE (2025-11-09)

**What Was Accomplished:**
1. ✅ Vite 5.4.21 build system configured with HMR
2. ✅ ESLint + Prettier for code quality
3. ✅ Playwright E2E testing (10 smoke tests)
4. ✅ Vitest unit testing with mocks
5. ✅ Feature flags system (25+ flags, console/URL accessible)
6. ✅ Comprehensive documentation created
7. ✅ Git branch strategy established
8. ✅ Fixed CSS syntax errors for PostCSS compatibility

**Git Commits on Branch `refactor/phase-0-preparation`:**
- `b017839` - Phase 0 infrastructure setup (18 files, 7,931 additions)
- `e0e9869` - CSS comment syntax fixes for PostCSS

**Key Files Created:**
```
vite.config.js              # Build configuration
playwright.config.js        # E2E test configuration
.eslintrc.json             # Linting rules
.prettierrc.json           # Code formatting
tests/e2e/game-smoke.spec.js   # 10 smoke tests
tests/unit/example.test.js     # Unit test template
tests/setup.js                 # Test mocks (Canvas, Audio, localStorage)
config/feature-flags.js        # Feature toggle system
src/main.js                    # New entry point
docs/DEVELOPER_GUIDE.md        # Team onboarding
docs/REFACTORING_PLAN.md       # 22-week roadmap
REFACTORING_PROGRESS.md        # Live tracker
PHASE_0_SUMMARY.md            # Phase 0 report
```

---

## 🚧 Where You Left Off

### Known Issues (Non-Critical)

**1. Vite Compatibility Warnings** (Game works fine, but Vite needs adjustments)

**Issue A: CSS @import positioning**
```
Error: @import must precede all other statements (besides @charset or empty @layer)
Location: Line 23 of inline CSS in index.html
```
**Fix**: Move `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');` to the very top of the `<style>` block in index.html

**Issue B: JavaScript syntax parsing errors**
```
Files with parsing issues:
- js/loreData.js:1683 - Template literal syntax in comment
- js/playerStats.js:656 - Complex nested structure
- js/core/game-original.js:2255 - Nested object syntax
```
**Impact**: Non-blocking - these files work in browsers, just trigger Vite warnings
**Fix Strategy**: Can be addressed incrementally during Phase 1-3 refactoring

**Issue C: Asset path warnings**
```
Vite suggests: Use /background/purple-blue-bg.png instead of /assets/background/purple-blue-bg.png
```
**Impact**: Non-blocking - assets load correctly, just optimization suggestion
**Fix**: Update asset paths or configure Vite's `publicDir` properly

### What's Working
- ✅ Game loads and runs correctly without Vite (existing production setup)
- ✅ Vite dev server starts successfully
- ✅ HMR (Hot Module Replacement) working - page reloads on changes
- ✅ All Phase 0 infrastructure ready for refactoring
- ✅ Feature flags accessible via console: `window.featureFlags`
- ✅ Tests can be run: `npm test` and `npm run test:e2e`

---

## 🗺️ Complete Refactoring Roadmap

### Phase 0: Preparation ✅ COMPLETE
**Duration**: 1 week | **Status**: ✅ Done
- Build system, testing, linting, feature flags
- **Next Action**: Merge to main or start Phase 1

### Phase 1: Core Infrastructure ⏳ NEXT
**Duration**: 2 weeks | **Status**: 🟡 Pending
**Objectives**:
1. Create ECS foundation (Entity, Component, System, Coordinator)
2. Extract game loop to standalone module
3. Build configuration management system
4. **FIX**: SNAKE_SPEED constant inconsistency (5.95125 vs 4.761)

**Files to Create**:
```
src/core/ecs/
├── Entity.js          # Entity class with UUID
├── Component.js       # Base component class
├── System.js          # Base system class
└── Coordinator.js     # ECS coordinator

src/core/
└── GameLoop.js        # Fixed timestep game loop

config/
├── game.config.js     # Game settings
└── balance.config.js  # Tuning values (includes SNAKE_SPEED fix!)
```

**Success Criteria**:
- [ ] ECS can run alongside existing code (dual-mode)
- [ ] Feature flag: `useECS` toggles new system on/off
- [ ] Game loop extracted but still calls old update/render
- [ ] Zero regressions in E2E tests
- [ ] 90%+ unit test coverage for new code

**Starting Point**: Create `src/core/ecs/Entity.js` first

### Phase 2: State Management
**Duration**: 2 weeks | **Status**: ⭕ Not Started
- Implement Redux-like state store
- Migrate 473 `window.*` global references
- Create StorageService (consolidate 69 localStorage keys)

### Phase 3: Systems Extraction
**Duration**: 4 weeks | **Status**: ⭕ Not Started
- Extract RenderingSystem (Week 6)
- Extract CollisionSystem (Week 7)
- Extract InputSystem (Week 7)
- Extract AudioSystem (Week 8)
- Extract AISystem (Week 9)

### Phase 4: Entity Migration
**Duration**: 3 weeks | **Status**: ⭕ Not Started
- Convert Particle, Element, PowerUp to ECS
- Refactor 2,070-line Snake.js
- Recreate Boss.js (was deleted, now in game-original.js)

### Phase 5: Service Layer
**Duration**: 2 weeks | **Status**: ⭕ Not Started
- AssetManager with versioning
- ElementService with O(1) lookups (currently linear search!)
- APIService with retry logic
- SaveManager with data migration

### Phase 6: UI Modernization
**Duration**: 2 weeks | **Status**: ⭕ Not Started
- Implement Lit Web Components
- Extract all UI from game-original.js
- Consolidate mobile UI

### Phase 7: Testing Infrastructure
**Duration**: 2 weeks | **Status**: ⭕ Not Started
- 80%+ code coverage
- Comprehensive E2E tests
- Performance benchmarks

### Phase 8: Performance Optimization
**Duration**: 2 weeks | **Status**: ⭕ Not Started
- Universal object pooling
- Rendering optimizations (culling, dirty rects)
- Bundle size <500KB

### Phase 9: Developer Experience
**Duration**: 1 week | **Status**: ⭕ Not Started
- API documentation
- Architecture diagrams
- Developer guides

### Phase 10: Migration Complete
**Duration**: 1 week | **Status**: ⭕ Not Started
- Delete game-original.js 🎉
- Final audits
- Production deployment

---

## 🏗️ Target Architecture

```
src/
├── core/                   # ECS Engine
│   ├── Engine.js          # Main game engine
│   ├── ecs/
│   │   ├── Entity.js      # Entity class
│   │   ├── Component.js   # Base component
│   │   ├── System.js      # Base system
│   │   └── Coordinator.js # ECS coordinator
│   └── GameLoop.js        # Fixed timestep loop
│
├── components/             # ECS Components (data containers)
│   ├── Transform.js       # Position, rotation, scale
│   ├── Velocity.js        # Movement vector
│   ├── Renderable.js      # Sprite, color, layer
│   ├── Collider.js        # Collision shape
│   ├── Health.js          # HP, max HP
│   ├── Input.js           # Input state
│   ├── AI.js              # AI personality, state
│   ├── Snake.js           # Snake-specific data
│   ├── Element.js         # Element type, tier
│   └── AudioSource.js     # Sound emitter
│
├── systems/                # ECS Systems (logic processors)
│   ├── InputSystem.js     # Process input
│   ├── MovementSystem.js  # Apply velocity
│   ├── CollisionSystem.js # Spatial hash + detection
│   ├── RenderingSystem.js # Canvas rendering
│   ├── AISystem.js        # AI decision making
│   ├── ParticleSystem.js  # Particle spawning/updating
│   ├── AudioSystem.js     # Sound playback
│   └── PhysicsSystem.js   # Boundaries, constraints
│
├── entities/               # Entity Factories
│   ├── createSnake.js
│   ├── createElement.js
│   ├── createBoss.js
│   ├── createPowerUp.js
│   └── createParticle.js
│
├── state/                  # State Management (Redux-like)
│   ├── store.js           # Central state store
│   ├── actions.js         # Action creators
│   ├── reducers/
│   │   ├── gameReducer.js
│   │   ├── playerReducer.js
│   │   ├── uiReducer.js
│   │   └── index.js
│   └── selectors.js       # State selectors
│
├── services/               # Business Services
│   ├── AssetManager.js    # Asset loading/caching
│   ├── StorageService.js  # localStorage abstraction
│   ├── APIService.js      # HTTP requests
│   ├── AnalyticsService.js # Event tracking
│   ├── ConfigManager.js   # Configuration
│   └── SaveManager.js     # Save/load game state
│
├── ui/                     # UI Components (Lit)
│   ├── components/
│   │   ├── MainMenu.js
│   │   ├── HUD.js
│   │   ├── PauseMenu.js
│   │   ├── GameOver.js
│   │   └── MobileControls.js
│   └── UIManager.js       # UI orchestration
│
├── utils/                  # Utilities
│   ├── math.js            # Vector math, lerp
│   ├── pool.js            # Object pooling
│   └── logger.js          # Logging
│
├── config/                 # Configuration
│   ├── game.config.js     # Game settings
│   ├── balance.config.js  # Tuning values
│   ├── audio.config.js    # Audio settings
│   ├── mobile.config.js   # Mobile overrides
│   └── feature-flags.js   # Feature toggles ✅ (already exists)
│
└── main.js                 # Entry point ✅ (already exists)
```

---

## 🔧 Critical Information

### Current Codebase Issues

**1. SNAKE_SPEED Inconsistency** ⚠️
```javascript
// game-original.js line 321
const SNAKE_SPEED = 5.95125;

// Snake.js line 18
const SNAKE_SPEED = 4.761;
```
**Impact**: Inconsistent snake speeds depending on code path
**Fix in Phase 1**: Create `config/balance.config.js` with single source of truth

**2. Boss.js Was Deleted**
- Boss system code is now embedded in game-original.js (starting line 6199)
- Needs to be extracted in Phase 4

**3. Global Window Pollution**
- 473 references to `window.*` for cross-file communication
- Phase 2 will migrate these to state management

**4. localStorage Overuse**
- 69 different localStorage keys scattered throughout
- Phase 2 will consolidate into StorageService

**5. Element Data Size**
```
elements.json: 69,369 lines (massive!)
combinations.json: 21,961 lines
emojis.json: 12,893 lines
```
**Impact**: Loaded synchronously, no compression
**Fix in Phase 5**: ElementService with indexing and compression

---

## 📋 How to Continue

### Immediate Next Steps (Phase 1)

**Step 1: Review Documentation**
```bash
# Read these files to get up to speed:
cat REFACTORING_PROGRESS.md
cat docs/REFACTORING_PLAN.md
cat docs/DEVELOPER_GUIDE.md
cat PHASE_0_SUMMARY.md
```

**Step 2: Optional - Fix Remaining Vite Issues**
```bash
# If you want Vite fully working (recommended but not required):

# 1. Fix @import positioning in index.html
# Move font import to top of <style> block

# 2. Configure Vite to ignore parsing certain files
# Add to vite.config.js:
optimizeDeps: {
  exclude: ['js/loreData.js', 'js/playerStats.js']
}
```

**Step 3: Start Phase 1 - Create ECS Foundation**
```bash
# Create directory structure
mkdir -p src/core/ecs
mkdir -p config

# Start with Entity class
# Create src/core/ecs/Entity.js

# Example implementation:
class Entity {
  constructor() {
    this.id = crypto.randomUUID();
    this.components = new Map();
    this.active = true;
  }

  addComponent(component) {
    this.components.set(component.constructor.name, component);
    return this;
  }

  getComponent(ComponentClass) {
    return this.components.get(ComponentClass.name);
  }

  hasComponent(ComponentClass) {
    return this.components.has(ComponentClass.name);
  }

  removeComponent(ComponentClass) {
    this.components.delete(ComponentClass.name);
  }
}

export { Entity };
```

**Step 4: Enable Feature Flag**
```javascript
// Test ECS in console:
window.featureFlags.enable('useECS');
```

**Step 5: Write Tests First (TDD)**
```bash
# Create tests/unit/core/ecs/Entity.test.js
# Write tests before implementation
npm test -- --watch
```

**Step 6: Run E2E Tests Frequently**
```bash
# Ensure no regressions
npm run test:e2e

# Or with UI for debugging
npm run test:e2e:ui
```

---

## 🧪 Testing Strategy

### E2E Tests (Already Created)
```bash
npm run test:e2e            # Run all tests
npm run test:e2e:ui         # Interactive mode
npm run test:e2e:debug      # Debug mode
```

**Current Coverage (10 smoke tests)**:
- ✅ Homepage load and canvas rendering
- ✅ Mode selection screen
- ✅ Game start (Infinite & Classic modes)
- ✅ Pause menu functionality
- ✅ Snake controls
- ✅ Score display
- ✅ localStorage persistence
- ✅ Mobile viewport
- ✅ Console error detection

### Unit Tests
```bash
npm test                    # Run Vitest
npm run test:ui             # Interactive UI
```

**Test Coverage Target**: 80%+ overall, 90%+ for new code

### Testing Checklist for Each Phase
- [ ] Write unit tests first (TDD)
- [ ] Run E2E tests before changes
- [ ] Implement feature behind flag
- [ ] Run E2E tests after changes
- [ ] Verify zero regressions
- [ ] Check code coverage meets target

---

## 🚩 Feature Flags Usage

### Console Access
```javascript
// Enable features
window.featureFlags.enable('useECS');
window.featureFlags.enable('useNewGameLoop');

// Disable features
window.featureFlags.disable('useECS');

// View all flags
window.featureFlags.getAll();

// Reset everything
window.featureFlags.reset();

// Enable debug mode
window.featureFlags.enable('enableDebugMode');
window.featureFlags.enable('enableVerboseLogging');
```

### URL Parameters
```
# Enable specific flags
http://localhost:3000?flags=useECS,useNewGameLoop

# Enable debug mode
http://localhost:3000?debug=true

# Enable individual flag
http://localhost:3000?useECS=true
```

### Available Flags (Phase 1 Relevant)
```javascript
useECS: false                    // Enable ECS system
useNewGameLoop: false            // Use extracted game loop
useConfigManager: false          // Use centralized config
enableDebugMode: false           // Debug mode
enablePerformanceMonitoring: false
enableVerboseLogging: false
enableDualMode: false            // Run old + new side-by-side
disableNewFeatures: false        // Emergency kill switch
```

---

## 📊 Success Metrics

| Metric | Baseline | Current | Target | Status |
|--------|----------|---------|--------|--------|
| Main file LOC | 15,699 | 15,699 | <500 | 🔴 0% |
| Code duplication | ~25% | ~25% | <5% | 🔴 0% |
| Test coverage | 0% | 0% | 80%+ | 🔴 0% |
| Bundle size | ~1.5MB | ~1.5MB | <500KB | 🔴 0% |
| Load time (4G) | ~5s | ~5s | <2s | 🔴 0% |
| FPS (mobile) | ~45 | ~45 | 60 | 🔴 0% |
| Memory usage | ~150MB | ~150MB | <100MB | 🔴 0% |
| Lighthouse score | ~70 | ~70 | 90+ | 🔴 0% |
| window.* refs | 473 | 473 | 0 | 🔴 0% |
| localStorage keys | 69 | 69 | <10 | 🔴 0% |
| **Total Progress** | 0% | **9%** | 100% | 🟡 **Phase 0 Done** |

---

## 🛡️ Risk Mitigation

### Before Making Changes
1. ✅ Run E2E tests to establish baseline
2. ✅ Create feature flag for new code
3. ✅ Ensure old code path still works
4. ✅ Write unit tests for new code

### During Development
- Keep commits small and focused
- Run tests frequently
- Use dual-mode (old + new) when possible
- Monitor performance metrics

### If Things Break
- Feature flags have kill switch: `disableNewFeatures`
- Can revert to previous commit easily
- E2E tests catch regressions immediately
- Old code remains functional during transition

---

## 📚 Key Documents

| Document | Purpose | Location |
|----------|---------|----------|
| **REFACTORING_PROGRESS.md** | Live progress tracker | Root directory |
| **docs/REFACTORING_PLAN.md** | Complete 22-week plan | docs/ |
| **docs/DEVELOPER_GUIDE.md** | Team onboarding | docs/ |
| **PHASE_0_SUMMARY.md** | Phase 0 completion report | Root directory |
| **THIS FILE** | Continuation guide | Root directory |

---

## 💻 Commands Quick Reference

```bash
# Development
npm run dev                  # Vite dev server (localhost:3000)
npm run build               # Production build
npm run preview             # Preview production

# Testing
npm test                    # Unit tests
npm run test:ui             # Unit tests with UI
npm run test:e2e            # E2E tests
npm run test:e2e:ui         # E2E with Playwright UI
npm run test:e2e:debug      # Debug E2E tests

# Code Quality
npm run lint                # Check code
npm run lint:fix            # Auto-fix issues
npm run format              # Format code
npm run format:check        # Check formatting

# Git
git status                  # Check current branch
git log --oneline -10       # Recent commits
git diff main               # Compare to main
```

---

## 🎯 Decision Points

### Should You Fix Vite Issues Now?
**Recommendation**: Not critical, but helpful

**Pros of fixing**:
- Clean development experience
- Catches syntax errors early
- Better debugging with source maps

**Cons of waiting**:
- Takes time away from actual refactoring
- Issues are non-blocking
- Can be fixed incrementally

**Suggested Approach**: Fix the `@import` positioning (5 min fix), ignore JavaScript parsing warnings for now.

### Should You Merge Phase 0 to Main?
**Recommendation**: Yes, if you want a clean baseline

**Pros**:
- Marks clear milestone
- Protects Phase 0 work
- Creates deployable checkpoint

**Cons**:
- Need to create PR and review
- Might want to complete Phase 1 first

**Suggested Approach**: Either merge now or keep working on `refactor/phase-0-preparation` branch through Phase 1.

---

## 🔥 Critical Warnings

### DO NOT:
- ❌ Delete game-original.js yet (needed until Phase 10)
- ❌ Remove old code without replacement tested
- ❌ Skip writing tests
- ❌ Merge without E2E tests passing
- ❌ Introduce new global variables
- ❌ Use force push on shared branches

### ALWAYS:
- ✅ Use feature flags for new code
- ✅ Write tests before refactoring
- ✅ Run E2E tests before/after changes
- ✅ Keep old code working during transition
- ✅ Document architectural decisions
- ✅ Commit small, focused changes

---

## 🎓 Learning Resources

### ECS Architecture
- [Understanding ECS](https://en.wikipedia.org/wiki/Entity_component_system)
- [Game Programming Patterns - Component Pattern](http://gameprogrammingpatterns.com/component.html)

### Testing
- [Playwright Docs](https://playwright.dev/)
- [Vitest Docs](https://vitest.dev/)

### Build Tools
- [Vite Guide](https://vitejs.dev/guide/)

---

## 📞 Getting Help

### If Stuck:
1. Check `docs/DEVELOPER_GUIDE.md`
2. Review `docs/REFACTORING_PLAN.md`
3. Look at Phase 0 examples in `tests/`
4. Check feature flags: `window.featureFlags.getAll()`

### Debugging:
```javascript
// Enable debug logging
window.featureFlags.enable('enableVerboseLogging');

// Monitor performance
window.featureFlags.enable('enablePerformanceMonitoring');

// Check state
console.log(window.featureFlags.getAll());
```

---

## 🎉 You're Ready!

**Current State**: Phase 0 complete, professional infrastructure in place
**Next Step**: Phase 1 - Create ECS foundation
**First File to Create**: `src/core/ecs/Entity.js`
**First Test to Write**: `tests/unit/core/ecs/Entity.test.js`
**First Feature Flag to Use**: `useECS`

**Remember**:
- Small, incremental changes
- Test-driven development
- Feature flags for safety
- Keep old code working
- Celebrate milestones! 🎊

---

**Generated**: 2025-11-09
**By**: Professional Mobile Web Dev Studio (Claude)
**For**: Infinite Snake Architecture Modernization

**Happy Coding! 🚀**
