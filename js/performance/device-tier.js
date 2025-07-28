// Device Performance Tier Detection System
// Classifies devices into performance tiers for adaptive quality settings

class DeviceTierDetector {
    constructor() {
        this.tier = 'medium'; // default
        this.benchmarkResults = {
            fps: [],
            memory: null,
            gpu: null,
            cores: null
        };
        this.detectionComplete = false;
        this.callbacks = [];
    }

    // Initialize and detect device capabilities
    async detect() {
        if (this.detectionComplete) return this.tier;

        try {
            // 1. Check hardware capabilities
            this.detectHardware();

            // 2. Run performance benchmark
            await this.runBenchmark();

            // 3. Determine tier based on results
            this.tier = this.calculateTier();
            this.detectionComplete = true;

            // Notify callbacks
            this.callbacks.forEach(cb => cb(this.tier));

            // Log results
            if (window.gameLogger) {
                window.gameLogger.info('DEVICE_TIER', `Device classified as: ${this.tier}`, this.benchmarkResults);
            }

            return this.tier;
        } catch (error) {
            console.error('Device tier detection failed:', error);
            return 'medium'; // fallback
        }
    }

    // Detect hardware capabilities
    detectHardware() {
        // CPU cores
        this.benchmarkResults.cores = navigator.hardwareConcurrency || 2;

        // Memory (if available)
        if (navigator.deviceMemory) {
            this.benchmarkResults.memory = navigator.deviceMemory;
        }

        // GPU detection (basic)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            // Use RENDERER instead of deprecated WEBGL_debug_renderer_info
            try {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    this.benchmarkResults.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                }
            } catch (e) {
                // Fallback for browsers where WEBGL_debug_renderer_info is unavailable
                this.benchmarkResults.gpu = gl.getParameter(gl.RENDERER);
            }
        }

        // Check for specific low-end device indicators
        const userAgent = navigator.userAgent.toLowerCase();
        this.benchmarkResults.isOldDevice = this.checkOldDevice(userAgent);
    }

    // Check for known old/low-end devices
    checkOldDevice(userAgent) {
        const oldDevicePatterns = [
            /android 4/i,
            /android 5/i,
            /android 6/i,
            /iphone [4-6]s?[^0-9]/i,
            /ipad (mini |air )?[1-3]/i,
            /samsung.*sm-[gj]/i, // Old Samsung devices
        ];

        return oldDevicePatterns.some(pattern => pattern.test(userAgent));
    }

    // Run performance benchmark
    async runBenchmark() {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        const frames = 60;
        const startTime = performance.now();

        // Simple rendering benchmark
        for (let i = 0; i < frames; i++) {
            ctx.fillStyle = `hsl(${i * 6}, 50%, 50%)`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw some shapes
            for (let j = 0; j < 20; j++) {
                ctx.beginPath();
                ctx.arc(
                    Math.random() * canvas.width,
                    Math.random() * canvas.height,
                    10 + Math.random() * 20,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }

            // Simulate emoji rendering
            ctx.font = '20px Arial';
            ctx.fillText('🐍', Math.random() * 380, Math.random() * 380);
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgFrameTime = totalTime / frames;
        const estimatedFPS = 1000 / avgFrameTime;

        this.benchmarkResults.fps.push(estimatedFPS);
        this.benchmarkResults.benchmarkTime = totalTime;
    }

    // Calculate device tier based on benchmark results
    calculateTier() {
        const fps = this.benchmarkResults.fps[0] || 60;
        const cores = this.benchmarkResults.cores || 2;
        const memory = this.benchmarkResults.memory || 2;
        const isOld = this.benchmarkResults.isOldDevice;

        // Scoring system
        let score = 0;

        // FPS score (0-40 points)
        if (fps >= 50) score += 40;
        else if (fps >= 30) score += 25;
        else if (fps >= 20) score += 10;
        else score += 5;

        // CPU cores score (0-30 points)
        if (cores >= 8) score += 30;
        else if (cores >= 4) score += 20;
        else if (cores >= 2) score += 10;
        else score += 5;

        // Memory score (0-30 points)
        if (memory >= 8) score += 30;
        else if (memory >= 4) score += 20;
        else if (memory >= 2) score += 10;
        else score += 5;

        // Penalty for old devices
        if (isOld) score -= 20;

        // Determine tier
        if (score >= 70) return 'high';
        else if (score >= 40) return 'medium';
        else return 'low';
    }

    // Get quality settings for current tier
    getQualitySettings() {
        const settings = {
            low: {
                particles: 0.2,
                particlePoolSize: 20,
                shadows: false,
                gradients: false,
                effects: 0.3,
                renderDistance: 0.6,
                elementDetails: false,
                targetFPS: 30,
                emojiCacheSize: 300,
                enableBlur: false,
                simplifiedRendering: true
            },
            medium: {
                particles: 0.5,
                particlePoolSize: 35,
                shadows: false,
                gradients: true,
                effects: 0.7,
                renderDistance: 0.8,
                elementDetails: true,
                targetFPS: 45,
                emojiCacheSize: 400,
                enableBlur: false,
                simplifiedRendering: false
            },
            high: {
                particles: 1.0,
                particlePoolSize: 50,
                shadows: true,
                gradients: true,
                effects: 1.0,
                renderDistance: 1.0,
                elementDetails: true,
                targetFPS: 60,
                emojiCacheSize: 500,
                enableBlur: true,
                simplifiedRendering: false
            }
        };

        return settings[this.tier] || settings.medium;
    }

    // Register callback for when detection completes
    onDetectionComplete(callback) {
        if (this.detectionComplete) {
            callback(this.tier);
        } else {
            this.callbacks.push(callback);
        }
    }

    // Force a specific tier (for testing/user preference)
    setTier(tier) {
        if (['low', 'medium', 'high'].includes(tier)) {
            this.tier = tier;
            this.detectionComplete = true;
            this.callbacks.forEach(cb => cb(this.tier));
        }
    }
}

// Create global instance
window.deviceTierDetector = new DeviceTierDetector();

// Export for module usage
export default DeviceTierDetector;