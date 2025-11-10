import { describe, it, expect, beforeEach, vi } from 'vitest';
import { System } from '../../../../src/core/ecs/System.js';
import { Entity } from '../../../../src/core/ecs/Entity.js';
import { Component } from '../../../../src/core/ecs/Component.js';

describe('System', () => {
  let system;

  beforeEach(() => {
    system = new System();
  });

  describe('constructor', () => {
    it('should create a system with empty entities set', () => {
      expect(system.entities).toBeInstanceOf(Set);
      expect(system.entities.size).toBe(0);
    });

    it('should initialize as enabled', () => {
      expect(system.enabled).toBe(true);
    });

    it('should have empty required components by default', () => {
      expect(Array.isArray(system.requiredComponents)).toBe(true);
      expect(system.requiredComponents.length).toBe(0);
    });

    it('should have a priority of 0 by default', () => {
      expect(system.priority).toBe(0);
    });
  });

  describe('subclassing System', () => {
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

    it('should allow creating custom systems', () => {
      const movementSystem = new MovementSystem();

      expect(movementSystem).toBeInstanceOf(System);
      expect(movementSystem).toBeInstanceOf(MovementSystem);
      expect(movementSystem.requiredComponents).toEqual([TransformComponent, VelocityComponent]);
    });

    it('should allow registering entities', () => {
      const movementSystem = new MovementSystem();
      const entity = new Entity();

      movementSystem.registerEntity(entity);

      expect(movementSystem.entities.has(entity)).toBe(true);
      expect(movementSystem.entities.size).toBe(1);
    });

    it('should allow unregistering entities', () => {
      const movementSystem = new MovementSystem();
      const entity = new Entity();

      movementSystem.registerEntity(entity);
      expect(movementSystem.entities.has(entity)).toBe(true);

      movementSystem.unregisterEntity(entity);
      expect(movementSystem.entities.has(entity)).toBe(false);
    });

    it('should process entities with update method', () => {
      const movementSystem = new MovementSystem();
      const entity = new Entity();
      const transform = new TransformComponent(100, 200);
      const velocity = new VelocityComponent(10, 20);

      entity.addComponent(transform).addComponent(velocity);
      movementSystem.registerEntity(entity);

      movementSystem.update(1); // 1 second

      const updatedTransform = entity.getComponent(TransformComponent);
      expect(updatedTransform.x).toBe(110);
      expect(updatedTransform.y).toBe(220);
    });

    it('should process multiple entities', () => {
      const movementSystem = new MovementSystem();

      const entity1 = new Entity();
      entity1
        .addComponent(new TransformComponent(0, 0))
        .addComponent(new VelocityComponent(10, 0));

      const entity2 = new Entity();
      entity2
        .addComponent(new TransformComponent(100, 100))
        .addComponent(new VelocityComponent(0, 20));

      movementSystem.registerEntity(entity1);
      movementSystem.registerEntity(entity2);

      movementSystem.update(1);

      expect(entity1.getComponent(TransformComponent).x).toBe(10);
      expect(entity1.getComponent(TransformComponent).y).toBe(0);
      expect(entity2.getComponent(TransformComponent).x).toBe(100);
      expect(entity2.getComponent(TransformComponent).y).toBe(120);
    });
  });

  describe('entity matching', () => {
    class ComponentA extends Component {}
    class ComponentB extends Component {}
    class ComponentC extends Component {}

    class TestSystem extends System {
      constructor() {
        super();
        this.requiredComponents = [ComponentA, ComponentB];
      }

      update() {}
    }

    it('should match entities with required components', () => {
      const system = new TestSystem();
      const entity = new Entity();

      entity.addComponent(new ComponentA()).addComponent(new ComponentB());

      expect(system.matchesEntity(entity)).toBe(true);
    });

    it('should match entities with extra components', () => {
      const system = new TestSystem();
      const entity = new Entity();

      entity
        .addComponent(new ComponentA())
        .addComponent(new ComponentB())
        .addComponent(new ComponentC());

      expect(system.matchesEntity(entity)).toBe(true);
    });

    it('should not match entities missing required components', () => {
      const system = new TestSystem();
      const entity = new Entity();

      entity.addComponent(new ComponentA()); // Missing ComponentB

      expect(system.matchesEntity(entity)).toBe(false);
    });

    it('should not match entities with no components', () => {
      const system = new TestSystem();
      const entity = new Entity();

      expect(system.matchesEntity(entity)).toBe(false);
    });
  });

  describe('lifecycle hooks', () => {
    class TestSystem extends System {
      constructor() {
        super();
        this.initCalled = false;
        this.destroyCalled = false;
      }

      onInit() {
        this.initCalled = true;
      }

      onDestroy() {
        this.destroyCalled = true;
      }

      update() {}
    }

    it('should support initialization hook', () => {
      const system = new TestSystem();

      expect(system.initCalled).toBe(false);

      system.onInit();
      expect(system.initCalled).toBe(true);
    });

    it('should support destruction hook', () => {
      const system = new TestSystem();

      expect(system.destroyCalled).toBe(false);

      system.onDestroy();
      expect(system.destroyCalled).toBe(true);
    });
  });

  describe('system priority', () => {
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

    it('should allow setting custom priority', () => {
      const highPriority = new HighPrioritySystem();
      const lowPriority = new LowPrioritySystem();

      expect(highPriority.priority).toBe(100);
      expect(lowPriority.priority).toBe(-100);
    });

    it('should be sortable by priority', () => {
      const systems = [
        new LowPrioritySystem(),
        new System(),
        new HighPrioritySystem(),
      ];

      systems.sort((a, b) => b.priority - a.priority);

      expect(systems[0].priority).toBe(100);
      expect(systems[1].priority).toBe(0);
      expect(systems[2].priority).toBe(-100);
    });
  });

  describe('enabled state', () => {
    class TestSystem extends System {
      update() {
        this.updateCalled = true;
      }
    }

    it('should skip update when disabled', () => {
      const system = new TestSystem();
      system.enabled = false;
      system.updateCalled = false;

      // Coordinator would check enabled state before calling update
      if (system.enabled) {
        system.update(0.016);
      }

      expect(system.updateCalled).toBeFalsy();
    });

    it('should call update when enabled', () => {
      const system = new TestSystem();
      system.enabled = true;
      system.updateCalled = false;

      if (system.enabled) {
        system.update(0.016);
      }

      expect(system.updateCalled).toBe(true);
    });
  });
});
