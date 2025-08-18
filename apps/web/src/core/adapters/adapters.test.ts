// src/core/adapters/adapters.test.ts
import { describe, it, expect } from 'vitest';
import { Adapters } from './index';
import type { SalesCallMinimal } from '../types';

// Mock sales call data for testing
const mockCall: SalesCallMinimal = {
  summary: "Test call summary",
  sentiment: { overall: "positive", score: 0.8 },
  bookingLikelihood: 75,
  objections: [
    { type: "Price", quote: "Too expensive", ts: "00:05:30" },
    { type: "Timeline", quote: "Need it sooner", ts: "00:10:15" }
  ],
  actionItems: [
    { owner: "John", text: "Follow up with pricing", due: "2024-01-02" },
    { owner: "Jane", text: "Send proposal", due: "2024-01-03" }
  ],
  keyMoments: [
    { label: "Opening", ts: "00:00:00" },
    { label: "Discovery", ts: "00:05:00" }
  ],
  entities: {
    prospect: ["Acme Corp"],
    people: ["John Doe", "Jane Smith"],
    products: ["Pro Plan", "Enterprise"]
  },
  complianceFlags: ["gdpr-mentioned", "recording-consent"]
};

describe('Adapters', () => {
  describe('summary adapter', () => {
    it('should return text from call summary', () => {
      const result = Adapters.summary.project(mockCall);
      expect(result).toEqual({ text: "Test call summary" });
    });

    it('should return empty string for missing summary', () => {
      const result = Adapters.summary.project({ ...mockCall, summary: undefined });
      expect(result).toEqual({ text: "" });
    });
  });

  describe('sentiment adapter', () => {
    it('should return label and score from sentiment', () => {
      const result = Adapters.sentiment.project(mockCall);
      expect(result).toEqual({ label: "positive", score: 0.8 });
    });

    it('should return defaults for missing sentiment', () => {
      const result = Adapters.sentiment.project({ ...mockCall, sentiment: undefined });
      expect(result).toEqual({ label: "neutral", score: 0 });
    });
  });

  describe('booking adapter', () => {
    it('should return booking likelihood value', () => {
      const result = Adapters.booking.project(mockCall);
      expect(result).toEqual({ value: 75 });
    });

    it('should return 0 for missing booking likelihood', () => {
      const result = Adapters.booking.project({ ...mockCall, bookingLikelihood: undefined });
      expect(result).toEqual({ value: 0 });
    });
  });

  describe('objections adapter', () => {
    it('should return all objections when no limit specified', () => {
      const result = Adapters.objections.project(mockCall) as { items: Array<{ type: string; quote: string; ts: string }> };
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({ type: "Price", quote: "Too expensive", ts: "00:05:30" });
    });

    it('should respect maxItems parameter', () => {
      const result = Adapters.objections.project(mockCall, { maxItems: 1 }) as { items: Array<{ type: string; quote: string; ts: string }> };
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({ type: "Price", quote: "Too expensive", ts: "00:05:30" });
    });

    it('should return empty array for missing objections', () => {
      const result = Adapters.objections.project({ ...mockCall, objections: undefined });
      expect(result).toEqual({ items: [] });
    });
  });

  describe('actionItems adapter', () => {
    it('should return all action items when no limit specified', () => {
      const result = Adapters.actionItems.project(mockCall) as { items: Array<{ owner: string; text: string; due: string }> };
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({ owner: "John", text: "Follow up with pricing", due: "2024-01-02" });
    });

    it('should respect maxItems parameter', () => {
      const result = Adapters.actionItems.project(mockCall, { maxItems: 1 }) as { items: Array<{ owner: string; text: string; due: string }> };
      expect(result.items).toHaveLength(1);
    });

    it('should return empty array for missing action items', () => {
      const result = Adapters.actionItems.project({ ...mockCall, actionItems: undefined });
      expect(result).toEqual({ items: [] });
    });
  });

  describe('keyMoments adapter', () => {
    it('should return all key moments when no limit specified', () => {
      const result = Adapters.keyMoments.project(mockCall) as { items: Array<{ label: string; ts: string }> };
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({ label: "Opening", ts: "00:00:00" });
    });

    it('should respect maxItems parameter', () => {
      const result = Adapters.keyMoments.project(mockCall, { maxItems: 1 }) as { items: Array<{ label: string; ts: string }> };
      expect(result.items).toHaveLength(1);
    });

    it('should return empty array for missing key moments', () => {
      const result = Adapters.keyMoments.project({ ...mockCall, keyMoments: undefined });
      expect(result).toEqual({ items: [] });
    });
  });

  describe('entities adapter', () => {
    it('should return entities when present', () => {
      const result = Adapters.entities.project(mockCall) as { entities: { prospect: string[]; people: string[]; products: string[] } };
      expect(result.entities).toEqual({
        prospect: ["Acme Corp"],
        people: ["John Doe", "Jane Smith"],
        products: ["Pro Plan", "Enterprise"]
      });
    });

    it('should return default empty arrays for missing entities', () => {
      const result = Adapters.entities.project({ ...mockCall, entities: undefined }) as { entities: { prospect: string[]; people: string[]; products: string[] } };
      expect(result.entities).toEqual({ prospect: [], people: [], products: [] });
    });
  });

  describe('compliance adapter', () => {
    it('should return compliance flags when present', () => {
      const result = Adapters.compliance.project(mockCall) as { complianceFlags: string[] };
      expect(result.complianceFlags).toEqual(["gdpr-mentioned", "recording-consent"]);
    });

    it('should return empty array for missing compliance flags', () => {
      const result = Adapters.compliance.project({ ...mockCall, complianceFlags: undefined }) as { complianceFlags: string[] };
      expect(result.complianceFlags).toEqual([]);
    });
  });

  describe('pieChart adapter', () => {
    it('should return empty data with default height', () => {
      const result = Adapters.pieChart.project(mockCall);
      expect(result).toEqual({ data: [], height: 240 });
    });

    it('should respect height parameter', () => {
      const result = Adapters.pieChart.project(mockCall, { height: 300 });
      expect(result).toEqual({ data: [], height: 300 });
    });
  });

  describe('adapter contracts', () => {
    it('should have all expected adapters', () => {
      const expectedSlugs = [
        'summary', 'sentiment', 'booking', 'objections', 
        'actionItems', 'keyMoments', 'entities', 'compliance', 'pieChart'
      ] as const;
      
      expectedSlugs.forEach(slug => {
        expect(Adapters[slug]).toBeDefined();
        expect(Adapters[slug].slug).toBe(slug);
        expect(typeof Adapters[slug].project).toBe('function');
      });
    });

    it('should ignore unknown parameters gracefully', () => {
      // Test that adapters don't crash with unexpected params
      const result = Adapters.summary.project(mockCall, { unknownParam: 'test' } as any);
      expect(result).toEqual({ text: "Test call summary" });
    });
  });
});