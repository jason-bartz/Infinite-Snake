import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderPipeline } from '../../../src/systems/RenderPipeline.js';
import { RenderLayer } from '../../../src/systems/RenderLayer.js';

describe('RenderPipeline', () => {
  let pipeline;
  let mockCtx;
  let mockCamera;

  beforeEach(() => {
    mockCtx = {
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      clearRect: vi.fn()
    };

    mockCamera = {
      x: 0,
      y: 0,
      zoom: 1,
      isInViewport: vi.fn(() => true)
    };

    pipeline = new RenderPipeline(mockCtx);
  });

  describe('constructor', () => {
    it('should initialize with canvas context', () => {
      expect(pipeline.ctx).toBe(mockCtx);
    });

    it('should throw error if no context provided', () => {
      expect(() => new RenderPipeline()).toThrow('RenderPipeline requires a canvas context');
    });

    it('should initialize all render layers', () => {
      expect(pipeline.renderers.size).toBeGreaterThan(0);
      expect(pipeline.renderers.has(RenderLayer.BACKGROUND)).toBe(true);
      expect(pipeline.renderers.has(RenderLayer.ENTITIES)).toBe(true);
      expect(pipeline.renderers.has(RenderLayer.UI_OVERLAY)).toBe(true);
    });

    it('should initialize metrics', () => {
      expect(pipeline.metrics).toBeDefined();
      expect(pipeline.metrics.frameTime).toBe(0);
      expect(pipeline.metrics.drawCalls).toBe(0);
    });

    it('should be enabled by default', () => {
      expect(pipeline.enabled).toBe(true);
    });
  });

  describe('registerRenderer', () => {
    it('should register renderer to a layer', () => {
      const renderer = {
        name: 'TestRenderer',
        render: vi.fn()
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);

      const renderers = pipeline.getRenderersForLayer(RenderLayer.BACKGROUND);
      expect(renderers).toContain(renderer);
    });

    it('should return pipeline for chaining', () => {
      const renderer = { render: vi.fn() };
      const result = pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      expect(result).toBe(pipeline);
    });

    it('should auto-generate name if not provided', () => {
      const renderer = { render: vi.fn() };
      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      expect(renderer.name).toMatch(/Renderer_\d+_\d+/);
    });

    it('should throw error for invalid layer', () => {
      const renderer = { render: vi.fn() };
      expect(() => pipeline.registerRenderer(999, renderer)).toThrow('Invalid render layer');
    });

    it('should throw error if renderer has no render method', () => {
      const renderer = { name: 'Bad' };
      expect(() => pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer)).toThrow(
        'Renderer must have a render() method'
      );
    });

    it('should allow multiple renderers per layer', () => {
      const renderer1 = { render: vi.fn(), name: 'R1' };
      const renderer2 = { render: vi.fn(), name: 'R2' };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer1);
      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer2);

      const renderers = pipeline.getRenderersForLayer(RenderLayer.BACKGROUND);
      expect(renderers.length).toBe(2);
    });
  });

  describe('unregisterRenderer', () => {
    it('should remove renderer from its layer', () => {
      const renderer = { render: vi.fn(), name: 'Test' };
      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);

      const result = pipeline.unregisterRenderer(renderer);

      expect(result).toBe(true);
      expect(pipeline.getRenderersForLayer(RenderLayer.BACKGROUND)).not.toContain(renderer);
    });

    it('should return false if renderer not found', () => {
      const renderer = { render: vi.fn() };
      const result = pipeline.unregisterRenderer(renderer);
      expect(result).toBe(false);
    });
  });

  describe('getRenderersForLayer', () => {
    it('should return empty array for layer with no renderers', () => {
      const renderers = pipeline.getRenderersForLayer(RenderLayer.BACKGROUND);
      expect(renderers).toEqual([]);
    });

    it('should return all renderers for a layer', () => {
      const r1 = { render: vi.fn(), name: 'R1' };
      const r2 = { render: vi.fn(), name: 'R2' };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, r1);
      pipeline.registerRenderer(RenderLayer.BACKGROUND, r2);

      const renderers = pipeline.getRenderersForLayer(RenderLayer.BACKGROUND);
      expect(renderers).toEqual([r1, r2]);
    });
  });

  describe('render', () => {
    it('should call render on all registered renderers', () => {
      const r1 = { render: vi.fn(), name: 'R1' };
      const r2 = { render: vi.fn(), name: 'R2' };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, r1);
      pipeline.registerRenderer(RenderLayer.ENTITIES, r2);

      pipeline.render(mockCamera, 1.0);

      expect(r1.render).toHaveBeenCalledWith(mockCtx, mockCamera, 1.0, null);
      expect(r2.render).toHaveBeenCalledWith(mockCtx, mockCamera, 1.0, null);
    });

    it('should render layers in correct order', () => {
      const order = [];
      const r1 = {
        render: () => order.push('BACKGROUND'),
        name: 'Background'
      };
      const r2 = {
        render: () => order.push('ENTITIES'),
        name: 'Entities'
      };
      const r3 = {
        render: () => order.push('UI_OVERLAY'),
        name: 'UI'
      };

      pipeline.registerRenderer(RenderLayer.ENTITIES, r2);
      pipeline.registerRenderer(RenderLayer.UI_OVERLAY, r3);
      pipeline.registerRenderer(RenderLayer.BACKGROUND, r1);

      pipeline.render(mockCamera, 1.0);

      expect(order).toEqual(['BACKGROUND', 'ENTITIES', 'UI_OVERLAY']);
    });

    it('should skip disabled renderers', () => {
      const renderer = {
        render: vi.fn(),
        enabled: false,
        name: 'Disabled'
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.render(mockCamera, 1.0);

      expect(renderer.render).not.toHaveBeenCalled();
    });

    it('should check shouldRender if provided', () => {
      const renderer = {
        render: vi.fn(),
        shouldRender: vi.fn(() => false),
        name: 'Conditional'
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.render(mockCamera, 1.0);

      expect(renderer.shouldRender).toHaveBeenCalledWith(mockCamera, null);
      expect(renderer.render).not.toHaveBeenCalled();
    });

    it('should pass game state to renderers', () => {
      const gameState = { score: 100 };
      const renderer = { render: vi.fn(), name: 'Test' };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.render(mockCamera, 1.0, gameState);

      expect(renderer.render).toHaveBeenCalledWith(mockCtx, mockCamera, 1.0, gameState);
    });

    it('should not render if pipeline is disabled', () => {
      const renderer = { render: vi.fn(), name: 'Test' };
      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);

      pipeline.setEnabled(false);
      pipeline.render(mockCamera, 1.0);

      expect(renderer.render).not.toHaveBeenCalled();
    });

    it('should collect metrics if enabled', () => {
      const renderer = { render: vi.fn(), name: 'Test' };
      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.setMetricsEnabled(true);

      pipeline.render(mockCamera, 1.0);

      const metrics = pipeline.getMetrics();
      expect(metrics.frameTime).toBeGreaterThan(0);
    });

    it('should handle renderer errors gracefully', () => {
      const goodRenderer = { render: vi.fn(), name: 'Good' };
      const badRenderer = {
        render: () => {
          throw new Error('Renderer error');
        },
        name: 'Bad'
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, goodRenderer);
      pipeline.registerRenderer(RenderLayer.BACKGROUND, badRenderer);

      expect(() => pipeline.render(mockCamera, 1.0)).not.toThrow();
      expect(goodRenderer.render).toHaveBeenCalled();
    });

    it('should track renderer errors', () => {
      const badRenderer = {
        render: () => {
          throw new Error('Test error');
        },
        name: 'Bad'
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, badRenderer);
      pipeline.render(mockCamera, 1.0);

      const metrics = pipeline.getMetrics();
      expect(metrics.errors.length).toBe(1);
      expect(metrics.errors[0].renderer).toBe('Bad');
    });

    it('should disable renderer after max errors', () => {
      const badRenderer = {
        render: () => {
          throw new Error('Test error');
        },
        name: 'Bad'
      };

      pipeline.setMaxErrors(3);
      pipeline.registerRenderer(RenderLayer.BACKGROUND, badRenderer);

      // Trigger 3 errors
      pipeline.render(mockCamera, 1.0);
      pipeline.render(mockCamera, 1.0);
      pipeline.render(mockCamera, 1.0);

      expect(badRenderer.enabled).toBe(false);
    });

    it('should collect renderer metrics if provided', () => {
      const renderer = {
        render: vi.fn(),
        getMetrics: () => ({
          drawCalls: 5,
          culledEntities: 2,
          totalEntities: 10
        }),
        name: 'Test'
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.render(mockCamera, 1.0);

      const metrics = pipeline.getMetrics();
      expect(metrics.drawCalls).toBe(5);
      expect(metrics.culledEntities).toBe(2);
      expect(metrics.totalEntities).toBe(10);
    });
  });

  describe('getMetrics', () => {
    it('should return performance metrics', () => {
      const metrics = pipeline.getMetrics();

      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('layerTimes');
      expect(metrics).toHaveProperty('drawCalls');
      expect(metrics).toHaveProperty('culledEntities');
      expect(metrics).toHaveProperty('totalEntities');
      expect(metrics).toHaveProperty('cullingRate');
      expect(metrics).toHaveProperty('errors');
    });

    it('should calculate culling rate', () => {
      const renderer = {
        render: vi.fn(),
        getMetrics: () => ({
          culledEntities: 25,
          totalEntities: 100
        }),
        name: 'Test'
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.render(mockCamera, 1.0);

      const metrics = pipeline.getMetrics();
      expect(metrics.cullingRate).toBe(25);
    });

    it('should handle zero entities for culling rate', () => {
      pipeline.render(mockCamera, 1.0);
      const metrics = pipeline.getMetrics();
      expect(metrics.cullingRate).toBe(0);
    });
  });

  describe('resetMetrics', () => {
    it('should reset all metrics to zero', () => {
      const renderer = { render: vi.fn(), name: 'Test' };
      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.render(mockCamera, 1.0);

      pipeline.resetMetrics();

      const metrics = pipeline.getMetrics();
      expect(metrics.frameTime).toBe(0);
      expect(metrics.drawCalls).toBe(0);
      expect(metrics.culledEntities).toBe(0);
      expect(metrics.totalEntities).toBe(0);
      expect(metrics.errors.length).toBe(0);
    });

    it('should re-enable disabled renderers', () => {
      const renderer = {
        render: vi.fn(),
        enabled: false,
        name: 'Test'
      };

      pipeline.registerRenderer(RenderLayer.BACKGROUND, renderer);
      pipeline.resetMetrics();

      expect(renderer.enabled).toBe(true);
    });
  });

  describe('getRendererCount', () => {
    it('should return total renderer count', () => {
      expect(pipeline.getRendererCount()).toBe(0);

      pipeline.registerRenderer(RenderLayer.BACKGROUND, { render: vi.fn() });
      expect(pipeline.getRendererCount()).toBe(1);

      pipeline.registerRenderer(RenderLayer.ENTITIES, { render: vi.fn() });
      expect(pipeline.getRendererCount()).toBe(2);
    });
  });

  describe('clearLayer', () => {
    it('should remove all renderers from a layer', () => {
      pipeline.registerRenderer(RenderLayer.BACKGROUND, { render: vi.fn() });
      pipeline.registerRenderer(RenderLayer.BACKGROUND, { render: vi.fn() });

      pipeline.clearLayer(RenderLayer.BACKGROUND);

      expect(pipeline.getRenderersForLayer(RenderLayer.BACKGROUND).length).toBe(0);
    });

    it('should not affect other layers', () => {
      pipeline.registerRenderer(RenderLayer.BACKGROUND, { render: vi.fn() });
      pipeline.registerRenderer(RenderLayer.ENTITIES, { render: vi.fn() });

      pipeline.clearLayer(RenderLayer.BACKGROUND);

      expect(pipeline.getRenderersForLayer(RenderLayer.ENTITIES).length).toBe(1);
    });
  });

  describe('clearAllRenderers', () => {
    it('should remove all renderers from all layers', () => {
      pipeline.registerRenderer(RenderLayer.BACKGROUND, { render: vi.fn() });
      pipeline.registerRenderer(RenderLayer.ENTITIES, { render: vi.fn() });
      pipeline.registerRenderer(RenderLayer.UI_OVERLAY, { render: vi.fn() });

      pipeline.clearAllRenderers();

      expect(pipeline.getRendererCount()).toBe(0);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable pipeline', () => {
      pipeline.setEnabled(false);
      expect(pipeline.enabled).toBe(false);

      pipeline.setEnabled(true);
      expect(pipeline.enabled).toBe(true);
    });
  });

  describe('setMetricsEnabled', () => {
    it('should enable/disable metrics collection', () => {
      pipeline.setMetricsEnabled(false);
      expect(pipeline.config.enableMetrics).toBe(false);

      pipeline.setMetricsEnabled(true);
      expect(pipeline.config.enableMetrics).toBe(true);
    });
  });

  describe('setDebugMode', () => {
    it('should enable/disable debug mode', () => {
      pipeline.setDebugMode(true);
      expect(pipeline.config.debugMode).toBe(true);

      pipeline.setDebugMode(false);
      expect(pipeline.config.debugMode).toBe(false);
    });
  });

  describe('setMaxErrors', () => {
    it('should set maximum error count', () => {
      pipeline.setMaxErrors(5);
      expect(pipeline.config.maxErrorsPerRenderer).toBe(5);
    });

    it('should enforce minimum of 1', () => {
      pipeline.setMaxErrors(0);
      expect(pipeline.config.maxErrorsPerRenderer).toBe(1);

      pipeline.setMaxErrors(-5);
      expect(pipeline.config.maxErrorsPerRenderer).toBe(1);
    });
  });

  describe('getSummary', () => {
    it('should return pipeline summary', () => {
      pipeline.registerRenderer(RenderLayer.BACKGROUND, { render: vi.fn(), name: 'BG' });
      pipeline.registerRenderer(RenderLayer.ENTITIES, {
        render: vi.fn(),
        enabled: false,
        name: 'Entity'
      });

      const summary = pipeline.getSummary();

      expect(summary.enabled).toBe(true);
      expect(summary.totalRenderers).toBe(2);
      expect(summary.layers).toBeDefined();
      expect(summary.layers[RenderLayer.BACKGROUND].count).toBe(1);
      expect(summary.layers[RenderLayer.ENTITIES].disabled).toBe(1);
    });
  });

  describe('debug', () => {
    it('should log debug information', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      pipeline.debug();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
