import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { sendError } from '../utils/response';

/**
 * Middleware factory for role-based access control.
 * Usage: requireRole(UserRole.ADMIN, UserRole.AUTHORITY)
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      sendError(
        res,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`,
        403
      );
      return;
    }

    next();
  };
};

/**
 * Require at least CITIZEN role (any authenticated user).
 */
export const requireCitizen = requireRole(
  UserRole.CITIZEN,
  UserRole.VOLUNTEER,
  UserRole.AUTHORITY,
  UserRole.ADMIN
);

/**
 * Require VOLUNTEER or higher.
 */
export const requireVolunteer = requireRole(
  UserRole.VOLUNTEER,
  UserRole.AUTHORITY,
  UserRole.ADMIN
);

/**
 * Require AUTHORITY or ADMIN role.
 */
export const requireAuthority = requireRole(UserRole.AUTHORITY, UserRole.ADMIN);

/**
 * Require ADMIN role only.
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Ensure the authenticated user owns a resource OR is an admin.
 * Usage: requireOwnerOrAdmin((req) => req.params.userId)
 */
export const requireOwnerOrAdmin = (getResourceOwnerId: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    const resourceOwnerId = getResourceOwnerId(req);

    if (req.user.id !== resourceOwnerId && req.user.role !== UserRole.ADMIN) {
      sendError(res, 'Access denied. You do not own this resource.', 403);
      return;
    }

    next();
  };
};
