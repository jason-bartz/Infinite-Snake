import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ElementRenderer } from '../../../../src/systems/renderers/ElementRenderer.js';
import { RenderLayer } from '../../../../src/systems/RenderLayer.js';
import { Camera } from '../../../../src/core/rendering/Camera.js';

describe('ElementRenderer', () => {
  let renderer;
  let mockCtx;
  let mockCanvas;
  let camera;
  let mockGetCachedEmoji;
  let mockWorldToScreen;
  let mockIsInViewport;
  let mockBatchRenderer;
  let mockElementLoader;
  let mockCombinations;
  let mockDiscoveredElements;
  let mockPlayerSnake;

  beforeEach(() => {
    // Mock canvas
    mockCanvas = { width: 800, height: 600 };

    // Mock context
    mockCtx = {
      canvas: mockCanvas,
      fillStyle: '',
      strokeStyle: '',
      globalAlpha: 1,
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn()
    };

    // Mock getCachedEmoji
    mockGetCachedEmoji = vi.fn((emoji, size) => ({
      width: size,
      height: size
    }));

    // Mock worldToScreen
    mockWorldToScreen = vi.fn((x, y) => ({ x: x + 400, y: y + 300 }));

    // Mock isInViewport
    mockIsInViewport = vi.fn(() => true);

    // Mock batch renderer
    mockBatchRenderer = {
      startFrame: vi.fn(),
      flush: vi.fn(),
      queueEmoji: vi.fn()
    };

    // Mock element loader
    mockElementLoader = {
      elements: new Map([
        [1, { e: 1, n: 'Fire', t: 0 }],
        [2, { e: 2, n: 'Water', t: 0 }],
        [3, { e: 3, n: 'Steam', t: 1 }]
      ]),
      getEmojiForElement: vi.fn((id, emojiId) => {
        const emojis = { 1: '🔥', 2: '💧', 3: '💨' };
        return emojis[emojiId] || '❓';
      })
    };

    // Mock combinations
    mockCombinations = {
      '1+2': 3, // Fire + Water = Steam
      '2+1': 3  // Water + Fire = Steam
    };

    // Mock discovered elements
    mockDiscoveredElements = new Set([1, 2]);

    // Mock player snake
    mockPlayerSnake = {
      alive: true,
      x: 100,
      y: 100,
      elements: [1] // Has Fire in tail
    };

    // Create camera
    camera = new Camera(0, 0, 1, 800, 600);

    // Create renderer
    renderer = new ElementRenderer({
      isMobile: false,
      elementSize: 20,
      getCachedEmoji: mockGetCachedEmoji,
      worldToScreen: mockWorldToScreen,
      isInViewport: mockIsInViewport,
      batchRenderer: mockBatchRenderer,
      useBatchRendering: false,
      elementLoader: mockElementLoader,
      combinations: mockCombinations,
      discoveredElements: mockDiscoveredElements,
      alchemyVisionActive: false,
      playerSnake: mockPlayerSnake
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct layer', () => {
      expect(renderer.layer).toBe(RenderLayer.ENTITIES);
    });

    it('should initialize enabled', () => {
      expect(renderer.enabled).toBe(true);
    });

    it('should store isMobile flag', () => {
      expect(renderer.isMobile).toBe(false);
    });

    it('should store element size', () => {
      expect(renderer.elementSize).toBe(20);
    });

    it('should store dependencies', () => {
      expect(renderer.getCachedEmoji).toBe(mockGetCachedEmoji);
      expect(renderer.worldToScreen).toBe(mockWorldToScreen);
      expect(renderer.isInViewport).toBe(mockIsInViewport);
      expect(renderer.batchRenderer).toBe(mockBatchRenderer);
      expect(renderer.elementLoader).toBe(mockElementLoader);
    });

    it('should initialize with default values if not provided', () => {
      const defaultRenderer = new ElementRenderer();
      expect(defaultRenderer.isMobile).toBe(false);
      expect(defaultRenderer.elementSize).toBe(20);
      expect(defaultRenderer.useBatchRendering).toBe(false);
    });

    it('should initialize metrics to zero', () => {
      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBe(0);
      expect(metrics.elementsDrawn).toBe(0);
      expect(metrics.elementsCulled).toBe(0);
      expect(metrics.glowsDrawn).toBe(0);
      expect(metrics.sparklesDrawn).toBe(0);
      expect(metrics.batchedEmojis).toBe(0);
    });

    it('should set correct emoji size for mobile', () => {
      const mobileRenderer = new ElementRenderer({ isMobile: true });
      expect(mobileRenderer.baseEmojiSize).toBe(35);
    });

    it('should set correct emoji size for desktop', () => {
      expect(renderer.baseEmojiSize).toBe(40); // elementSize * 2
    });

    it('should set correct font size for mobile', () => {
      const mobileRenderer = new ElementRenderer({ isMobile: true });
      expect(mobileRenderer.nameFontSize).toBe(10);
    });

    it('should set correct font size for desktop', () => {
      expect(renderer.nameFontSize).toBe(12);
    });
  });

  describe('shouldRender', () => {
    it('should return true when enabled', () => {
      renderer.enabled = true;
      expect(renderer.shouldRender(camera)).toBe(true);
    });

    it('should return false when disabled', () => {
      renderer.enabled = false;
      expect(renderer.shouldRender(camera)).toBe(false);
    });
  });

  describe('render', () => {
    it('should handle null context', () => {
      expect(() => renderer.render(null, [], camera)).not.toThrow();
    });

    it('should handle null elements array', () => {
      expect(() => renderer.render(mockCtx, null, camera)).not.toThrow();
    });

    it('should handle null camera', () => {
      expect(() => renderer.render(mockCtx, [], null)).not.toThrow();
    });

    it('should reset metrics on each render', () => {
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should render empty elements array', () => {
      renderer.render(mockCtx, [], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.elementsDrawn).toBe(0);
    });

    it('should render single element', () => {
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.elementsDrawn).toBe(1);
      expect(metrics.drawCalls).toBe(1);
    });

    it('should render multiple elements', () => {
      const elements = [createMockElement(), createMockElement(), createMockElement()];
      renderer.render(mockCtx, elements, camera);
      const metrics = renderer.getMetrics();
      expect(metrics.elementsDrawn).toBe(3);
      expect(metrics.drawCalls).toBe(3);
    });

    it('should not call batch renderer when disabled', () => {
      renderer.useBatchRendering = false;
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      expect(mockBatchRenderer.startFrame).not.toHaveBeenCalled();
      expect(mockBatchRenderer.flush).not.toHaveBeenCalled();
    });

    it('should call batch renderer when enabled', () => {
      renderer.useBatchRendering = true;
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      expect(mockBatchRenderer.startFrame).toHaveBeenCalled();
      expect(mockBatchRenderer.flush).toHaveBeenCalled();
    });
  });

  describe('Viewport Culling', () => {
    it('should cull elements off-screen', () => {
      mockIsInViewport.mockReturnValue(false);
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.elementsCulled).toBe(1);
      expect(metrics.elementsDrawn).toBe(0);
    });

    it('should render elements on-screen', () => {
      mockIsInViewport.mockReturnValue(true);
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.elementsCulled).toBe(0);
      expect(metrics.elementsDrawn).toBe(1);
    });

    it('should check viewport with correct margin', () => {
      const element = createMockElement({ x: 100, y: 200 });
      renderer.render(mockCtx, [element], camera);
      expect(mockIsInViewport).toHaveBeenCalledWith(100, 200, 70); // elementSize + 50
    });
  });

  describe('Element Rendering', () => {
    it('should render element emoji', () => {
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      expect(mockGetCachedEmoji).toHaveBeenCalled();
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    it('should render element name', () => {
      const element = createMockElement({ data: { name: 'Fire' } });
      renderer.render(mockCtx, [element], camera);
      expect(mockCtx.strokeText).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should use fallback emoji for unknown elements', () => {
      const element = createMockElement({ id: 999, data: null });
      renderer.render(mockCtx, [element], camera);
      expect(mockGetCachedEmoji).toHaveBeenCalledWith('❓', expect.any(Number));
    });

    it('should apply pulsing scale animation', () => {
      const element = createMockElement({ pulse: Math.PI / 2 }); // sin(π/2) = 1
      renderer.render(mockCtx, [element], camera);
      // Scale should be affected by pulse
      expect(mockGetCachedEmoji).toHaveBeenCalled();
    });

    it('should apply wobble animation for pending combination', () => {
      const element = createMockElement({
        pendingCombination: true,
        combiningAnimation: 0
      });
      renderer.render(mockCtx, [element], camera);
      expect(mockGetCachedEmoji).toHaveBeenCalled();
    });
  });

  describe('Glow Effects', () => {
    it('should not render glows on mobile', () => {
      const mobileRenderer = new ElementRenderer({
        isMobile: true,
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport
      });
      const element = createMockElement({ pendingCombination: true });
      mobileRenderer.render(mockCtx, [element], camera);
      const metrics = mobileRenderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(0);
    });

    it('should render combining glow on desktop', () => {
      const element = createMockElement({ pendingCombination: true });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(1);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should not render glows in batch mode', () => {
      renderer.useBatchRendering = true;
      const element = createMockElement({ pendingCombination: true });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(0);
    });

    it('should render tier glow for non-base elements', () => {
      const element = createMockElement({
        data: { tier: 2, name: 'Steam' }
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(1);
    });

    it('should not render tier glow for base elements', () => {
      const element = createMockElement({
        data: { tier: 0, name: 'Fire' }
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(0);
    });

    it('should render golden glow for undiscovered combinations', () => {
      renderer.alchemyVisionActive = true;
      renderer.discoveredElements = new Set([1, 2]); // Steam (3) not discovered
      const element = createMockElement({
        id: 2, // Water
        x: 100,
        y: 100,
        data: { name: 'Water', tier: 0 }
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(1);
    });

    it('should render green glow for known combinations', () => {
      renderer.alchemyVisionActive = true;
      renderer.discoveredElements = new Set([1, 2, 3]); // Steam (3) discovered
      const element = createMockElement({
        id: 2, // Water
        x: 100,
        y: 100,
        data: { name: 'Water', tier: 0 }
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(1);
    });

    it('should not render alchemy glow when too far from player', () => {
      renderer.alchemyVisionActive = true;
      const element = createMockElement({
        id: 2, // Water
        x: 1000, // Far from player at (100, 100)
        y: 1000,
        data: { name: 'Water', tier: 0 }
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(0);
    });

    it('should not render alchemy glow when vision inactive', () => {
      renderer.alchemyVisionActive = false;
      const element = createMockElement({
        id: 2,
        x: 100,
        y: 100,
        data: { name: 'Water', tier: 0 }
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(0);
    });

    it('should not render alchemy glow when player dead', () => {
      renderer.alchemyVisionActive = true;
      renderer.playerSnake.alive = false;
      const element = createMockElement({
        id: 2,
        x: 100,
        y: 100,
        data: { name: 'Water', tier: 0 }
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.glowsDrawn).toBe(0);
    });
  });

  describe('Catalyst Sparkles', () => {
    it('should not render sparkles on mobile', () => {
      const mobileRenderer = new ElementRenderer({
        isMobile: true,
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport
      });
      const element = createMockElement({ isCatalystSpawned: true });
      mobileRenderer.render(mockCtx, [element], camera);
      const metrics = mobileRenderer.getMetrics();
      expect(metrics.sparklesDrawn).toBe(0);
    });

    it('should render sparkles on desktop', () => {
      const element = createMockElement({
        isCatalystSpawned: true,
        catalystSparkleTime: 1.0
      });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.sparklesDrawn).toBe(1);
      expect(mockCtx.arc).toHaveBeenCalled();
    });

    it('should not render sparkles for non-catalyst elements', () => {
      const element = createMockElement({ isCatalystSpawned: false });
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.sparklesDrawn).toBe(0);
    });

    it('should render correct number of sparkles', () => {
      const element = createMockElement({
        isCatalystSpawned: true,
        catalystSparkleTime: 0
      });
      renderer.render(mockCtx, [element], camera);
      // Should call arc 4 times (one per sparkle)
      expect(mockCtx.arc).toHaveBeenCalledTimes(4);
    });
  });

  describe('Batch Rendering', () => {
    beforeEach(() => {
      renderer.useBatchRendering = true;
    });

    it('should queue emojis for batch rendering', () => {
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      expect(mockBatchRenderer.queueEmoji).toHaveBeenCalled();
      const metrics = renderer.getMetrics();
      expect(metrics.batchedEmojis).toBe(1);
    });

    it('should not draw emoji directly in batch mode', () => {
      const element = createMockElement();
      mockCtx.drawImage.mockClear();
      renderer.render(mockCtx, [element], camera);
      expect(mockCtx.drawImage).not.toHaveBeenCalled();
    });

    it('should still render names in batch mode', () => {
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      expect(mockCtx.fillText).toHaveBeenCalled();
    });
  });

  describe('State Updates', () => {
    it('should update alchemy vision state', () => {
      renderer.setAlchemyVision(true);
      expect(renderer.alchemyVisionActive).toBe(true);
    });

    it('should update player snake reference', () => {
      const newSnake = { alive: true, x: 200, y: 200, elements: [2] };
      renderer.setPlayerSnake(newSnake);
      expect(renderer.playerSnake).toBe(newSnake);
    });

    it('should update combinations map', () => {
      const newCombinations = { '3+4': 5 };
      renderer.setCombinations(newCombinations);
      expect(renderer.combinations).toBe(newCombinations);
    });

    it('should update discovered elements set', () => {
      const newDiscovered = new Set([1, 2, 3, 4]);
      renderer.setDiscoveredElements(newDiscovered);
      expect(renderer.discoveredElements).toBe(newDiscovered);
    });
  });

  describe('getMetrics', () => {
    it('should return copy of metrics', () => {
      const metrics1 = renderer.getMetrics();
      const metrics2 = renderer.getMetrics();
      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });

    it('should include all metric fields', () => {
      const metrics = renderer.getMetrics();
      expect(metrics).toHaveProperty('drawCalls');
      expect(metrics).toHaveProperty('elementsDrawn');
      expect(metrics).toHaveProperty('elementsCulled');
      expect(metrics).toHaveProperty('glowsDrawn');
      expect(metrics).toHaveProperty('sparklesDrawn');
      expect(metrics).toHaveProperty('batchedEmojis');
    });
  });

  describe('cleanup', () => {
    it('should not throw', () => {
      expect(() => renderer.cleanup()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle element without data', () => {
      const element = createMockElement({ data: null });
      expect(() => renderer.render(mockCtx, [element], camera)).not.toThrow();
    });

    it('should handle element without pulse', () => {
      const element = createMockElement({ pulse: undefined });
      expect(() => renderer.render(mockCtx, [element], camera)).not.toThrow();
    });

    it('should handle missing worldToScreen function', () => {
      const noFuncRenderer = new ElementRenderer({
        worldToScreen: null,
        isInViewport: mockIsInViewport,
        getCachedEmoji: mockGetCachedEmoji
      });
      const element = createMockElement();
      expect(() => noFuncRenderer.render(mockCtx, [element], camera)).not.toThrow();
    });

    it('should handle missing isInViewport function', () => {
      const noFuncRenderer = new ElementRenderer({
        worldToScreen: mockWorldToScreen,
        isInViewport: null,
        getCachedEmoji: mockGetCachedEmoji
      });
      const element = createMockElement();
      expect(() => noFuncRenderer.render(mockCtx, [element], camera)).not.toThrow();
    });

    it('should handle missing getCachedEmoji function', () => {
      const noFuncRenderer = new ElementRenderer({
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport,
        getCachedEmoji: null
      });
      const element = createMockElement();
      expect(() => noFuncRenderer.render(mockCtx, [element], camera)).not.toThrow();
    });

    it('should handle camera zoom', () => {
      camera.zoom = 2;
      const element = createMockElement();
      renderer.render(mockCtx, [element], camera);
      const metrics = renderer.getMetrics();
      expect(metrics.elementsDrawn).toBe(1);
    });

    it('should handle player with no elements', () => {
      renderer.alchemyVisionActive = true;
      renderer.playerSnake.elements = [];
      const element = createMockElement({ id: 2, x: 100, y: 100 });
      expect(() => renderer.render(mockCtx, [element], camera)).not.toThrow();
    });

    it('should handle null player snake', () => {
      renderer.alchemyVisionActive = true;
      renderer.playerSnake = null;
      const element = createMockElement({ id: 2, x: 100, y: 100 });
      expect(() => renderer.render(mockCtx, [element], camera)).not.toThrow();
    });
  });
});

// Helper Functions

/**
 * Create a mock element for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock element
 */
function createMockElement(overrides = {}) {
  return {
    id: 1,
    x: 0,
    y: 0,
    pulse: 0,
    isCatalystSpawned: false,
    catalystSparkleTime: 0,
    pendingCombination: false,
    combiningAnimation: 0,
    data: {
      emoji: '🔥',
      name: 'Fire',
      tier: 0,
      base: true
    },
    ...overrides
  };
}
