// GPU-Based Particle System for Infinite Snake
// High-performance particle rendering using WebGL

class GPUParticleSystem {
    constructor(renderer, maxParticles = 10000) {
        this.renderer = renderer;
        this.gl = renderer.gl;
        this.maxParticles = maxParticles;
        this.particleCount = 0;
        
        // Particle data arrays
        this.positions = new Float32Array(maxParticles * 2);
        this.velocities = new Float32Array(maxParticles * 2);
        this.colors = new Float32Array(maxParticles * 4);
        this.sizes = new Float32Array(maxParticles);
        this.lifetimes = new Float32Array(maxParticles);
        this.ages = new Float32Array(maxParticles);
        
        // Free list for particle recycling
        this.freeList = [];
        for (let i = maxParticles - 1; i >= 0; i--) {
            this.freeList.push(i);
        }
        
        // Particle types
        this.particleTypes = {
            boost: {
                size: 3,
                lifetime: 0.5,
                speed: 2,
                color: [1, 1, 0, 0.8],
                fadeOut: true
            },
            explosion: {
                size: 5,
                lifetime: 1.0,
                speed: 5,
                color: [1, 0.5, 0, 1],
                fadeOut: true
            },
            border: {
                size: 2,
                lifetime: 2.0,
                speed: 1,
                color: [0.5, 0.25, 1, 0.6],
                fadeOut: false
            },
            combination: {
                size: 4,
                lifetime: 0.8,
                speed: 3,
                color: [0, 1, 1, 1],
                fadeOut: true
            },
            damage: {
                size: 6,
                lifetime: 0.6,
                speed: 1,
                color: [1, 0, 0, 1],
                fadeOut: true
            }
        };
        
        if (this.gl) {
            this.initWebGL();
        }
    }
    
    initWebGL() {
        const gl = this.gl;
        
        // Create shader program
        this.program = this.createShaderProgram();
        
        // Create buffers
        this.positionBuffer = gl.createBuffer();
        this.velocityBuffer = gl.createBuffer();
        this.colorBuffer = gl.createBuffer();
        this.sizeBuffer = gl.createBuffer();
        this.lifetimeBuffer = gl.createBuffer();
        this.ageBuffer = gl.createBuffer();
        
        // Create vertex array object (VAO) if available
        if (gl.createVertexArray) {
            this.vao = gl.createVertexArray();
            this.setupVAO();
        }
        
        // Create particle texture
        this.createParticleTexture();
    }
    
    createShaderProgram() {
        const vertexShader = `
            attribute vec2 a_position;
            attribute vec2 a_velocity;
            attribute vec4 a_color;
            attribute float a_size;
            attribute float a_lifetime;
            attribute float a_age;
            
            uniform mat3 u_matrix;
            uniform vec2 u_resolution;
            uniform float u_time;
            
            varying vec4 v_color;
            varying float v_fadeAlpha;
            
            void main() {
                // Update position based on velocity and age
                vec2 position = a_position + a_velocity * a_age;
                
                // Apply camera transformation
                vec2 worldPos = (u_matrix * vec3(position, 1.0)).xy;
                vec2 clipSpace = ((worldPos / u_resolution) * 2.0) - 1.0;
                
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                gl_PointSize = a_size * (1.0 - a_age / a_lifetime);
                
                // Calculate fade alpha
                v_fadeAlpha = 1.0 - (a_age / a_lifetime);
                v_color = a_color;
            }
        `;
        
        const fragmentShader = `
            precision mediump float;
            
            uniform sampler2D u_texture;
            
            varying vec4 v_color;
            varying float v_fadeAlpha;
            
            void main() {
                vec2 coord = gl_PointCoord;
                vec4 texColor = texture2D(u_texture, coord);
                
                // Soft particle edges
                float dist = distance(coord, vec2(0.5));
                float alpha = 1.0 - smoothstep(0.4, 0.5, dist);
                
                gl_FragColor = v_color * texColor * alpha * v_fadeAlpha;
            }
        `;
        
        return this.renderer.createShaderProgram(vertexShader, fragmentShader);
    }
    
    setupVAO() {
        const gl = this.gl;
        const program = this.program;
        
        gl.bindVertexArray(this.vao);
        
        // Position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 0, 0);
        
        // Velocity attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.velocityBuffer);
        gl.enableVertexAttribArray(program.attributes.a_velocity);
        gl.vertexAttribPointer(program.attributes.a_velocity, 2, gl.FLOAT, false, 0, 0);
        
        // Color attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(program.attributes.a_color);
        gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, 0, 0);
        
        // Size attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.enableVertexAttribArray(program.attributes.a_size);
        gl.vertexAttribPointer(program.attributes.a_size, 1, gl.FLOAT, false, 0, 0);
        
        // Lifetime attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lifetimeBuffer);
        gl.enableVertexAttribArray(program.attributes.a_lifetime);
        gl.vertexAttribPointer(program.attributes.a_lifetime, 1, gl.FLOAT, false, 0, 0);
        
        // Age attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ageBuffer);
        gl.enableVertexAttribArray(program.attributes.a_age);
        gl.vertexAttribPointer(program.attributes.a_age, 1, gl.FLOAT, false, 0, 0);
        
        gl.bindVertexArray(null);
    }
    
    createParticleTexture() {
        const gl = this.gl;
        const size = 64;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
        
        // Create texture
        this.particleTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.particleTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    
    spawn(x, y, vx, vy, type = 'boost', customColor = null) {
        if (this.freeList.length === 0) return -1;
        
        const index = this.freeList.pop();
        const typeConfig = this.particleTypes[type] || this.particleTypes.boost;
        
        // Set particle data
        this.positions[index * 2] = x;
        this.positions[index * 2 + 1] = y;
        
        this.velocities[index * 2] = vx * typeConfig.speed;
        this.velocities[index * 2 + 1] = vy * typeConfig.speed;
        
        const color = customColor || typeConfig.color;
        this.colors[index * 4] = color[0];
        this.colors[index * 4 + 1] = color[1];
        this.colors[index * 4 + 2] = color[2];
        this.colors[index * 4 + 3] = color[3];
        
        this.sizes[index] = typeConfig.size;
        this.lifetimes[index] = typeConfig.lifetime;
        this.ages[index] = 0;
        
        this.particleCount++;
        return index;
    }
    
    spawnBurst(x, y, count, type = 'explosion', spread = Math.PI * 2) {
        const particles = [];
        const angleStep = spread / count;
        const startAngle = -spread / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = startAngle + angleStep * i + (Math.random() - 0.5) * angleStep;
            const speed = 0.5 + Math.random() * 0.5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const index = this.spawn(x, y, vx, vy, type);
            if (index !== -1) particles.push(index);
        }
        
        return particles;
    }
    
    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds
        
        // Update all particles
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.ages[i] < this.lifetimes[i]) {
                this.ages[i] += dt;
                
                // Check if particle died
                if (this.ages[i] >= this.lifetimes[i]) {
                    this.freeList.push(i);
                    this.particleCount--;
                }
            }
        }
    }
    
    render(camera, cameraZoom) {
        if (!this.gl || this.particleCount === 0) return;
        
        const gl = this.gl;
        const program = this.program;
        
        // Use shader program
        gl.useProgram(program.program);
        
        // Enable blending for particles
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        
        // Set uniforms
        gl.uniformMatrix3fv(program.uniforms.u_matrix, false, this.renderer.currentMatrix);
        gl.uniform2f(program.uniforms.u_resolution, this.renderer.canvas.width, this.renderer.canvas.height);
        gl.uniform1f(program.uniforms.u_time, performance.now() / 1000);
        
        // Bind particle texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.particleTexture);
        gl.uniform1i(program.uniforms.u_texture, 0);
        
        // Update buffers with only active particles
        const activeIndices = [];
        for (let i = 0; i < this.maxParticles; i++) {
            if (this.ages[i] < this.lifetimes[i]) {
                activeIndices.push(i);
            }
        }
        
        if (activeIndices.length === 0) return;
        
        // Create temporary arrays for active particles
        const activePositions = new Float32Array(activeIndices.length * 2);
        const activeVelocities = new Float32Array(activeIndices.length * 2);
        const activeColors = new Float32Array(activeIndices.length * 4);
        const activeSizes = new Float32Array(activeIndices.length);
        const activeLifetimes = new Float32Array(activeIndices.length);
        const activeAges = new Float32Array(activeIndices.length);
        
        // Copy active particle data
        for (let i = 0; i < activeIndices.length; i++) {
            const idx = activeIndices[i];
            activePositions[i * 2] = this.positions[idx * 2];
            activePositions[i * 2 + 1] = this.positions[idx * 2 + 1];
            activeVelocities[i * 2] = this.velocities[idx * 2];
            activeVelocities[i * 2 + 1] = this.velocities[idx * 2 + 1];
            activeColors[i * 4] = this.colors[idx * 4];
            activeColors[i * 4 + 1] = this.colors[idx * 4 + 1];
            activeColors[i * 4 + 2] = this.colors[idx * 4 + 2];
            activeColors[i * 4 + 3] = this.colors[idx * 4 + 3];
            activeSizes[i] = this.sizes[idx] * cameraZoom;
            activeLifetimes[i] = this.lifetimes[idx];
            activeAges[i] = this.ages[idx];
        }
        
        // Upload data to GPU
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activePositions, gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.velocityBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeVelocities, gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeColors, gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeSizes, gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lifetimeBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeLifetimes, gl.DYNAMIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ageBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, activeAges, gl.DYNAMIC_DRAW);
        
        // Bind VAO if available
        if (this.vao) {
            gl.bindVertexArray(this.vao);
        } else {
            this.setupAttributes();
        }
        
        // Draw particles as points
        gl.drawArrays(gl.POINTS, 0, activeIndices.length);
        
        // Cleanup
        if (this.vao) {
            gl.bindVertexArray(null);
        }
        
        // Restore normal blending
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        
        // Update metrics
        this.renderer.metrics.drawCalls++;
        this.renderer.metrics.triangles += activeIndices.length * 2; // Each point sprite is 2 triangles
    }
    
    setupAttributes() {
        const gl = this.gl;
        const program = this.program;
        
        // Position
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 0, 0);
        
        // Velocity
        gl.bindBuffer(gl.ARRAY_BUFFER, this.velocityBuffer);
        gl.enableVertexAttribArray(program.attributes.a_velocity);
        gl.vertexAttribPointer(program.attributes.a_velocity, 2, gl.FLOAT, false, 0, 0);
        
        // Color
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(program.attributes.a_color);
        gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, 0, 0);
        
        // Size
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sizeBuffer);
        gl.enableVertexAttribArray(program.attributes.a_size);
        gl.vertexAttribPointer(program.attributes.a_size, 1, gl.FLOAT, false, 0, 0);
        
        // Lifetime
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lifetimeBuffer);
        gl.enableVertexAttribArray(program.attributes.a_lifetime);
        gl.vertexAttribPointer(program.attributes.a_lifetime, 1, gl.FLOAT, false, 0, 0);
        
        // Age
        gl.bindBuffer(gl.ARRAY_BUFFER, this.ageBuffer);
        gl.enableVertexAttribArray(program.attributes.a_age);
        gl.vertexAttribPointer(program.attributes.a_age, 1, gl.FLOAT, false, 0, 0);
    }
    
    clear() {
        this.particleCount = 0;
        this.freeList = [];
        for (let i = this.maxParticles - 1; i >= 0; i--) {
            this.freeList.push(i);
            this.ages[i] = this.lifetimes[i]; // Mark all as dead
        }
    }
    
    getStats() {
        return {
            activeParticles: this.particleCount,
            maxParticles: this.maxParticles,
            freeParticles: this.freeList.length
        };
    }
}

// Export for use in main game
window.GPUParticleSystem = GPUParticleSystem;