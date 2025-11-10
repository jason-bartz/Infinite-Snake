/**
 * Action Types and Action Creators for State Management
 *
 * This module defines all action types and their corresponding creator functions.
 * Following the Flux Standard Action (FSA) pattern:
 * - type: string identifier for the action
 * - payload: optional data payload
 * - error: optional error flag
 * - meta: optional metadata
 *
 * @module state/actions
 */

/**
 * Action Types
 * Centralized constants for all action types in the application.
 */
export const ActionTypes = {
  // Game Actions
  GAME_START: 'GAME_START',
  GAME_PAUSE: 'GAME_PAUSE',
  GAME_RESUME: 'GAME_RESUME',
  GAME_OVER: 'GAME_OVER',
  GAME_RESET: 'GAME_RESET',
  SET_GAME_MODE: 'SET_GAME_MODE',
  UPDATE_SCORE: 'UPDATE_SCORE',
  UPDATE_HIGH_SCORE: 'UPDATE_HIGH_SCORE',
  SPAWN_ELEMENT: 'SPAWN_ELEMENT',
  REMOVE_ELEMENT: 'REMOVE_ELEMENT',
  ADD_AI_SNAKE: 'ADD_AI_SNAKE',
  REMOVE_AI_SNAKE: 'REMOVE_AI_SNAKE',

  // Player Actions
  PLAYER_MOVE: 'PLAYER_MOVE',
  PLAYER_BOOST_START: 'PLAYER_BOOST_START',
  PLAYER_BOOST_END: 'PLAYER_BOOST_END',
  PLAYER_COLLECT_ELEMENT: 'PLAYER_COLLECT_ELEMENT',
  PLAYER_GROW: 'PLAYER_GROW',
  PLAYER_DIE: 'PLAYER_DIE',
  PLAYER_RESPAWN: 'PLAYER_RESPAWN',
  UPDATE_PLAYER_STATS: 'UPDATE_PLAYER_STATS',
  UPDATE_INVENTORY: 'UPDATE_INVENTORY',

  // UI Actions
  SHOW_MENU: 'SHOW_MENU',
  HIDE_MENU: 'HIDE_MENU',
  SHOW_MODAL: 'SHOW_MODAL',
  HIDE_MODAL: 'HIDE_MODAL',
  UPDATE_HUD: 'UPDATE_HUD',
  TOGGLE_PAUSE_MENU: 'TOGGLE_PAUSE_MENU',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_LOADING: 'SET_LOADING',
};

/**
 * Game Action Creators
 * Functions that create actions related to game state.
 */
export const gameActions = {
  /**
   * Start a new game with the specified mode.
   *
   * @param {string} mode - Game mode ('infinite' or 'classic')
   * @returns {Object} Action object
   */
  startGame(mode) {
    return {
      type: ActionTypes.GAME_START,
      payload: { mode },
    };
  },

  /**
   * Pause the current game.
   *
   * @returns {Object} Action object
   */
  pauseGame() {
    return {
      type: ActionTypes.GAME_PAUSE,
    };
  },

  /**
   * Resume the paused game.
   *
   * @returns {Object} Action object
   */
  resumeGame() {
    return {
      type: ActionTypes.GAME_RESUME,
    };
  },

  /**
   * End the game with a final score.
   *
   * @param {number} finalScore - The player's final score
   * @returns {Object} Action object
   */
  gameOver(finalScore) {
    return {
      type: ActionTypes.GAME_OVER,
      payload: { finalScore },
    };
  },

  /**
   * Reset the game to initial state.
   *
   * @returns {Object} Action object
   */
  resetGame() {
    return {
      type: ActionTypes.GAME_RESET,
    };
  },

  /**
   * Update the current score.
   *
   * @param {number} points - Points to add (can be negative)
   * @returns {Object} Action object
   */
  updateScore(points) {
    return {
      type: ActionTypes.UPDATE_SCORE,
      payload: { points },
    };
  },

  /**
   * Update the high score.
   *
   * @param {number} score - New high score
   * @returns {Object} Action object
   */
  updateHighScore(score) {
    return {
      type: ActionTypes.UPDATE_HIGH_SCORE,
      payload: { score },
    };
  },

  /**
   * Spawn a new element in the game world.
   *
   * @param {Object} element - Element data
   * @returns {Object} Action object
   */
  spawnElement(element) {
    return {
      type: ActionTypes.SPAWN_ELEMENT,
      payload: { element },
    };
  },

  /**
   * Remove an element from the game world.
   *
   * @param {string} elementId - ID of element to remove
   * @returns {Object} Action object
   */
  removeElement(elementId) {
    return {
      type: ActionTypes.REMOVE_ELEMENT,
      payload: { elementId },
    };
  },

  /**
   * Add an AI snake to the game.
   *
   * @param {Object} snake - Snake data
   * @returns {Object} Action object
   */
  addAISnake(snake) {
    return {
      type: ActionTypes.ADD_AI_SNAKE,
      payload: { snake },
    };
  },

  /**
   * Remove an AI snake from the game.
   *
   * @param {string} snakeId - ID of snake to remove
   * @returns {Object} Action object
   */
  removeAISnake(snakeId) {
    return {
      type: ActionTypes.REMOVE_AI_SNAKE,
      payload: { snakeId },
    };
  },
};

/**
 * Player Action Creators
 * Functions that create actions related to player state.
 */
export const playerActions = {
  /**
   * Update player position and angle.
   *
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} angle - Angle in radians
   * @returns {Object} Action object
   */
  movePlayer(x, y, angle) {
    return {
      type: ActionTypes.PLAYER_MOVE,
      payload: { x, y, angle },
    };
  },

  /**
   * Start player boost.
   *
   * @returns {Object} Action object
   */
  startBoost() {
    return {
      type: ActionTypes.PLAYER_BOOST_START,
    };
  },

  /**
   * End player boost.
   *
   * @returns {Object} Action object
   */
  endBoost() {
    return {
      type: ActionTypes.PLAYER_BOOST_END,
    };
  },

  /**
   * Collect an element.
   *
   * @param {Object} element - Element data
   * @returns {Object} Action object
   */
  collectElement(element) {
    return {
      type: ActionTypes.PLAYER_COLLECT_ELEMENT,
      payload: { element },
    };
  },

  /**
   * Grow the player snake.
   *
   * @param {number} segments - Number of segments to add
   * @returns {Object} Action object
   */
  growPlayer(segments) {
    return {
      type: ActionTypes.PLAYER_GROW,
      payload: { segments },
    };
  },

  /**
   * Player dies.
   *
   * @param {string} cause - Cause of death
   * @returns {Object} Action object
   */
  playerDie(cause) {
    return {
      type: ActionTypes.PLAYER_DIE,
      payload: { cause },
    };
  },

  /**
   * Respawn the player.
   *
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object} Action object
   */
  respawnPlayer(x, y) {
    return {
      type: ActionTypes.PLAYER_RESPAWN,
      payload: { x, y },
    };
  },

  /**
   * Update player statistics.
   *
   * @param {Object} stats - Stats to update
   * @returns {Object} Action object
   */
  updatePlayerStats(stats) {
    return {
      type: ActionTypes.UPDATE_PLAYER_STATS,
      payload: { stats },
    };
  },

  /**
   * Update player inventory.
   *
   * @param {Object} inventory - Inventory data
   * @returns {Object} Action object
   */
  updateInventory(inventory) {
    return {
      type: ActionTypes.UPDATE_INVENTORY,
      payload: { inventory },
    };
  },
};

/**
 * UI Action Creators
 * Functions that create actions related to UI state.
 */
export const uiActions = {
  /**
   * Show a menu.
   *
   * @param {string} menu - Menu name ('main', 'pause', 'settings', 'gameover')
   * @returns {Object} Action object
   */
  showMenu(menu) {
    return {
      type: ActionTypes.SHOW_MENU,
      payload: { menu },
    };
  },

  /**
   * Hide the current menu.
   *
   * @returns {Object} Action object
   */
  hideMenu() {
    return {
      type: ActionTypes.HIDE_MENU,
    };
  },

  /**
   * Show a modal.
   *
   * @param {string} modal - Modal name ('help', 'controls', 'about')
   * @returns {Object} Action object
   */
  showModal(modal) {
    return {
      type: ActionTypes.SHOW_MODAL,
      payload: { modal },
    };
  },

  /**
   * Hide the current modal.
   *
   * @returns {Object} Action object
   */
  hideModal() {
    return {
      type: ActionTypes.HIDE_MODAL,
    };
  },

  /**
   * Update HUD settings.
   *
   * @param {Object} hudData - HUD configuration
   * @returns {Object} Action object
   */
  updateHUD(hudData) {
    return {
      type: ActionTypes.UPDATE_HUD,
      payload: { hudData },
    };
  },

  /**
   * Toggle the pause menu.
   *
   * @returns {Object} Action object
   */
  togglePauseMenu() {
    return {
      type: ActionTypes.TOGGLE_PAUSE_MENU,
    };
  },

  /**
   * Update application settings.
   *
   * @param {Object} settings - Settings to update
   * @returns {Object} Action object
   */
  updateSettings(settings) {
    return {
      type: ActionTypes.UPDATE_SETTINGS,
      payload: { settings },
    };
  },

  /**
   * Add a notification.
   *
   * @param {Object} notification - Notification data
   * @returns {Object} Action object
   */
  addNotification(notification) {
    return {
      type: ActionTypes.ADD_NOTIFICATION,
      payload: { notification },
    };
  },

  /**
   * Remove a notification.
   *
   * @param {string} notificationId - ID of notification to remove
   * @returns {Object} Action object
   */
  removeNotification(notificationId) {
    return {
      type: ActionTypes.REMOVE_NOTIFICATION,
      payload: { notificationId },
    };
  },

  /**
   * Set loading state.
   *
   * @param {boolean} loading - Loading state
   * @returns {Object} Action object
   */
  setLoading(loading) {
    return {
      type: ActionTypes.SET_LOADING,
      payload: { loading },
    };
  },
};
