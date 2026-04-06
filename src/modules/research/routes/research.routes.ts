/**
 * Research Routes
 * Route definitions for research endpoints
 * 
 * Requirements: 12.1, 12.6, 12.7, 30.2
 */

import { Router } from 'express';
import { ResearchController } from '../controllers/research.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createResearchRoutes(researchController: ResearchController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/research/deleted
   * Get soft-deleted research (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/deleted', researchController.getDeletedResearch);

  /**
   * GET /api/v1/admin/research
   * List research with pagination and filters
   */
  router.get('/', researchController.listResearch);

  /**
   * GET /api/v1/admin/research/:id
   * Get research by ID
   */
  router.get('/:id', researchController.getResearch);

  /**
   * POST /api/v1/admin/research
   * Create a new research
   */
  router.post('/', researchController.createResearch);

  /**
   * POST /api/v1/admin/research/:id/authors
   * Add author to research
   */
  router.post('/:id/authors', researchController.addAuthor);

  /**
   * POST /api/v1/admin/research/:id/advisers
   * Add adviser to research
   */
  router.post('/:id/advisers', researchController.addAdviser);

  /**
   * PUT /api/v1/admin/research/:id
   * Update research by ID
   */
  router.put('/:id', researchController.updateResearch);

  /**
   * PATCH /api/v1/admin/research/:id/restore
   * Restore soft-deleted research
   */
  router.patch('/:id/restore', researchController.restoreResearch);

  /**
   * DELETE /api/v1/admin/research/:id/permanent
   * Permanently delete research (hard delete)
   */
  router.delete('/:id/permanent', researchController.permanentDeleteResearch);

  /**
   * DELETE /api/v1/admin/research/:id/authors/:studentId
   * Remove author from research
   */
  router.delete('/:id/authors/:studentId', researchController.removeAuthor);

  /**
   * DELETE /api/v1/admin/research/:id/advisers/:facultyId
   * Remove adviser from research
   */
  router.delete('/:id/advisers/:facultyId', researchController.removeAdviser);

  /**
   * DELETE /api/v1/admin/research/:id
   * Delete research by ID (soft delete)
   */
  router.delete('/:id', researchController.deleteResearch);

  return router;
}
