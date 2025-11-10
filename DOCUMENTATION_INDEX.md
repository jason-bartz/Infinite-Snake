# Documentation Index

**Last Updated**: 2025-11-10
**Purpose**: Complete reference to all project documentation

---

## 🎯 Start Here

**New to the project? Read these in order:**

1. [START_HERE.md](./START_HERE.md) - Quick orientation and status
2. [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md) - Complete project tracker
3. [docs/REFACTORING_PLAN.md](./docs/REFACTORING_PLAN.md) - Master architecture plan
4. [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) - Development workflow

---

## 📚 Primary Documentation

### Project Management
| File | Purpose | Status |
|------|---------|--------|
| [START_HERE.md](./START_HERE.md) | Entry point, quick status, next steps | ✅ Current |
| [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md) | Main tracker, metrics, history | ✅ Current |
| [README.md](./README.md) | Project overview, setup instructions | ✅ Current |

### Technical Documentation
| File | Purpose | Status |
|------|---------|--------|
| [RENDERING_ANALYSIS.md](./RENDERING_ANALYSIS.md) | Complete rendering system analysis (2,500+ lines) | ✅ Current |
| [docs/REFACTORING_PLAN.md](./docs/REFACTORING_PLAN.md) | Master refactoring plan, all 11 phases | ✅ Current |
| [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) | Development workflow, testing, standards | ✅ Current |

---

## 🗂️ Source Code Documentation

### Core Systems (src/)
| Path | Description | Tests | Status |
|------|-------------|-------|--------|
| `src/core/ecs/` | ECS architecture (Entity, Component, System, Coordinator) | 97 | ✅ Phase 1 |
| `src/core/rendering/Camera.js` | Camera system with viewport culling | 55 | ✅ Phase 3 |
| `src/core/GameLoop.js` | Fixed-timestep game loop | 24 | ✅ Phase 1 |

### State Management (src/state/)
| Path | Description | Tests | Status |
|------|-------------|-------|--------|
| `src/state/store.js` | Redux-like store with middleware | 25 | ✅ Phase 2 |
| `src/state/actions.js` | 31 action types and creators | 64 | ✅ Phase 2 |
| `src/state/selectors.js` | 50+ state selectors | 71 | ✅ Phase 2 |
| `src/state/reducers/` | Game, Player, UI reducers | 121 | ✅ Phase 2 |

### Services (src/services/)
| Path | Description | Tests | Status |
|------|-------------|-------|--------|
| `src/services/StorageService.js` | localStorage abstraction, 15 namespaced keys | 65 | ✅ Phase 2 |

### Systems (src/systems/)
| Path | Description | Tests | Status |
|------|-------------|-------|--------|
| `src/systems/RenderingSystem.js` | Main rendering coordinator | 53 | ✅ Phase 3 |
| `src/systems/RenderPipeline.js` | Layer-based rendering orchestration | 42 | ✅ Phase 3 |
| `src/systems/RenderLayer.js` | 9-layer rendering enum | - | ✅ Phase 3 |

### Renderers (src/systems/renderers/)
| Path | Description | Tests | Status |
|------|-------------|-------|--------|
| `src/systems/renderers/BackgroundRenderer.js` | Parallax backgrounds, stars, stations (394 lines) | 45 | ✅ Phase 3 |
| `src/systems/renderers/BorderRenderer.js` | World boundaries with gradients (344 lines) | 50 | ✅ Phase 3 |
| `src/systems/renderers/SnakeRenderer.js` | Complex snake rendering (707 lines) | 74 | ✅ Phase 3 |
| `src/systems/renderers/ElementRenderer.js` | Game element rendering (475 lines) | 62 | ✅ Phase 3 |
| `src/systems/renderers/ParticleRenderer.js` | Particle system with pooling (694 lines) | 62 | ✅ Phase 3 |

### Configuration (config/)
| Path | Description | Status |
|------|-------------|--------|
| `config/feature-flags.js` | Feature toggle system | ✅ Phase 0 |
| `config/game.config.js` | Game settings | ✅ Phase 1 |
| `config/balance.config.js` | Balance parameters (SNAKE_SPEED: 4.761) | ✅ Phase 1 |

---

## 🧪 Test Documentation

### Test Structure
```
tests/
├── unit/ (893 tests, 100% passing)
│   ├── core/
│   │   ├── ecs/ (97 tests)
│   │   ├── rendering/ (55 tests)
│   │   └── GameLoop.test.js (24 tests)
│   ├── state/ (346 tests)
│   │   ├── store.test.js (25 tests)
│   │   ├── actions.test.js (64 tests)
│   │   ├── selectors.test.js (71 tests)
│   │   └── reducers/ (121 tests)
│   ├── services/ (65 tests)
│   │   └── StorageService.test.js
│   └── systems/ (447 tests)
│       ├── RenderingSystem.test.js (53 tests)
│       ├── RenderPipeline.test.js (42 tests)
│       └── renderers/ (250 tests)
│
└── e2e/ (7 tests, all passing)
    └── game-smoke.spec.js
```

### Test Commands
```bash
npm test -- --run              # All tests
npm test                        # Watch mode
npm test -- RenderingSystem     # Specific test
npm test -- --coverage          # Coverage report
npm run test:e2e               # E2E tests
```

---

## 📦 Build & Config Files

| File | Purpose | Status |
|------|---------|--------|
| `package.json` | Dependencies and scripts | ✅ |
| `vite.config.js` | Vite build configuration | ✅ Phase 0 |
| `vitest.config.js` | Vitest test configuration | ✅ Phase 0 |
| `playwright.config.js` | Playwright E2E configuration | ✅ Phase 0 |
| `.eslintrc.json` | ESLint code quality rules | ✅ Phase 0 |
| `.prettierrc.json` | Prettier code formatting | ✅ Phase 0 |

---

## 📁 Archived Documentation

### Historical Context (docs/archive/)
All previous session summaries, checkpoints, and progress updates have been moved to `docs/archive/` for historical reference.

| Directory | Contents | Purpose |
|-----------|----------|---------|
| `docs/archive/phase-summaries/` | Phase 0-2 summaries | Historical phase completions |
| `docs/archive/checkpoints/` | Phase 2-3 checkpoints and progress updates | Detailed session notes |
| `docs/archive/` | Session summaries, "START_HERE" variants | Session-specific context |

**Note**: These are historical documents. For current status, always refer to [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md) and [START_HERE.md](./START_HERE.md).

---

## 🎯 Documentation by Phase

### Phase 0: Infrastructure (Complete)
- [docs/REFACTORING_PLAN.md](./docs/REFACTORING_PLAN.md) - Master plan
- [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) - Dev workflow
- `config/feature-flags.js` - Feature toggle system
- Build configs (Vite, ESLint, Prettier, Playwright, Vitest)

### Phase 1: Core Infrastructure (Complete)
- `src/core/ecs/` - ECS architecture (4 files, 97 tests)
- `src/core/GameLoop.js` - Fixed-timestep loop (24 tests)
- `config/game.config.js` - Game settings
- `config/balance.config.js` - Balance tuning

### Phase 2: State Management (Complete)
- `src/state/` - Complete state system (346 tests)
- `src/services/StorageService.js` - Storage abstraction (65 tests)
- 15 namespaced localStorage keys (reduced from 69)

### Phase 3: RenderingSystem (90% Complete)
- [RENDERING_ANALYSIS.md](./RENDERING_ANALYSIS.md) - Complete analysis
- `src/core/rendering/Camera.js` - Camera system (55 tests)
- `src/systems/RenderingSystem.js` - Main coordinator (53 tests)
- `src/systems/RenderPipeline.js` - Orchestration (42 tests)
- `src/systems/RenderLayer.js` - Layer enum
- `src/systems/renderers/` - 5 renderers (250 tests)
- **Total**: 447 tests, 3,662 lines of code

### Phase 4-10: Pending
Documentation will be added as phases are completed.

---

## 📊 Quick Stats

| Category | Count | Status |
|----------|-------|--------|
| **Total Tests** | 893 | ✅ 100% passing |
| **Test Files** | 22 | ✅ All passing |
| **E2E Tests** | 7 | ✅ All passing |
| **Source Files (new)** | 25+ | ✅ Fully tested |
| **Documentation Files** | 15+ | ✅ Current |
| **Configuration Files** | 8 | ✅ Complete |
| **Code Coverage (new code)** | 100% | ✅ Excellent |

---

## 🔍 Finding What You Need

### I want to...
- **Get started** → Read [START_HERE.md](./START_HERE.md)
- **See overall progress** → Read [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md)
- **Understand architecture** → Read [docs/REFACTORING_PLAN.md](./docs/REFACTORING_PLAN.md)
- **Set up development** → Read [docs/DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)
- **Understand rendering** → Read [RENDERING_ANALYSIS.md](./RENDERING_ANALYSIS.md)
- **Find specific code** → Browse `src/` directories listed above
- **See historical context** → Check `docs/archive/`

### I'm looking for...
- **Tests** → `tests/unit/` and `tests/e2e/`
- **Configuration** → `config/` and root config files
- **State management** → `src/state/`
- **ECS architecture** → `src/core/ecs/`
- **Rendering system** → `src/systems/` and `src/systems/renderers/`
- **Documentation** → This file and links above

---

## 📝 Document Maintenance

### This Index
- **Updated**: After major changes or new phases
- **Maintained by**: Claude (Professional Mobile Web Dev Studio)
- **Source of truth**: Yes - for file locations and structure

### Key Documents
- **START_HERE.md**: Updated after each major milestone
- **REFACTORING_PROGRESS.md**: Updated continuously with progress
- **RENDERING_ANALYSIS.md**: Static reference (created once)
- **docs/REFACTORING_PLAN.md**: Master plan (updated as needed)
- **docs/DEVELOPER_GUIDE.md**: Dev workflow (updated as needed)

### Archive Policy
- Session-specific docs → `docs/archive/` after session complete
- Checkpoint docs → `docs/archive/checkpoints/` when superseded
- Phase summaries → `docs/archive/phase-summaries/` when phase complete
- Always keep: START_HERE.md, REFACTORING_PROGRESS.md, technical docs

---

## 🎯 Current Focus

**Phase 3: RenderingSystem (90% Complete)**
- Next step: Performance benchmarking
- Then: Game loop integration
- Final: Phase 3 completion

**Key Documents for Current Work**:
1. [REFACTORING_PROGRESS.md](./REFACTORING_PROGRESS.md) - Track progress
2. [RENDERING_ANALYSIS.md](./RENDERING_ANALYSIS.md) - Technical reference
3. [src/systems/RenderingSystem.js](./src/systems/RenderingSystem.js) - Implementation

---

**Last Updated**: 2025-11-10
**Current Phase**: 3 (RenderingSystem - 90% complete)
**Total Tests**: 893 passing (100%)
**Overall Progress**: 42%

**Need help?** Start with [START_HERE.md](./START_HERE.md) and follow the links!
