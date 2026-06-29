import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';
import { MulterError } from 'multer';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface AppError extends Error {
  statusCode?: number;
  errors?: unknown[];
  isOperational?: boolean;
}

/**
 * Global error handler middleware.
 * Must have 4 parameters to be recognized as error handler by Express.
 */
export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Log error details
  logger.error('Error handler caught:', {
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // ── Zod Validation Error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    });
    return;
  }

  // ── JWT Errors
  if (err instanceof jwt.TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: 'Token has expired. Please refresh your session.',
    });
    return;
  }

  if (err instanceof jwt.JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
    return;
  }

  // ── Multer Errors (file upload)
  if (err instanceof MulterError) {
    let message = 'File upload error.';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File too large. Maximum size is ${Math.round(parseInt(process.env.MAX_FILE_SIZE || '10485760') / 1024 / 1024)}MB.`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded at once.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected field: ${err.field}.`;
        break;
      default:
        message = err.message;
    }

    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  // ── Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const fields = (err.meta?.target as string[]) || ['field'];
        res.status(409).json({
          success: false,
          message: `A record with this ${fields.join(', ')} already exists.`,
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
        });
        return;
      }
      case 'P2025': {
        // Record not found
        res.status(404).json({
          success: false,
          message: 'Record not found.',
          code: 'NOT_FOUND',
        });
        return;
      }
      case 'P2003': {
        // Foreign key constraint violation
        res.status(400).json({
          success: false,
          message: 'Related record does not exist.',
          code: 'FOREIGN_KEY_VIOLATION',
        });
        return;
      }
      case 'P2014': {
        res.status(400).json({
          success: false,
          message: 'Invalid data: violates a required relation.',
          code: 'RELATION_VIOLATION',
        });
        return;
      }
      default:
        res.status(500).json({
          success: false,
          message: 'Database error occurred.',
          code: err.code,
        });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Invalid data provided to database.',
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      success: false,
      message: 'Database connection failed. Please try again later.',
    });
    return;
  }

  // ── Operational / App Errors (errors we threw manually)
  const appErr = err as AppError;
  if (appErr.isOperational && appErr.statusCode) {
    res.status(appErr.statusCode).json({
      success: false,
      message: err.message,
      ...(appErr.errors ? { errors: appErr.errors } : {}),
    });
    return;
  }

  // ── Generic / Unknown Errors
  const statusCode = appErr.statusCode || 500;
  const message =
    statusCode === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV === 'development'
      ? {
          stack: err.stack,
          detail: err.message,
        }
      : {}),
  });
};

/**
 * Create an operational error with a status code.
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: unknown[];

  constructor(message: string, statusCode = 500, errors?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default errorHandler;
