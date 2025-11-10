/**
 * UI State Reducer
 *
 * Manages the user interface state including:
 * - Menu visibility and state
 * - Modal dialogs
 * - HUD configuration
 * - Settings
 * - Notifications
 * - Loading states
 *
 * @module state/reducers/uiReducer
 */

import { ActionTypes } from '../actions.js';

/**
 * Initial UI state
 */
const initialState = {
  // Menu state
  currentMenu: 'main', // 'main', 'pause', 'settings', 'gameover', null
  menuVisible: true,

  // Modal state
  currentModal: null, // 'help', 'controls', 'about', null
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
    particleQuality: 'high', // 'low', 'medium', 'high'
    showTrails: true,
    screenShake: true,

    // Gameplay
    controlScheme: 'mouse', // 'mouse', 'keyboard', 'touch'
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

  // Touch controls (for mobile)
  touchControlsVisible: false,

  // Screen dimensions
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  isMobile: window.innerWidth < 768,
};

/**
 * UI reducer function
 *
 * @param {Object} state - Current UI state
 * @param {Object} action - Action to process
 * @returns {Object} New UI state
 */
export function uiReducer(state = initialState, action) {
  switch (action.type) {
    case ActionTypes.SHOW_MENU:
      return {
        ...state,
        currentMenu: action.payload.menu,
        menuVisible: true,
      };

    case ActionTypes.HIDE_MENU:
      return {
        ...state,
        menuVisible: false,
      };

    case ActionTypes.SHOW_MODAL:
      return {
        ...state,
        currentModal: action.payload.modal,
        modalVisible: true,
      };

    case ActionTypes.HIDE_MODAL:
      return {
        ...state,
        currentModal: null,
        modalVisible: false,
      };

    case ActionTypes.TOGGLE_PAUSE_MENU:
      return {
        ...state,
        pauseMenuVisible: !state.pauseMenuVisible,
        currentMenu: !state.pauseMenuVisible ? 'pause' : state.currentMenu,
      };

    case ActionTypes.UPDATE_HUD:
      return {
        ...state,
        hud: {
          ...state.hud,
          ...action.payload.hudData,
        },
      };

    case ActionTypes.UPDATE_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload.settings,
        },
      };

    case ActionTypes.ADD_NOTIFICATION: {
      const notification = {
        id: state.nextNotificationId,
        ...action.payload.notification,
        timestamp: Date.now(),
      };

      return {
        ...state,
        notifications: [...state.notifications, notification],
        nextNotificationId: state.nextNotificationId + 1,
      };
    }

    case ActionTypes.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(
          (n) => n.id !== action.payload.notificationId
        ),
      };

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload.loading,
        loadingMessage: action.payload.message || '',
      };

    case ActionTypes.GAME_START:
      return {
        ...state,
        currentMenu: null,
        menuVisible: false,
        pauseMenuVisible: false,
        hud: {
          ...state.hud,
          visible: true,
        },
        touchControlsVisible: state.isMobile,
      };

    case ActionTypes.GAME_PAUSE:
      return {
        ...state,
        pauseMenuVisible: true,
        currentMenu: 'pause',
      };

    case ActionTypes.GAME_RESUME:
      return {
        ...state,
        pauseMenuVisible: false,
        currentMenu: null,
      };

    case ActionTypes.GAME_OVER:
      return {
        ...state,
        currentMenu: 'gameover',
        menuVisible: true,
        pauseMenuVisible: false,
      };

    case ActionTypes.GAME_RESET:
      return {
        ...state,
        currentMenu: 'main',
        menuVisible: true,
        pauseMenuVisible: false,
        modalVisible: false,
        currentModal: null,
        notifications: [],
      };

    default:
      return state;
  }
}

export default uiReducer;
