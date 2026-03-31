/**
 * Faculty Controller
 * HTTP request/response handling for faculty operations
 * 
 * Requirements: 3.1, 3.4, 3.5, 4.7, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { FacultyService } from '../services/faculty.service';
import { ValidationError } from '../../../shared/errors';
import {
  createFacultySchema,
  updateFacultySchema,
  facultyIdParamSchema,
  facultyListQuerySchema,
} from '../schemas/faculty.schema';

export class FacultyController {
  constructor(private facultyService: FacultyService) {}

  /**
   * GET /api/v1/admin/faculty
   * List faculty with pagination, search, and filters
   * Requirements: 3.4, 30.2
   */
  listFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = facultyListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.facultyService.listFaculty(filters);

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
   * GET /api/v1/admin/faculty/:id
   * Get faculty by ID
   * Requirements: 3.4, 30.2
   */
  getFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = facultyIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid faculty ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      const faculty = await this.facultyService.getFaculty(id);

      res.json({
        success: true,
        data: faculty,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/faculty
   * Create a new faculty
   * Requirements: 3.1, 4.7, 30.2
   */
  createFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createFacultySchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const data = validationResult.data;

      const faculty = await this.facultyService.createFaculty(data);

      res.status(201).json({
        success: true,
        data: faculty,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/faculty/:id
   * Update faculty by ID
   * Requirements: 3.4, 4.7, 30.2
   */
  updateFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = facultyIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid faculty ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateFacultySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const faculty = await this.facultyService.updateFaculty(id, data);

      res.json({
        success: true,
        data: faculty,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/faculty/:id
   * Soft delete faculty by ID
   * Requirements: 3.5, 4.7, 30.2
   */
  deleteFaculty = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = facultyIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid faculty ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.facultyService.deleteFaculty(id);

      res.json({
        success: true,
        data: {
          message: 'Faculty deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
