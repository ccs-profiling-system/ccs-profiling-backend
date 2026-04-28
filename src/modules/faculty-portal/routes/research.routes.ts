/**
 * Faculty Portal - Research Routes
 * Route definitions for research project management endpoints
 * 
 * Provides endpoints for faculty members to create, update, and view research projects.
 * All routes require authentication and RBAC permission checks.
 * Faculty association with research projects is validated before allowing operations.
 * 
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
export function createResearchRoutes(researchController: ResearchController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/research
   * List research projects with pagination and filtering
   * 
   * Permission: faculty.research.read
   * 
   * Retrieves research projects where the authenticated faculty member is the
   * primary researcher or adviser. Supports pagination and filtering by status.
   * 
   * Query Parameters:
   * - page (optional): Page number (default: 1)
   * - limit (optional): Items per page (default: 10, max: 100)
   * - status (optional): Filter by research status
   * 
   * Response:
   * - 200: Paginated list of research projects with metadata
   * - 400: Bad Request (invalid query parameters)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "title": "Research Title",
   *       "description": "Research description",
   *       "research_type": "thesis",
   *       "status": "draft",
   *       "start_date": "2024-01-01",
   *       "end_date": "2024-12-31",
   *       "funding_source": null,
   *       "budget": null,
   *       "student_researchers": [...],
   *       "advisers": [...],
   *       "created_at": "2024-01-01T00:00:00.000Z",
   *       "updated_at": "2024-01-01T00:00:00.000Z"
   *     }
   *   ],
   *   "meta": {
   *     "total": 10,
   *     "page": 1,
   *     "limit": 10,
   *     "totalPages": 1
   *   }
   * }
   * 
   */
  router.get(
    '/research',
    requirePermission('faculty.research.read'),
    researchController.listResearch
  );

  /**
   * GET /api/faculty/research/:id
   * Get research project details by ID
   * 
   * Permission: faculty.research.read
   * 
   * Retrieves a single research project with full details including student
   * researchers and advisers. Validates that the authenticated faculty member
   * is associated with the research project.
   * 
   * Route Parameters:
   * - id (required): UUID of the research project
   * 
   * Response:
   * - 200: Research project details
   * - 400: Bad Request (invalid research ID format)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or faculty not associated with research)
   * - 404: Not Found (research project doesn't exist)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "title": "Research Title",
   *     "description": "Research description",
   *     "research_type": "thesis",
   *     "status": "draft",
   *     "start_date": "2024-01-01",
   *     "end_date": "2024-12-31",
   *     "funding_source": null,
   *     "budget": null,
   *     "student_researchers": [
   *       {
   *         "student_id": "uuid",
   *         "student_name": "John Doe"
   *       }
   *     ],
   *     "advisers": [
   *       {
   *         "faculty_id": "uuid",
   *         "faculty_name": "Dr. Jane Smith",
   *         "adviser_role": "adviser"
   *       }
   *     ],
   *     "created_at": "2024-01-01T00:00:00.000Z",
   *     "updated_at": "2024-01-01T00:00:00.000Z"
   *   }
   * }
   * 
   */
  router.get(
    '/research/:id',
    requirePermission('faculty.research.read'),
    researchController.getResearch
  );

  /**
   * POST /api/faculty/research
   * Create a new research project
   * 
   * Permission: faculty.research.create
   * 
   * Creates a new research project with the authenticated faculty member as the
   * primary adviser. Sets initial status to 'draft'. Validates start_date is not
   * in the past and end_date is after start_date if provided.
   * 
   * Request Body:
   * {
   *   "title": "Research Title",
   *   "description": "Research description",
   *   "research_type": "thesis",
   *   "start_date": "2024-01-01",
   *   "end_date": "2024-12-31",
   *   "funding_source": "Optional funding source",
   *   "budget": 10000,
   *   "student_researchers": ["uuid1", "uuid2"]
   * }
   * 
   * Response:
   * - 200: Created research project details
   * - 400: Bad Request (validation failed or dates are invalid)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "title": "Research Title",
   *     "description": "Research description",
   *     "research_type": "thesis",
   *     "status": "draft",
   *     "start_date": "2024-01-01",
   *     "end_date": "2024-12-31",
   *     "funding_source": null,
   *     "budget": null,
   *     "student_researchers": [...],
   *     "advisers": [...],
   *     "created_at": "2024-01-01T00:00:00.000Z",
   *     "updated_at": "2024-01-01T00:00:00.000Z"
   *   }
   * }
   * 
   */
  router.post(
    '/research',
    requirePermission('faculty.research.create'),
    researchController.createResearch
  );

  /**
   * PUT /api/faculty/research/:id
   * Update an existing research project
   * 
   * Permission: faculty.research.update
   * 
   * Updates research project fields with validation. Validates faculty association,
   * status transitions, and prevents updates to approved/rejected research.
   * 
   * Route Parameters:
   * - id (required): UUID of the research project
   * 
   * Request Body:
   * {
   *   "title": "Updated Title",
   *   "description": "Updated description",
   *   "status": "pending_approval",
   *   "end_date": "2024-12-31",
   *   "funding_source": "Updated funding source",
   *   "budget": 15000,
   *   "student_researchers": ["uuid1", "uuid2", "uuid3"]
   * }
   * 
   * Response:
   * - 200: Updated research project details
   * - 400: Bad Request (validation failed, invalid state transition, or attempting to update approved/rejected research)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or faculty not associated with research)
   * - 404: Not Found (research project doesn't exist)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": {
   *     "id": "uuid",
   *     "title": "Updated Title",
   *     "description": "Updated description",
   *     "research_type": "thesis",
   *     "status": "pending_approval",
   *     "start_date": "2024-01-01",
   *     "end_date": "2024-12-31",
   *     "funding_source": null,
   *     "budget": null,
   *     "student_researchers": [...],
   *     "advisers": [...],
   *     "created_at": "2024-01-01T00:00:00.000Z",
   *     "updated_at": "2024-01-15T00:00:00.000Z"
   *   }
   * }
   * 
   */
  router.put(
    '/research/:id',
    requirePermission('faculty.research.update'),
    researchController.updateResearch
  );

  return router;
}
