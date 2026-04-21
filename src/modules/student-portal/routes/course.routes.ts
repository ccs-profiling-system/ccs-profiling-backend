/**
 * Student Portal - Course Routes
 * Route definitions for course endpoints
 * 
 * Provides endpoints for students to view enrolled courses, course details,
 * and weekly schedule. All routes require authentication and RBAC permission checks.
 * 
 * Requirements: 6.6, 7.4, 8.6, 27.1, 27.2, 27.3, 27.4, 27.5
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
   * GET /api/student/courses/enrolled
   * Get enrolled courses for current semester
   * 
   * Permission: student.course.read
   * 
   * Extracts student_id from JWT token and returns enrolled courses.
   * Includes course code, name, section, instructor, schedule, room, units, status.
   * 
   * Response:
   * - 200: Enrolled courses retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/enrolled',
    requirePermission('student.course.read'),
    courseController.getEnrolledCourses
  );

  /**
   * GET /api/student/courses/schedule
   * Get weekly schedule for student
   * 
   * Permission: student.course.read
   * 
   * Extracts student_id from JWT token and returns weekly schedule.
   * Groups schedule entries by day of week, ordered by start time.
   * 
   * Response:
   * - 200: Weekly schedule retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or not a student)
   * 
   * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/schedule',
    requirePermission('student.course.read'),
    courseController.getWeeklySchedule
  );

  /**
   * GET /api/student/courses/:courseId
   * Get course details for a specific course
   * 
   * Permission: student.course.read
   * 
   * Extracts student_id from JWT token and returns course details.
   * Validates student is enrolled in the course before returning details.
   * Returns 403 if student not enrolled.
   * 
   * Response:
   * - 200: Course details retrieved successfully
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission, not a student, or not enrolled in course)
   * - 404: Not Found (course not found)
   * 
   * Requirements: 7.1, 7.2, 7.3, 7.4, 27.1, 27.2, 27.3, 27.4, 27.5
   */
  router.get(
    '/:courseId',
    requirePermission('student.course.read'),
    courseController.getCourseDetails
  );

  return router;
}
