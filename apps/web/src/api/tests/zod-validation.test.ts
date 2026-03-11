import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  OrgSummarySchema,
  ClientsOverviewSchema,
  ClientSummarySchema,
  ClientCallsSchema,
  ActionItemsSchema,
  validateResponse
} from '../middleware/validation';

describe('Zod Response Validation', () => {
  describe('Schema Strictness', () => {
    it('should reject unknown keys in OrgSummarySchema', () => {
      const validData = {
        totalCalls: 10,
        avgSentimentScore: 0.75,
        bookingRate: 0.8,
        openActionItems: 5
      };

      const invalidData = {
        ...validData,
        unknownField: 'should-fail'
      };

      expect(() => OrgSummarySchema.parse(validData)).not.toThrow();
      expect(() => OrgSummarySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys in ClientsOverviewSchema', () => {
      const validData = {
        items: [{
          id: 'client-1',
          name: 'Test Client',
          lastCallDate: '2024-01-01T00:00:00Z',
          totalCalls: 5,
          avgSentiment: 0.8,
          bookingLikelihood: 0.7
        }]
      };

      const invalidData = {
        ...validData,
        extraField: 'should-fail'
      };

      expect(() => ClientsOverviewSchema.parse(validData)).not.toThrow();
      expect(() => ClientsOverviewSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys in client items', () => {
      const validClientItem = {
        id: 'client-1',
        name: 'Test Client',
        lastCallDate: '2024-01-01T00:00:00Z',
        totalCalls: 5,
        avgSentiment: 0.8,
        bookingLikelihood: 0.7
      };

      const invalidClientItem = {
        ...validClientItem,
        extraClientField: 'should-fail'
      };

      const validData = { items: [validClientItem] };
      const invalidData = { items: [invalidClientItem] };

      expect(() => ClientsOverviewSchema.parse(validData)).not.toThrow();
      expect(() => ClientsOverviewSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys in ClientSummarySchema', () => {
      const validData = {
        id: 'client-1',
        name: 'Test Client',
        totalCalls: 10,
        avgSentiment: 0.8,
        bookingLikelihood: 0.7,
        topObjections: [{ type: 'price', count: 3 }]
      };

      const invalidData = {
        ...validData,
        unauthorizedField: 'should-fail'
      };

      expect(() => ClientSummarySchema.parse(validData)).not.toThrow();
      expect(() => ClientSummarySchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys in ClientCallsSchema', () => {
      const validData = {
        items: [{
          id: 'call-1',
          name: 'Test Call',
          date: '2024-01-01T00:00:00Z',
          sentiment: 'positive' as const,
          score: 0.8,
          bookingLikelihood: 0.7
        }]
      };

      const invalidData = {
        ...validData,
        extraField: 'should-fail'
      };

      expect(() => ClientCallsSchema.parse(validData)).not.toThrow();
      expect(() => ClientCallsSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys in call items', () => {
      const validCallItem = {
        id: 'call-1',
        name: 'Test Call',
        date: '2024-01-01T00:00:00Z',
        sentiment: 'positive' as const,
        score: 0.8,
        bookingLikelihood: 0.7
      };

      const invalidCallItem = {
        ...validCallItem,
        extraCallField: 'should-fail'
      };

      const validData = { items: [validCallItem] };
      const invalidData = { items: [invalidCallItem] };

      expect(() => ClientCallsSchema.parse(validData)).not.toThrow();
      expect(() => ClientCallsSchema.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys in ActionItemsSchema', () => {
      const validData = {
        items: [{
          id: 'action-1',
          text: 'Follow up with client',
          due: '2024-01-01T00:00:00Z',
          status: 'open' as const,
          ownerName: 'John Doe'
        }]
      };

      const invalidData = {
        ...validData,
        extraField: 'should-fail'
      };

      expect(() => ActionItemsSchema.parse(validData)).not.toThrow();
      expect(() => ActionItemsSchema.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('Empty Arrays Handling', () => {
    it('should accept empty arrays for clients overview', () => {
      const emptyData = { items: [] };
      expect(() => ClientsOverviewSchema.parse(emptyData)).not.toThrow();
    });

    it('should accept empty arrays for client calls', () => {
      const emptyData = { items: [] };
      expect(() => ClientCallsSchema.parse(emptyData)).not.toThrow();
    });

    it('should accept empty arrays for action items', () => {
      const emptyData = { items: [] };
      expect(() => ActionItemsSchema.parse(emptyData)).not.toThrow();
    });

    it('should reject null arrays', () => {
      const nullData = { items: null };
      expect(() => ClientsOverviewSchema.parse(nullData)).toThrow(z.ZodError);
      expect(() => ClientCallsSchema.parse(nullData)).toThrow(z.ZodError);
      expect(() => ActionItemsSchema.parse(nullData)).toThrow(z.ZodError);
    });
  });

  describe('Required Fields Validation', () => {
    it('should require all OrgSummary fields', () => {
      const incompleteData = {
        totalCalls: 10,
        avgSentimentScore: 0.75,
        // missing bookingRate and openActionItems
      };

      expect(() => OrgSummarySchema.parse(incompleteData)).toThrow(z.ZodError);
    });

    it('should require all ClientSummary fields', () => {
      const incompleteData = {
        id: 'client-1',
        name: 'Test Client',
        totalCalls: 10,
        // missing avgSentiment, bookingLikelihood, topObjections
      };

      expect(() => ClientSummarySchema.parse(incompleteData)).toThrow(z.ZodError);
    });

    it('should require all call fields', () => {
      const incompleteCall = {
        id: 'call-1',
        name: 'Test Call',
        // missing date, sentiment, score, bookingLikelihood
      };

      const data = { items: [incompleteCall] };
      expect(() => ClientCallsSchema.parse(data)).toThrow(z.ZodError);
    });
  });

  describe('Type Validation', () => {
    it('should validate sentiment enum values', () => {
      const invalidSentiment = {
        items: [{
          id: 'call-1',
          name: 'Test Call',
          date: '2024-01-01T00:00:00Z',
          sentiment: 'invalid-sentiment', // should be 'positive', 'neutral', or 'negative'
          score: 0.8,
          bookingLikelihood: 0.7
        }]
      };

      expect(() => ClientCallsSchema.parse(invalidSentiment)).toThrow(z.ZodError);
    });

    it('should validate action item status enum values', () => {
      const invalidStatus = {
        items: [{
          id: 'action-1',
          text: 'Follow up with client',
          due: '2024-01-01T00:00:00Z',
          status: 'invalid-status', // should be 'open' or 'done'
          ownerName: 'John Doe'
        }]
      };

      expect(() => ActionItemsSchema.parse(invalidStatus)).toThrow(z.ZodError);
    });

    it('should validate number types', () => {
      const invalidNumbers = {
        totalCalls: '10', // should be number, not string
        avgSentimentScore: 0.75,
        bookingRate: 0.8,
        openActionItems: 5
      };

      expect(() => OrgSummarySchema.parse(invalidNumbers)).toThrow(z.ZodError);
    });
  });

  describe('Null Handling', () => {
    it('should allow null for nullable fields', () => {
      const dataWithNulls = {
        items: [{
          id: 'client-1',
          name: 'Test Client',
          lastCallDate: null, // nullable field
          totalCalls: 5,
          avgSentiment: 0.8,
          bookingLikelihood: 0.7
        }]
      };

      expect(() => ClientsOverviewSchema.parse(dataWithNulls)).not.toThrow();
    });

    it('should reject null for non-nullable fields', () => {
      const dataWithInvalidNull = {
        items: [{
          id: 'client-1',
          name: null, // should not be null
          lastCallDate: '2024-01-01T00:00:00Z',
          totalCalls: 5,
          avgSentiment: 0.8,
          bookingLikelihood: 0.7
        }]
      };

      expect(() => ClientsOverviewSchema.parse(dataWithInvalidNull)).toThrow(z.ZodError);
    });
  });
});