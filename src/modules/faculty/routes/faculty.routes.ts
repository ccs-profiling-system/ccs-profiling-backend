/**
 * Faculty Routes
 * Route definitions for faculty endpoints
 * 
 * Requirements: 3.1, 3.4, 3.5, 4.7, 4.8, 30.2
 */

import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createFacultyRoutes(facultyController: FacultyController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/faculty
   * List faculty with pagination, search, and filters
   */
  router.get('/', facultyController.listFaculty);

  /**
   * GET /api/v1/admin/faculty/:id
   * Get faculty by ID
   */
  router.get('/:id', facultyController.getFaculty);

  /**
   * POST /api/v1/admin/faculty
   * Create a new faculty
   */
  router.post('/', facultyController.createFaculty);

  /**
   * PUT /api/v1/admin/faculty/:id
   * Update faculty by ID
   */
  router.put('/:id', facultyController.updateFaculty);

  /**
   * DELETE /api/v1/admin/faculty/:id
   * Soft delete faculty by ID
   */
  router.delete('/:id', facultyController.deleteFaculty);

  return router;
}
