/**
 * Student Routes
 * Route definitions for student endpoints
 * 
 * Requirements: 2.1, 2.5, 2.6, 2.7, 4.7, 4.8, 30.2
 */

import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { adminOnly } from '../../../shared/middleware/role.middleware';

export function createStudentRoutes(studentController: StudentController): Router {
  const router = Router();

  // All routes require authentication and admin role
  router.use(authMiddleware);
  router.use(adminOnly);

  /**
   * GET /api/v1/admin/students
   * List students with pagination, search, and filters
   */
  router.get('/', studentController.listStudents);

  /**
   * GET /api/v1/admin/students/:id
   * Get student by ID
   */
  router.get('/:id', studentController.getStudent);

  /**
   * GET /api/v1/admin/students/:id/profile
   * Get complete student profile with aggregated data
   */
  router.get('/:id/profile', studentController.getStudentProfile);

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
   * DELETE /api/v1/admin/students/:id
   * Soft delete student by ID
   */
  router.delete('/:id', studentController.deleteStudent);

  return router;
}
