/**
 * ElementFactory
 *
 * Factory class for creating element entities in the ECS architecture.
 * Provides convenient methods for spawning elements with proper component setup.
 *
 * Features:
 * - Create element entities with all required components
 * - Load element data from elementLoader
 * - Configure magnetism presets
 * - Support catalyst-spawned elements
 * - Statistics tracking
 *
 * @module entities/ElementFactory
 */

import {
  Transform,
  Velocity,
  Renderable,
  ElementData,
  ElementVisuals,
  Magnetism
} from '../components/index.js';

/**
 * Factory for creating element entities
 */
export class ElementFactory {
  /**
   * Create a new ElementFactory
   * @param {Object} coordinator - ECS coordinator for entity creation
   * @param {Object} elementLoader - The element data loader
   */
  constructor(coordinator, elementLoader) {
    if (!coordinator) {
      throw new Error('ElementFactory requires a coordinator');
    }
    if (!elementLoader) {
      throw new Error('ElementFactory requires an elementLoader');
    }

    this.coordinator = coordinator;
    this.elementLoader = elementLoader;

    // Statistics
    this.stats = {
      totalCreated: 0,
      activeElements: 0,
      byTier: {
        0: 0, // Base elements
        1: 0,
        2: 0,
        3: 0,
        4: 0
      },
      catalystSpawned: 0
    };
  }

  /**
   * Create an element entity
   * @param {string} id - Element ID
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {boolean} isCatalystSpawned - Whether spawned by catalyst power-up
   * @returns {number} Entity ID
   */
  createElement(id, x, y, isCatalystSpawned = false) {
    // Load element data
    const elementData = this.elementLoader.getElementById(id);
    if (!elementData) {
      throw new Error(`Element not found: ${id}`);
    }

    // Create entity
    const entity = this.coordinator.createEntity();

    // Add Transform component
    const transform = new Transform(x, y);
    this.coordinator.addComponentToEntity(entity.id, transform);

    // Add Velocity component (elements start stationary)
    const velocity = new Velocity(0, 0, 0.98, 0);
    this.coordinator.addComponentToEntity(entity.id, velocity);

    // Add Renderable component (layer 2 for elements)
    const renderable = new Renderable(2, true);
    this.coordinator.addComponentToEntity(entity.id, renderable);

    // Add ElementData component
    const data = new ElementData(
      elementData.id,
      elementData.emoji,
      elementData.name,
      elementData.tier
    );
    this.coordinator.addComponentToEntity(entity.id, data);

    // Add ElementVisuals component
    const visuals = new ElementVisuals();
    visuals.isCatalystSpawned = isCatalystSpawned;
    this.coordinator.addComponentToEntity(entity.id, visuals);

    // Add Magnetism component with element preset
    const magnetism = new Magnetism('element');
    this.coordinator.addComponentToEntity(entity.id, magnetism);

    // Update statistics
    this.stats.totalCreated++;
    this.stats.activeElements++;
    this.stats.byTier[elementData.tier]++;
    if (isCatalystSpawned) {
      this.stats.catalystSpawned++;
    }

    return entity.id;
  }

  /**
   * Create a base element (tier 0)
   * @param {string} id - Element ID
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {number} Entity ID
   */
  createBaseElement(id, x, y) {
    return this.createElement(id, x, y, false);
  }

  /**
   * Create a catalyst-spawned element
   * @param {string} id - Element ID
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {number} Entity ID
   */
  createCatalystElement(id, x, y) {
    return this.createElement(id, x, y, true);
  }

  /**
   * Create multiple elements at random positions
   * @param {string} id - Element ID
   * @param {number} count - Number of elements to create
   * @param {number} minX - Minimum X position
   * @param {number} maxX - Maximum X position
   * @param {number} minY - Minimum Y position
   * @param {number} maxY - Maximum Y position
   * @param {boolean} isCatalystSpawned - Whether spawned by catalyst
   * @returns {number[]} Array of entity IDs
   */
  createMultiple(id, count, minX, maxX, minY, maxY, isCatalystSpawned = false) {
    const entities = [];

    for (let i = 0; i < count; i++) {
      const x = minX + Math.random() * (maxX - minX);
      const y = minY + Math.random() * (maxY - minY);
      const entity = this.createElement(id, x, y, isCatalystSpawned);
      entities.push(entity);
    }

    return entities;
  }

  /**
   * Create elements in a circle pattern
   * @param {string} id - Element ID
   * @param {number} centerX - Center X position
   * @param {number} centerY - Center Y position
   * @param {number} radius - Circle radius
   * @param {number} count - Number of elements
   * @param {boolean} isCatalystSpawned - Whether spawned by catalyst
   * @returns {number[]} Array of entity IDs
   */
  createCircle(id, centerX, centerY, radius, count, isCatalystSpawned = false) {
    const entities = [];
    const angleStep = (Math.PI * 2) / count;

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      const entity = this.createElement(id, x, y, isCatalystSpawned);
      entities.push(entity);
    }

    return entities;
  }

  /**
   * Create elements in a grid pattern
   * @param {string} id - Element ID
   * @param {number} startX - Starting X position
   * @param {number} startY - Starting Y position
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @param {number} spacing - Spacing between elements
   * @param {boolean} isCatalystSpawned - Whether spawned by catalyst
   * @returns {number[]} Array of entity IDs
   */
  createGrid(id, startX, startY, cols, rows, spacing, isCatalystSpawned = false) {
    const entities = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacing;
        const y = startY + row * spacing;
        const entity = this.createElement(id, x, y, isCatalystSpawned);
        entities.push(entity);
      }
    }

    return entities;
  }

  /**
   * Remove an element entity
   * @param {number} entityId - Entity ID
   */
  removeElement(entityId) {
    // Get entity
    const entity = this.coordinator.getEntity(entityId);
    if (!entity) return;

    // Get element data for statistics
    const data = entity.getComponent(ElementData);
    if (data) {
      this.stats.activeElements--;
      this.stats.byTier[data.tier]--;
    }

    // Destroy entity
    this.coordinator.destroyEntity(entityId);
  }

  /**
   * Get factory statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      ...this.stats,
      byTier: { ...this.stats.byTier }
    };
  }

  /**
   * Reset factory statistics
   */
  resetStats() {
    this.stats.totalCreated = 0;
    this.stats.activeElements = 0;
    this.stats.byTier = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    this.stats.catalystSpawned = 0;
  }

  /**
   * Get active element count
   * @returns {number} Number of active elements
   */
  getActiveCount() {
    return this.stats.activeElements;
  }

  /**
   * Get elements by tier count
   * @param {number} tier - Element tier
   * @returns {number} Count of elements in that tier
   */
  getTierCount(tier) {
    return this.stats.byTier[tier] || 0;
  }

  /**
   * Check if element exists
   * @param {string} id - Element ID
   * @returns {boolean} True if element exists
   */
  hasElement(id) {
    return this.elementLoader.getElementById(id) !== undefined;
  }

  /**
   * Get all available element IDs
   * @returns {string[]} Array of element IDs
   */
  getAvailableElements() {
    return this.elementLoader.getAllElementIds();
  }

  /**
   * Get base element IDs (tier 0)
   * @returns {string[]} Array of base element IDs
   */
  getBaseElements() {
    return this.elementLoader.getBaseElements();
  }
}
