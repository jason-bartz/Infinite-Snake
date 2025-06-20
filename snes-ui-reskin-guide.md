# Super Nintendo Era UI Reskin Guide

## Core Design Principles

### 1. **Color Palette**
Replace modern gradients with limited 16-bit color palettes:
- **Primary Blue**: #0088FC → #2038EC (deeper, more saturated)
- **Gold/Yellow**: #FFD700 → #F8D800 (classic SNES yellow)
- **Red**: #FF6B6B → #F83800 (vibrant SNES red)
- **Green**: #4CAF50 → #00E800 (bright SNES green)
- **Purple**: #8A2BE2 → #7828F8 (classic purple)
- **Background**: Replace transparency with solid colors + dithering

### 2. **Typography**
Replace modern fonts with pixel fonts:
```css
/* Add pixel font imports */
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

/* For larger text */
font-family: 'Press Start 2P', monospace;
font-size: 8px; /* Use multiples of 8 */

/* Enable crisp pixel rendering */
image-rendering: pixelated;
image-rendering: -moz-crisp-edges;
image-rendering: crisp-edges;
-webkit-font-smoothing: none;
```

### 3. **Borders & Frames**
Replace rounded corners with classic SNES-style frames:
```css
/* Instead of: */
border-radius: 10px;
border: 2px solid #444;

/* Use: */
border-radius: 0;
border: 4px solid #F8F8F8;
box-shadow: 
    /* White highlight */
    inset 2px 2px 0 #F8F8F8,
    /* Dark shadow */
    inset -2px -2px 0 #000000,
    /* Outer shadow */
    4px 4px 0 rgba(0,0,0,0.5);
```

## Specific UI Element Redesigns

### Title Screen
```css
/* Logo/Title */
#splashScreen h1 {
    /* Remove gradient text */
    background: none;
    -webkit-background-clip: none;
    -webkit-text-fill-color: #F8D800;
    text-shadow: 
        2px 2px 0 #F83800,  /* Red shadow */
        4px 4px 0 #000000;  /* Black outline */
    letter-spacing: 2px;
}

/* Start Button */
#startButton {
    background: #2038EC;
    border: 4px solid #F8F8F8;
    border-radius: 0;
    box-shadow: 
        inset 2px 2px 0 #5878F8,    /* Light blue highlight */
        inset -2px -2px 0 #000080,   /* Dark blue shadow */
        4px 4px 0 rgba(0,0,0,0.5);
    text-transform: uppercase;
    font-family: 'Press Start 2P';
    font-size: 12px;
    color: #F8F8F8;
}

#startButton:hover {
    background: #5878F8;
    transform: translate(2px, 2px);
    box-shadow: 
        inset 2px 2px 0 #7898F8,
        inset -2px -2px 0 #000080,
        2px 2px 0 rgba(0,0,0,0.5);
}
```

### Game Mode Selection Menu
```css
#gameModeContent {
    background: #000080; /* Solid blue */
    border: 8px solid;
    border-color: #F8F8F8 #000000 #000000 #F8F8F8; /* 3D effect */
    border-radius: 0;
    
    /* Add decorative corners */
    position: relative;
}

/* Add corner decorations */
#gameModeContent::before,
#gameModeContent::after {
    content: '◆';
    position: absolute;
    color: #F8D800;
    font-size: 16px;
}

/* Mode buttons */
.btn-discovery {
    background: #00A800 !important; /* Solid green */
    border: 4px solid !important;
    border-color: #00E800 #005800 #005800 #00E800 !important;
    box-shadow: none !important;
}

.btn-points {
    background: #F83800 !important; /* Solid red */
    border: 4px solid !important;
    border-color: #F86830 #A80000 #A80000 #F86830 !important;
}

.btn-infinite {
    background: #7828F8 !important; /* Solid purple */
    border: 4px solid !important;
    border-color: #A858F8 #4800A8 #4800A8 #A858F8 !important;
}
```

### In-Game UI Elements

#### Element Bank / Discovery Feed
```css
.discovery-panel {
    background: #181850; /* Dark blue */
    border: 4px solid;
    border-color: #F8F8F8 #000000 #000000 #F8F8F8;
    border-radius: 0;
    
    /* Remove gradient */
    background-image: none;
}

.discovery-item {
    background: #000080;
    border: 2px solid;
    border-color: #5878F8 #000000 #000000 #5878F8;
    border-radius: 0;
    
    /* Add pixel-perfect hover state */
    image-rendering: pixelated;
}

.discovery-item:hover {
    background: #2038EC;
    transform: none;
    box-shadow: none;
}
```

#### Leaderboard Box
```css
.leaderboard-box {
    background: #000000;
    border: 4px solid;
    border-color: #F8F8F8 #505050 #505050 #F8F8F8;
    
    /* Add header style */
}

.leaderboard-header {
    background: #2038EC;
    color: #F8F8F8;
    text-transform: uppercase;
    font-size: 10px;
    padding: 4px;
    text-align: center;
    border-bottom: 2px solid #000000;
}

/* Leaderboard entries */
.leaderboard-entry {
    background: #181850;
    border-bottom: 2px solid #000000;
    font-size: 8px;
}

/* Rank colors */
.rank-1 { color: #F8D800; } /* Gold */
.rank-2 { color: #C0C0C0; } /* Silver */
.rank-3 { color: #CD7F32; } /* Bronze */
```

#### Player Stats Box
```css
.player-info-box {
    background: #000080;
    border: 4px solid;
    border-color: #5878F8 #000000 #000000 #5878F8;
    
    /* Stats display */
    font-family: 'Press Start 2P';
    font-size: 8px;
}

.stat-label {
    color: #F8F8F8;
    text-transform: uppercase;
}

.stat-value {
    color: #F8D800;
    text-shadow: 1px 1px 0 #000000;
}
```

### Pause Menu
```css
#pauseMenu {
    background: #181850;
    border: 8px solid;
    border-color: #F8F8F8 #000000 #000000 #F8F8F8;
    
    /* Add decorative frame */
    outline: 2px solid #F8D800;
    outline-offset: -12px;
}

/* Tab buttons */
.tab-button {
    background: #2038EC;
    border: 2px solid;
    border-color: #5878F8 #000080 #000080 #5878F8;
    border-radius: 0;
    font-size: 10px;
    text-transform: uppercase;
}

.tab-button.active {
    background: #F8D800;
    color: #000000;
    border-color: #F8F8F8 #A88800 #A88800 #F8F8F8;
}
```

### Victory/Death Screens
```css
/* Victory popup */
#victoryPopup {
    background: #000080;
    border: 8px solid;
    border-color: #F8D800 #805800 #805800 #F8D800;
    animation: flash 0.5s ease-in-out infinite alternate;
}

@keyframes flash {
    0% { outline: 4px solid #F8D800; }
    100% { outline: 4px solid #F8F8F8; }
}

/* Death screen */
#deathScreen {
    background: #580000;
    border: 8px solid;
    border-color: #F83800 #800000 #800000 #F83800;
}
```

### Pop-up Messages & Notifications
```css
/* Discovery notification */
.discovery-notification {
    background: #F8D800;
    color: #000000;
    border: 4px solid;
    border-color: #F8F8F8 #A88800 #A88800 #F8F8F8;
    border-radius: 0;
    font-family: 'Press Start 2P';
    font-size: 10px;
    text-transform: uppercase;
    animation: blink 0.2s ease-in-out 3;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
```

## Optional Enhancements

### 1. **Scanline Effect**
Add subtle CRT scanlines:
```css
body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 0, 0, 0.1) 2px,
        rgba(0, 0, 0, 0.1) 4px
    );
    pointer-events: none;
    z-index: 9999;
}
```

### 2. **Dithering Patterns**
For backgrounds that need texture:
```css
.dithered-bg {
    background-image: 
        repeating-linear-gradient(
            45deg,
            #000080,
            #000080 1px,
            #181850 1px,
            #181850 2px
        );
}
```

### 3. **Sound Effect UI Feedback**
Add visual feedback that mimics SNES button presses:
```css
button:active {
    transform: translate(2px, 2px);
    box-shadow: none !important;
}
```

## Implementation Notes

1. **Remove all gradients** - Replace with solid colors
2. **Remove all border-radius** - Use sharp corners
3. **Replace RGBA colors** - Use solid colors only
4. **Add pixel-perfect borders** - Use the 3D border effect
5. **Use consistent pixel grid** - All measurements in multiples of 2 or 4
6. **Add decorative elements** - Stars, diamonds, or other 16-bit motifs
7. **Limit animations** - Use simple, stepped animations only

## Color Reference Chart

| Element | Current | SNES Style |
|---------|---------|------------|
| Primary Blue | #4B79A1 | #2038EC |
| Secondary Blue | #283E51 | #000080 |
| Gold/Yellow | #FFD700 | #F8D800 |
| Green | #4CAF50 | #00E800 |
| Red | #FF6B6B | #F83800 |
| Purple | #8A2BE2 | #7828F8 |
| Dark BG | rgba(0,0,0,0.9) | #000000 |
| Light Text | #FFFFFF | #F8F8F8 |
| Gray Text | #AAA | #A8A8A8 |