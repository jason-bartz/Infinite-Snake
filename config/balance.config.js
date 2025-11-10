/**
 * Game Balance Configuration
 *
 * Central configuration file for all game balance and tuning values.
 * This ensures consistent values across the entire codebase.
 *
 * @module balance.config
 */

export const BalanceConfig = {
  /**
   * World settings
   */
  world: {
    size: 4000,
    gridCellSize: 200, // For spatial partitioning
  },

  /**
   * Snake settings
   *
   * IMPORTANT: SNAKE_SPEED was previously inconsistent:
   * - game-original.js used 5.95125
   * - Snake.js used 4.761
   *
   * We've standardized to 4.761 as it was the value used in the
   * actual Snake class implementation and provides better gameplay.
   */
  snake: {
    /**
     * Base speed for all snakes.
     * @type {number}
     */
    baseSpeed: 4.761,

    /**
     * Turn speed (radians per frame).
     * @type {number}
     */
    turnSpeed: 0.08,

    /**
     * Size of each segment.
     * @type {number}
     */
    segmentSize: 15,

    /**
     * Speed multiplier for AI snakes (90% of player speed).
     * @type {number}
     */
    aiSpeedMultiplier: 0.9,

    /**
     * Boost speed multiplier.
     * @type {number}
     */
    boostMultiplier: 1.75,

    /**
     * Minimum speed (50% of base speed).
     * @type {number}
     */
    minSpeedMultiplier: 0.5,

    /**
     * Starting length for new snakes.
     * @type {number}
     */
    startingLength: 10,

    /**
     * Maximum snake length before growth stops.
     * @type {number}
     */
    maxLength: 1000,
  },

  /**
   * Element settings
   */
  elements: {
    /**
     * Base size for elements.
     * @type {number}
     */
    size: 20,

    /**
     * Maximum elements per grid cell.
     * @type {number}
     */
    maxPerCell: 5,

    /**
     * Total number of elements in the world.
     * @type {number}
     */
    totalCount: 200,

    /**
     * Respawn time in milliseconds.
     * @type {number}
     */
    respawnTime: 5000,
  },

  /**
   * Collision settings
   */
  collision: {
    /**
     * Snake head collision radius.
     * @type {number}
     */
    snakeHeadRadius: 10,

    /**
     * Element pickup radius.
     * @type {number}
     */
    elementPickupRadius: 20,

    /**
     * Self-collision grace distance (segments to skip).
     * @type {number}
     */
    selfCollisionGrace: 10,
  },

  /**
   * AI settings
   */
  ai: {
    /**
     * Vision range for AI snakes.
     * @type {number}
     */
    visionRange: 300,

    /**
     * Decision update frequency (milliseconds).
     * @type {number}
     */
    decisionInterval: 100,

    /**
     * Aggression level (0-1).
     * @type {number}
     */
    defaultAggression: 0.5,

    /**
     * Maximum number of AI snakes.
     * @type {number}
     */
    maxAISnakes: 10,
  },

  /**
   * Scoring settings
   */
  scoring: {
    /**
     * Points per element consumed.
     * @type {number}
     */
    pointsPerElement: 10,

    /**
     * Points per snake segment consumed.
     * @type {number}
     */
    pointsPerSnakeSegment: 50,

    /**
     * Bonus multiplier for combo chains.
     * @type {number}
     */
    comboMultiplier: 1.5,

    /**
     * Time window for combo chains (milliseconds).
     * @type {number}
     */
    comboWindow: 2000,
  },

  /**
   * Performance settings
   */
  performance: {
    /**
     * Maximum particles allowed at once.
     * @type {number}
     */
    maxParticles: 1000,

    /**
     * Particle lifetime in milliseconds.
     * @type {number}
     */
    particleLifetime: 2000,

    /**
     * Culling distance (entities beyond this distance are not rendered).
     * @type {number}
     */
    cullingDistance: 2000,
  },

  /**
   * Boss settings (for future phases)
   */
  boss: {
    /**
     * Boss size multiplier.
     * @type {number}
     */
    sizeMultiplier: 3.0,

    /**
     * Boss speed multiplier (slower than normal snakes).
     * @type {number}
     */
    speedMultiplier: 0.8,

    /**
     * Boss starting length.
     * @type {number}
     */
    startingLength: 30,

    /**
     * Boss health.
     * @type {number}
     */
    health: 100,
  },
};

/**
 * Calculated values derived from base configuration.
 * These are computed at runtime for convenience.
 */
export const CalculatedValues = {
  /**
   * Get the speed for player snake.
   * @returns {number}
   */
  getPlayerSpeed() {
    return BalanceConfig.snake.baseSpeed;
  },

  /**
   * Get the speed for AI snakes.
   * @returns {number}
   */
  getAISpeed() {
    return BalanceConfig.snake.baseSpeed * BalanceConfig.snake.aiSpeedMultiplier;
  },

  /**
   * Get the boost speed for player.
   * @returns {number}
   */
  getPlayerBoostSpeed() {
    return BalanceConfig.snake.baseSpeed * BalanceConfig.snake.boostMultiplier;
  },

  /**
   * Get the boost speed for AI.
   * @returns {number}
   */
  getAIBoostSpeed() {
    return this.getAISpeed() * BalanceConfig.snake.boostMultiplier;
  },

  /**
   * Get minimum speed.
   * @returns {number}
   */
  getMinSpeed() {
    return BalanceConfig.snake.baseSpeed * BalanceConfig.snake.minSpeedMultiplier;
  },

  /**
   * Get boss speed.
   * @returns {number}
   */
  getBossSpeed() {
    return (
      BalanceConfig.snake.baseSpeed *
      BalanceConfig.boss.speedMultiplier *
      BalanceConfig.snake.aiSpeedMultiplier
    );
  },
};

export default BalanceConfig;
