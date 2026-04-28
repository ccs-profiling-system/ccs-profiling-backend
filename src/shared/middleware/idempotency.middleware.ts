import { Request, Response, NextFunction } from 'express';
import { ConflictError } from '../errors';
import crypto from 'crypto';

/**
 * Idempotency cache entry
 * Stores the response for a given idempotency key
 */
interface IdempotencyCacheEntry {
  key: string;
  requestHash: string; // Hash of request body to detect parameter changes
  response: {
    statusCode: number;
    body: unknown;
  };
  timestamp: Date;
}

/**
 * In-memory idempotency cache
 * Maps idempotency keys to cached responses
 * 
 * Note: In production, this should be replaced with Redis or similar
 * distributed cache for multi-instance deployments
 */
const idempotencyCache = new Map<string, IdempotencyCacheEntry>();

/**
 * Idempotency middleware
 * 
 * Provides idempotency protection for submission and bulk operation endpoints
 * to prevent duplicate processing from network retries.
 * 
 * **Requirements: 32.1-32.8**
 * 
 * Features:
 * - Checks Idempotency-Key header
 * - Stores key with response for 24 hours
 * - Returns cached response for duplicate keys
 * - Returns 409 if key reused with different parameters
 * - Automatically cleans up expired keys (>24h)
 * 
 * Usage:
 * ```typescript
 * router.post('/api/v1/approvals', idempotencyMiddleware, submitChangeRequest);
 * router.post('/api/v1/approvals/bulk-approve', idempotencyMiddleware, bulkApprove);
 * ```
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract idempotency key from header
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    // If no idempotency key provided, skip middleware
    if (!idempotencyKey) {
      return next();
    }

    // Validate idempotency key format (must be non-empty string)
    if (typeof idempotencyKey !== 'string' || idempotencyKey.trim().length === 0) {
      return next();
    }

    // Clean up expired entries before processing (non-blocking)
    cleanupExpiredKeys();

    // Generate hash of request body to detect parameter changes
    const requestHash = generateRequestHash(req.body);

    // Check if idempotency key exists in cache
    const cachedEntry = idempotencyCache.get(idempotencyKey);

    if (cachedEntry) {
      // Requirement 32.7: Return 409 if key reused with different parameters
      if (cachedEntry.requestHash !== requestHash) {
        throw new ConflictError(
          'Idempotency key has been used with different request parameters'
        );
      }

      // Requirement 32.4: Return cached response for duplicate keys
      res.status(cachedEntry.response.statusCode).json(cachedEntry.response.body);
      return;
    }

    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function (body: unknown) {
      // Requirement 32.5: Store idempotency key with response for 24 hours
      const cacheEntry: IdempotencyCacheEntry = {
        key: idempotencyKey,
        requestHash,
        response: {
          statusCode: res.statusCode,
          body,
        },
        timestamp: new Date(),
      };

      idempotencyCache.set(idempotencyKey, cacheEntry);

      // Call original json method
      return originalJson(body);
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate hash of request body for parameter comparison
 * Uses SHA-256 to create consistent hash regardless of property order
 * 
 * @param body - Request body object
 * @returns SHA-256 hash of normalized request body
 */
function generateRequestHash(body: unknown): string {
  // Normalize body by sorting keys and stringifying
  const normalized = JSON.stringify(sortObjectKeys(body));
  
  // Generate SHA-256 hash
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Recursively sort object keys for consistent hashing
 * Ensures that { a: 1, b: 2 } and { b: 2, a: 1 } produce the same hash
 * 
 * @param obj - Object to sort
 * @returns Object with sorted keys
 */
function sortObjectKeys(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }

  if (typeof obj === 'object') {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      sorted[key] = sortObjectKeys((obj as Record<string, unknown>)[key]);
    }
    
    return sorted;
  }

  return obj;
}

/**
 * Clean up expired idempotency keys (older than 24 hours)
 * Requirement 32.8: Clean up expired keys
 * 
 * Runs synchronously but is fast enough for in-memory operations
 * In production with Redis, this would be handled by TTL
 */
function cleanupExpiredKeys(): void {
  const now = new Date();
  const expirationMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  for (const [key, entry] of idempotencyCache.entries()) {
    const age = now.getTime() - entry.timestamp.getTime();
    
    if (age > expirationMs) {
      idempotencyCache.delete(key);
    }
  }
}

/**
 * Get cache statistics (for monitoring/debugging)
 * 
 * @returns Cache statistics
 */
export function getIdempotencyCacheStats(): {
  size: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
} {
  let oldestEntry: Date | null = null;
  let newestEntry: Date | null = null;

  for (const entry of idempotencyCache.values()) {
    if (!oldestEntry || entry.timestamp < oldestEntry) {
      oldestEntry = entry.timestamp;
    }
    if (!newestEntry || entry.timestamp > newestEntry) {
      newestEntry = entry.timestamp;
    }
  }

  return {
    size: idempotencyCache.size,
    oldestEntry,
    newestEntry,
  };
}

/**
 * Clear all idempotency cache entries
 * Useful for testing
 */
export function clearIdempotencyCache(): void {
  idempotencyCache.clear();
}
