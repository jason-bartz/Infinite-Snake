// Script to create a clean, modernized index.html
const fs = require('fs');

console.log('Creating clean, modernized index.html...');

// Read the original file
const original = fs.readFileSync('index.html', 'utf8');
const lines = original.split('\n');

console.log(`Original file has ${lines.length} lines`);

// Build the clean HTML
let cleanHTML = '';

// 1. Copy the DOCTYPE and head section up to the CSS (lines 1-166)
for (let i = 0; i < 166; i++) {
    cleanHTML += lines[i] + '\n';
}

// 2. Copy all CSS (lines 166-3502)
console.log('Extracting CSS...');
for (let i = 165; i < 3502; i++) {
    cleanHTML += lines[i] + '\n';
}

// 3. Close the head and start body
cleanHTML += `</head>
<body>
`;

// 4. Copy all HTML body elements (lines 3695-4976)
console.log('Extracting HTML body elements...');
for (let i = 3694; i < 4976; i++) {
    if (!lines[i].includes('<script') && !lines[i].includes('</script>')) {
        cleanHTML += lines[i] + '\n';
    }
}

// 5. Add modernized script references
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
    
    <!-- Rendering Systems -->
    <script src="js/webgl-renderer.js"></script>
    <script src="js/quadtree.js"></script>
    <script src="js/texture-atlas.js"></script>
    <script src="js/gpu-particle-system.js"></script>
    <script src="js/mobile-star-renderer.js"></script>
    <script src="js/mobile-background-optimizer.js"></script>
    <script src="js/mobile-background-integration.js"></script>
    
    <!-- Modernized Systems -->
    <script src="js/performance/debug-config.js"></script>
    <script src="js/core/module-loader.js"></script>
    <script src="js/core/init-sequence.js" type="module"></script>
    
    <!-- Main Game Code (extracted from inline script) -->
    <script src="js/core/game-original.js"></script>
    
    <!-- Integration -->
    <script>
        // Wait for modules to load
        window.addEventListener('gameReady', function(e) {
            console.log('Modernized systems ready');
        });
        
        // Configure mobile UI
        window.MOBILE_UI_CONFIG = window.MOBILE_UI_CONFIG || {};
        window.MOBILE_UI_CONFIG.mode = 'fixed'; // or 'slideout'
        
        // Enable debug in development
        if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            window.DEBUG_CONFIG = window.DEBUG_CONFIG || {};
            window.DEBUG_CONFIG.enabled = true;
            console.log('Debug mode enabled for development');
        }
    </script>
    
    <!-- Analytics (if needed) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-YOUR_ID"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-YOUR_ID');
    </script>
</body>
</html>`;

// Write the clean file
fs.writeFileSync('index-clean.html', cleanHTML);

// Count the lines
const cleanLines = cleanHTML.split('\n').length;
console.log(`\nCreated index-clean.html with ${cleanLines} lines (was ${lines.length} lines)`);
console.log(`Reduction: ${lines.length - cleanLines} lines (${Math.round((1 - cleanLines/lines.length) * 100)}%)`);

// Calculate file sizes
const originalSize = Buffer.byteLength(original, 'utf8');
const cleanSize = Buffer.byteLength(cleanHTML, 'utf8');
console.log(`\nFile size: ${(cleanSize/1024).toFixed(1)}KB (was ${(originalSize/1024).toFixed(1)}KB)`);
console.log(`Size reduction: ${((originalSize - cleanSize)/1024).toFixed(1)}KB (${Math.round((1 - cleanSize/originalSize) * 100)}%)`);

// Create a backup of the original
console.log('\nCreating backup of original index.html...');
fs.copyFileSync('index.html', 'index-original-backup.html');
console.log('Backup saved as index-original-backup.html');

// Also create a file that shows what was removed
const removedLines = [];
for (let i = 4977; i < 18131; i++) {
    removedLines.push(lines[i]);
}
fs.writeFileSync('removed-inline-code.js', removedLines.join('\n'));
console.log('Inline code that was removed saved to removed-inline-code.js');

console.log('\n✅ Done! Next steps:');
console.log('1. Test index-clean.html in your browser');
console.log('2. Verify all functionality works');
console.log('3. If everything works, rename index-clean.html to index.html');
console.log('4. The original is backed up as index-original-backup.html');