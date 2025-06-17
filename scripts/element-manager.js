#!/usr/bin/env node

import { existsSync, watch } from 'fs';
import { PATHS } from './lib/paths.js';
import { createBackup, createBackups } from './lib/backup.js';
import { loadJSON, saveJSON, mergeElements, mergeCombinations, mergeEmojis, removeCombinations } from './lib/sync.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Command line argument parsing
const args = process.argv.slice(2);
const command = args[0];
const flags = args.slice(1);

// Helper to check flags
const hasFlag = (flag) => flags.includes(flag);

// Display help
function showHelp() {
    console.log(`
Infinite Snake Element Manager

Usage: node element-manager.js <command> [options]

Commands:
  sync          Sync custom files to main files
  clean         Remove deleted combinations
  check         Check element reachability
  help          Show this help message

Sync Options:
  --elements    Sync elements only
  --emojis      Sync emojis only
  --combos      Sync combinations only
  --all         Sync all files (default)
  --watch       Watch for changes and auto-sync
  --backup      Create backups before syncing
  --dry-run     Show what would be changed without making changes

Clean Options:
  --backup      Create backup before cleaning (default)
  --dry-run     Show what would be removed without making changes

Examples:
  node element-manager.js sync --all --backup
  node element-manager.js sync --elements --watch
  node element-manager.js clean --dry-run
  node element-manager.js check
`);
}

// Sync command
async function syncCommand() {
    const syncAll = hasFlag('--all') || (!hasFlag('--elements') && !hasFlag('--emojis') && !hasFlag('--combos'));
    const syncElements = syncAll || hasFlag('--elements');
    const syncEmojis = syncAll || hasFlag('--emojis');
    const syncCombos = syncAll || hasFlag('--combos');
    const createBackups = hasFlag('--backup');
    const dryRun = hasFlag('--dry-run');
    const watchMode = hasFlag('--watch');
    
    console.log('🔄 Syncing custom files to main files...');
    
    if (dryRun) {
        console.log('⚠️  DRY RUN MODE - No changes will be made');
    }
    
    // Perform sync
    async function performSync() {
        const stats = {
            elements: { added: 0 },
            emojis: { added: 0 },
            combinations: { added: 0 }
        };
        
        // Sync elements
        if (syncElements && existsSync(PATHS.CUSTOM.ELEMENTS)) {
            const mainElements = loadJSON(PATHS.MAIN.ELEMENTS, []);
            const customElements = loadJSON(PATHS.CUSTOM.ELEMENTS, []);
            
            if (customElements.length > 0) {
                const { merged, added } = mergeElements(mainElements, customElements);
                stats.elements.added = added;
                
                if (!dryRun && added > 0) {
                    if (createBackups) createBackup(PATHS.MAIN.ELEMENTS);
                    saveJSON(PATHS.MAIN.ELEMENTS, merged);
                }
            }
        }
        
        // Sync emojis
        if (syncEmojis && existsSync(PATHS.CUSTOM.EMOJIS)) {
            const mainEmojis = loadJSON(PATHS.MAIN.EMOJIS, {});
            const customEmojis = loadJSON(PATHS.CUSTOM.EMOJIS, {});
            
            const { merged, added } = mergeEmojis(mainEmojis, customEmojis);
            stats.emojis.added = added;
            
            if (!dryRun && added > 0) {
                if (createBackups) createBackup(PATHS.MAIN.EMOJIS);
                saveJSON(PATHS.MAIN.EMOJIS, merged);
            }
        }
        
        // Sync combinations
        if (syncCombos && existsSync(PATHS.CUSTOM.COMBINATIONS)) {
            const mainCombos = loadJSON(PATHS.MAIN.COMBINATIONS, {});
            const customCombos = loadJSON(PATHS.CUSTOM.COMBINATIONS, {});
            
            const { merged, added } = mergeCombinations(mainCombos, customCombos);
            stats.combinations.added = added;
            
            if (!dryRun && added > 0) {
                if (createBackups) createBackup(PATHS.MAIN.COMBINATIONS);
                saveJSON(PATHS.MAIN.COMBINATIONS, merged);
            }
        }
        
        // Display results
        console.log('\\n📊 Sync Results:');
        if (syncElements) console.log(`  Elements: ${stats.elements.added} added`);
        if (syncEmojis) console.log(`  Emojis: ${stats.emojis.added} updated`);
        if (syncCombos) console.log(`  Combinations: ${stats.combinations.added} added`);
        
        if (dryRun) {
            console.log('\\n✅ Dry run complete - no files were modified');
        } else {
            console.log('\\n✅ Sync complete!');
        }
    }
    
    // Initial sync
    await performSync();
    
    // Watch mode
    if (watchMode) {
        console.log('\\n👀 Watching for changes... (Ctrl+C to stop)');
        
        const filesToWatch = [];
        if (syncElements && existsSync(PATHS.CUSTOM.ELEMENTS)) filesToWatch.push(PATHS.CUSTOM.ELEMENTS);
        if (syncEmojis && existsSync(PATHS.CUSTOM.EMOJIS)) filesToWatch.push(PATHS.CUSTOM.EMOJIS);
        if (syncCombos && existsSync(PATHS.CUSTOM.COMBINATIONS)) filesToWatch.push(PATHS.CUSTOM.COMBINATIONS);
        
        filesToWatch.forEach(file => {
            watch(file, async (eventType) => {
                if (eventType === 'change') {
                    console.log(`\\n📝 Detected change in ${file}`);
                    await performSync();
                }
            });
        });
    }
}

// Clean command
async function cleanCommand() {
    const createBackups = !hasFlag('--no-backup');
    const dryRun = hasFlag('--dry-run');
    
    console.log('🧹 Cleaning deleted combinations...');
    
    if (dryRun) {
        console.log('⚠️  DRY RUN MODE - No changes will be made');
    }
    
    // Load deletion list
    const deletionList = loadJSON(PATHS.DELETED.COMBINATIONS, []);
    if (deletionList.length === 0) {
        console.log('No combinations to delete');
        return;
    }
    
    // Load main combinations
    const mainCombos = loadJSON(PATHS.MAIN.COMBINATIONS, {});
    
    // Remove combinations
    const { cleaned, removed } = removeCombinations(mainCombos, deletionList);
    
    console.log(`\\n📊 Found ${removed} combinations to remove`);
    
    if (!dryRun && removed > 0) {
        if (createBackups) createBackup(PATHS.MAIN.COMBINATIONS);
        saveJSON(PATHS.MAIN.COMBINATIONS, cleaned);
        console.log('✅ Combinations cleaned!');
    } else if (dryRun) {
        console.log('✅ Dry run complete - no files were modified');
    }
}

// Check reachability command
async function checkCommand() {
    console.log('🔍 Checking element reachability...');
    
    try {
        // Run the reachability check script
        const scriptPath = './scripts/check-element-reachability.js';
        const { stdout, stderr } = await execAsync(`node "${scriptPath}"`);
        
        if (stderr) {
            console.error('Error:', stderr);
            return;
        }
        
        console.log(stdout);
        
        // Display summary from the report
        if (existsSync(PATHS.REACHABILITY_REPORT)) {
            const report = loadJSON(PATHS.REACHABILITY_REPORT);
            console.log('\\n📊 Summary:');
            console.log(`  Total Elements: ${report.summary.totalElements}`);
            console.log(`  Reachable: ${report.summary.reachableElements}`);
            console.log(`  Unreachable: ${report.summary.unreachableElements}`);
            console.log(`  Coverage: ${report.summary.reachabilityPercentage}`);
            console.log(`\\nReport saved to: ${PATHS.REACHABILITY_REPORT}`);
        }
    } catch (error) {
        console.error('Failed to run reachability check:', error.message);
    }
}

// Main command handler
async function main() {
    if (!command || command === 'help' || hasFlag('--help')) {
        showHelp();
        return;
    }
    
    switch (command) {
        case 'sync':
            await syncCommand();
            break;
        case 'clean':
            await cleanCommand();
            break;
        case 'check':
            await checkCommand();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            showHelp();
            process.exit(1);
    }
}

// Run main
main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});