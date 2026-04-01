/**
 * Enrollment Controller
 * HTTP request/response handling for enrollment operations
 * 
 * Requirements: 9.1, 9.3, 9.4, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { EnrollmentService } from '../services/enrollment.service';
import { ValidationError } from '../../../shared/errors';
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  enrollmentIdParamSchema,
  studentIdParamSchema,
  instructionIdParamSchema,
  enrollmentListQuerySchema,
} from '../schemas/enrollment.schema';

export class EnrollmentController {
  constructor(private enrollmentService: EnrollmentService) {}

  /**
   * GET /api/v1/admin/enrollments
   * List enrollments with pagination and filters
   * Requirements: 9.1, 30.2
   */
  listEnrollments = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = enrollmentListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.enrollmentService.listEnrollments(filters);

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
   * GET /api/v1/admin/students/:studentId/enrollments
   * Get enrollments by student ID
   * Requirements: 9.3, 30.2
   */
  getEnrollmentsByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { studentId } = validationResult.data;

      const enrollments = await this.enrollmentService.getEnrollmentsByStudent(studentId);

      res.json({
        success: true,
        data: enrollments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/instructions/:instructionId/enrollments
   * Get enrollments by instruction ID
   * Requirements: 9.4, 30.2
   */
  getEnrollmentsByInstruction = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate instruction ID parameter
      const validationResult = instructionIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid instruction ID', validationResult.error.errors);
      }

      const { instructionId } = validationResult.data;

      const enrollments = await this.enrollmentService.getEnrollmentsByInstruction(instructionId);

      res.json({
        success: true,
        data: enrollments,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/enrollments
   * Create a new enrollment
   * Requirements: 9.1, 30.2
   */
  createEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validationResult = createEnrollmentSchema.safeParse(req.body);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const data = validationResult.data;

      const enrollment = await this.enrollmentService.createEnrollment(data);

      res.status(201).json({
        success: true,
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/enrollments/:id
   * Update enrollment by ID
   * Requirements: 9.1, 30.2
   */
  updateEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = enrollmentIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid enrollment ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateEnrollmentSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const enrollment = await this.enrollmentService.updateEnrollment(id, data);

      res.json({
        success: true,
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/enrollments/:id
   * Delete enrollment by ID
   * Requirements: 9.1, 30.2
   */
  deleteEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = enrollmentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid enrollment ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.enrollmentService.deleteEnrollment(id);

      res.json({
        success: true,
        data: {
          message: 'Enrollment deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
