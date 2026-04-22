import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { config } from '../../config';

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
 * 
 * Error Handling Requirements:
 * - HTTP 400: Validation errors with field-specific messages
 * - HTTP 401: Authentication failures with generic message
 * - HTTP 403: Authorization failures with permission name
 * - HTTP 404: Resource not found with entity type
 * - HTTP 409: Conflict errors with constraint details
 * - HTTP 422: Business logic errors with reason
 * - HTTP 500: Internal server errors with generic message
 * - No sensitive information in error messages
 * - No stack traces in production
 * - Consistent error response format
 * - Detailed error logging for debugging
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Handle known AppError instances
  if (err instanceof AppError) {
    // Log error details for debugging (includes stack trace)
    logErrorDetails(err, req);

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

  // Log unexpected errors for debugging (includes full stack trace)
  logErrorDetails(err, req);

  // Handle unexpected errors with generic 500 response
  // Do not expose sensitive information or stack traces
  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Log detailed error information for debugging
 * Includes stack traces and request context
 * Only logs to console/logging service, never exposed to client
 */
function logErrorDetails(err: Error, req: Request): void {
  const isProduction = config.nodeEnv === 'production';
  
  // In production, log to structured logging service
  // In development, log to console with full details
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      // Include stack trace only in non-production or for debugging
      ...((!isProduction || config.nodeEnv === 'development') && { stack: err.stack }),
      // Include AppError details if available
      ...(err instanceof AppError && {
        code: err.code,
        statusCode: err.statusCode,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        details: err.details,
      }),
    },
    request: {
      method: req.method,
      url: req.url,
      path: req.path,
      query: req.query,
      // Don't log sensitive headers (Authorization, Cookie, etc.)
      headers: sanitizeHeaders(req.headers),
      ip: req.ip,
      userAgent: req.get('user-agent'),
    },
  };

  // Log to console (in production, this should be replaced with proper logging service)
  console.error('Error occurred:', JSON.stringify(errorLog, null, 2));
}

/**
 * Sanitize request headers to remove sensitive information
 * Removes Authorization, Cookie, and other sensitive headers
 */
function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
  const sanitized: Record<string, unknown> = {};

  // Handle case where headers might be undefined or not an object
  if (!headers || typeof headers !== 'object') {
    return sanitized;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
