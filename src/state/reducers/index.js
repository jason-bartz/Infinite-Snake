/**
 * Root Reducer
 *
 * Combines all reducers into a single root reducer.
 * This creates the complete application state tree.
 *
 * @module state/reducers
 */

import { combineReducers } from '../store.js';
import { gameReducer } from './gameReducer.js';
import { playerReducer } from './playerReducer.js';
import { uiReducer } from './uiReducer.js';

/**
 * Root reducer combining all application reducers
 *
 * State shape:
 * {
 *   game: { ... },    // Game state (score, elements, AI snakes)
 *   player: { ... },  // Player state (position, inventory, stats)
 *   ui: { ... }       // UI state (menus, modals, settings)
 * }
 */
export const rootReducer = combineReducers({
  game: gameReducer,
  player: playerReducer,
  ui: uiReducer,
});

export default rootReducer;
