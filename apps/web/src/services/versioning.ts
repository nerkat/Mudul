/**
 * Schema versioning and content hashing for idempotency.
 * Prevents duplicate analysis entries and enables version tracking.
 */

import type { SalesCallAnalysis } from "@mudul/protocol";

/**
 * Current schema version for analysis records
 */
export const ANALYSIS_SCHEMA_VERSION = "v1.0.0";

/**
 * Analysis mode configurations  
 */
export const ANALYSIS_MODES = {
  sales_v1: {
    mode: "sales_v1" as const,
    schemaVersion: ANALYSIS_SCHEMA_VERSION,
    description: "Sales call analysis with sentiment, booking likelihood, and key moments"
  }
} as const;

export type AnalysisMode = keyof typeof ANALYSIS_MODES;

/**
 * Enhanced analysis record with versioning and content hash
 */
export interface VersionedAnalysis extends SalesCallAnalysis {
  meta?: {
    mode: AnalysisMode;
    schemaVersion: string;
    contentHash: string;
    createdAt: string;
    updatedAt: string;
    requestId?: string;
    provider?: string;
    model?: string;
    durationMs?: number;
  };
}

/**
 * Simple hash function for content deduplication.
 * Uses a fast non-cryptographic hash for performance.
 */
export function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Create content hash for analysis idempotency.
 * Combines transcript content, mode, and schema version.
 */
export function createAnalysisContentHash(
  transcript: string, 
  mode: AnalysisMode, 
  schemaVersion: string = ANALYSIS_SCHEMA_VERSION
): string {
  const content = `${transcript}:${mode}:${schemaVersion}`;
  return hashContent(content);
}

/**
 * Create versioned analysis metadata
 */
export function createAnalysisMeta(
  mode: AnalysisMode,
  contentHash: string,
  requestId?: string,
  provider?: string,
  model?: string,
  durationMs?: number
): VersionedAnalysis['meta'] {
  const now = new Date().toISOString();
  
  return {
    mode,
    schemaVersion: ANALYSIS_MODES[mode].schemaVersion,
    contentHash,
    createdAt: now,
    updatedAt: now,
    requestId,
    provider,
    model,
    durationMs
  };
}

/**
 * Check if analysis already exists for this content hash
 */
export function isAnalysisDuplicate(
  existingAnalysis: VersionedAnalysis | null,
  contentHash: string,
  schemaVersion: string = ANALYSIS_SCHEMA_VERSION
): boolean {
  if (!existingAnalysis?.meta) {
    return false;
  }
  
  return (
    existingAnalysis.meta.contentHash === contentHash && 
    existingAnalysis.meta.schemaVersion === schemaVersion
  );
}

/**
 * Update analysis metadata for reanalysis
 */
export function updateAnalysisMeta(
  existingMeta: VersionedAnalysis['meta'],
  requestId?: string,
  provider?: string,
  model?: string,
  durationMs?: number
): VersionedAnalysis['meta'] {
  if (!existingMeta) {
    throw new Error("Cannot update missing metadata");
  }
  
  return {
    ...existingMeta,
    updatedAt: new Date().toISOString(),
    requestId,
    provider,
    model,
    durationMs
  };
}