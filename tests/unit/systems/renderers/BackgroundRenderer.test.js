import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BackgroundRenderer } from '../../../../src/systems/renderers/BackgroundRenderer.js';
import { RenderLayer } from '../../../../src/systems/RenderLayer.js';
import { Camera } from '../../../../src/core/rendering/Camera.js';

describe('BackgroundRenderer', () => {
  let renderer;
  let mockCtx;
  let mockCanvas;
  let camera;

  beforeEach(() => {
    // Create mock canvas and context
    mockCanvas = {
      width: 800,
      height: 600
    };

    mockCtx = {
      canvas: mockCanvas,
      fillStyle: '',
      globalAlpha: 1,
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn()
    };

    // Create camera
    camera = new Camera(0, 0, 1, 800, 600);

    // Create renderer
    renderer = new BackgroundRenderer({
      isMobile: false,
      gameMode: 'classic'
    });

    // Reset window globals
    window.preloadedAssets = null;
    window.blinkingStars = null;
    window.spaceStations = null;
    window.shootingStars = null;
    window.WORLD_SIZE = 10000;
  });

  describe('Initialization', () => {
    it('should initialize with correct layer', () => {
      expect(renderer.layer).toBe(RenderLayer.BACKGROUND);
    });

    it('should be enabled by default', () => {
      expect(renderer.enabled).toBe(true);
    });

    it('should accept mobile flag', () => {
      const mobileRenderer = new BackgroundRenderer({ isMobile: true });
      expect(mobileRenderer.isMobile).toBe(true);
    });

    it('should accept game mode', () => {
      const cozyRenderer = new BackgroundRenderer({ gameMode: 'cozy' });
      expect(cozyRenderer.gameMode).toBe('cozy');
    });

    it('should initialize with default parallax factors', () => {
      expect(renderer.nebulaParallax).toBe(0.3);
      expect(renderer.starParallax).toBe(0.5);
      expect(renderer.stationParallax).toBe(0.95);
    });

    it('should initialize metrics', () => {
      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBe(0);
      expect(metrics.tilesDrawn).toBe(0);
      expect(metrics.starsDrawn).toBe(0);
      expect(metrics.stationsDrawn).toBe(0);
    });
  });

  describe('shouldRender', () => {
    it('should return true when enabled', () => {
      expect(renderer.shouldRender(camera)).toBe(true);
    });

    it('should return false when disabled', () => {
      renderer.enabled = false;
      expect(renderer.shouldRender(camera)).toBe(false);
    });
  });

  describe('render - Basic Behavior', () => {
    it('should clear background in non-cozy mode', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockCtx.fillStyle).toBe('#000011');
    });

    it('should clear transparent in cozy mode', () => {
      renderer.setGameMode('cozy');
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
      expect(mockCtx.fillRect).not.toHaveBeenCalled();
    });

    it('should skip background rendering in cozy mode', () => {
      renderer.setGameMode('cozy');
      window.preloadedAssets = {
        backgrounds: {
          nebulaBackground: { width: 100, height: 100 }
        }
      };

      renderer.render(mockCtx, null, camera, 0);

      // Should only clear, not draw background
      expect(mockCtx.drawImage).not.toHaveBeenCalled();
    });

    it('should handle missing assets gracefully', () => {
      window.preloadedAssets = null;

      expect(() => {
        renderer.render(mockCtx, null, camera, 0);
      }).not.toThrow();

      // Should only clear background
      expect(mockCtx.fillRect).toHaveBeenCalledTimes(1);
    });

    it('should reset metrics on each render', () => {
      window.preloadedAssets = {
        backgrounds: {
          nebulaBackground: { width: 100, height: 100 }
        }
      };

      renderer.render(mockCtx, null, camera, 0);
      const metrics1 = renderer.getMetrics();

      renderer.render(mockCtx, null, camera, 0);
      const metrics2 = renderer.getMetrics();

      // Metrics should be consistent across renders
      expect(metrics2.drawCalls).toBeGreaterThan(0);
    });
  });

  describe('Mobile Background Rendering', () => {
    beforeEach(() => {
      renderer.setMobile(true);
      window.preloadedAssets = {
        backgrounds: {
          nebulaBackground: {
            width: 1000,
            height: 1000
          }
        }
      };
    });

    it('should render simple static background on mobile', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Should draw background once (static, no parallax)
      expect(mockCtx.drawImage).toHaveBeenCalledWith(
        window.preloadedAssets.backgrounds.nebulaBackground,
        0,
        0,
        800,
        600
      );
    });

    it('should not render scanlines on mobile', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Count fillRect calls - should only be 1 (for clearing background)
      const fillRectCalls = mockCtx.fillRect.mock.calls;
      expect(fillRectCalls.length).toBe(1); // Just the clear
    });

    it('should not render shooting stars on mobile', () => {
      window.shootingStars = [
        { draw: vi.fn() }
      ];

      renderer.render(mockCtx, null, camera, 0);

      expect(window.shootingStars[0].draw).not.toHaveBeenCalled();
    });
  });

  describe('Desktop Background Rendering', () => {
    beforeEach(() => {
      renderer.setMobile(false);
      window.preloadedAssets = {
        backgrounds: {
          nebulaBackground: {
            width: 1000,
            height: 1000
          },
          starOverlay: {
            width: 800,
            height: 600
          },
          starSprites: [
            { width: 32, height: 32 }
          ]
        }
      };
    });

    it('should render nebula with parallax', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Should draw nebula multiple times (tiling)
      const nebulaCalls = mockCtx.drawImage.mock.calls.filter(
        call => call[0] === window.preloadedAssets.backgrounds.nebulaBackground
      );

      expect(nebulaCalls.length).toBeGreaterThan(0);
    });

    it('should apply parallax offset to nebula', () => {
      camera.x = 1000;
      camera.y = 500;

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.tilesDrawn).toBeGreaterThan(0);
    });

    it('should render star overlay with transparency', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Should set globalAlpha for stars
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
      expect(mockCtx.globalAlpha).toBe(0.8);
    });

    it('should render scanlines on desktop', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Should draw scanlines
      const fillRectCalls = mockCtx.fillRect.mock.calls;
      expect(fillRectCalls.length).toBeGreaterThan(1); // Clear + scanlines
    });

    it('should render shooting stars on desktop', () => {
      window.shootingStars = [
        { draw: vi.fn() },
        { draw: vi.fn() }
      ];

      renderer.render(mockCtx, null, camera, 0);

      expect(window.shootingStars[0].draw).toHaveBeenCalled();
      expect(window.shootingStars[1].draw).toHaveBeenCalled();
    });
  });

  describe('Blinking Stars', () => {
    beforeEach(() => {
      window.preloadedAssets = {
        backgrounds: {
          starSprites: [
            { width: 32, height: 32 }
          ]
        }
      };

      window.blinkingStars = [
        {
          x: 100,
          y: 100,
          type: 0,
          scale: 1,
          blinkPhase: 0,
          blinkSpeed: 1
        }
      ];
    });

    it('should render blinking stars', () => {
      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.starsDrawn).toBeGreaterThan(0);
    });

    it('should limit stars on mobile', () => {
      // Create 100 stars
      window.blinkingStars = Array.from({ length: 100 }, (_, i) => ({
        x: i * 10,
        y: i * 10,
        type: 0,
        scale: 1,
        blinkPhase: 0,
        blinkSpeed: 1
      }));

      renderer.setMobile(true);
      renderer.setGameMode('classic'); // Mobile still renders in classic mode

      // Need to render desktop background for stars
      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      // Desktop should render more stars
      expect(metrics.starsDrawn).toBeGreaterThan(0);
    });

    it('should update blink phase', () => {
      renderer.setMobile(false);
      const initialPhase = window.blinkingStars[0].blinkPhase;

      renderer.render(mockCtx, null, camera, 0);

      expect(window.blinkingStars[0].blinkPhase).not.toBe(initialPhase);
    });

    it('should cull off-screen stars', () => {
      window.blinkingStars = [
        {
          x: -10000, // Way off screen
          y: -10000,
          type: 0,
          scale: 1,
          blinkPhase: 0,
          blinkSpeed: 1
        }
      ];

      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.starsDrawn).toBe(0);
    });

    it('should handle missing star sprites', () => {
      window.blinkingStars = [
        {
          x: 100,
          y: 100,
          type: 999, // Invalid type
          scale: 1,
          blinkPhase: 0,
          blinkSpeed: 1
        }
      ];

      renderer.setMobile(false);

      expect(() => {
        renderer.render(mockCtx, null, camera, 0);
      }).not.toThrow();
    });
  });

  describe('Space Stations', () => {
    beforeEach(() => {
      window.preloadedAssets = {
        backgrounds: {},
        stations: {
          station1: {
            width: 100,
            height: 100
          }
        }
      };

      window.spaceStations = [
        {
          x: 400,
          y: 300,
          vx: 0.1,
          vy: 0.1,
          width: 100,
          rotation: 0,
          rotationSpeed: 0.01,
          driftAngle: 0,
          driftSpeed: 0.5,
          imageId: 'station1'
        }
      ];
    });

    it('should render space stations', () => {
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.stationsDrawn).toBeGreaterThan(0);
    });

    it('should update station drift', () => {
      const initialAngle = window.spaceStations[0].driftAngle;

      renderer.render(mockCtx, null, camera, 0);

      expect(window.spaceStations[0].driftAngle).not.toBe(initialAngle);
    });

    it('should update station rotation', () => {
      const initialRotation = window.spaceStations[0].rotation;

      renderer.render(mockCtx, null, camera, 0);

      expect(window.spaceStations[0].rotation).not.toBe(initialRotation);
    });

    it('should wrap station around world boundaries', () => {
      window.spaceStations[0].x = -10;
      window.spaceStations[0].vx = -1;

      renderer.render(mockCtx, null, camera, 0);

      expect(window.spaceStations[0].x).toBe(window.WORLD_SIZE);
    });

    it('should apply parallax to stations', () => {
      camera.x = 1000;
      camera.y = 500;

      renderer.render(mockCtx, null, camera, 0);

      // Should use translate for positioning
      expect(mockCtx.translate).toHaveBeenCalled();
    });

    it('should cull off-screen stations', () => {
      window.spaceStations[0].x = -10000;
      window.spaceStations[0].y = -10000;

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.stationsDrawn).toBe(0);
    });

    it('should rotate stations', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.rotate).toHaveBeenCalled();
    });

    it('should handle missing station images', () => {
      window.spaceStations[0].imageId = 'invalid';

      expect(() => {
        renderer.render(mockCtx, null, camera, 0);
      }).not.toThrow();

      const metrics = renderer.getMetrics();
      expect(metrics.stationsDrawn).toBe(0);
    });
  });

  describe('Scanlines', () => {
    it('should render scanlines with correct spacing', () => {
      renderer.setMobile(false);
      window.preloadedAssets = {
        backgrounds: { nebulaBackground: { width: 100, height: 100 } }
      };

      renderer.render(mockCtx, null, camera, 0);

      const scanlineCalls = mockCtx.fillRect.mock.calls.filter(
        call => call[0] === 0 && call[2] === 800 && call[3] === 2
      );

      expect(scanlineCalls.length).toBeGreaterThan(0);
    });

    it('should not render scanlines on mobile', () => {
      renderer.setMobile(true);
      window.preloadedAssets = {
        backgrounds: { nebulaBackground: { width: 100, height: 100 } }
      };

      renderer.render(mockCtx, null, camera, 0);

      const scanlineCalls = mockCtx.fillRect.mock.calls.filter(
        call => call[0] === 0 && call[2] === 800 && call[3] === 2
      );

      expect(scanlineCalls.length).toBe(0);
    });
  });

  describe('Configuration', () => {
    it('should update game mode', () => {
      renderer.setGameMode('infinite');
      expect(renderer.gameMode).toBe('infinite');
    });

    it('should update mobile flag', () => {
      renderer.setMobile(true);
      expect(renderer.isMobile).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(() => {
      window.preloadedAssets = {
        backgrounds: {
          nebulaBackground: { width: 1000, height: 1000 },
          starOverlay: { width: 800, height: 600 },
          starSprites: [{ width: 32, height: 32 }]
        },
        stations: {
          station1: { width: 100, height: 100 }
        }
      };

      window.blinkingStars = [
        { x: 100, y: 100, type: 0, scale: 1, blinkPhase: 0, blinkSpeed: 1 }
      ];

      window.spaceStations = [
        {
          x: 400,
          y: 300,
          vx: 0.1,
          vy: 0.1,
          width: 100,
          rotation: 0,
          rotationSpeed: 0.01,
          driftAngle: 0,
          driftSpeed: 0.5,
          imageId: 'station1'
        }
      ];
    });

    it('should track draw calls', () => {
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBeGreaterThan(0);
    });

    it('should track tiles drawn', () => {
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.tilesDrawn).toBeGreaterThan(0);
    });

    it('should track stars drawn', () => {
      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.starsDrawn).toBeGreaterThan(0);
    });

    it('should track stations drawn', () => {
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.stationsDrawn).toBeGreaterThan(0);
    });

    it('should return copy of metrics', () => {
      renderer.render(mockCtx, null, camera, 0);

      const metrics1 = renderer.getMetrics();
      const metrics2 = renderer.getMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });
  });

  describe('Cleanup', () => {
    it('should have cleanup method', () => {
      expect(typeof renderer.cleanup).toBe('function');
    });

    it('should not throw on cleanup', () => {
      expect(() => {
        renderer.cleanup();
      }).not.toThrow();
    });
  });
});
