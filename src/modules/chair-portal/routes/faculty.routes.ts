/**
 * Faculty Routes
 * 
 * Defines routes for faculty management operations in the department chair portal.
 * All routes require JWT authentication and appropriate chair.faculty.* permissions.
 * 
 */

import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create faculty routes
 * 
 * @param facultyController - Faculty controller instance
 * @returns Express router with faculty routes
 */
export function createFacultyRoutes(facultyController: FacultyController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/chair/faculty
   * 
   * List faculty members with pagination and filtering.
   * 
   * Permissions: chair.faculty.read
   * 
   * Query parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - status: Filter by status (active, inactive)
   * - search: Search by name or email
   * 
   * Response:
   * - 200: Paginated faculty list
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.faculty.read permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.faculty.read'), facultyController.listFaculty);

  /**
   * GET /api/chair/faculty/:id
   * 
   * Get individual faculty member details.
   * 
   * Permissions: chair.faculty.read
   * 
   * Response:
   * - 200: Faculty details
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.faculty.read permission)
   * - 404: Not Found (faculty not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('chair.faculty.read'), facultyController.getFaculty);

  /**
   * GET /api/chair/faculty/:id/teaching-load
   * 
   * Get faculty teaching load with current semester schedules.
   * 
   * Permissions: chair.faculty.monitor
   * 
   * Response:
   * - 200: Teaching load data with current semester schedules
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.faculty.monitor permission)
   * - 404: Not Found (faculty not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.get('/:id/teaching-load', requirePermission('chair.faculty.monitor'), facultyController.getTeachingLoad);

  /**
   * GET /api/chair/faculty/:id/stats
   * 
   * Get faculty statistics including students taught, courses, and research count.
   * 
   * Permissions: chair.faculty.monitor
   * 
   * Response:
   * - 200: Faculty statistics
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.faculty.monitor permission)
   * - 404: Not Found (faculty not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.get('/:id/stats', requirePermission('chair.faculty.monitor'), facultyController.getFacultyStats);

  return router;
}
