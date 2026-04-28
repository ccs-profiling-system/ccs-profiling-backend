/**
 * Affiliation Routes
 * Route definitions for affiliation endpoints
 * 
 */

import { Router } from 'express';
import { AffiliationController } from '../controllers/affiliation.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createAffiliationRoutes(affiliationController: AffiliationController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/affiliations
   * List affiliation records with pagination and filters
   * 
   * Permission: affiliation.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('affiliation.read'), affiliationController.listAffiliations);

  /**
   * GET /api/v1/admin/affiliations/:id
   * Get affiliation record by ID
   * 
   * Permission: affiliation.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:id', requirePermission('affiliation.read'), affiliationController.getAffiliation);

  /**
   * PUT /api/v1/admin/affiliations/:id
   * Update affiliation record by ID
   * 
   * Permission: affiliation.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.put('/:id', requirePermission('affiliation.update'), affiliationController.updateAffiliation);

  /**
   * DELETE /api/v1/admin/affiliations/:id
   * Delete affiliation record by ID
   * 
   * Permission: affiliation.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('affiliation.delete'), affiliationController.deleteAffiliation);

  /**
   * PATCH /api/v1/admin/affiliations/:id/end
   * End an affiliation record
   * 
   * Permission: affiliation.manage
   * Accessible by: Admin, Department Chair
   */
  router.patch('/:id/end', requirePermission('affiliation.manage'), affiliationController.endAffiliation);

  return router;
}

/**
 * Create student-specific affiliation routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentAffiliationRoutes(affiliationController: AffiliationController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/students/:studentId/affiliations
   * Get affiliation records by student ID
   * 
   * Permission: affiliation.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:studentId/affiliations', requirePermission('affiliation.read'), affiliationController.getAffiliationsByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/affiliations
   * Create a new affiliation record
   * 
   * Permission: affiliation.create
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.post('/:studentId/affiliations', requirePermission('affiliation.create'), affiliationController.createAffiliation);

  return router;
}
