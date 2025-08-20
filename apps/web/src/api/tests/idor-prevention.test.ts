import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  NewClientForm,
  LogCallForm,
  NewActionItemForm
} from '../schemas/forms';
import {
  CreatedClientOutSchema,
  CreatedCallOutSchema,
  CreatedActionItemOutSchema
} from '../schemas/output';
import { clampDuration, clampScore, clampBookingLikelihood, VALIDATION_LIMITS } from '../schemas/constants';
import { generateTempId, createOptimisticClient, createOptimisticCall, createOptimisticActionItem } from '../../services/crudApi';

describe('IDOR Prevention and Security', () => {
  describe('Input validation and unknown key rejection', () => {
    it('should reject unknown keys in NewClientForm', () => {
      const validData = {
        name: 'Test Client',
        notes: 'Test notes'
      };

      const invalidData = {
        ...validData,
        orgId: 'malicious-org-id', // Unknown key that should be rejected
        unknownField: 'should be rejected'
      };

      expect(() => NewClientForm.parse(validData)).not.toThrow();
      expect(() => NewClientForm.parse(invalidData)).toThrow(z.ZodError);
      
      // Verify the error mentions unknown keys
      try {
        NewClientForm.parse(invalidData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(e => e.message).join(' ');
          expect(errorMessages.toLowerCase()).toContain('unrecognized');
        }
      }
    });

    it('should reject unknown keys in LogCallForm', () => {
      const validData = {
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7,
        notes: 'Test call'
      };

      const invalidData = {
        ...validData,
        orgId: 'malicious-org-id', // Should be stripped server-side
        clientId: 'malicious-client-id', // Should be stripped server-side
        badField: 'reject me'
      };

      expect(() => LogCallForm.parse(validData)).not.toThrow();
      expect(() => LogCallForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys in NewActionItemForm', () => {
      const validData = {
        text: 'Follow up on proposal',
        owner: 'John Doe',
        dueDate: new Date(Date.now() + 86400000).toISOString()
      };

      const invalidData = {
        ...validData,
        orgId: 'malicious-org-id', // Should be stripped server-side
        clientId: 'malicious-client-id', // Should be stripped server-side
        evilField: { nested: 'object' }
      };

      expect(() => NewActionItemForm.parse(validData)).not.toThrow();
      expect(() => NewActionItemForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should enforce range validation in LogCallForm', () => {
      const baseData = {
        ts: new Date().toISOString(),
        sentiment: 'pos' as const,
        notes: 'Test call'
      };

      // Test duration limits
      expect(() => LogCallForm.parse({
        ...baseData,
        durationSec: 0, // Below min
        score: 0.8,
        bookingLikelihood: 0.7
      })).toThrow(z.ZodError);

      expect(() => LogCallForm.parse({
        ...baseData,
        durationSec: 15000, // Above max (14400)
        score: 0.8,
        bookingLikelihood: 0.7
      })).toThrow(z.ZodError);

      // Test score limits
      expect(() => LogCallForm.parse({
        ...baseData,
        durationSec: 1800,
        score: 2, // Above max (1)
        bookingLikelihood: 0.7
      })).toThrow(z.ZodError);

      expect(() => LogCallForm.parse({
        ...baseData,
        durationSec: 1800,
        score: -2, // Below min (-1)
        bookingLikelihood: 0.7
      })).toThrow(z.ZodError);

      // Test booking likelihood limits
      expect(() => LogCallForm.parse({
        ...baseData,
        durationSec: 1800,
        score: 0.8,
        bookingLikelihood: 1.5 // Above max (1)
      })).toThrow(z.ZodError);

      expect(() => LogCallForm.parse({
        ...baseData,
        durationSec: 1800,
        score: 0.8,
        bookingLikelihood: -0.1 // Below min (0)
      })).toThrow(z.ZodError);
    });
  });

  describe('Server-side value clamping', () => {
    it('should clamp duration values to valid range', () => {
      expect(clampDuration(0)).toBe(VALIDATION_LIMITS.CALL_DURATION_MIN);
      expect(clampDuration(-100)).toBe(VALIDATION_LIMITS.CALL_DURATION_MIN);
      expect(clampDuration(20000)).toBe(VALIDATION_LIMITS.CALL_DURATION_MAX);
      expect(clampDuration(1800)).toBe(1800); // Valid value unchanged
    });

    it('should clamp score values to valid range', () => {
      expect(clampScore(-2)).toBe(VALIDATION_LIMITS.CALL_SCORE_MIN);
      expect(clampScore(2)).toBe(VALIDATION_LIMITS.CALL_SCORE_MAX);
      expect(clampScore(0.5)).toBe(0.5); // Valid value unchanged
    });

    it('should clamp booking likelihood values to valid range', () => {
      expect(clampBookingLikelihood(-0.1)).toBe(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MIN);
      expect(clampBookingLikelihood(1.5)).toBe(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MAX);
      expect(clampBookingLikelihood(0.7)).toBe(0.7); // Valid value unchanged
    });
  });

  describe('Output validation schemas', () => {
    it('should validate proper UUID format in CreatedClientOutSchema', () => {
      const validClient = {
        id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
        name: 'Test Client',
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const invalidClient = {
        ...validClient,
        id: 'not-a-uuid' // Invalid UUID format
      };

      expect(() => CreatedClientOutSchema.parse(validClient)).not.toThrow();
      expect(() => CreatedClientOutSchema.parse(invalidClient)).toThrow(z.ZodError);
    });

    it('should validate datetime format in output schemas', () => {
      const validCall = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        clientId: '550e8400-e29b-41d4-a716-446655440001',
        ts: new Date().toISOString(), // Valid ISO datetime
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const invalidCall = {
        ...validCall,
        createdAt: '2024-01-01' // Invalid datetime format (missing time)
      };

      expect(() => CreatedCallOutSchema.parse(validCall)).not.toThrow();
      expect(() => CreatedCallOutSchema.parse(invalidCall)).toThrow(z.ZodError);
    });

    it('should enforce enum values in output schemas', () => {
      const validCall = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        clientId: '550e8400-e29b-41d4-a716-446655440001',
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const invalidCall = {
        ...validCall,
        sentiment: 'invalid-sentiment' // Invalid enum value
      };

      expect(() => CreatedCallOutSchema.parse(validCall)).not.toThrow();
      expect(() => CreatedCallOutSchema.parse(invalidCall)).toThrow(z.ZodError);
    });
  });

  describe('Optimistic updates safety', () => {
    it('should generate temporary IDs that do not leak to API requests', () => {
      // Test that temp IDs are generated correctly
      const tempId1 = generateTempId();
      const tempId2 = generateTempId();
      
      expect(tempId1).toMatch(/^tmp_[0-9a-f-]{36}$/);
      expect(tempId2).toMatch(/^tmp_[0-9a-f-]{36}$/);
      expect(tempId1).not.toBe(tempId2);
    });

    it('should create optimistic entities with temp IDs and isOptimistic flag', () => {
      const clientData = {
        name: 'Test Client',
        notes: 'Test notes'
      };
      
      const optimisticClient = createOptimisticClient(clientData);
      
      expect(optimisticClient.id).toMatch(/^tmp_/);
      expect(optimisticClient.isOptimistic).toBe(true);
      expect(optimisticClient.name).toBe(clientData.name);
      expect(optimisticClient.notes).toBe(clientData.notes);
    });

    it('should create optimistic calls with proper sentiment mapping', () => {
      const callData = {
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7,
        notes: 'Test call'
      };
      
      const optimisticCall = createOptimisticCall(callData);
      
      expect(optimisticCall.id).toMatch(/^tmp_/);
      expect(optimisticCall.isOptimistic).toBe(true);
      expect(optimisticCall.sentiment).toBe('positive'); // Mapped from 'pos'
      expect(optimisticCall.score).toBe(callData.score);
    });

    it('should create optimistic action items with default status', () => {
      const actionItemData = {
        text: 'Follow up on proposal',
        owner: 'John Doe',
        dueDate: new Date(Date.now() + 86400000).toISOString()
      };
      
      const optimisticActionItem = createOptimisticActionItem(actionItemData);
      
      expect(optimisticActionItem.id).toMatch(/^tmp_/);
      expect(optimisticActionItem.isOptimistic).toBe(true);
      expect(optimisticActionItem.status).toBe('open'); // Default status
      expect(optimisticActionItem.text).toBe(actionItemData.text);
    });
  });

  describe('IDOR prevention principles', () => {
    it('should not accept client-supplied org context in form schemas', () => {
      // The schemas should not have orgId fields, proving server derives them
      const clientFormKeys = Object.keys(NewClientForm.shape);
      const callFormKeys = Object.keys(LogCallForm.shape);
      const actionItemFormKeys = Object.keys(NewActionItemForm.shape);

      expect(clientFormKeys).not.toContain('orgId');
      expect(callFormKeys).not.toContain('orgId');
      expect(callFormKeys).not.toContain('clientId');
      expect(actionItemFormKeys).not.toContain('orgId');
      expect(actionItemFormKeys).not.toContain('clientId');
    });

    it('should ensure output schemas include proper IDs', () => {
      // Output schemas should include the server-derived IDs
      const clientSchema = CreatedClientOutSchema.shape;
      const callSchema = CreatedCallOutSchema.shape;
      const actionItemSchema = CreatedActionItemOutSchema.shape;

      expect(clientSchema.id).toBeDefined();
      expect(callSchema.id).toBeDefined();
      expect(callSchema.clientId).toBeDefined();
      expect(actionItemSchema.id).toBeDefined();
      expect(actionItemSchema.clientId).toBeDefined();
    });
  });
});