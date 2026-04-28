/**
 * Curriculum Routes
 * Route definitions for curriculum endpoints
 */

import { Router } from 'express';
import { CurriculumController } from '../controllers/curriculum.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createCurriculumRoutes(curriculumController: CurriculumController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/curriculum/deleted
   * Get soft-deleted curriculum (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: curriculum.delete
   * Accessible by: Admin
   */
  router.get('/deleted', requirePermission('curriculum.delete'), curriculumController.getDeletedCurriculum);

  /**
   * GET /api/v1/admin/curriculum
   * List curriculum with pagination, search, and filters
   * 
   * Permission: curriculum.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('curriculum.read'), curriculumController.listCurriculum);

  /**
   * GET /api/v1/admin/curriculum/:id
   * Get curriculum by ID
   * 
   * Permission: curriculum.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('curriculum.read'), curriculumController.getCurriculum);

  /**
   * POST /api/v1/admin/curriculum
   * Create a new curriculum
   * 
   * Permission: curriculum.create
   * Accessible by: Admin, Department Chair
   */
  router.post('/', requirePermission('curriculum.create'), curriculumController.createCurriculum);

  /**
   * PUT /api/v1/admin/curriculum/:id
   * Update curriculum by ID
   * 
   * Permission: curriculum.update
   * Accessible by: Admin, Department Chair
   */
  router.put('/:id', requirePermission('curriculum.update'), curriculumController.updateCurriculum);

  /**
   * PATCH /api/v1/admin/curriculum/:id/restore
   * Restore soft-deleted curriculum
   * 
   * Permission: curriculum.delete
   * Accessible by: Admin
   */
  router.patch('/:id/restore', requirePermission('curriculum.delete'), curriculumController.restoreCurriculum);

  /**
   * DELETE /api/v1/admin/curriculum/:id/permanent
   * Permanently delete curriculum (hard delete)
   * 
   * Permission: curriculum.delete
   * Accessible by: Admin
   */
  router.delete('/:id/permanent', requirePermission('curriculum.delete'), curriculumController.permanentDeleteCurriculum);

  /**
   * DELETE /api/v1/admin/curriculum/:id
   * Soft delete curriculum by ID
   * 
   * Permission: curriculum.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('curriculum.delete'), curriculumController.deleteCurriculum);

  return router;
}
