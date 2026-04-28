/**
 * Student Portal - Grade Routes
 * Route definitions for grade endpoints
 * 
 * Provides endpoints for students to view grades, grade history, and GPA.
 * All routes require authentication and RBAC permission checks.
 * 
 */

import { Router } from 'express';
import { GradeController } from '../controllers/grade.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create grade routes
 * 
 * @param gradeController - Grade controller instance
 * @returns Express router with grade routes
 */
export function createGradeRoutes(gradeController: GradeController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/student/grades/current
   * Get current semester grades
   * 
   * Permission: student.grade.read
   * 
   * Extracts student_id from JWT token and returns current semester grades with GPA.
   * Includes course code, name, grade value, grade points, units, remarks.
   * Calculates semester GPA as weighted average.
   * 
   * Response:
   * - 200: Current semester grades retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   */
  router.get(
    '/current',
    requirePermission('student.grade.read'),
    gradeController.getCurrentGrades
  );

  /**
   * GET /api/student/grades/history
   * Get complete grade history
   * 
   * Permission: student.grade.read
   * 
   * Extracts student_id from JWT token and returns grade history grouped by semester.
   * Groups by academic year and semester, calculates GPA for each semester.
   * Orders semesters by academic year and semester descending.
   * 
   * Response:
   * - 200: Grade history retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   */
  router.get(
    '/history',
    requirePermission('student.grade.read'),
    gradeController.getGradeHistory
  );

  /**
   * GET /api/student/grades/gpa
   * Get GPA calculation
   * 
   * Permission: student.grade.read
   * 
   * Extracts student_id from JWT token and returns cumulative and current semester GPA.
   * Calculates cumulative GPA from all completed courses.
   * Calculates current semester GPA from current semester courses only.
   * Includes total units attempted and total units earned.
   * 
   * Response:
   * - 200: GPA calculation retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   */
  router.get(
    '/gpa',
    requirePermission('student.grade.read'),
    gradeController.getGPA
  );

  /**
   * GET /api/student/grades/:gradeId
   * Get specific grade details
   * 
   * Permission: student.grade.read
   * 
   * Extracts student_id from JWT token and returns grade details.
   * Validates grade belongs to student before returning details.
   * Returns 403 if grade belongs to another student.
   * Returns 404 if grade not found.
   * 
   * Response:
   * - 200: Grade details retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission, not a student, or grade belongs to another student)
   * - 404: Not Found (grade not found)
   * 
   */
  router.get(
    '/:gradeId',
    requirePermission('student.grade.read'),
    gradeController.getGradeDetails
  );

  return router;
}
