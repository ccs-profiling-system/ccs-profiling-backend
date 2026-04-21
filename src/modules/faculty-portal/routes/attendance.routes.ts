/**
 * Faculty Portal - Attendance Routes
 * Route definitions for attendance management endpoints
 * 
 * Provides endpoints for faculty members to view and submit attendance records
 * for their assigned courses. All routes require authentication and RBAC permission checks.
 * Course ownership is validated before allowing attendance operations.
 * 
 * Requirements: 6.1, 6.7, 14.1
 */

import { Router } from 'express';
import { AttendanceController } from '../controllers/attendance.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create attendance routes
 * 
 * @param attendanceController - Attendance controller instance
 * @returns Express router with attendance routes
 */
export function createAttendanceRoutes(attendanceController: AttendanceController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/courses/:courseId/attendance
   * Get attendance records for a course with date filtering
   * 
   * Permission: faculty.attendance.read
   * 
   * Extracts faculty_id from the authenticated user's JWT token and validates
   * that the course is assigned to the faculty member. Accepts optional date_from
   * and date_to query parameters. Defaults to current month if not provided.
   * 
   * Route Parameters:
   * - courseId (required): UUID of the course (instruction_id)
   * 
   * Query Parameters:
   * - date_from (optional): Start date for filtering (YYYY-MM-DD format)
   * - date_to (optional): End date for filtering (YYYY-MM-DD format)
   * 
   * Response:
   * - 200: Array of attendance records with student names
   * - 400: Bad Request (invalid date format)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or course not assigned to faculty)
   * - 404: Not Found (course doesn't exist)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "uuid",
   *       "date": "2024-01-15",
   *       "student_id": "uuid",
   *       "student_name": "John Doe",
   *       "status": "present",
   *       "remarks": null
   *     }
   *   ]
   * }
   * 
   * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 14.1
   */
  router.get(
    '/courses/:courseId/attendance',
    requirePermission('faculty.attendance.read'),
    attendanceController.getAttendance
  );

  /**
   * POST /api/faculty/courses/:courseId/attendance
   * Submit attendance records for a course
   * 
   * Permission: faculty.attendance.submit
   * 
   * Extracts faculty_id from the authenticated user's JWT token and validates
   * that the course is assigned to the faculty member. Validates all student_ids
   * belong to enrolled students and status values are valid. Creates or updates
   * attendance records and logs the action to the audit log.
   * 
   * Route Parameters:
   * - courseId (required): UUID of the course (instruction_id)
   * 
   * Request Body:
   * {
   *   "date": "2024-01-15",
   *   "attendance_records": [
   *     {
   *       "student_id": "uuid",
   *       "status": "present",
   *       "remarks": "Optional notes"
   *     }
   *   ]
   * }
   * 
   * Response:
   * - 200: Confirmation with number of records saved
   * - 400: Bad Request (validation failed, invalid student_id, or invalid status)
   * - 401: Unauthorized (missing or invalid JWT token)
   * - 403: Forbidden (missing permission or course not assigned to faculty)
   * - 404: Not Found (course doesn't exist)
   * 
   * Response Body:
   * {
   *   "success": true,
   *   "data": {
   *     "success": true,
   *     "recordsSaved": 25,
   *     "message": "Successfully saved 25 attendance record(s) for 2024-01-15"
   *   }
   * }
   * 
   * Requirements: 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13, 6.14, 6.15, 6.16, 14.1
   */
  router.post(
    '/courses/:courseId/attendance',
    requirePermission('faculty.attendance.submit'),
    attendanceController.submitAttendance
  );

  return router;
}
