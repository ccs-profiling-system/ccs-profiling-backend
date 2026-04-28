/**
 * Faculty Routes
 * Route definitions for faculty endpoints
 * 
 */

import { Router } from 'express';
import { FacultyController } from '../controllers/faculty.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createFacultyRoutes(facultyController: FacultyController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/faculty/deleted
   * Get soft-deleted faculty (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: faculty.delete
   * Accessible by: Admin
   */
  router.get('/deleted', requirePermission('faculty.delete'), facultyController.getDeletedFaculty);

  /**
   * GET /api/v1/admin/faculty/stats
   * Get faculty statistics
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: faculty.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/stats', requirePermission('faculty.read'), facultyController.getFacultyStats);

  /**
   * GET /api/v1/admin/faculty
   * List faculty with pagination, search, and filters
   * 
   * Permission: faculty.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('faculty.read'), facultyController.listFaculty);

  /**
   * GET /api/v1/admin/faculty/:id
   * Get faculty by ID
   * 
   * Permission: faculty.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('faculty.read'), facultyController.getFaculty);

  /**
   * POST /api/v1/admin/faculty
   * Create a new faculty
   * 
   * Permission: faculty.create
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.post('/', requirePermission('faculty.create'), facultyController.createFaculty);

  /**
   * PUT /api/v1/admin/faculty/:id
   * Update faculty by ID
   * 
   * Permission: faculty.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.put('/:id', requirePermission('faculty.update'), facultyController.updateFaculty);

  /**
   * PATCH /api/v1/admin/faculty/:id/restore
   * Restore soft-deleted faculty
   * 
   * Permission: faculty.delete
   * Accessible by: Admin
   */
  router.patch('/:id/restore', requirePermission('faculty.delete'), facultyController.restoreFaculty);

  /**
   * DELETE /api/v1/admin/faculty/:id/permanent
   * Permanently delete faculty (hard delete)
   * 
   * Permission: faculty.delete
   * Accessible by: Admin
   */
  router.delete('/:id/permanent', requirePermission('faculty.delete'), facultyController.permanentDeleteFaculty);

  /**
   * DELETE /api/v1/admin/faculty/:id
   * Soft delete faculty by ID
   * 
   * Permission: faculty.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('faculty.delete'), facultyController.deleteFaculty);

  return router;
}
