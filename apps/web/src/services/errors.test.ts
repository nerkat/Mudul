import { describe, it, expect } from 'vitest';
import { 
  createAnalysisError, 
  mapNetworkError, 
  mapHttpError, 
  success, 
  failure,
  type AnalysisErrorCode 
} from '../services/errors';

describe('Error Handling', () => {
  it('should create analysis errors with correct metadata', () => {
    const error = createAnalysisError('TIMEOUT', 'Request timed out', { timeout: 30000 });
    
    expect(error).toEqual({
      code: 'TIMEOUT',
      message: 'Request timed out',
      details: { timeout: 30000 },
      retryable: true
    });
  });

  it('should mark appropriate errors as retryable', () => {
    const retryableErrors: AnalysisErrorCode[] = ['TIMEOUT', 'NETWORK_ERROR', 'RATE_LIMITED', 'SERVER_ERROR'];
    const nonRetryableErrors: AnalysisErrorCode[] = ['SCHEMA_INVALID', 'CANCELLED', 'SCHEMA_MISMATCH'];

    retryableErrors.forEach(code => {
      const error = createAnalysisError(code, 'Test message');
      expect(error.retryable).toBe(true);
    });

    nonRetryableErrors.forEach(code => {
      const error = createAnalysisError(code, 'Test message');
      expect(error.retryable).toBe(false);
    });
  });

  it('should map network errors correctly', () => {
    const fetchError = new TypeError('fetch failed');
    const mappedError = mapNetworkError(fetchError);
    
    expect(mappedError.code).toBe('NETWORK_ERROR');
    expect(mappedError.message).toBe('Network request failed');
    expect(mappedError.details).toBe(fetchError);
  });

  it('should map abort errors correctly', () => {
    const abortError = new Error('Request was aborted');
    abortError.name = 'AbortError';
    const mappedError = mapNetworkError(abortError);
    
    expect(mappedError.code).toBe('CANCELLED');
    expect(mappedError.message).toBe('Request was cancelled');
  });

  it('should map timeout errors correctly', () => {
    const timeoutError = new Error('Request timed out');
    timeoutError.name = 'TimeoutError';
    const mappedError = mapNetworkError(timeoutError);
    
    expect(mappedError.code).toBe('TIMEOUT');
    expect(mappedError.message).toBe('Request timed out');
  });

  it('should map HTTP status codes correctly', () => {
    const testCases = [
      { status: 400, expectedCode: 'SCHEMA_INVALID' },
      { status: 408, expectedCode: 'TIMEOUT' },
      { status: 429, expectedCode: 'RATE_LIMITED' },
      { status: 502, expectedCode: 'PROVIDER_ERROR' },
      { status: 503, expectedCode: 'PROVIDER_ERROR' },
      { status: 504, expectedCode: 'TIMEOUT' },
      { status: 500, expectedCode: 'SERVER_ERROR' },
      { status: 422, expectedCode: 'PROVIDER_ERROR' }
    ];

    testCases.forEach(({ status, expectedCode }) => {
      const error = mapHttpError(status, 'Test Status', 'Test body');
      expect(error.code).toBe(expectedCode);
    });
  });

  it('should create success results', () => {
    const data = { test: 'data' };
    const result = success(data);
    
    expect(result).toEqual({
      ok: true,
      data
    });
  });

  it('should create failure results', () => {
    const error = createAnalysisError('TIMEOUT', 'Test timeout');
    const result = failure(error);
    
    expect(result).toEqual({
      ok: false,
      error
    });
  });
});