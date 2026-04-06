/**
 * Dashboard Routes
 * Route definitions for dashboard endpoints
 * 
 * Requirements: 15.7, 30.2
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createDashboardRoutes(dashboardController: DashboardController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/dashboard
   * Get complete dashboard metrics
   */
  router.get('/', dashboardController.getDashboardMetrics);

  /**
   * GET /api/v1/admin/dashboard/students
   * Get student statistics
   */
  router.get('/students', dashboardController.getStudentStats);

  /**
   * GET /api/v1/admin/dashboard/faculty
   * Get faculty statistics
   */
  router.get('/faculty', dashboardController.getFacultyStats);

  /**
   * GET /api/v1/admin/dashboard/enrollments
   * Get enrollment statistics
   */
  router.get('/enrollments', dashboardController.getEnrollmentStats);

  /**
   * GET /api/v1/admin/dashboard/events
   * Get event statistics
   */
  router.get('/events', dashboardController.getEventStats);

  return router;
}
