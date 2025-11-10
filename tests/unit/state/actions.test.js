import { describe, it, expect } from 'vitest';
import {
  ActionTypes,
  gameActions,
  playerActions,
  uiActions,
} from '../../../src/state/actions.js';

describe('Action Types', () => {
  describe('Game Action Types', () => {
    it('should define GAME_START', () => {
      expect(ActionTypes.GAME_START).toBe('GAME_START');
    });

    it('should define GAME_PAUSE', () => {
      expect(ActionTypes.GAME_PAUSE).toBe('GAME_PAUSE');
    });

    it('should define GAME_RESUME', () => {
      expect(ActionTypes.GAME_RESUME).toBe('GAME_RESUME');
    });

    it('should define GAME_OVER', () => {
      expect(ActionTypes.GAME_OVER).toBe('GAME_OVER');
    });

    it('should define GAME_RESET', () => {
      expect(ActionTypes.GAME_RESET).toBe('GAME_RESET');
    });

    it('should define SET_GAME_MODE', () => {
      expect(ActionTypes.SET_GAME_MODE).toBe('SET_GAME_MODE');
    });

    it('should define UPDATE_SCORE', () => {
      expect(ActionTypes.UPDATE_SCORE).toBe('UPDATE_SCORE');
    });

    it('should define UPDATE_HIGH_SCORE', () => {
      expect(ActionTypes.UPDATE_HIGH_SCORE).toBe('UPDATE_HIGH_SCORE');
    });

    it('should define SPAWN_ELEMENT', () => {
      expect(ActionTypes.SPAWN_ELEMENT).toBe('SPAWN_ELEMENT');
    });

    it('should define REMOVE_ELEMENT', () => {
      expect(ActionTypes.REMOVE_ELEMENT).toBe('REMOVE_ELEMENT');
    });

    it('should define ADD_AI_SNAKE', () => {
      expect(ActionTypes.ADD_AI_SNAKE).toBe('ADD_AI_SNAKE');
    });

    it('should define REMOVE_AI_SNAKE', () => {
      expect(ActionTypes.REMOVE_AI_SNAKE).toBe('REMOVE_AI_SNAKE');
    });
  });

  describe('Player Action Types', () => {
    it('should define PLAYER_MOVE', () => {
      expect(ActionTypes.PLAYER_MOVE).toBe('PLAYER_MOVE');
    });

    it('should define PLAYER_BOOST_START', () => {
      expect(ActionTypes.PLAYER_BOOST_START).toBe('PLAYER_BOOST_START');
    });

    it('should define PLAYER_BOOST_END', () => {
      expect(ActionTypes.PLAYER_BOOST_END).toBe('PLAYER_BOOST_END');
    });

    it('should define PLAYER_COLLECT_ELEMENT', () => {
      expect(ActionTypes.PLAYER_COLLECT_ELEMENT).toBe('PLAYER_COLLECT_ELEMENT');
    });

    it('should define PLAYER_GROW', () => {
      expect(ActionTypes.PLAYER_GROW).toBe('PLAYER_GROW');
    });

    it('should define PLAYER_DIE', () => {
      expect(ActionTypes.PLAYER_DIE).toBe('PLAYER_DIE');
    });

    it('should define PLAYER_RESPAWN', () => {
      expect(ActionTypes.PLAYER_RESPAWN).toBe('PLAYER_RESPAWN');
    });

    it('should define UPDATE_PLAYER_STATS', () => {
      expect(ActionTypes.UPDATE_PLAYER_STATS).toBe('UPDATE_PLAYER_STATS');
    });

    it('should define UPDATE_INVENTORY', () => {
      expect(ActionTypes.UPDATE_INVENTORY).toBe('UPDATE_INVENTORY');
    });
  });

  describe('UI Action Types', () => {
    it('should define SHOW_MENU', () => {
      expect(ActionTypes.SHOW_MENU).toBe('SHOW_MENU');
    });

    it('should define HIDE_MENU', () => {
      expect(ActionTypes.HIDE_MENU).toBe('HIDE_MENU');
    });

    it('should define SHOW_MODAL', () => {
      expect(ActionTypes.SHOW_MODAL).toBe('SHOW_MODAL');
    });

    it('should define HIDE_MODAL', () => {
      expect(ActionTypes.HIDE_MODAL).toBe('HIDE_MODAL');
    });

    it('should define UPDATE_HUD', () => {
      expect(ActionTypes.UPDATE_HUD).toBe('UPDATE_HUD');
    });

    it('should define TOGGLE_PAUSE_MENU', () => {
      expect(ActionTypes.TOGGLE_PAUSE_MENU).toBe('TOGGLE_PAUSE_MENU');
    });

    it('should define UPDATE_SETTINGS', () => {
      expect(ActionTypes.UPDATE_SETTINGS).toBe('UPDATE_SETTINGS');
    });

    it('should define ADD_NOTIFICATION', () => {
      expect(ActionTypes.ADD_NOTIFICATION).toBe('ADD_NOTIFICATION');
    });

    it('should define REMOVE_NOTIFICATION', () => {
      expect(ActionTypes.REMOVE_NOTIFICATION).toBe('REMOVE_NOTIFICATION');
    });

    it('should define SET_LOADING', () => {
      expect(ActionTypes.SET_LOADING).toBe('SET_LOADING');
    });
  });
});

describe('Game Action Creators', () => {
  describe('startGame', () => {
    it('should create GAME_START action with mode', () => {
      const action = gameActions.startGame('infinite');

      expect(action).toEqual({
        type: ActionTypes.GAME_START,
        payload: { mode: 'infinite' },
      });
    });

    it('should work with classic mode', () => {
      const action = gameActions.startGame('classic');

      expect(action.payload.mode).toBe('classic');
    });
  });

  describe('pauseGame', () => {
    it('should create GAME_PAUSE action', () => {
      const action = gameActions.pauseGame();

      expect(action).toEqual({
        type: ActionTypes.GAME_PAUSE,
      });
    });
  });

  describe('resumeGame', () => {
    it('should create GAME_RESUME action', () => {
      const action = gameActions.resumeGame();

      expect(action).toEqual({
        type: ActionTypes.GAME_RESUME,
      });
    });
  });

  describe('gameOver', () => {
    it('should create GAME_OVER action with final score', () => {
      const action = gameActions.gameOver(1500);

      expect(action).toEqual({
        type: ActionTypes.GAME_OVER,
        payload: { finalScore: 1500 },
      });
    });
  });

  describe('resetGame', () => {
    it('should create GAME_RESET action', () => {
      const action = gameActions.resetGame();

      expect(action).toEqual({
        type: ActionTypes.GAME_RESET,
      });
    });
  });

  describe('updateScore', () => {
    it('should create UPDATE_SCORE action with points', () => {
      const action = gameActions.updateScore(100);

      expect(action).toEqual({
        type: ActionTypes.UPDATE_SCORE,
        payload: { points: 100 },
      });
    });

    it('should work with negative points', () => {
      const action = gameActions.updateScore(-50);

      expect(action.payload.points).toBe(-50);
    });
  });

  describe('updateHighScore', () => {
    it('should create UPDATE_HIGH_SCORE action', () => {
      const action = gameActions.updateHighScore(5000);

      expect(action).toEqual({
        type: ActionTypes.UPDATE_HIGH_SCORE,
        payload: { score: 5000 },
      });
    });
  });

  describe('spawnElement', () => {
    it('should create SPAWN_ELEMENT action with element data', () => {
      const element = { id: '1', type: 'fire', x: 100, y: 200 };
      const action = gameActions.spawnElement(element);

      expect(action).toEqual({
        type: ActionTypes.SPAWN_ELEMENT,
        payload: { element },
      });
    });
  });

  describe('removeElement', () => {
    it('should create REMOVE_ELEMENT action with element ID', () => {
      const action = gameActions.removeElement('element-123');

      expect(action).toEqual({
        type: ActionTypes.REMOVE_ELEMENT,
        payload: { elementId: 'element-123' },
      });
    });
  });

  describe('addAISnake', () => {
    it('should create ADD_AI_SNAKE action with snake data', () => {
      const snake = { id: 'ai-1', x: 500, y: 500 };
      const action = gameActions.addAISnake(snake);

      expect(action).toEqual({
        type: ActionTypes.ADD_AI_SNAKE,
        payload: { snake },
      });
    });
  });

  describe('removeAISnake', () => {
    it('should create REMOVE_AI_SNAKE action with snake ID', () => {
      const action = gameActions.removeAISnake('ai-1');

      expect(action).toEqual({
        type: ActionTypes.REMOVE_AI_SNAKE,
        payload: { snakeId: 'ai-1' },
      });
    });
  });
});

describe('Player Action Creators', () => {
  describe('movePlayer', () => {
    it('should create PLAYER_MOVE action with position and angle', () => {
      const action = playerActions.movePlayer(100, 200, Math.PI);

      expect(action).toEqual({
        type: ActionTypes.PLAYER_MOVE,
        payload: { x: 100, y: 200, angle: Math.PI },
      });
    });
  });

  describe('startBoost', () => {
    it('should create PLAYER_BOOST_START action', () => {
      const action = playerActions.startBoost();

      expect(action).toEqual({
        type: ActionTypes.PLAYER_BOOST_START,
      });
    });
  });

  describe('endBoost', () => {
    it('should create PLAYER_BOOST_END action', () => {
      const action = playerActions.endBoost();

      expect(action).toEqual({
        type: ActionTypes.PLAYER_BOOST_END,
      });
    });
  });

  describe('collectElement', () => {
    it('should create PLAYER_COLLECT_ELEMENT action with element data', () => {
      const element = { id: '1', type: 'fire', tier: 1 };
      const action = playerActions.collectElement(element);

      expect(action).toEqual({
        type: ActionTypes.PLAYER_COLLECT_ELEMENT,
        payload: { element },
      });
    });
  });

  describe('growPlayer', () => {
    it('should create PLAYER_GROW action with segments', () => {
      const action = playerActions.growPlayer(5);

      expect(action).toEqual({
        type: ActionTypes.PLAYER_GROW,
        payload: { segments: 5 },
      });
    });
  });

  describe('playerDie', () => {
    it('should create PLAYER_DIE action with cause', () => {
      const action = playerActions.playerDie('collision');

      expect(action).toEqual({
        type: ActionTypes.PLAYER_DIE,
        payload: { cause: 'collision' },
      });
    });
  });

  describe('respawnPlayer', () => {
    it('should create PLAYER_RESPAWN action with position', () => {
      const action = playerActions.respawnPlayer(500, 500);

      expect(action).toEqual({
        type: ActionTypes.PLAYER_RESPAWN,
        payload: { x: 500, y: 500 },
      });
    });
  });

  describe('updatePlayerStats', () => {
    it('should create UPDATE_PLAYER_STATS action with stats', () => {
      const stats = { elementsCollected: 10, distanceTraveled: 1000 };
      const action = playerActions.updatePlayerStats(stats);

      expect(action).toEqual({
        type: ActionTypes.UPDATE_PLAYER_STATS,
        payload: { stats },
      });
    });
  });

  describe('updateInventory', () => {
    it('should create UPDATE_INVENTORY action with inventory data', () => {
      const inventory = { fire: 5, water: 3 };
      const action = playerActions.updateInventory(inventory);

      expect(action).toEqual({
        type: ActionTypes.UPDATE_INVENTORY,
        payload: { inventory },
      });
    });
  });
});

describe('UI Action Creators', () => {
  describe('showMenu', () => {
    it('should create SHOW_MENU action with menu name', () => {
      const action = uiActions.showMenu('pause');

      expect(action).toEqual({
        type: ActionTypes.SHOW_MENU,
        payload: { menu: 'pause' },
      });
    });
  });

  describe('hideMenu', () => {
    it('should create HIDE_MENU action', () => {
      const action = uiActions.hideMenu();

      expect(action).toEqual({
        type: ActionTypes.HIDE_MENU,
      });
    });
  });

  describe('showModal', () => {
    it('should create SHOW_MODAL action with modal name', () => {
      const action = uiActions.showModal('help');

      expect(action).toEqual({
        type: ActionTypes.SHOW_MODAL,
        payload: { modal: 'help' },
      });
    });
  });

  describe('hideModal', () => {
    it('should create HIDE_MODAL action', () => {
      const action = uiActions.hideModal();

      expect(action).toEqual({
        type: ActionTypes.HIDE_MODAL,
      });
    });
  });

  describe('updateHUD', () => {
    it('should create UPDATE_HUD action with HUD data', () => {
      const hudData = { visible: true, showMinimap: false };
      const action = uiActions.updateHUD(hudData);

      expect(action).toEqual({
        type: ActionTypes.UPDATE_HUD,
        payload: { hudData },
      });
    });
  });

  describe('togglePauseMenu', () => {
    it('should create TOGGLE_PAUSE_MENU action', () => {
      const action = uiActions.togglePauseMenu();

      expect(action).toEqual({
        type: ActionTypes.TOGGLE_PAUSE_MENU,
      });
    });
  });

  describe('updateSettings', () => {
    it('should create UPDATE_SETTINGS action with settings', () => {
      const settings = { musicVolume: 75, sfxVolume: 80 };
      const action = uiActions.updateSettings(settings);

      expect(action).toEqual({
        type: ActionTypes.UPDATE_SETTINGS,
        payload: { settings },
      });
    });
  });

  describe('addNotification', () => {
    it('should create ADD_NOTIFICATION action with notification data', () => {
      const notification = { id: '1', message: 'Test', type: 'info' };
      const action = uiActions.addNotification(notification);

      expect(action).toEqual({
        type: ActionTypes.ADD_NOTIFICATION,
        payload: { notification },
      });
    });
  });

  describe('removeNotification', () => {
    it('should create REMOVE_NOTIFICATION action with notification ID', () => {
      const action = uiActions.removeNotification('notif-123');

      expect(action).toEqual({
        type: ActionTypes.REMOVE_NOTIFICATION,
        payload: { notificationId: 'notif-123' },
      });
    });
  });

  describe('setLoading', () => {
    it('should create SET_LOADING action with loading state', () => {
      const action = uiActions.setLoading(true);

      expect(action).toEqual({
        type: ActionTypes.SET_LOADING,
        payload: { loading: true },
      });
    });

    it('should work with false', () => {
      const action = uiActions.setLoading(false);

      expect(action.payload.loading).toBe(false);
    });
  });
});
