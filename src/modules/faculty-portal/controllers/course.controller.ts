/**
 * Faculty Portal - Course Controller
 * HTTP request/response handling for course and teaching load operations
 * 
 * Handles course assignments and teaching load tracking for faculty members.
 * All queries are filtered by the authenticated user's faculty_id to ensure
 * faculty members can only access their own course assignments.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { CourseService } from '../services/course.service';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';
import { FacultyUserContext } from '../utils/facultyScope';
import { z } from 'zod';

/**
 * Validation schema for semester and year query parameters
 */
const courseQuerySchema = z.object({
  semester: z.string().optional(),
  year: z.string().optional(),
});

export class CourseController {
  constructor(private courseService: CourseService) {}

  /**
   * GET /api/faculty/courses
   * Get courses assigned to the authenticated faculty member
   * 
   * Extracts faculty_id from the authenticated user's JWT token and filters
   * courses by that faculty_id. Accepts optional semester and year query parameters.
   * Defaults to current semester and year if not provided.
   * 
   * Query Parameters:
   * - semester (optional): Semester filter ('1st', '2nd', 'summer')
   * - year (optional): Academic year filter (e.g., '2023-2024')
   * 
   * Returns:
   * - 200: Array of courses with enrollment counts
   * - 403: If user is not authenticated as faculty
   * 
   */
  getCourses = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      // Validate and parse query parameters
      const queryValidation = courseQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: queryValidation.error.errors,
          },
        });
      }

      const { semester, year } = queryValidation.data;

      // Retrieve courses for the faculty member
      const courses = await this.courseService.getCoursesByFaculty(
        facultyId,
        semester,
        year
      );

      res.json({
        success: true,
        data: courses,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/faculty/teaching-load
   * Get teaching load summary for the authenticated faculty member
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
   * Returns:
   * - 200: Teaching load summary with total units and courses breakdown
   * - 403: If user is not authenticated as faculty
   * 
   */
  getTeachingLoad = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      // Validate and parse query parameters
      const queryValidation = courseQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: queryValidation.error.errors,
          },
        });
      }

      const { semester, year } = queryValidation.data;

      // Retrieve teaching load for the faculty member
      const teachingLoad = await this.courseService.getTeachingLoad(
        facultyId,
        semester,
        year
      );

      res.json({
        success: true,
        data: teachingLoad,
      });
    } catch (error) {
      next(error);
    }
  };
}
