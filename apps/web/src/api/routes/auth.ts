import express from 'express';
import { z } from 'zod';
import { PrismaAuthService } from '../services/prisma-auth';
import { validateResponse, LoginResponseSchema, RefreshResponseSchema, LogoutResponseSchema } from '../middleware/validation';

const router = express.Router();

// Request/response schemas
const GoogleLoginRequestSchema = z.object({
  credential: z.string().min(1),
  rememberMe: z.boolean().optional().default(true),
});

const RefreshRequestSchema = z.object({
  refreshToken: z.string(),
});

// Rate limiting (simple in-memory for demo)
const googleLoginRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const refreshRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const demoLoginRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 attempts per window

function checkRateLimit(map: Map<string, { count: number; resetTime: number }>, key: string): boolean {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  const now = Date.now();
  const entry = map.get(key);
  
  if (!entry || now > entry.resetTime) {
    map.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

// POST /api/auth/google
router.post('/google', validateResponse(LoginResponseSchema), async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(googleLoginRateLimitMap, clientIp)) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many login attempts. Please try again later.',
      });
    }

    const validation = GoogleLoginRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'INVALID_REQUEST',
        message: 'Invalid request format',
        details: validation.error.errors,
      });
    }

    const { credential, rememberMe } = validation.data;
    const result = await PrismaAuthService.loginWithGoogle(credential, rememberMe);

    res.json(result);
  } catch (error: any) {
    console.error('Google login error:', error);

    if (error.message === 'GOOGLE_TOKEN_INVALID') {
      return res.status(401).json({
        error: 'GOOGLE_TOKEN_INVALID',
        message: 'Google sign-in failed. Please try again.',
      });
    }

    if (error.message === 'GOOGLE_AUTH_NOT_CONFIGURED') {
      return res.status(500).json({
        error: 'GOOGLE_AUTH_NOT_CONFIGURED',
        message: 'Google authentication is not configured on the server.',
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
      message: 'Google sign-in failed due to server error',
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', validateResponse(RefreshResponseSchema), async (req, res) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(refreshRateLimitMap, clientIp)) {
      return res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many refresh attempts. Please try again later.',
      });
    }

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

// POST /api/auth/demo-login (development/showcase only – never enabled in production)
router.post('/demo-login', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(demoLoginRateLimitMap, clientIp)) {
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many demo login attempts. Please try again later.',
    });
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'NOT_FOUND' });
  }

  try {
    const result = await PrismaAuthService.loginAsDemoUser();
    res.json(result);
  } catch (error: any) {
    console.error('Demo login error:', error);

    if (error.message === 'DEMO_USER_NOT_FOUND') {
      return res.status(404).json({
        error: 'DEMO_USER_NOT_FOUND',
        message: 'Demo user not found. Run the database seed first.',
      });
    }

    res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Demo login failed',
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