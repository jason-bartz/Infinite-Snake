/**
 * Feature Flags System for Gradual Rollout
 *
 * This system allows us to:
 * 1. Enable/disable features during refactoring
 * 2. Run old and new code in parallel for comparison
 * 3. Quickly rollback if issues are detected
 * 4. A/B test new implementations
 *
 * Usage:
 *   import { featureFlags } from './config/feature-flags.js';
 *
 *   if (featureFlags.useNewRenderingSystem) {
 *     newRenderingSystem.render();
 *   } else {
 *     oldRenderFunction();
 *   }
 */

class FeatureFlagManager {
  constructor() {
    this.flags = {
      // Phase 1: Core Infrastructure
      useECS: false,
      useNewGameLoop: false,
      useConfigManager: false,

      // Phase 2: State Management
      useStateStore: false,
      useStorageService: false,

      // Phase 3: Systems
      useNewRenderingSystem: false,
      useNewCollisionSystem: false,
      useNewInputSystem: false,
      useNewAudioSystem: false,
      useNewAISystem: false,

      // Phase 4: Entities
      useECSEntities: false,
      useNewSnake: false,
      useNewBoss: false,

      // Phase 5: Services
      useAssetManager: false,
      useAPIService: false,
      useSaveManager: false,

      // Phase 6: UI
      useNewUISystem: false,
      useLitComponents: false,

      // Phase 8: Performance
      useObjectPooling: false,
      useWebGLRenderer: false,
      useCulling: false,

      // Development & Debug
      enableDebugMode: false,
      enablePerformanceMonitoring: false,
      enableVerboseLogging: false,
      enableDualMode: false, // Run old and new code side-by-side

      // Kill switches (for emergency rollback)
      disableNewFeatures: false,
    };

    // Override with URL parameters for testing
    this._loadFromURL();

    // Override with localStorage for persistent testing
    this._loadFromStorage();
  }

  /**
   * Check if a feature is enabled
   * @param {string} flagName - Name of the feature flag
   * @returns {boolean}
   */
  isEnabled(flagName) {
    // Kill switch overrides everything
    if (this.flags.disableNewFeatures && !flagName.startsWith('enable') && !flagName.startsWith('disable')) {
      return false;
    }

    return this.flags[flagName] ?? false;
  }

  /**
   * Enable a feature flag
   * @param {string} flagName
   */
  enable(flagName) {
    if (flagName in this.flags) {
      this.flags[flagName] = true;
      this._saveToStorage();
      console.log(`[FeatureFlags] Enabled: ${flagName}`);
    } else {
      console.warn(`[FeatureFlags] Unknown flag: ${flagName}`);
    }
  }

  /**
   * Disable a feature flag
   * @param {string} flagName
   */
  disable(flagName) {
    if (flagName in this.flags) {
      this.flags[flagName] = false;
      this._saveToStorage();
      console.log(`[FeatureFlags] Disabled: ${flagName}`);
    } else {
      console.warn(`[FeatureFlags] Unknown flag: ${flagName}`);
    }
  }

  /**
   * Enable multiple flags at once
   * @param {string[]} flagNames
   */
  enableBatch(flagNames) {
    flagNames.forEach((name) => this.enable(name));
  }

  /**
   * Get all flags and their states
   * @returns {Object}
   */
  getAll() {
    return { ...this.flags };
  }

  /**
   * Reset all flags to default (off)
   */
  reset() {
    Object.keys(this.flags).forEach((key) => {
      this.flags[key] = false;
    });
    this._saveToStorage();
    console.log('[FeatureFlags] All flags reset');
  }

  /**
   * Load flag overrides from URL parameters
   * Example: ?flags=useECS,useNewGameLoop&debug=true
   * @private
   */
  _loadFromURL() {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    // Enable flags from ?flags=flag1,flag2,flag3
    const flagsParam = params.get('flags');
    if (flagsParam) {
      flagsParam.split(',').forEach((flag) => {
        const trimmed = flag.trim();
        if (trimmed in this.flags) {
          this.flags[trimmed] = true;
          console.log(`[FeatureFlags] Enabled from URL: ${trimmed}`);
        }
      });
    }

    // Quick debug mode: ?debug=true
    if (params.get('debug') === 'true') {
      this.flags.enableDebugMode = true;
      this.flags.enableVerboseLogging = true;
      this.flags.enablePerformanceMonitoring = true;
      console.log('[FeatureFlags] Debug mode enabled from URL');
    }

    // Individual flag overrides: ?useECS=true
    Object.keys(this.flags).forEach((flagName) => {
      const value = params.get(flagName);
      if (value === 'true') {
        this.flags[flagName] = true;
      } else if (value === 'false') {
        this.flags[flagName] = false;
      }
    });
  }

  /**
   * Load flag overrides from localStorage
   * @private
   */
  _loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const stored = localStorage.getItem('featureFlags');
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.keys(parsed).forEach((key) => {
          if (key in this.flags) {
            this.flags[key] = parsed[key];
          }
        });
        console.log('[FeatureFlags] Loaded from localStorage');
      }
    } catch (error) {
      console.error('[FeatureFlags] Error loading from storage:', error);
    }
  }

  /**
   * Save current flags to localStorage
   * @private
   */
  _saveToStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem('featureFlags', JSON.stringify(this.flags));
    } catch (error) {
      console.error('[FeatureFlags] Error saving to storage:', error);
    }
  }
}

// Create singleton instance
export const featureFlags = new FeatureFlagManager();

// Expose to window for console debugging
if (typeof window !== 'undefined') {
  window.featureFlags = featureFlags;
  console.log('[FeatureFlags] Access via window.featureFlags in console');
  console.log('[FeatureFlags] Example: window.featureFlags.enable("useECS")');
}

// Export for testing
export { FeatureFlagManager };
