import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';

/**
 * Role-based access control middleware
 * Verifies that the authenticated user has one of the required roles
 */
export const roleMiddleware = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      // Check if user has required role
      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin-only middleware
 * Shorthand for roleMiddleware(['admin'])
 */
export const adminOnly = roleMiddleware(['admin']);
