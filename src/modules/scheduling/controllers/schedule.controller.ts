/**
 * Schedule Controller
 * HTTP request/response handling for schedule operations
 * 
 */

import { Request, Response, NextFunction } from 'express';
import { ScheduleService } from '../services/schedule.service';
import { ValidationError } from '../../../shared/errors';
import {
  createScheduleSchema,
  updateScheduleSchema,
  scheduleIdParamSchema,
  roomParamSchema,
  facultyIdParamSchema,
  conflictCheckSchema,
  scheduleListQuerySchema,
} from '../schemas/schedule.schema';

export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}

  /**
   * GET /api/v1/admin/schedules
   * List schedules with pagination and filters
   */
  listSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = scheduleListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.scheduleService.listSchedules(filters);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/schedules/:id
   * Get schedule by ID
   */
  getSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = scheduleIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid schedule ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const schedule = await this.scheduleService.getSchedule(id);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/schedules
   * Create a new schedule
   */
  createSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createScheduleSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const data = validationResult.data;

      const schedule = await this.scheduleService.createSchedule(data);

      res.status(201).json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/schedules/:id
   * Update schedule by ID
   */
  updateSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = scheduleIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid schedule ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateScheduleSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const schedule = await this.scheduleService.updateSchedule(id, data);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/schedules/:id
   * Delete schedule by ID
   */
  deleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = scheduleIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid schedule ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.scheduleService.deleteSchedule(id);

      res.json({
        success: true,
        data: {
          message: 'Schedule deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/schedules/room/:room
   * Get schedules by room
   */
  getSchedulesByRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate room parameter
      const validationResult = roomParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid room parameter', validationResult.error.errors);
      }

      const { room } = validationResult.data;

      const schedules = await this.scheduleService.getSchedulesByRoom(room);

      res.json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/schedules/faculty/:facultyId
   * Get schedules by faculty ID
   */
  getSchedulesByFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate faculty ID parameter
      const validationResult = facultyIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid faculty ID', validationResult.error.errors);
      }

      const { facultyId } = validationResult.data;

      const schedules = await this.scheduleService.getSchedulesByFaculty(facultyId);

      res.json({
        success: true,
        data: schedules,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/schedules/check-conflict
   * Check for schedule conflicts
   */
  checkConflict = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = conflictCheckSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const params = validationResult.data;

      const conflicts = await this.scheduleService.checkConflicts(params);

      res.json({
        success: true,
        data: {
          has_conflict: conflicts.length > 0,
          conflicts: conflicts,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/schedules/deleted
   * Get soft-deleted schedules (admin only)
   */
  getDeletedSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = scheduleListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.scheduleService.getDeletedSchedules(filters);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/schedules/:id/restore
   * Restore soft-deleted schedule
   */
  restoreSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = scheduleIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid schedule ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const schedule = await this.scheduleService.restoreSchedule(id);

      res.json({
        success: true,
        data: schedule,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/schedules/:id/permanent
   * Permanently delete schedule (hard delete)
   */
  permanentDeleteSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = scheduleIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid schedule ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.scheduleService.permanentDeleteSchedule(id);

      res.json({
        success: true,
        data: {
          message: 'Schedule permanently deleted',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
