/**
 * Student Routes
 * 
 * Defines routes for secretary portal student operations.
 * All routes require authentication and appropriate permissions.
 * 
 * Requirements: 3.1-3.10
 */

import { Router } from 'express';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';
import {
  getAllStudentsController,
  getStudentByIdController,
  createStudentController,
  updateStudentController,
  deleteStudentController,
  getAcademicHistoryController,
} from '../controllers/student.controller';

/**
 * Create student router
 * 
 * Endpoints:
 * - GET /api/secretary/students - Get all students with pagination and filtering
 * - GET /api/secretary/students/:id - Get student by ID
 * - POST /api/secretary/students - Create a new student
 * - PUT /api/secretary/students/:id - Update an existing student
 * - DELETE /api/secretary/students/:id - Delete a student (soft delete)
 * - GET /api/secretary/students/:id/academic-history - Get academic history for a student
 * 
 * All endpoints require:
 * - Valid JWT authentication (handled by parent router)
 * - Appropriate permission for the operation
 */
export function createStudentRoutes(): Router {
  const router = Router();

  /**
   * GET /api/secretary/students
   * 
   * Retrieve all students with pagination and filtering.
   * 
   * Requirements: 3.1, 3.7
   */
  router.get(
    '/',
    requirePermission('secretary.student.read'),
    getAllStudentsController
  );

  /**
   * GET /api/secretary/students/:id
   * 
   * Retrieve a student by ID.
   * 
   * Requirements: 3.2, 3.7
   */
  router.get(
    '/:id',
    requirePermission('secretary.student.read'),
    getStudentByIdController
  );

  /**
   * POST /api/secretary/students
   * 
   * Create a new student.
   * 
   * Requirements: 3.3, 3.8
   */
  router.post(
    '/',
    requirePermission('secretary.student.create'),
    createStudentController
  );

  /**
   * PUT /api/secretary/students/:id
   * 
   * Update an existing student.
   * 
   * Requirements: 3.4, 3.9
   */
  router.put(
    '/:id',
    requirePermission('secretary.student.update'),
    updateStudentController
  );

  /**
   * DELETE /api/secretary/students/:id
   * 
   * Delete a student (soft delete).
   * 
   * Requirements: 3.5, 3.10
   */
  router.delete(
    '/:id',
    requirePermission('secretary.student.delete'),
    deleteStudentController
  );

  /**
   * GET /api/secretary/students/:id/academic-history
   * 
   * Retrieve academic history for a student.
   * 
   * Requirements: 3.6, 3.7
   */
  router.get(
    '/:id/academic-history',
    requirePermission('secretary.student.read'),
    getAcademicHistoryController
  );

  return router;
}

// Default export for backward compatibility
export default createStudentRoutes();
