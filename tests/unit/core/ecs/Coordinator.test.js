import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Coordinator } from '../../../../src/core/ecs/Coordinator.js';
import { Entity } from '../../../../src/core/ecs/Entity.js';
import { Component } from '../../../../src/core/ecs/Component.js';
import { System } from '../../../../src/core/ecs/System.js';

describe('Coordinator', () => {
  let coordinator;

  beforeEach(() => {
    coordinator = new Coordinator();
  });

  describe('constructor', () => {
    it('should create a coordinator with empty entities map', () => {
      expect(coordinator.entities).toBeInstanceOf(Map);
      expect(coordinator.entities.size).toBe(0);
    });

    it('should create a coordinator with empty systems array', () => {
      expect(Array.isArray(coordinator.systems)).toBe(true);
      expect(coordinator.systems.length).toBe(0);
    });
  });

  describe('entity management', () => {
    it('should create and register a new entity', () => {
      const entity = coordinator.createEntity();

      expect(entity).toBeInstanceOf(Entity);
      expect(coordinator.entities.has(entity.id)).toBe(true);
      expect(coordinator.entities.get(entity.id)).toBe(entity);
    });

    it('should create multiple unique entities', () => {
      const entity1 = coordinator.createEntity();
      const entity2 = coordinator.createEntity();

      expect(entity1.id).not.toBe(entity2.id);
      expect(coordinator.entities.size).toBe(2);
    });

    it('should get an entity by ID', () => {
      const entity = coordinator.createEntity();
      const retrieved = coordinator.getEntity(entity.id);

      expect(retrieved).toBe(entity);
    });

    it('should return undefined for non-existent entity ID', () => {
      const retrieved = coordinator.getEntity('non-existent-id');

      expect(retrieved).toBeUndefined();
    });

    it('should destroy an entity', () => {
      const entity = coordinator.createEntity();
      const entityId = entity.id;

      coordinator.destroyEntity(entityId);

      expect(coordinator.entities.has(entityId)).toBe(false);
      expect(entity.active).toBe(false);
    });

    it('should get all entities', () => {
      const entity1 = coordinator.createEntity();
      const entity2 = coordinator.createEntity();

      const allEntities = coordinator.getAllEntities();

      expect(allEntities).toHaveLength(2);
      expect(allEntities).toContain(entity1);
      expect(allEntities).toContain(entity2);
    });
  });

  describe('system management', () => {
    class TestSystem extends System {
      update(deltaTime) {}
    }

    it('should register a system', () => {
      const system = new TestSystem();

      coordinator.registerSystem(system);

      expect(coordinator.systems).toContain(system);
      expect(coordinator.systems.length).toBe(1);
    });

    it('should register multiple systems', () => {
      const system1 = new TestSystem();
      const system2 = new TestSystem();

      coordinator.registerSystem(system1);
      coordinator.registerSystem(system2);

      expect(coordinator.systems.length).toBe(2);
    });

    it('should sort systems by priority', () => {
      class HighPrioritySystem extends System {
        constructor() {
          super();
          this.priority = 100;
        }
      }

      class LowPrioritySystem extends System {
        constructor() {
          super();
          this.priority = -100;
        }
      }

      const lowPriority = new LowPrioritySystem();
      const highPriority = new HighPrioritySystem();
      const normalPriority = new TestSystem();

      coordinator.registerSystem(lowPriority);
      coordinator.registerSystem(normalPriority);
      coordinator.registerSystem(highPriority);

      expect(coordinator.systems[0]).toBe(highPriority);
      expect(coordinator.systems[1]).toBe(normalPriority);
      expect(coordinator.systems[2]).toBe(lowPriority);
    });

    it('should call onInit when registering a system', () => {
      class InitSystem extends System {
        constructor() {
          super();
          this.initCalled = false;
        }

        onInit() {
          this.initCalled = true;
        }
      }

      const system = new InitSystem();
      coordinator.registerSystem(system);

      expect(system.initCalled).toBe(true);
    });

    it('should unregister a system', () => {
      const system = new TestSystem();

      coordinator.registerSystem(system);
      expect(coordinator.systems).toContain(system);

      coordinator.unregisterSystem(system);
      expect(coordinator.systems).not.toContain(system);
    });

    it('should call onDestroy when unregistering a system', () => {
      class DestroySystem extends System {
        constructor() {
          super();
          this.destroyCalled = false;
        }

        onDestroy() {
          this.destroyCalled = true;
        }
      }

      const system = new DestroySystem();
      coordinator.registerSystem(system);
      coordinator.unregisterSystem(system);

      expect(system.destroyCalled).toBe(true);
    });
  });

  describe('entity-system integration', () => {
    class TransformComponent extends Component {
      constructor(x = 0, y = 0) {
        super();
        this.x = x;
        this.y = y;
      }
    }

    class VelocityComponent extends Component {
      constructor(vx = 0, vy = 0) {
        super();
        this.vx = vx;
        this.vy = vy;
      }
    }

    class MovementSystem extends System {
      constructor() {
        super();
        this.requiredComponents = [TransformComponent, VelocityComponent];
      }

      update(deltaTime) {
        this.entities.forEach((entity) => {
          const transform = entity.getComponent(TransformComponent);
          const velocity = entity.getComponent(VelocityComponent);
          transform.x += velocity.vx * deltaTime;
          transform.y += velocity.vy * deltaTime;
        });
      }
    }

    it('should automatically register matching entities with systems', () => {
      const system = new MovementSystem();
      coordinator.registerSystem(system);

      const entity = coordinator.createEntity();
      entity.addComponent(new TransformComponent(0, 0));
      entity.addComponent(new VelocityComponent(10, 20));

      coordinator.updateEntityInSystems(entity);

      expect(system.entities.has(entity)).toBe(true);
    });

    it('should not register non-matching entities', () => {
      const system = new MovementSystem();
      coordinator.registerSystem(system);

      const entity = coordinator.createEntity();
      entity.addComponent(new TransformComponent(0, 0));
      // Missing VelocityComponent

      coordinator.updateEntityInSystems(entity);

      expect(system.entities.has(entity)).toBe(false);
    });

    it('should unregister entities from systems when component is removed', () => {
      const system = new MovementSystem();
      coordinator.registerSystem(system);

      const entity = coordinator.createEntity();
      entity.addComponent(new TransformComponent(0, 0));
      entity.addComponent(new VelocityComponent(10, 20));

      coordinator.updateEntityInSystems(entity);
      expect(system.entities.has(entity)).toBe(true);

      entity.removeComponent(VelocityComponent);
      coordinator.updateEntityInSystems(entity);

      expect(system.entities.has(entity)).toBe(false);
    });

    it('should remove entity from all systems when destroyed', () => {
      const system = new MovementSystem();
      coordinator.registerSystem(system);

      const entity = coordinator.createEntity();
      entity.addComponent(new TransformComponent(0, 0));
      entity.addComponent(new VelocityComponent(10, 20));

      coordinator.updateEntityInSystems(entity);
      expect(system.entities.has(entity)).toBe(true);

      coordinator.destroyEntity(entity.id);

      expect(system.entities.has(entity)).toBe(false);
    });
  });

  describe('update cycle', () => {
    class CountingSystem extends System {
      constructor(name) {
        super();
        this.name = name;
        this.updateCount = 0;
        this.lastDeltaTime = 0;
      }

      update(deltaTime) {
        this.updateCount++;
        this.lastDeltaTime = deltaTime;
      }
    }

    it('should update all systems', () => {
      const system1 = new CountingSystem('system1');
      const system2 = new CountingSystem('system2');

      coordinator.registerSystem(system1);
      coordinator.registerSystem(system2);

      coordinator.update(0.016);

      expect(system1.updateCount).toBe(1);
      expect(system2.updateCount).toBe(1);
      expect(system1.lastDeltaTime).toBe(0.016);
      expect(system2.lastDeltaTime).toBe(0.016);
    });

    it('should update systems in priority order', () => {
      const updateOrder = [];

      class OrderedSystem extends System {
        constructor(name, priority) {
          super();
          this.name = name;
          this.priority = priority;
        }

        update() {
          updateOrder.push(this.name);
        }
      }

      const systemA = new OrderedSystem('A', -10);
      const systemB = new OrderedSystem('B', 100);
      const systemC = new OrderedSystem('C', 0);

      coordinator.registerSystem(systemA);
      coordinator.registerSystem(systemC);
      coordinator.registerSystem(systemB);

      coordinator.update(0.016);

      expect(updateOrder).toEqual(['B', 'C', 'A']);
    });

    it('should skip disabled systems', () => {
      const system1 = new CountingSystem('enabled');
      const system2 = new CountingSystem('disabled');
      system2.enabled = false;

      coordinator.registerSystem(system1);
      coordinator.registerSystem(system2);

      coordinator.update(0.016);

      expect(system1.updateCount).toBe(1);
      expect(system2.updateCount).toBe(0);
    });
  });

  describe('component adding helper', () => {
    class TestComponent extends Component {
      constructor(value) {
        super();
        this.value = value;
      }
    }

    it('should add component to entity and update systems', () => {
      class TestSystem extends System {
        constructor() {
          super();
          this.requiredComponents = [TestComponent];
        }
      }

      const system = new TestSystem();
      coordinator.registerSystem(system);

      const entity = coordinator.createEntity();

      expect(system.entities.has(entity)).toBe(false);

      coordinator.addComponentToEntity(entity.id, new TestComponent(42));

      expect(entity.hasComponent(TestComponent)).toBe(true);
      expect(system.entities.has(entity)).toBe(true);
    });
  });

  describe('query entities', () => {
    class ComponentA extends Component {}
    class ComponentB extends Component {}
    class ComponentC extends Component {}

    beforeEach(() => {
      const entity1 = coordinator.createEntity();
      entity1.addComponent(new ComponentA());

      const entity2 = coordinator.createEntity();
      entity2.addComponent(new ComponentA()).addComponent(new ComponentB());

      const entity3 = coordinator.createEntity();
      entity3
        .addComponent(new ComponentA())
        .addComponent(new ComponentB())
        .addComponent(new ComponentC());

      coordinator.getAllEntities().forEach((entity) => {
        coordinator.updateEntityInSystems(entity);
      });
    });

    it('should query entities with specific components', () => {
      const results = coordinator.queryEntities([ComponentA, ComponentB]);

      expect(results).toHaveLength(2);
      results.forEach((entity) => {
        expect(entity.hasComponent(ComponentA)).toBe(true);
        expect(entity.hasComponent(ComponentB)).toBe(true);
      });
    });

    it('should return empty array if no matches', () => {
      class ComponentD extends Component {}
      const results = coordinator.queryEntities([ComponentD]);

      expect(results).toHaveLength(0);
    });

    it('should return all entities with single component query', () => {
      const results = coordinator.queryEntities([ComponentA]);

      expect(results).toHaveLength(3);
    });
  });
});
