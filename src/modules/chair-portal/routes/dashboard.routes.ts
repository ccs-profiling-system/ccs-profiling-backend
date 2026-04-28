/**
 * Dashboard Routes
 * 
 * Defines routes for department chair dashboard operations.
 * All routes require JWT authentication and chair.dashboard.read permission.
 * 
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create dashboard routes
 * 
 * @param dashboardController - Dashboard controller instance
 * @returns Express router with dashboard routes
 */
export function createDashboardRoutes(dashboardController: DashboardController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/chair/dashboard
   * 
   * Get aggregated dashboard statistics for the authenticated department chair.
   * 
   * Permissions: chair.dashboard.read
   * 
   * Response:
   * - 200: Dashboard statistics
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.dashboard.read permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.dashboard.read'), dashboardController.getDashboard);

  return router;
}
