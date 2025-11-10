/**
 * Element Integration Bridge
 *
 * Bridges the old ElementPool API to the new ECS-based ElementSystem + ElementFactory.
 * Provides:
 * - Backward-compatible API matching old ElementPool
 * - Feature flag support for gradual rollout
 * - Dual-mode operation (run old and new side-by-side)
 * - Performance comparison metrics
 *
 * Usage:
 *   import { createElementIntegration } from './integration/element-integration.js';
 *   const elementIntegration = createElementIntegration(coordinator, elementLoader, featureFlags);
 *
 * Feature flags:
 *   - useECSElements: Enable new ECS-based element system
 *   - enableDualMode: Run both old and new systems for comparison
 *   - enablePerformanceMonitoring: Track performance metrics
 *
 * @module element-integration
 */

import { ElementSystem } from '../systems/ElementSystem.js';
import { ElementFactory } from '../entities/ElementFactory.js';

/**
 * ElementIntegration - Bridge between old ElementPool and new ECS system.
 *
 * @class ElementIntegration
 */
export class ElementIntegration {
  /**
   * Creates a new ElementIntegration.
   *
   * @param {Object} coordinator - ECS coordinator.
   * @param {Object} elementLoader - Element data loader.
   * @param {Object} featureFlags - Feature flags manager.
   * @param {Object} oldElementPool - Original ElementPool instance (for dual mode).
   */
  constructor(coordinator, elementLoader, featureFlags, oldElementPool = null) {
    if (!coordinator) {
      throw new Error('ElementIntegration requires a coordinator');
    }
    if (!elementLoader) {
      throw new Error('ElementIntegration requires an elementLoader');
    }
    if (!featureFlags) {
      throw new Error('ElementIntegration requires a featureFlags manager');
    }

    this.coordinator = coordinator;
    this.elementLoader = elementLoader;
    this.featureFlags = featureFlags;
    this.oldElementPool = oldElementPool;

    // Create new ECS system and factory
    this.elementSystem = new ElementSystem();
    this.elementFactory = new ElementFactory(coordinator, elementLoader);

    // Register system with coordinator
    this.coordinator.registerSystem(this.elementSystem);

    // Initialize system
    this.elementSystem.onInit();

    // Performance comparison metrics
    this.performanceMetrics = {
      old: {
        spawnTime: 0,
        updateTime: 0,
        drawTime: 0,
        spawnCount: 0,
        updateCount: 0,
        drawCount: 0
      },
      new: {
        spawnTime: 0,
        updateTime: 0,
        drawTime: 0,
        spawnCount: 0,
        updateCount: 0,
        drawCount: 0
      },
      comparison: {
        spawnSpeedup: 0,
        updateSpeedup: 0,
        drawSpeedup: 0
      }
    };

    // Entity ID tracking (for API compatibility)
    this.entityToElementMap = new Map();
    this.elementToEntityMap = new WeakMap();
  }

  /**
   * Spawns a new element (backward-compatible API).
   *
   * This method matches the old ElementPool.spawn() signature:
   * spawn(id, x, y, isCatalystSpawned = false)
   *
   * @param {string} id - Element ID.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {boolean} isCatalystSpawned - Whether spawned by catalyst power-up.
   * @returns {Object|number} Element object (old API) or entity ID (new API).
   */
  spawn(id, x, y, isCatalystSpawned = false) {
    const useECS = this.featureFlags.isEnabled('useECSElements');
    const dualMode = this.featureFlags.isEnabled('enableDualMode');
    const trackPerf = this.featureFlags.isEnabled('enablePerformanceMonitoring');

    let newResult = null;
    let oldResult = null;

    // New ECS system
    if (useECS || dualMode) {
      const startTime = trackPerf ? performance.now() : 0;

      newResult = this.elementFactory.createElement(id, x, y, isCatalystSpawned);

      if (trackPerf) {
        const elapsed = performance.now() - startTime;
        this.performanceMetrics.new.spawnTime += elapsed;
        this.performanceMetrics.new.spawnCount++;
      }
    }

    // Old system (for dual mode or if ECS disabled)
    if (!useECS || dualMode) {
      if (this.oldElementPool) {
        const startTime = trackPerf ? performance.now() : 0;

        oldResult = this.oldElementPool.spawn(id, x, y, isCatalystSpawned);

        if (trackPerf) {
          const elapsed = performance.now() - startTime;
          this.performanceMetrics.old.spawnTime += elapsed;
          this.performanceMetrics.old.spawnCount++;
        }

        // Track mapping for API compatibility
        if (newResult && oldResult) {
          this.entityToElementMap.set(newResult, oldResult);
          this.elementToEntityMap.set(oldResult, newResult);
        }
      }
    }

    // Return result based on mode
    return useECS ? newResult : oldResult;
  }

  /**
   * Updates all elements.
   *
   * @param {number} deltaTime - Time elapsed since last update (in ms).
   */
  update(deltaTime) {
    const useECS = this.featureFlags.isEnabled('useECSElements');
    const dualMode = this.featureFlags.isEnabled('enableDualMode');
    const trackPerf = this.featureFlags.isEnabled('enablePerformanceMonitoring');

    // New ECS system
    if (useECS || dualMode) {
      const startTime = trackPerf ? performance.now() : 0;

      this.elementSystem.update(deltaTime);

      if (trackPerf) {
        const elapsed = performance.now() - startTime;
        this.performanceMetrics.new.updateTime += elapsed;
        this.performanceMetrics.new.updateCount++;
      }
    }

    // Old system
    if (!useECS || dualMode) {
      if (this.oldElementPool) {
        const startTime = trackPerf ? performance.now() : 0;

        this.oldElementPool.update(deltaTime);

        if (trackPerf) {
          const elapsed = performance.now() - startTime;
          this.performanceMetrics.old.updateTime += elapsed;
          this.performanceMetrics.old.updateCount++;
        }
      }
    }
  }

  /**
   * Draws all elements.
   *
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context.
   * @param {Object} camera - Camera object with position.
   */
  draw(ctx, camera) {
    const useECS = this.featureFlags.isEnabled('useECSElements');
    const dualMode = this.featureFlags.isEnabled('enableDualMode');
    const trackPerf = this.featureFlags.isEnabled('enablePerformanceMonitoring');

    // Note: In the new system, drawing is handled by RenderingSystem
    // This method is kept for API compatibility but may be deprecated

    // Old system
    if (!useECS || dualMode) {
      if (this.oldElementPool) {
        const startTime = trackPerf ? performance.now() : 0;

        this.oldElementPool.draw(ctx, camera);

        if (trackPerf) {
          const elapsed = performance.now() - startTime;
          this.performanceMetrics.old.drawTime += elapsed;
          this.performanceMetrics.old.drawCount++;
        }
      }
    }
  }

  /**
   * Removes an element.
   *
   * @param {Object|number} elementOrId - Element object (old API) or entity ID (new API).
   */
  remove(elementOrId) {
    const useECS = this.featureFlags.isEnabled('useECSElements');

    if (useECS) {
      // New API: elementOrId is an entity ID
      this.elementFactory.removeElement(elementOrId);

      // Clean up mapping
      if (this.entityToElementMap.has(elementOrId)) {
        const oldElement = this.entityToElementMap.get(elementOrId);
        this.entityToElementMap.delete(elementOrId);
        this.elementToEntityMap.delete(oldElement);
      }
    } else {
      // Old API: elementOrId is an element object
      if (this.oldElementPool) {
        this.oldElementPool.remove(elementOrId);

        // Clean up mapping
        if (this.elementToEntityMap.has(elementOrId)) {
          const entityId = this.elementToEntityMap.get(elementOrId);
          this.entityToElementMap.delete(entityId);
          this.elementToEntityMap.delete(elementOrId);
        }
      }
    }
  }

  /**
   * Gets the number of active elements.
   *
   * @returns {number} Number of active elements.
   */
  getActiveCount() {
    const useECS = this.featureFlags.isEnabled('useECSElements');

    if (useECS) {
      return this.elementFactory.getActiveCount();
    } else if (this.oldElementPool) {
      return this.oldElementPool.elements.length;
    }

    return 0;
  }

  /**
   * Gets all active elements.
   *
   * @returns {Array} Array of element objects (old API) or entity IDs (new API).
   */
  getElements() {
    const useECS = this.featureFlags.isEnabled('useECSElements');

    if (useECS) {
      return this.elementSystem.getActiveElements();
    } else if (this.oldElementPool) {
      return this.oldElementPool.elements;
    }

    return [];
  }

  /**
   * Pre-warms the element pool.
   *
   * @param {number} count - Number of elements to pre-allocate.
   */
  preWarm(count) {
    const useECS = this.featureFlags.isEnabled('useECSElements');

    if (useECS) {
      this.elementSystem.preWarm(count);
    } else if (this.oldElementPool) {
      this.oldElementPool.preWarm(count);
    }
  }

  /**
   * Clears all elements.
   */
  clear() {
    const useECS = this.featureFlags.isEnabled('useECSElements');

    if (useECS) {
      const elements = this.elementSystem.getActiveElements();
      elements.forEach(entityId => this.elementFactory.removeElement(entityId));
    } else if (this.oldElementPool) {
      this.oldElementPool.clear();
    }

    // Clear mappings
    this.entityToElementMap.clear();
    this.elementToEntityMap = new WeakMap();
  }

  /**
   * Gets performance metrics.
   *
   * @returns {Object} Performance comparison data.
   */
  getPerformanceMetrics() {
    // Calculate speedup ratios
    const oldSpawnAvg = this.performanceMetrics.old.spawnCount > 0
      ? this.performanceMetrics.old.spawnTime / this.performanceMetrics.old.spawnCount
      : 0;
    const newSpawnAvg = this.performanceMetrics.new.spawnCount > 0
      ? this.performanceMetrics.new.spawnTime / this.performanceMetrics.new.spawnCount
      : 0;
    this.performanceMetrics.comparison.spawnSpeedup = oldSpawnAvg > 0 ? oldSpawnAvg / newSpawnAvg : 0;

    const oldUpdateAvg = this.performanceMetrics.old.updateCount > 0
      ? this.performanceMetrics.old.updateTime / this.performanceMetrics.old.updateCount
      : 0;
    const newUpdateAvg = this.performanceMetrics.new.updateCount > 0
      ? this.performanceMetrics.new.updateTime / this.performanceMetrics.new.updateCount
      : 0;
    this.performanceMetrics.comparison.updateSpeedup = oldUpdateAvg > 0 ? oldUpdateAvg / newUpdateAvg : 0;

    const oldDrawAvg = this.performanceMetrics.old.drawCount > 0
      ? this.performanceMetrics.old.drawTime / this.performanceMetrics.old.drawCount
      : 0;
    const newDrawAvg = this.performanceMetrics.new.drawCount > 0
      ? this.performanceMetrics.new.drawTime / this.performanceMetrics.new.drawCount
      : 0;
    this.performanceMetrics.comparison.drawSpeedup = oldDrawAvg > 0 ? oldDrawAvg / newDrawAvg : 0;

    return {
      ...this.performanceMetrics,
      averages: {
        old: {
          spawn: oldSpawnAvg,
          update: oldUpdateAvg,
          draw: oldDrawAvg
        },
        new: {
          spawn: newSpawnAvg,
          update: newUpdateAvg,
          draw: newDrawAvg
        }
      }
    };
  }

  /**
   * Resets performance metrics.
   */
  resetPerformanceMetrics() {
    this.performanceMetrics = {
      old: { spawnTime: 0, updateTime: 0, drawTime: 0, spawnCount: 0, updateCount: 0, drawCount: 0 },
      new: { spawnTime: 0, updateTime: 0, drawTime: 0, spawnCount: 0, updateCount: 0, drawCount: 0 },
      comparison: { spawnSpeedup: 0, updateSpeedup: 0, drawSpeedup: 0 }
    };
  }

  /**
   * Validates dual-mode operation (both systems should produce same results).
   *
   * @returns {Object} Validation results.
   */
  validateDualMode() {
    if (!this.featureFlags.isEnabled('enableDualMode')) {
      return { enabled: false, message: 'Dual mode is not enabled' };
    }

    const newCount = this.elementFactory.getActiveCount();
    const oldCount = this.oldElementPool ? this.oldElementPool.elements.length : 0;

    return {
      enabled: true,
      countsMatch: newCount === oldCount,
      newCount,
      oldCount,
      difference: Math.abs(newCount - oldCount)
    };
  }

  /**
   * Gets debug information.
   *
   * @returns {Object} Debug information.
   */
  getDebugInfo() {
    const useECS = this.featureFlags.isEnabled('useECSElements');

    return {
      mode: useECS ? 'ECS' : 'Legacy',
      dualMode: this.featureFlags.isEnabled('enableDualMode'),
      activeElements: this.getActiveCount(),
      systemMetrics: this.elementSystem.getMetrics(),
      factoryStats: this.elementFactory.getStats(),
      performanceMetrics: this.getPerformanceMetrics()
    };
  }
}

/**
 * Factory function to create ElementIntegration instance.
 *
 * @param {Object} coordinator - ECS coordinator.
 * @param {Object} elementLoader - Element data loader.
 * @param {Object} featureFlags - Feature flags manager.
 * @param {Object} oldElementPool - Original ElementPool instance (optional).
 * @returns {ElementIntegration} New ElementIntegration instance.
 */
export function createElementIntegration(coordinator, elementLoader, featureFlags, oldElementPool = null) {
  return new ElementIntegration(coordinator, elementLoader, featureFlags, oldElementPool);
}
