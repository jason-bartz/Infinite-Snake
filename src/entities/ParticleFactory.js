/**
 * ParticleFactory - Factory for creating particle entities.
 *
 * Provides a convenient API for creating particle entities with all the
 * necessary components pre-configured. Supports all particle types and options
 * from the original Particle class.
 *
 * @class ParticleFactory
 */

import {
  Transform,
  Velocity,
  Lifetime,
  Renderable,
  ParticleVisuals,
  Trail
} from '../components/index.js';

class ParticleFactory {
  /**
   * Creates a new ParticleFactory.
   *
   * @param {Object} coordinator - ECS coordinator for entity creation.
   */
  constructor(coordinator) {
    if (!coordinator) {
      throw new Error('ParticleFactory requires a coordinator');
    }

    this.coordinator = coordinator;

    // Default particle options
    this.defaults = {
      size: 4,
      type: 'square',
      fadeRate: 0.02,
      gravity: 0,
      rotation: 0,
      rotationSpeed: 0,
      growthRate: 0,
      trail: false,
      trailLength: 5,
      pulse: false,
      pulseSpeed: 0.1,
      layer: 6, // Particle layer in RenderLayer enum
      friction: 0.98
    };

    // Statistics
    this.stats = {
      totalCreated: 0,
      byType: {
        square: 0,
        circle: 0,
        star: 0,
        trail: 0
      }
    };
  }

  /**
   * Creates a particle entity with all necessary components.
   *
   * @param {number} x - Initial X position.
   * @param {number} y - Initial Y position.
   * @param {number} vx - Initial X velocity.
   * @param {number} vy - Initial Y velocity.
   * @param {string} color - Particle color (CSS color string).
   * @param {number} [size] - Particle size (default: 4).
   * @param {string} [type] - Particle type: 'square', 'circle', 'star', 'trail' (default: 'square').
   * @param {Object} [options] - Additional options.
   * @param {number} [options.fadeRate] - Fade rate per frame (default: 0.02).
   * @param {number} [options.gravity] - Gravity acceleration (default: 0).
   * @param {number} [options.rotation] - Initial rotation in radians (default: 0).
   * @param {number} [options.rotationSpeed] - Rotation speed in radians per frame (default: 0).
   * @param {number} [options.growthRate] - Size growth rate per frame (default: 0).
   * @param {boolean} [options.trail] - Enable trail effect (default: false).
   * @param {number} [options.trailLength] - Trail length in points (default: 5).
   * @param {boolean} [options.pulse] - Enable pulse effect (default: false).
   * @param {number} [options.pulseSpeed] - Pulse oscillation speed (default: 0.1).
   * @param {number} [options.layer] - Render layer (default: 6).
   * @param {number} [options.friction] - Friction coefficient (default: 0.98).
   * @returns {Entity} The created particle entity.
   *
   * @example
   * // Create a simple square particle
   * const particle = factory.createParticle(100, 100, 2, -3, 'yellow');
   *
   * @example
   * // Create a star particle with gravity and pulse
   * const star = factory.createParticle(100, 100, 1, 0, 'gold', 8, 'star', {
   *   gravity: 0.1,
   *   pulse: true,
   *   rotationSpeed: 0.05
   * });
   */
  createParticle(x, y, vx, vy, color, size, type, options = {}) {
    // Merge with defaults
    // Note: size and type parameters override options which override defaults
    const config = {
      ...this.defaults,
      ...options
    };

    // Apply explicit size and type parameters
    if (size !== undefined) {
      config.size = size;
    }
    if (type) {
      config.type = type;
    }

    // Create entity
    const entity = this.coordinator.createEntity();

    // Add Transform component
    const transform = new Transform(x, y, config.rotation, 1);
    entity.addComponent(transform);

    // Add Velocity component
    const velocity = new Velocity(vx, vy, config.friction, config.gravity);
    entity.addComponent(velocity);

    // Add Lifetime component
    const lifetime = new Lifetime(1, config.fadeRate);
    entity.addComponent(lifetime);

    // Add Renderable component
    const renderable = new Renderable(config.layer, true);
    entity.addComponent(renderable);

    // Add ParticleVisuals component
    const visuals = new ParticleVisuals({
      color: color,
      size: config.size,
      type: config.type,
      rotation: config.rotation,
      rotationSpeed: config.rotationSpeed,
      growthRate: config.growthRate,
      pulse: config.pulse,
      pulseSpeed: config.pulseSpeed
    });
    entity.addComponent(visuals);

    // Add Trail component
    const trail = new Trail(config.trail, config.trailLength);
    entity.addComponent(trail);

    // Update statistics
    this.stats.totalCreated++;
    if (this.stats.byType[config.type] !== undefined) {
      this.stats.byType[config.type]++;
    }

    return entity;
  }

  /**
   * Creates a square particle (convenience method).
   *
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {number} vx - X velocity.
   * @param {number} vy - Y velocity.
   * @param {string} color - Color.
   * @param {Object} [options] - Additional options.
   * @returns {Entity} The created particle.
   */
  createSquare(x, y, vx, vy, color, options = {}) {
    return this.createParticle(x, y, vx, vy, color, undefined, 'square', options);
  }

  /**
   * Creates a circle particle (convenience method).
   *
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {number} vx - X velocity.
   * @param {number} vy - Y velocity.
   * @param {string} color - Color.
   * @param {Object} [options] - Additional options.
   * @returns {Entity} The created particle.
   */
  createCircle(x, y, vx, vy, color, options = {}) {
    return this.createParticle(x, y, vx, vy, color, undefined, 'circle', options);
  }

  /**
   * Creates a star particle (convenience method).
   *
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {number} vx - X velocity.
   * @param {number} vy - Y velocity.
   * @param {string} color - Color.
   * @param {Object} [options] - Additional options.
   * @returns {Entity} The created particle.
   */
  createStar(x, y, vx, vy, color, options = {}) {
    return this.createParticle(x, y, vx, vy, color, undefined, 'star', options);
  }

  /**
   * Creates a trail-type particle (convenience method).
   *
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {number} vx - X velocity.
   * @param {number} vy - Y velocity.
   * @param {string} color - Color.
   * @param {Object} [options] - Additional options.
   * @returns {Entity} The created particle.
   */
  createTrailParticle(x, y, vx, vy, color, options = {}) {
    return this.createParticle(x, y, vx, vy, color, undefined, 'trail', options);
  }

  /**
   * Creates an explosion of particles (burst effect).
   *
   * @param {number} x - Center X position.
   * @param {number} y - Center Y position.
   * @param {number} count - Number of particles.
   * @param {string} color - Particle color.
   * @param {Object} [options] - Particle options.
   * @param {number} [options.speed] - Base speed (default: 2).
   * @param {number} [options.speedVariance] - Speed variance (default: 1).
   * @param {string} [options.type] - Particle type (default: 'square').
   * @returns {Array<Entity>} Array of created particles.
   *
   * @example
   * // Create a yellow explosion
   * factory.createExplosion(100, 100, 20, 'yellow', { speed: 3 });
   */
  createExplosion(x, y, count, color, options = {}) {
    const particles = [];
    const baseSpeed = options.speed !== undefined ? options.speed : 2;
    const speedVariance = options.speedVariance !== undefined ? options.speedVariance : 1;
    const type = options.type || 'square';

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = baseSpeed + (Math.random() - 0.5) * speedVariance * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const particle = this.createParticle(x, y, vx, vy, color, undefined, type, options);
      particles.push(particle);
    }

    return particles;
  }

  /**
   * Creates a fountain of particles (upward burst).
   *
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {number} count - Number of particles.
   * @param {string} color - Particle color.
   * @param {Object} [options] - Particle options.
   * @param {number} [options.speed] - Base speed (default: 3).
   * @param {number} [options.spread] - Horizontal spread (default: Math.PI/4).
   * @param {number} [options.gravity] - Gravity (default: 0.1).
   * @returns {Array<Entity>} Array of created particles.
   *
   * @example
   * // Create a fountain effect
   * factory.createFountain(100, 100, 15, 'cyan', { gravity: 0.2 });
   */
  createFountain(x, y, count, color, options = {}) {
    const particles = [];
    const baseSpeed = options.speed !== undefined ? options.speed : 3;
    const spread = options.spread !== undefined ? options.spread : Math.PI / 4;
    const gravity = options.gravity !== undefined ? options.gravity : 0.1;

    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      const speed = baseSpeed + Math.random();
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const particle = this.createParticle(x, y, vx, vy, color, undefined, undefined, {
        ...options,
        gravity: gravity
      });
      particles.push(particle);
    }

    return particles;
  }

  /**
   * Gets factory statistics.
   *
   * @returns {Object} Statistics object.
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Resets factory statistics.
   */
  resetStats() {
    this.stats = {
      totalCreated: 0,
      byType: {
        square: 0,
        circle: 0,
        star: 0,
        trail: 0
      }
    };
  }
}

export default ParticleFactory;
export { ParticleFactory };
