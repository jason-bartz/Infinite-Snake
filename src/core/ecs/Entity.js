/**
 * Entity class for the ECS (Entity-Component-System) architecture.
 *
 * An Entity is a general-purpose object that represents a game object.
 * It is essentially a container for components and has a unique identifier.
 *
 * @class Entity
 * @example
 * const entity = new Entity();
 * entity
 *   .addComponent(new TransformComponent(x, y))
 *   .addComponent(new VelocityComponent(vx, vy))
 *   .addComponent(new RenderableComponent(sprite));
 */
class Entity {
  /**
   * Creates a new Entity instance.
   *
   * @param {string} [id] - Optional custom ID. If not provided, generates a UUID.
   */
  constructor(id) {
    /**
     * Unique identifier for this entity.
     * @type {string}
     */
    this.id = id || crypto.randomUUID();

    /**
     * Map of component instances keyed by component class name.
     * @type {Map<string, object>}
     */
    this.components = new Map();

    /**
     * Whether this entity is active.
     * Inactive entities are typically excluded from system processing.
     * @type {boolean}
     */
    this.active = true;
  }

  /**
   * Adds a component to this entity.
   * If a component of the same type exists, it will be replaced.
   *
   * @param {object} component - The component instance to add.
   * @returns {Entity} This entity for method chaining.
   *
   * @example
   * entity.addComponent(new TransformComponent(100, 200));
   */
  addComponent(component) {
    const componentName = component.constructor.name;
    this.components.set(componentName, component);
    return this;
  }

  /**
   * Retrieves a component from this entity by its class.
   *
   * @param {Function} ComponentClass - The component class to retrieve.
   * @returns {object|undefined} The component instance or undefined if not found.
   *
   * @example
   * const transform = entity.getComponent(TransformComponent);
   */
  getComponent(ComponentClass) {
    return this.components.get(ComponentClass.name);
  }

  /**
   * Checks if this entity has a component of the given class.
   *
   * @param {Function} ComponentClass - The component class to check.
   * @returns {boolean} True if the component exists, false otherwise.
   *
   * @example
   * if (entity.hasComponent(TransformComponent)) {
   *   // Entity has a transform component
   * }
   */
  hasComponent(ComponentClass) {
    return this.components.has(ComponentClass.name);
  }

  /**
   * Removes a component from this entity.
   *
   * @param {Function} ComponentClass - The component class to remove.
   * @returns {Entity} This entity for method chaining.
   *
   * @example
   * entity.removeComponent(VelocityComponent);
   */
  removeComponent(ComponentClass) {
    this.components.delete(ComponentClass.name);
    return this;
  }

  /**
   * Destroys this entity by marking it as inactive and clearing all components.
   * Destroyed entities should be removed from the ECS coordinator.
   *
   * @example
   * entity.destroy();
   */
  destroy() {
    this.active = false;
    this.components.clear();
  }
}

export { Entity };
