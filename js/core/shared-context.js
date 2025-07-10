// Shared Context for Infinite Snake
// This file provides access to global variables and functions that the extracted classes need
// It acts as a bridge between the modular code and the existing global scope

const SharedContext = {
    // Canvas and rendering context
    get ctx() { return window.ctx; },
    get canvas() { return window.canvas; },
    
    // Camera system
    get camera() { return window.camera; },
    get cameraZoom() { return window.cameraZoom; },
    
    // Game state
    get gameMode() { return window.gameMode; },
    get paused() { return window.paused; },
    get gameStarted() { return window.gameStarted; },
    get gameOver() { return window.gameOver; },
    get score() { return window.score; },
    get level() { return window.level; },
    get difficulty() { return window.difficulty; },
    
    // World constants
    get WORLD_SIZE() { return window.WORLD_SIZE; },
    get SNAKE_SPEED() { return window.SNAKE_SPEED; },
    get SEGMENT_SIZE() { return window.SEGMENT_SIZE; },
    get BOSS_TYPES() { return window.BOSS_TYPES; },
    
    // External systems
    get elementLoader() { return window.elementLoader; },
    get soundEffects() { return window.soundEffects; },
    get particlePool() { return window.particlePool; },
    get elementPool() { return window.elementPool; },
    
    // Utility functions
    worldToScreen: window.worldToScreen,
    isInViewport: window.isInViewport,
    drawEmoji: window.drawEmoji,
    spawnParticles: window.spawnParticles,
    playSound: window.playSound,
    
    // Mobile detection
    get isMobile() { return window.isMobile; },
    
    // Animation
    get animationTime() { return window.animationTime; },
    get deltaTime() { return window.deltaTime; },
    
    // Game collections
    get snakes() { return window.snakes; },
    get elements() { return window.elements; },
    get particles() { return window.particles; },
    get bosses() { return window.bosses; },
    
    // Player reference
    get player() { return window.player; },
    
    // Skins and unlocks
    get unlockedSkins() { return window.unlockedSkins; },
    get currentSkin() { return window.currentSkin; },
    
    // Special items
    get alchemyVisions() { return window.alchemyVisions; },
    get voidOrbs() { return window.voidOrbs; },
    get catalystGems() { return window.catalystGems; },
    
    // UI elements
    get joystick() { return window.joystick; },
    get boostButton() { return window.boostButton; }
};

export default SharedContext;