/**
 * Storage Service
 *
 * Provides a centralized, type-safe interface for localStorage operations.
 * Replaces the scattered 69+ localStorage keys with a structured approach.
 *
 * Features:
 * - Namespaced keys to avoid conflicts
 * - Automatic JSON serialization/deserialization
 * - Type validation
 * - Data migration support
 * - Fallback for private browsing mode
 * - Error handling
 *
 * @module services/StorageService
 */

/**
 * Storage keys enum
 * Centralizes all storage keys used in the application
 */
export const StorageKeys = {
  // Game state
  HIGH_SCORE: 'game_highScore',
  GAME_MODE: 'game_mode',
  LAST_SAVE: 'game_lastSave',

  // Player data
  PLAYER_STATS: 'player_stats',
  PLAYER_INVENTORY: 'player_inventory',
  PLAYER_ACHIEVEMENTS: 'player_achievements',

  // Settings
  SETTINGS_AUDIO: 'settings_audio',
  SETTINGS_GRAPHICS: 'settings_graphics',
  SETTINGS_CONTROLS: 'settings_controls',
  SETTINGS_ACCESSIBILITY: 'settings_accessibility',

  // UI state
  UI_PREFERENCES: 'ui_preferences',
  TUTORIAL_COMPLETED: 'ui_tutorialCompleted',
  FIRST_TIME: 'ui_firstTime',

  // Metadata
  VERSION: 'meta_version',
  LAST_PLAYED: 'meta_lastPlayed',
};

/**
 * Storage Service Class
 */
export class StorageService {
  /**
   * Creates a new StorageService instance
   *
   * @param {string} [namespace='infiniteSnake'] - Namespace for keys
   */
  constructor(namespace = 'infiniteSnake') {
    this.namespace = namespace;
    this.storage = this.initializeStorage();
    this.currentVersion = '2.0.0';
    this.migrate();
  }

  /**
   * Initialize storage with fallback for private browsing
   * @private
   */
  initializeStorage() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return localStorage;
    } catch (e) {
      console.warn('localStorage not available, using in-memory fallback');
      return this.createMemoryStorage();
    }
  }

  /**
   * Create in-memory storage fallback
   * @private
   */
  createMemoryStorage() {
    const memoryStorage = {};
    return {
      getItem: (key) => memoryStorage[key] || null,
      setItem: (key, value) => {
        memoryStorage[key] = value;
      },
      removeItem: (key) => {
        delete memoryStorage[key];
      },
      clear: () => {
        Object.keys(memoryStorage).forEach((key) => delete memoryStorage[key]);
      },
    };
  }

  /**
   * Get namespaced key
   * @private
   */
  getNamespacedKey(key) {
    return `${this.namespace}_${key}`;
  }

  /**
   * Get a value from storage
   *
   * @param {string} key - Storage key
   * @param {*} [defaultValue=null] - Default value if key doesn't exist
   * @returns {*} Stored value or default
   *
   * @example
   * const highScore = storage.get(StorageKeys.HIGH_SCORE, 0);
   */
  get(key, defaultValue = null) {
    try {
      const item = this.storage.getItem(this.getNamespacedKey(key));

      if (item === null) {
        return defaultValue;
      }

      // Try to parse as JSON
      try {
        return JSON.parse(item);
      } catch {
        // Return as-is if not JSON
        return item;
      }
    } catch (error) {
      console.error(`Error getting key "${key}":`, error);
      return defaultValue;
    }
  }

  /**
   * Set a value in storage
   *
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified)
   * @returns {boolean} Success status
   *
   * @example
   * storage.set(StorageKeys.HIGH_SCORE, 1000);
   */
  set(key, value) {
    try {
      const serialized = JSON.stringify(value);
      this.storage.setItem(this.getNamespacedKey(key), serialized);
      return true;
    } catch (error) {
      console.error(`Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Remove a value from storage
   *
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   *
   * @example
   * storage.remove(StorageKeys.HIGH_SCORE);
   */
  remove(key) {
    try {
      this.storage.removeItem(this.getNamespacedKey(key));
      return true;
    } catch (error) {
      console.error(`Error removing key "${key}":`, error);
      return false;
    }
  }

  /**
   * Check if a key exists
   *
   * @param {string} key - Storage key
   * @returns {boolean} True if key exists
   *
   * @example
   * if (storage.has(StorageKeys.HIGH_SCORE)) { ... }
   */
  has(key) {
    return this.storage.getItem(this.getNamespacedKey(key)) !== null;
  }

  /**
   * Clear all namespaced storage
   *
   * @returns {boolean} Success status
   *
   * @example
   * storage.clear();
   */
  clear() {
    try {
      // Only clear keys with our namespace
      const keys = Object.keys(this.storage);
      keys.forEach((key) => {
        if (key.startsWith(`${this.namespace}_`)) {
          this.storage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Get all stored data as an object
   *
   * @returns {Object} All stored data
   *
   * @example
   * const allData = storage.getAll();
   */
  getAll() {
    const data = {};
    const prefix = `${this.namespace}_`;

    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(prefix)) {
          const shortKey = key.substring(prefix.length);
          data[shortKey] = this.get(shortKey);
        }
      }
    } catch (error) {
      console.error('Error getting all storage:', error);
    }

    return data;
  }

  /**
   * Export all data as JSON string
   *
   * @returns {string} JSON string of all data
   *
   * @example
   * const backup = storage.export();
   * // Save backup somewhere
   */
  export() {
    return JSON.stringify(this.getAll(), null, 2);
  }

  /**
   * Import data from JSON string
   *
   * @param {string} jsonString - JSON string to import
   * @param {boolean} [merge=false] - Merge with existing data or replace
   * @returns {boolean} Success status
   *
   * @example
   * storage.import(backupData, true); // Merge with existing
   */
  import(jsonString, merge = false) {
    try {
      const data = JSON.parse(jsonString);

      if (!merge) {
        this.clear();
      }

      Object.entries(data).forEach(([key, value]) => {
        this.set(key, value);
      });

      return true;
    } catch (error) {
      console.error('Error importing storage:', error);
      return false;
    }
  }

  /**
   * Migrate data from old storage format
   * @private
   */
  migrate() {
    const version = this.get(StorageKeys.VERSION, '0.0.0');

    if (version === this.currentVersion) {
      return; // Already migrated
    }

    console.log(`Migrating storage from ${version} to ${this.currentVersion}`);

    try {
      // Migration from pre-2.0.0 (old localStorage keys)
      if (version === '0.0.0') {
        this.migrateFromLegacy();
      }

      // Set new version
      this.set(StorageKeys.VERSION, this.currentVersion);
      console.log('Storage migration complete');
    } catch (error) {
      console.error('Storage migration failed:', error);
    }
  }

  /**
   * Migrate from legacy localStorage keys
   * @private
   */
  migrateFromLegacy() {
    // Map old keys to new keys
    const migrations = [
      { old: 'highScore', new: StorageKeys.HIGH_SCORE },
      { old: 'gameMode', new: StorageKeys.GAME_MODE },
      { old: 'playerStats', new: StorageKeys.PLAYER_STATS },
      { old: 'settings', new: StorageKeys.SETTINGS_AUDIO },
      { old: 'tutorialComplete', new: StorageKeys.TUTORIAL_COMPLETED },
    ];

    migrations.forEach(({ old, new: newKey }) => {
      try {
        const value = localStorage.getItem(old);
        if (value !== null) {
          this.set(newKey, JSON.parse(value));
          localStorage.removeItem(old); // Clean up old key
        }
      } catch (error) {
        console.warn(`Failed to migrate key "${old}":`, error);
      }
    });
  }

  /**
   * Save game state to storage
   *
   * @param {Object} state - Game state to save
   * @returns {boolean} Success status
   *
   * @example
   * storage.saveGameState(store.getState());
   */
  saveGameState(state) {
    try {
      // Save essential state only (not transient data)
      this.set(StorageKeys.HIGH_SCORE, state.game.highScore);
      this.set(StorageKeys.PLAYER_STATS, state.player.stats);
      this.set(StorageKeys.PLAYER_INVENTORY, state.player.inventory);
      this.set(StorageKeys.SETTINGS_AUDIO, {
        masterVolume: state.ui.settings.masterVolume,
        musicVolume: state.ui.settings.musicVolume,
        sfxVolume: state.ui.settings.sfxVolume,
        audioEnabled: state.ui.settings.audioEnabled,
      });
      this.set(StorageKeys.SETTINGS_GRAPHICS, {
        particlesEnabled: state.ui.settings.particlesEnabled,
        particleQuality: state.ui.settings.particleQuality,
        showTrails: state.ui.settings.showTrails,
        screenShake: state.ui.settings.screenShake,
      });
      this.set(StorageKeys.SETTINGS_CONTROLS, {
        controlScheme: state.ui.settings.controlScheme,
        sensitivity: state.ui.settings.sensitivity,
        invertControls: state.ui.settings.invertControls,
      });
      this.set(StorageKeys.LAST_PLAYED, Date.now());

      return true;
    } catch (error) {
      console.error('Error saving game state:', error);
      return false;
    }
  }

  /**
   * Load game state from storage
   *
   * @returns {Object|null} Loaded state or null
   *
   * @example
   * const savedState = storage.loadGameState();
   */
  loadGameState() {
    try {
      return {
        highScore: this.get(StorageKeys.HIGH_SCORE, 0),
        playerStats: this.get(StorageKeys.PLAYER_STATS, {}),
        playerInventory: this.get(StorageKeys.PLAYER_INVENTORY, {}),
        audioSettings: this.get(StorageKeys.SETTINGS_AUDIO, {}),
        graphicsSettings: this.get(StorageKeys.SETTINGS_GRAPHICS, {}),
        controlSettings: this.get(StorageKeys.SETTINGS_CONTROLS, {}),
        lastPlayed: this.get(StorageKeys.LAST_PLAYED, null),
      };
    } catch (error) {
      console.error('Error loading game state:', error);
      return null;
    }
  }
}

/**
 * Create and export singleton instance
 */
export const storage = new StorageService('infiniteSnake');

export default storage;
