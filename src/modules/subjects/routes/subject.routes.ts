/**
 * Subject Routes
 * Route definitions for subject endpoints
 */

import { Router } from 'express';
import { SubjectController } from '../controllers/subject.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createSubjectRoutes(subjectController: SubjectController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/subjects/deleted
   * Get soft-deleted subjects (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: subjects.delete
   * Accessible by: Admin
   */
  router.get('/deleted', requirePermission('subjects.delete'), subjectController.getDeletedSubjects);

  /**
   * GET /api/v1/admin/subjects
   * List subjects with pagination, search, and filters
   * 
   * Permission: subjects.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('subjects.read'), subjectController.listSubjects);

  /**
   * GET /api/v1/admin/subjects/:id
   * Get subject by ID with syllabus and lessons
   * 
   * Permission: subjects.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('subjects.read'), subjectController.getSubject);

  /**
   * POST /api/v1/admin/subjects
   * Create a new subject
   * 
   * Permission: subjects.create
   * Accessible by: Admin, Department Chair
   */
  router.post('/', requirePermission('subjects.create'), subjectController.createSubject);

  /**
   * PUT /api/v1/admin/subjects/:id
   * Update subject by ID
   * 
   * Permission: subjects.update
   * Accessible by: Admin, Department Chair
   */
  router.put('/:id', requirePermission('subjects.update'), subjectController.updateSubject);

  /**
   * PATCH /api/v1/admin/subjects/:id/restore
   * Restore soft-deleted subject
   * 
   * Permission: subjects.delete
   * Accessible by: Admin
   */
  router.patch('/:id/restore', requirePermission('subjects.delete'), subjectController.restoreSubject);

  /**
   * DELETE /api/v1/admin/subjects/:id/permanent
   * Permanently delete subject (hard delete)
   * 
   * Permission: subjects.delete
   * Accessible by: Admin
   */
  router.delete('/:id/permanent', requirePermission('subjects.delete'), subjectController.permanentDeleteSubject);

  /**
   * DELETE /api/v1/admin/subjects/:id
   * Soft delete subject by ID
   * 
   * Permission: subjects.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('subjects.delete'), subjectController.deleteSubject);

  return router;
}
