/**
 * Academic History Routes
 * Route definitions for academic history endpoints
 * 
 */

import { Router } from 'express';
import { AcademicHistoryController } from '../controllers/academicHistory.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

export function createAcademicHistoryRoutes(academicHistoryController: AcademicHistoryController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/academic-history
   * List academic history records with pagination and filters
   * 
   * Permission: academic_history.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/', requirePermission('academic_history.read'), academicHistoryController.listAcademicHistory);

  /**
   * PUT /api/v1/admin/academic-history/:id
   * Update academic history record by ID
   * 
   * Permission: academic_history.update
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.put('/:id', requirePermission('academic_history.update'), academicHistoryController.updateAcademicHistory);

  /**
   * DELETE /api/v1/admin/academic-history/:id
   * Delete academic history record by ID
   * 
   * Permission: academic_history.delete
   * Accessible by: Admin
   */
  router.delete('/:id', requirePermission('academic_history.delete'), academicHistoryController.deleteAcademicHistory);

  return router;
}

/**
 * Create student-specific academic history routes
 * Mounted at /api/v1/admin/students
 */
export function createStudentAcademicHistoryRoutes(academicHistoryController: AcademicHistoryController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/v1/admin/students/:studentId/academic-history
   * Get academic history records by student ID
   * 
   * Permission: academic_history.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:studentId/academic-history', requirePermission('academic_history.read'), academicHistoryController.getAcademicHistoryByStudent);

  /**
   * POST /api/v1/admin/students/:studentId/academic-history
   * Create a new academic history record
   * 
   * Permission: academic_history.create
   * Accessible by: Admin, Department Chair, Secretary
   */
  router.post('/:studentId/academic-history', requirePermission('academic_history.create'), academicHistoryController.createAcademicHistory);

  /**
   * GET /api/v1/admin/students/:studentId/gpa
   * Calculate GPA for a student
   * 
   * Permission: academic_history.read
   * Accessible by: Admin, Department Chair, Faculty, Secretary
   */
  router.get('/:studentId/gpa', requirePermission('academic_history.read'), academicHistoryController.calculateGPA);

  return router;
}
