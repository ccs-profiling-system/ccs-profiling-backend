/**
 * Enrollment Routes
 * Route definitions for enrollment endpoints
 * 
 * Requirements: 9.1, 9.3, 9.4, 30.2
 */

import { Router } from 'express';
import { EnrollmentController } from '../controllers/enrollment.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createEnrollmentRoutes(enrollmentController: EnrollmentController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/enrollments
   * List enrollments with pagination and filters
   */
  router.get('/', enrollmentController.listEnrollments);

  /**
   * POST /api/v1/admin/enrollments
   * Create a new enrollment
   */
  router.post('/', enrollmentController.createEnrollment);

  /**
   * PUT /api/v1/admin/enrollments/:id
   * Update enrollment by ID
   */
  router.put('/:id', enrollmentController.updateEnrollment);

  /**
   * DELETE /api/v1/admin/enrollments/:id
   * Delete enrollment by ID
   */
  router.delete('/:id', enrollmentController.deleteEnrollment);

  return router;
}

/**
 * Create student-specific enrollment routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentEnrollmentRoutes(enrollmentController: EnrollmentController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/students/:studentId/enrollments
   * Get enrollments by student ID
   */
  router.get('/:studentId/enrollments', enrollmentController.getEnrollmentsByStudent);

  return router;
}

/**
 * Create instruction-specific enrollment routes
 * Mounted at /api/v1/admin/instructions
 */
export function createInstructionEnrollmentRoutes(enrollmentController: EnrollmentController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/instructions/:instructionId/enrollments
   * Get enrollments by instruction ID
   */
  router.get('/:instructionId/enrollments', enrollmentController.getEnrollmentsByInstruction);

  return router;
}
