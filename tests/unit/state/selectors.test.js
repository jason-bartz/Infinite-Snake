/**
 * Unit Tests for State Selectors
 *
 * Tests all selector functions for:
 * - Game selectors
 * - Player selectors
 * - UI selectors
 * - Composite selectors
 *
 * @module tests/unit/state/selectors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  selectors,
  gameSelectors,
  playerSelectors,
  uiSelectors,
  compositeSelectors,
} from '../../../src/state/selectors.js';

describe('Selectors', () => {
  let mockState;

  beforeEach(() => {
    mockState = {
      game: {
        status: 'playing',
        mode: 'infinite',
        score: 1000,
        highScore: 5000,
        finalScore: 0,
        elements: [
          { id: 1, type: 'fire', x: 100, y: 100 },
          { id: 2, type: 'water', x: 200, y: 200 },
        ],
        elementCount: 2,
        aiSnakes: [
          { id: 1, x: 300, y: 300 },
          { id: 2, x: 400, y: 400 },
        ],
        aiSnakeCount: 2,
        stats: {
          elementsCollected: 50,
          timeElapsed: 120,
        },
      },
      player: {
        x: 500,
        y: 600,
        angle: Math.PI / 4,
        speed: 5,
        isBoosting: false,
        length: 25,
        segments: [
          { x: 500, y: 600 },
          { x: 495, y: 600 },
        ],
        isAlive: true,
        deathCause: null,
        lives: 3,
        inventory: {
          elements: {
            fire: 5,
            water: 3,
          },
          totalElements: 8,
        },
        stats: {
          totalDistance: 1000,
          totalBoosts: 10,
          longestSnake: 50,
          elementsEaten: 20,
        },
      },
      ui: {
        currentMenu: null,
        menuVisible: false,
        currentModal: null,
        modalVisible: false,
        pauseMenuVisible: false,
        hud: {
          visible: true,
          showScore: true,
          showMinimap: true,
          showFPS: false,
          showDebug: false,
        },
        settings: {
          masterVolume: 1.0,
          musicVolume: 0.7,
          sfxVolume: 0.8,
          audioEnabled: true,
          particlesEnabled: true,
          particleQuality: 'high',
          showTrails: true,
          screenShake: true,
          controlScheme: 'mouse',
          sensitivity: 1.0,
          invertControls: false,
          colorBlindMode: false,
          reducedMotion: false,
          highContrast: false,
        },
        notifications: [
          { id: 0, message: 'Test notification', type: 'info' },
        ],
        loading: false,
        loadingMessage: '',
        isMobile: false,
        screenWidth: 1024,
        screenHeight: 768,
      },
    };
  });

  describe('Game Selectors', () => {
    describe('getStatus', () => {
      it('should return game status', () => {
        expect(gameSelectors.getStatus(mockState)).toBe('playing');
      });

      it('should return different statuses', () => {
        mockState.game.status = 'paused';
        expect(gameSelectors.getStatus(mockState)).toBe('paused');

        mockState.game.status = 'gameover';
        expect(gameSelectors.getStatus(mockState)).toBe('gameover');
      });
    });

    describe('getMode', () => {
      it('should return game mode', () => {
        expect(gameSelectors.getMode(mockState)).toBe('infinite');
      });

      it('should return null if no mode', () => {
        mockState.game.mode = null;
        expect(gameSelectors.getMode(mockState)).toBe(null);
      });
    });

    describe('getScore', () => {
      it('should return current score', () => {
        expect(gameSelectors.getScore(mockState)).toBe(1000);
      });

      it('should return 0 for new game', () => {
        mockState.game.score = 0;
        expect(gameSelectors.getScore(mockState)).toBe(0);
      });
    });

    describe('getHighScore', () => {
      it('should return high score', () => {
        expect(gameSelectors.getHighScore(mockState)).toBe(5000);
      });
    });

    describe('getFinalScore', () => {
      it('should return final score', () => {
        mockState.game.finalScore = 1500;
        expect(gameSelectors.getFinalScore(mockState)).toBe(1500);
      });
    });

    describe('isPlaying', () => {
      it('should return true when status is playing', () => {
        mockState.game.status = 'playing';
        expect(gameSelectors.isPlaying(mockState)).toBe(true);
      });

      it('should return false when status is not playing', () => {
        mockState.game.status = 'paused';
        expect(gameSelectors.isPlaying(mockState)).toBe(false);

        mockState.game.status = 'menu';
        expect(gameSelectors.isPlaying(mockState)).toBe(false);
      });
    });

    describe('isPaused', () => {
      it('should return true when status is paused', () => {
        mockState.game.status = 'paused';
        expect(gameSelectors.isPaused(mockState)).toBe(true);
      });

      it('should return false when status is not paused', () => {
        mockState.game.status = 'playing';
        expect(gameSelectors.isPaused(mockState)).toBe(false);
      });
    });

    describe('isGameOver', () => {
      it('should return true when status is gameover', () => {
        mockState.game.status = 'gameover';
        expect(gameSelectors.isGameOver(mockState)).toBe(true);
      });

      it('should return false when status is not gameover', () => {
        mockState.game.status = 'playing';
        expect(gameSelectors.isGameOver(mockState)).toBe(false);
      });
    });

    describe('getElements', () => {
      it('should return all elements', () => {
        const elements = gameSelectors.getElements(mockState);
        expect(elements).toHaveLength(2);
        expect(elements[0].type).toBe('fire');
        expect(elements[1].type).toBe('water');
      });

      it('should return empty array when no elements', () => {
        mockState.game.elements = [];
        expect(gameSelectors.getElements(mockState)).toEqual([]);
      });
    });

    describe('getElementCount', () => {
      it('should return element count', () => {
        expect(gameSelectors.getElementCount(mockState)).toBe(2);
      });
    });

    describe('getAISnakes', () => {
      it('should return all AI snakes', () => {
        const snakes = gameSelectors.getAISnakes(mockState);
        expect(snakes).toHaveLength(2);
        expect(snakes[0].id).toBe(1);
        expect(snakes[1].id).toBe(2);
      });
    });

    describe('getAISnakeCount', () => {
      it('should return AI snake count', () => {
        expect(gameSelectors.getAISnakeCount(mockState)).toBe(2);
      });
    });

    describe('getGameStats', () => {
      it('should return game statistics', () => {
        const stats = gameSelectors.getGameStats(mockState);
        expect(stats.elementsCollected).toBe(50);
        expect(stats.timeElapsed).toBe(120);
      });
    });
  });

  describe('Player Selectors', () => {
    describe('getPosition', () => {
      it('should return player position', () => {
        const pos = playerSelectors.getPosition(mockState);
        expect(pos.x).toBe(500);
        expect(pos.y).toBe(600);
        expect(pos.angle).toBe(Math.PI / 4);
      });

      it('should return new object each time', () => {
        const pos1 = playerSelectors.getPosition(mockState);
        const pos2 = playerSelectors.getPosition(mockState);
        expect(pos1).not.toBe(pos2);
        expect(pos1).toEqual(pos2);
      });
    });

    describe('getX', () => {
      it('should return X coordinate', () => {
        expect(playerSelectors.getX(mockState)).toBe(500);
      });
    });

    describe('getY', () => {
      it('should return Y coordinate', () => {
        expect(playerSelectors.getY(mockState)).toBe(600);
      });
    });

    describe('getAngle', () => {
      it('should return player angle', () => {
        expect(playerSelectors.getAngle(mockState)).toBe(Math.PI / 4);
      });
    });

    describe('isBoosting', () => {
      it('should return boosting state', () => {
        expect(playerSelectors.isBoosting(mockState)).toBe(false);

        mockState.player.isBoosting = true;
        expect(playerSelectors.isBoosting(mockState)).toBe(true);
      });
    });

    describe('getLength', () => {
      it('should return player length', () => {
        expect(playerSelectors.getLength(mockState)).toBe(25);
      });
    });

    describe('getSegments', () => {
      it('should return player segments', () => {
        const segments = playerSelectors.getSegments(mockState);
        expect(segments).toHaveLength(2);
        expect(segments[0].x).toBe(500);
      });
    });

    describe('isAlive', () => {
      it('should return alive status', () => {
        expect(playerSelectors.isAlive(mockState)).toBe(true);

        mockState.player.isAlive = false;
        expect(playerSelectors.isAlive(mockState)).toBe(false);
      });
    });

    describe('getDeathCause', () => {
      it('should return death cause', () => {
        expect(playerSelectors.getDeathCause(mockState)).toBe(null);

        mockState.player.deathCause = 'collision';
        expect(playerSelectors.getDeathCause(mockState)).toBe('collision');
      });
    });

    describe('getLives', () => {
      it('should return remaining lives', () => {
        expect(playerSelectors.getLives(mockState)).toBe(3);
      });
    });

    describe('getInventory', () => {
      it('should return inventory object', () => {
        const inventory = playerSelectors.getInventory(mockState);
        expect(inventory.totalElements).toBe(8);
        expect(inventory.elements.fire).toBe(5);
        expect(inventory.elements.water).toBe(3);
      });
    });

    describe('getTotalElements', () => {
      it('should return total elements in inventory', () => {
        expect(playerSelectors.getTotalElements(mockState)).toBe(8);
      });
    });

    describe('getPlayerStats', () => {
      it('should return player statistics', () => {
        const stats = playerSelectors.getPlayerStats(mockState);
        expect(stats.totalDistance).toBe(1000);
        expect(stats.totalBoosts).toBe(10);
        expect(stats.longestSnake).toBe(50);
      });
    });

    describe('getLongestSnake', () => {
      it('should return longest snake length', () => {
        expect(playerSelectors.getLongestSnake(mockState)).toBe(50);
      });
    });
  });

  describe('UI Selectors', () => {
    describe('getCurrentMenu', () => {
      it('should return current menu', () => {
        expect(uiSelectors.getCurrentMenu(mockState)).toBe(null);

        mockState.ui.currentMenu = 'pause';
        expect(uiSelectors.getCurrentMenu(mockState)).toBe('pause');
      });
    });

    describe('isMenuVisible', () => {
      it('should return menu visibility', () => {
        expect(uiSelectors.isMenuVisible(mockState)).toBe(false);

        mockState.ui.menuVisible = true;
        expect(uiSelectors.isMenuVisible(mockState)).toBe(true);
      });
    });

    describe('getCurrentModal', () => {
      it('should return current modal', () => {
        expect(uiSelectors.getCurrentModal(mockState)).toBe(null);

        mockState.ui.currentModal = 'help';
        expect(uiSelectors.getCurrentModal(mockState)).toBe('help');
      });
    });

    describe('isModalVisible', () => {
      it('should return modal visibility', () => {
        expect(uiSelectors.isModalVisible(mockState)).toBe(false);

        mockState.ui.modalVisible = true;
        expect(uiSelectors.isModalVisible(mockState)).toBe(true);
      });
    });

    describe('isPauseMenuVisible', () => {
      it('should return pause menu visibility', () => {
        expect(uiSelectors.isPauseMenuVisible(mockState)).toBe(false);

        mockState.ui.pauseMenuVisible = true;
        expect(uiSelectors.isPauseMenuVisible(mockState)).toBe(true);
      });
    });

    describe('getHUD', () => {
      it('should return HUD configuration', () => {
        const hud = uiSelectors.getHUD(mockState);
        expect(hud.visible).toBe(true);
        expect(hud.showScore).toBe(true);
        expect(hud.showMinimap).toBe(true);
      });
    });

    describe('isHUDVisible', () => {
      it('should return HUD visibility', () => {
        expect(uiSelectors.isHUDVisible(mockState)).toBe(true);

        mockState.ui.hud.visible = false;
        expect(uiSelectors.isHUDVisible(mockState)).toBe(false);
      });
    });

    describe('getSettings', () => {
      it('should return all settings', () => {
        const settings = uiSelectors.getSettings(mockState);
        expect(settings.masterVolume).toBe(1.0);
        expect(settings.audioEnabled).toBe(true);
        expect(settings.controlScheme).toBe('mouse');
      });
    });

    describe('getAudioSettings', () => {
      it('should return only audio settings', () => {
        const audioSettings = uiSelectors.getAudioSettings(mockState);
        expect(audioSettings.masterVolume).toBe(1.0);
        expect(audioSettings.musicVolume).toBe(0.7);
        expect(audioSettings.sfxVolume).toBe(0.8);
        expect(audioSettings.audioEnabled).toBe(true);
        expect(audioSettings.controlScheme).toBeUndefined();
      });
    });

    describe('getGraphicsSettings', () => {
      it('should return only graphics settings', () => {
        const graphicsSettings = uiSelectors.getGraphicsSettings(mockState);
        expect(graphicsSettings.particlesEnabled).toBe(true);
        expect(graphicsSettings.particleQuality).toBe('high');
        expect(graphicsSettings.showTrails).toBe(true);
        expect(graphicsSettings.screenShake).toBe(true);
        expect(graphicsSettings.audioEnabled).toBeUndefined();
      });
    });

    describe('getControlSettings', () => {
      it('should return only control settings', () => {
        const controlSettings = uiSelectors.getControlSettings(mockState);
        expect(controlSettings.controlScheme).toBe('mouse');
        expect(controlSettings.sensitivity).toBe(1.0);
        expect(controlSettings.invertControls).toBe(false);
        expect(controlSettings.audioEnabled).toBeUndefined();
      });
    });

    describe('getNotifications', () => {
      it('should return all notifications', () => {
        const notifications = uiSelectors.getNotifications(mockState);
        expect(notifications).toHaveLength(1);
        expect(notifications[0].message).toBe('Test notification');
      });

      it('should return empty array when no notifications', () => {
        mockState.ui.notifications = [];
        expect(uiSelectors.getNotifications(mockState)).toEqual([]);
      });
    });

    describe('isLoading', () => {
      it('should return loading state', () => {
        expect(uiSelectors.isLoading(mockState)).toBe(false);

        mockState.ui.loading = true;
        expect(uiSelectors.isLoading(mockState)).toBe(true);
      });
    });

    describe('getLoadingMessage', () => {
      it('should return loading message', () => {
        expect(uiSelectors.getLoadingMessage(mockState)).toBe('');

        mockState.ui.loadingMessage = 'Loading assets...';
        expect(uiSelectors.getLoadingMessage(mockState)).toBe(
          'Loading assets...'
        );
      });
    });

    describe('isMobile', () => {
      it('should return mobile state', () => {
        expect(uiSelectors.isMobile(mockState)).toBe(false);

        mockState.ui.isMobile = true;
        expect(uiSelectors.isMobile(mockState)).toBe(true);
      });
    });

    describe('getScreenDimensions', () => {
      it('should return screen dimensions', () => {
        const dimensions = uiSelectors.getScreenDimensions(mockState);
        expect(dimensions.width).toBe(1024);
        expect(dimensions.height).toBe(768);
      });
    });
  });

  describe('Composite Selectors', () => {
    describe('isGameActive', () => {
      it('should return true when playing', () => {
        mockState.game.status = 'playing';
        expect(compositeSelectors.isGameActive(mockState)).toBe(true);
      });

      it('should return true when paused', () => {
        mockState.game.status = 'paused';
        expect(compositeSelectors.isGameActive(mockState)).toBe(true);
      });

      it('should return false when in menu', () => {
        mockState.game.status = 'menu';
        expect(compositeSelectors.isGameActive(mockState)).toBe(false);
      });

      it('should return false when game over', () => {
        mockState.game.status = 'gameover';
        expect(compositeSelectors.isGameActive(mockState)).toBe(false);
      });
    });

    describe('getPlayerInfo', () => {
      it('should return complete player info', () => {
        const info = compositeSelectors.getPlayerInfo(mockState);
        expect(info.position.x).toBe(500);
        expect(info.position.y).toBe(600);
        expect(info.length).toBe(25);
        expect(info.isAlive).toBe(true);
        expect(info.isBoosting).toBe(false);
        expect(info.lives).toBe(3);
      });

      it('should reflect changes in player state', () => {
        mockState.player.isAlive = false;
        mockState.player.lives = 0;

        const info = compositeSelectors.getPlayerInfo(mockState);
        expect(info.isAlive).toBe(false);
        expect(info.lives).toBe(0);
      });
    });

    describe('getGameSummary', () => {
      it('should return game summary for HUD', () => {
        const summary = compositeSelectors.getGameSummary(mockState);
        expect(summary.score).toBe(1000);
        expect(summary.highScore).toBe(5000);
        expect(summary.playerLength).toBe(25);
        expect(summary.elementsCollected).toBe(50);
        expect(summary.aiSnakesAlive).toBe(2);
      });

      it('should reflect score changes', () => {
        mockState.game.score = 2500;
        mockState.game.highScore = 3000;

        const summary = compositeSelectors.getGameSummary(mockState);
        expect(summary.score).toBe(2500);
        expect(summary.highScore).toBe(3000);
      });
    });

    describe('canBoost', () => {
      it('should return true when all conditions met', () => {
        mockState.player.isAlive = true;
        mockState.player.isBoosting = false;
        mockState.game.status = 'playing';
        mockState.player.length = 10;

        expect(compositeSelectors.canBoost(mockState)).toBe(true);
      });

      it('should return false when player is dead', () => {
        mockState.player.isAlive = false;
        expect(compositeSelectors.canBoost(mockState)).toBe(false);
      });

      it('should return false when already boosting', () => {
        mockState.player.isBoosting = true;
        expect(compositeSelectors.canBoost(mockState)).toBe(false);
      });

      it('should return false when game is not playing', () => {
        mockState.game.status = 'paused';
        expect(compositeSelectors.canBoost(mockState)).toBe(false);
      });

      it('should return false when length is too short', () => {
        mockState.player.length = 4;
        expect(compositeSelectors.canBoost(mockState)).toBe(false);
      });

      it('should allow boost at minimum length', () => {
        mockState.player.length = 6;
        expect(compositeSelectors.canBoost(mockState)).toBe(true);
      });
    });
  });

  describe('Main Selectors Export', () => {
    it('should export all selector groups', () => {
      expect(selectors.game).toBe(gameSelectors);
      expect(selectors.player).toBe(playerSelectors);
      expect(selectors.ui).toBe(uiSelectors);
      expect(selectors.composite).toBe(compositeSelectors);
    });

    it('should allow accessing selectors through main export', () => {
      expect(selectors.game.getScore(mockState)).toBe(1000);
      expect(selectors.player.getLength(mockState)).toBe(25);
      expect(selectors.ui.isMenuVisible(mockState)).toBe(false);
      expect(selectors.composite.isGameActive(mockState)).toBe(true);
    });
  });

  describe('Selector Immutability', () => {
    it('should not modify state when accessing position', () => {
      const originalX = mockState.player.x;
      playerSelectors.getPosition(mockState);
      expect(mockState.player.x).toBe(originalX);
    });

    it('should return new objects for composite data', () => {
      const pos1 = playerSelectors.getPosition(mockState);
      const pos2 = playerSelectors.getPosition(mockState);
      expect(pos1).not.toBe(pos2);
    });

    it('should not mutate state through returned objects', () => {
      const pos = playerSelectors.getPosition(mockState);
      pos.x = 999;
      expect(mockState.player.x).toBe(500);
    });
  });
});
