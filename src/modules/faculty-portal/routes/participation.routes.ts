/**
 * Faculty Portal - Participation Routes
 * Route definitions for student participation management endpoints
 * 
 * Provides endpoints for faculty members to view and submit participation records
 * for their assigned courses. All routes require authentication and RBAC permission checks.
 * Course ownership is validated before allowing participation operations.
 * 
 * Requirements: 10.1, 10.7, 14.1
 */

import { Router } from 'express';
import { ParticipationController } from '../controllers/participation.controller';
import { authMiddleware } from '../../../shared/middleware/auth.middleware';
import { requirePermission } from '../../../rbac/middleware/requirePermission.middleware';

/**
 * Create participation routes
 * 
 * @param participationController - Participation controller instance
 * @returns Express router with participation routes
 */
export function createParticipationRoutes(participationController: ParticipationController): Router {
  const router = Router();

  // All routes require authentication
  router.use(authMiddleware);

  /**
   * GET /api/faculty/courses/:subjectId/participation
   * Get participation records for a course with optional date filtering
   * 
   * Permission: faculty.participation.read
   * 
   * Extracts faculty_id from the authenticated user's JWT token and validates
   * that the course is assigned to the faculty member. Accepts optional date
   * query parameter. If date is provided, filters records for that specific date.
   * Otherwise, returns all records for the subject.
   * 
   * Route Parameters:
   * - subjectId (required): UUID of the course (instruction_id)
   * 
   * Query Parameters:
   * - date (optional): Date for filtering (YYYY-MM-DD format)
   * 
   * Response:
   * - 200: Array of participation records with student names
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
   *       "participation_score": 4,
   *       "remarks": "Active participation in discussion"
   *     }
   *   ]
   * }
   * 
   * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 14.1
   */
  router.get(
    '/courses/:subjectId/participation',
    requirePermission('faculty.participation.read'),
    participationController.getParticipation
  );

  /**
   * POST /api/faculty/courses/:subjectId/participation
   * Submit participation records for a course
   * 
   * Permission: faculty.participation.submit
   * 
   * Extracts faculty_id from the authenticated user's JWT token and validates
   * that the course is assigned to the faculty member. Validates all student_ids
   * belong to enrolled students and participation score values are valid (1-5).
   * Creates or updates participation records and logs the action to the audit log.
   * 
   * Route Parameters:
   * - subjectId (required): UUID of the course (instruction_id)
   * 
   * Request Body:
   * {
   *   "date": "2024-01-15",
   *   "records": [
   *     {
   *       "studentId": "uuid",
   *       "participationScore": 4,
   *       "remarks": "Active participation in discussion"
   *     }
   *   ]
   * }
   * 
   * Response:
   * - 200: Confirmation with number of records saved
   * - 400: Bad Request (validation failed, invalid studentId, or invalid participationScore)
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
   *     "message": "Successfully saved 25 participation record(s) for 2024-01-15"
   *   }
   * }
   * 
   * Requirements: 10.7, 10.8, 10.9, 10.10, 10.11, 10.12, 10.13, 10.14, 10.15, 10.16, 10.17, 14.1
   */
  router.post(
    '/courses/:subjectId/participation',
    requirePermission('faculty.participation.submit'),
    participationController.submitParticipation
  );

  return router;
}
