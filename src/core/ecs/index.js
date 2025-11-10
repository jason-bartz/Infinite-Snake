/**
 * ECS (Entity-Component-System) Architecture Module
 *
 * This module provides a complete ECS implementation for game development.
 *
 * @module ecs
 * @example
 * import { Coordinator, Entity, Component, System } from './core/ecs/index.js';
 *
 * // Create a custom component
 * class PositionComponent extends Component {
 *   constructor(x, y) {
 *     super();
 *     this.x = x;
 *     this.y = y;
 *   }
 * }
 *
 * // Create a custom system
 * class LoggingSystem extends System {
 *   constructor() {
 *     super();
 *     this.requiredComponents = [PositionComponent];
 *   }
 *
 *   update(deltaTime) {
 *     this.entities.forEach(entity => {
 *       const pos = entity.getComponent(PositionComponent);
 *       console.log(`Entity at (${pos.x}, ${pos.y})`);
 *     });
 *   }
 * }
 *
 * // Set up ECS
 * const coordinator = new Coordinator();
 * coordinator.registerSystem(new LoggingSystem());
 *
 * const entity = coordinator.createEntity();
 * coordinator.addComponentToEntity(entity.id, new PositionComponent(100, 200));
 *
 * coordinator.update(0.016);
 */

export { Entity } from './Entity.js';
export { Component } from './Component.js';
export { System } from './System.js';
export { Coordinator } from './Coordinator.js';
