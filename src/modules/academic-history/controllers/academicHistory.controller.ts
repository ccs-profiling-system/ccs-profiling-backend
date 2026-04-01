/**
 * Academic History Controller
 * HTTP request/response handling for academic history operations
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 30.2
 */

import { Request, Response, NextFunction } from 'express';
import { AcademicHistoryService } from '../services/academicHistory.service';
import { ValidationError } from '../../../shared/errors';
import {
  createAcademicHistorySchema,
  updateAcademicHistorySchema,
  academicHistoryIdParamSchema,
  studentIdParamSchema,
  academicHistoryListQuerySchema,
} from '../schemas/academicHistory.schema';

export class AcademicHistoryController {
  constructor(private academicHistoryService: AcademicHistoryService) {}

  /**
   * GET /api/v1/admin/academic-history
   * List academic history records with pagination and filters
   * Requirements: 8.1, 30.2
   */
  listAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate query parameters
      const validationResult = academicHistoryListQuerySchema.safeParse(req.query);
      if (!validationResult.success) {
        throw new ValidationError('Validation failed', validationResult.error.errors);
      }

      const filters = validationResult.data;

      const result = await this.academicHistoryService.listAcademicHistory(filters);

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
   * GET /api/v1/admin/students/:studentId/academic-history
   * Get academic history records by student ID
   * Requirements: 8.3, 30.2
   */
  getAcademicHistoryByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { studentId } = validationResult.data;

      const records = await this.academicHistoryService.getAcademicHistoryByStudent(studentId);

      res.json({
        success: true,
        data: records,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/v1/admin/students/:studentId/academic-history
   * Create a new academic history record
   * Requirements: 8.1, 8.2, 30.2
   */
  createAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const paramValidation = studentIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid student ID', paramValidation.error.errors);
      }

      const { studentId } = paramValidation.data;

      // Validate request body
      const bodyValidation = createAcademicHistorySchema.safeParse({
        ...req.body,
        student_id: studentId, // Override with param value
      });
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const data = bodyValidation.data;

      const record = await this.academicHistoryService.createAcademicHistory(data);

      res.status(201).json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PUT /api/v1/admin/academic-history/:id
   * Update academic history record by ID
   * Requirements: 8.1, 30.2
   */
  updateAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const paramValidation = academicHistoryIdParamSchema.safeParse(req.params);
      if (!paramValidation.success) {
        throw new ValidationError('Invalid academic history ID', paramValidation.error.errors);
      }

      // Validate request body
      const bodyValidation = updateAcademicHistorySchema.safeParse(req.body);
      if (!bodyValidation.success) {
        throw new ValidationError('Validation failed', bodyValidation.error.errors);
      }

      const { id } = paramValidation.data;
      const data = bodyValidation.data;

      const record = await this.academicHistoryService.updateAcademicHistory(id, data);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/v1/admin/academic-history/:id
   * Delete academic history record by ID
   * Requirements: 8.1, 30.2
   */
  deleteAcademicHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate ID parameter
      const validationResult = academicHistoryIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid academic history ID', validationResult.error.errors);
      }

      const { id } = validationResult.data;

      await this.academicHistoryService.deleteAcademicHistory(id);

      res.json({
        success: true,
        data: {
          message: 'Academic history record deleted successfully',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/students/:studentId/gpa
   * Calculate GPA for a student
   * Requirements: 8.4, 30.2
   */
  calculateGPA = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate student ID parameter
      const validationResult = studentIdParamSchema.safeParse(req.params);
      if (!validationResult.success) {
        throw new ValidationError('Invalid student ID', validationResult.error.errors);
      }

      const { studentId } = validationResult.data;

      const gpaData = await this.academicHistoryService.calculateGPA(studentId);

      res.json({
        success: true,
        data: gpaData,
      });
    } catch (error) {
      next(error);
    }
  };
}
