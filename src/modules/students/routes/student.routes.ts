/**
 * Student Routes
 * Route definitions for student endpoints
 * 
 */

import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';
import { auditContextMiddleware } from '../../../shared/middleware/auditContext.middleware';

export function createStudentRoutes(studentController: StudentController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);
  router.use(auditContextMiddleware);

  /**
   * GET /api/v1/admin/students/deleted
   * Get soft-deleted students (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/deleted', studentController.getDeletedStudents);

  /**
   * GET /api/v1/admin/students/stats
   * Get student statistics
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/stats', studentController.getStudentStats);

  /**
   * GET /api/v1/admin/students
   * List students with pagination, search, and filters
   */
  router.get('/', studentController.listStudents);

  /**
   * GET /api/v1/admin/students/:id/profile
   * Get complete student profile with aggregated data
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/:id/profile', studentController.getStudentProfile);

  /**
   * GET /api/v1/admin/students/:id
   * Get student by ID
   */
  router.get('/:id', studentController.getStudent);

  /**
   * POST /api/v1/admin/students
   * Create a new student
   */
  router.post('/', studentController.createStudent);

  /**
   * PUT /api/v1/admin/students/:id
   * Update student by ID
   */
  router.put('/:id', studentController.updateStudent);

  /**
   * PATCH /api/v1/admin/students/:id/restore
   * Restore soft-deleted student
   */
  router.patch('/:id/restore', studentController.restoreStudent);

  /**
   * DELETE /api/v1/admin/students/:id/permanent
   * Permanently delete student (hard delete)
   */
  router.delete('/:id/permanent', studentController.permanentDeleteStudent);

  /**
   * DELETE /api/v1/admin/students/:id
   * Soft delete student by ID
   */
  router.delete('/:id', studentController.deleteStudent);

  return router;
}
