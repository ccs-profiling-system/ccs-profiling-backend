/**
 * Dashboard Routes
 * 
 * Defines routes for secretary portal dashboard operations.
 * All routes require authentication and secretary.dashboard.read permission.
 * 
 * Requirements: 2.1, 2.2
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { getDashboard } from '../controllers/dashboard.controller';

/**
 * Create dashboard router
 * 
 * Endpoints:
 * - GET /api/secretary/dashboard - Get dashboard statistics and recent activities
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - secretary.dashboard.read permission
 */
export function createDashboardRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/dashboard
   * 
   * Retrieve dashboard statistics and recent activities.
   * 
   * Response:
   * {
   *   success: true,
   *   data: {
   *     stats: {
   *       total_students: number,
   *       total_faculty: number,
   *       total_events: number,
   *       total_research: number,
   *       pending_changes: number
   *     },
   *     recent_activities: [
   *       {
   *         activity_type: string,
   *         entity_type: string,
   *         entity_id: string,
   *         timestamp: Date,
   *         user_id: string | null
   *       }
   *     ]
   *   }
   * }
   * 
   * Requirements: 2.1, 2.2
   */
  router.get(
    '/',
    requirePermission('secretary.dashboard.read'),
    getDashboard
  );

  return router;
}

// Default export for backward compatibility
export default createDashboardRoutes();

