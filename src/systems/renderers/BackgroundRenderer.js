import { RenderLayer } from '../RenderLayer.js';

/**
 * BackgroundRenderer - Renders all background layers
 *
 * Responsibilities:
 * - Render nebula background with parallax
 * - Render star overlay with different parallax
 * - Render blinking star sprites
 * - Render space stations with drift and rotation
 * - Render shooting stars (desktop only)
 * - Render scanline effect (desktop only)
 * - Handle mobile vs desktop rendering paths
 * - Handle cozy mode (transparent background)
 *
 * Layer: BACKGROUND (0)
 *
 * @class BackgroundRenderer
 */
export class BackgroundRenderer {
  /**
   * Create a new BackgroundRenderer
   * @param {Object} options - Configuration options
   * @param {boolean} options.isMobile - Mobile device flag
   * @param {string} options.gameMode - Game mode ('classic', 'infinite', 'cozy')
   */
  constructor({ isMobile = false, gameMode = 'classic' } = {}) {
    this.layer = RenderLayer.BACKGROUND;
    this.enabled = true;
    this.isMobile = isMobile;
    this.gameMode = gameMode;

    // Parallax factors
    this.nebulaParallax = 0.3;
    this.starParallax = 0.5;
    this.stationParallax = 0.95;

    // Scanline settings (desktop only)
    this.scanlineOpacity = 0.02;
    this.scanlineSpacing = 4;
    this.scanlineHeight = 2;

    // Performance metrics
    this.metrics = {
      drawCalls: 0,
      tilesDrawn: 0,
      starsDrawn: 0,
      stationsDrawn: 0
    };
  }

  /**
   * Check if renderer should execute this frame
   * @param {Camera} camera - Camera instance
   * @returns {boolean} True if should render
   */
  shouldRender(camera) {
    return this.enabled;
  }

  /**
   * Render background layers
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} entities - Entities to render (not used)
   * @param {Camera} camera - Camera instance
   * @param {number} interpolation - Interpolation factor (0-1)
   */
  render(ctx, entities, camera, interpolation) {
    this.metrics.drawCalls = 0;
    this.metrics.tilesDrawn = 0;
    this.metrics.starsDrawn = 0;
    this.metrics.stationsDrawn = 0;

    const canvas = ctx.canvas;

    // Clear background
    this._clearBackground(ctx, canvas);

    // Check if assets are loaded
    if (!window.preloadedAssets || !window.preloadedAssets.backgrounds) {
      return; // Fallback: no background rendering
    }

    const assets = window.preloadedAssets.backgrounds;

    // Skip background rendering in cozy mode
    if (this.gameMode === 'cozy') {
      return;
    }

    // Platform-specific rendering
    if (this.isMobile) {
      this._renderMobileBackground(ctx, canvas, assets, camera);
    } else {
      this._renderDesktopBackground(ctx, canvas, assets, camera);
    }

    // Draw space stations (both mobile and desktop)
    this._renderSpaceStations(ctx, canvas, camera);

    // Desktop-only effects
    if (!this.isMobile) {
      this._renderShootingStars(ctx, canvas, camera);
      this._renderScanlines(ctx, canvas);
    }
  }

  /**
   * Clear the canvas background
   * @private
   */
  _clearBackground(ctx, canvas) {
    if (this.gameMode !== 'cozy') {
      ctx.fillStyle = '#000011';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.metrics.drawCalls++;
    } else {
      // Transparent for cozy mode
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.metrics.drawCalls++;
    }
  }

  /**
   * Render simple mobile background (no parallax)
   * @private
   */
  _renderMobileBackground(ctx, canvas, assets, camera) {
    if (assets.nebulaBackground) {
      ctx.drawImage(assets.nebulaBackground, 0, 0, canvas.width, canvas.height);
      this.metrics.drawCalls++;
      this.metrics.tilesDrawn++;
    }
  }

  /**
   * Render desktop background with parallax
   * @private
   */
  _renderDesktopBackground(ctx, canvas, assets, camera) {
    // Render nebula with parallax
    this._renderNebulaParallax(ctx, canvas, assets, camera);

    // Render star overlay with different parallax
    this._renderStarOverlay(ctx, canvas, assets, camera);

    // Render blinking stars
    this._renderBlinkingStars(ctx, canvas, assets, camera);
  }

  /**
   * Render nebula background with parallax
   * @private
   */
  _renderNebulaParallax(ctx, canvas, assets, camera) {
    if (!assets.nebulaBackground) return;

    // Zoom scale for classic/infinite modes
    const zoomScale = (this.gameMode === 'classic' || this.gameMode === 'infinite')
      ? 2.0
      : 1.0;

    const bgWidth = assets.nebulaBackground.width * zoomScale;
    const bgHeight = assets.nebulaBackground.height * zoomScale;

    // Apply parallax scrolling
    const offsetX = (camera.x * this.nebulaParallax) % bgWidth;
    const offsetY = (camera.y * this.nebulaParallax) % bgHeight;

    // Tile the background
    for (let x = -bgWidth - offsetX; x < canvas.width + bgWidth; x += bgWidth) {
      for (let y = -bgHeight - offsetY; y < canvas.height + bgHeight; y += bgHeight) {
        ctx.drawImage(assets.nebulaBackground, x, y, bgWidth, bgHeight);
        this.metrics.drawCalls++;
        this.metrics.tilesDrawn++;
      }
    }
  }

  /**
   * Render star overlay with parallax
   * @private
   */
  _renderStarOverlay(ctx, canvas, assets, camera) {
    if (!assets.starOverlay) return;

    const starWidth = assets.starOverlay.width;
    const starHeight = assets.starOverlay.height;
    const offsetX = (camera.x * this.starParallax) % starWidth;
    const offsetY = (camera.y * this.starParallax) % starHeight;

    ctx.save();
    ctx.globalAlpha = 0.8;

    // Tile the star overlay
    for (let x = -starWidth - offsetX; x < canvas.width + starWidth; x += starWidth) {
      for (let y = -starHeight - offsetY; y < canvas.height + starHeight; y += starHeight) {
        ctx.drawImage(assets.starOverlay, x, y);
        this.metrics.drawCalls++;
        this.metrics.tilesDrawn++;
      }
    }

    ctx.restore();
  }

  /**
   * Render blinking star sprites
   * @private
   */
  _renderBlinkingStars(ctx, canvas, assets, camera) {
    if (!assets.starSprites || assets.starSprites.length === 0) return;
    if (!window.blinkingStars || window.blinkingStars.length === 0) return;

    const maxStars = this.isMobile ? 30 : window.blinkingStars.length;
    const cameraZoom = camera.zoom || 1;

    for (let i = 0; i < Math.min(maxStars, window.blinkingStars.length); i++) {
      const star = window.blinkingStars[i];

      // Calculate screen position
      const screen = camera.worldToScreen(star.x, star.y);

      // Skip if off-screen
      if (screen.x < -50 || screen.x > canvas.width + 50 ||
          screen.y < -50 || screen.y > canvas.height + 50) {
        continue;
      }

      // Update blink phase
      star.blinkPhase += star.blinkSpeed * 0.02;

      // Calculate opacity
      const opacity = 0.3 + Math.sin(star.blinkPhase) * 0.7;

      // Get sprite
      const sprite = assets.starSprites[star.type];
      if (!sprite) continue;

      ctx.save();
      ctx.globalAlpha = opacity;

      // Draw star sprite
      const size = sprite.width * star.scale * cameraZoom;
      ctx.drawImage(
        sprite,
        screen.x - size / 2,
        screen.y - size / 2,
        size,
        size
      );

      ctx.restore();
      this.metrics.drawCalls++;
      this.metrics.starsDrawn++;
    }
  }

  /**
   * Render space stations with drift and rotation
   * @private
   */
  _renderSpaceStations(ctx, canvas, camera) {
    if (!window.preloadedAssets || !window.preloadedAssets.stations) return;
    if (!window.spaceStations || window.spaceStations.length === 0) return;

    const WORLD_SIZE = window.WORLD_SIZE || 10000;

    window.spaceStations.forEach((station) => {
      // Update station position with drifting motion
      station.driftAngle += 0.005;
      const driftX = Math.cos(station.driftAngle) * station.driftSpeed;
      const driftY = Math.sin(station.driftAngle * 0.7) * station.driftSpeed;

      station.x += station.vx + driftX;
      station.y += station.vy + driftY;

      // Wrap around world boundaries
      if (station.x < 0) station.x = WORLD_SIZE;
      if (station.x > WORLD_SIZE) station.x = 0;
      if (station.y < 0) station.y = WORLD_SIZE;
      if (station.y > WORLD_SIZE) station.y = 0;

      // Update rotation
      station.rotation += station.rotationSpeed;

      // Calculate screen position with parallax
      const x = station.x - camera.x * this.stationParallax + canvas.width / 2;
      const y = station.y - camera.y * this.stationParallax + canvas.height / 2;

      // Viewport culling
      const margin = station.width * 2;
      if (x < -margin || x > canvas.width + margin ||
          y < -margin || y > canvas.height + margin) {
        return;
      }

      // Get station image
      const stationImage = window.preloadedAssets.stations[station.imageId];
      if (!stationImage) return;

      // Draw station with rotation
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.translate(x, y);
      ctx.rotate(station.rotation);

      // Draw centered
      const aspectRatio = stationImage.width / stationImage.height;
      const drawHeight = station.width / aspectRatio;

      ctx.drawImage(
        stationImage,
        -station.width / 2,
        -drawHeight / 2,
        station.width,
        drawHeight
      );

      ctx.restore();
      this.metrics.drawCalls++;
      this.metrics.stationsDrawn++;
    });
  }

  /**
   * Render shooting stars (desktop only)
   * @private
   */
  _renderShootingStars(ctx, canvas, camera) {
    if (!window.shootingStars || window.shootingStars.length === 0) return;

    window.shootingStars.forEach(star => {
      if (star.draw) {
        star.draw();
        this.metrics.drawCalls++;
      }
    });
  }

  /**
   * Render scanline effect (desktop only)
   * @private
   */
  _renderScanlines(ctx, canvas) {
    ctx.fillStyle = `rgba(0, 255, 0, ${this.scanlineOpacity})`;

    for (let y = 0; y < canvas.height; y += this.scanlineSpacing) {
      if (y % 8 === 0) {
        ctx.fillRect(0, y, canvas.width, this.scanlineHeight);
        this.metrics.drawCalls++;
      }
    }
  }

  /**
   * Update game mode
   * @param {string} mode - New game mode
   */
  setGameMode(mode) {
    this.gameMode = mode;
  }

  /**
   * Update mobile flag
   * @param {boolean} isMobile - Mobile flag
   */
  setMobile(isMobile) {
    this.isMobile = isMobile;
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // No resources to cleanup currently
  }
}
