/**
 * Faculty Portal - Attendance Controller
 * HTTP request/response handling for attendance management operations
 * 
 * Handles attendance record viewing and submission for courses assigned to faculty members.
 * All operations validate course ownership to ensure faculty can only manage attendance
 * for their assigned courses.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';
import { FacultyUserContext } from '../utils/facultyScope';
import { submitAttendanceSchema } from '../schemas/attendance.schema';
import { ValidationError } from '../../../shared/errors';
import { z } from 'zod';

/**
 * Validation schema for courseId route parameter
 */
const courseIdParamSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format'),
});

/**
 * Validation schema for date query parameters
 */
const dateQuerySchema = z.object({
  date_from: z.string().date('Invalid date_from format (expected YYYY-MM-DD)').optional(),
  date_to: z.string().date('Invalid date_to format (expected YYYY-MM-DD)').optional(),
});

export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  /**
   * GET /api/faculty/courses/:courseId/attendance
   * Get attendance records for a course with date filtering
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
   * Returns:
   * - 200: Array of attendance records with student names
   * - 400: If invalid date format provided
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If course doesn't exist
   * 
   */
  getAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate courseId parameter
      const paramValidation = courseIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid course ID', paramValidation.error.errors);
      }

      // Validate query parameters
      const queryValidation = dateQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      const { courseId } = paramValidation.data;
      const { date_from, date_to } = queryValidation.data;

      // Retrieve attendance records
      // Service will validate course ownership and throw CourseOwnershipError (403) if not assigned
      const records = await this.attendanceService.getAttendanceRecords(
        courseId,
        facultyId,
        date_from,
        date_to
      );

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/faculty/courses/:courseId/attendance
   * Submit attendance records for a course
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
   * - date (required): Attendance date (YYYY-MM-DD format)
   * - attendance_records (required): Array of attendance records
   *   - student_id (required): UUID of the student
   *   - status (required): One of 'present', 'absent', 'late', 'excused'
   *   - remarks (optional): Additional notes about the attendance
   * 
   * Returns:
   * - 200: Confirmation with number of records saved
   * - 400: If validation fails or invalid student_id/status provided
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If course doesn't exist
   * 
   */
  submitAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate courseId parameter
      const paramValidation = courseIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid course ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = submitAttendanceSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);
      const userId = (authenticatedReq.user as FacultyUserContext).userId;

      const { courseId } = paramValidation.data;
      const { date, attendance_records } = bodyValidation.data;

      // Submit attendance records
      // Service will validate course ownership, student enrollment, and status values
      // Throws CourseOwnershipError (403) if course not assigned
      // Throws InvalidStudentError (400) if invalid student_id
      // Throws InvalidAttendanceStatusError (400) if invalid status
      const result = await this.attendanceService.submitAttendanceRecords(
        courseId,
        facultyId,
        date,
        attendance_records,
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
