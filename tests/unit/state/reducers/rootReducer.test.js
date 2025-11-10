/**
 * Integration Tests for Root Reducer
 *
 * Tests the integration of all reducers:
 * - Game reducer
 * - Player reducer
 * - UI reducer
 *
 * Ensures they work together correctly via combineReducers
 *
 * @module tests/unit/state/reducers/rootReducer
 */

import { describe, it, expect } from 'vitest';
import { rootReducer } from '../../../../src/state/reducers/index.js';
import { ActionTypes } from '../../../../src/state/actions.js';

describe('rootReducer', () => {
  describe('initial state', () => {
    it('should return combined initial state', () => {
      const state = rootReducer(undefined, { type: '@@INIT' });

      expect(state).toHaveProperty('game');
      expect(state).toHaveProperty('player');
      expect(state).toHaveProperty('ui');
    });

    it('should have correct game initial state', () => {
      const state = rootReducer(undefined, { type: '@@INIT' });

      expect(state.game.status).toBe('menu');
      expect(state.game.score).toBe(0);
      expect(state.game.highScore).toBe(0);
    });

    it('should have correct player initial state', () => {
      const state = rootReducer(undefined, { type: '@@INIT' });

      expect(state.player.x).toBe(0);
      expect(state.player.y).toBe(0);
      expect(state.player.length).toBe(10);
      expect(state.player.isAlive).toBe(true);
    });

    it('should have correct UI initial state', () => {
      const state = rootReducer(undefined, { type: '@@INIT' });

      expect(state.ui.currentMenu).toBe('main');
      expect(state.ui.menuVisible).toBe(true);
      expect(state.ui.hud.visible).toBe(true);
    });
  });

  describe('cross-slice actions', () => {
    it('should handle GAME_START across all slices', () => {
      const initialState = rootReducer(undefined, { type: '@@INIT' });

      const state = rootReducer(initialState, {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });

      // Game slice updated
      expect(state.game.status).toBe('playing');
      expect(state.game.mode).toBe('infinite');

      // Player slice updated
      expect(state.player.lives).toBe(3); // Preserved from initial

      // UI slice updated
      expect(state.ui.currentMenu).toBe(null);
      expect(state.ui.menuVisible).toBe(false);
      expect(state.ui.hud.visible).toBe(true);
    });

    it('should handle GAME_PAUSE across relevant slices', () => {
      let state = rootReducer(undefined, { type: '@@INIT' });

      // Start game first
      state = rootReducer(state, {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });

      // Pause game
      state = rootReducer(state, { type: ActionTypes.GAME_PAUSE });

      // Game slice updated
      expect(state.game.status).toBe('paused');

      // UI slice updated
      expect(state.ui.pauseMenuVisible).toBe(true);
      expect(state.ui.currentMenu).toBe('pause');
    });

    it('should handle GAME_RESUME across relevant slices', () => {
      let state = rootReducer(undefined, { type: '@@INIT' });

      state = rootReducer(state, {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });
      state = rootReducer(state, { type: ActionTypes.GAME_PAUSE });
      state = rootReducer(state, { type: ActionTypes.GAME_RESUME });

      // Game slice updated
      expect(state.game.status).toBe('playing');

      // UI slice updated
      expect(state.ui.pauseMenuVisible).toBe(false);
      expect(state.ui.currentMenu).toBe(null);
    });

    it('should handle GAME_OVER across relevant slices', () => {
      let state = rootReducer(undefined, { type: '@@INIT' });

      state = rootReducer(state, {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });

      state = rootReducer(state, {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 1500 },
      });

      state = rootReducer(state, {
        type: ActionTypes.GAME_OVER,
        payload: { finalScore: 1500 },
      });

      // Game slice updated
      expect(state.game.status).toBe('gameover');
      expect(state.game.finalScore).toBe(1500);

      // UI slice updated
      expect(state.ui.currentMenu).toBe('gameover');
      expect(state.ui.menuVisible).toBe(true);
    });

    it('should handle GAME_RESET across all slices', () => {
      let state = rootReducer(undefined, { type: '@@INIT' });

      // Play some game
      state = rootReducer(state, {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });
      state = rootReducer(state, {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 500 },
      });
      state = rootReducer(state, {
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 100, y: 200, angle: 1.5 },
      });

      // Reset
      state = rootReducer(state, { type: ActionTypes.GAME_RESET });

      // Game reset
      expect(state.game.status).toBe('menu');
      expect(state.game.score).toBe(0);

      // Player reset
      expect(state.player.x).toBe(0);
      expect(state.player.y).toBe(0);
      expect(state.player.length).toBe(10);

      // UI reset
      expect(state.ui.currentMenu).toBe('main');
      expect(state.ui.menuVisible).toBe(true);
    });
  });

  describe('isolated slice actions', () => {
    it('should only update game slice for game-specific actions', () => {
      const initialState = rootReducer(undefined, { type: '@@INIT' });

      const state = rootReducer(initialState, {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 100 },
      });

      // Game slice updated
      expect(state.game.score).toBe(100);

      // Other slices unchanged
      expect(state.player).toBe(initialState.player);
      expect(state.ui).toBe(initialState.ui);
    });

    it('should only update player slice for player-specific actions', () => {
      const initialState = rootReducer(undefined, { type: '@@INIT' });

      const state = rootReducer(initialState, {
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 50, y: 100, angle: Math.PI / 2 },
      });

      // Player slice updated
      expect(state.player.x).toBe(50);
      expect(state.player.y).toBe(100);

      // Other slices unchanged
      expect(state.game).toBe(initialState.game);
      expect(state.ui).toBe(initialState.ui);
    });

    it('should only update UI slice for UI-specific actions', () => {
      const initialState = rootReducer(undefined, { type: '@@INIT' });

      const state = rootReducer(initialState, {
        type: ActionTypes.SHOW_MODAL,
        payload: { modal: 'help' },
      });

      // UI slice updated
      expect(state.ui.currentModal).toBe('help');
      expect(state.ui.modalVisible).toBe(true);

      // Other slices unchanged
      expect(state.game).toBe(initialState.game);
      expect(state.player).toBe(initialState.player);
    });
  });

  describe('complex game flow', () => {
    it('should handle complete game lifecycle', () => {
      let state = rootReducer(undefined, { type: '@@INIT' });

      // Start game
      state = rootReducer(state, {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });
      expect(state.game.status).toBe('playing');
      expect(state.ui.menuVisible).toBe(false);

      // Player moves and collects elements
      state = rootReducer(state, {
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 100, y: 100, angle: 0 },
      });
      state = rootReducer(state, {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { type: 'fire', value: 10 } },
      });
      state = rootReducer(state, {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 10 },
      });

      expect(state.player.x).toBe(100);
      expect(state.player.inventory.totalElements).toBe(1);
      expect(state.game.score).toBe(10);

      // Player grows
      state = rootReducer(state, {
        type: ActionTypes.PLAYER_GROW,
        payload: { segments: 5 },
      });
      expect(state.player.length).toBe(15);

      // Pause game
      state = rootReducer(state, { type: ActionTypes.GAME_PAUSE });
      expect(state.game.status).toBe('paused');
      expect(state.ui.pauseMenuVisible).toBe(true);

      // Resume game
      state = rootReducer(state, { type: ActionTypes.GAME_RESUME });
      expect(state.game.status).toBe('playing');
      expect(state.ui.pauseMenuVisible).toBe(false);

      // Player dies
      state = rootReducer(state, {
        type: ActionTypes.PLAYER_DIE,
        payload: { cause: 'collision' },
      });
      expect(state.player.isAlive).toBe(false);
      expect(state.player.lives).toBe(2);

      // Game over
      state = rootReducer(state, {
        type: ActionTypes.GAME_OVER,
        payload: { finalScore: 10 },
      });
      expect(state.game.status).toBe('gameover');
      expect(state.ui.currentMenu).toBe('gameover');
    });

    it('should handle player boosting lifecycle', () => {
      let state = rootReducer(undefined, { type: '@@INIT' });

      state = rootReducer(state, {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });

      // Start boosting
      state = rootReducer(state, { type: ActionTypes.PLAYER_BOOST_START });
      expect(state.player.isBoosting).toBe(true);
      expect(state.player.stats.totalBoosts).toBe(1);

      // End boosting
      state = rootReducer(state, { type: ActionTypes.PLAYER_BOOST_END });
      expect(state.player.isBoosting).toBe(false);
      expect(state.player.stats.totalBoosts).toBe(1); // Count preserved
    });
  });

  describe('state immutability', () => {
    it('should return new state object on changes', () => {
      const initialState = rootReducer(undefined, { type: '@@INIT' });

      const newState = rootReducer(initialState, {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 100 },
      });

      expect(newState).not.toBe(initialState);
      expect(newState.game).not.toBe(initialState.game);
    });

    it('should preserve unchanged slices', () => {
      const initialState = rootReducer(undefined, { type: '@@INIT' });

      const newState = rootReducer(initialState, {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 100 },
      });

      // Changed slice is new
      expect(newState.game).not.toBe(initialState.game);

      // Unchanged slices are same reference
      expect(newState.player).toBe(initialState.player);
      expect(newState.ui).toBe(initialState.ui);
    });
  });

  describe('unknown actions', () => {
    it('should return current state for unknown actions', () => {
      const initialState = rootReducer(undefined, { type: '@@INIT' });

      const newState = rootReducer(initialState, {
        type: 'UNKNOWN_ACTION_TYPE',
      });

      expect(newState).toBe(initialState);
    });
  });
});
