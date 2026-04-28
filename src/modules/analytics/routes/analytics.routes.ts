/**
 * Analytics Routes
 * Route definitions for analytics endpoints
 * 
 */

import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createAnalyticsRoutes(analyticsController: AnalyticsController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/analytics/gpa
   * Get GPA distribution analytics
   * 
   * Permission: analytics.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/gpa', requirePermission('analytics.read'), analyticsController.getGPADistribution);

  /**
   * GET /api/v1/admin/analytics/skills
   * Get skill distribution analytics
   * 
   * Permission: analytics.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/skills', requirePermission('analytics.read'), analyticsController.getSkillDistribution);

  /**
   * GET /api/v1/admin/analytics/violations
   * Get violation trends analytics
   * 
   * Permission: analytics.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/violations', requirePermission('analytics.read'), analyticsController.getViolationTrends);

  /**
   * GET /api/v1/admin/analytics/research
   * Get research output metrics
   * 
   * Permission: analytics.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/research', requirePermission('analytics.read'), analyticsController.getResearchMetrics);

  /**
   * GET /api/v1/admin/analytics/enrollments
   * Get enrollment trends analytics
   * 
   * Permission: analytics.read
   * Accessible by: Admin, Department Chair
   */
  router.get('/enrollments', requirePermission('analytics.read'), analyticsController.getEnrollmentTrends);

  return router;
}
