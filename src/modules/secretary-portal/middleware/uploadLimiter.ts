/**
 * Upload Concurrency Limiter Middleware
 * 
 * Limits concurrent file uploads to prevent resource exhaustion.
 * Uses a simple in-memory counter to track active uploads.
 * 
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Maximum concurrent uploads allowed
 * Prevents resource exhaustion from too many simultaneous file uploads
 */
const MAX_CONCURRENT_UPLOADS = 10;

/**
 * Track active upload count
 */
let activeUploads = 0;

/**
 * Upload concurrency limiter middleware
 * 
 * Limits the number of concurrent file uploads to prevent resource exhaustion.
 * Returns HTTP 503 (Service Unavailable) when limit is reached.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 * 
 */
export function uploadLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if we've reached the concurrent upload limit
  if (activeUploads >= MAX_CONCURRENT_UPLOADS) {
    res.status(503).json({
      success: false,
      error: {
        message: 'Server is currently processing maximum concurrent uploads. Please try again in a moment.',
        code: 'UPLOAD_LIMIT_REACHED',
      },
    });
    return;
  }

  // Increment active upload counter
  activeUploads++;

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to decrement counter when response completes
  res.end = function (this: Response, ...args: any[]): Response {
    // Decrement counter
    activeUploads--;

    // Call original end function
    return originalEnd.apply(this, args as any);
  };

  // Also handle connection close/abort
  req.on('close', () => {
    if (activeUploads > 0) {
      activeUploads--;
    }
  });

  next();
}

/**
 * Get current active upload count
 * Useful for monitoring and testing
 * 
 * @returns Current number of active uploads
 */
export function getActiveUploadCount(): number {
  return activeUploads;
}

/**
 * Reset active upload count
 * Useful for testing
 */
export function resetUploadCount(): void {
  activeUploads = 0;
}
