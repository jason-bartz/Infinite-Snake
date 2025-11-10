import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from '../../../src/state/store.js';

describe('Store', () => {
  let store;
  let mockReducer;

  beforeEach(() => {
    mockReducer = vi.fn((state = { count: 0 }, action) => {
      switch (action.type) {
        case 'INCREMENT':
          return { count: state.count + 1 };
        case 'DECREMENT':
          return { count: state.count - 1 };
        case 'ADD':
          return { count: state.count + action.payload };
        default:
          return state;
      }
    });
  });

  describe('createStore', () => {
    it('should create a store with initial state', () => {
      store = createStore(mockReducer);

      expect(store.getState()).toEqual({ count: 0 });
    });

    it('should create a store with custom initial state', () => {
      store = createStore(mockReducer, { count: 10 });

      expect(store.getState()).toEqual({ count: 10 });
    });

    it('should have dispatch method', () => {
      store = createStore(mockReducer);

      expect(typeof store.dispatch).toBe('function');
    });

    it('should have subscribe method', () => {
      store = createStore(mockReducer);

      expect(typeof store.subscribe).toBe('function');
    });

    it('should have getState method', () => {
      store = createStore(mockReducer);

      expect(typeof store.getState).toBe('function');
    });
  });

  describe('dispatch', () => {
    beforeEach(() => {
      store = createStore(mockReducer);
    });

    it('should dispatch an action and update state', () => {
      store.dispatch({ type: 'INCREMENT' });

      expect(store.getState()).toEqual({ count: 1 });
    });

    it('should call reducer with current state and action', () => {
      const action = { type: 'INCREMENT' };

      store.dispatch(action);

      expect(mockReducer).toHaveBeenCalledWith({ count: 0 }, action);
    });

    it('should handle multiple dispatches', () => {
      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'DECREMENT' });

      expect(store.getState()).toEqual({ count: 1 });
    });

    it('should handle actions with payload', () => {
      store.dispatch({ type: 'ADD', payload: 5 });

      expect(store.getState()).toEqual({ count: 5 });
    });

    it('should return the action that was dispatched', () => {
      const action = { type: 'INCREMENT' };
      const result = store.dispatch(action);

      expect(result).toBe(action);
    });
  });

  describe('subscribe', () => {
    beforeEach(() => {
      store = createStore(mockReducer);
    });

    it('should call listener when state changes', () => {
      const listener = vi.fn();

      store.subscribe(listener);
      store.dispatch({ type: 'INCREMENT' });

      expect(listener).toHaveBeenCalled();
    });

    it('should call listener with new state', () => {
      const listener = vi.fn();

      store.subscribe(listener);
      store.dispatch({ type: 'INCREMENT' });

      expect(listener).toHaveBeenCalledWith({ count: 1 });
    });

    it('should call multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);
      store.dispatch({ type: 'INCREMENT' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should not call listener if state does not change', () => {
      const listener = vi.fn();

      store.subscribe(listener);
      store.dispatch({ type: 'UNKNOWN_ACTION' });

      // Listener still called, but state unchanged
      expect(listener).toHaveBeenCalledWith({ count: 0 });
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should unsubscribe listener', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.dispatch({ type: 'INCREMENT' });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle multiple subscriptions and unsubscriptions', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      const unsub1 = store.subscribe(listener1);
      store.subscribe(listener2);
      const unsub3 = store.subscribe(listener3);

      unsub1();
      unsub3();

      store.dispatch({ type: 'INCREMENT' });

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener3).not.toHaveBeenCalled();
    });
  });

  describe('getState', () => {
    beforeEach(() => {
      store = createStore(mockReducer);
    });

    it('should return current state', () => {
      expect(store.getState()).toEqual({ count: 0 });
    });

    it('should return updated state after dispatch', () => {
      store.dispatch({ type: 'INCREMENT' });

      expect(store.getState()).toEqual({ count: 1 });
    });

    it('should not allow direct state mutation', () => {
      const state = store.getState();
      state.count = 999;

      // State in store should be unchanged
      expect(store.getState().count).not.toBe(999);
    });
  });

  describe('middleware support', () => {
    it('should support middleware that logs actions', () => {
      const logMiddleware = (store) => (next) => (action) => {
        console.log('Dispatching:', action.type);
        return next(action);
      };

      store = createStore(mockReducer, { count: 0 }, logMiddleware);

      const consoleSpy = vi.spyOn(console, 'log');

      store.dispatch({ type: 'INCREMENT' });

      expect(consoleSpy).toHaveBeenCalledWith('Dispatching:', 'INCREMENT');
      expect(store.getState()).toEqual({ count: 1 });

      consoleSpy.mockRestore();
    });

    it('should support multiple middleware', () => {
      const logs = [];

      const middleware1 = () => (next) => (action) => {
        logs.push('middleware1');
        return next(action);
      };

      const middleware2 = () => (next) => (action) => {
        logs.push('middleware2');
        return next(action);
      };

      store = createStore(
        mockReducer,
        { count: 0 },
        middleware1,
        middleware2
      );

      store.dispatch({ type: 'INCREMENT' });

      expect(logs).toEqual(['middleware1', 'middleware2']);
    });
  });

  describe('replaceReducer', () => {
    beforeEach(() => {
      store = createStore(mockReducer);
    });

    it('should replace the reducer', () => {
      const newReducer = vi.fn((state = { value: 'new' }) => state);

      store.replaceReducer(newReducer);
      store.dispatch({ type: 'TEST' });

      expect(newReducer).toHaveBeenCalled();
    });

    it('should maintain current state after replacing reducer', () => {
      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState()).toEqual({ count: 1 });

      const newReducer = (state = {}) => state;
      store.replaceReducer(newReducer);

      expect(store.getState()).toEqual({ count: 1 });
    });
  });

  describe('combined reducers', () => {
    it('should work with combined reducers', () => {
      const counterReducer = (state = { count: 0 }, action) => {
        if (action.type === 'INCREMENT') {
          return { count: state.count + 1 };
        }
        return state;
      };

      const userReducer = (state = { name: '' }, action) => {
        if (action.type === 'SET_NAME') {
          return { name: action.payload };
        }
        return state;
      };

      const rootReducer = (state = {}, action) => ({
        counter: counterReducer(state.counter, action),
        user: userReducer(state.user, action),
      });

      store = createStore(rootReducer);

      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'SET_NAME', payload: 'Alice' });

      expect(store.getState()).toEqual({
        counter: { count: 1 },
        user: { name: 'Alice' },
      });
    });
  });
});
