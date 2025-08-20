// Shared validation constants used by both API and UI
// Ensures consistency between client-side and server-side validation

export const VALIDATION_LIMITS = {
  // Client constraints
  CLIENT_NAME_MIN: 2,
  CLIENT_NAME_MAX: 100,
  CLIENT_NOTES_MAX: 2000,

  // Call constraints
  CALL_DURATION_MIN: 1,
  CALL_DURATION_MAX: 14400, // 4 hours in seconds
  CALL_SCORE_MIN: -1,
  CALL_SCORE_MAX: 1,
  CALL_BOOKING_LIKELIHOOD_MIN: 0,
  CALL_BOOKING_LIKELIHOOD_MAX: 1,
  CALL_NOTES_MAX: 2000,

  // Action Item constraints
  ACTION_ITEM_TEXT_MIN: 2,
  ACTION_ITEM_TEXT_MAX: 500,
  ACTION_ITEM_OWNER_MAX: 120,

  // Query parameter limits
  QUERY_LIMIT_MIN: 1,
  QUERY_LIMIT_MAX: 50,
  QUERY_LIMIT_DEFAULT: 10,
} as const;

export const VALIDATION_ENUMS = {
  SENTIMENT: ['pos', 'neu', 'neg'] as const,
  ACTION_ITEM_STATUS: ['open', 'done'] as const,
} as const;

/**
 * Sentiment/Score mapping and validation
 * Enforces consistency between sentiment enum and numeric score
 * Ranges are designed to be non-overlapping for clear boundaries
 */
export const SENTIMENT_SCORE_MAPPING = {
  'neg': { min: -1.0, max: -0.1 },
  'neu': { min: -0.0999, max: 0.0999 }, 
  'pos': { min: 0.1, max: 1.0 }
} as const;

export function validateSentimentScoreConsistency(sentiment: string, score: number): boolean {
  if (!Object.keys(SENTIMENT_SCORE_MAPPING).includes(sentiment)) {
    return false;
  }
  
  const mapping = SENTIMENT_SCORE_MAPPING[sentiment as keyof typeof SENTIMENT_SCORE_MAPPING];
  return score >= mapping.min && score <= mapping.max;
}

export function deriveSentimentFromScore(score: number): 'pos' | 'neu' | 'neg' {
  if (score >= 0.1) return 'pos';
  if (score <= -0.1) return 'neg';
  return 'neu';
}

// Helper functions for clamping values
export function clampDuration(value: number): number {
  return Math.max(VALIDATION_LIMITS.CALL_DURATION_MIN, Math.min(VALIDATION_LIMITS.CALL_DURATION_MAX, value));
}

export function clampScore(value: number): number {
  return Math.max(VALIDATION_LIMITS.CALL_SCORE_MIN, Math.min(VALIDATION_LIMITS.CALL_SCORE_MAX, value));
}

export function clampBookingLikelihood(value: number): number {
  return Math.max(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MIN, Math.min(VALIDATION_LIMITS.CALL_BOOKING_LIKELIHOOD_MAX, value));
}

export function clampQueryLimit(value: number): number {
  return Math.max(VALIDATION_LIMITS.QUERY_LIMIT_MIN, Math.min(VALIDATION_LIMITS.QUERY_LIMIT_MAX, value));
}