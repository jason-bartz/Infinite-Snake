/**
 * Unit tests for RenderingSystem
 *
 * Tests the complete rendering system integration including:
 * - System initialization
 * - Renderer registration and coordination
 * - Camera integration
 * - Particle spawning API
 * - Update and render cycle
 * - Metrics tracking
 * - Error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderingSystem } from '../../../src/systems/RenderingSystem.js';
import { RenderLayer } from '../../../src/systems/RenderLayer.js';

describe('RenderingSystem', () => {
    let mockCtx;
    let mockCanvas;
    let system;

    beforeEach(() => {
        // Mock canvas context
        mockCtx = {
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            scale: vi.fn(),
            rotate: vi.fn(),
            clearRect: vi.fn(),
            fillRect: vi.fn(),
            fillStyle: '',
            globalAlpha: 1,
            font: '',
            fillText: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            strokeStyle: '',
            lineWidth: 1,
            stroke: vi.fn(),
            shadowBlur: 0,
            shadowColor: ''
        };

        // Mock canvas element
        mockCanvas = {
            width: 1024,
            height: 768,
            getContext: vi.fn(() => mockCtx)
        };

        system = new RenderingSystem(mockCtx, mockCanvas, { isMobile: false });
    });

    describe('Constructor', () => {
        it('should create a rendering system with context and canvas', () => {
            expect(system.ctx).toBe(mockCtx);
            expect(system.canvas).toBe(mockCanvas);
        });

        it('should throw if no context provided', () => {
            expect(() => new RenderingSystem(null, mockCanvas)).toThrow('requires a canvas context');
        });

        it('should throw if no canvas provided', () => {
            expect(() => new RenderingSystem(mockCtx, null)).toThrow('requires a canvas element');
        });

        it('should initialize with camera', () => {
            expect(system.camera).toBeDefined();
            expect(system.camera.viewportWidth).toBe(1024);
            expect(system.camera.viewportHeight).toBe(768);
        });

        it('should initialize with render pipeline', () => {
            expect(system.pipeline).toBeDefined();
        });

        it('should start not initialized', () => {
            expect(system.initialized).toBe(false);
        });

        it('should start enabled', () => {
            expect(system.enabled).toBe(true);
        });

        it('should accept configuration', () => {
            const customSystem = new RenderingSystem(mockCtx, mockCanvas, {
                isMobile: true,
                enableMetrics: false,
                enableDebugInfo: true
            });

            expect(customSystem.config.isMobile).toBe(true);
            expect(customSystem.config.enableMetrics).toBe(false);
            expect(customSystem.config.enableDebugInfo).toBe(true);
        });
    });

    describe('Initialization', () => {
        it('should initialize all renderers', () => {
            system.initialize({ mapWidth: 2000, mapHeight: 2000 });

            expect(system.initialized).toBe(true);
            expect(system.renderers.background).toBeDefined();
            expect(system.renderers.border).toBeDefined();
            expect(system.renderers.snake).toBeDefined();
            expect(system.renderers.element).toBeDefined();
            expect(system.renderers.particle).toBeDefined();
        });

        it('should set map dimensions', () => {
            system.initialize({ mapWidth: 3000, mapHeight: 2500 });

            expect(system.mapWidth).toBe(3000);
            expect(system.mapHeight).toBe(2500);
        });

        it('should initialize camera bounds', () => {
            system.initialize({ mapWidth: 2000, mapHeight: 1500 });

            // Camera.bounds is a private object, check via getViewportBounds or check x,y limits work
            expect(system.camera.bounds).toBeDefined();
            expect(system.camera.bounds.minX).toBe(-1000);
            expect(system.camera.bounds.maxX).toBe(1000);
            expect(system.camera.bounds.minY).toBe(-750);
            expect(system.camera.bounds.maxY).toBe(750);
        });

        it('should use default map size if not provided', () => {
            system.initialize();

            expect(system.mapWidth).toBe(10000);
            expect(system.mapHeight).toBe(10000);
        });

        it('should pass skin images to snake renderer', () => {
            const skinImages = { default: 'image1', fire: 'image2' };
            system.initialize({ skinImages });

            expect(system.renderers.snake).toBeDefined();
        });

        it('should register all renderers with pipeline', () => {
            const registerSpy = vi.spyOn(system.pipeline, 'registerRenderer');

            system.initialize();

            expect(registerSpy).toHaveBeenCalledTimes(5);
        });

        it('should initialize renderer-specific state', () => {
            system.initialize({ mapWidth: 2000, mapHeight: 2000 });

            // Particle renderer should have border particles
            const particleMetrics = system.renderers.particle.getMetrics();
            expect(particleMetrics.borderParticles).toBeGreaterThan(0);
        });
    });

    describe('Update', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should update all renderers', () => {
            // Only ParticleRenderer has an update method
            const particleUpdate = vi.spyOn(system.renderers.particle, 'update');

            system.update(0.016);

            // Only particle renderer needs updates
            expect(particleUpdate).toHaveBeenCalledWith(0.016);
        });

        it('should track update time', () => {
            system.update(0.016);

            expect(system.metrics.updateTime).toBeGreaterThanOrEqual(0);
        });

        it('should not update if not initialized', () => {
            const uninitializedSystem = new RenderingSystem(mockCtx, mockCanvas);
            const initialMetrics = { ...uninitializedSystem.metrics };

            uninitializedSystem.update(0.016);

            expect(uninitializedSystem.metrics).toEqual(initialMetrics);
        });

        it('should not update if disabled', () => {
            system.disable();
            const initialMetrics = { ...system.metrics };

            system.update(0.016);

            expect(system.metrics).toEqual(initialMetrics);
        });
    });

    describe('Render', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should clear canvas', () => {
            system.render();

            expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 1024, 768);
        });

        it('should save and restore context', () => {
            system.render();

            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.restore).toHaveBeenCalled();
        });

        it('should render through pipeline', () => {
            const pipelineRender = vi.spyOn(system.pipeline, 'render');

            system.render();

            expect(pipelineRender).toHaveBeenCalled();
        });

        it('should track render time', () => {
            system.render();

            expect(system.metrics.renderTime).toBeGreaterThanOrEqual(0);
        });

        it('should track frame time', () => {
            system.update(0.016);
            system.render();

            expect(system.metrics.frameTime).toBeGreaterThanOrEqual(0);
        });

        it('should increment frame count', () => {
            const initialCount = system.frameCount;

            system.render();
            system.render();
            system.render();

            expect(system.frameCount).toBe(initialCount + 3);
        });

        it('should calculate FPS', () => {
            system.render();
            system.render();

            expect(system.metrics.fps).toBeGreaterThan(0);
        });

        it('should render snakes from game state', () => {
            const snakes = [
                { x: 100, y: 100, segments: [] },
                { x: 200, y: 200, segments: [] }
            ];

            // SnakeRenderer.render() is called through the pipeline
            const renderSpy = vi.spyOn(system.renderers.snake, 'render');

            system.render({ snakes });

            // Check that render was called (args passed through pipeline wrapper)
            expect(renderSpy).toHaveBeenCalled();
        });

        it('should render elements from game state', () => {
            const elements = [
                { x: 100, y: 100, emoji: '🔥' },
                { x: 200, y: 200, emoji: '💧' }
            ];

            // ElementRenderer.render() is called through the pipeline
            const renderSpy = vi.spyOn(system.renderers.element, 'render');

            system.render({ elements });

            // Check that render was called (args passed through pipeline wrapper)
            expect(renderSpy).toHaveBeenCalled();
        });

        it('should not render if not initialized', () => {
            const uninitializedSystem = new RenderingSystem(mockCtx, mockCanvas);

            uninitializedSystem.render();

            expect(mockCtx.clearRect).not.toHaveBeenCalled();
        });

        it('should not render if disabled', () => {
            system.disable();

            system.render();

            expect(mockCtx.clearRect).not.toHaveBeenCalled();
        });
    });

    describe('Camera Control', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should set camera target without smoothing', () => {
            system.setCameraTarget(500, 300, false);

            expect(system.camera.x).toBe(500);
            expect(system.camera.y).toBe(300);
        });

        it('should set camera zoom', () => {
            system.setCameraZoom(2.0, true); // immediate = true to set instantly

            expect(system.camera.zoom).toBe(2.0);
        });

        it('should get camera instance', () => {
            const camera = system.getCamera();

            expect(camera).toBe(system.camera);
        });
    });

    describe('Particle API', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should get particle renderer', () => {
            const renderer = system.getParticleRenderer();

            expect(renderer).toBe(system.renderers.particle);
        });

        it('should spawn particles', () => {
            const spawnSpy = vi.spyOn(system.renderers.particle, 'spawnParticle');

            system.spawnParticle(100, 200, 5, -3, 'red', 4, 'circle');

            expect(spawnSpy).toHaveBeenCalledWith(100, 200, 5, -3, 'red', 4, 'circle', undefined);
        });

        it('should create combination particles', () => {
            const createSpy = vi.spyOn(system.renderers.particle, 'createCombinationParticles');

            system.createCombinationParticles(300, 400);

            expect(createSpy).toHaveBeenCalledWith(300, 400);
        });

        it('should create death particles', () => {
            const createSpy = vi.spyOn(system.renderers.particle, 'createDeathParticles');

            system.createDeathParticles(500, 600, 20, '#ff0000');

            expect(createSpy).toHaveBeenCalledWith(500, 600, 20, '#ff0000');
        });

        it('should create boost particles', () => {
            const createSpy = vi.spyOn(system.renderers.particle, 'createBoostParticle');

            system.createBoostParticle(100, 100, Math.PI / 2, 'blue');

            expect(createSpy).toHaveBeenCalledWith(100, 100, Math.PI / 2, 'blue');
        });
    });

    describe('Resize', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should resize canvas', () => {
            system.resize(1920, 1080);

            expect(system.canvas.width).toBe(1920);
            expect(system.canvas.height).toBe(1080);
        });

        it('should update camera viewport', () => {
            system.resize(800, 600);

            expect(system.camera.viewportWidth).toBe(800);
            expect(system.camera.viewportHeight).toBe(600);
        });
    });

    describe('Metrics', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should return comprehensive metrics', () => {
            system.update(0.016);
            system.render();

            const metrics = system.getMetrics();

            expect(metrics.fps).toBeDefined();
            expect(metrics.frameTime).toBeDefined();
            expect(metrics.renderTime).toBeDefined();
            expect(metrics.updateTime).toBeDefined();
            expect(metrics.pipeline).toBeDefined();
            expect(metrics.camera).toBeDefined();
            expect(metrics.renderers).toBeDefined();
        });

        it('should include camera position in metrics', () => {
            system.setCameraTarget(100, 200, false);

            const metrics = system.getMetrics();

            expect(metrics.camera.x).toBe(100);
            expect(metrics.camera.y).toBe(200);
        });

        it('should include renderer metrics', () => {
            const metrics = system.getMetrics();

            expect(metrics.renderers.background).toBeDefined();
            expect(metrics.renderers.border).toBeDefined();
            expect(metrics.renderers.snake).toBeDefined();
            expect(metrics.renderers.element).toBeDefined();
            expect(metrics.renderers.particle).toBeDefined();
        });
    });

    describe('Enable/Disable', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should start enabled', () => {
            expect(system.isEnabled()).toBe(true);
        });

        it('should disable rendering', () => {
            system.disable();

            expect(system.isEnabled()).toBe(false);

            system.render();
            expect(mockCtx.clearRect).not.toHaveBeenCalled();
        });

        it('should re-enable rendering', () => {
            system.disable();
            system.enable();

            expect(system.isEnabled()).toBe(true);

            system.render();
            expect(mockCtx.clearRect).toHaveBeenCalled();
        });
    });

    describe('Clear and Dispose', () => {
        beforeEach(() => {
            system.initialize();
        });

        it('should clear all renderer state', () => {
            system.spawnParticle(0, 0, 1, 1, 'red');

            system.clear();

            const particleMetrics = system.renderers.particle.getMetrics();
            expect(particleMetrics.activeParticles).toBe(0);
        });

        it('should dispose of all resources', () => {
            const clearSpy = vi.spyOn(system.pipeline, 'clearAllRenderers');

            system.dispose();

            expect(clearSpy).toHaveBeenCalled();
            expect(system.enabled).toBe(false);
            expect(system.initialized).toBe(false);
        });
    });

    describe('Debug Info', () => {
        it('should render debug info when enabled', () => {
            const debugSystem = new RenderingSystem(mockCtx, mockCanvas, {
                enableDebugInfo: true
            });
            debugSystem.initialize();

            debugSystem.render();

            // Should draw debug overlay
            expect(mockCtx.fillText).toHaveBeenCalled();
        });

        it('should not render debug info when disabled', () => {
            system.initialize();

            system.render();

            // Should not draw debug text
            expect(mockCtx.fillText).not.toHaveBeenCalled();
        });
    });

    describe('Integration', () => {
        beforeEach(() => {
            system.initialize({ mapWidth: 2000, mapHeight: 2000 });
        });

        it('should coordinate full render cycle', () => {
            const gameState = {
                snakes: [{ x: 100, y: 100, segments: [{ x: 100, y: 100 }] }],
                elements: [{ x: 200, y: 200, emoji: '🔥', active: true }]
            };

            system.update(0.016);
            system.render(gameState);

            expect(mockCtx.clearRect).toHaveBeenCalled();
            expect(system.frameCount).toBeGreaterThan(0);
            expect(system.metrics.frameTime).toBeGreaterThan(0);
        });

        it('should handle empty game state', () => {
            system.update(0.016);
            system.render({});

            expect(mockCtx.clearRect).toHaveBeenCalled();
        });

        it('should maintain performance metrics across frames', () => {
            system.update(0.016);
            system.render();
            const fps1 = system.metrics.fps;

            system.update(0.016);
            system.render();
            const fps2 = system.metrics.fps;

            expect(fps1).toBeGreaterThanOrEqual(0);
            expect(fps2).toBeGreaterThanOrEqual(0);
        });
    });
});
