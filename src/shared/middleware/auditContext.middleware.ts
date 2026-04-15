/**
 * Audit Context Middleware
 * Attaches audit context (IP, user agent, user ID) to request
 * 
 */

import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include audit context
declare global {
  namespace Express {
    interface Request {
      auditContext?: {
        user_id?: string;
        ip_address?: string;
        user_agent?: string;
      };
    }
  }
}

/**
 * Middleware to attach audit context to request
 * Should be used after auth middleware to capture user_id
 */
export const auditContextMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Extract IP address (handle proxy scenarios)
  const ip_address =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    undefined;

  // Extract user agent
  const user_agent = req.headers['user-agent'] || undefined;

  // Extract user ID from authenticated user (set by auth middleware)
  // Skip user_id if it's the dev bypass user to avoid FK constraint errors
  const rawUserId = (req as any).user?.userId;
  const user_id = (rawUserId === '00000000-0000-0000-0000-000000000000' || rawUserId === 'dev-user-id') 
    ? undefined 
    : rawUserId;

  // Attach audit context to request
  req.auditContext = {
    user_id,
    ip_address,
    user_agent,
  };

  next();
};
