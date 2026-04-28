/**
 * Faculty Portal - Roster Routes
 * Route definitions for class roster endpoints
 * 
 * Provides endpoints for faculty members to view student rosters for their
 * assigned courses. All routes require authentication and RBAC permission checks.
 * Course ownership is validated before returning roster data.
 * 
 */

import { Router } from 'express';
import { RosterController } from '../controllers/roster.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create roster routes
 * 
 * @param rosterController - Roster controller instance
 * @returns Express router with roster routes
 */
export function createRosterRoutes(rosterController: RosterController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/courses/:courseId/roster
   * Get student roster for a course
   * 
   * Permission: faculty.roster.read
   * 
   * Retrieves the list of students enrolled in a specific course.
   * Validates that the course is assigned to the authenticated faculty member.
   * Returns students ordered by last name then first name.
   * 
   * Route Parameters:
   * - courseId: UUID of the course (instruction_id)
   * 
   * Response:
   * - 200: Array of students enrolled in the course
   * - 400: Bad Request (invalid course ID format)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or course not assigned to faculty)
   * - 404: Not Found (course doesn't exist)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "student_id": "uuid",
   *       "student_number": "2021-12345",
   *       "first_name": "John",
   *       "last_name": "Doe",
   *       "email": "john.doe@example.com",
   *       "year_level": 2,
   *       "enrollment_status": "enrolled"
   *     }
   *   ]
   * }
   * 
   * - 5.1: Endpoint protected by faculty.roster.read permission
   * - 5.2: Validate courseId is assigned to authenticated faculty
   * - 5.3: Return HTTP 403 if course not assigned to faculty
   * - 5.4: Return student details including student_id, student_number, first_name, last_name, email, year_level, enrollment_status
   * - 5.5: Order students by last_name then first_name
   * - 5.6: Return HTTP 404 if course doesn't exist
   * - 5.7: Return empty array if no enrolled students
   * - 14.1: Use RBAC permission system with faculty.roster.read permission
   */
  router.get(
    '/courses/:courseId/roster',
    requirePermission('faculty.roster.read'),
    rosterController.getCourseRoster
  );

  return router;
}
