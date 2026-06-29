import { Response } from 'express';
import type { PaginationMeta } from '../types';

// ============================================================
// Success Response
// ============================================================

/**
 * Send a standardized success response
 */
export const sendSuccess = <T = unknown>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200,
  pagination?: PaginationMeta
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(pagination ? { pagination } : {}),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send a standardized created (201) response
 */
export const sendCreated = <T = unknown>(
  res: Response,
  data?: T,
  message = 'Created successfully'
): Response => {
  return sendSuccess(res, data, message, 201);
};

// ============================================================
// Error Response
// ============================================================

/**
 * Send a standardized error response
 */
export const sendError = (
  res: Response,
  message = 'An error occurred',
  statusCode = 500,
  errors?: unknown[]
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send a 404 Not Found response
 */
export const sendNotFound = (res: Response, resource = 'Resource'): Response => {
  return sendError(res, `${resource} not found.`, 404);
};

/**
 * Send a 403 Forbidden response
 */
export const sendForbidden = (res: Response, message = 'Access denied.'): Response => {
  return sendError(res, message, 403);
};

/**
 * Send a 401 Unauthorized response
 */
export const sendUnauthorized = (res: Response, message = 'Unauthorized.'): Response => {
  return sendError(res, message, 401);
};

// ============================================================
// Pagination Builder
// ============================================================

/**
 * Build pagination metadata
 */
export const buildPagination = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
