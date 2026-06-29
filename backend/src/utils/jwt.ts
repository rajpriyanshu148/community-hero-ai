import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { env } from '../config/env';
import type { JwtPayload, JwtRefreshPayload } from '../types';

// ============================================================
// Token Generation
// ============================================================

/**
 * Generate a short-lived access token (default: 15m)
 */
export const generateAccessToken = (userId: string, email: string, role: UserRole): string => {
  const payload: JwtPayload = {
    userId,
    email,
    role,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'community-hero-ai',
    audience: 'community-hero-ai-frontend',
  });
};

/**
 * Generate a long-lived refresh token (default: 7d)
 */
export const generateRefreshToken = (userId: string): string => {
  const payload: JwtRefreshPayload = {
    userId,
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'community-hero-ai',
    audience: 'community-hero-ai-frontend',
  });
};

// ============================================================
// Token Verification
// ============================================================

/**
 * Verify and decode an access token.
 * Throws jwt.JsonWebTokenError or jwt.TokenExpiredError on failure.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: 'community-hero-ai',
    audience: 'community-hero-ai-frontend',
  }) as JwtPayload;
};

/**
 * Verify and decode a refresh token.
 * Throws jwt.JsonWebTokenError or jwt.TokenExpiredError on failure.
 */
export const verifyRefreshToken = (token: string): JwtRefreshPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'community-hero-ai',
    audience: 'community-hero-ai-frontend',
  }) as JwtRefreshPayload;
};

// ============================================================
// Cookie Configuration
// ============================================================

/**
 * Standard cookie options for access token
 */
export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes in ms
  path: '/',
};

/**
 * Standard cookie options for refresh token
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/api/v1/auth', // Only sent to auth endpoints
};

/**
 * Clear cookie options (for logout)
 */
export const clearCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/',
};
