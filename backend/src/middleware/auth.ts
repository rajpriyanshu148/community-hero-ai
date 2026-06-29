import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';
import type { AuthUser, JwtPayload } from '../types';

/**
 * Extract token from Authorization header (Bearer) OR httpOnly cookie
 */
const extractToken = (req: Request): string | null => {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. httpOnly cookie
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken as string;
  }

  return null;
};

/**
 * Mandatory JWT authentication middleware.
 * Attaches the authenticated user to req.user.
 * Returns 401 if token is missing or invalid.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    sendError(res, 'Authentication required. Please provide a valid token.', 401);
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Fetch fresh user from DB to ensure they are still active / not banned
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        trustScore: true,
        isActive: true,
        isBanned: true,
        deletedAt: true,
        ward: true,
      },
    });

    if (!user) {
      sendError(res, 'User not found. Token may be invalid.', 401);
      return;
    }

    if (!user.isActive || user.deletedAt) {
      sendError(res, 'Account is deactivated. Please contact support.', 401);
      return;
    }

    if (user.isBanned) {
      sendError(res, 'Account is suspended. Please contact support.', 403);
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      trustScore: user.trustScore,
      ward: user.ward ?? undefined,
    } as AuthUser;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      sendError(res, 'Token has expired. Please refresh your token.', 401);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Invalid token. Please log in again.', 401);
      return;
    }

    logger.error('Auth middleware error:', error);
    sendError(res, 'Authentication failed.', 401);
  }
};

/**
 * Optional JWT authentication middleware.
 * Attaches user to req.user if token is valid, but does NOT block the request if missing.
 * Useful for endpoints that behave differently for authenticated vs anonymous users.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const token = extractToken(req);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true, isBanned: false, deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        trustScore: true,
        ward: true,
      },
    });

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        trustScore: user.trustScore,
        ward: user.ward ?? undefined,
      } as AuthUser;
    }
  } catch {
    // Silently ignore errors for optional auth
  }

  next();
};
