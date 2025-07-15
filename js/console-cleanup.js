// Console cleanup utility
// This script helps identify and clean up console statements

const fs = require('fs');
const path = require('path');

// Patterns to identify different types of console statements
const patterns = {
    // Debug/verbose logs to remove completely
    toRemove: [
        /console\.log\s*\(\s*['"`]\[DEBUG\]/gi,
        /console\.log\s*\(\s*['"`]\[AUDIO\]\s*Audio state/gi,
        /console\.log\s*\(\s*['"`]\[LEADERBOARD\]\s*⚡/gi,
        /console\.log\s*\(\s*['"`]\[DEATH SEQUENCE\]/gi,
        /console\.log\s*\(\s*['"`]\[RESPAWN/gi,
        /console\.log\s*\(\s*['"`]\[Cache Debug\]/gi,
        /console\.log\s*\(\s*['"`]Testing/gi,
        /console\.log\s*\(\s*['"`]✅/gi,
        /console\.log\s*\(\s*['"`]\[GAME START\]/gi,
        /console\.log\s*\(\s*['"`]\[Boss Spawned\]/gi,
        /console\.log\s*\(\s*['"`]\[Element Combination\]/gi,
        /console\.log\s*\(\s*['"`]\[Discovery\]/gi,
        /console\.log\s*\(\s*['"`]Aggressive AI/gi,
        /console\.log\s*\(\s*['"`]AI Snake/gi,
        /console\.log\s*\(\s*['"`]\[Performance\]/gi,
        /console\.log\s*\(\s*['"`]\[AUDIO\]\s*Tab/gi,
        /console\.log\s*\(\s*['"`]\[AUDIO\]\s*Window/gi,
        /console\.log\s*\(\s*['"`]\[AUDIO\]\s*Background music/gi,
        /console\.log\s*\(\s*['"`]\[AUDIO\]\s*Music/gi,
        /console\.log\s*\(\s*['"`]\[AUDIO\]\s*Attempting/gi,
        /console\.log\s*\(\s*['"`]\[COLLISION\]/gi
    ],
    
    // Convert to logger.debug
    toDebug: [
        /console\.log\s*\(\s*['"`]\[AUDIO\]\s*Current track/gi,
        /console\.log\s*\(\s*['"`]\[LEADERBOARD\]\s*Checking/gi,
        /console\.log\s*\(\s*['"`]\[LEADERBOARD\]\s*Score:/gi,
        /console\.log\s*\(\s*['"`]Creating new/gi,
        /console\.log\s*\(\s*['"`]Spawning/gi,
        /console\.log\s*\(\s*['"`]Element spawned/gi
    ],
    
    // Convert to logger.error (keep these)
    toError: [
        /console\.error\s*\(\s*['"`]Failed to/gi,
        /console\.error\s*\(\s*['"`]Error/gi,
        /console\.error\s*\(\s*['"`]Invalid/gi,
        /console\.error\s*\(\s*['"`].*is NaN/gi,
        /console\.error\s*\(\s*['"`].*is null/gi,
        /console\.error\s*\(\s*['"`].*undefined/gi
    ],
    
    // Convert to logger.warn
    toWarn: [
        /console\.warn/gi
    ]
};

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let changes = {
        removed: 0,
        toDebug: 0,
        toError: 0,
        toWarn: 0
    };
    
    // Remove verbose logs
    patterns.toRemove.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            changes.removed += matches.length;
            content = content.replace(pattern, '// Removed verbose log');
            modified = true;
        }
    });
    
    // Convert to logger.debug
    patterns.toDebug.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            changes.toDebug += matches.length;
            content = content.replace(pattern, (match) => {
                return match.replace('console.log', 'logger.debug');
            });
            modified = true;
        }
    });
    
    // Convert to logger.error
    patterns.toError.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            changes.toError += matches.length;
            content = content.replace(pattern, (match) => {
                return match.replace('console.error', 'logger.error');
            });
            modified = true;
        }
    });
    
    // Convert to logger.warn
    patterns.toWarn.forEach(pattern => {
        const matches = content.match(pattern);
        if (matches) {
            changes.toWarn += matches.length;
            content = content.replace(pattern, (match) => {
                return match.replace('console.warn', 'logger.warn');
            });
            modified = true;
        }
    });
    
    return { content, modified, changes };
}

// Process specific files
const filesToProcess = [
    'js/core/game-original.js',
    'js/core/entities/Snake.js',
    'js/leaderboard.js',
    'js/performance-integration.js'
];

filesToProcess.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
        console.log(`Processing ${file}...`);
        const result = processFile(filePath);
        
        if (result.modified) {
            // Create backup
            const backupPath = filePath + '.backup-console';
            fs.copyFileSync(filePath, backupPath);
            
            // Write modified content
            fs.writeFileSync(filePath, result.content);
            
            console.log(`  Removed: ${result.changes.removed}`);
            console.log(`  Converted to debug: ${result.changes.toDebug}`);
            console.log(`  Converted to error: ${result.changes.toError}`);
            console.log(`  Converted to warn: ${result.changes.toWarn}`);
        } else {
            console.log('  No changes needed');
        }
    }
});

console.log('\nConsole cleanup complete!');