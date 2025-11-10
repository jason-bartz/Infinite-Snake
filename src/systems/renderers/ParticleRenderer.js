/**
 * ParticleRenderer - Handles rendering of all particle effects
 *
 * Responsibilities:
 * - Rendering general particles (explosions, boost trails, sparkles)
 * - Rendering border particles (ambient edge effects)
 * - Managing particle pool (object pooling for performance)
 * - Particle lifecycle (spawn, update, death)
 * - Viewport culling for off-screen particles
 * - Mobile vs Desktop rendering optimization
 *
 * Part of Phase 3: Rendering System extraction
 */

import { RenderLayer } from '../RenderLayer.js';

/**
 * Particle class representing individual particle effects
 */
export class Particle {
    /**
     * Creates a new particle
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {string} color - CSS color string
     * @param {number} size - Particle size in pixels
     * @param {string} type - Particle type ('square', 'circle', 'star', 'trail')
     * @param {Object} options - Additional particle options
     */
    constructor(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
        this.reset(x, y, vx, vy, color, size, type, options);
    }

    /**
     * Resets particle properties (used for pooling)
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {string} color - CSS color string
     * @param {number} size - Particle size
     * @param {string} type - Particle type
     * @param {Object} options - Additional particle options
     */
    reset(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = 1;
        this.active = true;
        this.type = type;

        // Additional options
        this.gravity = options.gravity || 0;
        this.rotation = options.rotation || 0;
        this.rotationSpeed = options.rotationSpeed || 0;
        this.fadeRate = options.fadeRate || 0.02;
        this.growthRate = options.growthRate || 0;
        this.trail = options.trail || false;
        this.trailLength = options.trailLength || 5;
        this.trailHistory = [];
        this.pulse = options.pulse || false;
        this.pulseSpeed = options.pulseSpeed || 0.1;
        this.pulsePhase = 0;
    }

    /**
     * Updates particle state
     * @param {number} deltaTime - Time multiplier for frame-independent movement
     * @returns {boolean} True if particle is still alive
     */
    update(deltaTime = 1) {
        if (!this.active) return false;

        // Store trail history
        if (this.trail && this.life > 0.1) {
            this.trailHistory.push({ x: this.x, y: this.y, life: this.life });
            if (this.trailHistory.length > this.trailLength) {
                this.trailHistory.shift();
            }
        }

        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Apply gravity
        this.vy += this.gravity * deltaTime;

        // Update life
        this.life -= this.fadeRate * deltaTime;

        // Apply friction
        this.vx *= Math.pow(0.98, deltaTime);
        this.vy *= Math.pow(0.98, deltaTime);

        // Update rotation
        this.rotation += this.rotationSpeed * deltaTime;

        // Update size
        this.size += this.growthRate * deltaTime;

        // Update pulse
        if (this.pulse) {
            this.pulsePhase += this.pulseSpeed * deltaTime;
        }

        if (this.life <= 0) {
            this.active = false;
            this.trailHistory = [];
            return false;
        }
        return true;
    }
}

/**
 * BorderParticle class for ambient edge effects
 */
export class BorderParticle {
    /**
     * Creates a new border particle
     * @param {number} x - Screen X position
     * @param {number} y - Screen Y position
     * @param {string} edge - Edge location ('left', 'right', 'top', 'bottom')
     */
    constructor(x, y, edge) {
        this.x = x;
        this.y = y;
        this.edge = edge;
        this.baseX = x;
        this.baseY = y;
        this.size = Math.random() * 3 + 1;
        this.speed = Math.random() * 0.5 + 0.1;
        this.offset = Math.random() * Math.PI * 2;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.color = this.getRandomColor();
    }

    /**
     * Gets a random color for border particles
     * @returns {string} RGBA color prefix (without alpha value)
     */
    getRandomColor() {
        const colors = [
            'rgba(147, 51, 234, ', // purple
            'rgba(236, 72, 153, ', // pink
            'rgba(59, 130, 246, ',  // blue
            'rgba(168, 85, 247, ', // purple-pink
            'rgba(99, 102, 241, '   // indigo
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * Updates border particle animation
     * @param {number} time - Global animation time
     */
    update(time) {
        const t = time + this.offset;

        // Float in circular motion
        const radius = 15;
        const floatX = Math.cos(t * this.speed) * radius;
        const floatY = Math.sin(t * this.speed * 0.7) * radius;

        this.x = this.baseX + floatX;
        this.y = this.baseY + floatY;

        // Pulse opacity
        this.opacity = 0.3 + Math.sin(t * 2) * 0.2;
    }
}

/**
 * ParticlePool - Object pool for efficient particle management
 */
export class ParticlePool {
    /**
     * Creates a new particle pool
     * @param {number} size - Maximum pool size
     */
    constructor(size = 200) {
        this.pool = [];
        this.activeParticles = [];
        this.poolSize = size;

        // Pre-allocate particles
        for (let i = 0; i < size; i++) {
            this.pool.push(new Particle(0, 0, 0, 0, 'white'));
        }

        // Pre-warm the pool
        this.preWarm();
    }

    /**
     * Pre-warms the pool by cycling through particles
     */
    preWarm() {
        const warmupCount = Math.min(50, this.poolSize);
        const tempParticles = [];
        for (let i = 0; i < warmupCount; i++) {
            tempParticles.push(this.spawn(0, 0, 0, 0, 'white'));
        }
        // Return them to pool
        tempParticles.forEach(p => {
            p.active = false;
            p.life = 0;
        });
        this.update();
    }

    /**
     * Spawns a new particle from the pool
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {string} color - CSS color
     * @param {number} size - Particle size
     * @param {string} type - Particle type
     * @param {Object} options - Additional options
     * @returns {Particle} The spawned particle
     */
    spawn(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
        let particle = this.pool.pop();
        if (!particle) {
            // Pool is empty, create new particle
            particle = new Particle(x, y, vx, vy, color, size, type);
        } else {
            particle.reset(x, y, vx, vy, color, size, type, options);
        }
        this.activeParticles.push(particle);
        return particle;
    }

    /**
     * Updates all active particles
     * @param {number} deltaTime - Time multiplier
     */
    update(deltaTime = 1) {
        for (let i = this.activeParticles.length - 1; i >= 0; i--) {
            const particle = this.activeParticles[i];
            if (!particle.update(deltaTime)) {
                // Return to pool
                this.activeParticles.splice(i, 1);
                this.pool.push(particle);
            }
        }
    }

    /**
     * Gets the count of active particles
     * @returns {number} Active particle count
     */
    getActiveCount() {
        return this.activeParticles.length;
    }

    /**
     * Clears all active particles
     */
    clear() {
        this.activeParticles.forEach(p => {
            p.active = false;
            p.life = 0;
            this.pool.push(p);
        });
        this.activeParticles = [];
    }
}

/**
 * ParticleRenderer - Renders all particle effects
 */
export class ParticleRenderer {
    /**
     * Creates a new particle renderer
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Camera} camera - Camera instance
     * @param {Object} config - Configuration object
     */
    constructor(ctx, camera, config = {}) {
        this.ctx = ctx;
        this.camera = camera;
        this.config = config;

        // Get platform info
        this.isMobile = config.isMobile || false;

        // Particle pools
        const poolSize = this.isMobile ? 50 : 200;
        this.particlePool = new ParticlePool(poolSize);

        // Border particles
        this.borderParticles = [];
        this.maxBorderParticles = this.isMobile ? 50 : 150;
        this.animationTime = 0;

        // Performance tracking
        this.metrics = {
            particlesRendered: 0,
            particlesCulled: 0,
            borderParticlesRendered: 0
        };
    }

    /**
     * Spawns a new particle
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {string} color - CSS color
     * @param {number} size - Particle size
     * @param {string} type - Particle type
     * @param {Object} options - Additional options
     * @returns {Particle} The spawned particle
     */
    spawnParticle(x, y, vx, vy, color, size = 4, type = 'square', options = {}) {
        return this.particlePool.spawn(x, y, vx, vy, color, size, type, options);
    }

    /**
     * Creates combination particles (burst effect)
     * @param {number} x - World X position
     * @param {number} y - World Y position
     */
    createCombinationParticles(x, y) {
        const particleCount = this.isMobile ? 5 : 20;
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 3;
            this.particlePool.spawn(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                'rgba(255, 215, 0, 0.8)'
            );
        }
    }

    /**
     * Creates death particles (explosion effect)
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} count - Number of particles
     * @param {string} color - Particle color
     */
    createDeathParticles(x, y, count = 20, color = '#ff0000') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particlePool.spawn(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color
            );
        }
    }

    /**
     * Creates boost trail particles
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} angle - Boost direction angle
     * @param {string} color - Particle color
     */
    createBoostParticle(x, y, angle, color) {
        const particleAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
        const speed = 2 + Math.random() * 2;
        const vx = Math.cos(particleAngle) * speed;
        const vy = Math.sin(particleAngle) * speed;
        this.particlePool.spawn(x, y, vx, vy, color);
    }

    /**
     * Initializes border particles
     * @param {number} mapWidth - Map width
     * @param {number} mapHeight - Map height
     */
    initBorderParticles(mapWidth, mapHeight) {
        this.borderParticles = [];
        const margin = 50;

        for (let i = 0; i < this.maxBorderParticles; i++) {
            const edge = ['left', 'right', 'top', 'bottom'][Math.floor(Math.random() * 4)];
            let x, y;

            switch (edge) {
                case 'left':
                    x = -mapWidth / 2 + margin;
                    y = -mapHeight / 2 + Math.random() * mapHeight;
                    break;
                case 'right':
                    x = mapWidth / 2 - margin;
                    y = -mapHeight / 2 + Math.random() * mapHeight;
                    break;
                case 'top':
                    x = -mapWidth / 2 + Math.random() * mapWidth;
                    y = -mapHeight / 2 + margin;
                    break;
                case 'bottom':
                    x = -mapWidth / 2 + Math.random() * mapWidth;
                    y = mapHeight / 2 - margin;
                    break;
            }

            this.borderParticles.push(new BorderParticle(x, y, edge));
        }
    }

    /**
     * Updates all particles
     * @param {number} deltaTime - Time multiplier
     */
    update(deltaTime = 1) {
        // Update animation time
        this.animationTime += deltaTime * 0.016; // Assuming 60fps base

        // Update particle pool
        this.particlePool.update(deltaTime);

        // Update border particles
        this.borderParticles.forEach(particle => {
            particle.update(this.animationTime);
        });

        // Reset metrics
        this.metrics.particlesRendered = 0;
        this.metrics.particlesCulled = 0;
        this.metrics.borderParticlesRendered = 0;
    }

    /**
     * Renders a single particle
     * @param {Particle} particle - Particle to render
     */
    renderParticle(particle) {
        if (!particle.active) return;

        const pixelSize = 4;
        const screen = this.camera.worldToScreen(particle.x, particle.y);
        const screenX = screen.x;
        const screenY = screen.y;

        this.ctx.save();

        // Draw trail if enabled
        if (particle.trail && particle.trailHistory.length > 0) {
            particle.trailHistory.forEach((point, index) => {
                const trailScreen = this.camera.worldToScreen(point.x, point.y);
                const alpha = (index / particle.trailHistory.length) * particle.life * 0.5;
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = particle.color;

                const trailSize = particle.size * (index / particle.trailHistory.length);
                this.ctx.fillRect(
                    Math.floor(trailScreen.x / pixelSize) * pixelSize,
                    Math.floor(trailScreen.y / pixelSize) * pixelSize,
                    trailSize,
                    trailSize
                );
            });
        }

        // Set main particle properties
        this.ctx.fillStyle = particle.color;
        this.ctx.globalAlpha = particle.life;

        // Apply pulse effect
        let actualSize = particle.size;
        if (particle.pulse) {
            actualSize = particle.size * (1 + Math.sin(particle.pulsePhase) * 0.3);
        }

        // Draw based on type
        switch (particle.type) {
            case 'circle':
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, actualSize / 2, 0, Math.PI * 2);
                this.ctx.fill();
                break;

            case 'star':
                this.ctx.save();
                this.ctx.translate(screenX, screenY);
                this.ctx.rotate(particle.rotation);

                const spikes = 5;
                const outerRadius = actualSize / 2;
                const innerRadius = outerRadius * 0.5;

                this.ctx.beginPath();
                for (let i = 0; i < spikes * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i * Math.PI) / spikes;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;

                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
                break;

            case 'square':
            default:
                // Pixelated square
                this.ctx.fillRect(
                    Math.floor(screenX / pixelSize) * pixelSize,
                    Math.floor(screenY / pixelSize) * pixelSize,
                    actualSize,
                    actualSize
                );
                break;
        }

        this.ctx.restore();
        this.metrics.particlesRendered++;
    }

    /**
     * Renders a border particle
     * @param {BorderParticle} particle - Border particle to render
     */
    renderBorderParticle(particle) {
        const screen = this.camera.worldToScreen(particle.x, particle.y);

        if (this.isMobile) {
            // Simplified rendering for mobile
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color + particle.opacity + ')';
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        } else {
            // Desktop with glow effects
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color + particle.opacity + ')';
            this.ctx.beginPath();
            this.ctx.arc(screen.x, screen.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Glow effect
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = particle.color + '0.8)';
            this.ctx.fill();
            this.ctx.restore();
        }

        this.metrics.borderParticlesRendered++;
    }

    /**
     * Checks if a point is in the viewport
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} padding - Extra padding around viewport
     * @returns {boolean} True if in viewport
     */
    isInViewport(x, y, padding = 50) {
        return this.camera.isInViewport(x, y, padding);
    }

    /**
     * Renders all particles
     */
    render() {
        // Render border particles (background layer)
        this.borderParticles.forEach(particle => {
            if (this.isInViewport(particle.x, particle.y, 100)) {
                this.renderBorderParticle(particle);
            }
        });

        // Render active particles (effects layer)
        this.particlePool.activeParticles.forEach(particle => {
            if (this.isInViewport(particle.x, particle.y, 50)) {
                this.renderParticle(particle);
            } else {
                this.metrics.particlesCulled++;
            }
        });
    }

    /**
     * Gets the particle pool for external access
     * @returns {ParticlePool} The particle pool
     */
    getPool() {
        return this.particlePool;
    }

    /**
     * Gets performance metrics
     * @returns {Object} Performance metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeParticles: this.particlePool.getActiveCount(),
            pooledParticles: this.particlePool.pool.length,
            borderParticles: this.borderParticles.length
        };
    }

    /**
     * Clears all particles
     */
    clear() {
        this.particlePool.clear();
        this.borderParticles = [];
    }

    /**
     * Gets the render layer for this renderer
     * @returns {string} Render layer
     */
    getLayer() {
        return RenderLayer.EFFECTS;
    }
}
