/**
 * Rendering System Integration Layer
 *
 * This module provides a bridge between game-original.js and the new RenderingSystem.
 * It allows gradual migration using feature flags while maintaining compatibility.
 *
 * Usage in game-original.js:
 *   import { RenderingIntegration } from './src/integration/rendering-integration.js';
 *   const renderingIntegration = new RenderingIntegration(ctx, canvas);
 *
 *   // In game loop:
 *   if (featureFlags.isEnabled('useNewRenderingSystem')) {
 *     renderingIntegration.render(gameState, interpolation);
 *   } else {
 *     // Old rendering code...
 *   }
 */

import { RenderingSystem } from '../systems/RenderingSystem.js';
import { RenderPipeline } from '../systems/RenderPipeline.js';
import { RenderLayer } from '../systems/RenderLayer.js';
import { Camera } from '../core/rendering/Camera.js';
import { BackgroundRenderer } from '../systems/renderers/BackgroundRenderer.js';
import { BorderRenderer } from '../systems/renderers/BorderRenderer.js';
import { SnakeRenderer } from '../systems/renderers/SnakeRenderer.js';
import { ElementRenderer } from '../systems/renderers/ElementRenderer.js';
import { ParticleRenderer } from '../systems/renderers/ParticleRenderer.js';

/**
 * Integration layer for RenderingSystem
 */
export class RenderingIntegration {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    // Create camera
    this.camera = new Camera(0, 0, canvas.width, canvas.height);

    // Create renderers
    this.backgroundRenderer = new BackgroundRenderer();
    this.borderRenderer = new BorderRenderer();
    this.snakeRenderer = new SnakeRenderer();
    this.elementRenderer = new ElementRenderer();
    this.particleRenderer = new ParticleRenderer();

    // Create pipeline
    this.pipeline = new RenderPipeline();
    this.pipeline.registerRenderer(RenderLayer.BACKGROUND, this.backgroundRenderer);
    this.pipeline.registerRenderer(RenderLayer.BORDERS, this.borderRenderer);
    this.pipeline.registerRenderer(RenderLayer.SNAKES, this.snakeRenderer);
    this.pipeline.registerRenderer(RenderLayer.GAME_OBJECTS, this.elementRenderer);
    this.pipeline.registerRenderer(RenderLayer.PARTICLES, this.particleRenderer);

    // Create rendering system
    this.renderingSystem = new RenderingSystem(ctx, this.camera, this.pipeline);

    // Track initialization
    this.initialized = false;
    this.lastUpdateTime = 0;

    console.log('[RenderingIntegration] Initialized successfully');
  }

  /**
   * Update camera bounds based on game world size
   * @param {Object} worldBounds - { minX, maxX, minY, maxY }
   */
  setWorldBounds(worldBounds) {
    this.camera.setBounds(
      worldBounds.minX,
      worldBounds.maxX,
      worldBounds.minY,
      worldBounds.maxY
    );
  }

  /**
   * Update camera to follow target (typically player snake)
   * @param {Object} target - { x, y } position
   * @param {boolean} immediate - Skip smooth interpolation
   */
  followTarget(target, immediate = false) {
    if (target && typeof target.x === 'number' && typeof target.y === 'number') {
      this.camera.follow(target, immediate);
    }
  }

  /**
   * Set camera zoom level
   * @param {number} zoom - Zoom factor (1.0 = 100%)
   */
  setZoom(zoom) {
    this.camera.setZoom(zoom);
  }

  /**
   * Update camera viewport size (call when canvas resizes)
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  updateViewport(width, height) {
    this.camera.setViewport(0, 0, width, height);
  }

  /**
   * Convert game state from game-original.js format to RenderingSystem format
   * @param {Object} gameState - Game state from game-original.js
   * @returns {Object} Formatted render data
   */
  convertGameState(gameState) {
    const {
      // Camera & viewport
      camera,
      canvas,
      isMobile,

      // Background
      backgroundLayers,
      stars,
      blinkingStars,
      spaceStations,
      cozyMode,

      // Entities
      snakes,
      elementPool,
      particlePool,
      asteroids,
      alchemyVisionPowerUps,
      voidOrbs,
      catalystGems,

      // World
      WORLD_SIZE,

      // Effects
      shockwaves,
      damageNumbers,
      explosionManager,
    } = gameState;

    // Convert background data
    const backgroundData = {
      nebula: backgroundLayers?.nebula || null,
      stars: stars || [],
      blinkingStars: blinkingStars || [],
      stations: spaceStations || [],
      isMobile: isMobile || false,
      cozyMode: cozyMode || false,
    };

    // Convert border data
    const borderData = {
      worldBounds: {
        minX: 0,
        maxX: WORLD_SIZE || 10000,
        minY: 0,
        maxY: WORLD_SIZE || 10000,
      },
      isMobile: isMobile || false,
    };

    // Convert snake data
    const snakeData = [];
    if (snakes && Array.isArray(snakes)) {
      for (let i = 0; i < snakes.length; i++) {
        const snake = snakes[i];
        if (snake && snake.alive) {
          snakeData.push({
            id: snake.id || `snake-${i}`,
            isPlayer: snake.isPlayer || false,
            isDead: !snake.alive,
            segments: snake.segments || [],
            head: {
              x: snake.x,
              y: snake.y,
              angle: snake.angle || 0,
              skin: snake.skin || null,
            },
            color: snake.color || '#ffffff',
            opacity: snake.opacity ?? 1,
            name: snake.name || 'Unknown',
            isInvincible: snake.invincible || false,
            isBoosting: snake.isBoosting || false,
            isLeader: snake.isLeader || false,
            isBoss: snake.isBoss || false,
          });
        }
      }
    }

    // Convert element data
    const elementData = [];
    if (elementPool && typeof elementPool.getElements === 'function') {
      const elements = elementPool.getElements();
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (element && element.active) {
          elementData.push({
            id: element.id || `element-${i}`,
            x: element.x,
            y: element.y,
            emoji: element.emoji || '?',
            tier: element.tier || 1,
            size: element.size || 30,
            glowIntensity: element.glowIntensity || 0,
          });
        }
      }
    }

    // Convert particle data
    const particleData = [];
    if (particlePool && typeof particlePool.getParticles === 'function') {
      const particles = particlePool.getParticles();
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        if (particle && particle.active) {
          particleData.push({
            x: particle.x,
            y: particle.y,
            vx: particle.vx || 0,
            vy: particle.vy || 0,
            radius: particle.radius || 5,
            color: particle.color || '#ffffff',
            opacity: particle.opacity ?? 1,
            type: particle.type || 'circle',
          });
        }
      }
    }

    return {
      background: backgroundData,
      border: borderData,
      snakes: snakeData,
      elements: elementData,
      particles: particleData,
    };
  }

  /**
   * Main render method - called from game loop
   * @param {Object} gameState - Current game state from game-original.js
   * @param {number} deltaTime - Time since last frame (ms)
   * @param {number} interpolation - Interpolation factor for smooth rendering
   */
  render(gameState, deltaTime = 16, interpolation = 1) {
    try {
      // Update camera if target provided
      if (gameState.camera) {
        this.followTarget(gameState.camera, false);
      }

      // Convert game state to render data
      const renderData = this.convertGameState(gameState);

      // Render using new system
      this.renderingSystem.render(deltaTime, renderData);

      this.initialized = true;
      this.lastUpdateTime = Date.now();
    } catch (error) {
      console.error('[RenderingIntegration] Render error:', error);
      // Fallback: clear canvas to prevent blank screen
      this.ctx.fillStyle = '#000011';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      throw error; // Re-throw so caller can fall back to old system
    }
  }

  /**
   * Get performance metrics from rendering system
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return this.renderingSystem.getMetrics();
  }

  /**
   * Enable/disable debug mode
   * @param {boolean} enabled
   */
  setDebugMode(enabled) {
    this.renderingSystem.setDebugMode(enabled);
  }

  /**
   * Get rendering system for direct access (advanced usage)
   * @returns {RenderingSystem}
   */
  getRenderingSystem() {
    return this.renderingSystem;
  }

  /**
   * Get camera for direct access (advanced usage)
   * @returns {Camera}
   */
  getCamera() {
    return this.camera;
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Renderers don't need cleanup currently
    // But we'll add this for future-proofing
    console.log('[RenderingIntegration] Destroyed');
  }
}

/**
 * Helper function to extract game state from global scope in game-original.js
 * This is a temporary bridge until full ECS migration
 *
 * Usage:
 *   const gameState = extractGameState(window);
 */
export function extractGameState(globalScope) {
  return {
    camera: globalScope.camera || { x: 0, y: 0 },
    canvas: globalScope.canvas,
    isMobile: globalScope.isMobile || false,
    backgroundLayers: globalScope.backgroundLayers || null,
    stars: globalScope.stars || [],
    blinkingStars: globalScope.blinkingStars || [],
    spaceStations: globalScope.spaceStations || [],
    cozyMode: globalScope.cozyMode || false,
    snakes: globalScope.snakes || [],
    elementPool: globalScope.elementPool || null,
    particlePool: globalScope.particlePool || null,
    asteroids: globalScope.asteroids || [],
    alchemyVisionPowerUps: globalScope.alchemyVisionPowerUps || [],
    voidOrbs: globalScope.voidOrbs || [],
    catalystGems: globalScope.catalystGems || [],
    WORLD_SIZE: globalScope.WORLD_SIZE || 10000,
    shockwaves: globalScope.shockwaves || [],
    damageNumbers: globalScope.damageNumbers || [],
    explosionManager: globalScope.explosionManager || null,
  };
}

/**
 * Create a feature-flagged rendering wrapper
 * This can be used to gradually transition from old to new rendering
 *
 * @param {Object} ctx - Canvas context
 * @param {Object} canvas - Canvas element
 * @param {Function} oldRenderFunction - Legacy rendering function
 * @param {Object} featureFlags - Feature flags instance
 * @returns {Function} Wrapped render function
 */
export function createFeatureFlaggedRenderer(ctx, canvas, oldRenderFunction, featureFlags) {
  let integration = null;

  return function render(gameState, deltaTime, interpolation) {
    const useNewSystem = featureFlags.isEnabled('useNewRenderingSystem');
    const dualMode = featureFlags.isEnabled('enableDualMode');

    try {
      if (useNewSystem || dualMode) {
        // Initialize integration on first use
        if (!integration) {
          integration = new RenderingIntegration(ctx, canvas);
          console.log('[FeatureFlaggedRenderer] New rendering system activated');

          // Set world bounds
          integration.setWorldBounds({
            minX: 0,
            maxX: gameState.WORLD_SIZE || 10000,
            minY: 0,
            maxY: gameState.WORLD_SIZE || 10000,
          });
        }

        // Render with new system
        integration.render(gameState, deltaTime, interpolation);

        // In dual mode, also run old system for comparison
        if (dualMode) {
          console.log('[FeatureFlaggedRenderer] Dual mode: Running old system for comparison');
          oldRenderFunction(gameState, deltaTime, interpolation);

          // Log metrics comparison
          const metrics = integration.getMetrics();
          console.log('[FeatureFlaggedRenderer] New system metrics:', metrics);
        }
      } else {
        // Use old system
        oldRenderFunction(gameState, deltaTime, interpolation);
      }
    } catch (error) {
      console.error('[FeatureFlaggedRenderer] Error, falling back to old system:', error);
      // Fallback to old system on error
      oldRenderFunction(gameState, deltaTime, interpolation);
    }
  };
}

// Export all for flexibility
export default RenderingIntegration;
