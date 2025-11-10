import { RenderLayer } from '../RenderLayer.js';

/**
 * SnakeRenderer - Renders all snakes (player and AI)
 *
 * Responsibilities:
 * - Render snake segments with progressive tapering
 * - Render snake heads with sprite rotation
 * - Render name labels with stroke and fill
 * - Render boost trails (desktop only)
 * - Handle smooth interpolation for movement
 * - Handle viewport culling optimization
 * - Handle death animations
 * - Handle mobile vs desktop rendering paths
 * - Render invincibility effects for player
 * - Render leader crown and boss skull icons
 *
 * Layer: ENTITIES (4)
 *
 * Extracted from: game-original.js Snake.draw() method (lines 3756-4146, ~390 lines)
 *
 * @class SnakeRenderer
 */
export class SnakeRenderer {
  /**
   * Create a new SnakeRenderer
   * @param {Object} options - Configuration options
   * @param {boolean} options.isMobile - Mobile device flag
   * @param {string} options.gameMode - Game mode ('classic', 'infinite', 'cozy')
   * @param {Object} options.skinImages - Map of skin images {skinName: HTMLImageElement}
   * @param {Object} options.skinMetadata - Map of skin metadata {skinName: {colors: [...], ...}}
   * @param {number} options.segmentSize - Base segment size (default: 10)
   * @param {number} options.baseMultiplier - Base size multiplier (default: 1.5)
   * @param {number} options.emojiMultiplier - Emoji size multiplier (default: 2.2)
   * @param {Function} options.getCachedEmoji - Function to get cached emoji canvas
   * @param {Function} options.worldToScreen - Function to convert world coords to screen
   * @param {Function} options.isInViewport - Function to check if position is in viewport
   * @param {Object} options.gradientCache - Gradient cache object (optional)
   * @param {Object} options.particlePool - Particle pool for effects (optional)
   */
  constructor({
    isMobile = false,
    gameMode = 'classic',
    skinImages = {},
    skinMetadata = {},
    segmentSize = 10,
    baseMultiplier = 1.5,
    emojiMultiplier = 2.2,
    getCachedEmoji = null,
    worldToScreen = null,
    isInViewport = null,
    gradientCache = null,
    particlePool = null
  } = {}) {
    this.layer = RenderLayer.ENTITIES;
    this.enabled = true;
    this.isMobile = isMobile;
    this.gameMode = gameMode;

    // Dependencies
    this.skinImages = skinImages;
    this.skinMetadata = skinMetadata;
    this.segmentSize = segmentSize;
    this.baseMultiplier = baseMultiplier;
    this.emojiMultiplier = emojiMultiplier;
    this.getCachedEmoji = getCachedEmoji;
    this.worldToScreen = worldToScreen;
    this.isInViewport = isInViewport;
    this.gradientCache = gradientCache;
    this.particlePool = particlePool;

    // Rendering constants
    this.pixelSize = 4; // Pixelated segment size
    this.headOffsetDistance = 10; // Pixels to move head forward
    this.boostPixelSize = 8; // Pixelated boost effect size
    this.nameFontSize = isMobile ? 11 : 14;

    // Performance metrics
    this.metrics = {
      drawCalls: 0,
      snakesDrawn: 0,
      segmentsDrawn: 0,
      segmentsCulled: 0,
      headsDrawn: 0,
      labelsDrawn: 0,
      trailsDrawn: 0
    };
  }

  /**
   * Check if this renderer should render
   * @param {Camera} camera - Camera instance
   * @returns {boolean} True if should render
   */
  shouldRender(camera) {
    return this.enabled;
  }

  /**
   * Render all snakes
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Snake>} snakes - Array of snake instances to render
   * @param {Camera} camera - Camera instance
   * @param {number} interpolation - Interpolation factor (0-1)
   */
  render(ctx, snakes, camera, interpolation = 0) {
    if (!ctx || !snakes || !camera) return;

    // Reset metrics
    this.metrics = {
      drawCalls: 0,
      snakesDrawn: 0,
      segmentsDrawn: 0,
      segmentsCulled: 0,
      headsDrawn: 0,
      labelsDrawn: 0,
      trailsDrawn: 0
    };

    // Render each snake
    for (const snake of snakes) {
      this._renderSnake(ctx, snake, camera, interpolation);
    }

    this.metrics.drawCalls = snakes.length;
  }

  /**
   * Render a single snake
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} snake - Snake instance
   * @param {Camera} camera - Camera instance
   * @param {number} interpolation - Interpolation factor (0-1)
   * @private
   */
  _renderSnake(ctx, snake, camera, interpolation) {
    if (!snake.alive && !snake.isDying) return;

    // Apply death animation effects
    if (snake.isDying) {
      ctx.save();

      // Flash effect during death
      if (snake.deathFlashPhase > 0) {
        ctx.globalAlpha = 0.5 + snake.deathFlashPhase * 0.5;
      }

      // Segment dispersal effect - early return if all segments gone
      if (snake.deathSegmentPhase > 0) {
        const visibleSegments = Math.floor(
          snake.segments.length * (1 - snake.deathSegmentPhase)
        );
        if (visibleSegments <= 0) {
          ctx.restore();
          return;
        }
      }
    }

    // Ensure size multiplier is always at least 1 to prevent invisibility
    const sizeMultiplier = Math.max(1, snake.size || 1);

    // Early viewport check for the whole snake (performance optimization)
    if (snake.segments.length > 0) {
      const margin = (this.isMobile ? 300 : 400) * sizeMultiplier;
      if (!this._isSnakeInViewport(snake, margin)) {
        if (snake.isDying) ctx.restore();
        return;
      }
    }

    // Explicit player visibility protection - AFTER viewport check
    if (snake.isPlayer) {
      ctx.save();
      ctx.globalAlpha = 1; // Force full opacity for player
    }

    // Draw boost trail effect (desktop only)
    if (!this.isMobile && snake.isBoosting && snake.segments && snake.segments.length > 1) {
      this._renderBoostTrail(ctx, snake, camera);
    }

    // Draw segments
    this._renderSegments(ctx, snake, camera, interpolation, sizeMultiplier);

    // Draw head
    if (snake.segments.length > 0) {
      this._renderHead(ctx, snake, camera, interpolation, sizeMultiplier);

      // Draw name label
      this._renderNameLabel(ctx, snake, camera, sizeMultiplier);

      // Draw crown if leader (but not in cozy mode)
      if (snake.isLeader && this.gameMode !== 'cozy') {
        this._renderCrown(ctx, snake, camera, sizeMultiplier);
      }

      // Draw boss skull (if applicable)
      if (snake.isBoss) {
        this._renderBossSkull(ctx, snake, camera, sizeMultiplier);
      }
    }

    // Restore death animation context
    if (snake.isDying) {
      ctx.restore();
    }

    // Restore context state for player
    if (snake.isPlayer) {
      ctx.restore();
    }

    this.metrics.snakesDrawn++;
  }

  /**
   * Check if snake is in viewport
   * @param {Object} snake - Snake instance
   * @param {number} margin - Margin for viewport check
   * @returns {boolean} True if any part of snake is visible
   * @private
   */
  _isSnakeInViewport(snake, margin) {
    // Quick check using head position first
    if (this.isInViewport && this.isInViewport(snake.x, snake.y, margin)) {
      return true;
    }

    // Check if any segment is visible (sample every 5th segment for performance)
    for (let i = 0; i < snake.segments.length; i += 5) {
      if (this.isInViewport && this.isInViewport(snake.segments[i].x, snake.segments[i].y, margin)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Render boost trail effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} snake - Snake instance
   * @param {Camera} camera - Camera instance
   * @private
   */
  _renderBoostTrail(ctx, snake, camera) {
    ctx.save();
    ctx.globalAlpha = 0.2; // Reduced opacity for subtler effect
    ctx.globalCompositeOperation = 'destination-over'; // Draw behind the snake

    const canvas = ctx.canvas;
    const zoom = camera.zoom || 1;

    // Draw speed lines
    for (let i = 0; i < 3; i++) {
      const segment = snake.segments[Math.min(i * 2, snake.segments.length - 1)];
      const nextSegment = snake.segments[Math.min(i * 2 + 5, snake.segments.length - 1)];

      // Convert to screen coordinates
      let screenX1, screenY1, screenX2, screenY2;

      if (this.worldToScreen) {
        const screen1 = this.worldToScreen(segment.x, segment.y);
        const screen2 = this.worldToScreen(nextSegment.x, nextSegment.y);
        screenX1 = screen1.x;
        screenY1 = screen1.y;
        screenX2 = screen2.x;
        screenY2 = screen2.y;
      } else {
        // Fallback: manual calculation
        screenX1 = segment.x - camera.x + canvas.width / 2;
        screenY1 = segment.y - camera.y + canvas.height / 2;
        screenX2 = nextSegment.x - camera.x + canvas.width / 2;
        screenY2 = nextSegment.y - camera.y + canvas.height / 2;
      }

      // Skip if any coordinate is invalid
      if (
        !isFinite(screenX1) ||
        !isFinite(screenY1) ||
        !isFinite(screenX2) ||
        !isFinite(screenY2)
      ) {
        continue;
      }

      // Create or use cached gradient
      const gradient = this._createBoostGradient(
        ctx,
        screenX1,
        screenY1,
        screenX2,
        screenY2,
        snake.isPlayer
      );

      ctx.strokeStyle = gradient;
      const baseWidth = this.segmentSize * zoom;
      ctx.lineWidth = Math.max(1, baseWidth * (1.5 - i * 0.3)); // Tapered effect
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(screenX1, screenY1);
      ctx.lineTo(screenX2, screenY2);
      ctx.stroke();
    }

    ctx.restore();
    this.metrics.trailsDrawn++;
  }

  /**
   * Create boost gradient (with optional caching)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x1 - Start X
   * @param {number} y1 - Start Y
   * @param {number} x2 - End X
   * @param {number} y2 - End Y
   * @param {boolean} isPlayer - Whether this is the player snake
   * @returns {CanvasGradient} Gradient
   * @private
   */
  _createBoostGradient(ctx, x1, y1, x2, y2, isPlayer) {
    // Use cached gradient if available
    if (this.gradientCache) {
      return this.gradientCache.getLinearGradient(x1, y1, x2, y2, [
        {
          offset: 0,
          color: isPlayer ? 'rgba(100, 200, 255, 0.4)' : 'rgba(255, 100, 100, 0.4)'
        },
        { offset: 1, color: 'rgba(255, 255, 255, 0)' }
      ]);
    }

    // Create gradient manually
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(
      0,
      isPlayer ? 'rgba(100, 200, 255, 0.4)' : 'rgba(255, 100, 100, 0.4)'
    );
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    return gradient;
  }

  /**
   * Render snake segments with progressive tapering
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} snake - Snake instance
   * @param {Camera} camera - Camera instance
   * @param {number} interpolation - Interpolation factor (0-1)
   * @param {number} sizeMultiplier - Size multiplier for this snake
   * @private
   */
  _renderSegments(ctx, snake, camera, interpolation, sizeMultiplier) {
    const canvas = ctx.canvas;
    const zoom = camera.zoom || 1;

    // Calculate how many segments to draw (reduced during death animation)
    let segmentsToDraw = snake.segments.length;
    if (snake.isDying && snake.deathSegmentPhase > 0) {
      segmentsToDraw = Math.floor(snake.segments.length * (1 - snake.deathSegmentPhase));
    }

    // Draw segments from tail to head
    for (let i = segmentsToDraw - 1; i >= 0; i--) {
      const segment = snake.segments[i];

      // Skip segments that have exploded during death (creates dissolving effect)
      if (snake.isDying && snake.deathSegmentPhase > 0) {
        if (Math.random() < snake.deathSegmentPhase * 0.3) continue;
      }

      // Interpolate position if previous position exists
      let x = segment.x;
      let y = segment.y;
      if (segment.prevX !== undefined && segment.prevY !== undefined) {
        x = segment.prevX + (segment.x - segment.prevX) * interpolation;
        y = segment.prevY + (segment.y - segment.prevY) * interpolation;
      }

      // Convert to screen coordinates
      let screenX, screenY;
      if (this.worldToScreen) {
        const screen = this.worldToScreen(x, y);
        screenX = screen.x;
        screenY = screen.y;
      } else {
        screenX = x - camera.x + canvas.width / 2;
        screenY = y - camera.y + canvas.height / 2;
      }

      // Skip if off-screen
      if (
        screenX < -50 ||
        screenX > canvas.width + 50 ||
        screenY < -50 ||
        screenY > canvas.height + 50
      ) {
        this.metrics.segmentsCulled++;
        continue;
      }

      // Get snake body color based on skin
      const skinData = this.skinMetadata[snake.skin];
      const colors = skinData ? skinData.colors : ['#4ecdc4', '#45b7aa'];
      ctx.fillStyle = colors[i % colors.length];

      // Calculate segment size with smooth tapering
      const baseSegmentSize = this.segmentSize * sizeMultiplier;
      const totalSegments = snake.segments.length;
      let segmentRadius;

      // Progressive tapering throughout the snake
      if (i < totalSegments * 0.7) {
        // First 70% of snake maintains mostly full size with very slight taper
        segmentRadius = baseSegmentSize * (1 - i * 0.001) * zoom;
      } else {
        // Last 30% tapers more aggressively
        const tailPosition = (i - totalSegments * 0.7) / (totalSegments * 0.3);
        // Use exponential curve for smoother taper
        const taperFactor = Math.pow(1 - tailPosition, 1.5);
        segmentRadius = baseSegmentSize * (0.8 * taperFactor + 0.2) * zoom;
      }

      // Calculate pixelated segment size
      const segmentPixels = Math.max(1, Math.floor((segmentRadius * 2) / this.pixelSize));

      // Skip drawing if segment would be invisible
      if (segmentPixels < 1) {
        this.metrics.segmentsCulled++;
        continue;
      }

      // Draw pixelated square segment
      const segmentX =
        Math.floor(screenX / this.pixelSize) * this.pixelSize -
        (segmentPixels * this.pixelSize) / 2;
      const segmentY =
        Math.floor(screenY / this.pixelSize) * this.pixelSize -
        (segmentPixels * this.pixelSize) / 2;
      const segmentSize = segmentPixels * this.pixelSize;

      ctx.fillRect(segmentX, segmentY, segmentSize, segmentSize);
      this.metrics.segmentsDrawn++;
    }
  }

  /**
   * Render snake head with sprite rotation
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} snake - Snake instance
   * @param {Camera} camera - Camera instance
   * @param {number} interpolation - Interpolation factor (0-1)
   * @param {number} sizeMultiplier - Size multiplier for this snake
   * @private
   */
  _renderHead(ctx, snake, camera, interpolation, sizeMultiplier) {
    const canvas = ctx.canvas;
    const zoom = camera.zoom || 1;
    const head = snake.segments[0];

    // Interpolate head position
    let headX = head.x;
    let headY = head.y;
    let angle = snake.angle;

    if (head.prevX !== undefined && head.prevY !== undefined) {
      headX = head.prevX + (head.x - head.prevX) * interpolation;
      headY = head.prevY + (head.y - head.prevY) * interpolation;
    }

    if (snake.prevAngle !== undefined) {
      // Handle angle wrapping for smooth interpolation
      let angleDiff = snake.angle - snake.prevAngle;
      while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      angle = snake.prevAngle + angleDiff * interpolation;
    }

    // Offset head position forward along the snake direction
    const offsetX = Math.cos(angle) * this.headOffsetDistance;
    const offsetY = Math.sin(angle) * this.headOffsetDistance;

    // Convert to screen coordinates
    let screenX, screenY;
    if (this.worldToScreen) {
      const screen = this.worldToScreen(headX + offsetX, headY + offsetY);
      screenX = screen.x;
      screenY = screen.y;
    } else {
      screenX = headX + offsetX - camera.x + canvas.width / 2;
      screenY = headY + offsetY - camera.y + canvas.height / 2;
    }

    // Draw boost glow around head (desktop only)
    if (snake.isBoosting && !this.isMobile) {
      this._renderBoostGlow(ctx, screenX, screenY, snake.isPlayer);
    }

    // Draw skin image
    const skinImage = this.skinImages[snake.skin];
    if (skinImage && skinImage.complete && !skinImage.error) {
      this._renderHeadSprite(ctx, skinImage, screenX, screenY, angle, sizeMultiplier, zoom);
    } else {
      // Fallback to emoji if image not loaded
      this._renderHeadEmoji(ctx, screenX, screenY, snake.isPlayer, sizeMultiplier, zoom);
    }

    this.metrics.headsDrawn++;
  }

  /**
   * Render boost glow around head
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {boolean} isPlayer - Whether this is the player snake
   * @private
   */
  _renderBoostGlow(ctx, screenX, screenY, isPlayer) {
    const boostColor = isPlayer
      ? 'rgba(100, 200, 255, 0.3)'
      : 'rgba(255, 100, 100, 0.3)';
    ctx.fillStyle = boostColor;

    // Draw pixelated glow pattern
    for (let px = -3; px <= 3; px++) {
      for (let py = -3; py <= 3; py++) {
        if (Math.abs(px) + Math.abs(py) <= 4) {
          ctx.fillRect(
            Math.floor((screenX + px * this.boostPixelSize) / this.boostPixelSize) *
              this.boostPixelSize,
            Math.floor((screenY + py * this.boostPixelSize) / this.boostPixelSize) *
              this.boostPixelSize,
            this.boostPixelSize,
            this.boostPixelSize
          );
        }
      }
    }
  }

  /**
   * Render head sprite with rotation
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLImageElement} skinImage - Skin image
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} angle - Rotation angle
   * @param {number} sizeMultiplier - Size multiplier
   * @param {number} zoom - Camera zoom
   * @private
   */
  _renderHeadSprite(ctx, skinImage, screenX, screenY, angle, sizeMultiplier, zoom) {
    try {
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(angle - Math.PI / 2); // Rotate 90 degrees counter-clockwise
      const size = this.segmentSize * sizeMultiplier * this.baseMultiplier * zoom;

      // Preserve aspect ratio
      const imgWidth = skinImage.naturalWidth || skinImage.width;
      const imgHeight = skinImage.naturalHeight || skinImage.height;

      if (imgWidth > 0 && imgHeight > 0) {
        const aspectRatio = imgWidth / imgHeight;
        let drawWidth = size;
        let drawHeight = size;

        if (aspectRatio > 1) {
          // Wider than tall
          drawHeight = size / aspectRatio;
        } else if (aspectRatio < 1) {
          // Taller than wide
          drawWidth = size * aspectRatio;
        }

        ctx.drawImage(skinImage, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      } else {
        // Fallback to square if dimensions not available
        ctx.drawImage(skinImage, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    } catch (e) {
      ctx.restore();
      // Fall through to emoji fallback
    }
  }

  /**
   * Render head emoji fallback
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {boolean} isPlayer - Whether this is the player snake
   * @param {number} sizeMultiplier - Size multiplier
   * @param {number} zoom - Camera zoom
   * @private
   */
  _renderHeadEmoji(ctx, screenX, screenY, isPlayer, sizeMultiplier, zoom) {
    if (!this.getCachedEmoji) return;

    const snakeEmojiSize = Math.round(
      this.segmentSize * sizeMultiplier * this.emojiMultiplier * zoom
    );
    const snakeEmojiCanvas = this.getCachedEmoji(isPlayer ? '😊' : '🐍', snakeEmojiSize);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(
      snakeEmojiCanvas,
      screenX - snakeEmojiCanvas.width / 2,
      screenY - snakeEmojiCanvas.height / 2
    );
    ctx.restore();
  }

  /**
   * Render name label with stroke and fill
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} snake - Snake instance
   * @param {Camera} camera - Camera instance
   * @param {number} sizeMultiplier - Size multiplier for this snake
   * @private
   */
  _renderNameLabel(ctx, snake, camera, sizeMultiplier) {
    const canvas = ctx.canvas;
    const zoom = camera.zoom || 1;
    const head = snake.segments[0];

    // Convert head position to screen coordinates
    let screenX, screenY;
    if (this.worldToScreen) {
      const screen = this.worldToScreen(head.x, head.y);
      screenX = screen.x;
      screenY = screen.y;
    } else {
      screenX = head.x - camera.x + canvas.width / 2;
      screenY = head.y - camera.y + canvas.height / 2;
    }

    ctx.font = `bold ${this.nameFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const nameY = screenY - this.segmentSize * zoom - 10;

    // Handle personality colors for AI snakes
    if (!snake.isPlayer && snake.personality) {
      // Get actual name without personality prefix
      const personalityName = snake.personality.name + ' ';
      const actualName = snake.name.substring(personalityName.length);

      // Draw only the actual name (no personality prefix)
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'white';
      ctx.strokeText(actualName, screenX, nameY);
      ctx.fillText(actualName, screenX, nameY);
    } else {
      // Player name or AI without personality - with invincibility effect
      if (snake.isPlayer && snake.invincibilityTimer > 0 && this.gameMode !== 'cozy') {
        this._renderInvincibleNameLabel(ctx, snake.name, screenX, nameY);
      } else {
        // Normal name rendering
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'white';
        ctx.strokeText(snake.name, screenX, nameY);
        ctx.fillText(snake.name, screenX, nameY);
      }
    }

    this.metrics.labelsDrawn++;
  }

  /**
   * Render invincible name label with golden effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} name - Snake name
   * @param {number} screenX - Screen X position
   * @param {number} nameY - Name Y position
   * @private
   */
  _renderInvincibleNameLabel(ctx, name, screenX, nameY) {
    ctx.save();

    // Draw thick golden outline
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeText(name, screenX, nameY);

    // Draw medium black stroke for contrast
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeText(name, screenX, nameY);

    // Draw fill text
    ctx.fillStyle = 'white';
    ctx.fillText(name, screenX, nameY);

    // Spawn sparkle particles occasionally
    if (Math.random() < 0.15 && this.particlePool) {
      const sparkleOffset = 20 + Math.random() * 10;
      const sparkleX = screenX + (Math.random() - 0.5) * 40;
      const sparkleY = nameY - sparkleOffset;
      const sparkleVx = (Math.random() - 0.5) * 1;
      const sparkleVy = -Math.random() * 2 - 1;
      this.particlePool.spawn(
        sparkleX,
        sparkleY,
        sparkleVx,
        sparkleVy,
        '#FFD700',
        2 + Math.random() * 2,
        'star',
        { fadeRate: 0.03, glow: true }
      );
    }

    ctx.restore();
  }

  /**
   * Render leader crown
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} snake - Snake instance
   * @param {Camera} camera - Camera instance
   * @param {number} sizeMultiplier - Size multiplier for this snake
   * @private
   */
  _renderCrown(ctx, snake, camera, sizeMultiplier) {
    if (!this.getCachedEmoji) return;

    const canvas = ctx.canvas;
    const zoom = camera.zoom || 1;
    const head = snake.segments[0];

    // Convert to screen coordinates
    let screenX, screenY;
    if (this.worldToScreen) {
      const screen = this.worldToScreen(head.x, head.y);
      screenX = screen.x;
      screenY = screen.y;
    } else {
      screenX = head.x - camera.x + canvas.width / 2;
      screenY = head.y - camera.y + canvas.height / 2;
    }

    const crownSize = 24;
    const crownCanvas = this.getCachedEmoji('👑', crownSize);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(
      crownCanvas,
      screenX - crownCanvas.width / 2,
      screenY - this.segmentSize * zoom - 45 - crownCanvas.height / 2
    );
    ctx.restore();
  }

  /**
   * Render boss skull
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} snake - Snake instance
   * @param {Camera} camera - Camera instance
   * @param {number} sizeMultiplier - Size multiplier for this snake
   * @private
   */
  _renderBossSkull(ctx, snake, camera, sizeMultiplier) {
    if (!this.getCachedEmoji) return;

    const canvas = ctx.canvas;
    const zoom = camera.zoom || 1;
    const head = snake.segments[0];

    // Convert to screen coordinates
    let screenX, screenY;
    if (this.worldToScreen) {
      const screen = this.worldToScreen(head.x, head.y);
      screenX = screen.x;
      screenY = screen.y;
    } else {
      screenX = head.x - camera.x + canvas.width / 2;
      screenY = head.y - camera.y + canvas.height / 2;
    }

    const skullSize = 32; // Larger than crown
    const skullCanvas = this.getCachedEmoji('💀', skullSize);
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(
      skullCanvas,
      screenX - skullCanvas.width / 2,
      screenY - this.segmentSize * zoom - 50 - skullCanvas.height / 2
    );
    ctx.restore();
  }

  /**
   * Get performance metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // No cleanup needed currently
  }
}
