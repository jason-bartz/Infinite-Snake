// Script to create a clean, modernized index.html
const fs = require('fs');

console.log('Creating clean, modernized index.html...');

// Read the original file
const original = fs.readFileSync('index.html', 'utf8');
const lines = original.split('\n');

console.log(`Original file has ${lines.length} lines`);

// Find key sections
let cssStart = -1;
let cssEnd = -1;
let htmlStart = -1;
let htmlEnd = -1;
let scriptStart = -1;

// Find where main CSS starts (in <style> tag)
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('<style>') && cssStart === -1) {
        cssStart = i;
    }
    if (lines[i].includes('</style>') && cssStart !== -1 && cssEnd === -1) {
        cssEnd = i;
    }
    if (lines[i].includes('<canvas id="gameCanvas">')) {
        htmlStart = i;
    }
    if (lines[i].trim() === '<script>' && i > 3000 && i < 5000) {
        htmlEnd = i - 1;
        scriptStart = i;
        break;
    }
}

console.log(`CSS: lines ${cssStart}-${cssEnd}`);
console.log(`HTML body: lines ${htmlStart}-${htmlEnd}`);
console.log(`Script starts at line ${scriptStart}`);

// Build the clean HTML
let cleanHTML = `<!DOCTYPE html>
<html lang="en-us">
<head>
    <title>Infinite Snake - Craft the Cosmos | Free Element Crafting Snake Game</title>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" id="Viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Infinite Snake combines classic snake gameplay with element crafting. Discover endless combinations, unlock unique skins, and craft the cosmos in this free browser game!" />
    <meta property="og:description" content="Infinite Snake combines classic snake gameplay with element crafting. Discover endless combinations, unlock unique skins, and craft the cosmos in this free browser game!" />
    <meta name="keywords" content="infinite snake, snake game, element crafting, craft game, single player snake, browser game, free game, online snake, element combinations, discovery game, alchemy game, snake.io, slither.io, google snake, infinite craft snake, crafting game" />
    
    <meta property="og:type" content="website" />
    <meta property="og:title" content="Infinite Snake - Craft the Cosmos" />
    <meta property="og:site_name" content="Infinite Snake" />
    <meta property="og:image" content="https://infinitesnake.io/assets/snake-logo.png" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="A snake game where you craft elements and rebuild the cosmos" />
    <meta property="og:locale" content="en_US" />
    
    <meta name="twitter:title" content="Infinite Snake - Craft the Cosmos" />
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:description" content="Combine elements, grow your snake, and discover endless combinations in this unique twist on the classic snake game. Free to play in your browser and mobile!">
    <meta name="twitter:image" content="https://infinitesnake.io/assets/snake-logo.png">
    
    <meta name='robots' content='index,follow' />
    <meta name="twitter:url" content="https://infinitesnake.io" />
    <meta property="og:url" content="https://infinitesnake.io" />
    <meta name="url" content="https://infinitesnake.io" />
    <link rel="canonical" href="https://infinitesnake.io">
    
    <!-- Favicons -->
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
`;

// Add structured data
cleanHTML += '\n    <!-- Schema.org structured data -->\n';
// Copy lines 40-100 (structured data)
for (let i = 39; i < 100 && i < lines.length; i++) {
    cleanHTML += lines[i] + '\n';
}

// Add CSS
cleanHTML += '\n';
if (cssStart !== -1 && cssEnd !== -1) {
    for (let i = cssStart; i <= cssEnd; i++) {
        cleanHTML += lines[i] + '\n';
    }
}

cleanHTML += `</head>
<body>
`;

// Add HTML body content
if (htmlStart !== -1 && htmlEnd !== -1) {
    for (let i = htmlStart; i <= htmlEnd; i++) {
        cleanHTML += lines[i] + '\n';
    }
}

// Add script tags
cleanHTML += `
    <!-- External Dependencies -->
    <script src="elements/data/loader.js"></script>
    <script src="js/asset-preloader.js"></script>
    
    <!-- Skin System -->
    <script src="js/skinData.js"></script>
    <script src="js/skinIdMapping.js"></script>
    <script src="js/playerStats.js"></script>
    <script src="js/unlockManager.js"></script>
    <script src="js/nameGenerator.js"></script>
    
    <!-- Rendering Systems (keep these) -->
    <script src="js/webgl-renderer.js"></script>
    <script src="js/quadtree.js"></script>
    <script src="js/texture-atlas.js"></script>
    <script src="js/gpu-particle-system.js"></script>
    <script src="js/mobile-star-renderer.js"></script>
    <script src="js/mobile-background-optimizer.js"></script>
    
    <!-- Modernized Systems -->
    <script src="js/performance/debug-config.js"></script>
    <script src="js/core/module-loader.js"></script>
    <script src="js/core/init-sequence.js" type="module"></script>
    
    <!-- Main Game Code -->
    <script src="js/core/game-original.js"></script>
    
    <!-- Integration -->
    <script>
        // Wait for modules to load
        window.addEventListener('gameReady', function(e) {
            console.log('Modernized systems ready');
        });
        
        // Optional: Configure systems
        window.MOBILE_UI_CONFIG = {
            mode: 'fixed' // or 'slideout'
        };
        
        // Optional: Enable debug in development
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            window.DEBUG_CONFIG = window.DEBUG_CONFIG || {};
            window.DEBUG_CONFIG.enabled = true;
        }
    </script>
</body>
</html>`;

// Write the clean file
fs.writeFileSync('index-clean.html', cleanHTML);

// Count the lines
const cleanLines = cleanHTML.split('\n').length;
console.log(`\nCreated index-clean.html with ${cleanLines} lines (was ${lines.length} lines)`);
console.log(`Reduction: ${lines.length - cleanLines} lines (${Math.round((1 - cleanLines/lines.length) * 100)}%)`);

// Create a backup of the original
console.log('\nCreating backup of original index.html...');
fs.copyFileSync('index.html', 'index-original-backup.html');
console.log('Backup saved as index-original-backup.html');

console.log('\nDone! You can now:');
console.log('1. Test index-clean.html');
console.log('2. If everything works, rename it to index.html');
console.log('3. The original is backed up as index-original-backup.html');