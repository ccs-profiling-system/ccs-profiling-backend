/**
 * Student Routes
 * Route definitions for student endpoints
 * 
 */

import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { auditContextMiddleware } from '../../../shared/middleware/auditContext.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import { checkOwnership } from '../../../rbac/middleware/checkOwnership.middleware';

export function createStudentRoutes(studentController: StudentController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);
  router.use(auditContextMiddleware);

  /**
   * GET /api/v1/admin/students/deleted
   * Get soft-deleted students (admin only)
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/deleted', requirePermission('student.read'), studentController.getDeletedStudents);

  /**
   * GET /api/v1/admin/students/stats
   * Get student statistics
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   */
  router.get('/stats', requirePermission('student.read'), studentController.getStudentStats);

  /**
   * GET /api/v1/admin/students
   * List students with pagination, search, and filters
   */
  router.get('/', requirePermission('student.read'), studentController.listStudents);

  /**
   * GET /api/v1/admin/students/:id/profile
   * Get complete student profile with aggregated data
   * IMPORTANT: This route must come BEFORE /:id to avoid route conflicts
   * Supports both student.read (for faculty/admin) and student.read_own (for students viewing their own profile)
   */
  router.get(
    '/:id/profile',
    requirePermission(['student.read', 'student.read_own']),
    checkOwnership('student'),
    studentController.getStudentProfile
  );

  /**
   * GET /api/v1/admin/students/:id
   * Get student by ID
   * Supports both student.read (for faculty/admin) and student.read_own (for students viewing their own profile)
   */
  router.get(
    '/:id',
    requirePermission(['student.read', 'student.read_own']),
    checkOwnership('student'),
    studentController.getStudent
  );

  /**
   * POST /api/v1/admin/students
   * Create a new student
   */
  router.post('/', requirePermission('student.create'), studentController.createStudent);

  /**
   * PUT /api/v1/admin/students/:id
   * Update student by ID
   */
  router.put('/:id', requirePermission('student.update'), studentController.updateStudent);

  /**
   * PATCH /api/v1/admin/students/:id/restore
   * Restore soft-deleted student
   */
  router.patch('/:id/restore', requirePermission('student.update'), studentController.restoreStudent);

  /**
   * DELETE /api/v1/admin/students/:id/permanent
   * Permanently delete student (hard delete)
   */
  router.delete('/:id/permanent', requirePermission('student.delete'), studentController.permanentDeleteStudent);

  /**
   * DELETE /api/v1/admin/students/:id
   * Soft delete student by ID
   */
  router.delete('/:id', requirePermission('student.delete'), studentController.deleteStudent);

  return router;
}
