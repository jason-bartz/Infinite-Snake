/**
 * WebGL Renderer for Infinite Snake
 * Hardware-accelerated rendering with Canvas2D fallback support
 */

class WebGLRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.gl = null;
        this.ctx2d = null;
        this.isWebGL = false;
        
        // WebGL shader program storage
        this.programs = {};
        
        // Texture resource management
        this.textures = {};
        this.textureAtlas = null;
        
        // Batch rendering buffer
        this.batchData = {
            vertices: new Float32Array(65536), // Pre-allocated vertex buffer
            uvs: new Float32Array(65536),
            colors: new Float32Array(65536),
            indices: new Uint16Array(32768),
            count: 0,
            vertexCount: 0
        };
        
        // Transformation matrix stack
        this.matrixStack = [];
        this.currentMatrix = this.createMatrix();
        
        // Rendering performance counters
        this.metrics = {
            drawCalls: 0,
            triangles: 0,
            textureSwaps: 0
        };
        
        this.init();
    }
    
    init() {
        // Initialize WebGL2 context with fallback to WebGL1
        try {
            this.gl = this.canvas.getContext('webgl2', {
                alpha: false,
                antialias: false,
                depth: false,
                preserveDrawingBuffer: false,
                powerPreference: 'high-performance'
            });
            
            if (!this.gl) {
                this.gl = this.canvas.getContext('webgl', {
                    alpha: false,
                    antialias: false,
                    depth: false,
                    preserveDrawingBuffer: false,
                    powerPreference: 'high-performance'
                });
            }
            
            if (this.gl) {
                this.isWebGL = true;
                this.initWebGL();
            }
        } catch (e) {
            console.warn('WebGL not supported, falling back to Canvas2D:', e);
        }
        
        // Fallback to Canvas2D
        if (!this.isWebGL) {
            this.ctx2d = this.canvas.getContext('2d');
            this.ctx2d.imageSmoothingEnabled = false;
        }
    }
    
    initWebGL() {
        const gl = this.gl;
        
        // Set up WebGL state
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);
        
        // Create shaders
        this.createShaderPrograms();
        
        // Create buffers
        this.createBuffers();
        
        // Set viewport
        this.resize(this.canvas.width, this.canvas.height);
    }
    
    createShaderPrograms() {
        // Basic sprite shader
        this.programs.sprite = this.createShaderProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute vec2 a_texCoord;
            attribute vec4 a_color;
            
            uniform mat3 u_matrix;
            uniform vec2 u_resolution;
            
            varying vec2 v_texCoord;
            varying vec4 v_color;
            
            void main() {
                vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
                vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                
                v_texCoord = a_texCoord;
                v_color = a_color;
            }
            `,
            // Fragment shader
            `
            precision mediump float;
            
            uniform sampler2D u_texture;
            
            varying vec2 v_texCoord;
            varying vec4 v_color;
            
            void main() {
                vec4 texColor = texture2D(u_texture, v_texCoord);
                gl_FragColor = texColor * v_color;
            }
            `
        );
        
        // Solid color shader for rectangles
        this.programs.solid = this.createShaderProgram(
            // Vertex shader
            `
            attribute vec2 a_position;
            attribute vec4 a_color;
            
            uniform mat3 u_matrix;
            uniform vec2 u_resolution;
            
            varying vec4 v_color;
            
            void main() {
                vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
                vec2 clipSpace = ((position / u_resolution) * 2.0) - 1.0;
                gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
                
                v_color = a_color;
            }
            `,
            // Fragment shader
            `
            precision mediump float;
            
            varying vec4 v_color;
            
            void main() {
                gl_FragColor = v_color;
            }
            `
        );
    }
    
    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        const vertexShader = this.compileShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, fragmentSource);
        
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Shader program failed to link:', gl.getProgramInfoLog(program));
            return null;
        }
        
        // Get attribute and uniform locations
        const attributes = {};
        const uniforms = {};
        
        const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttributes; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }
        
        return { program, attributes, uniforms };
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const shader = gl.createShader(type);
        
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation failed:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        
        return shader;
    }
    
    createBuffers() {
        const gl = this.gl;
        
        // Create vertex buffer
        this.vertexBuffer = gl.createBuffer();
        
        // Create index buffer
        this.indexBuffer = gl.createBuffer();
        
        // Create vertex array object (WebGL2) or emulate (WebGL1)
        if (gl.createVertexArray) {
            this.vao = gl.createVertexArray();
        }
    }
    
    // Matrix operations
    createMatrix() {
        return new Float32Array([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);
    }
    
    translate(matrix, x, y) {
        matrix[6] += matrix[0] * x + matrix[3] * y;
        matrix[7] += matrix[1] * x + matrix[4] * y;
    }
    
    rotate(matrix, angleInRadians) {
        const c = Math.cos(angleInRadians);
        const s = Math.sin(angleInRadians);
        const a0 = matrix[0];
        const a1 = matrix[1];
        const a3 = matrix[3];
        const a4 = matrix[4];
        
        matrix[0] = a0 * c + a3 * s;
        matrix[1] = a1 * c + a4 * s;
        matrix[3] = a0 * -s + a3 * c;
        matrix[4] = a1 * -s + a4 * c;
    }
    
    scale(matrix, sx, sy) {
        matrix[0] *= sx;
        matrix[1] *= sx;
        matrix[3] *= sy;
        matrix[4] *= sy;
    }
    
    // Public API matching Canvas2D
    save() {
        if (this.isWebGL) {
            this.matrixStack.push(new Float32Array(this.currentMatrix));
        } else {
            this.ctx2d.save();
        }
    }
    
    restore() {
        if (this.isWebGL) {
            if (this.matrixStack.length > 0) {
                this.currentMatrix = this.matrixStack.pop();
            }
        } else {
            this.ctx2d.restore();
        }
    }
    
    clear() {
        if (this.isWebGL) {
            const gl = this.gl;
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            gl.clearColor(0, 0, 0, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            // Reset metrics
            this.metrics.drawCalls = 0;
            this.metrics.triangles = 0;
            this.metrics.textureSwaps = 0;
        } else {
            this.ctx2d.fillStyle = '#000000';
            this.ctx2d.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
    
    fillRect(x, y, width, height, color) {
        if (this.isWebGL) {
            // Add rectangle to batch
            this.addRectToBatch(x, y, width, height, color);
        } else {
            this.ctx2d.fillStyle = color;
            this.ctx2d.fillRect(x, y, width, height);
        }
    }
    
    drawImage(image, sx, sy, swidth, sheight, dx, dy, dwidth, dheight) {
        if (this.isWebGL) {
            // Get or create texture for this image
            let texture = this.textures[image.src];
            if (!texture) {
                texture = this.createTextureFromImage(image);
                this.textures[image.src] = texture;
            }
            
            // Add sprite to batch
            this.addSpriteToBatch(texture, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
        } else {
            if (arguments.length === 9) {
                this.ctx2d.drawImage(image, sx, sy, swidth, sheight, dx, dy, dwidth, dheight);
            } else if (arguments.length === 5) {
                this.ctx2d.drawImage(image, sx, sy, swidth, sheight);
            } else {
                this.ctx2d.drawImage(image, sx, sy);
            }
        }
    }
    
    // Batch rendering methods
    addRectToBatch(x, y, width, height, color) {
        // Flush if batch is full
        if (this.batchData.count >= 16000) {
            this.flushBatch();
        }
        
        // Parse color
        const rgba = this.parseColor(color);
        
        // Add vertices
        const idx = this.batchData.vertexCount;
        const verts = this.batchData.vertices;
        const colors = this.batchData.colors;
        
        // Top-left
        verts[idx * 2] = x;
        verts[idx * 2 + 1] = y;
        colors[idx * 4] = rgba[0];
        colors[idx * 4 + 1] = rgba[1];
        colors[idx * 4 + 2] = rgba[2];
        colors[idx * 4 + 3] = rgba[3];
        
        // Top-right
        verts[(idx + 1) * 2] = x + width;
        verts[(idx + 1) * 2 + 1] = y;
        colors[(idx + 1) * 4] = rgba[0];
        colors[(idx + 1) * 4 + 1] = rgba[1];
        colors[(idx + 1) * 4 + 2] = rgba[2];
        colors[(idx + 1) * 4 + 3] = rgba[3];
        
        // Bottom-right
        verts[(idx + 2) * 2] = x + width;
        verts[(idx + 2) * 2 + 1] = y + height;
        colors[(idx + 2) * 4] = rgba[0];
        colors[(idx + 2) * 4 + 1] = rgba[1];
        colors[(idx + 2) * 4 + 2] = rgba[2];
        colors[(idx + 2) * 4 + 3] = rgba[3];
        
        // Bottom-left
        verts[(idx + 3) * 2] = x;
        verts[(idx + 3) * 2 + 1] = y + height;
        colors[(idx + 3) * 4] = rgba[0];
        colors[(idx + 3) * 4 + 1] = rgba[1];
        colors[(idx + 3) * 4 + 2] = rgba[2];
        colors[(idx + 3) * 4 + 3] = rgba[3];
        
        // Add indices
        const indices = this.batchData.indices;
        const iIdx = this.batchData.count * 6;
        indices[iIdx] = idx;
        indices[iIdx + 1] = idx + 1;
        indices[iIdx + 2] = idx + 2;
        indices[iIdx + 3] = idx;
        indices[iIdx + 4] = idx + 2;
        indices[iIdx + 5] = idx + 3;
        
        this.batchData.vertexCount += 4;
        this.batchData.count++;
    }
    
    flushBatch() {
        if (this.batchData.count === 0) return;
        
        const gl = this.gl;
        const program = this.programs.solid;
        
        // Use shader program
        gl.useProgram(program.program);
        
        // Set uniforms
        gl.uniformMatrix3fv(program.uniforms.u_matrix, false, this.currentMatrix);
        gl.uniform2f(program.uniforms.u_resolution, this.canvas.width, this.canvas.height);
        
        // Upload vertex data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, 
            this.batchData.vertices.subarray(0, this.batchData.vertexCount * 2), 
            gl.DYNAMIC_DRAW);
        
        // Set up attributes
        gl.enableVertexAttribArray(program.attributes.a_position);
        gl.vertexAttribPointer(program.attributes.a_position, 2, gl.FLOAT, false, 0, 0);
        
        // Upload color data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            this.batchData.colors.subarray(0, this.batchData.vertexCount * 4),
            gl.DYNAMIC_DRAW);
        
        gl.enableVertexAttribArray(program.attributes.a_color);
        gl.vertexAttribPointer(program.attributes.a_color, 4, gl.FLOAT, false, 0, 0);
        
        // Upload index data
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
            this.batchData.indices.subarray(0, this.batchData.count * 6),
            gl.DYNAMIC_DRAW);
        
        // Draw
        gl.drawElements(gl.TRIANGLES, this.batchData.count * 6, gl.UNSIGNED_SHORT, 0);
        
        // Update metrics
        this.metrics.drawCalls++;
        this.metrics.triangles += this.batchData.count * 2;
        
        // Reset batch
        this.batchData.count = 0;
        this.batchData.vertexCount = 0;
    }
    
    parseColor(color) {
        // Simple color parser (handles hex and rgba)
        if (color.startsWith('#')) {
            const hex = color.slice(1);
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;
            return [r, g, b, 1];
        } else if (color.startsWith('rgba')) {
            const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*(\d*\.?\d+)\)/);
            if (match) {
                return [
                    parseInt(match[1]) / 255,
                    parseInt(match[2]) / 255,
                    parseInt(match[3]) / 255,
                    parseFloat(match[4])
                ];
            }
        }
        return [1, 1, 1, 1]; // Default white
    }
    
    createTextureFromImage(image) {
        const gl = this.gl;
        const texture = gl.createTexture();
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        
        // Set texture parameters for pixel art
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        return texture;
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        
        if (this.isWebGL) {
            this.gl.viewport(0, 0, width, height);
        }
    }
    
    getMetrics() {
        return this.metrics;
    }
}

// Export for use in main game
window.WebGLRenderer = WebGLRenderer;