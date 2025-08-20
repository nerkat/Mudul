// Simple test to verify repo.api.ts module loads correctly
import { describe, it, expect } from 'vitest';

describe('API Repo Module', () => {
  it('should export required functions', async () => {
    const apiRepo = await import('./repo.api');
    
    // Check that all required functions are exported
    expect(typeof apiRepo.getRoot).toBe('function');
    expect(typeof apiRepo.getNode).toBe('function'); 
    expect(typeof apiRepo.getChildren).toBe('function');
    expect(typeof apiRepo.getCallByNode).toBe('function');
    expect(typeof apiRepo.listCallsByClient).toBe('function');
    expect(typeof apiRepo.getDashboardId).toBe('function');
    expect(typeof apiRepo.getAllClients).toBe('function');
    expect(typeof apiRepo.getAllCalls).toBe('function');
    expect(typeof apiRepo.clearCache).toBe('function');
  });

  it('should handle getDashboardId correctly', async () => {
    const { getDashboardId } = await import('./repo.api');
    
    // Test static dashboard ID logic
    expect(getDashboardId('root')).toBe('org-dashboard');
    expect(getDashboardId('org:test')).toBe('org-dashboard');
    expect(getDashboardId('client:test')).toBe('client-dashboard');
    expect(getDashboardId('call:test')).toBe('sales-call-default');
    expect(getDashboardId('unknown')).toBe(null);
  });

  it('should warn about unimplemented mutation methods', async () => {
    const { upsertCall, setDashboard, hasExistingAnalysis } = await import('./repo.api');
    
    // Mock console.warn to check if warnings are issued
    const originalWarn = console.warn;
    const warnCalls: string[] = [];
    console.warn = (message: string) => warnCalls.push(message);
    
    try {
      const result = upsertCall('test', {});
      expect(result.updated).toBe(false);
      expect(result.reason).toContain('API mutations not implemented');
      
      setDashboard('test', {});
      expect(hasExistingAnalysis('test', 'hash')).toBe(false);
      
      expect(warnCalls.length).toBeGreaterThan(0);
      expect(warnCalls.some(msg => msg.includes('not implemented in API repo'))).toBe(true);
    } finally {
      console.warn = originalWarn;
    }
  });
});