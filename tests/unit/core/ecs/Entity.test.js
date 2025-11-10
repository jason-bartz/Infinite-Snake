import { describe, it, expect, beforeEach } from 'vitest';
import { Entity } from '../../../../src/core/ecs/Entity.js';

describe('Entity', () => {
  let entity;

  beforeEach(() => {
    entity = new Entity();
  });

  describe('constructor', () => {
    it('should create an entity with a unique ID', () => {
      const entity1 = new Entity();
      const entity2 = new Entity();

      expect(entity1.id).toBeDefined();
      expect(entity2.id).toBeDefined();
      expect(entity1.id).not.toBe(entity2.id);
    });

    it('should initialize with an empty components map', () => {
      expect(entity.components).toBeInstanceOf(Map);
      expect(entity.components.size).toBe(0);
    });

    it('should initialize as active', () => {
      expect(entity.active).toBe(true);
    });

    it('should accept an optional custom ID', () => {
      const customEntity = new Entity('custom-id');
      expect(customEntity.id).toBe('custom-id');
    });
  });

  describe('addComponent', () => {
    it('should add a component to the entity', () => {
      class TestComponent {
        constructor() {
          this.value = 42;
        }
      }

      const component = new TestComponent();
      entity.addComponent(component);

      expect(entity.components.has('TestComponent')).toBe(true);
      expect(entity.components.get('TestComponent')).toBe(component);
    });

    it('should return the entity for method chaining', () => {
      class TestComponent {}
      const result = entity.addComponent(new TestComponent());

      expect(result).toBe(entity);
    });

    it('should replace existing component of the same type', () => {
      class TestComponent {
        constructor(value) {
          this.value = value;
        }
      }

      const component1 = new TestComponent(1);
      const component2 = new TestComponent(2);

      entity.addComponent(component1);
      entity.addComponent(component2);

      expect(entity.components.get('TestComponent').value).toBe(2);
      expect(entity.components.size).toBe(1);
    });
  });

  describe('getComponent', () => {
    it('should retrieve a component by class', () => {
      class TestComponent {
        constructor() {
          this.value = 42;
        }
      }

      const component = new TestComponent();
      entity.addComponent(component);

      const retrieved = entity.getComponent(TestComponent);
      expect(retrieved).toBe(component);
    });

    it('should return undefined if component does not exist', () => {
      class NonExistentComponent {}

      const retrieved = entity.getComponent(NonExistentComponent);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('hasComponent', () => {
    it('should return true if component exists', () => {
      class TestComponent {}

      entity.addComponent(new TestComponent());

      expect(entity.hasComponent(TestComponent)).toBe(true);
    });

    it('should return false if component does not exist', () => {
      class NonExistentComponent {}

      expect(entity.hasComponent(NonExistentComponent)).toBe(false);
    });
  });

  describe('removeComponent', () => {
    it('should remove a component from the entity', () => {
      class TestComponent {}

      entity.addComponent(new TestComponent());
      expect(entity.hasComponent(TestComponent)).toBe(true);

      entity.removeComponent(TestComponent);
      expect(entity.hasComponent(TestComponent)).toBe(false);
    });

    it('should return the entity for method chaining', () => {
      class TestComponent {}

      entity.addComponent(new TestComponent());
      const result = entity.removeComponent(TestComponent);

      expect(result).toBe(entity);
    });

    it('should not throw if removing non-existent component', () => {
      class NonExistentComponent {}

      expect(() => {
        entity.removeComponent(NonExistentComponent);
      }).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should mark entity as inactive', () => {
      entity.destroy();

      expect(entity.active).toBe(false);
    });

    it('should clear all components', () => {
      class TestComponent1 {}
      class TestComponent2 {}

      entity.addComponent(new TestComponent1());
      entity.addComponent(new TestComponent2());

      entity.destroy();

      expect(entity.components.size).toBe(0);
    });
  });

  describe('method chaining', () => {
    it('should allow chaining addComponent calls', () => {
      class Component1 {}
      class Component2 {}
      class Component3 {}

      const result = entity
        .addComponent(new Component1())
        .addComponent(new Component2())
        .addComponent(new Component3());

      expect(result).toBe(entity);
      expect(entity.components.size).toBe(3);
    });
  });
});
