import { describe, it, expect } from 'vitest';

describe('Example Unit Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(true).toBe(true);
  });

  it('should perform basic math', () => {
    expect(2 + 2).toBe(4);
  });

  it('should work with arrays', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  it('should work with objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.value).toBe(42);
  });
});

// Example test for utility functions (to be implemented)
describe('Math Utilities', () => {
  it('should calculate distance between two points', () => {
    // This will be implemented when we extract utils
    const distance = (x1, y1, x2, y2) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      return Math.sqrt(dx * dx + dy * dy);
    };

    expect(distance(0, 0, 3, 4)).toBe(5);
    expect(distance(0, 0, 0, 0)).toBe(0);
  });

  it('should lerp between two values', () => {
    const lerp = (a, b, t) => a + (b - a) * t;

    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('should clamp values within range', () => {
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
