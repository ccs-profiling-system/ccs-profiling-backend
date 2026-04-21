/**
 * Student Portal - Research Routes
 * Route definitions for research opportunity endpoints
 * 
 * Provides endpoints for students to browse research opportunities,
 * apply to opportunities, and check application status.
 * All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 13.6, 14.4, 15.8, 16.4, 27.1, 27.2, 27.3, 27.4, 27.5
 */

import { Router } from 'express';
import { ResearchController } from '../controllers/research.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create research routes
 * 
 * @param researchController - Research controller instance
 * @returns Express router with research routes
 */
export function createResearchRoutes(
  researchController: ResearchController
): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/research/opportunities
   * List available research opportunities
   * 
   * Permission: student.research.read
   * 
   * Returns paginated list of active research opportunities.
   * Supports pagination with page and limit query parameters.
   * 
   * Query Parameters:
   * - page: number (default 1)
   * - limit: number (default 10, max 50)
   * 
   * Response:
   * - 200: Opportunities retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   * Requirements: 13.1, 13.6, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/opportunities',
    requirePermission('student.research.read'),
    researchController.listOpportunities
  );

  /**
   * GET /api/student/research/opportunities/:id
   * Get detailed information about a research opportunity
   * 
   * Permission: student.research.read
   * 
   * Returns comprehensive information about a specific research opportunity.
   * 
   * Route Parameters:
   * - id: Research opportunity UUID
   * 
   * Response:
   * - 200: Opportunity details retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * - 404: Not Found (opportunity not found or not available)
   * 
   * Requirements: 14.1, 14.4, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/opportunities/:id',
    requirePermission('student.research.read'),
    researchController.getOpportunityDetails
  );

  /**
   * REMOVED: POST /api/student/research/opportunities/:id/apply
   * 
   * Reason: Students are viewers in the profiling system.
   * Research applications are managed through Faculty → Secretary → Chair → Admin workflow.
   * Students can view opportunities and check application status, but cannot self-apply.
   */

  /**
   * GET /api/student/research/applications/:applicationId
   * Get application status
   * 
   * Permission: student.research.read
   * 
   * Returns details about a specific research application.
   * Validates that the application belongs to the authenticated student.
   * 
   * Route Parameters:
   * - applicationId: Application UUID
   * 
   * Response:
   * - 200: Application status retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission, not a student, or application doesn't belong to student)
   * - 404: Not Found (application not found)
   * 
   * Requirements: 16.1, 16.4, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/applications/:applicationId',
    requirePermission('student.research.read'),
    researchController.getApplicationStatus
  );

  return router;
}
