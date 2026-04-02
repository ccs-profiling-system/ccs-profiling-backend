/**
 * Violation Routes
 * Route definitions for violation endpoints
 * 
 * Requirements: 6.1, 6.3, 6.4, 30.2
 */

import { Router } from 'express';
import { ViolationController } from '../controllers/violation.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createViolationRoutes(violationController: ViolationController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/violations
   * List violation records with pagination and filters
   */
  router.get('/', violationController.listViolations);

  /**
   * PUT /api/v1/admin/violations/:id
   * Update violation record by ID
   */
  router.put('/:id', violationController.updateViolation);

  /**
   * DELETE /api/v1/admin/violations/:id
   * Delete violation record by ID
   */
  router.delete('/:id', violationController.deleteViolation);

  /**
   * PATCH /api/v1/admin/violations/:id/resolve
   * Resolve a violation record
   */
  router.patch('/:id/resolve', violationController.resolveViolation);

  return router;
}

/**
 * Create student-specific violation routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentViolationRoutes(violationController: ViolationController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/students/:studentId/violations
   * Get violation records by student ID
   */
  router.get('/:studentId/violations', violationController.getViolationsByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/violations
   * Create a new violation record
   */
  router.post('/:studentId/violations', violationController.createViolation);

  return router;
}
