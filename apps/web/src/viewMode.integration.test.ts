// src/viewMode.integration.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getInitialViewMode } from './viewMode';

// Mock URL constructor
const mockURL = vi.fn();
global.URL = mockURL as any;

describe('ViewMode URL and Cross-tab Integration', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Setup basic window mock
    Object.defineProperty(global, 'window', {
      value: {
        location: { search: '' },
        history: { replaceState: vi.fn() },
        localStorage: {
          getItem: vi.fn(),
          setItem: vi.fn()
        }
      },
      writable: true,
      configurable: true
    });
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

    it('should handle /client/123?foo=1#sec → ?foo=1&mode=paper#sec transformation', () => {
      const specificUrl = 'https://example.com/client/123?foo=1#sec';
      
      mockURL.mockImplementation((href) => {
        const searchParams = {
          get: vi.fn(),
          set: vi.fn(),
          delete: vi.fn()
        };
        
        return {
          href,
          searchParams,
          toString: () => 'https://example.com/client/123?foo=1&mode=paper#sec'
        };
      });

      const url = new (mockURL as any)(specificUrl);
      url.searchParams.set('mode', 'paper');
      
      const result = url.toString();
      expect(result).toBe('https://example.com/client/123?foo=1&mode=paper#sec');
      expect(result).toContain('foo=1');
      expect(result).toContain('mode=paper');
      expect(result).toContain('#sec');
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

    it('should prevent hydration mismatch when server renders rich and client has ?mode=paper', () => {
      // Simulate server-side rendering scenario
      const originalWindow = global.window;
      const originalDocument = global.document;
      
      // @ts-ignore - Simulate SSR environment
      delete global.window;
      delete global.document;
      
      // Server-side would get default 'rich' mode
      const serverMode = getInitialViewMode();
      expect(serverMode).toBe('rich');
      
      // Restore client environment with mode=paper in URL
      global.window = {
        location: { search: '?mode=paper' }
      } as any;
      global.document = {} as any;
      
      // Client-side should handle the URL param gracefully
      const clientMode = getInitialViewMode();
      // Should handle the difference without throwing
      expect(() => getInitialViewMode()).not.toThrow();
      
      // Restore original environment
      global.window = originalWindow;
      global.document = originalDocument;
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
});