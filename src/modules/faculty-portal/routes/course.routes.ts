/**
 * Faculty Portal - Course Routes
 * Route definitions for course and teaching load endpoints
 * 
 * Provides endpoints for faculty members to view their assigned courses and
 * teaching load summary. All routes require authentication and RBAC permission checks.
 * All queries are filtered by the authenticated user's faculty_id.
 * 
 * Requirements: 4.1, 4.6, 14.1, 16.2, 16.4
 */

import { Router } from 'express';
import { CourseController } from '../controllers/course.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create course routes
 * 
 * @param courseController - Course controller instance
 * @returns Express router with course routes
 */
export function createCourseRoutes(courseController: CourseController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/courses
   * Get courses assigned to the authenticated faculty member
   * 
   * Permission: faculty.course.read
   * 
   * Extracts faculty_id from the authenticated user's JWT token and filters
   * courses by that faculty_id. Accepts optional semester and year query parameters.
   * Defaults to current semester and year if not provided.
   * 
   * Query Parameters:
   * - semester (optional): Semester filter ('1st', '2nd', 'summer')
   * - year (optional): Academic year filter (e.g., '2023-2024')
   * 
   * Response:
   * - 200: Array of courses with enrollment counts
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or user is not faculty)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "subject_code": "CS101",
   *       "subject_name": "Introduction to Computer Science",
   *       "section": "A",
   *       "schedule": "MWF 10:00-11:00",
   *       "room": "Room 301",
   *       "units": 3,
   *       "enrolled_student_count": 35,
   *       "semester": "1st",
   *       "academic_year": "2023-2024"
   *     }
   *   ]
   * }
   * 
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 14.1, 16.2, 16.4
   */
  router.get(
    '/courses',
    requirePermission('faculty.course.read'),
    courseController.getCourses
  );

  /**
   * GET /api/faculty/teaching-load
   * Get teaching load summary for the authenticated faculty member
   * 
   * Permission: faculty.course.read
   * 
   * Extracts faculty_id from the authenticated user's JWT token and calculates
   * teaching load summary including total units, total courses, and course breakdown.
   * Accepts optional semester and year query parameters.
   * Defaults to current semester and year if not provided.
   * 
   * Query Parameters:
   * - semester (optional): Semester filter ('1st', '2nd', 'summer')
   * - year (optional): Academic year filter (e.g., '2023-2024')
   * 
   * Response:
   * - 200: Teaching load summary with total units and courses breakdown
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or user is not faculty)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": {
   *     "total_units": 12,
   *     "total_courses": 4,
   *     "semester": "1st",
   *     "academic_year": "2023-2024",
   *     "courses": [
   *       {
   *         "subject_code": "CS101",
   *         "subject_name": "Introduction to Computer Science",
   *         "section": "A",
   *         "units": 3
   *       }
   *     ]
   *   }
   * }
   * 
   * Requirements: 4.6, 4.7, 4.8, 4.9, 4.10, 4.11, 14.1, 16.2, 16.4
   */
  router.get(
    '/teaching-load',
    requirePermission('faculty.course.read'),
    courseController.getTeachingLoad
  );

  return router;
}
