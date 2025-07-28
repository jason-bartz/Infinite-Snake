// Unified Performance System for Infinite Snake
// Consolidates multiple performance monitoring and optimization systems into one

import DEBUG_CONFIG from './debug-config.js';

class UnifiedPerformanceSystem {
    constructor() {
        this.initialized = false;
        this.debug = window.DEBUG_CONFIG || DEBUG_CONFIG;
        
        // Performance metrics
        this.metrics = {
            fps: 60,
            frameTime: 16.67,
            avgFps: 60,
            minFps: 60,
            maxFps: 60,
            
            // Section timings
            sections: {
                update: { time: 0, count: 0 },
                render: { time: 0, count: 0 },
                collision: { time: 0, count: 0 },
                ai: { time: 0, count: 0 },
                particles: { time: 0, count: 0 },
                physics: { time: 0, count: 0 }
            },
            
            // Rendering stats
            drawCalls: 0,
            triangles: 0,
            textureSwaps: 0,
            activeParticles: 0,
            visibleElements: 0,
            
            // Game stats
            entityCount: 0,
            collisionChecks: 0,
            aiUpdates: 0
        };
        
        // Performance history
        this.history = {
            fps: new Array(60).fill(60),
            frameTime: new Array(60).fill(16.67),
            index: 0
        };
        
        // Quality settings
        this.quality = {
            current: 'high',
            auto: true,
            levels: {
                low: {
                    particles: 0.3,
                    shadows: false,
                    effects: 0.5,
                    renderDistance: 0.7,
                    elementDetails: false
                },
                medium: {
                    particles: 0.7,
                    shadows: false,
                    effects: 0.8,
                    renderDistance: 0.85,
                    elementDetails: true
                },
                high: {
                    particles: 1.0,
                    shadows: true,
                    effects: 1.0,
                    renderDistance: 1.0,
                    elementDetails: true
                }
            }
        };
        
        // Optimization features
        this.optimizations = {
            webglEnabled: false,
            quadtreeEnabled: true,
            aiCaching: true,
            batchRendering: true,
            objectPooling: true,
            temporalCoherence: true
        };
        
        // Frame timing
        this.frame = {
            start: 0,
            last: 0,
            delta: 0,
            accumulator: 0,
            count: 0
        };
        
        // Display overlay
        this.overlay = null;
        this.overlayEnabled = false;
        
        // Device capabilities
        this.device = {
            type: 'unknown',
            gpu: 'unknown',
            cores: navigator.hardwareConcurrency || 4,
            memory: navigator.deviceMemory || 4,
            connection: navigator.connection?.effectiveType || 'unknown'
        };
        
        // Subsystems
        this.subsystems = new Map();
        
        // Events
        this.listeners = new Map();
    }
    
    // Initialize the performance system
    init() {
        if (this.initialized) return;
        
        this.log('Initializing Unified Performance System...');
        
        // Detect device capabilities
        this.detectDevice();
        
        // Initialize subsystems
        this.initializeSubsystems();
        
        // Hook into game loop
        this.hookGameLoop();
        
        // Create performance overlay if enabled
        if (this.debug.showPerformanceOverlay) {
            this.createOverlay();
        }
        
        // Set initial quality based on device
        this.autoDetectQuality();
        
        this.initialized = true;
        this.log('Unified Performance System initialized');
    }
    
    // Detect device type and capabilities
    detectDevice() {
        const ua = navigator.userAgent;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
        const isTablet = /iPad|Android.*Tablet/i.test(ua);
        
        // Detect GPU (WebGL)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            // Use RENDERER instead of deprecated WEBGL_debug_renderer_info
            try {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    this.device.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            } catch (e) {
                // Fallback for browsers where WEBGL_debug_renderer_info is unavailable
                this.device.gpu = gl.getParameter(gl.RENDERER);
            }
        }
        
        // Determine device type
        if (isMobile && !isTablet) {
            this.device.type = 'mobile';
        } else if (isTablet) {
            this.device.type = 'tablet';
        } else {
            this.device.type = 'desktop';
        }
        
        this.log(`Device detected: ${this.device.type}`, this.device);
    }
    
    // Initialize subsystems
    initializeSubsystems() {
        // Register existing systems if available
        if (window.webglRenderer) {
            this.registerSubsystem('webgl', window.webglRenderer);
            this.optimizations.webglEnabled = true;
        }
        
        if (window.collisionSystem) {
            this.registerSubsystem('collision', window.collisionSystem);
        }
        
        if (window.quadtree) {
            this.registerSubsystem('quadtree', window.quadtree);
        }
        
        if (window.gpuParticleSystem) {
            this.registerSubsystem('gpuParticles', window.gpuParticleSystem);
        }
    }
    
    // Hook into the game loop
    hookGameLoop() {
        const originalUpdate = window.update;
        const originalDraw = window.draw;
        
        if (originalUpdate) {
            window.update = (deltaTime) => {
                this.beginFrame();
                this.beginSection('update');
                originalUpdate(deltaTime);
                this.endSection('update');
                this.endFrame();
            };
        }
        
        if (originalDraw) {
            window.draw = () => {
                this.beginSection('render');
                originalDraw();
                this.endSection('render');
            };
        }
    }
    
    // Register a subsystem
    registerSubsystem(name, system) {
        this.subsystems.set(name, system);
        this.log(`Registered subsystem: ${name}`);
    }
    
    // Frame timing
    beginFrame() {
        this.frame.start = performance.now();
        this.frame.delta = this.frame.start - this.frame.last;
        this.frame.last = this.frame.start;
        
        // Reset per-frame counters
        this.metrics.drawCalls = 0;
        this.metrics.triangles = 0;
        this.metrics.textureSwaps = 0;
        this.metrics.collisionChecks = 0;
    }
    
    endFrame() {
        const frameTime = performance.now() - this.frame.start;
        this.frame.accumulator += frameTime;
        this.frame.count++;
        
        // Update metrics every 10 frames
        if (this.frame.count >= 10) {
            const avgFrameTime = this.frame.accumulator / this.frame.count;
            this.metrics.frameTime = avgFrameTime;
            this.metrics.fps = 1000 / avgFrameTime;
            
            // Update history
            this.history.fps[this.history.index] = this.metrics.fps;
            this.history.frameTime[this.history.index] = avgFrameTime;
            this.history.index = (this.history.index + 1) % this.history.fps.length;
            
            // Calculate averages
            this.metrics.avgFps = this.history.fps.reduce((a, b) => a + b) / this.history.fps.length;
            this.metrics.minFps = Math.min(...this.history.fps);
            this.metrics.maxFps = Math.max(...this.history.fps);
            
            // Auto adjust quality
            if (this.quality.auto) {
                this.checkQualityAdjustment();
            }
            
            // Update overlay
            if (this.overlayEnabled) {
                this.updateOverlay();
            }
            
            // Reset accumulator
            this.frame.accumulator = 0;
            this.frame.count = 0;
        }
    }
    
    // Section timing
    beginSection(name) {
        if (this.metrics.sections[name]) {
            this.metrics.sections[name].start = performance.now();
        }
    }
    
    endSection(name) {
        if (this.metrics.sections[name] && this.metrics.sections[name].start) {
            const elapsed = performance.now() - this.metrics.sections[name].start;
            this.metrics.sections[name].time += elapsed;
            this.metrics.sections[name].count++;
        }
    }
    
    // Quality adjustment
    checkQualityAdjustment() {
        const targetFps = 30; // Minimum acceptable FPS
        const highThreshold = 55; // Threshold to increase quality
        
        if (this.metrics.avgFps < targetFps && this.quality.current !== 'low') {
            this.decreaseQuality();
        } else if (this.metrics.avgFps > highThreshold && this.quality.current !== 'high') {
            // Only increase if consistently high
            const recentFps = this.history.fps.slice(-10);
            if (recentFps.every(fps => fps > highThreshold)) {
                this.increaseQuality();
            }
        }
    }
    
    decreaseQuality() {
        const levels = ['high', 'medium', 'low'];
        const currentIndex = levels.indexOf(this.quality.current);
        if (currentIndex < levels.length - 1) {
            this.setQuality(levels[currentIndex + 1]);
        }
    }
    
    increaseQuality() {
        const levels = ['high', 'medium', 'low'];
        const currentIndex = levels.indexOf(this.quality.current);
        if (currentIndex > 0) {
            this.setQuality(levels[currentIndex - 1]);
        }
    }
    
    setQuality(level) {
        if (this.quality.levels[level] && level !== this.quality.current) {
            const oldLevel = this.quality.current;
            this.quality.current = level;
            
            // Apply quality settings
            const settings = this.quality.levels[level];
            
            // Update game settings
            if (window.particleMultiplier !== undefined) {
                window.particleMultiplier = settings.particles;
            }
            
            if (window.shadowsEnabled !== undefined) {
                window.shadowsEnabled = settings.shadows;
            }
            
            if (window.effectsMultiplier !== undefined) {
                window.effectsMultiplier = settings.effects;
            }
            
            if (window.renderDistance !== undefined) {
                window.renderDistance = settings.renderDistance;
            }
            
            this.log(`Quality changed: ${oldLevel} -> ${level}`);
            this.emit('qualityChanged', { oldLevel, newLevel: level, settings });
        }
    }
    
    // Auto detect initial quality
    autoDetectQuality() {
        let quality = 'high';
        
        // Mobile devices start at medium
        if (this.device.type === 'mobile') {
            quality = 'medium';
        } else if (this.device.type === 'tablet') {
            quality = 'medium';
        }
        
        // Low-end devices
        if (this.device.cores < 4 || this.device.memory < 4) {
            quality = 'low';
        }
        
        // Poor connection
        if (this.device.connection === '2g' || this.device.connection === 'slow-2g') {
            quality = 'low';
        }
        
        this.setQuality(quality);
    }
    
    // Performance overlay
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.id = 'performance-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            pointer-events: none;
            min-width: 200px;
        `;
        
        document.body.appendChild(this.overlay);
        this.overlayEnabled = true;
    }
    
    updateOverlay() {
        if (!this.overlay) return;
        
        const html = `
            <div style="font-weight: bold; margin-bottom: 5px;">PERFORMANCE</div>
            <div>FPS: ${Math.round(this.metrics.fps)} (${Math.round(this.metrics.avgFps)} avg)</div>
            <div>Frame: ${this.metrics.frameTime.toFixed(2)}ms</div>
            <div>Quality: ${this.quality.current}</div>
            <div style="margin-top: 5px; font-weight: bold;">RENDERING</div>
            <div>Draw Calls: ${this.metrics.drawCalls}</div>
            <div>Triangles: ${this.metrics.triangles}</div>
            <div>Particles: ${this.metrics.activeParticles}</div>
            <div style="margin-top: 5px; font-weight: bold;">GAME</div>
            <div>Entities: ${this.metrics.entityCount}</div>
            <div>Collisions: ${this.metrics.collisionChecks}</div>
            <div>AI Updates: ${this.metrics.aiUpdates}</div>
        `;
        
        this.overlay.innerHTML = html;
    }
    
    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    }
    
    // Logging with debug control
    log(...args) {
        if (this.debug.enableLogging) {
            console.log('[Performance]', ...args);
        }
    }
    
    // Public API for metric updates
    recordDrawCall(triangles = 0) {
        this.metrics.drawCalls++;
        this.metrics.triangles += triangles;
    }
    
    recordTextureSwap() {
        this.metrics.textureSwaps++;
    }
    
    recordCollisionCheck() {
        this.metrics.collisionChecks++;
    }
    
    recordAIUpdate() {
        this.metrics.aiUpdates++;
    }
    
    updateEntityCount(count) {
        this.metrics.entityCount = count;
    }
    
    updateParticleCount(count) {
        this.metrics.activeParticles = count;
    }
    
    // Get current performance report
    getReport() {
        return {
            fps: this.metrics.fps,
            avgFps: this.metrics.avgFps,
            quality: this.quality.current,
            device: this.device.type,
            optimizations: this.optimizations,
            metrics: { ...this.metrics }
        };
    }
    
    // Enable/disable features
    setOptimization(feature, enabled) {
        if (this.optimizations.hasOwnProperty(feature)) {
            this.optimizations[feature] = enabled;
            this.log(`${feature}: ${enabled ? 'enabled' : 'disabled'}`);
            
            // Apply changes
            switch (feature) {
                case 'webglEnabled':
                    if (window.webglRenderer) {
                        window.useWebGLRenderer = enabled;
                    }
                    break;
                case 'quadtreeEnabled':
                    if (window.quadtree) {
                        window.useQuadtree = enabled;
                    }
                    break;
                case 'aiCaching':
                    if (window.aiCacheEnabled !== undefined) {
                        window.aiCacheEnabled = enabled;
                    }
                    break;
            }
        }
    }
    
    // Cleanup
    destroy() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        this.listeners.clear();
        this.subsystems.clear();
        this.initialized = false;
    }
}

// Create global instance
window.performanceSystem = new UnifiedPerformanceSystem();

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.performanceSystem.init();
    });
} else {
    window.performanceSystem.init();
}

export default UnifiedPerformanceSystem;