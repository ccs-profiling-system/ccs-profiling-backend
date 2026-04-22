/**
 * Schedule Controller
 * 
 * HTTP request/response handling for secretary portal schedule operations.
 * Provides CRUD operations for schedules.
 * 
 * Requirements: 5.1-5.5, 5.18-5.21, 15.1, 15.4
 */

import { Request, Response, NextFunction } from 'express';
import {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../services/schedule.service';
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleFilterSchema,
} from '../schemas/schedule.schema';
import { paginationSchema, idParamSchema } from '../schemas/common.schemas';

/**
 * GET /api/secretary/schedules
 * 
 * Retrieve all schedules with pagination and filtering.
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - semester: Filter by semester
 * - academic_year: Filter by academic year
 * - faculty_id: Filter by faculty ID
 * - room: Filter by room
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with paginated schedule list on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if schedule retrieval fails
 * 
 * Requirements: 5.1, 5.14-5.16, 5.18-5.21, 15.1
 */
export async function getAllSchedulesController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate pagination parameters
    const paginationResult = paginationSchema.safeParse(req.query);
    if (!paginationResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paginationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate filter parameters
    const filterResult = scheduleFilterSchema.safeParse(req.query);
    if (!filterResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: filterResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { page, limit } = paginationResult.data;
    const { semester, academic_year, faculty_id, room } = filterResult.data;

    // Get schedules from service
    const result = await getAllSchedules(
      { page, limit },
      { semester, academic_year, faculty_id, room }
    );

    // Return HTTP 200 with paginated data
    res.status(200).json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * GET /api/secretary/schedules/:id
 * 
 * Retrieve a schedule by ID.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with schedule data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when schedule not found with entity type
 * @throws Error if schedule retrieval fails
 * 
 * Requirements: 5.2, 5.18-5.21, 15.4
 */
export async function getScheduleByIdController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Get schedule from service
    const schedule = await getScheduleById(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: {
          message: 'Schedule not found',
          entity_type: 'schedule',
        },
      });
      return;
    }

    // Return HTTP 200 with schedule data
    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * POST /api/secretary/schedules
 * 
 * Create a new schedule.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 201 for successful creation
 * @returns HTTP 400 for validation errors with field-specific messages
 * @throws Error if schedule creation fails
 * 
 * Requirements: 5.3, 5.10-5.13, 5.18-5.21, 15.1
 */
export async function createScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate request body
    const bodyResult = createScheduleSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: bodyResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Create schedule via service
    const schedule = await createSchedule(
      bodyResult.data as {
        instruction_id: string;
        faculty_id: string;
        room: string;
        day: string;
        start_time: string;
        end_time: string;
        semester: string;
        academic_year: string;
      },
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 201 with created schedule
    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * PUT /api/secretary/schedules/:id
 * 
 * Update an existing schedule.
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with updated schedule data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when schedule not found with entity type
 * @throws Error if schedule update fails
 * 
 * Requirements: 5.4, 5.10-5.13, 5.18-5.21, 15.4
 */
export async function updateScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    // Validate request body
    const bodyResult = updateScheduleSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: bodyResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Update schedule via service
    const schedule = await updateSchedule(
      id,
      bodyResult.data,
      userId,
      ipAddress,
      userAgent
    );

    // Return HTTP 200 with updated schedule
    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Schedule not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Schedule not found',
          entity_type: 'schedule',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}

/**
 * DELETE /api/secretary/schedules/:id
 * 
 * Delete a schedule (soft delete).
 * 
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function for error handling
 * 
 * @returns HTTP 200 with deleted schedule data on success
 * @returns HTTP 400 for validation errors with field-specific messages
 * @returns HTTP 404 when schedule not found with entity type
 * @throws Error if schedule deletion fails
 * 
 * Requirements: 5.5, 5.18-5.21, 15.4
 */
export async function deleteScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Validate ID parameter
    const paramResult = idParamSchema.safeParse(req.params);
    if (!paramResult.success) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: paramResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
      });
      return;
    }

    const { id } = paramResult.data;

    // Extract user context for audit logging
    const userId = req.user?.userId;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    // Delete schedule via service
    const schedule = await deleteSchedule(id, userId, ipAddress, userAgent);

    // Return HTTP 200 with deleted schedule
    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    // Handle specific service errors
    if (error instanceof Error && error.message === 'Schedule not found') {
      res.status(404).json({
        success: false,
        error: {
          message: 'Schedule not found',
          entity_type: 'schedule',
        },
      });
      return;
    }

    // Pass error to error handling middleware
    next(error);
  }
}
