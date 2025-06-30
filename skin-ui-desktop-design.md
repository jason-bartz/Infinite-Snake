# Desktop Skin Selection UI Design Document

## Overview
This document outlines the new desktop UI design for the Infinite Snake skin selection system, featuring rarity tiers, modal previews, and optimized desktop interactions.

## Design Requirements
- 48 total skins organized by rarity tiers
- Modal system for skin preview and selection
- Boss skins hidden as question marks until unlocked
- Desktop-optimized with hover states and keyboard navigation
- Maintain SNES-inspired retro aesthetic

## Main Skin Selection Screen

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                        SNAKE SKINS                          │
│                                                             │
│  [Common]  [Uncommon]  [Rare]  [Legendary]  [Exotic]  [Secret] │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │                                                      │    │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │    │
│  │  │  │ │  │ │  │ │  │ │  │ │  │ │  │ │  │        │    │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘        │    │
│  │                                                      │    │
│  │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐        │    │
│  │  │  │ │  │ │  │ │  │ │  │ │  │ │  │ │  │        │    │
│  │  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘        │    │
│  │                                                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  Progress: 12/48 Skins Unlocked                           │
└─────────────────────────────────────────────────────────────┘
```

### Rarity Tier System

#### Visual Design
- **Tab Navigation**: Horizontal tabs for each rarity tier
- **Active Tab**: Gold background with depressed button effect
- **Tab Icons**: Small icon next to each tier name

#### Rarity Colors & Icons
1. **Common** (Gray) - No special effects
2. **Uncommon** (Green) - Subtle green border glow
3. **Rare** (Blue) - Blue border with slight pulse animation
4. **Legendary** (Purple) - Purple border with particle effects
5. **Exotic** (Orange) - Orange/gold border with shimmer effect
6. **Secret** (Red) - Red border with mysterious aura effect

### Grid Layout
- **Desktop Grid**: 8 columns × 3 rows (24 skins visible per tier)
- **Skin Tile Size**: 90px × 90px with 12px gaps
- **Scrollable**: Vertical scroll for tiers with more skins
- **Total Width**: ~800px (fits within 900px pause menu)

### Skin Tile Design
```
┌─────────────┐
│   [IMAGE]   │  <- 60x60px skin preview
│             │
│ Skin Name   │  <- 10px font
└─────────────┘
```

#### Tile States
1. **Unlocked**: Full opacity, colored border based on rarity
2. **Locked**: 50% opacity, gray border, lock icon overlay
3. **Boss/Secret Locked**: Question mark instead of image
4. **Equipped**: Gold outline + "EQUIPPED" badge
5. **Hover**: Scale 1.1x, brighten, show tooltip

### Mouse Interactions
- **Hover Effect**: 
  - Scale to 110%
  - Brightness increase
  - Border glow intensifies
  - Tooltip shows skin name
- **Click**: Opens modal preview
- **Right-click**: Quick equip (if unlocked)

## Skin Preview Modal

### Modal Layout
```
┌──────────────────────────────────────────────────────┐
│                    [X]                               │
│                                                      │
│          ┌────────────────────┐                     │
│          │                    │                     │
│          │   [SKIN PREVIEW]   │  <- Animated       │
│          │                    │     360° rotation  │
│          │                    │                     │
│          └────────────────────┘                     │
│                                                      │
│              LEGENDARY SKIN                          │
│            "Nyan Pastry Cat"                        │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │ A mystical feline that leaves a rainbow  │      │
│  │ trail in its wake. Legend says it was    │      │
│  │ baked in the ovens of the internet gods. │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│         [  EQUIP  ]    [  CLOSE  ]                 │
│                                                      │
│  Unlock: Complete 50 element discoveries            │
└──────────────────────────────────────────────────────┘
```

### Modal Components
1. **Preview Window** (300x300px)
   - Animated snake preview rotating 360°
   - Shows actual skin colors and pattern
   - Particle effects for higher rarities

2. **Skin Information**
   - Rarity tier with colored text
   - Skin name in large font (16px)
   - Bio/lore text (12px, max 3 lines)

3. **Action Buttons**
   - **EQUIP**: Green button (if unlocked)
   - **LOCKED**: Gray disabled button (if locked)
   - **CLOSE**: Standard button

4. **Unlock Criteria**
   - Shows requirement if locked
   - Progress bar if applicable
   - Examples: "Defeat Pyraxis", "Score 50,000 points"

### Modal Animations
- **Open**: Zoom in from clicked tile (0.3s)
- **Close**: Zoom out back to tile (0.2s)
- **Snake Preview**: Continuous rotation
- **Particle Effects**: Based on rarity tier

## Keyboard Navigation

### Controls
- **Tab**: Cycle through rarity tiers
- **Arrow Keys**: Navigate skin grid
- **Enter/Space**: Open preview modal
- **E**: Quick equip (if unlocked)
- **Escape**: Close modal/pause menu
- **1-6**: Jump to rarity tier

### Focus Indicators
- Thick white outline on focused skin
- Tab highlights with underline
- Modal buttons show focus state

## Visual Effects & Polish

### Rarity-Specific Effects
1. **Common**: Simple border, no effects
2. **Uncommon**: Subtle green glow
3. **Rare**: Blue pulse animation (2s cycle)
4. **Legendary**: Purple particles floating up
5. **Exotic**: Orange shimmer sweep effect
6. **Secret**: Red aura with smoke particles

### Unlock Animations
- Flash of light when skin unlocked
- Particles burst from tile
- "NEW!" badge appears temporarily
- Smooth transition from locked to unlocked state

### Performance Optimizations
- Lazy load skin images as tabs are viewed
- Use CSS transforms for hover effects
- Debounce hover tooltips
- Cache modal content after first view

## CSS Styling Updates

### New Classes
```css
/* Rarity Tabs */
.rarity-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    justify-content: center;
}

.rarity-tab {
    padding: 12px 24px;
    font-size: 12px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
}

.rarity-tab.active {
    transform: translateY(2px);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}

/* Rarity Colors */
.rarity-common { border-color: #808080; }
.rarity-uncommon { border-color: #2ecc71; }
.rarity-rare { border-color: #3498db; }
.rarity-legendary { border-color: #9b59b6; }
.rarity-exotic { border-color: #ff8c00; }
.rarity-secret { border-color: #e74c3c; }

/* Enhanced Skin Grid */
.skin-grid-desktop {
    display: grid;
    grid-template-columns: repeat(8, 90px);
    gap: 12px;
    padding: 20px;
    max-height: 320px;
    overflow-y: auto;
}

/* Skin Tile Enhancements */
.skin-tile {
    width: 90px;
    height: 90px;
    position: relative;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 3px solid;
    border-radius: 8px;
    background: rgba(0,0,0,0.3);
}

.skin-tile:hover {
    transform: scale(1.1);
    z-index: 10;
    filter: brightness(1.2);
}

.skin-tile.equipped::after {
    content: 'EQUIPPED';
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 8px;
    color: #FFD700;
    background: rgba(0,0,0,0.8);
    padding: 2px 6px;
    border-radius: 4px;
}

/* Modal Styles */
.skin-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    background: #181850;
    border: 8px solid;
    border-color: #FFF #000 #000 #FFF;
    padding: 32px;
    z-index: 1000;
    animation: modalZoomIn 0.3s ease;
}

@keyframes modalZoomIn {
    from {
        transform: translate(-50%, -50%) scale(0.8);
        opacity: 0;
    }
    to {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
}

/* Preview Animation */
.skin-preview-3d {
    width: 300px;
    height: 300px;
    margin: 0 auto 20px;
    position: relative;
    animation: rotate360 4s linear infinite;
}

@keyframes rotate360 {
    from { transform: rotateY(0deg); }
    to { transform: rotateY(360deg); }
}

/* Particle Effects */
.particle-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: hidden;
}

.particle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    animation: floatUp 3s ease-out infinite;
}

@keyframes floatUp {
    from {
        transform: translateY(100%) scale(0);
        opacity: 1;
    }
    to {
        transform: translateY(-20px) scale(1);
        opacity: 0;
    }
}
```

## Implementation Notes

### Data Structure Update
```javascript
const skinRarityTiers = {
    common: ['snake-default-green', 'coffee', 'dog', 'potato', 'clock'],
    uncommon: ['neko', 'controller', 'football', 'fries', 'handheld-game'],
    rare: ['35mm', 'Frank', 'af-one', 'barbi', 'boat-mcboatface'],
    legendary: ['nyan', 'unicorn', 'infinity-glove', 'green-dragon', 'red-dragon'],
    exotic: ['lovecraft', 'saturn', 'tornado', 'space-cadet', 'flame'],
    secret: ['pyraxis', 'abyssos', 'osseus', 'zephyrus', 'santa', 'robot']
};

const skinUnlockCriteria = {
    'coffee': 'Play 10 games',
    'nyan': 'Complete 50 element discoveries',
    'pyraxis': 'Defeat Pyraxis boss',
    'unicorn': 'Score 100,000 points in one game',
    // ... etc
};
```

### Modal Handler
```javascript
function openSkinModal(skinId) {
    const modal = createSkinModal(skinId);
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeSkinModal();
        }
    };
    document.addEventListener('keydown', handleEscape);
}
```

### Performance Considerations
1. Use CSS transforms instead of position changes
2. Implement virtual scrolling for large skin lists
3. Lazy load skin images when tab is first viewed
4. Cache rendered modal content
5. Use requestAnimationFrame for smooth animations

## Accessibility
- All interactive elements keyboard accessible
- ARIA labels for skin tiles
- Screen reader descriptions for locked skins
- High contrast mode support
- Focus trapping in modal

## Responsive Breakpoints
- **Large Desktop (>1400px)**: 10 columns
- **Standard Desktop (1024-1400px)**: 8 columns
- **Small Desktop (800-1024px)**: 6 columns
- **Tablet/Mobile**: Switch to mobile layout