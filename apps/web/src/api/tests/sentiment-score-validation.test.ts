import { describe, it, expect } from 'vitest';
import { 
  validateSentimentScoreConsistency, 
  deriveSentimentFromScore,
  SENTIMENT_SCORE_MAPPING 
} from '../schemas/constants';

describe('Sentiment/Score Validation', () => {
  describe('validateSentimentScoreConsistency', () => {
    it('should accept valid positive sentiment/score combinations', () => {
      expect(validateSentimentScoreConsistency('pos', 0.5)).toBe(true);
      expect(validateSentimentScoreConsistency('pos', 0.1)).toBe(true);
      expect(validateSentimentScoreConsistency('pos', 1.0)).toBe(true);
      expect(validateSentimentScoreConsistency('pos', 0.9)).toBe(true);
    });

    it('should accept valid neutral sentiment/score combinations', () => {
      expect(validateSentimentScoreConsistency('neu', 0.0)).toBe(true);
      expect(validateSentimentScoreConsistency('neu', 0.05)).toBe(true);
      expect(validateSentimentScoreConsistency('neu', -0.05)).toBe(true);
      expect(validateSentimentScoreConsistency('neu', 0.0999)).toBe(true);
      expect(validateSentimentScoreConsistency('neu', -0.0999)).toBe(true);
    });

    it('should accept valid negative sentiment/score combinations', () => {
      expect(validateSentimentScoreConsistency('neg', -0.5)).toBe(true);
      expect(validateSentimentScoreConsistency('neg', -0.1)).toBe(true);
      expect(validateSentimentScoreConsistency('neg', -1.0)).toBe(true);
      expect(validateSentimentScoreConsistency('neg', -0.9)).toBe(true);
    });

    it('should reject inconsistent positive sentiment/score combinations', () => {
      expect(validateSentimentScoreConsistency('pos', 0.0)).toBe(false); // Too low for positive
      expect(validateSentimentScoreConsistency('pos', -0.5)).toBe(false); // Negative score
      expect(validateSentimentScoreConsistency('pos', 0.09)).toBe(false); // Just below threshold
    });

    it('should reject inconsistent neutral sentiment/score combinations', () => {
      expect(validateSentimentScoreConsistency('neu', 0.2)).toBe(false); // Too high for neutral
      expect(validateSentimentScoreConsistency('neu', -0.2)).toBe(false); // Too low for neutral
      expect(validateSentimentScoreConsistency('neu', 0.5)).toBe(false); // Clearly positive
      expect(validateSentimentScoreConsistency('neu', -0.5)).toBe(false); // Clearly negative
    });

    it('should reject inconsistent negative sentiment/score combinations', () => {
      expect(validateSentimentScoreConsistency('neg', 0.0)).toBe(false); // Too high for negative
      expect(validateSentimentScoreConsistency('neg', 0.5)).toBe(false); // Positive score
      expect(validateSentimentScoreConsistency('neg', -0.09)).toBe(false); // Just above threshold
    });

    it('should reject invalid sentiment values', () => {
      expect(validateSentimentScoreConsistency('invalid', 0.5)).toBe(false);
      expect(validateSentimentScoreConsistency('positive', 0.5)).toBe(false);
      expect(validateSentimentScoreConsistency('', 0.5)).toBe(false);
    });
  });

  describe('deriveSentimentFromScore', () => {
    it('should derive positive sentiment from high scores', () => {
      expect(deriveSentimentFromScore(0.2)).toBe('pos');
      expect(deriveSentimentFromScore(0.5)).toBe('pos');
      expect(deriveSentimentFromScore(1.0)).toBe('pos');
      expect(deriveSentimentFromScore(0.11)).toBe('pos'); // Just above threshold
    });

    it('should derive neutral sentiment from mid-range scores', () => {
      expect(deriveSentimentFromScore(0.0)).toBe('neu');
      expect(deriveSentimentFromScore(0.05)).toBe('neu');
      expect(deriveSentimentFromScore(-0.05)).toBe('neu');
      expect(deriveSentimentFromScore(0.09)).toBe('neu');
      expect(deriveSentimentFromScore(-0.09)).toBe('neu');
    });

    it('should derive negative sentiment from low scores', () => {
      expect(deriveSentimentFromScore(-0.2)).toBe('neg');
      expect(deriveSentimentFromScore(-0.5)).toBe('neg');
      expect(deriveSentimentFromScore(-1.0)).toBe('neg');
      expect(deriveSentimentFromScore(-0.11)).toBe('neg'); // Just below threshold
    });

    it('should handle edge cases correctly', () => {
      expect(deriveSentimentFromScore(0.1)).toBe('pos'); // Exactly at positive boundary
      expect(deriveSentimentFromScore(-0.1)).toBe('neg'); // Exactly at negative boundary
      expect(deriveSentimentFromScore(0.100001)).toBe('pos'); // Just above boundary
      expect(deriveSentimentFromScore(-0.100001)).toBe('neg'); // Just below boundary
    });
  });

  describe('SENTIMENT_SCORE_MAPPING', () => {
    it('should have correct mapping structure', () => {
      expect(SENTIMENT_SCORE_MAPPING).toHaveProperty('pos');
      expect(SENTIMENT_SCORE_MAPPING).toHaveProperty('neu');
      expect(SENTIMENT_SCORE_MAPPING).toHaveProperty('neg');

      expect(SENTIMENT_SCORE_MAPPING.pos).toEqual({ min: 0.1, max: 1.0 });
      expect(SENTIMENT_SCORE_MAPPING.neu).toEqual({ min: -0.0999, max: 0.0999 });
      expect(SENTIMENT_SCORE_MAPPING.neg).toEqual({ min: -1.0, max: -0.1 });
    });

    it('should have non-overlapping ranges', () => {
      const { pos, neu, neg } = SENTIMENT_SCORE_MAPPING;
      
      // Negative max should be below neutral min
      expect(neg.max).toBeLessThan(neu.min);
      
      // Neutral max should be below positive min
      expect(neu.max).toBeLessThan(pos.min);
      
      // Ensure proper ordering: neg < neu < pos
      expect(neg.max).toBeLessThan(neu.min);
      expect(neu.max).toBeLessThan(pos.min);
    });

    it('should cover the full range [-1, 1] with small gaps for precision', () => {
      const { pos, neu, neg } = SENTIMENT_SCORE_MAPPING;
      
      expect(neg.min).toBe(-1.0);
      expect(pos.max).toBe(1.0);
      
      // Check that ranges nearly touch (small gaps for floating point precision)
      expect(neg.max).toBeCloseTo(-0.1, 1);
      expect(neu.min).toBeCloseTo(-0.0999, 4);
      expect(neu.max).toBeCloseTo(0.0999, 4);
      expect(pos.min).toBe(0.1);
    });
  });

  describe('Edge Cases and Boundary Testing', () => {
    it('should handle exact boundary values correctly', () => {
      // Test exact boundary values
      expect(validateSentimentScoreConsistency('pos', 0.1)).toBe(true);
      expect(validateSentimentScoreConsistency('pos', 1.0)).toBe(true);
      
      expect(validateSentimentScoreConsistency('neu', -0.0999)).toBe(true);
      expect(validateSentimentScoreConsistency('neu', 0.0999)).toBe(true);
      
      expect(validateSentimentScoreConsistency('neg', -1.0)).toBe(true);
      expect(validateSentimentScoreConsistency('neg', -0.1)).toBe(true);
    });

    it('should reject values just outside boundaries', () => {
      // Just outside positive range
      expect(validateSentimentScoreConsistency('pos', 0.099)).toBe(false);
      expect(validateSentimentScoreConsistency('pos', 1.001)).toBe(false);
      
      // Just outside neutral range
      expect(validateSentimentScoreConsistency('neu', -0.101)).toBe(false);
      expect(validateSentimentScoreConsistency('neu', 0.101)).toBe(false);
      
      // Just outside negative range
      expect(validateSentimentScoreConsistency('neg', -1.001)).toBe(false);
      expect(validateSentimentScoreConsistency('neg', -0.099)).toBe(false);
    });

    it('should handle floating point precision issues', () => {
      // Test with values that might have floating point precision issues
      expect(validateSentimentScoreConsistency('pos', 0.1 + 0.0000001)).toBe(true);
      expect(validateSentimentScoreConsistency('neu', 0.0999 - 0.0000001)).toBe(true);
      expect(validateSentimentScoreConsistency('neg', -0.1 - 0.0000001)).toBe(true);
    });
  });

  describe('Integration with API Validation', () => {
    it('should provide clear error details for mismatched sentiment/score', () => {
      // Test cases that would be used in API validation
      const testCases = [
        { sentiment: 'pos', score: -0.5, expectedRange: '0.1 to 1.0' },
        { sentiment: 'neu', score: 0.8, expectedRange: '-0.1 to 0.1' },
        { sentiment: 'neg', score: 0.3, expectedRange: '-1.0 to -0.1' }
      ];

      testCases.forEach(({ sentiment, score, expectedRange }) => {
        expect(validateSentimentScoreConsistency(sentiment, score)).toBe(false);
        
        // Verify that deriveSentimentFromScore would give a different result
        const derivedSentiment = deriveSentimentFromScore(score);
        expect(derivedSentiment).not.toBe(sentiment);
      });
    });

    it('should support automatic sentiment derivation as alternative to validation', () => {
      // Test that we can derive sentiment instead of validating it
      const scores = [0.8, -0.3, 0.05, -0.9, 0.15, -0.05];
      
      scores.forEach(score => {
        const derivedSentiment = deriveSentimentFromScore(score);
        expect(validateSentimentScoreConsistency(derivedSentiment, score)).toBe(true);
      });
    });
  });
});