#!/usr/bin/env node

/**
 * File watcher that automatically syncs custom files to main files
 * Run this until you can restart the server
 */

const fs = require('fs');
const path = require('path');

console.log('=== Auto-Sync Watcher Started ===');
console.log('Watching for changes in custom files...');
console.log('Press Ctrl+C to stop\n');

const customEmojisPath = path.join(__dirname, '..', 'elements', 'emojis-custom.json');
const customElementsPath = path.join(__dirname, '..', 'elements', 'elements-custom.json');
const customCombosPath = path.join(__dirname, '..', 'elements', 'combinations-custom.json');

const mainEmojisPath = path.join(__dirname, '..', 'elements', 'elements-new', 'emojis.json');
const mainElementsPath = path.join(__dirname, '..', 'elements', 'elements-new', 'elements-all-unique.json');
const mainCombosPath = path.join(__dirname, '..', 'elements', 'elements-new', 'combinations.json');

function syncEmojis() {
    if (fs.existsSync(customEmojisPath)) {
        try {
            const customEmojis = JSON.parse(fs.readFileSync(customEmojisPath, 'utf8'));
            const mainEmojis = JSON.parse(fs.readFileSync(mainEmojisPath, 'utf8'));
            Object.assign(mainEmojis, customEmojis);
            fs.writeFileSync(mainEmojisPath, JSON.stringify(mainEmojis, null, 2));
            console.log(`[${new Date().toLocaleTimeString()}] Synced emojis`);
        } catch (err) {
            console.error('Error syncing emojis:', err.message);
        }
    }
}

function syncElements() {
    if (fs.existsSync(customElementsPath)) {
        try {
            const customElements = JSON.parse(fs.readFileSync(customElementsPath, 'utf8'));
            const mainElements = JSON.parse(fs.readFileSync(mainElementsPath, 'utf8'));
            
            // Add new elements
            Object.values(customElements).forEach(elem => {
                const existingIndex = mainElements.findIndex(e => e.i === elem.id);
                const newElement = {
                    i: elem.id,
                    n: elem.name,
                    t: elem.tier,
                    e: elem.emojiIndex
                };
                
                if (existingIndex >= 0) {
                    mainElements[existingIndex] = newElement;
                } else {
                    mainElements.push(newElement);
                }
            });
            
            // Sort and save
            mainElements.sort((a, b) => a.i - b.i);
            fs.writeFileSync(mainElementsPath, JSON.stringify(mainElements, null, 2));
            console.log(`[${new Date().toLocaleTimeString()}] Synced elements`);
        } catch (err) {
            console.error('Error syncing elements:', err.message);
        }
    }
}

function syncCombinations() {
    if (fs.existsSync(customCombosPath)) {
        try {
            const customCombos = JSON.parse(fs.readFileSync(customCombosPath, 'utf8'));
            const mainCombos = JSON.parse(fs.readFileSync(mainCombosPath, 'utf8'));
            Object.assign(mainCombos, customCombos);
            fs.writeFileSync(mainCombosPath, JSON.stringify(mainCombos, null, 2));
            console.log(`[${new Date().toLocaleTimeString()}] Synced combinations`);
        } catch (err) {
            console.error('Error syncing combinations:', err.message);
        }
    }
}

// Watch for changes
if (fs.existsSync(customEmojisPath)) {
    fs.watchFile(customEmojisPath, { interval: 1000 }, () => {
        syncEmojis();
    });
}

if (fs.existsSync(customElementsPath)) {
    fs.watchFile(customElementsPath, { interval: 1000 }, () => {
        syncElements();
    });
}

if (fs.existsSync(customCombosPath)) {
    fs.watchFile(customCombosPath, { interval: 1000 }, () => {
        syncCombinations();
    });
}

// Do initial sync
syncEmojis();
syncElements();
syncCombinations();

console.log('\nWatcher is running. Any changes to custom files will be automatically synced to main files.');
console.log('This is a temporary solution - please restart the server when possible.');