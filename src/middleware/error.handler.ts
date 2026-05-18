import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/response';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a standardized response.
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`${err.message}`, err.stack);

  // Zod validation errors — extract first human-readable message
  if (err instanceof ZodError) {
    const message = err.errors[0]?.message || 'Validation error.';
    sendError(res, message, 400);
    return;
  }

  // Prisma known error handling
  if (err.name === 'PrismaClientKnownRequestError') {
    sendError(res, 'Database operation failed. Please check your input.', 400);
    return;
  }

  if (err.name === 'PrismaClientValidationError') {
    sendError(res, 'Invalid data provided.', 400);
    return;
  }

  // Multer file upload errors
  if (err.name === 'MulterError') {
    sendError(res, `File upload error: ${err.message}`, 400);
    return;
  }

  // Default server error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  sendError(res, err.message || 'Internal server error.', statusCode);
};

/**
 * Request logging middleware.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.request(req.method, req.originalUrl, res.statusCode, duration);
  });

  next();
};
