/**
 * RenderLayer - Defines rendering order layers
 *
 * Layers are rendered in numerical order (0 first, higher numbers on top).
 * This ensures consistent z-ordering across all renderers.
 *
 * @enum {number}
 */
export const RenderLayer = Object.freeze({
  /**
   * Background layer - furthest back
   * Includes: nebula, stars, space stations, shooting stars
   */
  BACKGROUND: 0,

  /**
   * Background objects - decorative elements
   * Includes: asteroids, space stations (if not in background)
   */
  BACKGROUND_OBJECTS: 1,

  /**
   * Game objects - collectible elements
   * Includes: elements, power-ups (AlchemyVision, VoidOrbs, CatalystGems)
   */
  GAME_OBJECTS: 2,

  /**
   * Visual effects - non-interactive effects
   * Includes: shockwaves, damage numbers, sparkles
   */
  EFFECTS: 3,

  /**
   * Entities - game characters
   * Includes: snakes (player and AI), boost trails
   */
  ENTITIES: 4,

  /**
   * Particles - particle systems
   * Includes: explosions, trails, sparkles from particle pool
   */
  PARTICLES: 5,

  /**
   * Explosions - explosion animations
   * Includes: sprite-based explosion effects
   */
  EXPLOSIONS: 6,

  /**
   * Screen effects - full-screen overlays
   * Includes: damage flash, vignette, screen shake effects
   */
  SCREEN_EFFECTS: 7,

  /**
   * UI overlay - always on top
   * Includes: borders, HUD elements, menus
   */
  UI_OVERLAY: 8
});

/**
 * Get layer name from layer number
 * @param {number} layer - Layer number
 * @returns {string} Layer name
 */
export function getLayerName(layer) {
  const entry = Object.entries(RenderLayer).find(([, value]) => value === layer);
  return entry ? entry[0] : 'UNKNOWN';
}

/**
 * Get all layers in rendering order
 * @returns {number[]} Array of layer numbers in order
 */
export function getAllLayers() {
  return Object.values(RenderLayer).sort((a, b) => a - b);
}

/**
 * Validate layer number
 * @param {number} layer - Layer number to validate
 * @returns {boolean} True if valid layer
 */
export function isValidLayer(layer) {
  return Object.values(RenderLayer).includes(layer);
}
