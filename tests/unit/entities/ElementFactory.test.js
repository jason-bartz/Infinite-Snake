import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ElementFactory } from '../../../src/entities/ElementFactory.js';
import { Coordinator } from '../../../src/core/ecs/Coordinator.js';
import {
  Transform,
  Velocity,
  Renderable,
  ElementData,
  ElementVisuals,
  Magnetism
} from '../../../src/components/index.js';

describe('ElementFactory', () => {
  let factory;
  let coordinator;
  let mockElementLoader;

  beforeEach(() => {
    // Create new coordinator for each test
    coordinator = new Coordinator();

    // Create mock element loader
    mockElementLoader = {
      getElementById: vi.fn((id) => {
        const elements = {
          'hydrogen': { id: 'hydrogen', emoji: '💧', name: 'Hydrogen', tier: 0 },
          'oxygen': { id: 'oxygen', emoji: '🌬️', name: 'Oxygen', tier: 0 },
          'water': { id: 'water', emoji: '💦', name: 'Water', tier: 1 },
          'steam': { id: 'steam', emoji: '💨', name: 'Steam', tier: 2 },
          'plasma': { id: 'plasma', emoji: '⚡', name: 'Plasma', tier: 3 }
        };
        return elements[id];
      }),
      getAllElementIds: vi.fn(() => ['hydrogen', 'oxygen', 'water', 'steam', 'plasma']),
      getBaseElements: vi.fn(() => ['hydrogen', 'oxygen'])
    };

    factory = new ElementFactory(coordinator, mockElementLoader);
  });

  describe('Constructor', () => {
    it('should require coordinator', () => {
      expect(() => new ElementFactory(null, mockElementLoader)).toThrow('ElementFactory requires a coordinator');
    });

    it('should require element loader', () => {
      expect(() => new ElementFactory(coordinator, null)).toThrow('ElementFactory requires an elementLoader');
    });

    it('should initialize with coordinator', () => {
      expect(factory.coordinator).toBe(coordinator);
    });

    it('should initialize with element loader', () => {
      expect(factory.elementLoader).toBe(mockElementLoader);
    });

    it('should initialize statistics', () => {
      expect(factory.stats.totalCreated).toBe(0);
      expect(factory.stats.activeElements).toBe(0);
      expect(factory.stats.byTier).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
      expect(factory.stats.catalystSpawned).toBe(0);
    });
  });

  describe('createElement', () => {
    it('should create element entity with all components', () => {
      const entityId = factory.createElement('hydrogen', 100, 200);
      const entity = coordinator.getEntity(entityId);

      expect(typeof entityId).toBe('string');
      expect(entity.hasComponent(Transform)).toBe(true);
      expect(entity.hasComponent(Velocity)).toBe(true);
      expect(entity.hasComponent(Renderable)).toBe(true);
      expect(entity.hasComponent(ElementData)).toBe(true);
      expect(entity.hasComponent(ElementVisuals)).toBe(true);
      expect(entity.hasComponent(Magnetism)).toBe(true);
    });

    it('should set correct transform position', () => {
      const entityId = factory.createElement('hydrogen', 100, 200);
      const entity = coordinator.getEntity(entityId);
      const transform = entity.getComponent(Transform);

      expect(transform.x).toBe(100);
      expect(transform.y).toBe(200);
    });

    it('should set correct element data', () => {
      const entityId = factory.createElement('water', 0, 0);
      const entity = coordinator.getEntity(entityId);
      const data = entity.getComponent(ElementData);

      expect(data.id).toBe('water');
      expect(data.emoji).toBe('💦');
      expect(data.name).toBe('Water');
      expect(data.tier).toBe(1);
    });

    it('should set catalyst spawned flag', () => {
      const entityId = factory.createElement('hydrogen', 0, 0, true);
      const entity = coordinator.getEntity(entityId);
      const visuals = entity.getComponent(ElementVisuals);

      expect(visuals.isCatalystSpawned).toBe(true);
    });

    it('should not set catalyst flag by default', () => {
      const entityId = factory.createElement('hydrogen', 0, 0);
      const entity = coordinator.getEntity(entityId);
      const visuals = entity.getComponent(ElementVisuals);

      expect(visuals.isCatalystSpawned).toBe(false);
    });

    it('should set element magnetism preset', () => {
      const entityId = factory.createElement('hydrogen', 0, 0);
      const entity = coordinator.getEntity(entityId);
      const magnetism = entity.getComponent(Magnetism);

      expect(magnetism.preset).toBe('element');
    });

    it('should set renderable layer to 2', () => {
      const entityId = factory.createElement('hydrogen', 0, 0);
      const entity = coordinator.getEntity(entityId);
      const renderable = entity.getComponent(Renderable);

      expect(renderable.layer).toBe(2);
      expect(renderable.visible).toBe(true);
    });

    it('should initialize velocity to zero', () => {
      const entityId = factory.createElement('hydrogen', 0, 0);
      const entity = coordinator.getEntity(entityId);
      const velocity = entity.getComponent(Velocity);

      expect(velocity.vx).toBe(0);
      expect(velocity.vy).toBe(0);
    });

    it('should update statistics on creation', () => {
      factory.createElement('hydrogen', 0, 0);

      expect(factory.stats.totalCreated).toBe(1);
      expect(factory.stats.activeElements).toBe(1);
      expect(factory.stats.byTier[0]).toBe(1);
    });

    it('should track tier statistics correctly', () => {
      factory.createElement('hydrogen', 0, 0); // tier 0
      factory.createElement('water', 0, 0); // tier 1
      factory.createElement('steam', 0, 0); // tier 2

      expect(factory.stats.byTier[0]).toBe(1);
      expect(factory.stats.byTier[1]).toBe(1);
      expect(factory.stats.byTier[2]).toBe(1);
    });

    it('should track catalyst spawned count', () => {
      factory.createElement('hydrogen', 0, 0, true);
      factory.createElement('oxygen', 0, 0, true);

      expect(factory.stats.catalystSpawned).toBe(2);
    });

    it('should throw error for invalid element ID', () => {
      mockElementLoader.getElementById.mockReturnValue(undefined);

      expect(() => {
        factory.createElement('invalid', 0, 0);
      }).toThrow('Element not found: invalid');
    });
  });

  describe('createBaseElement', () => {
    it('should create element with catalyst flag false', () => {
      const entityId = factory.createBaseElement('hydrogen', 100, 200);
      const entity = coordinator.getEntity(entityId);
      const visuals = entity.getComponent(ElementVisuals);

      expect(visuals.isCatalystSpawned).toBe(false);
    });

    it('should create element at correct position', () => {
      const entityId = factory.createBaseElement('oxygen', 50, 75);
      const entity = coordinator.getEntity(entityId);
      const transform = entity.getComponent(Transform);

      expect(transform.x).toBe(50);
      expect(transform.y).toBe(75);
    });
  });

  describe('createCatalystElement', () => {
    it('should create element with catalyst flag true', () => {
      const entityId = factory.createCatalystElement('hydrogen', 100, 200);
      const entity = coordinator.getEntity(entityId);
      const visuals = entity.getComponent(ElementVisuals);

      expect(visuals.isCatalystSpawned).toBe(true);
    });

    it('should increment catalyst spawned count', () => {
      factory.createCatalystElement('hydrogen', 0, 0);

      expect(factory.stats.catalystSpawned).toBe(1);
    });
  });

  describe('createMultiple', () => {
    it('should create correct number of elements', () => {
      const entities = factory.createMultiple('hydrogen', 5, 0, 100, 0, 100);

      expect(entities).toHaveLength(5);
      expect(factory.stats.activeElements).toBe(5);
    });

    it('should create elements within bounds', () => {
      const entityIds = factory.createMultiple('hydrogen', 10, 50, 150, 25, 75);

      entityIds.forEach(entityId => {
        const entity = coordinator.getEntity(entityId);
        const transform = entity.getComponent(Transform);
        expect(transform.x).toBeGreaterThanOrEqual(50);
        expect(transform.x).toBeLessThanOrEqual(150);
        expect(transform.y).toBeGreaterThanOrEqual(25);
        expect(transform.y).toBeLessThanOrEqual(75);
      });
    });

    it('should support catalyst spawned flag', () => {
      const entityIds = factory.createMultiple('hydrogen', 3, 0, 100, 0, 100, true);

      entityIds.forEach(entityId => {
        const entity = coordinator.getEntity(entityId);
        const visuals = entity.getComponent(ElementVisuals);
        expect(visuals.isCatalystSpawned).toBe(true);
      });

      expect(factory.stats.catalystSpawned).toBe(3);
    });

    it('should return empty array for zero count', () => {
      const entities = factory.createMultiple('hydrogen', 0, 0, 100, 0, 100);

      expect(entities).toEqual([]);
    });
  });

  describe('createCircle', () => {
    it('should create correct number of elements', () => {
      const entities = factory.createCircle('hydrogen', 100, 100, 50, 8);

      expect(entities).toHaveLength(8);
    });

    it('should position elements in circle', () => {
      const centerX = 100;
      const centerY = 100;
      const radius = 50;
      const entityIds = factory.createCircle('hydrogen', centerX, centerY, radius, 4);

      entityIds.forEach(entityId => {
        const entity = coordinator.getEntity(entityId);
        const transform = entity.getComponent(Transform);
        const dx = transform.x - centerX;
        const dy = transform.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        expect(distance).toBeCloseTo(radius, 5);
      });
    });

    it('should space elements evenly around circle', () => {
      const entityIds = factory.createCircle('hydrogen', 0, 0, 100, 4);
      const transforms = entityIds.map(entityId => coordinator.getEntity(entityId).getComponent(Transform));

      // Check that elements are evenly spaced around circle
      const angles = transforms.map(t => Math.atan2(t.y, t.x));
      const expectedAngleStep = (2 * Math.PI) / 4;

      // Sort angles for consistent comparison
      angles.sort((a, b) => a - b);

      for (let i = 1; i < angles.length; i++) {
        const angleDiff = angles[i] - angles[i - 1];
        expect(angleDiff).toBeCloseTo(expectedAngleStep, 1);
      }
    });

    it('should support catalyst spawned flag', () => {
      const entityIds = factory.createCircle('hydrogen', 0, 0, 50, 4, true);

      entityIds.forEach(entityId => {
        const entity = coordinator.getEntity(entityId);
        const visuals = entity.getComponent(ElementVisuals);
        expect(visuals.isCatalystSpawned).toBe(true);
      });
    });
  });

  describe('createGrid', () => {
    it('should create correct number of elements', () => {
      const entities = factory.createGrid('hydrogen', 0, 0, 3, 4, 50);

      expect(entities).toHaveLength(12); // 3 cols * 4 rows
    });

    it('should position elements in grid', () => {
      const entityIds = factory.createGrid('hydrogen', 0, 0, 2, 2, 100);
      const transforms = entityIds.map(entityId => coordinator.getEntity(entityId).getComponent(Transform));

      expect(transforms[0].x).toBe(0);
      expect(transforms[0].y).toBe(0);
      expect(transforms[1].x).toBe(100);
      expect(transforms[1].y).toBe(0);
      expect(transforms[2].x).toBe(0);
      expect(transforms[2].y).toBe(100);
      expect(transforms[3].x).toBe(100);
      expect(transforms[3].y).toBe(100);
    });

    it('should use correct spacing', () => {
      const spacing = 75;
      const entityIds = factory.createGrid('hydrogen', 10, 20, 3, 2, spacing);
      const transforms = entityIds.map(entityId => coordinator.getEntity(entityId).getComponent(Transform));

      // Check horizontal spacing
      expect(transforms[1].x - transforms[0].x).toBe(spacing);
      expect(transforms[2].x - transforms[1].x).toBe(spacing);

      // Check vertical spacing
      expect(transforms[3].y - transforms[0].y).toBe(spacing);
    });

    it('should support catalyst spawned flag', () => {
      const entityIds = factory.createGrid('hydrogen', 0, 0, 2, 2, 50, true);

      entityIds.forEach(entityId => {
        const entity = coordinator.getEntity(entityId);
        const visuals = entity.getComponent(ElementVisuals);
        expect(visuals.isCatalystSpawned).toBe(true);
      });
    });
  });

  describe('removeElement', () => {
    it('should destroy entity', () => {
      const entityId = factory.createElement('hydrogen', 0, 0);
      factory.removeElement(entityId);

      expect(coordinator.getEntity(entityId)).toBeUndefined();
    });

    it('should update active count', () => {
      const entityId = factory.createElement('hydrogen', 0, 0);
      expect(factory.stats.activeElements).toBe(1);

      factory.removeElement(entityId);
      expect(factory.stats.activeElements).toBe(0);
    });

    it('should update tier count', () => {
      const entityId = factory.createElement('water', 0, 0); // tier 1
      expect(factory.stats.byTier[1]).toBe(1);

      factory.removeElement(entityId);
      expect(factory.stats.byTier[1]).toBe(0);
    });

    it('should not affect total created count', () => {
      const entityId = factory.createElement('hydrogen', 0, 0);
      expect(factory.stats.totalCreated).toBe(1);

      factory.removeElement(entityId);
      expect(factory.stats.totalCreated).toBe(1); // Should not change
    });
  });

  describe('getStats', () => {
    it('should return statistics object', () => {
      factory.createElement('hydrogen', 0, 0);
      factory.createElement('water', 0, 0);

      const stats = factory.getStats();

      expect(stats.totalCreated).toBe(2);
      expect(stats.activeElements).toBe(2);
      expect(stats.byTier[0]).toBe(1);
      expect(stats.byTier[1]).toBe(1);
    });

    it('should return copy of statistics', () => {
      const stats = factory.getStats();
      stats.totalCreated = 999;
      stats.byTier[0] = 999;

      expect(factory.stats.totalCreated).toBe(0);
      expect(factory.stats.byTier[0]).toBe(0);
    });
  });

  describe('resetStats', () => {
    it('should reset all statistics to zero', () => {
      factory.createElement('hydrogen', 0, 0);
      factory.createElement('water', 0, 0, true);

      factory.resetStats();

      expect(factory.stats.totalCreated).toBe(0);
      expect(factory.stats.activeElements).toBe(0);
      expect(factory.stats.byTier).toEqual({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });
      expect(factory.stats.catalystSpawned).toBe(0);
    });
  });

  describe('getActiveCount', () => {
    it('should return active element count', () => {
      expect(factory.getActiveCount()).toBe(0);

      factory.createElement('hydrogen', 0, 0);
      expect(factory.getActiveCount()).toBe(1);

      factory.createElement('oxygen', 0, 0);
      expect(factory.getActiveCount()).toBe(2);
    });
  });

  describe('getTierCount', () => {
    it('should return count for specific tier', () => {
      factory.createElement('hydrogen', 0, 0); // tier 0
      factory.createElement('oxygen', 0, 0); // tier 0
      factory.createElement('water', 0, 0); // tier 1

      expect(factory.getTierCount(0)).toBe(2);
      expect(factory.getTierCount(1)).toBe(1);
      expect(factory.getTierCount(2)).toBe(0);
    });

    it('should return 0 for invalid tier', () => {
      expect(factory.getTierCount(999)).toBe(0);
    });
  });

  describe('hasElement', () => {
    it('should return true for valid element', () => {
      expect(factory.hasElement('hydrogen')).toBe(true);
      expect(factory.hasElement('water')).toBe(true);
    });

    it('should return false for invalid element', () => {
      mockElementLoader.getElementById.mockReturnValue(undefined);
      expect(factory.hasElement('invalid')).toBe(false);
    });
  });

  describe('getAvailableElements', () => {
    it('should return all element IDs', () => {
      const elements = factory.getAvailableElements();

      expect(elements).toEqual(['hydrogen', 'oxygen', 'water', 'steam', 'plasma']);
      expect(mockElementLoader.getAllElementIds).toHaveBeenCalled();
    });
  });

  describe('getBaseElements', () => {
    it('should return base element IDs', () => {
      const baseElements = factory.getBaseElements();

      expect(baseElements).toEqual(['hydrogen', 'oxygen']);
      expect(mockElementLoader.getBaseElements).toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should work with multiple element types', () => {
      factory.createElement('hydrogen', 0, 0);
      factory.createElement('oxygen', 100, 100);
      factory.createElement('water', 200, 200);
      factory.createElement('steam', 300, 300);
      factory.createElement('plasma', 400, 400);

      expect(factory.stats.totalCreated).toBe(5);
      expect(factory.stats.byTier[0]).toBe(2); // hydrogen, oxygen
      expect(factory.stats.byTier[1]).toBe(1); // water
      expect(factory.stats.byTier[2]).toBe(1); // steam
      expect(factory.stats.byTier[3]).toBe(1); // plasma
    });

    it('should handle create and remove cycles', () => {
      const entityId1 = factory.createElement('hydrogen', 0, 0);
      const entityId2 = factory.createElement('oxygen', 0, 0);

      factory.removeElement(entityId1);
      expect(factory.stats.activeElements).toBe(1);
      expect(factory.stats.totalCreated).toBe(2);

      const entityId3 = factory.createElement('water', 0, 0);
      expect(factory.stats.activeElements).toBe(2);
      expect(factory.stats.totalCreated).toBe(3);
    });
  });
});
