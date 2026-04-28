/**
 * Dashboard Routes
 * Route definitions for dashboard endpoints
 * 
 */

import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createDashboardRoutes(dashboardController: DashboardController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/dashboard
   * Get complete dashboard metrics
   * 
   * Permission: dashboard.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('dashboard.read'), dashboardController.getDashboardMetrics);

  /**
   * GET /api/v1/admin/dashboard/students
   * Get student statistics
   * 
   * Permission: dashboard.read
   */
  router.get('/students', requirePermission('dashboard.read'), dashboardController.getStudentStats);

  /**
   * GET /api/v1/admin/dashboard/faculty
   * Get faculty statistics
   * 
   * Permission: dashboard.read
   */
  router.get('/faculty', requirePermission('dashboard.read'), dashboardController.getFacultyStats);

  /**
   * GET /api/v1/admin/dashboard/enrollments
   * Get enrollment statistics
   * 
   * Permission: dashboard.read
   */
  router.get('/enrollments', requirePermission('dashboard.read'), dashboardController.getEnrollmentStats);

  /**
   * GET /api/v1/admin/dashboard/events
   * Get event statistics
   * 
   * Permission: dashboard.read
   */
  router.get('/events', requirePermission('dashboard.read'), dashboardController.getEventStats);

  /**
   * GET /api/v1/admin/dashboard/recent-activity
   * Get recent activity
   * 
   * Permission: dashboard.read
   */
  router.get('/recent-activity', requirePermission('dashboard.read'), dashboardController.getRecentActivity);

  /**
   * GET /api/v1/admin/dashboard/priority-alerts
   * Get priority alerts
   * 
   * Permission: dashboard.read
   */
  router.get('/priority-alerts', requirePermission('dashboard.read'), dashboardController.getPriorityAlerts);

  /**
   * GET /api/v1/admin/dashboard/upcoming-events
   * Get upcoming events
   * 
   * Permission: dashboard.read
   */
  router.get('/upcoming-events', requirePermission('dashboard.read'), dashboardController.getUpcomingEvents);

  return router;
}
