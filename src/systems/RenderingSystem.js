/**
 * RenderingSystem - Main rendering system coordinator
 *
 * Responsibilities:
 * - Initializing all renderers with shared dependencies
 * - Registering renderers with the RenderPipeline
 * - Coordinating renderer updates and state
 * - Managing camera and viewport
 * - Providing unified rendering API
 *
 * This is the integration layer that brings together:
 * - Camera (viewport and transforms)
 * - RenderPipeline (rendering order and layers)
 * - All individual renderers (Background, Border, Snake, Element, Particle)
 *
 * Part of Phase 3: Systems Extraction - Integration
 */

import { System } from '../core/ecs/System.js';
import { RenderPipeline } from './RenderPipeline.js';
import { RenderLayer } from './RenderLayer.js';
import { Camera } from '../core/rendering/Camera.js';
import { BackgroundRenderer } from './renderers/BackgroundRenderer.js';
import { BorderRenderer } from './renderers/BorderRenderer.js';
import { SnakeRenderer } from './renderers/SnakeRenderer.js';
import { ElementRenderer } from './renderers/ElementRenderer.js';
import { ParticleRenderer } from './renderers/ParticleRenderer.js';

/**
 * RenderingSystem - Coordinates all rendering
 */
export class RenderingSystem extends System {
    /**
     * Creates a new rendering system
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {Object} config - Configuration object
     */
    constructor(ctx, canvas, config = {}) {
        super();

        if (!ctx) {
            throw new Error('RenderingSystem requires a canvas context');
        }

        if (!canvas) {
            throw new Error('RenderingSystem requires a canvas element');
        }

        this.ctx = ctx;
        this.canvas = canvas;
        this.config = {
            isMobile: false,
            enableMetrics: true,
            enableDebugInfo: false,
            ...config
        };

        // Initialize camera with viewport size
        this.camera = new Camera(0, 0, 1, canvas.width, canvas.height);

        // Initialize render pipeline
        this.pipeline = new RenderPipeline(ctx);

        // Individual renderers (initialized lazily)
        this.renderers = {
            background: null,
            border: null,
            snake: null,
            element: null,
            particle: null
        };

        // Rendering state
        this.initialized = false;
        this.enabled = true;
        this.frameCount = 0;

        // Metrics
        this.metrics = {
            fps: 0,
            frameTime: 0,
            renderTime: 0,
            updateTime: 0,
            lastFrameTimestamp: 0
        };
    }

    /**
     * Initializes all renderers
     * @param {Object} options - Initialization options
     * @param {number} options.mapWidth - Map width
     * @param {number} options.mapHeight - Map height
     * @param {Object} options.skinImages - Skin images for snakes
     */
    initialize(options = {}) {
        const {
            mapWidth = 10000,
            mapHeight = 10000,
            skinImages = {}
        } = options;

        // Store map dimensions
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;

        // Initialize camera for the map (corrected parameter order: minX, maxX, minY, maxY)
        this.camera.setBounds(-mapWidth / 2, mapWidth / 2, -mapHeight / 2, mapHeight / 2);

        // Create all renderers with shared dependencies
        this.renderers.background = new BackgroundRenderer(
            this.ctx,
            this.camera,
            { isMobile: this.config.isMobile }
        );

        this.renderers.border = new BorderRenderer(
            this.ctx,
            this.camera,
            { isMobile: this.config.isMobile }
        );

        this.renderers.snake = new SnakeRenderer(
            this.ctx,
            this.camera,
            { isMobile: this.config.isMobile, skinImages }
        );

        this.renderers.element = new ElementRenderer(
            this.ctx,
            this.camera,
            { isMobile: this.config.isMobile }
        );

        this.renderers.particle = new ParticleRenderer(
            this.ctx,
            this.camera,
            { isMobile: this.config.isMobile }
        );

        // Initialize renderer-specific state
        // Background renderer works without initialization
        // Border renderer works without initialization
        this.renderers.particle.initBorderParticles(mapWidth, mapHeight);

        // Register all renderers with the pipeline
        this.registerRenderers();

        this.initialized = true;

        if (this.config.enableDebugInfo) {
            console.log('[RenderingSystem] Initialized with', {
                mapWidth,
                mapHeight,
                isMobile: this.config.isMobile,
                renderers: Object.keys(this.renderers).length
            });
        }
    }

    /**
     * Registers all renderers with the render pipeline
     */
    registerRenderers() {
        // Register in layer order (using correct RenderLayer enum values)
        this.pipeline
            .registerRenderer(RenderLayer.BACKGROUND, {
                name: 'BackgroundRenderer',
                render: () => this.renderers.background.render()
            })
            .registerRenderer(RenderLayer.UI_OVERLAY, {
                name: 'BorderRenderer',
                render: () => this.renderers.border.render()
            })
            .registerRenderer(RenderLayer.GAME_OBJECTS, {
                name: 'ElementRenderer',
                render: (entities) => this.renderElements(entities || [])
            })
            .registerRenderer(RenderLayer.ENTITIES, {
                name: 'SnakeRenderer',
                render: (snakes) => this.renderSnakes(snakes || [])
            })
            .registerRenderer(RenderLayer.PARTICLES, {
                name: 'ParticleRenderer',
                render: () => this.renderers.particle.render()
            });

        if (this.config.enableDebugInfo) {
            console.log('[RenderingSystem] Registered 5 renderers across 5 layers');
        }
    }

    /**
     * Updates the rendering system
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime = 0) {
        if (!this.initialized || !this.enabled) return;

        const updateStart = performance.now();

        // Update camera (if needed for smooth scrolling, etc.)
        // this.camera.update(deltaTime);

        // Update renderers that need frame updates
        // Note: Only ParticleRenderer has an update method
        // BackgroundRenderer and BorderRenderer don't need updates
        this.renderers.particle.update(deltaTime);

        this.metrics.updateTime = performance.now() - updateStart;
    }

    /**
     * Renders the complete scene
     * @param {Object} gameState - Current game state
     * @param {Array} gameState.snakes - Array of snakes to render
     * @param {Array} gameState.elements - Array of elements to render
     */
    render(gameState = {}) {
        if (!this.initialized || !this.enabled) return;

        const renderStart = performance.now();

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state
        this.ctx.save();

        // Store game state for rendering
        this.currentGameState = gameState;

        // Render through pipeline (renders all layers in order)
        this.pipeline.render();

        // Restore context
        this.ctx.restore();

        // Update metrics
        this.metrics.renderTime = performance.now() - renderStart;
        this.metrics.frameTime = this.metrics.updateTime + this.metrics.renderTime;
        this.frameCount++;

        // Calculate FPS
        const now = performance.now();
        if (this.metrics.lastFrameTimestamp) {
            const deltaMs = now - this.metrics.lastFrameTimestamp;
            this.metrics.fps = Math.round(1000 / deltaMs);
        }
        this.metrics.lastFrameTimestamp = now;

        // Draw debug info if enabled
        if (this.config.enableDebugInfo) {
            this.renderDebugInfo();
        }
    }

    /**
     * Renders snakes (called by pipeline)
     * @param {Array} snakes - Snakes to render (optional, uses gameState if not provided)
     */
    renderSnakes(snakes) {
        const snakesToRender = snakes || this.currentGameState?.snakes || [];
        // SnakeRenderer.render() handles the array internally
        this.renderers.snake.render(this.ctx, snakesToRender, this.camera);
    }

    /**
     * Renders elements (called by pipeline)
     * @param {Array} elements - Elements to render (optional, uses gameState if not provided)
     */
    renderElements(elements) {
        const elementsToRender = elements || this.currentGameState?.elements || [];
        // ElementRenderer.render() handles the array internally
        this.renderers.element.render(this.ctx, elementsToRender, this.camera);
    }

    /**
     * Sets the camera target (for following entities)
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {boolean} smooth - Whether to smoothly interpolate
     */
    setCameraTarget(x, y, smooth = true) {
        // Camera uses follow() method with immediate flag
        this.camera.follow({ x, y }, !smooth);
    }

    /**
     * Sets camera zoom
     * @param {number} zoom - Zoom level (1.0 = normal)
     * @param {boolean} immediate - Whether to change immediately (default false)
     */
    setCameraZoom(zoom, immediate = false) {
        this.camera.setZoom(zoom, immediate);
    }

    /**
     * Gets the camera instance
     * @returns {Camera} Camera instance
     */
    getCamera() {
        return this.camera;
    }

    /**
     * Gets the particle renderer (for spawning particles)
     * @returns {ParticleRenderer} Particle renderer instance
     */
    getParticleRenderer() {
        return this.renderers.particle;
    }

    /**
     * Spawns particles at a world position
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} vx - X velocity
     * @param {number} vy - Y velocity
     * @param {string} color - Particle color
     * @param {number} size - Particle size
     * @param {string} type - Particle type
     * @param {Object} options - Additional options
     */
    spawnParticle(x, y, vx, vy, color, size, type, options) {
        if (this.renderers.particle) {
            return this.renderers.particle.spawnParticle(x, y, vx, vy, color, size, type, options);
        }
    }

    /**
     * Creates combination particles
     * @param {number} x - World X position
     * @param {number} y - World Y position
     */
    createCombinationParticles(x, y) {
        if (this.renderers.particle) {
            this.renderers.particle.createCombinationParticles(x, y);
        }
    }

    /**
     * Creates death explosion particles
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} count - Number of particles
     * @param {string} color - Particle color
     */
    createDeathParticles(x, y, count, color) {
        if (this.renderers.particle) {
            this.renderers.particle.createDeathParticles(x, y, count, color);
        }
    }

    /**
     * Creates boost trail particle
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @param {number} angle - Boost angle
     * @param {string} color - Particle color
     */
    createBoostParticle(x, y, angle, color) {
        if (this.renderers.particle) {
            this.renderers.particle.createBoostParticle(x, y, angle, color);
        }
    }

    /**
     * Resizes the rendering system
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.camera.setViewport(width, height);

        if (this.config.enableDebugInfo) {
            console.log(`[RenderingSystem] Resized to ${width}x${height}`);
        }
    }

    /**
     * Gets rendering metrics
     * @returns {Object} Metrics object
     */
    getMetrics() {
        return {
            ...this.metrics,
            pipeline: this.pipeline.getMetrics(),
            camera: {
                x: this.camera.x,
                y: this.camera.y,
                zoom: this.camera.zoom
            },
            renderers: {
                background: this.renderers.background?.getMetrics?.(),
                border: this.renderers.border?.getMetrics?.(),
                snake: this.renderers.snake?.getMetrics?.(),
                element: this.renderers.element?.getMetrics?.(),
                particle: this.renderers.particle?.getMetrics?.()
            }
        };
    }

    /**
     * Renders debug information overlay
     */
    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 250, 120);

        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '12px monospace';

        let y = 30;
        const lineHeight = 16;

        this.ctx.fillText(`FPS: ${this.metrics.fps}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`Frame: ${this.metrics.frameTime.toFixed(2)}ms`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`Update: ${this.metrics.updateTime.toFixed(2)}ms`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`Render: ${this.metrics.renderTime.toFixed(2)}ms`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`Camera: ${this.camera.x.toFixed(0)}, ${this.camera.y.toFixed(0)}`, 20, y);
        y += lineHeight;
        this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}x`, 20, y);
        y += lineHeight;

        const particleMetrics = this.renderers.particle?.getMetrics?.();
        if (particleMetrics) {
            this.ctx.fillText(`Particles: ${particleMetrics.activeParticles}`, 20, y);
        }

        this.ctx.restore();
    }

    /**
     * Enables rendering
     */
    enable() {
        this.enabled = true;
    }

    /**
     * Disables rendering
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Checks if system is enabled
     * @returns {boolean} True if enabled
     */
    isEnabled() {
        return this.enabled;
    }

    /**
     * Clears all renderer state
     */
    clear() {
        Object.values(this.renderers).forEach(renderer => {
            if (renderer?.clear) {
                renderer.clear();
            }
        });
    }

    /**
     * Disposes of all resources
     */
    dispose() {
        this.clear();
        this.pipeline.clearAllRenderers();
        this.enabled = false;
        this.initialized = false;
    }
}
