/**
 * Secretary Portal - Dashboard Routes
 * Route definitions for secretary dashboard endpoints
 * 
 * Provides endpoints for secretaries to view dashboard statistics and recent activities.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 2.1, 2.2, 2.7
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create dashboard routes
 * 
 * @returns Express router with dashboard routes
 */
export function createDashboardRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/dashboard
   * Get dashboard statistics and recent activities
   * 
   * Permission: secretary.dashboard.read
   * 
   * Returns:
   * - Total counts for students, faculty, events, research projects
   * - Count of pending changes awaiting approval
   * - 10 most recent activities ordered by timestamp descending
   * 
   * Response:
   * - 200: Dashboard data retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission)
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
   */
  router.get(
    '/',
    requirePermission('secretary.dashboard.read'),
    // TODO: Implement controller
    (_req, res) => res.status(501).json({ message: 'Not implemented' })
  );

  return router;
}
