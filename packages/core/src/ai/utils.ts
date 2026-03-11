/**
 * AI utility functions for prompt management, truncation, and error handling
 */

export interface PromptInfo {
  id: string;
  version: string;
  content: string;
}

/**
 * Parse prompt file to extract ID and version from first line
 * Format: PROMPT_ID: name@version
 */
export function parsePrompt(content: string): PromptInfo {
  const lines = content.split('\n');
  const firstLine = lines[0];
  
  let id = "unknown";
  let version = "unknown";
  let promptContent = content;
  
  if (firstLine.startsWith('PROMPT_ID:')) {
    const match = firstLine.match(/PROMPT_ID:\s*(.+)@(.+)/);
    if (match) {
      id = match[1].trim();
      version = match[2].trim();
      // Remove the ID line from content
      promptContent = lines.slice(1).join('\n').trim();
    }
  }
  
  return { id, version, content: promptContent };
}

/**
 * Truncate transcript by UTF-8 bytes with safety margin
 * More accurate than character count for token estimation
 */
export function truncateTranscript(transcript: string, maxBytes = 16384): { content: string; truncated: boolean } {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(transcript);
  
  if (bytes.length <= maxBytes) {
    return { content: transcript, truncated: false };
  }
  
  // Binary search to find the longest valid UTF-8 prefix
  let low = 0;
  let high = transcript.length;
  let result = '';
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const substring = transcript.slice(0, mid);
    const testBytes = encoder.encode(substring);
    
    if (testBytes.length <= maxBytes) {
      result = substring;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  return { content: result, truncated: true };
}

/**
 * Redact potentially sensitive information from logs
 * Includes common international phone patterns
 */
export function redactForLogging(text: string): string {
  // Basic PII patterns - can be extended
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]') // SSN pattern
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]') // Email
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]') // US phone numbers with separators
    .replace(/\b\d{10,}\b/g, '[PHONE]') // Phone numbers without separators
    .replace(/\+\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[INTL_PHONE]') // International phone
    .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '[CARD]') // Credit card patterns
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]'); // Credit card with dashes/spaces
}

/**
 * Create structured error for API responses
 */
export function createErrorResponse(type: string, details?: string[], provider?: string) {
  return {
    error: type,
    details: details || [],
    ...(provider && { provider }),
    timestamp: new Date().toISOString()
  };
}

/**
 * Simple in-memory metrics counter for development
 */
class MetricsCounter {
  private counters = new Map<string, number>();
  
  increment(name: string, labels: Record<string, string> = {}) {
    const key = this.createKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }
  
  get(name: string, labels: Record<string, string> = {}): number {
    const key = this.createKey(name, labels);
    return this.counters.get(key) || 0;
  }
  
  getAll(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }
  
  private createKey(name: string, labels: Record<string, string>): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }
}

export const metrics = new MetricsCounter();