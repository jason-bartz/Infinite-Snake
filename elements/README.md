# Infinite Snake Element System

## Active Files (DO NOT DELETE)

### Core System Files
- `game-loader.js` - Loads elements and combinations from JSON files
- `element-loader.js` - Bridge between new system and game
- `compatibility-layer.js` - Maintains backward compatibility
- `dynamic-prefix-system.js` - Runtime prefix variants (Flaming X, Cosmic Y, etc.)
- `integrate.js` - Orchestrates system initialization

### Data Files
- `elements-complete.json` - Complete element database (15,783 elements)
- `combinations-logical-complete.json` - Logical combinations (20,483 recipes)
  - Fire + Water = Steam (not Rain!)
  - Proper evolution chains (bacteria → algae → plants → trees)
  - Technology progression (stone → tools → machines → factories)
  - Advanced concepts only at high tiers
- `manifest-complete.json` - Database metadata

### Core Directory
Contains tier-specific element and emoji data:
- `elements-*-repaired.json` - Elements by tier range
- `emojis-*.json` - Emoji mappings for each tier

## How It Works

1. Game loads scripts in order (see index.html)
2. `integrate.js` coordinates initialization
3. `game-loader.js` loads JSON data
4. `element-loader.js` provides game interface
5. `compatibility-layer.js` maintains legacy format
6. `dynamic-prefix-system.js` creates runtime variants

## Archive Directory

The `archive-old-system` directory contains the previous element system for reference only.

## Stats
- **Total Elements**: 15,783
- **Total Combinations**: 44,325
- **Dynamic Variants**: Unlimited (via prefix system)
- **Memory Usage**: <2MB