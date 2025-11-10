/**
 * ParticleFactory Tests
 *
 * Comprehensive unit tests for the ParticleFactory class.
 * Tests entity creation, component configuration, and convenience methods.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import ParticleFactory from '../../../src/entities/ParticleFactory.js';
import { Coordinator } from '../../../src/core/ecs/Coordinator.js';
import {
  Transform,
  Velocity,
  Lifetime,
  Renderable,
  ParticleVisuals,
  Trail
} from '../../../src/components/index.js';

describe('ParticleFactory', () => {
  let factory;
  let coordinator;

  beforeEach(() => {
    coordinator = new Coordinator();
    factory = new ParticleFactory(coordinator);
  });

  // ========================================
  // 1. INITIALIZATION TESTS
  // ========================================

  describe('Initialization', () => {
    it('should create a new ParticleFactory', () => {
      expect(factory).toBeInstanceOf(ParticleFactory);
    });

    it('should require a coordinator', () => {
      expect(() => new ParticleFactory()).toThrow('ParticleFactory requires a coordinator');
    });

    it('should store coordinator reference', () => {
      expect(factory.coordinator).toBe(coordinator);
    });

    it('should initialize default options', () => {
      expect(factory.defaults).toBeDefined();
      expect(factory.defaults.size).toBe(4);
      expect(factory.defaults.type).toBe('square');
      expect(factory.defaults.fadeRate).toBe(0.02);
    });

    it('should initialize statistics', () => {
      expect(factory.stats).toBeDefined();
      expect(factory.stats.totalCreated).toBe(0);
      expect(factory.stats.byType).toBeDefined();
    });
  });

  // ========================================
  // 2. BASIC PARTICLE CREATION TESTS
  // ========================================

  describe('Basic Particle Creation', () => {
    it('should create a particle entity', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red');

      expect(particle).toBeDefined();
      expect(particle.id).toBeDefined();
    });

    it('should add particle to coordinator', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red');

      expect(coordinator.getEntity(particle.id)).toBe(particle);
    });

    it('should add all required components', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red');

      expect(particle.hasComponent(Transform)).toBe(true);
      expect(particle.hasComponent(Velocity)).toBe(true);
      expect(particle.hasComponent(Lifetime)).toBe(true);
      expect(particle.hasComponent(Renderable)).toBe(true);
      expect(particle.hasComponent(ParticleVisuals)).toBe(true);
      expect(particle.hasComponent(Trail)).toBe(true);
    });

    it('should set Transform component correctly', () => {
      const particle = factory.createParticle(150, 200, 1, 2, 'red');
      const transform = particle.getComponent(Transform);

      expect(transform.x).toBe(150);
      expect(transform.y).toBe(200);
      expect(transform.rotation).toBe(0);
      expect(transform.scale).toBe(1);
    });

    it('should set Velocity component correctly', () => {
      const particle = factory.createParticle(100, 100, 3, -2, 'red');
      const velocity = particle.getComponent(Velocity);

      expect(velocity.vx).toBe(3);
      expect(velocity.vy).toBe(-2);
      expect(velocity.friction).toBe(0.98);
      expect(velocity.gravity).toBe(0);
    });

    it('should set Lifetime component correctly', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red');
      const lifetime = particle.getComponent(Lifetime);

      expect(lifetime.life).toBe(1);
      expect(lifetime.maxLife).toBe(1);
      expect(lifetime.fadeRate).toBe(0.02);
    });

    it('should set Renderable component correctly', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red');
      const renderable = particle.getComponent(Renderable);

      expect(renderable.layer).toBe(6);
      expect(renderable.visible).toBe(true);
    });

    it('should set ParticleVisuals component correctly', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'yellow', 8);
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.color).toBe('yellow');
      expect(visuals.size).toBe(8);
      expect(visuals.type).toBe('square');
    });

    it('should set Trail component correctly', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red');
      const trail = particle.getComponent(Trail);

      expect(trail.enabled).toBe(false);
      expect(trail.length).toBe(5);
    });
  });

  // ========================================
  // 3. PARTICLE TYPE TESTS
  // ========================================

  describe('Particle Types', () => {
    it('should create square particle', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('square');
    });

    it('should create circle particle', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'circle');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('circle');
    });

    it('should create star particle', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'star');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('star');
    });

    it('should create trail particle', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'trail');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('trail');
    });

    it('should default to square when type not specified', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('square');
    });
  });

  // ========================================
  // 4. OPTIONS TESTS
  // ========================================

  describe('Particle Options', () => {
    it('should apply custom fadeRate', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        fadeRate: 0.05
      });
      const lifetime = particle.getComponent(Lifetime);

      expect(lifetime.fadeRate).toBe(0.05);
    });

    it('should apply custom gravity', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        gravity: 0.5
      });
      const velocity = particle.getComponent(Velocity);

      expect(velocity.gravity).toBe(0.5);
    });

    it('should apply custom rotation', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        rotation: Math.PI / 4
      });
      const transform = particle.getComponent(Transform);

      expect(transform.rotation).toBe(Math.PI / 4);
    });

    it('should apply custom rotationSpeed', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        rotationSpeed: 0.1
      });
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.rotationSpeed).toBe(0.1);
    });

    it('should apply custom growthRate', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        growthRate: 0.5
      });
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.growthRate).toBe(0.5);
    });

    it('should enable trail', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        trail: true,
        trailLength: 10
      });
      const trail = particle.getComponent(Trail);

      expect(trail.enabled).toBe(true);
      expect(trail.length).toBe(10);
    });

    it('should enable pulse', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        pulse: true,
        pulseSpeed: 0.2
      });
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.pulse).toBe(true);
      expect(visuals.pulseSpeed).toBe(0.2);
    });

    it('should apply custom layer', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        layer: 8
      });
      const renderable = particle.getComponent(Renderable);

      expect(renderable.layer).toBe(8);
    });

    it('should apply custom friction', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {
        friction: 0.95
      });
      const velocity = particle.getComponent(Velocity);

      expect(velocity.friction).toBe(0.95);
    });

    it('should merge multiple options', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'star', {
        gravity: 0.2,
        rotationSpeed: 0.1,
        pulse: true,
        trail: true
      });

      const velocity = particle.getComponent(Velocity);
      const visuals = particle.getComponent(ParticleVisuals);
      const trail = particle.getComponent(Trail);

      expect(velocity.gravity).toBe(0.2);
      expect(visuals.rotationSpeed).toBe(0.1);
      expect(visuals.pulse).toBe(true);
      expect(trail.enabled).toBe(true);
    });
  });

  // ========================================
  // 5. CONVENIENCE METHOD TESTS
  // ========================================

  describe('Convenience Methods', () => {
    it('should create square using createSquare', () => {
      const particle = factory.createSquare(100, 100, 1, 2, 'red');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('square');
    });

    it('should create circle using createCircle', () => {
      const particle = factory.createCircle(100, 100, 1, 2, 'blue');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('circle');
    });

    it('should create star using createStar', () => {
      const particle = factory.createStar(100, 100, 1, 2, 'gold');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('star');
    });

    it('should create trail using createTrailParticle', () => {
      const particle = factory.createTrailParticle(100, 100, 1, 2, 'cyan');
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.type).toBe('trail');
    });

    it('should accept options in convenience methods', () => {
      const particle = factory.createStar(100, 100, 1, 2, 'gold', {
        rotationSpeed: 0.1,
        pulse: true
      });

      const visuals = particle.getComponent(ParticleVisuals);
      expect(visuals.rotationSpeed).toBe(0.1);
      expect(visuals.pulse).toBe(true);
    });
  });

  // ========================================
  // 6. EXPLOSION TESTS
  // ========================================

  describe('Explosion Effect', () => {
    it('should create explosion', () => {
      const particles = factory.createExplosion(100, 100, 10, 'yellow');

      expect(particles.length).toBe(10);
    });

    it('should create particles in circular pattern', () => {
      const particles = factory.createExplosion(100, 100, 8, 'yellow');

      // All particles should start at the same position
      particles.forEach((p) => {
        const transform = p.getComponent(Transform);
        expect(transform.x).toBe(100);
        expect(transform.y).toBe(100);
      });
    });

    it('should have outward velocities', () => {
      const particles = factory.createExplosion(100, 100, 8, 'yellow');

      // Check that particles have different velocity directions
      const velocities = particles.map((p) => {
        const vel = p.getComponent(Velocity);
        return Math.atan2(vel.vy, vel.vx);
      });

      // Should have variety in angles
      const uniqueAngles = new Set(velocities.map(a => a.toFixed(2)));
      expect(uniqueAngles.size).toBeGreaterThan(1);
    });

    it('should apply custom speed', () => {
      const particles = factory.createExplosion(100, 100, 5, 'yellow', {
        speed: 5
      });

      particles.forEach((p) => {
        const velocity = p.getComponent(Velocity);
        const speed = Math.sqrt(velocity.vx ** 2 + velocity.vy ** 2);
        expect(speed).toBeGreaterThan(0);
      });
    });

    it('should apply custom type', () => {
      const particles = factory.createExplosion(100, 100, 5, 'yellow', {
        type: 'star'
      });

      particles.forEach((p) => {
        const visuals = p.getComponent(ParticleVisuals);
        expect(visuals.type).toBe('star');
      });
    });

    it('should pass through additional options', () => {
      const particles = factory.createExplosion(100, 100, 5, 'yellow', {
        gravity: 0.1,
        pulse: true
      });

      particles.forEach((p) => {
        const velocity = p.getComponent(Velocity);
        const visuals = p.getComponent(ParticleVisuals);
        expect(velocity.gravity).toBe(0.1);
        expect(visuals.pulse).toBe(true);
      });
    });
  });

  // ========================================
  // 7. FOUNTAIN TESTS
  // ========================================

  describe('Fountain Effect', () => {
    it('should create fountain', () => {
      const particles = factory.createFountain(100, 100, 10, 'cyan');

      expect(particles.length).toBe(10);
    });

    it('should have upward velocities', () => {
      const particles = factory.createFountain(100, 100, 10, 'cyan');

      particles.forEach((p) => {
        const velocity = p.getComponent(Velocity);
        // Y velocity should be negative (upward)
        expect(velocity.vy).toBeLessThan(0);
      });
    });

    it('should apply gravity by default', () => {
      const particles = factory.createFountain(100, 100, 10, 'cyan');

      particles.forEach((p) => {
        const velocity = p.getComponent(Velocity);
        expect(velocity.gravity).toBe(0.1);
      });
    });

    it('should apply custom gravity', () => {
      const particles = factory.createFountain(100, 100, 5, 'cyan', {
        gravity: 0.2
      });

      particles.forEach((p) => {
        const velocity = p.getComponent(Velocity);
        expect(velocity.gravity).toBe(0.2);
      });
    });

    it('should have variety in velocities', () => {
      const particles = factory.createFountain(100, 100, 10, 'cyan');

      const speeds = particles.map((p) => {
        const vel = p.getComponent(Velocity);
        return Math.sqrt(vel.vx ** 2 + vel.vy ** 2);
      });

      // Should have variety
      const uniqueSpeeds = new Set(speeds.map(s => s.toFixed(2)));
      expect(uniqueSpeeds.size).toBeGreaterThan(1);
    });
  });

  // ========================================
  // 8. STATISTICS TESTS
  // ========================================

  describe('Statistics', () => {
    it('should track total particles created', () => {
      expect(factory.stats.totalCreated).toBe(0);

      factory.createParticle(100, 100, 1, 2, 'red');
      expect(factory.stats.totalCreated).toBe(1);

      factory.createParticle(100, 100, 1, 2, 'blue');
      expect(factory.stats.totalCreated).toBe(2);
    });

    it('should track particles by type', () => {
      factory.createSquare(100, 100, 1, 2, 'red');
      factory.createSquare(100, 100, 1, 2, 'red');
      factory.createCircle(100, 100, 1, 2, 'blue');
      factory.createStar(100, 100, 1, 2, 'gold');

      expect(factory.stats.byType.square).toBe(2);
      expect(factory.stats.byType.circle).toBe(1);
      expect(factory.stats.byType.star).toBe(1);
      expect(factory.stats.byType.trail).toBe(0);
    });

    it('should get statistics snapshot', () => {
      factory.createParticle(100, 100, 1, 2, 'red');
      const stats = factory.getStats();

      expect(stats.totalCreated).toBe(1);

      // Modify original
      factory.createParticle(100, 100, 1, 2, 'blue');

      // Snapshot should be unchanged
      expect(stats.totalCreated).toBe(1);
    });

    it('should reset statistics', () => {
      factory.createParticle(100, 100, 1, 2, 'red');
      factory.createParticle(100, 100, 1, 2, 'blue');

      expect(factory.stats.totalCreated).toBe(2);

      factory.resetStats();

      expect(factory.stats.totalCreated).toBe(0);
      expect(factory.stats.byType.square).toBe(0);
    });
  });

  // ========================================
  // 9. EDGE CASES TESTS
  // ========================================

  describe('Edge Cases', () => {
    it('should handle zero velocity', () => {
      const particle = factory.createParticle(100, 100, 0, 0, 'red');
      const velocity = particle.getComponent(Velocity);

      expect(velocity.vx).toBe(0);
      expect(velocity.vy).toBe(0);
    });

    it('should handle negative velocity', () => {
      const particle = factory.createParticle(100, 100, -5, -3, 'red');
      const velocity = particle.getComponent(Velocity);

      expect(velocity.vx).toBe(-5);
      expect(velocity.vy).toBe(-3);
    });

    it('should handle size of 0 (normalizes to default)', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 0);
      const visuals = particle.getComponent(ParticleVisuals);

      // ParticleVisuals component normalizes 0 to default (4)
      expect(visuals.size).toBe(4);
    });

    it('should handle very large size', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 1000);
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.size).toBe(1000);
    });

    it('should handle empty options object', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', 4, 'square', {});

      expect(particle).toBeDefined();
    });

    it('should handle undefined size (use default)', () => {
      const particle = factory.createParticle(100, 100, 1, 2, 'red', undefined);
      const visuals = particle.getComponent(ParticleVisuals);

      expect(visuals.size).toBe(4); // default
    });

    it('should handle explosion with 0 particles', () => {
      const particles = factory.createExplosion(100, 100, 0, 'red');

      expect(particles.length).toBe(0);
    });

    it('should handle fountain with 1 particle', () => {
      const particles = factory.createFountain(100, 100, 1, 'red');

      expect(particles.length).toBe(1);
    });
  });
});
