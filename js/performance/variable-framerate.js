// Variable Frame Rate System
// Dynamically adjusts target FPS based on device performance

class VariableFrameRateSystem {
    constructor() {
        this.targetFPS = 60; // Default target
        this.currentFPS = 60;
        this.minFPS = 20; // Minimum acceptable FPS
        this.maxFPS = 60; // Maximum FPS
        
        // Device-specific targets
        this.deviceTargets = {
            low: 30,
            medium: 45,
            high: 60
        };
        
        // Frame timing
        this.fixedTimestep = 1000 / 60; // Base timestep (16.67ms)
        this.maxFrameTime = 1000 / this.minFPS; // Max frame time (50ms at 20 FPS)
        this.accumulator = 0;
        this.lastTime = 0;
        
        // Performance tracking
        this.frameHistory = new Array(30).fill(16.67);
        this.historyIndex = 0;
        this.avgFrameTime = 16.67;
        
        // Adaptive settings
        this.adaptiveEnabled = true;
        this.lastAdjustment = 0;
        this.adjustmentCooldown = 2000; // Wait 2 seconds between adjustments
        
        // Frame skipping
        this.skipFrames = false;
        this.skipCounter = 0;
        this.maxSkipFrames = 2;
        
        // Interpolation for smooth rendering
        this.interpolationAlpha = 0;
        this.enableInterpolation = true;
    }
    
    // Initialize with device tier
    init(deviceTier = 'medium') {
        this.targetFPS = this.deviceTargets[deviceTier] || 45;
        this.fixedTimestep = 1000 / this.targetFPS;
        
        // Adjust settings based on tier
        if (deviceTier === 'low') {
            this.enableInterpolation = false;
            this.maxSkipFrames = 3;
        } else if (deviceTier === 'high') {
            this.enableInterpolation = true;
            this.maxSkipFrames = 1;
        }
        
        console.log(`Variable FPS initialized: Target ${this.targetFPS} FPS for ${deviceTier} tier device`);
    }
    
    // Update frame timing
    update(currentTime) {
        if (this.lastTime === 0) {
            this.lastTime = currentTime;
            return { shouldUpdate: false, deltaTime: 0, interpolation: 0 };
        }
        
        const frameTime = Math.min(currentTime - this.lastTime, this.maxFrameTime);
        this.lastTime = currentTime;
        
        // Track frame time history
        this.frameHistory[this.historyIndex] = frameTime;
        this.historyIndex = (this.historyIndex + 1) % this.frameHistory.length;
        
        // Calculate average frame time
        this.avgFrameTime = this.frameHistory.reduce((a, b) => a + b) / this.frameHistory.length;
        this.currentFPS = 1000 / this.avgFrameTime;
        
        // Adaptive FPS adjustment
        if (this.adaptiveEnabled && currentTime - this.lastAdjustment > this.adjustmentCooldown) {
            this.adjustTargetFPS();
        }
        
        // Add to accumulator
        this.accumulator += frameTime;
        
        // Calculate how many fixed updates to perform
        let updates = 0;
        const maxUpdates = Math.ceil(this.maxFrameTime / this.fixedTimestep);
        
        while (this.accumulator >= this.fixedTimestep && updates < maxUpdates) {
            updates++;
            this.accumulator -= this.fixedTimestep;
        }
        
        // Calculate interpolation alpha for smooth rendering
        this.interpolationAlpha = this.enableInterpolation ? 
            this.accumulator / this.fixedTimestep : 1.0;
        
        // Frame skipping logic
        if (this.skipFrames && this.skipCounter < this.maxSkipFrames) {
            this.skipCounter++;
            return {
                shouldUpdate: updates > 0,
                shouldRender: false,
                updates: updates,
                deltaTime: this.fixedTimestep,
                interpolation: this.interpolationAlpha
            };
        } else {
            this.skipCounter = 0;
            return {
                shouldUpdate: updates > 0,
                shouldRender: true,
                updates: updates,
                deltaTime: this.fixedTimestep,
                interpolation: this.interpolationAlpha
            };
        }
    }
    
    // Adjust target FPS based on performance
    adjustTargetFPS() {
        const performanceRatio = this.currentFPS / this.targetFPS;
        
        if (performanceRatio < 0.8) {
            // Performance is poor, reduce target
            if (this.targetFPS > 30) {
                this.targetFPS = Math.max(30, this.targetFPS - 15);
                this.fixedTimestep = 1000 / this.targetFPS;
                this.skipFrames = true;
                console.log(`Reduced target FPS to ${this.targetFPS} due to poor performance`);
            }
        } else if (performanceRatio > 0.95 && this.avgFrameTime < 20) {
            // Performance is good, try to increase
            if (this.targetFPS < this.maxFPS) {
                this.targetFPS = Math.min(this.maxFPS, this.targetFPS + 15);
                this.fixedTimestep = 1000 / this.targetFPS;
                this.skipFrames = false;
                console.log(`Increased target FPS to ${this.targetFPS} due to good performance`);
            }
        }
        
        this.lastAdjustment = performance.now();
    }
    
    // Get interpolated position for smooth rendering
    getInterpolatedPosition(prevPos, currentPos, alpha = null) {
        if (!this.enableInterpolation) return currentPos;
        
        const t = alpha !== null ? alpha : this.interpolationAlpha;
        return {
            x: prevPos.x + (currentPos.x - prevPos.x) * t,
            y: prevPos.y + (currentPos.y - prevPos.y) * t
        };
    }
    
    // Force a specific FPS (for testing)
    setTargetFPS(fps) {
        this.targetFPS = Math.max(this.minFPS, Math.min(this.maxFPS, fps));
        this.fixedTimestep = 1000 / this.targetFPS;
        this.adaptiveEnabled = false;
        console.log(`Manual FPS set to ${this.targetFPS}`);
    }
    
    // Enable/disable adaptive FPS
    setAdaptive(enabled) {
        this.adaptiveEnabled = enabled;
    }
    
    // Get current stats
    getStats() {
        return {
            targetFPS: this.targetFPS,
            currentFPS: Math.round(this.currentFPS),
            avgFrameTime: this.avgFrameTime.toFixed(2),
            skipFrames: this.skipFrames,
            interpolation: this.enableInterpolation
        };
    }
}

// Create global instance
window.variableFrameRate = new VariableFrameRateSystem();

// Export for module usage
export default VariableFrameRateSystem;