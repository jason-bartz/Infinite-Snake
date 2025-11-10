import { describe, it, expect, beforeEach } from 'vitest';
import { Component } from '../../../../src/core/ecs/Component.js';

describe('Component', () => {
  describe('base Component class', () => {
    it('should create a basic component', () => {
      const component = new Component();
      expect(component).toBeDefined();
    });

    it('should have a type property matching the class name', () => {
      const component = new Component();
      expect(component.type).toBe('Component');
    });

    it('should be enabled by default', () => {
      const component = new Component();
      expect(component.enabled).toBe(true);
    });
  });

  describe('subclassing Component', () => {
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

    it('should allow creating custom components', () => {
      const transform = new TransformComponent(100, 200);

      expect(transform).toBeInstanceOf(Component);
      expect(transform).toBeInstanceOf(TransformComponent);
      expect(transform.x).toBe(100);
      expect(transform.y).toBe(200);
    });

    it('should have correct type for subclasses', () => {
      const transform = new TransformComponent();
      const velocity = new VelocityComponent();

      expect(transform.type).toBe('TransformComponent');
      expect(velocity.type).toBe('VelocityComponent');
    });

    it('should maintain enabled state in subclasses', () => {
      const transform = new TransformComponent();
      expect(transform.enabled).toBe(true);

      transform.enabled = false;
      expect(transform.enabled).toBe(false);
    });

    it('should allow multiple instances with different data', () => {
      const transform1 = new TransformComponent(10, 20);
      const transform2 = new TransformComponent(30, 40);

      expect(transform1.x).toBe(10);
      expect(transform1.y).toBe(20);
      expect(transform2.x).toBe(30);
      expect(transform2.y).toBe(40);
    });
  });

  describe('complex component example', () => {
    class HealthComponent extends Component {
      constructor(maxHealth = 100) {
        super();
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
      }

      damage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
      }

      heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
      }

      isDead() {
        return this.currentHealth <= 0;
      }
    }

    it('should support components with methods', () => {
      const health = new HealthComponent(100);

      expect(health.currentHealth).toBe(100);

      health.damage(30);
      expect(health.currentHealth).toBe(70);
      expect(health.isDead()).toBe(false);

      health.heal(20);
      expect(health.currentHealth).toBe(90);

      health.damage(100);
      expect(health.currentHealth).toBe(0);
      expect(health.isDead()).toBe(true);
    });
  });

  describe('component lifecycle', () => {
    class TestComponent extends Component {
      constructor(value) {
        super();
        this.value = value;
        this.initialized = false;
      }

      onInit() {
        this.initialized = true;
      }

      onDestroy() {
        this.value = null;
      }
    }

    it('should support initialization hooks', () => {
      const component = new TestComponent(42);

      expect(component.initialized).toBe(false);

      component.onInit();
      expect(component.initialized).toBe(true);
    });

    it('should support destruction hooks', () => {
      const component = new TestComponent(42);

      expect(component.value).toBe(42);

      component.onDestroy();
      expect(component.value).toBeNull();
    });
  });

  describe('component serialization', () => {
    class SerializableComponent extends Component {
      constructor(x = 0, y = 0, name = '') {
        super();
        this.x = x;
        this.y = y;
        this.name = name;
      }

      serialize() {
        return {
          type: this.type,
          x: this.x,
          y: this.y,
          name: this.name,
        };
      }

      static deserialize(data) {
        return new SerializableComponent(data.x, data.y, data.name);
      }
    }

    it('should support serialization', () => {
      const original = new SerializableComponent(100, 200, 'test');
      const serialized = original.serialize();

      expect(serialized).toEqual({
        type: 'SerializableComponent',
        x: 100,
        y: 200,
        name: 'test',
      });
    });

    it('should support deserialization', () => {
      const data = {
        type: 'SerializableComponent',
        x: 300,
        y: 400,
        name: 'restored',
      };

      const component = SerializableComponent.deserialize(data);

      expect(component).toBeInstanceOf(SerializableComponent);
      expect(component.x).toBe(300);
      expect(component.y).toBe(400);
      expect(component.name).toBe('restored');
    });
  });
});
