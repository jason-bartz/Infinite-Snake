// Mobile-optimized WebGL star renderer
class MobileStarRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = canvas.getContext('webgl', { 
            antialias: false,
            alpha: false,
            depth: false,
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance'
        });
        
        if (!this.gl) {
            console.warn('WebGL not supported, falling back to Canvas2D');
            return null;
        }
        
        this.starCount = 100; // Optimized for mobile
        this.setupShaders();
        this.setupBuffers();
        this.setupTexture();
    }
    
    setupShaders() {
        const vertexShaderSource = `
            attribute vec2 a_position;
            attribute vec2 a_offset;
            attribute float a_size;
            attribute float a_brightness;
            attribute float a_layer;
            
            uniform vec2 u_resolution;
            uniform vec2 u_camera;
            uniform float u_zoom;
            uniform float u_time;
            
            varying float v_brightness;
            
            void main() {
                // Parallax effect based on layer
                float parallax = 0.05 + a_layer * 0.15;
                vec2 worldPos = a_offset - u_camera * parallax;
                
                // Wrap around world boundaries
                worldPos = mod(worldPos, u_resolution);
                
                // Convert to clip space
                vec2 clipSpace = ((worldPos + a_position * a_size) / u_resolution) * 2.0 - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                
                // Twinkling effect
                v_brightness = a_brightness * (0.5 + 0.5 * sin(u_time * 3.0 + a_offset.x));
                gl_PointSize = a_size * u_zoom;
            }
        `;
        
        const fragmentShaderSource = `
            precision mediump float;
            
            varying float v_brightness;
            uniform sampler2D u_texture;
            
            void main() {
                vec4 color = texture2D(u_texture, gl_PointCoord);
                gl_FragColor = vec4(color.rgb, color.a * v_brightness);
            }
        `;
        
        this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource);
        
        // Get attribute and uniform locations
        this.attributes = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            offset: this.gl.getAttribLocation(this.program, 'a_offset'),
            size: this.gl.getAttribLocation(this.program, 'a_size'),
            brightness: this.gl.getAttribLocation(this.program, 'a_brightness'),
            layer: this.gl.getAttribLocation(this.program, 'a_layer')
        };
        
        this.uniforms = {
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            camera: this.gl.getUniformLocation(this.program, 'u_camera'),
            zoom: this.gl.getUniformLocation(this.program, 'u_zoom'),
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            texture: this.gl.getUniformLocation(this.program, 'u_texture')
        };
    }
    
    setupBuffers() {
        const gl = this.gl;
        
        // Generate star data
        const starData = [];
        for (let i = 0; i < this.starCount; i++) {
            starData.push({
                offset: [Math.random() * 10000, Math.random() * 10000],
                size: 1 + Math.random() * 2,
                brightness: 0.3 + Math.random() * 0.7,
                layer: Math.floor(Math.random() * 4) / 4 // 0, 0.25, 0.5, 0.75
            });
        }
        
        // Create vertex buffer
        const vertices = [];
        starData.forEach(star => {
            // Single vertex per star (using point sprites)
            vertices.push(
                0, 0, // position (center)
                star.offset[0], star.offset[1], // offset
                star.size, // size
                star.brightness, // brightness
                star.layer // layer for parallax
            );
        });
        
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        
        this.vertexCount = starData.length;
    }
    
    setupTexture() {
        const gl = this.gl;
        
        // Create a simple star texture
        const size = 32;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Draw star shape
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Create WebGL texture
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        return program;
    }
    
    render(camera, zoom, time) {
        const gl = this.gl;
        
        // Use shader program
        gl.useProgram(this.program);
        
        // Set uniforms
        gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        gl.uniform2f(this.uniforms.camera, camera.x, camera.y);
        gl.uniform1f(this.uniforms.zoom, zoom);
        gl.uniform1f(this.uniforms.time, time);
        
        // Bind texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uniforms.texture, 0);
        
        // Setup vertex attributes
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        
        const stride = 7 * 4; // 7 floats per vertex
        gl.enableVertexAttribArray(this.attributes.position);
        gl.vertexAttribPointer(this.attributes.position, 2, gl.FLOAT, false, stride, 0);
        
        gl.enableVertexAttribArray(this.attributes.offset);
        gl.vertexAttribPointer(this.attributes.offset, 2, gl.FLOAT, false, stride, 2 * 4);
        
        gl.enableVertexAttribArray(this.attributes.size);
        gl.vertexAttribPointer(this.attributes.size, 1, gl.FLOAT, false, stride, 4 * 4);
        
        gl.enableVertexAttribArray(this.attributes.brightness);
        gl.vertexAttribPointer(this.attributes.brightness, 1, gl.FLOAT, false, stride, 5 * 4);
        
        gl.enableVertexAttribArray(this.attributes.layer);
        gl.vertexAttribPointer(this.attributes.layer, 1, gl.FLOAT, false, stride, 6 * 4);
        
        // Enable blending
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Draw stars as points
        gl.drawArrays(gl.POINTS, 0, this.vertexCount);
    }
}

// Canvas2D fallback for devices without WebGL
class Canvas2DStarRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.stars = [];
        this.starCount = 50; // Even fewer for Canvas2D
        this.initStars();
    }
    
    initStars() {
        for (let i = 0; i < this.starCount; i++) {
            this.stars.push({
                x: Math.random() * 10000,
                y: Math.random() * 10000,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.5,
                layer: Math.random() * 0.3,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }
    }
    
    render(camera, zoom, time) {
        const ctx = this.ctx;
        ctx.save();
        
        // Batch similar stars together
        const starBatches = new Map();
        
        this.stars.forEach(star => {
            const parallax = 0.05 + star.layer * 0.15;
            const x = (star.x - camera.x * parallax) % this.canvas.width;
            const y = (star.y - camera.y * parallax) % this.canvas.height;
            
            // Skip off-screen stars
            if (x < -10 || x > this.canvas.width + 10 || 
                y < -10 || y > this.canvas.height + 10) return;
            
            // Calculate brightness with twinkle
            const twinkle = Math.sin(time * 3 + star.twinklePhase) * 0.3 + 0.7;
            const brightness = star.brightness * twinkle;
            
            // Group by size for batching
            const sizeKey = Math.round(star.size);
            if (!starBatches.has(sizeKey)) {
                starBatches.set(sizeKey, []);
            }
            
            starBatches.get(sizeKey).push({ x, y, brightness });
        });
        
        // Draw batched stars
        starBatches.forEach((batch, size) => {
            batch.forEach(star => {
                ctx.globalAlpha = star.brightness;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(
                    Math.round(star.x - size/2), 
                    Math.round(star.y - size/2), 
                    size, 
                    size
                );
            });
        });
        
        ctx.restore();
    }
}

// Export for use in main game
window.MobileStarRenderer = MobileStarRenderer;
window.Canvas2DStarRenderer = Canvas2DStarRenderer;