/**
 * Faculty Portal - Roster Controller
 * HTTP request/response handling for class roster operations
 * 
 * Handles student roster viewing for courses assigned to faculty members.
 * Validates course ownership before returning roster data.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6
 */

import { Request, Response, NextFunction } from 'express';
import { RosterService } from '../services/roster.service';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';
import { FacultyUserContext } from '../utils/facultyScope';
import { z } from 'zod';

/**
 * Validation schema for courseId route parameter
 */
const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
});

export class RosterController {
  constructor(private rosterService: RosterService) {}

  /**
   * GET /api/faculty/courses/:courseId/roster
   * Get student roster for a course
   * 
   * Retrieves the list of students enrolled in a specific course.
   * Validates that the course is assigned to the authenticated faculty member.
   * 
   * Route Parameters:
   * - courseId: UUID of the course (instruction_id)
   * 
   * Returns:
   * - 200: Array of students enrolled in the course, ordered by last name then first name
   * - 400: If courseId is invalid format
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If course doesn't exist
   * 
   * Requirements:
   * - 5.1: Endpoint protected by faculty.roster.read permission
   * - 5.2: Validate courseId is assigned to authenticated faculty
   * - 5.3: Return HTTP 403 if course not assigned to faculty
   * - 5.6: Return HTTP 404 if course doesn't exist
   */
  getCourseRoster = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate courseId parameter
      const paramValidation = courseIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid course ID',
            code: 'VALIDATION_ERROR',
            details: paramValidation.error.errors,
          },
        });
      }

      const { courseId } = paramValidation.data;

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      // Retrieve roster for the course
      // The service will validate course ownership and throw appropriate errors:
      // - CourseNotFoundError (404) if course doesn't exist
      // - CourseOwnershipError (403) if course is not assigned to faculty
      const roster = await this.rosterService.getRosterByCourse(courseId, facultyId);

      res.json({
        success: true,
        data: roster,
      });
      return;
    } catch (error) {
      next(error);
      return;
    }
  };
}
