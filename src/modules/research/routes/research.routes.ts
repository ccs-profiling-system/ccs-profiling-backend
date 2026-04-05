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
   * PUT /api/v1/admin/research/:id
   * Update research by ID
   */
  router.put('/:id', researchController.updateResearch);

  /**
   * DELETE /api/v1/admin/research/:id
   * Delete research by ID (soft delete)
   */
  router.delete('/:id', researchController.deleteResearch);

  /**
   * POST /api/v1/admin/research/:id/authors
   * Add author to research
   */
  router.post('/:id/authors', researchController.addAuthor);

  /**
   * DELETE /api/v1/admin/research/:id/authors/:studentId
   * Remove author from research
   */
  router.delete('/:id/authors/:studentId', researchController.removeAuthor);

  /**
   * POST /api/v1/admin/research/:id/advisers
   * Add adviser to research
   */
  router.post('/:id/advisers', researchController.addAdviser);

  /**
   * DELETE /api/v1/admin/research/:id/advisers/:facultyId
   * Remove adviser from research
   */
  router.delete('/:id/advisers/:facultyId', researchController.removeAdviser);

  return router;
}
