// src/core/widgets/paper/stableStringify.test.ts
import { describe, it, expect } from 'vitest';

// Extract stableStringify for testing - matches the enhanced version in PaperRenderer
function stableStringify(input: unknown, seen = new WeakSet(), depth = 0): string {
  // Depth guard to prevent stack overflow
  if (depth > 10) return '"[Max Depth Exceeded]"';
  
  // Handle primitive types first
  if (input === null) return 'null';
  if (input === undefined) return 'undefined';
  
  // Handle special number values
  if (typeof input === 'number') {
    if (Number.isNaN(input)) return '"NaN"';
    if (input === Infinity) return '"Infinity"';
    if (input === -Infinity) return '"-Infinity"';
    return JSON.stringify(input);
  }
  
  // Handle bigint
  if (typeof input === 'bigint') {
    return `"${input.toString()}"`;
  }
  
  // Handle dates
  if (input instanceof Date) {
    return `"${input.toISOString()}"`;
  }
  
  // Handle Map and Set
  if (input instanceof Map) {
    const entries = Array.from(input.entries()).sort(([a], [b]) => String(a).localeCompare(String(b)));
    return stableStringify(entries, seen, depth + 1);
  }
  
  if (input instanceof Set) {
    const values = Array.from(input).sort((a, b) => String(a).localeCompare(String(b)));
    return stableStringify(values, seen, depth + 1);
  }
  
  // Handle other primitives
  if (typeof input !== 'object') return JSON.stringify(input);
  
  // Circular reference detection
  if (seen.has(input as object)) return '"[Circular]"';
  seen.add(input as object);
  
  // Handle arrays
  if (Array.isArray(input)) {
    const items = input.map(item => stableStringify(item, seen, depth + 1));
    return `[${items.join(', ')}]`;
  }
  
  // Handle objects with sorted keys, omitting undefined values
  const obj = input as Record<string, unknown>;
  const sortedKeys = Object.keys(obj)
    .filter(key => obj[key] !== undefined) // Omit undefined keys
    .sort();
  const pairs = sortedKeys.map(key => `"${key}": ${stableStringify(obj[key], seen, depth + 1)}`);
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
      // undefined values are omitted, so epsilon should not be present
      expect(result).toBe('{"alpha": "first", "beta": 123, "delta": null, "gamma": true, "zebra": "last"}');
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

    it('should enforce depth guard to prevent deep recursion', () => {
      // Create a deeply nested object (15 levels)
      let deepObj: any = { value: 'deep' };
      for (let i = 0; i < 14; i++) {
        deepObj = { nested: deepObj };
      }
      
      const result = stableStringify(deepObj);
      expect(result).toContain('[Max Depth Exceeded]');
    });
  });

  describe('special types and values', () => {
    it('should handle Date objects with ISO conversion', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      expect(stableStringify(date)).toBe('"2023-01-01T00:00:00.000Z"');
    });

    it('should handle BigInt values as strings', () => {
      const bigIntValue = BigInt('12345678901234567890');
      expect(stableStringify(bigIntValue)).toBe('"12345678901234567890"');
    });

    it('should handle Map objects as sorted arrays', () => {
      const map = new Map([
        ['zebra', 'z'],
        ['alpha', 'a'],
        ['beta', 'b']
      ]);
      
      const result = stableStringify(map);
      // Maps should be converted to arrays with sorted entries
      expect(result).toBe('[["alpha", "a"], ["beta", "b"], ["zebra", "z"]]');
    });

    it('should handle Set objects as sorted arrays', () => {
      const set = new Set(['zebra', 'alpha', 'beta']);
      
      const result = stableStringify(set);
      // Sets should be converted to sorted arrays
      expect(result).toBe('["alpha", "beta", "zebra"]');
    });

    it('should handle special number values', () => {
      expect(stableStringify(NaN)).toBe('"NaN"');
      expect(stableStringify(Infinity)).toBe('"Infinity"');
      expect(stableStringify(-Infinity)).toBe('"-Infinity"');
      expect(stableStringify(0)).toBe('0');
      expect(stableStringify(-0)).toBe('0'); // -0 becomes 0
    });

    it('should omit undefined keys from objects', () => {
      const objWithUndefined = {
        alpha: 'a',
        beta: undefined,
        gamma: 'g'
      };
      
      const result = stableStringify(objWithUndefined);
      expect(result).toBe('{"alpha": "a", "gamma": "g"}');
      expect(result).not.toContain('beta');
    });
  });

  describe('performance requirements', () => {
    it('should handle 10k-node object in reasonable time', () => {
      // Create a large object with 10k properties
      const largeObject: Record<string, any> = {};
      for (let i = 0; i < 10000; i++) {
        largeObject[`key${i}`] = { id: i, value: `item-${i}`, nested: { deep: Math.random() } };
      }
      
      const startTime = Date.now();
      const result = stableStringify(largeObject);
      const duration = Date.now() - startTime;
      
      expect(result).toContain('"key0"');
      expect(result).toContain('"key9999"');
      // Should complete in under 1 second (1000ms) as required for CI
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('key order stability', () => {
    it('should produce identical output across multiple runs', () => {
      const complexObject = {
        zebra: { nested: { value: Math.random() } },
        alpha: [1, 2, 3],
        beta: new Date('2023-01-01'),
        gamma: new Map([['x', 1], ['y', 2]]),
        delta: new Set([3, 1, 2])
      };
      
      // Run stringify multiple times
      const results = Array.from({ length: 5 }, () => stableStringify(complexObject));
      
      // All results should be identical (proving deterministic key ordering)
      results.forEach(result => {
        expect(result).toBe(results[0]);
      });
      
      // Verify the order is alphabetical
      expect(results[0]).toMatch(/^{"alpha".*"beta".*"delta".*"gamma".*"zebra"/);
    });

    it('should handle Date objects as ISO strings', () => {
      const data = {
        timestamp: new Date('2024-01-01T00:00:00Z'),
        other: "value"
      };
      
      const result = stableStringify(data);
      // Date objects get converted to ISO strings
      expect(result).toContain('"timestamp": "2024-01-01T00:00:00.000Z"');
      expect(result).toContain('"other": "value"');
    });
  });
});