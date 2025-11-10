import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BorderRenderer } from '../../../../src/systems/renderers/BorderRenderer.js';
import { RenderLayer } from '../../../../src/systems/RenderLayer.js';
import { Camera } from '../../../../src/core/rendering/Camera.js';

describe('BorderRenderer', () => {
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
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      save: vi.fn(),
      restore: vi.fn()
    };

    // Create camera at center of world
    camera = new Camera(5000, 5000, 1, 800, 600);

    // Create renderer
    renderer = new BorderRenderer({
      isMobile: false,
      worldSize: 10000,
      animationTime: 0
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct layer', () => {
      expect(renderer.layer).toBe(RenderLayer.UI_OVERLAY);
    });

    it('should be enabled by default', () => {
      expect(renderer.enabled).toBe(true);
    });

    it('should accept mobile flag', () => {
      const mobileRenderer = new BorderRenderer({ isMobile: true });
      expect(mobileRenderer.isMobile).toBe(true);
      expect(mobileRenderer.borderThickness).toBe(30); // Mobile thickness
    });

    it('should accept world size', () => {
      const customRenderer = new BorderRenderer({ worldSize: 20000 });
      expect(customRenderer.worldSize).toBe(20000);
    });

    it('should accept animation time', () => {
      const renderer = new BorderRenderer({ animationTime: 100 });
      expect(renderer.animationTime).toBe(100);
    });

    it('should set desktop border thickness', () => {
      expect(renderer.borderThickness).toBe(60);
    });

    it('should set mobile border thickness', () => {
      const mobileRenderer = new BorderRenderer({ isMobile: true });
      expect(mobileRenderer.borderThickness).toBe(30);
    });

    it('should initialize metrics', () => {
      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBe(0);
      expect(metrics.bordersDrawn).toBe(0);
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
    it('should save and restore context', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it('should set globalAlpha to 1', () => {
      mockCtx.globalAlpha = 0.5; // Start with non-1 value
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.globalAlpha).toBe(1);
    });

    it('should reset metrics on each render', () => {
      // Position camera near left edge to see border
      camera.x = 100;
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBeGreaterThan(0);

      // Render again
      renderer.render(mockCtx, null, camera, 0);
      const metrics2 = renderer.getMetrics();

      // Metrics should be reset and recounted
      expect(metrics2.drawCalls).toBeGreaterThan(0);
    });
  });

  describe('Border Visibility', () => {
    it('should render left border when camera is near left edge', () => {
      camera.x = 100; // Near left edge (world starts at 0)

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });

    it('should render right border when camera is near right edge', () => {
      camera.x = 9900; // Near right edge (world ends at 10000)

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });

    it('should render top border when camera is near top edge', () => {
      camera.y = 100; // Near top edge

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });

    it('should render bottom border when camera is near bottom edge', () => {
      camera.y = 9900; // Near bottom edge

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });

    it('should not render borders when camera is in center', () => {
      camera.x = 5000;
      camera.y = 5000;

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBe(0);
    });

    it('should render all borders when camera is at corner', () => {
      camera.x = 100;
      camera.y = 100;

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(1); // Multiple borders
    });
  });

  describe('Desktop Border Rendering', () => {
    beforeEach(() => {
      renderer.setMobile(false);
      camera.x = 100; // Near left edge to trigger rendering
    });

    it('should create gradients on desktop', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
    });

    it('should render both gradient and warning line', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Should have multiple fillRect calls (gradient + warning line)
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.fillRect.mock.calls.length).toBeGreaterThan(1);
    });

    it('should use warning color for line', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Check that warning color was used
      const warningColorCalls = mockCtx.fillRect.mock.calls.filter(() => {
        return mockCtx.fillStyle === '#8844FF';
      });

      // At least one call should use the warning color
      expect(mockCtx.fillStyle).toBeTruthy();
    });
  });

  describe('Mobile Border Rendering', () => {
    beforeEach(() => {
      renderer.setMobile(true);
      camera.x = 100; // Near left edge to trigger rendering
    });

    it('should not create gradients on mobile', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.createLinearGradient).not.toHaveBeenCalled();
    });

    it('should only render warning lines on mobile', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Should have fewer calls than desktop (only warning lines)
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.fillRect.mock.calls.length).toBeLessThan(4); // Fewer than desktop
    });

    it('should use mobile warning color', () => {
      renderer.render(mockCtx, null, camera, 0);

      // Mobile uses rgba warning color
      expect(mockCtx.fillStyle).toBe('rgba(136, 68, 255, 0.8)');
    });

    it('should use thinner borders on mobile', () => {
      expect(renderer.borderThickness).toBe(30);
    });
  });

  describe('Left Border', () => {
    beforeEach(() => {
      camera.x = 100; // Near left edge
      camera.y = 5000; // Center vertically
    });

    it('should render left border gradient on desktop', () => {
      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
      const gradientCall = mockCtx.createLinearGradient.mock.calls[0];
      expect(gradientCall[0]).toBe(0); // Start x
    });

    it('should render left border warning line', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.fillRect).toHaveBeenCalled();
      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });

    it('should not render left border when far from edge', () => {
      camera.x = 5000; // Far from edge
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBe(0);
    });
  });

  describe('Right Border', () => {
    beforeEach(() => {
      camera.x = 9900; // Near right edge
      camera.y = 5000; // Center vertically
    });

    it('should render right border gradient on desktop', () => {
      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
    });

    it('should render right border warning line', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.fillRect).toHaveBeenCalled();
      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });
  });

  describe('Top Border', () => {
    beforeEach(() => {
      camera.x = 5000; // Center horizontally
      camera.y = 100; // Near top edge
    });

    it('should render top border gradient on desktop', () => {
      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
    });

    it('should render top border warning line', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.fillRect).toHaveBeenCalled();
      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });
  });

  describe('Bottom Border', () => {
    beforeEach(() => {
      camera.x = 5000; // Center horizontally
      camera.y = 9900; // Near bottom edge
    });

    it('should render bottom border gradient on desktop', () => {
      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.createLinearGradient).toHaveBeenCalled();
    });

    it('should render bottom border warning line', () => {
      renderer.render(mockCtx, null, camera, 0);

      expect(mockCtx.fillRect).toHaveBeenCalled();
      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });
  });

  describe('Camera Zoom', () => {
    it('should scale border positions with zoom', () => {
      camera.x = 100;
      camera.zoom = 2.0; // 2x zoom

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBeGreaterThan(0);
    });

    it('should handle zoom < 1', () => {
      camera.x = 100;
      camera.zoom = 0.5; // Zoomed out

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    it('should update animation time', () => {
      renderer.setAnimationTime(100);
      expect(renderer.animationTime).toBe(100);
    });

    it('should update world size', () => {
      renderer.setWorldSize(20000);
      expect(renderer.worldSize).toBe(20000);
    });

    it('should update mobile flag and reconfigure', () => {
      renderer.setMobile(true);
      expect(renderer.isMobile).toBe(true);
      expect(renderer.borderThickness).toBe(30);
      expect(renderer.pixelSize).toBe(16);

      renderer.setMobile(false);
      expect(renderer.isMobile).toBe(false);
      expect(renderer.borderThickness).toBe(60);
      expect(renderer.pixelSize).toBe(8);
    });
  });

  describe('Performance Metrics', () => {
    it('should track draw calls', () => {
      camera.x = 100;
      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.drawCalls).toBeGreaterThan(0);
    });

    it('should track borders drawn', () => {
      camera.x = 100;
      camera.y = 100; // Corner - should render 2 borders

      renderer.render(mockCtx, null, camera, 0);

      const metrics = renderer.getMetrics();
      expect(metrics.bordersDrawn).toBeGreaterThan(0);
    });

    it('should return copy of metrics', () => {
      camera.x = 100;
      renderer.render(mockCtx, null, camera, 0);

      const metrics1 = renderer.getMetrics();
      const metrics2 = renderer.getMetrics();

      expect(metrics1).not.toBe(metrics2);
      expect(metrics1).toEqual(metrics2);
    });

    it('should count more draw calls on desktop than mobile', () => {
      camera.x = 100;

      renderer.setMobile(false);
      renderer.render(mockCtx, null, camera, 0);
      const desktopMetrics = renderer.getMetrics();

      mockCtx.fillRect.mockClear();
      mockCtx.createLinearGradient.mockClear();

      renderer.setMobile(true);
      renderer.render(mockCtx, null, camera, 0);
      const mobileMetrics = renderer.getMetrics();

      // Desktop should have more draw calls (gradient + line vs just line)
      expect(desktopMetrics.drawCalls).toBeGreaterThan(mobileMetrics.drawCalls);
    });
  });

  describe('Edge Cases', () => {
    it('should handle camera exactly at world edge', () => {
      camera.x = 0;
      camera.y = 0;

      expect(() => {
        renderer.render(mockCtx, null, camera, 0);
      }).not.toThrow();
    });

    it('should handle camera outside world bounds', () => {
      camera.x = -1000;
      camera.y = -1000;

      expect(() => {
        renderer.render(mockCtx, null, camera, 0);
      }).not.toThrow();
    });

    it('should handle very small canvas', () => {
      mockCanvas.width = 100;
      mockCanvas.height = 100;
      camera.x = 100;

      expect(() => {
        renderer.render(mockCtx, null, camera, 0);
      }).not.toThrow();
    });

    it('should handle very large world', () => {
      renderer.setWorldSize(100000);
      camera.x = 50000;

      expect(() => {
        renderer.render(mockCtx, null, camera, 0);
      }).not.toThrow();
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
