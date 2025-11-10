/**
 * GameLoop class implementing a fixed timestep game loop with interpolation.
 *
 * This implementation uses a fixed timestep for updates (for deterministic physics)
 * and variable timestep for rendering (for smooth visuals).
 *
 * Based on "Fix Your Timestep!" by Glenn Fiedler:
 * https://gafferongames.com/post/fix_your_timestep/
 *
 * @class GameLoop
 * @example
 * const gameLoop = new GameLoop(
 *   (deltaTime) => {
 *     // Update game logic
 *     coordinator.update(deltaTime);
 *   },
 *   (alpha) => {
 *     // Render with interpolation
 *     renderer.render(alpha);
 *   },
 *   60 // Target 60 FPS
 * );
 *
 * gameLoop.start();
 */
class GameLoop {
  /**
   * Creates a new GameLoop instance.
   *
   * @param {Function} updateCallback - Function called for each update tick. Receives deltaTime in seconds.
   * @param {Function} renderCallback - Function called for each render. Receives interpolation alpha (0-1).
   * @param {number} [targetFPS=60] - Target frames per second.
   */
  constructor(updateCallback, renderCallback, targetFPS = 60) {
    /**
     * Update callback function.
     * @type {Function}
     */
    this.update = updateCallback;

    /**
     * Render callback function.
     * @type {Function}
     */
    this.render = renderCallback;

    /**
     * Target frames per second.
     * @type {number}
     */
    this.targetFPS = targetFPS;

    /**
     * Fixed timestep in milliseconds.
     * @type {number}
     */
    this.timestep = 1000 / this.targetFPS;

    /**
     * Whether the loop is currently running.
     * @type {boolean}
     */
    this.running = false;

    /**
     * Whether the loop is currently paused.
     * @type {boolean}
     */
    this.paused = false;

    /**
     * Accumulated time delta.
     * @type {number}
     */
    this.delta = 0;

    /**
     * Last frame timestamp.
     * @type {number}
     */
    this.lastTime = 0;

    /**
     * Current FPS counter.
     * @type {number}
     */
    this.fps = 0;

    /**
     * Frame count for FPS calculation.
     * @type {number}
     */
    this.frameCount = 0;

    /**
     * Time of last FPS update.
     * @type {number}
     */
    this.lastFPSUpdate = 0;

    /**
     * Maximum delta time to prevent spiral of death (in seconds).
     * If a frame takes longer than this, updates will be capped.
     * @type {number}
     */
    this.maxDelta = 0.1;

    /**
     * Request animation frame ID for cancellation.
     * @type {number|null}
     */
    this.rafId = null;

    // Bind the loop method to this instance
    this.loop = this.loop.bind(this);
  }

  /**
   * Starts the game loop.
   *
   * @example
   * gameLoop.start();
   */
  start() {
    if (this.running) {
      return;
    }

    this.running = true;
    this.paused = false;
    this.delta = 0;
    this.lastTime = performance.now();
    this.lastFPSUpdate = this.lastTime;
    this.frameCount = 0;

    this.rafId = requestAnimationFrame(this.loop);
  }

  /**
   * Stops the game loop.
   *
   * @example
   * gameLoop.stop();
   */
  stop() {
    this.running = false;
    this.paused = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * Pauses the game loop.
   * Updates are paused, but rendering continues.
   *
   * @example
   * gameLoop.pause();
   */
  pause() {
    this.paused = true;
    this.delta = 0;
  }

  /**
   * Resumes the game loop from pause.
   *
   * @example
   * gameLoop.resume();
   */
  resume() {
    if (this.paused) {
      this.paused = false;
      this.delta = 0;
      this.lastTime = performance.now();
    }
  }

  /**
   * Sets the target FPS and recalculates timestep.
   *
   * @param {number} fps - New target FPS.
   *
   * @example
   * gameLoop.setTargetFPS(30);
   */
  setTargetFPS(fps) {
    this.targetFPS = fps;
    this.timestep = 1000 / fps;
  }

  /**
   * Main game loop implementation.
   * Uses fixed timestep for updates and variable timestep for rendering.
   *
   * @private
   * @param {number} currentTime - Current timestamp from requestAnimationFrame.
   */
  loop(currentTime) {
    if (!this.running) {
      return;
    }

    // Calculate frame time
    const frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.lastFPSUpdate >= 1000) {
      this.fps = Math.round(
        (this.frameCount * 1000) / (currentTime - this.lastFPSUpdate)
      );
      this.frameCount = 0;
      this.lastFPSUpdate = currentTime;
    }

    if (!this.paused) {
      // Cap frame time to prevent spiral of death
      const cappedFrameTime = Math.min(frameTime, this.maxDelta * 1000);
      this.delta += cappedFrameTime;

      // Fixed timestep updates
      while (this.delta >= this.timestep) {
        // Convert timestep from milliseconds to seconds for update callback
        this.update(this.timestep / 1000);
        this.delta -= this.timestep;
      }
    }

    // Calculate interpolation alpha for smooth rendering
    const alpha = this.delta / this.timestep;

    // Render with interpolation
    this.render(alpha);

    // Continue loop
    this.rafId = requestAnimationFrame(this.loop);
  }
}

export { GameLoop };
