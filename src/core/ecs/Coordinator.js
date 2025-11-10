import { Entity } from './Entity.js';

/**
 * Coordinator class for the ECS (Entity-Component-System) architecture.
 *
 * The Coordinator is the central manager that handles:
 * - Entity lifecycle (creation, destruction)
 * - System registration and updates
 * - Automatic entity-system matching based on components
 *
 * @class Coordinator
 * @example
 * const coordinator = new Coordinator();
 *
 * // Register systems
 * coordinator.registerSystem(new MovementSystem());
 * coordinator.registerSystem(new RenderSystem());
 *
 * // Create entities
 * const player = coordinator.createEntity();
 * coordinator.addComponentToEntity(player.id, new TransformComponent(100, 100));
 * coordinator.addComponentToEntity(player.id, new VelocityComponent(5, 0));
 *
 * // Game loop
 * function gameLoop(deltaTime) {
 *   coordinator.update(deltaTime);
 * }
 */
class Coordinator {
  /**
   * Creates a new Coordinator instance.
   *
   * @constructor
   */
  constructor() {
    /**
     * Map of all entities keyed by entity ID.
     * @type {Map<string, Entity>}
     */
    this.entities = new Map();

    /**
     * Array of all registered systems, sorted by priority.
     * @type {Array<System>}
     */
    this.systems = [];
  }

  /**
   * Creates and registers a new entity.
   *
   * @param {string} [id] - Optional custom ID for the entity.
   * @returns {Entity} The newly created entity.
   *
   * @example
   * const entity = coordinator.createEntity();
   */
  createEntity(id) {
    const entity = new Entity(id);
    this.entities.set(entity.id, entity);
    return entity;
  }

  /**
   * Retrieves an entity by its ID.
   *
   * @param {string} entityId - The ID of the entity to retrieve.
   * @returns {Entity|undefined} The entity or undefined if not found.
   *
   * @example
   * const entity = coordinator.getEntity('entity-123');
   */
  getEntity(entityId) {
    return this.entities.get(entityId);
  }

  /**
   * Gets all entities.
   *
   * @returns {Array<Entity>} Array of all entities.
   *
   * @example
   * const allEntities = coordinator.getAllEntities();
   */
  getAllEntities() {
    return Array.from(this.entities.values());
  }

  /**
   * Queries entities that have all specified components.
   *
   * @param {Array<Function>} componentClasses - Array of component classes to match.
   * @returns {Array<Entity>} Array of matching entities.
   *
   * @example
   * const movingEntities = coordinator.queryEntities([
   *   TransformComponent,
   *   VelocityComponent
   * ]);
   */
  queryEntities(componentClasses) {
    return this.getAllEntities().filter((entity) =>
      componentClasses.every((ComponentClass) => entity.hasComponent(ComponentClass))
    );
  }

  /**
   * Destroys an entity and removes it from all systems.
   *
   * @param {string} entityId - The ID of the entity to destroy.
   *
   * @example
   * coordinator.destroyEntity(entity.id);
   */
  destroyEntity(entityId) {
    const entity = this.entities.get(entityId);

    if (!entity) {
      return;
    }

    // Remove from all systems
    this.systems.forEach((system) => {
      system.unregisterEntity(entity);
    });

    // Mark as destroyed and remove from entities map
    entity.destroy();
    this.entities.delete(entityId);
  }

  /**
   * Registers a system with the coordinator.
   * Systems are automatically sorted by priority (higher first).
   *
   * @param {System} system - The system to register.
   *
   * @example
   * coordinator.registerSystem(new RenderingSystem());
   */
  registerSystem(system) {
    this.systems.push(system);

    // Sort systems by priority (higher priority first)
    this.systems.sort((a, b) => b.priority - a.priority);

    // Initialize the system
    system.onInit();

    // Register existing entities that match
    this.entities.forEach((entity) => {
      if (system.matchesEntity(entity)) {
        system.registerEntity(entity);
      }
    });
  }

  /**
   * Unregisters a system from the coordinator.
   *
   * @param {System} system - The system to unregister.
   *
   * @example
   * coordinator.unregisterSystem(renderingSystem);
   */
  unregisterSystem(system) {
    const index = this.systems.indexOf(system);

    if (index !== -1) {
      // Call cleanup
      system.onDestroy();

      // Remove from systems array
      this.systems.splice(index, 1);
    }
  }

  /**
   * Updates an entity's registration in all systems.
   * Should be called after adding or removing components.
   *
   * @param {Entity} entity - The entity to update.
   *
   * @example
   * entity.addComponent(new VelocityComponent(5, 0));
   * coordinator.updateEntityInSystems(entity);
   */
  updateEntityInSystems(entity) {
    this.systems.forEach((system) => {
      const isRegistered = system.entities.has(entity);
      const shouldBeRegistered = system.matchesEntity(entity);

      if (shouldBeRegistered && !isRegistered) {
        system.registerEntity(entity);
      } else if (!shouldBeRegistered && isRegistered) {
        system.unregisterEntity(entity);
      }
    });
  }

  /**
   * Adds a component to an entity and updates system registrations.
   * Convenience method that combines component addition and system updates.
   *
   * @param {string} entityId - The ID of the entity.
   * @param {Component} component - The component to add.
   * @returns {Entity|undefined} The entity or undefined if not found.
   *
   * @example
   * coordinator.addComponentToEntity(
   *   player.id,
   *   new HealthComponent(100)
   * );
   */
  addComponentToEntity(entityId, component) {
    const entity = this.entities.get(entityId);

    if (!entity) {
      return undefined;
    }

    entity.addComponent(component);
    this.updateEntityInSystems(entity);

    return entity;
  }

  /**
   * Updates all systems.
   * Should be called once per frame in the game loop.
   *
   * @param {number} deltaTime - Time elapsed since last update (in seconds).
   *
   * @example
   * function gameLoop() {
   *   const deltaTime = 1/60; // 60 FPS
   *   coordinator.update(deltaTime);
   *   requestAnimationFrame(gameLoop);
   * }
   */
  update(deltaTime) {
    // Systems are already sorted by priority
    this.systems.forEach((system) => {
      if (system.enabled) {
        system.update(deltaTime);
      }
    });
  }
}

export { Coordinator };
