/**
 * Analytics Routes
 * Route definitions for analytics endpoints
 * 
 * Requirements: 16.7, 30.2
 */

import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createAnalyticsRoutes(analyticsController: AnalyticsController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/analytics/gpa
   * Get GPA distribution analytics
   */
  router.get('/gpa', analyticsController.getGPADistribution);

  /**
   * GET /api/v1/admin/analytics/skills
   * Get skill distribution analytics
   */
  router.get('/skills', analyticsController.getSkillDistribution);

  /**
   * GET /api/v1/admin/analytics/violations
   * Get violation trends analytics
   */
  router.get('/violations', analyticsController.getViolationTrends);

  /**
   * GET /api/v1/admin/analytics/research
   * Get research output metrics
   */
  router.get('/research', analyticsController.getResearchMetrics);

  /**
   * GET /api/v1/admin/analytics/enrollments
   * Get enrollment trends analytics
   */
  router.get('/enrollments', analyticsController.getEnrollmentTrends);

  return router;
}
