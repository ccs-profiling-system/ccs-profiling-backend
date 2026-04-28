/**
 * Student Portal - Dashboard Routes
 * Route definitions for student dashboard endpoints
 * 
 * Provides endpoint for students to view their dashboard summary.
 * All routes require authentication and RBAC permission checks.
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

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/dashboard
   * Get dashboard summary for authenticated student
   * 
   * Permission: student.dashboard.read
   * 
   * Extracts student_id from JWT token and returns aggregated dashboard data:
   * - Current semester courses
   * - Current GPA
   * - Unread notification count
   * - Upcoming registered events (next 30 days, max 5)
   * 
   * Response:
   * - 200: Dashboard summary retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 500: Internal Server Error
   * 
   */
  router.get(
    '/',
    requirePermission('student.dashboard.read'),
    dashboardController.getDashboard
  );

  return router;
}
