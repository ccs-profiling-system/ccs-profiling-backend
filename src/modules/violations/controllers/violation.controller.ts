/**
 * Violation Controller
 * HTTP request/response handling for violation operations
 * 
 * Requirements: 6.1, 6.3, 6.4, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { ViolationService } from '../services/violation.service';
import { ValidationError } from '../../../shared/errors';
import {
  createViolationSchema,
  updateViolationSchema,
  violationIdParamSchema,
  studentIdParamSchema,
  violationListQuerySchema,
} from '../schemas/violation.schema';
import { z } from 'zod';

export class ViolationController {
  constructor(private violationService: ViolationService) {}

  /**
   * GET /api/v1/admin/violations
   * List violation records with pagination and filters
   * Requirements: 6.1, 30.2
   */
  listViolations = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = violationListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.violationService.listViolations(filters);

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
   * GET /api/v1/admin/students/:studentId/violations
   * Get violation records by student ID
   * Requirements: 6.3, 30.2
   */
  getViolationsByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { studentId } = validationResult.data;

      const records = await this.violationService.getViolationsByStudent(studentId);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/students/:studentId/violations
   * Create a new violation record
   * Requirements: 6.1, 6.2, 30.2
   */
  createViolation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const paramValidation = studentIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid student ID', paramValidation.error.errors);
      }

      const { studentId } = paramValidation.data;

      // Validate request body
      const bodyValidation = createViolationSchema.safeParse({
        ...req.body,
        student_id: studentId, // Override with param value
      });
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const data = bodyValidation.data;

      const record = await this.violationService.createViolation(data);

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/violations/:id
   * Update violation record by ID
   * Requirements: 6.3, 30.2
   */
  updateViolation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = violationIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid violation ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateViolationSchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const record = await this.violationService.updateViolation(id, data);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/violations/:id
   * Delete violation record by ID
   * Requirements: 6.3, 30.2
   */
  deleteViolation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = violationIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid violation ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.violationService.deleteViolation(id);

      res.json({
        success: true,
        data: {
          message: 'Violation record deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/violations/:id/resolve
   * Resolve a violation record
   * Requirements: 6.4, 30.2
   */
  resolveViolation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = violationIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid violation ID', paramValidation.error.errors);
      }

      const { id } = paramValidation.data;

      // Validate optional resolution notes
      const bodySchema = z.object({
        resolution_notes: z.string().optional(),
      });

      const bodyValidation = bodySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { resolution_notes } = bodyValidation.data;

      const record = await this.violationService.resolveViolation(id, resolution_notes);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };
}
