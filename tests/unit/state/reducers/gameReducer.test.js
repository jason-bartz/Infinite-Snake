import { describe, it, expect } from 'vitest';
import { gameReducer } from '../../../../src/state/reducers/gameReducer.js';
import { ActionTypes } from '../../../../src/state/actions.js';

describe('gameReducer', () => {
  const initialState = {
    status: 'menu',
    mode: null,
    score: 0,
    highScore: 0,
    finalScore: 0,
    elements: [],
    elementCount: 0,
    aiSnakes: [],
    aiSnakeCount: 0,
    startTime: null,
    pauseTime: null,
    gameTime: 0,
    stats: {
      elementsCollected: 0,
      snakesDefeated: 0,
      longestLength: 0,
      survivalTime: 0,
    },
  };

  describe('initial state', () => {
    it('should return initial state when no action matches', () => {
      const state = gameReducer(undefined, { type: 'UNKNOWN_ACTION' });
      expect(state.status).toBe('menu');
      expect(state.score).toBe(0);
    });
  });

  describe('GAME_START', () => {
    it('should start game in infinite mode', () => {
      const action = {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      };
      const state = gameReducer(initialState, action);

      expect(state.status).toBe('playing');
      expect(state.mode).toBe('infinite');
      expect(state.score).toBe(0);
      expect(state.startTime).toBeDefined();
    });

    it('should start game in classic mode', () => {
      const action = {
        type: ActionTypes.GAME_START,
        payload: { mode: 'classic' },
      };
      const state = gameReducer(initialState, action);

      expect(state.status).toBe('playing');
      expect(state.mode).toBe('classic');
    });

    it('should reset stats on game start', () => {
      const existingState = {
        ...initialState,
        stats: {
          elementsCollected: 100,
          snakesDefeated: 5,
          longestLength: 50,
          survivalTime: 1000,
        },
      };
      const action = {
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      };
      const state = gameReducer(existingState, action);

      expect(state.stats.elementsCollected).toBe(0);
      expect(state.stats.snakesDefeated).toBe(0);
    });
  });

  describe('GAME_PAUSE', () => {
    it('should pause the game', () => {
      const playingState = { ...initialState, status: 'playing' };
      const action = { type: ActionTypes.GAME_PAUSE };
      const state = gameReducer(playingState, action);

      expect(state.status).toBe('paused');
      expect(state.pauseTime).toBeDefined();
    });
  });

  describe('GAME_RESUME', () => {
    it('should resume the game', () => {
      const pausedState = {
        ...initialState,
        status: 'paused',
        pauseTime: Date.now(),
      };
      const action = { type: ActionTypes.GAME_RESUME };
      const state = gameReducer(pausedState, action);

      expect(state.status).toBe('playing');
      expect(state.pauseTime).toBeNull();
    });
  });

  describe('GAME_OVER', () => {
    it('should end game with final score', () => {
      const action = {
        type: ActionTypes.GAME_OVER,
        payload: { finalScore: 500 },
      };
      const state = gameReducer(initialState, action);

      expect(state.status).toBe('gameover');
      expect(state.finalScore).toBe(500);
    });

    it('should update high score if final score is higher', () => {
      const existingState = { ...initialState, highScore: 300 };
      const action = {
        type: ActionTypes.GAME_OVER,
        payload: { finalScore: 500 },
      };
      const state = gameReducer(existingState, action);

      expect(state.highScore).toBe(500);
    });

    it('should not update high score if final score is lower', () => {
      const existingState = { ...initialState, highScore: 1000 };
      const action = {
        type: ActionTypes.GAME_OVER,
        payload: { finalScore: 500 },
      };
      const state = gameReducer(existingState, action);

      expect(state.highScore).toBe(1000);
    });
  });

  describe('GAME_RESET', () => {
    it('should reset game to initial state', () => {
      const gameInProgress = {
        ...initialState,
        status: 'playing',
        score: 500,
        mode: 'infinite',
      };
      const action = { type: ActionTypes.GAME_RESET };
      const state = gameReducer(gameInProgress, action);

      expect(state.status).toBe('menu');
      expect(state.score).toBe(0);
      expect(state.mode).toBeNull();
    });

    it('should preserve high score on reset', () => {
      const gameInProgress = { ...initialState, highScore: 1000, score: 500 };
      const action = { type: ActionTypes.GAME_RESET };
      const state = gameReducer(gameInProgress, action);

      expect(state.highScore).toBe(1000);
      expect(state.score).toBe(0);
    });
  });

  describe('UPDATE_SCORE', () => {
    it('should add points to score', () => {
      const currentState = { ...initialState, score: 100 };
      const action = {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 50 },
      };
      const state = gameReducer(currentState, action);

      expect(state.score).toBe(150);
    });

    it('should subtract points from score', () => {
      const currentState = { ...initialState, score: 100 };
      const action = {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: -30 },
      };
      const state = gameReducer(currentState, action);

      expect(state.score).toBe(70);
    });

    it('should not allow negative scores', () => {
      const currentState = { ...initialState, score: 10 };
      const action = {
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: -50 },
      };
      const state = gameReducer(currentState, action);

      expect(state.score).toBe(0);
    });
  });

  describe('UPDATE_HIGH_SCORE', () => {
    it('should update high score', () => {
      const action = {
        type: ActionTypes.UPDATE_HIGH_SCORE,
        payload: { score: 1000 },
      };
      const state = gameReducer(initialState, action);

      expect(state.highScore).toBe(1000);
    });

    it('should only increase high score, not decrease', () => {
      const currentState = { ...initialState, highScore: 1000 };
      const action = {
        type: ActionTypes.UPDATE_HIGH_SCORE,
        payload: { score: 500 },
      };
      const state = gameReducer(currentState, action);

      expect(state.highScore).toBe(1000);
    });
  });

  describe('SPAWN_ELEMENT', () => {
    it('should add element to game', () => {
      const element = { id: 'elem1', type: 'water', x: 100, y: 200 };
      const action = {
        type: ActionTypes.SPAWN_ELEMENT,
        payload: { element },
      };
      const state = gameReducer(initialState, action);

      expect(state.elements).toHaveLength(1);
      expect(state.elements[0]).toBe(element);
      expect(state.elementCount).toBe(1);
    });

    it('should add multiple elements', () => {
      let state = initialState;

      for (let i = 0; i < 3; i++) {
        const element = { id: `elem${i}`, type: 'fire' };
        const action = {
          type: ActionTypes.SPAWN_ELEMENT,
          payload: { element },
        };
        state = gameReducer(state, action);
      }

      expect(state.elements).toHaveLength(3);
      expect(state.elementCount).toBe(3);
    });
  });

  describe('REMOVE_ELEMENT', () => {
    it('should remove element from game', () => {
      const currentState = {
        ...initialState,
        elements: [
          { id: 'elem1', type: 'water' },
          { id: 'elem2', type: 'fire' },
        ],
        elementCount: 2,
      };
      const action = {
        type: ActionTypes.REMOVE_ELEMENT,
        payload: { elementId: 'elem1' },
      };
      const state = gameReducer(currentState, action);

      expect(state.elements).toHaveLength(1);
      expect(state.elements[0].id).toBe('elem2');
      expect(state.elementCount).toBe(1);
    });
  });

  describe('ADD_AI_SNAKE', () => {
    it('should add AI snake to game', () => {
      const snake = { id: 'ai1', name: 'Enemy', length: 10 };
      const action = {
        type: ActionTypes.ADD_AI_SNAKE,
        payload: { snake },
      };
      const state = gameReducer(initialState, action);

      expect(state.aiSnakes).toHaveLength(1);
      expect(state.aiSnakes[0]).toBe(snake);
      expect(state.aiSnakeCount).toBe(1);
    });
  });

  describe('REMOVE_AI_SNAKE', () => {
    it('should remove AI snake from game', () => {
      const currentState = {
        ...initialState,
        aiSnakes: [
          { id: 'ai1', name: 'Enemy1' },
          { id: 'ai2', name: 'Enemy2' },
        ],
        aiSnakeCount: 2,
        stats: { ...initialState.stats, snakesDefeated: 5 },
      };
      const action = {
        type: ActionTypes.REMOVE_AI_SNAKE,
        payload: { snakeId: 'ai1' },
      };
      const state = gameReducer(currentState, action);

      expect(state.aiSnakes).toHaveLength(1);
      expect(state.aiSnakes[0].id).toBe('ai2');
      expect(state.aiSnakeCount).toBe(1);
      expect(state.stats.snakesDefeated).toBe(6);
    });
  });

  describe('PLAYER_COLLECT_ELEMENT', () => {
    it('should increment elements collected stat', () => {
      const action = {
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element: { id: 'elem1', type: 'water' } },
      };
      const state = gameReducer(initialState, action);

      expect(state.stats.elementsCollected).toBe(1);
    });
  });
});
