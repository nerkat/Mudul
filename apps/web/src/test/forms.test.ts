import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { 
  NewClientForm, 
  LogCallForm, 
  NewActionItemForm,
  CreatedClientSchema,
  CreatedCallSchema,
  CreatedActionItemSchema
} from '../api/schemas/forms';

describe('CRUD Form Schemas', () => {
  describe('NewClientForm', () => {
    it('should validate valid client data', () => {
      const validData = {
        name: 'Test Client',
        notes: 'Test notes'
      };
      
      expect(() => NewClientForm.parse(validData)).not.toThrow();
    });

    it('should reject client name that is too short', () => {
      const invalidData = {
        name: 'A', // Too short
        notes: 'Test notes'
      };
      
      expect(() => NewClientForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject client name that is too long', () => {
      const invalidData = {
        name: 'A'.repeat(101), // Too long
        notes: 'Test notes'
      };
      
      expect(() => NewClientForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject notes that are too long', () => {
      const invalidData = {
        name: 'Valid Name',
        notes: 'A'.repeat(2001) // Too long
      };
      
      expect(() => NewClientForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject unknown keys', () => {
      const invalidData = {
        name: 'Valid Name',
        notes: 'Valid notes',
        extraField: 'should fail'
      };
      
      expect(() => NewClientForm.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('LogCallForm', () => {
    it('should validate valid call data', () => {
      const validData = {
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7,
        notes: 'Test call notes'
      };
      
      expect(() => LogCallForm.parse(validData)).not.toThrow();
    });

    it('should reject invalid sentiment values', () => {
      const invalidData = {
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'invalid',
        score: 0.8,
        bookingLikelihood: 0.7
      };
      
      expect(() => LogCallForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject score outside -1 to 1 range', () => {
      const invalidData = {
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 2.0, // Out of range
        bookingLikelihood: 0.7
      };
      
      expect(() => LogCallForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject booking likelihood outside 0 to 1 range', () => {
      const invalidData = {
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 1.5 // Out of range
      };
      
      expect(() => LogCallForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject duration outside allowed range', () => {
      const invalidData = {
        ts: new Date().toISOString(),
        durationSec: 0, // Too small
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7
      };
      
      expect(() => LogCallForm.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('NewActionItemForm', () => {
    it('should validate valid action item data', () => {
      const validData = {
        owner: 'John Doe',
        text: 'Follow up with client',
        dueDate: new Date().toISOString()
      };
      
      expect(() => NewActionItemForm.parse(validData)).not.toThrow();
    });

    it('should accept optional fields as undefined', () => {
      const validData = {
        text: 'Follow up with client'
      };
      
      expect(() => NewActionItemForm.parse(validData)).not.toThrow();
    });

    it('should reject text that is too short', () => {
      const invalidData = {
        text: 'A' // Too short
      };
      
      expect(() => NewActionItemForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject text that is too long', () => {
      const invalidData = {
        text: 'A'.repeat(501) // Too long
      };
      
      expect(() => NewActionItemForm.parse(invalidData)).toThrow(z.ZodError);
    });

    it('should reject owner that is too long', () => {
      const invalidData = {
        owner: 'A'.repeat(121), // Too long
        text: 'Valid action item text'
      };
      
      expect(() => NewActionItemForm.parse(invalidData)).toThrow(z.ZodError);
    });
  });

  describe('Response Schemas', () => {
    it('should validate created client response', () => {
      const validResponse = {
        id: 'client-123',
        name: 'Test Client',
        notes: 'Test notes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      expect(() => CreatedClientSchema.parse(validResponse)).not.toThrow();
    });

    it('should validate created call response', () => {
      const validResponse = {
        id: 'call-123',
        clientId: 'client-123',
        ts: new Date().toISOString(),
        durationSec: 1800,
        sentiment: 'pos' as const,
        score: 0.8,
        bookingLikelihood: 0.7,
        notes: 'Test notes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      expect(() => CreatedCallSchema.parse(validResponse)).not.toThrow();
    });

    it('should validate created action item response', () => {
      const validResponse = {
        id: 'action-123',
        clientId: 'client-123',
        owner: 'John Doe',
        text: 'Follow up with client',
        due: new Date().toISOString(),
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      expect(() => CreatedActionItemSchema.parse(validResponse)).not.toThrow();
    });
  });
});