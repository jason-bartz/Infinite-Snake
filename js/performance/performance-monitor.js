class PerformanceMonitor {
    constructor() {
        this.fps = 0;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.lastFpsUpdate = 0;
        this.renderTimes = [];
        this.maxSamples = 60;
        
        // Performance metrics
        this.metrics = {
            fps: 0,
            avgRenderTime: 0,
            maxRenderTime: 0,
            minFps: Infinity,
            maxFps: 0,
            droppedFrames: 0,
            totalFrames: 0,
            canvasOperations: 0,
            domUpdates: 0
        };
        
        // Browser detection
        this.isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        // Performance marks
        this.marks = new Map();
        
        // Initialize display if in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.initDisplay();
        }
    }
    
    initDisplay() {
        const display = document.createElement('div');
        display.id = 'performance-monitor';
        display.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            border-radius: 5px;
            z-index: 10000;
            min-width: 200px;
            pointer-events: none;
            display: none;
        `;
        document.body.appendChild(display);
        this.display = display;
        
        // Toggle with keyboard shortcut (Shift + P)
        document.addEventListener('keydown', (e) => {
            if (e.shiftKey && e.key === 'P') {
                this.toggleDisplay();
            }
        });
    }
    
    toggleDisplay() {
        if (this.display) {
            this.display.style.display = this.display.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    startFrame() {
        this.frameStartTime = performance.now();
        this.frameCanvasOps = 0;
        this.frameDomOps = 0;
    }
    
    endFrame() {
        const now = performance.now();
        const renderTime = now - this.frameStartTime;
        
        this.renderTimes.push(renderTime);
        if (this.renderTimes.length > this.maxSamples) {
            this.renderTimes.shift();
        }
        
        // Update metrics
        this.metrics.totalFrames++;
        this.metrics.canvasOperations += this.frameCanvasOps;
        this.metrics.domUpdates += this.frameDomOps;
        
        // Check for dropped frames (> 16.67ms for 60fps)
        if (renderTime > 16.67) {
            this.metrics.droppedFrames++;
        }
        
        // Update FPS every 500ms
        if (now - this.lastFpsUpdate > 500) {
            this.updateFPS(now);
        }
    }
    
    updateFPS(now) {
        const delta = now - this.lastTime;
        this.fps = Math.round((this.frameCount * 1000) / delta);
        
        // Update metrics
        this.metrics.fps = this.fps;
        this.metrics.minFps = Math.min(this.metrics.minFps, this.fps);
        this.metrics.maxFps = Math.max(this.metrics.maxFps, this.fps);
        
        // Calculate average render time
        if (this.renderTimes.length > 0) {
            const sum = this.renderTimes.reduce((a, b) => a + b, 0);
            this.metrics.avgRenderTime = sum / this.renderTimes.length;
            this.metrics.maxRenderTime = Math.max(...this.renderTimes);
        }
        
        // Update display
        this.updateDisplay();
        
        // Reset counters
        this.frameCount = 0;
        this.lastTime = now;
        this.lastFpsUpdate = now;
    }
    
    updateDisplay() {
        if (this.display && this.display.style.display !== 'none') {
            const dropRate = ((this.metrics.droppedFrames / this.metrics.totalFrames) * 100).toFixed(1);
            const avgOpsPerFrame = (this.metrics.canvasOperations / this.metrics.totalFrames).toFixed(0);
            
            this.display.innerHTML = `
                <div><strong>Performance Monitor</strong></div>
                <div>FPS: ${this.metrics.fps} (${this.metrics.minFps}-${this.metrics.maxFps})</div>
                <div>Render: ${this.metrics.avgRenderTime.toFixed(2)}ms</div>
                <div>Max: ${this.metrics.maxRenderTime.toFixed(2)}ms</div>
                <div>Dropped: ${dropRate}%</div>
                <div>Canvas Ops/Frame: ${avgOpsPerFrame}</div>
                <div>Browser: ${this.isSafari ? 'Safari' : 'Other'}</div>
                ${this.isIOS ? '<div>Platform: iOS</div>' : ''}
            `;
        }
    }
    
    // Performance marking functions
    mark(name) {
        this.marks.set(name, performance.now());
    }
    
    measure(name, startMark) {
        const startTime = this.marks.get(startMark);
        if (startTime) {
            const duration = performance.now() - startTime;
            console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
            return duration;
        }
        return 0;
    }
    
    // Track canvas operations
    trackCanvasOperation() {
        this.frameCanvasOps++;
    }
    
    // Track DOM updates
    trackDOMUpdate() {
        this.frameDomOps++;
    }
    
    // Get performance report
    getReport() {
        return {
            ...this.metrics,
            browser: this.isSafari ? 'Safari' : 'Other',
            platform: this.isIOS ? 'iOS' : 'Desktop',
            timestamp: new Date().toISOString()
        };
    }
    
    // Log performance report
    logReport() {
        console.log('=== Performance Report ===');
        console.log(JSON.stringify(this.getReport(), null, 2));
    }
}

// Create global instance
window.performanceMonitor = new PerformanceMonitor();