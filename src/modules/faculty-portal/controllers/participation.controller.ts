/**
 * Faculty Portal - Participation Controller
 * HTTP request/response handling for student participation management operations
 * 
 * Handles participation record viewing and submission for courses assigned to faculty members.
 * All operations validate course ownership to ensure faculty can only manage participation
 * for their assigned courses.
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { ParticipationService } from '../services/participation.service';
import { extractFacultyId } from '../utils/facultyScope';
import { AuthenticatedRequest } from '../../../rbac/utils/middleware-composer';
import { FacultyUserContext } from '../utils/facultyScope';
import { submitParticipationSchema, getParticipationSchema } from '../schemas/participation.schema';
import { ValidationError } from '../../../shared/errors';
import { z } from 'zod';

/**
 * Validation schema for subjectId route parameter
 */
const subjectIdParamSchema = z.object({
  subjectId: z.string().uuid('Invalid subject ID format'),
});

export class ParticipationController {
  constructor(private participationService: ParticipationService) {}

  /**
   * GET /api/faculty/courses/:subjectId/participation
   * Get participation records for a course with optional date filtering
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
   * Returns:
   * - 200: Array of participation records with student names
   * - 400: If invalid date format provided
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If course doesn't exist
   * 
   */
  getParticipation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate subjectId parameter
      const paramValidation = subjectIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid subject ID', paramValidation.error.errors);
      }

      // Validate query parameters
      const queryValidation = getParticipationSchema.safeParse(req.query);
      if (!queryValidation.success) {
        throw new ValidationError('Invalid query parameters', queryValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);

      const { subjectId } = paramValidation.data;
      const { date } = queryValidation.data;

      // Retrieve participation records
      // Service will validate course ownership and throw CourseOwnershipError (403) if not assigned
      const records = await this.participationService.getParticipationRecords(
        subjectId,
        facultyId,
        date
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
   * POST /api/faculty/courses/:subjectId/participation
   * Submit participation records for a course
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
   * - date (required): Participation date (YYYY-MM-DD format)
   * - records (required): Array of participation records
   *   - studentId (required): UUID of the student
   *   - participationScore (required): Integer between 1 and 5 (inclusive)
   *   - remarks (optional): Additional notes about the participation
   * 
   * Returns:
   * - 200: Confirmation with number of records saved
   * - 400: If validation fails or invalid studentId/participationScore provided
   * - 403: If course is not assigned to the authenticated faculty member
   * - 404: If course doesn't exist
   * 
   */
  submitParticipation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate subjectId parameter
      const paramValidation = subjectIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid subject ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = submitParticipationSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      // Extract faculty_id from authenticated user
      const authenticatedReq = req as AuthenticatedRequest;
      const facultyId = extractFacultyId(authenticatedReq.user as FacultyUserContext);
      const userId = (authenticatedReq.user as FacultyUserContext).userId;

      const { subjectId } = paramValidation.data;
      const { date, records } = bodyValidation.data;

      // Map validated records to service input format
      const participationRecords = records.map(record => ({
        studentId: record.studentId,
        participationScore: record.participationScore,
        remarks: record.remarks,
      }));

      // Submit participation records
      // Service will validate course ownership, student enrollment, and participation scores
      // Throws CourseOwnershipError (403) if course not assigned
      // Throws InvalidStudentError (400) if invalid studentId
      // Throws InvalidParticipationScoreError (400) if invalid score
      const result = await this.participationService.submitParticipationRecords(
        subjectId,
        facultyId,
        date,
        participationRecords,
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
