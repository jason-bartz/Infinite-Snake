# Professional Game Refactoring Plan
## Infinite Snake - Architecture Modernization

**Status**: Phase 0 - Preparation ✅
**Last Updated**: 2025-11-09

---

## Quick Reference

### Commands

```bash
# Development
npm run dev                  # Start Vite dev server (localhost:3000)
npm run build               # Build for production
npm run preview             # Preview production build

# Testing
npm test                    # Run Vitest unit tests
npm run test:ui             # Run Vitest with UI
npm run test:e2e            # Run Playwright E2E tests
npm run test:e2e:ui         # Run Playwright with UI
npm run test:e2e:debug      # Debug Playwright tests

# Code Quality
npm run lint                # Lint code
npm run lint:fix            # Lint and fix issues
npm run format              # Format code with Prettier
npm run format:check        # Check code formatting
```

### Feature Flags

```javascript
// In browser console
window.featureFlags.enable('useECS');
window.featureFlags.disable('useECS');
window.featureFlags.getAll();

// Via URL parameters
?flags=useECS,useNewGameLoop&debug=true
```

---

## Architecture Overview

### Current State (15,699-line monolith)
```
index.html (283KB)
js/core/game-original.js (15,699 lines) ← THE PROBLEM
├── Game loop
├── Rendering
├── Input handling
├── State management
├── UI logic
├── Boss system
└── 150+ functions
```

### Target State (Modular ECS Architecture)
```
src/
├── core/          # ECS engine
├── components/    # ECS components
├── systems/       # Game systems
├── entities/      # Entity factories
├── state/         # State management
├── services/      # Business services
├── ui/            # UI components
└── main.js        # Entry point
```

---

## Phases

### Phase 0: Preparation ✅ COMPLETE
**Duration**: 1 week
**Status**: ✅ Done

**Completed**:
- ✅ Vite build system configured
- ✅ ESLint + Prettier setup
- ✅ Playwright E2E testing framework
- ✅ Feature flags system
- ✅ Git branch strategy
- ✅ Test infrastructure

**Next**: Phase 1 - Core Infrastructure

---

### Phase 1: Core Infrastructure
**Duration**: 2 weeks
**Status**: 🟡 Pending

**Goals**:
1. Create ECS foundation (Entity, Component, System, Coordinator)
2. Extract game loop to standalone module
3. Create configuration management system
4. **FIX**: SNAKE_SPEED constant mismatch

**Success Criteria**:
- [ ] ECS can run alongside existing code
- [ ] Zero regressions in E2E tests
- [ ] Game loop isolated from rendering logic

---

### Phase 2: State Management
**Duration**: 2 weeks
**Status**: ⭕ Not Started

**Goals**:
1. Implement Redux-like state store
2. Migrate 473 `window.*` global references
3. Create StorageService (consolidate 69 localStorage keys)

**Success Criteria**:
- [ ] All state mutations go through actions
- [ ] Time-travel debugging enabled
- [ ] State fully serializable

---

### Phase 3: Systems Extraction
**Duration**: 4 weeks
**Status**: ⭕ Not Started

**Goals**:
1. Extract RenderingSystem
2. Extract CollisionSystem
3. Extract InputSystem
4. Extract AudioSystem
5. Extract AISystem

**Success Criteria**:
- [ ] Each system 90%+ test coverage
- [ ] Performance matches or exceeds baseline
- [ ] Systems are independently testable

---

### Phase 4: Entity Migration
**Duration**: 3 weeks
**Status**: ⭕ Not Started

**Goals**:
1. Convert Particle, Element, PowerUp to ECS
2. Refactor 2,070-line Snake.js to components
3. Recreate Boss.js (was deleted)

**Success Criteria**:
- [ ] All entities use ECS
- [ ] Old entity classes removed
- [ ] 10%+ performance improvement

---

### Phase 5: Service Layer
**Duration**: 2 weeks
**Status**: ⭕ Not Started

**Goals**:
1. AssetManager with versioning
2. ElementService with O(1) lookups
3. APIService with retry logic
4. SaveManager with data migration

---

### Phase 6: UI Modernization
**Duration**: 2 weeks
**Status**: ⭕ Not Started

**Goals**:
1. Implement Lit Web Components
2. Extract all UI from game-original.js
3. Consolidate mobile UI

---

### Phase 7: Testing Infrastructure
**Duration**: 2 weeks
**Status**: ⭕ Not Started

**Goals**:
- 80%+ code coverage
- Comprehensive E2E tests
- Performance benchmarks

---

### Phase 8: Performance Optimization
**Duration**: 2 weeks
**Status**: ⭕ Not Started

**Goals**:
- Universal object pooling
- Rendering optimizations
- Bundle size <500KB

---

### Phase 9: Developer Experience
**Duration**: 1 week
**Status**: ⭕ Not Started

**Goals**:
- API documentation
- Architecture diagrams
- Developer guides

---

### Phase 10: Migration Complete
**Duration**: 1 week
**Status**: ⭕ Not Started

**Goals**:
- Delete game-original.js (🎉)
- Final audits
- Production deployment

---

## Critical Decisions

### ADR-001: Build System - Vite ✅
**Rationale**: Fast HMR, excellent DX, optimized production builds
**Status**: Implemented

### ADR-002: UI Framework - Lit
**Rationale**: Minimal overhead (5KB), standards-based, reactive
**Status**: Proposed

### ADR-003: State Management - Custom Redux-like
**Rationale**: No external dependencies, full control
**Status**: Proposed

### ADR-004: Testing - Vitest + Playwright
**Rationale**: Fast unit tests, reliable E2E, Vite integration
**Status**: Implemented

---

## Risk Mitigation

### Regression Prevention
- ✅ E2E test suite before changes
- ✅ Feature flags for gradual rollout
- ⏳ Dual mode (old + new code in parallel)
- ⏳ Visual regression testing

### Data Safety
- ⏳ localStorage backup system
- ⏳ Data migration with versioning
- ⏳ Rollback capability

### Performance Safety
- ⏳ Baseline performance benchmarks
- ⏳ Continuous performance monitoring
- ⏳ Performance budgets

---

## Metrics

| Metric | Baseline | Target | Current |
|--------|----------|--------|---------|
| Main file LOC | 15,699 | <500 | 15,699 🔴 |
| Bundle size | ~1.5MB | <500KB | ~1.5MB 🔴 |
| Test coverage | 0% | 80%+ | 0% 🔴 |
| FPS (mobile) | ~45 | 60 | ~45 🔴 |
| Load time (4G) | ~5s | <2s | ~5s 🔴 |
| Lighthouse | ~70 | 90+ | ~70 🔴 |

---

## Team Guidelines

### Branch Strategy
```
main                      # Production
├── develop              # Integration branch
└── refactor/            # Refactoring features
    ├── phase-0-preparation ← WE ARE HERE
    ├── phase-1-core-infrastructure
    ├── phase-2-state-management
    └── ...
```

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

### Code Review Checklist
- [ ] All tests passing
- [ ] No regressions in E2E tests
- [ ] Code coverage maintained/improved
- [ ] Performance metrics acceptable
- [ ] Documentation updated
- [ ] Feature flags used appropriately

---

## Resources

- [Progress Tracker](../REFACTORING_PROGRESS.md)
- [Architecture Analysis](./ARCHITECTURE_ANALYSIS.md) (to be created)
- [API Documentation](./api/) (to be generated)
- [Testing Guide](./TESTING_GUIDE.md) (to be created)

---

**Next Steps**: Complete Phase 0 setup, run baseline E2E tests, begin Phase 1
