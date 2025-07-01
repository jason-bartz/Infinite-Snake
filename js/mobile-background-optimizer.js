/**
 * Mobile Background Optimizer - Dynamic LOD system and battery-aware rendering
 */
class MobileBackgroundOptimizer {
    constructor() {
        this.performanceMetrics = {
            fps: 60,
            frameTime: 16.67,
            drawCalls: 0,
            batteryLevel: 1,
            isCharging: true
        };
        
        // LOD levels with quality settings
        this.lodLevels = {
            ultra_low: {
                stars: 0,
                planets: 0,
                grid: false,
                borders: 'static',
                particles: 0,
                canvasScale: 0.5
            },
            low: {
                stars: 30,
                planets: 0,
                grid: false,
                borders: 'static',
                particles: 10,
                canvasScale: 0.6
            },
            medium: {
                stars: 60,
                planets: 1,
                grid: true,
                borders: 'animated',
                particles: 25,
                canvasScale: 0.75
            },
            high: {
                stars: 100,
                planets: 2,
                grid: true,
                borders: 'animated',
                particles: 50,
                canvasScale: 0.85
            }
        };
        
        this.currentLOD = 'medium';
        this.targetLOD = 'medium';
        this.lodTransitionProgress = 1;
        
        // Performance thresholds
        this.thresholds = {
            upgrade: { fps: 55, frameTime: 18, battery: 0.3 },
            downgrade: { fps: 45, frameTime: 22, battery: 0.2 }
        };
        
        // Cached assets
        this.cachedAssets = null;
        
        // Battery monitoring
        this.batteryMonitoring = false;
        this.lastBatteryCheck = 0;
        
        // Visibility API
        this.isVisible = true;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Frame timing
        this.frameHistory = [];
        this.maxFrameHistory = 30;
        
        // Initialize
        this.initialize();
    }
    
    /**
     * Initialize optimizer systems
     */
    async initialize() {
        // Set up visibility API
        this.setupVisibilityAPI();
        
        // Set up battery monitoring
        await this.setupBatteryMonitoring();
        
        // Check device capabilities
        this.checkDeviceCapabilities();
        
        // Listen for reduced motion preference
        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
            this.reducedMotion = e.matches;
            if (e.matches) {
                this.setLOD('low');
            }
        });
    }
    
    /**
     * Setup visibility API for background throttling
     */
    setupVisibilityAPI() {
        const handleVisibilityChange = () => {
            this.isVisible = !document.hidden;
            console.log(`Mobile Background: Visibility changed to ${this.isVisible ? 'visible' : 'hidden'}`);
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also handle blur/focus for additional coverage
        window.addEventListener('blur', () => { this.isVisible = false; });
        window.addEventListener('focus', () => { this.isVisible = true; });
    }
    
    /**
     * Setup battery monitoring
     */
    async setupBatteryMonitoring() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                
                this.performanceMetrics.batteryLevel = battery.level;
                this.performanceMetrics.isCharging = battery.charging;
                
                // Battery level change
                battery.addEventListener('levelchange', () => {
                    this.performanceMetrics.batteryLevel = battery.level;
                    this.checkBatteryOptimizations();
                });
                
                // Charging state change
                battery.addEventListener('chargingchange', () => {
                    this.performanceMetrics.isCharging = battery.charging;
                    this.checkBatteryOptimizations();
                });
                
                this.batteryMonitoring = true;
                console.log('Mobile Background: Battery monitoring enabled');
            } catch (e) {
                console.log('Mobile Background: Battery API not available');
            }
        }
    }
    
    /**
     * Check device capabilities
     */
    checkDeviceCapabilities() {
        // Check GPU
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                console.log('Mobile Background: GPU:', renderer);
                
                // Detect low-end GPUs
                const lowEndGPUs = ['Mali-4', 'Adreno (TM) 3', 'PowerVR SGX'];
                const isLowEnd = lowEndGPUs.some(gpu => renderer.includes(gpu));
                
                if (isLowEnd) {
                    this.currentLOD = 'low';
                    console.log('Mobile Background: Low-end GPU detected, starting with low LOD');
                }
            }
        }
        
        // Check available memory
        if ('deviceMemory' in navigator) {
            const memory = navigator.deviceMemory;
            console.log(`Mobile Background: Device memory: ${memory}GB`);
            
            if (memory <= 2) {
                this.currentLOD = 'low';
            } else if (memory >= 6) {
                this.currentLOD = 'high';
            }
        }
        
        // Check connection type
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.saveData || connection.effectiveType === '2g') {
                this.currentLOD = 'low';
                console.log('Mobile Background: Data saver or slow connection detected');
            }
        }
    }
    
    /**
     * Update performance metrics
     */
    updateMetrics(frameTime) {
        // Don't update if not visible
        if (!this.isVisible) return;
        
        // Update frame history
        this.frameHistory.push(frameTime);
        if (this.frameHistory.length > this.maxFrameHistory) {
            this.frameHistory.shift();
        }
        
        // Calculate averages
        const avgFrameTime = this.frameHistory.reduce((a, b) => a + b, 0) / this.frameHistory.length;
        this.performanceMetrics.frameTime = avgFrameTime;
        this.performanceMetrics.fps = 1000 / avgFrameTime;
        
        // Check if we need to adjust LOD
        this.checkLODAdjustment();
    }
    
    /**
     * Check if LOD adjustment is needed
     */
    checkLODAdjustment() {
        // Don't adjust too frequently
        if (this.frameHistory.length < this.maxFrameHistory) return;
        
        const metrics = this.performanceMetrics;
        const thresholds = this.thresholds;
        
        // Check for downgrade
        if (metrics.fps < thresholds.downgrade.fps || 
            metrics.frameTime > thresholds.downgrade.frameTime) {
            
            if (this.currentLOD === 'high') {
                this.setLOD('medium');
            } else if (this.currentLOD === 'medium') {
                this.setLOD('low');
            } else if (this.currentLOD === 'low') {
                this.setLOD('ultra_low');
            }
        }
        // Check for upgrade
        else if (metrics.fps > thresholds.upgrade.fps && 
                 metrics.frameTime < thresholds.upgrade.frameTime &&
                 metrics.batteryLevel > thresholds.upgrade.battery) {
            
            if (this.currentLOD === 'ultra_low') {
                this.setLOD('low');
            } else if (this.currentLOD === 'low') {
                this.setLOD('medium');
            } else if (this.currentLOD === 'medium' && metrics.isCharging) {
                this.setLOD('high');
            }
        }
    }
    
    /**
     * Check battery-based optimizations
     */
    checkBatteryOptimizations() {
        const battery = this.performanceMetrics.batteryLevel;
        const isCharging = this.performanceMetrics.isCharging;
        
        // Force low power mode when battery is critical
        if (battery < 0.15 && !isCharging) {
            this.setLOD('ultra_low');
            console.log('Mobile Background: Critical battery, forcing ultra-low LOD');
        }
        // Reduce quality on low battery
        else if (battery < 0.3 && !isCharging && this.currentLOD === 'high') {
            this.setLOD('medium');
            console.log('Mobile Background: Low battery, reducing to medium LOD');
        }
    }
    
    /**
     * Set LOD level
     */
    setLOD(level) {
        if (this.currentLOD === level) return;
        
        console.log(`Mobile Background: Switching LOD from ${this.currentLOD} to ${level}`);
        
        this.targetLOD = level;
        this.lodTransitionProgress = 0;
        
        // Immediate update for critical changes
        if (level === 'ultra_low' || this.currentLOD === 'ultra_low') {
            this.currentLOD = level;
            this.lodTransitionProgress = 1;
        }
        
        // Notify renderer of LOD change
        if (window.mobileStarRenderer) {
            const settings = this.lodLevels[level];
            window.mobileStarRenderer.setPerformanceLevel(
                level === 'high' ? 'high' : 
                level === 'medium' ? 'medium' : 'low'
            );
        }
    }
    
    /**
     * Get current LOD settings
     */
    getCurrentSettings() {
        // Smooth transition between LOD levels
        if (this.lodTransitionProgress < 1) {
            this.lodTransitionProgress += 0.02; // 50 frames to transition
            
            if (this.lodTransitionProgress >= 1) {
                this.currentLOD = this.targetLOD;
                this.lodTransitionProgress = 1;
            }
        }
        
        return this.lodLevels[this.currentLOD];
    }
    
    /**
     * Should render background elements
     */
    shouldRender(element) {
        // Don't render anything if not visible
        if (!this.isVisible) return false;
        
        const settings = this.getCurrentSettings();
        
        switch (element) {
            case 'stars':
                return settings.stars > 0;
            case 'planets':
                return settings.planets > 0;
            case 'grid':
                return settings.grid;
            case 'borders':
                return settings.borders !== 'none';
            case 'particles':
                return settings.particles > 0;
            default:
                return true;
        }
    }
    
    /**
     * Get optimized canvas scale
     */
    getCanvasScale() {
        const settings = this.getCurrentSettings();
        return settings.canvasScale;
    }
    
    /**
     * Start frame timing
     */
    startFrame() {
        this.frameStartTime = performance.now();
        this.performanceMetrics.drawCalls = 0;
    }
    
    /**
     * End frame timing
     */
    endFrame() {
        const frameTime = performance.now() - this.frameStartTime;
        this.updateMetrics(frameTime);
    }
    
    /**
     * Increment draw call counter
     */
    incrementDrawCalls() {
        this.performanceMetrics.drawCalls++;
    }
    
    /**
     * Get performance report
     */
    getPerformanceReport() {
        return {
            currentLOD: this.currentLOD,
            fps: Math.round(this.performanceMetrics.fps),
            frameTime: this.performanceMetrics.frameTime.toFixed(2),
            drawCalls: this.performanceMetrics.drawCalls,
            batteryLevel: Math.round(this.performanceMetrics.batteryLevel * 100),
            isCharging: this.performanceMetrics.isCharging,
            isVisible: this.isVisible
        };
    }
    
    /**
     * Force specific LOD (for testing)
     */
    forceLOD(level) {
        if (this.lodLevels[level]) {
            this.currentLOD = level;
            this.targetLOD = level;
            this.lodTransitionProgress = 1;
            console.log(`Mobile Background: Forced LOD to ${level}`);
        }
    }
}

// Battery optimization helper
class BatteryOptimizer {
    static async init() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                
                // Create global battery state
                window.batteryState = {
                    level: battery.level,
                    charging: battery.charging,
                    lowPowerMode: battery.level < 0.2 && !battery.charging
                };
                
                // Update on changes
                battery.addEventListener('levelchange', () => {
                    window.batteryState.level = battery.level;
                    window.batteryState.lowPowerMode = battery.level < 0.2 && !battery.charging;
                });
                
                battery.addEventListener('chargingchange', () => {
                    window.batteryState.charging = battery.charging;
                    window.batteryState.lowPowerMode = battery.level < 0.2 && !battery.charging;
                });
                
                return true;
            } catch (e) {
                console.log('Battery API not available');
            }
        }
        return false;
    }
    
    static isLowPowerMode() {
        return window.batteryState?.lowPowerMode || false;
    }
    
    static getBatteryLevel() {
        return window.batteryState?.level || 1;
    }
    
    static isCharging() {
        return window.batteryState?.charging || true;
    }
}

// Export for use in main game
window.MobileBackgroundOptimizer = MobileBackgroundOptimizer;
window.BatteryOptimizer = BatteryOptimizer;