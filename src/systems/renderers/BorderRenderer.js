import { RenderLayer } from '../RenderLayer.js';

/**
 * BorderRenderer - Renders world edge barriers
 *
 * Responsibilities:
 * - Render purple gradient barriers at world edges
 * - Render solid warning lines at borders
 * - Handle mobile vs desktop rendering (mobile = lines only)
 * - Pulse animation for barriers
 * - Viewport culling (only render visible borders)
 *
 * Layer: UI_OVERLAY (8) - Always rendered last
 *
 * @class BorderRenderer
 */
export class BorderRenderer {
  /**
   * Create a new BorderRenderer
   * @param {Object} options - Configuration options
   * @param {boolean} options.isMobile - Mobile device flag
   * @param {number} options.worldSize - World size in pixels
   * @param {number} options.animationTime - Current animation time (for pulse effect)
   */
  constructor({ isMobile = false, worldSize = 10000, animationTime = 0 } = {}) {
    this.layer = RenderLayer.UI_OVERLAY;
    this.enabled = true;
    this.isMobile = isMobile;
    this.worldSize = worldSize;
    this.animationTime = animationTime;

    // Border configuration
    this.borderThickness = isMobile ? 30 : 60;
    this.warningLineThickness = 6;
    this.pixelSize = isMobile ? 16 : 8;

    // Colors
    this.gradientColor = 'rgba(128, 64, 255, {alpha})';
    this.warningColor = '#8844FF';
    this.mobileWarningColor = 'rgba(136, 68, 255, 0.8)';

    // Performance metrics
    this.metrics = {
      drawCalls: 0,
      bordersDrawn: 0
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
   * Render world borders
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} entities - Entities to render (not used)
   * @param {Camera} camera - Camera instance
   * @param {number} interpolation - Interpolation factor (0-1)
   */
  render(ctx, entities, camera, interpolation) {
    this.metrics.drawCalls = 0;
    this.metrics.bordersDrawn = 0;

    const canvas = ctx.canvas;
    const cameraZoom = camera.zoom || 1;

    ctx.save();
    ctx.globalAlpha = 1; // Ensure borders are fully opaque

    // Calculate border screen positions
    const borders = this._calculateBorderPositions(camera, canvas, cameraZoom);

    // Pulse animation
    const pulsePhase = Math.floor((this.animationTime * 2) % 4);

    // Render each border
    if (borders.left.visible) {
      this._renderLeftBorder(ctx, canvas, borders.left);
    }

    if (borders.right.visible) {
      this._renderRightBorder(ctx, canvas, borders.right);
    }

    if (borders.top.visible) {
      this._renderTopBorder(ctx, canvas, borders.top);
    }

    if (borders.bottom.visible) {
      this._renderBottomBorder(ctx, canvas, borders.bottom);
    }

    ctx.restore();
  }

  /**
   * Calculate screen positions of borders
   * @private
   */
  _calculateBorderPositions(camera, canvas, cameraZoom) {
    const leftBorder = (-camera.x) * cameraZoom + canvas.width / 2;
    const rightBorder = (this.worldSize - camera.x) * cameraZoom + canvas.width / 2;
    const topBorder = (-camera.y) * cameraZoom + canvas.height / 2;
    const bottomBorder = (this.worldSize - camera.y) * cameraZoom + canvas.height / 2;

    return {
      left: {
        position: leftBorder,
        visible: leftBorder > -this.borderThickness
      },
      right: {
        position: rightBorder,
        visible: rightBorder < canvas.width + this.borderThickness
      },
      top: {
        position: topBorder,
        visible: topBorder > -this.borderThickness
      },
      bottom: {
        position: bottomBorder,
        visible: bottomBorder < canvas.height + this.borderThickness
      }
    };
  }

  /**
   * Render left border
   * @private
   */
  _renderLeftBorder(ctx, canvas, border) {
    const borderWidth = Math.min(this.borderThickness, border.position);
    if (borderWidth <= 0) return;

    if (this.isMobile) {
      // Mobile: warning line only
      ctx.fillStyle = this.mobileWarningColor;
      ctx.fillRect(
        Math.max(2, border.position - this.warningLineThickness / 2),
        0,
        this.warningLineThickness,
        canvas.height
      );
      this.metrics.drawCalls++;
    } else {
      // Desktop: gradient + warning line
      const gradient = ctx.createLinearGradient(0, 0, borderWidth, 0);
      gradient.addColorStop(0, 'rgba(128, 64, 255, 0.675)');
      gradient.addColorStop(0.7, 'rgba(128, 64, 255, 0.45)');
      gradient.addColorStop(1, 'rgba(128, 64, 255, 0.075)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, borderWidth, canvas.height);
      this.metrics.drawCalls++;

      // Warning line
      ctx.fillStyle = this.warningColor;
      ctx.fillRect(
        Math.max(2, border.position - this.warningLineThickness / 2),
        0,
        this.warningLineThickness,
        canvas.height
      );
      this.metrics.drawCalls++;
    }

    this.metrics.bordersDrawn++;
  }

  /**
   * Render right border
   * @private
   */
  _renderRightBorder(ctx, canvas, border) {
    const startX = Math.max(0, border.position - this.borderThickness);
    const borderWidth = canvas.width - startX;
    if (borderWidth <= 0) return;

    if (this.isMobile) {
      // Mobile: warning line only
      ctx.fillStyle = this.mobileWarningColor;
      const lineX = Math.max(
        startX + this.warningLineThickness,
        Math.min(
          canvas.width - this.warningLineThickness - 2,
          border.position - this.warningLineThickness / 2
        )
      );
      ctx.fillRect(lineX, 0, this.warningLineThickness, canvas.height);
      this.metrics.drawCalls++;
    } else {
      // Desktop: gradient + warning line
      const gradient = ctx.createLinearGradient(startX, 0, canvas.width, 0);
      gradient.addColorStop(0, 'rgba(128, 64, 255, 0.075)');
      gradient.addColorStop(0.3, 'rgba(128, 64, 255, 0.45)');
      gradient.addColorStop(1, 'rgba(128, 64, 255, 0.675)');
      ctx.fillStyle = gradient;
      ctx.fillRect(startX, 0, borderWidth, canvas.height);
      this.metrics.drawCalls++;

      // Warning line
      ctx.fillStyle = this.warningColor;
      const lineX = Math.max(
        startX + this.warningLineThickness,
        Math.min(
          canvas.width - this.warningLineThickness - 2,
          border.position - this.warningLineThickness / 2
        )
      );
      ctx.fillRect(lineX, 0, this.warningLineThickness, canvas.height);
      this.metrics.drawCalls++;
    }

    this.metrics.bordersDrawn++;
  }

  /**
   * Render top border
   * @private
   */
  _renderTopBorder(ctx, canvas, border) {
    const borderHeight = Math.min(this.borderThickness, border.position);
    if (borderHeight <= 0) return;

    if (this.isMobile) {
      // Mobile: warning line only
      ctx.fillStyle = this.mobileWarningColor;
      ctx.fillRect(
        0,
        Math.max(2, border.position - this.warningLineThickness / 2),
        canvas.width,
        this.warningLineThickness
      );
      this.metrics.drawCalls++;
    } else {
      // Desktop: gradient + warning line
      const gradient = ctx.createLinearGradient(0, 0, 0, borderHeight);
      gradient.addColorStop(0, 'rgba(128, 64, 255, 0.675)');
      gradient.addColorStop(0.7, 'rgba(128, 64, 255, 0.45)');
      gradient.addColorStop(1, 'rgba(128, 64, 255, 0.075)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, borderHeight);
      this.metrics.drawCalls++;

      // Warning line
      ctx.fillStyle = this.warningColor;
      ctx.fillRect(
        0,
        Math.max(2, border.position - this.warningLineThickness / 2),
        canvas.width,
        this.warningLineThickness
      );
      this.metrics.drawCalls++;
    }

    this.metrics.bordersDrawn++;
  }

  /**
   * Render bottom border
   * @private
   */
  _renderBottomBorder(ctx, canvas, border) {
    const startY = Math.max(0, border.position - this.borderThickness);
    const borderHeight = canvas.height - startY;
    if (borderHeight <= 0) return;

    if (this.isMobile) {
      // Mobile: warning line only
      ctx.fillStyle = this.mobileWarningColor;
      ctx.fillRect(
        0,
        Math.min(
          canvas.height - this.warningLineThickness - 2,
          border.position - this.warningLineThickness / 2
        ),
        canvas.width,
        this.warningLineThickness
      );
      this.metrics.drawCalls++;
    } else {
      // Desktop: gradient + warning line
      const gradient = ctx.createLinearGradient(0, startY, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(128, 64, 255, 0.075)');
      gradient.addColorStop(0.3, 'rgba(128, 64, 255, 0.45)');
      gradient.addColorStop(1, 'rgba(128, 64, 255, 0.675)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, startY, canvas.width, borderHeight);
      this.metrics.drawCalls++;

      // Warning line
      ctx.fillStyle = this.warningColor;
      ctx.fillRect(
        0,
        Math.min(
          canvas.height - this.warningLineThickness - 2,
          border.position - this.warningLineThickness / 2
        ),
        canvas.width,
        this.warningLineThickness
      );
      this.metrics.drawCalls++;
    }

    this.metrics.bordersDrawn++;
  }

  /**
   * Update animation time (for pulse effects)
   * @param {number} time - New animation time
   */
  setAnimationTime(time) {
    this.animationTime = time;
  }

  /**
   * Update world size
   * @param {number} size - New world size
   */
  setWorldSize(size) {
    this.worldSize = size;
  }

  /**
   * Update mobile flag
   * @param {boolean} isMobile - Mobile flag
   */
  setMobile(isMobile) {
    this.isMobile = isMobile;
    this.borderThickness = isMobile ? 30 : 60;
    this.pixelSize = isMobile ? 16 : 8;
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
