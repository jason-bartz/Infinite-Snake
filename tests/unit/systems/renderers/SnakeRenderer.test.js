import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnakeRenderer } from '../../../../src/systems/renderers/SnakeRenderer.js';
import { RenderLayer } from '../../../../src/systems/RenderLayer.js';
import { Camera } from '../../../../src/core/rendering/Camera.js';

describe('SnakeRenderer', () => {
  let renderer;
  let mockCtx;
  let mockCanvas;
  let camera;
  let mockSkinImages;
  let mockSkinMetadata;
  let mockGetCachedEmoji;
  let mockWorldToScreen;
  let mockIsInViewport;
  let mockGradientCache;
  let mockParticlePool;

  beforeEach(() => {
    // Mock canvas
    mockCanvas = { width: 800, height: 600 };

    // Mock context
    mockCtx = {
      canvas: mockCanvas,
      fillStyle: '',
      strokeStyle: '',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      }))
    };

    // Mock skin images
    mockSkinImages = {
      default: {
        complete: true,
        error: false,
        width: 32,
        height: 32,
        naturalWidth: 32,
        naturalHeight: 32
      }
    };

    // Mock skin metadata
    mockSkinMetadata = {
      default: {
        colors: ['#4ecdc4', '#45b7aa']
      }
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

    // Mock gradient cache
    mockGradientCache = {
      getLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      }))
    };

    // Mock particle pool
    mockParticlePool = {
      spawn: vi.fn()
    };

    // Create camera
    camera = new Camera(0, 0, 1, 800, 600);

    // Create renderer
    renderer = new SnakeRenderer({
      isMobile: false,
      gameMode: 'classic',
      skinImages: mockSkinImages,
      skinMetadata: mockSkinMetadata,
      segmentSize: 10,
      baseMultiplier: 1.5,
      emojiMultiplier: 2.2,
      getCachedEmoji: mockGetCachedEmoji,
      worldToScreen: mockWorldToScreen,
      isInViewport: mockIsInViewport,
      gradientCache: mockGradientCache,
      particlePool: mockParticlePool
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

    it('should store gameMode', () => {
      expect(renderer.gameMode).toBe('classic');
    });

    it('should store dependencies', () => {
      expect(renderer.skinImages).toBe(mockSkinImages);
      expect(renderer.skinMetadata).toBe(mockSkinMetadata);
      expect(renderer.getCachedEmoji).toBe(mockGetCachedEmoji);
      expect(renderer.worldToScreen).toBe(mockWorldToScreen);
      expect(renderer.isInViewport).toBe(mockIsInViewport);
      expect(renderer.gradientCache).toBe(mockGradientCache);
      expect(renderer.particlePool).toBe(mockParticlePool);
    });

    it('should initialize with default values if not provided', () => {
      const defaultRenderer = new SnakeRenderer();
      expect(defaultRenderer.isMobile).toBe(false);
      expect(defaultRenderer.gameMode).toBe('classic');
      expect(defaultRenderer.skinImages).toEqual({});
      expect(defaultRenderer.skinMetadata).toEqual({});
    });

    it('should initialize metrics to zero', () => {
      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBe(0);
      expect(metrics.snakesDrawn).toBe(0);
      expect(metrics.segmentsDrawn).toBe(0);
      expect(metrics.segmentsCulled).toBe(0);
      expect(metrics.headsDrawn).toBe(0);
      expect(metrics.labelsDrawn).toBe(0);
      expect(metrics.trailsDrawn).toBe(0);
    });

    it('should set correct font size for mobile', () => {
      const mobileRenderer = new SnakeRenderer({ isMobile: true });
      expect(mobileRenderer.nameFontSize).toBe(11);
    });

    it('should set correct font size for desktop', () => {
      expect(renderer.nameFontSize).toBe(14);
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
      expect(() => renderer.render(null, [], camera, 0)).not.toThrow();
    });

    it('should handle null snakes array', () => {
      expect(() => renderer.render(mockCtx, null, camera, 0)).not.toThrow();
    });

    it('should handle null camera', () => {
      expect(() => renderer.render(mockCtx, [], null, 0)).not.toThrow();
    });

    it('should reset metrics on each render', () => {
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics).toBeDefined();
    });

    it('should render empty snake array', () => {
      renderer.render(mockCtx, [], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(0);
    });

    it('should render single snake', () => {
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
      expect(metrics.drawCalls).toBe(1);
    });

    it('should render multiple snakes', () => {
      const snakes = [createMockSnake(), createMockSnake(), createMockSnake()];
      renderer.render(mockCtx, snakes, camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(3);
      expect(metrics.drawCalls).toBe(3);
    });

    it('should skip dead snakes', () => {
      const snake = createMockSnake({ alive: false });
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(0);
    });

    it('should render dying snakes', () => {
      const snake = createMockSnake({ isDying: true, deathFlashPhase: 0.5 });
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });
  });

  describe('Viewport Culling', () => {
    it('should cull snakes completely off-screen', () => {
      mockIsInViewport.mockReturnValue(false);
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(0);
    });

    it('should render snakes partially on-screen', () => {
      mockIsInViewport.mockReturnValueOnce(false).mockReturnValueOnce(true);
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });

    it('should sample every 5th segment for viewport check', () => {
      mockIsInViewport.mockReturnValue(false);
      const snake = createMockSnake({ segments: createSegments(20) });
      renderer.render(mockCtx, [snake], camera, 0);
      // Should check head + every 5th segment (0, 5, 10, 15)
      expect(mockIsInViewport).toHaveBeenCalled();
    });
  });

  describe('Death Animation', () => {
    it('should apply death flash effect', () => {
      const snake = createMockSnake({ isDying: true, deathFlashPhase: 0.5 });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should skip rendering if all segments dispersed', () => {
      const snake = createMockSnake({ isDying: true, deathSegmentPhase: 1 });
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.segmentsDrawn).toBe(0);
    });

    it('should reduce visible segments during death', () => {
      const snake = createMockSnake({
        isDying: true,
        deathSegmentPhase: 0.5,
        segments: createSegments(10)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      // Should draw ~5 segments (50% remaining)
      const metrics = renderer.getMetrics();
      expect(metrics.segmentsDrawn).toBeGreaterThan(0);
      expect(metrics.segmentsDrawn).toBeLessThanOrEqual(5);
    });
  });

  describe('Segment Rendering', () => {
    it('should draw segments with correct color', () => {
      const snake = createMockSnake({
        skin: 'default',
        segments: createSegments(2)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should apply progressive tapering to segments', () => {
      const snake = createMockSnake({ segments: createSegments(10) });
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.segmentsDrawn).toBeGreaterThan(0);
    });

    it('should interpolate segment positions', () => {
      const snake = createMockSnake({
        segments: [
          { x: 0, y: 0, prevX: -10, prevY: -10 },
          { x: 10, y: 10, prevX: 0, prevY: 0 }
        ]
      });
      renderer.render(mockCtx, [snake], camera, 0.5);
      expect(mockWorldToScreen).toHaveBeenCalled();
    });

    it('should cull off-screen segments', () => {
      mockWorldToScreen.mockReturnValue({ x: -100, y: -100 });
      const snake = createMockSnake({ segments: createSegments(5) });
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.segmentsCulled).toBeGreaterThan(0);
    });

    it('should use skin colors for segments', () => {
      const snake = createMockSnake({
        skin: 'default',
        segments: createSegments(3)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.fillStyle).toBeTruthy();
    });

    it('should fallback to default colors if skin not found', () => {
      const snake = createMockSnake({
        skin: 'nonexistent',
        segments: createSegments(2)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });
  });

  describe('Head Rendering', () => {
    it('should render head sprite', () => {
      const snake = createMockSnake({ skin: 'default' });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.drawImage).toHaveBeenCalled();
      const metrics = renderer.getMetrics();
      expect(metrics.headsDrawn).toBe(1);
    });

    it('should rotate head sprite correctly', () => {
      const snake = createMockSnake({ angle: Math.PI / 2 });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.rotate).toHaveBeenCalled();
    });

    it('should interpolate head angle', () => {
      const snake = createMockSnake({
        angle: Math.PI,
        prevAngle: 0
      });
      renderer.render(mockCtx, [snake], camera, 0.5);
      expect(mockCtx.rotate).toHaveBeenCalled();
    });

    it('should handle angle wrapping for smooth interpolation', () => {
      const snake = createMockSnake({
        angle: 0.1,
        prevAngle: Math.PI * 2 - 0.1
      });
      renderer.render(mockCtx, [snake], camera, 0.5);
      expect(mockCtx.rotate).toHaveBeenCalled();
    });

    it('should offset head position forward', () => {
      const snake = createMockSnake({ angle: 0 });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockWorldToScreen).toHaveBeenCalled();
    });

    it('should fallback to emoji if skin not loaded', () => {
      const snake = createMockSnake({ skin: 'invalid' });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockGetCachedEmoji).toHaveBeenCalled();
    });

    it('should preserve sprite aspect ratio when wider than tall', () => {
      mockSkinImages.wide = {
        complete: true,
        error: false,
        width: 64,
        height: 32,
        naturalWidth: 64,
        naturalHeight: 32
      };
      const snake = createMockSnake({ skin: 'wide' });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });

    it('should preserve sprite aspect ratio when taller than wide', () => {
      mockSkinImages.tall = {
        complete: true,
        error: false,
        width: 32,
        height: 64,
        naturalWidth: 32,
        naturalHeight: 64
      };
      const snake = createMockSnake({ skin: 'tall' });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.drawImage).toHaveBeenCalled();
    });
  });

  describe('Boost Effects', () => {
    it('should not render boost trail on mobile', () => {
      const mobileRenderer = new SnakeRenderer({
        isMobile: true,
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport
      });
      const snake = createMockSnake({ isBoosting: true });
      mobileRenderer.render(mockCtx, [snake], camera, 0);
      const metrics = mobileRenderer.getMetrics();
      expect(metrics.trailsDrawn).toBe(0);
    });

    it('should render boost trail on desktop', () => {
      const snake = createMockSnake({
        isBoosting: true,
        segments: createSegments(10)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.trailsDrawn).toBe(1);
    });

    it('should use player color for player boost trail', () => {
      const snake = createMockSnake({
        isPlayer: true,
        isBoosting: true,
        segments: createSegments(10)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should use AI color for AI boost trail', () => {
      const snake = createMockSnake({
        isPlayer: false,
        isBoosting: true,
        segments: createSegments(10)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.stroke).toHaveBeenCalled();
    });

    it('should render boost glow around head on desktop', () => {
      const snake = createMockSnake({ isBoosting: true });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should not render boost glow on mobile', () => {
      const mobileRenderer = new SnakeRenderer({
        isMobile: true,
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport
      });
      const snake = createMockSnake({ isBoosting: true });
      const fillRectCount = mockCtx.fillRect.mock.calls.length;
      mobileRenderer.render(mockCtx, [snake], camera, 0);
      // Should not add extra fillRect calls for boost glow
      expect(mockCtx.fillRect).toHaveBeenCalled();
    });

    it('should use cached gradient for boost trail if available', () => {
      const snake = createMockSnake({
        isBoosting: true,
        segments: createSegments(10)
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockGradientCache.getLinearGradient).toHaveBeenCalled();
    });

    it('should create gradient manually if cache not available', () => {
      const noCacheRenderer = new SnakeRenderer({
        isMobile: false,
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport,
        gradientCache: null
      });
      const snake = createMockSnake({
        isBoosting: true,
        segments: createSegments(10)
      });
      noCacheRenderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
    });
  });

  describe('Name Label Rendering', () => {
    it('should render name label', () => {
      const snake = createMockSnake({ name: 'Test Snake' });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.strokeText).toHaveBeenCalled();
      expect(mockCtx.fillText).toHaveBeenCalled();
      const metrics = renderer.getMetrics();
      expect(metrics.labelsDrawn).toBe(1);
    });

    it('should render player name with normal style', () => {
      const snake = createMockSnake({
        isPlayer: true,
        name: 'You'
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should render AI name without personality prefix', () => {
      const snake = createMockSnake({
        isPlayer: false,
        name: 'Aggressive Snake',
        personality: { name: 'Aggressive' }
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should render invincibility effect for player', () => {
      const snake = createMockSnake({
        isPlayer: true,
        invincibilityTimer: 100,
        name: 'You'
      });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.strokeText).toHaveBeenCalled();
    });

    it('should not render invincibility effect in cozy mode', () => {
      const cozyRenderer = new SnakeRenderer({
        isMobile: false,
        gameMode: 'cozy',
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport
      });
      const snake = createMockSnake({
        isPlayer: true,
        invincibilityTimer: 100,
        name: 'You'
      });
      cozyRenderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.fillText).toHaveBeenCalled();
    });

    it('should spawn sparkle particles for invincible player', () => {
      const snake = createMockSnake({
        isPlayer: true,
        invincibilityTimer: 100,
        name: 'You'
      });
      // Run multiple times to increase chance of spawning
      for (let i = 0; i < 50; i++) {
        renderer.render(mockCtx, [snake], camera, 0);
      }
      // Should have spawned at least one particle (15% chance per render)
      expect(mockParticlePool.spawn).toHaveBeenCalled();
    });
  });

  describe('Leader Crown', () => {
    it('should render crown for leader', () => {
      const snake = createMockSnake({ isLeader: true });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockGetCachedEmoji).toHaveBeenCalledWith('👑', 24);
    });

    it('should not render crown for non-leader', () => {
      const snake = createMockSnake({ isLeader: false });
      mockGetCachedEmoji.mockClear();
      renderer.render(mockCtx, [snake], camera, 0);
      const crownCalls = mockGetCachedEmoji.mock.calls.filter(
        call => call[0] === '👑'
      );
      expect(crownCalls.length).toBe(0);
    });

    it('should not render crown in cozy mode', () => {
      const cozyRenderer = new SnakeRenderer({
        isMobile: false,
        gameMode: 'cozy',
        getCachedEmoji: mockGetCachedEmoji,
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport
      });
      const snake = createMockSnake({ isLeader: true });
      mockGetCachedEmoji.mockClear();
      cozyRenderer.render(mockCtx, [snake], camera, 0);
      const crownCalls = mockGetCachedEmoji.mock.calls.filter(
        call => call[0] === '👑'
      );
      expect(crownCalls.length).toBe(0);
    });
  });

  describe('Boss Skull', () => {
    it('should render skull for boss', () => {
      const snake = createMockSnake({ isBoss: true });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockGetCachedEmoji).toHaveBeenCalledWith('💀', 32);
    });

    it('should not render skull for non-boss', () => {
      const snake = createMockSnake({ isBoss: false });
      mockGetCachedEmoji.mockClear();
      renderer.render(mockCtx, [snake], camera, 0);
      const skullCalls = mockGetCachedEmoji.mock.calls.filter(
        call => call[0] === '💀'
      );
      expect(skullCalls.length).toBe(0);
    });
  });

  describe('Player Visibility Protection', () => {
    it('should force full opacity for player', () => {
      const snake = createMockSnake({ isPlayer: true });
      renderer.render(mockCtx, [snake], camera, 0);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should not force opacity for AI snakes', () => {
      const saveCount = mockCtx.save.mock.calls.length;
      const snake = createMockSnake({ isPlayer: false });
      renderer.render(mockCtx, [snake], camera, 0);
      // Should not add extra save calls for player protection
      expect(mockCtx.save.mock.calls.length).toBeGreaterThanOrEqual(saveCount);
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
      expect(metrics).toHaveProperty('snakesDrawn');
      expect(metrics).toHaveProperty('segmentsDrawn');
      expect(metrics).toHaveProperty('segmentsCulled');
      expect(metrics).toHaveProperty('headsDrawn');
      expect(metrics).toHaveProperty('labelsDrawn');
      expect(metrics).toHaveProperty('trailsDrawn');
    });
  });

  describe('cleanup', () => {
    it('should not throw', () => {
      expect(() => renderer.cleanup()).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle snake with no segments', () => {
      const snake = createMockSnake({ segments: [] });
      expect(() => renderer.render(mockCtx, [snake], camera, 0)).not.toThrow();
    });

    it('should handle snake with size of 0', () => {
      const snake = createMockSnake({ size: 0 });
      renderer.render(mockCtx, [snake], camera, 0);
      // Should force size to at least 1
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });

    it('should handle negative size', () => {
      const snake = createMockSnake({ size: -1 });
      renderer.render(mockCtx, [snake], camera, 0);
      // Should force size to at least 1
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });

    it('should handle missing worldToScreen function', () => {
      const noFuncRenderer = new SnakeRenderer({
        worldToScreen: null,
        isInViewport: mockIsInViewport
      });
      const snake = createMockSnake();
      expect(() => noFuncRenderer.render(mockCtx, [snake], camera, 0)).not.toThrow();
    });

    it('should handle missing isInViewport function', () => {
      const noFuncRenderer = new SnakeRenderer({
        worldToScreen: mockWorldToScreen,
        isInViewport: null
      });
      const snake = createMockSnake();
      expect(() => noFuncRenderer.render(mockCtx, [snake], camera, 0)).not.toThrow();
    });

    it('should handle missing getCachedEmoji function', () => {
      const noFuncRenderer = new SnakeRenderer({
        worldToScreen: mockWorldToScreen,
        isInViewport: mockIsInViewport,
        getCachedEmoji: null
      });
      const snake = createMockSnake({ skin: 'invalid' });
      expect(() => noFuncRenderer.render(mockCtx, [snake], camera, 0)).not.toThrow();
    });

    it('should handle camera zoom', () => {
      camera.zoom = 2;
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });

    it('should handle zero interpolation', () => {
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 0);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });

    it('should handle full interpolation', () => {
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 1);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });

    it('should handle partial interpolation', () => {
      const snake = createMockSnake();
      renderer.render(mockCtx, [snake], camera, 0.5);
      const metrics = renderer.getMetrics();
      expect(metrics.snakesDrawn).toBe(1);
    });
  });
});

// Helper Functions

/**
 * Create a mock snake for testing
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock snake
 */
function createMockSnake(overrides = {}) {
  return {
    alive: true,
    isDying: false,
    deathFlashPhase: 0,
    deathSegmentPhase: 0,
    x: 0,
    y: 0,
    angle: 0,
    prevAngle: 0,
    size: 1,
    isPlayer: false,
    isBoosting: false,
    name: 'Test',
    skin: 'default',
    invincibilityTimer: 0,
    isLeader: false,
    isBoss: false,
    personality: null,
    segments: createSegments(5),
    ...overrides
  };
}

/**
 * Create mock segments
 * @param {number} count - Number of segments
 * @returns {Array} Array of segment objects
 */
function createSegments(count) {
  const segments = [];
  for (let i = 0; i < count; i++) {
    segments.push({
      x: i * 10,
      y: 0,
      prevX: (i - 1) * 10,
      prevY: 0
    });
  }
  return segments;
}
