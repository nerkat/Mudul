import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

/**
 * CORS configuration for API routes
 * Restrictive configuration that only allows known origins
 */
const getAllowedOrigins = (): string[] => {
  const origins = [];
  
  // Add development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173');
  }
  
  // Add production origins from environment
  if (process.env.CORS_ALLOWED_ORIGINS) {
    origins.push(...process.env.CORS_ALLOWED_ORIGINS.split(','));
  }
  
  // Fallback for tests
  if (process.env.NODE_ENV === 'test') {
    origins.push('http://localhost');
  }
  
  return origins;
};

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key']
});

/**
 * Rate limiting for general API endpoints
 */
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to include user context if available
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user ? `${req.ip}-${user.orgId}` : req.ip;
  }
});

/**
 * Stricter rate limiting for write operations (POST, PUT, PATCH, DELETE)
 */
export const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit write operations to 100 per 15 minutes
  message: {
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
    message: 'Too many write operations from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to write methods
    return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  },
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user ? `write-${req.ip}-${user.orgId}` : `write-${req.ip}`;
  }
});

/**
 * Very strict rate limiting for authentication endpoints
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit authentication attempts to 5 per 15 minutes
  message: {
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful auth attempts
});

/**
 * Idempotency key middleware for safe retries
 */
export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (idempotencyKey && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    // Store the idempotency key in the request for later use
    (req as any).idempotencyKey = idempotencyKey;
    
    // In a real implementation, you would check against a cache/database
    // to see if this request has been processed before
    console.log(`Idempotency key received: ${idempotencyKey}`);
  }
  
  next();
};

/**
 * Request ID middleware for tracing
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 
                   (req as any).traceId || 
                   `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  (req as any).traceId = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};