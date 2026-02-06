# Infinite Snake - Professional Architecture Refactoring Plan

**Version:** 1.0
**Date:** 2025-11-09
**Goal:** Transform monolithic codebase into a professionally-architected game following AAA game dev best practices

---

## Executive Summary

This plan refactors Infinite Snake from a **16,191-line monolithic structure** into a **modular, maintainable architecture** using industry-standard patterns employed by top-tier game studios. The refactoring prioritizes **zero functionality loss** while introducing:

- ✅ **Entity-Component-System (ECS)** architecture for game entities
- ✅ **Service-oriented architecture** for cross-cutting concerns
- ✅ **Dependency injection** to eliminate global state
- ✅ **TypeScript** for type safety and IDE support
- ✅ **Build pipeline** with hot reload and optimization
- ✅ **Comprehensive testing** strategy
- ✅ **Performance profiling** and monitoring

---

## Current State Analysis

### Critical Issues Identified

| Issue | Impact | Priority |
|-------|--------|----------|
| 16,191-line `game-original.js` | Unmaintainable, merge conflicts | **CRITICAL** |
| 40+ global variables | Tight coupling, hard to test | **CRITICAL** |
| 285KB `index.html` with inline CSS | Slow load, poor DX | **HIGH** |
| Mixed module systems (IIFE/ES6/scripts) | Inconsistent patterns | **HIGH** |
| Speed constant mismatch (4.761 vs 5.95125) | Gameplay bugs | **MEDIUM** |
| No TypeScript | Type errors, poor autocomplete | **MEDIUM** |
| Limited test coverage | Risky refactoring | **HIGH** |

### Strengths to Preserve

- ✅ Sophisticated performance optimization systems
- ✅ Well-structured entity classes (Snake, Boss, Element)
- ✅ Robust asset preloading system
- ✅ Mobile-first optimization strategies
- ✅ Spatial hash collision detection

---

## Target Architecture

### 1. Core Architecture Pattern: **ECS + Services**

We'll adopt a **hybrid architecture** combining:
- **ECS (Entity-Component-System)** for game entities
- **Service Layer** for cross-cutting concerns (audio, rendering, input)
- **MVC pattern** for UI management

```
┌─────────────────────────────────────────────────────────┐
│                     Game Engine Core                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   ECS Core   │  │   Services   │  │  UI Layer    │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤ │
│  │ • Entities   │  │ • Renderer   │  │ • HUD        │ │
│  │ • Components │  │ • Audio      │  │ • Menus      │ │
│  │ • Systems    │  │ • Input      │  │ • Overlays   │ │
│  │ • World      │  │ • Assets     │  │              │ │
│  └──────────────┘  │ • Physics    │  └──────────────┘ │
│                    │ • Network    │                    │
│                    └──────────────┘                    │
├─────────────────────────────────────────────────────────┤
│                  Utilities & Helpers                    │
│  • Math Utils  • Object Pools  • Event Bus  • Logger   │
└─────────────────────────────────────────────────────────┘
```

### 2. Directory Structure (Post-Refactor)

```
infinite-snake/
├── src/                          # TypeScript source code
│   ├── core/                     # Game engine core
│   │   ├── ecs/                  # Entity-Component-System
│   │   │   ├── Entity.ts
│   │   │   ├── Component.ts
│   │   │   ├── System.ts
│   │   │   ├── World.ts
│   │   │   └── ComponentRegistry.ts
│   │   ├── engine/               # Main engine logic
│   │   │   ├── GameEngine.ts     # Main entry point
│   │   │   ├── GameLoop.ts       # Fixed timestep loop
│   │   │   ├── StateManager.ts   # Game state FSM
│   │   │   └── Config.ts         # Game configuration
│   │   └── math/                 # Math utilities
│   │       ├── Vector2.ts
│   │       ├── Rectangle.ts
│   │       ├── Circle.ts
│   │       └── MathUtils.ts
│   │
│   ├── services/                 # Service layer
│   │   ├── rendering/
│   │   │   ├── RenderService.ts
│   │   │   ├── BatchRenderer.ts
│   │   │   ├── EmojiCache.ts
│   │   │   ├── CanvasLayerManager.ts
│   │   │   └── WebGLRenderer.ts
│   │   ├── audio/
│   │   │   ├── AudioService.ts
│   │   │   ├── SoundPool.ts
│   │   │   └── MusicManager.ts
│   │   ├── input/
│   │   │   ├── InputService.ts
│   │   │   ├── KeyboardController.ts
│   │   │   ├── MouseController.ts
│   │   │   └── TouchController.ts
│   │   ├── physics/
│   │   │   ├── PhysicsService.ts
│   │   │   ├── SpatialHashGrid.ts
│   │   │   ├── CollisionDetector.ts
│   │   │   └── Quadtree.ts
│   │   ├── assets/
│   │   │   ├── AssetService.ts
│   │   │   ├── AssetLoader.ts
│   │   │   ├── TextureAtlas.ts
│   │   │   └── SoundLoader.ts
│   │   └── network/
│   │       ├── LeaderboardService.ts
│   │       ├── AnalyticsService.ts
│   │       └── ApiClient.ts
│   │
│   ├── components/               # ECS Components
│   │   ├── TransformComponent.ts  # Position, rotation, scale
│   │   ├── VelocityComponent.ts   # Movement
│   │   ├── RenderComponent.ts     # Visual representation
│   │   ├── ColliderComponent.ts   # Collision shape
│   │   ├── HealthComponent.ts     # HP system
│   │   ├── SnakeBodyComponent.ts  # Snake segments
│   │   ├── ElementBankComponent.ts # Held elements
│   │   ├── AIComponent.ts         # AI behavior
│   │   └── ...
│   │
│   ├── systems/                  # ECS Systems
│   │   ├── MovementSystem.ts     # Updates positions
│   │   ├── CollisionSystem.ts    # Detects collisions
│   │   ├── RenderSystem.ts       # Draws entities
│   │   ├── AISystem.ts           # AI decision making
│   │   ├── SnakeSystem.ts        # Snake-specific logic
│   │   ├── BossSystem.ts         # Boss behaviors
│   │   ├── ParticleSystem.ts     # Particle effects
│   │   ├── ElementSpawnSystem.ts # Element generation
│   │   └── ...
│   │
│   ├── entities/                 # Entity factories
│   │   ├── EntityFactory.ts
│   │   ├── SnakeFactory.ts
│   │   ├── BossFactory.ts
│   │   ├── ElementFactory.ts
│   │   ├── PowerUpFactory.ts
│   │   └── ParticleFactory.ts
│   │
│   ├── game/                     # Game-specific logic
│   │   ├── modes/
│   │   │   ├── GameMode.ts       # Base class
│   │   │   ├── ClassicMode.ts
│   │   │   └── CozyMode.ts
│   │   ├── scoring/
│   │   │   ├── ScoreManager.ts
│   │   │   ├── ComboSystem.ts
│   │   │   └── KillstreakSystem.ts
│   │   ├── discovery/
│   │   │   ├── DiscoveryManager.ts
│   │   │   ├── CombinationEngine.ts
│   │   │   └── ElementDatabase.ts
│   │   └── bosses/
│   │       ├── BossManager.ts
│   │       ├── Pyraxis.ts        # Fire boss
│   │       ├── Zephyrus.ts       # Air boss
│   │       ├── Abyssos.ts        # Water boss
│   │       └── Osseus.ts         # Earth boss
│   │
│   ├── ui/                       # UI layer
│   │   ├── UIManager.ts
│   │   ├── screens/
│   │   │   ├── SplashScreen.ts
│   │   │   ├── GameScreen.ts
│   │   │   ├── PauseScreen.ts
│   │   │   └── GameOverScreen.ts
│   │   ├── components/
│   │   │   ├── HUD.ts
│   │   │   ├── ScoreDisplay.ts
│   │   │   ├── ElementBank.ts
│   │   │   ├── Minimap.ts
│   │   │   └── Leaderboard.ts
│   │   └── mobile/
│   │       ├── MobileUIManager.ts
│   │       ├── VirtualJoystick.ts
│   │       └── TouchControls.ts
│   │
│   ├── utils/                    # Utilities
│   │   ├── EventBus.ts           # Event system
│   │   ├── ObjectPool.ts         # Object pooling
│   │   ├── Logger.ts             # Logging
│   │   ├── PerformanceMonitor.ts
│   │   ├── DeviceDetector.ts
│   │   └── StorageManager.ts
│   │
│   ├── data/                     # Game data
│   │   ├── elements/
│   │   │   ├── ElementData.ts
│   │   │   ├── CombinationData.ts
│   │   │   └── EmojiData.ts
│   │   ├── skins/
│   │   │   └── SkinData.ts
│   │   └── config/
│   │       ├── GameConstants.ts
│   │       ├── PhysicsConstants.ts
│   │       └── RenderConstants.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── entities.ts
│   │   ├── components.ts
│   │   ├── services.ts
│   │   └── game.ts
│   │
│   └── main.ts                   # Application entry point
│
├── public/                       # Static assets
│   ├── assets/
│   ├── sounds/
│   ├── music/
│   ├── skins/
│   └── index.html                # Clean HTML template
│
├── tests/                        # Test suite
│   ├── unit/
│   │   ├── core/
│   │   ├── services/
│   │   └── game/
│   ├── integration/
│   │   ├── collision.test.ts
│   │   ├── scoring.test.ts
│   │   └── discovery.test.ts
│   └── e2e/
│       └── gameplay.spec.ts
│
├── tools/                        # Build tools
│   ├── build.js
│   ├── dev-server.js
│   └── asset-pipeline.js
│
├── docs/                         # Documentation
│   ├── architecture/
│   ├── api/
│   └── development/
│
├── package.json
├── tsconfig.json
├── vite.config.ts                # Build configuration
├── .eslintrc.json
├── .prettierrc
└── README.md
```

---

## Phase-by-Phase Implementation Plan

### **PHASE 0: Preparation & Safety Net** (Week 1)

**Goal:** Establish testing infrastructure and baseline before changes

#### Tasks:

1. **Create Functionality Inventory**
   - Document all current features with screenshots
   - Create behavior test suite covering critical paths:
     - Snake movement (keyboard, mouse, touch)
     - Element collection and combining
     - Boss spawning and attacks
     - Scoring and combos
     - Mode differences (Classic vs Cozy)
     - Mobile UI behavior

2. **Set Up Testing Infrastructure**
   ```bash
   npm install --save-dev vitest @vitest/ui
   npm install --save-dev @testing-library/dom
   npm install --save-dev jsdom
   ```

3. **Create Snapshot Tests**
   - Save current game state outputs
   - Record element combinations
   - Capture scoring calculations

4. **Set Up Git Strategy**
   - Create `refactor/architecture` main branch
   - Tag current version as `v1.0-pre-refactor`
   - Set up feature branches: `refactor/phase-1`, `refactor/phase-2`, etc.

5. **Performance Baseline**
   - Record current FPS metrics
   - Measure load times
   - Profile memory usage
   - Document on low/medium/high-end devices

**Deliverables:**
- ✅ Test suite with 80%+ critical path coverage
- ✅ Performance baseline document
- ✅ Feature inventory checklist

---

### **PHASE 1: Foundation & Build System** (Week 2)

**Goal:** Set up TypeScript, build tooling, and project structure

#### Tasks:

1. **Initialize TypeScript**
   ```bash
   npm install --save-dev typescript @types/node
   npm install --save-dev vite vite-plugin-html
   ```

2. **Create `tsconfig.json`**
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "lib": ["ES2020", "DOM"],
       "moduleResolution": "bundler",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "resolveJsonModule": true,
       "declaration": true,
       "declarationMap": true,
       "sourceMap": true,
       "outDir": "./dist",
       "baseUrl": "./src",
       "paths": {
         "@core/*": ["core/*"],
         "@services/*": ["services/*"],
         "@components/*": ["components/*"],
         "@systems/*": ["systems/*"],
         "@game/*": ["game/*"],
         "@utils/*": ["utils/*"]
       }
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

3. **Set Up Vite Build**
   - Configure hot module replacement
   - Set up asset pipeline
   - Configure dev server

4. **Create New Directory Structure**
   - Set up `/src` with subdirectories
   - Move `/public` assets
   - Preserve original files in `/legacy`

5. **Establish Code Standards**
   ```bash
   npm install --save-dev eslint @typescript-eslint/parser
   npm install --save-dev prettier eslint-config-prettier
   ```

**Deliverables:**
- ✅ TypeScript compiles successfully
- ✅ Vite dev server running with hot reload
- ✅ New directory structure created
- ✅ ESLint + Prettier configured

---

### **PHASE 2: Core Engine Infrastructure** (Weeks 3-4)

**Goal:** Build ECS foundation and core game loop

#### Tasks:

1. **Implement ECS Core** (`src/core/ecs/`)

   **Entity.ts:**
   ```typescript
   export class Entity {
     private static nextId = 0;
     public readonly id: number;
     private components: Map<string, Component>;

     constructor() {
       this.id = Entity.nextId++;
       this.components = new Map();
     }

     addComponent<T extends Component>(component: T): this {
       this.components.set(component.constructor.name, component);
       return this;
     }

     getComponent<T extends Component>(type: new (...args: any[]) => T): T | null {
       return this.components.get(type.name) as T | null;
     }

     hasComponent(type: new (...args: any[]) => any): boolean {
       return this.components.has(type.name);
     }

     removeComponent(type: new (...args: any[]) => any): void {
       this.components.delete(type.name);
     }
   }
   ```

   **Component.ts:**
   ```typescript
   export abstract class Component {
     enabled: boolean = true;
   }
   ```

   **System.ts:**
   ```typescript
   export abstract class System {
     abstract update(entities: Entity[], deltaTime: number): void;
     abstract requiredComponents(): Array<new (...args: any[]) => Component>;

     protected filterEntities(entities: Entity[]): Entity[] {
       return entities.filter(entity =>
         this.requiredComponents().every(comp => entity.hasComponent(comp))
       );
     }
   }
   ```

   **World.ts:**
   ```typescript
   export class World {
     private entities: Set<Entity> = new Set();
     private systems: System[] = [];
     private entitiesToAdd: Entity[] = [];
     private entitiesToRemove: Entity[] = [];

     addEntity(entity: Entity): void {
       this.entitiesToAdd.push(entity);
     }

     removeEntity(entity: Entity): void {
       this.entitiesToRemove.push(entity);
     }

     registerSystem(system: System): void {
       this.systems.push(system);
     }

     update(deltaTime: number): void {
       // Process deferred adds/removes
       this.processDeferredOperations();

       // Update all systems
       const entityArray = Array.from(this.entities);
       for (const system of this.systems) {
         system.update(entityArray, deltaTime);
       }
     }

     private processDeferredOperations(): void {
       for (const entity of this.entitiesToRemove) {
         this.entities.delete(entity);
       }
       for (const entity of this.entitiesToAdd) {
         this.entities.add(entity);
       }
       this.entitiesToAdd = [];
       this.entitiesToRemove = [];
     }
   }
   ```

2. **Create Game Loop** (`src/core/engine/GameLoop.ts`)

   ```typescript
   export class GameLoop {
     private readonly TARGET_FPS = 60;
     private readonly FRAME_TIME = 1000 / this.TARGET_FPS;
     private running = false;
     private lastTime = 0;
     private accumulator = 0;

     constructor(
       private updateFn: (deltaTime: number) => void,
       private renderFn: (alpha: number) => void
     ) {}

     start(): void {
       this.running = true;
       this.lastTime = performance.now();
       this.loop(this.lastTime);
     }

     stop(): void {
       this.running = false;
     }

     private loop = (currentTime: number): void => {
       if (!this.running) return;

       const deltaTime = Math.min(currentTime - this.lastTime, 100);
       this.lastTime = currentTime;
       this.accumulator += deltaTime;

       // Fixed timestep updates
       while (this.accumulator >= this.FRAME_TIME) {
         this.updateFn(this.FRAME_TIME / 1000);
         this.accumulator -= this.FRAME_TIME;
       }

       // Render with interpolation
       const alpha = this.accumulator / this.FRAME_TIME;
       this.renderFn(alpha);

       requestAnimationFrame(this.loop);
     };
   }
   ```

3. **Implement Math Utilities** (`src/core/math/`)
   - `Vector2.ts`: 2D vector operations
   - `Rectangle.ts`: AABB collision
   - `Circle.ts`: Circle collision
   - `MathUtils.ts`: Clamp, lerp, angle normalization

4. **Create Service Base Class** (`src/services/Service.ts`)
   ```typescript
   export abstract class Service {
     protected initialized = false;

     async initialize(): Promise<void> {
       if (this.initialized) return;
       await this.onInitialize();
       this.initialized = true;
     }

     abstract onInitialize(): Promise<void>;
     abstract shutdown(): void;
   }
   ```

**Deliverables:**
- ✅ ECS system fully implemented
- ✅ Game loop with fixed timestep
- ✅ Math utilities library
- ✅ Service base infrastructure

---

### **PHASE 3: Service Layer Implementation** (Weeks 5-6)

**Goal:** Extract cross-cutting concerns into services

#### Tasks:

1. **Input Service** (`src/services/input/`)

   **InputService.ts:**
   ```typescript
   export class InputService extends Service {
     private controllers: InputController[] = [];
     public readonly keyboard: KeyboardController;
     public readonly mouse: MouseController;
     public readonly touch: TouchController;

     constructor(private canvas: HTMLCanvasElement) {
       super();
       this.keyboard = new KeyboardController();
       this.mouse = new MouseController(canvas);
       this.touch = new TouchController(canvas);
       this.controllers = [this.keyboard, this.mouse, this.touch];
     }

     async onInitialize(): Promise<void> {
       for (const controller of this.controllers) {
         controller.enable();
       }
     }

     update(): void {
       for (const controller of this.controllers) {
         controller.update();
       }
     }

     shutdown(): void {
       for (const controller of this.controllers) {
         controller.disable();
       }
     }
   }
   ```

2. **Render Service** (`src/services/rendering/`)

   **RenderService.ts:**
   ```typescript
   export class RenderService extends Service {
     private ctx: CanvasRenderingContext2D;
     private batchRenderer: BatchRenderer;
     private layerManager: CanvasLayerManager;

     constructor(
       private canvas: HTMLCanvasElement,
       private config: RenderConfig
     ) {
       super();
     }

     async onInitialize(): Promise<void> {
       this.ctx = this.canvas.getContext('2d')!;
       this.ctx.imageSmoothingEnabled = false;
       this.batchRenderer = new BatchRenderer(this.ctx);
       this.layerManager = new CanvasLayerManager();
     }

     clear(): void {
       this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
     }

     render(entities: Entity[], camera: Camera): void {
       this.clear();
       this.ctx.save();

       // Apply camera transform
       camera.apply(this.ctx);

       // Render entities by layer
       const sorted = this.sortByLayer(entities);
       for (const entity of sorted) {
         this.renderEntity(entity);
       }

       this.batchRenderer.flush();
       this.ctx.restore();
     }
   }
   ```

3. **Audio Service** (`src/services/audio/`)
   - Migrate sound pool logic
   - Implement music manager
   - Handle iOS audio quirks

4. **Physics Service** (`src/services/physics/`)
   - Port spatial hash grid
   - Implement collision detection
   - Create collision response system

5. **Asset Service** (`src/services/assets/`)
   - Centralize asset loading
   - Implement texture atlas
   - Create sound loader

**Deliverables:**
- ✅ All services implemented and tested
- ✅ Services integrated with dependency injection
- ✅ Legacy code still runs in parallel

---

### **PHASE 4: Component & System Migration** (Weeks 7-9)

**Goal:** Convert game entities to ECS architecture

#### Migration Strategy:

**Step 1:** Create components for existing entity data
**Step 2:** Create systems for existing game logic
**Step 3:** Create entity factories to replace constructors
**Step 4:** Run both architectures in parallel with comparison tests
**Step 5:** Switch to new architecture, remove old code

#### Components to Create:

1. **Core Components:**
   - `TransformComponent` - position, rotation, scale
   - `VelocityComponent` - velocity, acceleration
   - `RenderComponent` - visual data (emoji, size, color)
   - `ColliderComponent` - collision shape and callbacks
   - `HealthComponent` - current/max health, invulnerability
   - `TagComponent` - entity tags (player, enemy, collectible)

2. **Snake-Specific:**
   - `SnakeBodyComponent` - segments array, length, size
   - `SnakeControlComponent` - control scheme (keyboard/mouse/AI)
   - `ElementBankComponent` - held elements (max 6)
   - `SnakeStatsComponent` - score, kills, boost stamina

3. **AI Components:**
   - `AIComponent` - personality, state machine, target
   - `PathfindingComponent` - path, waypoints

4. **Boss Components:**
   - `BossComponent` - boss type, phase, enrage state
   - `ProjectileSpawnerComponent` - spawn patterns

#### Systems to Create:

1. **MovementSystem**
   - Updates positions based on velocity
   - Applies speed limits
   - Handles boost mechanics

2. **SnakeSystem**
   - Updates snake segments
   - Handles turning
   - Manages body following logic

3. **CollisionSystem**
   - Uses spatial hash for broad phase
   - Detects collisions
   - Triggers collision events

4. **AISystem**
   - Runs AI decision making
   - Updates targets
   - Controls AI snakes

5. **BossSystem**
   - Boss behavior trees
   - Attack pattern execution
   - Phase transitions

6. **RenderSystem**
   - Queues entities for rendering
   - Handles camera culling
   - Manages visual effects

#### Example Migration:

**Before (Snake.js):**
```javascript
class Snake {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.angle = 0;
    this.segments = [];
    this.elements = [];
    // ... 50+ more properties
  }

  update(deltaTime) {
    // Movement logic
    // Collision logic
    // AI logic
    // Rendering logic
    // All mixed together
  }
}
```

**After (ECS):**
```typescript
// Component definitions
class TransformComponent extends Component {
  constructor(public x: number, public y: number, public angle: number) {}
}

class SnakeBodyComponent extends Component {
  constructor(
    public segments: Array<{x: number, y: number}> = [],
    public length: number = 10
  ) {}
}

// System handles logic
class SnakeMovementSystem extends System {
  requiredComponents() {
    return [TransformComponent, VelocityComponent, SnakeBodyComponent];
  }

  update(entities: Entity[], deltaTime: number): void {
    for (const entity of this.filterEntities(entities)) {
      const transform = entity.getComponent(TransformComponent)!;
      const velocity = entity.getComponent(VelocityComponent)!;
      const body = entity.getComponent(SnakeBodyComponent)!;

      // Update position
      transform.x += velocity.vx * deltaTime;
      transform.y += velocity.vy * deltaTime;

      // Update segments (body following logic)
      this.updateSegments(transform, body);
    }
  }
}

// Factory creates entities
class SnakeFactory {
  createPlayerSnake(x: number, y: number): Entity {
    return new Entity()
      .addComponent(new TransformComponent(x, y, 0))
      .addComponent(new VelocityComponent(0, 0))
      .addComponent(new RenderComponent('🐍', 32))
      .addComponent(new SnakeBodyComponent([], 10))
      .addComponent(new ColliderComponent(16))
      .addComponent(new ElementBankComponent(6))
      .addComponent(new TagComponent('player'));
  }
}
```

**Deliverables:**
- ✅ All components implemented
- ✅ All systems implemented
- ✅ Entity factories created
- ✅ Parallel testing shows identical behavior
- ✅ Legacy entity classes deprecated

---

### **PHASE 5: Game Logic Migration** (Weeks 10-11)

**Goal:** Extract game-specific logic into manageable modules

#### Tasks:

1. **Discovery System** (`src/game/discovery/`)
   - `DiscoveryManager.ts` - tracks discovered elements
   - `CombinationEngine.ts` - handles element combining
   - `ElementDatabase.ts` - loads and queries element data

2. **Scoring System** (`src/game/scoring/`)
   - `ScoreManager.ts` - score calculation and persistence
   - `ComboSystem.ts` - combo multiplier logic
   - `KillstreakSystem.ts` - killstreak tracking

3. **Boss System** (`src/game/bosses/`)
   - `BossManager.ts` - boss spawning and lifecycle
   - Individual boss implementations (Pyraxis, Zephyrus, etc.)
   - Attack pattern definitions

4. **Game Mode System** (`src/game/modes/`)
   - `GameMode.ts` - abstract base class
   - `ClassicMode.ts` - competitive rules
   - `CozyMode.ts` - relaxed rules

5. **Power-up System**
   - Void Orb, Catalyst Gem, Alchemy Vision logic
   - Power-up spawning and effects

**Deliverables:**
- ✅ All game systems migrated and tested
- ✅ Game modes working identically
- ✅ Boss behaviors preserved

---

### **PHASE 6: UI Refactoring** (Week 12)

**Goal:** Modernize UI architecture with component pattern

#### Tasks:

1. **UI Manager** (`src/ui/UIManager.ts`)
   - Screen state management
   - Transition animations
   - Mobile/desktop adaptive layouts

2. **Screen Components**
   - `SplashScreen.ts` - mode selection
   - `GameScreen.ts` - main gameplay UI
   - `PauseScreen.ts` - pause menu
   - `GameOverScreen.ts` - results and leaderboard

3. **HUD Components**
   - `ScoreDisplay.ts`
   - `ElementBank.ts` - draggable element UI
   - `BoostMeter.ts`
   - `Minimap.ts`

4. **Mobile UI**
   - `VirtualJoystick.ts` - touch controls
   - `MobileUIManager.ts` - panel management

5. **Clean HTML Template**
   - Extract inline styles to CSS modules
   - Reduce to minimal structure
   - Dynamic element creation via TS

**Deliverables:**
- ✅ UI fully componentized
- ✅ Clean separation of concerns
- ✅ Mobile UI fully functional

---

### **PHASE 7: State Management & DI** (Week 13)

**Goal:** Eliminate global state with proper dependency injection

#### Tasks:

1. **Create DI Container** (`src/core/DI/Container.ts`)

   ```typescript
   export class ServiceContainer {
     private services = new Map<string, any>();

     register<T>(name: string, factory: () => T): void {
       this.services.set(name, factory());
     }

     get<T>(name: string): T {
       if (!this.services.has(name)) {
         throw new Error(`Service ${name} not registered`);
       }
       return this.services.get(name);
     }
   }
   ```

2. **Game State Manager** (`src/core/engine/StateManager.ts`)

   ```typescript
   export class GameStateManager {
     private currentState: GameState;
     private states: Map<string, GameState> = new Map();

     registerState(name: string, state: GameState): void {
       this.states.set(name, state);
     }

     transition(stateName: string): void {
       this.currentState?.exit();
       this.currentState = this.states.get(stateName)!;
       this.currentState?.enter();
     }

     update(deltaTime: number): void {
       this.currentState?.update(deltaTime);
     }
   }
   ```

3. **Remove Global Variables**
   - Migrate all `window.*` assignments to services
   - Pass dependencies through constructors
   - Use event bus for decoupled communication

4. **Event System** (`src/utils/EventBus.ts`)

   ```typescript
   export class EventBus {
     private listeners = new Map<string, Set<Function>>();

     on(event: string, callback: Function): () => void {
       if (!this.listeners.has(event)) {
         this.listeners.set(event, new Set());
       }
       this.listeners.get(event)!.add(callback);

       // Return unsubscribe function
       return () => this.off(event, callback);
     }

     emit(event: string, data?: any): void {
       const callbacks = this.listeners.get(event);
       if (callbacks) {
         for (const callback of callbacks) {
           callback(data);
         }
       }
     }
   }
   ```

**Deliverables:**
- ✅ All global state eliminated
- ✅ Dependency injection working
- ✅ Event bus for loose coupling

---

### **PHASE 8: Performance & Optimization** (Week 14)

**Goal:** Match or exceed current performance metrics

#### Tasks:

1. **Profiling**
   - Chrome DevTools Performance tab
   - Frame time analysis
   - Memory leak detection

2. **Object Pooling**
   - Generic `ObjectPool.ts` utility
   - Pool for particles, projectiles, elements

3. **Render Optimizations**
   - Viewport culling
   - Dirty rectangle tracking
   - Layer caching

4. **Code Splitting**
   - Lazy load boss implementations
   - Defer non-critical UI
   - Dynamic imports for game modes

5. **Bundle Optimization**
   - Tree shaking
   - Minification
   - Gzip/Brotli compression

**Performance Targets:**
- ✅ 60 FPS on medium-tier devices
- ✅ < 3s initial load time
- ✅ < 50MB memory footprint
- ✅ 90+ Lighthouse score

**Deliverables:**
- ✅ Performance meets or exceeds baseline
- ✅ Optimizations documented

---

### **PHASE 9: Testing & Quality Assurance** (Week 15)

**Goal:** Comprehensive test coverage for confidence

#### Test Strategy:

1. **Unit Tests** (Vitest)
   - Test all components in isolation
   - Test all systems with mock entities
   - Test math utilities
   - Target: 80%+ code coverage

2. **Integration Tests**
   - Test system interactions
   - Test service integrations
   - Test game logic flows

3. **End-to-End Tests** (Playwright)
   - Full gameplay scenarios
   - Mode switching
   - Boss battles
   - Leaderboard submission

4. **Visual Regression Tests**
   - Screenshot comparisons
   - UI layout verification

5. **Performance Tests**
   - FPS benchmarks
   - Memory leak detection
   - Load time monitoring

**Test Examples:**

```typescript
// Unit test
describe('CombinationEngine', () => {
  it('should combine Water + Earth = Mud', () => {
    const engine = new CombinationEngine(mockData);
    const result = engine.combine('Water', 'Earth');
    expect(result).toEqual({ id: 123, name: 'Mud' });
  });
});

// Integration test
describe('CollisionSystem', () => {
  it('should detect snake head collision with element', () => {
    const world = new World();
    const snake = SnakeFactory.createPlayerSnake(100, 100);
    const element = ElementFactory.createElement(110, 110, 'Fire');

    world.addEntity(snake);
    world.addEntity(element);

    const collisionSystem = new CollisionSystem();
    world.registerSystem(collisionSystem);

    let collisionDetected = false;
    eventBus.on('collision:element', () => collisionDetected = true);

    world.update(0.016);

    expect(collisionDetected).toBe(true);
  });
});

// E2E test
test('player can complete a full game in Classic mode', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-mode="classic"]');

  // Play for 30 seconds
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(30000);

  // Verify score increased
  const score = await page.locator('[data-testid="score"]').textContent();
  expect(parseInt(score)).toBeGreaterThan(0);
});
```

**Deliverables:**
- ✅ 80%+ unit test coverage
- ✅ All critical paths E2E tested
- ✅ No regressions detected

---

### **PHASE 10: Documentation & Polish** (Week 16)

**Goal:** Production-ready codebase with excellent DX

#### Tasks:

1. **Code Documentation**
   - TSDoc comments on all public APIs
   - Generate API docs with TypeDoc
   - Architecture decision records (ADRs)

2. **Developer Guides**
   - `docs/architecture/OVERVIEW.md` - system architecture
   - `docs/development/GETTING_STARTED.md` - setup guide
   - `docs/development/ADDING_FEATURES.md` - how to extend
   - `docs/api/SERVICES.md` - service layer API

3. **Migration Guide**
   - Document breaking changes
   - Provide migration examples
   - Explain new patterns

4. **Performance Guide**
   - Optimization best practices
   - Profiling instructions
   - Common pitfalls

5. **Polish**
   - Remove all `console.log` statements
   - Add proper error messages
   - Improve loading screen UX
   - Add dev mode toggles (show hitboxes, FPS, etc.)

**Deliverables:**
- ✅ Complete API documentation
- ✅ Developer onboarding guide
- ✅ Migration guide for contributors

---

### **PHASE 11: Deployment & Monitoring** (Week 17)

**Goal:** Deploy refactored version with monitoring

#### Tasks:

1. **Build Pipeline**
   - Production build configuration
   - Asset optimization
   - Source maps for debugging

2. **Feature Flags**
   - Gradual rollout capability
   - A/B testing infrastructure
   - Kill switch for emergencies

3. **Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring (Web Vitals)
   - Analytics (GA4)

4. **Staged Rollout**
   - Beta deployment (5% traffic)
   - Monitor metrics
   - Gradually increase to 100%

5. **Rollback Plan**
   - Keep old version accessible
   - Automated rollback triggers
   - Data migration contingencies

**Deliverables:**
- ✅ Production deployment successful
- ✅ Monitoring active
- ✅ Rollback plan tested

---

## Technical Specifications

### TypeScript Configuration

**Strict Mode Enabled:**
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`

**Path Aliases:**
```json
{
  "@core/*": ["core/*"],
  "@services/*": ["services/*"],
  "@components/*": ["components/*"],
  "@systems/*": ["systems/*"],
  "@game/*": ["game/*"],
  "@ui/*": ["ui/*"],
  "@utils/*": ["utils/*"]
}
```

### Build Configuration (Vite)

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['upstash/redis'],
          'game-core': ['./src/core/ecs', './src/core/engine'],
          'services': ['./src/services'],
          'bosses': ['./src/game/bosses']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@upstash/redis']
  }
});
```

### ECS Performance Considerations

**Component Pooling:**
- Reuse component instances to reduce GC pressure
- Pool size based on expected max entities (500-1000)

**System Ordering:**
- Input → AI → Movement → Collision → Rendering
- Critical systems run first
- Rendering always last

**Spatial Partitioning:**
- Grid cell size: 100px (desktop), 150px (mobile)
- Rebuild spatial hash every frame (cheap with good cell size)
- Only check entities in nearby cells

### Dependency Injection Pattern

```typescript
// Main.ts - Application bootstrap
async function bootstrap() {
  const container = new ServiceContainer();

  // Register services
  container.register('InputService', () => new InputService(canvas));
  container.register('RenderService', () => new RenderService(canvas, config));
  container.register('AudioService', () => new AudioService());
  container.register('AssetService', () => new AssetService());
  container.register('PhysicsService', () => new PhysicsService());

  // Initialize services
  await container.get<InputService>('InputService').initialize();
  await container.get<RenderService>('RenderService').initialize();
  await container.get<AudioService>('AudioService').initialize();
  await container.get<AssetService>('AssetService').initialize();

  // Create game engine
  const engine = new GameEngine(container);
  await engine.initialize();
  engine.start();
}
```

---

## Risk Mitigation Strategies

### Risk 1: Functionality Loss

**Mitigation:**
- ✅ Comprehensive test suite before refactoring
- ✅ Run both architectures in parallel during Phase 4
- ✅ Visual regression testing
- ✅ Beta testing period with rollback capability

### Risk 2: Performance Regression

**Mitigation:**
- ✅ Performance baseline before refactoring
- ✅ Continuous benchmarking during development
- ✅ Load testing on low-end devices
- ✅ Profiling at each phase

### Risk 3: Timeline Overruns

**Mitigation:**
- ✅ Phased approach allows early value delivery
- ✅ Each phase is independently valuable
- ✅ Can pause/resume at phase boundaries
- ✅ Feature flags allow partial deployment

### Risk 4: Breaking Changes for Users

**Mitigation:**
- ✅ Maintain save data compatibility
- ✅ Preserve localStorage schema
- ✅ Migration scripts for data format changes
- ✅ Backwards compatibility layer

### Risk 5: Developer Learning Curve

**Mitigation:**
- ✅ Comprehensive documentation
- ✅ Code examples and templates
- ✅ Architecture diagrams
- ✅ Pair programming sessions

---

## Success Metrics

### Code Quality Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Largest file | 16,191 lines | < 500 lines |
| Cyclomatic complexity | High | < 10 per function |
| Test coverage | ~10% | > 80% |
| Type safety | 0% (JS) | 100% (TS) |
| Global variables | 40+ | 0 |
| Build time | N/A | < 10s |

### Performance Metrics

| Metric | Current | Target |
|--------|---------|--------|
| FPS (desktop) | 60 | 60 |
| FPS (mobile) | 45-60 | 60 |
| Load time | ~2s | < 3s |
| Memory usage | ~40MB | < 50MB |
| Bundle size | N/A | < 500KB gzipped |

### Developer Experience

| Metric | Current | Target |
|--------|---------|--------|
| Hot reload | No | Yes |
| TypeScript errors | N/A | Caught at compile time |
| IDE autocomplete | Basic | Full |
| Time to add feature | High | Low |
| Time to fix bug | High | Low |

---

## Post-Refactor Benefits

### For Development

- ✅ **Modular codebase**: Easy to navigate and understand
- ✅ **Type safety**: Catch bugs at compile time
- ✅ **Hot reload**: Instant feedback during development
- ✅ **Testability**: Easy to write unit/integration tests
- ✅ **Extensibility**: Simple to add new features (bosses, modes, etc.)
- ✅ **Collaboration**: Multiple devs can work without conflicts

### For Performance

- ✅ **Optimized builds**: Tree shaking, code splitting, minification
- ✅ **Efficient ECS**: Better cache locality, less GC pressure
- ✅ **Smart rendering**: Culling, batching, layer caching
- ✅ **Lazy loading**: Load code on-demand

### For Maintenance

- ✅ **Clear architecture**: Easy to reason about
- ✅ **Documented patterns**: New contributors ramp up quickly
- ✅ **Automated testing**: Confidence in changes
- ✅ **Refactoring safety**: Types and tests catch breaks

---

## Future Enhancements Enabled

With the new architecture, these become trivial to add:

1. **Multiplayer Support**
   - Network service already abstracted
   - Entity synchronization via ECS
   - Deterministic simulation

2. **Replay System**
   - Record input events
   - Replay with same determinism

3. **Level Editor**
   - Serialize/deserialize entities
   - Custom game modes

4. **Mod Support**
   - Plugin architecture
   - Custom components/systems
   - Content packs

5. **Advanced Graphics**
   - WebGL renderer swap
   - Shader effects
   - Particle systems

---

## Conclusion

This refactoring plan transforms Infinite Snake from a **monolithic prototype** into a **professionally-architected game** while ensuring **zero functionality loss**. The phased approach allows:

- ✅ Continuous validation at each step
- ✅ Early delivery of value (better DX from Phase 1)
- ✅ Low-risk migration (parallel testing)
- ✅ Clear rollback points

By following game industry best practices (ECS, services, DI, testing), the codebase will be:
- **Maintainable**: Easy to understand and modify
- **Scalable**: Add features without fear
- **Performant**: Optimized for 60 FPS
- **Professional**: Matches AAA studio standards

**Estimated Timeline:** 17 weeks
**Risk Level:** Low (phased approach with testing)
**Value Delivered:** Transformational

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Adjust timeline** based on team capacity
3. **Set up Phase 0** (testing infrastructure)
4. **Create project board** to track phases
5. **Begin execution** with weekly check-ins

Questions or concerns? Let's discuss before beginning Phase 0.
