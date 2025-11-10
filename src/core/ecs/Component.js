/**
 * Base Component class for the ECS (Entity-Component-System) architecture.
 *
 * Components are pure data containers that hold state.
 * They should not contain game logic - that belongs in Systems.
 *
 * @class Component
 * @example
 * class TransformComponent extends Component {
 *   constructor(x = 0, y = 0) {
 *     super();
 *     this.x = x;
 *     this.y = y;
 *     this.rotation = 0;
 *   }
 * }
 *
 * class VelocityComponent extends Component {
 *   constructor(vx = 0, vy = 0) {
 *     super();
 *     this.vx = vx;
 *     this.vy = vy;
 *   }
 * }
 */
class Component {
  /**
   * Creates a new Component instance.
   *
   * @constructor
   */
  constructor() {
    /**
     * The type of this component, derived from the class name.
     * Used for component identification and retrieval.
     * @type {string}
     */
    this.type = this.constructor.name;

    /**
     * Whether this component is currently enabled.
     * Disabled components may be skipped by systems.
     * @type {boolean}
     */
    this.enabled = true;
  }

  /**
   * Called when the component is added to an entity.
   * Override this method to implement initialization logic.
   *
   * @example
   * onInit() {
   *   this.startTime = Date.now();
   * }
   */
  onInit() {
    // Override in subclasses if needed
  }

  /**
   * Called when the component is removed from an entity.
   * Override this method to implement cleanup logic.
   *
   * @example
   * onDestroy() {
   *   this.cleanup();
   * }
   */
  onDestroy() {
    // Override in subclasses if needed
  }
}

export { Component };
