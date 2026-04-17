/**
 * Research Routes for Department Chair Portal
 * 
 * Defines HTTP routes for research project management operations with RBAC protection.
 * All routes require JWT authentication and specific chair.research.* permissions.
 * 
 * Routes:
 * - GET /api/chair/research - List research projects with pagination and filtering
 * - GET /api/chair/research/:id - Get research project details
 * - POST /api/chair/research/:id/approve - Approve a research project
 * - POST /api/chair/research/:id/reject - Reject a research project
 * 
 * Requirements: 7.1, 7.4, 7.7, 7.11, 14.1
 */

import { Router } from 'express';
import { ResearchController } from '../controllers/research.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create research routes with dependency injection
 * 
 * @param researchController - Research controller instance
 * @returns Express router with configured routes
 */
export function createResearchRoutes(researchController: ResearchController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/chair/research
   * 
   * List research projects with pagination and filtering
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - status: Filter by research status (optional)
   * - faculty_id: Filter by faculty advisor ID (optional)
   * - search: Search by title or description (optional)
   * 
   * Permissions: chair.research.read
   * 
   * Responses:
   * - 200: Success with paginated research list
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.research.read permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.research.read'), researchController.listResearch);

  /**
   * GET /api/chair/research/:id
   * 
   * Get research project details by ID
   * 
   * Path Parameters:
   * - id: Research project ID
   * 
   * Permissions: chair.research.read
   * 
   * Responses:
   * - 200: Success with research project details
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.research.read permission)
   * - 404: Not Found (research not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('chair.research.read'), researchController.getResearch);

  /**
   * POST /api/chair/research/:id/approve
   * 
   * Approve a research project
   * 
   * Path Parameters:
   * - id: Research project ID
   * 
   * Request Body:
   * - approver_notes: Optional notes from the approver
   * 
   * Permissions: chair.research.approve
   * 
   * Responses:
   * - 200: Success with updated research details
   * - 400: Bad Request (invalid state for approval or validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.research.approve permission)
   * - 404: Not Found (research not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.post('/:id/approve', requirePermission('chair.research.approve'), researchController.approveResearch);

  /**
   * POST /api/chair/research/:id/reject
   * 
   * Reject a research project
   * 
   * Path Parameters:
   * - id: Research project ID
   * 
   * Request Body:
   * - rejection_reason: Required reason for rejection (10-1000 characters)
   * 
   * Permissions: chair.research.reject
   * 
   * Responses:
   * - 200: Success with updated research details
   * - 400: Bad Request (invalid state for rejection or validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.research.reject permission)
   * - 404: Not Found (research not found or outside department scope)
   * - 422: Unprocessable Entity (missing or invalid rejection_reason)
   * - 500: Internal Server Error
   */
  router.post('/:id/reject', requirePermission('chair.research.reject'), researchController.rejectResearch);

  return router;
}
