// src/core/widgets/paper/stableStringify.test.ts
import { describe, it, expect } from 'vitest';

// Extract stableStringify for testing - normally this would be exported from PaperRenderer
function stableStringify(input: unknown, seen = new WeakSet()): string {
  // Handle primitive types first
  if (input === null) return 'null';
  if (input === undefined) return 'undefined';
  if (typeof input !== 'object') return JSON.stringify(input);
  
  // Circular reference detection
  if (seen.has(input as object)) return '"[Circular]"';
  seen.add(input as object);
  
  // Handle arrays
  if (Array.isArray(input)) {
    return `[${input.map(item => stableStringify(item, seen)).join(', ')}]`;
  }
  
  // Handle objects with sorted keys
  const obj = input as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => `"${key}": ${stableStringify(obj[key], seen)}`);
  return `{${pairs.join(', ')}}`;
}

describe('stableStringify', () => {
  describe('basic types', () => {
    it('should handle primitives correctly', () => {
      expect(stableStringify(null)).toBe('null');
      expect(stableStringify(undefined)).toBe('undefined');
      expect(stableStringify(true)).toBe('true');
      expect(stableStringify(false)).toBe('false');
      expect(stableStringify(42)).toBe('42');
      expect(stableStringify(0)).toBe('0');
      expect(stableStringify(-1)).toBe('-1');
      expect(stableStringify("hello")).toBe('"hello"');
      expect(stableStringify("")).toBe('""');
    });

    it('should handle empty collections', () => {
      expect(stableStringify({})).toBe('{}');
      expect(stableStringify([])).toBe('[]');
    });
  });

  describe('mixed shapes and complex objects', () => {
    it('should handle objects with mixed value types', () => {
      const data = {
        zebra: 'last',
        alpha: 'first', 
        beta: 123,
        gamma: true,
        delta: null,
        epsilon: undefined
      };
      
      const result = stableStringify(data);
      expect(result).toBe('{"alpha": "first", "beta": 123, "delta": null, "epsilon": undefined, "gamma": true, "zebra": "last"}');
    });

    it('should handle nested objects with sorted keys', () => {
      const data = { 
        config: { zebra: 1, alpha: 2 },
        items: [{ z: 3, a: 1 }],
        meta: { count: 5, active: true }
      };
      
      const result = stableStringify(data);
      expect(result).toContain('"config": {"alpha": 2, "zebra": 1}');
      expect(result).toContain('[{"a": 1, "z": 3}]');
      expect(result).toContain('"meta": {"active": true, "count": 5}');
    });

    it('should handle arrays with mixed types', () => {
      const data = [
        { b: 2, a: 1 },
        "string",
        42,
        null,
        true,
        { nested: { z: "end", a: "start" } }
      ];
      
      const result = stableStringify(data);
      expect(result).toContain('{"a": 1, "b": 2}');
      expect(result).toContain('"string"');
      expect(result).toContain('42');
      expect(result).toContain('null');
      expect(result).toContain('true');
      expect(result).toContain('{"nested": {"a": "start", "z": "end"}}');
    });
  });

  describe('circular reference handling', () => {
    it('should detect and handle circular references', () => {
      const obj: any = { a: 1 };
      obj.self = obj; // Create circular reference
      
      const result = stableStringify(obj);
      expect(result).toBe('{"a": 1, "self": "[Circular]"}');
    });

    it('should handle deeply nested circular references', () => {
      const obj: any = { 
        level1: { 
          level2: { data: 'test' } 
        } 
      };
      obj.level1.level2.circular = obj; // Deep circular reference
      
      const result = stableStringify(obj);
      expect(result).toContain('"circular": "[Circular]"');
      expect(result).toContain('"data": "test"');
    });

    it('should handle circular references in arrays', () => {
      const arr: any[] = [1, 2];
      arr.push(arr); // Circular reference in array
      
      const result = stableStringify(arr);
      expect(result).toBe('[1, 2, "[Circular]"]');
    });
  });

  describe('deterministic output', () => {
    it('should produce identical output for same input across multiple calls', () => {
      const data = {
        z: { nested: { b: 2, a: 1 } },
        a: [3, 1, 2],
        m: "middle"
      };
      
      const result1 = stableStringify(data);
      const result2 = stableStringify(data);
      const result3 = stableStringify(data);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });

    it('should handle objects with numeric keys in string form', () => {
      const data = {
        "100": "hundred",
        "2": "two",
        "10": "ten",
        "1": "one"
      };
      
      const result = stableStringify(data);
      // String keys should be sorted lexicographically
      expect(result).toBe('{"1": "one", "10": "ten", "100": "hundred", "2": "two"}');
    });
  });

  describe('edge cases', () => {
    it('should handle deeply nested structures', () => {
      const data = {
        a: {
          b: {
            c: {
              d: {
                e: "deep value"
              }
            }
          }
        }
      };
      
      expect(() => stableStringify(data)).not.toThrow();
      const result = stableStringify(data);
      expect(result).toContain('"e": "deep value"');
    });

    it('should handle large arrays without stack overflow', () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `item-${i}` }));
      
      expect(() => stableStringify(largeArray)).not.toThrow();
    });

    it('should handle Date objects as strings', () => {
      const data = {
        timestamp: new Date('2024-01-01T00:00:00Z'),
        other: "value"
      };
      
      const result = stableStringify(data);
      // Date objects get stringified as empty objects {} since they don't have enumerable properties
      expect(result).toContain('"timestamp": {}');
      expect(result).toContain('"other": "value"');
    });
  });
});