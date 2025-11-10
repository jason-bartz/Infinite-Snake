import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GameLoop } from '../../../src/core/GameLoop.js';

describe('GameLoop', () => {
  let gameLoop;
  let mockUpdate;
  let mockRender;
  let rafCallbacks;
  let rafId;
  let currentTime;

  beforeEach(() => {
    mockUpdate = vi.fn();
    mockRender = vi.fn();
    rafCallbacks = [];
    rafId = 0;
    currentTime = 0;

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((callback) => {
      rafCallbacks.push(callback);
      return ++rafId;
    });

    global.cancelAnimationFrame = vi.fn((id) => {
      // Simple implementation - just clear the callbacks
      rafCallbacks = [];
    });

    // Mock performance.now
    global.performance = {
      now: () => currentTime,
    };

    gameLoop = new GameLoop(mockUpdate, mockRender);
  });

  afterEach(() => {
    if (gameLoop && gameLoop.running) {
      gameLoop.stop();
    }
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should create a game loop with update and render callbacks', () => {
      expect(gameLoop.update).toBe(mockUpdate);
      expect(gameLoop.render).toBe(mockRender);
    });

    it('should initialize as not running', () => {
      expect(gameLoop.running).toBe(false);
    });

    it('should have default FPS of 60', () => {
      expect(gameLoop.targetFPS).toBe(60);
    });

    it('should calculate correct timestep from FPS', () => {
      expect(gameLoop.timestep).toBeCloseTo(1000 / 60, 2);
    });

    it('should allow custom FPS', () => {
      const customLoop = new GameLoop(mockUpdate, mockRender, 30);

      expect(customLoop.targetFPS).toBe(30);
      expect(customLoop.timestep).toBeCloseTo(1000 / 30, 2);
    });
  });

  describe('start and stop', () => {
    it('should start the game loop', () => {
      gameLoop.start();

      expect(gameLoop.running).toBe(true);
      expect(requestAnimationFrame).toHaveBeenCalled();
    });

    it('should stop the game loop', () => {
      gameLoop.start();
      gameLoop.stop();

      expect(gameLoop.running).toBe(false);
      expect(cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should not start if already running', () => {
      gameLoop.start();
      const callCount = requestAnimationFrame.mock.calls.length;

      // Try to start again
      gameLoop.start();

      // Should not call requestAnimationFrame again
      expect(requestAnimationFrame.mock.calls.length).toBe(callCount);
    });

    it('should reset delta accumulator on start', () => {
      gameLoop.delta = 1000;
      gameLoop.start();

      expect(gameLoop.delta).toBe(0);
    });
  });

  describe('update cycle', () => {
    it('should call update callback', () => {
      gameLoop.start();

      // Simulate one frame
      currentTime = 1000 / 60;
      rafCallbacks[0](currentTime);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should call update with deltaTime in seconds', () => {
      gameLoop.start();

      currentTime = 1000 / 60;
      rafCallbacks[0](currentTime);

      expect(mockUpdate).toHaveBeenCalledWith(expect.any(Number));

      const deltaTime = mockUpdate.mock.calls[0][0];
      // Delta time should be in seconds, approximately 1/60
      expect(deltaTime).toBeGreaterThan(0);
      expect(deltaTime).toBeLessThan(1);
    });

    it('should call render callback', () => {
      gameLoop.start();

      currentTime = 1000 / 60;
      rafCallbacks[0](currentTime);

      expect(mockRender).toHaveBeenCalled();
    });

    it('should call render with interpolation value', () => {
      gameLoop.start();

      currentTime = 1000 / 60;
      rafCallbacks[0](currentTime);

      expect(mockRender).toHaveBeenCalledWith(expect.any(Number));

      const alpha = mockRender.mock.calls[0][0];
      expect(alpha).toBeGreaterThanOrEqual(0);
      expect(alpha).toBeLessThanOrEqual(1);
    });

    it('should handle multiple updates in one frame if behind', () => {
      gameLoop.start();

      // Simulate a long frame (3x normal)
      currentTime = (1000 / 60) * 3;
      rafCallbacks[0](currentTime);

      // Update should be called multiple times to catch up
      expect(mockUpdate.mock.calls.length).toBeGreaterThan(1);
    });

    it('should cap delta time to prevent spiral of death', () => {
      gameLoop.start();

      // Simulate a very long frame (10 seconds)
      currentTime = 10000;
      rafCallbacks[0](currentTime);

      // Should cap at maxDelta (default 0.1 seconds = 100ms)
      // All calls should be capped
      mockUpdate.mock.calls.forEach((call) => {
        const deltaTime = call[0];
        expect(deltaTime).toBeLessThanOrEqual(gameLoop.timestep / 1000);
      });
    });
  });

  describe('pause and resume', () => {
    it('should pause the game loop', () => {
      gameLoop.start();
      gameLoop.pause();

      expect(gameLoop.paused).toBe(true);
      expect(gameLoop.running).toBe(true); // Still running, just paused
    });

    it('should not call update when paused', () => {
      gameLoop.start();
      gameLoop.pause();

      mockUpdate.mockClear();

      currentTime = 1000 / 60;
      rafCallbacks[rafCallbacks.length - 1](currentTime);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it('should still call render when paused', () => {
      gameLoop.start();
      gameLoop.pause();

      mockRender.mockClear();

      currentTime = 1000 / 60;
      rafCallbacks[rafCallbacks.length - 1](currentTime);

      expect(mockRender).toHaveBeenCalled();
    });

    it('should resume from pause', () => {
      gameLoop.start();
      gameLoop.pause();
      gameLoop.resume();

      expect(gameLoop.paused).toBe(false);

      mockUpdate.mockClear();
      currentTime += 1000 / 60;
      rafCallbacks[rafCallbacks.length - 1](currentTime);

      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should reset delta on resume to prevent jump', () => {
      gameLoop.start();
      gameLoop.pause();

      gameLoop.resume();

      // Delta should be reset
      expect(gameLoop.delta).toBe(0);
    });
  });

  describe('setTargetFPS', () => {
    it('should allow changing target FPS at runtime', () => {
      gameLoop.setTargetFPS(30);

      expect(gameLoop.targetFPS).toBe(30);
      expect(gameLoop.timestep).toBeCloseTo(1000 / 30, 2);
    });

    it('should update timestep when FPS changes', () => {
      const originalTimestep = gameLoop.timestep;

      gameLoop.setTargetFPS(120);

      expect(gameLoop.timestep).not.toBe(originalTimestep);
      expect(gameLoop.timestep).toBeCloseTo(1000 / 120, 2);
    });
  });

  describe('timestep accuracy', () => {
    it('should maintain consistent timestep', () => {
      gameLoop.start();

      const deltaTimesArray = [];

      mockUpdate.mockImplementation((deltaTime) => {
        deltaTimesArray.push(deltaTime);
      });

      // Run for multiple frames
      for (let i = 0; i < 5; i++) {
        currentTime += 1000 / 60;
        rafCallbacks[rafCallbacks.length - 1](currentTime);
      }

      // All delta times should be approximately equal
      const avgDelta = deltaTimesArray.reduce((a, b) => a + b, 0) / deltaTimesArray.length;
      deltaTimesArray.forEach((dt) => {
        expect(Math.abs(dt - avgDelta)).toBeLessThan(0.001);
      });
    });
  });

  describe('FPS tracking', () => {
    it('should track FPS over time', () => {
      gameLoop.start();

      // Run for just over 1 second
      for (let i = 0; i < 61; i++) {
        currentTime += 1000 / 60;
        rafCallbacks[rafCallbacks.length - 1](currentTime);
      }

      // FPS should be calculated after 1 second
      expect(gameLoop.fps).toBeGreaterThan(0);
    });
  });
});
