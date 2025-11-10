import { RenderLayer } from '../RenderLayer.js';

/**
 * ElementRenderer - Renders all game elements (collectable orbs)
 *
 * Responsibilities:
 * - Render element emojis with pulsing animation
 * - Render element names below emojis
 * - Render combination glow effects (pending, alchemy vision)
 * - Render tier-based glow effects (desktop only)
 * - Render catalyst sparkles (desktop only)
 * - Handle mobile vs desktop rendering paths
 * - Handle batch rendering optimization (if available)
 * - Handle viewport culling
 * - Performance metrics tracking
 *
 * Layer: ENTITIES (4) - Same layer as snakes
 *
 * Extracted from: Element.draw() method (lines 5033-5219, ~186 lines)
 *
 * @class ElementRenderer
 */
export class ElementRenderer {
  /**
   * Create a new ElementRenderer
   * @param {Object} options - Configuration options
   * @param {boolean} options.isMobile - Mobile device flag
   * @param {number} options.elementSize - Base element size (default: 20)
   * @param {Function} options.getCachedEmoji - Function to get cached emoji canvas
   * @param {Function} options.worldToScreen - Function to convert world coords to screen
   * @param {Function} options.isInViewport - Function to check if position is in viewport
   * @param {Object} options.batchRenderer - Batch renderer for optimized emoji rendering (optional)
   * @param {boolean} options.useBatchRendering - Whether to use batch rendering (default: false)
   * @param {Object} options.elementLoader - Element loader for getting element data (optional)
   * @param {Object} options.combinations - Element combinations map (optional)
   * @param {Set} options.discoveredElements - Set of discovered element IDs (optional)
   * @param {boolean} options.alchemyVisionActive - Alchemy vision power-up active (default: false)
   * @param {Object} options.playerSnake - Player snake reference for alchemy vision (optional)
   */
  constructor({
    isMobile = false,
    elementSize = 20,
    getCachedEmoji = null,
    worldToScreen = null,
    isInViewport = null,
    batchRenderer = null,
    useBatchRendering = false,
    elementLoader = null,
    combinations = {},
    discoveredElements = new Set(),
    alchemyVisionActive = false,
    playerSnake = null
  } = {}) {
    this.layer = RenderLayer.ENTITIES;
    this.enabled = true;
    this.isMobile = isMobile;
    this.elementSize = elementSize;

    // Dependencies
    this.getCachedEmoji = getCachedEmoji;
    this.worldToScreen = worldToScreen;
    this.isInViewport = isInViewport;
    this.batchRenderer = batchRenderer;
    this.useBatchRendering = useBatchRendering;
    this.elementLoader = elementLoader;
    this.combinations = combinations;
    this.discoveredElements = discoveredElements;
    this.alchemyVisionActive = alchemyVisionActive;
    this.playerSnake = playerSnake;

    // Rendering constants
    this.baseEmojiSize = isMobile ? 35 : elementSize * 2;
    this.nameFontSize = isMobile ? 10 : 12;
    this.pixelSize = 6; // Pixelated glow effect size
    this.combiningPixelSize = 8; // Larger pixels for combining glow
    this.catalystSparkleCount = 4;
    this.catalystSparkleRadius = 3;

    // Performance metrics
    this.metrics = {
      drawCalls: 0,
      elementsDrawn: 0,
      elementsCulled: 0,
      glowsDrawn: 0,
      sparklesDrawn: 0,
      batchedEmojis: 0
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
   * Render all elements
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Element>} elements - Array of element instances to render
   * @param {Camera} camera - Camera instance
   */
  render(ctx, elements, camera) {
    if (!ctx || !elements || !camera) return;

    // Reset metrics
    this.metrics = {
      drawCalls: 0,
      elementsDrawn: 0,
      elementsCulled: 0,
      glowsDrawn: 0,
      sparklesDrawn: 0,
      batchedEmojis: 0
    };

    const zoom = camera.zoom || 1;

    // Start batch if using batch rendering
    if (this.useBatchRendering && this.batchRenderer) {
      this.batchRenderer.startFrame();
    }

    // Render each element
    for (const element of elements) {
      // Viewport culling
      if (
        this.isInViewport &&
        !this.isInViewport(element.x, element.y, this.elementSize + 50)
      ) {
        this.metrics.elementsCulled++;
        continue;
      }

      this._renderElement(ctx, element, camera, zoom);
    }

    // Flush batch if using batch rendering
    if (this.useBatchRendering && this.batchRenderer) {
      this.batchRenderer.flush();
    }

    this.metrics.drawCalls = elements.length - this.metrics.elementsCulled;
  }

  /**
   * Render a single element
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Element instance
   * @param {Camera} camera - Camera instance
   * @param {number} zoom - Camera zoom level
   * @private
   */
  _renderElement(ctx, element, camera, zoom) {
    const canvas = ctx.canvas;

    // Convert to screen coordinates
    let screenX, screenY;
    if (this.worldToScreen) {
      const screen = this.worldToScreen(element.x, element.y);
      screenX = screen.x;
      screenY = screen.y;
    } else {
      screenX = element.x - camera.x + canvas.width / 2;
      screenY = element.y - camera.y + canvas.height / 2;
    }

    // Calculate scale with pulsing animation
    let scale = 1 + Math.sin(element.pulse || 0) * 0.1;

    // Add wobble effect if this element is about to combine
    if (element.pendingCombination) {
      element.combiningAnimation = (element.combiningAnimation || 0) + 0.15;
      const wobble = Math.sin(element.combiningAnimation * 3) * 0.1;
      scale = scale * (1 + wobble);
    }

    // Check for alchemy vision glow
    const alchemyGlow = this._checkAlchemyGlow(element);

    // Render glow effects (desktop only, not in batch mode)
    if (!this.isMobile && !this.useBatchRendering) {
      if (element.pendingCombination) {
        this._renderCombiningGlow(ctx, screenX, screenY);
      } else if (alchemyGlow === 'discovery') {
        this._renderAlchemyGlow(ctx, screenX, screenY, 'gold');
      } else if (alchemyGlow === 'known') {
        this._renderAlchemyGlow(ctx, screenX, screenY, 'green');
      } else if (element.data && element.data.tier > 0) {
        this._renderTierGlow(ctx, screenX, screenY, element.data.tier);
      }
    }

    // Render emoji
    if (this.useBatchRendering && this.batchRenderer) {
      // Batch render emoji
      const emojiSize = Math.round(this.baseEmojiSize * zoom * scale);
      const emoji = this._getElementEmoji(element);
      this.batchRenderer.queueEmoji(emoji, element.x, element.y, emojiSize);
      this.metrics.batchedEmojis++;
    } else {
      // Direct render emoji
      this._renderEmoji(ctx, element, screenX, screenY, zoom, scale);
    }

    // Render element name
    this._renderElementName(ctx, element, screenX, screenY, zoom);

    // Render catalyst sparkles (desktop only)
    if (element.isCatalystSpawned && !this.isMobile) {
      this._renderCatalystSparkles(ctx, element, screenX, screenY, zoom);
    }

    this.metrics.elementsDrawn++;
  }

  /**
   * Check if element should have alchemy vision glow
   * @param {Object} element - Element instance
   * @returns {string|null} 'discovery', 'known', or null
   * @private
   */
  _checkAlchemyGlow(element) {
    if (
      !this.alchemyVisionActive ||
      !this.playerSnake ||
      !this.playerSnake.alive ||
      !this.playerSnake.elements ||
      this.playerSnake.elements.length === 0
    ) {
      return null;
    }

    const tailElement = this.playerSnake.elements[this.playerSnake.elements.length - 1];
    const distance = Math.hypot(
      element.x - this.playerSnake.x,
      element.y - this.playerSnake.y
    );

    // Only show glows within 300 pixel radius
    if (distance > 300) return null;

    // Check if this element can combine with tail
    const combo1 = `${element.id}+${tailElement}`;
    const combo2 = `${tailElement}+${element.id}`;

    if (this.combinations[combo1] || this.combinations[combo2]) {
      const result = this.combinations[combo1] || this.combinations[combo2];
      // Check if this is a new discovery
      if (!this.discoveredElements.has(result)) {
        return 'discovery'; // Golden glow
      } else {
        return 'known'; // Green glow
      }
    }

    return null;
  }

  /**
   * Render combining glow effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @private
   */
  _renderCombiningGlow(ctx, screenX, screenY) {
    const pixelSize = this.combiningPixelSize;
    const glowIntensity = 0.3 + Math.sin(Date.now() * 0.005) * 0.3; // Pulsing glow
    ctx.fillStyle = `rgba(255, 215, 0, ${glowIntensity})`;

    // Draw larger pixelated glow pattern
    for (let px = -4; px <= 4; px++) {
      for (let py = -4; py <= 4; py++) {
        if (Math.abs(px) + Math.abs(py) <= 6) {
          ctx.fillRect(
            Math.floor((screenX + px * pixelSize) / pixelSize) * pixelSize,
            Math.floor((screenY + py * pixelSize) / pixelSize) * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }

    this.metrics.glowsDrawn++;
  }

  /**
   * Render alchemy vision glow effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {string} type - 'gold' for discovery, 'green' for known
   * @private
   */
  _renderAlchemyGlow(ctx, screenX, screenY, type) {
    const pixelSize = this.pixelSize;
    const size = type === 'gold' ? 4 : 3;
    const range = type === 'gold' ? 6 : 4;

    if (type === 'gold') {
      // Golden pixels for new discoveries
      ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    } else {
      // Green pixels for known combinations
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
    }

    for (let px = -size; px <= size; px++) {
      for (let py = -size; py <= size; py++) {
        if (Math.abs(px) + Math.abs(py) <= range) {
          ctx.fillRect(
            Math.floor((screenX + px * pixelSize) / pixelSize) * pixelSize,
            Math.floor((screenY + py * pixelSize) / pixelSize) * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }

    this.metrics.glowsDrawn++;
  }

  /**
   * Render tier-based glow effect
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} tier - Element tier
   * @private
   */
  _renderTierGlow(ctx, screenX, screenY, tier) {
    const pixelSize = this.pixelSize;
    const hue = (tier * 60) % 360;
    ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.4)`;

    for (let px = -2; px <= 2; px++) {
      for (let py = -2; py <= 2; py++) {
        if (Math.abs(px) + Math.abs(py) <= 3) {
          ctx.fillRect(
            Math.floor((screenX + px * pixelSize) / pixelSize) * pixelSize,
            Math.floor((screenY + py * pixelSize) / pixelSize) * pixelSize,
            pixelSize,
            pixelSize
          );
        }
      }
    }

    this.metrics.glowsDrawn++;
  }

  /**
   * Get element emoji
   * @param {Object} element - Element instance
   * @returns {string} Emoji string
   * @private
   */
  _getElementEmoji(element) {
    if (!element.data) return '❓';

    if (this.elementLoader) {
      const elemData = this.elementLoader.elements.get(element.id);
      const emojiId = element.data.base
        ? element.id
        : elemData?.e || element.id;
      return this.elementLoader.getEmojiForElement(element.id, emojiId);
    }

    return element.data.emoji || '❓';
  }

  /**
   * Render element emoji
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Element instance
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} zoom - Camera zoom
   * @param {number} scale - Element scale
   * @private
   */
  _renderEmoji(ctx, element, screenX, screenY, zoom, scale) {
    if (!this.getCachedEmoji) return;

    const emojiSize = Math.round(this.baseEmojiSize * zoom * scale);
    const emoji = this._getElementEmoji(element);
    const emojiCanvas = this.getCachedEmoji(emoji, emojiSize);

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.drawImage(
      emojiCanvas,
      screenX - emojiCanvas.width / 2,
      screenY - emojiCanvas.height / 2
    );
    ctx.restore();
  }

  /**
   * Render element name
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Element instance
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} zoom - Camera zoom
   * @private
   */
  _renderElementName(ctx, element, screenX, screenY, zoom) {
    ctx.font = `${this.nameFontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;

    const name = element.data ? element.data.name : 'Unknown';
    const nameY = screenY + this.elementSize * zoom + 5;

    ctx.strokeText(name, screenX, nameY);
    ctx.fillText(name, screenX, nameY);
  }

  /**
   * Render catalyst sparkles
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} element - Element instance
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} zoom - Camera zoom
   * @private
   */
  _renderCatalystSparkles(ctx, element, screenX, screenY, zoom) {
    ctx.save();

    const sparkleTime = element.catalystSparkleTime || 0;

    for (let i = 0; i < this.catalystSparkleCount; i++) {
      const angle = (sparkleTime + (i * Math.PI) / 2) % (Math.PI * 2);
      const dist =
        this.elementSize * zoom + 10 + Math.sin(sparkleTime * 2) * 5;
      const px = screenX + Math.cos(angle) * dist;
      const py = screenY + Math.sin(angle) * dist;

      ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
      ctx.beginPath();
      ctx.arc(px, py, this.catalystSparkleRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    this.metrics.sparklesDrawn++;
  }

  /**
   * Update alchemy vision state
   * @param {boolean} active - Whether alchemy vision is active
   */
  setAlchemyVision(active) {
    this.alchemyVisionActive = active;
  }

  /**
   * Update player snake reference
   * @param {Object} snake - Player snake instance
   */
  setPlayerSnake(snake) {
    this.playerSnake = snake;
  }

  /**
   * Update combinations map
   * @param {Object} combinations - Combinations map
   */
  setCombinations(combinations) {
    this.combinations = combinations;
  }

  /**
   * Update discovered elements set
   * @param {Set} discoveredElements - Set of discovered element IDs
   */
  setDiscoveredElements(discoveredElements) {
    this.discoveredElements = discoveredElements;
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
