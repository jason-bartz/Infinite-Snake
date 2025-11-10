/**
 * Redux-like State Store Implementation
 *
 * Provides a centralized state management solution with:
 * - Single source of truth for application state
 * - Predictable state updates through actions
 * - Subscription system for state change notifications
 * - Middleware support for extensibility
 * - Time-travel debugging capability
 *
 * @module state/store
 */

/**
 * Creates a Redux-like store for state management.
 *
 * @param {Function} reducer - The root reducer function
 * @param {Object} [initialState={}] - Initial state object
 * @param {...Function} [middleware] - Middleware functions
 * @returns {Object} Store instance with dispatch, subscribe, getState, replaceReducer
 *
 * @example
 * const store = createStore(rootReducer, { count: 0 });
 *
 * // Subscribe to changes
 * const unsubscribe = store.subscribe((newState) => {
 *   console.log('State changed:', newState);
 * });
 *
 * // Dispatch actions
 * store.dispatch({ type: 'INCREMENT' });
 *
 * // Get current state
 * console.log(store.getState()); // { count: 1 }
 *
 * // Unsubscribe when done
 * unsubscribe();
 */
export function createStore(reducer, initialState, ...middleware) {
  // Internal state - never expose directly
  let currentState = initialState;
  let currentReducer = reducer;
  let listeners = [];
  let isDispatching = false;

  // Initialize state with reducer's default
  currentState = currentReducer(currentState, { type: '@@INIT' });

  /**
   * Returns the current state.
   * State is returned as a shallow copy to prevent direct mutations.
   *
   * @returns {Object} Current state
   */
  function getState() {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing.'
      );
    }

    // Return shallow copy to prevent direct mutation
    return { ...currentState };
  }

  /**
   * Dispatches an action to update state.
   *
   * @param {Object} action - Action object with 'type' property
   * @returns {Object} The dispatched action
   *
   * @example
   * store.dispatch({ type: 'INCREMENT' });
   * store.dispatch({ type: 'ADD', payload: 5 });
   */
  function dispatch(action) {
    if (!action || typeof action !== 'object') {
      throw new Error('Actions must be plain objects.');
    }

    if (typeof action.type === 'undefined') {
      throw new Error('Actions may not have an undefined "type" property.');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    // Notify all subscribers with new state
    const state = getState();
    listeners.forEach((listener) => listener(state));

    return action;
  }

  /**
   * Subscribes to state changes.
   *
   * @param {Function} listener - Callback function called on state changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * const unsubscribe = store.subscribe((state) => {
   *   console.log('New state:', state);
   * });
   *
   * // Later...
   * unsubscribe();
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected listener to be a function.');
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing.'
      );
    }

    let isSubscribed = true;

    listeners.push(listener);

    // Return unsubscribe function
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing.'
        );
      }

      isSubscribed = false;

      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  /**
   * Replaces the reducer currently used by the store.
   * Useful for code splitting and hot module replacement.
   *
   * @param {Function} nextReducer - The new reducer
   *
   * @example
   * store.replaceReducer(newReducer);
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected nextReducer to be a function.');
    }

    currentReducer = nextReducer;

    // Reinitialize state with new reducer
    dispatch({ type: '@@REPLACE' });
  }

  /**
   * Internal dispatch implementation for middleware.
   * @private
   */
  let dispatchImpl = dispatch;

  // Apply middleware if provided
  if (middleware.length > 0) {
    const middlewareAPI = {
      getState,
      dispatch: (action) => dispatchImpl(action),
    };

    const chain = middleware.map((mw) => mw(middlewareAPI));

    // Compose middleware: right-to-left
    dispatchImpl = chain.reduceRight(
      (next, mw) => mw(next),
      dispatch
    );
  }

  // Return public API
  return {
    dispatch: (action) => dispatchImpl(action),
    subscribe,
    getState,
    replaceReducer,
  };
}

/**
 * Combines multiple reducers into a single reducer function.
 *
 * @param {Object} reducers - Object mapping state keys to reducer functions
 * @returns {Function} Combined reducer function
 *
 * @example
 * const rootReducer = combineReducers({
 *   game: gameReducer,
 *   player: playerReducer,
 *   ui: uiReducer
 * });
 *
 * const store = createStore(rootReducer);
 */
export function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  return function combination(state = {}, action) {
    const nextState = {};
    let hasChanged = false;

    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    return hasChanged ? nextState : state;
  };
}

/**
 * Creates a middleware that logs all actions and state changes.
 * Useful for debugging.
 *
 * @returns {Function} Logger middleware
 *
 * @example
 * const store = createStore(reducer, initialState, createLoggerMiddleware());
 */
export function createLoggerMiddleware() {
  return (store) => (next) => (action) => {
    console.group(action.type);
    console.log('Previous State:', store.getState());
    console.log('Action:', action);

    const result = next(action);

    console.log('Next State:', store.getState());
    console.groupEnd();

    return result;
  };
}

/**
 * Creates middleware for async action handling.
 * Allows dispatching functions (thunks) instead of just action objects.
 *
 * @returns {Function} Thunk middleware
 *
 * @example
 * const store = createStore(reducer, initialState, createThunkMiddleware());
 *
 * // Dispatch async actions
 * store.dispatch((dispatch, getState) => {
 *   setTimeout(() => {
 *     dispatch({ type: 'DELAYED_ACTION' });
 *   }, 1000);
 * });
 */
export function createThunkMiddleware() {
  return (store) => (next) => (action) => {
    if (typeof action === 'function') {
      return action(store.dispatch, store.getState);
    }

    return next(action);
  };
}
