/**
 * Camera - Viewport and coordinate transformation system
 *
 * Responsibilities:
 * - Convert between world and screen coordinates
 * - Viewport culling calculations
 * - Camera following and smoothing
 * - Interpolation for smooth rendering
 * - Zoom management
 *
 * @class Camera
 */
export class Camera {
  /**
   * Create a new Camera
   * @param {number} x - World X position
   * @param {number} y - World Y position
   * @param {number} zoom - Zoom level (1.0 = 100%)
   * @param {number} viewportWidth - Viewport width in pixels
   * @param {number} viewportHeight - Viewport height in pixels
   */
  constructor(x = 0, y = 0, zoom = 1, viewportWidth = 800, viewportHeight = 600) {
    this.x = x;
    this.y = y;
    this.zoom = zoom;
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;

    // Smoothing for camera movement
    this.targetX = x;
    this.targetY = y;
    this.targetZoom = zoom;
    this.smoothing = 0.1;

    // Viewport culling margins (entity-specific)
    this.cullingMargins = {
      default: 100,
      element: 100,
      particle: 50,
      snake: 200,
      powerup: 150,
      asteroid: 200
    };

    // Camera bounds (optional world limits)
    this.bounds = null; // { minX, maxX, minY, maxY }

    // Camera shake effect
    this.shakeIntensity = 0;
    this.shakeDecay = 0.95;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Update camera position (called each frame)
   * @param {number} deltaTime - Time since last frame (ms)
   */
  update(deltaTime) {
    // Smooth camera movement toward target
    const smoothFactor = 1 - Math.pow(1 - this.smoothing, deltaTime / 16.67);

    this.x += (this.targetX - this.x) * smoothFactor;
    this.y += (this.targetY - this.y) * smoothFactor;
    this.zoom += (this.targetZoom - this.zoom) * smoothFactor;

    // Update camera shake
    if (this.shakeIntensity > 0.01) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }

    // Apply bounds if set
    if (this.bounds) {
      this.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.x));
      this.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.y));
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @returns {{x: number, y: number}} Screen coordinates
   */
  worldToScreen(worldX, worldY) {
    const screenX =
      (worldX - this.x) * this.zoom +
      this.viewportWidth / 2 +
      this.shakeOffsetX;

    const screenY =
      (worldY - this.y) * this.zoom +
      this.viewportHeight / 2 +
      this.shakeOffsetY;

    return { x: screenX, y: screenY };
  }

  /**
   * Convert screen coordinates to world coordinates
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @returns {{x: number, y: number}} World coordinates
   */
  screenToWorld(screenX, screenY) {
    const worldX =
      (screenX - this.viewportWidth / 2 - this.shakeOffsetX) / this.zoom + this.x;

    const worldY =
      (screenY - this.viewportHeight / 2 - this.shakeOffsetY) / this.zoom + this.y;

    return { x: worldX, y: worldY };
  }

  /**
   * Check if a point is within the viewport
   * @param {number} worldX - World X position
   * @param {number} worldY - World Y position
   * @param {number} [margin] - Additional margin in pixels (default: 100)
   * @param {string} [entityType] - Entity type for type-specific margin
   * @returns {boolean} True if point is visible
   */
  isInViewport(worldX, worldY, margin = null, entityType = 'default') {
    // Use entity-specific margin if no explicit margin provided
    const effectiveMargin =
      margin !== null ? margin : this.cullingMargins[entityType] || this.cullingMargins.default;

    const screen = this.worldToScreen(worldX, worldY);

    return (
      screen.x >= -effectiveMargin &&
      screen.x <= this.viewportWidth + effectiveMargin &&
      screen.y >= -effectiveMargin &&
      screen.y <= this.viewportHeight + effectiveMargin
    );
  }

  /**
   * Check if a rectangle is within the viewport
   * @param {number} worldX - World X position (center)
   * @param {number} worldY - World Y position (center)
   * @param {number} width - Rectangle width
   * @param {number} height - Rectangle height
   * @param {number} [margin] - Additional margin
   * @returns {boolean} True if rectangle is visible
   */
  isRectInViewport(worldX, worldY, width, height, margin = 0) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Check if any corner is in viewport (with margin)
    const topLeft = this.isInViewport(worldX - halfWidth, worldY - halfHeight, margin);
    const topRight = this.isInViewport(worldX + halfWidth, worldY - halfHeight, margin);
    const bottomLeft = this.isInViewport(worldX - halfWidth, worldY + halfHeight, margin);
    const bottomRight = this.isInViewport(worldX + halfWidth, worldY + halfHeight, margin);

    return topLeft || topRight || bottomLeft || bottomRight;
  }

  /**
   * Interpolate entity position for smooth rendering
   * @param {Object} entity - Entity with position history
   * @param {number} entity.x - Current X position
   * @param {number} entity.y - Current Y position
   * @param {number} [entity.angle] - Current angle (optional)
   * @param {number} entity.previousX - Previous X position
   * @param {number} entity.previousY - Previous Y position
   * @param {number} [entity.previousAngle] - Previous angle (optional)
   * @param {number} delta - Interpolation factor (0-1)
   * @returns {{x: number, y: number, angle?: number}} Interpolated position
   */
  interpolate(entity, delta) {
    const result = {
      x: entity.previousX + (entity.x - entity.previousX) * delta,
      y: entity.previousY + (entity.y - entity.previousY) * delta
    };

    // Interpolate angle if present
    if (entity.angle !== undefined && entity.previousAngle !== undefined) {
      // Handle angle wrapping (shortest path)
      let angleDiff = entity.angle - entity.previousAngle;
      if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      result.angle = entity.previousAngle + angleDiff * delta;
    }

    return result;
  }

  /**
   * Set camera to follow a target entity
   * @param {Object} target - Target entity with x, y properties
   * @param {boolean} [immediate] - If true, snap to target immediately
   */
  follow(target, immediate = false) {
    if (!target) return;

    this.targetX = target.x;
    this.targetY = target.y;

    if (immediate) {
      this.x = target.x;
      this.y = target.y;
    }
  }

  /**
   * Set camera zoom level
   * @param {number} zoom - Zoom level (1.0 = 100%)
   * @param {boolean} [immediate] - If true, zoom immediately
   */
  setZoom(zoom, immediate = false) {
    this.targetZoom = Math.max(0.1, Math.min(5.0, zoom)); // Clamp 0.1-5.0

    if (immediate) {
      this.zoom = this.targetZoom;
    }
  }

  /**
   * Set viewport dimensions
   * @param {number} width - Viewport width
   * @param {number} height - Viewport height
   */
  setViewport(width, height) {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Set camera bounds (world limits)
   * @param {number} minX - Minimum X coordinate
   * @param {number} maxX - Maximum X coordinate
   * @param {number} minY - Minimum Y coordinate
   * @param {number} maxY - Maximum Y coordinate
   */
  setBounds(minX, maxX, minY, maxY) {
    this.bounds = { minX, maxX, minY, maxY };
  }

  /**
   * Clear camera bounds
   */
  clearBounds() {
    this.bounds = null;
  }

  /**
   * Trigger camera shake effect
   * @param {number} intensity - Shake intensity (pixels)
   */
  shake(intensity = 10) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  /**
   * Set camera smoothing factor
   * @param {number} smoothing - Smoothing (0-1, 0=instant, 1=very smooth)
   */
  setSmoothing(smoothing) {
    this.smoothing = Math.max(0, Math.min(1, smoothing));
  }

  /**
   * Set entity-specific culling margin
   * @param {string} entityType - Entity type
   * @param {number} margin - Margin in pixels
   */
  setCullingMargin(entityType, margin) {
    this.cullingMargins[entityType] = margin;
  }

  /**
   * Get viewport bounds in world coordinates
   * @returns {{minX: number, maxX: number, minY: number, maxY: number}}
   */
  getViewportBounds() {
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(this.viewportWidth, this.viewportHeight);

    return {
      minX: topLeft.x,
      maxX: bottomRight.x,
      minY: topLeft.y,
      maxY: bottomRight.y
    };
  }

  /**
   * Reset camera to default state
   */
  reset() {
    this.x = 0;
    this.y = 0;
    this.zoom = 1;
    this.targetX = 0;
    this.targetY = 0;
    this.targetZoom = 1;
    this.shakeIntensity = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  /**
   * Serialize camera state
   * @returns {Object} Camera state
   */
  toJSON() {
    return {
      x: this.x,
      y: this.y,
      zoom: this.zoom,
      targetX: this.targetX,
      targetY: this.targetY,
      targetZoom: this.targetZoom,
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      smoothing: this.smoothing,
      bounds: this.bounds
    };
  }

  /**
   * Deserialize camera state
   * @param {Object} state - Camera state
   */
  fromJSON(state) {
    this.x = state.x;
    this.y = state.y;
    this.zoom = state.zoom;
    this.targetX = state.targetX;
    this.targetY = state.targetY;
    this.targetZoom = state.targetZoom;
    this.viewportWidth = state.viewportWidth;
    this.viewportHeight = state.viewportHeight;
    this.smoothing = state.smoothing;
    this.bounds = state.bounds;
  }
}
