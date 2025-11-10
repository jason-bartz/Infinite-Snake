/**
 * RenderPipeline - Orchestrates rendering of all layers
 *
 * Manages the order and execution of all renderers in the game.
 * Provides performance metrics, error handling, and layer management.
 *
 * @class RenderPipeline
 */
import { RenderLayer, getAllLayers } from './RenderLayer.js';

export class RenderPipeline {
  /**
   * Create a new RenderPipeline
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   */
  constructor(ctx) {
    if (!ctx) {
      throw new Error('RenderPipeline requires a canvas context');
    }

    this.ctx = ctx;

    // Map of layer number -> array of renderers
    this.renderers = new Map();

    // Initialize all layers with empty arrays
    getAllLayers().forEach(layer => {
      this.renderers.set(layer, []);
    });

    // Performance metrics
    this.metrics = {
      frameTime: 0,
      layerTimes: new Map(),
      drawCalls: 0,
      culledEntities: 0,
      totalEntities: 0,
      errors: []
    };

    // Configuration
    this.config = {
      enableMetrics: true,
      enableErrorRecovery: true,
      maxErrorsPerRenderer: 3,
      debugMode: false
    };

    // Error tracking per renderer
    this.errorCounts = new WeakMap();

    // Enabled state
    this.enabled = true;
  }

  /**
   * Register a renderer to a specific layer
   * @param {number} layer - Render layer (use RenderLayer enum)
   * @param {Object} renderer - Renderer instance
   * @param {Function} renderer.render - Render function
   * @param {Function} [renderer.shouldRender] - Optional culling check
   * @param {string} [renderer.name] - Optional renderer name for debugging
   * @returns {RenderPipeline} This pipeline (for chaining)
   */
  registerRenderer(layer, renderer) {
    if (!this.renderers.has(layer)) {
      throw new Error(`Invalid render layer: ${layer}`);
    }

    if (!renderer || typeof renderer.render !== 'function') {
      throw new Error('Renderer must have a render() method');
    }

    // Ensure renderer has a name for debugging
    if (!renderer.name) {
      renderer.name = `Renderer_${layer}_${this.renderers.get(layer).length}`;
    }

    // Add to layer
    this.renderers.get(layer).push(renderer);

    // Initialize error count
    this.errorCounts.set(renderer, 0);

    if (this.config.debugMode) {
      console.log(`[RenderPipeline] Registered ${renderer.name} to layer ${layer}`);
    }

    return this; // Allow chaining
  }

  /**
   * Unregister a renderer from its layer
   * @param {Object} renderer - Renderer instance to remove
   * @returns {boolean} True if renderer was found and removed
   */
  unregisterRenderer(renderer) {
    for (const [layer, renderers] of this.renderers.entries()) {
      const index = renderers.indexOf(renderer);
      if (index !== -1) {
        renderers.splice(index, 1);
        this.errorCounts.delete(renderer);

        if (this.config.debugMode) {
          console.log(`[RenderPipeline] Unregistered ${renderer.name} from layer ${layer}`);
        }

        return true;
      }
    }
    return false;
  }

  /**
   * Get all renderers for a specific layer
   * @param {number} layer - Render layer
   * @returns {Object[]} Array of renderers
   */
  getRenderersForLayer(layer) {
    return this.renderers.get(layer) || [];
  }

  /**
   * Execute the render pipeline
   * @param {Object} camera - Camera for viewport culling
   * @param {number} interpolation - Interpolation factor (0-1)
   * @param {Object} [gameState] - Optional game state for renderers
   */
  render(camera, interpolation, gameState = null) {
    if (!this.enabled) return;

    const startTime = performance.now();

    // Reset frame metrics
    if (this.config.enableMetrics) {
      this.metrics.drawCalls = 0;
      this.metrics.culledEntities = 0;
      this.metrics.totalEntities = 0;
      this.metrics.errors = [];
    }

    // Render each layer in order
    for (const layer of getAllLayers()) {
      const layerStartTime = this.config.enableMetrics ? performance.now() : 0;
      const layerRenderers = this.renderers.get(layer) || [];

      for (const renderer of layerRenderers) {
        // Skip disabled renderers
        if (renderer.enabled === false) continue;

        // Check if renderer should execute (viewport culling, etc.)
        if (renderer.shouldRender && !renderer.shouldRender(camera, gameState)) {
          continue;
        }

        // Execute renderer with error handling
        try {
          renderer.render(this.ctx, camera, interpolation, gameState);

          // Track metrics if renderer provides them
          if (this.config.enableMetrics && renderer.getMetrics) {
            const rendererMetrics = renderer.getMetrics();
            if (rendererMetrics.drawCalls) {
              this.metrics.drawCalls += rendererMetrics.drawCalls;
            }
            if (rendererMetrics.culledEntities !== undefined) {
              this.metrics.culledEntities += rendererMetrics.culledEntities;
            }
            if (rendererMetrics.totalEntities !== undefined) {
              this.metrics.totalEntities += rendererMetrics.totalEntities;
            }
          }
        } catch (error) {
          this._handleRenderError(renderer, layer, error);
        }
      }

      // Record layer time
      if (this.config.enableMetrics) {
        const layerTime = performance.now() - layerStartTime;
        this.metrics.layerTimes.set(layer, layerTime);
      }
    }

    // Record total frame time
    if (this.config.enableMetrics) {
      this.metrics.frameTime = performance.now() - startTime;
    }

    // Warn if frame time exceeds budget
    if (this.config.debugMode && this.metrics.frameTime > 16.67) {
      console.warn(
        `[RenderPipeline] Frame time exceeded budget: ${this.metrics.frameTime.toFixed(2)}ms`
      );
    }
  }

  /**
   * Handle rendering error
   * @private
   */
  _handleRenderError(renderer, layer, error) {
    const errorCount = (this.errorCounts.get(renderer) || 0) + 1;
    this.errorCounts.set(renderer, errorCount);

    const errorInfo = {
      renderer: renderer.name,
      layer,
      error: error.message,
      count: errorCount
    };

    this.metrics.errors.push(errorInfo);

    console.error(
      `[RenderPipeline] Error in ${renderer.name} (layer ${layer}):`,
      error
    );

    // Disable renderer if too many errors
    if (this.config.enableErrorRecovery && errorCount >= this.config.maxErrorsPerRenderer) {
      renderer.enabled = false;
      console.error(
        `[RenderPipeline] Disabled ${renderer.name} after ${errorCount} errors`
      );
    }
  }

  /**
   * Get current performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      frameTime: this.metrics.frameTime,
      layerTimes: new Map(this.metrics.layerTimes),
      drawCalls: this.metrics.drawCalls,
      culledEntities: this.metrics.culledEntities,
      totalEntities: this.metrics.totalEntities,
      cullingRate:
        this.metrics.totalEntities > 0
          ? (this.metrics.culledEntities / this.metrics.totalEntities) * 100
          : 0,
      errors: [...this.metrics.errors]
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.metrics.frameTime = 0;
    this.metrics.layerTimes.clear();
    this.metrics.drawCalls = 0;
    this.metrics.culledEntities = 0;
    this.metrics.totalEntities = 0;
    this.metrics.errors = [];

    // Reset error counts
    for (const renderers of this.renderers.values()) {
      for (const renderer of renderers) {
        this.errorCounts.set(renderer, 0);
        if (renderer.enabled === false) {
          renderer.enabled = true; // Re-enable after metrics reset
        }
      }
    }
  }

  /**
   * Get total number of registered renderers
   * @returns {number} Total renderer count
   */
  getRendererCount() {
    let count = 0;
    for (const renderers of this.renderers.values()) {
      count += renderers.length;
    }
    return count;
  }

  /**
   * Clear all renderers from a specific layer
   * @param {number} layer - Layer to clear
   */
  clearLayer(layer) {
    const renderers = this.renderers.get(layer);
    if (renderers) {
      renderers.forEach(renderer => {
        this.errorCounts.delete(renderer);
      });
      renderers.length = 0;
    }
  }

  /**
   * Clear all renderers from all layers
   */
  clearAllRenderers() {
    for (const layer of getAllLayers()) {
      this.clearLayer(layer);
    }
  }

  /**
   * Enable or disable the entire pipeline
   * @param {boolean} enabled - Whether pipeline is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Enable or disable metrics collection
   * @param {boolean} enabled - Whether metrics are enabled
   */
  setMetricsEnabled(enabled) {
    this.config.enableMetrics = enabled;
  }

  /**
   * Enable or disable debug mode
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  setDebugMode(enabled) {
    this.config.debugMode = enabled;
  }

  /**
   * Set maximum errors before disabling a renderer
   * @param {number} max - Maximum error count
   */
  setMaxErrors(max) {
    this.config.maxErrorsPerRenderer = Math.max(1, max);
  }

  /**
   * Get summary of pipeline state
   * @returns {Object} Pipeline state summary
   */
  getSummary() {
    const summary = {
      enabled: this.enabled,
      totalRenderers: this.getRendererCount(),
      layers: {}
    };

    for (const layer of getAllLayers()) {
      const renderers = this.renderers.get(layer) || [];
      summary.layers[layer] = {
        count: renderers.length,
        enabled: renderers.filter(r => r.enabled !== false).length,
        disabled: renderers.filter(r => r.enabled === false).length,
        names: renderers.map(r => r.name)
      };
    }

    return summary;
  }

  /**
   * Print debug information to console
   */
  debug() {
    console.log('[RenderPipeline] Debug Info:');
    console.log('  Enabled:', this.enabled);
    console.log('  Total Renderers:', this.getRendererCount());
    console.log('  Metrics:', this.getMetrics());
    console.log('  Summary:', this.getSummary());
  }
}
