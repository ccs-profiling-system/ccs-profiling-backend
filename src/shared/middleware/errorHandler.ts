import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';

/**
 * Global error handler middleware
 * Catches all errors and formats them according to the API response format
 * 
 * Standard Error Response Shape:
 * {
 *   "success": false,
 *   "error": {
 *     "message": "Error message",
 *     "code": "ERROR_CODE",
 *     "details": {},
 *     "timestamp": "ISO 8601 timestamp"
 *   }
 * }
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle known AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      error: {
        message: err.message,
        code: err.code,
        ...(err.details && { 
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: err.details 
        }),
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Log unexpected errors for debugging
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  console.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  // Handle unexpected errors with generic 500 response
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
  });
};
