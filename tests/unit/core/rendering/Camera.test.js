import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Camera } from '../../../../src/core/rendering/Camera.js';

describe('Camera', () => {
  let camera;

  beforeEach(() => {
    camera = new Camera(0, 0, 1, 800, 600);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      const cam = new Camera();
      expect(cam.x).toBe(0);
      expect(cam.y).toBe(0);
      expect(cam.zoom).toBe(1);
      expect(cam.viewportWidth).toBe(800);
      expect(cam.viewportHeight).toBe(600);
    });

    it('should initialize with custom values', () => {
      const cam = new Camera(100, 200, 1.5, 1024, 768);
      expect(cam.x).toBe(100);
      expect(cam.y).toBe(200);
      expect(cam.zoom).toBe(1.5);
      expect(cam.viewportWidth).toBe(1024);
      expect(cam.viewportHeight).toBe(768);
    });

    it('should initialize target values equal to initial position', () => {
      const cam = new Camera(100, 200, 1.5);
      expect(cam.targetX).toBe(100);
      expect(cam.targetY).toBe(200);
      expect(cam.targetZoom).toBe(1.5);
    });

    it('should initialize shake values to zero', () => {
      expect(camera.shakeIntensity).toBe(0);
      expect(camera.shakeOffsetX).toBe(0);
      expect(camera.shakeOffsetY).toBe(0);
    });

    it('should initialize culling margins', () => {
      expect(camera.cullingMargins).toBeDefined();
      expect(camera.cullingMargins.default).toBe(100);
      expect(camera.cullingMargins.snake).toBe(200);
    });
  });

  describe('worldToScreen', () => {
    it('should convert world coordinates to screen coordinates', () => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1;

      const screen = camera.worldToScreen(0, 0);
      expect(screen.x).toBe(400); // viewportWidth / 2
      expect(screen.y).toBe(300); // viewportHeight / 2
    });

    it('should handle camera offset', () => {
      camera.x = 100;
      camera.y = 50;
      camera.zoom = 1;

      const screen = camera.worldToScreen(100, 50);
      expect(screen.x).toBe(400);
      expect(screen.y).toBe(300);
    });

    it('should handle zoom', () => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 2;

      const screen = camera.worldToScreen(100, 100);
      expect(screen.x).toBe(600); // 100 * 2 + 400
      expect(screen.y).toBe(500); // 100 * 2 + 300
    });

    it('should include camera shake offset', () => {
      camera.shakeOffsetX = 10;
      camera.shakeOffsetY = 5;

      const screen = camera.worldToScreen(0, 0);
      expect(screen.x).toBe(410);
      expect(screen.y).toBe(305);
    });
  });

  describe('screenToWorld', () => {
    it('should convert screen coordinates to world coordinates', () => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1;

      const world = camera.screenToWorld(400, 300);
      expect(world.x).toBeCloseTo(0);
      expect(world.y).toBeCloseTo(0);
    });

    it('should handle camera offset', () => {
      camera.x = 100;
      camera.y = 50;
      camera.zoom = 1;

      const world = camera.screenToWorld(400, 300);
      expect(world.x).toBeCloseTo(100);
      expect(world.y).toBeCloseTo(50);
    });

    it('should handle zoom', () => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 2;

      const world = camera.screenToWorld(600, 500);
      expect(world.x).toBeCloseTo(100);
      expect(world.y).toBeCloseTo(100);
    });

    it('should be inverse of worldToScreen', () => {
      camera.x = 50;
      camera.y = 75;
      camera.zoom = 1.5;

      const worldX = 123;
      const worldY = 456;

      const screen = camera.worldToScreen(worldX, worldY);
      const world = camera.screenToWorld(screen.x, screen.y);

      expect(world.x).toBeCloseTo(worldX);
      expect(world.y).toBeCloseTo(worldY);
    });
  });

  describe('isInViewport', () => {
    beforeEach(() => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1;
    });

    it('should return true for point at center', () => {
      expect(camera.isInViewport(0, 0)).toBe(true);
    });

    it('should return true for point within viewport', () => {
      expect(camera.isInViewport(100, 100)).toBe(true);
      expect(camera.isInViewport(-100, -100)).toBe(true);
    });

    it('should return false for point far outside viewport', () => {
      expect(camera.isInViewport(1000, 1000)).toBe(false);
      expect(camera.isInViewport(-1000, -1000)).toBe(false);
    });

    it('should use default margin', () => {
      // Point just outside viewport but within margin
      expect(camera.isInViewport(450, 0, 100)).toBe(true);
    });

    it('should use entity-specific margin', () => {
      // Snake has 200px margin
      expect(camera.isInViewport(500, 0, null, 'snake')).toBe(true);
      // Particle has 50px margin
      expect(camera.isInViewport(500, 0, null, 'particle')).toBe(false);
    });

    it('should respect explicit margin override', () => {
      expect(camera.isInViewport(450, 0, 200)).toBe(true);
      expect(camera.isInViewport(450, 0, 10)).toBe(false);
    });
  });

  describe('isRectInViewport', () => {
    beforeEach(() => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1;
    });

    it('should return true for rect at center', () => {
      expect(camera.isRectInViewport(0, 0, 50, 50)).toBe(true);
    });

    it('should return true for rect fully in viewport', () => {
      expect(camera.isRectInViewport(100, 100, 50, 50)).toBe(true);
    });

    it('should return true for rect partially in viewport', () => {
      expect(camera.isRectInViewport(450, 0, 200, 200)).toBe(true);
    });

    it('should return false for rect fully outside viewport', () => {
      expect(camera.isRectInViewport(1000, 1000, 50, 50)).toBe(false);
    });

    it('should respect margin', () => {
      expect(camera.isRectInViewport(500, 0, 50, 50, 200)).toBe(true);
      expect(camera.isRectInViewport(500, 0, 50, 50, 0)).toBe(false);
    });
  });

  describe('interpolate', () => {
    it('should interpolate position', () => {
      const entity = {
        previousX: 0,
        previousY: 0,
        x: 100,
        y: 100
      };

      const result = camera.interpolate(entity, 0.5);
      expect(result.x).toBe(50);
      expect(result.y).toBe(50);
    });

    it('should handle delta = 0', () => {
      const entity = {
        previousX: 0,
        previousY: 0,
        x: 100,
        y: 100
      };

      const result = camera.interpolate(entity, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle delta = 1', () => {
      const entity = {
        previousX: 0,
        previousY: 0,
        x: 100,
        y: 100
      };

      const result = camera.interpolate(entity, 1);
      expect(result.x).toBe(100);
      expect(result.y).toBe(100);
    });

    it('should interpolate angle if present', () => {
      const entity = {
        previousX: 0,
        previousY: 0,
        previousAngle: 0,
        x: 100,
        y: 100,
        angle: Math.PI / 2
      };

      const result = camera.interpolate(entity, 0.5);
      expect(result.angle).toBeCloseTo(Math.PI / 4);
    });

    it('should handle angle wrapping (shortest path)', () => {
      const entity = {
        previousX: 0,
        previousY: 0,
        previousAngle: Math.PI * 1.9,
        x: 100,
        y: 100,
        angle: Math.PI * 0.1
      };

      const result = camera.interpolate(entity, 0.5);
      // Should interpolate via 2π/0, not backwards through π
      // Result should be around 0 or 2π (same angle)
      const normalizedAngle = result.angle % (Math.PI * 2);
      expect(normalizedAngle).toBeCloseTo(0, 1); // Within 0.1 radians
    });
  });

  describe('follow', () => {
    it('should set target to entity position', () => {
      const target = { x: 100, y: 200 };
      camera.follow(target);

      expect(camera.targetX).toBe(100);
      expect(camera.targetY).toBe(200);
    });

    it('should snap immediately if requested', () => {
      const target = { x: 100, y: 200 };
      camera.follow(target, true);

      expect(camera.x).toBe(100);
      expect(camera.y).toBe(200);
    });

    it('should handle null target gracefully', () => {
      const oldX = camera.x;
      const oldY = camera.y;
      camera.follow(null);

      expect(camera.x).toBe(oldX);
      expect(camera.y).toBe(oldY);
    });
  });

  describe('setZoom', () => {
    it('should set target zoom', () => {
      camera.setZoom(2.0);
      expect(camera.targetZoom).toBe(2.0);
    });

    it('should snap immediately if requested', () => {
      camera.setZoom(2.0, true);
      expect(camera.zoom).toBe(2.0);
    });

    it('should clamp zoom to min 0.1', () => {
      camera.setZoom(0.01);
      expect(camera.targetZoom).toBe(0.1);
    });

    it('should clamp zoom to max 5.0', () => {
      camera.setZoom(10.0);
      expect(camera.targetZoom).toBe(5.0);
    });
  });

  describe('update', () => {
    it('should smooth camera position toward target', () => {
      camera.x = 0;
      camera.y = 0;
      camera.targetX = 100;
      camera.targetY = 100;
      camera.smoothing = 0.5;

      camera.update(16.67);

      expect(camera.x).toBeGreaterThan(0);
      expect(camera.x).toBeLessThan(100);
      expect(camera.y).toBeGreaterThan(0);
      expect(camera.y).toBeLessThan(100);
    });

    it('should smooth zoom toward target', () => {
      camera.zoom = 1.0;
      camera.targetZoom = 2.0;
      camera.smoothing = 0.5;

      camera.update(16.67);

      expect(camera.zoom).toBeGreaterThan(1.0);
      expect(camera.zoom).toBeLessThan(2.0);
    });

    it('should decay camera shake', () => {
      camera.shakeIntensity = 10;
      camera.update(16.67);

      expect(camera.shakeIntensity).toBeLessThan(10);
      expect(camera.shakeIntensity).toBeGreaterThan(0);
    });

    it('should clear shake when intensity is very low', () => {
      camera.shakeIntensity = 0.005;
      camera.update(16.67);

      expect(camera.shakeIntensity).toBe(0);
      expect(camera.shakeOffsetX).toBe(0);
      expect(camera.shakeOffsetY).toBe(0);
    });

    it('should apply bounds if set', () => {
      camera.setBounds(-100, 100, -100, 100);
      camera.targetX = 200;
      camera.targetY = 200;

      camera.update(16.67);

      expect(camera.x).toBeLessThanOrEqual(100);
      expect(camera.y).toBeLessThanOrEqual(100);
    });
  });

  describe('shake', () => {
    it('should set shake intensity', () => {
      camera.shake(15);
      expect(camera.shakeIntensity).toBe(15);
    });

    it('should use maximum intensity if called multiple times', () => {
      camera.shake(10);
      camera.shake(15);
      expect(camera.shakeIntensity).toBe(15);

      camera.shake(5);
      expect(camera.shakeIntensity).toBe(15); // Still 15
    });
  });

  describe('setViewport', () => {
    it('should update viewport dimensions', () => {
      camera.setViewport(1024, 768);
      expect(camera.viewportWidth).toBe(1024);
      expect(camera.viewportHeight).toBe(768);
    });
  });

  describe('setBounds', () => {
    it('should set camera bounds', () => {
      camera.setBounds(-100, 100, -200, 200);
      expect(camera.bounds).toEqual({
        minX: -100,
        maxX: 100,
        minY: -200,
        maxY: 200
      });
    });
  });

  describe('clearBounds', () => {
    it('should clear camera bounds', () => {
      camera.setBounds(-100, 100, -100, 100);
      camera.clearBounds();
      expect(camera.bounds).toBeNull();
    });
  });

  describe('setSmoothing', () => {
    it('should set smoothing factor', () => {
      camera.setSmoothing(0.3);
      expect(camera.smoothing).toBe(0.3);
    });

    it('should clamp smoothing to 0-1 range', () => {
      camera.setSmoothing(-0.5);
      expect(camera.smoothing).toBe(0);

      camera.setSmoothing(1.5);
      expect(camera.smoothing).toBe(1);
    });
  });

  describe('setCullingMargin', () => {
    it('should set entity-specific culling margin', () => {
      camera.setCullingMargin('custom', 300);
      expect(camera.cullingMargins.custom).toBe(300);
    });
  });

  describe('getViewportBounds', () => {
    it('should return viewport bounds in world coordinates', () => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 1;

      const bounds = camera.getViewportBounds();
      expect(bounds.minX).toBeCloseTo(-400);
      expect(bounds.maxX).toBeCloseTo(400);
      expect(bounds.minY).toBeCloseTo(-300);
      expect(bounds.maxY).toBeCloseTo(300);
    });

    it('should account for zoom', () => {
      camera.x = 0;
      camera.y = 0;
      camera.zoom = 2;

      const bounds = camera.getViewportBounds();
      expect(bounds.minX).toBeCloseTo(-200);
      expect(bounds.maxX).toBeCloseTo(200);
      expect(bounds.minY).toBeCloseTo(-150);
      expect(bounds.maxY).toBeCloseTo(150);
    });
  });

  describe('reset', () => {
    it('should reset camera to default state', () => {
      camera.x = 100;
      camera.y = 200;
      camera.zoom = 2;
      camera.shakeIntensity = 10;

      camera.reset();

      expect(camera.x).toBe(0);
      expect(camera.y).toBe(0);
      expect(camera.zoom).toBe(1);
      expect(camera.targetX).toBe(0);
      expect(camera.targetY).toBe(0);
      expect(camera.targetZoom).toBe(1);
      expect(camera.shakeIntensity).toBe(0);
    });
  });

  describe('toJSON / fromJSON', () => {
    it('should serialize camera state', () => {
      camera.x = 100;
      camera.y = 200;
      camera.zoom = 1.5;
      camera.targetX = 110;
      camera.targetY = 210;
      camera.targetZoom = 1.6;
      camera.smoothing = 0.3;
      camera.setBounds(-100, 100, -100, 100);

      const json = camera.toJSON();

      expect(json.x).toBe(100);
      expect(json.y).toBe(200);
      expect(json.zoom).toBe(1.5);
      expect(json.targetX).toBe(110);
      expect(json.targetY).toBe(210);
      expect(json.targetZoom).toBe(1.6);
      expect(json.smoothing).toBe(0.3);
      expect(json.bounds).toEqual({
        minX: -100,
        maxX: 100,
        minY: -100,
        maxY: 100
      });
    });

    it('should deserialize camera state', () => {
      const state = {
        x: 100,
        y: 200,
        zoom: 1.5,
        targetX: 110,
        targetY: 210,
        targetZoom: 1.6,
        viewportWidth: 1024,
        viewportHeight: 768,
        smoothing: 0.3,
        bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 }
      };

      camera.fromJSON(state);

      expect(camera.x).toBe(100);
      expect(camera.y).toBe(200);
      expect(camera.zoom).toBe(1.5);
      expect(camera.targetX).toBe(110);
      expect(camera.targetY).toBe(210);
      expect(camera.targetZoom).toBe(1.6);
      expect(camera.viewportWidth).toBe(1024);
      expect(camera.viewportHeight).toBe(768);
      expect(camera.smoothing).toBe(0.3);
      expect(camera.bounds).toEqual(state.bounds);
    });

    it('should roundtrip state', () => {
      camera.x = 100;
      camera.y = 200;
      camera.zoom = 1.5;

      const json = camera.toJSON();
      const newCamera = new Camera();
      newCamera.fromJSON(json);

      expect(newCamera.x).toBe(camera.x);
      expect(newCamera.y).toBe(camera.y);
      expect(newCamera.zoom).toBe(camera.zoom);
    });
  });
});
