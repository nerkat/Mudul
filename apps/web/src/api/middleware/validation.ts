// Response validation middleware using Zod
import { z } from 'zod';

// User info schema for auth responses
export const UserInfoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
}).strict();

export const OrgInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
}).strict();

// Auth response schemas
export const LoginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  user: UserInfoSchema,
  orgs: z.array(OrgInfoSchema),
  activeOrgId: z.string(),
}).strict();

export const RefreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
}).strict();

export const LogoutResponseSchema = z.object({
  message: z.string(),
}).strict();

// API response schemas matching the storage package types
export const OrgSummarySchema = z.object({
  totalCalls: z.number(),
  avgSentimentScore: z.number(),
  bookingRate: z.number(),
  openActionItems: z.number(),
}).strict();

export const ClientRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  lastCallDate: z.string().nullable(),
  totalCalls: z.number(),
  avgSentiment: z.number(),
  bookingLikelihood: z.number(),
}).strict();

export const ClientsOverviewSchema = z.object({
  items: z.array(ClientRowSchema),
}).strict();

export const ClientSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  totalCalls: z.number(),
  avgSentiment: z.number(),
  bookingLikelihood: z.number(),
  topObjections: z.array(z.object({
    type: z.string(),
    count: z.number(),
  })),
}).strict();

export const CallRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  date: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  score: z.number(),
  bookingLikelihood: z.number(),
}).strict();

export const ClientCallsSchema = z.object({
  items: z.array(CallRowSchema),
}).strict();

export const ActionItemRowSchema = z.object({
  id: z.string(),
  text: z.string(),
  due: z.string().nullable(),
  status: z.enum(['open', 'done']),
  ownerName: z.string().nullable(),
}).strict();

export const ActionItemsSchema = z.object({
  items: z.array(ActionItemRowSchema),
}).strict();

/**
 * Middleware to validate API responses with Zod schemas
 */
export function validateResponse<T>(schema: z.ZodSchema<T>) {
  return (req: any, res: any, next: any) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      try {
        // Validate the response data
        const validatedData = schema.parse(data);
        return originalJson.call(this, validatedData);
      } catch (error) {
        console.error('Response validation error:', error);
        console.error('Invalid response data:', JSON.stringify(data, null, 2));
        
        // In development, show validation errors
        if (process.env.NODE_ENV !== 'production') {
          return originalJson.call(this, {
            error: 'RESPONSE_VALIDATION_ERROR',
            message: 'API response does not match expected schema',
            details: error instanceof z.ZodError ? error.errors : [error.message],
            invalidData: data,
          });
        }
        
        // In production, return generic error
        return originalJson.call(this, {
          error: 'INTERNAL_ERROR',
          message: 'Server error occurred',
        });
      }
    };
    
    next();
  };
}

/**
 * Standard error response helper
 */
export function createErrorResponse(code: string, message: string, statusCode: number = 500, details?: any) {
  const error = {
    error: code,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV !== 'production' && { timestamp: new Date().toISOString() })
  };
  
  return { statusCode, error };
}