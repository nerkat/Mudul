import rateLimit from 'express-rate-limit';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import { createHash } from 'node:crypto';

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
  
  // Add production origins from environment (comma-separated)
  if (process.env.CORS_ALLOWED_ORIGINS) {
    origins.push(...process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()));
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
    
    // Allow requests with no origin (mobile apps, curl, etc.) in development only
    if (!origin && process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check for wildcard in production - reject it
    if (process.env.NODE_ENV === 'production' && allowedOrigins.includes('*')) {
      const error = new Error('Wildcard origin (*) not allowed in production');
      (error as any).status = 403;
      (error as any).code = 'CORS_WILDCARD_BLOCKED';
      return callback(error);
    }
    
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // Create a proper error that will be handled by Express error middleware
      const error = new Error(`Origin ${origin} not allowed by CORS policy`);
      (error as any).status = 403;
      (error as any).code = 'CORS_BLOCKED';
      callback(error);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key']
});

/**
 * CORS error handler - converts CORS errors to proper JSON responses
 */
export const corsErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'CORS_BLOCKED' || err.message.includes('CORS policy')) {
    return res.status(403).json({
      code: 'CORS_BLOCKED',
      message: 'Origin not allowed by CORS policy',
      traceId: (req as any).traceId || `cors_${Date.now()}`
    });
  }
  
  if (err.code === 'CORS_WILDCARD_BLOCKED' || err.message.includes('Wildcard origin')) {
    return res.status(403).json({
      code: 'CORS_WILDCARD_BLOCKED',
      message: 'Wildcard origin (*) not allowed in production',
      traceId: (req as any).traceId || `cors_${Date.now()}`
    });
  }
  
  next(err);
};

/**
 * Safe key generator that handles IPv6 addresses properly
 */
const safeKeyGenerator = (req: Request, prefix = ''): string => {
  const user = (req as any).user;
  // Use standard key generation that handles IPv6 properly
  let key = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Handle IPv6 addresses by normalizing them
  if (key.includes('::ffff:')) {
    key = key.replace('::ffff:', ''); // Remove IPv4-mapped IPv6 prefix
  }
  
  if (user?.orgId) {
    return `${prefix}${key}-${user.orgId}`;
  }
  
  return `${prefix}${key}`;
};

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
  standardHeaders: 'draft-7', // Include standard rate limit headers
  legacyHeaders: false,
  keyGenerator: (req: Request) => safeKeyGenerator(req),
  // Custom handler to add retry-after header
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.',
      traceId: (req as any).traceId || `rate_${Date.now()}`
    });
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
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => {
    // Only apply to write methods
    return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  },
  keyGenerator: (req: Request) => safeKeyGenerator(req, 'write-'),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 'WRITE_RATE_LIMIT_EXCEEDED',
      message: 'Too many write operations from this IP, please try again later.',
      traceId: (req as any).traceId || `write_rate_${Date.now()}`
    });
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
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  keyGenerator: (req: Request) => safeKeyGenerator(req, 'auth-'),
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.',
      traceId: (req as any).traceId || `auth_rate_${Date.now()}`
    });
  }
});

/**
 * In-memory store for idempotency keys
 * In production, this would be replaced with Redis or similar
 */
interface IdempotencyEntry {
  key: string;
  orgId: string;
  route: string;
  bodyHash: string;
  response: any;
  timestamp: number;
}

const idempotencyStore = new Map<string, IdempotencyEntry>();
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Clean expired idempotency entries
 */
const cleanExpiredEntries = () => {
  const now = Date.now();
  for (const [key, entry] of idempotencyStore.entries()) {
    if (now - entry.timestamp > IDEMPOTENCY_TTL) {
      idempotencyStore.delete(key);
    }
  }
};

/**
 * Idempotency key middleware for safe retries
 */
export const idempotencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey || !['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next();
  }

  const user = (req as any).user;
  if (!user?.orgId) {
    return next(); // Skip if no user context (will fail auth later)
  }

  // Create stable crypto hash for uniqueness
  const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
  const bodyHash = createHash('sha256').update(raw).digest('base64url');
  const route = `${req.method} ${req.path}`;
  
  // Create compound key: idempotency-key + orgId + route + bodyHash
  const compoundKey = `${idempotencyKey}-${user.orgId}-${route}-${bodyHash}`;
  
  // Clean expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean
    cleanExpiredEntries();
  }
  
  // Check if we've seen this exact request before
  const existingEntry = idempotencyStore.get(compoundKey);
  if (existingEntry) {
    // Return the cached response with 200 status (idempotent replay)
    return res.status(200).json(existingEntry.response);
  }
  
  // Store the key for later use in response
  (req as any).idempotencyKey = idempotencyKey;
  (req as any).idempotencyCompoundKey = compoundKey;
  (req as any).idempotencyRoute = route;
  (req as any).idempotencyBodyHash = bodyHash;
  
  // Intercept res.json to cache successful responses
  const originalJson = res.json;
  res.json = function(data: any) {
    // Only cache successful creation responses (201)
    if (res.statusCode === 201 && (req as any).idempotencyKey) {
      const entry: IdempotencyEntry = {
        key: idempotencyKey,
        orgId: user.orgId,
        route: (req as any).idempotencyRoute,
        bodyHash: (req as any).idempotencyBodyHash,
        response: data,
        timestamp: Date.now()
      };
      idempotencyStore.set((req as any).idempotencyCompoundKey, entry);
    }
    
    return originalJson.call(this, data);
  };
  
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

/**
 * Logging middleware with PII redaction
 */
export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Override res.end to capture response time and status
  const originalEnd: typeof res.end = res.end.bind(res);
  res.end = function end(...args: Parameters<typeof res.end>) {
    const endTime = Date.now();
    const latency = endTime - startTime;
    
    const user = (req as any).user;
    const logData = {
      requestId: (req as any).traceId,
      orgId: user?.orgId || 'anonymous',
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
      latency: `${latency}ms`,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']?.substring(0, 100) // Truncate UA
    };
    
    // Only log errors or slow requests in detail
    if (res.statusCode >= 400 || latency > 1000) {
      console.error('API Request:', logData);
    } else {
      console.log('API Request:', logData);
    }
    
    return originalEnd.apply(this, args);
  };
  
  next();
};