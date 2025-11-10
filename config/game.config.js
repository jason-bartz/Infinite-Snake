/**
 * Game Configuration
 *
 * Central configuration file for game settings.
 * These values control core game behavior and can be adjusted for tuning.
 *
 * @module game.config
 */

export const GameConfig = {
  /**
   * Display settings
   */
  display: {
    targetFPS: 60,
    enableDebugOverlay: false,
    showFPS: false,
  },

  /**
   * Canvas settings
   */
  canvas: {
    defaultWidth: 800,
    defaultHeight: 600,
    backgroundColor: '#000000',
  },

  /**
   * Performance settings
   */
  performance: {
    maxParticles: 1000,
    enableObjectPooling: true,
    cullingEnabled: true,
    maxEntitiesPerFrame: 10000,
  },

  /**
   * Debug settings
   */
  debug: {
    logLevel: 'warn', // 'debug', 'info', 'warn', 'error', 'none'
    showColliders: false,
    showEntityCount: false,
    logPerformanceMetrics: false,
  },

  /**
   * Mobile settings
   */
  mobile: {
    enabled: true,
    touchControlsEnabled: true,
    reducedParticles: true,
    simplifiedGraphics: false,
  },
};

export default GameConfig;
