#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Extract version from package.json
const packageFile = path.join(__dirname, 'package.json');
const packageData = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
const version = packageData.version;

// Load version metadata for date tracking
const versionFile = path.join(__dirname, 'version.json');
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

console.log(`Building with version: ${version}`);

// Load HTML template
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Create timestamped backup
const backupPath = path.join(__dirname, `index.html.backup-${Date.now()}`);
fs.writeFileSync(backupPath, html);

// Strip existing version query parameters
html = html.replace(/(\.(js|css))(\?v=[^"'\s]*)?/g, '$1');

// Append version to JavaScript references
html = html.replace(/<script\s+src="([^"]+\.js)"/g, (match, src) => {
    // Exclude external resources
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        return match;
    }
    return `<script src="${src}?v=${version}"`;
});

// Append version to stylesheet references
html = html.replace(/<link\s+([^>]*)\s+href="([^"]+\.css)"/g, (match, attrs, href) => {
    // Exclude external resources
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return match;
    }
    return `<link ${attrs} href="${href}?v=${version}"`;
});

// Update UI version display
html = html.replace(/<span id="versionNumber">[^<]*<\/span>/, `<span id="versionNumber">${version}</span>`);

// Update version check constant
html = html.replace(/const currentVersion = ['"][^'"]*['"]/g, `const currentVersion = '${version}'`);

// Save modified HTML
fs.writeFileSync(indexPath, html);

console.log('✅ Version build complete!');
console.log(`   - Updated all JS and CSS references with ?v=${version}`);
console.log(`   - Updated version display to ${version}`);
console.log(`   - Backup saved as: ${backupPath}`);

// Persist version metadata
versionData.version = version;
versionData.updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));