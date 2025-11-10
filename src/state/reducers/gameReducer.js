/**
 * Game State Reducer
 *
 * Manages the core game state including:
 * - Game status (playing, paused, game over)
 * - Game mode (infinite, classic)
 * - Score tracking
 * - Element management
 * - AI snake management
 *
 * @module state/reducers/gameReducer
 */

import { ActionTypes } from '../actions.js';

/**
 * Initial game state
 */
const initialState = {
  // Game status
  status: 'menu', // 'menu', 'playing', 'paused', 'gameover'
  mode: null, // 'infinite', 'classic'

  // Score
  score: 0,
  highScore: 0,
  finalScore: 0,

  // Elements in the game world
  elements: [],
  elementCount: 0,

  // AI Snakes
  aiSnakes: [],
  aiSnakeCount: 0,

  // Game timing
  startTime: null,
  pauseTime: null,
  gameTime: 0,

  // Statistics
  stats: {
    elementsCollected: 0,
    snakesDefeated: 0,
    longestLength: 0,
    survivalTime: 0,
  },
};

/**
 * Game reducer function
 *
 * @param {Object} state - Current game state
 * @param {Object} action - Action to process
 * @returns {Object} New game state
 */
export function gameReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.GAME_START:
      return {
        ...state,
        status: 'playing',
        mode: action.payload.mode,
        score: 0,
        startTime: Date.now(),
        pauseTime: null,
        gameTime: 0,
        stats: {
          elementsCollected: 0,
          snakesDefeated: 0,
          longestLength: 0,
          survivalTime: 0,
        },
      };

    case ActionTypes.GAME_PAUSE:
      return {
        ...state,
        status: 'paused',
        pauseTime: Date.now(),
      };

    case ActionTypes.GAME_RESUME:
      return {
        ...state,
        status: 'playing',
        pauseTime: null,
      };

    case ActionTypes.GAME_OVER:
      return {
        ...state,
        status: 'gameover',
        finalScore: action.payload.finalScore,
        highScore: Math.max(state.highScore, action.payload.finalScore),
      };

    case ActionTypes.GAME_RESET:
      return {
        ...initialState,
        highScore: state.highScore, // Preserve high score
      };

    case ActionTypes.UPDATE_SCORE: {
      const newScore = state.score + action.payload.points;
      return {
        ...state,
        score: Math.max(0, newScore), // Don't allow negative scores
      };
    }

    case ActionTypes.UPDATE_HIGH_SCORE:
      return {
        ...state,
        highScore: Math.max(state.highScore, action.payload.score),
      };

    case ActionTypes.SPAWN_ELEMENT:
      return {
        ...state,
        elements: [...state.elements, action.payload.element],
        elementCount: state.elementCount + 1,
      };

    case ActionTypes.REMOVE_ELEMENT:
      return {
        ...state,
        elements: state.elements.filter(
          (el) => el.id !== action.payload.elementId
        ),
        elementCount: state.elementCount - 1,
      };

    case ActionTypes.ADD_AI_SNAKE:
      return {
        ...state,
        aiSnakes: [...state.aiSnakes, action.payload.snake],
        aiSnakeCount: state.aiSnakeCount + 1,
      };

    case ActionTypes.REMOVE_AI_SNAKE:
      return {
        ...state,
        aiSnakes: state.aiSnakes.filter(
          (snake) => snake.id !== action.payload.snakeId
        ),
        aiSnakeCount: state.aiSnakeCount - 1,
        stats: {
          ...state.stats,
          snakesDefeated: state.stats.snakesDefeated + 1,
        },
      };

    case ActionTypes.PLAYER_COLLECT_ELEMENT:
      return {
        ...state,
        stats: {
          ...state.stats,
          elementsCollected: state.stats.elementsCollected + 1,
        },
      };

    default:
      return state;
  }
}

export default gameReducer;
