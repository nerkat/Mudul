// src/design/tokens.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { tokens, toCssVars, injectCssVars, px, rem, shadow } from './tokens';

// Mock DOM for SSR testing
const mockDocumentElement = {
  style: {
    setProperty: vi.fn()
  }
};

Object.defineProperty(window, 'document', {
  value: {
    documentElement: mockDocumentElement
  },
  writable: true
});

describe('Tokens', () => {
  describe('helper functions', () => {
    it('should convert numbers to px', () => {
      expect(px(16)).toBe('16px');
      expect(px(0)).toBe('0px');
    });

    it('should convert numbers to rem', () => {
      expect(rem(16)).toBe('1rem');
      expect(rem(24)).toBe('1.5rem');
      expect(rem(8)).toBe('0.5rem');
    });

    it('should convert shadow arrays to CSS shadow strings', () => {
      expect(shadow([0, 1, 2, 0.25])).toBe('0px 1px 2px rgba(0,0,0,0.25)');
      expect(shadow([0, 6, 16, 0.35])).toBe('0px 6px 16px rgba(0,0,0,0.35)');
    });
  });

  describe('toCssVars', () => {
    it('should convert tokens to CSS variables', () => {
      const vars = toCssVars(tokens);
      
      // Test color variables
      expect(vars['--bg-base']).toBe('#0B0F14');
      expect(vars['--brand-base']).toBe('#4C8CF6');
      expect(vars['--text-primary']).toBe('#E6EEF8');
      
      // Test spacing variables
      expect(vars['--space-sm']).toBe('8px');
      expect(vars['--space-lg']).toBe('16px');
      
      // Test radius variables
      expect(vars['--radius-md']).toBe('10px');
      
      // Test shadow variables
      expect(vars['--shadow-sm']).toBe('0px 1px 2px rgba(0,0,0,0.25)');
      expect(vars['--shadow-md']).toBe('0px 6px 16px rgba(0,0,0,0.35)');
      
      // Test typography variables
      expect(vars['--font-family']).toBe('"Inter", ui-sans-serif, system-ui');
      expect(vars['--font-size-h1']).toBe('28px');
    });

    it('should include all expected CSS variables', () => {
      const vars = toCssVars(tokens);
      const expectedVars = [
        '--bg-base', '--bg-surface', '--bg-elevated',
        '--text-primary', '--text-secondary', '--text-muted',
        '--brand-base', '--brand-hover', '--brand-active',
        '--success', '--warning', '--error',
        '--chip-border', '--chip-bg',
        '--space-xs', '--space-sm', '--space-md', '--space-lg', '--space-xl', '--space-xxl',
        '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl',
        '--shadow-sm', '--shadow-md',
        '--font-family', '--font-size-sm', '--font-size-md', '--font-size-lg', 
        '--font-size-xl', '--font-size-h1', '--font-size-h2'
      ];
      
      expectedVars.forEach(varName => {
        expect(vars[varName]).toBeDefined();
      });
    });
  });

  describe('injectCssVars', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      // Clean up the window mock
      delete (global as any).window;
    });

    it('should inject CSS variables into document root', () => {
      // Setup window mock
      (global as any).window = {};
      
      injectCssVars(tokens);
      
      // Verify setProperty was called for each variable
      const vars = toCssVars(tokens);
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledTimes(Object.keys(vars).length);
      
      // Test a few specific calls
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--bg-base', '#0B0F14');
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--brand-base', '#4C8CF6');
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith('--space-lg', '16px');
    });

    it('should handle SSR gracefully (no window)', () => {
      // Ensure window is undefined
      delete (global as any).window;
      
      expect(() => {
        injectCssVars(tokens);
      }).not.toThrow();
      
      // Should not have called setProperty
      expect(mockDocumentElement.style.setProperty).not.toHaveBeenCalled();
    });
  });

  describe('tokens structure', () => {
    it('should have all required color properties', () => {
      expect(tokens.color.bg.base).toBeDefined();
      expect(tokens.color.bg.surface).toBeDefined();
      expect(tokens.color.bg.elevated).toBeDefined();
      
      expect(tokens.color.text.primary).toBeDefined();
      expect(tokens.color.text.secondary).toBeDefined();
      expect(tokens.color.text.muted).toBeDefined();
      
      expect(tokens.color.brand.base).toBeDefined();
      expect(tokens.color.brand.hover).toBeDefined();
      expect(tokens.color.brand.active).toBeDefined();
      
      // Test legacy support
      expect(tokens.color.brand[600]).toBe(tokens.color.brand.base);
      expect(tokens.color.brand[700]).toBe(tokens.color.brand.hover);
      expect(tokens.color.brand[800]).toBe(tokens.color.brand.active);
    });

    it('should have all required spacing values', () => {
      expect(tokens.space.xs).toBe(4);
      expect(tokens.space.sm).toBe(8);
      expect(tokens.space.md).toBe(12);
      expect(tokens.space.lg).toBe(16);
      expect(tokens.space.xl).toBe(24);
      expect(tokens.space.xxl).toBe(32);
    });

    it('should have all required radius values', () => {
      expect(tokens.radius.sm).toBe(6);
      expect(tokens.radius.md).toBe(10);
      expect(tokens.radius.lg).toBe(14);
      expect(tokens.radius.xl).toBe(20);
    });

    it('should have shadow arrays with correct structure', () => {
      expect(Array.isArray(tokens.shadow.sm)).toBe(true);
      expect(tokens.shadow.sm).toHaveLength(4);
      expect(Array.isArray(tokens.shadow.md)).toBe(true);
      expect(tokens.shadow.md).toHaveLength(4);
    });

    it('should have font configuration', () => {
      expect(tokens.font.family).toBeDefined();
      expect(tokens.font.size.sm).toBe(12);
      expect(tokens.font.size.md).toBe(14);
      expect(tokens.font.size.lg).toBe(16);
      expect(tokens.font.size.xl).toBe(18);
      expect(tokens.font.size.h1).toBe(28);
      expect(tokens.font.size.h2).toBe(22);
    });
  });
});