/**
 * Secretary Portal Routes
 * 
 * Aggregates all secretary portal routes under the /api/secretary prefix.
 * All routes require JWT authentication and secretary.* permissions.
 * 
 * Authentication Flow:
 * 1. authMiddleware validates JWT token and extracts user context (user_id, role)
 * 2. Returns HTTP 401 Unauthorized if authentication fails
 * 3. Attaches user info to req.user for downstream middleware
 * 
 * Requirements: 1.1, 1.4, 18.2, 19.2
 */

import { Router } from 'express';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';

/**
 * Secretary Portal Router
 * 
 * All routes under this router are protected by JWT authentication.
 * The authMiddleware is applied globally to all secretary portal routes.
 * 
 * Authentication Requirements:
 * - Valid JWT token in Authorization header (Bearer <token>)
 * - Token must not be expired
 * - Token signature must be valid
 * 
 * On Success:
 * - req.user is populated with { userId, email, role }
 * - Request proceeds to next middleware/handler
 * 
 * On Failure:
 * - HTTP 401 Unauthorized is returned
 * - Error message indicates authentication failure reason
 */
export const secretaryPortalRouter = Router();

// Apply authentication middleware to all secretary portal routes
// This validates JWT tokens for all API requests
// Requirements: 1.1, 1.4, 18.2
secretaryPortalRouter.use(authMiddleware);

// TODO: Register module routes here as they are implemented
// Example:
// secretaryPortalRouter.use('/dashboard', dashboardRoutes);
// secretaryPortalRouter.use('/students', studentRoutes);
// secretaryPortalRouter.use('/faculty', facultyRoutes);
// etc.
