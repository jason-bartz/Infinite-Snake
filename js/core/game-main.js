// Main Game Integration for Infinite Snake
// This file imports and initializes all modernized modules

// Import entity classes
import BorderParticle from './entities/BorderParticle.js';
import Snake from './entities/Snake.js';
import Element from './entities/Element.js';
import AlchemyVision from './entities/AlchemyVision.js';
import VoidOrb from './entities/VoidOrb.js';
import CatalystGem from './entities/CatalystGem.js';
import Particle from './entities/Particle.js';
import ParticlePool from './entities/ParticlePool.js';
import ElementPool from './entities/ElementPool.js';
import ShootingStar from './entities/ShootingStar.js';
import Boss from './entities/Boss.js';

// Import shared context
import SharedContext from './shared-context.js';

// Import mobile UI system
import MobileUIManager from '../mobile/mobile-ui-manager.js';
import MOBILE_UI_CONFIG from '../mobile/mobile-config.js';

// Import performance system
import UnifiedPerformanceSystem from '../performance/unified-performance-system.js';
import DEBUG_CONFIG from '../performance/debug-config.js';
import { loggers, overrideConsole } from '../performance/logger.js';

// Game initialization class
class GameInitializer {
    constructor() {
        this.initialized = false;
        this.systems = {
            performance: null,
            mobile: null,
            entities: {}
        };
        
        // Logger for this module
        this.logger = loggers.gameState;
    }
    
    // Initialize all game systems
    async init() {
        if (this.initialized) {
            this.logger.warn('Game already initialized');
            return;
        }
        
        this.logger.log('Starting game initialization...');
        
        try {
            // 1. Initialize debug and logging
            this.initializeDebugSystem();
            
            // 2. Wait for DOM
            await this.waitForDOM();
            
            // 3. Initialize performance monitoring
            this.initializePerformanceSystem();
            
            // 4. Initialize mobile UI if needed
            this.initializeMobileUI();
            
            // 5. Register entity classes globally
            this.registerEntityClasses();
            
            // 6. Initialize game systems
            await this.initializeGameSystems();
            
            // 7. Set up module integration
            this.setupModuleIntegration();
            
            // 8. Start game loop hooks
            this.hookGameLoop();
            
            this.initialized = true;
            this.logger.log('Game initialization complete');
            
            // Emit initialization event
            window.dispatchEvent(new CustomEvent('gameInitialized', {
                detail: { systems: this.systems }
            }));
            
        } catch (error) {
            this.logger.error('Failed to initialize game:', error);
            throw error;
        }
    }
    
    // Initialize debug and logging system
    initializeDebugSystem() {
        // Apply debug configuration
        window.DEBUG_CONFIG = DEBUG_CONFIG;
        window.Debug = window.Debug || {};
        
        // Override console if configured
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.enableLogging) {
            this.logger.log('Debug mode enabled');
        } else {
            // In production, override console to silence logs
            overrideConsole();
        }
    }
    
    // Wait for DOM to be ready
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    // Initialize performance monitoring system
    initializePerformanceSystem() {
        this.logger.log('Initializing performance system...');
        
        // Create and initialize performance system
        this.systems.performance = window.performanceSystem || new UnifiedPerformanceSystem();
        
        // Initialize if not already done
        if (!this.systems.performance.initialized) {
            this.systems.performance.init();
        }
        
        // Listen for quality changes
        this.systems.performance.on('qualityChanged', (data) => {
            this.logger.log('Quality changed:', data);
            // Notify other systems of quality change
            window.dispatchEvent(new CustomEvent('qualityChanged', { detail: data }));
        });
    }
    
    // Initialize mobile UI system
    initializeMobileUI() {
        // Check if mobile
        if (MobileUIManager.isMobile()) {
            this.logger.log('Initializing mobile UI...');
            
            // Create and initialize mobile UI manager
            this.systems.mobile = window.mobileUIManager || new MobileUIManager();
            
            // Apply configuration
            this.systems.mobile.config = window.MOBILE_UI_CONFIG || MOBILE_UI_CONFIG;
            
            // Initialize if not already done
            if (!this.systems.mobile.initialized) {
                this.systems.mobile.init();
            }
        }
    }
    
    // Register entity classes globally for backward compatibility
    registerEntityClasses() {
        this.logger.log('Registering entity classes...');
        
        // Make classes available globally
        window.BorderParticle = BorderParticle;
        window.Snake = Snake;
        window.Element = Element;
        window.AlchemyVision = AlchemyVision;
        window.VoidOrb = VoidOrb;
        window.CatalystGem = CatalystGem;
        window.Particle = Particle;
        window.ParticlePool = ParticlePool;
        window.ElementPool = ElementPool;
        window.ShootingStar = ShootingStar;
        window.Boss = Boss;
        
        // Store references
        this.systems.entities = {
            BorderParticle,
            Snake,
            Element,
            AlchemyVision,
            VoidOrb,
            CatalystGem,
            Particle,
            ParticlePool,
            ElementPool,
            ShootingStar,
            Boss
        };
    }
    
    // Initialize game-specific systems
    async initializeGameSystems() {
        this.logger.log('Initializing game systems...');
        
        // Wait for element loader if needed
        if (!window.elementLoader) {
            await this.waitForElementLoader();
        }
        
        // Initialize particle pools
        if (!window.particlePool) {
            window.particlePool = new ParticlePool();
            this.logger.log('Created particle pool');
        }
        
        if (!window.elementPool) {
            window.elementPool = new ElementPool();
            this.logger.log('Created element pool');
        }
        
        // Initialize collections if not exist
        window.particles = window.particles || [];
        window.elements = window.elements || [];
        window.snakes = window.snakes || [];
        window.bosses = window.bosses || [];
        window.alchemyVisions = window.alchemyVisions || [];
        window.voidOrbs = window.voidOrbs || [];
        window.catalystGems = window.catalystGems || [];
        window.borderParticles = window.borderParticles || [];
        window.shootingStars = window.shootingStars || [];
    }
    
    // Wait for element loader
    waitForElementLoader() {
        return new Promise((resolve) => {
            const checkLoader = () => {
                if (window.elementLoader) {
                    resolve();
                } else {
                    setTimeout(checkLoader, 100);
                }
            };
            checkLoader();
        });
    }
    
    // Set up module integration with existing code
    setupModuleIntegration() {
        this.logger.log('Setting up module integration...');
        
        // Create shared context access
        window.sharedContext = SharedContext;
        
        // Ensure all global functions are available
        this.ensureGlobalFunctions();
        
        // Set up performance metric collection
        this.setupMetricCollection();
    }
    
    // Ensure required global functions exist
    ensureGlobalFunctions() {
        // These functions should exist in the original code
        const requiredFunctions = [
            'worldToScreen',
            'isInViewport',
            'drawEmoji',
            'spawnParticles',
            'playSound'
        ];
        
        requiredFunctions.forEach(func => {
            if (typeof window[func] !== 'function') {
                this.logger.warn(`Missing required function: ${func}`);
            }
        });
    }
    
    // Set up performance metric collection
    setupMetricCollection() {
        // Hook into existing systems for metrics
        const perf = this.systems.performance;
        
        // Override draw call tracking
        if (window.ctx && window.ctx.drawImage) {
            const originalDrawImage = window.ctx.drawImage;
            window.ctx.drawImage = function(...args) {
                perf.recordDrawCall();
                return originalDrawImage.apply(this, args);
            };
        }
        
        // Track entity counts
        setInterval(() => {
            if (window.snakes) {
                perf.updateEntityCount(
                    window.snakes.length + 
                    window.elements.length + 
                    window.bosses.length
                );
            }
            if (window.particles) {
                perf.updateParticleCount(window.particles.length);
            }
        }, 1000);
    }
    
    // Hook into the game loop
    hookGameLoop() {
        this.logger.log('Hooking into game loop...');
        
        // The performance system already hooks update and draw
        // Add additional hooks if needed
        
        // Hook collision detection
        if (window.checkCollisions) {
            const originalCheckCollisions = window.checkCollisions;
            window.checkCollisions = function(...args) {
                window.performanceSystem.beginSection('collision');
                const result = originalCheckCollisions.apply(this, args);
                window.performanceSystem.endSection('collision');
                return result;
            };
        }
        
        // Hook AI updates
        if (window.updateAI) {
            const originalUpdateAI = window.updateAI;
            window.updateAI = function(...args) {
                window.performanceSystem.beginSection('ai');
                const result = originalUpdateAI.apply(this, args);
                window.performanceSystem.endSection('ai');
                return result;
            };
        }
    }
    
    // Get initialization status
    getStatus() {
        return {
            initialized: this.initialized,
            systems: {
                performance: this.systems.performance?.initialized || false,
                mobile: this.systems.mobile?.initialized || false,
                entities: Object.keys(this.systems.entities).length
            }
        };
    }
}

// Create and export game initializer
const gameInitializer = new GameInitializer();

// Auto-initialize when imported
gameInitializer.init().catch(error => {
    console.error('Failed to initialize game:', error);
});

// Export for use in other modules
export default gameInitializer;
export { 
    GameInitializer,
    BorderParticle,
    Snake,
    Element,
    AlchemyVision,
    VoidOrb,
    CatalystGem,
    Particle,
    ParticlePool,
    ElementPool,
    ShootingStar,
    Boss,
    SharedContext,
    MobileUIManager,
    UnifiedPerformanceSystem
};

// Make initializer available globally
window.gameInitializer = gameInitializer;