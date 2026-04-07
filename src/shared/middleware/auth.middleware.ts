import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors';
import { config } from '../../config';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Development bypass - check for dev-bypass-token
    const authHeader = req.headers.authorization;
    
    if (authHeader === 'Bearer dev-bypass-token' && config.nodeEnv === 'development') {
      // Bypass authentication in development mode
      req.user = {
        userId: 'dev-user-id',
        email: 'dev@example.com',
        role: 'admin',
      };
      return next();
    }

    // Extract token from Authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      role: string;
    };

    // Attach user to request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};
