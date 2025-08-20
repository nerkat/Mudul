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