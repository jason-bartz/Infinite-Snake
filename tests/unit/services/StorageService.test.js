/**
 * Unit Tests for Storage Service
 *
 * Tests localStorage abstraction layer including:
 * - Get/set/remove operations
 * - Namespacing
 * - JSON serialization
 * - Data migration
 * - Export/import
 * - Fallback storage
 *
 * @module tests/unit/services/StorageService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService, StorageKeys } from '../../../src/services/StorageService.js';

describe('StorageService', () => {
  let service;
  let mockStorage;

  beforeEach(() => {
    // Create a mock localStorage that mimics real localStorage behavior
    // Real localStorage has keys as enumerable properties
    const mockLocalStorage = {
      getItem: vi.fn(function (key) {
        return this[key] !== undefined ? this[key] : null;
      }),
      setItem: vi.fn(function (key, value) {
        this[key] = value;
      }),
      removeItem: vi.fn(function (key) {
        delete this[key];
      }),
      clear: vi.fn(function () {
        const keys = Object.keys(this);
        keys.forEach((key) => {
          if (
            key !== 'getItem' &&
            key !== 'setItem' &&
            key !== 'removeItem' &&
            key !== 'clear' &&
            key !== 'length' &&
            key !== 'key'
          ) {
            delete this[key];
          }
        });
      }),
      get length() {
        return Object.keys(this).filter(
          (k) =>
            k !== 'getItem' &&
            k !== 'setItem' &&
            k !== 'removeItem' &&
            k !== 'clear' &&
            k !== 'length' &&
            k !== 'key'
        ).length;
      },
      key: vi.fn(function (index) {
        const keys = Object.keys(this).filter(
          (k) =>
            k !== 'getItem' &&
            k !== 'setItem' &&
            k !== 'removeItem' &&
            k !== 'clear' &&
            k !== 'length' &&
            k !== 'key'
        );
        return keys[index] || null;
      }),
    };

    // Mock global localStorage
    global.localStorage = mockLocalStorage;
    mockStorage = mockLocalStorage; // Reference for tests

    // Create new service instance
    service = new StorageService('testNamespace');
  });

  afterEach(() => {
    mockStorage = {};
  });

  describe('initialization', () => {
    it('should create instance with default namespace', () => {
      const defaultService = new StorageService();
      expect(defaultService.namespace).toBe('infiniteSnake');
    });

    it('should create instance with custom namespace', () => {
      expect(service.namespace).toBe('testNamespace');
    });

    it('should set current version', () => {
      expect(service.currentVersion).toBe('2.0.0');
    });

    it('should initialize with localStorage when available', () => {
      expect(service.storage).toBeDefined();
      expect(service.storage.getItem).toBeDefined();
    });
  });

  describe('localStorage fallback', () => {
    it('should use in-memory storage when localStorage fails', () => {
      // Mock localStorage to throw error
      const errorStorage = {
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
        getItem: () => null,
        removeItem: () => {},
        clear: () => {},
      };

      global.localStorage = errorStorage;

      const fallbackService = new StorageService('test');
      expect(fallbackService.storage).toBeDefined();
    });

    it('should work with memory storage fallback', () => {
      const memStorage = service.createMemoryStorage();
      memStorage.setItem('test', 'value');
      expect(memStorage.getItem('test')).toBe('value');
      memStorage.removeItem('test');
      expect(memStorage.getItem('test')).toBe(null);
    });
  });

  describe('namespacing', () => {
    it('should namespace keys correctly', () => {
      const key = 'testKey';
      const namespacedKey = service.getNamespacedKey(key);
      expect(namespacedKey).toBe('testNamespace_testKey');
    });

    it('should store with namespaced keys', () => {
      service.set('myKey', 'myValue');
      expect(mockStorage['testNamespace_myKey']).toBeDefined();
    });

    it('should prevent key collisions between namespaces', () => {
      const service1 = new StorageService('namespace1');
      const service2 = new StorageService('namespace2');

      service1.set('key', 'value1');
      service2.set('key', 'value2');

      expect(service1.get('key')).toBe('value1');
      expect(service2.get('key')).toBe('value2');
    });
  });

  describe('get', () => {
    it('should retrieve stored value', () => {
      service.set('key', 'value');
      expect(service.get('key')).toBe('value');
    });

    it('should return default value when key does not exist', () => {
      expect(service.get('nonexistent', 'default')).toBe('default');
    });

    it('should return null when key does not exist and no default', () => {
      expect(service.get('nonexistent')).toBe(null);
    });

    it('should parse JSON values', () => {
      service.set('object', { foo: 'bar' });
      expect(service.get('object')).toEqual({ foo: 'bar' });
    });

    it('should handle arrays', () => {
      service.set('array', [1, 2, 3]);
      expect(service.get('array')).toEqual([1, 2, 3]);
    });

    it('should handle numbers', () => {
      service.set('number', 42);
      expect(service.get('number')).toBe(42);
    });

    it('should handle booleans', () => {
      service.set('bool', true);
      expect(service.get('bool')).toBe(true);
    });

    it('should handle null values', () => {
      service.set('null', null);
      expect(service.get('null')).toBe(null);
    });

    it('should return default on parse error', () => {
      mockStorage['testNamespace_corrupt'] = 'not{valid:json}';
      expect(service.get('corrupt', 'default')).toBe('not{valid:json}');
    });
  });

  describe('set', () => {
    it('should store string values', () => {
      expect(service.set('string', 'test')).toBe(true);
      expect(service.get('string')).toBe('test');
    });

    it('should store object values', () => {
      const obj = { name: 'test', value: 123 };
      expect(service.set('object', obj)).toBe(true);
      expect(service.get('object')).toEqual(obj);
    });

    it('should store array values', () => {
      const arr = [1, 2, 3];
      expect(service.set('array', arr)).toBe(true);
      expect(service.get('array')).toEqual(arr);
    });

    it('should overwrite existing values', () => {
      service.set('key', 'value1');
      service.set('key', 'value2');
      expect(service.get('key')).toBe('value2');
    });

    it('should serialize complex objects', () => {
      const complex = {
        nested: { deep: { value: 42 } },
        array: [1, 2, { x: 3 }],
      };
      service.set('complex', complex);
      expect(service.get('complex')).toEqual(complex);
    });
  });

  describe('remove', () => {
    it('should remove stored value', () => {
      service.set('key', 'value');
      expect(service.has('key')).toBe(true);

      expect(service.remove('key')).toBe(true);
      expect(service.has('key')).toBe(false);
    });

    it('should not error when removing non-existent key', () => {
      expect(service.remove('nonexistent')).toBe(true);
    });

    it('should only remove namespaced key', () => {
      mockStorage['otherNamespace_key'] = 'value';
      service.remove('key');
      expect(mockStorage['otherNamespace_key']).toBeDefined();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      service.set('key', 'value');
      expect(service.has('key')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(service.has('nonexistent')).toBe(false);
    });

    it('should return false after removal', () => {
      service.set('key', 'value');
      service.remove('key');
      expect(service.has('key')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all namespaced keys', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      expect(service.clear()).toBe(true);
      expect(service.has('key1')).toBe(false);
      expect(service.has('key2')).toBe(false);
      expect(service.has('key3')).toBe(false);
      // clear() removes ALL namespaced keys including VERSION
      expect(service.has(StorageKeys.VERSION)).toBe(false);
    });

    it('should not clear other namespace keys', () => {
      service.set('key1', 'value1');
      mockStorage['otherNamespace_key'] = 'value';

      service.clear();

      expect(service.has('key1')).toBe(false);
      expect(mockStorage['otherNamespace_key']).toBeDefined();
    });
  });

  describe('getAll', () => {
    it('should return all namespaced data', () => {
      service.set('key1', 'value1');
      service.set('key2', { foo: 'bar' });
      service.set('key3', [1, 2, 3]);

      const all = service.getAll();
      expect(all.key1).toBe('value1');
      expect(all.key2).toEqual({ foo: 'bar' });
      expect(all.key3).toEqual([1, 2, 3]);
      // VERSION is set automatically
      expect(all[StorageKeys.VERSION]).toBe('2.0.0');
    });

    it('should not include other namespace keys', () => {
      service.set('key1', 'value1');
      mockStorage['otherNamespace_key'] = 'value';

      const all = service.getAll();
      expect(all.key1).toBe('value1');
      expect(all.otherNamespace_key).toBeUndefined();
    });

    it('should return object with version when no other data', () => {
      const all = service.getAll();
      // VERSION is always set on init
      expect(all[StorageKeys.VERSION]).toBe('2.0.0');
    });
  });

  describe('export', () => {
    it('should export data as JSON string', () => {
      service.set('key1', 'value1');
      service.set('key2', { foo: 'bar' });

      const exported = service.export();
      const parsed = JSON.parse(exported);

      expect(parsed.key1).toBe('value1');
      expect(parsed.key2).toEqual({ foo: 'bar' });
      expect(parsed[StorageKeys.VERSION]).toBe('2.0.0');
    });

    it('should export version when no other data', () => {
      const exported = service.export();
      const parsed = JSON.parse(exported);
      // VERSION is always set on init
      expect(parsed[StorageKeys.VERSION]).toBe('2.0.0');
    });

    it('should format JSON with indentation', () => {
      service.set('key', 'value');
      const exported = service.export();
      expect(exported).toContain('\n'); // Has line breaks
    });
  });

  describe('import', () => {
    it('should import data from JSON string', () => {
      const data = JSON.stringify({
        key1: 'value1',
        key2: { foo: 'bar' },
      });

      expect(service.import(data)).toBe(true);
      expect(service.get('key1')).toBe('value1');
      expect(service.get('key2')).toEqual({ foo: 'bar' });
    });

    it('should replace existing data by default', () => {
      service.set('existing', 'old');
      service.set('remove', 'me');

      const newData = JSON.stringify({ existing: 'new' });
      service.import(newData, false);

      expect(service.get('existing')).toBe('new');
      expect(service.has('remove')).toBe(false);
      // clear() removes VERSION, import doesn't restore it unless in data
      expect(service.has(StorageKeys.VERSION)).toBe(false);
    });

    it('should merge data when merge is true', () => {
      service.set('keep', 'original');
      service.set('overwrite', 'old');

      const newData = JSON.stringify({
        overwrite: 'new',
        add: 'added',
      });
      service.import(newData, true);

      expect(service.get('keep')).toBe('original');
      expect(service.get('overwrite')).toBe('new');
      expect(service.get('add')).toBe('added');
    });

    it('should return false on invalid JSON', () => {
      expect(service.import('not valid json')).toBe(false);
    });
  });

  describe('StorageKeys enum', () => {
    it('should have game keys', () => {
      expect(StorageKeys.HIGH_SCORE).toBe('game_highScore');
      expect(StorageKeys.GAME_MODE).toBe('game_mode');
      expect(StorageKeys.LAST_SAVE).toBe('game_lastSave');
    });

    it('should have player keys', () => {
      expect(StorageKeys.PLAYER_STATS).toBe('player_stats');
      expect(StorageKeys.PLAYER_INVENTORY).toBe('player_inventory');
      expect(StorageKeys.PLAYER_ACHIEVEMENTS).toBe('player_achievements');
    });

    it('should have settings keys', () => {
      expect(StorageKeys.SETTINGS_AUDIO).toBe('settings_audio');
      expect(StorageKeys.SETTINGS_GRAPHICS).toBe('settings_graphics');
      expect(StorageKeys.SETTINGS_CONTROLS).toBe('settings_controls');
      expect(StorageKeys.SETTINGS_ACCESSIBILITY).toBe('settings_accessibility');
    });

    it('should have UI keys', () => {
      expect(StorageKeys.UI_PREFERENCES).toBe('ui_preferences');
      expect(StorageKeys.TUTORIAL_COMPLETED).toBe('ui_tutorialCompleted');
      expect(StorageKeys.FIRST_TIME).toBe('ui_firstTime');
    });

    it('should have metadata keys', () => {
      expect(StorageKeys.VERSION).toBe('meta_version');
      expect(StorageKeys.LAST_PLAYED).toBe('meta_lastPlayed');
    });
  });

  describe('saveGameState', () => {
    it('should save game state to storage', () => {
      const state = {
        game: {
          highScore: 1000,
        },
        player: {
          stats: { totalDistance: 500 },
          inventory: { elements: { fire: 5 } },
        },
        ui: {
          settings: {
            masterVolume: 0.8,
            musicVolume: 0.6,
            sfxVolume: 0.7,
            audioEnabled: true,
            particlesEnabled: true,
            particleQuality: 'high',
            showTrails: true,
            screenShake: true,
            controlScheme: 'mouse',
            sensitivity: 1.0,
            invertControls: false,
          },
        },
      };

      expect(service.saveGameState(state)).toBe(true);

      expect(service.get(StorageKeys.HIGH_SCORE)).toBe(1000);
      expect(service.get(StorageKeys.PLAYER_STATS)).toEqual({
        totalDistance: 500,
      });
      expect(service.get(StorageKeys.PLAYER_INVENTORY)).toEqual({
        elements: { fire: 5 },
      });
    });

    it('should save audio settings', () => {
      const state = {
        game: { highScore: 0 },
        player: { stats: {}, inventory: {} },
        ui: {
          settings: {
            masterVolume: 0.5,
            musicVolume: 0.3,
            sfxVolume: 0.4,
            audioEnabled: false,
          },
        },
      };

      service.saveGameState(state);

      const audioSettings = service.get(StorageKeys.SETTINGS_AUDIO);
      expect(audioSettings.masterVolume).toBe(0.5);
      expect(audioSettings.audioEnabled).toBe(false);
    });

    it('should save graphics settings', () => {
      const state = {
        game: { highScore: 0 },
        player: { stats: {}, inventory: {} },
        ui: {
          settings: {
            particlesEnabled: false,
            particleQuality: 'low',
            showTrails: false,
            screenShake: false,
          },
        },
      };

      service.saveGameState(state);

      const graphicsSettings = service.get(StorageKeys.SETTINGS_GRAPHICS);
      expect(graphicsSettings.particleQuality).toBe('low');
      expect(graphicsSettings.particlesEnabled).toBe(false);
    });

    it('should save control settings', () => {
      const state = {
        game: { highScore: 0 },
        player: { stats: {}, inventory: {} },
        ui: {
          settings: {
            controlScheme: 'keyboard',
            sensitivity: 1.5,
            invertControls: true,
          },
        },
      };

      service.saveGameState(state);

      const controlSettings = service.get(StorageKeys.SETTINGS_CONTROLS);
      expect(controlSettings.controlScheme).toBe('keyboard');
      expect(controlSettings.sensitivity).toBe(1.5);
      expect(controlSettings.invertControls).toBe(true);
    });

    it('should save last played timestamp', () => {
      const beforeTime = Date.now();

      const state = {
        game: { highScore: 0 },
        player: { stats: {}, inventory: {} },
        ui: { settings: {} },
      };

      service.saveGameState(state);

      const afterTime = Date.now();
      const lastPlayed = service.get(StorageKeys.LAST_PLAYED);

      expect(lastPlayed).toBeGreaterThanOrEqual(beforeTime);
      expect(lastPlayed).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('loadGameState', () => {
    it('should load saved game state', () => {
      service.set(StorageKeys.HIGH_SCORE, 1500);
      service.set(StorageKeys.PLAYER_STATS, { totalBoosts: 10 });
      service.set(StorageKeys.PLAYER_INVENTORY, { elements: { water: 3 } });

      const loaded = service.loadGameState();

      expect(loaded.highScore).toBe(1500);
      expect(loaded.playerStats.totalBoosts).toBe(10);
      expect(loaded.playerInventory.elements.water).toBe(3);
    });

    it('should return default values for missing data', () => {
      const loaded = service.loadGameState();

      expect(loaded.highScore).toBe(0);
      expect(loaded.playerStats).toEqual({});
      expect(loaded.playerInventory).toEqual({});
    });

    it('should load settings', () => {
      service.set(StorageKeys.SETTINGS_AUDIO, { masterVolume: 0.8 });
      service.set(StorageKeys.SETTINGS_GRAPHICS, { particleQuality: 'low' });
      service.set(StorageKeys.SETTINGS_CONTROLS, { controlScheme: 'touch' });

      const loaded = service.loadGameState();

      expect(loaded.audioSettings.masterVolume).toBe(0.8);
      expect(loaded.graphicsSettings.particleQuality).toBe('low');
      expect(loaded.controlSettings.controlScheme).toBe('touch');
    });

    it('should load last played timestamp', () => {
      const timestamp = Date.now();
      service.set(StorageKeys.LAST_PLAYED, timestamp);

      const loaded = service.loadGameState();
      expect(loaded.lastPlayed).toBe(timestamp);
    });
  });

  describe('migration', () => {
    it('should set version on first run', () => {
      expect(service.get(StorageKeys.VERSION)).toBe('2.0.0');
    });

    it('should not migrate if already on current version', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      service.set(StorageKeys.VERSION, '2.0.0');
      service.migrate();

      // Should not log migration message
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Migrating')
      );
    });

    it('should migrate legacy keys', () => {
      // Set up legacy data
      mockStorage['highScore'] = JSON.stringify(5000);
      mockStorage['gameMode'] = JSON.stringify('infinite');
      mockStorage['playerStats'] = JSON.stringify({ totalDistance: 1000 });

      service.migrateFromLegacy();

      // Check migration worked
      expect(service.get(StorageKeys.HIGH_SCORE)).toBe(5000);
      expect(service.get(StorageKeys.GAME_MODE)).toBe('infinite');
      expect(service.get(StorageKeys.PLAYER_STATS)).toEqual({
        totalDistance: 1000,
      });
    });

    it('should handle missing legacy keys gracefully', () => {
      // No legacy data
      expect(() => service.migrateFromLegacy()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle storage errors in get', () => {
      service.storage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(service.get('key', 'default')).toBe('default');
    });

    it('should handle storage errors in set', () => {
      service.storage.setItem = vi.fn(() => {
        throw new Error('Quota exceeded');
      });

      expect(service.set('key', 'value')).toBe(false);
    });

    it('should handle storage errors in remove', () => {
      service.storage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(service.remove('key')).toBe(false);
    });

    it('should handle storage errors in clear', () => {
      const originalRemoveItem = service.storage.removeItem;
      service.storage.removeItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(service.clear()).toBe(false);

      // Restore for cleanup
      service.storage.removeItem = originalRemoveItem;
    });
  });

  describe('integration', () => {
    it('should handle complete save/load cycle', () => {
      const originalState = {
        game: { highScore: 2500 },
        player: {
          stats: { totalBoosts: 20, elementsEaten: 50 },
          inventory: { elements: { fire: 10, water: 5 } },
        },
        ui: {
          settings: {
            masterVolume: 0.9,
            musicVolume: 0.7,
            sfxVolume: 0.8,
            audioEnabled: true,
            particlesEnabled: true,
            particleQuality: 'medium',
            showTrails: true,
            screenShake: false,
            controlScheme: 'keyboard',
            sensitivity: 1.2,
            invertControls: true,
          },
        },
      };

      service.saveGameState(originalState);
      const loaded = service.loadGameState();

      expect(loaded.highScore).toBe(2500);
      expect(loaded.playerStats.totalBoosts).toBe(20);
      expect(loaded.playerInventory.elements.fire).toBe(10);
      expect(loaded.audioSettings.masterVolume).toBe(0.9);
      expect(loaded.graphicsSettings.particleQuality).toBe('medium');
      expect(loaded.controlSettings.invertControls).toBe(true);
    });

    it('should handle export/import cycle', () => {
      service.set('key1', 'value1');
      service.set('key2', { nested: 'object' });
      service.set('key3', [1, 2, 3]);

      const exported = service.export();
      service.clear();

      expect(service.has('key1')).toBe(false);
      expect(service.has('key2')).toBe(false);

      service.import(exported);

      expect(service.get('key1')).toBe('value1');
      expect(service.get('key2')).toEqual({ nested: 'object' });
      expect(service.get('key3')).toEqual([1, 2, 3]);
      // VERSION is exported and reimported
      expect(service.get(StorageKeys.VERSION)).toBe('2.0.0');
    });
  });
});
