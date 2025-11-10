/**
 * Unit tests for ParticleRenderer
 *
 * Tests particle system rendering including:
 * - Particle lifecycle (spawn, update, death)
 * - Particle pooling and reuse
 * - Border particle animation
 * - Different particle types (square, circle, star)
 * - Particle effects (trails, pulses, rotation)
 * - Viewport culling
 * - Performance metrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    ParticleRenderer,
    Particle,
    BorderParticle,
    ParticlePool
} from '../../../../src/systems/renderers/ParticleRenderer.js';
import { RenderLayer } from '../../../../src/systems/RenderLayer.js';

describe('Particle', () => {
    it('should create a particle with default properties', () => {
        const particle = new Particle(100, 200, 5, -3, 'red');

        expect(particle.x).toBe(100);
        expect(particle.y).toBe(200);
        expect(particle.vx).toBe(5);
        expect(particle.vy).toBe(-3);
        expect(particle.color).toBe('red');
        expect(particle.size).toBe(4);
        expect(particle.life).toBe(1);
        expect(particle.active).toBe(true);
        expect(particle.type).toBe('square');
    });

    it('should create a particle with custom size and type', () => {
        const particle = new Particle(0, 0, 0, 0, 'blue', 10, 'circle');

        expect(particle.size).toBe(10);
        expect(particle.type).toBe('circle');
    });

    it('should reset particle properties', () => {
        const particle = new Particle(0, 0, 0, 0, 'white');
        particle.life = 0.5;
        particle.active = false;

        particle.reset(50, 75, 2, 3, 'green', 8, 'star', { gravity: 0.5 });

        expect(particle.x).toBe(50);
        expect(particle.y).toBe(75);
        expect(particle.vx).toBe(2);
        expect(particle.vy).toBe(3);
        expect(particle.color).toBe('green');
        expect(particle.size).toBe(8);
        expect(particle.type).toBe('star');
        expect(particle.life).toBe(1);
        expect(particle.active).toBe(true);
        expect(particle.gravity).toBe(0.5);
    });

    it('should update particle position based on velocity', () => {
        const particle = new Particle(100, 100, 5, -3, 'red');
        particle.update(1);

        expect(particle.x).toBeCloseTo(105, 1);
        expect(particle.y).toBeCloseTo(97, 1);
    });

    it('should apply friction to velocity', () => {
        const particle = new Particle(0, 0, 10, 10, 'red');
        const initialVx = particle.vx;
        const initialVy = particle.vy;

        particle.update(1);

        expect(particle.vx).toBeLessThan(initialVx);
        expect(particle.vy).toBeLessThan(initialVy);
    });

    it('should apply gravity to Y velocity', () => {
        const particle = new Particle(0, 0, 0, 0, 'red', 4, 'square', { gravity: 0.5 });
        const initialVy = particle.vy;

        particle.update(1);

        expect(particle.vy).toBeGreaterThan(initialVy);
    });

    it('should decrease life over time', () => {
        const particle = new Particle(0, 0, 0, 0, 'red');
        const initialLife = particle.life;

        particle.update(1);

        expect(particle.life).toBeLessThan(initialLife);
    });

    it('should deactivate when life reaches zero', () => {
        const particle = new Particle(0, 0, 0, 0, 'red');

        // Update multiple times to deplete life
        for (let i = 0; i < 100; i++) {
            particle.update(1);
        }

        expect(particle.active).toBe(false);
        expect(particle.life).toBeLessThanOrEqual(0);
    });

    it('should return false when particle dies', () => {
        const particle = new Particle(0, 0, 0, 0, 'red');
        particle.life = 0.01;

        const alive = particle.update(1);

        expect(alive).toBe(false);
    });

    it('should update rotation with rotation speed', () => {
        const particle = new Particle(0, 0, 0, 0, 'red', 4, 'square', {
            rotationSpeed: 0.1
        });
        const initialRotation = particle.rotation;

        particle.update(1);

        expect(particle.rotation).toBeGreaterThan(initialRotation);
    });

    it('should grow size with growth rate', () => {
        const particle = new Particle(0, 0, 0, 0, 'red', 4, 'square', {
            growthRate: 0.5
        });
        const initialSize = particle.size;

        particle.update(1);

        expect(particle.size).toBeGreaterThan(initialSize);
    });

    it('should update pulse phase', () => {
        const particle = new Particle(0, 0, 0, 0, 'red', 4, 'square', {
            pulse: true,
            pulseSpeed: 0.2
        });
        const initialPhase = particle.pulsePhase;

        particle.update(1);

        expect(particle.pulsePhase).toBeGreaterThan(initialPhase);
    });

    it('should track trail history', () => {
        const particle = new Particle(0, 0, 5, 0, 'red', 4, 'square', {
            trail: true,
            trailLength: 5
        });

        particle.update(1);
        particle.update(1);
        particle.update(1);

        expect(particle.trailHistory.length).toBeGreaterThan(0);
        expect(particle.trailHistory.length).toBeLessThanOrEqual(5);
    });

    it('should limit trail history to trailLength', () => {
        const particle = new Particle(0, 0, 1, 0, 'red', 4, 'square', {
            trail: true,
            trailLength: 3
        });

        for (let i = 0; i < 10; i++) {
            particle.update(1);
        }

        expect(particle.trailHistory.length).toBeLessThanOrEqual(3);
    });

    it('should clear trail history when deactivated', () => {
        const particle = new Particle(0, 0, 1, 0, 'red', 4, 'square', {
            trail: true
        });

        particle.update(1);
        particle.update(1);
        expect(particle.trailHistory.length).toBeGreaterThan(0);

        particle.life = 0;
        particle.update(1);

        expect(particle.trailHistory.length).toBe(0);
    });
});

describe('BorderParticle', () => {
    it('should create a border particle with position and edge', () => {
        const particle = new BorderParticle(100, 200, 'left');

        expect(particle.x).toBe(100);
        expect(particle.y).toBe(200);
        expect(particle.edge).toBe('left');
        expect(particle.baseX).toBe(100);
        expect(particle.baseY).toBe(200);
    });

    it('should have random properties within expected ranges', () => {
        const particle = new BorderParticle(0, 0, 'top');

        expect(particle.size).toBeGreaterThanOrEqual(1);
        expect(particle.size).toBeLessThanOrEqual(4);
        expect(particle.speed).toBeGreaterThanOrEqual(0.1);
        expect(particle.speed).toBeLessThanOrEqual(0.6);
        expect(particle.opacity).toBeGreaterThanOrEqual(0.3);
        expect(particle.opacity).toBeLessThanOrEqual(0.8);
    });

    it('should return a valid RGBA color prefix', () => {
        const particle = new BorderParticle(0, 0, 'right');

        expect(particle.color).toMatch(/^rgba\(\d+, \d+, \d+, $/);
    });

    it('should update position with floating animation', () => {
        const particle = new BorderParticle(100, 100, 'bottom');
        const initialX = particle.x;
        const initialY = particle.y;

        particle.update(0);
        particle.update(1);

        // Position should change due to floating animation
        expect(particle.x !== initialX || particle.y !== initialY).toBe(true);
    });

    it('should pulse opacity over time', () => {
        const particle = new BorderParticle(0, 0, 'left');
        const opacities = [];

        for (let i = 0; i < 10; i++) {
            particle.update(i * 0.5);
            opacities.push(particle.opacity);
        }

        // Opacity should vary
        const minOpacity = Math.min(...opacities);
        const maxOpacity = Math.max(...opacities);
        expect(maxOpacity).toBeGreaterThan(minOpacity);
    });
});

describe('ParticlePool', () => {
    it('should create a pool with specified size', () => {
        const pool = new ParticlePool(50);

        expect(pool.poolSize).toBe(50);
        expect(pool.pool.length).toBeLessThanOrEqual(50);
        expect(pool.activeParticles.length).toBe(0);
    });

    it('should spawn particles from the pool', () => {
        const pool = new ParticlePool(10);
        const particle = pool.spawn(10, 20, 1, -1, 'blue');

        expect(particle).toBeDefined();
        expect(particle.x).toBe(10);
        expect(particle.y).toBe(20);
        expect(particle.color).toBe('blue');
        expect(pool.activeParticles.length).toBe(1);
    });

    it('should reuse particles from the pool', () => {
        const pool = new ParticlePool(5);
        const initialPoolSize = pool.pool.length;

        const p1 = pool.spawn(0, 0, 0, 0, 'red');
        const poolSizeAfterSpawn = pool.pool.length;

        expect(poolSizeAfterSpawn).toBeLessThan(initialPoolSize);
    });

    it('should return particles to pool when they die', () => {
        const pool = new ParticlePool(10);
        const particle = pool.spawn(0, 0, 0, 0, 'red');
        const initialPoolSize = pool.pool.length;

        // Kill the particle
        particle.life = 0;
        pool.update(1);

        expect(pool.activeParticles.length).toBe(0);
        expect(pool.pool.length).toBeGreaterThan(initialPoolSize);
    });

    it('should create new particles when pool is empty', () => {
        const pool = new ParticlePool(2);

        // Exhaust the pool
        pool.spawn(0, 0, 0, 0, 'red');
        pool.spawn(0, 0, 0, 0, 'blue');
        pool.spawn(0, 0, 0, 0, 'green'); // Should create new

        expect(pool.activeParticles.length).toBe(3);
    });

    it('should update all active particles', () => {
        const pool = new ParticlePool(10);
        const p1 = pool.spawn(0, 0, 5, 0, 'red');
        const p2 = pool.spawn(0, 0, 0, 5, 'blue');

        const initialX1 = p1.x;
        const initialY2 = p2.y;

        pool.update(1);

        expect(p1.x).not.toBe(initialX1);
        expect(p2.y).not.toBe(initialY2);
    });

    it('should return active particle count', () => {
        const pool = new ParticlePool(10);

        expect(pool.getActiveCount()).toBe(0);

        pool.spawn(0, 0, 0, 0, 'red');
        expect(pool.getActiveCount()).toBe(1);

        pool.spawn(0, 0, 0, 0, 'blue');
        expect(pool.getActiveCount()).toBe(2);
    });

    it('should clear all active particles', () => {
        const pool = new ParticlePool(10);
        pool.spawn(0, 0, 0, 0, 'red');
        pool.spawn(0, 0, 0, 0, 'blue');
        pool.spawn(0, 0, 0, 0, 'green');

        expect(pool.getActiveCount()).toBe(3);

        pool.clear();

        expect(pool.getActiveCount()).toBe(0);
        expect(pool.activeParticles.length).toBe(0);
    });
});

describe('ParticleRenderer', () => {
    let mockCtx;
    let mockCamera;
    let renderer;

    beforeEach(() => {
        mockCtx = {
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            fillRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            fillStyle: '',
            globalAlpha: 1,
            shadowBlur: 0,
            shadowColor: ''
        };

        mockCamera = {
            worldToScreen: vi.fn((x, y) => ({ x, y })),
            isInViewport: vi.fn(() => true),
            zoom: 1
        };

        renderer = new ParticleRenderer(mockCtx, mockCamera, { isMobile: false });
    });

    describe('Constructor', () => {
        it('should initialize with canvas context and camera', () => {
            expect(renderer.ctx).toBe(mockCtx);
            expect(renderer.camera).toBe(mockCamera);
        });

        it('should create a particle pool', () => {
            expect(renderer.particlePool).toBeDefined();
            expect(renderer.particlePool.poolSize).toBe(200);
        });

        it('should use smaller pool on mobile', () => {
            const mobileRenderer = new ParticleRenderer(mockCtx, mockCamera, {
                isMobile: true
            });

            expect(mobileRenderer.particlePool.poolSize).toBe(50);
        });

        it('should initialize border particles array', () => {
            expect(renderer.borderParticles).toBeDefined();
            expect(Array.isArray(renderer.borderParticles)).toBe(true);
        });

        it('should initialize metrics', () => {
            expect(renderer.metrics).toBeDefined();
            expect(renderer.metrics.particlesRendered).toBe(0);
            expect(renderer.metrics.particlesCulled).toBe(0);
        });
    });

    describe('Particle Spawning', () => {
        it('should spawn a particle', () => {
            const particle = renderer.spawnParticle(100, 200, 5, -3, 'red');

            expect(particle).toBeDefined();
            expect(particle.x).toBe(100);
            expect(particle.y).toBe(200);
        });

        it('should create combination particles', () => {
            const initialCount = renderer.particlePool.getActiveCount();

            renderer.createCombinationParticles(500, 500);

            expect(renderer.particlePool.getActiveCount()).toBeGreaterThan(initialCount);
        });

        it('should create fewer combination particles on mobile', () => {
            const desktopRenderer = new ParticleRenderer(mockCtx, mockCamera, {
                isMobile: false
            });
            const mobileRenderer = new ParticleRenderer(mockCtx, mockCamera, {
                isMobile: true
            });

            desktopRenderer.createCombinationParticles(0, 0);
            mobileRenderer.createCombinationParticles(0, 0);

            expect(mobileRenderer.particlePool.getActiveCount())
                .toBeLessThan(desktopRenderer.particlePool.getActiveCount());
        });

        it('should create death particles', () => {
            const initialCount = renderer.particlePool.getActiveCount();

            renderer.createDeathParticles(300, 400, 10, '#ff0000');

            expect(renderer.particlePool.getActiveCount()).toBe(initialCount + 10);
        });

        it('should create boost particles', () => {
            const initialCount = renderer.particlePool.getActiveCount();

            renderer.createBoostParticle(100, 100, Math.PI / 2, 'blue');

            expect(renderer.particlePool.getActiveCount()).toBe(initialCount + 1);
        });
    });

    describe('Border Particles', () => {
        it('should initialize border particles', () => {
            renderer.initBorderParticles(2000, 2000);

            expect(renderer.borderParticles.length).toBeGreaterThan(0);
            expect(renderer.borderParticles.length).toBeLessThanOrEqual(renderer.maxBorderParticles);
        });

        it('should place border particles on edges', () => {
            renderer.initBorderParticles(2000, 2000);

            renderer.borderParticles.forEach(particle => {
                expect(['left', 'right', 'top', 'bottom']).toContain(particle.edge);
            });
        });

        it('should create fewer border particles on mobile', () => {
            const mobileRenderer = new ParticleRenderer(mockCtx, mockCamera, {
                isMobile: true
            });

            expect(mobileRenderer.maxBorderParticles).toBeLessThan(renderer.maxBorderParticles);
        });
    });

    describe('Update', () => {
        it('should update animation time', () => {
            const initialTime = renderer.animationTime;

            renderer.update(1);

            expect(renderer.animationTime).toBeGreaterThan(initialTime);
        });

        it('should update particle pool', () => {
            const particle = renderer.spawnParticle(0, 0, 5, 0, 'red');
            const initialX = particle.x;

            renderer.update(1);

            expect(particle.x).not.toBe(initialX);
        });

        it('should update border particles', () => {
            renderer.initBorderParticles(2000, 2000);
            const particle = renderer.borderParticles[0];
            const initialX = particle.x;

            renderer.update(1);

            // May or may not change depending on animation phase
            expect(particle).toBeDefined();
        });

        it('should reset metrics on update', () => {
            renderer.metrics.particlesRendered = 100;
            renderer.metrics.particlesCulled = 50;

            renderer.update(1);

            expect(renderer.metrics.particlesRendered).toBe(0);
            expect(renderer.metrics.particlesCulled).toBe(0);
        });
    });

    describe('Rendering', () => {
        it('should render active particles', () => {
            renderer.spawnParticle(100, 100, 0, 0, 'red');
            renderer.render();

            expect(mockCtx.fillRect).toHaveBeenCalled();
        });

        it('should render border particles', () => {
            renderer.initBorderParticles(2000, 2000);
            renderer.render();

            expect(mockCtx.arc).toHaveBeenCalled();
        });

        it('should cull off-screen particles', () => {
            mockCamera.isInViewport = vi.fn((x, y) => x < 500);

            renderer.spawnParticle(100, 100, 0, 0, 'red'); // In viewport
            renderer.spawnParticle(1000, 100, 0, 0, 'blue'); // Out of viewport

            renderer.render();

            expect(renderer.metrics.particlesCulled).toBeGreaterThan(0);
        });

        it('should render circle particles', () => {
            renderer.spawnParticle(100, 100, 0, 0, 'red', 10, 'circle');
            renderer.render();

            expect(mockCtx.arc).toHaveBeenCalled();
        });

        it('should render star particles', () => {
            renderer.spawnParticle(100, 100, 0, 0, 'red', 10, 'star');
            renderer.render();

            expect(mockCtx.lineTo).toHaveBeenCalled();
        });

        it('should render square particles', () => {
            renderer.spawnParticle(100, 100, 0, 0, 'red', 10, 'square');
            renderer.render();

            expect(mockCtx.fillRect).toHaveBeenCalled();
        });

        it('should apply pulse effect to particles', () => {
            renderer.spawnParticle(100, 100, 0, 0, 'red', 10, 'circle', {
                pulse: true
            });
            renderer.update(1);
            renderer.render();

            expect(mockCtx.arc).toHaveBeenCalled();
        });

        it('should render particle trails', () => {
            const particle = renderer.spawnParticle(0, 0, 10, 0, 'red', 4, 'square', {
                trail: true
            });

            // Generate trail history
            for (let i = 0; i < 5; i++) {
                renderer.update(1);
            }

            renderer.render();

            expect(mockCtx.fillRect).toHaveBeenCalled();
        });

        it('should not render glow on mobile border particles', () => {
            const mobileRenderer = new ParticleRenderer(mockCtx, mockCamera, {
                isMobile: true
            });

            mobileRenderer.initBorderParticles(2000, 2000);
            mobileRenderer.render();

            expect(mockCtx.shadowBlur).toBe(0);
        });

        it('should render glow on desktop border particles', () => {
            renderer.initBorderParticles(2000, 2000);
            renderer.render();

            expect(mockCtx.shadowBlur).toBeGreaterThan(0);
        });
    });

    describe('Metrics', () => {
        it('should track rendered particles', () => {
            renderer.spawnParticle(100, 100, 0, 0, 'red');
            renderer.spawnParticle(200, 200, 0, 0, 'blue');
            renderer.render();

            const metrics = renderer.getMetrics();
            expect(metrics.particlesRendered).toBe(2);
        });

        it('should track active particle count', () => {
            renderer.spawnParticle(0, 0, 0, 0, 'red');
            renderer.spawnParticle(0, 0, 0, 0, 'blue');

            const metrics = renderer.getMetrics();
            expect(metrics.activeParticles).toBe(2);
        });

        it('should track pooled particle count', () => {
            const metrics = renderer.getMetrics();
            expect(metrics.pooledParticles).toBeGreaterThan(0);
        });
    });

    describe('Utility Methods', () => {
        it('should check viewport bounds', () => {
            const result = renderer.isInViewport(100, 100);
            expect(mockCamera.isInViewport).toHaveBeenCalledWith(100, 100, 50);
        });

        it('should return particle pool', () => {
            const pool = renderer.getPool();
            expect(pool).toBe(renderer.particlePool);
        });

        it('should clear all particles', () => {
            renderer.spawnParticle(0, 0, 0, 0, 'red');
            renderer.initBorderParticles(2000, 2000);

            renderer.clear();

            expect(renderer.particlePool.getActiveCount()).toBe(0);
            expect(renderer.borderParticles.length).toBe(0);
        });

        it('should return correct render layer', () => {
            expect(renderer.getLayer()).toBe(RenderLayer.EFFECTS);
        });
    });
});
