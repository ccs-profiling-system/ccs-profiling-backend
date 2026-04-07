/**
 * Affiliation Routes
 * Route definitions for affiliation endpoints
 * 
 */

import { Router } from 'express';
import { AffiliationController } from '../controllers/affiliation.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createAffiliationRoutes(affiliationController: AffiliationController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/affiliations
   * List affiliation records with pagination and filters
   */
  router.get('/', affiliationController.listAffiliations);

  /**
   * GET /api/v1/admin/affiliations/:id
   * Get affiliation record by ID
   */
  router.get('/:id', affiliationController.getAffiliation);

  /**
   * PUT /api/v1/admin/affiliations/:id
   * Update affiliation record by ID
   */
  router.put('/:id', affiliationController.updateAffiliation);

  /**
   * DELETE /api/v1/admin/affiliations/:id
   * Delete affiliation record by ID
   */
  router.delete('/:id', affiliationController.deleteAffiliation);

  /**
   * PATCH /api/v1/admin/affiliations/:id/end
   * End an affiliation record
   */
  router.patch('/:id/end', affiliationController.endAffiliation);

  return router;
}

/**
 * Create student-specific affiliation routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentAffiliationRoutes(affiliationController: AffiliationController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/students/:studentId/affiliations
   * Get affiliation records by student ID
   */
  router.get('/:studentId/affiliations', affiliationController.getAffiliationsByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/affiliations
   * Create a new affiliation record
   */
  router.post('/:studentId/affiliations', affiliationController.createAffiliation);

  return router;
}
