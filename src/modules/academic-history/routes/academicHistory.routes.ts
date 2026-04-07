/**
 * Academic History Routes
 * Route definitions for academic history endpoints
 * 
 */

import { Router } from 'express';
import { AcademicHistoryController } from '../controllers/academicHistory.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createAcademicHistoryRoutes(academicHistoryController: AcademicHistoryController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/academic-history
   * List academic history records with pagination and filters
   */
  router.get('/', academicHistoryController.listAcademicHistory);

  /**
   * PUT /api/v1/admin/academic-history/:id
   * Update academic history record by ID
   */
  router.put('/:id', academicHistoryController.updateAcademicHistory);

  /**
   * DELETE /api/v1/admin/academic-history/:id
   * Delete academic history record by ID
   */
  router.delete('/:id', academicHistoryController.deleteAcademicHistory);

  return router;
}

/**
 * Create student-specific academic history routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentAcademicHistoryRoutes(academicHistoryController: AcademicHistoryController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/students/:studentId/academic-history
   * Get academic history records by student ID
   */
  router.get('/:studentId/academic-history', academicHistoryController.getAcademicHistoryByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/academic-history
   * Create a new academic history record
   */
  router.post('/:studentId/academic-history', academicHistoryController.createAcademicHistory);

  /**
   * GET /api/v1/admin/students/:studentId/gpa
   * Calculate GPA for a student
   */
  router.get('/:studentId/gpa', academicHistoryController.calculateGPA);

  return router;
}
