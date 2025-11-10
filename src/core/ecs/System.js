/**
 * Base System class for the ECS (Entity-Component-System) architecture.
 *
 * Systems contain the game logic and operate on entities that have
 * specific components. Each system processes entities during the update cycle.
 *
 * @class System
 * @example
 * class MovementSystem extends System {
 *   constructor() {
 *     super();
 *     this.requiredComponents = [TransformComponent, VelocityComponent];
 *   }
 *
 *   update(deltaTime) {
 *     this.entities.forEach((entity) => {
 *       const transform = entity.getComponent(TransformComponent);
 *       const velocity = entity.getComponent(VelocityComponent);
 *       transform.x += velocity.vx * deltaTime;
 *       transform.y += velocity.vy * deltaTime;
 *     });
 *   }
 * }
 */
class System {
  /**
   * Creates a new System instance.
   *
   * @constructor
   */
  constructor() {
    /**
     * Set of entities this system is processing.
     * Entities are automatically added/removed based on component matching.
     * @type {Set<Entity>}
     */
    this.entities = new Set();

    /**
     * Array of component classes required for an entity to be processed by this system.
     * Override this in subclasses to specify requirements.
     * @type {Array<Function>}
     */
    this.requiredComponents = [];

    /**
     * Whether this system is currently enabled.
     * Disabled systems are skipped during the update cycle.
     * @type {boolean}
     */
    this.enabled = true;

    /**
     * System execution priority. Higher priority systems run first.
     * @type {number}
     */
    this.priority = 0;
  }

  /**
   * Checks if an entity has all the required components for this system.
   *
   * @param {Entity} entity - The entity to check.
   * @returns {boolean} True if the entity matches, false otherwise.
   */
  matchesEntity(entity) {
    return this.requiredComponents.every((ComponentClass) =>
      entity.hasComponent(ComponentClass)
    );
  }

  /**
   * Registers an entity with this system.
   * The entity should have all required components before calling this.
   *
   * @param {Entity} entity - The entity to register.
   */
  registerEntity(entity) {
    this.entities.add(entity);
  }

  /**
   * Unregisters an entity from this system.
   *
   * @param {Entity} entity - The entity to unregister.
   */
  unregisterEntity(entity) {
    this.entities.delete(entity);
  }

  /**
   * Called once when the system is initialized.
   * Override this method to implement initialization logic.
   *
   * @example
   * onInit() {
   *   this.debugMode = false;
   *   console.log('System initialized');
   * }
   */
  onInit() {
    // Override in subclasses if needed
  }

  /**
   * Called every frame to update the system.
   * This is where the main system logic should be implemented.
   *
   * @param {number} deltaTime - Time elapsed since last update (in seconds).
   *
   * @example
   * update(deltaTime) {
   *   this.entities.forEach((entity) => {
   *     // Process entity
   *   });
   * }
   */
  update(deltaTime) {
    // Override in subclasses
  }

  /**
   * Called when the system is being destroyed.
   * Override this method to implement cleanup logic.
   *
   * @example
   * onDestroy() {
   *   this.entities.clear();
   *   console.log('System destroyed');
   * }
   */
  onDestroy() {
    // Override in subclasses if needed
  }
}

export { System };
