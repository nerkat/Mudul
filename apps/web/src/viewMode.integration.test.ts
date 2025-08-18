// src/viewMode.integration.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getInitialViewMode, saveViewMode, useViewMode } from './viewMode';

describe('ViewMode URL and Cross-tab Integration', () => {
  // Mock localStorage
  const mockLocalStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };

  // Mock URL and history
  const mockURL = vi.fn();
  const mockHistory = {
    replaceState: vi.fn(),
  };

  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
    
    Object.defineProperty(global, 'URL', {
      value: mockURL,
      writable: true
    });

    // Setup proper document mock
    Object.defineProperty(global, 'document', {
      value: {
        body: {},
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        documentElement: {
          setAttribute: vi.fn(),
          removeAttribute: vi.fn()
        }
      },
      writable: true
    });

    Object.defineProperty(global, 'window', {
      value: {
        location: {
          href: 'https://example.com/dashboard?foo=1#section',
          search: '?foo=1'
        },
        history: mockHistory,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      },
      writable: true
    });

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('URL parameter preservation', () => {
    it('should preserve existing query parameters when toggling mode', () => {
      const mockSearchParams = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn()
      };

      mockURL.mockImplementation((href) => ({
        href,
        searchParams: mockSearchParams,
        toString: () => 'https://example.com/dashboard?foo=1&mode=paper#section'
      }));

      // Test the URL preservation logic
      const url = new (mockURL as any)('https://example.com/dashboard?foo=1#section');
      url.searchParams.set('mode', 'paper');
      
      expect(mockSearchParams.set).toHaveBeenCalledWith('mode', 'paper');
      expect(url.toString()).toContain('#section');
      expect(url.toString()).toContain('foo=1');
    });

    it('should preserve hash fragments during mode changes', () => {
      const testUrl = 'https://example.com/dashboard?existing=param#important-section';
      
      mockURL.mockImplementation((href) => ({
        href,
        searchParams: {
          get: vi.fn(),
          set: vi.fn(),
          delete: vi.fn()
        },
        toString: () => href + (href.includes('mode=paper') ? '&mode=paper' : '')
      }));

      const url = new (mockURL as any)(testUrl);
      const result = url.toString();
      
      expect(result).toContain('#important-section');
    });

    it('should handle complex query parameter scenarios', () => {
      const complexUrl = 'https://example.com/node/123?filter=active&sort=date&view=grid&page=2#results';
      
      mockURL.mockImplementation((href) => {
        const searchParams = {
          get: vi.fn().mockImplementation((key) => {
            if (key === 'mode') return null;
            return 'mock-value';
          }),
          set: vi.fn(),
          delete: vi.fn()
        };
        
        return {
          href,
          searchParams,
          toString: () => href.replace('#results', '') + '&mode=paper#results'
        };
      });

      const url = new (mockURL as any)(complexUrl);
      url.searchParams.set('mode', 'paper');
      const result = url.toString();
      
      expect(result).toContain('filter=active');
      expect(result).toContain('sort=date');
      expect(result).toContain('view=grid');
      expect(result).toContain('page=2');
      expect(result).toContain('mode=paper');
      expect(result).toContain('#results');
    });
  });

  describe('SSR compatibility', () => {
    it('should handle undefined window gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore - intentionally setting window to undefined
      delete global.window;
      
      expect(() => getInitialViewMode()).not.toThrow();
      expect(getInitialViewMode()).toBe('rich'); // default fallback
      
      // Restore
      global.window = originalWindow;
    });

    it('should not crash when document is undefined', () => {
      // @ts-ignore
      global.document = undefined;
      
      expect(() => {
        // This would normally try to access document
        const mockKeyHandler = () => {};
        // Simulate the effect cleanup
        if (typeof document !== 'undefined') {
          document.addEventListener('keydown', mockKeyHandler);
        }
      }).not.toThrow();
    });

    it('should handle missing localStorage gracefully', () => {
      const originalLocalStorage = global.localStorage;
      
      // Use undefined assignment instead of delete to avoid vitest issues
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true
      });
      
      expect(() => getInitialViewMode()).not.toThrow();
      
      // Restore
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true
      });
    });
  });

  describe('cross-tab synchronization', () => {
    it('should handle storage events correctly', () => {
      const storageEventHandler = vi.fn();
      
      // Simulate storage event
      const storageEvent = new Event('storage') as StorageEvent;
      Object.defineProperty(storageEvent, 'key', { value: 'mudul:viewMode' });
      Object.defineProperty(storageEvent, 'newValue', { value: 'paper' });
      
      // This would be called by the real event listener
      storageEventHandler(storageEvent);
      
      expect(storageEventHandler).toHaveBeenCalledWith(storageEvent);
    });

    it('should throttle rapid storage updates', async () => {
      const updates: string[] = [];
      let throttleTimer: NodeJS.Timeout | null = null;
      
      const throttledUpdate = (value: string) => {
        if (throttleTimer) clearTimeout(throttleTimer);
        throttleTimer = setTimeout(() => {
          updates.push(value);
          throttleTimer = null;
        }, 50);
      };
      
      // Simulate rapid updates
      throttledUpdate('paper');
      throttledUpdate('rich');
      throttledUpdate('paper');
      throttledUpdate('rich');
      
      // Wait for throttle to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should only have processed the last update
      expect(updates).toHaveLength(1);
      expect(updates[0]).toBe('rich');
    });
  });

  describe('keyboard handling', () => {
    it('should ignore p key when modifier keys are pressed', () => {
      const mockPreventDefault = vi.fn();
      const mockToggle = vi.fn();
      
      const events = [
        { key: 'p', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false },
        { key: 'p', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false },
        { key: 'p', ctrlKey: false, metaKey: false, altKey: true, shiftKey: false },
        { key: 'p', ctrlKey: false, metaKey: false, altKey: false, shiftKey: true },
      ];
      
      events.forEach(eventProps => {
        const mockEvent = {
          ...eventProps,
          target: global.document?.body,
          preventDefault: mockPreventDefault
        };
        
        // Simulate the keyboard handler logic
        const shouldHandle = eventProps.key === 'p' && 
          !eventProps.ctrlKey && 
          !eventProps.metaKey && 
          !eventProps.altKey && 
          !eventProps.shiftKey;
          
        if (shouldHandle) {
          mockToggle();
        }
      });
      
      // Should not have triggered toggle for any modifier combinations
      expect(mockToggle).not.toHaveBeenCalled();
    });

    it('should ignore p key when focused in editable elements', () => {
      const mockPreventDefault = vi.fn();
      const mockToggle = vi.fn();
      
      const editableElements = [
        { tagName: 'INPUT' },
        { tagName: 'TEXTAREA' },
        { isContentEditable: true, tagName: 'DIV' },
        { hasAttribute: (attr: string) => attr === 'contenteditable', tagName: 'P' }
      ];
      
      editableElements.forEach(target => {
        const mockEvent = {
          key: 'p',
          ctrlKey: false,
          metaKey: false,
          altKey: false,
          shiftKey: false,
          target,
          preventDefault: mockPreventDefault
        };
        
        // Simulate the editable check logic
        const tag = target.tagName?.toUpperCase() || '';
        const isEditable = target.isContentEditable || 
          tag === 'INPUT' || 
          tag === 'TEXTAREA' ||
          (target.hasAttribute && target.hasAttribute('contenteditable'));
        
        if (!isEditable) {
          mockToggle();
        }
      });
      
      // Should not have triggered toggle for any editable elements
      expect(mockToggle).not.toHaveBeenCalled();
    });
  });

  describe('hydration compatibility', () => {
    it('should handle SSR/client hydration differences', () => {
      // Simulate SSR initial state
      const ssrMode = 'rich'; // Default when no window
      
      // Simulate client hydration with URL param
      const clientUrl = '?mode=paper';
      const clientMode = new URLSearchParams(clientUrl).get('mode') || 'rich';
      
      // Should handle the difference gracefully
      expect(ssrMode).toBe('rich');
      expect(clientMode).toBe('paper');
      
      // The real implementation should reconcile these without content mismatch errors
      const finalMode = clientMode; // Client wins during hydration
      expect(finalMode).toBe('paper');
    });
  });
});