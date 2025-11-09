# Developer Guide - Infinite Snake

Welcome to the Infinite Snake development team! This guide will help you get up and running quickly.

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Modern browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd infinite-snake

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Start development server
npm run dev
```

The game will open at `http://localhost:3000`

---

## Project Structure

```
infinite-snake/
├── src/                    # New modular source code
│   └── main.js            # Application entry point
│
├── js/                     # Legacy code (being refactored)
│   ├── core/
│   │   ├── game-original.js  # 15K line monolith (target for removal)
│   │   └── entities/         # Entity classes
│   ├── performance/
│   ├── mobile/
│   └── ...utilities
│
├── config/                 # Configuration
│   └── feature-flags.js   # Feature toggle system
│
├── tests/                  # Test suites
│   ├── e2e/               # Playwright E2E tests
│   ├── unit/              # Vitest unit tests
│   └── integration/       # Integration tests
│
├── elements/               # Game data
│   └── data/
│       ├── elements.json      # 69K lines of element definitions
│       ├── combinations.json  # Crafting recipes
│       └── emojis.json       # Emoji mappings
│
├── assets/                 # Static assets
├── docs/                   # Documentation
└── index.html             # Entry HTML

```

---

## Development Workflow

### 1. Daily Development

```bash
# Start dev server with hot reload
npm run dev

# Run tests in watch mode
npm test

# Lint your code
npm run lint:fix

# Format code
npm run format
```

### 2. Testing

```bash
# Unit tests (Vitest)
npm test                    # Run all unit tests
npm run test:ui             # Run with UI dashboard

# E2E tests (Playwright)
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Run with Playwright UI
npm run test:e2e:debug      # Debug mode
npm run test:report         # View last test report
```

### 3. Building

```bash
# Development build
npm run build

# Preview production build
npm run preview
```

---

## Feature Flags

We use feature flags to gradually roll out new architecture without breaking existing functionality.

### Usage in Code

```javascript
import { featureFlags } from './config/feature-flags.js';

// Check if feature is enabled
if (featureFlags.isEnabled('useNewRenderingSystem')) {
  newRenderingSystem.render();
} else {
  oldRenderFunction();
}
```

### Toggle via Console

```javascript
// Enable a feature
window.featureFlags.enable('useECS');

// Disable a feature
window.featureFlags.disable('useECS');

// View all flags
window.featureFlags.getAll();

// Reset all flags
window.featureFlags.reset();
```

### Toggle via URL

```
# Enable specific flags
http://localhost:3000?flags=useECS,useNewGameLoop

# Enable debug mode
http://localhost:3000?debug=true

# Enable individual flag
http://localhost:3000?useECS=true
```

---

## Architecture Patterns

### Entity-Component-System (ECS)

We're migrating to an ECS architecture for better modularity and performance.

```javascript
// Creating an entity
import { createSnake } from './src/entities/createSnake.js';

const playerSnake = createSnake(100, 100, 'default-skin');

// Components are data containers
class Transform extends Component {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
}

// Systems contain logic
class MovementSystem extends System {
  update(entities, deltaTime) {
    for (const entity of entities) {
      const transform = entity.getComponent(Transform);
      const velocity = entity.getComponent(Velocity);

      transform.x += velocity.x * deltaTime;
      transform.y += velocity.y * deltaTime;
    }
  }
}
```

### State Management

Centralized state management using Redux-like pattern (coming in Phase 2).

```javascript
// Dispatch actions
store.dispatch({ type: 'GAME_START', mode: 'infinite' });

// Subscribe to changes
store.subscribe((state) => {
  console.log('State updated:', state);
});

// Select state
const score = selectScore(store.getState());
```

---

## Code Style

We use ESLint and Prettier for consistent code style.

### Key Rules
- Use single quotes for strings
- 2-space indentation
- Semicolons required
- Max line length: 120 characters
- Prefer `const` over `let`, never use `var`
- Use `===` instead of `==`

### Running Linters

```bash
# Check for issues
npm run lint
npm run format:check

# Auto-fix issues
npm run lint:fix
npm run format
```

---

## Testing Guidelines

### Unit Tests (Vitest)

```javascript
import { describe, it, expect } from 'vitest';
import { calculateDistance } from './utils/math.js';

describe('Math utilities', () => {
  it('should calculate distance between two points', () => {
    const result = calculateDistance(0, 0, 3, 4);
    expect(result).toBe(5);
  });
});
```

### E2E Tests (Playwright)

```javascript
import { test, expect } from '@playwright/test';

test('should start game in infinite mode', async ({ page }) => {
  await page.goto('/');

  const infiniteButton = page.locator('text=/infinite/i');
  await infiniteButton.click();

  // Game should start
  await expect(page.locator('#gameCanvas')).toBeVisible();
});
```

### Coverage Goals
- Unit tests: 90%+ coverage
- Integration tests: Critical paths covered
- E2E tests: All user flows tested

---

## Common Tasks

### Adding a New Feature

1. Create feature flag
```javascript
// In config/feature-flags.js
flags: {
  useMyNewFeature: false,
}
```

2. Create feature branch
```bash
git checkout -b feature/my-new-feature
```

3. Write tests first (TDD)
```javascript
// tests/unit/my-feature.test.js
describe('My New Feature', () => {
  it('should do something', () => {
    // Write test
  });
});
```

4. Implement feature behind flag
```javascript
if (featureFlags.isEnabled('useMyNewFeature')) {
  // New implementation
} else {
  // Fallback to old implementation
}
```

5. Test thoroughly
```bash
npm test
npm run test:e2e
```

6. Submit for review
```bash
git push origin feature/my-new-feature
# Create pull request
```

### Debugging

#### Browser DevTools
- Chrome DevTools for debugging
- Use `debugger;` statements
- Enable source maps in Vite

#### Feature Flag Debugging
```javascript
// Enable verbose logging
window.featureFlags.enable('enableVerboseLogging');

// Enable performance monitoring
window.featureFlags.enable('enablePerformanceMonitoring');
```

#### Performance Profiling
```javascript
// In code
performance.mark('start-expensive-operation');
expensiveOperation();
performance.mark('end-expensive-operation');
performance.measure('expensive-operation', 'start-expensive-operation', 'end-expensive-operation');

// View in console
console.table(performance.getEntriesByType('measure'));
```

---

## Refactoring Guidelines

We're in an active refactoring process. Follow these guidelines:

### DO
✅ Write tests before refactoring
✅ Use feature flags for new code
✅ Keep old code working until replacement is tested
✅ Update documentation as you go
✅ Run E2E tests before and after changes
✅ Keep commits small and focused

### DON'T
❌ Delete old code without replacement
❌ Skip writing tests
❌ Merge without code review
❌ Break existing functionality
❌ Introduce new global variables
❌ Skip performance testing

### Refactoring Checklist
- [ ] Tests written for new code
- [ ] Feature flag added
- [ ] Old code still works
- [ ] New code behind flag
- [ ] E2E tests passing
- [ ] Performance benchmarks acceptable
- [ ] Documentation updated
- [ ] Code reviewed

---

## Performance Guidelines

### Target Metrics
- 60 FPS on mid-range mobile devices
- <2s load time on 4G connection
- <100MB memory usage
- Lighthouse score 90+

### Best Practices
- Use object pooling for frequently created objects
- Avoid memory leaks (remove event listeners)
- Minimize DOM manipulations
- Use requestAnimationFrame for animations
- Lazy load non-critical assets
- Optimize images (WebP, compression)

### Profiling
```bash
# Build with profiling
npm run build

# Use Lighthouse
lighthouse http://localhost:3000 --view

# Use Chrome DevTools Performance tab
# Record → Interact → Stop → Analyze
```

---

## Troubleshooting

### Vite server won't start
```bash
# Clear cache
rm -rf node_modules/.vite
npm run dev
```

### Tests failing
```bash
# Clear Playwright cache
npx playwright install --force

# Clear Vitest cache
npx vitest --clearCache
```

### Build errors
```bash
# Clean build
rm -rf dist
npm run build
```

### Linting errors
```bash
# Auto-fix most issues
npm run lint:fix
npm run format
```

---

## Resources

- [Refactoring Progress](../REFACTORING_PROGRESS.md) - Track refactoring phases
- [Refactoring Plan](./REFACTORING_PLAN.md) - Detailed refactoring roadmap
- [Architecture Analysis](./ARCHITECTURE_ANALYSIS.md) - Codebase analysis
- [Vite Documentation](https://vitejs.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)

---

## Getting Help

- Check documentation in `/docs`
- Review code comments and JSDoc
- Ask in team chat
- Create an issue for bugs

---

## Contributing

1. Follow the code style guide
2. Write tests for all new code
3. Keep commits atomic and descriptive
4. Submit pull requests for review
5. Update documentation

---

**Welcome aboard! Let's build something amazing! 🚀**
