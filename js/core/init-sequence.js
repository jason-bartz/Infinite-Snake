// Initialization Sequence for Infinite Snake
// Ensures all systems are initialized in the correct order

class InitializationSequence {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.completed = false;
        this.errors = [];
        
        // Define initialization steps
        this.defineSteps();
    }
    
    defineSteps() {
        this.steps = [
            {
                name: 'DOM Ready',
                description: 'Wait for DOM to be fully loaded',
                check: () => document.readyState !== 'loading',
                action: () => this.waitForDOM()
            },
            {
                name: 'Load Modules',
                description: 'Load all ES6 modules',
                check: () => window.moduleLoader && window.gameInitializer,
                action: () => this.waitForModules()
            },
            {
                name: 'Load Game Data',
                description: 'Load element data and assets',
                check: () => window.elementLoader && window.elementLoader.loaded,
                action: () => this.waitForGameData()
            },
            {
                name: 'Initialize Canvas',
                description: 'Set up game canvas and context',
                check: () => window.canvas && window.ctx,
                action: () => this.initializeCanvas()
            },
            {
                name: 'Initialize Performance',
                description: 'Start performance monitoring',
                check: () => window.performanceSystem && window.performanceSystem.initialized,
                action: () => this.initializePerformance()
            },
            {
                name: 'Initialize Mobile UI',
                description: 'Set up mobile interface if needed',
                check: () => !window.MobileUIManager || !MobileUIManager.isMobile() || 
                            (window.mobileUIManager && window.mobileUIManager.initialized),
                action: () => this.initializeMobileUI()
            },
            {
                name: 'Initialize Game State',
                description: 'Set up initial game state',
                check: () => window.gameState !== undefined,
                action: () => this.initializeGameState()
            },
            {
                name: 'Initialize Controls',
                description: 'Set up input handlers',
                check: () => window.handleKeyDown && window.handleKeyUp,
                action: () => this.initializeControls()
            },
            {
                name: 'Initialize Audio',
                description: 'Set up sound system',
                check: () => window.soundEffects || window.audioContext,
                action: () => this.initializeAudio()
            },
            {
                name: 'Start Game Loop',
                description: 'Begin main game loop',
                check: () => window.gameLoop || window.update,
                action: () => this.startGameLoop()
            }
        ];
    }
    
    // Start the initialization sequence
    async start() {
        // Starting Infinite Snake Initialization
        
        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];
            this.currentStep = i;
            
            try {
                // Executing step: ${step.name}
                
                // Check if already completed
                if (step.check()) {
                    // ${step.name} - Already initialized
                    continue;
                }
                
                // Execute action
                await step.action();
                
                // Verify completion
                if (step.check()) {
                    // ${step.name} - Complete
                } else {
                    throw new Error(`${step.name} failed verification`);
                }
                
            } catch (error) {
                console.error(`✗ ${step.name} - Failed:`, error);
                this.errors.push({ step: step.name, error });
                
                // Determine if critical
                if (this.isCriticalStep(step.name)) {
                    console.error('Critical initialization step failed. Stopping.');
                    throw error;
                }
            }
        }
        
        this.completed = true;
        // Initialization Complete
        
        // Dispatch completion event
        window.dispatchEvent(new CustomEvent('gameReady', {
            detail: { 
                steps: this.steps.length,
                errors: this.errors 
            }
        }));
    }
    
    // Individual step implementations
    
    waitForDOM() {
        return new Promise(resolve => {
            if (document.readyState !== 'loading') {
                resolve();
            } else {
                document.addEventListener('DOMContentLoaded', resolve);
            }
        });
    }
    
    waitForModules() {
        return new Promise((resolve, reject) => {
            if (window.gameInitializer) {
                resolve();
                return;
            }
            
            // Wait for modules to load
            const checkModules = () => {
                const status = window.getModuleStatus?.();
                if (status && status.errors.length > 0) {
                    reject(new Error('Module loading failed'));
                } else if (window.gameInitializer) {
                    resolve();
                } else {
                    setTimeout(checkModules, 100);
                }
            };
            
            checkModules();
        });
    }
    
    waitForGameData() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Game data loading timeout'));
            }, 30000); // 30 second timeout
            
            const checkData = () => {
                if (window.elementLoader && window.elementLoader.loaded) {
                    clearTimeout(timeout);
                    resolve();
                } else {
                    setTimeout(checkData, 100);
                }
            };
            
            checkData();
        });
    }
    
    initializeCanvas() {
        if (!window.canvas) {
            window.canvas = document.getElementById('gameCanvas') || 
                           document.querySelector('canvas');
        }
        
        if (!window.ctx && window.canvas) {
            window.ctx = window.canvas.getContext('2d');
        }
        
        if (!window.canvas || !window.ctx) {
            throw new Error('Failed to initialize canvas');
        }
    }
    
    initializePerformance() {
        if (!window.performanceSystem) {
            throw new Error('Performance system not loaded');
        }
        
        if (!window.performanceSystem.initialized) {
            window.performanceSystem.init();
        }
    }
    
    initializeMobileUI() {
        if (window.MobileUIManager && MobileUIManager.isMobile()) {
            if (!window.mobileUIManager) {
                window.mobileUIManager = new MobileUIManager();
            }
            
            if (!window.mobileUIManager.initialized) {
                window.mobileUIManager.init();
            }
        }
    }
    
    initializeGameState() {
        // Initialize game state variables if not present
        window.gameState = window.gameState || 'menu';
        window.gameStarted = window.gameStarted || false;
        window.gameOver = window.gameOver || false;
        window.paused = window.paused || false;
        window.score = window.score || 0;
        window.level = window.level || 1;
    }
    
    initializeControls() {
        // Controls should already be set up by original code
        // Just verify they exist
        if (!window.handleKeyDown || !window.handleKeyUp) {
            console.warn('Control handlers not found');
        }
    }
    
    initializeAudio() {
        // Audio is optional, don't fail if not present
        if (!window.soundEffects && !window.audioContext) {
            console.warn('Audio system not initialized');
        }
    }
    
    startGameLoop() {
        // Game loop should be started by original code
        // Just verify it exists
        if (!window.gameLoop && !window.update) {
            throw new Error('Game loop not found');
        }
    }
    
    // Check if a step is critical
    isCriticalStep(stepName) {
        const criticalSteps = [
            'DOM Ready',
            'Load Modules',
            'Initialize Canvas',
            'Start Game Loop'
        ];
        
        return criticalSteps.includes(stepName);
    }
    
    // Get current status
    getStatus() {
        return {
            currentStep: this.currentStep,
            totalSteps: this.steps.length,
            currentStepName: this.steps[this.currentStep]?.name || 'Complete',
            completed: this.completed,
            errors: this.errors,
            progress: this.currentStep / this.steps.length
        };
    }
}

// Create and expose initialization sequence
window.initSequence = new InitializationSequence();

// Auto-start when script loads
window.initSequence.start().catch(error => {
    console.error('Initialization failed:', error);
});

// Export for module usage
export default InitializationSequence;