/**
 * State Selectors
 *
 * Provides safe, memoizable functions to access application state.
 * Selectors encapsulate the state shape and provide a clean API
 * for components to read state without knowing its structure.
 *
 * Benefits:
 * - Encapsulation: Hide state structure from consumers
 * - Memoization: Can be optimized with libraries like reselect
 * - Testability: Easy to test in isolation
 * - Refactoring: Change state shape without breaking consumers
 *
 * @module state/selectors
 */

/**
 * Game Selectors
 * Functions to access game-related state
 */
export const gameSelectors = {
  /**
   * Get the current game status
   * @param {Object} state - Root state
   * @returns {string} Game status ('menu', 'playing', 'paused', 'gameover')
   */
  getStatus: (state) => state.game.status,

  /**
   * Get the current game mode
   * @param {Object} state - Root state
   * @returns {string|null} Game mode ('infinite', 'classic', null)
   */
  getMode: (state) => state.game.mode,

  /**
   * Get the current score
   * @param {Object} state - Root state
   * @returns {number} Current score
   */
  getScore: (state) => state.game.score,

  /**
   * Get the high score
   * @param {Object} state - Root state
   * @returns {number} High score
   */
  getHighScore: (state) => state.game.highScore,

  /**
   * Get the final score (after game over)
   * @param {Object} state - Root state
   * @returns {number} Final score
   */
  getFinalScore: (state) => state.game.finalScore,

  /**
   * Check if game is playing
   * @param {Object} state - Root state
   * @returns {boolean} True if game is playing
   */
  isPlaying: (state) => state.game.status === 'playing',

  /**
   * Check if game is paused
   * @param {Object} state - Root state
   * @returns {boolean} True if game is paused
   */
  isPaused: (state) => state.game.status === 'paused',

  /**
   * Check if game is over
   * @param {Object} state - Root state
   * @returns {boolean} True if game is over
   */
  isGameOver: (state) => state.game.status === 'gameover',

  /**
   * Get all elements in the game
   * @param {Object} state - Root state
   * @returns {Array} Array of element objects
   */
  getElements: (state) => state.game.elements,

  /**
   * Get element count
   * @param {Object} state - Root state
   * @returns {number} Number of elements
   */
  getElementCount: (state) => state.game.elementCount,

  /**
   * Get all AI snakes
   * @param {Object} state - Root state
   * @returns {Array} Array of AI snake objects
   */
  getAISnakes: (state) => state.game.aiSnakes,

  /**
   * Get AI snake count
   * @param {Object} state - Root state
   * @returns {number} Number of AI snakes
   */
  getAISnakeCount: (state) => state.game.aiSnakeCount,

  /**
   * Get game statistics
   * @param {Object} state - Root state
   * @returns {Object} Game stats object
   */
  getGameStats: (state) => state.game.stats,
};

/**
 * Player Selectors
 * Functions to access player-related state
 */
export const playerSelectors = {
  /**
   * Get player position
   * @param {Object} state - Root state
   * @returns {Object} {x, y, angle}
   */
  getPosition: (state) => ({
    x: state.player.x,
    y: state.player.y,
    angle: state.player.angle,
  }),

  /**
   * Get player X coordinate
   * @param {Object} state - Root state
   * @returns {number} X coordinate
   */
  getX: (state) => state.player.x,

  /**
   * Get player Y coordinate
   * @param {Object} state - Root state
   * @returns {number} Y coordinate
   */
  getY: (state) => state.player.y,

  /**
   * Get player angle
   * @param {Object} state - Root state
   * @returns {number} Angle in radians
   */
  getAngle: (state) => state.player.angle,

  /**
   * Check if player is boosting
   * @param {Object} state - Root state
   * @returns {boolean} True if boosting
   */
  isBoosting: (state) => state.player.isBoosting,

  /**
   * Get player length
   * @param {Object} state - Root state
   * @returns {number} Snake length
   */
  getLength: (state) => state.player.length,

  /**
   * Get player segments
   * @param {Object} state - Root state
   * @returns {Array} Array of segment positions
   */
  getSegments: (state) => state.player.segments,

  /**
   * Check if player is alive
   * @param {Object} state - Root state
   * @returns {boolean} True if alive
   */
  isAlive: (state) => state.player.isAlive,

  /**
   * Get player death cause
   * @param {Object} state - Root state
   * @returns {string|null} Death cause or null
   */
  getDeathCause: (state) => state.player.deathCause,

  /**
   * Get remaining lives
   * @param {Object} state - Root state
   * @returns {number} Number of lives
   */
  getLives: (state) => state.player.lives,

  /**
   * Get player inventory
   * @param {Object} state - Root state
   * @returns {Object} Inventory object
   */
  getInventory: (state) => state.player.inventory,

  /**
   * Get total elements in inventory
   * @param {Object} state - Root state
   * @returns {number} Total elements
   */
  getTotalElements: (state) => state.player.inventory.totalElements,

  /**
   * Get player statistics
   * @param {Object} state - Root state
   * @returns {Object} Player stats object
   */
  getPlayerStats: (state) => state.player.stats,

  /**
   * Get longest snake length achieved
   * @param {Object} state - Root state
   * @returns {number} Longest snake length
   */
  getLongestSnake: (state) => state.player.stats.longestSnake,
};

/**
 * UI Selectors
 * Functions to access UI-related state
 */
export const uiSelectors = {
  /**
   * Get current menu
   * @param {Object} state - Root state
   * @returns {string|null} Current menu name
   */
  getCurrentMenu: (state) => state.ui.currentMenu,

  /**
   * Check if menu is visible
   * @param {Object} state - Root state
   * @returns {boolean} True if menu visible
   */
  isMenuVisible: (state) => state.ui.menuVisible,

  /**
   * Get current modal
   * @param {Object} state - Root state
   * @returns {string|null} Current modal name
   */
  getCurrentModal: (state) => state.ui.currentModal,

  /**
   * Check if modal is visible
   * @param {Object} state - Root state
   * @returns {boolean} True if modal visible
   */
  isModalVisible: (state) => state.ui.modalVisible,

  /**
   * Check if pause menu is visible
   * @param {Object} state - Root state
   * @returns {boolean} True if pause menu visible
   */
  isPauseMenuVisible: (state) => state.ui.pauseMenuVisible,

  /**
   * Get HUD configuration
   * @param {Object} state - Root state
   * @returns {Object} HUD config object
   */
  getHUD: (state) => state.ui.hud,

  /**
   * Check if HUD is visible
   * @param {Object} state - Root state
   * @returns {boolean} True if HUD visible
   */
  isHUDVisible: (state) => state.ui.hud.visible,

  /**
   * Get all settings
   * @param {Object} state - Root state
   * @returns {Object} Settings object
   */
  getSettings: (state) => state.ui.settings,

  /**
   * Get audio settings
   * @param {Object} state - Root state
   * @returns {Object} Audio settings
   */
  getAudioSettings: (state) => ({
    masterVolume: state.ui.settings.masterVolume,
    musicVolume: state.ui.settings.musicVolume,
    sfxVolume: state.ui.settings.sfxVolume,
    audioEnabled: state.ui.settings.audioEnabled,
  }),

  /**
   * Get graphics settings
   * @param {Object} state - Root state
   * @returns {Object} Graphics settings
   */
  getGraphicsSettings: (state) => ({
    particlesEnabled: state.ui.settings.particlesEnabled,
    particleQuality: state.ui.settings.particleQuality,
    showTrails: state.ui.settings.showTrails,
    screenShake: state.ui.settings.screenShake,
  }),

  /**
   * Get control settings
   * @param {Object} state - Root state
   * @returns {Object} Control settings
   */
  getControlSettings: (state) => ({
    controlScheme: state.ui.settings.controlScheme,
    sensitivity: state.ui.settings.sensitivity,
    invertControls: state.ui.settings.invertControls,
  }),

  /**
   * Get all notifications
   * @param {Object} state - Root state
   * @returns {Array} Array of notification objects
   */
  getNotifications: (state) => state.ui.notifications,

  /**
   * Check if loading
   * @param {Object} state - Root state
   * @returns {boolean} True if loading
   */
  isLoading: (state) => state.ui.loading,

  /**
   * Get loading message
   * @param {Object} state - Root state
   * @returns {string} Loading message
   */
  getLoadingMessage: (state) => state.ui.loadingMessage,

  /**
   * Check if on mobile device
   * @param {Object} state - Root state
   * @returns {boolean} True if mobile
   */
  isMobile: (state) => state.ui.isMobile,

  /**
   * Get screen dimensions
   * @param {Object} state - Root state
   * @returns {Object} {width, height}
   */
  getScreenDimensions: (state) => ({
    width: state.ui.screenWidth,
    height: state.ui.screenHeight,
  }),
};

/**
 * Composite Selectors
 * More complex selectors that combine multiple pieces of state
 */
export const compositeSelectors = {
  /**
   * Check if game is active (playing or paused)
   * @param {Object} state - Root state
   * @returns {boolean} True if game is active
   */
  isGameActive: (state) => {
    const status = gameSelectors.getStatus(state);
    return status === 'playing' || status === 'paused';
  },

  /**
   * Get complete player info
   * @param {Object} state - Root state
   * @returns {Object} Complete player information
   */
  getPlayerInfo: (state) => ({
    position: playerSelectors.getPosition(state),
    length: playerSelectors.getLength(state),
    isAlive: playerSelectors.isAlive(state),
    isBoosting: playerSelectors.isBoosting(state),
    lives: playerSelectors.getLives(state),
  }),

  /**
   * Get game summary for HUD display
   * @param {Object} state - Root state
   * @returns {Object} Game summary for display
   */
  getGameSummary: (state) => ({
    score: gameSelectors.getScore(state),
    highScore: gameSelectors.getHighScore(state),
    playerLength: playerSelectors.getLength(state),
    elementsCollected: gameSelectors.getGameStats(state).elementsCollected,
    aiSnakesAlive: gameSelectors.getAISnakeCount(state),
  }),

  /**
   * Check if player can boost
   * @param {Object} state - Root state
   * @returns {boolean} True if can boost
   */
  canBoost: (state) => {
    return (
      playerSelectors.isAlive(state) &&
      !playerSelectors.isBoosting(state) &&
      gameSelectors.isPlaying(state) &&
      playerSelectors.getLength(state) > 5 // Need minimum length to boost
    );
  },
};

/**
 * Export all selectors as a single object
 */
export const selectors = {
  game: gameSelectors,
  player: playerSelectors,
  ui: uiSelectors,
  composite: compositeSelectors,
};

export default selectors;
