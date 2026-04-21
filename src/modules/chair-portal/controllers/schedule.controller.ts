/**
 * Schedule Controller
 * 
 * HTTP request/response handling for schedule management in the department chair portal.
 * Handles filtering, creation with conflict detection, approval workflows, and department-scoped access.
 * 
 * Requirements: 5.1, 5.4, 5.9, 5.11, 9.1, 9.4
 */

import { Request, Response, NextFunction } from 'express';
import { ScheduleService, ConflictDetails } from '../services/schedule.service';
import { extractDepartmentFromRequest } from '../utils/departmentScope';
import { NotFoundError, ValidationError } from '../../../shared/errors';
import { createScheduleSchema, scheduleFilterSchema, conflictCheckSchema } from '../schemas/schedule.schemas';

/**
 * Custom error for schedule conflicts
 */
export class ConflictError extends Error {
  constructor(
    message: string,
    public conflicts: ConflictDetails[]
  ) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  /**
   * GET /api/chair/schedules
   * 
   * List schedules with filtering.
   * 
   * Query Parameters:
   * - semester: Filter by semester (1st, 2nd, summer) (optional)
   * - year: Filter by academic year (optional)
   * - faculty_id: Filter by faculty member (optional)
   * - subject_code: Filter by subject code (optional)
   * 
   * @param req - Express request with query parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with schedule list
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 5.1, 5.2, 5.3
   */
  listSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Validate and parse query parameters
      const validationResult = scheduleFilterSchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const filters = validationResult.data;

      // Get schedules from service
      const schedules = await this.scheduleService.listSchedules(departmentInfo.departmentId, filters);

      res.json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chair/schedules
   * 
   * Create a new schedule with conflict detection.
   * 
   * Request Body:
   * - subject_code: Subject code (required)
   * - faculty_id: Faculty member ID (required)
   * - semester: Semester (1st, 2nd, summer) (required)
   * - year: Academic year (required)
   * - day: Day of week (required)
   * - time_start: Start time in HH:MM format (required)
   * - time_end: End time in HH:MM format (required)
   * - room: Room number/name (required)
   * 
   * @param req - Express request with schedule data
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 201 with created schedule
   * @returns HTTP 422 if conflicts detected
   * @throws NotFoundError if user has no department affiliation
   * @throws ValidationError if request body is invalid
   * 
   * Requirements: 5.4, 5.5, 5.6, 5.7, 5.8
   */
  createSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Validate request body
      const validationResult = createScheduleSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Invalid request body', validationResult.error.errors);
      }

      const scheduleData = validationResult.data;

      // Create schedule with conflict detection
      try {
        const result = await this.scheduleService.createSchedule(
          scheduleData,
          departmentInfo.departmentId
        );

        res.status(201).json({
          success: true,
          data: result.schedule,
          message: 'Schedule created successfully',
        });
      } catch (error) {
        // Check if error is a conflict error
        if (error instanceof Error && error.message === 'Schedule conflicts detected') {
          // Get conflicts for detailed response
          const conflicts = await this.scheduleService.checkConflicts(
            {
              faculty_id: scheduleData.faculty_id,
              room: scheduleData.room,
              day: scheduleData.day,
              time_start: scheduleData.time_start,
              time_end: scheduleData.time_end,
              semester: scheduleData.semester,
              year: scheduleData.year,
            },
            departmentInfo.departmentId
          );

          return res.status(422).json({
            success: false,
            error: 'Schedule conflicts detected',
            conflicts: conflicts.map((c) => ({
              type: c.type,
              message: c.message,
              conflicting_schedule: {
                id: c.schedule.id,
                subject_code: c.schedule.subject_code,
                subject_name: c.schedule.subject_name,
                faculty_name: c.schedule.faculty_name,
                room: c.schedule.room,
                day: c.schedule.day,
                start_time: c.schedule.start_time,
                end_time: c.schedule.end_time,
                semester: c.schedule.semester,
                academic_year: c.schedule.academic_year,
              },
            })),
          });
        }
        throw error;
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/chair/schedules/:id/approve
   * 
   * Approve a schedule.
   * 
   * Note: The current schema doesn't have a status field, so this endpoint
   * is a placeholder for future workflow integration.
   * 
   * @param req - Express request with schedule ID
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with schedule details
   * @returns HTTP 404 if schedule not found or outside department scope
   * @throws NotFoundError if user has no department affiliation
   * 
   * Requirements: 5.9, 5.10
   */
  approveSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Get schedule ID from route parameter
      const scheduleId = req.params.id;

      // Get authenticated user ID
      const userId = req.user?.userId;
      if (!userId) {
        throw new ValidationError('User ID not found in request');
      }

      // Approve schedule
      const schedule = await this.scheduleService.approveSchedule(
        scheduleId,
        departmentInfo.departmentId,
        userId
      );

      if (!schedule) {
        throw new NotFoundError('Schedule not found');
      }

      res.json({
        success: true,
        data: schedule,
        message: 'Schedule approved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/chair/schedules/conflicts
   * 
   * Check for schedule conflicts.
   * 
   * Query Parameters:
   * - faculty_id: Faculty member ID (required)
   * - room: Room number/name (required)
   * - day: Day of week (required)
   * - time_start: Start time in HH:MM format (required)
   * - time_end: End time in HH:MM format (required)
   * 
   * @param req - Express request with conflict check parameters
   * @param res - Express response
   * @param next - Express next function for error handling
   * 
   * @returns HTTP 200 with conflict details (empty array if no conflicts)
   * @throws NotFoundError if user has no department affiliation
   * @throws ValidationError if query parameters are invalid
   * 
   * Requirements: 5.11, 5.12, 5.13
   */
  checkConflicts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract department ID from authenticated user
      const departmentInfo = await extractDepartmentFromRequest(req);

      // Validate query parameters
      const validationResult = conflictCheckSchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Invalid query parameters', validationResult.error.errors);
      }

      const params = validationResult.data;

      // Check for conflicts
      const conflicts = await this.scheduleService.checkConflicts(
        params,
        departmentInfo.departmentId
      );

      res.json({
        success: true,
        has_conflicts: conflicts.length > 0,
        conflicts: conflicts.map((c) => ({
          type: c.type,
          message: c.message,
          conflicting_schedule: {
            id: c.schedule.id,
            subject_code: c.schedule.subject_code,
            subject_name: c.schedule.subject_name,
            faculty_name: c.schedule.faculty_name,
            room: c.schedule.room,
            day: c.schedule.day,
            start_time: c.schedule.start_time,
            end_time: c.schedule.end_time,
            semester: c.schedule.semester,
            academic_year: c.schedule.academic_year,
          },
        })),
      });
    } catch (error) {
      next(error);
    }
  };
}
