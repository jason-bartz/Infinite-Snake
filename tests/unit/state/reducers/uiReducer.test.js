/**
 * Unit Tests for UI Reducer
 *
 * Tests all UI state mutations including:
 * - Menu visibility and navigation
 * - Modal dialogs
 * - HUD configuration
 * - Settings management
 * - Notifications
 * - Loading states
 *
 * @module tests/unit/state/reducers/uiReducer
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uiReducer } from '../../../../src/state/reducers/uiReducer.js';
import { ActionTypes } from '../../../../src/state/actions.js';

describe('uiReducer', () => {
  let initialState;

  beforeEach(() => {
    // Mock window dimensions
    global.window = {
      innerWidth: 1024,
      innerHeight: 768,
    };

    initialState = {
      // Menu state
      currentMenu: 'main',
      menuVisible: true,

      // Modal state
      currentModal: null,
      modalVisible: false,

      // Pause menu
      pauseMenuVisible: false,

      // HUD configuration
      hud: {
        visible: true,
        showScore: true,
        showMinimap: true,
        showFPS: false,
        showDebug: false,
      },

      // Settings
      settings: {
        // Audio
        masterVolume: 1.0,
        musicVolume: 0.7,
        sfxVolume: 0.8,
        audioEnabled: true,

        // Graphics
        particlesEnabled: true,
        particleQuality: 'high',
        showTrails: true,
        screenShake: true,

        // Gameplay
        controlScheme: 'mouse',
        sensitivity: 1.0,
        invertControls: false,

        // Accessibility
        colorBlindMode: false,
        reducedMotion: false,
        highContrast: false,
      },

      // Notifications
      notifications: [],
      nextNotificationId: 0,

      // Loading
      loading: false,
      loadingMessage: '',

      // Touch controls
      touchControlsVisible: false,

      // Screen dimensions
      screenWidth: 1024,
      screenHeight: 768,
      isMobile: false,
    };
  });

  describe('initial state', () => {
    it('should return initial state when state is undefined', () => {
      const state = uiReducer(undefined, { type: '@@INIT' });
      expect(state).toBeDefined();
      expect(state.currentMenu).toBe('main');
      expect(state.menuVisible).toBe(true);
    });

    it('should have correct default menu state', () => {
      const state = uiReducer(undefined, { type: '@@INIT' });
      expect(state.currentMenu).toBe('main');
      expect(state.menuVisible).toBe(true);
      expect(state.pauseMenuVisible).toBe(false);
    });

    it('should have correct default settings', () => {
      const state = uiReducer(undefined, { type: '@@INIT' });
      expect(state.settings.masterVolume).toBe(1.0);
      expect(state.settings.audioEnabled).toBe(true);
      expect(state.settings.controlScheme).toBe('mouse');
    });
  });

  describe('SHOW_MENU', () => {
    it('should show menu and set current menu', () => {
      const state = { ...initialState, menuVisible: false };
      const action = {
        type: ActionTypes.SHOW_MENU,
        payload: { menu: 'settings' },
      };

      const newState = uiReducer(state, action);

      expect(newState.currentMenu).toBe('settings');
      expect(newState.menuVisible).toBe(true);
    });

    it('should change menu when different menu requested', () => {
      const action = {
        type: ActionTypes.SHOW_MENU,
        payload: { menu: 'pause' },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.currentMenu).toBe('pause');
    });
  });

  describe('HIDE_MENU', () => {
    it('should hide menu', () => {
      const action = { type: ActionTypes.HIDE_MENU };
      const newState = uiReducer(initialState, action);

      expect(newState.menuVisible).toBe(false);
    });

    it('should keep currentMenu value when hiding', () => {
      const state = { ...initialState, currentMenu: 'settings' };
      const action = { type: ActionTypes.HIDE_MENU };
      const newState = uiReducer(state, action);

      expect(newState.currentMenu).toBe('settings');
      expect(newState.menuVisible).toBe(false);
    });
  });

  describe('SHOW_MODAL', () => {
    it('should show modal and set current modal', () => {
      const action = {
        type: ActionTypes.SHOW_MODAL,
        payload: { modal: 'help' },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.currentModal).toBe('help');
      expect(newState.modalVisible).toBe(true);
    });

    it('should change modal when different modal requested', () => {
      const state = {
        ...initialState,
        currentModal: 'help',
        modalVisible: true,
      };
      const action = {
        type: ActionTypes.SHOW_MODAL,
        payload: { modal: 'controls' },
      };

      const newState = uiReducer(state, action);

      expect(newState.currentModal).toBe('controls');
      expect(newState.modalVisible).toBe(true);
    });
  });

  describe('HIDE_MODAL', () => {
    it('should hide modal and clear current modal', () => {
      const state = {
        ...initialState,
        currentModal: 'help',
        modalVisible: true,
      };
      const action = { type: ActionTypes.HIDE_MODAL };
      const newState = uiReducer(state, action);

      expect(newState.currentModal).toBe(null);
      expect(newState.modalVisible).toBe(false);
    });
  });

  describe('TOGGLE_PAUSE_MENU', () => {
    it('should show pause menu when hidden', () => {
      const state = { ...initialState, pauseMenuVisible: false };
      const action = { type: ActionTypes.TOGGLE_PAUSE_MENU };
      const newState = uiReducer(state, action);

      expect(newState.pauseMenuVisible).toBe(true);
      expect(newState.currentMenu).toBe('pause');
    });

    it('should hide pause menu when visible', () => {
      const state = { ...initialState, pauseMenuVisible: true };
      const action = { type: ActionTypes.TOGGLE_PAUSE_MENU };
      const newState = uiReducer(state, action);

      expect(newState.pauseMenuVisible).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      let state = initialState;

      // Toggle on
      state = uiReducer(state, { type: ActionTypes.TOGGLE_PAUSE_MENU });
      expect(state.pauseMenuVisible).toBe(true);

      // Toggle off
      state = uiReducer(state, { type: ActionTypes.TOGGLE_PAUSE_MENU });
      expect(state.pauseMenuVisible).toBe(false);

      // Toggle on again
      state = uiReducer(state, { type: ActionTypes.TOGGLE_PAUSE_MENU });
      expect(state.pauseMenuVisible).toBe(true);
    });
  });

  describe('UPDATE_HUD', () => {
    it('should update HUD properties', () => {
      const action = {
        type: ActionTypes.UPDATE_HUD,
        payload: {
          hudData: {
            showFPS: true,
            showDebug: true,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.hud.showFPS).toBe(true);
      expect(newState.hud.showDebug).toBe(true);
    });

    it('should merge HUD properties without overwriting others', () => {
      const action = {
        type: ActionTypes.UPDATE_HUD,
        payload: {
          hudData: {
            showFPS: true,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.hud.showFPS).toBe(true);
      expect(newState.hud.showScore).toBe(true); // Preserved
      expect(newState.hud.showMinimap).toBe(true); // Preserved
    });

    it('should toggle HUD visibility', () => {
      const action = {
        type: ActionTypes.UPDATE_HUD,
        payload: {
          hudData: {
            visible: false,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.hud.visible).toBe(false);
    });
  });

  describe('UPDATE_SETTINGS', () => {
    it('should update audio settings', () => {
      const action = {
        type: ActionTypes.UPDATE_SETTINGS,
        payload: {
          settings: {
            masterVolume: 0.5,
            musicVolume: 0.3,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.settings.masterVolume).toBe(0.5);
      expect(newState.settings.musicVolume).toBe(0.3);
    });

    it('should update graphics settings', () => {
      const action = {
        type: ActionTypes.UPDATE_SETTINGS,
        payload: {
          settings: {
            particleQuality: 'low',
            showTrails: false,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.settings.particleQuality).toBe('low');
      expect(newState.settings.showTrails).toBe(false);
    });

    it('should update gameplay settings', () => {
      const action = {
        type: ActionTypes.UPDATE_SETTINGS,
        payload: {
          settings: {
            controlScheme: 'keyboard',
            sensitivity: 1.5,
            invertControls: true,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.settings.controlScheme).toBe('keyboard');
      expect(newState.settings.sensitivity).toBe(1.5);
      expect(newState.settings.invertControls).toBe(true);
    });

    it('should update accessibility settings', () => {
      const action = {
        type: ActionTypes.UPDATE_SETTINGS,
        payload: {
          settings: {
            colorBlindMode: true,
            reducedMotion: true,
            highContrast: true,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.settings.colorBlindMode).toBe(true);
      expect(newState.settings.reducedMotion).toBe(true);
      expect(newState.settings.highContrast).toBe(true);
    });

    it('should merge settings without overwriting all properties', () => {
      const action = {
        type: ActionTypes.UPDATE_SETTINGS,
        payload: {
          settings: {
            masterVolume: 0.5,
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.settings.masterVolume).toBe(0.5);
      expect(newState.settings.musicVolume).toBe(0.7); // Preserved
      expect(newState.settings.audioEnabled).toBe(true); // Preserved
    });
  });

  describe('ADD_NOTIFICATION', () => {
    it('should add notification to list', () => {
      const action = {
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          notification: {
            message: 'Test notification',
            type: 'info',
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.notifications).toHaveLength(1);
      expect(newState.notifications[0].message).toBe('Test notification');
      expect(newState.notifications[0].type).toBe('info');
    });

    it('should assign unique ID to notification', () => {
      const action = {
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          notification: {
            message: 'Test',
            type: 'info',
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.notifications[0].id).toBe(0);
      expect(newState.nextNotificationId).toBe(1);
    });

    it('should increment notification ID for each notification', () => {
      let state = initialState;

      // Add first notification
      state = uiReducer(state, {
        type: ActionTypes.ADD_NOTIFICATION,
        payload: { notification: { message: 'First' } },
      });

      // Add second notification
      state = uiReducer(state, {
        type: ActionTypes.ADD_NOTIFICATION,
        payload: { notification: { message: 'Second' } },
      });

      expect(state.notifications).toHaveLength(2);
      expect(state.notifications[0].id).toBe(0);
      expect(state.notifications[1].id).toBe(1);
      expect(state.nextNotificationId).toBe(2);
    });

    it('should add timestamp to notification', () => {
      const action = {
        type: ActionTypes.ADD_NOTIFICATION,
        payload: {
          notification: {
            message: 'Test',
            type: 'info',
          },
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.notifications[0].timestamp).toBeDefined();
      expect(typeof newState.notifications[0].timestamp).toBe('number');
    });
  });

  describe('REMOVE_NOTIFICATION', () => {
    it('should remove notification by ID', () => {
      const state = {
        ...initialState,
        notifications: [
          { id: 0, message: 'First', timestamp: Date.now() },
          { id: 1, message: 'Second', timestamp: Date.now() },
        ],
        nextNotificationId: 2,
      };

      const action = {
        type: ActionTypes.REMOVE_NOTIFICATION,
        payload: { notificationId: 0 },
      };

      const newState = uiReducer(state, action);

      expect(newState.notifications).toHaveLength(1);
      expect(newState.notifications[0].id).toBe(1);
      expect(newState.notifications[0].message).toBe('Second');
    });

    it('should handle removing non-existent notification', () => {
      const state = {
        ...initialState,
        notifications: [{ id: 0, message: 'Test', timestamp: Date.now() }],
      };

      const action = {
        type: ActionTypes.REMOVE_NOTIFICATION,
        payload: { notificationId: 999 },
      };

      const newState = uiReducer(state, action);

      expect(newState.notifications).toHaveLength(1);
      expect(newState.notifications[0].id).toBe(0);
    });
  });

  describe('SET_LOADING', () => {
    it('should set loading state to true', () => {
      const action = {
        type: ActionTypes.SET_LOADING,
        payload: {
          loading: true,
          message: 'Loading assets...',
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.loading).toBe(true);
      expect(newState.loadingMessage).toBe('Loading assets...');
    });

    it('should set loading state to false', () => {
      const state = {
        ...initialState,
        loading: true,
        loadingMessage: 'Loading...',
      };
      const action = {
        type: ActionTypes.SET_LOADING,
        payload: {
          loading: false,
        },
      };

      const newState = uiReducer(state, action);

      expect(newState.loading).toBe(false);
      expect(newState.loadingMessage).toBe('');
    });

    it('should handle loading without message', () => {
      const action = {
        type: ActionTypes.SET_LOADING,
        payload: {
          loading: true,
        },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.loading).toBe(true);
      expect(newState.loadingMessage).toBe('');
    });
  });

  describe('GAME_START', () => {
    it('should hide menus and show HUD', () => {
      const action = { type: ActionTypes.GAME_START };
      const newState = uiReducer(initialState, action);

      expect(newState.currentMenu).toBe(null);
      expect(newState.menuVisible).toBe(false);
      expect(newState.pauseMenuVisible).toBe(false);
      expect(newState.hud.visible).toBe(true);
    });

    it('should show touch controls on mobile', () => {
      const mobileState = {
        ...initialState,
        isMobile: true,
      };
      const action = { type: ActionTypes.GAME_START };
      const newState = uiReducer(mobileState, action);

      expect(newState.touchControlsVisible).toBe(true);
    });

    it('should not show touch controls on desktop', () => {
      const action = { type: ActionTypes.GAME_START };
      const newState = uiReducer(initialState, action);

      expect(newState.touchControlsVisible).toBe(false);
    });
  });

  describe('GAME_PAUSE', () => {
    it('should show pause menu', () => {
      const action = { type: ActionTypes.GAME_PAUSE };
      const newState = uiReducer(initialState, action);

      expect(newState.pauseMenuVisible).toBe(true);
      expect(newState.currentMenu).toBe('pause');
    });
  });

  describe('GAME_RESUME', () => {
    it('should hide pause menu', () => {
      const state = {
        ...initialState,
        pauseMenuVisible: true,
        currentMenu: 'pause',
      };
      const action = { type: ActionTypes.GAME_RESUME };
      const newState = uiReducer(state, action);

      expect(newState.pauseMenuVisible).toBe(false);
      expect(newState.currentMenu).toBe(null);
    });
  });

  describe('GAME_OVER', () => {
    it('should show game over menu', () => {
      const action = { type: ActionTypes.GAME_OVER };
      const newState = uiReducer(initialState, action);

      expect(newState.currentMenu).toBe('gameover');
      expect(newState.menuVisible).toBe(true);
      expect(newState.pauseMenuVisible).toBe(false);
    });
  });

  describe('GAME_RESET', () => {
    it('should reset to main menu', () => {
      const modifiedState = {
        ...initialState,
        currentMenu: 'gameover',
        pauseMenuVisible: true,
        modalVisible: true,
        currentModal: 'help',
        notifications: [{ id: 0, message: 'Test', timestamp: Date.now() }],
      };

      const action = { type: ActionTypes.GAME_RESET };
      const newState = uiReducer(modifiedState, action);

      expect(newState.currentMenu).toBe('main');
      expect(newState.menuVisible).toBe(true);
      expect(newState.pauseMenuVisible).toBe(false);
      expect(newState.modalVisible).toBe(false);
      expect(newState.currentModal).toBe(null);
      expect(newState.notifications).toEqual([]);
    });

    it('should preserve settings on reset', () => {
      const modifiedState = {
        ...initialState,
        settings: {
          ...initialState.settings,
          masterVolume: 0.5,
          colorBlindMode: true,
        },
      };

      const action = { type: ActionTypes.GAME_RESET };
      const newState = uiReducer(modifiedState, action);

      expect(newState.settings.masterVolume).toBe(0.5);
      expect(newState.settings.colorBlindMode).toBe(true);
    });
  });

  describe('unknown action', () => {
    it('should return current state for unknown action types', () => {
      const action = { type: 'UNKNOWN_ACTION' };
      const newState = uiReducer(initialState, action);

      expect(newState).toBe(initialState);
    });
  });

  describe('state immutability', () => {
    it('should not mutate original state', () => {
      const originalState = { ...initialState };
      const action = {
        type: ActionTypes.SHOW_MENU,
        payload: { menu: 'settings' },
      };

      const newState = uiReducer(initialState, action);

      expect(initialState).toEqual(originalState);
      expect(newState).not.toBe(initialState);
    });

    it('should not mutate nested HUD object', () => {
      const originalHud = { ...initialState.hud };
      const action = {
        type: ActionTypes.UPDATE_HUD,
        payload: { hudData: { showFPS: true } },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.hud).not.toBe(initialState.hud);
      expect(initialState.hud).toEqual(originalHud);
    });

    it('should not mutate nested settings object', () => {
      const originalSettings = { ...initialState.settings };
      const action = {
        type: ActionTypes.UPDATE_SETTINGS,
        payload: { settings: { masterVolume: 0.5 } },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.settings).not.toBe(initialState.settings);
      expect(initialState.settings).toEqual(originalSettings);
    });

    it('should not mutate notifications array', () => {
      const originalNotifications = [...initialState.notifications];
      const action = {
        type: ActionTypes.ADD_NOTIFICATION,
        payload: { notification: { message: 'Test' } },
      };

      const newState = uiReducer(initialState, action);

      expect(newState.notifications).not.toBe(initialState.notifications);
      expect(initialState.notifications).toEqual(originalNotifications);
    });
  });
});
