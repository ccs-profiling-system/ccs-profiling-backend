/**
 * Violation Routes
 * Route definitions for violation endpoints
 * 
 */

import { Router } from 'express';
import { ViolationController } from '../controllers/violation.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createViolationRoutes(violationController: ViolationController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/violations
   * List violation records with pagination and filters
   * 
   * Permission: violation.read
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.get('/', requirePermission('violation.read'), violationController.listViolations);

  /**
   * PUT /api/v1/admin/violations/:id
   * Update violation record by ID
   * 
   * Permission: violation.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.put('/:id', requirePermission('violation.update'), violationController.updateViolation);

  /**
   * DELETE /api/v1/admin/violations/:id
   * Delete violation record by ID
   * 
   * Permission: violation.manage
   * Accessible by: Admin, Department Chair
   */
  router.delete('/:id', requirePermission('violation.manage'), violationController.deleteViolation);

  /**
   * PATCH /api/v1/admin/violations/:id/resolve
   * Resolve a violation record
   * 
   * Permission: violation.review
   * Accessible by: Admin, Department Chair
   */
  router.patch('/:id/resolve', requirePermission('violation.review'), violationController.resolveViolation);

  return router;
}

/**
 * Create student-specific violation routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentViolationRoutes(violationController: ViolationController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/students/:studentId/violations
   * Get violation records by student ID
   * 
   * Permission: violation.read
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.get('/:studentId/violations', requirePermission('violation.read'), violationController.getViolationsByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/violations
   * Create a new violation record
   * 
   * Permission: violation.create
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.post('/:studentId/violations', requirePermission('violation.create'), violationController.createViolation);

  return router;
}
