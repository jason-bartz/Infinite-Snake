/**
 * Mobile Star Renderer - Optimized star field rendering for mobile devices
 * Supports both WebGL and Canvas2D with automatic fallback
 */
class MobileStarRenderer {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.options = {
            maxStars: options.maxStars || 100,
            useTwinkle: options.useTwinkle !== false,
            useParallax: options.useParallax !== false,
            renderMode: options.renderMode || 'auto', // 'webgl', 'canvas2d', 'auto'
            ...options
        };
        
        this.stars = [];
        this.shootingStars = [];
        this.planets = [];
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.fps = 60;
        this.fpsHistory = [];
        
        // Performance levels
        this.performanceLevel = 'high'; // 'low', 'medium', 'high'
        this.performanceLevels = {
            low: { stars: 30, twinkle: false, parallax: false, planets: 0 },
            medium: { stars: 60, twinkle: true, parallax: false, planets: 1 },
            high: { stars: 100, twinkle: true, parallax: true, planets: 2 }
        };
        
        // Try to initialize WebGL, fallback to Canvas2D
        this.initializeRenderer();
        
        // Object pools
        this.starPool = [];
        this.particlePool = [];
        
        // Pre-computed values
        this.twoPi = Math.PI * 2;
        this.parallaxLayers = 3;
        
        // Initialize stars
        this.generateStars();
    }
    
    /**
     * Initialize the appropriate renderer
     */
    initializeRenderer() {
        if (this.options.renderMode === 'canvas2d') {
            this.initCanvas2D();
            return;
        }
        
        if (this.options.renderMode === 'webgl' || this.options.renderMode === 'auto') {
            try {
                this.initWebGL();
                this.renderMode = 'webgl';
                console.log('Mobile Star Renderer: Using WebGL');
            } catch (e) {
                console.warn('WebGL initialization failed, falling back to Canvas2D', e);
                this.initCanvas2D();
            }
        }
    }
    
    /**
     * Initialize WebGL renderer
     */
    initWebGL() {
        const gl = this.canvas.getContext('webgl', {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: false,
            powerPreference: 'low-power'
        });
        
        if (!gl) {
            throw new Error('WebGL not supported');
        }
        
        this.gl = gl;
        
        // Create shaders
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute float a_size;
            attribute float a_brightness;
            
            uniform vec2 u_resolution;
            uniform float u_time;
            
            varying float v_brightness;
            
            void main() {
                vec2 position = a_position / u_resolution * 2.0 - 1.0;
                gl_Position = vec4(position * vec2(1, -1), 0, 1);
                gl_PointSize = a_size;
                
                // Twinkle effect
                v_brightness = a_brightness * (0.8 + 0.2 * sin(u_time * 3.0 + a_position.x));
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying float v_brightness;
            
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float dist = length(coord);
                
                if (dist > 0.5) {
                    discard;
                }
                
                float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * v_brightness);
            }
        `;
        
        // Compile shaders
        const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);
        
        // Create program
        this.program = gl.createProgram();
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            throw new Error('Unable to initialize shader program');
        }
        
        // Get attribute and uniform locations
        this.attributes = {
            position: gl.getAttribLocation(this.program, 'a_position'),
            size: gl.getAttribLocation(this.program, 'a_size'),
            brightness: gl.getAttribLocation(this.program, 'a_brightness')
        };
        
        this.uniforms = {
            resolution: gl.getUniformLocation(this.program, 'u_resolution'),
            time: gl.getUniformLocation(this.program, 'u_time')
        };
        
        // Create buffers
        this.buffers = {
            position: gl.createBuffer(),
            size: gl.createBuffer(),
            brightness: gl.createBuffer()
        };
        
        // Set up WebGL state
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
    }
    
    /**
     * Create WebGL shader
     */
    createShader(type, source) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            throw new Error('Shader compilation failed');
        }
        
        return shader;
    }
    
    /**
     * Initialize Canvas2D renderer
     */
    initCanvas2D() {
        this.ctx = this.canvas.getContext('2d', {
            alpha: true,
            desynchronized: true
        });
        
        this.ctx.imageSmoothingEnabled = false;
        this.renderMode = 'canvas2d';
        console.log('Mobile Star Renderer: Using Canvas2D');
    }
    
    /**
     * Generate initial stars
     */
    generateStars() {
        const currentSettings = this.performanceLevels[this.performanceLevel];
        const starCount = Math.min(currentSettings.stars, this.options.maxStars);
        
        this.stars = [];
        
        for (let i = 0; i < starCount; i++) {
            const star = this.createStar();
            this.stars.push(star);
        }
        
        // Update WebGL buffers if using WebGL
        if (this.renderMode === 'webgl') {
            this.updateWebGLBuffers();
        }
    }
    
    /**
     * Create a single star
     */
    createStar() {
        return {
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random() * 0.5 + 0.5,
            twinkleSpeed: Math.random() * 0.05 + 0.02,
            twinklePhase: Math.random() * this.twoPi,
            layer: Math.floor(Math.random() * this.parallaxLayers),
            vx: 0,
            vy: 0
        };
    }
    
    /**
     * Update WebGL buffers with star data
     */
    updateWebGLBuffers() {
        if (!this.gl) return;
        
        const positions = new Float32Array(this.stars.length * 2);
        const sizes = new Float32Array(this.stars.length);
        const brightnesses = new Float32Array(this.stars.length);
        
        this.stars.forEach((star, i) => {
            positions[i * 2] = star.x;
            positions[i * 2 + 1] = star.y;
            sizes[i] = star.size * 2; // Adjust for WebGL point size
            brightnesses[i] = star.brightness;
        });
        
        const gl = this.gl;
        
        // Update position buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        
        // Update size buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
        gl.bufferData(gl.ARRAY_BUFFER, sizes, gl.STATIC_DRAW);
        
        // Update brightness buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.brightness);
        gl.bufferData(gl.ARRAY_BUFFER, brightnesses, gl.DYNAMIC_DRAW);
    }
    
    /**
     * Update star positions and effects
     */
    update(deltaTime, cameraX = 0, cameraY = 0) {
        // Update FPS
        this.updateFPS();
        
        // Update stars
        const currentSettings = this.performanceLevels[this.performanceLevel];
        
        this.stars.forEach(star => {
            // Parallax effect
            if (currentSettings.parallax && this.options.useParallax) {
                const parallaxFactor = (star.layer + 1) / this.parallaxLayers;
                star.vx = -cameraX * parallaxFactor * 0.1;
                star.vy = -cameraY * parallaxFactor * 0.1;
            }
            
            // Twinkle effect
            if (currentSettings.twinkle && this.options.useTwinkle) {
                star.twinklePhase += star.twinkleSpeed * deltaTime;
                if (star.twinklePhase > this.twoPi) {
                    star.twinklePhase -= this.twoPi;
                }
            }
            
            // Wrap stars around screen edges
            star.x += star.vx * deltaTime;
            star.y += star.vy * deltaTime;
            
            if (star.x < -50) star.x = this.canvas.width + 50;
            if (star.x > this.canvas.width + 50) star.x = -50;
            if (star.y < -50) star.y = this.canvas.height + 50;
            if (star.y > this.canvas.height + 50) star.y = -50;
        });
        
        // Update shooting stars
        this.updateShootingStars(deltaTime);
        
        // Check performance and adjust
        this.checkPerformance();
    }
    
    /**
     * Update shooting stars
     */
    updateShootingStars(deltaTime) {
        // Remove finished shooting stars
        this.shootingStars = this.shootingStars.filter(star => star.life > 0);
        
        // Occasionally spawn new shooting star
        if (this.shootingStars.length < 3 && Math.random() < 0.001 * deltaTime) {
            this.shootingStars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height * 0.5,
                vx: (Math.random() - 0.5) * 200,
                vy: Math.random() * 100 + 50,
                life: 1,
                maxLife: 1,
                size: Math.random() * 2 + 1
            });
        }
        
        // Update existing shooting stars
        this.shootingStars.forEach(star => {
            star.x += star.vx * deltaTime * 0.001;
            star.y += star.vy * deltaTime * 0.001;
            star.life -= deltaTime * 0.002;
        });
    }
    
    /**
     * Render stars using appropriate method
     */
    render() {
        if (this.renderMode === 'webgl') {
            this.renderWebGL();
        } else {
            this.renderCanvas2D();
        }
        
        this.frameCount++;
    }
    
    /**
     * Render using WebGL
     */
    renderWebGL() {
        const gl = this.gl;
        
        // Clear canvas
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Use shader program
        gl.useProgram(this.program);
        
        // Set uniforms
        gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.uniforms.time, this.frameCount * 0.016); // Assuming 60 FPS
        
        // Update dynamic buffer data
        const brightnesses = new Float32Array(this.stars.map(star => {
            const twinkle = this.options.useTwinkle ? 
                0.8 + 0.2 * Math.sin(star.twinklePhase) : 1;
            return star.brightness * twinkle;
        }));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.brightness);
        gl.bufferData(gl.ARRAY_BUFFER, brightnesses, gl.DYNAMIC_DRAW);
        
        // Set up attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.enableVertexAttribArray(this.attributes.position);
        gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.size);
        gl.enableVertexAttribArray(this.attributes.size);
        gl.vertexAttribPointer(this.attributes.size, 1, gl.FLOAT, false, 0, 0);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.brightness);
        gl.enableVertexAttribArray(this.attributes.brightness);
        gl.vertexAttribPointer(this.attributes.brightness, 1, gl.FLOAT, false, 0, 0);
        
        // Draw stars
        gl.drawArrays(gl.POINTS, 0, this.stars.length);
        
        // Render shooting stars using Canvas2D overlay if needed
        if (this.shootingStars.length > 0) {
            this.renderShootingStarsCanvas2D();
        }
    }
    
    /**
     * Render using Canvas2D
     */
    renderCanvas2D() {
        const ctx = this.ctx;
        
        // Clear canvas
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.stars.forEach(star => {
            const twinkle = this.options.useTwinkle ? 
                0.8 + 0.2 * Math.sin(star.twinklePhase) : 1;
            const brightness = star.brightness * twinkle;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fillRect(
                Math.floor(star.x), 
                Math.floor(star.y), 
                Math.ceil(star.size), 
                Math.ceil(star.size)
            );
        });
        
        // Draw shooting stars
        this.renderShootingStarsCanvas2D();
    }
    
    /**
     * Render shooting stars
     */
    renderShootingStarsCanvas2D() {
        const ctx = this.ctx || this.canvas.getContext('2d');
        
        this.shootingStars.forEach(star => {
            const alpha = star.life / star.maxLife;
            
            // Draw trail
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.lineWidth = star.size;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - star.vx * 0.1, star.y - star.vy * 0.1);
            ctx.stroke();
            
            // Draw star head
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(star.x - star.size/2, star.y - star.size/2, star.size, star.size);
        });
    }
    
    /**
     * Update FPS tracking
     */
    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        if (delta > 0) {
            const currentFPS = 1000 / delta;
            this.fpsHistory.push(currentFPS);
            
            // Keep only last 30 frames
            if (this.fpsHistory.length > 30) {
                this.fpsHistory.shift();
            }
            
            // Calculate average FPS
            this.fps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        }
    }
    
    /**
     * Check performance and adjust quality
     */
    checkPerformance() {
        // Don't adjust too frequently
        if (this.frameCount % 60 !== 0) return;
        
        if (this.fps < 45 && this.performanceLevel !== 'low') {
            // Downgrade performance
            if (this.performanceLevel === 'high') {
                this.setPerformanceLevel('medium');
            } else {
                this.setPerformanceLevel('low');
            }
        } else if (this.fps > 55) {
            // Try to upgrade performance
            if (this.performanceLevel === 'low' && this.stars.length < 60) {
                this.setPerformanceLevel('medium');
            } else if (this.performanceLevel === 'medium' && this.stars.length < 100) {
                this.setPerformanceLevel('high');
            }
        }
    }
    
    /**
     * Set performance level
     */
    setPerformanceLevel(level) {
        if (this.performanceLevel === level) return;
        
        console.log(`Mobile Star Renderer: Switching to ${level} performance mode (FPS: ${this.fps.toFixed(1)})`);
        this.performanceLevel = level;
        
        const settings = this.performanceLevels[level];
        
        // Adjust star count
        if (this.stars.length > settings.stars) {
            this.stars = this.stars.slice(0, settings.stars);
        } else if (this.stars.length < settings.stars) {
            const needed = settings.stars - this.stars.length;
            for (let i = 0; i < needed; i++) {
                this.stars.push(this.createStar());
            }
        }
        
        // Update settings
        this.options.useTwinkle = settings.twinkle;
        this.options.useParallax = settings.parallax;
        
        // Update WebGL buffers if needed
        if (this.renderMode === 'webgl') {
            this.updateWebGLBuffers();
        }
    }
    
    /**
     * Resize handler
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.renderMode === 'webgl') {
            this.gl.viewport(0, 0, width, height);
        }
        
        // Regenerate stars for new size
        this.generateStars();
    }
    
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.gl) {
            this.gl.deleteProgram(this.program);
            Object.values(this.buffers).forEach(buffer => {
                this.gl.deleteBuffer(buffer);
            });
        }
        
        this.stars = [];
        this.shootingStars = [];
        this.starPool = [];
        this.particlePool = [];
    }
}

// Export for use in main game
window.MobileStarRenderer = MobileStarRenderer;