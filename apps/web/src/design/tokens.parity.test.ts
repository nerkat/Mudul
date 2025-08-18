// src/design/tokens.parity.test.ts
import { describe, it, expect } from 'vitest';
import { tokens, toCssVars, px, rem, shadow, injectCssVars } from './tokens';
import { appTheme } from './theme';

describe('Tokens and Theme Parity', () => {
  describe('CSS variables emission', () => {
    it('should emit all expected CSS variables', () => {
      const cssVars = toCssVars(tokens);
      
      // Check color variables
      expect(cssVars['--bg-base']).toBe(tokens.color.bg.base);
      expect(cssVars['--bg-surface']).toBe(tokens.color.bg.surface);
      expect(cssVars['--text-primary']).toBe(tokens.color.text.primary);
      expect(cssVars['--text-secondary']).toBe(tokens.color.text.secondary);
      expect(cssVars['--text-muted']).toBe(tokens.color.text.muted);
      expect(cssVars['--brand-base']).toBe(tokens.color.brand.base);
      
      // Check spacing variables
      expect(cssVars['--space-sm']).toBe('8px');
      expect(cssVars['--space-md']).toBe('12px');
      expect(cssVars['--space-lg']).toBe('16px');
      
      // Check radius variables
      expect(cssVars['--radius-sm']).toBe('6px');
      expect(cssVars['--radius-md']).toBe('10px');
      
      // Check shadow variables
      expect(cssVars['--shadow-sm']).toBe('0px 1px 2px rgba(0,0,0,0.25)');
      expect(cssVars['--shadow-md']).toBe('0px 6px 16px rgba(0,0,0,0.35)');
    });

    it('should handle unitless tokens correctly', () => {
      const cssVars = toCssVars(tokens);
      
      // Verify that numeric tokens are converted to px
      expect(cssVars['--space-xs']).toBe('4px');
      expect(cssVars['--font-size-lg']).toBe('16px');
      expect(cssVars['--font-size-h1']).toBe('28px');
    });
  });

  describe('MUI theme token mapping', () => {
    it('should map tokens to MUI palette correctly', () => {
      expect(appTheme.palette.primary.main).toBe(tokens.color.brand.base);
      expect(appTheme.palette.success.main).toBe(tokens.color.success);
      expect(appTheme.palette.warning.main).toBe(tokens.color.warning);
      expect(appTheme.palette.error.main).toBe(tokens.color.error);
      expect(appTheme.palette.background.default).toBe(tokens.color.bg.base);
      expect(appTheme.palette.background.paper).toBe(tokens.color.bg.surface);
    });

    it('should map text colors including disabled/muted parity', () => {
      expect(appTheme.palette.text.primary).toBe(tokens.color.text.primary);
      expect(appTheme.palette.text.secondary).toBe(tokens.color.text.secondary);
      expect(appTheme.palette.text.disabled).toBe(tokens.color.text.muted);
    });

    it('should use token values for shape and typography', () => {
      expect(appTheme.shape.borderRadius).toBe(tokens.radius.md);
      expect(appTheme.typography.fontFamily).toBe(tokens.font.family);
    });
  });

  describe('helper functions', () => {
    it('should convert numbers to px correctly', () => {
      expect(px(0)).toBe('0px');
      expect(px(8)).toBe('8px');
      expect(px(16)).toBe('16px');
      expect(px(100)).toBe('100px');
    });

    it('should convert numbers to rem correctly', () => {
      expect(rem(16)).toBe('1rem');
      expect(rem(32)).toBe('2rem');
      expect(rem(8)).toBe('0.5rem');
      expect(rem(24)).toBe('1.5rem');
    });

    it('should format shadows correctly', () => {
      expect(shadow([0, 1, 2, 0.25])).toBe('0px 1px 2px rgba(0,0,0,0.25)');
      expect(shadow([2, 4, 8, 0.5])).toBe('2px 4px 8px rgba(0,0,0,0.5)');
      expect(shadow([0, 0, 10, 0.1])).toBe('0px 0px 10px rgba(0,0,0,0.1)');
    });
  });

  describe('consistency checks', () => {
    it('should have consistent color values between tokens and CSS vars', () => {
      const cssVars = toCssVars(tokens);
      
      // Every color token should have a corresponding CSS variable
      expect(cssVars['--bg-base']).toBe(tokens.color.bg.base);
      expect(cssVars['--bg-surface']).toBe(tokens.color.bg.surface);
      expect(cssVars['--bg-elevated']).toBe(tokens.color.bg.elevated);
    });

    it('should have consistent spacing values', () => {
      const cssVars = toCssVars(tokens);
      
      // Spacing tokens should be converted to px
      expect(cssVars['--space-xs']).toBe(`${tokens.space.xs}px`);
      expect(cssVars['--space-sm']).toBe(`${tokens.space.sm}px`);
      expect(cssVars['--space-md']).toBe(`${tokens.space.md}px`);
      expect(cssVars['--space-lg']).toBe(`${tokens.space.lg}px`);
    });

    it('should maintain type safety with readonly tokens', () => {
      // This test ensures that tokens maintain their structure
      expect(tokens.color.brand.base).toBe('#4C8CF6');
      expect(tokens.space.lg).toBe(16);
      expect(tokens.radius.md).toBe(10);
      
      // Test that tokens object is properly typed and accessible
      expect(typeof tokens.color.text.muted).toBe('string');
      expect(typeof tokens.space.xs).toBe('number');
    });
  });

  describe('SSR compatibility', () => {
    it('should handle CSS variable injection with SSR guards', () => {
      const originalWindow = global.window;
      // @ts-ignore - intentionally setting window to undefined
      delete global.window;
      
      // Should not throw when window is undefined
      expect(() => injectCssVars(tokens)).not.toThrow();
      
      // Restore window
      global.window = originalWindow;
    });

    it('should handle document access safely', () => {
      const originalDocument = global.document;
      
      // Use undefined assignment instead of delete to avoid vitest issues  
      Object.defineProperty(global, 'document', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      // Should not throw when document is undefined
      expect(() => injectCssVars(tokens)).not.toThrow();
      
      // Restore document
      Object.defineProperty(global, 'document', {
        value: originalDocument,
        writable: true,
        configurable: true
      });
    });
  });

  describe('runtime token swapping', () => {
    it('should support token modification for theme switching', () => {
      // Create a modified token set (e.g., light theme)
      const lightTokens = {
        ...tokens,
        color: {
          ...tokens.color,
          bg: { base: '#FFFFFF', surface: '#F5F5F5', elevated: '#FFFFFF' },
          text: { primary: '#000000', secondary: '#666666', muted: '#999999' }
        }
      };

      const lightCssVars = toCssVars(lightTokens);
      
      expect(lightCssVars['--bg-base']).toBe('#FFFFFF');
      expect(lightCssVars['--text-primary']).toBe('#000000');
      expect(lightCssVars['--text-muted']).toBe('#999999');
    });

    it('should maintain non-color tokens during theme switching', () => {
      const modifiedTokens = {
        ...tokens,
        color: { ...tokens.color, bg: { ...tokens.color.bg, base: '#NEW_COLOR' } }
      };

      const cssVars = toCssVars(modifiedTokens);
      
      // Color should change
      expect(cssVars['--bg-base']).toBe('#NEW_COLOR');
      
      // Non-color tokens should remain the same
      expect(cssVars['--space-lg']).toBe(`${tokens.space.lg}px`);
      expect(cssVars['--radius-md']).toBe(`${tokens.radius.md}px`);
      expect(cssVars['--font-family']).toBe(tokens.font.family);
    });
  });
});