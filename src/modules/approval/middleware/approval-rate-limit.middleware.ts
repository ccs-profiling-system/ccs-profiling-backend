/**
 * Approval Rate Limiting Middleware
 * 
 * Implements sliding window rate limiting for approval system endpoints.
 * Different rate limits are applied based on endpoint type:
 * - Submission endpoints: 20 req/min per user
 * - Bulk operations: 5 req/min per user
 * - Read endpoints: 100 req/min per user
 * 
 * **Validates: Requirements 25.1-25.8**
 */

import rateLimit, { RateLimitRequestHandler, ipKeyGenerator } from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuditLogRepository } from '../../audit-logs/repositories/auditLog.repository';
import { db } from '../../../db';

/**
 * Rate limit configuration for different endpoint types
 */
const RATE_LIMITS = {
  submission: { windowMs: 60000, max: 20 },  // 20 req/min
  bulkOps: { windowMs: 60000, max: 5 },      // 5 req/min
  readOps: { windowMs: 60000, max: 100 },    // 100 req/min
};

/**
 * Audit log repository instance for logging rate limit violations
 */
const auditLogRepository = new AuditLogRepository(db);

/**
 * Handler for rate limit violations
 * Logs the violation to the audit log and returns a 429 response
 */
const rateLimitHandler = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('user-agent') || 'unknown';

  // Log rate limit violation to audit log (async, non-blocking)
  if (userId) {
    auditLogRepository.create({
      user_id: userId,
      action_type: 'rate_limit_violation',
      entity_type: 'approval',
      ip_address: ipAddress,
      user_agent: userAgent,
      after_state: {
        endpoint: req.path,
        method: req.method,
      },
    }).catch((error) => {
      console.error('Failed to log rate limit violation:', error);
    });
  }

  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Key generator for rate limiting
 * Uses user ID if authenticated, otherwise falls back to IP address
 */
const keyGenerator = (req: Request): string => {
  const userId = (req as any).user?.id;
  return userId || ipKeyGenerator(req.ip || req.socket.remoteAddress || 'anonymous');
};

/**
 * Skip function for read endpoints
 * Exempts admin users from rate limiting on read-only endpoints
 */
const skipReadRateLimit = (req: Request): boolean => {
  const userRole = (req as any).user?.role;
  return userRole === 'admin';
};

/**
 * Rate limiter for submission endpoints
 * Limits to 20 requests per minute per user
 * 
 * **Validates: Requirements 25.1, 25.4, 25.5, 25.7**
 */
export const submissionRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMITS.submission.windowMs,
  max: RATE_LIMITS.submission.max,
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  keyGenerator,
  handler: rateLimitHandler,
  skip: (req) => false, // Always apply rate limiting for submissions
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many submission requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
});

/**
 * Rate limiter for bulk operation endpoints
 * Limits to 5 requests per minute per user
 * 
 * **Validates: Requirements 25.2, 25.4, 25.5, 25.7**
 */
export const bulkOperationRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMITS.bulkOps.windowMs,
  max: RATE_LIMITS.bulkOps.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: (req) => false, // Always apply rate limiting for bulk operations
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many bulk operation requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
});

/**
 * Rate limiter for read endpoints
 * Limits to 100 requests per minute per user
 * Exempts admin users from rate limiting
 * 
 * **Validates: Requirements 25.3, 25.4, 25.5, 25.6, 25.7**
 */
export const readOperationRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: RATE_LIMITS.readOps.windowMs,
  max: RATE_LIMITS.readOps.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  handler: rateLimitHandler,
  skip: skipReadRateLimit, // Exempt admin users
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many read requests. Please try again later.',
      timestamp: new Date().toISOString(),
    },
  },
});

/**
 * Export rate limit configuration for testing and documentation
 */
export const APPROVAL_RATE_LIMITS = RATE_LIMITS;
