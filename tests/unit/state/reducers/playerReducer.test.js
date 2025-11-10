/**
 * Unit Tests for Player Reducer
 *
 * Tests all player state mutations including:
 * - Position and movement
 * - Boosting
 * - Element collection
 * - Growth
 * - Death and respawn
 * - Stats and inventory
 *
 * @module tests/unit/state/reducers/playerReducer
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { playerReducer } from '../../../../src/state/reducers/playerReducer.js';
import { ActionTypes } from '../../../../src/state/actions.js';

describe('playerReducer', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
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

      // Power-ups
      powerUps: [],
      activePowerUps: [],
    };
  });

  describe('initial state', () => {
    it('should return initial state when state is undefined', () => {
      const state = playerReducer(undefined, { type: '@@INIT' });
      expect(state).toEqual(initialState);
    });

    it('should have correct default values', () => {
      const state = playerReducer(undefined, { type: '@@INIT' });
      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.length).toBe(10);
      expect(state.isAlive).toBe(true);
      expect(state.lives).toBe(3);
      expect(state.isBoosting).toBe(false);
    });
  });

  describe('PLAYER_MOVE', () => {
    it('should update player position and angle', () => {
      const action = {
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 100, y: 200, angle: Math.PI / 4 },
      };

      const state = playerReducer(initialState, action);

      expect(state.x).toBe(100);
      expect(state.y).toBe(200);
      expect(state.angle).toBe(Math.PI / 4);
    });

    it('should not modify other state properties', () => {
      const action = {
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 100, y: 200, angle: 0 },
      };

      const state = playerReducer(initialState, action);

      expect(state.length).toBe(initialState.length);
      expect(state.isAlive).toBe(initialState.isAlive);
      expect(state.isBoosting).toBe(initialState.isBoosting);
    });

    it('should be immutable', () => {
      const action = {
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 100, y: 200, angle: 0 },
      };

      const state = playerReducer(initialState, action);

      expect(state).not.toBe(initialState);
      expect(initialState.x).toBe(0); // Original not modified
    });
  });

  describe('PLAYER_BOOST_START', () => {
    it('should set isBoosting to true', () => {
      const action = { type: ActionTypes.PLAYER_BOOST_START };
      const state = playerReducer(initialState, action);

      expect(state.isBoosting).toBe(true);
    });

    it('should increment totalBoosts stat', () => {
      const action = { type: ActionTypes.PLAYER_BOOST_START };
      const state = playerReducer(initialState, action);

      expect(state.stats.totalBoosts).toBe(1);
    });

    it('should increment boosts correctly over multiple actions', () => {
      let state = initialState;

      for (let i = 0; i < 5; i++) {
        state = playerReducer(state, { type: ActionTypes.PLAYER_BOOST_START });
        state = playerReducer(state, { type: ActionTypes.PLAYER_BOOST_END });
      }

      expect(state.stats.totalBoosts).toBe(5);
    });
  });

  describe('PLAYER_BOOST_END', () => {
    it('should set isBoosting to false', () => {
      const boostingState = { ...initialState, isBoosting: true };
      const action = { type: ActionTypes.PLAYER_BOOST_END };
      const state = playerReducer(boostingState, action);

      expect(state.isBoosting).toBe(false);
    });

    it('should not affect stats', () => {
      const boostingState = {
        ...initialState,
        isBoosting: true,
        stats: { ...initialState.stats, totalBoosts: 5 },
      };
      const action = { type: ActionTypes.PLAYER_BOOST_END };
      const state = playerReducer(boostingState, action);

      expect(state.stats.totalBoosts).toBe(5);
    });
  });

  describe('PLAYER_COLLECT_ELEMENT', () => {
    it('should add element to inventory', () => {
      const action = {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { type: 'fire', value: 10 } },
      };

      const state = playerReducer(initialState, action);

      expect(state.inventory.elements.fire).toBe(1);
      expect(state.inventory.totalElements).toBe(1);
    });

    it('should increment count for existing element type', () => {
      let state = initialState;

      // Collect 3 fire elements
      for (let i = 0; i < 3; i++) {
        state = playerReducer(state, {
          type: ActionTypes.PLAYER_COLLECT_ELEMENT,
          payload: { element: { type: 'fire', value: 10 } },
        });
      }

      expect(state.inventory.elements.fire).toBe(3);
      expect(state.inventory.totalElements).toBe(3);
    });

    it('should handle multiple element types', () => {
      let state = initialState;

      state = playerReducer(state, {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { type: 'fire', value: 10 } },
      });

      state = playerReducer(state, {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { type: 'water', value: 10 } },
      });

      state = playerReducer(state, {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { type: 'fire', value: 10 } },
      });

      expect(state.inventory.elements.fire).toBe(2);
      expect(state.inventory.elements.water).toBe(1);
      expect(state.inventory.totalElements).toBe(3);
    });

    it('should increment elementsEaten stat', () => {
      const action = {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { type: 'fire', value: 10 } },
      };

      const state = playerReducer(initialState, action);

      expect(state.stats.elementsEaten).toBe(1);
    });
  });

  describe('PLAYER_GROW', () => {
    it('should increase snake length', () => {
      const action = {
        type: ActionTypes.PLAYER_GROW,
        payload: { segments: 5 },
      };

      const state = playerReducer(initialState, action);

      expect(state.length).toBe(15); // 10 + 5
    });

    it('should not exceed maxLength', () => {
      const nearMaxState = { ...initialState, length: 995 };
      const action = {
        type: ActionTypes.PLAYER_GROW,
        payload: { segments: 10 },
      };

      const state = playerReducer(nearMaxState, action);

      expect(state.length).toBe(1000); // Capped at maxLength
    });

    it('should update longestSnake stat', () => {
      const action = {
        type: ActionTypes.PLAYER_GROW,
        payload: { segments: 50 },
      };

      const state = playerReducer(initialState, action);

      expect(state.stats.longestSnake).toBe(60); // 10 + 50
    });

    it('should not decrease longestSnake stat', () => {
      const withStatsState = {
        ...initialState,
        length: 50,
        stats: { ...initialState.stats, longestSnake: 100 },
      };

      const action = {
        type: ActionTypes.PLAYER_GROW,
        payload: { segments: 5 },
      };

      const state = playerReducer(withStatsState, action);

      expect(state.length).toBe(55);
      expect(state.stats.longestSnake).toBe(100); // Should remain 100
    });
  });

  describe('PLAYER_DIE', () => {
    it('should set isAlive to false', () => {
      const action = {
        type: ActionTypes.PLAYER_DIE,
        payload: { cause: 'collision' },
      };

      const state = playerReducer(initialState, action);

      expect(state.isAlive).toBe(false);
    });

    it('should record death cause', () => {
      const action = {
        type: ActionTypes.PLAYER_DIE,
        payload: { cause: 'self-collision' },
      };

      const state = playerReducer(initialState, action);

      expect(state.deathCause).toBe('self-collision');
    });

    it('should decrement lives', () => {
      const action = {
        type: ActionTypes.PLAYER_DIE,
        payload: { cause: 'collision' },
      };

      const state = playerReducer(initialState, action);

      expect(state.lives).toBe(2); // 3 - 1
    });

    it('should not go below 0 lives', () => {
      const noLivesState = { ...initialState, lives: 0 };
      const action = {
        type: ActionTypes.PLAYER_DIE,
        payload: { cause: 'collision' },
      };

      const state = playerReducer(noLivesState, action);

      expect(state.lives).toBe(0);
    });

    it('should increment totalCollisions stat', () => {
      const action = {
        type: ActionTypes.PLAYER_DIE,
        payload: { cause: 'collision' },
      };

      const state = playerReducer(initialState, action);

      expect(state.stats.totalCollisions).toBe(1);
    });
  });

  describe('PLAYER_RESPAWN', () => {
    it('should set isAlive to true', () => {
      const deadState = { ...initialState, isAlive: false };
      const action = {
        type: ActionTypes.PLAYER_RESPAWN,
        payload: { x: 100, y: 100 },
      };

      const state = playerReducer(deadState, action);

      expect(state.isAlive).toBe(true);
    });

    it('should clear death cause', () => {
      const deadState = {
        ...initialState,
        isAlive: false,
        deathCause: 'collision',
      };
      const action = {
        type: ActionTypes.PLAYER_RESPAWN,
        payload: { x: 100, y: 100 },
      };

      const state = playerReducer(deadState, action);

      expect(state.deathCause).toBe(null);
    });

    it('should reset position', () => {
      const deadState = {
        ...initialState,
        x: 500,
        y: 500,
        isAlive: false,
      };
      const action = {
        type: ActionTypes.PLAYER_RESPAWN,
        payload: { x: 100, y: 200 },
      };

      const state = playerReducer(deadState, action);

      expect(state.x).toBe(100);
      expect(state.y).toBe(200);
    });

    it('should reset length to initial value', () => {
      const deadState = {
        ...initialState,
        length: 100,
        isAlive: false,
      };
      const action = {
        type: ActionTypes.PLAYER_RESPAWN,
        payload: { x: 100, y: 100 },
      };

      const state = playerReducer(deadState, action);

      expect(state.length).toBe(10); // Initial length
    });

    it('should clear segments and boosting state', () => {
      const deadState = {
        ...initialState,
        segments: [1, 2, 3],
        isBoosting: true,
        isAlive: false,
      };
      const action = {
        type: ActionTypes.PLAYER_RESPAWN,
        payload: { x: 100, y: 100 },
      };

      const state = playerReducer(deadState, action);

      expect(state.segments).toEqual([]);
      expect(state.isBoosting).toBe(false);
    });

    it('should preserve lives and stats', () => {
      const deadState = {
        ...initialState,
        lives: 2,
        isAlive: false,
        stats: {
          ...initialState.stats,
          totalCollisions: 5,
          elementsEaten: 20,
        },
      };
      const action = {
        type: ActionTypes.PLAYER_RESPAWN,
        payload: { x: 100, y: 100 },
      };

      const state = playerReducer(deadState, action);

      expect(state.lives).toBe(2);
      expect(state.stats.totalCollisions).toBe(5);
      expect(state.stats.elementsEaten).toBe(20);
    });
  });

  describe('UPDATE_PLAYER_STATS', () => {
    it('should update stats', () => {
      const action = {
        type: ActionTypes.UPDATE_PLAYER_STATS,
        payload: {
          stats: {
            totalDistance: 1000,
            snakesKilled: 5,
          },
        },
      };

      const state = playerReducer(initialState, action);

      expect(state.stats.totalDistance).toBe(1000);
      expect(state.stats.snakesKilled).toBe(5);
    });

    it('should merge stats without overwriting others', () => {
      const withStatsState = {
        ...initialState,
        stats: {
          ...initialState.stats,
          totalDistance: 500,
          totalBoosts: 10,
          elementsEaten: 20,
        },
      };

      const action = {
        type: ActionTypes.UPDATE_PLAYER_STATS,
        payload: {
          stats: {
            totalDistance: 1000, // Update this
          },
        },
      };

      const state = playerReducer(withStatsState, action);

      expect(state.stats.totalDistance).toBe(1000);
      expect(state.stats.totalBoosts).toBe(10); // Preserved
      expect(state.stats.elementsEaten).toBe(20); // Preserved
    });
  });

  describe('UPDATE_INVENTORY', () => {
    it('should update inventory', () => {
      const action = {
        type: ActionTypes.UPDATE_INVENTORY,
        payload: {
          inventory: {
            elements: { fire: 5, water: 3 },
            totalElements: 8,
          },
        },
      };

      const state = playerReducer(initialState, action);

      expect(state.inventory.elements.fire).toBe(5);
      expect(state.inventory.elements.water).toBe(3);
      expect(state.inventory.totalElements).toBe(8);
    });

    it('should merge inventory without overwriting all properties', () => {
      const withInventoryState = {
        ...initialState,
        inventory: {
          elements: { fire: 5 },
          totalElements: 5,
        },
      };

      const action = {
        type: ActionTypes.UPDATE_INVENTORY,
        payload: {
          inventory: {
            elements: { fire: 5, water: 3 }, // Add water
          },
        },
      };

      const state = playerReducer(withInventoryState, action);

      expect(state.inventory.elements.fire).toBe(5);
      expect(state.inventory.elements.water).toBe(3);
    });
  });

  describe('GAME_RESET', () => {
    it('should reset player state to initial values', () => {
      const modifiedState = {
        ...initialState,
        x: 500,
        y: 500,
        length: 100,
        lives: 1,
        isAlive: false,
        inventory: {
          elements: { fire: 10 },
          totalElements: 10,
        },
        stats: {
          ...initialState.stats,
          totalDistance: 1000,
          elementsEaten: 50,
        },
      };

      const action = { type: ActionTypes.GAME_RESET };
      const state = playerReducer(modifiedState, action);

      expect(state).toEqual(initialState);
    });
  });

  describe('GAME_START', () => {
    it('should reset player state but preserve lives', () => {
      const modifiedState = {
        ...initialState,
        x: 500,
        y: 500,
        length: 100,
        lives: 2,
        inventory: {
          elements: { fire: 10 },
          totalElements: 10,
        },
      };

      const action = { type: ActionTypes.GAME_START };
      const state = playerReducer(modifiedState, action);

      expect(state.x).toBe(0);
      expect(state.y).toBe(0);
      expect(state.length).toBe(10);
      expect(state.lives).toBe(2); // Lives preserved
      expect(state.inventory.elements).toEqual({});
      expect(state.inventory.totalElements).toBe(0);
    });
  });

  describe('unknown action', () => {
    it('should return current state for unknown action types', () => {
      const action = { type: 'UNKNOWN_ACTION' };
      const state = playerReducer(initialState, action);

      expect(state).toBe(initialState);
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState };
      const action = {
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 100, y: 200, angle: 0 },
      };

      const newState = playerReducer(initialState, action);

      expect(initialState).toEqual(originalState);
      expect(newState).not.toBe(initialState);
    });

    it('should not mutate nested inventory', () => {
      const state = {
        ...initialState,
        inventory: {
          elements: { fire: 5 },
          totalElements: 5,
        },
      };
      const originalInventory = state.inventory;

      const action = {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { type: 'water', value: 10 } },
      };

      const newState = playerReducer(state, action);

      expect(newState.inventory).not.toBe(originalInventory);
      expect(originalInventory.elements.water).toBeUndefined();
    });

    it('should not mutate nested stats', () => {
      const state = {
        ...initialState,
        stats: {
          ...initialState.stats,
          totalBoosts: 5,
        },
      };
      const originalStats = state.stats;

      const action = { type: ActionTypes.PLAYER_BOOST_START };
      const newState = playerReducer(state, action);

      expect(newState.stats).not.toBe(originalStats);
      expect(originalStats.totalBoosts).toBe(5); // Original not modified
    });
  });
});
