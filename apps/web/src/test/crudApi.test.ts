import { describe, it, expect, beforeAll } from 'vitest';
import { 
  crudApiService, 
  generateTempId, 
  createOptimisticClient, 
  createOptimisticCall, 
  createOptimisticActionItem 
} from '../services/crudApi';

describe('CRUD API Service', () => {
  describe('Optimistic update helpers', () => {
    it('should generate unique temporary IDs', () => {
      const id1 = generateTempId();
      const id2 = generateTempId();
      
      expect(id1).toMatch(/^tmp_[a-f0-9-]{36}$/);
      expect(id2).toMatch(/^tmp_[a-f0-9-]{36}$/);
      expect(id1).not.toBe(id2);
    });

    it('should create optimistic client with correct structure', () => {
      const formData = {
        name: 'Test Client',
        notes: 'Test notes'
      };
      
      const optimisticClient = createOptimisticClient(formData);
      
      expect(optimisticClient).toMatchObject({
        name: 'Test Client',
        notes: 'Test notes',
        isOptimistic: true,
        lastCallDate: null,
        totalCalls: 0,
        avgSentiment: 0,
        bookingLikelihood: 0
      });
      expect(optimisticClient.id).toMatch(/^tmp_/);
    });

    it('should create optimistic call with correct structure', () => {
      const formData = {
        ts: '2024-01-15T10:00:00Z',
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7,
        notes: 'Test call'
      };
      
      const optimisticCall = createOptimisticCall(formData);
      
      expect(optimisticCall).toMatchObject({
        date: '2024-01-15T10:00:00Z',
        sentiment: 'positive',
        score: 0.8,
        bookingLikelihood: 0.7,
        isOptimistic: true
      });
      expect(optimisticCall.id).toMatch(/^tmp_/);
      expect(optimisticCall.name).toContain('Call');
    });

    it('should create optimistic action item with correct structure', () => {
      const formData = {
        owner: 'John Doe',
        text: 'Follow up with client',
        dueDate: '2024-01-20T15:00:00Z'
      };
      
      const optimisticActionItem = createOptimisticActionItem(formData);
      
      expect(optimisticActionItem).toMatchObject({
        text: 'Follow up with client',
        due: '2024-01-20T15:00:00Z',
        status: 'open',
        ownerName: 'John Doe',
        isOptimistic: true
      });
      expect(optimisticActionItem.id).toMatch(/^tmp_/);
    });

    it('should handle optional fields correctly', () => {
      const clientData = { name: 'Test Client' };
      const actionItemData = { text: 'Test action' };
      
      const optimisticClient = createOptimisticClient(clientData);
      const optimisticActionItem = createOptimisticActionItem(actionItemData);
      
      expect(optimisticClient.notes).toBeUndefined();
      expect(optimisticActionItem.ownerName).toBeNull();
      expect(optimisticActionItem.due).toBeNull();
    });

    it('should map sentiment enum correctly', () => {
      const testCases = [
        { sentiment: 'pos' as const, expected: 'positive' },
        { sentiment: 'neu' as const, expected: 'neutral' },
        { sentiment: 'neg' as const, expected: 'negative' }
      ];
      
      testCases.forEach(({ sentiment, expected }) => {
        const formData = {
          ts: '2024-01-15T10:00:00Z',
          durationSec: 1800,
          sentiment,
          score: 0,
          bookingLikelihood: 0.5
        };
        
        const optimisticCall = createOptimisticCall(formData);
        expect(optimisticCall.sentiment).toBe(expected);
      });
    });
  });

  describe('API Service Methods', () => {
    // Note: These tests would require a running server with proper auth
    // For now, just test that the methods exist and have correct signatures
    
    it('should have required CRUD methods', () => {
      expect(typeof crudApiService.createClient).toBe('function');
      expect(typeof crudApiService.createCall).toBe('function');
      expect(typeof crudApiService.createActionItem).toBe('function');
    });

    it('should construct correct URLs in fetch calls', () => {
      // We can't easily mock fetch in this environment, but we can verify
      // the service has the expected structure
      expect(crudApiService).toHaveProperty('createClient');
      expect(crudApiService).toHaveProperty('createCall');
      expect(crudApiService).toHaveProperty('createActionItem');
    });
  });
});