import express from 'express';
import { z } from 'zod';
import { PrismaAuthService } from '../services/prisma-auth';
import { validateResponse, LoginResponseSchema, RefreshResponseSchema, LogoutResponseSchema } from '../middleware/validation';

const router = express.Router();

// Request/response schemas
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

// Rate limiting (simple in-memory for demo)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 attempts per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// POST /api/auth/login
router.post('/login', validateResponse(LoginResponseSchema), async (req, res) => {
  try {
    // Rate limiting
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts. Please try again later.',
      });
    }

    // Validate request
    const validation = LoginRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request format',
        details: validation.error.errors,
      });
    }

    const { email, password, rememberMe } = validation.data;

    // Authenticate
    const result = await PrismaAuthService.login(email, password, rememberMe);
    
    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    }
    
    if (error.message === 'NO_ORG_ACCESS') {
      return res.status(403).json({
        error: 'NO_ORG_ACCESS',
        message: 'User has no organization access',
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Login failed due to server error',
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', validateResponse(RefreshResponseSchema), async (req, res) => {
  try {
    // Validate request
    const validation = RefreshRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request format',
        details: validation.error.errors,
      });
    }

    const { refreshToken } = validation.data;

    // Refresh token
    const result = await PrismaAuthService.refreshToken(refreshToken);
    
    res.json(result);
  } catch (error: any) {
    console.error('Refresh error:', error);
    
    if (error.message === 'INVALID_REFRESH_TOKEN') {
      return res.status(401).json({
        error: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token',
      });
    }
    
    if (error.message === 'NO_ORG_ACCESS') {
      return res.status(403).json({
        error: 'NO_ORG_ACCESS',
        message: 'User has no organization access',
      });
    }
    
    res.status(500).json({
      error: 'INTERNAL_ERROR', 
      message: 'Token refresh failed due to server error',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', validateResponse(LogoutResponseSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      await PrismaAuthService.logout(refreshToken);
    }
    
    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Logout failed due to server error',
    });
  }
});

export { router as authRoutes };