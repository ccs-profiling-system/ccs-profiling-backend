/**
 * API Version Middleware
 * Adds X-API-Version header to all responses
 * 
 * Requirements: 30.5, 30.6
 */

import { Request, Response, NextFunction } from 'express';

// API version from package.json
const API_VERSION = '1.0.0';

/**
 * Middleware to add X-API-Version header to all responses
 * Should be registered early in the middleware chain
 */
export const apiVersionMiddleware = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader('X-API-Version', API_VERSION);
  next();
};
