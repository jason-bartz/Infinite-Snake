/**
 * Player State Reducer
 *
 * Manages the player-specific state including:
 * - Position and movement
 * - Snake length and growth
 * - Boost state
 * - Inventory
 * - Player stats
 *
 * @module state/reducers/playerReducer
 */

import { ActionTypes } from '../actions.js';

/**
 * Initial player state
 */
const initialState = {
  // Position
  x: 0,
  y: 0,
  angle: 0,

  // Movement
  speed: 0,
  targetAngle: 0,
  isBoosting: false,

  // Snake properties
  length: 10,
  segments: [],
  maxLength: 1000,

  // Health and status
  isAlive: true,
  deathCause: null,
  lives: 3,

  // Inventory
  inventory: {
    elements: {},
    totalElements: 0,
  },

  // Player stats
  stats: {
    totalDistance: 0,
    totalBoosts: 0,
    totalCollisions: 0,
    longestSnake: 10,
    elementsEaten: 0,
    snakesKilled: 0,
  },

  // Power-ups (if any)
  powerUps: [],
  activePowerUps: [],
};

/**
 * Player reducer function
 *
 * @param {Object} state - Current player state
 * @param {Object} action - Action to process
 * @returns {Object} New player state
 */
export function playerReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.PLAYER_MOVE:
      return {
        ...state,
        x: action.payload.x,
        y: action.payload.y,
        angle: action.payload.angle,
      };

    case ActionTypes.PLAYER_BOOST_START:
      return {
        ...state,
        isBoosting: true,
        stats: {
          ...state.stats,
          totalBoosts: state.stats.totalBoosts + 1,
        },
      };

    case ActionTypes.PLAYER_BOOST_END:
      return {
        ...state,
        isBoosting: false,
      };

    case ActionTypes.PLAYER_COLLECT_ELEMENT: {
      const element = action.payload.element;
      const currentCount = state.inventory.elements[element.type] || 0;

      return {
        ...state,
        inventory: {
          ...state.inventory,
          elements: {
            ...state.inventory.elements,
            [element.type]: currentCount + 1,
          },
          totalElements: state.inventory.totalElements + 1,
        },
        stats: {
          ...state.stats,
          elementsEaten: state.stats.elementsEaten + 1,
        },
      };
    }

    case ActionTypes.PLAYER_GROW: {
      const newLength = Math.min(
        state.length + action.payload.segments,
        state.maxLength
      );
      const longestSnake = Math.max(state.stats.longestSnake, newLength);

      return {
        ...state,
        length: newLength,
        stats: {
          ...state.stats,
          longestSnake,
        },
      };
    }

    case ActionTypes.PLAYER_DIE:
      return {
        ...state,
        isAlive: false,
        deathCause: action.payload.cause,
        lives: Math.max(0, state.lives - 1),
        stats: {
          ...state.stats,
          totalCollisions: state.stats.totalCollisions + 1,
        },
      };

    case ActionTypes.PLAYER_RESPAWN:
      return {
        ...state,
        x: action.payload.x,
        y: action.payload.y,
        isAlive: true,
        deathCause: null,
        length: initialState.length,
        segments: [],
        isBoosting: false,
      };

    case ActionTypes.UPDATE_PLAYER_STATS:
      return {
        ...state,
        stats: {
          ...state.stats,
          ...action.payload.stats,
        },
      };

    case ActionTypes.UPDATE_INVENTORY:
      return {
        ...state,
        inventory: {
          ...state.inventory,
          ...action.payload.inventory,
        },
      };

    case ActionTypes.GAME_RESET:
      return {
        ...initialState,
      };

    case ActionTypes.GAME_START:
      return {
        ...initialState,
        lives: state.lives, // Preserve lives if continuing
      };

    default:
      return state;
  }
}

export default playerReducer;
