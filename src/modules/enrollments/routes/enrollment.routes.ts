/**
 * Enrollment Routes
 * Route definitions for enrollment endpoints
 * 
 */

import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createEnrollmentRoutes(enrollmentController: EnrollmentController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/enrollments
   * List enrollments with pagination and filters
   * 
   * Permission: enrollment.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('enrollment.read'), enrollmentController.listEnrollments);

  /**
   * POST /api/v1/admin/enrollments
   * Create a new enrollment
   * 
   * Permission: enrollment.create
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.post('/', requirePermission('enrollment.create'), enrollmentController.createEnrollment);

  /**
   * PUT /api/v1/admin/enrollments/:id
   * Update enrollment by ID
   * 
   * Permission: enrollment.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.put('/:id', requirePermission('enrollment.update'), enrollmentController.updateEnrollment);

  /**
   * DELETE /api/v1/admin/enrollments/:id
   * Delete enrollment by ID
   * 
   * Permission: enrollment.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('enrollment.delete'), enrollmentController.deleteEnrollment);

  return router;
}

/**
 * Create student-specific enrollment routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentEnrollmentRoutes(enrollmentController: EnrollmentController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/students/:studentId/enrollments
   * Get enrollments by student ID
   * 
   * Permission: enrollment.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:studentId/enrollments', requirePermission('enrollment.read'), enrollmentController.getEnrollmentsByStudent);

  return router;
}

/**
 * Create instruction-specific enrollment routes
 * Mounted at /api/v1/admin/instructions
 */
export function createInstructionEnrollmentRoutes(enrollmentController: EnrollmentController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/instructions/:instructionId/enrollments
   * Get enrollments by instruction ID
   * 
   * Permission: enrollment.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:instructionId/enrollments', requirePermission('enrollment.read'), enrollmentController.getEnrollmentsByInstruction);

  return router;
}
