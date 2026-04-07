/**
 * Dashboard Routes
 * Route definitions for dashboard endpoints
 * 
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

  /**
   * GET /api/v1/admin/dashboard/recent-activity
   * Get recent activity
   */
  router.get('/recent-activity', dashboardController.getRecentActivity);

  /**
   * GET /api/v1/admin/dashboard/priority-alerts
   * Get priority alerts
   */
  router.get('/priority-alerts', dashboardController.getPriorityAlerts);

  /**
   * GET /api/v1/admin/dashboard/upcoming-events
   * Get upcoming events
   */
  router.get('/upcoming-events', dashboardController.getUpcomingEvents);

  return router;
}
