#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read version from version.json
const versionFile = path.join(__dirname, 'version.json');
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
const version = versionData.version;

console.log(`Building with version: ${version}`);

// Read index.html
const indexPath = path.join(__dirname, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');

// Backup original
const backupPath = path.join(__dirname, `index.html.backup-${Date.now()}`);
fs.writeFileSync(backupPath, html);

// Remove existing version parameters
html = html.replace(/(\.(js|css))(\?v=[^"'\s]*)?/g, '$1');

// Add version to all JS files
html = html.replace(/<script\s+src="([^"]+\.js)"/g, (match, src) => {
    // Skip external URLs
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
        return match;
    }
    return `<script src="${src}?v=${version}"`;
});

// Add version to all CSS files
html = html.replace(/<link\s+([^>]*)\s+href="([^"]+\.css)"/g, (match, attrs, href) => {
    // Skip external URLs
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
        return match;
    }
    return `<link ${attrs} href="${href}?v=${version}"`;
});

// Update version number in the display
html = html.replace(/<span id="versionNumber">[^<]*<\/span>/, `<span id="versionNumber">${version}</span>`);

// Update version in the version check script
html = html.replace(/const currentVersion = ['"][^'"]*['"]/g, `const currentVersion = '${version}'`);

// Write updated HTML
fs.writeFileSync(indexPath, html);

console.log('✅ Version build complete!');
console.log(`   - Updated all JS and CSS references with ?v=${version}`);
console.log(`   - Updated version display to ${version}`);
console.log(`   - Backup saved as: ${backupPath}`);

// Update version date
versionData.updated = new Date().toISOString().split('T')[0];
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));