# Infinite Snake - Technical Architecture Documentation

## Table of Contents
1. [Quick Start Guide](#quick-start-guide)
2. [Project Overview](#project-overview)
3. [Technology Stack](#technology-stack)
4. [Directory Structure](#directory-structure)
5. [Core Systems Architecture](#core-systems-architecture)
6. [Game Components](#game-components)
7. [Gameplay Systems](#gameplay-systems)
8. [Asset Management](#asset-management)
9. [Game Flow & States](#game-flow--states)
10. [Performance Systems](#performance-systems)
11. [Configuration & Settings](#configuration--settings)
12. [Analytics & Metrics](#analytics--metrics)
13. [Common Modifications Guide](#common-modifications-guide)
14. [Troubleshooting](#troubleshooting)
15. [Development Workflow](#development-workflow)
16. [Future Considerations](#future-considerations)

---

## Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server or VS Code Live Server extension

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Start local server: `npm start` or use Live Server
4. Open `http://localhost:3000` in your browser

### Making Your First Change
1. Edit any game constant in `js/core/game-original.js`
2. Refresh browser to see changes
3. Use browser DevTools console for debugging

### Key Files to Know
- `index.html` - Entry point
- `js/core/game-original.js` - Main game logic
- `elements/data/elements.json` - Element definitions
- `js/core/entities/Snake.js` - Snake behavior

---

## Project Overview

**Game Name**: Infinite Snake  
**Type**: Browser-based arcade game  
**Core Mechanics**: Snake movement, element collection, boss battles, online leaderboards  
**Platform**: Web (HTML5/JavaScript)  
**Current Version**: 1.9.7  
**Genre**: Arcade/Casual with progression elements  
**Target Audience**: Casual gamers, nostalgia seekers, competitive players  

### Key Features
- Classic snake gameplay with alchemical element collection
- Element combination system for discoveries
- Boss battle encounters
- Global leaderboard competition
- Progressive skin unlock system
- Mobile-optimized controls
- AI snakes with personality types

---

## Technology Stack

- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Styling**: CSS3 with modular stylesheets
- **Backend**: Vercel Edge Functions + Upstash Redis
- **Analytics**: Vercel Analytics
- **Testing**: Playwright
- **Deployment**: Vercel
- **Package Manager**: npm

### Dependencies
- `@upstash/redis`: ^1.35.0 - Backend data storage
- `@vercel/analytics`: ^1.5.0 - Analytics tracking
- `@playwright/test`: ^1.54.1 - E2E testing framework

---

## Directory Structure

```
Infinite Snake/
├── index.html                    # Main entry point
├── package.json                  # Project configuration
├── vercel.json                   # Deployment configuration
├── js/                          # JavaScript source files
│   ├── core/                    # Core game engine
│   │   ├── entities/            # Game entity classes
│   │   │   ├── Snake.js         # Snake class with AI personalities
│   │   │   ├── Element.js       # Collectible elements
│   │   │   ├── Boss.js          # Boss entities
│   │   │   ├── Asteroid.js      # Asteroid obstacles
│   │   │   ├── Particle.js      # Visual effects
│   │   │   ├── AlchemyVision.js # Power-up: element combination hints
│   │   │   ├── VoidOrb.js       # Power-up: digest all elements
│   │   │   ├── CatalystGem.js   # Power-up: spawn elements
│   │   │   └── [Various pools]  # Object pooling classes
│   │   ├── game-original.js     # Main game logic (14,000+ lines)
│   │   ├── game-main.js         # ES6 module wrapper
│   │   ├── init-sequence.js     # Initialization orchestrator
│   │   ├── module-loader.js     # ES6 module loading system
│   │   ├── logger.js            # Logging utility
│   │   └── shared-context.js    # Shared game state
│   ├── performance/             # Performance optimization
│   │   ├── unified-performance-system.js
│   │   ├── device-tier.js       # Device capability detection
│   │   ├── canvas-optimizer.js  # Canvas rendering optimizations
│   │   └── variable-framerate.js # Adaptive frame rate
│   ├── mobile/                  # Mobile-specific code
│   │   └── mobile-ui-manager.js # Mobile UI management
│   ├── analytics/               # Analytics integration
│   ├── leaderboard.js           # Leaderboard client
│   ├── playerStats.js           # Statistics tracking
│   ├── asset-preloader.js       # Asset loading system
│   └── [Various utilities]      # Helper functions
├── elements/                    # Element data
│   └── data/
│       ├── elements.json        # Element definitions
│       ├── combinations.json    # Crafting combinations
│       └── loader.js           # Data loading script
├── assets/                      # Visual assets
│   ├── background/             # Background images
│   ├── planets/                # Animated planet sprites
│   ├── kill-medals/            # Achievement medals
│   └── stations/               # Space stations
├── sounds/                     # Sound effects
├── music/                      # Background music
│   └── cozy-music/            # Cozy mode tracks
├── killstreak-announcer/       # Voice lines
├── skins/                      # Snake skins
├── css/                        # Stylesheets
├── api/                        # Backend API handlers
├── admin/                      # Admin tools
└── tests/                      # Test suite
```

---

## Core Systems Architecture

### 1. Game Engine Core
- **Main File**: `js/core/game-original.js`
- **Game Loop**: `gameLoop()` function at line 14009
  - Fixed timestep: 60 FPS (16.67ms per frame)
  - Accumulator-based update with interpolation
  - Separate update and render phases
- **Canvas Management**: Dual canvas system (main + UI overlay)
- **Coordinate System**: World space with camera tracking player

### 2. Module Loading System
**File**: `js/core/module-loader.js`

Loading order:
1. DebugConfig - Debug settings
2. Logger - Logging system
3. SharedContext - Shared game state
4. EasterEggElements - Special elements
5. MobileConfig - Mobile settings
6. PerformanceSystem - Performance management
7. MobileUI - Mobile interface
8. GameMain - Main game module

### 3. Entity System
All entities extend base classes with `update()` and `draw()` methods:

- **Snake** (`js/core/entities/Snake.js`)
  - AI personalities: Aggressive, Balanced, Combo Master
  - Properties: position, angle, speed, segments, elementBank
  - Methods: `updateMovement()`, `consume()`, `handleControls()`
  
- **Element** (`js/core/entities/Element.js`)
  - Properties: emoji, tier, position, magnetism
  - Auto-combines compatible elements in snake's bank
  
- **Boss** (`js/core/entities/Boss.js`)
  - Types: Pyraxis (Fire), Zephyrus (Air), Abyssos (Water), Osseus (Earth)
  - Special attacks and projectile systems
  - Enrages at 50% health

### 4. Collision Detection
- **Location**: `js/core/game-original.js:11330` (`checkCollisions()`)
- **Algorithm**: Quadtree spatial partitioning for broad phase
- **Collision types**: Snake-element, snake-snake, snake-boundary, snake-projectile

### 5. Rendering Pipeline
1. Clear canvas
2. Draw background (stars, planets)
3. Draw world objects (elements, power-ups)
4. Draw snakes (with interpolation)
5. Draw particles and effects
6. Draw UI overlay

---

## Game Components

### Player Snake
- **File**: `js/core/entities/Snake.js`
- **Base Speed**: 4.761 units/frame (Snake.js) or 5.95125 (game-original.js) - *Note: Different values in different files*
- **Turn Speed**: 0.08 radians/frame
- **Boost**: 1.75x speed multiplier (BOOST_SPEED_MULTIPLIER), 100 stamina
- **Element Bank**: 6 slots for collected elements
- **Segment Growth**: +2 segments per element consumed

### Element System
- **Regular Elements**: Emoji-based alchemical ingredients
- **Tiers**: 1-4, higher tiers from combinations
- **Spawning**: Grid-based distribution, biased toward useful elements
- **Max Active**: 300 elements in world

### Boss Battles
**File**: `js/core/entities/Boss.js`

| Boss | Color | Color Code | Theme | Special Attack |
|------|-------|------------|-------|----------------|
| Pyraxis | Rose/Pink | #c74250 | Fire | Fire projectiles |
| Zephyrus | Dark Blue/Gray | #464969 | Air | Wind attacks |
| Abyssos | Green | #80b878 | Water | Water waves |
| Osseus | Dark Brown | #7a4900 | Earth | Earth shockwaves |

### Power-ups
1. **Alchemy Vision** (🔮) *[Currently disabled in code]*
   - Duration: 30 seconds
   - Shows combination hints
   - Spawn interval: 2 minutes (120000ms)

2. **Void Orb** (🌀)
   - Instant effect: digests all elements
   - 50 points per element
   - Spawn interval: 50 seconds (50000ms)

3. **Catalyst Gem** (💎)
   - Spawns 3 tier 1-2 elements
   - Spawn interval: 45 seconds (45000ms)

---

## Gameplay Systems

### Movement System
**Files**: `js/core/entities/Snake.js`, `js/core/game-original.js`

**Control Schemes**:
1. **Arrow/WASD**: Direct turning, W/Up for boost
2. **Mouse**: Follow cursor, click for boost  
3. **Mobile**: Virtual joystick, touch boost

**Input Queue**: Buffers up to 2 direction changes to prevent input loss

### Scoring System
- Element collection: 100 points
- New discovery: 500 points
- Combo bonuses: 2x (500), 3x (1000), 4x (2500)
- Element digestion: 50 points each
- Boss defeat: 5000 points

### Element Combination System
**Data**: `elements/data/combinations.json`
- 300+ combinations defined
- Auto-combines when compatible elements in bank
- Tier progression: combine lower tiers to create higher
- Discovery tracking for first-time combinations

### Leaderboard System
**File**: `js/leaderboard.js`
- REST API: `/api/leaderboard`
- Timeframes: daily, weekly, monthly, all-time
- 30-second result caching
- Tracks: score, discoveries, play time, kills, skin

---

## Asset Management

### Asset Loading System
**File**: `js/asset-preloader.js`

**Loading Phases** (with actual phase names):
1. "Initializing Cosmos" (15%) - Setup systems
2. "Loading Elements" (20%) - Emoji rendering
3. "Loading Planets" (10%) - Background animations
4. "Loading Stations" (5%) - Space stations
5. "Crafting Combinations" (25%) - Combination data and backgrounds
6. "Preparing Skins" (15%) - Snake skin sprites
7. "Awakening Snakes" (10%) - Snake initialization

**Optimizations**:
- Lazy loading (20 emojis initially, rest on-demand)
- Pre-rendered emoji sizes: 16, 20, 24, 32px
- Mobile reduces particles and skips animations

### Audio System
- **Sound Effects**: 5 instances per effect for overlap
- **Volume**: Effects 30-75%, Music 60-70%
- **Dynamic Music**: Switches between exploration/boss themes
- **Killstreak Announcer**: Voice lines for multi-kills

---

## Game Flow & States

### Game Modes
- **Infinite Mode**: Classic survival gameplay, progressively harder
- **Cozy Mode**: Relaxed gameplay, no boundary deaths, peaceful music
- *Additional modes planned but not yet implemented*

### State Machine
```
MENU STATE
├─> Splash Screen → Game Mode Selection
├─> Game Mode Selection → PLAYING STATE

PLAYING STATE
├─> Active Gameplay
├─> Pause (ESC/P) → PAUSED STATE
├─> Death → GAME OVER STATE
└─> Boss Victory → Victory Overlay

PAUSED STATE
├─> Resume → PLAYING STATE
├─> Settings/Leaderboard tabs
└─> Main Menu → MENU STATE

GAME OVER STATE
├─> Respawn → PLAYING STATE
├─> Permadeath (after deaths) → Score submission
└─> Main Menu → MENU STATE
```

### UI Components
- **Splash Screen**: Logo, start button, social links
- **Game Canvas**: Main gameplay area
- **Pause Overlay**: Tabbed interface (game/leaderboard/settings)
- **Mobile Panels**: Slideout discovery journal, leaderboard, element bank

---

## Performance Systems

### Device Tier Detection
**File**: `js/performance/device-tier.js`
- Automatically detects device capabilities (low/medium/high)
- Adjusts game settings based on performance
- Accessible via `window.deviceTier`

### Performance Optimizations
**File**: `js/performance/unified-performance-system.js`
- **Variable Frame Rate**: Adapts to device capabilities
- **Canvas Optimization**: WebGL renderer option, batch rendering
- **Viewport Culling**: Only renders visible objects
- **Object Pooling**: Reuses entities to reduce garbage collection
- **Mobile Battery Saver**: Reduced update frequency option

### Magnetism System
**Files**: 
- `js/core/entities/MagnetismMixin.js`
- `js/utils/magnetism.js`
- Attracts collectibles to nearby snakes for easier collection

---

## Configuration & Settings

### localStorage Keys
- `playerStats` - Gameplay statistics object
- `unlockedSkins` - Array of unlocked skin IDs
- `currentSkin` - Selected skin ID
- `discoveredElements` - Set of discovered element IDs
- `discoveredCombinations` - Array of found combinations
- `highScore` - Best score achieved
- `mobileScoreboardCollapsed` - Mobile UI preference
- `infiniteSnakeRedeemedCodes` - Tracking redeemed unlock codes
- `settingsUsedMessages` - Tracking displayed messages for variety

### Game Constants
**File**: `js/core/game-original.js`
- `WORLD_WIDTH`: 4000 (line 204)
- `WORLD_HEIGHT`: 4000 (line 204)
- `MAX_ELEMENTS_PER_CELL`: 5 (grid-based spawning limit)
- `SNAKE_SPEED`: 5.95125 (line 206) - *Note: Snake.js uses 4.761*
- `BOOST_SPEED_MULTIPLIER`: 1.75 (in Snake.js)
- `TARGET_FPS`: 60 (fixed timestep)

---

## Analytics & Metrics

### GameAnalytics Integration
**File**: `js/analytics/gameAnalytics.js`
- Tracks player behavior and game events
- Key events tracked:
  - Game start/end
  - Score milestones
  - Element discoveries
  - Boss encounters
  - Death reasons
  - Session duration

### Key Performance Indicators (KPIs)
- **Engagement**: Average session length, games per session
- **Progression**: Discovery completion rate, boss defeat rate
- **Retention**: Daily active users, return rate
- **Competition**: Leaderboard participation rate

### Player Statistics
**File**: `js/playerStats.js`
- Tracks lifetime stats in localStorage
- Exportable for analysis
- Used for unlock progression

---

## Unlock & Reward Systems

### Discord Code Redemption System
**Files**: 
- `js/codeValidator.js` - Core validation logic
- `js/unlockManager.js` - Skin unlock management
- `settings.html` - User interface for code entry

**Architecture**:
1. **Code Format**: `DISCORD-2025-XXXX` (4-char alphanumeric suffix)
2. **Security**: Codes are validated using hashes, not plaintext
3. **Mapping**: Each code hash maps to a specific skin ID
4. **Storage**: Redeemed codes stored in localStorage to prevent reuse

**Current Implementation**:
- **58 unique codes** map to all 58 skins in the game
- **"Secret" variety**: Advertised as Scarabyte-only, but each code unlocks a different skin
- **Dynamic messages**: Random success/error messages for engagement

### Code-to-Skin Mapping
**File**: `js/codeValidator.js`
```javascript
this.CODE_TO_SKIN_MAP = {
    '507fbf89': 'discord-elite',    // DISCORD-2025-JMQZ - Scarabyte
    '5080068c': 'hot-head',         // DISCORD-2025-IYTM
    // ... 56 more mappings
}
```

### Message System for Code Redemption
**File**: `settings.html`

The code redemption interface features dynamic messaging with three pools:
- **Empty input messages** (10 variations)
- **Invalid code messages** (11 variations)
- **Success messages** (9 variations)

Messages cycle without repetition, stored in `settingsUsedMessages` localStorage.

### Skin Unlock System
**File**: `js/skinData.js`
- **58 total skins** across 6 rarity tiers
- **Unlock methods**: Score milestones, achievements, codes
- **Rarity distribution**:
  - Common: 15 skins
  - Uncommon: 12 skins
  - Rare: 10 skins
  - Legendary: 8 skins
  - Exotic: 9 skins
  - Secret: 4 skins

---

## Admin Tools & Code Management

### Code Generation Tools
**Location**: `/admin-tools/`

#### Basic Code Generator
**File**: `admin-tools/generate-codes.js`
- Generates Discord codes with specified count
- Creates hash values for validation
- Outputs: plain text list, JSON record, JS hash array

#### Advanced Skin-Aware Generator
**File**: `admin-tools/generate-codes-with-skins.js`
- Maps codes to specific skins
- Prevents duplicate code generation
- Tracks previously generated codes

**Commands**:
```bash
# List all available skins
node admin-tools/generate-codes-with-skins.js list-skins

# Generate codes for all skins
node admin-tools/generate-codes-with-skins.js generate-all

# Generate codes for specific skins
node admin-tools/generate-codes-with-skins.js generate-for hot-head ruby pixel
```

#### Generated Files
- **Plain codes** (`.txt`) - For Discord distribution
- **Detailed JSON** (`.json`) - Complete records with skin mappings
- **Code mapping** (`.js`) - Ready to paste into codeValidator.js
- **Admin reference** (`.md`) - Human-readable documentation

### Master Code List
**File**: `admin-tools/DISCORD_CODES_MASTER_LIST.md`
- Complete mapping of all codes to skins
- Distribution strategy documentation
- Instructions for adding new skins/codes

### Security & Anti-Cheat
- Codes validated via hash function (prevents guessing)
- One-time redemption per code
- Client-side validation with server verification planned
- Rate limiting on redemption attempts

---

## Common Modifications Guide

### Adding New Snake Skins
1. Add skin image to `/skins/` directory
2. Update skin data in `js/skinData.js`
3. Add to `SKIN_DATA` object with unlock criteria
4. Generate Discord code: `node admin-tools/generate-codes-with-skins.js generate-for [skin-id]`
5. Update `CODE_TO_SKIN_MAP` in `js/codeValidator.js`
6. Test unlock progression

### Creating New Boss Types
1. Extend Boss class in `js/core/entities/Boss.js`
2. Override `performSpecialAttack()` method
3. Add boss spawn logic to main game
4. Create boss-specific projectile behavior
5. Add victory conditions

### Modifying Game Speed
1. Edit `SNAKE_SPEED` constant in `js/core/entities/Snake.js:31`
2. Adjust `BOOST_SPEED_MULTIPLIER` for boost speed
3. Test AI snake behavior at new speeds

### Adding New Power-ups
1. Create new class in `js/core/entities/`
2. Extend base entity class
3. Implement `applyEffect()` method
4. Add spawn logic to `spawnPowerUp()` in main game
5. Define spawn interval and rarity

### Adding New Elements
1. Edit `elements/data/elements.json`
2. Add emoji, name, tier, description
3. Update `combinations.json` for recipes
4. Test spawning and combination logic

---

## Troubleshooting

### Performance Issues
1. **Check device tier**: `window.deviceTier` (low/medium/high)
2. **Monitor FPS**: `window.fpsCounter` shows current FPS
3. **Reduce particles**: Lower `particleQuality` setting
4. **Disable background animations**: Set `animatedPlanets: false`

### Collision Detection Problems
1. **Verify quadtree**: Check `window.quadtree` initialization
2. **Debug mode**: Set `window.DEBUG_COLLISIONS = true`
3. **Check hitboxes**: Snake head radius vs element radius

### Mobile Responsiveness
1. **Test touch events**: Console log touch coordinates
2. **Check viewport**: Ensure meta viewport tag is correct
3. **Debug panels**: `window.mobileUI.toggleDebug()`

---

## Performance Considerations

### Optimization Strategies
1. **Object Pooling**: Reuse entities to reduce GC
2. **Viewport Culling**: Only render visible objects
3. **Batch Rendering**: Group similar draw calls
4. **Lazy Asset Loading**: Load resources on-demand
5. **Pre-rendering**: Cache rotated sprites

### Mobile Performance
1. **Reduced World Size**: Smaller play area on mobile
2. **Simplified Effects**: Fewer particles and animations  
3. **Touch Optimization**: Debounced input handling
4. **Battery Saver**: Reduced update frequency option
5. **Progressive Enhancement**: Features scale with device

### Profiling Tools
- Built-in FPS counter
- Performance timeline in Chrome DevTools
- Custom metrics via `window.performanceMonitor`

---

## Development Workflow

### Version Management
- **Build Script**: `scripts/build-version.js`
- Updates version across multiple files
- Run: `npm run build-version`

### Testing
- **Framework**: Playwright
- **Test Files**: `/tests/` directory
- **Run Tests**: `npm test`

### Deployment
- **Platform**: Vercel
- **Config**: `vercel.json`
- **API Routes**: `/api/` directory
- **Auto-deploy**: On push to main branch

### Debug Tools
- **Debug Config**: `window.DebugConfig`
- **Console Commands**: Various debug utilities
- **Performance Monitor**: `window.performanceMonitor`
- **FPS Counter**: `window.fpsCounter`

---

## Future Considerations

### Planned Features
- Additional game modes
- Social features integration
- Tournament system
- Daily challenges
- Cosmetic shop system

### Technical Debt
- Refactor monolithic `game-original.js` (14,000+ lines)
- Standardize speed constants across files
- Re-enable Alchemy Vision power-up
- Improve mobile UI responsiveness

### Monetization Opportunities
- **Cosmetics**: Premium skins and effects
- **Battle Pass**: Seasonal progression
- **Power-ups**: Consumable boosters
- **Ad Integration**: Rewarded video slots
- **Premium Currency**: For cosmetics

### Growth Features
- **Social Sharing**: Score and discovery sharing
- **Referral System**: Invite rewards
- **Seasonal Events**: Limited-time content
- **Achievements**: Xbox/Steam integration ready

---

## Additional Resources

### Admin Tools
- **Location**: `/admin/` directory
- Element management
- Combination editor
- Analytics dashboard
- Player moderation

### Progressive Web App
- **Manifest**: `manifest.json`
- Installable on mobile devices
- Offline capability potential
- App store distribution ready

### Security Considerations
- Leaderboard anti-cheat measures
- Score validation
- Rate limiting on API
- Content moderation for usernames

---

*Document Version: 1.2.0*  
*Last Updated: July 30, 2025*  