/**
 * Student Routes for Department Chair Portal
 * 
 * Defines HTTP routes for student management operations with RBAC protection.
 * All routes require JWT authentication and specific chair.student.* permissions.
 * 
 * Routes:
 * - GET /api/chair/students - List students with pagination and filtering
 * - GET /api/chair/students/:id - Get student details
 * - POST /api/chair/students/:id/approve - Approve a student
 * - POST /api/chair/students/:id/reject - Reject a student
 * 
 * Requirements: 3.1, 3.5, 3.8, 3.12, 9.2, 14.1
 */

import { Router } from 'express';
import { StudentController } from '../controllers/student.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create student routes with dependency injection
 * 
 * @param studentController - Student controller instance
 * @returns Express router with configured routes
 */
export function createStudentRoutes(studentController: StudentController): Router {
  const router = Router();

  // Apply authentication middleware to all routes
  router.use(authMiddleware);

  /**
   * GET /api/chair/students
   * 
   * List students with pagination and filtering
   * 
   * Query Parameters:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 10, max: 100)
   * - status: Filter by student status (optional)
   * - year_level: Filter by year level (optional)
   * - search: Search by name or email (optional)
   * 
   * Permissions: chair.student.read
   * 
   * Responses:
   * - 200: Success with paginated student list
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.student.read permission)
   * - 404: Not Found (user has no department affiliation)
   * - 500: Internal Server Error
   */
  router.get('/', requirePermission('chair.student.read'), studentController.listStudents);

  /**
   * GET /api/chair/students/:id
   * 
   * Get student details by ID
   * 
   * Path Parameters:
   * - id: Student ID
   * 
   * Permissions: chair.student.read
   * 
   * Responses:
   * - 200: Success with student details
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.student.read permission)
   * - 404: Not Found (student not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.get('/:id', requirePermission('chair.student.read'), studentController.getStudent);

  /**
   * POST /api/chair/students/:id/approve
   * 
   * Approve a student
   * 
   * Path Parameters:
   * - id: Student ID
   * 
   * Request Body:
   * - approver_notes: Optional notes from the approver
   * 
   * Permissions: chair.student.approve
   * 
   * Responses:
   * - 200: Success with updated student details
   * - 400: Bad Request (invalid state for approval or validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.student.approve permission)
   * - 404: Not Found (student not found or outside department scope)
   * - 500: Internal Server Error
   */
  router.post('/:id/approve', requirePermission('chair.student.approve'), studentController.approveStudent);

  /**
   * POST /api/chair/students/:id/reject
   * 
   * Reject a student
   * 
   * Path Parameters:
   * - id: Student ID
   * 
   * Request Body:
   * - rejection_reason: Required reason for rejection (10-1000 characters)
   * 
   * Permissions: chair.student.reject
   * 
   * Responses:
   * - 200: Success with updated student details
   * - 400: Bad Request (invalid state for rejection or validation error)
   * - 401: Unauthorized (invalid or missing JWT token)
   * - 403: Forbidden (missing chair.student.reject permission)
   * - 404: Not Found (student not found or outside department scope)
   * - 422: Unprocessable Entity (missing or invalid rejection_reason)
   * - 500: Internal Server Error
   */
  router.post('/:id/reject', requirePermission('chair.student.reject'), studentController.rejectStudent);

  return router;
}
