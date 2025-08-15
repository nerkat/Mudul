/**
 * Error taxonomy for AI analysis operations.
 * Provides stable error codes for consistent UI handling.
 */

export type AnalysisErrorCode = 
  | 'SCHEMA_INVALID'
  | 'PROVIDER_ERROR' 
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'RATE_LIMITED'
  | 'SCHEMA_MISMATCH'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface AnalysisError {
  code: AnalysisErrorCode;
  message: string;
  details?: unknown;
  retryable?: boolean;
}

/**
 * Discriminated result pattern for AI analysis operations.
 * Replaces throwing errors with explicit success/failure states.
 */
export type AnalysisResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: AnalysisError };

/**
 * Create an error result with standard metadata
 */
export function createAnalysisError(
  code: AnalysisErrorCode, 
  message: string, 
  details?: unknown
): AnalysisError {
  const retryable = ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMITED', 'SERVER_ERROR'].includes(code);
  
  return {
    code,
    message,
    details,
    retryable
  };
}

/**
 * Success result helper
 */
export function success<T>(data: T): AnalysisResult<T> {
  return { ok: true, data };
}

/**
 * Error result helper  
 */
export function failure<T>(error: AnalysisError): AnalysisResult<T> {
  return { ok: false, error };
}

/**
 * Map network/fetch errors to analysis error codes
 */
export function mapNetworkError(error: unknown): AnalysisError {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return createAnalysisError('NETWORK_ERROR', 'Network request failed', error);
  }
  
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.includes('Aborted')) {
      return createAnalysisError('CANCELLED', 'Request was cancelled', error);
    }
    if (error.name === 'TimeoutError') {
      return createAnalysisError('TIMEOUT', 'Request timed out', error);
    }
  }
  
  // Check for DOMException abort (common in test environments)
  if (error && typeof error === 'object' && 'name' in error && error.name === 'AbortError') {
    return createAnalysisError('CANCELLED', 'Request was cancelled', error);
  }
  
  return createAnalysisError('SERVER_ERROR', 'Unknown server error', error);
}

/**
 * Map HTTP status codes to analysis error codes
 */
export function mapHttpError(status: number, statusText: string, body?: string): AnalysisError {
  switch (status) {
    case 400:
      return createAnalysisError('SCHEMA_INVALID', `Bad request: ${statusText}`, body);
    case 429:
      return createAnalysisError('RATE_LIMITED', 'Rate limit exceeded', body);
    case 408:
    case 504:
      return createAnalysisError('TIMEOUT', `Request timeout: ${statusText}`, body);
    case 502:
    case 503:
      return createAnalysisError('PROVIDER_ERROR', `Provider unavailable: ${statusText}`, body);
    default:
      if (status >= 500) {
        return createAnalysisError('SERVER_ERROR', `Server error: ${statusText}`, body);
      }
      return createAnalysisError('PROVIDER_ERROR', `Provider error: ${statusText}`, body);
  }
}