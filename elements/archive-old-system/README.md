# Element System v2.0

A scalable, modular element system for Infinite Snake with numeric IDs and optimized lookups.

## Structure

```
elements/
├── manifest.json              # Main registry of all element packs
├── elements-core.json         # Core elements with numeric IDs
├── combinations-core.json     # Core element combinations
├── element-dependencies.json  # Dependency graph for elements
├── element-loader.js         # Module for loading elements
├── compatibility-layer.js    # Backward compatibility with old system
├── integrate.js             # Integration script
└── README.md               # This file
```

## Features

- **Numeric IDs**: Fast integer-based lookups instead of string keys
- **Modular Packs**: Elements organized into loadable packs
- **Dependency Tracking**: Understand element relationships
- **Categories**: Elements grouped by type (classical, material, weather, etc.)
- **Backward Compatible**: Works with existing game code

## Integration

### Quick Integration

Add these scripts to your HTML file before the game scripts:

```html
<!-- New Element System -->
<script src="elements/element-loader.js"></script>
<script src="elements/compatibility-layer.js"></script>
<script src="elements/integrate.js"></script>
```

### Manual Integration

```javascript
// Initialize the element system
const loader = new ElementLoader();
await loader.init();

// Get element by ID (fast)
const fire = loader.getElementById(1);

// Get element by key (backward compatibility)
const water = loader.getElementByKey('water');

// Check combination
const result = loader.getCombination(1, 2); // fire + water
```

## Data Format

### Element Structure
```json
{
  "1": {
    "id": 1,
    "key": "fire",
    "emoji": "🔥",
    "name": "Fire",
    "tier": 0,
    "discovered": true,
    "base": true,
    "category": "classical"
  }
}
```

### Combination Structure
```json
{
  "elements": [1, 2],
  "result": 5,
  "description": "fire + water = steam"
}
```

## Adding New Elements

1. Add element to `elements-core.json` with unique ID
2. Add combinations to `combinations-core.json`
3. Update `element-dependencies.json`
4. Update manifest metadata

## Performance

- Numeric IDs: ~10x faster lookups
- Indexed combinations: O(1) lookup time
- Lazy loading support for large element sets
- Optimized memory usage with shared references

## Migration from v1

The compatibility layer automatically handles:
- Legacy string-based lookups
- Old combination format ("fire+water")
- Existing save data
- Game function hooks
