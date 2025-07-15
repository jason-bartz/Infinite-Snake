// Module Loader for Infinite Snake
// This file provides a bridge for loading ES6 modules in index.html

(function() {
    'use strict';
    
    // Check if modules are supported
    const supportsModules = 'noModule' in HTMLScriptElement.prototype;
    
    if (!supportsModules) {
        console.warn('Browser does not support ES6 modules. Loading fallback...');
        // Could load a bundled version here
        return;
    }
    
    // Module loading configuration
    const MODULE_CONFIG = {
        basePath: '/js/',
        modules: [
            // Core modules
            { path: 'core/shared-context.js', name: 'SharedContext' },
            { path: 'core/game-main.js', name: 'GameMain', isMain: true },
            
            // Entity modules
            { path: 'core/entities/EasterEggElements.js', name: 'EasterEggElements' },
            
            // Performance modules
            { path: 'performance/debug-config.js', name: 'DebugConfig' },
            { path: 'performance/logger.js', name: 'Logger' },
            { path: 'performance/unified-performance-system.js', name: 'PerformanceSystem' },
            
            // Mobile modules
            { path: 'mobile/mobile-config.js', name: 'MobileConfig' },
            { path: 'mobile/mobile-ui-manager.js', name: 'MobileUI' }
        ],
        
        // Load order dependencies
        loadOrder: [
            'DebugConfig',
            'Logger',
            'SharedContext',
            'EasterEggElements',
            'MobileConfig',
            'PerformanceSystem',
            'MobileUI',
            'GameMain'
        ]
    };
    
    // Module loader class
    class ModuleLoader {
        constructor() {
            this.loaded = new Map();
            this.loading = new Map();
            this.errors = [];
        }
        
        // Load all modules
        async loadAll() {
            console.log('[ModuleLoader] Starting module load...');
            
            try {
                // Load modules in order
                for (const moduleName of MODULE_CONFIG.loadOrder) {
                    const moduleConfig = MODULE_CONFIG.modules.find(m => m.name === moduleName);
                    if (moduleConfig) {
                        await this.loadModule(moduleConfig);
                    }
                }
                
                console.log('[ModuleLoader] All modules loaded successfully');
                
                // Dispatch event when all modules are loaded
                window.dispatchEvent(new CustomEvent('modulesLoaded', {
                    detail: { 
                        loaded: Array.from(this.loaded.keys()),
                        errors: this.errors 
                    }
                }));
                
            } catch (error) {
                console.error('[ModuleLoader] Failed to load modules:', error);
                this.errors.push(error);
                
                // Dispatch error event
                window.dispatchEvent(new CustomEvent('moduleLoadError', {
                    detail: { error, errors: this.errors }
                }));
            }
        }
        
        // Load a single module
        async loadModule(config) {
            const { path, name } = config;
            
            // Check if already loaded
            if (this.loaded.has(name)) {
                return this.loaded.get(name);
            }
            
            // Check if currently loading
            if (this.loading.has(name)) {
                return this.loading.get(name);
            }
            
            console.log(`[ModuleLoader] Loading ${name}...`);
            
            // Create loading promise
            const loadPromise = this.importModule(path, name, config);
            this.loading.set(name, loadPromise);
            
            try {
                const module = await loadPromise;
                this.loaded.set(name, module);
                this.loading.delete(name);
                
                console.log(`[ModuleLoader] Loaded ${name}`);
                return module;
                
            } catch (error) {
                this.loading.delete(name);
                this.errors.push({ name, error });
                console.error(`[ModuleLoader] Failed to load ${name}:`, error);
                throw error;
            }
        }
        
        // Import module dynamically
        async importModule(path, name, config) {
            const fullPath = MODULE_CONFIG.basePath + path;
            
            try {
                const module = await import(fullPath);
                
                // Make main exports available globally if needed
                if (config.isMain && module.default) {
                    window[name] = module.default;
                }
                
                return module;
                
            } catch (error) {
                // Try alternative loading method
                return this.loadModuleFallback(fullPath, name);
            }
        }
        
        // Fallback loading method
        loadModuleFallback(path, name) {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.type = 'module';
                script.src = path;
                
                script.onload = () => {
                    // Module should have registered itself globally
                    resolve(window[name] || {});
                };
                
                script.onerror = () => {
                    reject(new Error(`Failed to load module: ${path}`));
                };
                
                document.head.appendChild(script);
            });
        }
        
        // Get loading status
        getStatus() {
            return {
                loaded: Array.from(this.loaded.keys()),
                loading: Array.from(this.loading.keys()),
                errors: this.errors,
                progress: this.loaded.size / MODULE_CONFIG.modules.length
            };
        }
    }
    
    // Create and expose module loader
    window.moduleLoader = new ModuleLoader();
    
    // Auto-load modules when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.moduleLoader.loadAll();
        });
    } else {
        // DOM already loaded
        window.moduleLoader.loadAll();
    }
    
    // Provide manual load function
    window.loadGameModules = function() {
        return window.moduleLoader.loadAll();
    };
    
    // Status function
    window.getModuleStatus = function() {
        return window.moduleLoader.getStatus();
    };
    
})();