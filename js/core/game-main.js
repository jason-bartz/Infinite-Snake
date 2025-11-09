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
import SpaceshipManager from './entities/SpaceshipManager.js';
import SharedContext from './shared-context.js';
import MobileUIManager from '../mobile/mobile-ui-manager.js';
import MOBILE_UI_CONFIG from '../mobile/mobile-config.js';
import UnifiedPerformanceSystem from '../performance/unified-performance-system.js';
import DEBUG_CONFIG from '../performance/debug-config.js';
import { loggers, overrideConsole } from '../performance/logger.js';

class GameInitializer {
    constructor() {
        this.initialized = false;
        this.systems = {
            performance: null,
            mobile: null,
            entities: {}
        };
        this.logger = loggers.gameState;
    }
    
    async init() {
        if (this.initialized) {
            this.logger.warn('Game already initialized');
            return;
        }
        
        this.logger.log('Starting game initialization...');
        
        try {
            this.initializeDebugSystem();
            await this.waitForDOM();
            this.initializePerformanceSystem();
            this.initializeMobileUI();
            this.registerEntityClasses();
            await this.initializeGameSystems();
            this.setupModuleIntegration();
            this.hookGameLoop();
            
            this.initialized = true;
            this.logger.log('Game initialization complete');
            
            window.dispatchEvent(new CustomEvent('gameInitialized', {
                detail: { systems: this.systems }
            }));
            
        } catch (error) {
            this.logger.error('Failed to initialize game:', error);
            throw error;
        }
    }
    
    initializeDebugSystem() {
        window.DEBUG_CONFIG = DEBUG_CONFIG;
        window.Debug = window.Debug || {};
        
        if (DEBUG_CONFIG.enabled && DEBUG_CONFIG.enableLogging) {
            this.logger.log('Debug mode enabled');
        } else {
            overrideConsole();
        }
    }
    
    waitForDOM() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    initializePerformanceSystem() {
        this.logger.log('Initializing performance system...');
        
        this.systems.performance = window.performanceSystem || new UnifiedPerformanceSystem();
        
        if (!this.systems.performance.initialized) {
            this.systems.performance.init();
        }
        
        this.systems.performance.on('qualityChanged', (data) => {
            this.logger.log('Quality changed:', data);
            window.dispatchEvent(new CustomEvent('qualityChanged', { detail: data }));
        });
    }
    
    initializeMobileUI() {
        if (MobileUIManager.isMobile()) {
            this.logger.log('Initializing mobile UI...');
            
            this.systems.mobile = window.mobileUIManager || new MobileUIManager();
            this.systems.mobile.config = window.MOBILE_UI_CONFIG || MOBILE_UI_CONFIG;
            
            if (!this.systems.mobile.initialized) {
                this.systems.mobile.init();
            }
        }
    }
    
    registerEntityClasses() {
        this.logger.log('Registering entity classes...');
        
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
    
    async initializeGameSystems() {
        this.logger.log('Initializing game systems...');
        
        if (!window.elementLoader) {
            await this.waitForElementLoader();
        }
        
        if (!window.particlePool) {
            window.particlePool = new ParticlePool();
            this.logger.log('Created particle pool');
        }
        
        if (!window.elementPool) {
            window.elementPool = new ElementPool();
            this.logger.log('Created element pool');
        }
        
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
    
    setupModuleIntegration() {
        this.logger.log('Setting up module integration...');
        
        window.sharedContext = SharedContext;
        this.ensureGlobalFunctions();
        this.setupMetricCollection();
    }
    
    ensureGlobalFunctions() {
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
    
    setupMetricCollection() {
        const perf = this.systems.performance;
        
        if (window.ctx && window.ctx.drawImage) {
            const originalDrawImage = window.ctx.drawImage;
            window.ctx.drawImage = function(...args) {
                perf.recordDrawCall();
                return originalDrawImage.apply(this, args);
            };
        }
        
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
    
    hookGameLoop() {
        this.hookFunction('checkCollisions', 'collision');
        this.hookFunction('updateAI', 'ai');
    }
    
    hookFunction(functionName, sectionName) {
        if (window[functionName]) {
            const original = window[functionName];
            window[functionName] = function(...args) {
                if (window.performanceSystem) {
                    window.performanceSystem.beginSection(sectionName);
                    const result = original.apply(this, args);
                    window.performanceSystem.endSection(sectionName);
                    return result;
                }
                return original.apply(this, args);
            };
        }
    }
    
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

const gameInitializer = new GameInitializer();

gameInitializer.init().catch(error => {
    console.error('Failed to initialize game:', error);
});

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
    SharedContext,
    MobileUIManager,
    UnifiedPerformanceSystem
};

window.gameInitializer = gameInitializer;