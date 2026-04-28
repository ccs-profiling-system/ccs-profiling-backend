/**
 * Research Routes
 * Route definitions for research endpoints
 * 
 */

import { Router } from 'express';
import { ResearchController } from '../controllers/research.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createResearchRoutes(researchController: ResearchController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/research/deleted
   * Get soft-deleted research (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * 
   * Permission: research.delete
   * Accessible by: Admin
   */
  router.get('/deleted', requirePermission('research.delete'), researchController.getDeletedResearch);

  /**
   * GET /api/v1/admin/research
   * List research with pagination and filters
   * 
   * Permission: research.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('research.read'), researchController.listResearch);

  /**
   * GET /api/v1/admin/research/:id
   * Get research by ID
   * 
   * Permission: research.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('research.read'), researchController.getResearch);

  /**
   * POST /api/v1/admin/research
   * Create a new research
   * 
   * Permission: research.create
   * Accessible by: Admin, Department Chair, Faculty
   */
  router.post('/', requirePermission('research.create'), researchController.createResearch);

  /**
   * POST /api/v1/admin/research/:id/authors
   * Add author to research
   * 
   * Permission: research.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.post('/:id/authors', requirePermission('research.update'), researchController.addAuthor);

  /**
   * POST /api/v1/admin/research/:id/advisers
   * Add adviser to research
   * 
   * Permission: research.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.post('/:id/advisers', requirePermission('research.update'), researchController.addAdviser);

  /**
   * PUT /api/v1/admin/research/:id
   * Update research by ID
   * 
   * Permission: research.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.put('/:id', requirePermission('research.update'), researchController.updateResearch);

  /**
   * PATCH /api/v1/admin/research/:id/restore
   * Restore soft-deleted research
   * 
   * Permission: research.delete
   * Accessible by: Admin
   */
  router.patch('/:id/restore', requirePermission('research.delete'), researchController.restoreResearch);

  /**
   * DELETE /api/v1/admin/research/:id/permanent
   * Permanently delete research (hard delete)
   * 
   * Permission: research.delete
   * Accessible by: Admin
   */
  router.delete('/:id/permanent', requirePermission('research.delete'), researchController.permanentDeleteResearch);

  /**
   * DELETE /api/v1/admin/research/:id/authors/:studentId
   * Remove author from research
   * 
   * Permission: research.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.delete('/:id/authors/:studentId', requirePermission('research.update'), researchController.removeAuthor);

  /**
   * DELETE /api/v1/admin/research/:id/advisers/:facultyId
   * Remove adviser from research
   * 
   * Permission: research.update
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.delete('/:id/advisers/:facultyId', requirePermission('research.update'), researchController.removeAdviser);

  /**
   * DELETE /api/v1/admin/research/:id
   * Delete research by ID (soft delete)
   * 
   * Permission: research.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('research.delete'), researchController.deleteResearch);

  return router;
}
