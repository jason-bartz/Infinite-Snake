# Skin UI Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the new desktop skin selection UI in the Infinite Snake game.

## 1. Data Structure Updates

### Add Rarity System
```javascript
// Add after skinMetadata definition (around line 4822)
const skinRarityTiers = {
    common: [
        'snake-default-green', 
        'coffee', 
        'dog', 
        'potato', 
        'clock',
        'controller',
        'football'
    ],
    uncommon: [
        'neko',
        'fries', 
        'handheld-game',
        'kid-car',
        'buffalo',
        'whale',
        'pod-player'
    ],
    rare: [
        '35mm', 
        'Frank', 
        'af-one', 
        'barbi', 
        'boat-mcboatface',
        'camera-guy',
        'diet-cola'
    ],
    legendary: [
        'nyan', 
        'unicorn', 
        'infinity-glove', 
        'green-dragon', 
        'red-dragon',
        'lovecraft',
        'space-cadet'
    ],
    exotic: [
        'saturn', 
        'tornado',
        'flame',
        'donut',
        'hotdog',
        'pizza',
        'ramen'
    ],
    secret: [
        'pyraxis', 
        'abyssos', 
        'osseus', 
        'zephyrus',
        'santa',
        'robot',
        'skibidi',
        'tv',
        'brick-man',
        'gnome',
        'mac',
        'murica',
        'floral',
        'snake-2',
        'racer'
    ]
};

// Add skin bios
const skinBios = {
    'snake-default-green': "The original serpent. Simple, classic, and always in style.",
    'neko': "A limited edition skin for beta testers. Purrs when boosting.",
    'nyan': "A mystical feline that leaves a rainbow trail in its wake.",
    'pyraxis': "The Molten Lord, master of flame and destruction.",
    'unicorn': "Silicon Valley's favorite mythical creature. Valued at $1B+.",
    // ... add for all skins
};

// Add unlock criteria
const skinUnlockCriteria = {
    'coffee': "Play 10 games",
    'nyan': "Complete 50 element discoveries",
    'pyraxis': "Defeat Pyraxis the Molten",
    'unicorn': "Score 100,000 points in one game",
    'infinity-glove': "Collect all 6 basic elements in order",
    'santa': "Play during December",
    'robot': "Win 5 PvP matches",
    // ... add for all locked skins
};
```

## 2. Update HTML Structure

### Replace Skins Tab Content (line ~3417)
```html
<!-- Skins Tab -->
<div id="skinsTab" class="tab-content active">
    <div id="skinSelection">
        <!-- Rarity Tabs -->
        <div class="rarity-tabs" id="rarityTabs">
            <button class="rarity-tab active" data-rarity="common">
                <span class="rarity-icon">◆</span> Common
            </button>
            <button class="rarity-tab" data-rarity="uncommon">
                <span class="rarity-icon">◆</span> Uncommon
            </button>
            <button class="rarity-tab" data-rarity="rare">
                <span class="rarity-icon">◆</span> Rare
            </button>
            <button class="rarity-tab" data-rarity="legendary">
                <span class="rarity-icon">◆</span> Legendary
            </button>
            <button class="rarity-tab" data-rarity="exotic">
                <span class="rarity-icon">◆</span> Exotic
            </button>
            <button class="rarity-tab" data-rarity="secret">
                <span class="rarity-icon">◆</span> Secret
            </button>
        </div>
        
        <!-- Skin Grid Container -->
        <div class="skin-grid-container">
            <div id="skinGrid" class="skin-grid-desktop"></div>
        </div>
        
        <!-- Progress Bar -->
        <div class="skin-progress">
            Progress: <span id="unlockedCount">0</span>/48 Skins Unlocked
        </div>
    </div>
</div>

<!-- Skin Preview Modal -->
<div id="skinModalBackdrop" class="modal-backdrop">
    <div id="skinModal" class="skin-modal">
        <button class="modal-close" onclick="closeSkinModal()">X</button>
        
        <div id="skinPreview" class="skin-preview">
            <canvas id="skinPreviewCanvas" width="300" height="300"></canvas>
            <div class="particle-container" id="modalParticles"></div>
        </div>
        
        <div id="modalRarity" class="modal-rarity"></div>
        <div id="modalTitle" class="modal-title"></div>
        
        <div id="modalBio" class="modal-bio"></div>
        
        <div class="modal-actions">
            <button id="modalEquipBtn" class="modal-button equip">EQUIP</button>
            <button class="modal-button" onclick="closeSkinModal()">CLOSE</button>
        </div>
        
        <div id="modalUnlock" class="modal-unlock"></div>
    </div>
</div>
```

## 3. CSS Updates

### Add New Styles (after existing pause menu CSS ~line 2750)
```css
/* Rarity System Styles */
.rarity-tabs {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.rarity-tab {
    padding: 10px 16px;
    background: var(--snes-primary-blue);
    border: 3px solid;
    border-color: var(--snes-light-blue) var(--snes-black) var(--snes-black) var(--snes-light-blue);
    color: var(--snes-white);
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    position: relative;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
    font-family: 'Press Start 2P';
}

.rarity-tab:hover {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}

.rarity-tab.active {
    background: var(--snes-gold);
    color: var(--snes-black);
    border-color: #FFF #A88800 #A88800 #FFF;
    transform: translate(4px, 4px);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
}

/* Rarity Icons */
.rarity-icon {
    margin-right: 4px;
}

.rarity-tab[data-rarity="common"] .rarity-icon { color: #808080; }
.rarity-tab[data-rarity="uncommon"] .rarity-icon { color: #2ecc71; }
.rarity-tab[data-rarity="rare"] .rarity-icon { color: #3498db; }
.rarity-tab[data-rarity="legendary"] .rarity-icon { color: #9b59b6; }
.rarity-tab[data-rarity="exotic"] .rarity-icon { color: #ff8c00; }
.rarity-tab[data-rarity="secret"] .rarity-icon { color: #e74c3c; }

/* Skin Grid Container */
.skin-grid-container {
    flex: 1;
    background: rgba(0,0,0,0.3);
    border: 4px solid;
    border-color: var(--snes-black) var(--snes-light-blue) var(--snes-light-blue) var(--snes-black);
    padding: 16px;
    overflow: hidden;
    position: relative;
    min-height: 0;
}

/* Desktop Skin Grid */
.skin-grid-desktop {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 12px;
    max-height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    padding-right: 10px;
}

/* Enhanced Skin Tiles */
.skin-tile {
    aspect-ratio: 1;
    background: rgba(0,0,0,0.5);
    border: 3px solid;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

/* Rarity-based styling */
.skin-tile[data-rarity="common"] { border-color: #808080; }
.skin-tile[data-rarity="uncommon"] { border-color: #2ecc71; }
.skin-tile[data-rarity="rare"] { 
    border-color: #3498db;
    animation: rarePulse 3s ease-in-out infinite;
}
.skin-tile[data-rarity="legendary"] { 
    border-color: #9b59b6;
    background: linear-gradient(135deg, rgba(155,89,182,0.1) 0%, rgba(0,0,0,0.5) 100%);
}
.skin-tile[data-rarity="exotic"] { 
    border-color: #ff8c00;
    background: linear-gradient(135deg, rgba(255,140,0,0.1) 0%, rgba(0,0,0,0.5) 100%);
}
.skin-tile[data-rarity="secret"] { 
    border-color: #e74c3c;
    background: linear-gradient(135deg, rgba(231,76,60,0.1) 0%, rgba(0,0,0,0.5) 100%);
}

@keyframes rarePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(52,152,219,0.4); }
    50% { box-shadow: 0 0 0 6px rgba(52,152,219,0); }
}

/* Hover effects by rarity */
.skin-tile:hover {
    transform: scale(1.1);
    z-index: 10;
    filter: brightness(1.3);
}

.skin-tile[data-rarity="uncommon"]:hover {
    box-shadow: 0 0 20px #2ecc71;
}

.skin-tile[data-rarity="rare"]:hover {
    box-shadow: 0 0 25px #3498db;
}

.skin-tile[data-rarity="legendary"]:hover {
    box-shadow: 0 0 30px #9b59b6;
}

.skin-tile[data-rarity="exotic"]:hover {
    box-shadow: 0 0 30px #ff8c00;
    animation: exoticShimmer 0.5s ease infinite;
}

.skin-tile[data-rarity="secret"]:hover {
    box-shadow: 0 0 35px #e74c3c;
}

@keyframes exoticShimmer {
    0%, 100% { filter: brightness(1.3) hue-rotate(0deg); }
    50% { filter: brightness(1.5) hue-rotate(10deg); }
}

/* Modal Styles */
.modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.modal-backdrop.active {
    display: flex;
}

.skin-modal {
    background: var(--snes-dark-blue);
    width: 500px;
    border: 8px solid;
    border-color: var(--snes-white) var(--snes-black) var(--snes-black) var(--snes-white);
    box-shadow: 8px 8px 0 rgba(0,0,0,0.8);
    outline: 2px solid var(--snes-gold);
    outline-offset: -12px;
    padding: 32px;
    position: relative;
    animation: modalZoomIn 0.3s ease;
    font-family: 'Press Start 2P';
}

@keyframes modalZoomIn {
    from {
        transform: scale(0.8);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
}

.modal-close {
    position: absolute;
    top: 16px;
    right: 16px;
    background: var(--snes-primary-blue);
    border: 3px solid;
    border-color: var(--snes-light-blue) var(--snes-black) var(--snes-black) var(--snes-light-blue);
    color: white;
    padding: 8px 12px;
    cursor: pointer;
    font-size: 12px;
    font-family: 'Press Start 2P';
    transition: all 0.2s;
}

.modal-close:hover {
    background: var(--snes-light-blue);
    transform: translate(2px, 2px);
}

.skin-preview {
    width: 300px;
    height: 300px;
    margin: 0 auto 20px;
    background: rgba(0,0,0,0.3);
    border: 4px solid var(--snes-dark-purple);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
}

.modal-rarity {
    text-align: center;
    font-size: 12px;
    margin-bottom: 8px;
    text-transform: uppercase;
}

.modal-title {
    text-align: center;
    font-size: 16px;
    color: var(--snes-gold);
    margin-bottom: 16px;
    text-shadow: 2px 2px 0 var(--snes-black);
}

.modal-bio {
    background: rgba(0,0,0,0.3);
    border: 2px solid var(--snes-dark-purple);
    padding: 16px;
    margin-bottom: 24px;
    font-size: 10px;
    line-height: 1.6;
    color: #DDD;
    text-align: center;
}

.modal-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
}

.modal-button {
    padding: 12px 32px;
    background: var(--snes-primary-blue);
    border: 4px solid;
    border-color: var(--snes-light-blue) var(--snes-black) var(--snes-black) var(--snes-light-blue);
    color: white;
    font-size: 10px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
    font-family: 'Press Start 2P';
}

.modal-button:hover {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
}

.modal-button.equip {
    background: #2ecc71;
    border-color: #3ADB7A #1B7943 #1B7943 #3ADB7A;
}

.modal-button.locked {
    background: #666;
    border-color: #888 #444 #444 #888;
    cursor: not-allowed;
    opacity: 0.7;
}

.modal-button.locked:hover {
    transform: none;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
}

.modal-unlock {
    text-align: center;
    font-size: 10px;
    color: var(--snes-cosmic-teal);
    margin-top: 16px;
}

/* Particle Container */
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
    opacity: 0;
    animation: floatUp 3s ease-out infinite;
}

@keyframes floatUp {
    0% {
        transform: translateY(100%) scale(0);
        opacity: 1;
    }
    100% {
        transform: translateY(-20px) scale(1);
        opacity: 0;
    }
}

/* Progress Bar */
.skin-progress {
    text-align: center;
    font-size: 10px;
    color: var(--snes-cosmic-teal);
    margin-top: 16px;
}

/* Keyboard Focus */
.skin-tile:focus {
    outline: 3px solid var(--snes-white);
    outline-offset: 2px;
}

.rarity-tab:focus {
    outline: 2px solid var(--snes-white);
}
```

## 4. JavaScript Implementation

### Replace buildSkinGrid function (around line 13268)
```javascript
// Current rarity tab
let currentRarityTab = 'common';

// Build skin selection UI with rarity tabs
function buildSkinGrid() {
    const container = document.getElementById('skinSelection');
    if (!container) return;
    
    // Initialize rarity tabs
    initializeRarityTabs();
    
    // Load skins for current tab
    loadSkinsForRarity(currentRarityTab);
    
    // Update progress
    updateSkinProgress();
}

// Initialize rarity tab functionality
function initializeRarityTabs() {
    const tabs = document.querySelectorAll('.rarity-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Load skins for selected rarity
            currentRarityTab = this.dataset.rarity;
            loadSkinsForRarity(currentRarityTab);
            
            // Play tab switch sound
            if (window.audioManager) {
                audioManager.playSound('uiClick');
            }
        });
    });
}

// Load skins for specific rarity tier
function loadSkinsForRarity(rarity) {
    const grid = document.getElementById('skinGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const skinsInTier = skinRarityTiers[rarity] || [];
    
    skinsInTier.forEach(skinId => {
        const skinData = skinMetadata[skinId];
        if (!skinData) return;
        
        const tile = createSkinTile(skinId, skinData, rarity);
        grid.appendChild(tile);
    });
}

// Create individual skin tile
function createSkinTile(skinId, skinData, rarity) {
    const div = document.createElement('div');
    div.className = 'skin-tile';
    div.dataset.skinId = skinId;
    div.dataset.rarity = rarity;
    div.tabIndex = 0; // Make keyboard accessible
    
    // Add state classes
    if (skinId === currentPlayerSkin) {
        div.classList.add('equipped');
    }
    
    if (!skinData.unlocked && !unlockedSkins.has(skinId)) {
        div.classList.add('locked');
    }
    
    // Create image or placeholder
    const imgContainer = document.createElement('div');
    imgContainer.className = 'skin-image';
    
    if (skinData.isBoss && !skinData.unlocked) {
        // Show question mark for locked boss skins
        imgContainer.textContent = '❓';
        imgContainer.style.fontSize = '48px';
        imgContainer.style.backgroundColor = 'rgba(0,0,0,0.3)';
    } else {
        const img = document.createElement('img');
        img.src = skinData.isBoss ? `assets/boss-skins/${skinId}.png` : `skins/${skinId}.png`;
        img.alt = skinData.name;
        img.onerror = function() {
            this.src = skinData.isBoss ? `assets/boss-skins/${skinId}.webp` : `skins/${skinId}.webp`;
        };
        imgContainer.appendChild(img);
    }
    
    div.appendChild(imgContainer);
    
    // Add name
    const name = document.createElement('div');
    name.className = 'skin-name';
    name.textContent = skinData.name;
    div.appendChild(name);
    
    // Add lock icon if locked
    if (!skinData.unlocked && !unlockedSkins.has(skinId)) {
        const lockIcon = document.createElement('div');
        lockIcon.className = 'lock-icon';
        lockIcon.textContent = '🔒';
        div.appendChild(lockIcon);
    }
    
    // Add particles for higher rarities
    if (rarity === 'legendary' || rarity === 'exotic') {
        addParticleEffect(div, rarity);
    }
    
    // Event handlers
    div.addEventListener('click', () => openSkinModal(skinId));
    div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSkinModal(skinId);
        }
    });
    
    // Hover sound
    div.addEventListener('mouseenter', () => {
        if (window.audioManager) {
            audioManager.playSound('uiHover');
        }
    });
    
    return div;
}

// Open skin preview modal
function openSkinModal(skinId) {
    const skinData = skinMetadata[skinId];
    if (!skinData) return;
    
    const modal = document.getElementById('skinModalBackdrop');
    const rarity = getRarityForSkin(skinId);
    
    // Update modal content
    updateModalContent(skinId, skinData, rarity);
    
    // Show modal
    modal.classList.add('active');
    
    // Play open sound
    if (window.audioManager) {
        audioManager.playSound('modalOpen');
    }
    
    // Focus on close button for accessibility
    document.querySelector('.modal-close').focus();
    
    // Start preview animation
    startSkinPreviewAnimation(skinId, skinData);
}

// Update modal content
function updateModalContent(skinId, skinData, rarity) {
    // Rarity
    const rarityEl = document.getElementById('modalRarity');
    rarityEl.textContent = `◆ ${rarity.toUpperCase()} SKIN ◆`;
    rarityEl.style.color = `var(--rarity-${rarity})`;
    
    // Title
    document.getElementById('modalTitle').textContent = skinData.name;
    
    // Bio
    document.getElementById('modalBio').textContent = 
        skinBios[skinId] || "A mysterious skin with unknown origins.";
    
    // Equip button
    const equipBtn = document.getElementById('modalEquipBtn');
    const isUnlocked = skinData.unlocked || unlockedSkins.has(skinId);
    
    if (isUnlocked) {
        equipBtn.textContent = skinId === currentPlayerSkin ? 'EQUIPPED' : 'EQUIP';
        equipBtn.className = 'modal-button equip';
        equipBtn.disabled = skinId === currentPlayerSkin;
        equipBtn.onclick = () => equipSkin(skinId);
    } else {
        equipBtn.textContent = 'LOCKED';
        equipBtn.className = 'modal-button locked';
        equipBtn.disabled = true;
        equipBtn.onclick = null;
    }
    
    // Unlock criteria
    const unlockEl = document.getElementById('modalUnlock');
    if (!isUnlocked) {
        unlockEl.textContent = `Unlock: ${skinUnlockCriteria[skinId] || 'Complete specific challenge'}`;
        unlockEl.style.display = 'block';
    } else {
        unlockEl.style.display = 'none';
    }
    
    // Add particles for special rarities
    const particleContainer = document.getElementById('modalParticles');
    particleContainer.innerHTML = '';
    if (rarity === 'legendary' || rarity === 'exotic' || rarity === 'secret') {
        for (let i = 0; i < 6; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.backgroundColor = `var(--rarity-${rarity})`;
            particle.style.left = `${20 + (i * 12)}%`;
            particle.style.animationDelay = `${i * 0.5}s`;
            particleContainer.appendChild(particle);
        }
    }
}

// Start animated preview of skin
function startSkinPreviewAnimation(skinId, skinData) {
    const canvas = document.getElementById('skinPreviewCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw animated snake preview
    let rotation = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Save context
        ctx.save();
        
        // Translate to center and rotate
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        
        // Draw snake in circle
        const segments = 20;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            const size = 15 - (i * 0.3); // Taper size
            
            // Use skin colors
            if (skinData.colors && skinData.colors.length > 0) {
                ctx.fillStyle = skinData.colors[i % skinData.colors.length];
            } else {
                ctx.fillStyle = i % 2 === 0 ? '#75d18e' : '#6abf81';
            }
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add border
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        
        // Draw head
        ctx.fillStyle = skinData.colors ? skinData.colors[0] : '#75d18e';
        ctx.beginPath();
        ctx.arc(radius, 0, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(radius + 5, -5, 3, 0, Math.PI * 2);
        ctx.arc(radius + 5, 5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(radius + 6, -5, 2, 0, Math.PI * 2);
        ctx.arc(radius + 6, 5, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Restore context
        ctx.restore();
        
        // Continue animation
        rotation += 0.02;
        if (document.getElementById('skinModalBackdrop').classList.contains('active')) {
            requestAnimationFrame(animate);
        }
    }
    
    animate();
}

// Close modal
function closeSkinModal() {
    const modal = document.getElementById('skinModalBackdrop');
    modal.classList.remove('active');
    
    if (window.audioManager) {
        audioManager.playSound('modalClose');
    }
}

// Equip skin
function equipSkin(skinId) {
    currentPlayerSkin = skinId;
    if (playerSnake) {
        playerSnake.skin = skinId;
    }
    
    // Update portrait
    const portrait = document.getElementById('playerPortrait');
    if (portrait) {
        const skinData = skinMetadata[skinId];
        portrait.src = skinData.isBoss ? 
            `assets/boss-skins/${skinId}.png` : 
            `skins/${skinId}.png`;
    }
    
    // Save selection
    localStorage.setItem('currentSkin', skinId);
    saveSkinData();
    
    // Refresh grid to show equipped state
    loadSkinsForRarity(currentRarityTab);
    
    // Update modal button
    const equipBtn = document.getElementById('modalEquipBtn');
    equipBtn.textContent = 'EQUIPPED';
    equipBtn.disabled = true;
    
    if (window.audioManager) {
        audioManager.playSound('equipSkin');
    }
}

// Get rarity tier for a skin
function getRarityForSkin(skinId) {
    for (const [rarity, skins] of Object.entries(skinRarityTiers)) {
        if (skins.includes(skinId)) {
            return rarity;
        }
    }
    return 'common';
}

// Update progress counter
function updateSkinProgress() {
    const totalSkins = Object.keys(skinMetadata).length;
    const unlockedCount = unlockedSkins.size;
    
    const countEl = document.getElementById('unlockedCount');
    if (countEl) {
        countEl.textContent = unlockedCount;
    }
}

// Add particle effects to element
function addParticleEffect(element, rarity) {
    const container = document.createElement('div');
    container.className = 'particle-container';
    
    for (let i = 0; i < 3; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.backgroundColor = `var(--rarity-${rarity})`;
        particle.style.left = `${20 + (i * 30)}%`;
        particle.style.animationDelay = `${i * 0.8}s`;
        particle.style.width = '3px';
        particle.style.height = '3px';
        container.appendChild(particle);
    }
    
    element.appendChild(container);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!document.getElementById('pauseOverlay').style.display || 
        document.getElementById('pauseOverlay').style.display === 'none') {
        return;
    }
    
    // Tab navigation for rarity tiers
    if (e.key >= '1' && e.key <= '6') {
        const rarities = ['common', 'uncommon', 'rare', 'legendary', 'exotic', 'secret'];
        const index = parseInt(e.key) - 1;
        if (index < rarities.length) {
            const tab = document.querySelector(`.rarity-tab[data-rarity="${rarities[index]}"]`);
            if (tab) {
                tab.click();
            }
        }
    }
    
    // Escape closes modal
    if (e.key === 'Escape' && document.getElementById('skinModalBackdrop').classList.contains('active')) {
        closeSkinModal();
    }
});

// Remove old available unlocks system
// Delete any references to availableUnlocks variable
```

## 5. Integration Steps

1. **Backup current index.html**
2. **Add new data structures** after skinMetadata definition
3. **Update HTML** for skins tab and add modal
4. **Add CSS styles** for new UI components
5. **Replace JavaScript functions** for skin grid building
6. **Test thoroughly** on desktop browsers
7. **Add sound effects** for interactions (optional)
8. **Implement unlock criteria checks** in game logic

## 6. Testing Checklist

- [ ] All 48 skins appear in correct rarity tiers
- [ ] Tab switching works smoothly
- [ ] Modal opens/closes with animations
- [ ] Skin preview animation works
- [ ] Equip/lock functionality works correctly
- [ ] Keyboard navigation fully functional
- [ ] Boss skins show as question marks when locked
- [ ] Particle effects appear for high-rarity skins
- [ ] Progress counter updates correctly
- [ ] Equipped skin persists after reload
- [ ] Performance is smooth with all skins loaded

## 7. Future Enhancements

1. **Search/Filter**: Add search box to find skins by name
2. **Sort Options**: Sort by unlock status, name, or acquisition date
3. **Collections**: Group skins into themed collections
4. **Skin Stats**: Show usage statistics for each skin
5. **Preview Customization**: Let players test skins in mini-game
6. **Achievements**: Tie skin unlocks to achievement system
7. **Trading Cards**: Collectible cards for each skin with lore